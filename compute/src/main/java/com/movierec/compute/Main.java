package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.io.CsvRatingsSource;
import com.movierec.compute.io.CsvRecommendationSink;
import com.movierec.compute.io.RecommendationSink;
import com.movierec.compute.model.Recommendation;
import com.movierec.compute.recommend.Recommender;
import com.movierec.compute.similarity.PearsonSimilarity;
import com.movierec.compute.recommend.PopularMovies;
import java.nio.file.Path;
import java.util.List;

/**
 * Usage: Main <ratings.csv> [recommendations-out.csv]
 * Runs the full pipeline for every user with enough ratings.
 */
public final class Main {

    static final int MIN_OVERLAP = 5;
    static final int POPULAR_PRIOR_WEIGHT = 10;
    public static void main(String[] args) throws Exception {
        if (args.length < 1) {
            System.err.println("Usage: Main <ratings.csv> [out.csv]");
            System.exit(1);
        }
        Path in = Path.of(args[0]);
        Path out = Path.of(args.length > 1 ? args[1] : "recommendations.csv");

        long t0 = System.nanoTime();
        CsvRatingsSource source = new CsvRatingsSource(in);
        BipartiteGraph graph = BipartiteGraph.build(source.load());
        long tGraph = System.nanoTime();
        System.out.printf("Graph: %d users, %d movies, %d edges (skipped %d bad rows) in %d ms%n",
                graph.userCount(), graph.movieCount(), graph.edgeCount(),
                source.skippedLines(), (tGraph - t0) / 1_000_000);

        Recommender rec = new Recommender(graph, new PearsonSimilarity(MIN_OVERLAP), Recommender.Config.defaults());

        int withRecs = 0, cold = 0;
        try (RecommendationSink sink = new CsvRecommendationSink(out)) {
               // Cold-start list, stored under a reserved id; the API serves it to users with < 3 ratings.
            sink.write("GLOBAL", PopularMovies.top(graph, Recommender.Config.defaults().n(), POPULAR_PRIOR_WEIGHT));
            for (int u = 0; u < graph.userCount(); u++) {
                List<Recommendation> recs = rec.recommend(u);
                if (recs.isEmpty()) { cold++; continue; }
                sink.write(graph.userId(u), recs);
                withRecs++;
            }
        }
        System.out.printf("Recommendations: %d users with results, %d without (cold start / no neighbors)%n", withRecs, cold);
        System.out.printf("Total time: %d ms -> %s%n", (System.nanoTime() - t0) / 1_000_000, out);
    }
}

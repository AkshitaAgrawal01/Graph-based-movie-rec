package com.movierec.compute;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.io.MongoRatingsSource;
import com.movierec.compute.io.MongoRecommendationSink;
import com.movierec.compute.io.RecommendationSink;
import com.movierec.compute.model.Recommendation;
import com.movierec.compute.recommend.Recommender;
import com.movierec.compute.recommend.PopularMovies;
import com.movierec.compute.similarity.PearsonSimilarity;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;

import java.util.List;

/**
 * Same pipeline as Main, but reads ratings from and writes
 * recommendations to MongoDB Atlas instead of CSV files.
 */
public final class MongoMain {

    static final int MIN_OVERLAP = 5;
    static final int POPULAR_PRIOR_WEIGHT = 10;

    public static void main(String[] args) throws Exception {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String uri = dotenv.get("MONGO_URI");
        if (uri == null || uri.isBlank()) {
            System.err.println("MONGO_URI not found. Is .env in the compute/ folder?");
            System.exit(1);
        }

        try (MongoClient client = MongoClients.create(uri)) {
            MongoDatabase db = client.getDatabase("graphrec");

            long t0 = System.nanoTime();
            MongoRatingsSource source = new MongoRatingsSource(db.getCollection("ratings"));
            BipartiteGraph graph = BipartiteGraph.build(source.load());
            long tGraph = System.nanoTime();
            System.out.printf("Graph: %d users, %d movies, %d edges, loaded in %d ms%n",
                    graph.userCount(), graph.movieCount(), graph.edgeCount(),
                    (tGraph - t0) / 1_000_000);

            Recommender rec = new Recommender(graph, new PearsonSimilarity(MIN_OVERLAP, 10), Recommender.Config.defaults());

            int withRecs = 0, cold = 0;
            try (RecommendationSink sink = new MongoRecommendationSink(db.getCollection("recommendations"))) {
                sink.write("GLOBAL", PopularMovies.top(graph, Recommender.Config.defaults().n(), POPULAR_PRIOR_WEIGHT));
                for (int u = 0; u < graph.userCount(); u++) {
                    List<Recommendation> recs = rec.recommend(u);
                    if (recs.isEmpty()) { cold++; continue; }
                    sink.write(graph.userId(u), recs);
                    withRecs++;
                }
            }

            System.out.printf("Recommendations: %d users with results, %d without (cold start / no neighbors)%n", withRecs, cold);
            System.out.printf("Total time: %d ms%n", (System.nanoTime() - t0) / 1_000_000);
        }
    }
}
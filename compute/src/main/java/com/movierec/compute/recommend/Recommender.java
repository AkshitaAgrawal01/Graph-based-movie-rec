package com.movierec.compute.recommend;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.model.Neighbor;
import com.movierec.compute.model.Rating;
import com.movierec.compute.model.Recommendation;
import com.movierec.compute.similarity.Similarity;
import com.movierec.compute.topk.MinHeap;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * User-based collaborative filtering over the bipartite graph:
 * BFS candidates -> similarity -> min-heap top-K -> hash-map aggregation.
 *
 * Prediction (mean-centred, replaces SRS REQ-COMPUTE-5's raw sum):
 *   predicted(m) = mean_target + Σ S·(r_v,m - mean_v) / Σ|S|
 * with sums over the top-K neighbors v who rated m. Only positive-similarity neighbors are kept.
 */
public final class Recommender {

    public record Config(int k, int n, int minUserRatings, int minNeighborsPerMovie) {
        public Config {
            if (k < 1 || n < 1 || minUserRatings < 1 || minNeighborsPerMovie < 1) {
                throw new IllegalArgumentException("All config values must be >= 1");
            }
        }
        public static Config defaults() { return new Config(50, 20, 3, 2); }
    }

    private final BipartiteGraph graph;
    private final Similarity similarity;
    private final Config config;
    private final CandidateFinder finder;

    public Recommender(BipartiteGraph graph, Similarity similarity, Config config) {
        this.graph = graph;
        this.similarity = similarity;
        this.config = config;
        this.finder = new CandidateFinder(graph);
    }

    /** Top-K most similar users (positive similarity only), best first. */
    public List<Neighbor> topNeighbors(int target) {
        MinHeap heap = new MinHeap(config.k());
        for (int candidate : finder.find(target)) {
            double s = similarity.similarity(graph, target, candidate);
            if (s > 0) heap.offer(candidate, s);
        }
        return heap.toListDescending();
    }

    /** Recommendations for one user, best first. Empty for cold-start users (< minUserRatings). */
    public List<Recommendation> recommend(int target) {
        if (graph.userDegree(target) < config.minUserRatings()) return List.of();

        List<Neighbor> neighbors = topNeighbors(target);
        if (neighbors.isEmpty()) return List.of();

        // movieIdx -> [Σ S·(r - mean_v), Σ|S|, neighborCount]
        Map<Integer, double[]> acc = new HashMap<>();
        for (Neighbor nb : neighbors) {
            int v = nb.userIdx();
            double meanV = graph.userMean(v);
            for (int e = graph.userStart(v); e < graph.userEnd(v); e++) {
                int m = graph.movieAt(e);
                if (graph.hasRated(target, m)) continue; // REQ-REC-2: never recommend rated movies
                double[] a = acc.computeIfAbsent(m, k -> new double[3]);
                a[0] += nb.similarity() * (graph.ratingAt(e) - meanV);
                a[1] += Math.abs(nb.similarity());
                a[2] += 1;
            }
        }

                double meanT = graph.userMean(target);
        List<Map.Entry<Integer, Double>> scored = new ArrayList<>();
        for (Map.Entry<Integer, double[]> en : acc.entrySet()) {
            double[] a = en.getValue();
            if (a[2] < config.minNeighborsPerMovie() || a[1] == 0) continue;
            double predicted = meanT + a[0] / a[1];
            scored.add(Map.entry(en.getKey(), predicted));
        }

        scored.sort(Map.Entry.<Integer, Double>comparingByValue().reversed()
                .thenComparing(Map.Entry.comparingByKey(Comparator.naturalOrder())));

        List<Recommendation> out = new ArrayList<>(Math.min(config.n(), scored.size()));
        for (int i = 0; i < scored.size() && i < config.n(); i++) {
            double shown = Math.max(Rating.MIN, Math.min(Rating.MAX, scored.get(i).getValue()));
            out.add(new Recommendation(graph.movieId(scored.get(i).getKey()), shown));
        }
        return out;
    }
}

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

public final class Recommender {

    public record Config(int k, int n, int minUserRatings, int minNeighborsPerMovie) {
        public Config {
            if (k < 1 || n < 1 || minUserRatings < 1 || minNeighborsPerMovie < 1) {
                throw new IllegalArgumentException("All config values must be >= 1");
            }
        }
        public static Config defaults() { return new Config(50, 20, 8, 3); }
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

    public List<Neighbor> topNeighbors(int target) {
        MinHeap heap = new MinHeap(config.k());
        for (int candidate : finder.find(target)) {
            double s = similarity.similarity(graph, target, candidate);
            if (s > 0) heap.offer(candidate, s);
        }
        return heap.toListDescending();
    }
    
    private static class Accumulator {
        double num = 0, den = 0;
        int count = 0;
        List<Recommendation.NeighborEvidence> evidence = new ArrayList<>();
    }

    public List<Recommendation> recommend(int target) {
        if (graph.userDegree(target) < config.minUserRatings()) return List.of();

        List<Neighbor> neighbors = topNeighbors(target);
        if (neighbors.isEmpty()) return List.of();

        // Calculate shared movies for each neighbor once
        Map<Integer, List<String>> sharedMoviesByNeighbor = new HashMap<>();
        for (Neighbor nb : neighbors) {
            int v = nb.userIdx();
            List<String> shared = new ArrayList<>();
            // find overlap
            int p1 = graph.userStart(target), p2 = graph.userStart(v);
            while (p1 < graph.userEnd(target) && p2 < graph.userEnd(v)) {
                int m1 = graph.movieAt(p1);
                int m2 = graph.movieAt(p2);
                if (m1 == m2) {
                    shared.add(graph.movieId(m1));
                    p1++; p2++;
                } else if (m1 < m2) p1++;
                else p2++;
            }
            sharedMoviesByNeighbor.put(v, shared);
        }

        Map<Integer, Accumulator> acc = new HashMap<>();
        for (Neighbor nb : neighbors) {
            int v = nb.userIdx();
            double meanV = graph.userMean(v);
            for (int e = graph.userStart(v); e < graph.userEnd(v); e++) {
                int m = graph.movieAt(e);
                if (graph.hasRated(target, m)) continue;
                
                Accumulator a = acc.computeIfAbsent(m, k -> new Accumulator());
                double rating = graph.ratingAt(e);
                a.num += nb.similarity() * (rating - meanV);
                a.den += Math.abs(nb.similarity());
                a.count += 1;
                a.evidence.add(new Recommendation.NeighborEvidence(
                        graph.userId(v), nb.similarity(), rating, sharedMoviesByNeighbor.get(v)
                ));
            }
        }

        double meanT = graph.userMean(target);
        List<Map.Entry<Integer, Double>> scored = new ArrayList<>();
        for (Map.Entry<Integer, Accumulator> en : acc.entrySet()) {
            Accumulator a = en.getValue();
            if (a.count < config.minNeighborsPerMovie() || a.den == 0) continue;
            double predicted = meanT + a.num / a.den;
            scored.add(Map.entry(en.getKey(), predicted));
        }

        scored.sort(Map.Entry.<Integer, Double>comparingByValue().reversed()
                .thenComparing(Map.Entry.comparingByKey(Comparator.naturalOrder())));

        List<Recommendation> out = new ArrayList<>(Math.min(config.n(), scored.size()));
        for (int i = 0; i < scored.size() && i < config.n(); i++) {
            int m = scored.get(i).getKey();
            double shown = Math.max(Rating.MIN, Math.min(Rating.MAX, scored.get(i).getValue()));
            Accumulator a = acc.get(m);
            
            a.evidence.sort(Comparator.comparing(Recommendation.NeighborEvidence::similarity).reversed());
            List<Recommendation.NeighborEvidence> topEvi = a.evidence.subList(0, Math.min(3, a.evidence.size()));
            
            Recommendation.Explanation exp = new Recommendation.Explanation(a.count, a.den / a.count, topEvi);
            out.add(new Recommendation(graph.movieId(m), shown, exp));
        }
        return out;
    }

    public double predict(int target, int movieIdx) {
        if (graph.userDegree(target) < config.minUserRatings()) return Double.NaN;
        List<Neighbor> neighbors = topNeighbors(target);
        if (neighbors.isEmpty()) return Double.NaN;

        double num = 0, den = 0;
        int count = 0;
        for (Neighbor nb : neighbors) {
            int v = nb.userIdx();
            double r = graph.rating(v, movieIdx);
            if (!Double.isNaN(r)) {
                num += nb.similarity() * (r - graph.userMean(v));
                den += Math.abs(nb.similarity());
                count++;
            }
        }
        if (count < config.minNeighborsPerMovie() || den == 0) return Double.NaN;
        return graph.userMean(target) + num / den;
    }
}

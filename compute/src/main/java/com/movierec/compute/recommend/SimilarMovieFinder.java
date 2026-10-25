package com.movierec.compute.recommend;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.similarity.MovieSimilarity;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Finds and ranks movies similar to a selected movie.
 */
public final class SimilarMovieFinder {

    public record Result(String movieId, double similarity) {}

    private final BipartiteGraph graph;
    private final MovieSimilarity strategy;

    public SimilarMovieFinder(
            BipartiteGraph graph,
            MovieSimilarity strategy) {
        this.graph = graph;
        this.strategy = strategy;
    }

    public List<Result> findSimilar(
            String movieId, int limit, double minSimilarity) {

        if (limit < 1) {
            throw new IllegalArgumentException(
                    "limit must be >= 1");
        }

        if (!Double.isFinite(minSimilarity)
                || minSimilarity < 0.0
                || minSimilarity > 1.0) {
            throw new IllegalArgumentException(
                    "minSimilarity must be between 0 and 1");
        }

        int target = graph.movieIndexOf(movieId);

        if (target < 0) {
            return List.of();
        }

        List<Result> results = new ArrayList<>();

        for (int candidate = 0;
             candidate < graph.movieCount(); candidate++) {

            if (candidate == target) {
                continue;
            }

            double score =
                    strategy.similarity(graph, target, candidate);

            if (score > 0.0 && score >= minSimilarity) {
                results.add(new Result(
                        graph.movieId(candidate), score));
            }
        }

        results.sort(
                Comparator.comparingDouble(Result::similarity)
                        .reversed()
                        .thenComparing(Result::movieId));

        return List.copyOf(
                results.subList(0, Math.min(limit, results.size())));
    }
}
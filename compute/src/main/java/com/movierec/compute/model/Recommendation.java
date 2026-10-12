package com.movierec.compute.model;

/** A recommended movie with its predicted rating for the target user. */
import java.util.List;

public record Recommendation(String movieId, double score, Explanation explanation) {
    public record Explanation(int numNeighbors, double avgSimilarity, List<NeighborEvidence> topNeighbors) {}
    public record NeighborEvidence(String neighborId, double similarity, double neighborRating, List<String> sharedMovies) {}
}

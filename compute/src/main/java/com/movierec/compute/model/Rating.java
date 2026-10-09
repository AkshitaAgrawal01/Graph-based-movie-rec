package com.movierec.compute.model;

/** One edge of the bipartite graph: a user's star rating for a movie. */
public record Rating(String userId, String movieId, double value) {

    public static final double MIN = 0.5;
    public static final double MAX = 5.0;

    /** Valid = finite, within 0.5..5.0, and a multiple of 0.5 (half-star steps). */
    public static boolean isValidValue(double v) {
        return Double.isFinite(v) && v >= MIN && v <= MAX && (v * 2) == Math.rint(v * 2);
    }
}

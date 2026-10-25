package com.movierec.compute.similarity;

import com.movierec.compute.graph.BipartiteGraph;

/**
 * Calculates Pearson correlation between two movies
 * using ratings from their common users.
 */
public final class PearsonMovieSimilarity implements MovieSimilarity {

    private static final double EPS = 1e-12;
    private final int minOverlap;

    public PearsonMovieSimilarity(int minOverlap) {
        if (minOverlap < 2) {
            throw new IllegalArgumentException(
                    "minOverlap must be >= 2");
        }
        this.minOverlap = minOverlap;
    }

    @Override
    public double similarity(BipartiteGraph graph, int movieA, int movieB) {
        int n = 0;
        double sa = 0, sb = 0;
        double saa = 0, sbb = 0, sab = 0;

        for (int e = graph.movieStart(movieA);
             e < graph.movieEnd(movieA); e++) {

            int user = graph.userAt(e);
            double x = graph.rating(user, movieA);
            double y = graph.rating(user, movieB);

            if (Double.isNaN(y)) {
                continue;
            }

            n++;
            sa += x;
            sb += y;
            saa += x * x;
            sbb += y * y;
            sab += x * y;
        }

        if (n < minOverlap) {
            return 0.0;
        }

        double covariance = n * sab - sa * sb;
        double varianceA = n * saa - sa * sa;
        double varianceB = n * sbb - sb * sb;

        if (varianceA <= EPS || varianceB <= EPS) {
            return 0.0;
        }

        double score = covariance
                / Math.sqrt(varianceA * varianceB);

        return Math.max(-1.0, Math.min(1.0, score));
    }
}


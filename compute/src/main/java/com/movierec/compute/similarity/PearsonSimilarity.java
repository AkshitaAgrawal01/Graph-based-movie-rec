package com.movierec.compute.similarity;

import com.movierec.compute.graph.BipartiteGraph;

/**
 * Pearson correlation over the mutual movies of two users, computed in one merge pass
 * (no intersection set is materialised):
 *
 *   r = (n*Σab - Σa*Σb) / sqrt( (n*Σa² - (Σa)²) * (n*Σb² - (Σb)²) )
 *
 * which equals Σ(a-ā)(b-b̄) / (√Σ(a-ā)² · √Σ(b-b̄)²) with ā, b̄ the means over the mutual movies.
 *
 * Edge cases: overlap below minOverlap -> 0; zero variance on either side -> 0.
 */
public final class PearsonSimilarity implements Similarity {

    private static final double EPS = 1e-12;
    private final int minOverlap;

    public PearsonSimilarity(int minOverlap) {
        if (minOverlap < 2) {
            throw new IllegalArgumentException("minOverlap must be >= 2 (Pearson is meaningless below that)");
        }
        this.minOverlap = minOverlap;
    }

    @Override
    public double similarity(BipartiteGraph g, int a, int b) {
        int i = g.userStart(a), iEnd = g.userEnd(a);
        int j = g.userStart(b), jEnd = g.userEnd(b);

        int n = 0;
        double sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;

        while (i < iEnd && j < jEnd) {
            int mi = g.movieAt(i), mj = g.movieAt(j);
            if (mi == mj) {
                double x = g.ratingAt(i), y = g.ratingAt(j);
                n++;
                sa += x; sb += y;
                saa += x * x; sbb += y * y;
                sab += x * y;
                i++; j++;
            } else if (mi < mj) {
                i++;
            } else {
                j++;
            }
        }

        if (n < minOverlap) return 0;

        double cov = n * sab - sa * sb;
        double varA = n * saa - sa * sa;
        double varB = n * sbb - sb * sb;
        if (varA <= EPS || varB <= EPS) return 0;

        double r = cov / Math.sqrt(varA * varB);
        return Math.max(-1.0, Math.min(1.0, r)); // guard against floating-point drift
    }
}

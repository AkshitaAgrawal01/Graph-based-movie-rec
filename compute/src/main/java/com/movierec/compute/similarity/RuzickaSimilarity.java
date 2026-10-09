package com.movierec.compute.similarity;

import com.movierec.compute.graph.BipartiteGraph;

/**
 * Weighted Jaccard (Ruzicka), as written in the original SRS (REQ-COMPUTE-3):
 *   S = Σ min(a, b) / Σ max(a, b)  over the mutual movies.
 * Kept so Pearson can be compared against it in the evaluation.
 */
public final class RuzickaSimilarity implements Similarity {

    private final int minOverlap;

    public RuzickaSimilarity(int minOverlap) {
        if (minOverlap < 1) throw new IllegalArgumentException("minOverlap must be >= 1");
        this.minOverlap = minOverlap;
    }

    @Override
    public double similarity(BipartiteGraph g, int a, int b) {
        int i = g.userStart(a), iEnd = g.userEnd(a);
        int j = g.userStart(b), jEnd = g.userEnd(b);
        int n = 0;
        double mins = 0, maxs = 0;
        while (i < iEnd && j < jEnd) {
            int mi = g.movieAt(i), mj = g.movieAt(j);
            if (mi == mj) {
                double x = g.ratingAt(i), y = g.ratingAt(j);
                mins += Math.min(x, y);
                maxs += Math.max(x, y);
                n++; i++; j++;
            } else if (mi < mj) {
                i++;
            } else {
                j++;
            }
        }
        if (n < minOverlap || maxs == 0) return 0;
        return mins / maxs;
    }
}

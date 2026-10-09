package com.movierec.compute.recommend;

import com.movierec.compute.graph.BipartiteGraph;

import java.util.Arrays;

/**
 * Bounded 2-hop BFS (REQ-COMPUTE-2): target user -> movies they rated -> other users who rated
 * those movies. Only users sharing at least one movie with the target are ever returned,
 * so the rest of the user base is never touched.
 */
public final class CandidateFinder {

    private final BipartiteGraph graph;

    public CandidateFinder(BipartiteGraph graph) {
        this.graph = graph;
    }

    /** @return candidate user indices (sorted ascending), excluding the target itself. */
    public int[] find(int target) {
        boolean[] seen = new boolean[graph.userCount()];
        seen[target] = true; // never return the target as its own neighbor
        int[] out = new int[16];
        int count = 0;

        // hop 1: target -> movies; hop 2: movie -> users
        for (int e = graph.userStart(target); e < graph.userEnd(target); e++) {
            int movie = graph.movieAt(e);
            for (int f = graph.movieStart(movie); f < graph.movieEnd(movie); f++) {
                int other = graph.userAt(f);
                if (!seen[other]) {
                    seen[other] = true;
                    if (count == out.length) out = Arrays.copyOf(out, count * 2);
                    out[count++] = other;
                }
            }
        }
        int[] result = Arrays.copyOf(out, count);
        Arrays.sort(result);
        return result;
    }
}

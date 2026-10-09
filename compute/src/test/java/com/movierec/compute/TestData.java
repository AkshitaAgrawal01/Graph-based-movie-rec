package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.model.Rating;

import java.util.ArrayList;
import java.util.List;

/**
 * Tiny hand-checkable dataset.
 *
 *        M1 M2 M3 M4 M5 M9
 *   T     5  3  4  .  .  .   mean 4.0   (target)
 *   B     4  2  3  4  1  .   mean 2.8   same shape as T       -> r = +1
 *   G     5  3  4  4  2  .   mean 3.6   identical to T on M1-3 -> r = +1
 *   C     1  3  2  5  5  .   mean 3.2   opposite of T          -> r = -1 (never a neighbor)
 *   F     5  4  1  .  .  .   mean 3.33  weakly similar         -> r = sqrt(3/52) ~ 0.2402
 *   D     3  3  3  .  .  .              zero variance          -> 0
 *   E     5  1  .  .  .  .              overlap 2 < 3          -> 0
 *   Q     .  .  .  .  .  5              shares nothing with T  -> not a BFS candidate
 */
public final class TestData {
    private TestData() {}

    public static BipartiteGraph graph() {
        List<Rating> r = new ArrayList<>();
        add(r, "T", 5, 3, 4, 0, 0);
        add(r, "B", 4, 2, 3, 4, 1);
        add(r, "G", 5, 3, 4, 4, 2);
        add(r, "C", 1, 3, 2, 5, 5);
        add(r, "F", 5, 4, 1, 0, 0);
        add(r, "D", 3, 3, 3, 0, 0);
        add(r, "E", 5, 1, 0, 0, 0);
        r.add(new Rating("Q", "M9", 5));
        return BipartiteGraph.build(r);
    }

    /** 0 means "did not rate". */
    private static void add(List<Rating> out, String user, double... vals) {
        for (int i = 0; i < vals.length; i++) {
            if (vals[i] != 0) out.add(new Rating(user, "M" + (i + 1), vals[i]));
        }
    }
}

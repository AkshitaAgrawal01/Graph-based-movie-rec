package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.similarity.PearsonSimilarity;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PearsonSimilarityTest {

    private final BipartiteGraph g = TestData.graph();
    private final PearsonSimilarity pearson = new PearsonSimilarity(3);

    private double sim(String a, String b) {
        return pearson.similarity(g, g.userIndexOf(a), g.userIndexOf(b));
    }

    @Test void identicalShapeIsPlusOne()   { assertEquals(1.0, sim("T", "B"), 1e-9); }
    @Test void oppositeShapeIsMinusOne()   { assertEquals(-1.0, sim("T", "C"), 1e-9); }
    @Test void hand_computed_value()       { assertEquals(Math.sqrt(3.0 / 52.0), sim("T", "F"), 1e-9); }
    @Test void zeroVarianceIsZero()        { assertEquals(0.0, sim("T", "D"), 0.0); }
    @Test void belowMinOverlapIsZero()     { assertEquals(0.0, sim("T", "E"), 0.0); }
    @Test void noOverlapIsZero()           { assertEquals(0.0, sim("T", "Q"), 0.0); }
    @Test void isSymmetric()               { assertEquals(sim("T", "F"), sim("F", "T"), 1e-12); }

    @Test void rejectsTinyMinOverlap() {
        assertThrows(IllegalArgumentException.class, () -> new PearsonSimilarity(1));
    }
}

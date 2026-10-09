package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.model.Recommendation;
import com.movierec.compute.recommend.PopularMovies;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PopularMoviesTest {

    private final BipartiteGraph g = TestData.graph();

    @Test
    void withoutSmoothing_aSingleFiveStarMovieWins() {
        // M9 has one rating of 5.0 -> raw average 5.0 beats everything.
        assertEquals("M9", PopularMovies.top(g, 1, 0).get(0).movieId());
    }

    @Test
    void withSmoothing_theWellRatedMovieWins() {
        // M1: (28 + 10*3.3333)/(7+10) = 3.608 ; M9: (5 + 33.333)/(1+10) = 3.485
        List<Recommendation> top = PopularMovies.top(g, 6, 10);
        assertEquals("M1", top.get(0).movieId());
        assertEquals(3.6078, top.get(0).score(), 1e-3);
        assertEquals("M4", top.get(1).movieId());
        assertEquals("M9", top.get(2).movieId());
    }

    @Test
    void respectsN() {
        assertEquals(3, PopularMovies.top(g, 3, 10).size());
    }
}
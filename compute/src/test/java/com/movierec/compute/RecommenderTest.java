package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.model.Neighbor;
import com.movierec.compute.model.Recommendation;
import com.movierec.compute.recommend.CandidateFinder;
import com.movierec.compute.recommend.Recommender;
import com.movierec.compute.recommend.Recommender.Config;
import com.movierec.compute.similarity.PearsonSimilarity;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RecommenderTest {

    private final BipartiteGraph g = TestData.graph();
    private final int t = g.userIndexOf("T");

    private Recommender recommender(Config c) {
        return new Recommender(g, new PearsonSimilarity(3), c);
    }

    @Test
    void bfsFindsOnlyUsersSharingAMovie_andNotTheTarget() {
        List<String> ids = new ArrayList<>();
        for (int u : new CandidateFinder(g).find(t)) ids.add(g.userId(u));
        assertTrue(ids.containsAll(List.of("B", "G", "C", "F", "D", "E")));
        assertFalse(ids.contains("Q"));
        assertFalse(ids.contains("T"));
    }

    @Test
    void neighborsAreOnlyPositivelySimilar_bestFirst() {
        List<Neighbor> nbs = recommender(new Config(10, 10, 3, 2)).topNeighbors(t);
        List<String> ids = nbs.stream().map(n -> g.userId(n.userIdx())).toList();
        assertEquals(List.of("B", "G", "F"), ids);        // C (-1), D (0), E (0) excluded
        assertEquals(Math.sqrt(3.0 / 52.0), nbs.get(2).similarity(), 1e-9);
    }

    @Test
    void topKLimitsNeighbors() {
        assertEquals(2, recommender(new Config(2, 10, 3, 2)).topNeighbors(t).size());
    }

    @Test
    void predictsMeanCentredScores() {
        // F rated only M1-M3 (already rated by T), so M4/M5 come from B and G only.
        // M4: 4.0 + (1*(4-2.8) + 1*(4-3.6)) / 2 = 4.8
        // M5: 4.0 + (1*(1-2.8) + 1*(2-3.6)) / 2 = 2.3
        List<Recommendation> recs = recommender(new Config(10, 10, 3, 2)).recommend(t);
        assertEquals(2, recs.size());
        assertEquals("M4", recs.get(0).movieId());
        assertEquals(4.8, recs.get(0).score(), 1e-9);
        assertEquals("M5", recs.get(1).movieId());
        assertEquals(2.3, recs.get(1).score(), 1e-9);
    }

    @Test
    void neverRecommendsAlreadyRatedMovies() {
        for (Recommendation r : recommender(new Config(10, 10, 3, 2)).recommend(t)) {
            assertFalse(g.hasRated(t, g.movieIndexOf(r.movieId())), r.movieId());
        }
    }

    @Test
    void respectsTopN() {
        assertEquals(1, recommender(new Config(10, 1, 3, 2)).recommend(t).size());
    }

    @Test
    void dropsMoviesWithTooFewNeighbors() {
        assertTrue(recommender(new Config(10, 10, 3, 3)).recommend(t).isEmpty());
    }

    @Test
    void coldStartUserGetsNothing() {
        int e = g.userIndexOf("E"); // only 2 ratings
        assertTrue(recommender(Config.defaults()).recommend(e).isEmpty());
    }
}

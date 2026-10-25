
package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.model.Rating;
import com.movierec.compute.recommend.SimilarMovieFinder;
import com.movierec.compute.similarity.PearsonMovieSimilarity;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SimilarMovieFinderTest {

    private BipartiteGraph createGraph() {
        List<Rating> ratings = List.of(
            new Rating("U1", "M1", 1),
            new Rating("U1", "M2", 1),
            new Rating("U1", "M3", 5),
            new Rating("U1", "M4", 1),

            new Rating("U2", "M1", 2),
            new Rating("U2", "M2", 2),
            new Rating("U2", "M3", 4),
            new Rating("U2", "M4", 2),

            new Rating("U3", "M1", 4),
            new Rating("U3", "M2", 4),
            new Rating("U3", "M3", 2),
            new Rating("U3", "M4", 3),

            new Rating("U4", "M1", 5),
            new Rating("U4", "M2", 5),
            new Rating("U4", "M3", 1),
            new Rating("U4", "M4", 5)
        );

        return BipartiteGraph.build(ratings);
    }

    private SimilarMovieFinder createFinder() {
        return new SimilarMovieFinder(
            createGraph(),
            new PearsonMovieSimilarity(2)
        );
    }

    @Test
    void mostSimilarMovieIsRankedFirst() {
        var results = createFinder().findSimilar("M1", 3, 0.0);

        assertFalse(results.isEmpty());
        assertEquals("M2", results.get(0).movieId());
        assertEquals(1.0, results.get(0).similarity(), 0.0001);
    }

    @Test
    void selectedMovieIsNotIncluded() {
        var results = createFinder().findSimilar("M1", 3, 0.0);

        assertTrue(results.stream()
            .noneMatch(result -> result.movieId().equals("M1")));
    }

    @Test
    void resultCountRespectsLimit() {
        var results = createFinder().findSimilar("M1", 1, 0.0);

        assertEquals(1, results.size());
    }

    @Test
    void unknownMovieReturnsEmptyResults() {
        var results = createFinder().findSimilar("M99", 3, 0.0);

        assertTrue(results.isEmpty());
    }

    @Test
    void minimumSimilarityFiltersResults() {
        var results = createFinder().findSimilar("M1", 3, 1.0);

        assertEquals(1, results.size());
        assertEquals("M2", results.get(0).movieId());
    }

    @Test
    void invalidLimitIsRejected() {
        assertThrows(IllegalArgumentException.class,
            () -> createFinder().findSimilar("M1", 0, 0.0));
    }

    @Test
    void invalidSimilarityThresholdIsRejected() {
        assertThrows(IllegalArgumentException.class,
            () -> createFinder().findSimilar("M1", 3, 1.5));
    }

    @Test
    void insufficientCommonRatingsGiveZeroSimilarity() {
        List<Rating> ratings = List.of(
            new Rating("U1", "M1", 5),
            new Rating("U1", "M2", 4),
            new Rating("U2", "M1", 3),
            new Rating("U3", "M2", 2)
        );

        BipartiteGraph graph = BipartiteGraph.build(ratings);
        PearsonMovieSimilarity similarity =
            new PearsonMovieSimilarity(2);

        double result = similarity.similarity(
            graph,
            graph.movieIndexOf("M1"),
            graph.movieIndexOf("M2")
        );

        assertEquals(0.0, result, 0.0001);
    }
}

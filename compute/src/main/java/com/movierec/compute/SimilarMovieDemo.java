
package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.model.Rating;
import com.movierec.compute.similarity.PearsonMovieSimilarity;
import com.movierec.compute.recommend.SimilarMovieFinder;

import java.util.List;

public class SimilarMovieDemo {
    public static void main(String[] args) {

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

        BipartiteGraph graph = BipartiteGraph.build(ratings);

        SimilarMovieFinder finder = new SimilarMovieFinder(
            graph,
            new PearsonMovieSimilarity(2)
        );

        System.out.println("SIMILAR MOVIE FINDER");
        System.out.println("--------------------");
        System.out.println("Selected Movie: M1");

        List<SimilarMovieFinder.Result> results =
            finder.findSimilar("M1", 3, 0.0);

        System.out.println("\nSimilar Movies:");

        if (results.isEmpty()) {
            System.out.println("No similar movies found.");
        } else {
            for (SimilarMovieFinder.Result result : results) {
                System.out.printf(
                    "Movie ID: %s, Similarity: %.4f%n",
                    result.movieId(),
                    result.similarity()
                );
            }
        }
    }
}

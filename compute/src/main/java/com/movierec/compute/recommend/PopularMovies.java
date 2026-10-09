package com.movierec.compute.recommend;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.model.Recommendation;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Cold-start list: globally top-rated movies, ranked by a Bayesian average so a movie with a
 * single 5-star rating cannot beat a movie with thousands of strong ratings.
 *
 *   score(m) = (sum of m's ratings + priorWeight * globalMean) / (count(m) + priorWeight)
 *
 * priorWeight = how many "average" votes every movie starts with. Few real votes -> score stays
 * near the global mean; many real votes -> score approaches the movie's true average.
 */
public final class PopularMovies {

    private PopularMovies() {}

    public static List<Recommendation> top(BipartiteGraph g, int n, int priorWeight) {
        if (n < 1 || priorWeight < 0) throw new IllegalArgumentException("n >= 1 and priorWeight >= 0 required");

        int movies = g.movieCount();
        double[] sum = new double[movies];
        int[] count = new int[movies];
        double total = 0;
        long edges = 0;

        for (int u = 0; u < g.userCount(); u++) {
            for (int e = g.userStart(u); e < g.userEnd(u); e++) {
                int m = g.movieAt(e);
                double r = g.ratingAt(e);
                sum[m] += r;
                count[m]++;
                total += r;
                edges++;
            }
        }
        double globalMean = edges == 0 ? 0 : total / edges;

        double[] score = new double[movies];
        List<Integer> order = new ArrayList<>(movies);
        for (int m = 0; m < movies; m++) {
            if (count[m] == 0) continue;
            score[m] = (sum[m] + priorWeight * globalMean) / (count[m] + priorWeight);
            order.add(m);
        }
        order.sort(Comparator.comparingDouble((Integer m) -> score[m]).reversed()
                .thenComparingInt(m -> m));

        List<Recommendation> out = new ArrayList<>();
        for (int i = 0; i < order.size() && i < n; i++) {
            int m = order.get(i);
            out.add(new Recommendation(g.movieId(m), score[m]));
        }
        return out;
    }
}
package com.movierec.compute;

import com.movierec.compute.graph.BipartiteGraph;
import com.movierec.compute.io.CsvRatingsSource;
import com.movierec.compute.model.Rating;
import com.movierec.compute.recommend.Recommender;
import com.movierec.compute.similarity.PearsonSimilarity;
import com.movierec.compute.similarity.RuzickaSimilarity;
import com.movierec.compute.similarity.Similarity;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public final class Evaluator {

    public static void main(String[] args) throws Exception {
        System.out.println("Loading ratings...");
        CsvRatingsSource source = new CsvRatingsSource(
                Path.of("../data/ratings.csv"));
        List<Rating> allRatings = new ArrayList<>(source.load());

        System.out.println("Total ratings: " + allRatings.size());
        
        // Shuffle for hold-out
        Collections.shuffle(allRatings, new Random(42));
        
        int splitIndex = (int) (allRatings.size() * 0.8);
        List<Rating> train = allRatings.subList(0, splitIndex);
        List<Rating> test = allRatings.subList(splitIndex, allRatings.size());
        
        System.out.println("Train: " + train.size() + ", Test: " + test.size());
        
        BipartiteGraph trainGraph = BipartiteGraph.build(train);
        
        // Compare models
        System.out.println("\n--- Evaluating Models ---");
        
        evaluate(trainGraph, test, "Pearson (minOverlap=5)", new PearsonSimilarity(5), Recommender.Config.defaults());
        evaluate(trainGraph, test, "Pearson (minOverlap=5, shrink=10)", new PearsonSimilarity(5, 10), Recommender.Config.defaults());
        
        Recommender.Config tightConfig = new Recommender.Config(
                Recommender.Config.defaults().k(),
                Recommender.Config.defaults().n(),
                Recommender.Config.defaults().minUserRatings(),
                5 // higher minNeighborsPerMovie
        );
        evaluate(trainGraph, test, "Pearson (minOverlap=5, shrink=10, minNeighbors=5)", new PearsonSimilarity(5, 10), tightConfig);
        
        evaluate(trainGraph, test, "Ruzicka (minOverlap=5)", new RuzickaSimilarity(5), Recommender.Config.defaults());
    }

    private static void evaluate(BipartiteGraph graph, List<Rating> test, String name, Similarity sim, Recommender.Config config) {
        Recommender rec = new Recommender(graph, sim, config);
        
        double sumSqErr = 0;
        double sumAbsErr = 0;
        int evaluated = 0;
        int unpredicted = 0;
        
        for (Rating t : test) {
            int u = graph.userIndexOf(t.userId());
            int m = graph.movieIndexOf(t.movieId());
            
            if (u == -1 || m == -1) {
                unpredicted++;
                continue;
            }
            
            double pred = rec.predict(u, m);
            if (Double.isNaN(pred)) {
                unpredicted++;
            } else {
                double err = pred - t.value();
                sumSqErr += err * err;
                sumAbsErr += Math.abs(err);
                evaluated++;
            }
        }
        
        if (evaluated == 0) {
            System.out.printf("%-50s : 0 evaluated%n", name);
            return;
        }
        
        double rmse = Math.sqrt(sumSqErr / evaluated);
        double mae = sumAbsErr / evaluated;
        double coverage = (double) evaluated / test.size() * 100.0;
        
        System.out.printf("%-50s : RMSE=%.4f  MAE=%.4f  Coverage=%.1f%%%n", name, rmse, mae, coverage);
    }
}

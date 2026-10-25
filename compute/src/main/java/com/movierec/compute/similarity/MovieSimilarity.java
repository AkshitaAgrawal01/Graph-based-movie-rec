package com.movierec.compute.similarity;

import com.movierec.compute.graph.BipartiteGraph;

/**
 * Strategy interface for calculating similarity between two movies.
 */
public interface MovieSimilarity {

    double similarity(BipartiteGraph graph, int movieA, int movieB);
}
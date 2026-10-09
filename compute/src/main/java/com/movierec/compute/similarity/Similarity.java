package com.movierec.compute.similarity;

import com.movierec.compute.graph.BipartiteGraph;

/**
 * User-to-user similarity over the movies both users rated.
 * Implementations return 0 when similarity is undefined (too little overlap, zero variance).
 */
public interface Similarity {
    double similarity(BipartiteGraph graph, int userA, int userB);
}

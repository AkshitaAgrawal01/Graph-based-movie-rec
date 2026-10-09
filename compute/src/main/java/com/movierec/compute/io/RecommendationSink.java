package com.movierec.compute.io;

import com.movierec.compute.model.Recommendation;

import java.io.Closeable;
import java.io.IOException;
import java.util.List;

/** Where finished recommendations go. CSV now; a MongoDB implementation later. */
public interface RecommendationSink extends Closeable {
    void write(String userId, List<Recommendation> recommendations) throws IOException;
}

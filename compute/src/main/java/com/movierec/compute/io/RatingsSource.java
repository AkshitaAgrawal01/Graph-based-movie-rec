package com.movierec.compute.io;

import com.movierec.compute.model.Rating;

import java.io.IOException;
import java.util.List;

/** Where ratings come from. CSV now; a MongoDB implementation later. */
public interface RatingsSource {
    List<Rating> load() throws IOException;
}

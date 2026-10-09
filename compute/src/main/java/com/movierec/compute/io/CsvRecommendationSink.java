package com.movierec.compute.io;

import com.movierec.compute.model.Recommendation;

import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;

/** Writes one row per recommendation: userId,rank,movieId,score. */
public final class CsvRecommendationSink implements RecommendationSink {

    private final BufferedWriter writer;

    public CsvRecommendationSink(Path path) throws IOException {
        this.writer = Files.newBufferedWriter(path);
        writer.write("userId,rank,movieId,score");
        writer.newLine();
    }

    @Override
    public void write(String userId, List<Recommendation> recs) throws IOException {
        int rank = 1;
        for (Recommendation r : recs) {
            writer.write(String.format(Locale.ROOT, "%s,%d,%s,%.4f", userId, rank++, r.movieId(), r.score()));
            writer.newLine();
        }
    }

    @Override
    public void close() throws IOException {
        writer.close();
    }
}

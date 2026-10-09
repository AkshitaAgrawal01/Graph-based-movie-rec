package com.movierec.compute.io;

import com.movierec.compute.model.Rating;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Reads MovieLens ratings.csv (userId,movieId,rating,timestamp).
 * Malformed or out-of-range rows are skipped and counted instead of crashing the job
 * (SRS 5.4 Reliability).
 */
public final class CsvRatingsSource implements RatingsSource {

    private final Path path;
    private int skipped;

    public CsvRatingsSource(Path path) {
        this.path = path;
    }

    public int skippedLines() { return skipped; }

    @Override
    public List<Rating> load() throws IOException {
        List<Rating> out = new ArrayList<>();
        skipped = 0;
        try (BufferedReader br = Files.newBufferedReader(path)) {
            String line = br.readLine(); // header
            if (line != null && !line.startsWith("userId")) {
                parseInto(line, out); // no header present: treat as data
            }
            while ((line = br.readLine()) != null) {
                if (!line.isBlank()) parseInto(line, out);
            }
        }
        return out;
    }

    private void parseInto(String line, List<Rating> out) {
        String[] p = line.split(",");
        if (p.length < 3) { skipped++; return; }
        try {
            double v = Double.parseDouble(p[2].trim());
            if (!Rating.isValidValue(v)) { skipped++; return; }
            out.add(new Rating(p[0].trim(), p[1].trim(), v));
        } catch (NumberFormatException e) {
            skipped++;
        }
    }
}

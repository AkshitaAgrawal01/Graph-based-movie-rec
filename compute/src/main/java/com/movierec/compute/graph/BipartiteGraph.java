package com.movierec.compute.graph;

import com.movierec.compute.model.Rating;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Weighted bipartite graph G = (U, V, E) stored as two CSR-style adjacency lists
 * (parallel arrays) over dense int indices.
 *
 * <ul>
 *   <li>User side: for user u, edges are positions userOffsets[u]..userOffsets[u+1]-1,
 *       sorted by movie index (so two users can be intersected with a merge).</li>
 *   <li>Movie side: for movie m, edges are positions movieOffsets[m]..movieOffsets[m+1]-1,
 *       listing the users who rated it (the BFS "second hop").</li>
 * </ul>
 * Immutable once built.
 */
public final class BipartiteGraph {

    private final String[] userIds;
    private final String[] movieIds;
    private final Map<String, Integer> userIndex;
    private final Map<String, Integer> movieIndex;

    private final int[] userOffsets;
    private final int[] userMovies;
    private final double[] userRatings;
    private final double[] userMean;

    private final int[] movieOffsets;
    private final int[] movieUsers;

    private BipartiteGraph(String[] userIds, String[] movieIds, Map<String, Integer> userIndex, Map<String, Integer> movieIndex, int[] userOffsets, int[] userMovies, double[] userRatings, double[] userMean, int[] movieOffsets, int[] movieUsers) {
        this.userIds = userIds;
        this.movieIds = movieIds;
        this.userIndex = userIndex;
        this.movieIndex = movieIndex;
        this.userOffsets = userOffsets;
        this.userMovies = userMovies;
        this.userRatings = userRatings;
        this.userMean = userMean;
        this.movieOffsets = movieOffsets;
        this.movieUsers = movieUsers;
    }

    /**
     * Builds the graph. If the same (user, movie) appears more than once the LAST one wins,
     * mirroring the "re-rating updates the edge" business rule. Invalid values throw.
     */
    public static BipartiteGraph build(List<Rating> ratings) {
        Map<String, Integer> userIndex = new HashMap<>();
        Map<String, Integer> movieIndex = new HashMap<>();
        Map<Long, Double> edges = new HashMap<>();

        for (Rating r : ratings) {
            if (!Rating.isValidValue(r.value())) {
                throw new IllegalArgumentException("Invalid rating value: " + r);
            }
            int u = userIndex.computeIfAbsent(r.userId(), k -> userIndex.size());
            int m = movieIndex.computeIfAbsent(r.movieId(), k -> movieIndex.size());
            edges.put(((long) u << 32) | m, r.value());
        }

        int nu = userIndex.size();
        int nm = movieIndex.size();
        String[] userIds = new String[nu];
        String[] movieIds = new String[nm];
        userIndex.forEach((id, i) -> userIds[i] = id);
        movieIndex.forEach((id, i) -> movieIds[i] = id);

        // Sorting packed (user<<32 | movie) keys groups by user and sorts movies within each user.
        long[] keys = new long[edges.size()];
        int idx = 0;
        for (Long k : edges.keySet()) keys[idx++] = k;
        Arrays.sort(keys);

        int ne = keys.length;
        int[] userOffsets = new int[nu + 1];
        int[] userMovies = new int[ne];
        double[] userRatings = new double[ne];
        int[] movieOffsets = new int[nm + 1];
        double[] sum = new double[nu];

        for (int e = 0; e < ne; e++) {
            int u = (int) (keys[e] >>> 32);
            int m = (int) (keys[e] & 0xFFFFFFFFL);
            double val = edges.get(keys[e]);
            userMovies[e] = m;
            userRatings[e] = val;
            userOffsets[u + 1]++;
            movieOffsets[m + 1]++;
            sum[u] += val;
        }
        for (int u = 0; u < nu; u++) userOffsets[u + 1] += userOffsets[u];
        for (int m = 0; m < nm; m++) movieOffsets[m + 1] += movieOffsets[m];

        double[] userMean = new double[nu];
        for (int u = 0; u < nu; u++) {
            int deg = userOffsets[u + 1] - userOffsets[u];
            userMean[u] = deg == 0 ? 0 : sum[u] / deg;
        }

        // Fill the movie -> users side. Iterating users in order keeps each list sorted by user.
        int[] movieUsers = new int[ne];
        int[] cursor = Arrays.copyOf(movieOffsets, nm);
        for (int u = 0; u < nu; u++) {
            for (int e = userOffsets[u]; e < userOffsets[u + 1]; e++) {
                movieUsers[cursor[userMovies[e]]++] = u;
            }
        }

        return new BipartiteGraph(userIds, movieIds, userIndex, movieIndex, userOffsets, userMovies, userRatings, userMean, movieOffsets, movieUsers);
    }

    // ---- sizes and id mapping ----
    public int userCount()  { return userIds.length; }
    public int movieCount() { return movieIds.length; }
    public int edgeCount()  { return userMovies.length; }
    public String userId(int u)  { return userIds[u]; }
    public String movieId(int m) { return movieIds[m]; }
    /** @return dense index of the user, or -1 if unknown. */
    public int userIndexOf(String userId) { return userIndex.getOrDefault(userId, -1); }
    public int movieIndexOf(String movieId) { return movieIndex.getOrDefault(movieId, -1); }

    // ---- user -> movies adjacency (edge positions) ----
    public int userStart(int u) { return userOffsets[u]; }
    public int userEnd(int u)   { return userOffsets[u + 1]; }
    public int userDegree(int u) { return userOffsets[u + 1] - userOffsets[u]; }
    /** Movie index at user-edge position e. */
    public int movieAt(int e)  { return userMovies[e]; }
    /** Rating value at user-edge position e. */
    public double ratingAt(int e) { return userRatings[e]; }
    /** Mean of ALL ratings given by user u. */
    public double userMean(int u) { return userMean[u]; }

    // ---- movie -> users adjacency (edge positions) ----
    public int movieStart(int m) { return movieOffsets[m]; }
    public int movieEnd(int m)   { return movieOffsets[m + 1]; }
    /** User index at movie-edge position e. */
    public int userAt(int e) { return movieUsers[e]; }

    /** True if user u rated movie m (binary search; user adjacency is sorted by movie). */
    public boolean hasRated(int u, int m) {
        return Arrays.binarySearch(userMovies, userOffsets[u], userOffsets[u + 1], m) >= 0;
    }
}

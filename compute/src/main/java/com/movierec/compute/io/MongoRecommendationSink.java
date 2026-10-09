package com.movierec.compute.io;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.ReplaceOptions;
import com.movierec.compute.model.Recommendation;
import org.bson.Document;

import java.util.Date;
import java.util.List;

public class MongoRecommendationSink implements RecommendationSink {

    private final MongoCollection<Document> recommendationsCollection;

    public MongoRecommendationSink(MongoCollection<Document> recommendationsCollection) {
        this.recommendationsCollection = recommendationsCollection;
    }

    @Override
    public void write(String userId, List<Recommendation> recommendations) {
        List<Document> items = recommendations.stream()
                .map(r -> new Document("movieId", Integer.parseInt(r.movieId())).append("score", r.score()))
                .toList();

        Document doc = new Document("userId", userId)
                .append("items", items)
                .append("computedAt", new Date());

        recommendationsCollection.replaceOne(
                new Document("userId", userId),
                doc,
                new ReplaceOptions().upsert(true)
        );
    }

    @Override
    public void close() {
        // Nothing to close here: the MongoCollection doesn't own a connection
        // of its own -- the MongoClient that created it (in Main.java) is
        // what actually owns the connection, and that gets closed separately
        // via try-with-resources. This method only exists to satisfy
        // RecommendationSink extends Closeable.
    }
}
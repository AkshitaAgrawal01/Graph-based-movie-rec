package com.movierec.compute.io;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.movierec.compute.model.Rating;
import org.bson.Document;
import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;

public class MongoRatingsSource implements RatingsSource {

    private final MongoCollection<Document> ratingsCollection;

    public MongoRatingsSource(MongoCollection<Document> ratingsCollection) {
        this.ratingsCollection = ratingsCollection;
    }

    @Override
    public List<Rating> load() {
        List<Rating> ratings = new ArrayList<>();
        FindIterable<Document> docs = ratingsCollection.find();

        for (Document doc : docs) {
            ObjectId userObjectId = doc.getObjectId("userId");
            int movieId = doc.getInteger("movieId");
            double value = ((Number) doc.get("rating")).doubleValue();

            // userId: ObjectId -> hex string (opaque id, as planned).
            // movieId: Mongo stores it as a Number, but Rating's constructor
            // wants a String, so it's converted here with String.valueOf.
            ratings.add(new Rating(userObjectId.toHexString(), String.valueOf(movieId), value));
        }

        return ratings;
    }
}
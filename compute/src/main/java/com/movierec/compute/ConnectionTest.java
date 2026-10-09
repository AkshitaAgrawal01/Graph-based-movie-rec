package com.movierec.compute;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;

public class ConnectionTest {
    public static void main(String[] args) {
        // Looks for a ".env" file in the current working directory by default.
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        String uri = dotenv.get("MONGO_URI");

        if (uri == null || uri.isBlank()) {
            System.out.println("MONGO_URI not found. Is .env in the compute/ folder, next to pom.xml?");
            return;
        }

        try (MongoClient client = MongoClients.create(uri)) {
            MongoDatabase db = client.getDatabase("graphrec");
            Document result = db.runCommand(new Document("ping", 1));
            System.out.println("Connected successfully: " + result.toJson());
        } catch (Exception e) {
            System.out.println("Connection failed: " + e.getMessage());
        }
    }
}
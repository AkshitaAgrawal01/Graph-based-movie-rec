import mongoose from 'mongoose';

async function listDbs() {
  await mongoose.connect('mongodb://localhost:27017/graphrec');
  const db = mongoose.connection.client.db();
  const databasesList = await db.admin().listDatabases();
  
  for (const dbInfo of databasesList.databases) {
    console.log(`\nDB: ${dbInfo.name}`);
    const collections = await mongoose.connection.client.db(dbInfo.name).listCollections().toArray();
    for (const coll of collections) {
      if (coll.name === 'movies' || coll.name === 'movie') {
        const doc = await mongoose.connection.client.db(dbInfo.name).collection(coll.name).findOne({ posterPath: { $ne: null } });
        if (doc) {
          console.log(`Found a posterPath in ${dbInfo.name}.${coll.name}: ${doc.posterPath}`);
        }
        const doc2 = await mongoose.connection.client.db(dbInfo.name).collection(coll.name).findOne({ posterUrl: { $ne: null } });
        if (doc2) {
          console.log(`Found a posterUrl in ${dbInfo.name}.${coll.name}: ${doc2.posterUrl}`);
        }
      }
    }
  }
  mongoose.disconnect();
}
listDbs();

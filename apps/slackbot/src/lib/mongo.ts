const { MongoClient } = require("mongodb");
let client;

export async function getMongoClient() {
  if (client) return client;
  client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    console.log("Connected successfully to mongo server");
    return client;
  } catch (err) {
    console.error(err);
  }
}

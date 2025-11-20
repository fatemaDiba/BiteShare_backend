import { MongoClient, ServerApiVersion } from "mongodb";

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.r7pee.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    // await client.connect();
    // await client.db("Food-Share").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
    return client.db("Food-Share");
  } catch (error) {
    console.log("error", error);
  }
}

const getDB = () => {
  if (!client.db("Food-Share")) {
    console.log("No database found");
  }
  return client.db("Food-Share");
};

export { connectDB, getDB };

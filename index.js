const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const cors = require("cors");
const res = require("express/lib/response");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@mongo-first.eblwj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const partCollection = client.db("bitbybitmanufacture").collection("parts");
    app.get("/parts", async (req, res) => {
      const query = {};
      const cursor = partCollection.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Bit by Bit Manufacture");
});

app.listen(port, () => {
  console.log("Listening to PORT", port);
});

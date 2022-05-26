const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
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
    const reviewCollection = client
      .db("bitbybitmanufacture")
      .collection("reviews");
    const orderCollection = client
      .db("bitbybitmanufacture")
      .collection("orders");

    // Parts API
    app.get("/parts", async (req, res) => {
      const query = {};
      const cursor = partCollection.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });

    // Reviews API
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // Part API
    app.get("/part/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partCollection.findOne(query);
      res.send(part);
    });

    // get orders from server
    app.get("/orders", async (req, res) => {
      let query;
      if (req.query.email) {
        const tokenInfo = req.headers.authorization;
        const decoded = verifyToken(tokenInfo);
        const email = req.query.email;
        if (email === decoded.email) {
          query = { email: email };
          const cursor = await orderCollection.find(query);
          const orders = await cursor.toArray();
          res.send(orders);
        } else {
          res.send({ message: "Unauthorize access" });
        }
      } else {
        query = {};
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      }
    });

    app.post("/signin", (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
      res.send({ token });
    });

    // add orders in Server
    app.post("/orders", async (req, res) => {
      const orders = req.body;
      const order = await orderCollection.insertOne(orders);
      res.send(order);
    });

    // get order from server
    app.get("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    });

    // Delete single order
    app.delete("/order/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.deleteOne(query);
      res.send(order);
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

// Verify Token
function verifyToken(token) {
  let email;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      email = "Invalid email";
    }
    if (decoded) {
      email = decoded;
    }
  });
  return email;
}

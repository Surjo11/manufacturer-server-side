const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { request } = require("express");
require("dotenv").config();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// verifyToken
const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.send({ message: "Unauthorized access" });
  }
  const token = auth.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

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
    const userCollection = client.db("bitbybitmanufacture").collection("users");

    // Parts Get API
    app.get("/parts", async (req, res) => {
      const query = {};
      const cursor = partCollection.find(query);
      const parts = (await cursor.toArray()).reverse();
      res.send(parts);
    });
    // Parts Post API
    app.post("/parts", async (req, res) => {
      const parts = req.body;
      const result = await partCollection.insertOne(parts);
      res.send(result);
    });

    // Reviews GET API
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
    // Reviews POST API
    app.post("/reviews", async (req, res) => {
      const reviews = req.body;
      const result = await reviewCollection.insertOne(reviews);
      res.send(result);
    });

    // User PUT API
    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.send({ result, token });
    });
    // Admin API
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // Admin
    app.put("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Users GET API|
    app.get("/users", async (req, res) => {
      console.log(req.query.email);
      let query;
      if (req.query.email) {
        const email = req.query.email;
        query = { email: email };
        const user = await userCollection.findOne(query);
        res.send(user);
      } else {
        query = {};
        const user = await userCollection.find(query).toArray();
        res.send(user);
      }
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
      if (req.query.email) {
        const email = req.query.email;
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        const query = {};
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      }
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
    app.delete("/order/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const order = await orderCollection.deleteOne(filter);
      res.send(order);
    });

    app.delete("/part/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partCollection.deleteOne(query);
      res.send(part);
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

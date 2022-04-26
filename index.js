// Required files
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// create an app
const app = express();
const port = process.env.PORT || 5000;
// use middle ware
app.use(cors());
app.use(express.json());
//  auth verify function
function verifyJWT(req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.status(401).send({ message: "Unauthorized access request" });
  }
  const token = authHeaders.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    } else {
      console.log("deCoded", decoded);
      req.decoded = decoded;
      next();
    }
  });
}
// root route for testing API
app.get("/", (req, res) => {
  res.send("Running Genius service server");
});
// testing the server
app.get("/hero", (req, res) => {
  res.send("Hero meets to the Hero Ku");
});
app.listen(port, () => {
  console.log("Start listening to the Genius car service server", port);
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fgtpa.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("service");
    const orderCollection = client.db("geniusCar").collection("order");
    /* Authorization using Json Web Token */
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send(accessToken);
    });
    // Service collection API
    app.get("/service", async (req, res) => {
      const query = {};
      const data = serviceCollection.find(query);
      const services = await data.toArray();
      res.send(services);
    });
    // read service with dynamic value
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });
    // add service using post method
    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });
    // delete rest API
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    /*   =============  Order collection API===========*/
    // data get or read using get method
    app.get("/orders", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const userEmail = req.query.email;
      if (userEmail === decodedEmail) {
        const query = { email: userEmail };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      } else {
        return res.status(403).send({ message: "Forbidden Access" });
      }
    });
    // data post on the server using post method
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;


// middle ware:
app.use(cors());
app.use(express.json());

const varifyJWT = (req, res, next) => {
  const authrization = req.headers.authorization;

  if (!authrization) {
    return res.status(401).send({ error: true, message: "unauthorised Access" });
  }

  const token = authrization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: "unauthorised Access" })
    }
    req.decoded = decoded;
    next();
  })

}



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zyyhzcl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollections = client.db("foodHouseDB").collection("users");
    const menuCollections = client.db("foodHouseDB").collection("menu");
    const reviewsCollections = client.db("foodHouseDB").collection("reviews");
    const cartCollections = client.db("foodHouseDB").collection("carts");


    // --------jwt-------:
    // jwt token:
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "24hr"
      })
      res.send({ token })
    })


    // middle wire for verifyAdmin:
    const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email;
      const query = {email: email};
      const user = await usersCollections.findOne(query)
      if(user?.role !== "admin"){
        return res.status(403).send({error: true, message: "forbidded Access"});
      }
      next();
    }


    // users api

    // read add user
    app.get("/users", varifyJWT, verifyAdmin, async (req, res) => {
      const result = await usersCollections.find().toArray();
      return res.send(result);
    })

    // check admin :
    app.get("/users/admin/:email", varifyJWT, async(req,res)=>{
      const email = req.params.email;

      if(req.decoded.email !== email){
        res.send({admin: false});
      }

      const query = {email : email};
      const user = await usersCollections.findOne(query);
      const result = {admin: user?.role === "admin"};
      res.send(result);
    })

    // make admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }

      const updatedDoc = {
        $set: {
          role: "admin"
        },
      }

      const result = await usersCollections.updateOne(query, updatedDoc);
      res.send(result);

    })

    // delete user
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollections.deleteOne(query);
      res.send(result);
    })



    // adding user
    app.post("/users", async (req, res) => {
      const user = req.body;

      const query = { email: user.email };
      const existingUser = await usersCollections.findOne(query);

      if (existingUser) {
        return res.send({});
      }

      const result = await usersCollections.insertOne(user);
      res.send(result);

    });


    // menu api
    app.get("/menu", async (req, res) => {
      const result = await menuCollections.find({}).toArray();
      res.send(result);
    });

    // add item on menu:
    app.post("/menu", varifyJWT, verifyAdmin, async(req,res)=>{

      const item = req.body;
      const result = await menuCollections.insertOne(item);
      res.send(result);

    })

    // reviews api
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollections.find({}).toArray();
      res.send(result);
    })



    // carts colletions apis:
    // read from cart
    app.get("/carts", varifyJWT, async (req, res) => {

      const email = req.query.email;

      if (!email) {
        res.send([]);
      }

      const decodedEmail = req.decoded.email;
      if(email!==decodedEmail){
        return res.status(403).send({error: true, message:"forbidden Access"});
      }

      const query = { email: email };
      const result = await cartCollections.find(query).toArray();
      res.send(result);

    });

    // add to cart
    app.post("/carts", async (req, res) => {
      const item = req.body;
      const result = await cartCollections.insertOne(item);
      res.send(result);
    });

    // delete from cart
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollections.deleteOne(query);
      res.send(result);
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("food house network is running...");
})


app.listen(port, (req, res) => {
  console.log(`food house API is running on port: ${port}`);
})
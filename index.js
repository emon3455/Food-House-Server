const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;


// middle ware:
app.use(cors());
app.use(express.json());


app.get("/", (req,res)=>{
    res.send("food house network is running...");
})


app.listen(port, (req,res)=>{
    console.log(`food house API is running on port: ${port}`);
})

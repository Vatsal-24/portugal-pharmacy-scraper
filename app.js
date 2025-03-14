const express = require("express");
const cors = require("cors");
const fs = require("fs");
const extractData = require("./utils/extractData");


const app = express();
app.use(cors({ credentials: true }));

app.use(express.static(`${__dirname}`));
app.use(express.json());

const PORT = process.env.PORT || 5005;

app.get("/", (req, res) => {
  return res.json({ status: "Up and running"});
});


app.listen(PORT, () => console.log("Server started listening!"));

extractData();

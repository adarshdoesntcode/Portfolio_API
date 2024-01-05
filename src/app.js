const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../config.env") });

const express = require("express");
var cors = require("cors");
var bodyParser = require("body-parser");

const spotifyRouter = require("./routers/spotify");
const healthRouter = require("./routers/applehealth");
const notionRouter = require("./routers/notion");

require("./db/mongoose");

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.use(spotifyRouter);
app.use(healthRouter);
app.use(notionRouter);

module.exports = app;

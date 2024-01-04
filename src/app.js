const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../config.env") });

const express = require("express");

const spotifyRouter = require("./routers/spotify");

require("./db/mongoose");

const app = express();
app.use(spotifyRouter);

module.exports = app;

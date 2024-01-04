const express = require("express");
const spotifyRouter = new express.Router();

// -----------------CREATE TASK----------------

spotifyRouter.get("/spotify/get-player-state", async (req, res) => {
  try {
    res.status(200).send("result");
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = spotifyRouter;

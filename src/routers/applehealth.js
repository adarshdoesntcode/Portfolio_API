const express = require("express");

const healthRouter = new express.Router();

healthRouter.post("/health/steps", async (req, res) => {
  try {
    console.log(req.body);
    res.status(200).send("ok");
  } catch (error) {
    console.log(error);
  }
});

module.exports = healthRouter;

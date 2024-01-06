const express = require("express");
const { google } = require("googleapis");
const request = require("request");
const urlParser = require("url-parse");
const queryParser = require("query-string");
const axios = require("axios");

const healthRouter = new express.Router();

healthRouter.get("/health/steps", (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    "116157278106-vbbf6aqqmqct64gaep57v2lschdlsbec.apps.googleusercontent.com",
    "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",
    "https://adarshportfolio.cyclic.app/steps"
  );

  const scopes = ["https://www.googleapis.com/auth/fitness.activity.read"];

  const url = oauth2Client.generateAuthUrl({
    access_type: "online",
    scope: scopes,
    state: JSON.stringify({
      callbackUrl: req.body.callbackUrl,
      userID: req.body.userid,
    }),
  });

  request(url, (err, response, body) => {
    console.log("errror", err);
    console.log("statusCode :", response && response.statusCode);
    res.send({ url });
  });
});

healthRouter.get("/steps", async (req, res) => {
  const queryURL = new urlParser(req.url);
  const code = queryParser.parse(queryURL.query).code;
  const oauth2Client = new google.auth.OAuth2(
    "116157278106-vbbf6aqqmqct64gaep57v2lschdlsbec.apps.googleusercontent.com",
    "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",
    "https://adarshportfolio.cyclic.app/steps"
  );

  const tokens = oauth2Client.getToken(code);
  console.log(tokens);
  res.send("ok");
  // try {
  //   console.log(req.body);
  //   res.status(200).send("ok");
  // } catch (error) {
  //   console.log(error);
  // }
});

module.exports = healthRouter;

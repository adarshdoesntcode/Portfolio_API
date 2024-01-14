const express = require("express");

const client = require("../db/redis");
const stravaRouter = new express.Router();

const getTokens = async (req, res, next) => {
  let STRAVA_ACCESS_TOKEN = await client.get("STRAVA_ACCESS_TOKEN");

  if (!STRAVA_ACCESS_TOKEN) {
    STRAVA_ACCESS_TOKEN = await refreshToken();
  }
  res.locals.STRAVA_ACCESS_TOKEN = STRAVA_ACCESS_TOKEN;
  res.locals.STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;
  next();
};

stravaRouter.post("/strava/get-activities", getTokens, async (req, res) => {
  try {
    const response = await fetch(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + res.locals.STRAVA_ACCESS_TOKEN,
        },
      }
    );

    if (response.status !== 401) {
      const data = await response.json();

      await client.hset("STRAVA_DATA", {
        distance: data[0].distance,
        moving_time: data[0].moving_time,
        type: data[0].type,
        average_speed: data[0].average_speed,
        start_date_local: data[0].start_date_local,
      });

      res.status(200).json({
        distance: data[0].distance,
        moving_time: data[0].moving_time,
        type: data[0].type,
        average_speed: data[0].average_speed,
        start_date_local: data[0].start_date_local,
      });
    }
  } catch (e) {
    console.log(e);
  }
});

stravaRouter.get("/strava/get-activities", async (req, res) => {
  try {
    const data = await client.hgetall("STRAVA_DATA");
    res.status(200).json(data);
  } catch (error) {
    console.log(error);
  }
});

const refreshToken = async () => {
  let accessToken;
  try {
    const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_id=${process.env.STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${process.env.STRAVA_REFRESH_TOKEN}`,
    });
    const data = await response.json();

    accessToken = data.access_token;
    await client.set(
      "STRAVA_ACCESS_TOKEN",
      data.access_token,
      "EX",
      data.expires_in - 5
    );
    process.env.STRAVA_REFRESH_TOKEN = data.refresh_token;
  } catch (error) {
    console.log(error);
  } finally {
    return accessToken;
  }
};
module.exports = stravaRouter;

const express = require("express");
const request = require("request");
const stravaRouter = new express.Router();

stravaRouter.get("/strava/get-activities", async (req, res) => {
  try {
    const response = await fetch(
      "https://www.strava.com/api/v3/athlete/activities",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + process.env.STRAVA_ACCESS_TOKEN,
        },
      }
    );

    if (response.status === 401) {
      res.redirect("/strava/refresh-token");
    }

    if (response.status !== 401) {
      const data = await response.json();

      res.status(200).json({
        distance: data[0].distance,
        moving_time: data[0].moving_time,
        type: data[0].type,
        kilojoules: data[0].kilojoules,
        average_speed: data[0].average_speed,
        max_speed: data[0].max_speed,
        start_date_local: data[0].start_date_local,
      });
    }
  } catch (e) {
    console.log(e);
  }
});

stravaRouter.get("/strava/refresh-token", async (req, res) => {
  try {
    const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
      body: `client_id=${process.env.STRAVA_CLIENT_ID}&client_secret=${process.env.STRAVA_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${process.env.STRAVA_REFRESH_TOKEN}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });
    const data = await response.json();

    process.env.STRAVA_REFRESH_TOKEN = data.refresh_token;
    process.env.STRAVA_ACCESS_TOKEN = data.access_token;

    res.redirect("/strava/get-activities");
  } catch (error) {
    console.log(error);
  }
});

module.exports = stravaRouter;

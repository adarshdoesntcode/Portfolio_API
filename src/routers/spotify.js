const express = require("express");
const request = require("request");
const Redis = require("ioredis");

const spotifyRouter = new express.Router();

const client = new Redis(process.env.REDIS_URL);
let SPOTIFY_ACCESS_TOKEN;
let SPOTIFY_REFRESH_TOKEN;

const tokens = async () => {
  SPOTIFY_ACCESS_TOKEN = await client.get("SPOTIFY_ACCESS_TOKEN");
  SPOTIFY_REFRESH_TOKEN = await client.get("SPOTIFY_REFRESH_TOKEN");

  console.log(SPOTIFY_ACCESS_TOKEN);
};

tokens();

spotifyRouter.get("/spotify/get-player-state", async (req, res) => {
  console.log("getting player state");
  // console.log("first access token", process.env.ACCESS_TOKEN);
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + SPOTIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 401) {
      res.redirect("/spotify/refresh-token");
    }

    if (response.status === 204) {
      res.redirect("/spotify/recently-played");
    }

    if (response.status !== 401 && response.status !== 204) {
      const data = await response.json();
      if (data.currently_playing_type === "episode") {
        res.redirect("/spotify/recently-played");
      } else {
        res.status(200).send({
          trackTitle: data.item.name,
          artists: data.item.artists.map((artist) => artist.name),
          trackLink: data.item.external_urls.spotify,
          isPlaying: true,
          trackAudio: data.item.preview_url,
          status: 200,
        });
      }
    }
  } catch (e) {
    console.log(e);
  }
});

spotifyRouter.get("/spotify/recently-played", async (req, res) => {
  console.log("recently played");
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + SPOTIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    const recentTrack = data.items[0].track;
    res.status(200).json({
      trackTitle: recentTrack.name,
      artists: recentTrack.artists.map((artist) => artist.name),
      trackLink: recentTrack.external_urls.spotify,
      trackAudio: recentTrack.preview_url,
      isPlaying: false,
      status: 200,
    });
  } catch (error) {
    console.log(error);
  }
});

spotifyRouter.get("/spotify/refresh-token", function (req, res) {
  console.log("refreshing token routee");

  console.log(req.headers["user-agent"]);
  console.log(req.headers["accept"]);

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      method: "POST",
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(
          process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET_ID
        ).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    },
    json: true,
  };

  request.post(authOptions, async function (error, response, body) {
    if (!error && response.statusCode === 200) {
      process.env.ACCESS_TOKEN = body.access_token;
      await client.set("SPOTIFY_ACCESS_TOKEN", body.access_token);
      if (req.headers["x-cyclic"] !== "cron") {
        res.redirect("/spotify/get-player-state");
      } else {
        res.status(200);
      }
    }
  });
});

module.exports = spotifyRouter;

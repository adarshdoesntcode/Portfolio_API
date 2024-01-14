const express = require("express");
const request = require("request");
const Redis = require("ioredis");

const spotifyRouter = new express.Router();

const client = new Redis(process.env.REDIS_URL);

const getTokens = async (req, res, next) => {
  let SPOTIFY_ACCESS_TOKEN = await client.get("SPOTIFY_ACCESS_TOKEN");

  if (!SPOTIFY_ACCESS_TOKEN) {
    SPOTIFY_ACCESS_TOKEN = await refreshToken();
  }
  res.locals.SPOTIFY_ACCESS_TOKEN = SPOTIFY_ACCESS_TOKEN;
  next();
};

spotifyRouter.get("/spotify/get-player-state", getTokens, async (req, res) => {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + res.locals.SPOTIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status === 204) {
      console.log("204");
      res.redirect("/spotify/recently-played");
    }

    if (response.status !== 204) {
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

spotifyRouter.get("/spotify/recently-played", getTokens, async (req, res) => {
  try {
    const response = await fetch(
      "https://api.spotify.com/v1/me/player/recently-played",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + res.locals.SPOTIFY_ACCESS_TOKEN,
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

const refreshToken = async () => {
  let accessToken;

  const authOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.CLIENT_ID + ":" + process.env.CLIENT_SECRET_ID
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.REFRESH_TOKEN,
    }),
  };

  try {
    const response = await fetch(
      "https://accounts.spotify.com/api/token",
      authOptions
    );
    const body = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${body.error}`);
    }

    accessToken = body.access_token;
    await client.set(
      "SPOTIFY_ACCESS_TOKEN",
      body.access_token,
      "EX",
      body.expires_in - 5
    );
  } catch (error) {
    console.error("Error refreshing token:", error.message);
  }

  return accessToken;
};

refreshToken();

module.exports = spotifyRouter;

const express = require("express");
const client = require("../db/redis");

const spotifyRouter = new express.Router();

const getTokens = async (req, res, next) => {
  let SPOTIFY_ACCESS_TOKEN = await client.get("SPOTIFY_ACCESS_TOKEN");

  if (!SPOTIFY_ACCESS_TOKEN) {
    SPOTIFY_ACCESS_TOKEN = await refreshToken();
  }
  res.locals.SPOTIFY_ACCESS_TOKEN = SPOTIFY_ACCESS_TOKEN;
  next();
};

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

const fetchSpotify = async (URL, TOKEN) => {
  let response;
  try {
    response = await fetch(URL, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + TOKEN,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    return response;
  }
};

spotifyRouter.get("/spotify/get-player-state", getTokens, async (req, res) => {
  let responseData;
  let current_response;
  let recent_response;
  try {
    current_response = await fetchSpotify(
      "https://api.spotify.com/v1/me/player/currently-playing",
      res.locals.SPOTIFY_ACCESS_TOKEN
    );

    if (current_response.status === 204) {
      recent_response = await fetchSpotify(
        "https://api.spotify.com/v1/me/player/recently-played",
        res.locals.SPOTIFY_ACCESS_TOKEN
      );
      const data = await recent_response.json();
      const recentTrack = data.items[0].track;

      responseData = {
        trackTitle: recentTrack.name,
        artists: recentTrack.artists.map((artist) => artist.name),
        trackLink: recentTrack.external_urls.spotify,
        trackAudio: recentTrack.preview_url,
        trackImage: recentTrack.album.images[0],
        isPlaying: false,
        status: 200,
      };
    }

    if (current_response.status !== 204) {
      const data = await current_response.json();

      if (data.currently_playing_type === "episode") {
        recent_response = await fetchSpotify(
          "https://api.spotify.com/v1/me/player/recently-played",
          res.locals.SPOTIFY_ACCESS_TOKEN
        );
        const data = await recent_response.json();
        const recentTrack = data.items[0].track;
        responseData = {
          trackTitle: recentTrack.name,
          artists: recentTrack.artists.map((artist) => artist.name),
          trackLink: recentTrack.external_urls.spotify,
          trackAudio: recentTrack.preview_url,
          trackImage: recentTrack.album.images,

          isPlaying: false,
          status: 200,
        };
      } else {
        responseData = {
          trackTitle: data.item.name,
          artists: data.item.artists.map((artist) => artist.name),
          trackLink: data.item.external_urls.spotify,
          isPlaying: true,
          trackAudio: data.item.preview_url,
          trackImage: data.item.album.images[0],
          status: 200,
        };
      }
    }
  } catch (e) {
    console.log(e);
  } finally {
    res.status(200).send(responseData);
  }
});

module.exports = spotifyRouter;

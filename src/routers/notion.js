const express = require("express");
const { Client } = require("@notionhq/client");

const notionRouter = new express.Router();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

notionRouter.get("/notion/currently-reading", async (req, res) => {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: "Status",
        status: {
          equals: "Reading",
        },
      },
      sorts: [
        {
          timestamp: "last_edited_time",
          direction: "descending",
        },
      ],
    });

    if (response.results.length === 0) {
      res.status(404).json({
        status: "Not Found",
      });
    } else {
      const data = response.results[0].properties;
      res.status(200).json({
        status: "success",
        bookTitle: data["Name"].title[0].plain_text,
        bookAuthor: data["Author"].rich_text[0].plain_text,
        totalPages: data["Total Pages"].number,
        currentPage: data["Current Page"].number,
        coverUrl: data["Cover"].files[0].external.url,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

module.exports = notionRouter;

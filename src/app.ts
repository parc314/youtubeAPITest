import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import { Client } from "pg";
const nodeCron = require("node-cron");
const axios = require('axios');
const moment = require('moment');
const { decode } = require('url-encode-decode');


const app = express();
dotenv.config(); //Reads .env file and makes it accessible via process.env

const client = new Client({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432")
});

const createTableQuery = `
CREATE TABLE videos (
  id  SERIAL PRIMARY KEY,  
  title varchar,
  description varchar,
  publishedAt varchar,
  thumbnailUrl varchar
);
`;

// connect to database and create table
const connectToDB = async () => {
  try {
    await client.connect();
    await client.query(createTableQuery);
    console.log('Table is successfully created');
  } catch (err) {
    console.log(err);
  }
};
connectToDB();


// get all videos. Sample endpoint - http://localhost:5000/get/videos?pageNumber=2&pageSize=20
app.get("/get/videos", async (req: Request, res: Response, next: NextFunction) => {
    const pageNumber = req.query.pageNumber || 1;
    const pageSize = req.query.pageSize || 10;
    const getVideosQuery = `
    SELECT *
    FROM videos
    ORDER BY publishedat DESC
    OFFSET ${pageNumber}
    LIMIT ${pageSize}
    `;
    try{
        const response = await client.query(getVideosQuery);
        res.send({
            data: response.rows,
            pageNumber,
            pageSize
        });
    } catch(err) {
        console.log(err);
    }
});

// get a video with title and description in request. Make sure the url is encoded
app.get("/get/video", async (req: Request, res: Response, next: NextFunction) => {
  const getVideoWithParam = `
  SELECT *
  FROM videos WHERE title='${decode(req.query.title)}' AND description='${decode(req.query.description)}'
  `;
  try{
        const response = await client.query(getVideoWithParam);
        res.send(response.rows);
    } catch(err) {
        console.log(err);
    }
});


let apiKeys = process.env.API_KEY?.split(" ")
let apiKeyIndex = 0;

// fetch video using youtube api and insert into our table
const searchVideos = async () => {
  try {
    let res = await axios.get(`https://www.googleapis.com/youtube/v3/search?order=date&type=video&key=${apiKeys?.[apiKeyIndex]}&publishedAfter=${moment().subtract(6, 'h').format("YYYY-MM-DD[T]HH:mm[:00Z]")}&q=cricket&part=snippet`)
    let publishedAt = '', title = '', description = '', thumbnails = '';
    console.log(res.data.items)
    for (let item of res.data.items) {
      publishedAt = item.snippet.publishedAt;
      title = item.snippet.title;
      description = item.snippet.description;
      thumbnails = item.snippet.thumbnails.default.url;

      const insertVideoQuery = `
      INSERT INTO videos (title, description, publishedAt, thumbnailUrl)
      VALUES ('${title}', '${description}', '${publishedAt}', '${thumbnails}')
      `;
      console.log(insertVideoQuery)
      try {
        await client.query(insertVideoQuery);
      } catch (err) {
        console.log(err);
        continue;
      }
      console.log('Data insert successful');
    }
  } catch (err) {
    console.log(err);
    apiKeyIndex++; // move to next api key
  }
};

// cron job which calls the searchVideos function every 10 sec
const job = nodeCron.schedule("*/10 * * * * *", searchVideos);

app.listen(process.env.PORT, () => {
  console.log(`Server is running at ${process.env.PORT}`);
});

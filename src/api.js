
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const { Client } = require('pg');

const app = express();
app.use(cors());


app.use(express.json()); // For JSON data


const router = express.Router();
const { Send, getMail,addService,getService,addBlog,getBlogs } = require('../controller/appController.js');
router.post('/sendEmail', Send);
router.get('/getAllEmails', getMail);
router.post('/addService', addService);
router.get('/getService', getService);
router.post('/addBlog', addBlog);
router.get('/getBlog', getBlogs);
app.use('/.netlify/functions/api', router);

// Close the database connection when the app shuts down
process.on('SIGINT', async () => {
  try {
    console.log("Closing the database connection.");
    await client.end();
    process.exit();
  } catch (err) {
    console.error("Error closing the database connection:", err);
    process.exit(1);
  }
});


module.exports.handler = serverless(app);

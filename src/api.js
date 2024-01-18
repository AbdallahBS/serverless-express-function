
const express= require('express');
const serverless  = require('serverless-http');
const app = express();
const pool  = require("../db.js");
const router = express.Router();
const { Send,getMail }= require('../controller/appController.js');
app.use(express.json()); // For JSON data



router.post('/sendEmail',Send);
router.get('/getAllEmails',getMail)

app.use('/.netlify/functions/api',router);
module.exports.handler = serverless(app);



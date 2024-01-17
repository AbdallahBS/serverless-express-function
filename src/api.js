
const express= require('express');
const serverless  = require('serverless-http');
const app = express();
const router = express.Router();
const { Send }= require('../controller/appController.js');

router.post('/sendEmail',Send);

app.use('/.netlify/functions/api',router);
module.exports.handler = serverless(app);



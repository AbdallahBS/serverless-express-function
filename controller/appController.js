const db = require('../db.js');
const nodemailer = require('nodemailer');
const { Client } = require('pg');

const createTable = async () => {
 
    const client = db.getClient();

  try {
    await client.connect();

    const query = `
      CREATE TABLE IF NOT EXISTS emails (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        subject VARCHAR(255) NOT NULL
      );
    `;

    await client.query(query);
    console.log('Table "emails" created successfully');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await client.end();
  }
};

const Send = async (req,res)=>{
    
    const {email,text,subject} = req.body
    console.log(req.body)
    const client = db.getClient();
    try {
      await client.connect();
      const insertQuery = `
        INSERT INTO emails (email, text, subject) VALUES ($1, $2, $3) RETURNING id;
      `;
      const values = [email, text, subject];
      const result = await client.query(insertQuery, values);
      console.log(`Email inserted with ID: ${result.rows[0].id}`);
    let testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      let message = {
        from: email,
        to: "abensalem@gmail.com",
        subject: subject,
        text: text,
        html: "<b>this the body of the email</b>", 
      }
      transporter.sendMail(message).then((info)=>{
        return res.status(201).json({msg :"your email was sending succesfully",
                                    info : info.messageId,
                                    preview :nodemailer.getTestMessageUrl(info)});
      }).catch(error =>{
        return res.status(500).json({error});
      })
    } catch (error) {
      console.error('Error inserting email details:', error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      await client.end();
    }
  };

  const getMail = async (req, res) => {
    let client;
    try {
      // Create a new connection to the database for each request
      client = new Client({
        connectionString: "postgresql://abdallah:lmv1Px24z_r8Mu4Sa7L6sA@crab-forager-8531.7tc.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full",
        ssl: {
          rejectUnauthorized: false,
        },
      });
  
      await client.connect();
  
      // Retrieve all emails from the "emails" table
      const selectQuery = 'SELECT * FROM emails';
      const result = await client.query(selectQuery);
  
      const emailData = result.rows.map(row => ({
        email: row.email,
        subject: row.subject,
        text: row.text
      }));
  
      res.status(200).json({ emailData });
    } catch (error) {
      console.error('Error retrieving emails:', error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      if (client) {
        try {
          await client.end();
        } catch (endError) {
          console.error('Error closing the database connection:', endError);
        }
      }
    }
  };
  
  
module.exports = {
    Send,getMail,createTable
}


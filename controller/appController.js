const db = require('../db.js');
const nodemailer = require('nodemailer');
const { Client } = require('pg');

const createTable = async () => {
 
    const client = db.getClient();

  try {
    await client.connect();

    const query = `
     CREATE TABLE IF NOT EXISTS technologies (
        id SERIAL PRIMARY KEY,
        image TEXT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL
      );
    `;

    await client.query(query);
    console.log('Table "technologies" created successfully');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    await client.end();
  }
};
const createServicesTable = async () => {
  const client = db.getClient();

  try {
    await client.connect();

    const query = `
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        nom_du_service VARCHAR(255) NOT NULL,
        description TEXT
      );
    `;

    await client.query(query);
    console.log('Table "services" created successfully');
  } catch (error) {
    console.error('Error creating "services" table:', error);
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
  const addService = async (req, res) => {
    const { nom_du_service, description } = req.body;
  
    // Validate the request body
    if (!nom_du_service || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const client = new Client({
      connectionString: "postgresql://abdallah:lmv1Px24z_r8Mu4Sa7L6sA@crab-forager-8531.7tc.aws-eu-central-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full",
      ssl: {
        rejectUnauthorized: false,
      },
    });
  
    try {
      await client.connect();
  
      // Insert the new service into the "services" table
      const insertQuery = `
        INSERT INTO services (nom_du_service, description) VALUES ($1, $2) RETURNING id;
      `;
      const values = [nom_du_service, description];
      const result = await client.query(insertQuery, values);
  
      console.log(`Service inserted with ID: ${result.rows[0].id}`);
  
      return res.status(201).json({
        msg: 'Service added successfully',
        serviceId: result.rows[0].id,
      });
    } catch (error) {
      console.error('Error adding service:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  };
  const getService = async (req, res) => {
    const client = db.getClient();
  
    try {
      await client.connect();
  
      const selectQuery = 'SELECT nom_du_service, description FROM services';
      const result = await client.query(selectQuery);
  
      const serviceData = result.rows.map(row => ({
        nom_du_service: row.nom_du_service,
        description: row.description,
      }));
  
      res.status(200).json({ serviceData });
    } catch (error) {
      console.error('Error retrieving services:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  };
  const addBlog = async (req, res) => {
    const { image, title, content } = req.body;
  
    // Validate the request body
    if (!image || !title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    const client = db.getClient();
  
    try {
      await client.connect();
  
      // Insert the new blog into the "blogs" table
      const insertQuery = `
        INSERT INTO blogs (image_data, title, content) VALUES ($1, $2, $3) RETURNING id;
      `;
      const values = [image, title, content];
      const result = await client.query(insertQuery, values);
  
      console.log(`Blog added with ID: ${result.rows[0].id}`);
  
      return res.status(201).json({
        msg: 'Blog added successfully',
        blogId: result.rows[0].id,
      });
    } catch (error) {
      console.error('Error adding blog:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  };
  const getBlogs = async (req, res) => {
    const client = db.getClient();
  
    try {
      await client.connect();
  
      const selectQuery = 'SELECT title, image_data, content FROM blogs';
      const result = await client.query(selectQuery);
  
      const blogPosts = result.rows.map(row => ({
        name: row.title,
        image: row.image_data,
        content: row.content,
      }));
  
      res.status(200).json({ blogPosts });
    } catch (error) {
      console.error('Error retrieving blog posts:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      // Use end() instead of release() if getClient() doesn't return a client with release()
      await client.end();
    }
  };
  const addTechno = async (req,res) => {
    const client = db.getClient();
    const {title, image, description}=req.body
    try {
      await client.connect();
  
      const insertQuery = `
        INSERT INTO technologies (title, image, description) VALUES ($1, $2, $3) RETURNING id;
      `;
      const values = [title, image, description];
      const result = await client.query(insertQuery, values);
  
      console.log(`Technology added with ID: ${result.rows[0].id}`);
  
      res.status(201).json({
        msg: 'Technology added successfully',
        technologyId: result.rows[0].id,
      });
    } catch (error) {
      console.error('Error adding technology:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  };
  const getAllTechnos = async (req, res) => {
    const client = db.getClient();
  
    try {
      await client.connect();
  
      const query = `
        SELECT * FROM technologies;
      `;
      const result = await client.query(query);
  
      const technologies = result.rows;
  
      res.status(200).json(technologies);
    } catch (error) {
      console.error('Error getting technologies:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  };
module.exports = {
    Send,getMail,addService,getService,addBlog,getBlogs,createTable,addTechno,getAllTechnos
}


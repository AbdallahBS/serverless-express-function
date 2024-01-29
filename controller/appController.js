const db = require('../db.js');
const nodemailer = require('nodemailer');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const createTable = async () => {
  console.log("runnnnn")
    const client = db.getClient();

  try {
    await client.connect();

    const query =`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255),
      password VARCHAR(255),
      email VARCHAR(255),
      firstname VARCHAR(255),
      lastname VARCHAR(255),
      mobile VARCHAR(20),
      address TEXT,
      profile TEXT
    );
    `;

    await client.query(query);
    console.log('Table "users" created successfully');
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
        id :row.id,
        email: row.email,
        subject: row.subject,
        text: row.text,
        time:row.published_at
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
  const deleteMail = async (req, res) => {
    const { id } = req.body;
  
    // Validate the request body
    if (!id) {
        return res.status(400).json({ error: 'Invalid request body' });
    }
  
    const client = db.getClient();
  
    try {
        await client.connect();
  

        const checkEmailQuery = 'SELECT * FROM emails WHERE id = $1;';
        const checkEmailValues = [id];
        const checkEmailResult = await client.query(checkEmailQuery, checkEmailValues);
  
        if (checkEmailResult.rows.length === 0) {
            return res.status(404).json({ error: 'email not found' });
        }
  
      
        const deleteQuery = 'DELETE FROM emails WHERE id = $1 RETURNING id;';
        const deleteValues = [id];
        const deleteResult = await client.query(deleteQuery, deleteValues);
  
        console.log(`email deleted with ID: ${deleteResult.rows[0].id}`);
  
        return res.status(200).json({
            msg: 'email deleted successfully',
            id: deleteResult.rows[0].id,
        });
    } catch (error) {
        console.error('Error deleting email:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.end();
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
  
      const selectQuery = 'SELECT * FROM blogs';
      const result = await client.query(selectQuery);
  
      const blogPosts = result.rows.map(row => ({
        id : row.id,
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
  const modifyBlog = async (req, res) => {
    const { id, image, name, content } = req.body;
   
    console.log("hmmmm",id,name,content)
    const blogId = id
    // Validate the request body
    if (!blogId || (!image && !name && content === undefined)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const client = db.getClient();

    try {
        await client.connect();

        // Check if the blog with the given ID exists
        const checkBlogQuery = `
            SELECT * FROM blogs WHERE id = $1;
        `;
        const checkBlogValues = [blogId];
        const checkBlogResult = await client.query(checkBlogQuery, checkBlogValues);

        if (checkBlogResult.rows.length === 0) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // Update the existing blog in the "blogs" table
        const updateQuery = `
            UPDATE blogs SET 
                image_data = COALESCE($2, image_data),
                title = COALESCE($3, title),
                content = COALESCE($4, content)
            WHERE id = $1
            RETURNING id;
        `;

        const updateValues = [blogId, image, name, content];
        const updateResult = await client.query(updateQuery, updateValues);

        console.log(`Blog modified with ID: ${updateResult.rows[0].id}`);

        return res.status(200).json({
            msg: 'Blog modified successfully',
            blogId: updateResult.rows[0].id,
        });
    } catch (error) {
        console.error('Error modifying blog:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.end();
    }
};
const deleteBlog = async (req, res) => {
  const { id } = req.body;
  blogId=id;
  console.log(id);
  // Validate the request body
  if (!blogId) {
      return res.status(400).json({ error: 'Invalid request body' });
  }

  const client = db.getClient();

  try {
      await client.connect();

      // Check if the blog with the given ID exists
      const checkBlogQuery = 'SELECT * FROM blogs WHERE id = $1;';
      const checkBlogValues = [blogId];
      const checkBlogResult = await client.query(checkBlogQuery, checkBlogValues);

      if (checkBlogResult.rows.length === 0) {
          return res.status(404).json({ error: 'Blog not found' });
      }

      // Delete the blog from the "blogs" table
      const deleteQuery = 'DELETE FROM blogs WHERE id = $1 RETURNING id;';
      const deleteValues = [blogId];
      const deleteResult = await client.query(deleteQuery, deleteValues);

      console.log(`Blog deleted with ID: ${deleteResult.rows[0].id}`);

      return res.status(200).json({
          msg: 'Blog deleted successfully',
          blogId: deleteResult.rows[0].id,
      });
  } catch (error) {
      console.error('Error deleting blog:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
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
  const modifyTechno = async (req, res) => {
    const { technoId, image,title, description } = req.body;
    console.log(technoId,image,title, description)
    // Validate the request body
    if (!technoId || (!title && !description && !image)) {
        return res.status(400).json({ error: 'Invalid request body' });
    }

    const client = db.getClient();

    try {
        await client.connect();

        // Check if the technology with the given ID exists
        const checkTechnoQuery = 'SELECT * FROM technologies WHERE id = $1;';
        const checkTechnoValues = [technoId];
        const checkTechnoResult = await client.query(checkTechnoQuery, checkTechnoValues);

        if (checkTechnoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Technology not found' });
        }

        // Update the existing technology in the "technologies" table
        const updateQuery = `
            UPDATE technologies SET 
                title = COALESCE($2, title),
                description = COALESCE($3, description),
                image = COALESCE($4, image)
            WHERE id = $1
            RETURNING id;
        `;

        const updateValues = [technoId, title, description,image];
        const updateResult = await client.query(updateQuery, updateValues);

        console.log(`Technology modified with ID: ${updateResult.rows[0].id}`);

        return res.status(200).json({
            msg: 'Technology modified successfully',
            technoId: updateResult.rows[0].id,
        });
    } catch (error) {
        console.error('Error modifying technology:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.end();
    }
};
const deleteTechno = async (req, res) => {
  const { technoId } = req.body;

  // Validate the request body
  if (!technoId) {
      return res.status(400).json({ error: 'Invalid request body' });
  }

  const client = db.getClient();

  try {
      await client.connect();

      // Check if the technology with the given ID exists
      const checkTechnoQuery = 'SELECT * FROM technologies WHERE id = $1;';
      const checkTechnoValues = [technoId];
      const checkTechnoResult = await client.query(checkTechnoQuery, checkTechnoValues);

      if (checkTechnoResult.rows.length === 0) {
          return res.status(404).json({ error: 'Technology not found' });
      }

      // Delete the technology from the "technologies" table
      const deleteQuery = 'DELETE FROM technologies WHERE id = $1 RETURNING id;';
      const deleteValues = [technoId];
      const deleteResult = await client.query(deleteQuery, deleteValues);

      console.log(`Technology deleted with ID: ${deleteResult.rows[0].id}`);

      return res.status(200).json({
          msg: 'Technology deleted successfully',
          technoId: deleteResult.rows[0].id,
      });
  } catch (error) {
      console.error('Error deleting technology:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  } finally {
      await client.end();
  }
};
    const addQ = async (req,res) => {
    const client = db.getClient();
    const {question, answer}=req.body
    try {
      await client.connect();
  
      const insertQuery = `
        INSERT INTO faq (question,answer) VALUES ($1, $2) RETURNING id;
      `;
      const values = [question, answer];
      const result = await client.query(insertQuery, values);
  
      console.log(`faq added with ID: ${result.rows[0].id}`);
  
      res.status(201).json({
        msg: 'question added successfully',
        technologyId: result.rows[0].id,
      });
    } catch (error) {
      console.error('Error adding question :', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  };
  const getQ = async (req, res) => {
    const client = db.getClient();
  
    try {
      await client.connect();
  
      const query = `
        SELECT * FROM faq;
      `;
      const result = await client.query(query);
  
      const faq = result.rows;
  
      res.status(200).json(faq);
    } catch (error) {
      console.error('Error getting faq:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.end();
    }
  };
  
const verifyUser = async (req,res,next)=>{
  const client = db.getClient();
  try{
      await client.connect();
      const {username} = req.method == "GET" ? req.query : req.body;
  
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await client.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(404).send({ error: "Can't find user" });
        }
        next();
  }
  catch(error){
      return res.status(404).send({error : "Authentication Error"});
  } finally {
    await client.end();
  }
}

const register = async(req,res)=>{
  const client = db.getClient();
  try {
    await client.connect();
      const { username, password, profile, email } = req.body;        

      // check the existing user
      const existingUsernameQuery = 'SELECT * FROM users WHERE username = $1';
      const existingUsernameResult = await client.query(existingUsernameQuery, [username]);
  
      if (existingUsernameResult.rows.length > 0) {
        return res.status(400).send({ error: "Please use a unique username" });
      }

// check for existing email
const existingEmailQuery = 'SELECT * FROM users WHERE email = $1';
const existingEmailResult = await client.query(existingEmailQuery, [email]);

if (existingEmailResult.rows.length > 0) {
  return res.status(400).send({ error: "Please use a unique email" });
}

//hashed password 
const hashedPassword = await bcrypt.hash(password, 10);

const createUserQuery = 'INSERT INTO users (username, password, profile, email) VALUES ($1, $2, $3, $4)';
await client.query(createUserQuery, [username, hashedPassword, profile || '', email]);
 return res.status(201).send({ msg: "User Registered Successfully" })

  } catch (error) {
      return res.status(500).send(error);
  }
}

const login = async(req, res)=> {
  const client = db.getClient();
  const { username, password } = req.body;
  console.log(username,password);
  await client.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length === 0) {
      return res.status(404).send({ error: "Username not found" });
    }
      const user = result.rows[0];
      const passwordCheck = await bcrypt.compare(password, user.password);

      if (!passwordCheck) {
          return res.status(400).send({ error: "Incorrect password" });
      }
      
      // JWT token
      const token = jwt.sign({
          userid: user._id,
          username: user.username
      }, "it9R9xOW3hULK96NXLjyMSnS6c+UtSYb78JGYFGJPGE=", { expiresIn: "24h" });

      return res.status(200).send({
          msg: "Login successful",
          username: user.username,
          token
      });
  } catch (error) {
      console.error('Error in login:', error);
      return res.status(500).send({ error: "Internal Server Error" });
  }
}

const getUser=async(req, res)=> {
  const { username } = req.params;
  const client = db.getClient();
  try {
    await client.connect();
    console.log(username);
      if (!username) {
          return res.status(400).send({ error: "Invalid Username" });
      }

      const getUserQuery = 'SELECT * FROM users WHERE username = $1';
      const getUserResult = await client.query(getUserQuery, [username]);
  
      if (getUserResult.rows.length === 0) {
        return res.status(404).send({ error: "Couldn't find the user" });
      }
      console.log('user exist');
      // Remove password from user
      const { password, ...rest } = getUserResult.rows[0];

      return res.status(200).send(rest);
  } catch (error) {
      console.error('Error in getUser:', error);
      return res.status(500).send({ error: "Internal Server Error" });
  }
}

module.exports = {
  Send,getMail,deleteMail,addService,getService,addBlog,getBlogs,modifyBlog,deleteBlog,createTable,addTechno,getAllTechnos, modifyTechno,deleteTechno,addQ,getQ,register, verifyUser, login, getUser
  
}
//getUser,verifyUser,login,register


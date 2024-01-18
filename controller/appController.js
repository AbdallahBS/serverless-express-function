

const nodemailer = require('nodemailer');
const pool = require('../db');

const Send = async (req,res)=>{
    console.log(req.body);
    const {email,text,subject} = req.body
    try{
    const newEmail = await pool.query("INSERT INTO email (email, text, subject) VALUES ($1, $2, $3)",
    [email,text,subject]);console.log(email,text,subject)}
    
    catch(error){
      console.log("this",error);
    }
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
}
const getMail = async (req,res)=>{
  const emails = await pool.query("SELECT * FROM email");
  const emailData = [];
  for (const row of emails.rows) {
  emailData.push(`Email: ${row.email}----Subject: ${row.subject}----Text: ${row.text}\n\n`); // Adjust formatting as needed
}
  return res.status(201).json({emailData});
}
module.exports = {
    Send,getMail
}


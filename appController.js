
const nodemailer = require('nodemailer');

const Send = async (req,res)=>{
    const {email , text,subject} = req.body
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
module.exports = {
    Send,
}
const nodemailer = require('nodemailer');
const SendmailTransport = require('nodemailer/lib/sendmail-transport');

const sendEmail = async (subject, message, send_to, send_from, reply_to) =>{
  // Transporter for sending email..
  const result = false;
  const transporter = nodemailer.createTransport({
   host: process.env.EMAIL_HOST,
   post: 587,
   auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
   },
   tls: {
    rejectUnauthorized: false
   }
  })

  //Options for sending mail...

  const option = {
   from: send_from,
   to: send_to,
   reply_to: reply_to,
   subject: subject,
   html: message
  }
  // Send EMAIL

 
  const resultOfTransportet = await transporter.sendMail(option)
//console.log("resultOFTransportet",resultOfTransportet)
  if(resultOfTransportet){
   return true;
  }else{
   return false;
  }

}

module.exports = sendEmail;
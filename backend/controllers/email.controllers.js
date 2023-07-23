const nodemailer = require('nodemailer');
const {google} = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const OAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
OAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});


const sendingVerifyingEmail = async (id, email)=>{
    const accessToken = await OAuth2Client.getAccessToken();
    const transport = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            type: 'OAUTH2',
            user: process.env.EMAIL,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken
        }
    });
    const emailhtml = generateEmail(id);
    const mailOptions = {
        from: `Talkative Tribe <${process.env.EMAIL}>`,
        to: email,
        subject: 'To verify your email...',
        text: 'Click to verify your email',
        html: emailhtml
    };
    const result = await transport.sendMail(mailOptions);
    if(result.accepted.length>0)
    console.log('Verification Mail Sent')
    else 
    console.log('Something went wrong with mail service');
}

const generateEmail = (id)=>{
    let str = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email address</title>
    <style>
        * {
            margin: 0%;
            padding: 0%;
        }

        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f0f0f0;
            margin: 0;
            padding: 0;
        }

        h1 {
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            color: #3d3d5f;
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
        }

        p {
            margin-bottom: 10px;
        }

        a {
            color: #fff;
            text-decoration: none;
        }

        a:hover {
            text-decoration: underline;
        }

        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .content {
            padding: 30px 40px;
        }

        .button {
            display: inline-block;
            background-color: #3d3d5f;
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            text-decoration: none;
            transition: background-color 0.3s ease;
        }

        .button:hover {
            background-color: #555577;
        }

        .note {
            color: #888;
            font-size: 14px;
        }

        .logo {
            display: block;
            margin: 0 auto;
            width: 100px;
            height: 100px;
            background-color: #3d3d5f;
            border-radius: 50%;
            line-height: 100px;
            text-align: center;
            font-size: 40px;
            font-weight: bold;
            color: #fff;
            margin-bottom: 20px;
        }

        .footer {
            text-align: center;
            background-color: #f0f0f0;
            padding: 20px;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
        }

        .address {
            color: #555577;
            font-size: 14px;
        }

        .signature {
            color: #888;
            font-size: 16px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="content">
            <span class="logo">TT</span>
            <h1>Verify your email address</h1>
            <p>Welcome to Talkative Tribe!</p>
            <p>We're just sending this email to confirm your email address.</p>
            <p>To verify your address, please click on the button below:</p>
            <a href="https://talkative-tribe.onrender.com/user/verify/${id}" class="button">Verify Email</a>
            <p class="note">Once you've verified your email address, you'll be able to start using Talkative Tribe's services.</p>
        </div>
        <div class="footer">
            <p class="address">Talkative Tribe Inc. | Lucknow, Uttar Pradesh, India</p>
            <p class="signature">Best regards,</p>
            <p class="signature">The Talkative Tribe Team</p>
        </div>
    </div>
</body>

</html>
    `;
    return str;
}

const verifiedEmail = ()=>{
    let str = `
    <!DOCTYPE html>
<html>
<head>
  <title>Email Verified</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f0f0f0;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      color: #3d3d5f;
      background-color: #f0f0f0;
      padding: 20px;
      border-radius: 8px;
    }
    p {
      margin-bottom: 10px;
    }
    a {
      color: #fff;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .content {
      padding: 40px;
    }
    .button {
      display: inline-block;
      background-color: #3d3d5f;
      color: #fff;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      text-decoration: none;
      transition: background-color 0.3s ease;
    }
    .button:hover {
      background-color: #555577;
    }
    .note {
      color: #888;
      font-size: 14px;
    }
    .logo {
      display: block;
      margin: 0 auto;
      width: 100px;
      height: 100px;
      background-color: #3d3d5f;
      border-radius: 50%;
      line-height: 100px;
      text-align: center;
      font-size: 40px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 20px;
    }
    .footer {
      text-align: center;
      background-color: #f0f0f0;
      padding: 20px;
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }
    .address {
      color: #555577;
      font-size: 14px;
    }
    .signature {
      color: #888;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <span class="logo">TT</span>
      <h1>Email Verified</h1>
      <p>Congratulations! Your email has been successfully verified.</p>
      <p>Thank you for joining Talkative Tribe. You can now start using our services.</p>
    </div>
    <div class="footer">
      <p class="address">Talkative Tribe Inc. | Lucknow, Uttar Pradesh, India</p>
      <p class="signature">Best regards,</p>
      <p class="signature">The Talkative Tribe Team</p>
    </div>
  </div>
</body>
</html>
    `;
    return str;
}

module.exports = {
    generateEmail, verifiedEmail, sendingVerifyingEmail
}
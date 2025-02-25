import nodemailer from "nodemailer";

const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
      user: "jahidhasanbabu657@gmail.com",
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Email options
  const mailOptions = {
    from: "jahidhasanbabu657@gmail.com",
    to,
    subject,
    html,
    text,
  };
  await transporter.sendMail(mailOptions);
};

export default sendEmail;

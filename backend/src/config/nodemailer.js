const nodemailer = require("nodemailer");

// create a transporter

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASSWORD,
  },
});

module.exports = transporter;

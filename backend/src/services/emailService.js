const nodemailer = require("nodemailer");
const { errorMessages } = require("../controllers/errorController");

// Create a transporter object

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

// Send an email using the transporter object

async function sendResetCode(toEmail, code) {
  const mailOptions = {
    from: process.env.NODEMAILER_APP,
    to: toEmail,
    subject: "Your Password Reset Code",
    text: `Your password reset code is: ${code}. It is valid for 5 minutes only.`,
    html: `<p>Your password reset code is: <strong>${code}</strong>. It is valid for 5 minutes only.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error(errorMessages.RESET_EMAIL_ERROR, err);
    throw new Error("Failed to send reset email");
  }
}

module.exports = {
  sendResetCode,
};

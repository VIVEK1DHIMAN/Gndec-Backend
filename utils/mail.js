const nodemailer = require('nodemailer');
const {
  SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD,
} = require('../config/environment');
const { getAdmin } = require('./getAdmin');

const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
});

// mailMessage Object structure (from, to, subject, text=body, attachments)
exports.sendMail = async (mailMessage) => {
  // const message = { from: "admin@theamanjs.dev", ...mailMessage };
  const message = { from: "gndec@decsportsmeet.tech", ...mailMessage };
  return transport.sendMail(message);
};

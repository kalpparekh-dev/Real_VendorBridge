import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';

type EmailAttachment = {
  filename: string;
  path?: string;
  content?: Buffer;
  contentType?: string;
};

type SendEmailParams = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
};

const requiredEnvVars = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
];

const validateEmailConfig = () => {
  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing email environment variables: ${missingVars.join(', ')}`
    );
  }
};

const createTransporter = () => {
  validateEmailConfig();

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  attachments = [],
}: SendEmailParams) => {
  const transporter = createTransporter();

  const mailOptions: SendMailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
    attachments,
  };

  const info = await transporter.sendMail(mailOptions);

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  };
};

export const verifyEmailConnection = async () => {
  const transporter = createTransporter();
  await transporter.verify();

  return {
    success: true,
    message: 'Email server connection verified successfully',
  };
};
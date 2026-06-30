import dotenv from 'dotenv';
import { sendEmail, verifyEmailConnection } from './services/email.service';

dotenv.config();

const testEmail = async () => {
  try {
    console.log('Checking email connection...');

    await verifyEmailConnection();

    console.log('Email connection successful.');
    console.log('Sending test email...');

    const result = await sendEmail({
      to: process.env.SMTP_USER as string,
      subject: 'VendorBridge Email Engine Test',
      text: 'Email Engine is working successfully.',
      html: `
        <h2>VendorBridge Email Engine</h2>
        <p>Email Engine is working successfully.</p>
      `,
    });

    console.log('Email sent successfully:');
    console.log(result);
  } catch (error) {
    console.error('Email test failed:');
    console.error(error);
  }
};

testEmail();
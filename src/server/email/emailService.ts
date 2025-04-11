import nodemailer from 'nodemailer';
import type { bookings } from '~/server/db/schema';
import { env } from '~/env';
import type { InferSelectModel } from 'drizzle-orm';

// Define Booking type from the schema
type Booking = InferSelectModel<typeof bookings>;

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  requireTLS: true,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3',
  },
});

export const sendPaymentConfirmationEmail = async (booking: Booking) => {
  try {
    console.log(`Sending payment confirmation email to ${booking.customerEmailSnapshot}`);
    
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: booking.customerEmailSnapshot ?? '',
      subject: 'Payment Confirmation - Teeramuaythaione',
      html: `
        <h1>Payment Confirmation</h1>
        <p>Dear ${booking.customerNameSnapshot},</p>
        <p>Thank you for your payment. Your booking for ${booking.eventTitleSnapshot} has been confirmed.</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
          <li>Booking ID: ${booking.id}</li>
          <li>Event: ${booking.eventTitleSnapshot}</li>
          <li>Date: ${booking.eventDateSnapshot?.toLocaleDateString()}</li>
          <li>Venue: ${booking.venueNameSnapshot}</li>
          <li>Region: ${booking.regionNameSnapshot}</li>
          <li>Payment Amount: ฿${booking.totalAmount.toLocaleString()}</li>
          <li>Payment Method: ${booking.paymentMethod}</li>
          <li>Transaction ID: ${booking.paymentTransactionId}</li>
        </ul>
        <p>We look forward to seeing you at the event!</p>
      `,
    });
    
    console.log(`Payment confirmation email sent to ${booking.customerEmailSnapshot}`);
  } catch (error) {
    console.error(`Failed to send payment confirmation email to ${booking.customerEmailSnapshot}:`, error);
  }
};

export const sendPaymentFailureEmail = async (booking: Booking) => {
  try {
    console.log(`Sending payment failure email to ${booking.customerEmailSnapshot}`);
    
    await transporter.sendMail({
      from: env.EMAIL_USER,
      to: booking.customerEmailSnapshot ?? '',
      subject: 'Payment Failed - Teeramuaythaione',
      html: `
        <h1>Payment Failed</h1>
        <p>Dear ${booking.customerNameSnapshot},</p>
        <p>We're sorry to inform you that your payment for ${booking.eventTitleSnapshot} was not successful.</p>
        <p>You can try again by visiting our website and completing the payment process.</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
          <li>Booking ID: ${booking.id}</li>
          <li>Event: ${booking.eventTitleSnapshot}</li>
          <li>Payment Amount: ฿${booking.totalAmount.toLocaleString()}</li>
        </ul>
        <p>If you continue to experience issues, please contact our support team.</p>
      `,
    });
    
    console.log(`Payment failure email sent to ${booking.customerEmailSnapshot}`);
  } catch (error) {
    console.error(`Failed to send payment failure email to ${booking.customerEmailSnapshot}:`, error);
  }
}; 
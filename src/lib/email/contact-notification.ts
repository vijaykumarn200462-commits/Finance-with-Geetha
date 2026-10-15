/**
 * Centralized Contact Inquiry Email Notification Helper
 * 
 * Handles sending transactional notification emails to Geetha N. (cageethanofficial@gmail.com)
 * when a visitor submits an inquiry on the website.
 * 
 * Supports:
 *  1. Resend API (default cloud transactional email provider via fetch)
 *  2. SMTP / Gmail App Password (via Nodemailer)
 */

import nodemailer, { Transporter } from 'nodemailer';

export interface ContactNotificationPayload {
  inquiryId?: string;
  name: string;
  email: string;
  phone?: string | null;
  topic?: string;
  message: string;
  submittedAt?: string;
}

export interface SendNotificationResult {
  success: boolean;
  status: 'sent' | 'failed' | 'not_configured';
  id?: string;
  error?: string;
  recipient: string;
  provider?: 'resend' | 'smtp' | 'none';
}

/**
 * Returns the configured recipient email address for contact inquiries.
 * Precedence: INQUIRY_NOTIFICATION_EMAIL -> CONTACT_EMAIL_TO -> CONTACT_NOTIFICATION_EMAIL -> cageethanofficial@gmail.com
 */
export function getContactNotificationRecipient(): string {
  if (process.env.INQUIRY_NOTIFICATION_EMAIL && process.env.INQUIRY_NOTIFICATION_EMAIL.trim()) {
    return process.env.INQUIRY_NOTIFICATION_EMAIL.trim();
  }
  if (process.env.CONTACT_EMAIL_TO && process.env.CONTACT_EMAIL_TO.trim()) {
    return process.env.CONTACT_EMAIL_TO.trim();
  }
  if (
    process.env.CONTACT_NOTIFICATION_EMAIL &&
    !process.env.CONTACT_NOTIFICATION_EMAIL.includes('jakedemi') &&
    process.env.CONTACT_NOTIFICATION_EMAIL.trim()
  ) {
    return process.env.CONTACT_NOTIFICATION_EMAIL.trim();
  }
  return 'cageethanofficial@gmail.com';
}

/**
 * Returns the configured sender email address for transactional email providers.
 * Precedence: INQUIRY_FROM_EMAIL -> RESEND_FROM_EMAIL -> SMTP_FROM -> SMTP_USER -> Finance with Geetha <onboarding@resend.dev>
 */
export function getContactNotificationSender(): string {
  if (process.env.INQUIRY_FROM_EMAIL && process.env.INQUIRY_FROM_EMAIL.trim()) {
    return process.env.INQUIRY_FROM_EMAIL.trim();
  }
  if (process.env.RESEND_FROM_EMAIL && process.env.RESEND_FROM_EMAIL.trim()) {
    return process.env.RESEND_FROM_EMAIL.trim();
  }
  if (process.env.SMTP_FROM && process.env.SMTP_FROM.trim()) {
    return process.env.SMTP_FROM.trim();
  }
  if (process.env.SMTP_USER && process.env.SMTP_USER.trim()) {
    return `Finance with Geetha <${process.env.SMTP_USER.trim()}>`;
  }
  return 'Finance with Geetha <onboarding@resend.dev>';
}

/**
 * Builds the plain-text fallback content.
 */
function buildPlainText(payload: ContactNotificationPayload, submissionDate: string): string {
  return [
    `NEW CLIENT INQUIRY - FINANCE WITH GEETHA`,
    `========================================`,
    `Inquiry ID:   ${payload.inquiryId || 'Pending'}`,
    `Client Name:  ${payload.name}`,
    `Email:        ${payload.email}`,
    `Phone:        ${payload.phone || 'Not provided'}`,
    `Topic:        ${payload.topic || 'Bookkeeping & Accounting'}`,
    `Date/Time:    ${submissionDate}`,
    ``,
    `Message / Requirements:`,
    `----------------------------------------`,
    payload.message,
    ``,
    `----------------------------------------`,
    `Reply directly to this email to contact the client at ${payload.email}.`,
    `Website: https://financewithgeetha.com`,
  ].join('\n');
}

/**
 * Builds the professional branded HTML email content.
 */
function buildHtmlContent(
  payload: ContactNotificationPayload,
  submissionDate: string,
  recipient: string
): string {
  const sanitizedMessage = payload.message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Inquiry - Finance with Geetha</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <div style="background-color: #0f2c59; padding: 28px 32px; border-bottom: 3px solid #138354;">
            <p style="margin: 0 0 4px 0; color: #a7f3d0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Finance with Geetha</p>
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">New Prospective Client Inquiry</h1>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #334155;">
              You have received a new consultation inquiry through your website contact form:
            </p>

            <!-- Details Card -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              ${
                payload.inquiryId
                  ? `<tr>
                      <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; width: 140px; border-bottom: 1px solid #e2e8f0;">Inquiry ID</td>
                      <td style="padding: 12px 16px; font-size: 14px; font-family: monospace; font-weight: 700; color: #0f2c59; border-bottom: 1px solid #e2e8f0;">${payload.inquiryId}</td>
                    </tr>`
                  : ''
              }
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; width: 140px; border-bottom: 1px solid #e2e8f0;">Client Name</td>
                <td style="padding: 12px 16px; font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Email Address</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #0f2c59; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
                  <a href="mailto:${payload.email}" style="color: #0f2c59; text-decoration: underline;">${payload.email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Phone Number</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                  ${
                    payload.phone
                      ? `<a href="tel:${payload.phone.replace(/\D/g, '')}" style="color: #138354; font-weight: 600; text-decoration: none;">${payload.phone}</a>`
                      : '<span style="color: #94a3b8;">Not provided</span>'
                  }
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Topic / Service</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.topic || 'Bookkeeping & Accounting'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b;">Received At</td>
                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">${submissionDate}</td>
              </tr>
            </table>

            <!-- Client Message -->
            <div style="margin-bottom: 28px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Message / Requirements</p>
              <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #138354; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${sanitizedMessage}</div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; padding-top: 8px;">
              <a href="mailto:${payload.email}?subject=Re:%20Inquiry%20-%20Finance%20with%20Geetha" style="display: inline-block; background-color: #138354; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 2px 4px rgba(19, 131, 84, 0.2);">
                Reply Directly to ${payload.name} (${payload.email})
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
            This email was generated automatically by the Finance with Geetha website contact form.<br>
            Recipient: <strong>${recipient}</strong>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Sends a notification email to cageethanofficial@gmail.com using the active provider.
 * Supports Resend API (HTTP fetch) and SMTP / Gmail (Nodemailer).
 */
export async function sendContactInquiryNotification(
  payload: ContactNotificationPayload
): Promise<SendNotificationResult> {
  const recipient = getContactNotificationRecipient();
  const sender = getContactNotificationSender();
  const submissionDate =
    payload.submittedAt ||
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const subject = `New Client Inquiry from ${payload.name} [${payload.topic || 'Bookkeeping & Accounting'}]`;
  const plainText = buildPlainText(payload, submissionDate);
  const htmlContent = buildHtmlContent(payload, submissionDate, recipient);

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const hasResend = Boolean(resendApiKey && !resendApiKey.includes('placeholder'));

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim();
  const hasSmtp = Boolean((smtpHost && smtpUser && smtpPass) || (smtpUser && smtpPass));

  // 1. If Resend API key is configured, use Resend
  if (hasResend && resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: sender,
          to: recipient,
          reply_to: payload.email,
          subject,
          text: plainText,
          html: htmlContent,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg =
          data.message ||
          `Resend API rejected with HTTP ${res.status}: ${res.statusText}`;
        console.error('[Contact Email Delivery Failed - Resend]', {
          status: res.status,
          error: errorMsg,
          recipient,
        });
        return {
          success: false,
          status: 'failed',
          recipient,
          error: errorMsg,
          provider: 'resend',
        };
      }

      console.log('[Contact Email Delivered to Provider - Resend]', {
        id: data.id,
        recipient,
        from: sender,
        replyTo: payload.email,
      });

      return {
        success: true,
        status: 'sent',
        id: data.id,
        recipient,
        provider: 'resend',
      };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Network exception communicating with Resend API.';
      console.error('[Contact Email Exception - Resend]', err);
      return {
        success: false,
        status: 'failed',
        recipient,
        error: errorMsg,
        provider: 'resend',
      };
    }
  }

  // 2. If SMTP / Gmail credentials are configured, use Nodemailer
  if (hasSmtp && smtpUser && smtpPass) {
    try {
      let transporter: Transporter;
      if (smtpHost) {
        const port = Number(process.env.SMTP_PORT) || 587;
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port,
          secure: port === 465,
          auth: { user: smtpUser, pass: smtpPass },
        });
      } else {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: smtpUser, pass: smtpPass },
        });
      }

      const info = await transporter.sendMail({
        from: sender,
        to: recipient,
        replyTo: payload.email,
        subject,
        text: plainText,
        html: htmlContent,
      });

      console.log('[Contact Email Delivered to Provider - SMTP]', {
        messageId: info.messageId,
        recipient,
        from: sender,
        replyTo: payload.email,
      });

      return {
        success: true,
        status: 'sent',
        id: info.messageId,
        recipient,
        provider: 'smtp',
      };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to deliver email through SMTP provider.';
      console.error('[Contact Email Exception - SMTP]', err);
      return {
        success: false,
        status: 'failed',
        recipient,
        error: errorMsg,
        provider: 'smtp',
      };
    }
  }

  // 3. Neither provider is configured with active credentials
  return {
    success: false,
    status: 'not_configured',
    recipient,
    error:
      'No email provider configured. To receive instant notifications, configure RESEND_API_KEY in .env.local (from resend.com) or SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS).',
    provider: 'none',
  };
}

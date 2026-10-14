/**
 * Centralized Contact Inquiry Email Notification Helper
 * 
 * Handles sending transactional notification emails to Geetha N. (cageethanofficial@gmail.com)
 * when a visitor submits an inquiry on the website.
 */

export interface ContactNotificationPayload {
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
}

/**
 * Returns the configured recipient email address for contact inquiries.
 * Default: cageethanofficial@gmail.com
 */
export function getContactNotificationRecipient(): string {
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
 * Returns the configured sender email address for transactional email providers (Resend).
 * Default: Finance with Geetha <onboarding@resend.dev>
 */
export function getContactNotificationSender(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    'Finance with Geetha <onboarding@resend.dev>'
  ).trim();
}

/**
 * Sends a notification email to cageethanofficial@gmail.com via Resend.
 */
export async function sendContactInquiryNotification(
  payload: ContactNotificationPayload
): Promise<SendNotificationResult> {
  const recipient = getContactNotificationRecipient();
  const sender = getContactNotificationSender();
  const submissionDate = payload.submittedAt || new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  // 1. Check if provider is configured
  if (!resendApiKey || resendApiKey.includes('placeholder')) {
    return {
      success: false,
      status: 'not_configured',
      recipient,
      error: 'RESEND_API_KEY is not configured or contains a placeholder value in environment variables.',
    };
  }

  // 2. Prepare Email Subject and Body
  const subject = `New Client Inquiry from ${payload.name} [${payload.topic || 'Bookkeeping & Accounting'}]`;

  const plainText = [
    `NEW CLIENT INQUIRY - FINANCE WITH GEETHA`,
    `========================================`,
    ``,
    `Client Name:  ${payload.name}`,
    `Email:        ${payload.email}`,
    `Phone:        ${payload.phone || 'Not provided'}`,
    `Topic:        ${payload.topic || 'Bookkeeping & Accounting'}`,
    `Date/Time:    ${submissionDate}`,
    ``,
    `Message / Service Needed:`,
    `----------------------------------------`,
    payload.message,
    ``,
    `----------------------------------------`,
    `Reply directly to this email to contact the client at ${payload.email}.`,
  ].join('\n');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Inquiry</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header Banner -->
          <div style="background-color: #0f2c59; padding: 28px 32px; border-bottom: 3px solid #138354;">
            <p style="margin: 0 0 4px 0; color: #a7f3d0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Finance with Geetha</p>
            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">New Prospective Client Inquiry</h1>
          </div>

          <!-- Body Content -->
          <div style="padding: 32px;">
            <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.5; color: #334155;">
              You have received a new consultation inquiry through your website contact form:
            </p>

            <!-- Details Card -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; width: 140px; border-bottom: 1px solid #e2e8f0;">Full Name</td>
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
                  ${payload.phone ? `<a href="tel:${payload.phone.replace(/\\D/g, '')}" style="color: #138354; font-weight: 600; text-decoration: none;">${payload.phone}</a>` : '<span style="color: #94a3b8;">Not provided</span>'}
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Service / Topic</td>
                <td style="padding: 12px 16px; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${payload.topic || 'Bookkeeping & Accounting'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #64748b;">Received At</td>
                <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">${submissionDate}</td>
              </tr>
            </table>

            <!-- Client Message -->
            <div style="margin-bottom: 28px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Message / Requirements</p>
              <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #138354; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${payload.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; padding-top: 8px;">
              <a href="mailto:${payload.email}?subject=Re:%20Consultation%20Inquiry%20-%20Finance%20with%20Geetha" style="display: inline-block; background-color: #138354; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-right: 8px;">
                Reply Directly to ${payload.name}
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
            This email was generated automatically by the Finance with Geetha website contact form.<br>
            Recipient: <strong>${recipient}</strong>
          </div>
        </div>
      </body>
    </html>
  `;

  // 3. Dispatch to Resend API
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
      const errorMsg = data.message || `Resend API rejected with HTTP ${res.status}: ${res.statusText}`;
      console.error('[Contact Email Delivery Failed]', { status: res.status, error: errorMsg, recipient });
      return {
        success: false,
        status: 'failed',
        recipient,
        error: errorMsg,
      };
    }

    console.log('[Contact Email Delivered to Provider]', {
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
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network failure communicating with email provider.';
    console.error('[Contact Email Dispatch Exception]', err);
    return {
      success: false,
      status: 'failed',
      recipient,
      error: errorMsg,
    };
  }
}

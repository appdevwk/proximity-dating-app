import nodemailer from 'nodemailer';

export const EMAIL_FROM =
  process.env.SMTP_FROM ?? 'Proximity Dating <no-reply@proximitygetadate.site>';
export const CONTACT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@proximitygetadate.site';

const APP_NAME = 'Proximity';
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ??
  (process.env.NODE_ENV === 'production'
    ? 'https://proximitygetadate.site'
    : 'http://localhost:3000');

let transporter: nodemailer.Transporter | null = null;

export function getMailer(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // No real credentials configured yet — log + return null so callers can bail gracefully.
  if (!host || !user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
      auth: { user, pass },
    });
  }
  return transporter;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ sent: boolean; delivered: boolean; error?: string }> {
  try {
    const mailer = getMailer();
    if (!mailer) {
      console.warn('[email] SMTP not configured; skipping send to', input.to);
      return { sent: false, delivered: false, error: 'SMTP not configured' };
    }

    const info = await mailer.sendMail({
      from: EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? stripHtml(input.html),
    });

    return { sent: true, delivered: info.accepted.length > 0, error: undefined };
  } catch (error) {
    console.error('[email] send failed:', error);
    return { sent: false, delivered: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wrap(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f0116;font-family:Segoe UI,Arial,sans-serif;color:#f5f0f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0116;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1a0a24;border:1px solid rgba(236,72,153,.35);border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(90deg,#550089,#78007b);padding:24px 28px;text-align:center;">
              <span style="font-size:26px;font-weight:900;color:#fff;letter-spacing:.5px;">Proximity</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 8px;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#f9a8d4;font-weight:800;">${title}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:10px 28px 26px;border-top:1px solid rgba(255,255,255,.06);font-size:12px;color:#9ca3af;line-height:1.6;">
              ${APP_NAME} · ${APP_URL}<br />
              You are receiving this because you have an account with ${APP_NAME}. Reply to this email if you need help, or contact us at ${CONTACT_EMAIL}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function codeBox(code: string): string {
  return `<div style="margin:18px auto;padding:16px;background:#0f0116;border:2px dashed #ec4899;border-radius:12px;text-align:center;font-size:28px;font-weight:900;color:#fff;letter-spacing:6px;font-family:Consolas,monospace;">${code}</div>`;
}

export function buttonLink(url: string, label: string): string {
  return `<div style="margin:22px 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(90deg,#ec4899,#a855f7);color:#fff;text-decoration:none;font-weight:700;padding:12px 28px;border-radius:10px;">${label}</a>
  </div>`;
}

/** Welcome email — sent right after registration. */
export function welcomeEmail(name: string, siteModeLabel: string): string {
  const body = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 14px;line-height:1.7;">Welcome to ${APP_NAME} — we match you with great people nearby. Your account is set to the <strong>${escapeHtml(siteModeLabel)}</strong> experience.</p>
    <p style="margin:0 0 6px;">A few things to get you started:</p>
    <ul style="margin:0 0 14px;padding-left:20px;line-height:1.8;">
      <li>Complete your profile with a few photos</li>
      <li>Set your preferences (age range, distance, interests)</li>
      <li>Add a short bio so people know what you&rsquo;re about</li>
    </ul>
    ${buttonLink(`${APP_URL}/login`, 'Start Matching')}
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">Stay safe: never share your password or send money to anyone you meet here.</p>
  `;
  return wrap(`Welcome to ${APP_NAME}, ${escapeHtml(name.split(' ')[0])}!`, body);
}

/** Email verification code email. */
export function emailVerifyEmail(name: string, code: string): string {
  const body = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p style="margin:0 0 6px;">Your ${APP_NAME} verification code is:</p>
    ${codeBox(code)}
    <p style="margin:14px 0 0;font-size:13px;color:#9ca3af;">This code expires in 30 minutes. If you didn't create an account with ${APP_NAME}, you can ignore this email.</p>
  `;
  return wrap('Verify your email address', body);
}

/** Password reset email. */
export function passwordResetEmail(name: string, code: string): string {
  const body = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p style="margin:0 0 6px;">We received a request to reset your ${APP_NAME} password. Use this code to set a new one:</p>
    ${codeBox(code)}
    <p style="margin:14px 0 0;font-size:13px;color:#9ca3af;">This code expires in 30 minutes and can only be used once. If you didn't request this, you can safely ignore this email.</p>
  `;
  return wrap('Reset your password', body);
}

/** Payment / subscription receipt email. */
export function receiptEmail(name: string, planName: string, amount: string, currency: string): string {
  const body = `
    <p style="margin:0 0 14px;">Hi ${escapeHtml(name.split(' ')[0])},</p>
    <p style="margin:0 0 14px;line-height:1.7;">Your <strong>${escapeHtml(planName)}</strong> cross-post subscription payment has been received.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0116;border-radius:10px;padding:14px 18px;margin:8px 0 16px;">
      <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">Amount</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#fff;">${currency.toUpperCase()} ${amount}</td></tr>
      <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">Plan</td><td style="padding:4px 0;text-align:right;color:#fff;">${escapeHtml(planName)}</td></tr>
      <tr><td style="padding:4px 0;color:#9ca3af;font-size:13px;">Status</td><td style="padding:4px 0;text-align:right;color:#4ade80;">Paid</td></tr>
    </table>
    <p style="margin:0 0 0;font-size:13px;color:#9ca3af;">Manage your subscription anytime from your account settings.</p>
  `;
  return wrap('Your subscription is active', body);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateCode(length = 6): string {
  const digits = '0123456789';
  let code = '';
  const rand = new Uint8Array(length);
  crypto.getRandomValues(rand);
  for (let i = 0; i < length; i++) {
    code += digits[rand[i] % digits.length];
  }
  return code;
}
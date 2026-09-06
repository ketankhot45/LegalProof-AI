import nodemailer, { type Transporter } from 'nodemailer';
import crypto from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  } else {
    throw new Error('SMTP configuration is missing. Cannot send real emails.');
  }

  return transporter;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transport = getTransporter();
    const from = process.env.SMTP_FROM || '"LegalProof AI Support" <no-reply@legalproof.ai>';

    const info = await transport.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, ''),
    });

    // In dev / JSON transport mode, provide notice with sanitized recipient
    if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
      console.log(`[Email Service - Dev Mode] Simulated email sent to ${to}. Subject: "${subject}"`);
    }

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`[Email Service Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message || 'Failed to dispatch email' };
  }
}

export function hashSecurityToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export async function sendVerificationEmail(email: string, name: string, rawToken: string, baseUrl: string) {
  const verifyUrl = `${baseUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(rawToken)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; }
        .header { text-align: center; margin-bottom: 24px; }
        .title { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; }
        .text { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
        .button-wrap { text-align: center; margin: 28px 0; }
        .button { background-color: #4f46e5; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; }
        .link-text { color: #818cf8; word-break: break-all; font-size: 12px; }
        .footer { margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; color: #71717a; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">Verify Your LegalProof AI Account</h1>
        </div>
        <p class="text">Hello ${escapeHtml(name)},</p>
        <p class="text">Thank you for registering with LegalProof AI. To activate your account and start submitting or monitoring incident complaints, please verify your email address.</p>
        <div class="button-wrap">
          <a href="${verifyUrl}" class="button" target="_blank">Verify Email Address</a>
        </div>
        <p class="text">This link will expire in 24 hours. If the button above does not work, copy and paste the following URL into your browser:</p>
        <p class="link-text">${verifyUrl}</p>
        <div class="footer">
          <p>If you did not create an account on LegalProof AI, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Action Required: Verify Your LegalProof AI Email',
    html,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, rawToken: string, baseUrl: string) {
  const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(rawToken)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; }
        .header { text-align: center; margin-bottom: 24px; }
        .title { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; }
        .text { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
        .button-wrap { text-align: center; margin: 28px 0; }
        .button { background-color: #e11d48; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; }
        .link-text { color: #fb7185; word-break: break-all; font-size: 12px; }
        .footer { margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; color: #71717a; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">Reset Your LegalProof AI Password</h1>
        </div>
        <p class="text">Hello ${escapeHtml(name)},</p>
        <p class="text">We received a request to reset the password for your LegalProof AI account. Click the button below to establish a new password.</p>
        <div class="button-wrap">
          <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
        </div>
        <p class="text">For security reasons, this single-use link expires in <strong>15 minutes</strong>. If you did not request a password reset, your credentials remain secure and no action is required.</p>
        <p class="link-text">${resetUrl}</p>
        <div class="footer">
          <p>LegalProof AI • Cryptographically Verifiable Evidence & Case Management</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Security Alert: Reset Your LegalProof AI Password',
    html,
  });
}

export async function sendInvestigatorInvitationEmail(email: string, name: string, rawToken: string, baseUrl: string) {
  const activateUrl = `${baseUrl.replace(/\/$/, '')}/activate-investigator?token=${encodeURIComponent(rawToken)}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; }
        .container { max-width: 540px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; }
        .header { text-align: center; margin-bottom: 24px; }
        .title { color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 8px 0; }
        .badge { display: inline-block; background-color: #312e81; color: #a5b4fc; border: 1px solid #4338ca; border-radius: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 12px; }
        .text { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
        .button-wrap { text-align: center; margin: 28px 0; }
        .button { background-color: #4f46e5; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; }
        .link-text { color: #818cf8; word-break: break-all; font-size: 12px; }
        .footer { margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; color: #71717a; font-size: 12px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">Authorized Personnel</div>
          <h1 class="title">Forensic Investigator Workspace Invitation</h1>
        </div>
        <p class="text">Hello ${escapeHtml(name)},</p>
        <p class="text">An administrator has authorized and provisioned a <strong>Forensic Investigator</strong> account for you on the LegalProof AI platform.</p>
        <p class="text">To complete your onboarding and activate your forensic credentials, click the button below to establish your secure access password.</p>
        <div class="button-wrap">
          <a href="${activateUrl}" class="button" target="_blank">Activate Investigator Account</a>
        </div>
        <p class="text">This invitation token is single-use and will expire in 48 hours.</p>
        <p class="link-text">${activateUrl}</p>
        <div class="footer">
          <p>LegalProof AI • Law Enforcement & Forensic Chain-of-Custody Portal</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Official Invitation: LegalProof AI Forensic Investigator Account',
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

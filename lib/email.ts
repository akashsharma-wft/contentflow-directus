// lib/email.ts
// Email sending via Resend.
// Setup: add RESEND_API_KEY to .env.local (see README or output below).
// From address: set RESEND_FROM_EMAIL or defaults to Resend's sandbox sender.
//
// Resend free tier: 100 emails/day, 3,000/month — sufficient for admin invites.

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Admin invite email ───────────────────────────────────────────────────────

export interface SendInviteEmailOptions {
  toEmail:       string
  invitedByName: string
  message:       string | null
  appUrl:        string
}

export async function sendAdminInviteEmail(opts: SendInviteEmailOptions) {
  const { toEmail, invitedByName, message, appUrl } = opts
  const loginUrl = `${appUrl}/login?redirectTo=/studio`

  const { error } = await resend.emails.send({
    from:    'ContentFlow <onboarding@resend.dev>',
    to:      toEmail,
    subject: "You've been invited to ContentFlow Studio",
    html:    buildInviteHtml({ toEmail, invitedByName, message, loginUrl }),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

// ─── HTML template ────────────────────────────────────────────────────────────

interface TemplateVars {
  toEmail:       string
  invitedByName: string
  message:       string | null
  loginUrl:      string
}

function buildInviteHtml({ toEmail, invitedByName, message, loginUrl }: TemplateVars): string {
  const noteBlock = message
    ? `
      <div style="background:#1a1b26;border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px;margin:0 0 28px;">
        <p style="color:rgba(255,255,255,0.35);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          Note from ${escHtml(invitedByName)}
        </p>
        <p style="color:rgba(255,255,255,0.65);font-size:14px;line-height:1.6;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
          ${escHtml(message)}
        </p>
      </div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>You've been invited to ContentFlow Studio</title>
</head>
<body style="margin:0;padding:0;background:#0e0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:48px auto;background:#13141c;border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:44px 40px;box-sizing:border-box;">

    <!-- Brand -->
    <div style="margin-bottom:32px;">
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="width:28px;height:28px;background:#6366f1;border-radius:8px;display:inline-block;"></span>
        <span style="color:rgba(255,255,255,0.55);font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">
          ContentFlow Studio
        </span>
      </span>
    </div>

    <!-- Heading -->
    <h1 style="color:#f9fafb;font-size:22px;font-weight:700;margin:0 0 14px;line-height:1.35;letter-spacing:-0.3px;">
      You've been invited to admin access
    </h1>

    <!-- Body -->
    <p style="color:rgba(255,255,255,0.5);font-size:15px;line-height:1.7;margin:0 0 28px;">
      <strong style="color:rgba(255,255,255,0.75);">${escHtml(invitedByName)}</strong>
      has invited you to become an admin on ContentFlow. Once approved, you'll have
      full access to the admin panel and CMS.
    </p>

    ${noteBlock}

    <!-- Steps -->
    <div style="margin-bottom:32px;">
      <p style="color:rgba(255,255,255,0.3);font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin:0 0 14px;">
        How to get started
      </p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${['Sign up or log in using <strong style=\\"color:rgba(255,255,255,0.7);\\">' + escHtml(toEmail) + '</strong>',
           'Visit <strong style=\\"color:rgba(255,255,255,0.7);\\">/studio</strong> from your dashboard',
           'Your invitation will be reviewed and approved by an admin']
          .map((step, i) => `
          <tr>
            <td style="width:24px;padding-bottom:10px;vertical-align:top;">
              <span style="display:inline-flex;width:20px;height:20px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:50%;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#818cf8;">${i + 1}</span>
            </td>
            <td style="padding-bottom:10px;padding-left:10px;vertical-align:top;">
              <span style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;">${step}</span>
            </td>
          </tr>`).join('')}
      </table>
    </div>

    <!-- CTA -->
    <a href="${loginUrl}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.3px;">
      Sign in to ContentFlow &rarr;
    </a>

    <!-- Footer -->
    <p style="color:rgba(255,255,255,0.18);font-size:12px;margin:36px 0 0;line-height:1.6;">
      This invitation was sent to ${escHtml(toEmail)}.<br>
      If you weren't expecting this, you can safely ignore it.
    </p>

  </div>
</body>
</html>`
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

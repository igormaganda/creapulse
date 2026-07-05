// ============================================
// CreaPulse V2 — Email Notification Service
// Lightweight email service with dev-mode logging
// Supports 'log' (dev) and 'resend' (production) providers
// ============================================

import { createLogger } from './logger'

const log = createLogger('email')

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'log' // 'log' | 'resend'
const DEFAULT_FROM = 'CreaPulse <noreply@creapulse.echo-entreprendre.fr>'

// ─── Types ──────────────────────────────────

interface EmailPayload {
  to: string
  subject: string
  html: string
  from?: string
}

// ─── Core send ──────────────────────────────

/**
 * Send an email via the configured provider.
 * In 'log' mode (default), emails are just logged to console — no API key needed.
 * In 'resend' mode, emails are sent via Resend (requires RESEND_API_KEY).
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (EMAIL_PROVIDER === 'log') {
    log.info('Email (dev mode)', { to: payload.to, subject: payload.subject })
    // eslint-disable-next-line no-console -- dev email logging
    console.log(`[EMAIL-DEV] To: ${payload.to} | Subject: ${payload.subject}`)
    return true
  }

  if (EMAIL_PROVIDER === 'resend') {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY || '')
      await resend.emails.send({
        from: payload.from || DEFAULT_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      })
      log.info('Email sent via Resend', { to: payload.to, subject: payload.subject })
      return true
    } catch (err) {
      log.error('Resend email failed', { to: payload.to, error: String(err) })
      return false
    }
  }

  log.warn('Unknown EMAIL_PROVIDER, email not sent', { provider: EMAIL_PROVIDER })
  return false
}

// ─── HTML Template Helpers ──────────────────

/** Branding colors and styles for inline email templates */
const BRAND = {
  primary: '#6C5CE7',    // CreaPulse purple
  bg: '#F8F7FF',
  text: '#2D3436',
  textLight: '#636E72',
  white: '#FFFFFF',
  border: '#E2E0F0',
  success: '#00B894',
}

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${BRAND.white};border-radius:12px;overflow:hidden;border:1px solid ${BRAND.border};">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND.primary};padding:24px 32px;text-align:center;">
            <h1 style="margin:0;color:${BRAND.white};font-size:22px;font-weight:700;">CreaPulse</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:${BRAND.text};font-size:18px;">${title}</h2>
            <div style="color:${BRAND.text};font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px;border-top:1px solid ${BRAND.border};text-align:center;">
            <p style="margin:0;font-size:12px;color:${BRAND.textLight};">
              CreaPulse — Plateforme d'accompagnement entrepreneurial<br>
              <a href="https://creapulse.echo-entreprendre.fr" style="color:${BRAND.primary};">creapulse.echo-entreprendre.fr</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(url: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.white};padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        ${label}
      </a>
    </td></tr>
  </table>`
}

// ─── Convenience Functions ──────────────────

/**
 * Welcome email sent after account creation.
 */
export async function sendWelcomeEmail(
  userEmail: string,
  firstName: string,
): Promise<boolean> {
  const html = emailShell(
    'Bienvenue sur CreaPulse !',
    `<p>Bonjour ${escapeHtml(firstName)},</p>
     <p>Votre compte a été créé avec succès. Vous pouvez maintenant accéder à votre espace de travail et commencer votre parcours entrepreneurial.</p>
     ${ctaButton('https://creapulse.echo-entreprendre.fr', 'Accéder à mon espace')}
     <p style="color:${BRAND.textLight};font-size:13px;margin-top:24px;">
       Si vous n'avez pas créé ce compte, veuillez ignorer cet email.
     </p>`,
  )
  return sendEmail({ to: userEmail, subject: 'Bienvenue sur CreaPulse 🚀', html })
}

/**
 * Notifies a counselor that a beneficiary has submitted their business plan.
 */
export async function sendBpSubmittedEmail(
  beneficiaryFirstName: string,
  counselorEmail: string,
  counselorFirstName: string,
): Promise<boolean> {
  const html = emailShell(
    'Business plan à reviewer',
    `<p>Bonjour ${escapeHtml(counselorFirstName)},</p>
     <p><strong>${escapeHtml(beneficiaryFirstName)}</strong> a soumis son business plan et vous demande une review.</p>
     <p>Connectez-vous à votre espace pour consulter et évaluer le business plan.</p>
     ${ctaButton('https://creapulse.echo-entreprendre.fr/admin-centre', 'Voir le business plan')}
     <p style="color:${BRAND.textLight};font-size:13px;margin-top:24px;">
       CreaPulse — Notification automatique
     </p>`,
  )
  return sendEmail({ to: counselorEmail, subject: `[CreaPulse] Business plan soumis par ${beneficiaryFirstName}`, html })
}

/**
 * Notifies a beneficiary that a mentor has been assigned to them.
 */
export async function sendMentorAssignedEmail(
  beneficiaryEmail: string,
  mentorName: string,
): Promise<boolean> {
  const html = emailShell(
    'Un mentor vous a été assigné',
    `<p>Bonjour,</p>
     <p>Nous avons le plaisir de vous annoncer que <strong>${escapeHtml(mentorName)}</strong> a accepté de vous accompagner en tant que mentor.</p>
     <p>Connectez-vous à votre espace pour prendre contact et planifier votre première session.</p>
     ${ctaButton('https://creapulse.echo-entreprendre.fr/bureau/mentorat', 'Accéder au mentorat')}
     <p style="color:${BRAND.textLight};font-size:13px;margin-top:24px;">
       CreaPulse — Notification automatique
     </p>`,
  )
  return sendEmail({ to: beneficiaryEmail, subject: '[CreaPulse] Un mentor vous a été assigné', html })
}

/**
 * Reminds a user who has been inactive for a while.
 */
export async function sendInactivityReminder(
  userEmail: string,
  firstName: string,
  daysInactive: number,
): Promise<boolean> {
  const html = emailShell(
    'Reprenez votre parcours entrepreneurial',
    `<p>Bonjour ${escapeHtml(firstName)},</p>
     <p>On ne vous a pas vu depuis <strong>${daysInactive} jours</strong> sur CreaPulse. Votre parcours entrepreneurial vous attend !</p>
     <p>Reconnectez-vous pour reprendre là où vous en étiez et avancer dans vos modules.</p>
     ${ctaButton('https://creapulse.echo-entreprendre.fr', 'Reprendre mon parcours')}
     <p style="color:${BRAND.textLight};font-size:13px;margin-top:24px;">
       CreaPulse — Rappel automatique
     </p>`,
  )
  return sendEmail({ to: userEmail, subject: `[CreaPulse] Reprenez votre parcours (${daysInactive}j d'inactivité)`, html })
}

// ─── Helpers ────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
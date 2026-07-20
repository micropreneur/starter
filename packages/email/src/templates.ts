import type { EmailMessage } from './port'

export interface RenderedEmail {
  html: string
  subject: string
  text: string
}

export function renderEmail(message: EmailMessage): RenderedEmail {
  const name = message.name?.trim() || 'there'

  switch (message.template) {
    case 'verify_email':
      return actionEmail(
        'Verify your email address',
        `Hi ${name}, verify your email address to finish setting up your account.`,
        'Verify email',
        requiredActionUrl(message),
      )
    case 'reset_password':
      return actionEmail(
        'Reset your password',
        `Hi ${name}, use this secure link to choose a new password.`,
        'Reset password',
        requiredActionUrl(message),
      )
    case 'delete_account':
      return actionEmail(
        'Confirm account deletion',
        `Hi ${name}, confirm that you want to permanently delete your account and its data.`,
        'Delete account',
        requiredActionUrl(message),
      )
    case 'welcome':
      return {
        html: layout(
          `<h1>Welcome to Micropreneur Starter</h1><p>Hi ${escapeHtml(name)}, your account is ready. Start with the Operations Registry and replace the example domain when your product takes shape.</p>`,
        ),
        subject: 'Welcome to Micropreneur Starter',
        text: `Hi ${name}, your account is ready. Start with the Operations Registry and replace the example domain when your product takes shape.`,
      }
    default: {
      const unhandled: never = message.template
      throw new Error(`Unsupported email template: ${String(unhandled)}`)
    }
  }
}

function actionEmail(subject: string, introduction: string, label: string, actionUrl: string) {
  const safeUrl = escapeHtml(actionUrl)
  return {
    html: layout(
      `<h1>${escapeHtml(subject)}</h1><p>${escapeHtml(introduction)}</p><p><a href="${safeUrl}" style="display:inline-block;border-radius:8px;background:#2563eb;color:#fff;padding:10px 16px;text-decoration:none">${escapeHtml(label)}</a></p><p style="color:#667085;font-size:13px">If the button does not work, copy this URL: ${safeUrl}</p>`,
    ),
    subject,
    text: `${introduction}\n\n${label}: ${actionUrl}`,
  }
}

function layout(content: string) {
  return `<div style="margin:0 auto;max-width:560px;padding:32px 20px;font-family:Arial,sans-serif;color:#151923;line-height:1.6">${content}<p style="margin-top:32px;color:#667085;font-size:12px">Micropreneur Starter</p></div>`
}

function requiredActionUrl(message: EmailMessage) {
  if (!message.actionUrl) throw new Error(`${message.template} requires an action URL`)
  return message.actionUrl
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

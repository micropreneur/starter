import { Resend } from 'resend'

import type { EmailPort } from '../port'
import { renderEmail } from '../templates'

export interface ResendEmailAdapterOptions {
  apiKey: string
  from: string
}

export function createResendEmailAdapter(options: ResendEmailAdapterOptions): EmailPort {
  if (!options.apiKey.trim()) throw new Error('RESEND_API_KEY is required for the Resend adapter.')
  if (!options.from.trim()) throw new Error('EMAIL_FROM is required for the Resend adapter.')
  const resend = new Resend(options.apiKey)

  return {
    provider: 'resend',
    async send(message) {
      const rendered = renderEmail(message)
      const { data, error } = await resend.emails.send({
        from: options.from,
        html: rendered.html,
        subject: rendered.subject,
        text: rendered.text,
        to: message.to,
      })

      if (error || !data) throw new Error(error?.message ?? 'Resend did not return a delivery ID.')
      return { id: data.id }
    },
  }
}

import type { EmailDelivery, EmailMessage, EmailPort } from '../port'
import { renderEmail } from '../templates'

export type LocalEmailReporter = (delivery: {
  id: string
  message: EmailMessage
  subject: string
}) => void

export function createLocalEmailAdapter(report: LocalEmailReporter = defaultReporter): EmailPort {
  return {
    provider: 'local',
    async send(message): Promise<EmailDelivery> {
      const id = `local_${crypto.randomUUID()}`
      report({ id, message, subject: renderEmail(message).subject })
      return { id }
    },
  }
}

function defaultReporter(delivery: { id: string; message: EmailMessage; subject: string }) {
  const action = delivery.message.actionUrl ? ` action=${delivery.message.actionUrl}` : ''
  console.info(
    `[email:local] ${delivery.id} to=${delivery.message.to} subject=${delivery.subject}${action}`,
  )
}

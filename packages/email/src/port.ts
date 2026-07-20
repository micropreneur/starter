export type EmailTemplate = 'verify_email' | 'reset_password' | 'welcome' | 'delete_account'

export interface EmailMessage {
  template: EmailTemplate
  to: string
  name?: string
  actionUrl?: string
}

export interface EmailDelivery {
  id: string
}

export interface EmailPort {
  readonly provider: 'local' | 'resend'
  send(message: EmailMessage): Promise<EmailDelivery>
}

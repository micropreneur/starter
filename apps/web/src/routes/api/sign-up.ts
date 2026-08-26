import { env as cloudflareEnv } from 'cloudflare:workers'
import { createDb } from '@micropreneur/db'
import { completePersonalWorkspaceOnboardingForEmail } from '@micropreneur/workspaces'
import { createFileRoute } from '@tanstack/react-router'

import type { WebEnv } from '../../env'
import { getAuth } from '../../lib/auth.server'
import { invalidInputResponse, parseSignUpRequest, readJsonBody } from '../../lib/auth-input'
import { verificationCallbackUrl } from '../../lib/auth-redirect'
import { turnstileRejectedResponse, verifyTurnstileChallenge } from '../../lib/turnstile.server'

export const Route = createFileRoute('/api/sign-up')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const input = parseSignUpRequest(await readJsonBody(request))
        if (!input) {
          return invalidInputResponse('valid account fields and a personal workspace name')
        }

        const env = cloudflareEnv as unknown as WebEnv
        if (
          !(await verifyTurnstileChallenge({
            action: 'sign_up',
            env,
            request,
            token: input.turnstileToken,
          }))
        ) {
          return turnstileRejectedResponse()
        }

        const response = await getAuth().signUp(
          {
            ...input.account,
            callbackUrl: verificationCallbackUrl(request.url, input.callbackUrl),
          },
          new Headers(request.headers),
        )
        if (!response.ok) return response

        try {
          await completePersonalWorkspaceOnboardingForEmail(
            createDb(env.DB),
            input.account.email,
            input.onboarding,
          )
        } catch (error) {
          // Account creation is already committed by the auth provider. The idempotent
          // onboarding route lets the user recover on their first authenticated visit.
          console.error('Personal workspace onboarding could not be completed after signup.', error)
        }

        return response
      },
    },
  },
})

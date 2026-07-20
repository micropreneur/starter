import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { getAuth } from './auth.server'
import { getBilling } from './billing.server'

export const getBillingOverview = createServerFn({ method: 'GET' }).handler(async () => {
  const user = await getAuth().requireUser(getRequestHeaders())
  const billing = getBilling()
  const [subscription, registryExport] = await Promise.all([
    billing.getSubscription(user.id),
    billing.hasFeature(user.id, 'registry.export'),
  ])
  return { configured: billing.configured, registryExport, subscription }
})

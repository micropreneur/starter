import { createFileRoute } from '@tanstack/react-router'

import { handleFileDelete, handleFileGet } from '../../../lib/files.handlers'

export const Route = createFileRoute('/api/files/logo')({
  server: {
    handlers: {
      DELETE: ({ request }) => handleFileDelete(request, 'logo'),
      GET: ({ request }) => handleFileGet(request, 'logo'),
    },
  },
})

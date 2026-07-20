import handler from '@tanstack/react-start/server-entry'

import type { WebEnv } from './env'
import { getAuth } from './lib/auth.server'
import { isRealtimeEnabled, resolveRealtimeRoomName } from './lib/realtime-security'

export { RealtimeRoom } from './durable-objects/realtime-room'

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/api/realtime/')) {
      if (!isRealtimeEnabled(env.REALTIME_ENABLED)) {
        return new Response('Not found.', { status: 404 })
      }

      try {
        const roomName = resolveRealtimeRoomName(request)
        const user = await getAuth().getUser(new Headers(request.headers))
        if (!user) return new Response('Authentication required.', { status: 401 })
        return env.REALTIME_ROOM.getByName(`${user.id}:${roomName}`).fetch(request)
      } catch (error) {
        if (error instanceof Response) return error
        throw error
      }
    }

    return handler.fetch(request)
  },
} satisfies ExportedHandler<WebEnv>

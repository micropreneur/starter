import { requireSameOrigin } from './request-security'

const REALTIME_PREFIX = '/api/realtime/'
const ROOM_NAME = /^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/i

export function isRealtimeEnabled(value: string | undefined) {
  return value === 'true'
}

export function resolveRealtimeRoomName(request: Request): string {
  requireSameOrigin(request)
  const encodedName = new URL(request.url).pathname.slice(REALTIME_PREFIX.length)
  let roomName: string
  try {
    roomName = decodeURIComponent(encodedName)
  } catch {
    throw new Response('Invalid realtime room name.', { status: 400 })
  }
  if (!ROOM_NAME.test(roomName)) {
    throw new Response('Invalid realtime room name.', { status: 400 })
  }
  return roomName
}

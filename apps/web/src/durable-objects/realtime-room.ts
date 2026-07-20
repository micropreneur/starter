import { DurableObject } from 'cloudflare:workers'

import type { WebEnv } from '../env'

/** Minimal realtime seam. Product-specific room state belongs in a fork. */
export class RealtimeRoom extends DurableObject<WebEnv> {
  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade.', { status: 426 })
    }

    const pair = new WebSocketPair()
    this.ctx.acceptWebSocket(pair[1])
    return new Response(null, { status: 101, webSocket: pair[0] })
  }

  override webSocketMessage(socket: WebSocket, message: string | ArrayBuffer): void {
    socket.send(message)
  }
}

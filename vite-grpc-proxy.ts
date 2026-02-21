/**
 * Vite dev-server plugin: gRPC-Web → gRPC proxy
 *
 * The browser sends gRPC-Web (HTTP/1.1) requests.
 * This plugin intercepts those in Node.js, calls the real gRPC backend
 * over HTTP/2, and returns a gRPC-Web response to the browser.
 */
import type { Plugin, Connect } from 'vite'
import { createClient } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'
import { HabitService } from './src/gen/backend_connect'
import {
  CreateHabitRequest,
  GetAllHabitsRequest,
  LogHabitCompletionRequest,
  GetHabitHistoryRequest,
} from './src/gen/backend_pb'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ── gRPC-Web framing helpers ─────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function decodeDataFrame(body: Buffer): Buffer {
  // byte 0 = flags, bytes 1-4 = big-endian length, rest = proto
  const len = body.readUInt32BE(1)
  return body.subarray(5, 5 + len)
}

function encodeDataFrame(data: Uint8Array): Buffer {
  const buf = Buffer.alloc(5 + data.length)
  buf[0] = 0x00 // not compressed
  buf.writeUInt32BE(data.length, 1)
  Buffer.from(data).copy(buf, 5)
  return buf
}

function encodeTrailerFrame(status: number, message: string): Buffer {
  const trailer = `grpc-status: ${status}\r\ngrpc-message: ${encodeURIComponent(message)}\r\n`
  const trailerBytes = Buffer.from(trailer, 'utf8')
  const buf = Buffer.alloc(5 + trailerBytes.length)
  buf[0] = 0x80 // trailer flag
  buf.writeUInt32BE(trailerBytes.length, 1)
  trailerBytes.copy(buf, 5)
  return buf
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export function grpcProxyPlugin(): Plugin {
  const transport = createGrpcTransport({
    baseUrl: 'http://localhost:4001',
    httpVersion: '2',
  })
  const client = createClient(HabitService, transport)

  async function handleGrpc(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    const method = (req.url ?? '').split('/').pop() ?? ''

    const corsHeaders: Record<string, string> = {
      'Content-Type': 'application/grpc-web+proto',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': 'grpc-status,grpc-message',
    }

    try {
      const body = await readBody(req)
      const proto = body.length >= 5 ? decodeDataFrame(body) : Buffer.alloc(0)
      let responseBytes: Uint8Array

      if (method === 'CreateHabit') {
        const msg = CreateHabitRequest.fromBinary(proto)
        responseBytes = (await client.createHabit(msg)).toBinary()
      } else if (method === 'GetAllHabits') {
        const msg = GetAllHabitsRequest.fromBinary(proto)
        responseBytes = (await client.getAllHabits(msg)).toBinary()
      } else if (method === 'LogHabitCompletion') {
        const msg = LogHabitCompletionRequest.fromBinary(proto)
        responseBytes = (await client.logHabitCompletion(msg)).toBinary()
      } else if (method === 'GetHabitHistory') {
        const msg = GetHabitHistoryRequest.fromBinary(proto)
        responseBytes = (await client.getHabitHistory(msg)).toBinary()
      } else {
        res.writeHead(404)
        res.end()
        return
      }

      const payload = Buffer.concat([
        encodeDataFrame(responseBytes),
        encodeTrailerFrame(0, ''),
      ])
      res.writeHead(200, corsHeaders)
      res.end(payload)
    } catch (err: unknown) {
      const code = (err as { code?: number }).code ?? 2
      const message = err instanceof Error ? err.message : String(err)
      res.writeHead(200, corsHeaders)
      res.end(encodeTrailerFrame(code, message))
    }
  }

  return {
    name: 'grpc-web-proxy',
    configureServer(server) {
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': '*',
            })
            res.end()
            return
          }

          if (req.url?.startsWith('/habits.HabitService/')) {
            handleGrpc(req, res).catch((e) => {
              console.error('[grpc-proxy]', e)
              res.writeHead(500)
              res.end()
            })
            return
          }

          next()
        },
      )
    },
  }
}

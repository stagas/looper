import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts'
import os from 'https://deno.land/x/os_paths@v7.4.0/src/mod.deno.ts'
import * as media from 'jsr:@std/media-types'
import * as path from 'jsr:@std/path'

const IS_DEV = !Deno.env.get('DENO_REGION')

const env = await load({
  envPath: IS_DEV ? '.env.local' : '.env'
})

const commonHeaders: HeadersInit = {
  'access-control-allow-origin': env.PUBLIC_URL,
  'access-control-allow-methods': 'GET, HEAD, OPTIONS, POST, PUT',
  'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
}

const distDir = './dist'

const homedir = os.home() ?? '~'

const healthOk = JSON.stringify({ health: 'ok' })

let serveOpts = IS_DEV ? {
  key: Deno.readTextFileSync(path.join(homedir, '.ssl-certs', 'devito.test-key.pem')),
  cert: Deno.readTextFileSync(path.join(homedir, '.ssl-certs', 'devito.test.pem')),
} : {}

Deno.serve({
  port: 3000,
  hostname: '0.0.0.0',
  ...serveOpts,
  onListen(addr) {
    console.log(`File server running on https://${addr.hostname}:${addr.port}/`)
  }
}, async (request) => {
  const url = new URL(request.url)
  const pathname = decodeURIComponent(url.pathname)

  if (pathname === '/health') {
    return new Response(healthOk, {
      headers: {
        ...commonHeaders,
        'content-type': 'application/json'
      }
    })
  }

  let file
  let filepath
  out: try {
    filepath = path.join(pathname, 'index.html')
    file = await Deno.open(`${distDir}${filepath}`, { read: true })
  }
  catch {
    try {
      filepath = pathname
      file = await Deno.open(`${distDir}${filepath}`, { read: true })
      break out
    }
    catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        const notFoundResponse = new Response('404 Not Found', { status: 404 })
        return notFoundResponse
      }
    }
    return new Response(null, { status: 500 })
  }

  const readableStream = file.readable
  return new Response(readableStream, {
    headers: {
      'content-type': media.typeByExtension(path.extname(filepath)) ?? 'text/plain'
    }
  })
})

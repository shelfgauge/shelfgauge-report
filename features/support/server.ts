import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'

export const REQUESTS = [] as any[]
export const ERRORS = [] as any[]

export function reset () {
  REQUESTS.length = 0
  ERRORS.length = 0
}

export function lastRequest () {
  if (ERRORS.length > 0) {
    throw new Error(ERRORS.join('\n'))
  }
  return REQUESTS[0]
}

export const app =
  new Koa()
    .on('error', (err: Error) => ERRORS.push(err))
    .use(bodyParser())
    .use((ctx, next) => REQUESTS.push(ctx.request.body))
    .listen()

export function address (): string {
  const addr = app.address()
  if (addr.address.includes(':')) {
    return `[${addr.address}]:${addr.port}`
  } else {
    return `${addr.address}:${addr.port}`
  }
}

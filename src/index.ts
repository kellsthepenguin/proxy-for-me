import { createServer } from 'http'
import { createProxyServer } from 'http-proxy'
import _settings from '../settings.json'

interface Settings {
  fallback: string
  port: number
  rules: {
    [hostname: string]: {
      dest: string
      login: boolean
    }
  }
}

const proxy = createProxyServer()
const server = createServer()

const settings = _settings as Settings

server.on('request', (req, res) => {
  const fullHost = req.headers.host || ''
  const hostname = new URL(`http://${fullHost}`).hostname
  const rule = settings.rules[hostname]
  const target = rule == undefined ? settings.fallback : rule.dest

  proxy.web(req, res, {
    target,
    headers: { host: new URL(target).hostname }
  })
})

server.listen(settings.port)

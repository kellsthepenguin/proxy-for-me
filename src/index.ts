import express from 'express'
import proxy from 'express-http-proxy'
import { readFileSync } from 'fs'

import jwt from 'jsonwebtoken'

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

const app = express()

const settings = _settings as Settings
// const secret = readFileSync('./private.key')

app.use(
  '/*path',
  proxy((req) => {
    const rule = settings.rules[req.hostname]
    const target = rule == undefined ? settings.fallback : rule.dest

    return target
  })
)

app.listen(settings.port)

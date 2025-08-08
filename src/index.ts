import express from 'express'
import proxy from 'express-http-proxy'
import { readFileSync } from 'fs'
import path from 'path'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

import _settings from '../settings.json'

interface Settings {
  auth: {
    id: string
    pw: string
  }
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
const secret = readFileSync('./private.key')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

app.use('/static', express.static('./static'))

app.post('/login', (req, res) => {
  const { id, pw } = req.body

  if (settings.auth.id === id && settings.auth.pw === pw) {
    const token = jwt.sign({ id }, secret)

    res.cookie('token_proxyforme', token, {
      httpOnly: true,
      sameSite: 'strict'
    })
    const { to } = req.query

    console.log(req.query)

    if (to) {
      return res.send(
        `<script>alert('Login Successful!');location.href='${to}'</script>`
      )
    }

    return res.send(`<script>alert('Login Successful!');</script>`)
  }

  res.send("<script>alert('Login Failed');history.back()</script>")
})

app.use((req, res, next) => {
  if (req.path.startsWith('/static')) return next()

  const token = req.cookies.token_proxyforme
  try {
    jwt.verify(token, secret)
  } catch (_) {
    return res.redirect('/static/login_pfm.html?to=' + req.path)
  }

  return proxy((req) => {
    const rule = settings.rules[req.hostname]
    return rule ? rule.dest : settings.fallback
  })(req, res, next)
})

app.listen(settings.port)

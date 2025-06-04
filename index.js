const { createProbot } = require('probot')
const { resolveAppFunction } = require('probot/lib/helpers/resolve-app-function.js')
const { template } = require('./views/probot.js')

/** @type {import("probot").Probot} */
let probot

const loadProbot = appFn => {
  probot = probot || createProbot({
    id: process.env.APP_ID,
    secret: process.env.WEBHOOK_SECRET
  })

  if (typeof appFn === 'string') {
    appFn = resolveAppFunction(appFn)
  }

  probot.load(appFn)

  return probot
}

module.exports.serverless = appFn => {
  return async (request, response) => {
    // 🤖 A friendly homepage if there isn't a payload
    if (request.method === 'GET' && request.path === '/probot') {
      return response.send({
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: template
      })
    }

    // Otherwise let's listen handle the payload
    probot = probot || loadProbot(appFn)

    // Determine incoming webhook event type
    const name = request.get('x-github-event') || request.get('X-GitHub-Event')
    const id = request.get('x-github-delivery') || request.get('X-GitHub-Delivery')

    // Do the thing
    console.log(`Received event ${name}${request.body.action ? ('.' + request.body.action) : ''}`)
    if (name) {
      try {
        await probot.receive({
          name,
          id,
          payload: request.body
        })
        response.send({
          statusCode: 200,
          body: JSON.stringify({ message: 'Executed' })
        })
      } catch (err) {
        console.error(err)
        response.send({
          statusCode: 500,
          body: JSON.stringify({ message: err })
        })
      }
    } else {
      console.error(request)
      response.sendStatus(400)
    }
  }
}

const { serverless } = require('../index.js')

describe('serverless-gcf', () => {
  let spy, handler, response

  beforeEach(() => {
    response = { send: jest.fn(), sendStatus: jest.fn() }
    spy = jest.fn()
    handler = serverless(async app => {
      app.auth = () => Promise.resolve({})
      app.on('issues', spy)
    })
  })

  it('responds with the homepage', async () => {
    const request = { method: 'GET', path: '/probot' }
    await handler(request, response)
    expect(response.send).toHaveBeenCalled()
    expect(response.send.mock.calls[0][0]).toMatchSnapshot()
  })

  it('calls the event handler', async () => {
    const request = {
      body: {
        installation: { id: 1 }
      },
      get (string) {
        return this[string]
      },
      'x-github-event': 'issues',
      'x-github-delivery': 123
    }

    await handler(request, response)
    expect(response.send).toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
  })

  it('does nothing if there are missing headers', async () => {
    const request = {
      body: {
        installation: { id: 1 }
      },
      get (string) {
        return this[string]
      }
    }

    await handler(request, response)
    expect(response.send).not.toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
    expect(response.sendStatus).toHaveBeenCalledWith(400)
  })
})

#!/usr/bin/env node

var fs = require('fs')
var url = require('url')
var os = require('os')
var path = require('path')

function makeRequest (target, callback) {
  if (!/https?:/.test(target)) {
    target = 'http://' + target
  }

  var uri = url.parse(target)
  var http = require(uri.protocol === 'https:' ? 'https' : 'http')
  var params = {
    method: 'POST',
    hostname: uri.hostname,
    port: uri.port,
    path: uri.path,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  return http.request(params, callback)
}

function body (tests) {
  if (process.env.TRAVIS === 'true') {
    return travisBody(tests)
  }

  if (process.env.CIRCLECI === 'true') {
    return circleBody(tests)
  }

  throw new Error('Build environment not supported')
}

function travisBody (tests) {
  return {
    authorization: process.env.SHELFGAUGE_AUTH,
    data: {
      ref: process.env.TRAVIS_COMMIT,
      name: process.env.TRAVIS_BRANCH,
      ranAt: new Date().toISOString(),
      tests: tests,
      env: {
        source: 'travis',
        info: [
          'CPU: ' + os.cpus()[0].model,
          'Platform: ' + os.platform(),
          'Build id: ' + process.env.TRAVIS_BUILD_ID,
          'Job id: ' + process.env.TRAVIS_JOB_ID
        ].join('\n')
      },
    },
  }
}

function circleBody (tests) {
  return {
    authorization: process.env.SHELFGAUGE_AUTH,
    data: {
      ref: process.env.CIRCLE_SHA1,
      name: process.env.CIRCLE_BRANCH,
      ranAt: new Date().toISOString(),
      tests: tests,
      env: {
        source: 'circle',
        info: [
          'CPU: ' + os.cpus()[0].model,
          'Platform: ' + os.platform(),
          'Build num: ' + process.env.CIRCLE_BUILD_NUM
        ].join('\n')
      },
    },
  }
}

function once (callback) {
  var wasCalled = false
  return function () {
    if (wasCalled) {
      return
    }

    callback.apply(this, arguments)
    wasCalled = true
  }
}

function post (tests, url, done) {
  var doneOnce = once(done)

  try {
    var data = JSON.stringify(body(tests))
    var req = makeRequest(url, function (res) {
      var data = ''
      res.on('data', function (chunk) {
        data += chunk
      })
      res.on('error', function (err) {
        doneOnce(err)
      })
      res.on('end', function () {
        doneOnce(null, data)
      })
    })

    req.on('error', function (err) {
      doneOnce(err)
    })

    req.write(data)
    req.end()
  } catch (err) {
    doneOnce(err)
  }
}

if (require.main === module) {
  var done = once(function (err, data) {
    if (err) {
      console.error(err)
      process.exit(1)
    } else {
      console.log(data)
    }
  })

  var file = process.argv[2]
  var addr = process.argv[3]

  if (!file || !addr) {
    return done("usage: node " + path.basename(__filename) + " tests.json http://shelfgauge.url")
  }

  try {
    var tests = JSON.parse(fs.readFileSync(file))
    post(tests, addr, done)
  } catch (err) {
    done(err)
  }
} else {
  exports.post = post
  exports.body = body
}

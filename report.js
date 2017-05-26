var fs = require('fs')
var url = require('url')

function consumeAll (filelike, done) {
  var data = ''
  filelike.on('data', function (chunk) {
    data += chunk
  })
  filelike.on('error', function (err) {
    done(err)
  })
  filelike.on('end', function () {
    done(null, data)
  })
}

function makeRequest (target, callback) {
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

function generateTravisData (tests) {
  return {
    authorization: process.env.SHELFGAUGE_AUTH,
    data: {
      ref: process.env.TRAVIS_COMMIT,
      name: process.env.TRAVIS_BRANCH,
      ranAt: new Date().toISOString(),
      tests: tests,
      env: {
        source: 'travis',
        info: (
          'Build id: ' + process.env.TRAVIS_BUILD_ID + '\n' +
          'Job id: ' + process.env.TRAVIS_JOB_ID
        ),
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

function postData (url, tests, done) {
  var doneOnce = once(done)

  var data = generateTravisData(tests)
  var req = makeRequest(url, function (res) {
    consumeAll(res, doneOnce)
  })

  req.on('error', function (err) {
    doneOnce(err)
  })

  req.write(JSON.stringify(data))
  req.end()
}

if (require.main === module) {
  var done = once(function (err, data) {
    if (err) {
      console.error(err)
    } else {
      console.log(data)
    }
  })

  consumeAll(process.stdin, function (err, stdin) {
    if (err) {
      done(err)
    }

    try {
      var tests = JSON.parse(stdin)
      postData(process.argv[2], tests, done)
    } catch (err) {
      done(err)
    }
  })
} else {
  module.exports = post
}

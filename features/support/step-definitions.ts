import * as fs from 'fs'
import * as os from 'os'
import { defineSupportCode } from 'cucumber'
import { exec } from 'child_process'
const matchPattern = require('lodash-match-pattern')
import * as server from './server'

defineSupportCode(({ Given, When, Then, Before, After }) => {
  const ENV = { ...process.env } as { [key: string]: string }

  let testfile: string

  Before(() => {
    server.reset()
  })

  After(() => {
    if (testfile) {
      fs.unlinkSync(testfile)
    }
  })

  Given('the following environment variables:', (str: string) => {
    for (const env of str.split('\n')) {
      const [name, value] = env.split('=')
      ENV[name] = value
    }
  })

  Given('the following test file:', (jsonString: string) => {
    testfile = os.tmpdir() + '/' + Math.floor(Math.random() * 1000000)
    fs.appendFileSync(testfile, jsonString)
  })

  When('I run "{bashCommand}"', (bashCommand: string) => {
    return new Promise((resolve, reject) => {
      const command = bashCommand.replace('$testfile', testfile)
                                 .replace('$testserver', server.address())

      exec(command, { env: ENV }, (err, stdout, stderr) => {
        if (err) {
          reject(err)
        } else {
          resolve(process)
        }
      })
    })
  })

  Then('output should match pattern:', (pattern: string) => {
    pattern = pattern.replace(/\$([A-Z_]+)/g, (match, envName) => ENV[envName])
    const failMessage = matchPattern(server.lastRequest(), pattern)
    if (failMessage) {
      throw new Error(failMessage)
    }
  })
})

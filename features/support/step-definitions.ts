import * as fs from 'fs'
import * as os from 'os'
import { defineSupportCode } from 'cucumber'
import { exec } from 'child_process'
const matchPattern = require('lodash-match-pattern')

defineSupportCode(({ Given, When, Then, After }) => {
  const ENV = { ...process.env } as { [key: string]: string }

  let testfile: string
  let capture: { err: Error, stdout: string, stderr: string }

  Given('the following environment variables:', (str: string) => {
    for (const env of str.split('\n')) {
      const [name, value] = env.split('=')
      console.log(env)
      ENV[name] = value
    }
  })

  Given('the following test file:', (jsonString: string) => {
    testfile = os.tmpdir() + '/' + Math.floor(Math.random() * 1000000)
    fs.appendFileSync(testfile, jsonString)
  })

  When('I run "{bashCommand}"', (bashCommand: string) => {
    return new Promise((resolve, reject) => {
      const child = exec(bashCommand.trim().replace('$testfile', testfile), { env: ENV }, (err, stdout, stderr) => {
        capture = { err, stdout, stderr }
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
    const output = JSON.parse(capture.stdout)
    const failMessage = matchPattern(output, pattern)
    if (failMessage) {
      throw new Error(failMessage)
    }
  })

  After(() => {
    if (testfile) {
      fs.unlinkSync(testfile)
    }
  })
})

import * as fs from "fs";
import * as os from "os";
import { defineSupportCode } from "cucumber";
import { exec } from "child_process";
const matchPattern = require("lodash-match-pattern");
import * as server from "./server";

function replaceVars(string: string, vars: { [key: string]: string }): string {
  return string.replace(
    /\$([A-Za-z0-9_]+)/g,
    (_, capture) => vars[capture] || capture
  );
}

defineSupportCode(({ Given, When, Then, Before, After }) => {
  const ENV = { ...process.env } as { [key: string]: string };

  let testfile: string;
  let lastCommand: { stdout: string; stderr: string };

  Before(() => {
    server.reset();
  });

  After(() => {
    if (testfile) {
      fs.unlinkSync(testfile);
    }
  });

  Given("the following environment variables:", (str: string) => {
    for (const env of str.split("\n")) {
      const [name, value] = env.split("=");
      ENV[name] = value;
    }
  });

  Given("the following test file:", (jsonString: string) => {
    testfile = os.tmpdir() + "/" + Math.floor(Math.random() * 1000000);
    fs.appendFileSync(testfile, jsonString);
  });

  When('I run "{bashCommand}"', (bashCommand: string) => {
    return new Promise((resolve, reject) => {
      const command = replaceVars(bashCommand, {
        testfile: testfile,
        testserver: server.address()
      });

      exec(command, { env: ENV }, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          lastCommand = { stdout, stderr };
          resolve(process);
        }
      });
    });
  });

  Then("the output should match server response", () => {
    if (lastCommand.stdout.trim() !== server.lastResponse().trim()) {
      throw new Error(
        `Output did not match server response: ${lastCommand.stdout}`
      );
    }
  });

  Then("the server should receive:", (pattern: string) => {
    pattern = replaceVars(pattern, ENV);
    const json = JSON.parse(server.lastRequest());
    const failMessage = matchPattern(json, pattern);
    if (failMessage) {
      throw new Error(failMessage);
    }
  });
});

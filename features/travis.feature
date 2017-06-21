Feature: travis
  Scenario Outline: travis
      Given the following environment variables:
            """
            SHELFGAUGE_AUTH=abcde
            TRAVIS=true
            TRAVIS_COMMIT=12345
            TRAVIS_BRANCH=master
            TRAVIS_BUILD_ID=1
            TRAVIS_JOB_ID=11
            """
        And the following test file:
            """
            [
              { "name": "hello", "value": 1.0 }
            ]
            """
       When I run "<program> $testfile $testserver"
       Then the output should match server response
        And the server should receive:
            """
            {
              "authorization": "$SHELFGAUGE_AUTH",
              "data": {
                "ref": "$TRAVIS_COMMIT",
                "name": "$TRAVIS_BRANCH",
                "ranAt": _.isString,
                "env": {
                  "source": "travis",
                  "info": _.isString
                },
                "tests": [
                  { "name": "hello", "value": 1.0 }
                ]
              }
            }
            """
      Given the following environment variables:
            """
            TRAVIS_PULL_REQUEST=false
            """
       When I run "<program> $testfile $testserver"
       Then the server should receive:
            """
            {
              "authorization": "$SHELFGAUGE_AUTH",
              "data": {
                "pullRequest": _.isUndefined
                ...
              }
            }
            """
      Given the following environment variables:
            """
            TRAVIS_PULL_REQUEST=1
            """
       When I run "<program> $testfile $testserver"
       Then the server should receive:
            """
            {
              "authorization": "$SHELFGAUGE_AUTH",
              "data": {
                "pullRequest": "$TRAVIS_PULL_REQUEST"
                ...
              }
            }
            """
  Examples:
      | program        |
      | node/report.js |
      | ruby/report.rb |

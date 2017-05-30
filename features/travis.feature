Feature: travis
  Scenario: node
      Given the following environment variables:
            """
            SHELFGAUGE_AUTH=abcde
            TRAVIS=true
            TRAVIS_COMMIT=12345
            TRAVIS_BRANCH=master
            """
        And the following test file:
            """
            [
              { "name": "hello", "value": 1.0}
            ]
            """
       When I run "node node/report.js $testfile"
       Then output should match pattern:
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

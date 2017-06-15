#!/usr/bin/env ruby

require 'date'
require 'net/http'
require 'json'

module ShelfgaugeReport
  def self.post(tests, url, &block)
    if url !~ /https?:/
      url = 'http://' + url
    end

    uri = URI(url)
    data = JSON.dump(body(tests))

    Net::HTTP.start(uri.host.gsub(/^\[(.*)\]$/, '\1'), uri.port) do |http|
      path = uri.path.empty? ? '/' : uri.path
      http.request_post(path, data, "Content-Type" => "application/json") do |res|
        res.read_body(&block)
      end
    end
  end

  def self.body(tests)
    if (ENV['TRAVIS'] == 'true')
      return travis_body(tests)
    end

    throw new Error('Build environment not supported')
  end

  def self.travis_body(tests)
    {
      authorization: ENV['SHELFGAUGE_AUTH'],
      data: {
        ref: ENV.fetch('TRAVIS_COMMIT', 'undefined'),
        name: ENV.fetch('TRAVIS_BRANCH', 'undefined'),
        ranAt: DateTime.now.iso8601,
        tests: tests,
        env: {
          source: 'travis',
          info: [
            'CPU: ' + 'TODO',
            'Platform: ' + RUBY_PLATFORM,
            'Build id: ' + ENV.fetch('TRAVIS_BUILD_ID', 'undefined'),
            'Job id: ' + ENV.fetch('TRAVIS_JOB_ID', 'undefined')
          ].join('\n')
        },
      },
    }
  end
end

if __FILE__ == $0
  file = ARGV[0]
  addr = ARGV[1]

  if !file || !addr
    $stderr.puts "usage: ruby #{__FILE__} tests.json http://shelfgauge.url"
    exit 1
  end

  tests = JSON.parse(IO.read(file))

  ShelfgaugeReport.post(tests, addr) do |body|
    puts body
  end
end

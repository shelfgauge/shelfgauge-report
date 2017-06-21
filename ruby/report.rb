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
    compacterize({
      authorization: ENV['SHELFGAUGE_AUTH'],
      data: {
        ref: ENV['TRAVIS_COMMIT'],
        name: ENV['TRAVIS_BRANCH'],
        pullRequest: env('TRAVIS_PULL_REQUEST', ignore: 'false'),
        ranAt: DateTime.now.iso8601,
        tests: tests,
        env: {
          source: 'travis',
          info: [
            'CPU: ' + 'TODO',
            'Platform: ' + RUBY_PLATFORM,
            'Build id: ' + env('TRAVIS_BUILD_ID', default: 'undefined'),
            'Job id: ' + env('TRAVIS_JOB_ID', default: 'undefined')
          ].join('\n')
        },
      },
    })
  end

  def self.compacterize(obj)
    case obj
      when Array then obj.compact.map { |item| compacterize(item) }
      when Hash then obj.each_with_object({}) { |(key, item), hash| !item.nil? && hash[key] = compacterize(item) }
      else obj
    end
  end

  def self.env(name, options)
    if ENV[name] && ENV[name] != options[:ignore]
      ENV[name]
    else
      options[:default]
    end
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

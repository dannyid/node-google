var request = require('request');
var cheerio = require('cheerio');
var querystring = require('querystring');
var util = require('util');

var result = 'div.g div.rc';
var titleSel = 'h3.r a';
var linkSel = '.f cite';
var descSel = 'span.st';
var nextSel = 'td.b a span';

var URL = 'http://www.google.%s/search?hl=%s&q=%s&start=%s&sa=N&num=%s&ie=UTF-8&oe=UTF-8';

var nextTextErrorMsg = 'Translate `google.nextText` option to selected language to detect next results link.';

// start parameter is optional
function google (query, start, callback) {
  var startIndex = 0;
  if (typeof callback === 'undefined') {
    callback = start;
  } else {
    startIndex = start;
  }
  igoogle(query, startIndex, callback);
}

google.resultsPerPage = 10;
google.tld = 'com';
google.lang = 'en';
google.requestOptions = {};
google.nextText = 'Next';

var igoogle = function (query, start, callback) {
  if (google.resultsPerPage > 100) google.resultsPerPage = 100; // Google won't allow greater than 100 anyway
  if (google.lang !== 'en' && google.nextText === 'Next') console.warn(nextTextErrorMsg);

  // timeframe is optional. splice in if set
  if (google.timeSpan) {
    URL = URL.indexOf('tbs=qdr:') >= 0 ? URL.replace(/tbs=qdr:[snhdwmy]\d*/, 'tbs=qdr:' + google.timeSpan) : URL.concat('&tbs=qdr:', google.timeSpan);
  }

  var newUrl = util.format(URL, google.tld, google.lang, querystring.escape(query), start, google.resultsPerPage);
  var requestOptions = {
    url: newUrl,
    method: 'GET',
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.132 Safari/537.36'
    }
  };

  for (var k in google.requestOptions) {
    requestOptions[k] = google.requestOptions[k];
  }

  request(requestOptions, function (err, resp, body) {
    console.log('danny');
    if ((err === null) && resp.statusCode === 200) {
      var $ = cheerio.load(body);
      var links = [];

      $(result).each(function (i, elem) {
        console.log(elem);
        var titleElem = $(elem).find(titleSel);
        var descElem = $(elem).find(descSel);
        var linkElem = $(elem).find(linkSel);
        var item = {
          title: $(titleElem).text(),
          link: $(linkElem).text(),
          description: $(descElem).text(),
          href: null
        };

        links.push(item);
      });

      var nextFunc = null;
      if ($(nextSel).last().text() === google.nextText) {
        nextFunc = function () {
          igoogle(query, start + google.resultsPerPage, callback);
        };
      }

      callback(null, nextFunc, links);
    } else {
      callback(new Error('Error on response' + (resp ? ' (' + resp.statusCode + ')' : '') + ':' + err + ' : ' + body), null, null);
    }
  });
};

module.exports = google;

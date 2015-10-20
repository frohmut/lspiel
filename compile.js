'use strict';

/* compile jsx to js and include dependencies */
var fs = require('fs');
var browserify = require('browserify');
var babelify = require('babelify');

browserify({})
  .transform(babelify)
  .require("./lspiel.js", { entry: true })
  .bundle()
  .pipe(fs.createWriteStream("bundle.js"))
;

/* render initial state as html */
require('babel/register');
var React = require('react');
var ReactDOM = require('react-dom/server');

var l = require('./lspiel.js');

var LGameFactory = React.createFactory(l.LGame);
var htmlBoard = ReactDOM.renderToString(LGameFactory());

fs.readFile("index_template.html", 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/<react-prerendered\/>/g, htmlBoard);

  fs.writeFile("index.html", result, 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  });
});

/* global require */
/* eslint no-console: 0 */

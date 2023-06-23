"use strict";
// var TextEncoderClass = Java.type('com.telebott.goograms.util.TextEncoder');
// var TextEncoder = TextEncoderClass
// import App from '../App/index'
var TextEncoder = function (encoding) {

  this.encode = function (v) {
    print(v);
  }

  __proto__.staticMethod = function () {
    print("This is static");
  }
  {
    if (typeof encoding === "undefined") {
      encoding = 'utf-8';
    }
    this.encoding = encoding;
  }
}

module.exports = global.TextEncoder || TextEncoder


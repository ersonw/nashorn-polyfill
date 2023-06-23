var global = this;
var self = this;
var window = this;
// var document = this;
var process = {env: {}};
var console = {};
console.debug = print;
console.warn = print;
console.log = print;
console.error = print;
console.trace = print;
// load("nashorn:mozilla_compat.js")
Object.assign = function (t) {
  for (var s, i = 1, n = arguments.length; i < n; i++) {
    s = arguments[i];
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
      t[p] = s[p];
  }
  return t;
};

// function addMethod(object, name, fn) {
//   var old = object[name];
//   object[name] = function (...args){
//     if (args.length === fn.length){
//       return fn.apply(this, args);
//     }else{
//       return old.apply(this, args);
//     }
//   }
// }

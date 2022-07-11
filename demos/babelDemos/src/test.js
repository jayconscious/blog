const babel = require("@babel/core");

const res = babel.transformSync("[1, 2, 3].map(n => n + 1)", {});

console.log(res)
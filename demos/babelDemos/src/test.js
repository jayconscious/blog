// const babel = require("@babel/core");
// const res = babel.transformSync("[1, 2, 3].map(n => n + 1)", {});
// console.log(res)

const fs = require('fs')

const code = "function square(n) {return n * n;}"

// const code = `function square(n) {
//   return n * n;
// }`;

// const ast = parser.parse(code);

const babelParser = require("@babel/parser")
const traverse = require("@babel/traverse")

const ast =  babelParser.parse(code)
// const res = fs.writeFileSync('astOutput.json', JSON.stringify(ast, null, 4))

console.log(typeof traverse)

const traverseAst = traverse(ast, {
  enter(path) {
    if (path.isIdentifier({ name: "n" })) {
      path.node.name = "x";
    }
  },
})

const res = fs.writeFileSync('traverseAstOutput.json', JSON.stringify(traverseAst, null, 4))



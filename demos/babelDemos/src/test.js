// const babel = require("@babel/core");
// const res = babel.transformSync("[1, 2, 3].map(n => n + 1)", {});
// console.log(res)

const fs = require('fs')

const code = `function square(n) {
  return n * n;
}`;

const babelParser = require("@babel/parser")
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;

const ast =  babelParser.parse(code)

fs.writeFileSync('astbefore.json', JSON.stringify(ast, null, 4))

traverse(ast, {
  FunctionDeclaration: function(path) {
    path.node.id.name = "x";
  },
});

// fs.writeFileSync('astafter.json', JSON.stringify(ast, null, 4))

const output = generate(ast);

console.log(output); // { code: 'var a = 1;', map: null, rawMappings: undefined }

fs.writeFileSync('astafter.json', JSON.stringify(output?.code, null, 4))


// console.log(JSON.stringify(traverseAst, null, 4))

// const tres = fs.writeFileSync('traverseAstOutput.json', JSON.stringify(traverseAst, null, 4))

// const parser = require('@babel/parser')
// const t = require('@babel/types')
// const traverse = require('@babel/traverse').default

// let code = 'function a() {}'
// const ast = parser.parse(code)
// traverse(ast, {
//   FunctionDeclaration(path) {
//     const node = path.node
//     // 获取函数名称等
//     path.replaceWith()//替换为新的节点
//     path.remove() // 删除当前节点
//     path.skip() //跳过子节点
//     let copyNode = t.cloneNode(node)//复制当前节点
//     traverse(copyNode, {}, {}, path)// 对子树进行遍历和替换，不影响当前的path
//   }
// })



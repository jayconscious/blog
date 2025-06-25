// # node buffer 
// const { Duplex } = require('stream'); 
// const path = require('path');
// const filePath = path.resolve(__dirname, '1.txt');
// console.log('filePath', filePath)
// 二进制文件

// const b1 = Buffer.from('hello world'); // 创建一个 Buffer 实例
// console.log(b1); // <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>
// console.log(b1.toString()); // hello world

// const b2 = Buffer.alloc(10); // 创建一个长度为 10 的 Buffer 实例
// console.log(b2); // <Buffer 00 00 00 00 00 00 00 00 00 00>
// b2.write('hello'); // 写入数据到 Buffer
// console.log(b2); // <Buffer 68 65 6c 6c 6f 00 00 00 00 00>
// console.log(b2.toString()); // hello

// const cpu = require('os').cpus();
// console.log('CPU Info:', cpu);
// console.log('CPU Info:', cpu.length + ' cores');
// CPU Info: [
//   {
//     model: 'Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz',
//     speed: 2300,
//     times: { user: 15863260, nice: 0, sys: 11356250, idle: 71660880, irq: 0 }
//   },
//   {
//     model: 'Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz',
//     speed: 2300,
//     times: { user: 5186050, nice: 0, sys: 3093830, idle: 90710330, irq: 0 }
//   },
//   {
//     model: 'Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz',
//     speed: 2300,
//     times: { user: 15226060, nice: 0, sys: 8877720, idle: 74776260, irq: 0 }
//   },
//   {
//     model: 'Intel(R) Core(TM) i5-7360U CPU @ 2.30GHz',
//     speed: 2300,
//     times: { user: 4884140, nice: 0, sys: 2852080, idle: 91246880, irq: 0 }
//   }
// ]
// CPU Info: 4 cores


// const path = require('path'); // 引入 path 模块

// // path.join(__dirname, '1.text') // 拼接路径

// console.log('Path:', path.join(__dirname, '1.text')); // 输出路径
// console.log('Resolved Path:', path.resolve(__dirname, '1.text')); // 解析路径

// console.log(process.env.Node_ENV); // 输出 Node.js 环境变量
// console.log(process.env.NODE_ENV); // 输出 Node.js 环境变量，注意大小写
// console.log(process.env.NODE_ENV === 'production'); // 检查是否为生产环境
// console.log(process.env.NODE_ENV === 'development'); // 检查是否为开发环境
// console.log(process.env.NODE_ENV === 'test'); // 检查是否为测试环境
// console.log(process.env.NODE_ENV === 'staging'); // 检查是否为预发布环境
// console.log(process.env.NODE_ENV === 'local'); // 检查是否为本地     

// console.log(process.pid);
// console.log(process.cwd());




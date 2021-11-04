const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
    // console.log(this.url);
    console.log('第一个中间件函数')
    await next();
    console.log('第一个中间件函数next之后!');
})
app.use(async (ctx, next) => {
    console.log('第二个中间件函数')
    await next();
    console.log('第二个中间件函数next之后!');
})

app.use(async ctx => {
    ctx.body = 'Hello World';
});

app.listen(3000);   

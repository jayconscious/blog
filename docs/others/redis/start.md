# 初识redis

## 简介

### Nosql 基本概念

为了解决高并发、高可用、高可扩展，大数据存储等一系列问题而产生的数据库解决方案，就是NoSql (why?)

NoSql，叫非关系型数据库，它的全名Not only sql。它不能替代关系型数据库，只能作为关系型数据库的一个良好补充。

## 应用场景

缓存（数据查询、短连接、新闻内容、商品内容等等）。（最多使用） 分布式集群架构中的session分离。 聊天室的在线好友列表。 任务队列。（秒杀、抢购、12306等等） 应用排行榜。 网站访问统计。 数据过期处理（可以精确到毫秒）

## 数据类型

### 1.String 类型

1.赋值 set key value

```js
> set test 123
OK
```

2.取值 get key

```js
> get test
"123"
```

3.取值并赋值 getset key value

```js
> getset test 321
"123"
> get test
"321"
```

4.设置获取多个键值 mset key value [key value...] mget key [key...]

```js
> mset k1 v1 k2 v2 k3 v3
OK
```

```js
> mget k1 k2 k3
1) "v1"
2) "v2"
3) "v3"
```

5.删除 del key

```js
> del test
(integer) 1
```

6.数值增减

- 递增数字当存储的字符串是整数时，Redis提供了一个实用的命令**INCR**，其作用是让当前键值递增，并返回递增后的值。 语法：incr key








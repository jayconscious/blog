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

```bash
> set test 123
OK
```

2.取值 get key

```bash
> get test
"123"
```

3.取值并赋值 getset key value

```bash
> getset test 321
"123"
> get test
"321"
```

4.设置获取多个键值 mset key value [key value...] mget key [key...]

```bash
> mset k1 v1 k2 v2 k3 v3
OK
```

```bash
> mget k1 k2 k3
1) "v1"
2) "v2"
3) "v3"
```

5.删除 del key

```bash
> del test
(integer) 1
```

6.数值增减

- 递增数字当存储的字符串是整数时，Redis提供了一个实用的命令**INCR**，其作用是让当前键值递增，并返回递增后的值。 语法：incr key

```bash
> set num 1
OK
> incr num
(integer) 2
> incr num
(integer) 3
> incr num
(integer) 4
```

- 增加指定的整数 incrby key increment

```bash
> incrby num 2
(integer) 6
> incrby num 2
(integer) 8
```

- 递减数值 decr key

```bash
> decr num
(integer) 7
> decr num
(integer) 6
```

- 减少指定的数值 decryby key decrement

```bash
> decrby num 2
(integer) 4
> decrby num 3
(integer) 1
```

- 向尾部追加值 APPEND的作用是向键值的末尾追加value。如果键不存在则将该键的值设置为value，即相当于 SET key value。返回值是追加后字符串的总长度。 语法：append key value
```bash
> set str hello
OK
> append str "world"
10
> get str
"helloworld"
```

- 获取字符串长度 STRLEN命令返回键值的长度，如果键不存在则返回0。 语法：strlen key

```bash
> strlen str
(integer) 10
```

::: tip
应用 - 自增主键 商品编号、订单号采用 string 的递增数字特性生成
:::

### 2.Hash 散列类型

#### 使用 string 的问题

假设有User对象以bashON序列化的形式存储到Redis中，User对象有id，username、password、age、name等属性，存储的过程如下： 保存、更新：User对象 bashon(string) redis

如果在业务上只是更新age属性，其他的属性并不做更新我应该怎么做呢？ 如果仍然采用上边的方法在传输、处理时会造成资源浪费，下边讲的hash可以很好的解决这个问题。

#### 介绍

hash叫**散列类型**，它提供了字段和字段值的映射。字段值只能是字符串类型，不支持散列类型、集合类型等其它类型。

#### 命令

赋值 HSET命令不区分插入和更新操作，当执行插入操作时HSET命令返回1，当执行更新操作时返回0。

- 一次只设置一个字段值 语法：hset key field value

```bash
> HSET userinfo name zhangsan
1
```

- 一次设置多个字段值 语法：hmset key field value [field value...]
```bash
> hmset userinfo age 20 username lisi
OK
```

- 当字段不存在时赋值，类似hset,区别在于如果字段存在，该命令不执行任何操作。 语法：hsetnx key field value（不生效）

```bash
> hsetnx userinfo age 30
(integer) 0
```

**取值**

- 一次获取一个字段值 语法：hget key field
```bash
> hget userinfo age
"40"
```

- 一次可以获取多个字段值 语法：hmget key field [field...]
```bash
> hmget userinfo age username
1) "40"
2) "lisi"
```

- 获取所有**字段值** 语法：hgetall key (所有的字段值，userinfo是key，后面只要有嵌套的都是value)
```bash
> hgetall userinfo
1) "name"
2) "zhangsan"
3) "age"
4) "40"
5) "username"
6) "lisi"
```

- 删除字段 可以删除一个或多个字段，返回值是被删除的字段的个数。 语法：hdel key field [field...]

```bash
> hdel userinfo age
(integer) 1

> hdel userinfo name username
(integer) 2
```

- 增加数字 语法：hincrby key field increment
```bash
> hincrby userinfo age 2
(integer) 20
```

- 判断字段是否存在 语法：hexists key field
```bash
> hexists userinfo sex
(integer) 0
```

- 只获取字段名或字段值 语法： hkeys key hvals key
```bash
> hkeys userinfo
1) "age"
2) "sex"

> hvals userinfo
1) "20"
2) "male"
```

- 获取字段数量 语法：hlen key
```bash
> hlen userinfo
2
```

### 3.List 类型












```bash

```




























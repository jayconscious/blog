---
title: Github actions 重塑你的 Blog Workflows
date: 2021-08-16
sidebar: auto
tags: 
 - Other
categories:
 - other
sticky: 1
---

## 前言
之前自己的博客部署，多少有一些需要手动的操作，在持续更新和发布方面不是很友好。这里我们可以利用 `github` 提供的 `Github Actions` 来优化我们的项目部署。这样可以帮我们省下打包，发布，部署的时间。

## Github Actions 是什么
大家知道，(持续集成)[https://www.ruanyifeng.com/blog/2015/09/continuous-integration.html?fileGuid=1PWJAvQBtLA5IGh3]由很多操作组成，比如拉取最新代码、运行测试、登录服务器、部署服务器等，`GitHub` 把这些操作统一称为 `Actions`。

![image](/assets/img/other/blog-build1.png)

如果有同学对 `Github Actions` 推荐阅读(GitHub Actions 入门教程)[https://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html]。

## 部署项目

我们希望 `github actions` 可以按照如下的流程进行：

![image](/assets/img/other/blog-build2.png)

当我们向 `master`分支上 `push code` 时，可以触发我们定义的任务，先`build`我们的项目，然后将其发布到 `npm`，这一步主要是想使用 `npm` 提供的 `cdn` 的能力，其实也可以不需要。然后将我们打包的 `dist` 和 我们所定义的 `Dockerfile` 文件打包为一个 `docker image`，并将镜像发布到镜像仓库。下一步我们需要登录远程服务器，这里我选择的是 **阿里云的ecs**，也可以选择 `github.io`。然后在远程服务器上 `pull` 我们上传的镜像，执行我们的启动脚本，这样我们的自动化项目的流程已经清晰明了，下面我们一步步配置吧。

### 新建工作流，配置 Actions

进入 `Actions` 后可以看到很多推荐的工作流模版，这里可以根据需要自行选择需要的模版，或者跳过模版。

![image](/assets/img/other/blog-build3.png)

创建完成之后会在项目的根路径下生成 `.github/workflows/xxx.yml` 配置文件。

### 监听 master code push

我们希望在 `master code push` 触发我们定义的任务，可以按如下配置：

```yml
name: Build and Deploy
on:
  push:
    branches:
      - master
```
这里可以监听其他分支，其他的行为，具体可以参考(GitHub Actions 的工作流程语法)[https://docs.github.com/cn/actions/reference/workflow-syntax-for-github-actions]

### Build && npm publish

接下来我们需要将构建和发布我们的



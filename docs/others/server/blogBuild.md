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
大家知道，[持续集成](https://www.ruanyifeng.com/blog/2015/09/continuous-integration.html?fileGuid=1PWJAvQBtLA5IGh3)由很多操作组成，比如拉取最新代码、运行测试、登录服务器、部署服务器等，`GitHub` 把这些操作统一称为 `Actions`。

![image](/assets/img/other/blog-build1.png)

如果有同学对 `Github Actions` 推荐阅读[GitHub Actions 入门教程](https://www.ruanyifeng.com/blog/2019/09/getting-started-with-github-actions.html)。

## 部署项目方案

在这里我介绍两种方案给大家：

- 方案一： 当我们向 `master`分支上 `push code` 时，可以触发我们定义的任务，先`build`我们的项目，然后将其发布到 `npm`，这一步主要是想使用 `npm` 提供的 `cdn` 的能力，其实也可以不需要。然后将我们打包的 `dist` 和 我们所定义的 `Dockerfile` 文件打包为一个 `docker image`，并将镜像发布到镜像仓库。下一步我们需要登录远程服务器，这里我选择的是 **阿里云的ecs**，也可以选择 `github.io`。然后在远程服务器上 `pull` 我们上传的镜像，执行我们的启动脚本，这样我们的自动化项目的流程已经清晰明了，下面我们一步步配置吧。

- 方案二：与方案一不同的地方在于我们不需要构建 `docker image`，使用 `scp` 协议将打包好的资源 `copy` 到远程机器响应的文件夹下，启动我们时间安装好的 `nginx` 即可。


## 方案一

我们希望 `github actions` 可以按照如下的流程进行：

![image](/assets/img/other/blog-build2.png)

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
这里可以监听其他分支，其他的行为，具体可以参考[GitHub Actions 的工作流程语法](https://docs.github.com/cn/actions/reference/workflow-syntax-for-github-actions)

### Build
接下来我们需要将构建我们的项目。
```yml
- name: Checkout  ️
  uses: actions/checkout@v2.3.1

- name: Install and Build   
  run: |
    npm install
    npm run build
```
`actions/checkout@v2.3.1` 这个 `actions` 在原有的分支上面检出一个分支，在此分支分支上进行后面的 `step`，比如后面的 `npm install` 和 `npm run build`。

### Build Docker image

在构建 `Docker image` 我们需要一个基础环境，我们的项目需要一个 `nginx` 服务器，所以在项目的更路径上加上 `Dockerfile` 文件

```Dockerfile
FROM nginx
COPY ./docs/.vuepress/dist /usr/share/nginx/html/
COPY ./vhost.nginx.conf /etc/nginx/conf.d/blog.conf
EXPOSE 80
```
这个配置文件我相信大家都可以读懂，所以下一步，我们需要在项目的更路径上新建一个 `nginx ` 的配置文件 `vhost.nginx.conf`

```conf
server {
    listen 80;
    server_name localhost;
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        proxy_set_header Host $host;
        if (!-f $request_filename) {
            rewrite ^.*$ /index.html break;
        }
    }
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```
然后我们开始 `next step`
```yml
- name: Build the Docker image
  run: |
    docker login --username=${{ secrets.DOCKER_USERNAME }} --password=${{ secrets.DOCKER_PASSWORD }}
    docker build -t test-github-actions:latest . 
    docker tag test-github-actions jaywade/test-github-actions:latest 
    docker push jaywade/test-github-actions:latest
```
这些都是 `docker` 的基本操作，大家多动手就好了，这里有两点需要注意的地方：
::: tip
1、`DOCKER_USERNAME` 和 `DOCKER_PASSWORD` 需要在 `github`项目 => `Settings` => `Secrets` 中配置。
2、这是使用的是 `Docker` 的官方镜像，所以你懂的，大家可以使用国内的镜像或者使用阿里云的镜像仓库，对个人开发者是免费的。
:::

### Ssh Login && run

下一步我们需要 `ssh` 到远程机器上，同样的使用 `docker login`，拉取镜像，然后启动镜像。

```yml
- name: ssh docker login
uses: appleboy/ssh-action@master
with:
  host: ${{ secrets.SSH_HOST }}
  port: ${{ secrets.SSH_PORT }}
  username: ${{ secrets.SSH_USERNAME }}
  password: ${{ secrets.SSH_PASSWORD }}
  script: cd ~ && sh deploy.sh ${{ secrets.DOCKER_USERNAME }} ${{ secrets.DOCKER_PASSWORD }}
```
使用这个 `appleboy/ssh-action@master` 来帮助我们来完成这一步。在后 `script` 有执行远程服务器上的 `deploy.sh` 脚本。内容如下

```shell
echo -e "---------docker Login--------"
docker login --username=$1 --password=$2
echo -e "---------docker Stop--------"
docker stop test-github-actions
echo -e "---------docker Rm--------"
docker rm test-github-actions
docker rmi jaywade/test-github-actions:latest
echo -e "---------docker Pull--------"
docker pull jaywade/test-github-actions:latest
echo -e "---------docker Create and Start--------"
docker run --rm -d -p 80:80 --name test-github-actions jaywade/test-github-actions
echo -e "---------deploy Success--------"
```

::: tip
1、阿里云上的机器的操作系统暴露 `ssh` 服务端口可能会有点问题，可以在 `ssh` 的配置文件 `/etc/ssh/sshd_config` 添加自义定端口，然后将其添加在安全组之中。可能大家还会遇到其他的问题，可参考[这里](https://help.aliyun.com/document_detail/41470.html)。
:::
这样就成功的部署我们的 `blog` 项目了，是不是可简单~

## 方案二

我们希望 `github actions` 可以按照如下的流程进行：

![image](/assets/img/other/blog-build4.png)

### Scp copy

项目打包的流程和上面一样，只是在静态资源迁移阶段我们有所不一，配置如下

```yml
- name: Deploy to self-host server
uses: appleboy/scp-action@master
with:
  host: ${{ secrets.SSH_HOST }}
  port: ${{ secrets.SSH_PORT }}
  username: ${{ secrets.SSH_USERNAME }}
  password: ${{ secrets.SSH_PASSWORD }}
  command_timeout: "20m"
  source: "./docs/.vuepress/dist/"
  strip_components: 4
  target: "${{ secrets.DOCS_SERVER_DIR }}"
```
::: tip
1、`DOCS_SERVER_DIR` 是我们 `nginx` 静态资源服务器的路径默认是 `/usr/share/nginx/html`。
:::

## 总结
1. 方案二更加适合博客这类应用的持续集成，`Docker image` 非常适合企业级应用的持续集成。
2. 我们需要去学习一些 `yaml` 这类的配置语言，由于他们的历史比较悠久，所以自身可能有一些问题吧，也不能算是问题，只是对于习惯 `json` 配置的前端小伙伴不太友好。
3. 这里还有其他的地方可以优化的，比如`nginx` 上动静资源的管理，以及加速等等。
4. `vuepress` 打包是有优化的空间的，现在配置导致并行的请求过多，影响网页的加载速度。

## 参考文档

- [手把手教你用 Github Actions 部署前端项目](https://segmentfault.com/a/1190000039818913)
- [GitHub 操作的工作流语法](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [vuepress-theme-reco](https://vuepress-theme-reco.recoluan.com/)
- [YAML 语言教程](https://www.ruanyifeng.com/blog/2016/07/yaml.html)





















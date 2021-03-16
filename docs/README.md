---
home: true
herodontknowjs1: 
heroText: Welcome To My Channel~
tagline: 
actionText: Let's Go ~
actionLink: ./guide/index.md
features:
- title: JavaScript
  details: 构建JavaScript知识体系
- title: Vue
  details: 作为前端三大框架之一，让我们深入了解其生态和内部的运行原理
- title: Node
  details: 前端全栈的最快路线，包含node.js，框架和服务
- title: 读书
  details: 携书如历三千世 无书唯度一平生。
footer: MIT Licensed | Copyright © 2020-2021 jayconscious
---

<!-- <script>
  export default {
    mounted () {
        // this.$page
        (function () {
            var i = void 0, j = void 0, i_dot = void 0, j_dot = void 0;

            var app = document.querySelector('#app')
            var canvas = document.createElement('canvas')
            canvas.setAttribute("style", "position: fixed; left: 0;top: 0;right: 0; bottom: 0; z-index: -1; margin: auto;")
            setCanvasWidthAndHeight()
            app.appendChild(canvas)


            var throttleSet = throttle(setCanvasWidthAndHeight, 500)
            throttleSet()
            window.onresize = function () {
                console.log('touch onresize')
                throttleSet()
            }
            function setCanvasWidthAndHeight() {
                const { width, height } = getMaxWidthAndHeight() 
                console.log('current max width & height', width, height)
                canvas.width = width
                canvas.height = height
            }
            function getMaxWidthAndHeight() {
                var innerHeight = window.innerHeight
                var innerWidth = window.innerWidth
                var scrollHeight = document.body.scrollHeight
                var scrollWidth = document.body.scrollHeight

                return {
                    width: Math.max(innerWidth, scrollWidth),
                    height: Math.max(innerHeight, scrollHeight)
                }
            }

            var ctx = canvas.getContext('2d')
            ctx.lineWidth = .3;
            ctx.strokeStyle = (new Color(150)).style;

            var mousePosition = {
                x: 30 * canvas.width / 100,
                y: 30 * canvas.height / 100
            };

            var dots = {
                nb: 750,
                distance: 50,
                d_radius: 100,
                array: []
            };

            function throttle(fn, delay) {
                var timer = null
                return function () {
                    if (!timer) {
                        timer = setTimeout(function () {
                            fn()
                            timer = null
                        }, delay)
                    }
                }
            }

            function colorValue(min) {
                return Math.floor(Math.random() * 255 + min);
            }

            function createColorStyle(r, g, b) {
                return 'rgba(' + r + ',' + g + ',' + b + ', 0.8)';
            }

            function mixComponents(comp1, weight1, comp2, weight2) {
                return (comp1 * weight1 + comp2 * weight2) / (weight1 + weight2);
            }

            function averageColorStyles(dot1, dot2) {
                var color1 = dot1.color,
                    color2 = dot2.color;

                var r = mixComponents(color1.r, dot1.radius, color2.r, dot2.radius),
                    g = mixComponents(color1.g, dot1.radius, color2.g, dot2.radius),
                    b = mixComponents(color1.b, dot1.radius, color2.b, dot2.radius);
                return createColorStyle(Math.floor(r), Math.floor(g), Math.floor(b));
            }

            function Color(min) {
                min = min || 0;
                this.r = colorValue(min);
                this.g = colorValue(min);
                this.b = colorValue(min);
                this.style = createColorStyle(this.r, this.g, this.b);
            }

              function Dot() {
                  this.x = Math.random() * canvas.width;
                  this.y = Math.random() * canvas.height;

                  this.vx = -.5 + Math.random();
                  this.vy = -.5 + Math.random();

                  this.radius = Math.random() * 2;

                  this.color = new Color();
                //   console.log(this);
              }

              Dot.prototype = {
                  draw: function () {
                      ctx.beginPath();
                      ctx.fillStyle = this.color.style;
                      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
                      ctx.fill();
                  }
              };

              function createDots() {
                  for (i = 0; i < dots.nb; i++) {
                      dots.array.push(new Dot());
                  }
              }

              function moveDots() {
                  for (i = 0; i < dots.nb; i++) {

                      var dot = dots.array[i];

                      if (dot.y < 0 || dot.y > canvas.height) {
                          dot.vx = dot.vx;
                          dot.vy = -dot.vy;
                      } else if (dot.x < 0 || dot.x > canvas.width) {
                          dot.vx = -dot.vx;
                          dot.vy = dot.vy;
                      }
                      dot.x += dot.vx;
                      dot.y += dot.vy;
                  }
              }

              function connectDots() {
                  for (i = 0; i < dots.nb; i++) {
                      for (j = 0; j < dots.nb; j++) {
                          i_dot = dots.array[i];
                          j_dot = dots.array[j];

                          if ((i_dot.x - j_dot.x) < dots.distance && (i_dot.y - j_dot.y) < dots.distance && (i_dot.x -
                                  j_dot.x) > -
                              dots.distance && (i_dot.y - j_dot.y) > -dots.distance) {
                              if ((i_dot.x - mousePosition.x) < dots.d_radius && (i_dot.y - mousePosition.y) < dots
                                  .d_radius && (i_dot
                                      .x - mousePosition.x) > -dots.d_radius && (i_dot.y - mousePosition.y) > -dots
                                  .d_radius) {
                                  ctx.beginPath();
                                  ctx.strokeStyle = averageColorStyles(i_dot, j_dot);
                                  ctx.moveTo(i_dot.x, i_dot.y);
                                  ctx.lineTo(j_dot.x, j_dot.y);
                                  ctx.stroke();
                                  ctx.closePath();
                              }
                          }
                      }
                  }
              }

              function drawDots() {
                  for (i = 0; i < dots.nb; i++) {
                      var dot = dots.array[i];
                      dot.draw();
                  }
              }

              function animateDots() {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  moveDots();
                  connectDots();
                  drawDots();

                  requestAnimationFrame(animateDots);
              }
              
            //   window.addEventListener('mousemove', function (e) {
            //       mousePosition.x = e.pageX;
            //       mousePosition.y = e.pageY;
            //   }, false)
            //   window.addEventListener('mouseleave', function (e) {
            //       mousePosition.x = canvas.width / 2;
            //       mousePosition.y = canvas.height / 2;
            //   }, false)

              createDots();
              requestAnimationFrame(animateDots);
          })()
    }
  }
</script>
<style>
    html, body {
        background-color: transparent;
        margin: 0;
        padding: 0;
    }
    .links, .navbar, .sidebar, .search-box input {
        background-color: transparent!important;
    }
</style> -->






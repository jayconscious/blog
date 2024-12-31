---
title: React源码解析(一)：从入口函数调试入手，自下而上窥探react架构
date: 2024-12-31
sidebar: auto
tags: 
 - react18
categories:
 - react
sticky: 1
---

## 前言

**React**作为现代前端框架的佼佼者，有深入研究其原理必要性，特别是框架在演进的过程中，前辈们是如何解决问题的，这对年轻工程师成长是至关重要的。本文以`React.render`入口函数为切入点，一步步跟随函数调用链路来追踪整个渲染流程以及架构。

## 搭建调试环境

这里不会介绍搭建调试环境相关，但是作为我们探究源码必不可少的一步，这里还是要提醒大伙一下。在文末的参考文章里面，我会放一些链接供大家参考。

## 源码分析

我们以如下代码为例，进行分析：

```js
//App.jsx
export default function App() {
  return (
    <div>
      <p>111</p>
    </div>
  )
}
```

```js
// index.js
import ReactDOM from "react-dom/client";
import App from "./App";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <App />
);
```

这段代码大家在熟悉不过了，通常作为应用的入口文件。

### 初始化

#### createRoot

```js
function createRoot(container, options) {
    // 省略...
    // fiberRootNode 节点，它被保存在全局
    var root = createContainer(container, ConcurrentRoot, null, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError);
    // 省略...
    return new ReactDOMRoot(root);
  }
```

这段函数就两行代码，我们一行行分析。

> Tips: 有源码阅读经验的同学，都应该知道，这种入口函数的后续调用链路都是比较长的，会有很多初始化的工作。

`createRoot`函数，接受一个 `dom对象`和 `options`(一般我们探究主链路，可以先忽略这些配置项)。主要是调用`createContainer`然后返回一个`root`。

```js
 function createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
    return createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError);
}
  
function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride,
  identifierPrefix, onRecoverableError, transitionCallbacks) {
    // Tip: 就是用 FiberRootNode 来代替 root 
    var root = new FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onRecoverableError);
    // Tip: 没有初始化的fiber，第一次没有渲染，所以是空的fiber节点
    var uninitializedFiber = createHostRootFiber(tag, isStrictMode);
    // 连接 rootFiber 与 fiberRootNode
    root.current = uninitializedFiber;
    uninitializedFiber.stateNode = root;
    //...
    initializeUpdateQueue(uninitializedFiber);
    return root;
}
```

`createContainer`主要是调用了`createFiberRoot`，在其内部我们看到 `root` 是通过 `new FiberRootNode()`实例化而来，其实这里就是生成一个 `FiberRootNode`，怎么理解这个呢？不要着急，我们继续往下看。

```js
function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onRecoverableError) {
    this.tag = tag;
    this.containerInfo = containerInfo;
    this.pendingChildren = null;
    this.current = null;
    this.pingCache = null;
    this.finishedWork = null;
    this.timeoutHandle = noTimeout;
    // 省略... 
    // 详细定义大家可以参考源码
  }
```

`FiberRootNode`就是一个管理对象，我们从这个命名也能得到一些提示，这个对象层级是在应用节点之上的。

我们关注 `createFiberRoot` 函数中这三行代码：

```js
var uninitializedFiber = createHostRootFiber(tag, isStrictMode);
root.current = uninitializedFiber;
uninitializedFiber.stateNode = root;
```

![image](/assets/img/react18/sourceCode/outline/fiberTree.png)

结构如图所示，熟悉 `fiber`节点定义的同学，可能会说 `stateNode`是不指向当前`fiber`节点所在的`Dom`节点吗？其实在根节点这里不是的，`stateNode`指向的是什么，我们还要依据 `fiber.tag`字段来详细判断。

#### root.render

在创建完 `FiberRootNode` 和 `uninitializedFiber` 之后，就会调用 `root.render` 方法。

```js
function ReactDOMRoot(internalRoot) {
    this._internalRoot = internalRoot;
}
  // 渲染方法
ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function (children) {
    var root = this._internalRoot;
    //...
    updateContainer(children, root, null, null);
};
```

这里主要调用 `updateContainer`，`children`就是 `App()`。 `root` 就是第一阶段`createRoot`返回。我们来看看 `updateContainer`内部都做那些事情。

### 调度任务 updateContainer

```js
 function updateContainer(element, container, parentComponent, callback) {
    var current$1 = container.current; 
    var eventTime = requestEventTime();
    // 获取 react lane 优先级
    var lane = requestUpdateLane(current$1);
    // 构建一个 update 更新对象
    var update = createUpdate(eventTime, lane); 
    update.payload = {
      element: element
    };
    // 省略...
    // 将生成的 update 加入 updateQueue
    var root = enqueueUpdate$1(current$1, update, lane);
    // 直接调度更新
    if (root !== null) {
      scheduleUpdateOnFiber(root, current$1, lane, eventTime);
      entangleTransitions(root, current$1, lane);
    }
    return lane;
  }
```

在`updateContainer`中主要有两个函数值得关注，一个是`enqueueUpdate$1()`,另一个是`scheduleUpdateOnFiber()`，我们来逐一追踪。

#### enqueueUpdate\$1

```js
function enqueueUpdate$1(fiber, update, lane) {
    var updateQueue = fiber.updateQueue;
    var sharedQueue = updateQueue.shared;
    if (isUnsafeClassRenderPhaseUpdate()) {
      // 省略...
    } else {
      return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane);
    }
  }
  
function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
    var concurrentQueue = queue;
    var concurrentUpdate = update;
    enqueueUpdate(fiber, concurrentQueue, concurrentUpdate, lane);
    return getRootForUpdatedFiber(fiber);
  }

function enqueueUpdate(fiber, queue, update, lane) {
    concurrentQueues[concurrentQueuesIndex++] = fiber;
    concurrentQueues[concurrentQueuesIndex++] = queue;
    concurrentQueues[concurrentQueuesIndex++] = update;
    concurrentQueues[concurrentQueuesIndex++] = lane;
    // 按照0,1,2,3 顺序安排这些 fiber,queue,update,lane 
    // 省略...
}
```

这几个函数的调用主要干了两件事：

1.  构建更新对象：将我们要渲染的内容`element`，挂载到由`createUpdate()`构建的对象`update`的`payload.element`属性之上
2.  加入更新队列：调用 `enqueueUpdate()` 将 `fiber`、`queue`、`update`、`lane`按序放到了 `concurrentQueues`之上。

> 代码调试的时候，我们可以**watch**这个全局变量`concurrentQueues`，看它后续是如何被操作的。即使我们猜一猜也能知道这会和**Concurrent Mode**有关联，`concurrentQueues`这个命名也给了明确的提示了。

#### scheduleUpdateOnFiber

```js
function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
    // ...
    ensureRootIsScheduled(root, eventTime);
    // ...
 }
```

`scheduleUpdateOnFiber()`函数已经被我删繁就简了，其实在我们理清主链路的时候，主要就是`ensureRootIsScheduled()`函数内部是如何运行的。

```js
function ensureRootIsScheduled(root, currentTime) {
      // ...
      // 注册更新任务
      newCallbackNode = scheduleCallback$2(schedulerPriorityLevel, performConcurrentWorkOnRoot.bind(null, root));

  }
```

`ensureRootIsScheduled()`里面重要的就是这一行，通过 `scheduleCallback$2()` 注册一个任务。任务内部的执行主要是在 `performConcurrentWorkOnRoot()`。那么注册的回调函数什么时候执行呢？
这里我们要去看下`scheduleCallback$2()`内部是如何定义的。

```js
function scheduleCallback$2(priorityLevel, callback) {
  // ...
  return scheduleCallback(priorityLevel, callback);
}

var scheduleCallback = unstable_scheduleCallback;

var ReactInternals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
var _ReactInternals$Sched = ReactInternals.Scheduler
var unstable_scheduleCallback = _ReactInternals$Sched.unstable_scheduleCallback

```

从中我们可以看出 `scheduleCallback()` 主要是通过 `React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Scheduler` 注入进来的，`react`包与`react-dom`包就是这样联系起来的，说的直白点，就是全局变量关联。

现在我们去 `react` 包里，看看 `unstable_scheduleCallback()`函数是如何定义的。

```js
function unstable_scheduleCallback(priorityLevel, callback, options) {
    var currentTime = getCurrentTime();
    var startTime;
    var timeout;
    var expirationTime = startTime + timeout;
    
    // 任务管理对象
    var newTask = {
      id: taskIdCounter++,
      callback: callback,
      priorityLevel: priorityLevel,
      startTime: startTime,
      expirationTime: expirationTime,
      sortIndex: -1
    };
    // ...省略
    push(taskQueue, newTask);
    
    requestHostCallback(flushWork);

    return newTask;
  }
```

这里主要是构建了一个任务管理对象`newTask`,之后调用 `push()`方法将`newTask`推入到`taskQueue`之中，然后 `requestHostCallback(flushWork)`，其他的参数我们先不管它，因为那些主要是和 `Schedule`模块的调度细则相关。
我们先来看看 `requestHostCallback()`函数。

```js
function requestHostCallback(callback) {
  // ...
  schedulePerformWorkUntilDeadline();
}

if (typeof localSetImmediate === 'function') {
    schedulePerformWorkUntilDeadline = function () {
      localSetImmediate(performWorkUntilDeadline);
    };
  } else if (typeof MessageChannel !== 'undefined') {
    var channel = new MessageChannel();
    var port = channel.port2;
    channel.port1.onmessage = performWorkUntilDeadline;
    schedulePerformWorkUntilDeadline = function () {
      port.postMessage(null);
    };
  } else {
    schedulePerformWorkUntilDeadline = function () {
      localSetTimeout(performWorkUntilDeadline, 0);
    };
  }
```

`requestHostCallback()`主要是调用`schedulePerformWorkUntilDeadline()`,而它的定义也是有多种回退机制，就像`vue`中的`$nextTick`函数一样。

![image](/assets/img/react18/sourceCode/outline/callStack.png)

从调用栈的截图中，在谷歌浏览器下使用的是`new MessageChannel()`。后续 `flushWork()`和`workLoop()`我们先跳过。后续这部分再详细描述。

### 执行任务 performConcurrentWorkOnRoot

```js
function performConcurrentWorkOnRoot(root, didTimeout) {
    //...
    var shouldTimeSlice = !includesBlockingLane(root, lanes) && !includesExpiredLane(root, lanes) && ( !didTimeout);
    
    var exitStatus = shouldTimeSlice ? renderRootConcurrent(root, lanes) : renderRootSync(root, lanes);
    //...
  }
```

`performConcurrentWorkOnRoot()`是 **render阶段**的入口函数，这里会进入同步模式的更新 `renderRootSync`。

```js
function renderRootSync(root, lanes) {
    // workInProgressRoot == null
    if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
      //...
      workInProgressTransitions = getTransitionsForLanes();
      // 创建一个 workInprogress 节点，还有其他的准备工作
      prepareFreshStack(root, lanes);
    }

    do {
      try {
        workLoopSync();
        break;
      } catch (thrownValue) {
        handleError(root, thrownValue);
      }
    } while (true);
    //...
  }
```

`workInProgressRoot`在初始化是`null`，`prepareFreshStack`创建一个 workInprogress 节点，还有其他的准备工作。

```js
function prepareFreshStack(root, lanes) {
    // ...
    workInProgressRoot = root;
    var rootWorkInProgress = createWorkInProgress(root.current, null);
    // 创建 workInProgress 节点
    workInProgress = rootWorkInProgress;
    workInProgressRootRenderLanes = renderLanes$1 = lanes;
    workInProgressRootExitStatus = RootInProgress;
    workInProgressRootFatalError = null;
    workInProgressRootSkippedLanes = NoLanes;
    workInProgressRootInterleavedUpdatedLanes = NoLanes;
    workInProgressRootPingedLanes = NoLanes;
    workInProgressRootConcurrentErrors = null;
    workInProgressRootRecoverableErrors = null;
    // 将之前的放在 concurrentQueues上的update，维护到对应fiber的pending队列上。
    finishQueueingConcurrentUpdates();


    return rootWorkInProgress;
  }
```

之后进入 `do-while`的循环之中，`workLoopSync()`

```js
 function workLoopSync() {
    while (workInProgress !== null) {
      // 有点像 vue 的 patchVNode
      performUnitOfWork(workInProgress);
    }
  }
  
function performUnitOfWork(unitOfWork) {
    var current = unitOfWork.alternate; 
    setCurrentFiber(unitOfWork);
    var next;
    if ( (unitOfWork.mode & ProfileMode) !== NoMode) {
      startProfilerTimer(unitOfWork);

      next = beginWork$1(current, unitOfWork, renderLanes$1);
      
      stopProfilerTimerIfRunningAndRecordDelta(unitOfWork, true);
    } else {
      next = beginWork$1(current, unitOfWork, renderLanes$1);
    }
    resetCurrentFiber();
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) {
      completeUnitOfWork(unitOfWork);
    } else {
      workInProgress = next;
    }
    ReactCurrentOwner$2.current = null;
  }
```

`performUnitOfWork()`是整个**render阶段**的核心，这里涉及两个核心函数`beginWork()`和`completeWork()`以及一个核心流程，就是两者是如何协作的。`beginWork()`主要是生成`fiber`节点，`completeWork()`主要是标记更新以及Dom节点的生成，当然在不同的阶段`(mount/update)`会有不同的处理。

> performUnitOfWork 内容相对比较复杂,我们在这里不展开说，后续有详细的篇幅来介绍这里。

#### commitRoot

`commitRoot()`是**commit阶段**的入口函数，经历上述过程之后，真实的Dom节点已经挂在对应的`fiber.stateNode`之上，接下来就是要将内容更新到页面上。

![image](/assets/img/react18/sourceCode/outline/fiberTree2.png)

此时的 `fiber tree`结构大概是这个样子的。

```js
function commitRootImpl(root, recoverableErrors, transitions, renderPriorityLevel) {
    var finishedWork = root.finishedWork;
    // ...
    var subtreeHasEffects = (finishedWork.subtreeFlags & (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !== NoFlags;
    var rootHasEffect = (finishedWork.flags & (BeforeMutationMask | MutationMask | LayoutMask | PassiveMask)) !== NoFlags;
   // 判断子树是否标记
    if (subtreeHasEffects || rootHasEffect) {
      // ...
      var shouldFireAfterActiveInstanceBlur = commitBeforeMutationEffects(root, finishedWork);
      // ...
      commitMutationEffects(root, finishedWork, lanes);
      // ...
      commitLayoutEffects(finishedWork, root, lanes);
      // fiber树切换
      root.current = finishedWork; 

    } else {
      // No effects.
      root.current = finishedWork; 
      // ...
      
    }
    

    return null;
  }
```

`commitRootImpl()`是`commitRoot()`的核心调用，内部主要分为三个阶段，源码中也有明确的注释，我来看看做了哪些事情。

#### before mutation

```js
function commitBeforeMutationEffects(root, firstChild) {
    //..
    commitBeforeMutationEffects_begin(); 
    //...
  }
function commitBeforeMutationEffects_begin() {
    while (nextEffect !== null) {
      var fiber = nextEffect; 
      var child = fiber.child;
      if ((fiber.subtreeFlags & BeforeMutationMask) !== NoFlags && child !== null) {
        child.return = fiber;
        nextEffect = child;
      } else {
        commitBeforeMutationEffects_complete();
      }
    }
}
```

`commitBeforeMutationEffects()`主要是调用`commitBeforeMutationEffects_begin()`，其内部主要通过`subtreeFlags`标记找到变化的节点，然后调用`commitBeforeMutationEffects_complete()`。

```js
 function commitBeforeMutationEffects_complete() {
    while (nextEffect !== null) {
      var fiber = nextEffect;
      setCurrentFiber(fiber);
      try {
        // 调用class组件 getSnapshotBeforeUpdate
        commitBeforeMutationEffectsOnFiber(fiber);
      } catch (error) {
        captureCommitPhaseError(fiber, fiber.return, error);
      }
      resetCurrentFiber();
      var sibling = fiber.sibling;
      if (sibling !== null) {
        sibling.return = fiber.return;
        nextEffect = sibling;
        return;
      }
      nextEffect = fiber.return;
    }
  }

 function commitBeforeMutationEffectsOnFiber(finishedWork) {
    var current = finishedWork.alternate;
    var flags = finishedWork.flags;
    if ((flags & Snapshot) !== NoFlags) {
      setCurrentFiber(finishedWork);
      switch (finishedWork.tag) {
        case ClassComponent:
          {
            if (current !== null) {
              var prevProps = current.memoizedProps;
              var prevState = current.memoizedState;
              var instance = finishedWork.stateNode; 
              // Tip: getSnapshotBeforeUpdate 这里调用
              var snapshot = instance.getSnapshotBeforeUpdate(finishedWork.elementType === finishedWork.type ? prevProps : resolveDefaultProps(finishedWork.type, prevProps), prevState);
              instance.__reactInternalSnapshotBeforeUpdate = snapshot;
            }
            break;
          }
        case HostRoot:
          {
            {
              // 清空根节点
              var root = finishedWork.stateNode;
              clearContainer(root.containerInfo);
            }
            break;
          }
      }
       // ...
      resetCurrentFiber();
    }
  }
```

`commitBeforeMutationEffects_complete()`会依次向上递归调用`commitBeforeMutationEffectsOnFiber()`，主要有两个作用：

*   对于`ClassComponent`，调用 **getSnapshotBeforeUpdate生命周期函数**。
*   对于`HostRoot`，清空根节点。

#### mutation

```js
function commitMutationEffects(root, finishedWork, committedLanes) {
    //...
    setCurrentFiber(finishedWork);
    commitMutationEffectsOnFiber(finishedWork, root);
    setCurrentFiber(finishedWork);
  }

function commitMutationEffectsOnFiber(finishedWork, root, lanes) {
    var current = finishedWork.alternate;
    var flags = finishedWork.flags; 
    switch (finishedWork.tag) {
      // ...
      case HostComponent:
        {
          recursivelyTraverseMutationEffects(root, finishedWork);
          commitReconciliationEffects(finishedWork);
          // ...
          return;
        }
      // ...
    }
}
```

在`commitMutationEffectsOnFiber()`中，主要针对不同类型的`fiber`进行分类处理，这里以 `HostComponent`为例。会调用`recursivelyTraverseMutationEffects()`和`commitReconciliationEffects()`。

```js
function recursivelyTraverseMutationEffects(root, parentFiber, lanes) {
    // 优先处理需要删除，这样子节点的其他flag可以不用关心了
    var deletions = parentFiber.deletions;
    if (deletions !== null) {
      for (var i = 0; i < deletions.length; i++) {
        var childToDelete = deletions[i];
        try {
          commitDeletionEffects(root, parentFiber, childToDelete);
        } catch (error) {
          captureCommitPhaseError(childToDelete, parentFiber, error);
        }
      }
    }
    var prevDebugFiber = getCurrentFiber();
    // 有子副作用，就递归 
    if (parentFiber.subtreeFlags & MutationMask) {
      var child = parentFiber.child;
      while (child !== null) {
        setCurrentFiber(child);
        commitMutationEffectsOnFiber(child, root);
        child = child.sibling;
      }
    }
    setCurrentFiber(prevDebugFiber);
  }
```

先对当前`fiber`节点有`deletions`情况做处理，毕竟这样后续的子节点就不用关心了。

```js
function commitReconciliationEffects(finishedWork) {
    var flags = finishedWork.flags;
    if (flags & Placement) {
      try {
        // 插入DOM
        commitPlacement(finishedWork);
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      } 
      finishedWork.flags &= ~Placement;
    }
    if (flags & Hydrating) {
      finishedWork.flags &= ~Hydrating;
    }
  }
function commitPlacement(finishedWork) {
    // debugger
    var parentFiber = getHostParentFiber(finishedWork); 
    switch (parentFiber.tag) {
      case HostComponent:
        {
          // 父级DOM节点
          var parent = parentFiber.stateNode;
          if (parentFiber.flags & ContentReset) {
            resetTextContent(parent); 
            parentFiber.flags &= ~ContentReset;
          }
          // 获取 Fiber节点的 DOM 兄弟节点
          var before = getHostSibling(finishedWork); 
          // 插入节点
          insertOrAppendPlacementNode(finishedWork, before, parent);
          break;
        }
    }
  }
```

再依据`flags`情况，考虑节点增加场景。然后选择`insertBefore`或者`appendChild`的dom操作。对于其他的操作类型，比如`Update`也有相关的操作，我们这里先不详细展开。
这里dom树也已全部更新完成了。

#### layout

```js
 function commitLayoutEffects(finishedWork, root, committedLanes) {
    // ...
    var current = finishedWork.alternate;
    commitLayoutEffectOnFiber(root, current, finishedWork, committedLanes);
    // ...
  }
 
 function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork, committedLanes) {
    var flags = finishedWork.flags;
    switch (finishedWork.tag) {
    // ...
      case HostComponent:
        {
          recursivelyTraverseLayoutEffects(finishedRoot, finishedWork, committedLanes);
          // 存在属性更新的case
          if (current === null && flags & Update) {
            commitHostComponentMount(finishedWork);
          }
          // ref赋值
          if (flags & Ref) {
            safelyAttachRef(finishedWork, finishedWork.return);
          }
          break;
        }
    // ...
    }
  }
function commitHostComponentMount(finishedWork) {
    var type = finishedWork.type;
    var props = finishedWork.memoizedProps;
    var instance = finishedWork.stateNode;
    try {
      commitMount(instance, type, props, finishedWork);
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
  }
function commitMount(domElement, type, newProps, internalInstanceHandle) {
    switch (type) {
      case 'button':
      case 'input':
      case 'select':
      case 'textarea':
        if (newProps.autoFocus) {
          domElement.focus();
        }
        return;
      case 'img':
        {
          if (newProps.src) {
            domElement.src = newProps.src;
          }
          return;
        }
    }
  }
```

对于`HostComponent`类型

*   如果有`newProps.autoFocus`属性更新，会去触发相应的事件。
*   还有`ref`赋值

> HostComponent，这种case，在layout阶段触发这些事件，属于react合成事件处理的一些特殊情况，具体的我们后续篇幅再去具体解析。

其他的`fiber.tag`还有调用这个阶段相关的生命周期函数以及`hooks`。
之后 **root.current = finishedWork**，就此`fiber`树切换完成。

## 总结

1.  跟随`React.render()`调用链路，我们了解`React`整个渲染流程，大体可以分为`schedule`，`render`，`commit`，以及每个阶段做了哪些事情。因为有时候没人有为我们铺路的时候，我们要自己探索。
2.  这里由于篇幅的原因，很多地方没有详细展开。而且探索性的源码解析，以优先梳理主链路为先。

## 参考

*   [React技术揭秘](https://react.iamkasong.com/)
*   [react源码系列](https://juejin.cn/column/7100375744940883999)


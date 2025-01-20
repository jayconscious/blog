---
title: React源码解析(二)：render阶段
date: 2025-01-17
sidebar: auto
tags: 
 - react18
categories:
 - react
sticky: 1
---
## 前言

在上一篇[React源码解析(一)：从入口函数调试入手，自下而上窥探react架构](https://juejin.cn/post/7454112149725380646)文章中，对于 **render阶段**没有进行深度的解读，这篇我们来持续深入这部分，这也是**react-reconciler**核心部分。这部分这里涉及两个核心函数`beginWork()`和`completeWork()`以及一个核心流程，就是两者是如何协作的。

## render入口

我们先从`renderRootSync()`入口函数着手。

### renderRootSync

```js
 function renderRootSync(root, lanes) {
    prepareFreshStack(root, lanes);
    workLoopSync();
  }
function prepareFreshStack(root, lanes) {
    // 构造 workInProgress 节点
    var rootWorkInProgress = createWorkInProgress(root.current, null);
    workInProgress = rootWorkInProgress;
    return rootWorkInProgress;
  }
function workLoopSync() {
    while (workInProgress !== null) {
      performUnitOfWork(workInProgress);
    }
  }
```

`prepareFreshStack()`主要是创建一个`workInProgress`节点，作为运行时的**root fiber**。`workLoopSync()`开启我们的工作流程。

### performUnitOfWork

```js
function performUnitOfWork(unitOfWork) {
   
    var current = unitOfWork.alternate; 
    // 返回下一个节点是哪个节点？
    var next = beginWork$1(current, unitOfWork, renderLanes$1);
    
    // 执行完 beginWork之后，pendingProps => memoizedProps
    unitOfWork.memoizedProps = unitOfWork.pendingProps;

    if (next === null) {
      completeUnitOfWork(unitOfWork);
    } else {
      // 如果 next 存在 ，继续循环
      workInProgress = next;
    }
    
  }
```

`performUnitOfWork()`的执行流程，在`beginWork()`之后，返回 `next`是否为`null`，`next`存在，则继续`beginWork()`操作；否则进入 `completeUnitOfWork(unitOfWork)`。

> 这里我们有其他的方法，快速搞清楚其运行流程。没错，就是 console.log()

#### beginWork与completeWork的执行顺序

以下面的代码为例：

```js
export default function App() {
  const [num, add] = useState(0);
  return (
    <div>
      <p onClick={() => add(num + 1)}>{num}</p>
      <span>
        <i></i>
      </span>
    </div>
  )
}
```

我们可以在核心函数插入相关测试代码。

```js
beginWork$1 = function (current, unitOfWork, lanes) {
   console.log('beginWork', unitOfWork?.type)
 }
function completeWork(current, workInProgress, renderLanes) {
   console.log('completeWork', workInProgress?.type)
}
```

我们可以得到如下结果：

![image](/assets/img/react18/sourceCode/render/render1.png)

我们将其转化为流程图如下：

![image](/assets/img/react18/sourceCode/render/render2.png)


#### beginWork

```js
function beginWork(current, workInProgress, renderLanes) {
    // update 阶段
    if (current !== null) {
      var oldProps = current.memoizedProps;
      var newProps = workInProgress.pendingProps;
      if (oldProps !== newProps || hasContextChanged() || ( 
       workInProgress.type !== current.type )) {
        didReceiveUpdate = true;
      } else {
        var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
        if (!hasScheduledUpdateOrContext && 
        (workInProgress.flags & DidCapture) === NoFlags) {
          didReceiveUpdate = false;
          // Tip: 什么情况下 return ?
          return attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes);
        }
        if ((current.flags & ForceUpdateForLegacySuspense) !== NoFlags) {
          didReceiveUpdate = true;
        } else {
          didReceiveUpdate = false;
        }
      }
    } else {
      // mount  阶段
      didReceiveUpdate = false;
    } 
    switch (workInProgress.tag) {
      case IndeterminateComponent: // 2
      {
          return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
      }
      case FunctionComponent: // 0
                return ...
      case ClassComponent: // 1
          return ...
      case HostRoot: // 3
        return updateHostRoot(current, workInProgress, renderLanes);

      case HostComponent: // 5
        return updateHostComponent(current, workInProgress, renderLanes);
       //...
    }
  }
```

`beginWork(current, workInProgress, renderLanes)`用大家普遍认知的话来描述，它是一个“递”的过程。

流程图如下：

![image](/assets/img/react18/sourceCode/render/render3.png)


除 `rootFiber` 以外组件 `mount` 时 `current === null`，而组件 `update` 时，由于已经 `mount` 过了，所以 `current !== null`（即 `current === null ? mount : update`）

根据这个特性可以将 `beginWork` 的工作分为两部分：

*   **`update` 时**：如果 `current` 存在且满足一定的条件时，可以复用 `current` 的 `Fiber 节点`（即上一次更新的 `Fiber 节点`）
*   **`mount` 时**：根据 `fiber.tag` 进入不同的处理函数，然后调用 `reconcileChildren` 创建 `子 Fiber 节点`。

##### update

```js
if (current !== null) {
    if (oldProps !== newProps || hasContextChanged() || ( 
        // 这个判断是指 fiber 节点可以复用
       workInProgress.type !== current.type )) {
        didReceiveUpdate = true;
      } else {
        var hasScheduledUpdateOrContext = checkScheduledUpdateOrContext(current, renderLanes);
        // 没有挂起的 update 或者上下文的变化 && 没有 DidCapture 标识位。(DidCapture用来表示一些异常捕获。)
        if (!hasScheduledUpdateOrContext && 
        (workInProgress.flags & DidCapture) === NoFlags) {
          didReceiveUpdate = false;
          return attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes);
        }
    }
}

```

在 **`update`** 时，会先去以节点的`Props`，上下文，以及`type`为依据，判断节点是否可以复用，如果不可以，则标记 `didReceiveUpdate = true`；如果可以则会进一步判断挂起的 `update`(这个是指触发更新的update) 或者上下文的变化，以及 `DidCapture`(DidCapture用来表示一些异常捕获) 标识位。满足一个路径之后，则会直接调用 `attemptEarlyBailoutIfNoScheduledUpdate()`，并返回。

###### attemptEarlyBailoutIfNoScheduledUpdate

```js
function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress, renderLanes) {
    switch (workInProgress.tag) {
      case HostRoot:
        //...
        break;
      case HostComponent:
        pushHostContext(workInProgress);
        break;
      case ClassComponent:
        //...
        break;
      case HostPortal:
        pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
        break;
      case OffscreenComponent:
      case LegacyHiddenComponent:
        {
          workInProgress.lanes = NoLanes;
          return updateOffscreenComponent(current, workInProgress, renderLanes);
        }
    }
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
```

针对不同的情况处理的方式也不一样，有 `break`，也有直接`return`的。我们先关注 `bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)`如何复用节点的。

###### bailoutOnAlreadyFinishedWork

```js
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
    if (current !== null) {
      // 复用依赖
      workInProgress.dependencies = current.dependencies;
    }
    // 判断子节点是否需要检查更新
    if (!includesSomeLane(renderLanes, workInProgress.childLanes)) {
      {
        return null;
      }
    } 
    // 克隆子节点
    cloneChildFibers(current, workInProgress);
    return workInProgress.child;
  }
```

先复用`dependencies`，然后判断子节点是否需要检查更新，不需要则返回`null`；需要的话，则调用 `cloneChildFibers()`，克隆子节点。

> **`update`** 阶段的，另一条路径会去做`diff算法`来生成子fiber，我们后续再来研究。

##### mount

当不满足优化路径时，我们就进入第二部分，新建`子Fiber`。

我们可以看到，根据`fiber.tag`不同，进入不同类型`Fiber`的创建逻辑

```js
switch (workInProgress.tag) {
  case IndeterminateComponent: // 2
  {
      return mountIndeterminateComponent(current, workInProgress, workInProgress.type, renderLanes);
  }
  case FunctionComponent: // 0
      return ...
  case ClassComponent: // 1
      return ...
  case HostRoot: // 3
    return updateHostRoot(current, workInProgress, renderLanes);

  case HostComponent: // 5
    return updateHostComponent(current, workInProgress, renderLanes);
   //...
}
```

我们以 `case HostRoot`为入口，看看他们是如何生成`fiber`节点的。

###### updateHostRoot

```js
function updateHostRoot(current, workInProgress, renderLanes) {
    var nextProps = workInProgress.pendingProps;
    // 确保把 current 里面的队列克隆了过来
    cloneUpdateQueue(current, workInProgress);
    // 将shared里面的队列的update全部转化出来，比如将jsx函数执行，返回得到react元素(ast).
    processUpdateQueue(workInProgress, nextProps, null, renderLanes);
    var nextState = workInProgress.memoizedState;
    var nextChildren = nextState.element;
    reconcileChildren(current, workInProgress, nextChildren, renderLanes);
    return workInProgress.child;
  }
```

`processUpdateQueue()`函数将我们之前挂在 `updateQueue.shared.pending`队列的`update`，转化为新的`state`，赋值给 `workInProgress.memoizedState`，生成的`react ast`复制在`workInProgress.memoizedState.element`。
如下图所示：

![image](/assets/img/react18/sourceCode/render/render4.png)

> 关于processUpdateQueue的细节实现，我们后续再继续研究。

###### reconcileChildren

```js
 function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
    if (current === null) {
      // monut
      workInProgress.child = mountChildFibers(workInProgress, null, nextChildren, renderLanes);
    } else {
      // update
      workInProgress.child = reconcileChildFibers(workInProgress, current.child, nextChildren, renderLanes);
    }
  }
  
var reconcileChildFibers = ChildReconciler(true);
var mountChildFibers = ChildReconciler(false);
```

`reconcileChildFibers`与`mountChildFibers`都是由`ChildReconciler(shouldTrackSideEffects)`生成。
在 **`monut`** 阶段，不用生成带有 `flags`，反之，**`update`** 则需要。由于 `workProgress`存在`current`，则进入 `reconcileChildFibers()`函数。

###### ChildReconciler

```js
 function ChildReconciler(shouldTrackSideEffects) {
    function deleteChild(returnFiber, childToDelete) {}
    function deleteRemainingChildren(returnFiber, currentFirstChild){}
    function mapRemainingChildren(returnFiber, currentFirstChild) {}
    function useFiber(fiber, pendingProps) {}
    function placeChild(newFiber, lastPlacedIndex, newIndex) {}
    function placeSingleChild(newFiber) {}
    function updateTextNode(returnFiber, current, textContent, lanes) {}
    function updateElement(returnFiber, current, element, lanes) {}
    function updatePortal(returnFiber, current, portal, lanes) {}
    function updateFragment(returnFiber, current, fragment, lanes, key) {}
    function createChild(returnFiber, newChild, lanes) {}
    function updateSlot(returnFiber, oldFiber, newChild, lanes) {}
    function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {}
    function warnOnInvalidKey(child, knownKeys, returnFiber) {}
    function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {}
    function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildrenIterable, lanes) {}
    function reconcileSingleTextNode(returnFiber, currentFirstChild, textContent, lanes) {}
    function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {}
    function reconcileSinglePortal(returnFiber, currentFirstChild, portal, lanes) {} 

    function reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes) {
      var isUnkeyedTopLevelFragment = typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;
      if (isUnkeyedTopLevelFragment) {
        newChild = newChild.props.children;
      }
      if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            // reconcileSingleElement 返回一个由react元素 创建的fiber
            return placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes));
          case REACT_PORTAL_TYPE:
            return placeSingleChild(reconcileSinglePortal(returnFiber, currentFirstChild, newChild, lanes));
          case REACT_LAZY_TYPE:
            var payload = newChild._payload;
            var init = newChild._init; 
            return reconcileChildFibers(returnFiber, currentFirstChild, init(payload), lanes);
        }
        // 多个节点的情况，newChild是 array 的case
        if (isArray(newChild)) {
          return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
        }
        if (getIteratorFn(newChild)) {
          return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
        }

        throwOnInvalidObjectType(returnFiber, newChild);
      }
      // 这里对于 string，number 都是单个节点，对应一种处理方式
      if (typeof newChild === 'string' && newChild !== '' || typeof newChild === 'number') {
        return placeSingleChild(reconcileSingleTextNode(returnFiber, currentFirstChild, '' + newChild, lanes));
      }
      return deleteRemainingChildren(returnFiber, currentFirstChild);
    }

    return reconcileChildFibers;
  }
```

`ChildReconciler()`构造函数是整个生成`fiber`的核心实现，我们可以看到这里内部定义的函数很多，针对的情况也很多，我们先看看，我可能举例的这种`case`它是如何生成`fiber`的。由于们是符合`element.$$typeof == Symbol(react.element)`，所以走下述逻辑`placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes))`。

> ChildReconciler()构造函数很像，vue2的createPatch()以及vue3的createRender()。通常都是用于上层虚拟Dom和下层Api(比如Dom，比如native基类)链接，也是大多数跨端框架实现原理。

###### reconcileSingleElement

```js
  function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
      var key = element.key; // element 即 newChild
      var child = currentFirstChild;
      // 判断 上次是否有Dom节点存在
      while (child !== null) {
      // 单个节点diff优化
      }
      if (element.type === REACT_FRAGMENT_TYPE) {
        var created = createFiberFromFragment(element.props.children, returnFiber.mode, lanes, element.key);
        created.return = returnFiber;
        return created;
      } else {
        // 创建新的 fiber 节点
        var _created4 = createFiberFromElement(element, returnFiber.mode, lanes);
        _created4.ref = coerceRef(returnFiber, currentFirstChild, element);
        _created4.return = returnFiber;
        return _created4;
      }
    }
```

`currentFirstChild`不存在，这个优化主要用于有`child`节点的 `diff`优化，我们先忽略。关注`createFiberFromElement()`函数实现。

###### createFiberFromElement

```js
function createFiberFromElement(element, mode, lanes) {
    var owner = null;
    {
      owner = element._owner;
    }
    // type 就是 App function
    var type = element.type;
    var key = element.key;
    var pendingProps = element.props;
    var fiber = createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes);
    {
      fiber._debugSource = element._source;
      fiber._debugOwner = element._owner;
    }
    return fiber;
  }
function createFiberFromTypeAndProps(type, // React$ElementType
  key, pendingProps, owner, mode, lanes) {
    var fiberTag = IndeterminateComponent;
    var resolvedType = type;
    if (typeof type === 'function') {
        resolvedType = resolveFunctionForHotReloading(resolvedType);
    }
    // ...
    var fiber = createFiber(fiberTag, pendingProps, key, mode);
    fiber.elementType = type;
    fiber.type = resolvedType;
    fiber.lanes = lanes;
    {
      fiber._debugOwner = owner;
    }
    return fiber;
  }
```

这样就完成了`App function`到`App function fiber`的转化，这里我们要注意`fiberTag`的类型。有同学就有疑问了，你不是说是返回`div`或者`p`就这样的`fiber.type`怎么这里没有呢？饭要一口口吃。这里将 `App function fiber`最为`workProgress.child`返回之后，又会去执行`beginWork()`，由于这里标记了`fiberTag = IndeterminateComponent`，下次就是执行这个函数，拿到`return `里面的`react 元素`，再由他们生成对应`fiber`再返回，直至节点树遍历完成，则会进入到 `completeUnitOfWork()`函数之中。

#### completeUnitOfWork

```js
function completeUnitOfWork(unitOfWork) {
    var completedWork = unitOfWork;
    do {
      var current = completedWork.alternate;
      var returnFiber = completedWork.return;
      var next = completeWork(current, completedWork,renderLanes$1);
       // 什么情况？
       // completeWork 可能返回子节点，需要继续beginWork
        if (next !== null) {
          workInProgress = next;
          return;
        }
      // 存在兄弟节点，则将workInProgress=siblingFiber，返回，继续beginWork
      var siblingFiber = completedWork.sibling;
      if (siblingFiber !== null) {
        workInProgress = siblingFiber;
        return;
      }
      // 返回父节点，继续completeWork
      completedWork = returnFiber; 
      workInProgress = completedWork;
    } while (completedWork !== null);

  }
```

`completeUnitOfWork()`主要是`completedWork()`函数运转的流程控制。大概会有这么三种情况：

1.  如果 `completedWork()` 返回了子节点`next`，则将`workInProgress=next`需要继续 `beginWork()`。
2.  再判断是否存在兄弟节点`siblingFiber`，存在的话，则`workInProgress=siblingFiber`需要继续 `beginWork()`
3.  否则，将`completedWork = returnFiber`，需要继续 `completedWork()`

#### completeWork

```js
function completeWork(current, workInProgress, renderLanes) {
    console.log('completeWork', workInProgress?.type)
    var newProps = workInProgress.pendingProps; 
    popTreeContext(workInProgress);
    switch (workInProgress.tag) {
      case IndeterminateComponent:
      case LazyComponent:
      case SimpleMemoComponent:
      case FunctionComponent:
      case ForwardRef:
      case Fragment:
      case Mode:
      case Profiler:
      case ContextConsumer:
      case MemoComponent:
        bubbleProperties(workInProgress);
        return null;
      case HostRoot:
      // ...
      
      // Tip: 页面渲染所必须的，即原生DOM组件对应的Fiber节点
      case HostComponent:
        {
          popHostContext(workInProgress);
          var rootContainerInstance = getRootHostContainer();
          var type = workInProgress.type;
          if (current !== null && workInProgress.stateNode != null) {           // diff fiber properties
            updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);
            if (current.ref !== workInProgress.ref) {
              markRef$1(workInProgress);
            }
          } else {
            if (!newProps) {
              if (workInProgress.stateNode === null) {
                throw new Error('We must have new props for new mounts. This error is likely ' + 'caused by a bug in React. Please file an issue.');
              }
              // This can happen when we abort work.
              bubbleProperties(workInProgress);
              return null;
            }
            var currentHostContext = getHostContext();
            var _wasHydrated = popHydrationState(workInProgress);
            if (_wasHydrated) {
              if (prepareToHydrateHostInstance(workInProgress, rootContainerInstance, currentHostContext)) {
                markUpdate(workInProgress);
              }
            } else {
              // 创建Dom实例
              var instance = createInstance(type, newProps, rootContainerInstance, currentHostContext, workInProgress);
              // 插入子孙节点
              appendAllChildren(instance, workInProgress, false, false);
              workInProgress.stateNode = instance;
              if (finalizeInitialChildren(instance, type, newProps, rootContainerInstance)) {
                markUpdate(workInProgress);
              }
            }
            if (workInProgress.ref !== null) {
              markRef$1(workInProgress);
            }
          }
          // flags冒泡到subtreeFlags
          bubbleProperties(workInProgress);
          return null;
        }
        // ...
    }
  }
```

`completeWork(current, workInProgress, renderLanes)`用大家普遍认知的话来描述，它是一个“归”的过程。

流程图如下：

![image](/assets/img/react18/sourceCode/render/render5.png)

##### update

```js
 if (current !== null && workInProgress.stateNode != null) {
    updateHostComponent$1(current, workInProgress, type, newProps, rootContainerInstance);
  }
 
var updateHostComponent$1 = function (current, workInProgress, type, newProps, rootContainerInstance) {
      var oldProps = current.memoizedProps;
      if (oldProps === newProps) {
        return;
      } 
      var instance = workInProgress.stateNode;
      var currentHostContext = getHostContext(); 
      // Tip: 
      // 被处理完的props会被赋值给 workInProgress.updateQueue，
      // 并最终会在commit阶段被渲染在页面上
      // 其中 updatePayload 为数组形式，
      // 他的偶数索引的值为变化的prop key，奇数索引的值为变化的prop value
      var updatePayload = prepareUpdate(instance, type, oldProps, newProps, rootContainerInstance, currentHostContext); 
      workInProgress.updateQueue = updatePayload
      if (updatePayload) {
        markUpdate(workInProgress);
      }
    };
```

在 **`update`** 时，调用 `updateHostComponent$1()`，新旧`props`比较，没变则直接返回；如果有变化则会去调用 `prepareUpdate()`，生成一个 `updatePayload`数组，挂载在`workInProgress.updateQueue`上。`updatePayload`的偶数索引的值为变化的`prop key`，奇数索引的值为变化的`prop value`。

![image](/assets/img/react18/sourceCode/render/render6.png)

###### prepareUpdate

```js
function prepareUpdate(domElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
    return diffProperties(domElement, type, oldProps, newProps);
  }
```

这里主要是调用 `diffProperties(domElement, type, oldProps, newProps)`，这里我们先不展开，后续再来探究。

##### mount

在 **`mount`** 时，调用 `createInstance()`生成 `dom`实例，之后通过`appendAllChildren()`方法将子孙`dom`插入当前实例。并将 `workInProgress.stateNode = instance`实例挂载到`stateNode`上。然后调用`finalizeInitialChildren()`来初始化节点的属性和事件。

###### createInstance

```js
function createInstance(type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
    var parentNamespace;
    var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
    precacheFiberNode(internalInstanceHandle, domElement);
    updateFiberProps(domElement, props);
    return domElement;
  }
 function createElement(type, props, rootContainerElement, parentNamespace) {
    // 获取 dom
    var ownerDocument = getOwnerDocumentFromRootContainer(rootContainerElement);
    // 创建实例
    var domElement = ownerDocument.createElement(type); 
    return domElement;
  }
```

`createInstance()`内部主要调用`createElement()`方法来创建`Dom`实例，不同的平台底层实现不一样，在浏览器端，其实就是`document.createElement()`方法来生成`Dom`元素。

###### appendAllChildren

```js
appendAllChildren = function (parent, workInProgress, needsVisibilityToggle, isHidden) {
      var node = workInProgress.child;
      while (node !== null) {
        // 如果是dom节点或者是文本节点，直接塞入如节点，
        if (node.tag === HostComponent || node.tag === HostText) {
          appendInitialChild(parent, node.stateNode);
        } else if (node.tag === HostPortal) ;
        else if (node.child !== null) {
          // 如果不是的话，保存当前父节点()
          node.child.return = node;
          // 向下移动
          node = node.child;
          continue;
        }
        if (node === workInProgress) {
          return;
        }
        while (node.sibling === null) {
          if (node.return === null || node.return === workInProgress) {
            return;
          }
          node = node.return;
        }
        // 处理兄弟节点
        node.sibling.return = node.return;
        node = node.sibling;
      }
    };
```

先判断子节点类型：
如果子节点是 `HostComponent` 或 `HostText`：

*   宿主组件（如 `p`、`span`）和文本节点（如 `"Hello World"`）的 `stateNode` 指向实际的 DOM 节点。则使用 `appendChild` 将这些 DOM 节点附加到父节点。
*   如果子节点不满足上述判断：递归处理其子节点，通过 `node.child` 继续向下遍历。
*   如果当前节点有兄弟节点（`node.sibling`存在），继续处理兄弟节点。
*   当子树遍历完成后，通过 `node.return` 返回到父节点，继续处理其他子节点。

###### finalizeInitialChildren

```js
function finalizeInitialChildren(domElement, type, props, rootContainerInstance, hostContext) {
    // 初始化属性
    setInitialProperties(domElement, type, props, rootContainerInstance);

    // 返回true，则会标记更新
    switch (type) {
      case 'button':
      case 'input':
      case 'select':
      case 'textarea':
        return !!props.autoFocus;

      case 'img':
        return true;

      default:
        return false;
    }
  }
```

`setInitialProperties(domElement, type, props, rootContainerInstance)`初始化属性，`button`这些标签如果有`autoFocus`属性，返回为`true`，则会标记更新，**`commit`** 阶段就会触发对应的事件。

###### setInitialProperties

```js
function setInitialProperties(domElement, tag, rawProps, rootContainerElement) {
    // 针对不同的tag，将不能冒泡和捕获的事件，绑定到具体的元素之上
    switch (tag) {
      case 'dialog':
        listenToNonDelegatedEvent('cancel', domElement);
        listenToNonDelegatedEvent('close', domElement);
        props = rawProps;
        break;
      // ...
    }
      // 设置dom的属性，比如内联样式等
    setInitialDOMProperties(tag, domElement, rootContainerElement, props, isCustomComponentTag);

    // 设置表单元素的相关值
    switch (tag) {
      case 'input':
        track(domElement);
        postMountWrapper(domElement, rawProps, false);
        break;
      // ...
      default:
        if (typeof props.onClick === 'function') {
          trapClickOnNonInteractiveElement(domElement);
        }
        break;
    }
  } 
```

`setInitialProperties()`大概做了这么几件事：

*   针对不同的`tag`，将不能冒泡和捕获的事件，绑定到具体的元素之上。
*   设置`dom`的属性，比如内联样式，常规属性等等
*   针对不同的`tag`，设置表单元素的相关值

> 这里的事件处理，是一些不能走react合成事件的特殊处理，具体的事件合成机制，我们后续再来深入。

##### bubbleProperties

```js
function bubbleProperties(completedWork) {
   
    var newChildLanes = NoLanes;
    var subtreeFlags = NoFlags;
    // ...
    // 核心逻辑
    while (_child !== null) {
      newChildLanes = mergeLanes(newChildLanes, mergeLanes(_child.lanes, _child.childLanes));
      subtreeFlags |= _child.subtreeFlags;
      subtreeFlags |= _child.flags; 
      _child.return = completedWork;
      _child = _child.sibling;
    }
    completedWork.subtreeFlags |= subtreeFlags;
    completedWork.childLanes = newChildLanes;
    // ...
  }
```

`bubbleProperties()`对所有的`workInProgress.tag`都会执行，主要将子节点`flags`标记`按位或`操作冒泡到父节点的`subtreeFlags`上，`lanes`则是通过`mergeLanes()`合并实现。此外还有静态节点标记等等，这是为了在 **`commit`** 阶段能够尽可能去优化性能。

## 总结

1.  至此，整个`react`的`render`阶段做了哪些事情，以及`beginWork()`和`completeWork()`是如何协作的。
2.  其中还有很多部分在本文中没有详细阐述，比如，`diff`细节，事件合成，`fiber`属性的`diff`等等，我们后续再去深入。
3.  我觉得这部分的设计和实现，挺有魔力的，不知道`react`的作者们是借鉴了其他模块的实现，还常规手段，相比于`vue`的常规实现，确实开拓技术视野。

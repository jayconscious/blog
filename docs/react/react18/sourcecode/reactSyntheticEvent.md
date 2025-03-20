---
title: React源码解析(四)：事件合成
date: 2025-03-19
sidebar: auto
tags: 
 - react18
categories:
 - react
sticky: 1
---

## 前言

如果按照之前源码解析顺序，这篇应该开始深入 `commit` 阶段，but，凡事总有但是。`react`事件合成让我产生了兴趣，所以这一篇我们先来看看这部分是怎么实现，是为了解决什么样的问题。

## 背景

先抛出一个问题，`react`事件合成系统是为了解决什么问题来设计的呢？它又是怎么解决这些问题的呢？还有为什么使用这些手段或者技术解问题，是按部就班还是推陈出新？是否还有其他更好的方案呢？其实每一个技术方案的背后都是这些问题，先不展开描述这些，让我们来看看它是如何实现的吧。

## 实现原理

`react` 的事件合成系统主要包括以下几个部分：

1.  **事件注册**：将事件绑定到根节点。
2.  **事件触发**：捕获事件并调用对应的处理函数。
3.  **事件合成**：封装原生事件，提供跨浏览器一致的接口。
4.  **事件池**：重用事件对象以减少内存开销。

接下来我们来一一解析这些模块：

### 事件注册

其实在事件绑定到更节点上之前，还有一个事件收集的过程。直接来看代码吧。

```js
registerSimpleEvents(); // click
registerEvents$2(); // onMouseEnter，onMouseLeave，onPointerEnter，onPointerLeave
registerEvents$1(); // onChange
registerEvents$3(); // onSelect
registerEvents();   // onBeforeInput，onCompositionEnd，onCompositionStart
```

> 这些代码的执行顺序，是在引入react就会执行的，也就是说是在 root.render()之前。

#### registerSimpleEvents

这里先以 `registerSimpleEvents()` 为例。

```js
function registerSimpleEvents() {
    for (var i = 0; i < simpleEventPluginEvents.length; i++) {
      var eventName = simpleEventPluginEvents[i];
      var domEventName = eventName.toLowerCase();
      // 小写转大写，click => Click
      var capitalizedEvent = eventName[0].toUpperCase() + eventName.slice(1);
      registerSimpleEvent(domEventName, 'on' + capitalizedEvent);
    }
    // ...
  }
```

`simpleEventPluginEvents`就是简单事件集合，就是这些事件。

![image](/assets/img/react18/sourceCode/syntheticEvent/event1.png)


#### registerSimpleEvent

```js
function registerSimpleEvent(domEventName, reactName) {
    // 存下事件映射关系，click => onClick
    topLevelEventsToReactNames.set(domEventName, reactName);
    // 
    registerTwoPhaseEvent(reactName, [domEventName]);
  }
function registerTwoPhaseEvent(registrationName, dependencies) {
    registerDirectEvent(registrationName, dependencies);
    registerDirectEvent(registrationName + 'Capture', dependencies);
  }
function registerDirectEvent(registrationName, dependencies) {
    registrationNameDependencies[registrationName] = dependencies;
    {
      var lowerCasedName = registrationName.toLowerCase();
      possibleRegistrationNames[lowerCasedName] = registrationName;

      if (registrationName === 'onDoubleClick') {
        possibleRegistrationNames.ondblclick = registrationName;
      }
    }
    for (var i = 0; i < dependencies.length; i++) {
      allNativeEvents.add(dependencies[i]);
    }
  }
```

这里我们需要注意两个点：

1.  `registerTwoPhaseEvent(reactName, [domEventName])`这里第二个参数是数组，也就是 `reactName`和`domEventName`，存在一对多的情况，说人话，就是一个`react`事件会有多个原生事件触发。
2.  `allNativeEvents`，所有的事件都被收集到这个集合里面了。注册的时候需要用到哦。

> `registerEvents$1`，`registerEvents$2...`就是注册一些抽象事件，也就是\[domEventName]参数多个的case。

#### listenToAllSupportedEvents

```js
function listenToAllSupportedEvents(rootContainerElement) {
      allNativeEvents.forEach(function (domEventName) {
        // We handle selectionchange separately because it
        // doesn't bubble and needs to be on the document.
        // 我们单独处理selectionchange，因为它不会冒泡，并且需要在文档上。
        if (domEventName !== 'selectionchange') {
          if (!nonDelegatedEvents.has(domEventName)) {
            listenToNativeEvent(domEventName, false, rootContainerElement);
          }

          listenToNativeEvent(domEventName, true, rootContainerElement);
        }
      });
  }
```

`listenToAllSupportedEvents`就是所有事件的注册入口，即把`allNativeEvents`里的所有事件在根节点上添加事件监听器。

> 其实。我们猜猜也能知道，这里的事件监听是大有玄机的。所有的事件入口都在这里，比如我一个 \<button onClick={() => sendCode()}>hahaha</button>。它是如何识别处理的，都在这个监听器上。

#### listenToNativeEvent

```js
function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
    var eventSystemFlags = 0;
    if (isCapturePhaseListener) {
      eventSystemFlags |= IS_CAPTURE_PHASE;
    }
    addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
  }
```

这里只是做了层参数抽象。主要是`addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener)`函数。

#### addTrappedEventListener

```js
function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener, isDeferredListenerForLegacyFBSupport) {
    // 创建监听器
    var listener = createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags);

    targetContainer = targetContainer;
    var unsubscribeListener;

    // 添加对应的监听器
    if (isCapturePhaseListener) {
      if (isPassiveListener !== undefined) {
        unsubscribeListener = addEventCaptureListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
      } else {
        unsubscribeListener = addEventCaptureListener(targetContainer, domEventName, listener);
      }
    } else {
      if (isPassiveListener !== undefined) {
        unsubscribeListener = addEventBubbleListenerWithPassiveFlag(targetContainer, domEventName, listener, isPassiveListener);
      } else {
        unsubscribeListener = addEventBubbleListener(targetContainer, domEventName, listener);
      }
    }
  }
```

`createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags)`在这里，我们先不展开，等到**事件触发**的阶段我们再来详细展开这部分。

至此，事件注册的逻辑已经完成了。

### 事件触发

当我们点击页面或者其他事件触发，`react`就会执行我们事件注册阶段的`listener=createEventListenerWrapperWithPriority(targetContainer, domEventName, eventSystemFlags)`。我们先来看看有哪些调用栈。

![image](/assets/img/react18/sourceCode/syntheticEvent/event2.png)

#### dispatchEvent

```js
function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {

dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay(domEventName, eventSystemFlags, targetContainer, nativeEvent);

  }
```

`dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay`这个函数名可真是太长长长了。那么它具体做了哪些事情呢？我们继续往下看。

大概做了这么几件事：

1.  检查事件是否被阻塞。
2.  如果是连续事件，将其加入队列。
3.  对于需要 `hydration` 的离散事件，尝试同步 `hydration`。
4.  根据事件的状态（捕获阶段、阻塞状态等）决定是否派发事件。

> 其实这个函数名也告诉我们它做了哪些事情了，以前听耗子叔说国内外库函数命名差异大，看了之后才能切身的感受到。

> 此外，真实的`Dom`节点和与之对应的`fiber`是有链接的。

我们接着调用栈往下继续哈。

#### dispatchEventForPluginEventSystem

```js
function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    var ancestorInst = targetInst;
    
    // 是否需要将目标fiber更改为不同的祖先
    // ...
    
    // 批次调用
    batchedUpdates(function () {
      return dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, ancestorInst);
    });
  }
```

核心点在于 **目标实例和祖先实例**：

*   `targetInst` 是事件的目标实例。
*   `ancestorInst` 是事件的目标实例或其祖先实例，用于确定事件的冒泡路径

> batchedUpdates 这里我们先不深入，主要是优化性能的。

#### dispatchEventsForPlugins

```js
function dispatchEventsForPlugins(domEventName, eventSystemFlags, nativeEvent, targetInst, targetContainer) {
    var nativeEventTarget = getEventTarget(nativeEvent);
    var dispatchQueue = [];
    // 提取事件
    extractEvents$5(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags);
    // 处理事件
    processDispatchQueue(dispatchQueue, eventSystemFlags);
  }
```

这里主要包括两个部分，提取事件和处理事件。

##### extractEvents\$5

```js
function extractEvents$5(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    extractEvents$4(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags);
    var shouldProcessPolyfillPlugins = (eventSystemFlags & SHOULD_NOT_PROCESS_POLYFILL_EVENT_PLUGINS) === 0;
    if (shouldProcessPolyfillPlugins) {
      extractEvents$2(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
      extractEvents$1(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
      extractEvents$3(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
      extractEvents(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
    }
  }
```

我们先关注 `extractEvents$4` 这个函数，具体的逻辑。

###### extractEvents\$4

```js
function extractEvents$4(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget, eventSystemFlags, targetContainer) {
    var reactName = topLevelEventsToReactNames.get(domEventName);
    if (reactName === undefined) {
      return;
    }
    // 合成事件对象
    var SyntheticEventCtor = SyntheticEvent;
    var reactEventType = domEventName;
    
    switch (domEventName) {
      case 'keypress':
        if (getEventCharCode(nativeEvent) === 0) {
          return;
        }
      case 'keydown':
      case 'keyup':
        SyntheticEventCtor = SyntheticKeyboardEvent;
        break;
      case 'focusin':
        reactEventType = 'focus';
        SyntheticEventCtor = SyntheticFocusEvent;
        break;
      case 'focusout':
        reactEventType = 'blur';
        SyntheticEventCtor = SyntheticFocusEvent;
        break;
      case 'beforeblur':
      case 'afterblur':
        SyntheticEventCtor = SyntheticFocusEvent;
        break;
      case 'click':
        // Firefox creates a click event on right mouse clicks. This removes the
        // unwanted click events.
        // Firefox 在鼠标右键单击时创建点击事件。这将删除不需要的点击事件
        if (nativeEvent.button === 2) {
          return;
        }
        break;
        // ...
    }
    
    var inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

    {
      // Some events don't bubble in the browser.
      // In the past, React has always bubbled them, but this can be surprising.
      // We're going to try aligning closer to the browser behavior by not bubbling
      // them in React either. We'll start by not bubbling onScroll, and then expand.
      var accumulateTargetOnly = !inCapturePhase && 
      
        // TODO: ideally, we'd eventually add all events from
        // nonDelegatedEvents list in DOMPluginEventSystem.
        // Then we can remove this special list.
        // This is a breaking change that can wait until React 18.
        domEventName === 'scroll';

      // 提取具体元素上绑定的事件
      var _listeners = accumulateSinglePhaseListeners(targetInst, reactName, nativeEvent.type, inCapturePhase, accumulateTargetOnly);

      if (_listeners.length > 0) {
        // Intentionally create event lazily.
        var _event = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget);

        // 维护到队列里面
        dispatchQueue.push({
          event: _event,
          listeners: _listeners
        });
      }
    }
  }
```

这里面做了这么几件事：

1.  对不同的事件使用不同合成事件构造器，它主要用于抹平不同浏览器事件对象的差异性。
2.  `accumulateSinglePhaseListeners`，主要用于收集元素上面的绑定事件监听器(`react语法的那种`)。
3.  通过事件构造器实例化得到`react`的 `event`，然后将监听器和事件对象维护到`dispatchQueue`中，以便后续的处理。

###### accumulateSinglePhaseListeners

我们来看看其内部实现。

```js
function accumulateSinglePhaseListeners(targetFiber, reactName, nativeEventType, inCapturePhase, accumulateTargetOnly, nativeEvent) {
    var captureName = reactName !== null ? reactName + 'Capture' : null;
    var reactEventName = inCapturePhase ? captureName : reactName;
    var listeners = [];
    var instance = targetFiber;
    // 即 currentTarget
    var lastHostComponent = null; 
    // Accumulate all instances and listeners via the target -> root path.
    // 通过目标 -> 根路径累积所有实例和监听器
    while (instance !== null) {
      var _instance2 = instance,
        stateNode = _instance2.stateNode,
        tag = _instance2.tag; 

      // fiber.tag 为 HostComponent(即Dom)，才提取事件
      if (tag === HostComponent && stateNode !== null) {
        lastHostComponent = stateNode; 
        // createEventHandle listeners

        if (reactEventName !== null) {
          // 从对应的 fiber 节点属性之中，把react事件提取出来
          var listener = getListener(instance, reactEventName);

          if (listener != null) {
            listeners.push(createDispatchListener(instance, listener, lastHostComponent));
          }
        }
      }
      // 如果我们只为目标积累事件，那么我们就不会继续通过 React 光纤树传播来寻找其他监听器。
      if (accumulateTargetOnly) {
        break;
      } 
      // If we are processing the onBeforeBlur event, then we need to take
      // 返回父节点
      instance = instance.return;
    }

    return listeners;
  }

```

这里主要是依据`targetFiber`，通过`getListener()`方法，把 `fiber`中的事件提取出来，然后维护到`listeners`里面。之后返回父节点，继续提取。

##### processDispatchQueue

```js
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
    var inCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

    for (var i = 0; i < dispatchQueue.length; i++) {
      var _dispatchQueue$i = dispatchQueue[i],
        event = _dispatchQueue$i.event,
        listeners = _dispatchQueue$i.listeners;
      processDispatchQueueItemsInOrder(event, listeners, inCapturePhase);
      //  event system doesn't use pooling.
      // 事件系统不使用池化
    }
    // This would be a good time to rethrow if any of the event handlers threw.
    rethrowCaughtError();
  }
```

`processDispatchQueue()`处理 `dispatchQueue`内的所有提取的事件。

###### processDispatchQueueItemsInOrder

```js
function processDispatchQueueItemsInOrder(event, dispatchListeners, inCapturePhase) {
    var previousInstance;
    // 捕获阶段，降序
    if (inCapturePhase) {
      for (var i = dispatchListeners.length - 1; i >= 0; i--) {
        var _dispatchListeners$i = dispatchListeners[i],
          instance = _dispatchListeners$i.instance,
          currentTarget = _dispatchListeners$i.currentTarget,
          listener = _dispatchListeners$i.listener;
        if (instance !== previousInstance && event.isPropagationStopped()) {
          return; createRoot
        }
        executeDispatch(event, listener, currentTarget);
        previousInstance = instance;
      }
    } else {
      // 冒泡阶段，升序
      for (var _i = 0; _i < dispatchListeners.length; _i++) {
        var _dispatchListeners$_i = dispatchListeners[_i],
          _instance = _dispatchListeners$_i.instance,
          _currentTarget = _dispatchListeners$_i.currentTarget,
          _listener = _dispatchListeners$_i.listener;
        if (_instance !== previousInstance && event.isPropagationStopped()) {
          return;
        }
        executeDispatch(event, _listener, _currentTarget);
        previousInstance = _instance;
      }
    }
  }

```

在`processDispatchQueueItemsInOrder`函数中, 根据`捕获(capture)`或`冒泡(bubble)`的不同, 采取了不同的遍历方式:

1.  `capture`阶段事件: `从上至下`调用`fiber树`中绑定的回调函数, 所以`倒序`遍历`dispatchListeners`.
2.  `bubble`阶段事件: `从下至上`调用`fiber树`中绑定的回调函数, 所以`顺序`遍历`dispatchListeners`.

###### executeDispatch

```js
function executeDispatch(event, listener, currentTarget) {
    var type = event.type || 'unknown-event';
    event.currentTarget = currentTarget;
    invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
    event.currentTarget = null;
  }
  
function invokeGuardedCallbackProd(name, func, context, a, b, c, d, e, f) {
    var funcArgs = Array.prototype.slice.call(arguments, 3);

    try {
      func.apply(context, funcArgs);
    } catch (error) {
      this.onError(error);
    }
  }

  var invokeGuardedCallbackImpl = invokeGuardedCallbackProd;
```

`executeDispatch` 最后的触发链路也就是执行的 `listener`。这个是在成产模式下的执行链路。但是在开发模式下，它的执行链路就比较有意思的，为了能在开发模式更好的开发，做了很多事情，感兴趣的同学可以去看下源码。

总结一下事件触发阶段的几个关键步骤：

1.  `Dom元素`关联`fiber元素`.
2.  事件的提取
3.  合成事件对象的构造
4.  派发事件。

## 总结

那么`react合成事件`解决了哪些问题呢？

1.跨浏览器兼容性</br>
问题：不同浏览器对事件处理的方式不同，开发者需编写额外代码来兼容。</br>
解决：React 的事件合成系统封装了浏览器原生事件，提供一致的事件接口，开发者无需担心浏览器差异。

2. 性能优化</br>
问题：直接在 DOM 上绑定大量事件监听器可能导致性能问题。</br>
解决：React 使用事件委托，将事件监听器绑定到文档根节点，按需触发事件处理函数，减少内存占用并提升性能。

3. 事件池化（**Event Pooling**）</br>
问题：频繁创建和销毁事件对象会增加垃圾回收负担。</br>
解决：React 使用事件池化技术，复用事件对象，减少内存分配和垃圾回收次数，提升性能。

4. 统一的事件处理</br>
问题：原生事件处理方式复杂，需手动管理事件绑定和解绑。</br>
解决：React 提供声明式的事件绑定方式，简化事件处理逻辑，自动管理事件监听器的绑定和解绑。

5. 事件对象的封装</br>
问题：原生事件对象包含大量属性和方法，部分不常用或存在兼容性问题。</br>
解决：React 封装了事件对象，提供常用属性和方法，简化事件处理代码。

6. 组件化事件处理 </br>
问题：原生事件处理难以与组件化开发模式结合。</br>
解决：React 的事件合成系统与组件化开发紧密结合，事件处理函数可以直接定义在组件中，提升代码可维护性。

---
title: React源码解析(三)：diff算法
date: 2025-02-24
sidebar: auto
tags: 
 - react18
categories:
 - react
sticky: 1
---

## 前言

在上一篇[React源码解析(二)：render阶段](https://juejin.cn/post/7460758124339478580)文章中，在 **render阶段**中，`beginWork`中由 `react ast`生成`fiber`阶段，为了在 **`update阶段`**，提升性能，减少开销，所以才有 `diff` 过程。换言之没有`diff`也不会影响功能滴。

如果所示：

![image](/assets/img/react18/sourceCode/diff/diff1.png)

## diff 算法

老样子，我们先来举个🌰

```js
export default function App() {
  // 得分榜
  const [list, setList] = useState([
    { name: 'kobe', score: '30' },
    { name: 'james', score: '40' },
    { name: 'wade', score: '20' },
  ])
  // 刷新
  const handleClick = useCallback(() => {
    list.forEach(item => {
      if (item.name === 'james') {
        item.score = '61'
      }
    })
    setList([...list])
  }, [list])

  const totalScore = useMemo(() => {
    return list.reduce((sum, item) => {
      return sum + Number(item.score)
    }, 0)
  }, [list])

  const renderList = list.map(item => {
    return <div key={item.name}>{item.name + ': ' + item.score}</div>
  })
  return (
    <div className='Index'>
      <div>得分榜：{totalScore}</div>
      <div className='itemBox'>{renderList}</div>
      <button onClick={handleClick}>刷新</button>
    </div>
  )
}
```

### reconcileChildFibers

当我们点击刷新的时候触发更新，所以此时会进入到 **`update阶段`**，依照上述流程图阶段，我们直接进入到 `reconcileChildFibers()`这个函数中。

`reconcileChildFibers()`函数是通过 `var reconcileChildFibers = ChildReconciler(true)`来生成滴。

> Tip: ChildReconciler(shouldTrackSideEffects)，这个shouldTrackSideEffects参数位，标记fiber节点是否需要开启 fiber.flags 字段，还以其他逻辑上对副作用的跟踪，这样可以优化性能。毕竟在mount阶段是不要标记副作用的。

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
      // ...
    }

    return reconcileChildFibers;
  }
```

> 嘤嘤嘤，函数名太多，看晕了\~ 涉及到具体的函数我们再具体分析。

### return reconcileChildFibers

```js

function reconcileChildFibers(returnFiber, currentFirstChild, newChild, lanes) {
      var isUnkeyedTopLevelFragment = typeof newChild === 'object' && newChild !== null && newChild.type === REACT_FRAGMENT_TYPE && newChild.key === null;
      if (isUnkeyedTopLevelFragment) {
        newChild = newChild.props.children;
      }
      // 单个元素
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

`react element ast`节点，单个子节点 `props.children`就是 `object`，多个子节点就是`array`。

![image](/assets/img/react18/sourceCode/diff/diff2.png)


所以这里就会先进入 `placeSingleChild(reconcileSingleElement(returnFiber, currentFirstChild, newChild, lanes));`,我们先看看内部函数`reconcileSingleElement`。

### reconcileSingleElement - 单节点diff

```js
function reconcileSingleElement(returnFiber, currentFirstChild, element, lanes) {
      // debugger
      var key = element.key;
      // element 即 react element ast

      var child = currentFirstChild;
      // 优先判断子元素是否存在
      // 判断 优先是否有 fiber 节点存在
      while (child !== null) {
        // TODO: If key === null and child.key === null, then this only applies to
        // the first item in the list.
        // 节点是否可以复用，
        // 优先比较 key 是否相同
        if (child.key === key) {
          var elementType = element.type;

          if (elementType === REACT_FRAGMENT_TYPE) {
            if (child.tag === Fragment) {
              deleteRemainingChildren(returnFiber, child.sibling);
              var existing = useFiber(child, element.props.children);
              existing.return = returnFiber;

              {
                existing._debugSource = element._source;
                existing._debugOwner = element._owner;
              }

              return existing;
            }
          } else {
            // 然后比较 type 相同
            if (child.elementType === elementType || (
            // Keep this check inline so it only runs on the false path:
            isCompatibleFamilyForHotReloading(child, element) ) || 
            // Lazy types should reconcile their resolved type.
            // We need to do this after the Hot Reloading check above,
            // because hot reloading has different semantics than prod because
            // it doesn't resuspend. So we can't let the call below suspend.
            typeof elementType === 'object' && elementType !== null 
            && elementType.$$typeof === REACT_LAZY_TYPE 
            && resolveLazy(elementType) === child.type) {
              // 已经找到可以复用的fiber节点
              deleteRemainingChildren(returnFiber, child.sibling);

              var _existing = useFiber(child, element.props);

              _existing.ref = coerceRef(returnFiber, child, element);
              _existing.return = returnFiber;

              {
                _existing._debugSource = element._source;
                _existing._debugOwner = element._owner;
              }

              // 返回这个复用的节点
              return _existing;
            }
          } // Didn't match.

          // 将该fiber及其兄弟fiber标记为删除
          // 当child !== null 且 key相同且type不同时
          // 执行 deleteRemainingChildren 将 child及其兄弟fiber都标记删除

          // 这是什么场景下面的 case ？
          deleteRemainingChildren(returnFiber, child);
          // 整块的内容替换 case，比如整片 li，全部被替换为 其他的节点，比如p
          // key 都为 0 ，但是type不同，后续的比较也没有意思，这在我们页面交互中，也是较多存在的。
          break;
        } else {
          // 当child !== null且key不同时仅将child标记删除。
          deleteChild(returnFiber, child);
        }

        child = child.sibling;
      }

      // 是否是 REACT_FRAGMENT_TYPE
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

流程如图所示：

![image](/assets/img/react18/sourceCode/diff/diff3.png)

这里的核心思想，就是从已经存在的`fiber`中寻找可以复用的节点，但是值得我们注意的是，它的判断前后顺序和重点在哪。这对我们的最佳实践很有帮助。

它优先从 `child fiber`中寻找可以复用的节点，复用优先判断 **`key`** 是否相同，不相同则判断下个兄弟节点。

1.  如果没有找到，则直接创建节点。
2.  如果找到，判断 `element.type === child.elementType`等逻辑，看是否可以复用。如果可以复用，则直接复用返回；如果不可以复用，则直接复跳出循环，然后创建节点。

> createFiberFromElement 是 react element ast与fiber的桥梁。<br/>
> deleteRemainingChildren 是 标记删除其余子节点。<br/>
> deleteChild 是 标记删除当前子节点。

#### placeSingleChild

```js
function placeSingleChild(newFiber) {
      // 打标
      if (shouldTrackSideEffects && newFiber.alternate === null) {
        newFiber.flags |= Placement;
      }

      return newFiber;
    }
```

### reconcileChildrenArray - 多节点diff

```js
function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
      // debugger
      
      var resultingFirstChild = null;
      // 最终返回的新 Fiber 链表的头节点。用于构建新的 Fiber 树。
      var previousNewFiber = null;
      // 当前正在构建的新 Fiber 链表的上一个节点。用于连接新 Fiber 节点，形成链表。
      var oldFiber = currentFirstChild;
      // 当前正在对比的旧 Fiber 节点。从 currentFirstChild 开始，逐步遍历旧 Fiber 链表。
      var lastPlacedIndex = 0;
      // 记录最后一个被“放置”的节点的索引。用于优化节点的移动操作，避免不必要的 DOM 操作。
      // 我们的参照物是：最后一个可复用的节点在oldFiber中的位置索引（用变量lastPlacedIndex表示）

      var newIdx = 0;
      // 当前新节点的索引。用于遍历新节点列表。
      
      var nextOldFiber = null;
      // 下一个 oldFiber 
      
      for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {

        // Todo: 这是干啥
        // Fiber.index 挂载的是当前 Fiber 节点在其兄弟节点中的位置信息。它是一个数字，表示当前节点在父节点的子节点列表中的顺序。例如：
        // 如果一个父节点有 3 个子节点，那么这些子节点的 index 分别是 0、1 和 2。

        if (oldFiber.index > newIdx) {
          // 如果发生了移动，将 oldFiber => nextOldFiber，oldFiber => null
          nextOldFiber = oldFiber;
          oldFiber = null;
        } else {
          // 如果没有发生偏移，则 oldFiber，指正向前移动
          nextOldFiber = oldFiber.sibling;
        }

        // Todo: do what ? 待完善。
        // 第一种情况：可以复用节点，如果 key 相同，type 相同的话。newFiber 即为更新之后的 fiber
        // 第二种情况：看子元素的类型，
            // 如果 key 相同 type 不同，返回 null
        var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);

        if (newFiber === null) {
          // TODO: This breaks on empty slots like null children. That's
          // unfortunate because it triggers the slow path all the time. We need
          // a better way to communicate whether this was a miss or null,
          // boolean, undefined, etc.

          // 这会在空槽（如空子项）上中断。那是不幸的是，因为它总是触发慢速路径。
          // 我们需要一种更好的方式来传达这是缺失还是 null、布尔值、未定义等。

          if (oldFiber === null) {
            oldFiber = nextOldFiber;
          }

          // 如果没有找到可以服用的节点就跳出循环了，
          break;
        }

        if (shouldTrackSideEffects) {
          if (oldFiber && newFiber.alternate === null) {
            // We matched the slot, but we didn't reuse the existing fiber, so we
            // need to delete the existing child.
            deleteChild(returnFiber, oldFiber);
          }
        }
        // Tip: 最后一个可复用的节点索引
        // 最后一个可复用的节点在 oldFiber 中的位置索引
        // lastPlacedIndex，记录上一个可以复用节点的次序

        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

        if (previousNewFiber === null) {
          // TODO: Move out of the loop. This only happens for the first run.
          resultingFirstChild = newFiber;
        } else {
          // TODO: Defer siblings if we're not at the right index for this slot.
          // I.e. if we had null values before, then we want to defer this
          // for each null value. However, we also don't want to call updateSlot
          // with the previous one.
          previousNewFiber.sibling = newFiber;
        }

        previousNewFiber = newFiber;
        oldFiber = nextOldFiber;
      } // for end

      // Todo: 第一轮循环结束之后，先判断 newChildren 是否遍历完。
      // 如果遍历完，则 标记删除 oldFiber 中剩余节点，将 resultingFirstChild 作为头结点返回。
      if (newIdx === newChildren.length) {
        // We've reached the end of the new children. We can delete the rest.
        deleteRemainingChildren(returnFiber, oldFiber);

        if (getIsHydrating()) {
          var numberOfForks = newIdx;
          pushTreeFork(returnFiber, numberOfForks);
        }

        return resultingFirstChild;
      }

      // Todo: 再判断 oldFiber 是否遍历，把 newChildren 的剩余节点，
      // 接在 resultingFirstChild 后面

      if (oldFiber === null) {
        // If we don't have any more existing children we can choose a fast path
        // since the rest will all be insertions.
        for (; newIdx < newChildren.length; newIdx++) {
          var _newFiber = createChild(returnFiber, newChildren[newIdx], lanes);

          if (_newFiber === null) {
            continue;
          }
          
          lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            // TODO: Move out of the loop. This only happens for the first run.
            resultingFirstChild = _newFiber;
          } else {
            previousNewFiber.sibling = _newFiber;
          }

          previousNewFiber = _newFiber;
        }

        if (getIsHydrating()) {
          var _numberOfForks = newIdx;
          pushTreeFork(returnFiber, _numberOfForks);
        }

        return resultingFirstChild;
      } 


      // Add the remaining children to a key map for quick lookups.
      // oldFiber 存入以 key 为 key，oldFiber 为 value的 Map 中。
      // 将剩余所有子项添加到关键映射中以进行快速查找

      var existingChildren = mapRemainingChildren(returnFiber, oldFiber);
      // console.log('existingChildren', existingChildren)

      // Keep scanning and use the map to restore deleted items as moves.
      // newChildren 和 oldFiber 都没有遍历完的情况
      for (; newIdx < newChildren.length; newIdx++) {
        var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], lanes);

        if (_newFiber2 !== null) {
          if (shouldTrackSideEffects) {

            if (_newFiber2.alternate !== null) {
              // The new fiber is a work in progress, but if there exists a
              // current, that means that we reused the fiber. We need to delete
              // it from the child list so that we don't add it to the deletion
              // list.

              // 新的 Fiber 正在进行中，但是如果存在目前，这意味着我们重复使用了 fiber。
              // 我们需要删除将其从子列表中删除，这样我们就不会将其添加到删除中列表。（优化性能）

              existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
            }
          }

          lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

          if (previousNewFiber === null) {
            resultingFirstChild = _newFiber2;
          } else {
            previousNewFiber.sibling = _newFiber2;
          }

          previousNewFiber = _newFiber2;
        }
      }

      if (shouldTrackSideEffects) {
        // Any existing children that weren't consumed above were deleted. We need
        // to add them to the deletion list.
        existingChildren.forEach(function (child) {
          return deleteChild(returnFiber, child);
        });
      }

      return resultingFirstChild;
    }
```

流程如图所示：

![image](/assets/img/react18/sourceCode/diff/diff4.png)

接下来我们来具体分析其中涉及的函数，以及第四种情况，这部分是如何标记移动，来优化后面的性能的。

#### updateSlot

```js
 function updateSlot(returnFiber, oldFiber, newChild, lanes) {
      // Update the fiber if the keys match, otherwise return null.
      // 如果键匹配则更新 Fiber，否则返回 null
      var key = oldFiber !== null ? oldFiber.key : null;
      if (typeof newChild === 'string' && newChild !== '' || typeof newChild === 'number') {
        // Text nodes don't have keys. If the previous node is implicitly keyed
        // we can continue to replace it without aborting even if it is not a text
        // node.
        // Todo: 优化手段 
        // 文本节点并没有键。如果前一个节点是隐式键控的
        // 我们也可以继续替换它而不会中止节点，即使它不是文本
        // 如果key 存在，就直接返回 null。
        if (key !== null) {
          return null;
        }
        return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
      }
      
      // Todo: 核心思想，key 相同就复用，否则返回 null
      if (typeof newChild === 'object' && newChild !== null) {
        switch (newChild.$$typeof) {
          case REACT_ELEMENT_TYPE:
            {
              if (newChild.key === key) {
                return updateElement(returnFiber, oldFiber, newChild, lanes);
              } else {
                return null;
              }
            }

          case REACT_PORTAL_TYPE:
            {
              if (newChild.key === key) {
                return updatePortal(returnFiber, oldFiber, newChild, lanes);
              } else {
                return null;
              }
            }

          case REACT_LAZY_TYPE:
            {
              var payload = newChild._payload;
              var init = newChild._init;
              return updateSlot(returnFiber, oldFiber, init(payload), lanes);
            }
        }
        
        // Todo: 如果子节点是数组的话
        if (isArray(newChild) || getIteratorFn(newChild)) {
          // oldFiber.key !== null，直接返回 null ？
          // Q: 怎么理解？
          if (key !== null) {
            // 第一种情况：如果 oldFiber.key，直接返回null，这意味，在数组的子元素，
            // 进行比较时，并不会再去比较子元素是否是数组，也就是说，不会跨层级比较
            return null;
          }
          // 不是的话，直接创建节点返回？
          // 第二种情况：子元素是数组，但是key不存在，调用 updateFragment 更新返回
          return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
        }

        throwOnInvalidObjectType(returnFiber, newChild);
      }

      {
        if (typeof newChild === 'function') {
          warnOnFunctionType(returnFiber);
        }
      }

      return null;
    }
```

`updateSlot()`是来判断 `oldFiber`与`newChild`是否可以复用，可以则返回`fiber`，否则返回`null`。针对不同的 `newChild`类型有不同的处理：

1.  如果 `newChild`是文本节点，如果`oldFiber.key`存在，直接返回`null`,即不可复用；否则调用`updateTextNode()`复用节点。
2.  如果 `newChild`是 `object`，这里有二种情况：
    1.  `newChild`是单一对象，`newChild.key === oldFiber.key`，可以复用；否则返回`null`
    2.  `newChild`是数组，如果`oldFiber.key`存在，直接返回`null`,即不可复用；否则调用`updateFragment()`更新返回。

> 这里 `newChild`是数组的情况，react不会继续向下比较，既不会跨层级比较，也是种性能优化手段。

#### 第一种情况

```js
var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);
```

由上述情况来看，`newFiber`可能是`null`或者是`fiber`。

1.  如果是 `null`，直接 `break`，跳出了第一轮循环；
2.  如果是`fiber`。

```js
if (newFiber === null) {
  if (oldFiber === null) {
    oldFiber = nextOldFiber;
  }
  // 如果没有找到可以服用的节点就跳出循环了，
  break;
}

// Tip: 最后一个可复用的节点索引
// 最后一个可复用的节点在 oldFiber 中的位置索引
// lastPlacedIndex，保证上次可以复用节点的次序

lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

if (previousNewFiber === null) {
  resultingFirstChild = newFiber;
} else {
  previousNewFiber.sibling = newFiber;
}

// 上一个新节点
previousNewFiber = newFiber;
oldFiber = nextOldFiber;
```

这里通过链表操作把 `newFiber`链接到`resultingFirstChild`上。`lastPlacedIndex`是记录上一个可以复用节点的位置。`placeChild`我们后面再介绍。

如果`newChildren`与`oldFiber`同时遍历完，则直接返回`resultingFirstChild`。

#### 第二种情况

```js
if (newIdx === newChildren.length) {
    // We've reached the end of the new children. We can delete the rest.
    deleteRemainingChildren(returnFiber, oldFiber);

    if (getIsHydrating()) {
      var numberOfForks = newIdx;
      pushTreeFork(returnFiber, numberOfForks);
    }

    return resultingFirstChild;
  }
```

先判断 `newChildren` 是否遍历完。如果遍历完，则标记删除 `oldFiber` 中剩余节点，将 `resultingFirstChild`作为头结点返回。

#### 第三种情况

```js
if (oldFiber === null) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be insertions.
    for (; newIdx < newChildren.length; newIdx++) {
      var _newFiber = createChild(returnFiber, newChildren[newIdx], lanes);

      if (_newFiber === null) {
        continue;
      }
      // 记录
      lastPlacedIndex = placeChild(_newFiber, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = _newFiber;
      } else {
        previousNewFiber.sibling = _newFiber;
      }

      previousNewFiber = _newFiber;
    }

    if (getIsHydrating()) {
      var _numberOfForks = newIdx;
      pushTreeFork(returnFiber, _numberOfForks);
    }

    return resultingFirstChild;
  } 
```

如果`oldFiber === null`，即`oldFiber`遍历完；接下来遍历`newChildren`，通过`createChild`生成新的`fiber`，插入 `resultingFirstChild`链表中，将 `resultingFirstChild`作为头结点返回。

#### 第四种情况

```js
var existingChildren = mapRemainingChildren(returnFiber, oldFiber);
  // console.log('existingChildren', existingChildren)

  // Keep scanning and use the map to restore deleted items as moves.
  // newChildren 和 oldFiber 都没有遍历完的情况
  for (; newIdx < newChildren.length; newIdx++) {
    var _newFiber2 = updateFromMap(existingChildren, returnFiber, newIdx, newChildren[newIdx], lanes);

    if (_newFiber2 !== null) {
      if (shouldTrackSideEffects) {

        if (_newFiber2.alternate !== null) {
          // The new fiber is a work in progress, but if there exists a
          // current, that means that we reused the fiber. We need to delete
          // it from the child list so that we don't add it to the deletion
          // list.

          // 新的 Fiber 正在进行中，但是如果存在目前，这意味着我们重复使用了 fiber。
          // 我们需要删除将其从子列表中删除，这样我们就不会将其添加到删除中列表。（优化性能）

          existingChildren.delete(_newFiber2.key === null ? newIdx : _newFiber2.key);
        }
      }

      lastPlacedIndex = placeChild(_newFiber2, lastPlacedIndex, newIdx);

      if (previousNewFiber === null) {
        resultingFirstChild = _newFiber2;
      } else {
        previousNewFiber.sibling = _newFiber2;
      }

      previousNewFiber = _newFiber2;
    }
  }
```

##### mapRemainingChildren

```js
function mapRemainingChildren(returnFiber, currentFirstChild) {
  // 如果 key 不存在的话，则使用 index，作为 key
  // Add the remaining children to a temporary map so that we can find them by
  // keys quickly. Implicit (null) keys get added to this set with their index
  // instead.
  var existingChildren = new Map();
  var existingChild = currentFirstChild;

  while (existingChild !== null) {
    if (existingChild.key !== null) {
      existingChildren.set(existingChild.key, existingChild);
    } else {
      existingChildren.set(existingChild.index, existingChild);
    }
    existingChild = existingChild.sibling;
  }
  return existingChildren;
}
```

`mapRemainingChildren()`方法将剩余的`fiber`，`oldFiber` 存入以`oldFiber.key`为`key`，`oldFiber`为`value`的`Map`中。
然后遍历 `newChildren`，从`existingChildren`中寻找可以复用的节点。

现在我们来重点关注一下`placeChild()`是在做什么。

##### placeChild

```js
 function placeChild(newFiber, lastPlacedIndex, newIndex) {
      newFiber.index = newIndex;
      if (!shouldTrackSideEffects) {
        // During hydration, the useId algorithm needs to know which fibers are
        // part of a list of children (arrays, iterators).
        newFiber.flags |= Forked;
        return lastPlacedIndex;
      }
      var current = newFiber.alternate;
      if (current !== null) {
        var oldIndex = current.index;

        // 这表明这个节点移动了
        if (oldIndex < lastPlacedIndex) {
          // This is a move.
          newFiber.flags |= Placement;
          return lastPlacedIndex;
        } else {
          // This item can stay in place.
          return oldIndex;
        }
      } else {
        // This is an insertion.
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      }
    }
```

通过比较`oldIndex`与`lastPlacedIndex`大小，然后给`newFiber.flags`打标，这样可以尽可能复用节点(`Dom节点`)，减少`commit`阶段的相关操作。不明白的同学看看下面的例子或者自己调试一下：

##### Demo1

```js
// 之前
abcd

// 之后
acdb

===第一轮遍历开始===
a（之后）vs a（之前）  
key不变，可复用
此时 a 对应的oldFiber（之前的a）在之前的数组（abcd）中索引为0
所以 lastPlacedIndex = 0;

继续第一轮遍历...

c（之后）vs b（之前）  
key改变，不能复用，跳出第一轮遍历
此时 lastPlacedIndex === 0;
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === cdb，没用完，不需要执行删除旧节点
oldFiber === bcd，没用完，不需要执行插入新节点

将剩余oldFiber（bcd）保存为map

// 当前oldFiber：bcd
// 当前newChildren：cdb

继续遍历剩余newChildren

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index;
此时 oldIndex === 2;  // 之前节点为 abcd，所以c.index === 2
比较 oldIndex 与 lastPlacedIndex;

如果 oldIndex >= lastPlacedIndex 代表该可复用节点不需要移动
并将 lastPlacedIndex = oldIndex;
如果 oldIndex < lastplacedIndex 该可复用节点之前插入的位置索引小于这次更新需要插入的位置索引，代表该节点需要向右移动

在例子中，oldIndex 2 > lastPlacedIndex 0，
则 lastPlacedIndex = 2;
c节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：bd
// 当前newChildren：db

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
oldIndex 3 > lastPlacedIndex 2 // 之前节点为 abcd，所以d.index === 3
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：b
// 当前newChildren：b

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index;
oldIndex 1 < lastPlacedIndex 3 // 之前节点为 abcd，所以b.index === 1
则 b节点需要向右移动
===第二轮遍历结束===

最终acd 3个节点都没有移动，b节点被标记为移动
```

##### Demo2

```js
// 之前
abcd

// 之后
dabc

===第一轮遍历开始===
d（之后）vs a（之前）  
key改变，不能复用，跳出遍历
===第一轮遍历结束===

===第二轮遍历开始===
newChildren === dabc，没用完，不需要执行删除旧节点
oldFiber === abcd，没用完，不需要执行插入新节点

将剩余oldFiber（abcd）保存为map

继续遍历剩余newChildren

// 当前oldFiber：abcd
// 当前newChildren dabc

key === d 在 oldFiber中存在
const oldIndex = d（之前）.index;
此时 oldIndex === 3; // 之前节点为 abcd，所以d.index === 3
比较 oldIndex 与 lastPlacedIndex;
oldIndex 3 > lastPlacedIndex 0
则 lastPlacedIndex = 3;
d节点位置不变

继续遍历剩余newChildren

// 当前oldFiber：abc
// 当前newChildren abc

key === a 在 oldFiber中存在
const oldIndex = a（之前）.index; // 之前节点为 abcd，所以a.index === 0
此时 oldIndex === 0;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 0 < lastPlacedIndex 3
则 a节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：bc
// 当前newChildren bc

key === b 在 oldFiber中存在
const oldIndex = b（之前）.index; // 之前节点为 abcd，所以b.index === 1
此时 oldIndex === 1;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 1 < lastPlacedIndex 3
则 b节点需要向右移动

继续遍历剩余newChildren

// 当前oldFiber：c
// 当前newChildren c

key === c 在 oldFiber中存在
const oldIndex = c（之前）.index; // 之前节点为 abcd，所以c.index === 2
此时 oldIndex === 2;
比较 oldIndex 与 lastPlacedIndex;
oldIndex 2 < lastPlacedIndex 3
则 c节点需要向右移动

===第二轮遍历结束===

```

## 总结

1.  `react diff`算法，面对处理的场景与 `vue diff`不同，前者是单向链表与数组的比较，后者是两个数组的比较，这导致两者在算法的选择上有所不同。

2.  `react diff`在算法的设计上尽可能去优化流程，比如：将最优的场景向前排；不会跨层级去比较；复用的核心逻辑判断是 `key与type都相同`，否则就会去创建节点。

3.  `react diff`算法，并不会最优解，对比与 `vue diff`的双端索引来说，如果要使用双端索引算法，那子节点上必须要有可以返回的指针。

4.  `react diff`算法，目前的这种方式其实也是`fiber结构`带来的副作用，比如它要实现`beginWork`和`completeWork`这样协作的流程。

5.  最后的`demo`取自卡颂老师，受 `react diff`思想影响，学会了`复用`...

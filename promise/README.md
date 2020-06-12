


# doResolve
- 判断是不是new
- 判断fn是不是函数
- 初始化状态 队列状态 终止 队列
- fn空函数返回
- 执行fn


# resolve
- 定义执行状态 done
- 执行fn
- 过一会会执行fn传进来的resolve（用户执行）


# 用户执行resolve
- 值不能是自己
- 值是thenable

# 值是普通的值
- 更改状态为1
- 更改终值为当前值
- finale 等待then 别的都可以了


# 值是thenable
## 值是promise
- 状态变为3 
- 当前的promise的终值设为这个新值（新值也是个promise）
- finale 等待then 别的都可以了

## 值是对象但是有then方法 执行以下就可以了
- doResolve(newValue.then, 当前的promise)
- 执行完了 掉当前的promise的resolve 
- 这样就能保证 下一个then获取的事
- 此处进入循环 只要存在没处理完成的值 就继续resolve 直到 finale


# .then 环节

- 安全的then
- 定义promise
- handle（onFulfilled, promise)
- 返回promise 用于链式调用

# handle

- 循环 状态等于3 表示resolve了一个promise 要将这个promise 优先进行处理
- 状态是0，表示该promise还没有执行完
- 判断是否加入promise的执行队列 如果没有则加入 非数组
- 如果队列存在则入队列



- 如果完成了 执行handleResolved
- 此处是一个异步
- 如果状态是1 但是不存在回调
- 空的then 状态是1的话  resolve上一个的结果


- 如果回调存在 直接执行  resolve执行的结果

# find-useless-file

### 该项目是为了找到项目文件下未使用的文件 仅供参考！！！

## Installation
```bash
    npm i -g find-useless-file
```

## Usage

> filePath1 为你需要检测无用文件的文件夹 filePath2为你检测的范围 目前都仅支持文件夹的方式

```bash
    # 找到 filePath1 中无用的文件
    find-useless-file find filePath1 filePath2

    # 删除 filePath1 无用的文件
    find-useless-file del
```

## 说明

**使用 find-useless-file find filePath1 filePath2 和 find-useless-file del 删除了无用的组件后, 再次执行 find-useless-file find filePath1 filePath2 发现还有未删除的文件，可能是正常情况**

举个例子：

`filePath1/index.js` 引入了 `filePath1/comp.js` 文件

`filePath2` 中并没有引入 `filePath1/index.js` 文件 所以删除了 `filePath1/index.js`  🎉 🎉 🎉

此时 `filePath1/comp.js` 也属于无用文件了

你可能需要再次执行 `find-useless-file find filePath1 filePath2` 命令，直到没有无用文件为止 🤔 🤔 🤔



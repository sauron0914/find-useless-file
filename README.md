# find-useless-file
### `use npx`

```bash
    $ npx find-useless-file start file-path1 file-path2
```
## 说明

- 现在已经支持一次就能深层次遍历出未被引用的文件了

例子： 只有`selectA.js` 引入了 `selectA.less`, 但是 `selectA.js` 是个没有被其他任何文件引用过，所以 `selectA.js` 和 `selectA.less` 都是无用文件，不再需要二次执行命令啦

- 如果你被检测的文件是src/ 文件，那 src/index.js src/index.ts src/global.d.ts 即使没有被其他文件引用，也不会被检测出来

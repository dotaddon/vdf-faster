# dota-js-kv

#### 介绍
nodejs的依赖，用于在`js的object`和`valve 的KV键值对字符串`之间转换。


#### 安装教程

```bash
npm install dota-js-kv
```


#### 使用说明

```ts
const jskv = require('dota-js-kv');
// 转为kv
jskv.encode(object,compact)

// 转为object
jskv.decode(fs.readFileSync(file, 'utf-8'))
```

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request

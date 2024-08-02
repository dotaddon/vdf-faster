# vdf-parser2

#### 介绍
nodejs的依赖，用于在`js的object`和`valve 的KV键值对字符串`之间转换。


#### 安装教程

```bash
npm install dota-js-kv
```


#### 使用说明

```ts
import vdf from 'vdf-parser2';
// 转为kv
vdf.encode(object, compact)

// 转为object
vdf.decode(fs.readFileSync(file, 'utf-8'))
```

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 同类库对比
 - vdf-extra 无法解析超长文件
 - vdf-parser 无法解析 #base
 - vdf-reader #base作为key，重复的会覆盖
 - kvparser 无法解析 #base
 - vdfjs 忽略掉了#base
 - fast-vdf 忽略掉了#base
 - vdfplus #base 被视为了注释？
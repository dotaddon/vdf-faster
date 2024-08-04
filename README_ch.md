# vdf-faster

#### 介绍
nodejs的依赖，用于在`js的object`和`valve 的KV键值对字符串`之间转换。


#### 安装教程

```bash
npm install dota-js-kv
```


#### 使用说明

```ts
import vdf from 'vdf-faster';
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

 | npm | 测试parse速度 | 存在问题 |
 | ---| ---|---|
 | fast-vdf | 13.438ms | 忽略掉了#base
 | this | 19.054ms |
 | kvparser | 34.062ms | #base报错
 | vdf-reader | 39.303ms | #base作为key，重复的会覆盖
 | vdf-parser | 42.146ms | #base报错
 | vdf-extra |  50.318ms | 无法解析超长文件
 | vdfjs |  87.78ms | 忽略掉了#base

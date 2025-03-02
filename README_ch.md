# vdf-faster

#### 介绍
nodejs的依赖，用于在`js的object`和`valve 的KV键值对字符串`之间转换。


#### 安装教程

```bash
npm install vdf-faster
```


#### 使用说明

```ts
import * as vdf from 'vdf-faster';
// 转为vdfer
vdf.encode(object)

// 转为object
vdf.decode(fs.readFileSync(file, 'utf-8'))
```

#### API使用说明

##### 创建实例
```ts

import { vdfParser } from 'vdf-faster';
// 创建实例时可以配置选项
const vdfer = new vdfParser({
    keepStringValue: true, // 是否保持value为字符串类型
    compact: false // 是否使用紧凑模式输出
});

// 使用字符串初始化
vdfer.init(vdfString);

// 或使用对象初始化
vdfer.init(jsonObject);
```

##### 获取#base引用
```ts
// 获取所有的#base引用路径
const baseList = vdfer.getBase();
```

##### 获取数据结构
```ts
// 获取所有一级键名列表
const keys = vdfer.getTree();

// 获取指定键的JSON数据
const jsonData = vdfer.getDataJson("keyName");

// 获取指定键的VDF字符串
const vdfString = vdfer.getDataCode("keyName");

// 获取完整的JSON数据
const allJson = vdfer.getAllJSON();

// 获取完整的VDF字符串
const allVdf = vdfer.getAllCode();
```

##### 添加或更新数据
```ts
// 添加JSON数据
vdfer.addData("newKey", { value: "test" });

// 添加VDF字符串
vdfer.addData("newKey", '"value" "test"');
```

##### 数据拆分
```ts
// 将数据拆分成多个部分，每个部分最多包含50个元素
const parts = vdfer.depart(50);
```

#### 高级用法

##### 链式调用
```ts
// 支持链式调用
const result = new vdfParser()
    .init(vdfString)
    .addData("key1", { value: "test1" })
    .addData("key2", { value: "test2" })
    .getAllJSON();
```

##### 性能优化
- 使用`getDataJson`和`getDataCode`方法时会缓存结果，重复调用不会重新解析
- 使用`compact`选项可以生成更紧凑的VDF字符串
- 大文件处理时建议使用`getTree`获取需要的键，然后按需获取数据
- 对于超大文件，可以使用`depart`方法将数据拆分成多个小块处理


#### 同类库对比

 | npm | 测试parse速度 | 存在问题 |
 | ---| ---|---|
 | fast-vdf | 13.438ms | 忽略掉了#base
 | this | 19.054ms |
 | vdferparser | 34.062ms | #base报错
 | vdf-reader | 39.303ms | #base作为key，重复的会覆盖
 | vdf-parser | 42.146ms | #base报错
 | vdf-extra |  50.318ms | 无法解析超长文件
 | vdfjs |  87.78ms | 忽略掉了#base
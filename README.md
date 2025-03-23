# vdf-faster

#### Description | 介绍

A NodeJS dependency for converting between `JS objects` and `Valve's KV key-value string format`.

nodejs的依赖，用于在`js的object`和`valve 的KV键值对字符串`之间转换。

#### Installation | 安装教程

```bash
npm install vdf-faster
```

#### Basic Usage | 使用说明

```ts
import * as vdf from 'vdf-faster';
// Convert to KV format | 转为vdfer
vdf.encode(object)

// Convert to object | 转为object
vdf.decode(fs.readFileSync(file, 'utf-8'))
```

#### API Documentation | API使用说明

##### Creating an Instance | 创建实例
```ts
import { vdfParser } from 'vdf-faster';
// Create an instance with options | 创建实例时可以配置选项
const vdfer = new vdfParser({
    keepStringValue: true, // Keep value as string type | 是否保持value为字符串类型
    compact: false // Use compact mode for output | 是否使用紧凑模式输出
});

// Initialize with a string | 使用字符串初始化
vdfer.init(vdfString);

// Or initialize with an object | 或使用对象初始化
vdfer.init(jsonObject);
```

##### Getting #base References | 获取#base引用
```ts
// Get all #base reference paths | 获取所有的#base引用路径
const baseList = vdfer.getBase();
```

##### Getting Data Structures | 获取数据结构
```ts
// Get list of all top-level keys | 获取所有一级键名列表
const keys = vdfer.getTree();

// Get JSON data for a specific key | 获取指定键的JSON数据
const jsonData = vdfer.getDataJson("keyName");

// Get VDF string for a specific key | 获取指定键的VDF字符串
const vdfString = vdfer.getDataCode("keyName");

// Get complete JSON data | 获取完整的JSON数据
const allJson = vdfer.getAllJSON();

// Get complete VDF string | 获取完整的VDF字符串
const allVdf = vdfer.getAllCode();
```

##### Adding or Updating Data | 添加或更新数据
```ts
// Add JSON data | 添加JSON数据
vdfer.addData("newKey", { value: "test" });

// Add VDF string | 添加VDF字符串
vdfer.addData("newKey", '"value" "test"');
```

##### Data Partitioning | 数据拆分
```ts
// Split data into multiple parts, each containing up to 50 elements
// 将数据拆分成多个部分，每个部分最多包含50个元素
const parts = vdfer.depart(50);
```

#### Advanced Usage | 高级用法

##### Method Chaining | 链式调用
```ts
// Support for method chaining | 支持链式调用
const result = new vdfParser()
    .init(vdfString)
    .addData("key1", { value: "test1" })
    .addData("key2", { value: "test2" })
    .getAllJSON();
```

##### Performance Optimization | 性能优化

- Results are cached when using `getDataJson` and `getDataCode` methods, avoiding repeated parsing
- Use the `compact` option to generate more compact VDF strings
- For large files, it's recommended to use `getTree` to get required keys and fetch data as needed
- For extremely large files, use the `depart` method to split data into smaller chunks

- 使用`getDataJson`和`getDataCode`方法时会缓存结果，重复调用不会重新解析
- 使用`compact`选项可以生成更紧凑的VDF字符串
- 大文件处理时建议使用`getTree`获取需要的键，然后按需获取数据
- 对于超大文件，可以使用`depart`方法将数据拆分成多个小块处理

#### Library Comparison | 同类库对比

 | npm | Parse Speed Test | Issues | 测试parse速度 | 存在问题 |
 | ---| ---|---| --- | --- |
 | fast-vdf | 13.438ms | Ignores #base | 13.438ms | 忽略掉了#base |
 | this | 19.054ms | - | 19.054ms | - |
 | vdferparser/kvparser | 34.062ms | #base error | 34.062ms | #base报错 |
 | vdf-reader | 39.303ms | #base as key, duplicates overwritten | 39.303ms | #base作为key，重复的会覆盖 |
 | vdf-parser | 42.146ms | #base error | 42.146ms | #base报错 |
 | vdf-extra | 50.318ms | Cannot parse very long files | 50.318ms | 无法解析超长文件 |
 | vdfjs | 87.78ms | Ignores #base | 87.78ms | 忽略掉了#base |
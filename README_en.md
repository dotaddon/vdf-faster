# vdf-faster

#### Description

A NodeJS dependency for converting between `JS objects` and `Valve's KV key-value string format`.

#### Installation

```bash
npm install vdf-faster
```

#### Basic Usage

```ts
import * as vdf from 'vdf-faster';
// Convert to KV format
vdf.encode(object)

// Convert to object
vdf.decode(fs.readFileSync(file, 'utf-8'))
```

#### API Documentation

##### Creating an Instance
```ts

import { vdfParser } from 'vdf-faster';
// Create an instance with options
const vdfer = new vdfParser({
    keepStringValue: true, // Keep value as string type
    compact: false // Use compact mode for output
});

// Initialize with a string
vdfer.init(vdfString);

// Or initialize with an object
vdfer.init(jsonObject);
```

##### Getting #base References
```ts
// Get all #base reference paths
const baseList = vdfer.getBase();
```

##### Getting Data Structures
```ts
// Get list of all top-level keys
const keys = vdfer.getTree();

// Get JSON data for a specific key
const jsonData = vdfer.getDataJson("keyName");

// Get VDF string for a specific key
const vdfString = vdfer.getDataCode("keyName");

// Get complete JSON data
const allJson = vdfer.getAllJSON();

// Get complete VDF string
const allVdf = vdfer.getAllCode();
```

##### Adding or Updating Data
```ts
// Add JSON data
vdfer.addData("newKey", { value: "test" });

// Add VDF string
vdfer.addData("newKey", '"value" "test"');
```

##### Data Partitioning
```ts
// Split data into multiple parts, each containing up to 50 elements
const parts = vdfer.depart(50);
```

#### Advanced Usage

##### Method Chaining
```ts
// Support for method chaining
const result = new vdfParser()
    .init(vdfString)
    .addData("key1", { value: "test1" })
    .addData("key2", { value: "test2" })
    .getAllJSON();
```

##### Performance Optimization
- Results are cached when using `getDataJson` and `getDataCode` methods, avoiding repeated parsing
- Use the `compact` option to generate more compact VDF strings
- For large files, it's recommended to use `getTree` to get required keys and fetch data as needed
- For extremely large files, use the `depart` method to split data into smaller chunks

#### Library Comparison

 | npm | Parse Speed Test | Issues |
 | ---| ---|---|
 | fast-vdf | 13.438ms | Ignores #base
 | this | 19.054ms |
 | kvparser | 34.062ms | #base error
 | vdf-reader | 39.303ms | #base as key, duplicates overwritten
 | vdf-parser | 42.146ms | #base error
 | vdf-extra | 50.318ms | Cannot parse very long files
 | vdfjs | 87.78ms | Ignores #base

# dota-js-kv

#### Description
a tools for turn to json to dota2's kv file.

Valve's KeyValues Text File Format serialization library


#### Installation

```bash
npm install dota-js-kv
```


#### Instructions

```ts
const jskv = require('dota-js-kv');
// turn to kv
jskv.encode(object,compact)

//turn to object
jskv.decode(fs.readFileSync(file, 'utf-8'))
```

#### Contribution

1.  Fork the repository
2.  Create Feat_xxx branch
3.  Commit your code
4.  Create Pull Request

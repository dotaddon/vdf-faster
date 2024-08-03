import * as vdf from '../src'
import {readFileSync, writeFileSync} from 'fs'

const file = 'test/npc/unit.txt'
const data = readFileSync(file, 'utf8')
let result:any

console.time('decode')
result = vdf.decode(data)
console.timeEnd('decode')
writeFileSync('test/b.json', JSON.stringify(result,null,'  '), 'utf8')
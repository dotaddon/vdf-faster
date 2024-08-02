import * as vdf from '../src'
import {readFileSync, writeFileSync} from 'fs'

const file = 'npc/unit.txt'
const data = readFileSync(file, 'utf8')
let result:any

console.time('b')
result = vdf.decode(data)
console.timeEnd('b')
writeFileSync('npc/b.json', JSON.stringify(result,null,'  '), 'utf8')
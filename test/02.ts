import { basename } from 'path'
import * as vdf from '../src'
import {readFileSync, writeFileSync} from 'fs'

const file = 'test/npc/unit.txt'
const data = readFileSync(file, 'utf8')


console.time('decode')
let result = vdf.decode(data)
result.baseList.forEach(e=>{
    let filed = file.replace(basename(file), e)
    let _re = vdf.decode(readFileSync(filed, 'utf8'))
    result.root = {
        ...result.root,
        ..._re.root
    }
    
})
console.timeEnd('decode')

writeFileSync('test/b.json', JSON.stringify(result,null,'  '), 'utf8')

// console.time('debase')
// let result2 = vdf.debase(data)
// console.timeEnd('debase')


// writeFileSync('test/a.json', JSON.stringify(result2,null,'  '), 'utf8')
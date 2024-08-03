import { basename } from 'path'
import * as vdf from '../src'
import {readFileSync, writeFileSync} from 'fs'

const file = 'test/npc/npc_units_custom.txt'
const data = readFileSync(file, 'utf8')


console.time('decode')
let result = vdf.decode(data)
result.base.forEach(e=>{
    let filed = file.replace(basename(file), e)
    let _re = vdf.decode(readFileSync(filed, 'utf8'))
    result.data = {
        ...result.data,
        ..._re.data
    }
    
})
console.timeEnd('decode')

writeFileSync('test/b.json', JSON.stringify(result,null,'  '), 'utf8')

// console.time('encode')
// let root = vdf.depart(result.data.DOTAUnits, 190)
//     .map((e,i)=>{
//         let name = `unit_${i}.txt`
//         writeFileSync('test/npc/'+name, vdf.encode(e),'utf-8')
//         return `#base "${name}"`
//     })
//     .join('\n')

// writeFileSync('test/npc/root.txt', root,'utf-8')

// console.timeEnd('encode')



// console.time('debase')
// let result2 = vdf.debase(data)
// console.timeEnd('debase')


// writeFileSync('test/a.json', JSON.stringify(result2,null,'  '), 'utf8')
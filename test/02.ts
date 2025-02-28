import { basename } from 'path'
import * as vdf from '../src'
import { readFileSync, writeFileSync } from 'fs'
import { vdfer } from '../src/vdfer'

const file = 'test/npc/npc_units_custom.txt'
// const file = 'test/npc/unit.txt'
// const file = 'test/npc/npc_heros_custom.txt'
const source = readFileSync(file, 'utf8')



console.time('decode')
let result = vdf.decode(source)
// result.base.forEach(e=>{
//     let filed = file.replace(basename(file), e)
//     let _re = vdf.decode(readFileSync(filed, 'utf8'))
//     result.data = {
//         ...result.data,
//         ..._re.data
//     }
    
// })
let key = Object.keys(result.data)[0]
console.log(key)
console.table(Object.keys(result.data[key]))
console.timeEnd('decode')


console.time('base')

let ent = new vdfer().init(source)
// let ent = new vdfer().init(result.data[Object.keys(result.data)[0]])
let base = ent.getBase()

console.log(base)
console.timeEnd('base')


console.time('keys')
let keys = ent.getTree()

console.table(keys)
console.timeEnd('keys')

console.time('data')
console.log(keys[0])
let data = ent.getDataJson(keys[0])

console.log(data)
console.timeEnd('data')

// let a =vdfer.depart(50)
// console.log(a)
// writeFileSync('test/b.json', JSON.stringify(result,null,'  '), 'utf8')

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
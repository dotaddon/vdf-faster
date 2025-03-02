import { vdfDecoder } from './lib/decode';
export { vdfDecoder } from './lib/decode';
import { encode as en }from './lib/encode'
export { vdfParser } from './vdfer';

/** 将valve data format的kv转为json对象
 * @param code 转义对象
 * @param keepStringValue value的类型保持string。false将把bool和数字转化为对应类型
 * @returns 
 */
export function decode(code:string, keepStringValue?:boolean):{
    /** 输出的文本 */
    data:Record<string, object>
    /** 依赖的文件名 */
    base:string[]
} {
    'use strict';
    var decoder = new vdfDecoder(keepStringValue)
        .source(code)
        .parse()
        .onFinish();
    return {
        data: decoder.getAllJson(),
        base: decoder.getBase()
    };
};

/**
 * 将json对象转为valve data format的kv
 * @param obj 转义对象
 * @param compact 是否换行
 * @returns 
 */
export function encode(obj:any, compact?:boolean ){
    'use strict';
    let depth = compact ? -1 : 0;
    return en( obj, depth)
}

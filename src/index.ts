import { parse, vdfDecoder } from './lib/decode';

export function decode(code:string) {
    'use strict';
    var decoder = new vdfDecoder();

    parse(code, decoder);
    return decoder;
};

var vdf = require('./lib/encode');

/**
 * 将数组或obj对象转为valve的KV的字符串
 * 
 * obj:转义对象
 * 
 * compact:是否换行
 */
export function encode(obj:object, compact:boolean ){
    'use strict';
    let depth = (compact)? -1 : 0;
    return vdf.encode( obj, depth)
}

var BASETH = require('./lib/baseth');

/**
 * 导出文件中 用 #base 导入其他文件的列表
 * 
 * 返回数组
 */
export function baseth(code ){
    'use strict';
    return BASETH.baseth( code)
}

var DEBASE = require('./lib/debase');

/**
 * 转义 字符串 转为 数组
 */ 
export function debase(code:string) {
    'use strict';
    return DEBASE.debase(code)[0];
};
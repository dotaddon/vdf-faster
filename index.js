exports.encode = encode;
exports.decode = decode;
exports.baseth = baseth;

var {decode} = require('./lib/decode');

/**
 * 转义 字符串 转为 数组
 */ 
function decode(code) {
    'use strict';
    return decode(code)[0];
};

var {encode} = require('./lib/encode');

/**
 * 将数组或obj对象转为valve的KV的字符串
 * 
 * obj:转义对象
 * 
 * compact:是否换行
 */
function encode(obj, compact ){
    'use strict';
    let depth = (compact)? -1 : 0;
    return encode( obj, depth)
}

var {baseth} = require('./lib/baseth');

/**
 * 导出文件中 用 #base 导入其他文件的列表
 * 
 * 返回数组
 */
function baseth(code ){
    'use strict';
    return baseth( code)
}

exports.default = { encode: encode, decode: decode, baseth: baseth };
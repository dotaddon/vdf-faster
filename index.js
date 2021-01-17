exports.encode = encode;
exports.decode = decode;

var {parse,KeyValueDecoder} = require('./lib/decode');

function decode(code) {
    'use strict';
    var decoder = new KeyValueDecoder();

    parse(code, decoder);
    return decoder.root;
};

var {encode_o,encode_KV} = require('./lib/encode');

function encode(obj, compact ,child){
    'use strict';
    let Newline = (compact)? " " : "\n"
	var str = "";
	if  (child){
		for(var i in obj) {
			if(obj[i].constructor == Function) continue;
			str = `"${i}" {\n`;
			for (let j in obj[i]){
				str += '\t'+ encode_KV(j, obj[i][j], 0, false, Newline, "")+`\n`
			}
			str += '}\n';
		}
		return str
    }

    return encode_o(obj, 0, compact, Newline)
}

exports.default = { encode: encode, decode: decode };
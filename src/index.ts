import {parse, vdfDecoder } from './lib/decode';

export function decode(code:string) {
    'use strict';
    var decoder = new vdfDecoder();

    parse(code, decoder);
    return decoder;
};

import {encode_o,encode_KV} from './lib/encode';

export function encode(obj:object, compact:boolean ,child:boolean){
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
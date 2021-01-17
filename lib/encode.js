const { isStringKeyword, isCharSimple } = require('./util');

function encode_o(obj, depth, compact, Newline){
    'use strict';
	var str = "";
	var ch = "";//最后一个字符检测
	var dp = ms('\t', compact?1:depth-1);
	for(var i in obj) {
		if(obj[i].constructor == Function) continue;
		str += encode_KV(i, obj[i], depth, compact, Newline, ch);
		ch = compact? str.charAt(str.length - 1) : ch ;
	}
    return str+Newline+dp;
}

function encode_a(arr, depth, compact, Newline){
    'use strict';
	var str = "";
	var dp = ms('\t', compact?1:depth-1);
	for(var i = 0; i < arr.length;++i) {
        str += (i === 0 ? '' : ' ') + GetValue(arr[i], depth, compact, Newline)+Newline;
	}
	return str+Newline+dp
}

function encode_KV(key, value, depth, compact, Newline, ch){
    'use strict';
	var dp = ms('\t', compact?1:depth);
    var str =(!compact&&isCharSimple(ch))? ' ':'';
    var key1 = (compact&&isSimple(key))? key : `"${key}"`
	return str+dp+key1+' '+GetValue(value, depth, compact, Newline)+Newline
}


function GetValue(value, depth, compact, Newline){
    'use strict';
    var type = value.constructor;
    if(value === null
    || value === undefined
    || type  === Boolean )
        //isObjectKeyword
        return keywordToString(value);
    if(type === String ){
        //supported
        var tmp = String(value).replace(/"/gm, '\\"');
        if (compact&&isSimple(tmp)){
            return tmp;
        }else {
            return '"'+tmp+'"';
        }
    }
    if(type === Number ) {
        if (compact) {
            return Number(value).toString(10);
        } else {
            return value;
        }
    }
    if(type === Array)
    return `[${Newline+encode_a(value, depth+1, compact, Newline)}]`;

    return `{${Newline+encode_o(value, depth+1, compact, Newline)}}`;
}


function ms(str, times) {
    'use strict';
    var r = '', i = 0;
    for (i; i < times; i += 1) {
        r += str;
    }
    return r;
}

function isSimple(key) {
    'use strict';

    var i = 0, ch;

    if ((key.length === 0) || (isStringKeyword(key))) {
        return false;
    }

    for (i; i < key.length; i += 1) {
        ch = key.charAt(i);
        switch (ch) {
        case ' ':
        case '\t':
        case '\n':
        case '\r':
        case '[':
        case ']':
        case '{':
        case '}':
        case '"':
        case '\'':
        case '\\':
            return false;
        }
    }

    return true;
}

function supported(obj) {
    'use strict';
    if ((obj.constructor === String) || (obj.constructor === Number)) {
        return true;
    }
    return false;
}

function keywordToString(obj) {
    'use strict';
    return String(obj);
}


module.exports = {encode_o,encode_KV};
function encode_o(obj:object, depth:number){
    'use strict';
	var str = "";
	var dp = ms('\t', depth);
    let newLine = depth==-1? ' ' : '\n' ;
	for(var i in obj) {
		if(obj[i].constructor == Function)
            continue;
        str += dp + `"${i}" ` + encode( obj[i], depth) +newLine;
	}
    return str+newLine+ms('\t', depth-1);
}

function encode_a(arr:Array<any>, depth:number){
    'use strict';
	var str = "";
	var dp = ms('\t', depth-1);
    let newLine = depth==-1? ' ' : '\n' ;
	for(var i = 0; i < arr.length;++i) {
        str += (i === 0 ? '' : ' ') + (i %2===0 ? newLine : '') + dp + encode( arr[i], depth);
	}
	return str+newLine+dp
}

export function encode(value, depth){
    'use strict';
    depth += depth==-1? 0 : 1 ;
    let newLine = depth==-1? ' ' : '\n' ;
    var type = value.constructor;
    if(value === null
    || value === undefined
    ||  type === Boolean)
        //isObjectKeyword
        return `"${String(value)}"`;

    if( type === String )
        //supported
        return `"${String(value).replace(/"/gm, '\\"')}"`;

    if( type === Number )
        return `"${Number(value).toString(10)}"`;

    if( type === Array  )
        return `{${newLine+encode_a(value, depth)}}`;

    return `{${newLine+encode_o(value, depth)}}`;
}


function ms(str, times) {
    'use strict';
    var r = '', i = 0;
    for (i; i < times; i ++) {
        r += str;
    }
    return r;
}

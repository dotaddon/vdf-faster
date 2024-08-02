/**
 * 吧f替换成e
 * 创建正则RegExp对象   
 */ 
String.prototype.replaceAll=function(f,e){
    return this.replace(new RegExp(f,"g"),e);
}
// 

/**
 * 清除行尾注释 //
 * 清除引入包 #base
 */ 
String.prototype.clearMsg=function(str){
    let com_place = this.indexOf(str) ;
    return this.substr( 0, com_place == -1 ?this.length: com_place )
}

/**
 * 分离子数组
 */ 
String.prototype.str2arr=function(){
    let arr = [];
    let depth = 0;
    this.split('{')
        .forEach(elea => {
            depth += 1;
            let arrb = arr;
            for(let i = 0; i<depth - 1; i++){
                arrb = arrb[arrb.length - 1]
            }
            arrb.push([])

            elea.split('}')
                .forEach((eleb,i) => {
                    if(i!=0){
                        depth -= 1;
                    }

                    let arrd = arr;
                    for(let i = 0; i<depth; i++){
                        arrd = arrd[arrd.length - 1]
                    }

                    eleb.split('"')
                        .forEach(elec => {
                            if (elec.match('[a-zA-Z0-9]')){
                                arrd.push(elec)
                            }
                        })
                })
        })
    return arr
}

function debase(strg) {
    
    let newStr = '';
        // 换行符 \n 分割为字符串数组
    strg.split('\n')
        .forEach(ele => 
            /*  replace('#base\s\w*.*\s','')
                这里正则替换失效了
            */ 
            newStr += ele.clearMsg('#base')
                        .clearMsg('//')
        )
    return newStr.str2arr()
}

module.exports  = { debase };
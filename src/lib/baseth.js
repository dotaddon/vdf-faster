function baseth(str) {
    
}
function baseth(strg) {
    
    let newArr = [];
        // 换行符 \n 分割为字符串数组
    strg.split('\n')
        .forEach(ele => {
            /*  replace('#base\s\w*.*\s','')
                这里正则替换失效了
            */ 
            if(ele.indexOf('#base')>=0){
                
                newArr.push(
                    ele.substr( 5, ele.length )
                        .replace(" ",''))
            }

        })
    return newArr
}

module.exports  = { baseth };
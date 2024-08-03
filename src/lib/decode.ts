import { isBoolText, isCharSimple } from './util';


const enum BracketType {
    花括号 = 0,
    方括号 = 1,
}
declare type BlockInfo = {
    key:string
} & ({
    element:Record<string,any>
    type:BracketType.花括号
} | {
    element:any[]
    type:BracketType.方括号
}

)

export class vdfDecoder {
    /** 括号块的堆栈 */
    private depth: BlockInfo[]
    /** 当前修改的括号块 */
    private block: BlockInfo
    private key: string | null
    constructor(
        /** value的类型保持string。false将把bool和数字转化为对应类型 */
        public strType:boolean = true,
        public root: any = {},
        public baseList: string[] = []
    ){
        this.block = {
            key:'root',
            element: root,
            type:BracketType.花括号
        };
        this.depth = [this.block];
    }
    /** 增加子目录 */
    onBase(path:string) {
        this.baseList.push(path)
    }

    /** 存入一个键 */
    onKey(key:string): boolean {
        if (this.key)
            return false;

        this.key = key
        return true
    }
    /** 写入值 */
    onValue(text:string) {
        let block = this.block
        let value = this.modify(text)

        switch (block.type) {
            case BracketType.花括号:
                if (this.key == null){
                    this.key = text
                } else if (this.key == '#base'){
                    this.onBase(text)
                    this.key = null;
                } else {
                    block.element[this.key] = value;
                    this.key = null
                }
                break;
            case BracketType.方括号:
                if (this.key){
                    block.element.push(this.modify(this.key));
                    this.key = null
                }
                block.element.push(value);
                break;
            default:
                break;
        }
    };
    modify(text:string){
        if (this.strType)
            return text

        if ( isNumberText(text) )
            return  Number(text)

        if ( isBoolText(text) )
            return BoolTextToBool(text)
    }

    /** 新进一个括号块 */
    onBlock(type:BracketType) {
        let key = this.key ?? '';
        this.key = null
        switch (type) {
            case BracketType.花括号:
                this.block = {
                    key,
                    element:{},
                    type
                }
                break;
            case BracketType.方括号:
                this.block = {
                    key,
                    element:[],
                    type
                }
                break;
            default:
                throw new Error('Unknown block type: ' + type);
        }

        this.depth.push(this.block);
    };
    
    /** 结束一个括号块 */
    onEndBlock() {
        let block = this.depth.pop()!;
        let parent = this.block = this.depth[this.depth.length - 1]
        switch (parent.type) {
            case BracketType.花括号:
                parent.element[block.key] = block.element;
                break;
            case BracketType.方括号:
                if (block.key != '')
                    parent.element.push(block.key);
                parent.element.push(block.element);
                break;
            default:
                throw new Error('Unknown block type: ');
        }
    };

    getBlockType():BracketType {
        return this.block.type
    }
}

/** 分解一个字符串转化为json对象 */
export function parse(code:string, parser:vdfDecoder) {
    'use strict';
    let i = 0,
        /** 索引所在行数 */
        keyLine = 0, 
        /** 当前处理到的行数 */
        lineCount = 1,
        /** 深度 */
        stack = 0;

    for (i; i < code.length; i ++) {
        singleCh(code.charAt(i))
    }

    // if (curKey !== null) {
    //     throw new Error('Key \"' + curKey + "\" doesn't have a value");
    // }

    return;

    function textInMark(ch:'"'|"'") {
        let right = i+1
        do {
            right = code.indexOf(ch,right)
        }while (code.charAt(right-1)=='\\')

        let text = code.slice(i+1,right)
        if (parser.onKey(text)){
            keyLine = lineCount;
        } else {
            if (keyLine !== lineCount) {
                throw new Error('Key must be on the same line of the value at line ' + keyLine);
            }
            parser.onValue(text)
        }
        i = right
    }

    function textUnMark() {
        let right = i
        while (isCharSimple(code.charAt(right+1)) || isCharSimple(code.charAt(right)+code.charAt(right+1))) {
            right++
        }
        let text = code.slice(i,right)
        if (parser.onKey(text)){
            keyLine = lineCount;
        } else {
            if (keyLine !== lineCount) {
                throw new Error('Key must be on the same line of the value at line ' + keyLine);
            }
            parser.onValue(text)
        }
        i = right
    }

    /** 开启新的括号 */
    function intoBracket(bracketType:BracketType) {
        parser.onBlock(bracketType);
        stack++;
    }

    /** 结束一个括号 */
    function finishBracket(bracketType:BracketType) {
        if (stack === 0) {
            throw new Error('Block mismatch at line ' + lineCount);
        }
        let blockType = parser.getBlockType();
        if (blockType != bracketType)
            throw new Error('Block mismatch at line ' + lineCount + ' (Expected block type ' + bracketType + ')');

        parser.onEndBlock();
        stack--;
    }

    function singleCh(ch:string) {
        if (ch === '"' || ch === "'") {
            textInMark(ch)
        } else if (ch === '{') {
            intoBracket(BracketType.花括号)
        } else if (ch === '}') {
            finishBracket(BracketType.花括号)
        } else if (ch === '[') {
            intoBracket(BracketType.方括号)
        } else if (ch === ']') {
            finishBracket(BracketType.方括号)
        } else if (ch === '\n') {
            lineCount += 1;
        } else if (ch === '\r' || ch === ' ' || ch === '\t') {
            //break;
        } else if (ch === '/' && code.charAt(i + 1) === '/') {
            let newIndex = code.indexOf('\n',i)
            if (newIndex == -1){
                i = code.length -1
            } else {
                i = newIndex - 1
            }
        } else if (ch === '/' && code.charAt(i + 1) === '*') {
            let newIndex = code.indexOf('*/',i)
            if (newIndex == -1){
                i = code.length -1
            } else {
                i = newIndex - 1
            }
        } else if (ch == '#' && code.slice(i,i+5)=='#base'){
            i += 4;
            if (parser.onKey('#base')){
                keyLine = lineCount;
            }
        } else {
            textUnMark()
        }
    }
};

function isNumberText(s:string) {
    'use strict';
    return (/^[\-0-9.]+$/).test(s);
};

function BoolTextToBool(str:string):boolean|null {
    'use strict';
    switch (str) {
    case 'true':
        return true;
    case 'false':
        return false;
    case 'null':
    default:
        return null;
    }
}

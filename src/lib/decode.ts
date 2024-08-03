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
    constructor(
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
    /** 写入键值 */
    onKeyValue(key:string, value:any) {
        let block = this.block
        if (block.type == BracketType.花括号)
            block.element[key] = value;
    };
    /** 写入值 */
    onValue(value:any) {
        let block = this.block
        if (block.type != BracketType.方括号)
                return;

        if (isNumberText(value)) {
            block.element.push(Number(value));
        } else {
            block.element.push(value);
        }
    };
    /** 新进一个括号块 */
    onBlock(key:string, type:BracketType) {
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
        /** i的位置在字符串中 */
        inString = false, 
        /** 字符串类型 */
        stringType = 0,
        /** 当前字符串内容 */
        curText:string = '',
        /** 当前文本的索引 */
        curKey:string|null = null, 
        /** 索引所在行数 */
        keyLine = 0, 
        /** 当前处理到的行数 */
        lineCount = 1,
        /** 深度 */
        stack:number = 0;

    for (i; i < code.length; i ++) {
        singleCh(code.charAt(i))
    }

    if (curKey !== null) {
        throw new Error('Key \"' + curKey + "\" doesn't have a value");
    }

    return;

    /** 继续构建当前文本 */
    function textBuilding(ch:string):boolean|undefined {
        
        if (ch === '\\') {
            if (i === code.length - 1) {
                throw new Error('Cannot escape nothing at line ' + lineCount);
            }
            switch (code.charAt(i + 1)) {
                case '"':
                    curText += '"';
                    break;
                case "'":
                    curText += "'";
                    break;
                case 'n':
                    curText += '\n';
                    break;
                case 'r':
                    curText += '\r';
                    break;
                default:
                    throw new Error('Invalid escape character at line ' + lineCount);
            }
            i += 1;
        } else if ((ch === '"' && stringType === 0) || (ch === "'" && stringType === 1) || (stringType === 2 && !isCharSimple(ch))) {
            aText(curText)
            inString = false;
            if (stringType === 2) {
                i -= 1;
            }
            return false
        } else {
            curText += ch;
            return true
        }
    }

    function aText(text:string) {
        switch (parser.getBlockType()) {
            case BracketType.花括号:
                if (curKey === null) {
                    curKey = text;
                    keyLine = lineCount;
                } else if (curKey == '#base'){
                    parser.onBase(text)
                    curKey = null;
                } else {
                    if (keyLine !== lineCount) {
                        throw new Error('Key must be on the same line of the value at line ' + keyLine);
                    }
                    if (stringType === 2) {
                        if (isNumberText(text)) {
                            parser.onKeyValue(curKey, Number(text));
                        } else if (isBoolText(text)) {
                            parser.onKeyValue(curKey, BoolTextToBool(text));
                        } else {
                            parser.onKeyValue(curKey, text);
                        }
                    } else {
                        parser.onKeyValue(curKey, text);
                    }
                    curKey = null;
                }
            case BracketType.方括号:
                parser.onValue(text);
                break;
            default:
                break;
        }
    }

    function textInMark(ch:'"'|"'") {
        let right = i+1
        do {
            right = code.indexOf(ch,right)
        }
        while (code.charAt(right-1)=='\\')
        curText = code.slice(i+1,right);
        
        i = right
        aText(curText)
    }

    /** 开启新的括号 */
    function intoBracket(bracketType:BracketType) {
        if (curKey === null) {
            throw new Error('Block must have a key at line ' + lineCount + ' offset ' + i);
        }

        parser.onBlock(curKey, bracketType);
        curKey = null;
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
        if (inString) {
            textBuilding(ch)
        } else if (ch == '#' && code.slice(i,i+5)=='#base'){
            i += 4;
            curKey = '#base'
        } else if (ch === '"' || ch === "'") {
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
        } else {
            inString = true;
            stringType = 2;
            curText = '';
            i -= 1;
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

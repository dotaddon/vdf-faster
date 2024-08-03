import { isBoolText, isCharSimple } from './util';


const enum BracketType {
    花括号 = 0,
    方括号 = 1,
}
export class vdfDecoder {
    private depths: any[]
    private depth:number
    constructor(
        public root: any = {},
        public baseList: string[] = []
    ){
        this.depths = [root];
        this.depth = 0;
    }
    onBase(path:string) {
        this.baseList.push(path)
    }
    onKeyValue(key:string, value:any) {
        this.depths[this.depth][key] = value;
    };
    onValue(value) {
        this.depths[this.depth].push(value);
    };
    onBlock(key, type) {
        this.depth += 1;
        switch (type) {
        case 0:
            this.depths.push({});
            break;
        case 1:
            this.depths.push([]);
            break;
        default:
            throw new Error('Unknown block type: ' + type);
        }
    };
    onEndBlock(key:string, type:BracketType, ParentType:BracketType) {
        let d = (this.depth -= 1);
        switch (ParentType) {
            case 0:
                let obj = this.depths.pop();
                this.depths[d][key] = obj;
                break;
            case 1:
                this.depths[d].push(this.depths.pop());
                break;
            default:
                throw new Error('Unknown block type: ' + type);
        }
    };
}

export function parse(code:string, parser:vdfDecoder) {
    'use strict';
    let i = 0,
        /** 嵌套对应的键 */
        depthsKey:string[] = [''],
        /** 嵌套类型 */
        depthStack:BracketType[] = [0],
        /** 嵌套的深度 */
        depth = 0,
        /** i的位置在字符串中 */
        inString = false, 
        /** 字符串类型 */
        stringType = 0, 
        /** 当前字符串内容 */
        curText = '',
        /** 当前文本的索引 */
        curKey = <string|null>null, 
        /** 索引所在行数 */
        keyLine = 0, 
        /** 当前处理到的行数 */
        lineCount = 1, 
        tmpStr;

    for (i; i < code.length; i ++) {
        singleCh(code.charAt(i))
    }

    if (curKey !== null) {
        throw new Error('Key \"' + curKey + "\" doesn't have a value");
    }

    return;

    /** 继续构建当前文本 */
    function textBuilding(ch:string) {
        
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
        } else if ((ch === '\"' && stringType === 0) || (ch === "'" && stringType === 1) || (stringType === 2 && !isCharSimple(ch))) {
            if (depthStack[depth] === 0) {
                if (curKey === null) {
                    curKey = curText;
                    keyLine = lineCount;
                } else if (curKey == '#base'){
                    parser.onBase(curText)
                    curKey = null;
                } else {
                    if (keyLine !== lineCount) {
                        throw new Error('Key must be on the same line of the value at line ' + keyLine);
                    }
                    if (stringType === 2) {
                        if (isNumberText(curText)) {
                            parser.onKeyValue(curKey, Number(curText));
                        } else if (isBoolText(curText)) {
                            parser.onKeyValue(curKey, BoolTextToBool(curText));
                        } else {
                            parser.onKeyValue(curKey, curText);
                        }
                    } else {
                        parser.onKeyValue(curKey, curText);
                    }
                    curKey = null;
                }
            } else if (depthStack[depth] === 1) {
                if (isNumberText(curText)) {
                    parser.onValue(Number(curText));
                } else {
                    parser.onValue(curText);
                }
            }
            inString = false;
            if (stringType === 2) {
                i -= 1;
            }
        } else {
            curText += ch;
        }
    }

    /** 开启新的括号 */
    function intoBracket(bracketType:BracketType) {
        if (depthStack[depth] === 0) {
            if (curKey === null) {
                throw new Error('Block must have a key at line ' + lineCount + ' offset ' + i);
            }
        }

        depthsKey.push(curKey!);

        switch (bracketType) {
            case BracketType.花括号:
                depthStack.push(0);
                parser.onBlock(curKey, 0);
                break;
            case BracketType.方括号:
                depthStack.push(1);
                parser.onBlock(curKey, 1);
                break;
        }
        curKey = null;
        depth += 1;
    }

    /** 结束一个括号 */
    function finishBracket(bracketType:BracketType) {
        if (depth === 0) {
            throw new Error('Block mismatch at line ' + lineCount);
        }
        if (depthStack[depth] !== 0) {
            throw new Error('Block mismatch at line ' + lineCount + ' (Expected block type ' + depthStack[depth] + ')');
        }

        tmpStr = depthsKey.pop();

        switch (bracketType) {
            case BracketType.花括号:
                parser.onEndBlock(tmpStr, 0, depthStack[depth-1]);
                break;
            case BracketType.方括号:
                parser.onEndBlock(tmpStr, 1, depthStack[depth-1]);
                break;
        }

        depthStack.pop();

        depth -= 1;
    }

    function singleCh(ch:string) {
        if (inString) {
            textBuilding(ch)
        } else if (ch == '#' && code.slice(i,5)=='#base'){
            i += 4;
            curKey = '#base'
        } else if (ch === '\"') {
            inString = true;
            stringType = 0;
            curText = '';
        } else if (ch === "'") {
            inString = true;
            stringType = 1;
            curText = '';
        } else if (ch === '{') {
            intoBracket(BracketType.花括号)
        } else if (ch === '}') {
            finishBracket(BracketType.花括号)
        } else if (ch === '[') {
            intoBracket(BracketType.方括号)
        } else if (ch === ']') {
            finishBracket(BracketType.方括号)
        } else if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t') {
            if (ch === '\n') {
                lineCount += 1;
            }
            //break;
        } else if (ch === '/' && code.charAt(i + 1) === '/') {
            while (i < code.length && code.charAt(i) !== '\n') {
                i += 1;
            }
            if (code.charAt(i) === '\n') {
                i -= 1;
            }
        } else if (ch === '/' && code.charAt(i + 1) === '*') {
            i += 1;
            while (true) {
                i += 1;
                ch = code.charAt(i);
                if (ch === '*' && code.charAt(i + 1) === '/') {
                    i += 1;
                    break;
                } else if (ch === '\n') {
                    lineCount += 1;
                } else if (i >= code.length) {
                    throw new Error('Comment block is not closed at line ' + lineCount);
                }
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

import { isBoolText, isCharSimple } from './util';


const enum BracketType {
    花括号 = 0,
    方括号 = 1,
}
declare type BlockInfo = {
    key: string
} & ({
    element: Record<string, any>
    type: BracketType.花括号
} | {
    element: any[]
    type: BracketType.方括号
}

    )

/** 分解一个字符串转化为json对象 */
export class vdfDecoder {
    /** 源字符串 */
    private code: string
    /** charAt 的位置 */
    private i = 0;
    /** 括号块的堆栈 */
    private depth: BlockInfo[]
    /** 当前修改的括号块 */
    private block: BlockInfo
    private key: string | null

    public root: Record<string, object> = {}
    /** base依赖 */
    public base: string[] = []
    constructor(
        /** value的类型保持string。false将把bool和数字转化为对应类型 */
        public strType: boolean = true,
    ) {
        this.block = {
            key: 'root',
            element: this.root,
            type: BracketType.花括号
        };
        this.depth = [this.block];
    }

    /** 引入数据 */
    source(code: string) {
        this.code = code
        this.i = 0;
        return this
    }

    parse() {
        for (this.i; this.i < this.code.length;this.i++) {
            this.singleCh(this.code.charAt(this.i))
        }
        return this
    }

    /** 增加子目录 */
    onBase(path: string) {
        this.base.push(path)
    }

    /** 存入一个键 */
    onKey(text: string): boolean {
        if (this.key) {
            this.onValue(text)
            return false;
        } else {
            this.key = text
            return true
        }
    }
    /** 写入值 */
    onValue(text: string) {
        let block = this.block
        let value = this.modify(text)

        switch (block.type) {
            case BracketType.花括号:
                if (this.key == null) {
                    this.key = text
                } else if (this.key == '#base') {
                    this.onBase(text)
                    this.key = null;
                } else {
                    block.element[this.key] = value;
                    this.key = null
                }
                break;
            case BracketType.方括号:
                if (this.key) {
                    block.element.push(this.modify(this.key));
                    this.key = null
                }
                block.element.push(value);
                break;
            default:
                break;
        }
    };
    modify(text: string) {
        if (this.strType)
            return text

        if (isNumberText(text))
            return Number(text)

        if (isBoolText(text))
            return BoolTextToBool(text)
    }

    /** 新进一个括号块 */
    onBlock(type: BracketType) {
        let key = this.key ?? '';
        this.key = null
        switch (type) {
            case BracketType.花括号:
                this.block = {
                    key,
                    element: {},
                    type
                }
                break;
            case BracketType.方括号:
                this.block = {
                    key,
                    element: [],
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

    onFinish() {
        if (this.key !== null) {
            throw new Error('Key \"' + this.key + "\" doesn't have a value");
        }
        return this
    }

    getBlockType(): BracketType {
        return this.block.type
    }

    /** 解析一个被标记的字符串 */
    private textInMark(ch: '"' | "'") {
        let right = this.i + 1
        do {
            right = this.code.indexOf(ch, right)
        } while (this.code.charAt(right - 1) == '\\')

        let text = this.code.slice(this.i + 1, right)
        this.onKey(text)
        this.i = right
    }

    /** 解析一个未被标记的字符串 */
    private textUnMark() {
        let right = this.i
        while (isCharSimple(this.code.charAt(right + 1)) || isCharSimple(this.code.charAt(right) + this.code.charAt(right + 1))) {
            right++
        }
        let text = this.code.slice(this.i, right)
        this.onKey(text)
        this.i = right
    }

    /** 单一字符串解析 */
    private singleCh(ch: string) {
        if (ch === '\n') {
            // lineCount += 1;
            return;
        } else if (ch === '\r' || ch === ' ' || ch === '\t') {
            //break;
            return;
        } else if (ch === '"' || ch === "'") {
            this.textInMark(ch)
            return;
        } else if (ch === '}' || ch === ']') {
            this.onEndBlock()
            return;
        } else if (ch === '{') {
            this.onBlock(BracketType.花括号);
            return;
        } else if (ch === '[') {
            this.onBlock(BracketType.方括号);
            return;
        } else if (ch === '/' && this.code.charAt(this.i + 1) === '/') {
            let newIndex = this.code.indexOf('\n', this.i)
            if (newIndex == -1) {
                this.i = this.code.length - 1
            } else {
                this.i = newIndex - 1
            }
        } else if (ch === '/' && this.code.charAt(this.i + 1) === '*') {
            let newIndex = this.code.indexOf('*/', this.i)
            if (newIndex == -1) {
                this.i = this.code.length - 1
            } else {
                this.i = newIndex - 1
            }
        } else if (ch == '#' && this.code.slice(this.i, this.i + 5) == '#base') {
            this.i += 4;
            this.onKey('#base')
        } else {
            this.textUnMark()
        }
    }
}

function isNumberText(s: string) {
    'use strict';
    return (/^[\-0-9.]+$/).test(s);
};

function BoolTextToBool(str: string): boolean | null {
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

import { vdfDecoder } from "./lib/decode";
import { encode } from './lib/encode'

/** Vdfer类的配置选项 */
interface VdferOptions {
    /** value的类型是否保持为string。false将把bool和数字转化为对应类型 */
    keepStringValue?: boolean;
    /** 是否使用紧凑模式输出VDF（不换行） */
    compact?: boolean;
}

/** Vdfer类 - 用于处理Valve Data Format (VDF)数据 */
export class vdfer {
    /** 字符串数据源 */
    private sourceCode: string;
    /** json数据源 */
    private sourceJson: Record<string, object>;
    /** 原始数据Map，key为一级键，value为对应的原始VDF字符串 */
    private rawDataMap: Map<string, { code?: string, json?: object }> = new Map();

    private options: VdferOptions;

    constructor(options: VdferOptions = {}, rawDataMap?: Map<string, { code?: string, json?: object }>) {
        this.options = {
            keepStringValue: true,
            compact: false,
            ...options
        };
        if (rawDataMap) {
            this.rawDataMap = new Map(rawDataMap);
        }
    }
    /**
     * 初始化Vdfer实例
     * @param input VDF字符串或JSON对象
     * @returns Vdfer实例
     */
    init(input: string | object): vdfer {
        if (typeof input === 'string') {
            this.sourceCode = input;
        } else {
            this.sourceJson = input as Record<string, object>;
        }
        return this;
    }

    private parseInitialFinish: boolean = false;
    private parseInitial(): void {
        if (this.parseInitialFinish)
            return;
        this.parseInitialFinish = true;
        // 解析一级key和对应的原始数据
        let i = 0;
        let inQuote = false;
        let quoteChar = '';
        let currentKey = '';
        let bracketDepth = 0;
        let blockStart = -1;

        while (i < this.sourceCode.length) {
            const ch = this.sourceCode[i];

            if (!inQuote) {
                if (ch === '{' && bracketDepth === 1) {
                    blockStart = i;
                }
                if (ch === '{') {
                    bracketDepth++;
                } else if (ch === '}') {
                    bracketDepth--;
                    if (bracketDepth === 1 && blockStart !== -1) {
                        let tawData = this.rawDataMap.get(currentKey) ?? {}
                        // 提取并存储原始数据块，去掉首尾的花括号
                        tawData.code = this.sourceCode.slice(blockStart + 1, i);;
                        this.rawDataMap.set(currentKey, tawData);
                        currentKey = '';
                        blockStart = -1;
                    }
                } else if ((ch === '"' || ch === "'") && bracketDepth === 1) {
                    inQuote = true;
                    quoteChar = ch;
                    currentKey = '';
                }
            } else {
                if (ch === quoteChar && this.sourceCode[i - 1] !== '\\') {
                    inQuote = false;
                } else {
                    currentKey += ch;
                }
            }
            i++;
        }
    }

    private parseBaseFinish: boolean = false;
    private parseBase(): void {
        if (this.parseBaseFinish)
            return;
        this.parseBaseFinish = true;
        let code = this.sourceCode;
        let i = 0;

        while ((i = code.indexOf('#base', i)) !== -1) {
            i += 5; // 跳过'#base'

            // 跳过空白字符
            while (i < code.length && (code[i] === ' ' || code[i] === '\t' || code[i] === '\n' || code[i] === '\r')) {
                i++;
            }

            if (i >= code.length) break;

            if (code[i] === '"' || code[i] === "'") {
                const quote = code[i];
                i++;
                const start = i;

                while (i < code.length && code[i] !== quote) {
                    if (code[i] === '\\') {
                        i++; // 跳过转义字符
                    }
                    i++;
                }

                if (i < code.length) {
                    this.addBase(code.slice(start, i));
                }
            }
        }
    }

    /** 所有的引用数据 */
    private base: string[] = [];
    /**
     * 获取base列表
     * @throws 如果数据未初始化
     */
    getBase(): string[] {
        this.parseBase();
        return this.base;
    }

    /**
     * 解析VDF数据
     * @throws 如果数据未初始化
     */
    addBase(path: string) {
        this.base.push(path);
    }


    /** 所有键的列表 */
    private keys: string[]
    /**
     * 获取所有键的列表
     * @throws 如果数据未初始化
     */
    getTree(): string[] {
        this.parseInitial()
        if (this.keys)
            return this.keys;
        if (this.sourceCode) {
            this.keys = [...this.rawDataMap.keys()];
            return this.keys
        }
        if (this.sourceJson) {
            this.keys = Object.keys(this.sourceJson);
            return this.keys
        }
        throw new Error('数据未初始化，请先调用 init() 方法');
    }

    /**
     * 获取指定键的数据
     * @param key 要获取的键
     * @throws 如果数据未初始化
     */
    getDataJson(key: string): object | undefined {

        const rawData = this.rawDataMap.get(key);
        if (!rawData)
            return undefined;

        if (rawData.json)
            return rawData.json

        // 解析数据
        if (rawData.code) {
            let data = new vdfDecoder(this.options.keepStringValue)
                .source(rawData.code)
                .parse()
                .onFinish()
                .getAllJson();
            rawData.json = data;
            return data;
        }
        return undefined;
    }

    getDataCode(key: string): string | undefined {
        const rawData = this.rawDataMap.get(key);
        if (!rawData)
            return undefined;
        if (rawData.code)
            return rawData.code;
        if (rawData.json) {
            let data = encode(rawData.json, this.options.compact ? -1 : 1);
            rawData.code = data;
            return data;
        }
        return undefined;
    }

    /**
     * 添加或更新数据
     * @param name 键名
     * @param data 要添加的数据
     * @throws 如果数据未初始化
     */
    addData(name: string, data: object | string) {
        let rawData = this.rawDataMap.get(name) ?? {};
        if (typeof data === 'string') {
            rawData.code = data;
        } else {
            rawData.json = data;
        }
        this.rawDataMap.set(name, rawData)
        return this
    }

    /**
     * 获取完整的JSON数据结构
     * @throws 如果数据未初始化
     */
    getAllJson(): Record<string, object> {
        let entries = this.getTree()
            .map(key => [key, this.getDataJson(key)])
            .filter(([, data]) => data)

        return Object.fromEntries(entries);
    }

    /**
     * 获取完整的VDF字符串
     * @throws 如果数据未初始化
     */
    getAllCode(): string {
        let entries = this.getTree()
            .map(key => {
                let code = this.getDataCode(key);
                if (code)
                    return `"${key}" ${code}`
            })
            .filter(Boolean)
        return entries.join('\n')
    }

    /**
     * 将数据拆分成多个部分
     * @param limit 每个部分的最大元素数量
     * @throws 如果数据未初始化
     */
    depart(limit: number = 50): vdfer[] {
        const result: vdfer[] = [];
        const entries = [...this.rawDataMap.entries()];

        while (entries.length > 0) {
            const chunk = entries.splice(0, limit);
            const newMap = new Map(chunk);
            const newVdfer = new vdfer(this.options, newMap);
            result.push(newVdfer);
        }
        return result;
    }
}
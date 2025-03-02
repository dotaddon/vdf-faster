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
export class vdfParser {
    /** 字符串数据源 */
    private sourceCode: string;
    /** json数据源 */
    private sourceJson: Record<string, any>;
    /** 原始数据Map，key为一级键，value为对应的原始VDF字符串 */
    private rawDataMap: Map<string, { code?: string, json?: any }> = new Map();

    private options: VdferOptions;

    constructor(options: VdferOptions = {}, rawDataMap?: Map<string, { code?: string, json?: any }>) {
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
    init(input: string | object): vdfParser {
        if (typeof input === 'string') {
            this.sourceCode = input;
        } else {
            this.sourceJson = input as Record<string, object>;
        }
        return this;
    }


    private parseFinished: boolean = false;
    /**
     * 解析VDF数据
     */
    private parseFromCode(): void {
        if (this.parseFinished)
            return;
        this.parseFinished = true;

        let i = 0;
        let inQuote = false;
        let quoteChar = '';
        let currentKey = '';
        let bracketDepth = 0;
        let blockStart = -1;

        while (i < this.sourceCode.length) {
            const ch = this.sourceCode[i];

            // 处理 #base 指令
            if (!inQuote && ch === '#' && this.sourceCode.slice(i, i + 5) === '#base') {
                i += 5; // 跳过 '#base'

                // 跳过空白字符
                while (i < this.sourceCode.length && /[\s]/.test(this.sourceCode[i])) {
                    i++;
                }

                if (i < this.sourceCode.length && (this.sourceCode[i] === '"' || this.sourceCode[i] === "'")) {
                    const quote = this.sourceCode[i];
                    i++;
                    const start = i;

                    while (i < this.sourceCode.length && this.sourceCode[i] !== quote) {
                        if (this.sourceCode[i] === '\\') i++;
                        i++;
                    }

                    if (i < this.sourceCode.length) {
                        this.addBase(this.sourceCode.slice(start, i));
                    }
                }
                i++;
                continue;
            }

            // 处理键值对
            if (!inQuote) {
                if (ch === '{' && bracketDepth === 1) {
                    blockStart = i;
                }
                if (ch === '{') {
                    bracketDepth++;
                } else if (ch === '}') {
                    bracketDepth--;
                    if (bracketDepth === 1 && blockStart !== -1) {
                        let rawData = this.rawDataMap.get(currentKey) ?? {};
                        rawData.code = this.sourceCode.slice(blockStart + 1, i);
                        this.rawDataMap.set(currentKey, rawData);
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

    /**
     * 解析VDF数据
     */
    private parseFromJson(): void {
        if (this.parseFinished)
            return;
        this.parseFinished = true;

        for (const [key, value] of Object.entries(this.sourceJson)) {
            let rawData = this.rawDataMap.get(key) ?? {};
            rawData.json = value;
            this.rawDataMap.set(key, rawData);
        }
    }

    /**
     * 检查数据初始化
     * @throws 如果数据未初始化
     */
    private parseCheck(){
        if (!this.parseFinished) {
            if (this.sourceCode) {
                this.parseFromCode();
            } else if (this.sourceJson) {
                this.parseFromJson();
            } else {
                throw new Error('数据未初始化，请先调用 init() 方法');
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
        this.parseCheck();
        return this.base;
    }

    /**
     * 解析VDF数据
     * @throws 如果数据未初始化
     */
    addBase(path: string) {
        this.base.push(path);
        return this
    }

    /**
     * 获取所有键的列表
     * @throws 如果数据未初始化
     */
    getTree(): string[] {
        this.parseCheck();
        if (this.sourceCode) {
            return [...this.rawDataMap.keys()]
        }
        if (this.sourceJson) {
            return Object.keys(this.sourceJson)
        }
        throw new Error('数据未初始化，请先调用 init() 方法');
    }

    /**
     * 获取指定键的数据
     * @param key 要获取的键
     * @throws 如果数据未初始化
     */
    getDataJson(key: string): any | undefined {
        this.parseCheck();
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
        this.parseCheck();
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
    depart(limit: number = 50): vdfParser[] {
        this.parseCheck();
        const result: vdfParser[] = [];
        const entries = [...this.rawDataMap.entries()];

        while (entries.length > 0) {
            const chunk = entries.splice(0, limit);
            const newMap = new Map(chunk);
            const newVdfer = new vdfParser(this.options, newMap);
            result.push(newVdfer);
        }
        return result;
    }
}
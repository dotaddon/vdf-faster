/** Vdfer类的配置选项 */
interface VdferOptions {
    /** value的类型是否保持为string。false将把bool和数字转化为对应类型 */
    keepStringValue?: boolean;
    /** 是否使用紧凑模式输出VDF（不换行） */
    compact?: boolean;
}

/** Vdfer类 - 用于处理Valve Data Format (VDF)数据 */
export class Vdfer {
    private sourceCode: string = '';
    private sourceJson: Record<string, object> = {};
    private data: Record<string, object> = {};
    private baseList: string[] = [];
    private options: VdferOptions;
    private finish:boolean = false;

    constructor(options: VdferOptions = {}) {
        this.options = {
            keepStringValue: true,
            compact: false,
            ...options
        };
    }

    /**
     * 初始化Vdfer实例
     * @param input VDF字符串或JSON对象
     * @returns Vdfer实例
     */
    init(input: string | object): Vdfer {
        if (typeof input === 'string') {
            this.sourceCode = input;
            setTimeout(this.parseVDF, 0);
        } else {
            this.sourceJson = input as Record<string, object>;
            this.data = this.sourceJson;
        }

        return this;
    }

    /**
     * 解析VDF字符串
     * @param code VDF字符串
     */
    private async parseVDF() {
        let code = this.sourceCode
        const decoder = {
            root: {} as Record<string, object>,
            baseList: [] as string[],
            depth: [] as any[],
            block: null as any,
            key: null as string | null,
            strType: this.options.keepStringValue
        };

        // 初始化根块
        decoder.block = {
            key: 'root',
            element: decoder.root,
            type: 0 // 花括号类型
        };
        decoder.depth = [decoder.block];

        // 解析VDF
        this.parse(code, decoder);

        // 更新实例数据
        this.data = decoder.root;
        this.baseList = decoder.baseList;

        // 异步处理大数据（不影响返回值）
        if (Object.keys(this.data).length > 1000) {
            setTimeout(() => {
                // 在这里可以添加大数据的异步处理逻辑
            }, 0);
        }
    }

    /**
     * 解析VDF字符串
     * @param code VDF字符串
     * @param decoder 解码器对象
     */
    private parse(code: string, decoder: any): void {
        for (let i = 0; i < code.length; i++) {
            const ch = code.charAt(i);
            if (ch === '\n' || ch === '\r' || ch === ' ' || ch === '\t') {
                continue;
            } else if (ch === '"' || ch === "'") {
                i = this.parseQuotedText(code, i, ch, decoder);
            } else if (ch === '}' || ch === ']') {
                this.endBlock(decoder);
            } else if (ch === '{') {
                this.startBlock(decoder, 0); // 花括号类型
            } else if (ch === '[') {
                this.startBlock(decoder, 1); // 方括号类型
            } else if (ch === '/' && code.charAt(i + 1) === '/') {
                i = code.indexOf('\n', i);
                if (i === -1) i = code.length - 1;
            } else if (ch === '/' && code.charAt(i + 1) === '*') {
                i = code.indexOf('*/', i);
                if (i === -1) i = code.length - 1;
            } else if (ch === '#' && code.slice(i, i + 5) === '#base') {
                i += 4;
                decoder.key = '#base';
            } else {
                i = this.parseUnquotedText(code, i, decoder);
            }
        }
    }

    private parseQuotedText(code: string, start: number, quote: string, decoder: any): number {
        let end = start + 1;
        do {
            end = code.indexOf(quote, end);
        } while (code.charAt(end - 1) === '\\');

        const text = code.slice(start + 1, end);
        this.processKey(decoder, text);
        return end;
    }

    private parseUnquotedText(code: string, start: number, decoder: any): number {
        let end = start;
        while (this.isSimpleChar(code.charAt(end + 1))) {
            end++;
        }
        const text = code.slice(start, end + 1);
        this.processKey(decoder, text);
        return end;
    }

    private isSimpleChar(ch: string): boolean {
        return /[a-zA-Z0-9_\-.]/.test(ch);
    }

    private processKey(decoder: any, text: string): void {
        if (decoder.key) {
            this.processValue(decoder, text);
        } else {
            decoder.key = text;
        }
    }

    private processValue(decoder: any, text: string): void {
        const value = this.modifyValue(text, decoder.strType);
        if (decoder.block.type === 0) { // 花括号类型
            if (decoder.key === '#base') {
                decoder.baseList.push(text);
                decoder.key = null;
            } else {
                decoder.block.element[decoder.key] = value;
                decoder.key = null;
            }
        } else { // 方括号类型
            if (decoder.key) {
                decoder.block.element.push(this.modifyValue(decoder.key, decoder.strType));
                decoder.key = null;
            }
            decoder.block.element.push(value);
        }
    }

    private modifyValue(text: string, strType: boolean): any {
        if (strType) return text;
        if (/^[\-0-9.]+$/.test(text)) return Number(text);
        if (/^(true|false)$/i.test(text)) return text.toLowerCase() === 'true';
        return text;
    }

    private startBlock(decoder: any, type: number): void {
        const key = decoder.key ?? '';
        decoder.key = null;
        const block = {
            key,
            element: type === 0 ? {} : [],
            type
        };
        decoder.block = block;
        decoder.depth.push(block);
    }

    private endBlock(decoder: any): void {
        const block = decoder.depth.pop();
        const parent = decoder.block = decoder.depth[decoder.depth.length - 1];
        if (parent.type === 0) { // 花括号类型
            parent.element[block.key] = block.element;
        } else { // 方括号类型
            if (block.key !== '') {
                parent.element.push(block.key);
            }
            parent.element.push(block.element);
        }
    }

    /**
     * 获取base列表
     * @throws 如果数据未初始化
     */
    getBase(): string[] {
        this.checkInitialized();
        return [...this.baseList];
    }

    /**
     * 获取所有键的列表
     * @throws 如果数据未初始化
     */
    getTree(): string[] {
        this.checkInitialized();
        return Object.keys(this.data);
    }

    /**
     * 获取指定键的数据
     * @param key 要获取的键
     * @throws 如果数据未初始化
     */
    getData(key: string): object | undefined {
        this.checkInitialized();
        return this.data[key];
    }

    /**
     * 添加或更新数据
     * @param name 键名
     * @param data 要添加的数据
     * @throws 如果数据未初始化
     */
    addData(name: string, data: object): void {
        this.checkInitialized();
        this.data[name] = data;
    }

    /**
     * 获取完整的JSON数据结构
     * @throws 如果数据未初始化
     */
    getAllJSON(): Record<string, object> {
        this.checkInitialized();
        return this.data;
    }

    /**
     * 获取完整的VDF字符串
     * @throws 如果数据未初始化
     */
    getAllVDF(): string {
        this.checkInitialized();
        return this.encodeVDF(this.data, this.options.compact ? -1 : 0);
    }

    /**
     * 将对象编码为VDF字符串
     * @param obj 要编码的对象
     * @param depth 缩进深度（-1表示紧凑模式）
     */
    private encodeVDF(obj: any, depth: number): string {
        const indent = depth >= 0 ? '\t'.repeat(depth) : '';
        const newline = depth >= 0 ? '\n' : '';

        if (Array.isArray(obj)) {
            return this.encodeArray(obj, depth, indent, newline);
        }

        let result = '';
        for (const [key, value] of Object.entries(obj)) {
            result += `${indent}"${key}"`;
            if (typeof value === 'object' && value !== null) {
                result += `${newline}${indent}{${newline}`;
                result += this.encodeVDF(value, depth >= 0 ? depth + 1 : -1);
                result += `${indent}}${newline}`;
            } else {
                result += ` "${value}"${newline}`;
            }
        }
        return result;
    }

    private encodeArray(arr: any[], depth: number, indent: string, newline: string): string {
        let result = '';
        for (const value of arr) {
            if (typeof value === 'object' && value !== null) {
                result += `${indent}[${newline}`;
                result += this.encodeVDF(value, depth >= 0 ? depth + 1 : -1);
                result += `${indent}]${newline}`;
            } else {
                result += `${indent}"${value}"${newline}`;
            }
        }
        return result;
    }

    /**
     * 将数据拆分成多个部分
     * @param limit 每个部分的最大元素数量
     * @throws 如果数据未初始化
     */
    depart(limit: number = 50): Record<string, object>[] {
        this.checkInitialized();
        const result: Record<string, object>[] = [];
        const entries = Object.entries(this.data);
        
        while (entries.length > 0) {
            result.push(Object.fromEntries(entries.splice(0, limit)));
        }
        return result;
    }

    /**
     * 检查数据是否已初始化
     * @throws 如果数据未初始化
     */
    private checkInitialized(): void {
        if (Object.keys(this.data).length === 0) {
            throw new Error('数据未初始化，请先调用 init() 方法');
        }
    }
}
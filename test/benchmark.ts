import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { Readable } from 'stream';
import { join, basename } from 'path';

import {vdf as fastVdf} from 'fast-vdf';
import * as vdfParser from 'vdf-parser';
import vdfReader from 'vdf-reader';
import vdfExtra from 'vdf-extra';
import vdfjs from 'vdfjs';
import simpleVdf from 'simple-vdf';
import { VdfParser as kvParser } from '@hinw/vdf-parser';
import * as vdfFaster from '../src';

// 定义解析器接口
interface Parser {
    name: string;
    parse: (content: string) => object;
}

// 创建输出目录
const outputDir = join(__dirname, 'dist');
if (!existsSync(outputDir)) {
    mkdirSync(outputDir);
}

// 测试文件路径
const files: string[] = [
    join(__dirname, 'npc', 'unit.txt'),
    join(__dirname, 'npc', 'npc_heros_custom.txt')
];

// 解析库列表
const parsers: Parser[] = [
    {
        name: 'vdf-faster',
        parse: (content: string) => vdfFaster.decode(content)
    },
    {
        name: 'fast-vdf',
        parse: (content: string) => fastVdf.parse(content)
    },
    {
        name: '@hinw_vdf-parser',
        parse: (content: string) => new kvParser().parseText(content)
    },
    {
        name: 'vdf-reader',
        parse: (content: string) => vdfReader.parse(content)
    },
    {
        name: 'vdf-parser',
        parse: (content: string) => vdfParser.parse(content)
    },
    {
        name: 'vdf-extra',
        parse: (content: string) => vdfExtra.parse(content)
    },
    {
        name: 'vdfjs',
        parse: (content: string) => vdfjs.parse(content)
    },
    {
        name: 'simple-vdf',
        parse: (content: string) => simpleVdf.parse(content)
    }
];
(async () => {
    
    // 运行测试
    for (const filePath of files) {
        const result:Record<string,number> = {};
        const fileName = basename(filePath);
        console.log(`\nTesting ${fileName}:`);
        const content = readFileSync(filePath, 'utf-8');

        for (const parser of parsers) {
            try {
                const start = process.hrtime.bigint();
                const result = await (parser.name === '@hinw/vdf-parser' ? parser.parse(content) : Promise.resolve(parser.parse(content)));
                const end = process.hrtime.bigint();
                const timeMs = Number(end - start) / 1_000_000;

                result[parser.name] = timeMs;
                // 保存解析结果
                const outputPath = join(outputDir, `${basename(fileName,'.txt')}_${parser.name}.json`);
                writeFileSync(outputPath, JSON.stringify(result, null, 2));

                console.log(`${parser.name}: ${timeMs.toFixed(3)}ms`);
            } catch (error) {
                if (error instanceof Error) {
                    console.error(`${parser.name} failed:`, error.message);
                } else {
                    console.error(`${parser.name} failed with an unknown error`);
                }
            }
        }
        console.table(result);
    }
})();
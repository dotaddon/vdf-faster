const { isStringKeyword, isCharSimple } = require('./util');

function KeyValueDecoder() {
    'use strict';

    var self = this, root, depths, depth,
        inString, stringType, building, curKey;

    this.onInit = function () {
        depths = [];
        depth = 0;
        inString = false;
        stringType = 0;
        building = '';
        curKey = null;

        depths.push({});
    };

    this.onKeyValue = function (key, value) {
        depths[depth][key] = value;
    };

    this.onValue = function (value) {
        depths[depth].push(value);
    };

    this.onBlock = function (key, type) {
        depth += 1;
        switch (type) {
        case 0:
            depths.push({});
            break;
        case 1:
            depths.push([]);
            break;
        default:
            throw new Error('Unknown block type: ' + type);
        }
    };

    this.onEndBlock = function (key, type) {
        var d = (depth -= 1), obj;
        switch (this.parserGetParentType()) {
        case 0:
            obj = depths.pop();
            depths[d][key] = obj;
            break;
        case 1:
            depths[d].push(depths.pop());
            break;
        default:
            throw new Error('Unknown block type: ' + type);
        }
    };

    this.onFinish = function () {
        root = depths[0];
        self.root = root;
    };
}

KeyValueDecoder.prototype = {
    root: null
};

function parse(code, parser) {
    'use strict';
    var i = 0, depthsKey = [], depthsType = [], depth = -1,
        inString = false, stringType = 0, building = '',
        curKey = null, keyLine = 0, lineCount = 1, tmpStr, ch;

    parser.parserGetParentType = ()=> {
        if (depth === 0) {
            return 0;
        }
        return depthsType[depth - 1];
    };

    depthsKey.push('');
    depthsType.push(0);
    depth += 1;

    parser.onInit();

    for (i; i < code.length; i += 1) {
        ch = code.charAt(i);
        if (inString) {
            if (ch === '\\') {
                if (i === code.length - 1) {
                    throw new Error('Cannot escape nothing at line ' + lineCount);
                }
                switch (code.charAt(i + 1)) {
                case '"':
                    building += '"';
                    break;
                case "'":
                    building += "'";
                    break;
                case 'n':
                    building += '\n';
                    break;
                case 'r':
                    building += '\r';
                    break;
                default:
                    throw new Error('Invalid escape character at line ' + lineCount);
                }
                i += 1;
            } else if ((ch === '\"' && stringType === 0) || (ch === "'" && stringType === 1) || (stringType === 2 && !isCharSimple(ch))) {
                if (depthsType[depth] === 0) {
                    if (curKey === null) {
                        curKey = building;
                        keyLine = lineCount;
                    } else {
                        if (keyLine !== lineCount) {
                            throw new Error('Key must be on the same line of the value at line ' + keyLine);
                        }
                        if (stringType === 2) {
                            if (isNumeric(building)) {
                                parser.onKeyValue(curKey, Number(building));
                            } else if (isStringKeyword(building)) {
                                parser.onKeyValue(curKey, keywordToValue(building));
                            } else {
                                parser.onKeyValue(curKey, building);
                            }
                        } else {
                            parser.onKeyValue(curKey, building);
                        }
                        curKey = null;
                    }
                } else if (depthsType[depth] === 1) {
                    if (isNumeric(building)) {
                        parser.onValue(Number(building));
                    } else {
                        parser.onValue(building);
                    }
                }
                inString = false;
                if (stringType === 2) {
                    i -= 1;
                }
            } else {
                building += ch;
            }
        } else if (ch === '\"') {
            inString = true;
            stringType = 0;
            building = '';
        } else if (ch === "'") {
            inString = true;
            stringType = 1;
            building = '';
        } else if (ch === '{') {
            if (depthsType[depth] === 0) {
                if (curKey === null) {
                    throw new Error('Block must have a key at line ' + lineCount + ' offset ' + i);
                }
            }

            parser.onBlock(curKey, 0);

            depthsKey.push(curKey);
            depthsType.push(0);

            curKey = null;
            depth += 1;
        } else if (ch === '}') {
            if (depth === 0) {
                throw new Error('Block mismatch at line ' + lineCount);
            }
            if (depthsType[depth] !== 0) {
                throw new Error('Block mismatch at line ' + lineCount + ' (Expected block type ' + depthsType[depth] + ')');
            }

            tmpStr = depthsKey.pop();

            parser.onEndBlock(tmpStr, 0);

            depthsType.pop();

            depth -= 1;
        } else if (ch === '[') {
            if (depthsType[depth] === 0) {
                if (curKey === null) {
                    throw new Error('Block must have a key at line ' + lineCount);
                }
            }

            parser.onBlock(curKey, 1);

            depthsKey.push(curKey);
            depthsType.push(1);

            curKey = null;
            depth += 1;
        } else if (ch === ']') {
            if (depth === 0) {
                throw new Error('Block mismatch at line ' + lineCount);
            }

            if (depthsType[depth] !== 1) {
                throw new Error('Block mismatch at line ' + lineCount);
            }

            tmpStr = depthsKey.pop();

            parser.onEndBlock(tmpStr, 1);

            depthsType.pop();

            depth -= 1;
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
            building = '';
            i -= 1;
        }
    }

    if (curKey !== null) {
        throw new Error('Key \"' + curKey + "\" doesn't have a value");
    }

    parser.onFinish();

};

function isNumeric(str) {
    'use strict';
    return (/^[\-0-9.]+$/).test(str);
};

function keywordToValue(str) {
    'use strict';
    switch (str) {
    case 'true':
        return true;
    case 'false':
        return false;
    case 'null':
        return null;
    default:
        return null;
    }
}

module.exports = {parse,KeyValueDecoder};
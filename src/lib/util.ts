
export function isBoolText(str:string) {
    'use strict';
    switch (str) {
    case 'true':
    case 'false':
    case 'null':
        return true;
    default:
        return false;
    }
}


export function isCharSimple(ch:string) {
    'use strict';
    switch (ch) {
    case '':
    case ' ':
    case '\t':
    case '\n':
    case '\r':
    case '[':
    case ']':
    case '{':
    case '}':
    case '"':
    case '\'':
    case '\\':
        return false;
    }
    return true;
}

module.exports.isStringKeyword = function (str) {
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


module.exports.isCharSimple = function (ch) {
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
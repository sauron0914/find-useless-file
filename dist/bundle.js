'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs$1 = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs$1);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var includeFile = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.html', '.less'];
var matchSuffix = function (str) {
    var res = str.match(/\.\w+/g);
    return res ? res[res.length - 1] : '';
};
var traverseFile = function (src, callback) {
    var paths = fs__default['default'].readdirSync(src).filter(function (item) { return item !== 'node_modules'; });
    paths.forEach(function (path) {
        var _src = src + '/' + path;
        var statSyncRes = fs__default['default'].statSync(_src);
        if (statSyncRes.isFile() && includeFile.includes(matchSuffix(path))) { //如果是个文件则拷贝
            callback(_src);
        }
        else if (statSyncRes.isDirectory()) { //是目录则 递归 
            traverseFile(_src, callback);
        }
    });
};

var fs = require('fs');
var exec = require('child_process').exec;
var cwd = process.cwd() + '/';
var aliasReg = cwd + 'src';
var fileName = 'find-useless-file.json';
var argvs = process.argv.splice(3).map(function (item) {
    if (item.substr(item.length - 1) === '/') {
        return item.substr(0, item.length - 1);
    }
    return item;
});
if (argvs.length !== 2) {
    throw new Error('仅支持命令 find-useless-file do filePath1 filePath2');
}
// const aliasSrc = path => dealIndexJS(path.replace(aliasReg, '@'))
var dealIndexJS = function (path) { return path.replace(/(\/index)?.js(x)?/g, ''); };
var findUselessFile = function () {
    console.log('开始查找文件....');
    var componentsPaths = {};
    traverseFile(cwd + argvs[0], function (path) {
        componentsPaths[path] = 0;
    });
    traverseFile(cwd + argvs[1], function (path) {
        var readFileSyncRes = fs.readFileSync(path, 'utf8');
        var currentPathLevel = path.match(/[@\w\/-]+\//ig)[0];
        var fromListFrom = readFileSyncRes.match(/(from ['.@\/\w-]+')/g) || [];
        var fromList = readFileSyncRes.match(/(import ['.@\/\w-]+')/g) || [];
        // 相对路径匹配
        var matchRes = __spreadArrays(fromListFrom, fromList).map(function (item) {
            return item.replace("from ", '').replace("import ").replace(/\'/g, '');
        }).filter(function (item) {
            return item.includes('.') | item.includes('@');
        }).map(function (item) {
            if (item.includes('@')) {
                return item.replace('@', aliasReg);
            }
            else {
                var levelCount = item.match(/\.\./g);
                if (levelCount) {
                    var arr = currentPathLevel.split('/');
                    return arr.splice(0, arr.length - (levelCount.length + 1)).join('/') + item.replace(/\.\./g, '');
                }
                else {
                    return item.replace('./', currentPathLevel);
                }
            }
        });
        Object.keys(componentsPaths).forEach(function (key) {
            if (matchRes.some(function (item) { return item.includes(dealIndexJS(key)); })) {
                componentsPaths[key]++;
            }
        });
    });
    var res = Object.entries(componentsPaths).reduce(function (pre, _a) {
        var key = _a[0], value = _a[1];
        if (!value) {
            pre.push(key.replace(cwd, ''));
        }
        return pre;
    }, []);
    fs.writeFile(cwd + 'find-useless-file.json', JSON.stringify(res, null, '\t'), {}, function (err) {
        if (err)
            console.log(err);
        console.log('文件查找成功，存放地址：' + cwd + fileName);
        console.log("!!!\u6CE8\u610F\uFF1A\u9ED8\u8BA4\u4F1A\u5728\u5F53\u524D\u76EE\u5F55\u4E0B\u751F\u6210\u4E00\u4E2A" + fileName + "\u6587\u4EF6");
        exec('open ' + cwd + fileName);
    });
};

exports.findUselessFile = findUselessFile;

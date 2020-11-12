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
var dealIndexJS = function (path) { return path.replace(/(\/index)?.(j|t)s(x)?/g, ''); };
var findUselessFile = function () {
    exec('rm -rf ' + cwd + fileName);
    console.log('开始查找文件...');
    var componentsPaths = {};
    // 存一份需要检测的路径
    traverseFile(cwd + argvs[0], function (path) {
        componentsPaths[path] = 0;
    });
    console.log(argvs[0] + " \u76EE\u5F55\u4E0B\u5171\u68C0\u6D4B\u5230" + Object.keys(componentsPaths).length + "\u4E2A\u6587\u4EF6");
    console.log('开始匹配文件...');
    traverseFile(cwd + argvs[1], function (path) {
        var readFileSyncRes = fs.readFileSync(path, 'utf8');
        var currentPathLevel = path.match(/[@\w\/-]+\//ig)[0];
        // 找到 from 'react', from './detail.js' 等
        var fromListFrom = readFileSyncRes.match(/(from ['.@\/\w-]+')/g) || [];
        // 找到 import './index.less', import './detail.less' 等
        var fromList = readFileSyncRes.match(/(import ['.@\/\w-]+')/g) || [];
        // 相对路径匹配
        var matchRes = __spreadArrays(fromListFrom, fromList).map(function (item) {
            // 去掉 "from ", "import "
            return item.replace("from ", '').replace("import ", '').replace(/\'/g, '');
        }).map(function (item) {
            // 兼容引用文件时，结尾为 '/' 的情况
            if (item.substr(item.length - 1) === '/') {
                return item.substr(0, item.length - 1);
            }
            return item;
        }).filter(function (item) {
            // 去掉第三方库 "react" "vue" "moment" 等
            return item.includes('.') || item.includes('@');
        }).map(function (item) {
            // 相对路径转化成绝对路径
            // 转化 alias @ 
            if (item.includes('@')) {
                return item.replace('@', aliasReg);
            }
            else {
                // 转化 ../../../ 
                var levelCount = item.match(/\.\./g);
                if (levelCount) {
                    var arr = currentPathLevel.split('/');
                    return arr.splice(0, arr.length - (levelCount.length + 1)).join('/') + '/' + item.replace(/\.\.\//g, '');
                }
                else {
                    // 非 ../../ ../ 等，应该只是 ./
                    return item.replace('./', currentPathLevel);
                }
            }
        });
        if (!matchRes.length)
            return;
        // 匹配到用到的路径，就直接把componentsPaths的key delete
        Object.keys(componentsPaths).forEach(function (key) {
            if (matchRes.some(function (item) { return dealIndexJS(item) === dealIndexJS(key); })) {
                delete componentsPaths[key];
            }
        });
    });
    fs.writeFile(cwd + 'find-useless-file.json', JSON.stringify(Object.keys(componentsPaths).map(function (item) { return item.replace(cwd, ''); }), null, '\t'), {}, function (err) {
        if (err)
            console.log(err);
        console.log('文件查找成功，存放地址：' + cwd + fileName);
        console.log('共找到' + Object.keys(componentsPaths).length + '个未被使用的文件');
        console.log("!!!\u6CE8\u610F\uFF1A\u9ED8\u8BA4\u4F1A\u5728\u5F53\u524D\u76EE\u5F55\u4E0B\u751F\u6210\u4E00\u4E2A" + fileName + "\u6587\u4EF6");
        exec('open ' + cwd + fileName);
    });
};

exports.findUselessFile = findUselessFile;

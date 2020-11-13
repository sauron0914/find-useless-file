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

var traverseFile = function (src, callback) {
    var paths = fs__default['default'].readdirSync(src).filter(function (item) { return item !== 'node_modules'; });
    paths.forEach(function (path) {
        var _src = src + '/' + path;
        var statSyncRes = fs__default['default'].statSync(_src);
        if (statSyncRes.isFile()) {
            callback(_src);
        }
        else if (statSyncRes.isDirectory()) { //是目录则 递归 
            traverseFile(_src, callback);
        }
    });
};
var deleteEmptyFolder = function (path) {
    var files = [];
    if (fs__default['default'].existsSync(path)) {
        files = fs__default['default'].readdirSync(path);
        files.forEach(function (file) {
            var curPath = path + "/" + file;
            if (fs__default['default'].statSync(curPath).isDirectory()) {
                if (fs__default['default'].readdirSync(curPath).length) {
                    deleteEmptyFolder(curPath);
                }
                else {
                    fs__default['default'].rmdirSync(curPath);
                }
            }
        });
        if (!fs__default['default'].readdirSync(path).length) {
            fs__default['default'].rmdirSync(path);
        }
    }
};

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var cwd = process.cwd() + '/';
var fileName = 'find-useless-file.json';
// const dealIndexJS = path => path.replace(/(\/index)?(.(((j|t)s(x)?)|(less|scss)))?/g, '')
var dealIndexJS = function (path) {
    var res = path.split('.');
    var noSuffix = res.length > 1 ? res.slice(0, res.length - 1).join('.') : path;
    return noSuffix.replace(/\/index$/g, '');
};
var Reg = {
    form: /(from (('[.@\/\w-]+')|("[.@\/\w-]+)"))/g,
    import: /(import (('[.@\/\w-]+')|("[.@\/\w-]+)"))/g,
    require: /(import|require)\((('[.@\/\w-]+')|("[.@\/\w-]+)")/g,
};
// 默认被过滤的文件
var filterFiles = [
    'src/index.ts',
    'src/index.js',
    'src/global.d.ts',
];
var findUselessFile = function () {
    var argvs = process.argv.splice(3).map(function (item) {
        if (item.substr(item.length - 1) === '/') {
            return item.substr(0, item.length - 1);
        }
        return item;
    });
    if (argvs.length !== 2) {
        throw new Error('仅支持命令 find-useless-file find filePath1 filePath2');
    }
    exec('rm -rf ' + cwd + fileName);
    console.log('🏊🏻 🏊🏻 🏊🏻 开始查找文件...');
    var componentsPaths = {};
    // 存一份需要检测的路径
    traverseFile(cwd + argvs[0], function (path) {
        // 过滤掉 src/global.d.ts src/index.js src/index.ts
        if (filterFiles.some(function (item) { return item === path.replace(cwd, ''); }))
            return;
        componentsPaths[path] = 0;
    });
    console.log("\uD83C\uDF89 \uD83C\uDF89 \uD83C\uDF89 " + argvs[0] + " \u76EE\u5F55\u4E0B\u5171\u68C0\u6D4B\u5230" + Object.keys(componentsPaths).length + "\u4E2A\u6587\u4EF6");
    console.log('🏊🏻 🏊🏻 🏊🏻 开始检测文件...');
    console.log('❗ ❗ ❗ 文件检测越多，检测范围越大，用时越久...');
    traverseFile(cwd + argvs[1], function (filePath) {
        var readFileSyncRes = fs.readFileSync(filePath, 'utf8');
        // 找到 from 'react', from './detail.js' 等
        // const fromList = readFileSyncRes.match(/(from ['.@\/\w-]+')/g) || []
        var fromList = readFileSyncRes.match(Reg.form) || [];
        // 找到 import './index.less', import './detail.less' @import './index.less' 等
        // const importList = readFileSyncRes.match(/(import ['.@\/\w-]+')/g) || []
        var importList = readFileSyncRes.match(Reg.import) || [];
        // 找到 import('@/containers/a/purchase/apply')  require('channelOpera/pages/home')
        // const requireList = readFileSyncRes.match(/(import|require)\(['.@\/\w-']+'/g) || []
        var requireList = readFileSyncRes.match(Reg.require) || [];
        // 相对路径匹配
        var matchRes = __spreadArrays(fromList, importList, requireList).map(function (item) {
            // 去掉 "from ", "import ", "import(", "require(", "@import "
            return item.replace("from ", '')
                .replace("import ", '')
                .replace("import(", '')
                .replace("require(", '')
                .replace(/(\'|\")/g, '');
        }).map(function (item) {
            // 兼容引用文件时，结尾为 '/' 的情况
            if (item.substr(item.length - 1) === '/') {
                return item.substr(0, item.length - 1);
            }
            return item;
        }).filter(function (item) {
            // 去掉第三方库 "react" "vue" "moment" 等
            var firstStr = item.substr(0, 1);
            return firstStr === '.' || firstStr === '@';
        }).map(function (item) {
            // 相对路径转化成绝对路径
            // 转化 alias @ 
            if (item.includes('@')) {
                return item.replace('@', cwd + 'src');
            }
            // 其他相对路径转化
            return path.resolve(filePath, '..', item);
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
    if (!Object.keys(componentsPaths).length) {
        console.log('🎉 🎉 🎉 没有未被使用的文件，皆大欢喜！！！');
        return;
    }
    fs.writeFile(cwd + 'find-useless-file.json', JSON.stringify(Object.keys(componentsPaths).map(function (item) { return item.replace(cwd, ''); }), null, '\t'), {}, function (err) {
        if (err)
            console.log(err);
        console.log('🎉 🎉 🎉 文件查找成功，存放地址：' + cwd + fileName);
        console.log('💝 💝 💝共找到' + Object.keys(componentsPaths).length + '个未被使用的文件');
        console.log("\u2757 \u2757 \u2757 \u6CE8\u610F\uFF1A\u9ED8\u8BA4\u4F1A\u5728\u5F53\u524D\u76EE\u5F55\u4E0B\u751F\u6210\u4E00\u4E2A" + fileName + "\u6587\u4EF6");
        exec('open ' + cwd + fileName);
    });
};
var delUselessFile = function () {
    console.log('🔥 🔥 🔥 I am sure you know what you are doing!!!');
    console.log('🏊🏻 🏊🏻 🏊🏻 delete useless file...');
    var readFileSyncRes = fs.readFileSync(cwd + fileName, 'utf8');
    var list = JSON.parse(readFileSyncRes);
    list.forEach(function (item) {
        fs.unlinkSync(item);
    });
    fs.unlinkSync(cwd + fileName);
    console.log('🎉 🎉 🎉delete success!!!');
};
var delEmptyDir = function () {
    var argvs = process.argv.splice(3);
    if (argvs.length !== 1) {
        throw new Error('仅支持命令 find-useless-file delDir filePath');
    }
    console.log('🏊🏻 🏊🏻 🏊🏻 delete empty folder...');
    deleteEmptyFolder(cwd + argvs[0]);
    console.log('🎉 🎉 🎉delete success!!!');
};

exports.delEmptyDir = delEmptyDir;
exports.delUselessFile = delUselessFile;
exports.findUselessFile = findUselessFile;

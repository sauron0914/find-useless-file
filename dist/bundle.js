'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var inquirer = require('inquirer');
var child_process = require('child_process');
var chalk = require('chalk');
var path = require('path');
var ora = require('ora');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);

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

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var matchSuffix = function (str) {
    var res = str.match(/\.\w+/g);
    return res ? res[res.length - 1] : '';
};
/**
 * 获取node命令参数
 *
 *  getArgvs() 返回 [file-path1, files-path2]
*/
var getArgvs = function () { return __spreadArrays(process.argv).splice(3); };
/**
 * src 你需要遍历的文件夹
 *
 * callback 返回src下文件夹一个文件path
 *
 * includeFile 只遍历你想要的文件 like ['.less', '.ts', '.tsx'] 只返回包含上述数组中的文件path，不传默认返回全部文件path
 *
 * 默认过文件夹下 node_modules 文件
*/
var traverseFile = function (src, callback, includeFile) {
    if (includeFile === void 0) { includeFile = []; }
    var paths = fs__default['default'].readdirSync(src).filter(function (item) { return item !== 'node_modules'; });
    paths.forEach(function (path) {
        var _src = src + '/' + path;
        var statSyncRes = fs__default['default'].statSync(_src);
        if (statSyncRes.isFile() && (!includeFile.length || includeFile.includes(matchSuffix(path)))) {
            callback(_src);
        }
        else if (statSyncRes.isDirectory()) { //是目录则 递归 
            traverseFile(_src, callback, includeFile);
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
var delUselessFileExec = function (fileName) {
    console.log("\u2757 \u2757 \u2757\u8BF7\u4ED4\u7EC6\u68C0\u67E5" + fileName + "\u6587\u4EF6\uFF0C\u5220\u9664\u4E00\u4E9B\u53EF\u80FD\u662F\u4F60\u9700\u8981\u7684\u4E0D\u60F3\u88AB\u5220\u9664\u7684\u6587\u4EF6");
    var promptList = [
        {
            type: 'choices',
            name: 'isContinue',
            message: "\u5220\u9664" + fileName + "\u4E2D\u5305\u542B\u7684\u6587\u4EF6: (Y/N)?",
            default: 'Y'
        },
    ];
    return new Promise(function (resolve, reject) {
        inquirer.prompt(promptList).then(function (res) {
            res.isContinue === 'Y' && resolve(true);
        }).catch(function () {
            reject();
        });
    });
};
/**
 * prompt 提示 是否继续操作
*/
var continueExec = function () {
    var promptList = [
        {
            type: 'choices',
            name: 'isContinue',
            message: '是否继续操作: (Y/N)?',
            default: 'N'
        },
    ];
    return new Promise(function (resolve, reject) {
        inquirer.prompt(promptList).then(function (res) {
            res.isContinue === 'Y' && resolve(true);
        }).catch(function () {
            reject();
        });
    });
};
/**
 * 检测当前分支status，若是有被修改的文件，则提示
*/
var isChangesNotStagedForCommit = function () {
    var CHANGES_NOT_STAGED_FOR_COMMIT = 'Changes not staged for commit';
    return new Promise(function (resolve) {
        child_process.exec('git status', function (err, stdout, stderr) {
            if (err) {
                console.log(chalk__default['default'].red('当前目录并未检测到git信息, 执行命令可能会对文件造成无法恢复的情况'));
                continueExec().then(function () {
                    resolve(true);
                });
            }
            else {
                if (stdout.includes(CHANGES_NOT_STAGED_FOR_COMMIT)) {
                    console.log(chalk__default['default'].red('你有变更的文件未提交，为了确保你的分支不被破坏，请处理后再次执行此命令'));
                    console.log(chalk__default['default'].red('若是你确保分支安全情况下，你仍可以继续操作'));
                    continueExec().then(function () {
                        resolve(true);
                    });
                }
                else
                    resolve(true);
            }
        });
    });
};

var cwd = process.cwd() + '/';
var fileName = 'find-useless-file.json';
var suffixs = ['js', 'ts', 'tsx', 'jsx'];
// const dealIndexJS = path => path.replace(/(\/index)?(.(((j|t)s(x)?)|(less|scss)))?/g, '')
var dealIndexJS = function (path) {
    var res = path.split('.');
    var noSuffix = suffixs.includes(res[res.length - 1]) ? res.slice(0, res.length - 1).join('.') : path;
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
var queryNumberOfTimes = 0;
var dealComponentsPaths = function (initComponentsPaths, uselessFiles, argvs) {
    if (uselessFiles === void 0) { uselessFiles = []; }
    var currentComponentsPaths = __assign({}, initComponentsPaths);
    var spinner = ora__default['default'](chalk__default['default'].blueBright("\u7B2C" + ++queryNumberOfTimes + "\u6B21\u904D\u5386\u6587\u4EF6...")).start();
    traverseFile(cwd + argvs[1], function (filePath) {
        if (uselessFiles.includes(filePath)) {
            delete currentComponentsPaths[filePath];
            return;
        }
        var readFileSyncRes = fs__default['default'].readFileSync(filePath, 'utf8');
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
            // const firstStr = item.substr(0,1)
            return item[0] === '.' || (item[0] + item[1] === '@/');
        }).map(function (item) {
            // 相对路径转化成绝对路径
            // 转化 alias @ 
            if (item.startsWith('@')) {
                return item.replace('@', cwd + 'src');
            }
            // 其他相对路径转化
            return path__default['default'].resolve(filePath, '..', item);
        });
        if (!matchRes.length)
            return;
        // 匹配到用到的路径，就直接把componentsPaths的key delete
        Object.keys(initComponentsPaths).forEach(function (key) {
            if (matchRes.some(function (item) {
                return dealIndexJS(item) === dealIndexJS(key);
            })) {
                delete currentComponentsPaths[key];
            }
        });
    });
    uselessFiles.push.apply(uselessFiles, Object.keys(currentComponentsPaths));
    spinner.succeed(chalk__default['default'].greenBright("\u7B2C" + queryNumberOfTimes + "\u6B21\u904D\u5386\u6587\u4EF6\u6210\u529F"));
    if (!Object.keys(currentComponentsPaths).length)
        return uselessFiles;
    return dealComponentsPaths(initComponentsPaths, uselessFiles, argvs);
};
var findUselessFileDeal = function () {
    var argvs = getArgvs().map(function (item) {
        if (item.substr(item.length - 1) === '/') {
            return item.substr(0, item.length - 1);
        }
        return item;
    });
    if (argvs.length !== 2) {
        console.log(chalk__default['default'].red('仅支持命令 dian-codemod find-useless-file filePath1 filePath2'));
        return;
    }
    child_process.exec('rm -rf ' + cwd + fileName);
    console.log('🏊🏻 🏊🏻 🏊🏻 开始查找文件...');
    var initComponentsPaths = {};
    // 存一份需要检测的路径
    traverseFile(cwd + argvs[0], function (path) {
        // 过滤掉 src/global.d.ts src/index.js src/index.ts
        if (filterFiles.some(function (item) { return item === path.replace(cwd, ''); }))
            return;
        initComponentsPaths[path] = 0;
    });
    var uselessFiles = [];
    console.log("\uD83C\uDF89 \uD83C\uDF89 \uD83C\uDF89 " + argvs[0] + " \u76EE\u5F55\u4E0B\u5171\u68C0\u6D4B\u5230" + Object.keys(initComponentsPaths).length + "\u4E2A\u6587\u4EF6");
    console.log(chalk__default['default'].yellowBright('可能会对文件多次遍历便于一次性找到所有未被使用的文件...'));
    var resComponents = dealComponentsPaths(initComponentsPaths, uselessFiles, argvs);
    if (!resComponents.length) {
        console.log(chalk__default['default'].greenBright('🎉 🎉 🎉 没有未被使用的文件，皆大欢喜！！！'));
        return;
    }
    fs__default['default'].writeFile(cwd + 'find-useless-file.json', JSON.stringify(resComponents.map(function (item) { return item.replace(cwd, ''); }), null, '\t'), {}, function (err) {
        if (err)
            console.log(err);
        console.log('🎉 🎉 🎉 ' + chalk__default['default'].greenBright(' 文件查找成功，存放地址：' + cwd + fileName));
        console.log('💝 💝 💝 共找到' + resComponents.length + '个未被使用的文件');
        console.log('❗ ❗ ❗' + chalk__default['default'].yellowBright(" \u6CE8\u610F\uFF1A\u9ED8\u8BA4\u4F1A\u5728\u5F53\u524D\u76EE\u5F55\u4E0B\u751F\u6210\u4E00\u4E2A" + fileName + "\u6587\u4EF6"));
        child_process.exec('open ' + cwd + fileName);
        delUselessFileExec(fileName).then(function (res) {
            delUselessFile().then(function () {
                delEmptyDir(cwd + argvs[1]);
            });
        });
    });
};
var delUselessFile = function () {
    return new Promise(function (resolve) {
        resolve((function () {
            console.log('🔥 🔥 🔥 I am sure you know what you are doing!!!');
            console.log('🏊🏻 🏊🏻 🏊🏻 delete useless file...');
            var readFileSyncRes = fs__default['default'].readFileSync(cwd + fileName, 'utf8');
            var list = JSON.parse(readFileSyncRes);
            list.forEach(function (item) {
                fs__default['default'].unlinkSync(item);
            });
            fs__default['default'].unlinkSync(cwd + fileName);
            console.log('🎉 🎉 🎉delete success!!!');
        })());
    });
};
var delEmptyDir = function (path) {
    console.log('🏊🏻 🏊🏻 🏊🏻 delete empty folder...');
    deleteEmptyFolder(path);
    console.log('🎉 🎉 🎉delete success!!!');
};
var findUselessFile = function () {
    isChangesNotStagedForCommit().then(function () {
        findUselessFileDeal();
    });
};

exports.findUselessFile = findUselessFile;

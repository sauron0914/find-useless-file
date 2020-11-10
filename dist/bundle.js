'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs$1 = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs$1);

var includeFile = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.html'];
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
var Grid = require("console-grid");
var cwd = process.cwd() + '/';
var aliasReg = cwd + 'src';
var fileName = 'find-useless-components.json';
var findUselessComponents = function () {
    var componentsPaths = {};
    traverseFile(cwd + 'src/components', function (path) {
        componentsPaths[path.replace(aliasReg, '@').replace(/(\/index)?.js(x)?/g, '')] = 0;
    });
    traverseFile(cwd + 'src/containers', function (path) {
        var readFileSyncRes = fs.readFileSync(path, 'utf8');
        Object.entries(componentsPaths).reduce(function (pre, _a) {
            var key = _a[0], value = _a[1];
            if (readFileSyncRes.includes(key)) {
                componentsPaths[key]++;
            }
            return pre;
        }, {});
    });
    var res = Object.entries(componentsPaths).reduce(function (pre, _a) {
        var key = _a[0], value = _a[1];
        if (!value) {
            pre.push(key);
        }
        return pre;
    }, []);
    fs.writeFile(cwd + 'find-useless-components.json', JSON.stringify(res, null, '\t'), {}, function (err) {
        if (err)
            console.log(err);
        console.log('文件创建成功，地址：' + cwd + fileName);
        console.log("!!!\u6CE8\u610F\uFF1A\u9ED8\u8BA4\u4F1A\u5728\u5F53\u524D\u76EE\u5F55\u4E0B\u751F\u6210\u4E00\u4E2A" + fileName + "\u6587\u4EF6");
        exec('open ' + cwd + fileName);
    });
};

exports.findUselessComponents = findUselessComponents;

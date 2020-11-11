'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs$1 = require('fs');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs$1);

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
var aliasSrc = function (path) { return dealIndexJS(path.replace(aliasReg, '@')); };
var dealIndexJS = function (path) { return path.replace(/(\/index)?.js(x)?/g, ''); };
var findUselessFile = function () {
    var componentsPaths = {};
    traverseFile(cwd + argvs[0], function (path) {
        componentsPaths[path] = 0;
    });
    traverseFile(cwd + argvs[1], function (path) {
        var readFileSyncRes = fs.readFileSync(path, 'utf8');
        var currentPathLevel = path.match(/[\w\/]+\//ig)[0];
        var fromList = readFileSyncRes.match(/(from ['.@\/\w-]+')/g) || [];
        // 相对路径匹配
        var matchRes = fromList.map(function (item) {
            return item.replace("from ", '').replace(/\'/g, '');
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
                    return arr.splice(0, arr.length - 2).join('/') + item.replace(/\.\./g, '');
                }
                else {
                    return item.replace('./', currentPathLevel);
                }
            }
        });
        Object.entries(componentsPaths).reduce(function (pre, _a) {
            var key = _a[0];
            if (readFileSyncRes.includes(aliasSrc(key)) || matchRes.includes(dealIndexJS(key))) {
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
    console.log('res', res);
    fs.writeFile(cwd + 'find-useless-file.json', JSON.stringify(res, null, '\t'), {}, function (err) {
        if (err)
            console.log(err);
        console.log('文件创建成功，地址：' + cwd + fileName);
        console.log("!!!\u6CE8\u610F\uFF1A\u9ED8\u8BA4\u4F1A\u5728\u5F53\u524D\u76EE\u5F55\u4E0B\u751F\u6210\u4E00\u4E2A" + fileName + "\u6587\u4EF6");
        exec('open ' + cwd + fileName);
    });
};

exports.findUselessFile = findUselessFile;

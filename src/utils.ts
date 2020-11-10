import fs from 'fs'

const includeFile = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.html']

const matchSuffix = (str: string)=> {
    const res = str.match(/\.\w+/g)
    return res ? res[res.length-1] : ''
}

export const traverseFile= (src ,callback) => {
    let paths = fs.readdirSync(src).filter(item=> item !== 'node_modules');
    paths.forEach(function(path){
        var _src= src+'/'+path;
        const statSyncRes = fs.statSync(_src);
        if(statSyncRes.isFile() && includeFile.includes(matchSuffix(path))) {    //如果是个文件则拷贝
            callback(_src)
        } else if(statSyncRes.isDirectory()){ //是目录则 递归 
            traverseFile(_src, callback)
        }
    });
}
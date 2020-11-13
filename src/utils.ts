import fs from 'fs'

const includeFile = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.html', '.less']

const matchSuffix = (str: string)=> {
    const res = str.match(/\.\w+/g)
    return res ? res[res.length-1] : ''
}

export const traverseFile= (src ,callback) => {
    let paths = fs.readdirSync(src).filter(item=> item !== 'node_modules')
    paths.forEach(path => {
        const _src = src + '/' + path
        const statSyncRes = fs.statSync(_src)
        if(statSyncRes.isFile() && includeFile.includes(matchSuffix(path))) {
            callback(_src)
        } else if(statSyncRes.isDirectory()){ //是目录则 递归 
            traverseFile(_src, callback)
        }
    })
}

export const deleteEmptyFolder =  (path) => {
	let files = [];
	if(fs.existsSync(path)) {
		files = fs.readdirSync(path);
		files.forEach( file => {
			const curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) {
                if(fs.readdirSync(curPath).length) {
                    deleteEmptyFolder(curPath)
                } else {
                    fs.rmdirSync(curPath)
                }
            }
        });
        if(!fs.readdirSync(path).length) {
            fs.rmdirSync(path);
        }
	}
}
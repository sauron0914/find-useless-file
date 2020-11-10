import { traverseFile } from './utils'
const fs = require('fs')
const exec = require('child_process').exec
const Grid = require("console-grid");
const cwd = process.cwd() + '/'

const aliasReg =  cwd + 'src'

const fileName = 'find-useless-components.json'

const findUselessComponents  = ()=> {

    const componentsPaths = {}

    traverseFile(cwd + 'src/components', path => {
        componentsPaths[path.replace(aliasReg, '@').replace(/(\/index)?.js(x)?/g, '')] = 0
    })


    traverseFile(cwd + 'src/containers', path => {
        const readFileSyncRes = fs.readFileSync(path , 'utf8')
        Object.entries(componentsPaths).reduce((pre, [key, value])=> {
            if(readFileSyncRes.includes(key)) {
                componentsPaths[key]++
            }
            return pre
        }, {})
    })

    const res = Object.entries(componentsPaths).reduce((pre, [key, value])=> {
        if(!value) {
            pre.push(key)
        }
        return pre
    }, [])

    fs.writeFile(cwd+'find-useless-components.json', JSON.stringify(res, null, '\t'), {} ,function(err){
        if(err) console.log(err)
        console.log('文件创建成功，地址：' + cwd+fileName);
        console.log(`!!!注意：默认会在当前目录下生成一个${fileName}文件`)
        exec( 'open ' + cwd + fileName)
    })

}

export { findUselessComponents }
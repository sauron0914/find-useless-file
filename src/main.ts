import { traverseFile } from './utils'
const fs = require('fs')
const exec = require('child_process').exec
const cwd = process.cwd() + '/'

const aliasReg =  cwd + 'src'

const fileName = 'find-useless-file.json'

const argvs = process.argv.splice(3).map(item=> {
    if(item.substr(item.length -1) === '/') {
        return item.substr(0, item.length -1)
    }
    return item
})

if(argvs.length !== 2) {
    throw new Error('仅支持命令 find-useless-file do filePath1 filePath2');
}

// const aliasSrc = path => dealIndexJS(path.replace(aliasReg, '@'))

const dealIndexJS = path => path.replace(/(\/index)?.js(x)?/g, '')

const findUselessFile  = ()=> {

    console.log('开始查找文件....')

    const componentsPaths = {}

    traverseFile(cwd + argvs[0], path => {
        componentsPaths[path] = 0
    })

    traverseFile(cwd + argvs[1], path => {
        const readFileSyncRes = fs.readFileSync(path , 'utf8')
        const currentPathLevel = path.match(/[@\w\/-]+\//ig)[0]
        const fromListFrom = readFileSyncRes.match(/(from ['.@\/\w-]+')/g) || []
        const fromList = readFileSyncRes.match(/(import ['.@\/\w-]+')/g) || []

        // 相对路径匹配
        const matchRes: string[] = [...fromListFrom, ...fromList].map(item=> {
            return item.replace("from ", '').replace("import ").replace(/\'/g, '')
        }).filter(item=> {
            return item.includes('.') | item.includes('@')
        }).map(item=>{
            if(item.includes('@')) {
                return item.replace('@', aliasReg)
            } else {
                const levelCount = item.match(/\.\./g)
                if(levelCount) {
                    const arr = currentPathLevel.split('/')
                    return arr.splice(0, arr.length - (levelCount.length+1)).join('/') + item.replace(/\.\./g, '')
                } else {
                    return item.replace('./', currentPathLevel)
                }
            }
        })

        Object.keys(componentsPaths).forEach((key)=> {
            if(matchRes.some(item=> item.includes(dealIndexJS(key)))) {
                componentsPaths[key]++
            }
        })
    })

    const res = Object.entries(componentsPaths).reduce((pre, [key, value])=> {
        if(!value) {
            pre.push(key.replace(cwd, ''))
        }
        return pre
    }, [])

    fs.writeFile(cwd+'find-useless-file.json', JSON.stringify(res, null, '\t'), {} ,function(err){
        if(err) console.log(err)
        console.log('文件查找成功，存放地址：' + cwd+fileName);
        console.log(`!!!注意：默认会在当前目录下生成一个${fileName}文件`)
        exec( 'open ' + cwd + fileName)
    })

}

export { findUselessFile }
import { traverseFile } from './utils'
const fs = require('fs')
const exec = require('child_process').exec
const cwd = process.cwd() + '/'

const aliasReg =  cwd + 'src'

const fileName = 'find-useless-file.json'

const dealIndexJS = path => path.replace(/(\/index)?(.(j|t)s(x)?)?/g, '')

const findUselessFile  = ()=> {

    const argvs = process.argv.splice(3).map(item=> {
        if(item.substr(item.length -1) === '/') {
            return item.substr(0, item.length -1)
        }
        return item
    })
    
    if(argvs.length !== 2) {
        throw new Error('仅支持命令 find-useless-file find filePath1 filePath2');
    }

    exec( 'rm -rf ' + cwd + fileName)

    console.log('🏊🏻 🏊🏻 🏊🏻 开始查找文件...')

    const componentsPaths = {}

    // 存一份需要检测的路径
    traverseFile(cwd + argvs[0], path => {
        componentsPaths[path] = 0
    })

    console.log(`🎉 🎉 🎉 ${argvs[0]} 目录下共检测到${Object.keys(componentsPaths).length}个文件`)

    console.log('🏊🏻 🏊🏻 🏊🏻 开始匹配文件...')

    traverseFile(cwd + argvs[1], path => {
        const readFileSyncRes = fs.readFileSync(path , 'utf8')
        const currentPathLevel = path.match(/[@\w\/-]+\//ig)[0]

        // 找到 from 'react', from './detail.js' 等
        const fromList = readFileSyncRes.match(/(from ['.@\/\w-]+')/g) || []

        // 找到 import './index.less', import './detail.less' 等
        const importList = readFileSyncRes.match(/(import ['.@\/\w-]+')/g) || []

        // 找到 import('@/containers/a/purchase/apply')  require('channelOpera/pages/home')
        const requireList = readFileSyncRes.match(/(import|require)\(['.@\/\w-']+'/g) || []

        // 相对路径匹配
        const matchRes: string[] = [...fromList, ...importList, ...requireList].map(item=> {
            // 去掉 "from ", "import ", "import(", "require("
            return item.replace("from ", '')
                .replace("import ", '')
                .replace("import(", '')
                .replace("require(", '')
                .replace(/\'/g, '')
        }).map(item=>{
            // 兼容引用文件时，结尾为 '/' 的情况
            if(item.substr(item.length -1) === '/') {
                return item.substr(0, item.length -1)
            }
            return item
        }).filter(item=> {
            // 去掉第三方库 "react" "vue" "moment" 等
            return item.includes('.') || item.includes('@')
        }).map(item=>{
            // 相对路径转化成绝对路径
            
            // 转化 alias @ 
            if(item.includes('@')) {
                return item.replace('@', aliasReg)
            } else {
                // 转化 ../../../ 
                const levelCount = item.match(/\.\./g)
                if(levelCount) {
                    const arr = currentPathLevel.split('/')
                    return arr.splice(0, arr.length - (levelCount.length+1)).join('/') + '/' + item.replace(/\.\.\//g, '')
                } else {
                    // 非 ../../ ../ 等，应该只是 ./
                    return item.replace('./', currentPathLevel)
                }
            }
        })

        if(!matchRes.length) return
 
        // 匹配到用到的路径，就直接把componentsPaths的key delete
        Object.keys(componentsPaths).forEach((key)=> {
            if(matchRes.some(item=> dealIndexJS(item) === dealIndexJS(key))) {
                delete componentsPaths[key]
            }
        })
    })

    if(!Object.keys(componentsPaths).length) {
        console.log('🎉 🎉 🎉 没有未被使用的文件，皆大欢喜！！！')
        return
    }

    fs.writeFile(
        cwd+'find-useless-file.json', 
        JSON.stringify(Object.keys(componentsPaths).map(item=> item.replace(cwd, '')), null, '\t'),
        {},
        function(err){
            if(err) console.log(err)
            console.log('🎉 🎉 🎉 文件查找成功，存放地址：' + cwd+fileName);
            console.log('💝 💝 💝共找到' + Object.keys(componentsPaths).length + '个未被使用的文件')
            console.log(`❗ ❗ ❗ 注意：默认会在当前目录下生成一个${fileName}文件`)
            exec( 'open ' + cwd + fileName)
        }
    )
}

const delUselessFile = ()=> {

    console.log('🔥 🔥 🔥 I am sure you know what you are doing!!!')

    console.log('🏊🏻 🏊🏻 🏊🏻 delete useless file...')

    const readFileSyncRes = fs.readFileSync(cwd + fileName , 'utf8')

    const list = JSON.parse(readFileSyncRes)

    list.forEach(item => {
        fs.unlinkSync(item);
    });

    fs.unlinkSync(cwd + fileName)

    console.log('🎉 🎉 🎉delete success')
    
}

export { findUselessFile, delUselessFile }
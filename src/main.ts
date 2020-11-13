import { deleteEmptyFolder, traverseFile } from './utils'
const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const cwd = process.cwd() + '/'

const fileName = 'find-useless-file.json'

// const dealIndexJS = path => path.replace(/(\/index)?(.(((j|t)s(x)?)|(less|scss)))?/g, '')
const dealIndexJS = path => {

    const res = path.split('.')

    const noSuffix = res.length > 1 ? res.slice(0, res.length -1).join('.') : path

    return noSuffix.replace(/\/index$/g, '')
    
}
 
const Reg = {
    form: /(from (('[.@\/\w-]+')|("[.@\/\w-]+)"))/g,
    import: /(import (('[.@\/\w-]+')|("[.@\/\w-]+)"))/g,
    require: /(import|require)\((('[.@\/\w-]+')|("[.@\/\w-]+)")/g,
}

// 默认被过滤的文件
const filterFiles = [
    'src/index.ts',
    'src/index.js',
    'src/global.d.ts',
]

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
         // 过滤掉 src/global.d.ts src/index.js src/index.ts
        if(filterFiles.some(item=> item === path.replace(cwd, ''))) return

        componentsPaths[path] = 0
    })

    console.log(`🎉 🎉 🎉 ${argvs[0]} 目录下共检测到${Object.keys(componentsPaths).length}个文件`)

    console.log('🏊🏻 🏊🏻 🏊🏻 开始检测文件...')

    console.log('❗ ❗ ❗ 文件检测越多，检测范围越大，用时越久...')

    traverseFile(cwd + argvs[1], filePath => {

        const readFileSyncRes = fs.readFileSync(filePath , 'utf8')

        // 找到 from 'react', from './detail.js' 等
        // const fromList = readFileSyncRes.match(/(from ['.@\/\w-]+')/g) || []
        const fromList = readFileSyncRes.match(Reg.form) || []

        // 找到 import './index.less', import './detail.less' @import './index.less' 等
        // const importList = readFileSyncRes.match(/(import ['.@\/\w-]+')/g) || []
        const importList = readFileSyncRes.match(Reg.import) || []

        // 找到 import('@/containers/a/purchase/apply')  require('channelOpera/pages/home')
        // const requireList = readFileSyncRes.match(/(import|require)\(['.@\/\w-']+'/g) || []
        const requireList = readFileSyncRes.match(Reg.require) || []
        
        // 相对路径匹配
        const matchRes: string[] = [...fromList, ...importList, ...requireList].map(item=> {
            // 去掉 "from ", "import ", "import(", "require(", "@import "
            return item.replace("from ", '')
                .replace("import ", '')
                .replace("import(", '')
                .replace("require(", '')
                .replace(/(\'|\")/g, '')
        }).map(item=>{
            // 兼容引用文件时，结尾为 '/' 的情况
            if(item.substr(item.length -1) === '/') {
                return item.substr(0, item.length -1)
            }
            return item
        }).filter(item=> {
            // 去掉第三方库 "react" "vue" "moment" 等
            const firstStr = item.substr(0,1)
            return firstStr === '.' || firstStr === '@'
        }).map(item=>{
            // 相对路径转化成绝对路径
            // 转化 alias @ 
            if(item.includes('@')) {
                return item.replace('@', cwd + 'src')
            }
            // 其他相对路径转化
            return path.resolve(filePath, '..', item)
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

    console.log('🎉 🎉 🎉delete success!!!')
    
}

const delEmptyDir = () => {
    const argvs = process.argv.splice(3)
    if(argvs.length !== 1) {
        throw new Error('仅支持命令 find-useless-file delDir filePath');
    }

    console.log('🏊🏻 🏊🏻 🏊🏻 delete empty folder...')

    deleteEmptyFolder(cwd + argvs[0])

    console.log('🎉 🎉 🎉delete success!!!')
}

export { findUselessFile, delUselessFile, delEmptyDir }
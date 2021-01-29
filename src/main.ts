import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import ora from 'ora'
import { deleteEmptyFolder,
    delUselessFileExec,
    traverseFile,
    getArgvs,
    isChangesNotStagedForCommit
} from './utils'

const cwd = process.cwd() + '/'

const fileName = 'find-useless-file.json'

const suffixs = ['js', 'ts', 'tsx', 'jsx']

// const dealIndexJS = path => path.replace(/(\/index)?(.(((j|t)s(x)?)|(less|scss)))?/g, '')
const dealIndexJS = path => {

    const res = path.split('.')

    let noSuffix = suffixs.includes(res[res.length -1]) ? res.slice(0, res.length -1).join('.') : path

    while(noSuffix.endsWith('/index')) {
        noSuffix = noSuffix.replace(/\/index$/g, '')
    }

    return noSuffix
    
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

let queryNumberOfTimes = 0

const dealComponentsPaths = (initComponentsPaths, uselessFiles = [], argvs) => {

    const currentComponentsPaths = {...initComponentsPaths}

    const spinner = ora(chalk.blueBright(`第${++queryNumberOfTimes}次遍历文件...`)).start();

    uselessFiles.forEach(item=> {
        delete currentComponentsPaths[item]
    })

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
            // const firstStr = item.substr(0,1)
            return item[0] === '.' || (item[0] + item[1] === '@/')
        }).map(item=>{
            // 相对路径转化成绝对路径
            // 转化 alias @ 
            if(item.startsWith('@')) {
                return item.replace('@', cwd + 'src')
            }
            // 其他相对路径转化

            return path.resolve(filePath, '..', item)
        })

        if(!matchRes.length) return

        // 匹配到用到的路径，就直接把componentsPaths的key delete
        Object.keys(initComponentsPaths).forEach((key)=> {
            if(matchRes.some(item=> { 
                return dealIndexJS(item) === dealIndexJS(key)
            })) {
                delete currentComponentsPaths[key]
            }
        })
    })

    uselessFiles.push(...Object.keys(currentComponentsPaths))

    spinner.succeed(chalk.greenBright(`第${queryNumberOfTimes}次遍历文件成功`));

    if(!Object.keys(currentComponentsPaths).length) return uselessFiles

    return dealComponentsPaths(initComponentsPaths, uselessFiles, argvs )
}

const findUselessFileDeal  = ()=> {
    const argvs = getArgvs().map(item=> {
        if(item.substr(item.length -1) === '/') {
            return item.substr(0, item.length -1)
        }
        return item
    })
    
    if(argvs.length !== 2) {
        console.log(chalk.red('仅支持命令 dian-codemod find-useless-file filePath1 filePath2'))
        return 
    }

    exec( 'rm -rf ' + cwd + fileName)

    console.log('🏊🏻 🏊🏻 🏊🏻 开始查找文件...')

    const initComponentsPaths = {}

    // 存一份需要检测的路径
    traverseFile(cwd + argvs[0], path => {
         // 过滤掉 src/global.d.ts src/index.js src/index.ts
        if(filterFiles.some(item=> item === path.replace(cwd, ''))) return

        initComponentsPaths[path] = 0
    })

    const uselessFiles = []

    console.log(`🎉 🎉 🎉 ${argvs[0]} 目录下共检测到${Object.keys(initComponentsPaths).length}个文件`)

    console.log(chalk.yellowBright('可能会对文件多次遍历便于一次性找到所有未被使用的文件...'))

     
    const resComponents = dealComponentsPaths(initComponentsPaths, uselessFiles, argvs)

    if(!resComponents.length) {
        console.log(chalk.greenBright('🎉 🎉 🎉 没有未被使用的文件，皆大欢喜！！！'))
        return
    }

    fs.writeFile(
        cwd+'find-useless-file.json', 
        JSON.stringify(resComponents.map(item=> item.replace(cwd, '')), null, '\t'),
        {},
        function(err){
            if(err) console.log(err)
            console.log('🎉 🎉 🎉 ' + chalk.greenBright(' 文件查找成功，存放地址：' + cwd+fileName));
            console.log('💝 💝 💝 共找到' + resComponents.length + '个未被使用的文件')
            console.log('❗ ❗ ❗' + chalk.yellowBright(` 注意：默认会在当前目录下生成一个${fileName}文件`))
            exec( 'open ' + cwd + fileName)
            delUselessFileExec(fileName).then(res=> {
                delUselessFile().then(()=> {
                    delEmptyDir(cwd + argvs[1])
                })
            })
        }
    )
}

const delUselessFile = ()=> {
    return new Promise(resolve => {
        resolve((()=>{
            console.log('🔥 🔥 🔥 I am sure you know what you are doing!!!')

            console.log('🏊🏻 🏊🏻 🏊🏻 delete useless file...')

            const readFileSyncRes = fs.readFileSync(cwd + fileName , 'utf8')

            const list = JSON.parse(readFileSyncRes)

            list.forEach(item => {
                fs.unlinkSync(item);
            });

            fs.unlinkSync(cwd + fileName)

            console.log('🎉 🎉 🎉delete success!!!')
        })())
    })
}

const delEmptyDir = (path) => {
    
    console.log('🏊🏻 🏊🏻 🏊🏻 delete empty folder...')
    deleteEmptyFolder(path)

    console.log('🎉 🎉 🎉delete success!!!')
}

const findUselessFile = ()=> {
    isChangesNotStagedForCommit().then(()=> {
        findUselessFileDeal()
    })
}

export { findUselessFile  }
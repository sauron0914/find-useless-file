import fs from 'fs'
import { prompt } from 'inquirer'
import { exec } from 'child_process'
import chalk from 'chalk'

const matchSuffix = (str: string)=> {
    const res = str.match(/\.\w+/g)
    return res ? res[res.length-1] : ''
}

/**
 * 获取node命令参数
 * 
 *  getArgvs() 返回 [file-path1, files-path2]
*/
export const getArgvs = () => [...process.argv].splice(3)

/**
 * src 你需要遍历的文件夹
 * 
 * callback 返回src下文件夹一个文件path
 * 
 * includeFile 只遍历你想要的文件 like ['.less', '.ts', '.tsx'] 只返回包含上述数组中的文件path，不传默认返回全部文件path
 * 
 * 默认过文件夹下 node_modules 文件
*/
export const traverseFile:(
    src: string,
    callback: (path: string)=> void,
    includeFile?: string[]
) => void = (src ,callback, includeFile = []) => {
    let paths = fs.readdirSync(src).filter(item=> item !== 'node_modules')
    paths.forEach(path => {
        const _src = src + '/' + path
        const statSyncRes = fs.statSync(_src)
        if(statSyncRes.isFile() && (!includeFile.length || includeFile.includes(matchSuffix(path))) ) {
            callback(_src)
        } else if(statSyncRes.isDirectory()){ //是目录则 递归 
            traverseFile(_src, callback, includeFile)
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

export const delUselessFileExec = (fileName) => {
    console.log(`❗ ❗ ❗请仔细检查${fileName}文件，删除一些可能是你需要的不想被删除的文件`)
    const promptList = [
        {
            type: 'choices',
            name: 'isContinue',
            message: `删除${fileName}中包含的文件: (Y/N)?`,
            default: 'Y'
        },
    ]
    return new Promise((resolve, reject)=> {
        prompt(promptList).then(res=> {
            res.isContinue === 'Y' && resolve(true)
        }).catch(()=> {
            reject()
        })
    })
}

/**
 * prompt 提示 是否继续操作
*/
export const continueExec = ()=> {
    const promptList = [
        {
            type: 'choices',
            name: 'isContinue',
            message: '是否继续操作: (Y/N)?',
            default: 'N'
        },
    ]
    return new Promise((resolve, reject)=> {
        prompt(promptList).then(res=> {
            res.isContinue === 'Y' && resolve(true)
        }).catch(()=> {
            reject()
        })
    })
}

/**
 * 检测当前分支status，若是有被修改的文件，则提示
*/
export const isChangesNotStagedForCommit= () => {
    const CHANGES_NOT_STAGED_FOR_COMMIT = 'Changes not staged for commit'
   
    return new Promise(resolve=> {
        exec('git status', (err, stdout, stderr) => {
            if (err) {
                console.log(chalk.red('当前目录并未检测到git信息, 执行命令可能会对文件造成无法恢复的情况'))
                continueExec().then(()=> {
                    resolve(true)
                })
            } else {
                if(stdout.includes(CHANGES_NOT_STAGED_FOR_COMMIT)) {
                   console.log(chalk.red('你有变更的文件未提交，为了确保你的分支不被破坏，请处理后再次执行此命令'))
                   console.log(chalk.red('若是你确保分支安全情况下，你仍可以继续操作'))
                   continueExec().then(()=> {
                        resolve(true)
                    })
                } else resolve(true)
            }
        })
    })
}
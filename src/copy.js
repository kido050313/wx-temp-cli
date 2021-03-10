const chalk = require('chalk');
const fs = require('fs');

/**
 * 复制文件
 * @param {String} from copied filed
 * @param {String} to target file
 */
function copyFile(from, to) {
    console.log(chalk.yellow("复制文件"+from))
    fs.writeFileSync(to, fs.readFileSync(from));
    return Promise.resolve();
}

/**
 * 复制文件
 * 同步的方式
 * @param {String} from
 * @param {String}  to
 */
async function copyDir(from, to) {
    console.log("=====copyDir开始=====")
    console.log(from)
    console.log(to)
    try {
        await isExistSync(to);
    } catch (error) {
        // 不存在，则创建文件夹
        fs.mkdirSync(to)
    }
    const paths = fs.readdirSync(from);
    paths.forEach(async(path) => {
        const src = `${from}/${path}`;
        const dist = `${to}/${path}`;
        const fileType = await justFileOrDir(src);
        if(fileType === 'file') {
            fs.writeFileSync(dist, fs.readFileSync(src));
            console.log(chalk.magenta(`🦄 ${src}`))
        } else if (fileType === 'dir') {
            copyDir(src, dist);
        }
    })
}

/**
 * 同步地测试用户对 path 指定的文件或目录的权限,检查是否存在
 * @param {String} path 
 * 
 */
 function isExistSync(path) {
     return fs.accessSync(path)
 }

 /** 
  * 检查给定路径的文件属性
  * @param {String} src
  * @return {Promise}
  */
 function justFileOrDir(src) {
    return new Promise((resolve, reject) => {
        // 打开、读取或写入文件，如果文件不可用，则处理引发的错误
        fs.stat(src, (err, stat) => {
            if(err) {
                reject(err)
            }
            if(stat.isFile()) {
                resolve('file')
            } else if(stat.isDirectory()) {
                resolve('dir')
            }
        })
    })
 }

 module.exports = {
     copyFile,
     copyDir
 }
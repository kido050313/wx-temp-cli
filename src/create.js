const ora = require('ora');
const execa = require('execa');
const chalk = require('chalk');
const fs = require('fs');
const copyTask = require('./copy');

// spinner
const spinner = ora(`loading.../n`);

let path = `${process.cwd()}`;
console.log(path)

// 创建project.config.json文件
async function create(props) {
    const { projectName, appId, libVersion } = props;
    spinner.start();
    path = `${path}/${projectName}`;

    try {
        await execa('mkdir', [path]);
        // 复制模板
        await copyTemplate();

        // 读取模板project.config.json 文件，更新配置信息
        const wechartConfig = await readWechartProjectConfigJson();
        wechartConfig.appid = appId;
        wechartConfig.projectname = projectName;
        wechartConfig.libVersion = libVersion;

        const configStr = JSON.stringify(wechartConfig);
        await writeWechartProjectConfigJson(projectName, configStr);
        spinner.stop();
        console.log(chalk.green(`
        *****************************
        * 你的项目 --- "${projectName}" 创建成功
        * 
        * 你可以使用微信开发者工具打开你的小程序项目--- "${projectName}"
        * 
        * ok ✔✔✔😀😜😊
        * 
        * ***************************
        `))

    } catch (error) {
        console.log(chalk.red(error))
    }
}

// 读取小程序模板 project.config.json配置
async function readWechartProjectConfigJson() {
    return new Promise((resolve, reject) => {
        fs.readFile(`${__dirname}/templates/project.config.json`, function(err, data) {
            if(err) {
                reject(err)
            }
            resolve(JSON.parse(data.toString()))
        })
    })
}

// 修改小程序模板 project.config.json配置
async function writeWechartProjectConfigJson(path, str) {
    return new Promise((resolve, reject) => {
        fs.writeFile(`${path}/project.config.json`, str, function(err, data) {
            if(err) {
                reject(err)
            }
            resolve()
        })
    })
}

// 复制模板
async function copyTemplate() {
    copyTask.copyDir(`${__dirname}/templates`, path);
    return Promise.resolve();
}

exports.create = create;
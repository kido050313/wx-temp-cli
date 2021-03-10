const inquirer = require('inquirer');
const chalk = require('chalk');
const createTask = require('../src/create');

// 与命令行交互，询问
const promptQuestions = async() => {
    // 创建验证
    const validateProjectName = async(input) => {
        const regex = /^[a-zA-Z0-9\-\_]+$/;
        const isValid = regex.test(input);
        return isValid ? true : chalk.red("无效的项目名");
    }

    const validateAppid = async(input) => {
        const regex = /^wx[a-z0-9]+$/;
        const isValid = regex.test(input);
        return isValid ? true : chalk.red("无效的小程序Id");
    }

    // 创建交互问题
    const questions = [
        {
            type: 'input',
            name: 'projectName',
            message: '请输入项目名称',
            transformer: function(input) {
                return chalk.green(input)
            },
            validate: validateProjectName
        },
        {
            type: 'input',
            name: 'appId',
            message: '请输入小程序AppId',
            transformer: function(input) {
                return chalk.green(input)
            },
            validate: validateAppid
        }
    ];

    const answers = await inquirer.prompt(questions);
    const projectOptions = {};
    projectOptions.projectName = answers.projectName;
    projectOptions.appId = answers.appId;
    projectOptions.libVersion = '2.10.4'; // 设置微信小程序默认调试基础库
    projectOptions.sass = answers.sass;
    return projectOptions;
}

// 命令处理
const parseArgs = rawArgs => {
    const firstArg = rawArgs[2] ? rawArgs[2].toLowerCase() : null;
    const secondArg = rawArgs[3] ? rawArgs[3] : null;
    const action = firstArg === 'i' ? 'init' : firstArg === 'init' ? 'init' : null;
    const projectName = action === 'init' && secondArg ? secondArg : 'miniapp-init';
    return {
        action,
        projectName
    }
}

// 获取用户命令并执行
const cli = async(args) => {
    const { action, projectName } = parseArgs(args);

    if(!action) {
        console.log(chalk.red('if you want init project please input wx-temp-cli init yourProjectName'))
    }
    switch(action) {
        case 'init':
            const projectOptions = await promptQuestions();
            await createTask.create(projectOptions);
            break;
    }
}

exports.cli = cli;
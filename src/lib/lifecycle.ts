import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { startListenStdin } from './stdin_listener';
import { createConfigFile, applyConfigFile } from './config';
import { general } from './options';
import { showWelcomeMessage } from './welcome';
import commander from 'commander';
import { watcher } from './watcher';
import { commandMap } from './identifier';
import { parseCommand } from './parse_command';
import { isInfo } from '../definition';
import { printInfo } from './print';
const {version} = require('../../package.json');

export let configDir = path.join(os.homedir(),'.lrc_edit');

export let argsOption:{
    doWatcherMode?:boolean;//
    noWarning?:boolean;
    execFilePath?:string;//
    loadFilePath?:string;//
    execCommand?:string;//
    configDir?:string;//
    resetConfig?:boolean;//
} = {};

export function start(){
    parseArgs();
    if(argsOption.configDir){
        configDir = argsOption.configDir;
    }
    if(argsOption.doWatcherMode){
        watcher(path.join(configDir,'.watcher'));
    }else{
        if(!fs.existsSync(configDir)){
            fs.mkdirSync(configDir);
        }
        createConfigFile();
        applyConfigFile();
        if(general.showWelcomeMessage){
            showWelcomeMessage();
        }

        if(argsOption.loadFilePath){
            commandMap.get('open')!.exec([argsOption.loadFilePath]);
        }
        if(argsOption.execCommand){
            let res = parseCommand(argsOption.execCommand);
            if(!isInfo(res)){
                commandMap.get(res.name)!.exec(res.args);
            }
        }
        if(argsOption.execFilePath){
            let commands = fs.readFileSync(argsOption.execFilePath).toString().split('\n');
            for(let cmd of commands){
                let res = parseCommand(cmd);
                if(!isInfo(res)){
                    commandMap.get(res.name)!.exec(res.args);
                }else{
                    break;
                }
            }
        }
        startListenStdin();
    }
}

export function stopProgram(code?:number){
    preExit();
    process.exit(code);
}

function preExit(){
    if(fs.existsSync(path.join(configDir,'.watcher'))){
        fs.unlinkSync(path.join(configDir,'.watcher'));
    }
};

export function parseArgs(){
    
    commander
        .version(version,'-v, --version','Print lyric editor version.')
        .option('-l, --load-file <path>','Open a file.')
        .option('-f, --exec-file <path>','Execute commands from a file.')
        .option('-e, --exec <command>','Execute command.')
        .option('--no-warning','Silence all warning.')
        .option('--config-dir <path>','Specify the config directory.')
        .option('--reset-config','Reset config.')
        .command('watcher','Enter watcher mode.')
            .action(()=>{
                argsOption.doWatcherMode = true;
            });
    if(process.argv[2]){
        commander.parse(process.argv);
    }
    argsOption.execCommand = commander.exec;
    argsOption.execFilePath = commander.execFile;
    argsOption.loadFilePath = commander.loadFile;
    argsOption.noWarning = !commander.warning;
    argsOption.configDir = commander.configDir;
    argsOption.resetConfig = commander.resetConfig;
}
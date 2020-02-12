import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { startListenStdin } from './stdin_listener';
import { createConfigFile, applyConfigFile } from './config';
import { general } from './options';
import { showWelcomeMessage } from './welcome';
import commander from 'commander';
import { watcher } from './watcher';
const {version} = require('../../package.json');

export let configDir = path.join(os.homedir(),'.lrc_edit');

export let argsOption:{
    doWatcherMode?:boolean;
    noWarning?:boolean;
    execFilePath?:string;
    loadFilePath?:string;
    execCommand?:string;
    configDir?:string;
    resetConfig?:boolean;
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
        .option('-i, -interactive','Enter interactive mode (Default in this mode).')
        .option('-l, --load-file <path>','Open a file.')
        .option('-f, --exec-file <path>','Execute commands from a file.')
        .option('-e, -exec <command>','Execute command.')
        .option('--no-warning','Silence all warnings.')
        .option('--config-dir <path>','Specify the config directory.')
        .option('--reset-config','Reset config.')
        .command('watcher','Enter watcher mode.')
            .action(()=>{
                argsOption.doWatcherMode = true;
            });
    commander.parse([...process.argv,'-i']);
    argsOption.execCommand = commander.exec;
    argsOption.execFilePath = commander.execFile;
    argsOption.loadFilePath = commander.loadFile;
    argsOption.noWarning = commander.noWarning;
    argsOption.configDir = commander.configDir;
}
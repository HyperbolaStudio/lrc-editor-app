import chalk from 'chalk';
import { ConsoleInfo } from '../definition';
import { HMSTime, BeatTime } from '@hypst/time-beat-format';
import stringWidth from 'string-width';
import { general } from './options';
import { argsOption } from './lifecycle';
import { unsavedWork } from '../commands/exit';

export function printInfo(info:ConsoleInfo,line?:string,path?:string,stream:NodeJS.WritableStream = process.stderr){
    switch(info.type){
        case 'Info':
            stream.write(chalk.white.bgBlue.bold(general.endLine+'(i)Info')+' ');
            break;
        case 'Warning':
            if(argsOption.noWarning)return info;
            stream.write(chalk.black.bgYellow.bold(general.endLine+'(!)Warning')+' ');
            break;
        case 'Error':
            stream.write(chalk.bgRedBright.bold(general.endLine+'(x)Error')+' ');
            break;
        case 'Fatal':
            stream.write(chalk.bgRed.bold(general.endLine+'(X)Fatal')+' ');
            break;
    }
    stream.write(chalk.reset(info.message)+general.endLine);
    if(path){
        stream.write(chalk.reset(path));
    }
    if(info.line){
        stream.write(chalk.reset(`:${info.line}`));
    }
    if(info.column){
        stream.write(chalk.reset(`:${info.column}`));
    }
    stream.write(general.endLine);
    if(line){
        stream.write(line+general.endLine);
        for(let i=0;info.column&&i<info.column-1;i++){
            stream.write(' ');
        }
        stream.write(chalk.green('^'+general.endLine));
    }
    return info;
}

function stringColor(value:any):string{
    if(typeof(value) == 'string' || value instanceof String){
        return value as string;
    }
    if(typeof(value) == 'number' || value instanceof Number){
        return chalk.yellow(value.toString());
    }
    if(typeof(value) == 'boolean' || value instanceof Boolean){
        return chalk.blue(value.toString());
    }else if(value === null){
        return chalk.grey.bold('null');
    }else if(value === undefined){
        return chalk.grey('undefined');
    }else if(value instanceof HMSTime){
        return chalk.magenta(`[${value.toString()}]`)
    }else if(value instanceof BeatTime){
        return chalk.magenta(`(${value.toString()})`)
    }else{
        return chalk.cyan(value.toString());
    }
}

export function printValue(...values:any[]){
    return function(sep?:string,end?:string,stream:NodeJS.WritableStream = process.stdout){
        if(!sep&&sep!='')sep = ' ';
        if(!end&&end!='')end = general.endLine;
        stream.write(values.map((value)=>{
            return stringColor(value);
        }).join(sep));
        stream.write(end);
    }
}

export function printTable(valueTable:any[][],stream:NodeJS.WritableStream = process.stdout){
    let width:number[] = [];
    for(let tr of valueTable){
        for(let i=0;i<tr.length;i++){
            let w = Math.ceil((stringWidth(stringColor(tr[i]))+1)/8);
            if(!width[i]){
                width[i] = w;
            }else{
                width[i] = Math.max(width[i],w);
            }
        }
    }
    for(let tr of valueTable){
        for(let i=0;i<tr.length;i++){
            printValue(tr[i])('','',stream);
            let tabWidth = width[i]-Math.floor((stringWidth(stringColor(tr[i])))/8);
            while(tabWidth--){
                stream.write('\t');
            }
        }
        stream.write(general.endLine);
    }
}

export function printPrompt(prompt:string){
    if(process.stdout.isTTY && !argsOption.doWatcherMode){
        if(unsavedWork.hasUnsavedWork){
            process.stdout.write('*'+prompt+' ')
        }else{
            process.stdout.write(prompt+' ');
        }
    }
}
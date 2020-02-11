import chalk from 'chalk';
import { ConsoleInfo } from '../definition';
import { HMSTime, BeatTime } from '@hypst/time-beat-format';
import { commandMap } from './identifier';
import stringWidth from 'string-width';

export function printInfo(info:ConsoleInfo,line?:string,path?:string){
    switch(info.type){
        case 'Info':
            process.stderr.write(chalk.white.bgBlue.bold('\n(i)Info')+' ');
            break;
        case 'Warning':
            process.stderr.write(chalk.black.bgYellow.bold('\n(!)Warning')+' ');
            break;
        case 'Error':
            process.stderr.write(chalk.bgRedBright.bold('\n(x)Error')+' ');
            break;
        case 'Fatal':
            process.stderr.write(chalk.bgRed.bold('\n(X)Fatal')+' ');
            break;
    }
    process.stderr.write(chalk.reset(info.message)+'\n');
    if(path){
        process.stderr.write(chalk.reset(path));
    }
    if(info.line){
        process.stderr.write(chalk.reset(`:${info.line}`));
    }
    if(info.column){
        process.stderr.write(chalk.reset(`:${info.column}`));
    }
    process.stderr.write('\n');
    if(line){
        process.stderr.write(line+'\n');
        for(let i=0;info.column&&i<info.column-1;i++){
            process.stderr.write(' ');
        }
        process.stderr.write(chalk.green('^\n'));
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
    return function(sep?:string,end?:string){
        if(!sep&&sep!='')sep = ' ';
        if(!end&&end!='')end = '\n';
        process.stdout.write(values.map((value)=>{
            return stringColor(value);
        }).join(sep));
        process.stdout.write(end);
    }
}

export function printTable(valueTable:any[][]){
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
            printValue(tr[i])('','');
            let tabWidth = width[i]-Math.floor((stringWidth(stringColor(tr[i])))/8);
            while(tabWidth--){
                process.stdout.write('\t');
            }
        }
        process.stdout.write('\n');
    }
}
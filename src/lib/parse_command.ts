import { PointerWrapper, Command, ConsoleInfo } from "../definition";
import {HMSTime,BeatTime} from '@hypst/time-beat-format';
import { beat as beatOption, hms as hmsOption } from "./options";
import { identifierMap, commandMap } from "./identifier";
import { printInfo, printValue } from "./print";
import leven from 'leven';

export function parseCommand(str:string):Command|ConsoleInfo{
    let hmsTimeRegExp = new RegExp(`\\[${HMSTime.HMS_REGEXP.source.slice(1,HMSTime.HMS_REGEXP.source.length-1)}\\]`);
    let beatTimeRegExp = new RegExp(`\\(${BeatTime.BEAT_REGEXP.source.slice(1,BeatTime.BEAT_REGEXP.source.length-1)}\\)`);
    let command:Command = {
        name:"",
        args:[],
    }
    str = str.trim();
    str+=' ';
    let i=0;
    let buf = "";
    for(;i<str.length;i++){
        try{
            if(str[i]=="'"||str[i]=='"'||str[i]=='`'){
                let pw = {ptr:i}
                command.args.push(parseString(str,pw));
                i=pw.ptr;
            }else if(/\s/.test(str[i])){
                if(command.name==''){
                    if(!commandMap.has(buf)){
                        printInfo({
                            type:'Error',
                            column:i-buf.length+1,
                            message:'Reference Error: Unknown command.',
                        },str);
                        let probCmd = ''
                        let probCmdDist = Infinity;
                        for(let [cmd] of commandMap){
                            let dist = leven(buf,cmd);
                            if(dist<probCmdDist){
                                probCmdDist = dist;
                                probCmd = cmd;
                            }
                        }
                        return printInfo({
                            type:'Info',
                            message:`Do you mean '${probCmd}'?`,
                        });
                    }
                    command.name = buf;
                    buf = '';
                }else if(buf==''){
                    continue;
                }else if(buf=='true'){
                    command.args.push(true);
                }else if(buf=='false'){
                    command.args.push(false);
                }else if(hmsTimeRegExp.test(buf)){
                    command.args.push(new HMSTime(buf.slice(1,buf.length-1),hmsOption));
                }else if(beatTimeRegExp.test(buf)){
                    command.args.push(new BeatTime({
                        ...beatOption,
                        isRelativeTime:!commandMap.get(command.name)!.isAbsoluteTime,
                    },buf.slice(1,buf.length-1)));
                }else if(identifierMap.has(buf)){
                    command.args.push(identifierMap.get(buf)!);
                }else if(!isNaN(Number(buf))){
                    command.args.push(Number(buf));
                }else{
                    throw new Error('s');
                }
                buf='';
            }else{
                buf+=str[i];
            }
        }catch(e){
            if(e.message =='s'){
                return printInfo({
                    type:'Error',
                    column:i-buf.length+1,
                    message:'Syntax Error: Unrecognized syntax or identifier.',
                },str);
            }else{
                return printInfo({
                    type:'Fatal',
                    column:i-buf.length+1,
                    message:e.message,
                },str);
            }
        }
    }
    return command;
}

export function parseString(str:string,pw:PointerWrapper){
    let strLeft = pw.ptr;
    let strEndChar = str[pw.ptr++];
    for(;pw.ptr<str.length;pw.ptr++){
        if(str[pw.ptr]==strEndChar && str[pw.ptr-1]!='\\'){
            return eval(`'${str.slice(strLeft+1,pw.ptr++)}'`);
        }
    }
    throw new Error('s');
}
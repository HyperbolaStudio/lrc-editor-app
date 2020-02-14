import {HMSTime,BeatTime} from '@hypst/time-beat-format';
import {LyricTag} from '@hypst/lrc-parser/dist/lib/definition';
import { AbstractPlugin } from './lib/plugin/abstract_plugin';
import { hms, beat } from './lib/options';

export interface IdentifierArg{
    identifier: string
}

export type ArgumentType = HMSTime|BeatTime|string|boolean|number;

export interface Command{
    name:string;
    args:ArgumentType[];
}

export interface PointerWrapper{
    ptr:number;
}

export interface ConsoleInfo{
    type:'Warning'|'Info'|'Error'|'Fatal';
    column?:number;
    line?:number;
    message:string;
}

export function isInfo(obj:any):obj is ConsoleInfo{
    return ['Warning','Info','Error','Fatal'].includes(obj.type) && obj.message;
}

export interface LyricStorage{
    duration:HMSTime;
    text:string;
}

export interface CommandStorage{
    exec:(args:ArgumentType[])=>any;
    description:string;
    overloads:string[];
}

export interface Step{
    name:string;
    undo:{
        exec:(undo:boolean,args:ArgumentType[])=>any;
        args:ArgumentType[];
    }
}

export interface IPCRequest{
    from:number;
    flag:string;
    content:any;
}

export interface IPCResponse{
    to:number;
    err:any;
    content:any;
}

export type TimeWrapper = {
    type:'HMSTime'|'BeatTime';
    time:number;
}

export type IPCArgumentType = number|string|boolean|TimeWrapper;

export function isTimeWrapper(val:IPCArgumentType):val is TimeWrapper{
    return typeof(val)=='object';
}

export function wrap(val:HMSTime):TimeWrapper&{type:'HMSTime'};
export function wrap(val:BeatTime):TimeWrapper&{type:'BeatTime'};
export function wrap<T extends string|number|boolean>(val:T):T;
export function wrap(val:ArgumentType):IPCArgumentType;
export function wrap(val:ArgumentType):IPCArgumentType{
    if(val instanceof HMSTime){
        return {
            type:'HMSTime',
            time:val.toMillisecond(),
        }
    }else if(val instanceof BeatTime){
        return {
            type:'BeatTime',
            time:val.toHMSTime().toMillisecond(),
        }
    }else{
        return val;
    }
}
export function deWrap(val:TimeWrapper&{type:'HMSTime'}):HMSTime;
export function deWrap(val:TimeWrapper&{type:'BeatTime'}):BeatTime;
export function deWrap<T extends string|number|boolean>(val:T):T;
export function deWrap(val:IPCArgumentType):ArgumentType;
export function deWrap(val:IPCArgumentType):ArgumentType{
    if(isTimeWrapper(val)){
        if(val.type=='HMSTime'){
            return new HMSTime(val.time,hms);
        }else{
            return new BeatTime(beat,new HMSTime(val.time,hms));
        }
    }else{
        return val;
    }
}

export interface LRCServerEvents{

    printInfo:{
        info:ConsoleInfo;
        line?:string;
        path?:string;
    }

    printTable:IPCArgumentType[][];

    printValue:{
        values:IPCArgumentType[];
        sep?:string;
        end?:string;
    }

    exec:{
        name:string;
        args:IPCArgumentType[];
    }

    setCommand:{
        name:string;
        description:string;
        overloads:string[];
    }

    registerLyricChange:string;

    getConfig:void;

    getConfigDir:void;

    getWorkUnsaved:void;


}

export interface LRCClientEvents{
    beatOptionChanged:{
        bpm:number,
        beat:number,
        subdiv:number,
    }
    watcherOptionChanged:{
        isAbsoluteTine:boolean,
        isBeatTime:boolean,
    }
    lyricChanged:{
        event:string;
        scope:{
            lyric:{
                duration:TimeWrapper;
                text:string;
            }[];
            absoluteTimeLyric:{
                duration:TimeWrapper;
                text:string;
            }[];
    
            filePath:string;
        }
    }

    commandExecuted:{
        name:string;
        args:IPCArgumentType[];
    }
}

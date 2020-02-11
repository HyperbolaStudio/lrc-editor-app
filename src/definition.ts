import {HMSTime,BeatTime} from '@hypst/time-beat-format';
import {LyricTag} from '@hypst/lrc-parser/dist/lib/definition';

export interface IdentifierArg{
    identifier: string
}

export type ArgumentType = IdentifierArg|HMSTime|BeatTime|string|boolean|number;

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
}

export interface Step{
    name:string;
    undo:{
        exec:(undo:boolean,args:ArgumentType[])=>any;
        args:ArgumentType[];
    }
}
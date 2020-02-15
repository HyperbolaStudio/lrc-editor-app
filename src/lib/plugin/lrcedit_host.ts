import { AbstractPlugin } from "./abstract_plugin"
import { LRCClientEvents, LRCServerEvents, ArgumentType, deWrap, wrap, IPCArgumentType, ConsoleInfo } from "../../definition";

export class LRCEditHost extends AbstractPlugin<LRCClientEvents,LRCServerEvents>{
    constructor(){
        super(process);
    }

    async exec(name:string,args:ArgumentType[]){
        return await this.sendRequest('exec',{
            name,
            args:args.map((arg)=>{
                if(arg){
                    return wrap(arg);
                }
            }) as IPCArgumentType[],
        });
    }

    async getConfig(){
        return await this.sendRequest('getConfig',undefined);
    }

    async getConfigDir(){
        return await this.sendRequest('getConfigDir',undefined);
    }

    async getWorkUnsaved(){
        return await this.sendRequest('getWorkUnsaved',undefined);
    }

    async printInfo(info:ConsoleInfo,line?:string,path?:string){
        return await this.sendRequest('printInfo',{
            info,
            line,
            path,
        });
    }

    async printTable(table:ArgumentType[][]){
        return await this.sendRequest('printTable',table.map((td)=>{
            return td.map((val)=>{
                if(val){
                    return wrap(val);
                }
            }) as IPCArgumentType[];
        }));
    }

    async printValue(values:ArgumentType[],sep?:string,end?:string){
        return await this.sendRequest('printValue',{
            values:values.map((val)=>{
                if(val){
                    return wrap(val);
                }
            }) as IPCArgumentType[],
            sep,
            end,
        });
    }

    async registerLyricChange(event:string){
        return await this.sendRequest('registerLyricChange',event);
    }

    async resumeStdin(){
        return await this.sendRequest('resumeStdin',undefined);
    }

    async setCommand(name:string,cmd:{
        description:string;
        overloads:string[];
        isAbsoluteTime?:boolean;
        pauseStdin?:boolean;
        exec:(args:ArgumentType[])=>void;
    }){
        return this.onRequest('commandExecuted',(req)=>{
            if(req.name == name){
                cmd.exec(req.args.map((val)=>{
                    if(val){
                        return deWrap(val);
                    }
                }) as ArgumentType[]);
            }
        }).sendRequest('setCommand',{
            name,
            description:cmd.description,
            overloads:cmd.overloads,
            pauseStdin:cmd.pauseStdin,
            isAbsoluteTime:cmd.isAbsoluteTime,
        });
    }
}
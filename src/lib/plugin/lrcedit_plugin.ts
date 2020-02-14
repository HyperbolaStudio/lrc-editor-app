import * as childProcess from 'child_process';
import { AbstractPlugin } from "./abstract_plugin";
import { LRCServerEvents, deWrap, LRCClientEvents, wrap } from "../../definition";
import { printInfo, printValue, printTable } from "../print";
import { commandMap } from "../identifier";
import { HMSTime, BeatTime } from "@hypst/time-beat-format";
import { beat, hms } from "../options";
import { config, configDir } from "../lifecycle";
import { unsavedWork } from "../../commands/exit";
import { scope, CommandsCollection } from '../../commands/lyricCommands';

export function convertIPCScope(scope:CommandsCollection):LRCClientEvents['lyricChanged']['scope']{
    return {
        lyric:scope.lyric.map((line)=>{
            if(!line)return line;
            return {
                duration:wrap(line.duration),
                text:line.text,
            }
        }),
        absoluteTimeLyric:scope._lyricPrefixCache.map((line)=>{
            if(!line)return line;
            return {
                duration:wrap(line.duration),
                text:line.text,
            }
        }),
        filePath:scope.filePath,
    }
}

export class LRCEditPlugin extends AbstractPlugin{
    constructor(path:string){
        super(childProcess.fork(path));
        this._registerEvents();
    }

    on<K extends keyof LRCServerEvents>(event:K,cb:(arg:LRCServerEvents[K])=>void){
        return super.on(event,cb);
    }
    once<K extends keyof LRCServerEvents>(event:K,cb:(arg:LRCServerEvents[K])=>void){
        return super.once(event,cb);
    }
    off<K extends keyof LRCServerEvents>(event:K,cb:(arg:LRCServerEvents[K])=>void){
        return super.off(event,cb);
    }
    addListener<K extends keyof LRCServerEvents>(event:K,cb:(arg:LRCServerEvents[K])=>void){
        return super.addListener(event,cb);
    }
    emit<K extends keyof LRCServerEvents>(event:K,arg:LRCServerEvents[K]){
        return super.emit(event,arg);
    }
    prependListener<K extends keyof LRCServerEvents>(event:K,cb:(arg:LRCServerEvents[K])=>void){
        return super.prependListener(event,cb);
    }
    prependOnceListener<K extends keyof LRCServerEvents>(event:K,cb:(arg:LRCServerEvents[K])=>void){
        return super.prependListener(event,cb);
    }
    
    _registerEvents(){
        this.on('exec',(msg)=>{
            commandMap.get(msg.name)!.exec(msg.args.map((val)=>{
                return deWrap(val);
            }));
            this.response();
        }).on('getConfig',()=>{
            this.response(config);
        }).on('getConfigDir',()=>{
            this.response(configDir);
        }).on('getWorkUnsaved',()=>{
            this.response(unsavedWork.hasUnsavedWork);
        }).on('printInfo',(msg)=>{
            printInfo(msg.info,msg.line,msg.path);
            this.response();
        }).on('printTable',(msg)=>{
            printTable(msg.map((td)=>{
                return td.map((val)=>{
                    return deWrap(val);
                })
            }));
            this.response();
        }).on('printValue',(msg)=>{
            printValue(...msg.values.map((val)=>{
                return deWrap(val);
            }))(msg.sep,msg.end);
            this.response();
        }).on('registerLyricChange',(event)=>{
            scope.on(event,()=>{
                this.sendRequest('lyricChanged',{
                    event,
                    scope:convertIPCScope(scope),
                });
            });
        }).on('setCommand',(cmd)=>{
            commandMap.set(cmd.name,{
                ...cmd,
                exec:(args)=>{
                    this.sendRequest('commandExecuted',args.map((val)=>{
                        if(val){
                            return wrap(val);
                        }
                    }));
                }
            });
        });
    }
}
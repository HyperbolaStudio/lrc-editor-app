import * as childProcess from 'child_process';
import { AbstractPlugin } from "./abstract_plugin";
import { LRCServerEvents, deWrap, LRCClientEvents, wrap, IPCArgumentType, ArgumentType } from "../../definition";
import { printInfo, printValue, printTable } from "../print";
import { commandMap } from "../identifier";
import { HMSTime, BeatTime } from "@hypst/time-beat-format";
import { beat, hms } from "../options";
import { config, configDir, unsavedWork } from "../lifecycle";
import { scope, CommandsCollection } from '../../commands/lyricCommands';
import { beatOptionChangedEvent } from '../../commands/beatOption';

export function convertIPCScope(scope:CommandsCollection):LRCClientEvents['lyricChanged']['request']['scope']{
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
        watcherOptions:scope._watcherOptions,
    }
}

export class LRCEditPlugin extends AbstractPlugin<LRCServerEvents,LRCClientEvents>{
    constructor(path:string,stdio?:string[]){
        super(childProcess.fork(path,undefined,{
            stdio:stdio as any,
        }));
        this._registerEvents();
    }
    _commands:string[] = [];
    _lyricChangeListeners:[string,()=>void][] = [];
    _beatOptionChangeListener!:()=>void;

    _registerEvents(){
        this
            .onRequest('exec',(msg)=>{
                commandMap.get(msg.name)!.exec(msg.args.map((val)=>{
                    if(val){
                        return deWrap(val);
                    }
                }) as ArgumentType[]);
            })

            .onRequest('getConfig',()=>{
                return config;
            })

            .onRequest('getConfigDir',()=>{
                return configDir;
            })

            .onRequest('getWorkUnsaved',()=>{
                return unsavedWork.hasUnsavedWork;
            })

            .onRequest('printInfo',(msg)=>{
                printInfo(msg.info,msg.line,msg.path);
            })

            .onRequest('printTable',(msg)=>{
                printTable(msg.map((td)=>{
                    return td.map((val)=>{
                        return deWrap(val);
                    })
                }));
            })

            .onRequest('printValue',(msg)=>{
                printValue(...msg.values.map((val)=>{
                    if(val){
                        return deWrap(val);
                    }
                }))(msg.sep,msg.end);
            })
            
            .onRequest('registerLyricChange',(event)=>{
                let listener = ()=>{
                    this.sendRequest('lyricChanged',{
                        event,
                        scope:convertIPCScope(scope),
                    });
                };
                this._lyricChangeListeners.push([event,listener]);
                scope.on(event,listener);
            })
            
            .onRequest('setCommand',(cmd)=>{
                this._commands.push(cmd.name);
                commandMap.set(cmd.name,{
                    isAbsoluteTime:cmd.isAbsoluteTime,
                    description:cmd.description,
                    overloads:cmd.overloads,
                    exec:cmd.pauseStdin?((args)=>{
                        return new Promise((resolve,reject)=>{
                            this.sendRequest('commandExecuted',{
                                name:cmd.name,
                                args:args.map((val)=>{
                                    if(val){
                                        return wrap(val);
                                    }
                                }) as IPCArgumentType[],
                            });
                            this.onceRequest('resumeStdin',()=>{
                                resolve();
                            });
                        })
                    }):((args)=>{
                        this.sendRequest('commandExecuted',{
                            name:cmd.name,
                            args:args.map((val)=>{
                                if(val){
                                    return wrap(val);
                                }
                            }) as IPCArgumentType[],
                        });
                    }),
                });
            });
        this._beatOptionChangeListener = ()=>{
            this.sendRequest('beatOptionChanged',{
                bpm:beat.bpm,
                beat:beat.beatsPerNote,
                subdiv:beat.divisionsPerBeat,
            });
        }
        beatOptionChangedEvent.on('beatOptionChanged',this._beatOptionChangeListener);
    }

    _finalize(){
        for(let cmd of this._commands){
            commandMap.delete(cmd);
        }
        for(let listener of this._lyricChangeListeners){
            scope.off(listener[0],listener[1]);
        }
        beatOptionChangedEvent.off('beatOptionChanged',this._beatOptionChangeListener);
    }
}
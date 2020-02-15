import * as childProcess from 'child_process';
import { IPCRequest, IPCResponse, LRCClientEvents, PluginEvents, Handler } from '../../definition';
import {EventEmitter} from 'events';

export abstract class AbstractPlugin<HostEvents extends PluginEvents,TargetEvents extends PluginEvents> extends EventEmitter{

    proc:childProcess.ChildProcess|NodeJS.Process;

    constructor(proc:childProcess.ChildProcess|NodeJS.Process){
        super()
        this.proc = proc;
        this.proc.on('message',(msg)=>{
            this.emit(msg.flag,msg.content);
        });
    }

    on<K extends keyof HostEvents>(event:K&string,cb:(arg:HostEvents[K]['request'])=>void):this;
    on(event:Exclude<string,keyof HostEvents>,cb:(...args:any[])=>void):this;
    on(event:string,cb:(...args:any[])=>void){
        return super.on(event,cb);
    }

    once<K extends keyof HostEvents>(event:K&string,cb:(arg:HostEvents[K]['request'])=>void):this;
    once(event:Exclude<string,keyof HostEvents>,cb:(...args:any[])=>void):this;
    once(event:string,cb:(...args:any[])=>void){
        return super.once(event,cb);
    }

    off<K extends keyof HostEvents>(event:K&string,cb:(arg:HostEvents[K]['request'])=>void):this;
    off(event:Exclude<string,keyof HostEvents>,cb:(...args:any[])=>void):this;
    off(event:string,cb:(...args:any[])=>void){
        return super.off(event,cb);
    }

    addListener<K extends keyof HostEvents>(event:K&string,cb:(arg:HostEvents[K]['request'])=>void):this;
    addListener(event:Exclude<string,keyof HostEvents>,cb:(...args:any[])=>void):this;
    addListener(event:string,cb:(...args:any[])=>void){
        return super.addListener(event,cb);
    }

    emit<K extends keyof HostEvents>(event:K&string,arg:HostEvents[K]['request']):boolean;
    emit(event:Exclude<string,keyof HostEvents>,...args:any[]):boolean;
    emit(event:string,...args:any[]){
        return super.emit(event,...args);
    }

    prependListener<K extends keyof HostEvents>(event:K&string,cb:(arg:HostEvents[K]['request'])=>void):this;
    prependListener(event:Exclude<string,keyof HostEvents>,cb:(...args:any[])=>void):this;
    prependListener(event:string,cb:(...args:any[])=>void){
        return super.prependListener(event,cb);
    }

    prependOnceListener<K extends keyof HostEvents>(event:K&string,cb:(arg:HostEvents[K]['request'])=>void):this;
    prependOnceListener(event:Exclude<string,keyof HostEvents>,cb:(...args:any[])=>void):this;
    prependOnceListener(event:string,cb:(...args:any[])=>void){
        return super.prependListener(event,cb);
    }

    sendRequest<K extends keyof TargetEvents>(flag:K,content:TargetEvents[K]['request']):Promise<TargetEvents[K]['response']>;
    sendRequest(flag:Exclude<string,keyof TargetEvents>,content:any):Promise<any>;
    sendRequest(flag:string,content:any){
        return new Promise<any>((resolve,reject)=>{
            let request:IPCRequest = {
                from:process.pid,
                flag,
                content,
            }
            this.proc.send!(request,(err)=>{
                if(err)reject(err);
            });
            this.proc.once('message',(msg)=>{
                resolve(msg.content);
            });
        });
    }

    onRequest<K extends keyof HostEvents>(event:K&string,handler:Handler<HostEvents,K>){
        return this.on(event,async(arg)=>{
            this.response(await handler(arg));
        });
    }

    onceRequest<K extends keyof HostEvents>(event:K&string,handler:Handler<HostEvents,K>){
        return this.once(event,async(arg)=>{
            this.response(await handler(arg));
        });
    }

    response(content?:any,err?:any){
        return new Promise<any>((resolve,reject)=>{
            let response = {
                to:this.proc.pid,
                err,
                content,
            }
            this.proc.send!(response,(err)=>{
                if(err)reject(err);
            });
        });
    }
}
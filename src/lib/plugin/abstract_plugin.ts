import * as childProcess from 'child_process';
import { IPCRequest, IPCResponse, LRCClientEvents } from '../../definition';
import {EventEmitter} from 'events';

export abstract class AbstractPlugin extends EventEmitter{

    child:childProcess.ChildProcess;

    constructor(child:childProcess.ChildProcess){
        super()
        this.child = child;
        this.child.on('message',(msg)=>{
            this.emit(msg.flag,msg.content);
        });
    }

    sendRequest<K extends keyof LRCClientEvents>(flag:K,content:LRCClientEvents[K]):any;
    sendRequest(flag:string,content:any):any;
    sendRequest(flag:string,content:any){
        return new Promise<any>((resolve,reject)=>{
            let request:IPCRequest = {
                from:process.pid,
                flag,
                content,
            }
            this.child.send!(request,(err)=>{
                if(err)reject(err);
            });
            this.child.once('message',(msg)=>{
                resolve(msg);
            });
        });
    }

    response(content?:any,err?:any){
        return new Promise<any>((resolve,reject)=>{
            let response = {
                to:this.child.pid,
                err,
                content,
            }
            this.child.send!(response,(err)=>{
                if(err)reject(err);
            });
        });
    }
}
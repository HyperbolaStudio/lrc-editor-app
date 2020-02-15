import { LRCEditPlugin } from "./lrcedit_plugin";

export let pluginMap = new Map<number,{path:string,plugin:LRCEditPlugin}>();

export function addPlugin(path:string,stdio?:string[]){
    let plugin = new LRCEditPlugin(path,stdio);
    pluginMap.set(plugin.proc.pid,{path,plugin});
}

export function removePlugin(pid:number){
    if(!pluginMap.has(pid))return false;
    else{
        process.kill(pid);
        pluginMap.get(pid)!.plugin._finalize();
        pluginMap.delete(pid);
        return true;
    }
}
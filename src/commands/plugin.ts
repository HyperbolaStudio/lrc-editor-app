import { commandMap } from "../lib/identifier";
import { LRCEditPlugin } from "../lib/plugin/lrcedit_plugin";
import { printInfo, printTable } from "../lib/print";
import { addPlugin, removePlugin, pluginMap } from "../lib/plugin/plugin";



commandMap.set('plugin',{
    exec:(args)=>{
        for(let x of args){
            if(typeof(x)!='string'){
                printInfo({
                    type:'Error',
                    message:'Invalid argument.',
                });
                return;
            }
        }
        let stdio:string[]|undefined;
        if(args[1]){
            stdio = args.slice(1) as any;
        }
        addPlugin(args[0] as string,stdio);
    },
    description:'Add a plugin.',
    overloads:['<path:string> [stdin:string] [stdout:string] [stderr:string]'],
});

commandMap.set('plugout',{
    exec:(args)=>{
        if(typeof(args[0])!='number'){
            printInfo({
                type:'Error',
                message:'Invalid argument.',
            });
            return;
        }
        if(!removePlugin(args[0])){
            printInfo({
                type:'Warning',
                message:'Plugin not existing.',
            });
        }
    },
    description:'Remove a plugin.',
    overloads:['<pid:number>'],
});

commandMap.set('pluglist',{
    exec:()=>{
        printTable([
            ['pid','path'],
            ...[...pluginMap].map((pair)=>{
                return [pair[0],pair[1].path];
            }),
        ]);
    },
    description:'List all plugins',
    overloads:[''],
});
import { commandMap } from "../lib/identifier";
import { LRCEditPlugin } from "../lib/plugin/lrcedit_plugin";

commandMap.set('plugin',{
    exec:(args)=>{
        new LRCEditPlugin(args[0] as string);
    },
    description:'',
    overloads:[''],
})
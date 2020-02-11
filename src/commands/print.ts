import { printValue } from "../lib/print";
import { commandMap } from "../lib/identifier";

commandMap.set('print',{
    exec:(args)=>{
        printValue(...args)();
    },
    description:'Display values.',
});
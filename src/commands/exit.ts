import { ArgumentType } from "../definition";
import { commandMap } from "../lib/identifier";
import { printInfo } from "../lib/print";

export let hasUnsavedWork = false;

commandMap.set('exit',{
    description:'Exit the program.',
    exec:function(){
        if(hasUnsavedWork){
            printInfo({
                type:'Warning',
                message:"The work is unsaved. Please save it before exit or use 'exit!' to force exit.",
            });
        }else{
            process.exit(0);
        }
    }
})

commandMap.set('exit!',{
    description:'Force exit the program.',
    exec:function(){
        process.exit(0);
    },
});
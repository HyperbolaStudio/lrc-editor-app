import { commandMap } from "../lib/identifier";
import { printInfo, printPrompt } from "../lib/print";
import { general } from "../lib/options";
import { stopProgram } from "../lib/lifecycle";
import chalk = require("chalk");

export let unsavedWork = {
    hasUnsavedWork:false,
}

commandMap.set('exit',{
    description:'Exit the program.',
    exec:function(){
        if(unsavedWork.hasUnsavedWork){
            printInfo({
                type:'Warning',
                message:"The work is unsaved. Please save it before exit or use 'exit!' to force exit.",
            });
        }else{
            stopProgram();
        }
    },
    overloads:[''],
})

commandMap.set('exit!',{
    description:'Force exit the program.',
    exec:function(){
        stopProgram();
    },
    overloads:[''],
});

export let sigintCounter = {
    count:0,
};
process.on('SIGINT',()=>{
    sigintCounter.count++;
    if(sigintCounter.count==3){
        stopProgram();
    }else if(sigintCounter.count==2){
        commandMap.get('exit')!.exec([]);
        printInfo({
            type:'Info',
            message:`Press Control+C again to force exit. (All unsaved work will be lost ${chalk.red('FOREVER')})`,
        });
        printPrompt(general.TTYPrompt);
    }else{
        printInfo({
            type:'Info',
            message:'Press Control+C again to exit.',
        });
        printPrompt(general.TTYPrompt);
    }
})
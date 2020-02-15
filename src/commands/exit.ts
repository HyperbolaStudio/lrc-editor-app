import { commandMap } from "../lib/identifier";
import { printInfo, printPrompt } from "../lib/print";
import { general } from "../lib/options";
import { stopProgram, unsavedWork } from "../lib/lifecycle";
import chalk = require("chalk");

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

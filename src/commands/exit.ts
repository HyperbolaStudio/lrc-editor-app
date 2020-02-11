import { commandMap } from "../lib/identifier";
import { printInfo } from "../lib/print";

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

export let sigintCounter = {
    count:0,
};
process.on('SIGINT',()=>{
    sigintCounter.count++;
    if(sigintCounter.count==3){
        process.exit(0);
    }else if(sigintCounter.count==2){
        commandMap.get('exit')!.exec([]);
        printInfo({
            type:'Info',
            message:'Press Control+C again to force exit.',
        });
        process.stdout.write('> ');
    }else{
        printInfo({
            type:'Info',
            message:'Press Control+C again to exit.',
        });
        process.stdout.write('> ');
    }
})
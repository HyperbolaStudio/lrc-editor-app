import * as fs from 'fs';
import { printInfo } from './print';
import { general } from './options';

function showWatchFile(path:string){
    process.stdout.write('\u001b[2J');
    process.stdout.write(fs.readFileSync(path));
    
}

export function watcher(path:string){
    try{
        if(!fs.existsSync(path)){
            printInfo({
                type:'Warning',
                message:'Nothing to watch.',
            });
            process.exit(0);
        }
        showWatchFile(path);
        fs.watchFile(path,()=>{
            if(!fs.existsSync(path)){
                process.exit(0);
            }
            showWatchFile(path);
        });
    }catch(err){
        printInfo({
            type:'Fatal',
            message:err,
        });
    }
}
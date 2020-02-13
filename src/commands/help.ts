import { ArgumentType } from "../definition";
import { commandMap } from "../lib/identifier";
import { printValue } from "../lib/print";
const {version,homepage} = require('../../package.json');

export function commandHelp(args:ArgumentType[]){
    if(typeof(args[0])=='string' && commandMap.has(args[0])){
        let cmd = commandMap.get(args[0])!;
        printValue(cmd.description)();
        printValue('Usage:')();
        for(let overload of cmd.overloads){
            printValue(args[0],overload)();
        }
    }else{
        printValue(`Lyric Editor - v${version}`)();
        printValue(`Type 'commands' to print commands list.`)();
        printValue(`Type 'help <command:string>' to print description and usage of a command.`)();
        printValue(`For more information, visit <${homepage}>.`)();
    }
}

commandMap.set('help',{
    exec:commandHelp,
    description:'Show help information.',
    overloads:['','[command:string]'],
});
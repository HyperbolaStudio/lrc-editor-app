import { parseCommand } from "./parse_command";
import { isInfo } from "../definition";
import { commandMap } from "./identifier";
import { sigintCounter } from "../commands/exit";
import chalk = require("chalk");
import { general } from "./options";
import { printPrompt } from "./print";

export function startListenStdin(){
    printPrompt(general.TTYPrompt);
    if(!general.enableTTYColor)chalk.level=0;
    process.stdin.on("data",(data)=>{
        sigintCounter.count = 0;
        data.toString().split('\n').forEach((command)=>{
            command = command.trimRight();
            if(command!=''){
                let res = parseCommand(command.trimRight());
                if(!isInfo(res)){
                    commandMap.get(res.name)!.exec(res.args);
                }
            }
        });
        printPrompt(general.TTYPrompt);
    });
}
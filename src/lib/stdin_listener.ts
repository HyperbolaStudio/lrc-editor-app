import { parseCommand } from "./parse_command";
import { isInfo } from "../definition";
import { commandMap } from "./identifier";
import { sigintCounter } from "../commands/exit";
import chalk = require("chalk");

let isStdinTTY = process.stdin.isTTY;
let isStdoutTTY= process.stdout.isTTY;

if(isStdinTTY)process.stdout.write('> ');
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
    if(isStdinTTY)process.stdout.write('> ');
});
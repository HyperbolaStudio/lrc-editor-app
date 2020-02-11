import { parseCommand } from "./parse_command";
import { isInfo } from "../definition";
import { commandMap } from "./identifier";

process.stdout.write('> ');
process.stdin.on("data",(data)=>{
    let res = parseCommand(data.toString());
    if(!isInfo(res)){
        commandMap.get(res.name)!.exec(res.args);
    }
    process.stdout.write('> ');
});
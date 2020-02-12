import { ArgumentType } from "../definition";
import { printInfo } from "../lib/print";
import { beat } from "../lib/options";
import { commandMap } from "../lib/identifier";

function commandBeatOption(args:ArgumentType[]){
    if(typeof(args[0])!='string'||typeof(args[1])!='number'){
        printInfo({
            type:'Error',
            message:'Invalid argument.',
        });
        return;
    }
    switch(args[0]){
        case 'bpm':
            beat.bpm = args[1];
            break;
        case 'beat':
            beat.beatsPerNote = args[1];
            break;
        case 'subdiv':
            beat.beatsPerNote = args[1];
            break;
        default:
            printInfo({
                type:'Warning',
                message:'Unrecognized option.',
            });
    }
}

commandMap.set('beatOption',{
    exec:commandBeatOption,
    description:'Set beat options.',
});
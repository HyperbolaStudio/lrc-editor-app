import { LRCEditHost } from "../lib/plugin/lrcedit_host";
import { HMSTime, BeatTime, BeatTimeOption } from "@hypst/time-beat-format";

let host = new LRCEditHost();

let optn:any = {};

host.on('beatOptionChanged',(cfg)=>{
    optn = {
        bpm:cfg.bpm,
        beatsPerNote:cfg.beat,
        divisionsPerBeat:cfg.subdiv,
    }
});


host.setCommand('test',{
    description:'This is a test.',
    overloads:[''],
    exec:async ()=>{
        await host.printInfo({
            type:'Info',
            message:'Hello World!',
        });
        await host.printValue([new BeatTime({
            ...optn,
            isRelativeTime:true,
        },'1:2.8')]);
        await host.resumeStdin();
    },
    pauseStdin:true,
})
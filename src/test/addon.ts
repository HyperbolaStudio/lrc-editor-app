import { LRCEditHost } from "../lib/plugin/lrcedit_host";

let host = new LRCEditHost();



host.setCommand('test',{
    description:'This is a test.',
    overloads:[''],
    exec:async ()=>{
        await host.printInfo({
            type:'Info',
            message:'Hello World!',
        });
        await host.printValue([await host.getConfigDir()])
        await host.resumeStdin();
    },
    pauseStdin:true,
})
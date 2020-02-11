import { LyricTag } from "@hypst/lrc-parser/dist/lib/definition";
import { LyricStorage, ArgumentType, Step } from "../definition";
import * as fs from 'fs';
import parseLrc from '@hypst/lrc-parser'
import { printInfo, printTable, printValue } from "../lib/print";
import { HMSTime, BeatTime } from "@hypst/time-beat-format";
import { hmsOption, beatOption } from "../lib/options";
import { hasUnsavedWork } from "./exit";
import { commandMap } from "../lib/identifier";

class CommandsCollection {



    tags:LyricTag[] = [];
    lyric:LyricStorage[] = [];
    undoStack:Step[] = [];
    redoStack:Step[] = [];
    filePath:string = '';



    commandUndo(){
        let step = this.undoStack.pop();
        if(step){
            printInfo({
                type:'Info',
                message:`Undo -1 step: '${step.name}'.`
            });
           step.undo.exec(false,step.undo.args);
        }else{
            printInfo({
                type:'Warning',
                message:'Nothing to undo.',
            });
        }
    }

    commandRedo(){
        let step = this.redoStack.pop();
        if(step){
            printInfo({
                type:'Info',
                message:`Redo +1 step: '${step.name}'.`
            });
           step.undo.exec(true,step.undo.args);
        }else{
            printInfo({
                type:'Warning',
                message:'Nothing to redo.',
            });
        }
    }

    commandSteps(){
        for(let i=0;i<this.undoStack.length;i++){
            printValue('-',this.undoStack[i].name)();
        }
        for(let i=this.redoStack.length-1;i>=0;i--){
            printValue('+',this.redoStack[i].name)();
        }
    }



    commandOpenLyric(undo:boolean,args:ArgumentType[]){
        if(this.filePath){
            printInfo({
                type:'Error',
                message:'A lyric file is already open. Please close it before open another file.'
            });
        }else{
            try{
                let lyricSrc = fs.readFileSync(args[0] as string);
                this.filePath = args[0] as string;
                let lyricObj = parseLrc(lyricSrc.toString());
                let hasError = false;
                for(let x of lyricObj.info){
                    if(x.type=='Error'||x.type=='Fatal'){
                        hasError = true;
                    }
                    let ln = x.line?lyricSrc.toString().split('\n')[x.line-1]:undefined;
                    printInfo(x,ln,args[0] as string);
                }
                if(!hasError){
                    if(!(/^\s+$/).test(lyricObj.lyric.lines[lyricObj.lyric.lines.length-1].text)){
                        printInfo({
                            type:'Warning',
                            message:'The last line of this.lyric is not empty. The line is ignored.',
                        });
                    }
                    for(let i=0;i<lyricObj.lyric.lines.length-1;i++){
                        this.lyric.push({
                            duration:new HMSTime(lyricObj.lyric.lines[i+1].time.offset(lyricObj.lyric.lines[i].time),hmsOption),
                            text:lyricObj.lyric.lines[i].text,
                        });
                    }
                    this.tags = [...lyricObj.lyric.tags];
                    let tStack;
                    if(undo){
                        tStack = this.undoStack;
                    }else{
                        tStack = this.redoStack;
                    }
                    tStack.push({
                        name:'Load File',
                        undo:{
                            exec:this.commandCloseLyric.bind(this),
                            args:[],
                        },
                    });
                }
            }catch(e){
                printInfo({
                    type:'Fatal',
                    message:e,
                });
                this.tags = [];
                this.lyric = [];
                this.undoStack = [];
                this.redoStack = [];
                this.filePath = '';
            }
        }
    }

    commandCloseLyric(undo:boolean){
        if(hasUnsavedWork){
            printInfo({
                type:'Warning',
                message:"The work is unsaved. Please save it before close or use 'close!' to force close.",
            });
        }else{
            let tStack;
            if(undo){
                tStack = this.undoStack;
            }else{
                tStack = this.redoStack;
            }
            tStack.push({
                name:'Close File',
                undo:{
                    exec:this.commandOpenLyric.bind(this),
                    args:[this.filePath],
                },
            });
            this.tags = [];
            this.lyric = [];
            this.filePath = '';
        }
    }

    commandForceCloseLyric(){
            this.tags = [];
            this.lyric = [];
            this.undoStack = [];
            this.redoStack = [];
            this.filePath = '';
    }



    commandListLyric(args:ArgumentType[]){
        let lrcRange;
        let isBeatTime:boolean;
        if(typeof(args[0])=='number'&&typeof(args[1])=='number'){
            lrcRange = this.lyric.slice(args[0]-1,args[1]);
            if(typeof(args[2])=='boolean'){
                isBeatTime = args[2];
            }
        }else{
            if(typeof(args[0])=='boolean'){
                isBeatTime = args[0];
            }
            lrcRange = this.lyric;
        }
        printTable([['index','duration','text'],...lrcRange.map((line,index)=>{
            if(isBeatTime){
                return [index+1,new BeatTime(beatOption,line.duration),line.text];
            }
            return [index+1,line.duration,line.text];
        })]);
    }

    commandGetDurationOf(args:ArgumentType[]){
        if(typeof(args[1])!='number' || args[1]<1 || args[1]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }else{
            commandMap.get('set')!.exec([args[0],this.lyric[args[1]].duration]);
        }
    }

    commandGetTextOf(args:ArgumentType[]){
        if(typeof(args[1])!='number' || args[1]<1 || args[1]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }else{
            commandMap.get('set')!.exec([args[0],this.lyric[args[1]].text]);
        }
    }

}


let scope = new CommandsCollection();



commandMap.set('undo',{
    exec:scope.commandUndo.bind(scope),
    description:'Undo.',
});

commandMap.set('redo',{
    exec:scope.commandRedo.bind(scope),
    description:'Redo.',
});

commandMap.set('steps',{
    exec:scope.commandSteps.bind(scope),
    description:'List steps.',
});




commandMap.set('open',{
    exec:(args)=>{scope.commandOpenLyric.bind(scope)(true,args)},
    description:'Open lrc file.',
});

commandMap.set('close',{
    exec:()=>{scope.commandCloseLyric.bind(scope)(true)},
    description:'Close lrc file.',
});

commandMap.set('close!',{
    exec:scope.commandForceCloseLyric.bind(scope),
    description:'Force close lrc file.',
});




commandMap.set('list',{
    exec:scope.commandListLyric.bind(scope),
    description:'List lyric lines.',
});

commandMap.set('getDurationOf',{
    exec:scope.commandGetDurationOf.bind(scope),
    description:'Get the duration of a lyric line and save it to a variable.',
});

commandMap.set('getTextOf',{
    exec:scope.commandGetTextOf.bind(scope),
    description:'Get the text of a lyric and save it to a variable.',
});
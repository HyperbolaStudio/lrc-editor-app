import { LyricTag, LyricLine } from "@hypst/lrc-parser/dist/lib/definition";
import { LyricStorage, ArgumentType, Step } from "../definition";
import * as fs from 'fs';
import {parse as parseLrc,createLRC} from '@hypst/lrc-parser'
import { printInfo, printTable, printValue } from "../lib/print";
import { HMSTime, BeatTime } from "@hypst/time-beat-format";
import { hms as hmsOption, beat as beatOption } from "../lib/options";
import { commandMap } from "../lib/identifier";
import { configDir, unsavedWork } from "../lib/lifecycle";
import * as path from 'path';
import {EventEmitter} from 'events';

export class CommandsCollection extends EventEmitter{

    constructor(){
        super();
        this.on('changed',()=>{
            unsavedWork.hasUnsavedWork = true;
            this._clearPrefixCache();
            this._calculatePrefix();
            this._writeWatcherFile();
        });
        this.on('closed',()=>{
            this.tags = [];
            this.lyric = [];
            this._lyricPrefixCache = [];
            this.filePath = '';
            this._prefixCached = false;
            unsavedWork.hasUnsavedWork = false;
        });
        this.on('saved',()=>{
            unsavedWork.hasUnsavedWork = false;
            this._writeWatcherFile();
        });
    }



    tags:LyricTag[] = [];
    lyric:LyricStorage[] = [];
    filePath:string = '';



    _lyricPrefixCache:LyricStorage[] = [];

    _prefixCached:boolean = false;

    private _calculatePrefix(){
        if(this._prefixCached)return;
        let t = new HMSTime(0,hmsOption);
        this.lyric.forEach((line,index)=>{
            this._lyricPrefixCache[index] = {
                duration:new HMSTime(t.toMillisecond(),hmsOption),
                text:line.text,
            }
            t.increase(line.duration);
        });
        this._prefixCached = true;
    }

    private _clearPrefixCache(){
        this._lyricPrefixCache = [];
        this._prefixCached = false;
    }



    undoStack:Step[] = [];

    redoStack:Step[] = [];
    
    private _saveStep(undo:boolean,step:Step){
        let tStack;
        if(undo)tStack = this.undoStack;
        else tStack = this.redoStack;
        tStack.push(step);

    }



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

                    if(!(/^\s*$/).test(lyricObj.lyric.lines[lyricObj.lyric.lines.length-1].text)){
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
                    if(lyricObj.lyric.lines[0].time.toMillisecond()!=0){
                        this.lyric.unshift({
                            duration:new HMSTime(lyricObj.lyric.lines[0].time.toMillisecond(),hmsOption),
                            text:'',
                        });
                    }
                    this.tags = [...lyricObj.lyric.tags];
                    
                    this.emit('changed');
                    this._saveStep(undo,{
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
        if(unsavedWork.hasUnsavedWork){
            printInfo({
                type:'Warning',
                message:"The work is unsaved. Please save it before close or use 'close!' to force close.",
            });
        }else{
            this._saveStep(undo,{
                name:'Close File',
                undo:{
                    exec:this.commandOpenLyric.bind(this),
                    args:[this.filePath],
                },
            });
            this.emit('closed');
        }
    }

    commandForceCloseLyric(){
            this.undoStack = [];
            this.redoStack = [];
            this.emit('closed');
    }

    commandSaveLyric(args:ArgumentType[]){
        let savePath = this.filePath;
        if(!savePath && !args[0]){
            printInfo({
                type:'Error',
                message:'Please specify file path.'
            });
            return;
        }
        if(!this.lyric.length){
            printInfo({
                type:'Warning',
                message:'Lyric is empty. Nothing will be save.'
            });
            return;
        }
        try{
            if(typeof(args[0])=='string')savePath = args[0];
            this._calculatePrefix();
            let lastTime = new HMSTime(this._lyricPrefixCache[this._lyricPrefixCache.length-1].duration.toMillisecond(),hmsOption);
            let lyricSrc = createLRC({
                tags:this.tags,
                lines:[...this._lyricPrefixCache.map((line)=>{
                    return {
                        time:line.duration,
                        text:line.text,
                    }
                }),{
                    time:lastTime.increase(this.lyric[this.lyric.length-1].duration),
                    text:'',
                }] as unknown as LyricLine[],
            });
            fs.writeFileSync(savePath,lyricSrc.trim());
        }catch(err){
            printInfo({
                type:'Fatal',
                message:err,
            });
            printInfo({
                type:'Info',
                message:`An Node.js error was thrown when saving file. This is probably not a problem with lrcedit.`,
            });
            return;
        }
        if(this.filePath!=savePath){
            printInfo({
                type:'Info',
                message:`File path changed, open file ${savePath}.`,
            });
            this.filePath = savePath;
        }
        unsavedWork.hasUnsavedWork = false;
        this.emit('saved');
    }

    _watcherOptions = {
        isBeatTime:false,
        isAbsoluteTime:false,
    }

    _writeWatcherFile(){
        let watchFile = fs.createWriteStream(path.join(configDir,'.watcher'));
        let t = new Date();
        printValue(new HMSTime(t.getHours(),t.getMinutes(),t.getSeconds(),t.getMilliseconds(),hmsOption),this.filePath)(undefined,undefined,watchFile)
        printTable(
            this._getTable(
                undefined,
                undefined,
                this._watcherOptions.isBeatTime,
                this._watcherOptions.isAbsoluteTime
            ),watchFile
        );
    }

    commandWatcher(args:ArgumentType[]){
        let options = args[0];
        if(typeof(options)=='string'){
            for(let c of options){
                switch(c){
                    case 't':
                        this._watcherOptions.isAbsoluteTime = true;
                        break;
                    case 'b':
                        this._watcherOptions.isBeatTime = true;
                        break;
                }
            }
            this._writeWatcherFile();
        }else{
            printInfo({
                type:'Error',
                message:'Invalid argument.'
            });
            return;
        }
        this.emit('watcherOptionChanged');
    }



    _getTable(
        rangeLeft:number|undefined,
        rangeRight:number|undefined,
        isBeatTime:boolean|undefined,
        isAbsoluteTime:boolean|undefined,
    ){
        let lrcRange;
        let lyricList;
        if(isAbsoluteTime){
            this._calculatePrefix();
            lyricList = this._lyricPrefixCache;
        }else{
            lyricList = this.lyric;
        }

        if(rangeLeft){
            lrcRange = lyricList.slice(rangeLeft-1,rangeRight);
        }else{
            lrcRange = lyricList;
        }
        
        return([['index',isAbsoluteTime?'timeSpec':'duration','text'],...lrcRange.map((line,index)=>{
            if(isBeatTime){
                return [index+1,new BeatTime({...beatOption,isRelativeTime:!isAbsoluteTime},line.duration),line.text];
            }
            return [index+1,line.duration,line.text];
        })]);
    }

    commandListLyric(args:ArgumentType[]){

        let isBeatTime:boolean = false;
        let isAbsoluteTime:boolean = false;
        let rangeLeft:number|undefined;
        let rangeRight:number|undefined;
        let options:any;

        if(typeof(args[0])=='number'&&typeof(args[1])=='number'){
            [rangeLeft,rangeRight,options] = args;
        }else if(typeof(args[0])=='number'&&typeof(args[1])!='number'){
            [rangeLeft,options] = args;
        }else if(typeof(args[1])=='number'&&typeof(args[2])=='number'){
            [options,rangeLeft,rangeRight] = args;
        }else if(typeof(args[1])=='number'&&typeof(args[0])!='number'){
            [options,rangeLeft] = args;
        }else if(typeof(args[0])!='number'){
            options = args[0];
        }

        if(typeof(options)=='string'){
            for(let c of options){
                switch(c){
                    case 't':
                        isAbsoluteTime = true;
                        break;
                    case 'b':
                        isBeatTime = true;
                        break;
                }
            }
        }
        printTable(this._getTable(rangeLeft,rangeRight,isBeatTime,isAbsoluteTime));
    
    }

    commandGetDurationOf(args:ArgumentType[]){
        if(typeof(args[1])!='number' || args[1]<1 || args[1]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }else{
            commandMap.get('set')!.exec([args[0],this.lyric[args[1]-1].duration]);
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
            commandMap.get('set')!.exec([args[0],this.lyric[args[1]-1].text]);
        }
    }


    commandAlter(undo:boolean,args:ArgumentType[]){
        let index = args.shift();
        if(typeof(index)!='number' || index<1 || index> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }
        let duration:HMSTime|undefined;
        let text:string|undefined;
        for(let arg of args){
            if(arg instanceof HMSTime){
                duration = arg;
            }else if(arg instanceof BeatTime){
                duration = arg.toHMSTime();
            }else if(typeof(arg)=='string'){
                text = arg;
            }
        }
        let undoArgs:ArgumentType[] = [index];
        if(duration){
            undoArgs.push(this.lyric[index-1].duration);
            this.lyric[index-1].duration = duration;
        }
        if(text){
            undoArgs.push(this.lyric[index-1].text);
            this.lyric[index-1].text = text;
        }
        
        this._saveStep(undo,{
            name:'Alter line',
            undo:{
                exec:this.commandAlter.bind(this),
                args:undoArgs,
            }
        });

        this.emit('changed');
    }

    _insertAfter(index:number,duration:HMSTime,text:string){
        this.lyric = [
            ...this.lyric.slice(0,index),
            {duration,text},
            ...this.lyric.slice(index),
        ]
    }

    commandInsertAfter(undo:boolean,args:ArgumentType[]){
        if(typeof(args[0])!='number' || args[0]<0 || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }else{
            if((args[1] instanceof HMSTime || args[1] instanceof BeatTime) && typeof args[2]=='string'){
                if(args[1] instanceof BeatTime){
                    args[1] = args[1].toHMSTime();
                }
                this._insertAfter(args[0],args[1],args[2]);
            }else{
                printInfo({
                    type:'Error',
                    message:'Invalid argument.',
                });
                return;
            }
        }
        this._saveStep(undo,{
            name:'Insert a line',
            undo:{
                exec:this.commandRemove.bind(this),
                args:[args[0]+1],
            }
        })
        this.emit('changed');
    }

    commandRemove(undo:boolean,args:ArgumentType[]){
        if(typeof(args[0])!='number' || args[0]<=0 || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }
        if(typeof(args[1])!='number' || args[1]<=0 || args[1]> this.lyric.length){
            args[1]=args[0];
        }

        let stepArgs = [];
        for(let i = args[0];i<=args[1];i++){
            stepArgs.push(
                i-1,
                this.lyric[i-1].duration,
                this.lyric[i-1].text,
            );
        }
        this._saveStep(undo,{
            name:'Remove line(s)',
            undo:{
                exec:((undo:boolean,sArgs:ArgumentType[])=>{
                    for(let i=0;i<sArgs.length;i+=3){
                        this._insertAfter(sArgs[i] as number,sArgs[i+1] as HMSTime,sArgs[i+2] as string);
                    }
                    this._saveStep(undo,{
                        name:'Insert Line(s)',
                        undo:{
                            exec:this.commandRemove.bind(this),
                            args,
                        }
                    });
                    this.emit('changed');
                }).bind(this),
                args:stepArgs,
            }
        });
        this.lyric = [
            ...this.lyric.slice(0,args[0]-1),
            ...this.lyric.slice(args[1]),
        ];
        this.emit('changed');
    }

    commandPush(args:ArgumentType[]){
        this.commandInsertAfter(true,[this.lyric.length,...args]);
    }

    commandPop(){
        this.commandRemove(true,[this.lyric.length]);
    }

    commandClone(undo:boolean,args:ArgumentType[]){
        if(typeof(args[0])!='number' || args[0]<0 || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }
        if(typeof(args[1])!='number' || args[1]<args[0] || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }
        if(typeof(args[2])!='number' || args[0]<0 || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }

        let left = args[0];
        let right = args[1];
        let destination = args[2];

        let content = this.lyric.slice(left-1,right);

        this.lyric = [
            ...this.lyric.slice(0,destination),
            ...content,
            ...this.lyric.slice(destination),
        ];

        this._saveStep(undo,{
            name:'Clone lyric line(s)',
            undo:{
                exec:this.commandRemove.bind(this),
                args:[destination+1,destination+right-left+1],
            }
        });
        this.emit('changed');
    }

    commandMove(undo:boolean,args:ArgumentType[]){
        if(typeof(args[0])!='number' || args[0]<0 || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }
        if(typeof(args[1])!='number' || args[1]<args[0] || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }
        if(typeof(args[2])!='number' || args[0]<0 || args[0]> this.lyric.length){
            printInfo({
                type:'Error',
                message:'Invalid index.',
            });
            return;
        }

        let left = args[0];
        let right = args[1];
        let destination = args[2];

        if(destination>=left-1 && destination<=right){
            printInfo({
                type:'Warning',
                message:'Destination is in the range. Nothing will be moved.'
            });
            return;
        }

        let content = this.lyric.slice(left-1,right);

        let endDestination:number;
        let newDestination:number;
        if(destination<left-1){
            this.lyric = [
                ...this.lyric.slice(0,destination),
                ...content,
                ...this.lyric.slice(destination,left-1),
                ...this.lyric.slice(right)
            ];
            endDestination = destination;
            newDestination = right;
        }else{
            this.lyric = [
                ...this.lyric.slice(0,left-1),
                ...this.lyric.slice(right,destination),
                ...content,
                ...this.lyric.slice(destination),
            ];
            endDestination = destination-right+left-1;
            newDestination = left-1;
        }

        this._saveStep(undo,{
            name:'Move lyric line(s)',
            undo:{
                exec:this.commandMove.bind(this),
                args:[endDestination+1,endDestination+right-left+1,newDestination],
            }
        });
        this.emit('changed');
    }

}


export let scope = new CommandsCollection();



commandMap.set('undo',{
    exec:scope.commandUndo.bind(scope),
    description:'Undo.',
    overloads:[''],
});

commandMap.set('redo',{
    exec:scope.commandRedo.bind(scope),
    description:'Redo.',
    overloads:[''],
});

commandMap.set('steps',{
    exec:scope.commandSteps.bind(scope),
    description:'List steps.',
    overloads:[''],
});




commandMap.set('open',{
    exec:(args)=>{scope.commandOpenLyric.bind(scope)(true,args)},
    description:'Open lrc file.',
    overloads:['<file_path:string>'],
});

commandMap.set('close',{
    exec:()=>{scope.commandCloseLyric.bind(scope)(true)},
    description:'Close lrc file.',
    overloads:[''],
});

commandMap.set('close!',{
    exec:scope.commandForceCloseLyric.bind(scope),
    description:'Force close lrc file.',
    overloads:[''],
});

commandMap.set('save',{
    exec:scope.commandSaveLyric.bind(scope),
    description:'Save lrc file.',
    overloads:['[file_path:string]'],
});

commandMap.set('watcher',{
    exec:scope.commandWatcher.bind(scope),
    description:'Config watcher',
    overloads:['<options:string>'],
});



commandMap.set('list',{
    exec:scope.commandListLyric.bind(scope),
    description:'List lyric lines.',
    overloads:[
        '',
        '<range_left:number> [options:string]',
        '<range_left:number> <range_right:number> [options:string]',
        '<options:string> <range_left:number> [range_right:number]',
    ],
});

commandMap.set('getDurationOf',{
    exec:scope.commandGetDurationOf.bind(scope),
    description:'Get the duration of a lyric line and save it to a variable.',
    overloads:['<var_name:string> <value:any>'],
});

commandMap.set('getTextOf',{
    exec:scope.commandGetTextOf.bind(scope),
    description:'Get the text of a lyric and save it to a variable.',
    overloads:['<var_name:string> <line_index:number>'],
});



commandMap.set('alter',{
    exec:(args)=>{scope.commandAlter.bind(scope)(true,args)},
    description:'Alter a lyric line.',
    overloads:[
        '<line_index:number> <lyric:string> [duration:HMSTime|BeatTime]',
        '<line_index:number> <duration:HMSTime|BeatTime> [lyric:string]',
    ],
});

commandMap.set('insertAfter',{
    exec:(args)=>{scope.commandInsertAfter.bind(scope)(true,args)},
    description:'Insert a new line after.',
    overloads:['<destination:number> <duration:HMSTime|BeatTime> <lyric:string>'],
});

commandMap.set('push',{
    exec:scope.commandPush.bind(scope),
    description:'Append a new line.',
    overloads:['<duration:HMSTime|BeatTime> <lyric:string>'],
});

commandMap.set('pop',{
    exec:scope.commandPop.bind(scope),
    description:'Remove the last line.',
    overloads:[''],
});

commandMap.set('remove',{
    exec:(args)=>{scope.commandRemove.bind(scope)(true,args)},
    description:'Remove a line',
    overloads:['<rangeLeft:number> [rangeRight:number]'],
});

commandMap.set('clone',{
    exec:(args)=>{scope.commandClone.bind(scope)(true,args)},
    description:'Clone lines to.',
    overloads:['<rangeLeft:number> <rangeRight:number> <destination:number>'],
});

commandMap.set('move',{
    exec:(args)=>{scope.commandMove.bind(scope)(true,args)},
    description:'Move lines to.',
    overloads:['<rangeLeft:number> <rangeRight:number> <destination:number>'],
});
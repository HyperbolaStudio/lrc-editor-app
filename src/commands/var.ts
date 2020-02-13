import { ArgumentType } from "../definition";
import { identifierMap, commandMap } from "../lib/identifier";
import { printInfo, printValue, printTable } from "../lib/print";

commandMap.set('set',{
    description:'Declare and set the value of a variable.',
    exec:function(args:ArgumentType[]){
        if(typeof(args[0])!='string' || !(/^[A-Za-z\$_][0-9A-Za-z\$_]*$/).test(args[0])){
            printInfo({
                type:'Error',
                message:'Invalid identifier.',
            });
            return;
        }
        identifierMap.set(args[0],args[1]);
    },
    overloads:['<var_name:string> <value:any>'],
});

commandMap.set('variables',{
    description:'List all variables.',
    exec:function(){
        printTable([...identifierMap]);
    },
    overloads:[''],
});

commandMap.set('delete',{
    description:'Delete variable.',
    exec:function(args:ArgumentType[]){
        if(typeof(args[0])!='string'){
            printInfo({
                type:'Error',
                message:'Not string-type identifier.',
            });
            return;
        }
        if (!identifierMap.has(args[0])){
            printInfo({
                type:'Warning',
                message:'Undeclared identifier.',
            });
        }
        identifierMap.delete(args[0]);
    },
    overloads:['<var_name:string>'],
});

commandMap.set('commands',{
    description:'List all commands.',
    exec:function(){
        printTable([...commandMap].sort((v1,v2)=>{
            if(v1[0]>v2[0]){
                return 1;
            }else if(v1[0]==v2[0]){
                return 0;
            }else{
                return -1;
            }
        }).map((tr)=>{
            return [tr[0],tr[1].description];
        }));
    },
    overloads:[''],
});
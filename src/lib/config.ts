import * as fs from 'fs';
import * as options from './options';
import * as os from 'os';
import * as path from 'path';
import { configDir, argsOption } from './lifecycle';
import { addPlugin } from './plugin/plugin';

export function createConfigFile(){
    if(argsOption.resetConfig||!fs.existsSync(path.join(configDir,'config.json'))){
        let configObj = {
            numWidth:{
                ...options.hms.numberWidthOption,
                ...options.beat.numberWidthOption,
            },
            general:options.general,
        }
        fs.writeFileSync(path.join(configDir,'config.json'),JSON.stringify(configObj,undefined,4));
        return true;
    }
    return false;
}

export function applyConfigFile(){
    let newOptions = JSON.parse(fs.readFileSync(path.join(os.homedir(),'.lrc_edit','config.json')).toString());
    if(newOptions.numWidth){
        for(let key in options.hms.numberWidthOption){
            if(typeof(newOptions.numWidth[key])=='number'){
                options.hms.numberWidthOption[key] = newOptions.numWidth[key];
            }
        }
        for(let key in options.beat.numberWidthOption){
            if(typeof(newOptions.numWidth[key])=='number'){
                options.beat.numberWidthOption[key] = newOptions.numWidth[key];
            }
        }
    }
    if(newOptions.general){
        for(let key in newOptions.general){
            (options.general as any)[key] = newOptions.general[key];
        }
    }
    if(newOptions.plugins){
        for(let plugin of newOptions.plugins){
            addPlugin(plugin);
        }
    }
    return newOptions;
}


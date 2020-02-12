import { printInfo } from "./print";

const {version,homepage} = require('../../package.json');
export function showWelcomeMessage(){
    printInfo({
        type:'Info',
        message:`Lyric Editor - v${version}`,
    });
    printInfo({
        type:'Info',
        message:`For more information, visit <${homepage}>.`,
    });
}
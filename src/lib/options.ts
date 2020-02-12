import { BeatTimeOption, HMSTimeOption } from "@hypst/time-beat-format";

export let beat:BeatTimeOption = {
    bpm:120,
    beatsPerNote:4,
    divisionsPerBeat:16,
    isRelativeTime:true,
}
export let hms:HMSTimeOption = {
    numberWidthOption:{
        hour:-1,
        minute:2,
        second:2,
        millisecond:3,
    }
}
export let general = {
    endLine:'\n',
    enableTTYColor:true,
    showWelcomeMessage:true,
    TTYPrompt:'>',
}
export let watcher = {
    isAbsoluteTime:false,
    isBeatTime:false,
}
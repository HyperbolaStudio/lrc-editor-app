import { BeatTimeOption, HMSTimeOption } from "@hypst/time-beat-format";

export let beatOption:BeatTimeOption = {
    bpm:120,
    beatsPerNote:4,
    divisionsPerBeat:16,
    isRelativeTime:true,
}
export let hmsOption:HMSTimeOption = {
    numberWidthOption:{
        hour:-1,
        minute:2,
        second:2,
    }
}
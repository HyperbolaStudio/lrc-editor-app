import { printInfo, printValue } from "../lib/print";
import { HMSTime } from "@hypst/time-beat-format";

printInfo({
    type:'Fatal',
    line:3,
    column:5,
    message:'msg msg',
},'aaaaa',
);

printValue(1,'aa',true,undefined,null,process,new HMSTime(1))();
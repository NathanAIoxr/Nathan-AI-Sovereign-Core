import {turnWtoM,turnMtoW,getTwin,getAllModes,buildStoryBeats} from "./twin-triplet-engine";
const words=["WILL","WHEEL","WAY"],mirrors=["MILL","MHEEL","MAY"];
for(let i=0;i<3;i++){if(turnWtoM(words[i])!==mirrors[i]||turnMtoW(mirrors[i])!==words[i]||getTwin(words[i])!==mirrors[i]||getTwin(mirrors[i])!==words[i])throw new Error("twin mapping failed")}
const modes=getAllModes();if(modes.individual.length!==6||modes.twins.length!==3||modes.triplets.length!==2||modes.unified.length!==6)throw new Error("mode composition failed");
if(buildStoryBeats().length!==3)throw new Error("story branches missing");
console.log("Twin-triplet transformations passed");

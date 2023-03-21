import { updateExtra,getExtraByID } from "./store.js";
import { toast } from "./toast.js"
const texter = new TextDecoder()

export function fileReader(action,id){
    const input = document.createElement("input")
    input.type = "file"
    input.addEventListener("change", async (e)=>{
        if(input.files.length == 0) return;;
        switch (action) {
            case "lyric":
                await saveLyric(id,input.files[0])
                break;
            default:
                break;
        }
    }, false);
    input.click()
}

async function saveLyric(id,file){
    const buffer = await file.arrayBuffer()
    const lyric = texter.decode(buffer)
    const match = lyric && lyric.match(/^\[\d\d:\d\d/)
    if(match.length == 0) toast({msg:"文件格式错误！"})
    else {
        document.dispatchEvent(new CustomEvent("store-extra",{bubbles:true,detail:{id,extra:["lyric",lyric]}}))
    }
}
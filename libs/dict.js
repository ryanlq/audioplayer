import { Oxford5000 } from "../datas/Oxford5000_map.js";
import { Oxford5000_dict } from "../datas/Oxford5000_dict.js";
var formers = Object.freeze({
    "p": "过去式", // past tense
    "d": "过去分词",
    "i": "现在分词", // -ing
    "3": "第三人称单数",
    "r": "比较级", // -er
    "t": "最高级", // -est
    "s": "名词复数",
    "0": "原型",
    "1": "原型变换"
  });
  
export function dict_query(word){
    if(!word || !Oxford5000.includes(word)) return false;
    let data = Oxford5000_dict[word[0].toLowerCase()][word]
    if(data && data["variety"]){
      let vs = data["variety"].split("/")
      let newvs = vs.map(v=>{
        return formers[v[0]] + v.slice(1)
      })
      data["variety"] = newvs.join(",")
    }
    return data
}
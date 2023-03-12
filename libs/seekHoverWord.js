import {dict_query} from "./dict.js"
import { Lemmatizer } from "./lemmatizer.js";
let lemmatizer = new Lemmatizer();
lemmatizer.init_store()
let selection = window.getSelection();
let range = new Range();
function setSelection(select_node,start,end){
    range.setStart(select_node,  start);
    range.setEnd(select_node, end)

    selection.removeAllRanges();
    selection.addRange(range)
}

export function seekWord(event, trims,filter_callback=null){
    
    if(!event) return false

    const {target,touches} = event;

    let offsetX = 0
    if(touches.length == 0) return;
    else {
        offsetX = touches[0].pageX
    }

    const clientWidth = target.clientWidth

    let _trims = trims
    if(!trims) {
        _trims = getComputedStyle(target)
    }

    const { padding, margin } = _trims,
     text = target.textContent,
     paddingLeft = parseInt(padding.replace(/[a-z]+/g,"")),
     contentWidth = clientWidth - (paddingLeft*2),
     contentOffsetX = offsetX-paddingLeft,
     wordWith = contentWidth/text.length,
     index = parseInt(contentOffsetX/wordWith);
     const select_node = target.firstChild
    let start =0,end=0,word="";
    for(let i=1;i<=20;i++){
        let preIndex = index-i
        if(text[preIndex] == " "){
            word = text.slice(preIndex+1).split(" ")[0]
            start = preIndex+1;
            end = preIndex+1+word.length
            setSelection(select_node,preIndex+1,preIndex+1+word.length)
            break
        }
        if( preIndex <=0 ){
            word = text.split(" ")[0]
            start = 0;
            end = word.length
            setSelection(select_node, 0 ,word.length)
            break
        } 
    }
    if(end>0 ){
        let isMatched = filter_callback? filter_callback(word) :false
        isMatched && setSelection(select_node, start ,end)
        // return dict_panel(word,start*wordWith,target);
        return word
    }
    return false;
}


function dict_panel(word,offset,node){
    const dict_panel_node = document.querySelector("#dict-panel")
    dict_panel_node&&dict_panel_node.remove()
    const width = 200;
    let data = dict_query(word)
    if(!data) return null;
    let left = node.offsetLeft + offset
    let right = -1;
    let top =node.offsetTop + node.clientHeight
    let widthEdge = document.body.clientWidth
    let offsetlr = "left:"+left+"px;"
    if(left > widthEdge-width ) {
        left = -1;
        right = 0;
        offsetlr = "right:0px;"
    } else if( left < 0){
        offsetlr = "left:0px;"
    } 
    if(dict_panel_node) dict_panel_node.remove()
    const panel = document.createElement("div")
    panel.id = "dict-panel"
    panel.style=`
        padding:10px;
        position:absolute;
        top:${top}px;
        background-color:#000;
        font-size:18px;
        width:${width}px;
        background:#000;
    ` + offsetlr
    const input = document.createElement("div")
    const mean = document.createElement("div")
    const formers = document.createElement("div")
    input.textContent = word
    input.style.padding = "5px 0"
    input.style.fontWeight = "bold"
    mean.innerHTML = (data.mean.replaceAll("\\n","<br/>")) || ""
    formers.textContent = data.variety || ""
    formers.style =`
        font-style: italic;
        color: hsl(195deg 85% 41%);
        font-size: 14px;
    `
    panel.append(input,mean,formers)
    return panel
}

export function openDictPanel(e,paddingleft) {
    const selectText = window.getSelection()
    let word = selectText.toString()
    word = word.toLowerCase().replaceAll(/[^a-z']/g,"")
    word = lemmatizer.only_lemmas(word)[0]
    if(!word) return;
    const node = selectText.anchorNode.parentElement
    const contentWidth = node.clientWidth - (paddingleft*2),
    wordWith = contentWidth/selectText.anchorNode.length

    return dict_panel(word,selectText.baseOffset*wordWith,node);
}


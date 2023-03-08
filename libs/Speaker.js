export function Speaker(){
    
    const edge_nature_voices = ["MicrosofSt Xiaoxiao Online (Natural) - Chinese (Mainland)","Microsoft Yunxi Online (Natural) - Chinese (Mainland)"]
    let synth,voicelists,zh_voices,supported_natural,usedVoice;
    synth = window.speechSynthesis;
    let utterThis = new SpeechSynthesisUtterance()
    const TipNode = document.getElementById("tooltip")
    function setSpeech() {
        return new Promise(
            function (resolve, reject) {
                let synth = window.speechSynthesis;
                let id;
    
                id = setInterval(() => {
                    if (synth.getVoices().length !== 0) {
                        resolve(synth.getVoices());
                        clearInterval(id);
                    }
                }, 10);
            }
        )
    }
    
    function setVoice(){
        const speakerlistNode = document.querySelector("#speaker_select .lists")
        const li = document.createElement("li")
        voicelists = setSpeech();
        voicelists.then((voices) =>{
            
            zh_voices = voices.filter(function (voice) {
                return voice.lang == "zh-CN"
             });
            supported_natural = zh_voices.filter(voice=>{
                return edge_nature_voices.includes(voice.name)
            }) 
            usedVoice = zh_voices[0] 
            zh_voices.forEach( (voice,i) => {
                let newli = li.cloneNode(true)
                newli.innerText = voice.name;
                newli.voice = voice
                newli.id = "speaker"+i
                newli.addEventListener("click",(e)=>{
                    usedVoice = newli.voice;
                })
                speakerlistNode && speakerlistNode.appendChild(newli)
            });
            //usedVoice = supported_natural.length ?supported_natural[0] :zh_voices[0]
        }); 
    }
    
    setVoice()
    
    function get_extra(word){
        if( EXTRADATAS.hasOwnProperty(word)){
            let extrastr = EXTRADATAS[word]["relative"]
            let extrarr = extrastr.split(',')
            const len = extrarr.length-1;
            let r1, r2;
            if(len > 3){
                r1 = Math.round(Math.random()*len);
                r2=Math.round(Math.random()*len);
                if(r1>len || r2>len || r1 == r2) {
                    r1 = 0;
                    r2=1;
                }
                // return word +"," + extrarr[r1] +decoration +","+extrarr[r2] +decoration
            } else if(len == 1){
                r1 = 0
                // return word +"," + extrarr[0] +decoration 
            } else {
                r1 = 0
                r2 = 1
                // return word +"," + extrarr[0] +decoration +","+extrarr[1] +decoration
            }
            
            return [r1?extrarr[r1]:false,r2?extrarr[r2]:false]

        }
        return word
    }
    function speak(text, is_extra,end_callback) {
        const decoration = "的"+text
        synth.cancel()
        if (synth.speaking) {
          //console.error("speechSynthesis.speaking");
          return;
        }
      
        if (text !== "") {
          //const utterThis = new SpeechSynthesisUtterance(get_extra(text));
          let texts,speak_word;
          let speaktext = text
          if(is_extra ){
            texts = get_extra(text)
            speak_word = text + ":"
            texts.forEach(t=>{
                if(t){
                    speaktext += ","+t +decoration
                    speak_word += "【"+t +"】"
                }
              })
          } 
          
          TipNode && TipNode.dispatchEvent(tooltipEvent)
        //   const speaktext = texts.reduce((a,b)=> text +(a?","+a +decoration:"") +(b?","+b +decoration:""))
            
          utterThis.text = speaktext
      
          utterThis.onend = function (event) {
            //console.log("SpeechSynthesisUtterance.onend");
            end_callback&&end_callback()
          };
      
          utterThis.onerror = function (event) {
            console.log(event)
            //console.error("SpeechSynthesisUtterance.onerror");
          };
          utterThis.voice = usedVoice;
          utterThis.pitch = 1;
          utterThis.rate = 1;
          synth.speak(utterThis);
          return utterThis
        }
      }
      return (text, is_extra=true,end_callback=null)=> speak(text, is_extra,end_callback)
}





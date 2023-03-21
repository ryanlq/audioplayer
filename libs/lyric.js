
export class Lyric{
    constructor(){
        this.lyric = "";
        this.symbols = []
    }
    load(text){
        if(!text) {
            this.lyric = "";
            this.symbols = []
            return false;
        };
        let textlist = text.split("[")
        let results = {}
        let items = textlist.forEach(t=>{
            if(!t) return ;
            const pairs = t.split("]") 
            if(pairs.length < 2 || !pairs[1]) return;
            const sd = pairs[0].match(/(\d\d):(\d\d).*/)
            if(sd) {
                let r = parseInt(sd[2])
                r = r < 0 ? 0 : r
                if(r<10) r = "0"+r

                results[sd[1]+":"+r] = pairs[1]
            }

        }) 
        this.lyric = results;
        this.symbols = Object.keys(results)
    }
    
    getLyric(){
        return this.lyric
    }
    getSymbols(){
        return this.lyric
    }
}

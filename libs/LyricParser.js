
const base = "https://statics-dg5.pages.dev/lyrics/"
export async function LyricParser(title,artist=""){
    let name = title
    if(artist) name += " - " + artist
    var header = new Headers();
    header.append('Content-Type','text/plain; charset=UTF-8');
    const fullurl = base + name +".lrc"
    const response = await fetch(fullurl,header);
    const text = await response.text()

    if(!text.includes("<html") && text.slice(0,3) !== "404"  ){
        return text.replaceAll("\n","")
    } else {
        return false
    }
}


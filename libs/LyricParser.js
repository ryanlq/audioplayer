
const base = "https://statics-dg5.pages.dev/lyrics/"
export async function LyricParser(title,artist=""){
    let name = title
    if(artist) name += " - " + artist
    var header = new Headers();
    header.append('Content-Type','text/plain; charset=UTF-8');
    const fullurl = base + name +".lrc"
    const text = await (fetch(fullurl,header)
                            .then(response=>response.text())
                            .catch(error=>false))
    // const text = await response.text()
    if(text && !text.includes("<html") && text.slice(0,3) !== "404"  ){
        return text.replaceAll("\n","")
    } else {
        return false
    }
}


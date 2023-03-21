import { getUniqueId } from "./utils.js";

export function removeAllSongs(playlistSongsContainer) {
  playlistSongsContainer.innerHTML = '';
}

function tagstr_add(tagstr,item){
  let ret =tagstr
  if(tagstr == "") ret = item
  else {
    let tags = tagstr.split(",")
    const index = tags.indexOf(item)
    if(index == -1) {
      tags.push(item)
      ret = tags.join(",")
    }
  }
  return ret
  
}
function tagstr_remove(tagstr,item){
  let ret = tagstr
  if(tagstr == "") return tagstr
  else {
    let tags = tagstr.split(",")
    const index = tags.indexOf(item)
    if(index > -1) {
      tags = [].concat(tags.slice(0,index),tags.slice(index+1))
      ret = tags.join(",")
    }
  }
  return ret
}

export function createSongUI(playlistSongsContainer, song, stateLess,tagstr="") {
  const item = document.createElement(stateLess ? "p" : "li");
  item.classList.add('playlist-song');
  item.classList.add(song.type === 'file' ? 'file' : 'remote');
  item.id = song.id;
  item.setAttribute("data-tags","")
  const li = document.createElement("div")
  const tags = document.createElement("ul")
  li.classList.add("row1")
  tags.classList.add("row2")
  item.setAttribute("data-tags",tagstr || "")
  // if(song.extra&&song.extra.tags){
  //   item.setAttribute("data-tags",song.extra.tags)
  // }

  const baseInfo = document.createElement("div");
  baseInfo.classList.add("base")
  // Play button
  let playButton = null;
    playButton = document.createElement("button");
    playButton.classList.add('play');
    playButton.setAttribute('title', 'Play this song');
    playButton.innerHTML = '<span>Play</span>';
    baseInfo.appendChild(playButton);
  

  // Album artwork
  const albumArt = document.createElement("img");
  albumArt.classList.add('artwork');
  albumArt.setAttribute('loading', 'lazy');
  albumArt.alt = ""
  let picurl = './imgs/default.svg'
  if(song.hasOwnProperty("picture") && (song["picture"] instanceof  Blob)){
    picurl = URL.createObjectURL(song.picture)
  }
  albumArt.setAttribute('src', song.artworkUrl || picurl );
  baseInfo.appendChild(albumArt);

  // Song title
  const titleInput = document.createElement("span");
  titleInput.classList.add('title');
  titleInput.setAttribute('title', song.title+' - '+song.artist);
  titleInput.textContent = song.title.replace(/【.*】/,"") +' - '+song.artist;
  if (!stateLess) {
    titleInput.setAttribute('contenteditable', true);
    titleInput.setAttribute('spellcheck', false);
  }
  baseInfo.appendChild(titleInput);
  li.appendChild(baseInfo)

  song.album && item.setAttribute("album",song.album)
  song.artist && item.setAttribute("album",song.artist)

  // Duration label
  const durationLabel = document.createElement("time");
  durationLabel.classList.add('duration');
  durationLabel.textContent = song.duration;
  li.appendChild(durationLabel);
  // delete button
  const deletebtn = document.createElement("div");
  deletebtn.classList.add('delete-song');
  deletebtn.textContent = "删除";
  li.appendChild(deletebtn);
  
  //Events
  deletebtn.addEventListener("click",e=>{
    deletebtn.dispatchEvent(new CustomEvent("delete-song", { bubbles: true,detail:item.id }));
  },false)
  item.addEventListener('click', (e) => {
      if(e.target.classList.contains("delete-song")) return false
      if(!document.documentElement.classList.contains("edit")){
        playButton.dispatchEvent(new CustomEvent("play-song", { bubbles: true }));
      }
      
  });
  item.addEventListener('swiped-left',function(e){
    const {detail} =  e
    if((detail.xStart - detail.xEnd) > item.clientWidth*0.34) {
      item.classList.add("delete")
    }
  })
  item.addEventListener('swiped-right',function(e){
    const {detail} =  e
    if((detail.xStart - detail.xEnd) < -50) {
      item.classList.remove("delete")
    }
  })
  document.addEventListener("click",e=>{
    const t = e.target
    if(!item.classList.contains("delete")) return false;
    if(t.classList.contains("delete-song") || (t.classList.contains("delete-song") &&t.classList.contains("confirm")  )){
      return false;
    } else {
      item.classList.remove("delete")
    }
  },false)
  // Actions button
  if (!stateLess) {

    const actionsButton = document.createElement("button");
    actionsButton.classList.add('actions');
    actionsButton.setAttribute('title', 'Song actions');
    actionsButton.innerHTML = '<span>Actions</span>';
    li.appendChild(actionsButton);

  // Play button event listener
    item.addEventListener('click', () => {
      if(!playlistSongsContainer.classList.contains("edit")){
        playButton.dispatchEvent(new CustomEvent("play-song", { bubbles: true }));
      }
    });
    // Auto-select text on focus
    function focusText() {
      window.setTimeout(function () {
        const range = document.createRange();
        range.selectNodeContents(document.activeElement);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }, 1);
    }
    titleInput.addEventListener('focus', focusText);
    artistInput.addEventListener('focus', focusText);
    albumInput.addEventListener('focus', focusText);

    // Song details change listener
    function handleDetailsEdit() {
      li.dispatchEvent(new CustomEvent("edit-song", {
        detail: {
          artist: artistInput.textContent,
          album: albumInput.textContent,
          title: titleInput.textContent
        }
      }));
    }
    titleInput.addEventListener('input', handleDetailsEdit);
    artistInput.addEventListener('input', handleDetailsEdit);
    albumInput.addEventListener('input', handleDetailsEdit);

    // Actions button event listener
    actionsButton.addEventListener('click', () => {
      const anchorID = getUniqueId();
      actionsButton.id = anchorID;
      li.dispatchEvent(new CustomEvent("show-actions", {
        bubbles: true,
        detail: { anchorID, x: actionsButton.offsetLeft, y: actionsButton.offsetTop + actionsButton.offsetHeight }
      }));
    });
  }

  const tag = document.createElement("li")
  tag.classList.add("tag")
  //todo: tags store 存取 读取
  // alltags = ["歌曲","戏曲","收藏"]
  const alltags = ["歌曲","戏曲","收藏"]
  const hastags = tagstr?tagstr.split(","):[]
  const tagnodes = alltags.map(t=>{
    const _tag = tag.cloneNode(true)
    if(hastags.includes(t)){
      _tag.classList.add("has")
    }
    _tag.innerText = t
    _tag.addEventListener("click",e=>{
        const datas = item.getAttribute("data-tags")
        const text = _tag.innerText
        if(_tag.classList.contains("has")){
            if(_tag.classList.contains("changed")){
              _tag.classList.remove("changed")
              item.setAttribute("data-tags",tagstr_add(datas,text))
            }else{
              _tag.classList.add("changed")
              item.setAttribute("data-tags",tagstr_remove(datas,text))
            }
        }else {

          if(_tag.classList.contains("changed")){
            _tag.classList.remove("changed")
            item.setAttribute("data-tags",tagstr_remove(datas,text))
          }else{
            _tag.classList.add("changed")
            item.setAttribute("data-tags",tagstr_add(datas,text))
          }
        }
        const changeditems = item.querySelectorAll(".changed")
        if(changeditems.length == 0) {
          item.classList.remove("changed")
        } else {
          item.classList.add("changed")
        }
    },false)
    return _tag
  })
  tags.append(...tagnodes)
    item.appendChild(li)
    item.appendChild(tags)

  playlistSongsContainer.appendChild(item);
  return item;
}

export function createLoadingSongPlaceholders(playlistSongsContainer, nbOfPlaceholders) {
  for (let i = 0; i < nbOfPlaceholders; i++) {
    const playlistSongEl = createSongUI(playlistSongsContainer, { title: '', artist: '', album: '', id: getUniqueId(), type: 'file' ,picture:''},true);
    playlistSongEl.classList.add('loading-placeholder');
    playlistSongsContainer.appendChild(playlistSongEl);
  }
}

export function removeLoadingSongPlaceholders(playlistSongsContainer) {
  playlistSongsContainer.querySelectorAll('.loading-placeholder').forEach(li => {
    li.remove();
  });
}

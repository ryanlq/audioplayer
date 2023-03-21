import { getSongs, getSong, getTags,getExtra,updateExtra ,editSong,editSongTags, setVolume, getVolume, deleteSong, deleteAllSongs, addLocalFileSong, setArtwork, wasStoreEmpty, sortSongsBy } from "./libs/store.js";
import { Player } from "./libs/player.js";
import { Lyric } from "./libs/lyric.js";
import { formatTime, openFilesFromDisk, getFormattedDate, canShare, analyzeDataTransfer, getImageAsDataURI } from "./libs/utils.js";
import { importSongsFromFiles } from "./libs/importer.js";
import { Visualizer } from "./libs/visualizer.js";
// import { exportSongToFile } from "./exporter.js";
import { loadCustomOrResetSkin, reloadStoredCustomSkin } from "./libs/skin.js";
// import { startRecordingAudio, stopRecordingAudio } from "./recorder.js";
import { createSongUI, removeAllSongs, createLoadingSongPlaceholders, removeLoadingSongPlaceholders } from "./libs/song-ui-factory.js";
import { initMediaSession } from "./media-session.js";
import { initKeyboardShortcuts } from "./libs/keys.js";
import { Speaker } from "./libs/Speaker.js";
import { LyricParser } from "./libs/LyricParser.js"
import { preload } from "./libs/preload.js"
import { toast,closeToast } from "./libs/toast.js"
import { fileReader } from "./libs/readlocalfile.js"
import { seekWord, openDictPanel } from "./libs/seekHoverWord.js"

// Whether the app is running in the Microsoft Edge sidebar.
const isSidebarPWA = (() => {
  if (navigator.userAgentData) {
    return navigator.userAgentData.brands.some(b => {
      return b.brand === "Edge Side Panel";
    });
  }

  return false;
})();

// Whether we are running as an installed PWA or not.
const isInstalledPWA = window.matchMedia('(display-mode: window-controls-overlay)').matches || window.matchMedia('(display-mode: standalone)').matches;

// All of the UI DOM elements we need.
const playButton = document.getElementById("playpause");
const playButtonLabel = playButton.querySelector("span");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const playHeadInput = document.getElementById("playhead");
const visualizerButton = document.getElementById("toggle-visualizer");
const visualizerEl = document.getElementById("waveform");
const volumeInput = document.getElementById("volume");
const currentTimeLabel = document.getElementById("currenttime");
const durationLabel = document.getElementById("duration");
const playlistEl = document.querySelector(".playlist");
export const playlistSongsContainer = document.querySelector(".playlist .songs");
// const addSongsButton = document.getElementById("add-songs");

// const installButton = document.getElementById("install-button");
const currentSongSection = document.querySelector('.current-song');
const lyricPanel = document.querySelector('#lyric-panel');
const Manager = document.querySelector('#managerbtn');
const TagMenusContainer = document.querySelector('#header ul');
const TagMenus = document.querySelectorAll('#header ul li');
const SpeedBtn = document.querySelector('#speed .label');
const SpeedOptions = document.querySelector('#speed .options');

let isMobile = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
isMobile && isMobile.length >0 ?isMobile = true:isMobile=false

let currentSongEl = null;

let isFirstUse = true;

// Instantiate the player object. It will be used to play/pause/seek/... songs. 
const player = new Player();
window._player = player; //for test


// Instantiate the player object. It will be used to play/pause/seek/... songs. 
const lyric = new Lyric();
let Extrainfos = null;

// Initialize the media session.
initMediaSession(player);

// Instantiate the visualizer object to draw the waveform.
const visualizer = new Visualizer(player, visualizerEl);

// Aa simple interval loop is used to update the UI (e.g. the playhead and current time).
let updateLoop = null;

// The update loop.
function updateUI() {
  // Reset the play states in the playlist. We'll update the current one below.
  const playitem = playlistSongsContainer.querySelector(".playing")
  playButton.classList.remove('playing');
  playButtonLabel.textContent = 'Play';
  document.documentElement.classList.toggle('playing', false);
  playitem && playitem.classList.toggle('playing', false);

  if (!player.song) {
    // No song is loaded. Show the default UI.
    playHeadInput.value = 0;
    currentTimeLabel.textContent = "00:00";
    durationLabel.textContent = "00:00";

    return;
  }

  // Update the play head and current time/duration labels.
  const currentTime = player.currentTime;
  let duration = 0;
  duration = player.duration;

  playHeadInput.value = currentTime;
  playHeadInput.max = duration;

  currentTimeLabel.innerText = formatTime(currentTime);
  durationLabel.innerText = formatTime(duration?duration:0);

  let playbackRate = 1;
  playbackRate = player.playbackRate
  SpeedBtn.innerText = playbackRate
  SpeedBtn.setAttribute("speed",playbackRate)

  if (player.isPlaying) {
    playButton.classList.add('playing');
    playButtonLabel.textContent = 'Pause';
    playButton.title = 'Pause (space)';
    document.documentElement.classList.toggle('playing', true);
    const currentSong = playlistSongsContainer.querySelector(`[id="${player.song.id}"]`);
    currentSong && currentSong.classList.toggle('playing',true);
  }

  // Update the play state in the playlist.

  loadLyric()
}

// Calling this function starts (or reloads) the app.
// If the store is changed, you can call this function again to reload the app.
export async function startApp() {
  // clearInterval(updateLoop);
  const Tags = await getTags()
  Extrainfos = await getExtra()
 
  removeLoadingSongPlaceholders(playlistSongsContainer);

  // Restore the volume from the store.
  const previousVolume = await getVolume();
  player.volume = previousVolume === undefined ? 1 : previousVolume;
  volumeInput.value = player.volume * 10;

  // Restore the skin from the store.
  // await reloadStoredCustomSkin();

  // Reload the playlist from the store.
  const songs = await player.loadPlaylist();

  // Populate the playlist UI.
  removeAllSongs(playlistSongsContainer);

  for (const song of songs) {
    // const playlistSongEl = createSongUI(playlistSongsContainer, song);
    let _tstr = Tags?Tags[song.id]:""
    const playlistSongEl = createSongUI(playlistSongsContainer, song, true,_tstr);// stateless = true

    playlistSongEl.addEventListener('play-song', () => {
      player.pause();
      player.play(song);
      updateUI()
      currentSongEl = playlistSongEl;
    });
  }
  if(songs.length > 0){
    playlistEl.classList.add('has-songs');
  } else {
    playlistEl.classList.remove('has-songs');
  }
  

  // Start the update loop.
  updateUI()
}

// Below are the event handlers for the UI.

// Manage the play button.
playButton.addEventListener("click", () => {
  
  if (player.isPlaying) {
    player.pause();
  } else {   
    player.play();
  }
  updateUI()
});

// Seek on playhead input.
playHeadInput.addEventListener("input", (e) => {
  player.currentTime = playHeadInput.value;
  updateUI()
});

// Manage the volume input
volumeInput.addEventListener("input", () => {
  
  player.volume = volumeInput.value / 10;
  setVolume(player.volume);
  updateUI()
});

// Manage the previous and next buttons.
function goPrevious() {
  // If this happened in the first few seconds of the song, go to the previous one.
  // Otherwise just restart the current song.
  const time = player.currentTime;
  const isSongStart = time < 3;

  if (isSongStart) {
    player.playPrevious();
  } else {
    player.currentTime = 0;
  }
}

previousButton.addEventListener("click", () => {
  goPrevious();
  updateUI()
});

nextButton.addEventListener("click", () => {
  player.playNext();
  updateUI()
});

// Also go to the next or previous songs if the SW asks us to do so.
navigator.serviceWorker.addEventListener('message', (event) => {
  switch (event.data.action) {
    case 'play':
      player.play();
      break;
    case 'next':

      player.playNext();
      break;
    case 'previous':
      goPrevious();
      break;
  }
  
  updateUI()
});


player.addEventListener("paused", () => {
  isVisualizing() && visualizer.stop();
  // Also tell the SW we're paused.
  sendMessageToSW({ action: 'paused' });
  updateUI()
});

async function sendMessageToSW(data) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration.active) {
    registration.active.postMessage(data);
  }
}

// Listen to beforeunload to clean things up.
addEventListener('beforeunload', () => {
  sendMessageToSW({ action: 'paused' });
  updateUI()
});

// Listen to song errors to let the user know they can't play remote songs while offline.
player.addEventListener("error", () => {
  if (currentSongEl) {
    currentSongEl.classList.add('error');
  }
});
player.addEventListener("playing", () => {
  if (currentSongEl) {
    currentSongEl.classList.remove('error');
  }
  updateUI()
});



function isVisualizing() {
  return document.documentElement.classList.contains('visualizing');
}

// Manage the visualizer button.
visualizerButton.addEventListener('click', toggleVisualizer);

function toggleVisualizer() {
  if(playlistSongsContainer.children.length == 0) {
    toast({msg:"歌曲库为空！"})
    return;
  }
  const isVis = isVisualizing();

  // If we're asked to visualize but no song is playing, start the first song.
  if (!isVis && !player.isPlaying) {
    player.play()
  }
  document.documentElement.classList.toggle('visualizing');
}

if (!isInstalledPWA && !isSidebarPWA) {
  window.addEventListener('beforeinstallprompt', e => {
    // Don't let the default prompt go.
    e.preventDefault();
  });
} 
// else {
//   installButton.disabled = true;
// }

// Start the app.
startApp();

// When we first start, tell the SW we're not playing.
sendMessageToSW({ action: 'paused' });

// Initialize the shortcuts.
initKeyboardShortcuts(player, toggleVisualizer);
const speak = Speaker()
function loadLyric(force=false){
  if( player.song && player.song.id){
    const lyric_songid = lyricPanel.getAttribute("songid")
    if((player.song.id !== lyric_songid) || force){
      let dir = "./imgs/"
      let count = 16
      
      if(document.documentElement.offsetWidth < 800){
        count =20
        dir ="./imgs/mobile/"
      }  
      
      let pictureid = parseInt(Math.random() * count)
      document.body.style.backgroundImage= 'url("'+dir+pictureid+'.jpg")'
      lyricPanel.setAttribute("songid",player.song.id)
      let text = ""
      const extra = Extrainfos ? Extrainfos[player.song.id] : null
      text = extra? extra["lyric"] : player.song.lyric

      if(text){
        lyric.load( text)
        setLyricPanel()
      }else {
        lyric.load("")
        setLyricPanel(true)
      }
        
      lyricPanel.scrollTo(0,0)
    }
  }
}

function lyric_click_handler(e){
  if(document.documentElement.classList.contains("playing")){
    const _time = e.target.getAttribute("data-time")
    const _currentTime = parseInt(_time.slice(0,2)) * 60 + parseInt(_time.slice(3,5))
    if(player.isBuffered()){
      player.currentTime = _currentTime
    } else {
      toast({msg:"未缓冲完成"})
    }
  } else {
    speak(e.target.innerText,false)
  }
}

function lyric_longpress_handler(e){
  const paddingLeft = 5
  let dict_panel = openDictPanel(e,paddingLeft)
  if(dict_panel){
    lyricPanel.appendChild(dict_panel)
  }
}

async function setLyricPanel(isEmpty=false){
  //updateExtra
  lyricPanel.innerHTML = ""
  if(isEmpty){

      let _song = await getSong(player.song.id)
      const lyric = await LyricParser(_song.title,_song.artist)
      if(lyric){
        document.dispatchEvent(new CustomEvent("store-extra",{bubbles:true,detail:{id:_song.id,extra:["lyric",lyric]}}))
      } 
  }

  let item_node = document.createElement("div")
  item_node.classList.add("lyric-item")
  if(lyric.symbols.length == 0){
    lyricPanel.innerHTML = "暂无在线歌词"
    const wrapper = document.createElement("p")
    const addbtn = document.createElement("button")
    addbtn.innerText = " + "
    addbtn.style = "color:var(--origin);cursor:pointer; background-color:#000;border: 1px solid var(--origin);border-radius: 50%; width: 30px;height: 30px;"
    addbtn.addEventListener("click",function (e) { 
      fileReader("lyric",player.song.id)
    })
    wrapper.innerHTML = "点击" + "添加本地歌词"
    wrapper.appendChild(addbtn)
    lyricPanel.appendChild(wrapper)
  } else {
    let nodes = lyric.symbols.map(s=>{
      let new_node = item_node.cloneNode(true)
      new_node.setAttribute("data-time",s)
      new_node.innerText = lyric.lyric[s]
      if(isMobile){
        let timeOutEvent = null;
        let isLongTouch = false
        new_node.addEventListener('touchstart', (e) => {
            timeOutEvent = setTimeout(() => {
              isLongTouch = true;
              timeOutEvent = 0;

              // ios 默认长按选中单词，对换行文字支持更好！
              // splitWords(e)
              // let dict_panel = seekWord(e,{padding:"5px"})
              lyric_longpress_handler(e)

            }, 700);
            return false;
        });
        new_node.addEventListener('touchend', (e) => {
            clearTimeout(timeOutEvent);
            if(isLongTouch){
              isLongTouch = false;
            } else {
              lyric_click_handler(e)
            }
            return false;
        });
      } else {
        new_node.addEventListener("dblclick",function(e){
          lyric_longpress_handler(e)
        })
      
        new_node.addEventListener("click",function(e){
          lyric_click_handler(e)
        })
      }
      return new_node
    })
    
    lyricPanel.innerHTML = ""
    lyricPanel.append(...nodes)
  }
}

//实时更新歌词 和 播放时间。
player.addEventListener('timeupdated', (e) => {
  const _currentTime = e.target.audio.currentTime
  update_player_times(_currentTime)
  let minites = parseInt(_currentTime /60)
  // let seconds = (e.target.audio.currentTime %60).toFixed(3)
  let seconds = parseInt(_currentTime %60)

  if(minites < 10) minites = "0"+minites
  if(seconds < 10) seconds = "0"+seconds
  // seconds = seconds+".000"
  const tag = minites + ":" +seconds
  if(lyric.symbols.includes(tag)){
    
    if(!document.querySelector(".lyric-item.playing[data-time='"+tag+"']")){
      const curplay = document.querySelector(".lyric-item.playing")
      const lastplay = document.querySelector(".lyric-item.last-playing")
      lastplay&&lastplay.classList.remove("last-playing")
      curplay && curplay.classList.remove("playing")
      curplay && curplay.classList.add("last-playing")
      const _t = document.querySelector(".lyric-item[data-time='"+tag+"']")
      const _h = _t.clientHeight
      _t.classList.add("playing")
      const _offset = lyricPanel.clientHeight - _t.offsetTop;
      const startpos = lyricPanel.clientHeight/2
      if(_offset < startpos){
        lyricPanel.scrollTo(0,lyricPanel.scrollTop + _h)
      }
    } 
  }

},false);


async function updateTags(){
  //取得修改信息
  //editSong(id, title, artist, album, lyric,picture,extra)
  const changed_items = playlistSongsContainer.querySelectorAll(".playlist-song.changed")
  let updatetags = []
  await changed_items.forEach(item=>{
    const tags = item.getAttribute("data-tags")
    const id = item.id;
    updatetags.push([id,tags])
    
  })
  if(updatetags.length>0) {
    await editSongTags(updatetags)
    return true;
  } else {
    return false;
  }
  
  
}
function manageSongs(){
  Manager.addEventListener("click",async e=>{
    const currentsongs = playlistSongsContainer.querySelectorAll(".playlist-song:not(.hide)")
    if(currentsongs.length == 0) return;
    if(Manager.classList.contains("edit")){
      //todo update store
      const result = await updateTags()
      Manager.classList.remove("edit")
      playlistSongsContainer.classList.remove("edit")
      document.documentElement.classList.remove("edit")
      Manager.innerText = "管理"
      
      if(result) {
        toast({msg:"修改完成"})
      }
      

    } else {
      if(document.documentElement.classList.contains("playing")){
        playButton.click()
        
      }
      Manager.classList.add("edit")
      playlistSongsContainer.classList.add("edit")
      document.documentElement.classList.add("edit")
      Manager.innerText = "完成"
      startApp()
    }
  })
}

function handle_tag(){
  TagMenus.forEach(el => {
    el.addEventListener("click",e=>{
      if(!el.classList.contains("select")){
        const selected = TagMenusContainer.querySelector(".select")
        selected.classList.remove("select")
        el.classList.add("select")
        const _type = el.innerText
        if(_type == "全部"){
          const hidesongs = playlistSongsContainer.querySelectorAll(".playlist-song.hide")
          hidesongs.forEach(song=>{
            song.classList.remove("hide")
          })
        }else {
          const songs = playlistSongsContainer.querySelectorAll(".playlist-song")

          songs.forEach(song=>{
            const t = song.getAttribute("data-tags")
            if(t.includes(_type)){
              song.classList.remove("hide")
            } else {
              song.classList.add("hide")
  
            }
          })
        }
      }
    })
  });
}

function delete_song_confirm_options(id){
  const del = document.createElement("div")
  const cancel = document.createElement("div")
  del.innerText = "确认删除"
  del.classList.add("primary-button")
  cancel.innerText = "取消"
  cancel.classList.add("cancel-button")
  del.addEventListener("click",async e=>{
    await deleteSong(id);
    await startApp();
    toast({msg:"已经删除"})
  })
  cancel.addEventListener("click",e=>{
    closeToast()
  })

  return [del,cancel]
}
addEventListener('delete-song', async(e) => {
  if(e.detail){
    toast({msg:"确定要删除此歌曲吗？",options:delete_song_confirm_options(e.detail)},true)
  }
});

addEventListener('store-extra', async e=>{
  const {id,extra} = e.detail;
  if( id && extra instanceof Array){
    await updateExtra(id,extra)
    Extrainfos = await getExtra()
    toast({msg:"载入成功，稍等！"})
    loadLyric(true)
  }
})
player.addEventListener('canplay', async e=>{
  if(playHeadInput.max == "NaN" || !playHeadInput.max) {
    playHeadInput.min = 0;
    playHeadInput.max = player.duration ;
  }
  durationLabel.innerText = formatTime(player.duration);
})

function update_player_times(current_time){
  if(current_time < 0) return ;
  currentTimeLabel.innerText = formatTime(current_time)
  playHeadInput.value = current_time
}
function attach_extra_events(){
  //添加本地歌曲
  const btn = document.querySelector("#add-local-song")
  btn.addEventListener("click",async function(e){
    const files = await openFilesFromDisk();
    try {
      createLoadingSongPlaceholders(playlistSongsContainer, files.length);
      await importSongsFromFiles(files);
      await startApp()
    } catch (error) {
      console.log(error)
    }
  })

  //单曲循环
  const repeat1 = document.querySelector("#repeat1")
  repeat1.addEventListener("click",e=>{
    const current = repeat1.getAttribute("current")
    if(!current || current == "default"){
      player.loop = true;
      repeat1.setAttribute("current","repeat-1")
      repeat1.querySelector(".default").classList.add("hide")
      repeat1.querySelector(".repeat-1").classList.remove("hide")
    } else {
      player.loop = false;
      repeat1.setAttribute("current","default")
      repeat1.querySelector(".default").classList.remove("hide")
      repeat1.querySelector(".repeat-1").classList.add("hide")

    }
     
  })
  //倍速播放
  SpeedBtn.addEventListener("click",()=>{
    SpeedOptions.classList.toggle("hide")
  })
  SpeedOptions.querySelectorAll("li").forEach(opt=>{
    opt.addEventListener("click",e=>{
      const value = opt.innerText
      player.playbackRate = value
      SpeedBtn.setAttribute("speed",value)
      SpeedBtn.innerText = value
      SpeedOptions.classList.add("hide")
    })
  })
}



window.onload = async ()=>{

  attach_extra_events()
  preload()
  manageSongs()
  handle_tag()
    document.addEventListener("click",e=>{
        const dict_panel_node = document.querySelector("#dict-panel")
        if(dict_panel_node &&(dict_panel_node.id=="dict-panel" ||dict_panel_node.contains(e.target))){
            dict_panel_node.remove()
        }
  })
  const isloaded = await sortSongsBy("title")
  if(isloaded) document.body.classList.remove("loading")
  
}
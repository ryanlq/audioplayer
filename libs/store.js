import { get, set } from './idb-keyval.js';
import { getUniqueId } from './utils.js';

export let wasStoreEmpty = false;

// Songs are stored in IDB as an array under the 'songs' key.
//
// Songs have unique IDs to identify them. Songs also have a title, artist, album, and duration.
// We do not read this information from the song file itself, this is stored in IDB too.
// 
// There are 2 types of songs: remote and file.
// A remote song is one that has a URL to a remote audio file. A remote song's ID is its URL.
// A file song is one that was loaded as a file from disk and stored in IDB. A file song's ID
// is a unique ID generated when importing the file.

/**
 * Get the list of all songs stored in IDB.
 */
export async function getSongs() {
  let songs = await get('pwamp-songs');

  if (!songs) {
    wasStoreEmpty = true;

    // The songs array doesn't even exist, so this is the first time we're running.
    // Add a couple of songs to get started so the app isn't empty.
    songs = [];

    await set('pwamp-songs', songs);

    // And store the artwork for those songs.
  }

  // Verify that all songs have the new dateAdded field,
  // If not, set it to the current date.
  for (let i = 0; i < songs.length; i++) {
    let needToStore = false;
    if (!songs[i].dateAdded) {
      songs[i].dateAdded = Date.now();
      needToStore = true;
    }

    if (needToStore) {
      await set('pwamp-songs', songs);
    }
  }

  return songs;
}

/**
 * Get a song by its ID.
 */
export async function getSong(id) {
  const songs = await getSongs();
  return songs.find(song => song.id === id);
}

/**
 * Check if the given remote song URL is already in IDB.
 */
export async function hasRemoteURLSong(url) {
  const songs = await getSongs();
  return !!songs.find(s => s.id === url);
}

/**
 * Add a new remote song to the list of songs in IDB.
 */
export async function addRemoteURLSong(url, title, artist, album, duration,extra={}) {
  await addSong('url', url, title, artist, album, duration,extra);
}

/**
 * DO NOT LOOP OVER THIS FUNCTION TO IMPORT SEVERAL FILES, THIS WILL LEAD TO
 * AN INCONSISTENT STORE STATE. USE addMultipleLocalFileSongs() INSTEAD.
 * Add a new file song to the list of songs in IDB.
 * The song is expected to be passed as a File object.
 */
export async function addLocalFileSong(file, title, artist, album, duration,picture=false,extra={}) {
  const id = getUniqueId();
  if(picture) await addSong('file', id, title, artist, album, duration, file,picture,extra);
  else await addSong('file', id, title, artist, album, duration, file,extra);
  
}

/**
 * Add several new file songs to the list of songs in IDB.
 */
export async function addMultipleLocalFileSongs(fileSongs) {
  fileSongs = fileSongs.map(fileSong => {
    return {
      title: fileSong.title,
      artist: fileSong.artist,
      album: fileSong.album,
      duration: fileSong.duration,
      data: fileSong.file,
      type: 'file',
      id: getUniqueId(),
      lyric: fileSong.lyric,
      dateAdded: Date.now(),
      picture:fileSong.picture,
      extra:{}
    }
  });

  let songs = await getSongs();
  songs = [...songs, ...fileSongs];
  await set('pwamp-songs', songs);
}

/**
 * Private implementation of addSong.
 */
async function addSong(type, id, title, artist, album, duration, data = null,picture=null,extra=null) {
  const song = {
    type,
    id,
    title,
    artist,
    album,
    duration,
    dateAdded: Date.now(),
    data,
    picture,
    extra
  };

  let songs = await getSongs();
  songs.push(song);
  await set('pwamp-songs', songs);
}

/**
 * Given the unique ID to an existing song, edit its title, artist and album.
 */
export async function editSong(id, title, artist, album, lyric,picture,extra) {
  const songs = await getSongs();
  const song = songs.find(s => s.id === id);
  if (!song) {
    throw new Error(`Could not find song with id ${id}`);
  }

  title && (song.title = title);
  artist && (song.artist = artist);
  album && (song.album = album);
  lyric && (song.lyric = lyric);
  picture && (song.picture = picture);

  await set('pwamp-songs', songs);
}
export async function editSongTags(updatetags) {
  let alltags = await getTags();
  if(!updatetags || updatetags.length==0) return;
  if (!alltags){
    await setTags({})
    alltags = await getTags();
  } 
  
  await updatetags.forEach(t => {
    alltags[t[0]] = t[1]
  });
  await set('pwamp-tags', alltags);

}
export async function updateExtra(id,[key,value]) {
  let extras = await getExtra();
  if (!extras || !id){
    await setExtra({})
    extras = await getExtra();
  } 
  
  if(!extras[id]){
    extras[id] = {}
  } 
  extras[id][key] = value
  await set('pwamp-extra', extras);
}

/**
 * Given the unique ID to an existing song, delete it from IDB.
 */
export async function deleteSong(id) {
  let songs = await getSongs();
  let tags = await getTags();
  let extras = await getExtra();
  songs = songs.filter(song => song.id !== id);
  delete tags[id]
  delete extras[id]
  await set('pwamp-songs', songs);
  await set('pwamp-tags', tags);
  await set('pwamp-extra', extras);
}

/**
 * Delete all songs from IDB.
 */
export async function deleteAllSongs() {
  await set('pwamp-songs', []);
}

export async function sortSongsBy(field) {
  if (['dateAdded', 'title', 'artist', 'album'].indexOf(field) === -1) {
    return;
  }

  let songs = await getSongs();

  songs = songs.sort((a, b) => {
    if (a[field] < b[field]) {
      return field === 'dateAdded' ? 1 : -1;
    } else if (a[field] > b[field]) {
      return field === 'dateAdded' ? -1 : 1;
    } else {
      return 0;
    }
  });
  await set('pwamp-songs', songs);
}

/**
 * Set the volume in IDB so that we can remember it next time.
 */
export async function setVolume(volume) {
  await set('pwamp-volume', volume);
}

/**
 * Get the stored volume.
 */
export async function getVolume() {
  return await get('pwamp-volume');
}

/**
 * Set a custom skin in IDB.
 */
export async function setCustomSkin(skin) {
  await set('pwamp-customSkin', skin);
}

/**
 * Get the currently stored custom skin.
 */
export async function getCustomSkin(skin) {
  return await get('pwamp-customSkin');
}

/**
 * Store a new artwork for the given artist and album.
 */
export async function setArtwork(artist, album, image) {
  let artworks = await get('pwamp-artworks');
  if (!artworks) {
    artworks = {};
  }
  artworks[`${artist}`] = image;
  await set('pwamp-artworks', artworks);
}

/**
 * Get the stored artworks.
 */
export async function getArtworks() {
  return await get('pwamp-artworks') || {};
}
export async function setTags(tags) {
  await set('pwamp-tags', tags);
}

export async function getTags() {
  return await get('pwamp-tags');
}
export async function setExtra(tags) {
  await set('pwamp-extra', tags);
}

export async function getExtra(id=null) {
  return await get('pwamp-extra');
}

export async function getExtraByID(id=null) {
  const extras = await getExtra()
  if(!extras || !id) return false;
  else {
    return extras && extras["id"]
  }
  
}

export async function setVariants(datas) {
  let variants = await getVariants()
  if(!variants) variants = {}
  datas.forEach(data=>{
    variants[data[0]] = data[1]
  })
  await set('dict-variants', variants);
}

export async function getVariants(id=null) {
  const variants = await get('dict-variants');
  if(variants && id){
    return variants[id];
  }
  return variants;
}

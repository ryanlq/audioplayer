import parseAudioMetadata from "./libs/parseAudioMetadata.js";

onmessage = async (e) => {
  console.log('Worker: Message received from main script');

  const metadata = await parseAudioMetadata(e.data);
  let msg = {
    album: metadata.album,
    artist: metadata.artist,
    title: metadata.title,
    picture: null
  }
  if(metadata["picture"]) msg['picture'] = metadata["picture"]

  postMessage(msg);
};

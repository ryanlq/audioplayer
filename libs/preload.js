const  images = [
    "./imgs/0.jpg",
    "./imgs/1.jpg",
    "./imgs/2.jpg",
    "./imgs/3.jpg",
    "./imgs/4.jpg",
    "./imgs/5.jpg",
    "./imgs/6.jpg",
    "./imgs/7.jpg",
    "./imgs/8.jpg",
    "./imgs/9.jpg",
    "./imgs/10.jpg",
    "./imgs/11.jpg",
    "./imgs/12.jpg",
    "./imgs/13.jpg",
    "./imgs/14.jpg",
    "./imgs/15.jpg",
    "./imgs/16.jpg",
  ]

async function loadImage(url) {
  return new Promise((resolve, reject) => {
    let imgObj = new Image()
    imgObj.onload = () => resolve("true");
    imgObj.onerror = reject;
    imgObj.src = url;
  });
}

export function preload(){
    images.forEach(async img=>{
        await loadImage(img);
    })
}
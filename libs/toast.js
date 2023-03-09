//destory last toast

let container =document.createElement("div") 
container.id = "toast"

container.style=`
    background-color:#171b23;
    width:auto;
    max-width:300px;
    height:auto;
    color:rgb(255 72 72);
    box-shadow: 0 2px 5px 0 rgb(255 255 255 / 26%);
    overflow: hidden;
    position:fixed;
    z-index:999;
    top:30%;
    left: 0;
    text-align: center;
    right: 0;
    margin: 0 auto;
    padding: 30px 0;
    border:1px solid #fff;
    
`

const optionsWrap = document.createElement("div")
optionsWrap.style=`
    display:flex;
    padding:10px;
    justify-content: space-around;
    margin-top: 30px;
    border-top: 1px solid #7d7d7d;
    padding: 20px 0px 0;
`

export function toast({msg,options=[]},always=false){
    closeToast()
    const toastNode = container.cloneNode(true)
    let toastOpts = ""
    if(options.length > 0){
        toastOpts = optionsWrap.cloneNode(true)
        toastOpts.append(...options)
        toastNode.append(msg,toastOpts)
    } else {
        toastNode.append(msg)
    }
    document.body.appendChild(toastNode)
    if(!always){
        setTimeout(() => {
            toastNode.remove()
        }, 1000);
    }
}
export function closeToast(){
    if(document.querySelector("#toast")){
        document.querySelector("#toast").remove()
    }    
}
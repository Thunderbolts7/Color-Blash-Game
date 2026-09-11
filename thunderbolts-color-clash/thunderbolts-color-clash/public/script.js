const socket=io();let state=null,pendingCard=null;
const $=id=>document.getElementById(id);
socket.on("errorMessage",m=>{$("error").textContent=m;setTimeout(()=>$("error").textContent="",3000)});
socket.on("roomCreated",c=>{$("code").value=c;$("roomInfo").innerHTML=`<h3>Room Code: <b>${c}</b></h3>Share this with friends.`});
socket.on("gameState",s=>{state=s;render();});

function createRoom(){socket.emit("createRoom",{name:$("name").value,maxPlayers:10})}
function joinRoom(){socket.emit("joinRoom",{name:$("name").value,code:$("code").value})}
function startGame(){socket.emit("startGame")}
function drawCard(){socket.emit("drawCard")}
function callUno(){socket.emit("callUno")}
function catchUno(){socket.emit("catchUno")}
function chooseColor(c){$("colorPicker").classList.add("hidden");socket.emit("playCard",{cardId:pendingCard.id,chosenColor:c});pendingCard=null}

function symbol(c){if(c.type==="number")return c.value;if(c.type==="skip")return"⛔";if(c.type==="reverse")return"🔄";if(c.type==="draw2")return"+2";if(c.type==="wild")return"🌈";return"+4"}
function cardClass(c){return c.color==="wild"?"wild":c.color}
function render(){
 if(!state)return;
 if(!state.started){
   $("players").innerHTML=state.players.map(p=>`<div class="player">${p.name}${p.id===state.host?" 👑 Host":""}</div>`).join("");
   $("roomInfo").innerHTML=`<h3>Players: ${state.players.length}/${state.maxPlayers||10}</h3>`;
   $("start").classList.toggle("hidden",state.host!==socket.id);return;
 }
 $("lobby").classList.add("hidden");$("game").classList.remove("hidden");
 const me=state.players.find(p=>p.id===socket.id);
 $("status").textContent=state.winner?"Game Over":state.turn===socket.id?"⚡ YOUR TURN!":"Waiting for turn...";
 $("opponents").innerHTML=state.players.filter(p=>p.id!==socket.id).map(p=>`<div class="opponent ${p.id===state.turn?"turn":""}">👤 <b>${p.name}</b><br>🃏 ${p.cards}${p.uno?" • UNO!":""}</div>`).join("");
 const top=state.topCard;$("discard").className="pile "+cardClass(top);$("discard").textContent=symbol(top);
 $("colorIndicator").innerHTML=`ACTIVE: <b class="${state.activeColor}">${state.activeColor.toUpperCase()}</b>`;
 $("hand").innerHTML="";
 state.hand.forEach(c=>{const el=document.createElement("button");el.className="card "+cardClass(c);el.innerHTML=`<span>${symbol(c)}</span>`;el.onclick=()=>{
   if(c.type==="wild"||c.type==="wild4"){pendingCard=c;$("colorPicker").classList.remove("hidden")}
   else socket.emit("playCard",{cardId:c.id});
 };$("hand").appendChild(el)});
 if(state.winner){const p=state.players.find(x=>x.id===state.winner);$("winnerName").textContent=`${p?.name||"Player"} WINS! ⚡`; $("winner").classList.remove("hidden")}
}
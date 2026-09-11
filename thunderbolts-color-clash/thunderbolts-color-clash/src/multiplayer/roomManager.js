const GameEngine=require("../game/gameEngine");
const chars="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const code=()=>Array.from({length:6},()=>chars[Math.floor(Math.random()*chars.length)]).join("");

class RoomManager{
  constructor(io){this.io=io;this.rooms=new Map();}
  makeState(room, socketId){
    const g=room.game;
    if(!g) return {code:room.code,host:room.host,players:room.players,started:false};
    return {
      code:room.code,started:true,activeColor:g.activeColor,turn:g.current().id,
      direction:g.direction,winner:g.winner,
      topCard:g.discard[g.discard.length-1],
      players:g.players.map(p=>({id:p.id,name:p.name,cards:p.hand.length,uno:p.uno})),
      hand:g.players.find(p=>p.id===socketId)?.hand||[]
    };
  }
  broadcast(room){
    for(const p of room.players)this.io.to(p.id).emit("gameState",this.makeState(room,p.id));
  }
  createRoom(socket,name,maxPlayers){
    if(!name?.trim()) return socket.emit("errorMessage","Enter your name");
    let c;do{c=code()}while(this.rooms.has(c));
    const room={code:c,host:socket.id,maxPlayers:Math.min(Math.max(+maxPlayers||10,2),10),players:[{id:socket.id,name:name.trim()}],game:null};
    this.rooms.set(c,room);socket.join(c);socket.emit("roomCreated",c);this.broadcast(room);
  }
  joinRoom(socket,name,c){
    c=(c||"").toUpperCase();
    const room=this.rooms.get(c);
    if(!room)return socket.emit("errorMessage","Room not found");
    if(room.game)return socket.emit("errorMessage","Game already started");
    if(room.players.length>=room.maxPlayers)return socket.emit("errorMessage","Room is full");
    if(!name?.trim())return socket.emit("errorMessage","Enter your name");
    room.players.push({id:socket.id,name:name.trim()});socket.join(c);this.broadcast(room);
  }
  roomOf(id){return [...this.rooms.values()].find(r=>r.players.some(p=>p.id===id));}
  startGame(socket){
    const r=this.roomOf(socket.id);if(!r)return;
    if(r.host!==socket.id)return socket.emit("errorMessage","Only host can start");
    if(r.players.length<2)return socket.emit("errorMessage","Need at least 2 players");
    r.game=new GameEngine(r.players);this.broadcast(r);
  }
  action(socket,fn){
    const r=this.roomOf(socket.id);if(!r?.game)return;
    try{fn(r.game);this.broadcast(r);}catch(e){socket.emit("errorMessage",e.message);}
  }
  playCard(s,id,color){this.action(s,g=>g.play(s.id,id,color));}
  drawCard(s){this.action(s,g=>g.draw(s.id));}
  callUno(s){this.action(s,g=>g.callUno(s.id));}
  catchUno(s){this.action(s,g=>g.catchUno(s.id));}
  disconnect(socket){
    const r=this.roomOf(socket.id);if(!r)return;
    r.players=r.players.filter(p=>p.id!==socket.id);
    if(!r.players.length)this.rooms.delete(r.code);
    else {if(r.host===socket.id)r.host=r.players[0].id;this.broadcast(r);}
  }
}
module.exports=RoomManager;
const {createDeck,shuffle,COLORS}=require("./deck");

class GameEngine {
  constructor(players){
    this.players=players.map(p=>({...p,hand:[],uno:false}));
    this.deck=shuffle(createDeck());
    this.discard=[];
    this.direction=1;
    this.turn=0;
    this.activeColor=null;
    this.started=true;
    this.winner=null;
    this.pendingCatch=null;
    this.players.forEach(p=>p.hand=this.deck.splice(0,7));
    this.startCard();
  }
  startCard(){
    let c=this.deck.pop();
    while(c.type==="wild4"){ this.deck.unshift(c); shuffle(this.deck); c=this.deck.pop(); }
    this.discard.push(c);
    this.activeColor=c.color==="wild"?COLORS[Math.floor(Math.random()*4)]:c.color;
    if(c.type==="skip") this.advance(2);
    else if(c.type==="reverse"){this.direction=-1; this.advance(1);}
    else if(c.type==="draw2"){this.drawTo(0,2);this.advance(2);}
  }
  current(){return this.players[this.turn];}
  advance(steps=1){
    const n=this.players.length;
    this.turn=((this.turn+this.direction*steps)%n+n)%n;
  }
  recycle(){
    if(this.deck.length) return;
    const top=this.discard.pop();
    this.deck=shuffle(this.discard);
    this.discard=[top];
  }
  drawTo(index,count){
    for(let i=0;i<count;i++){this.recycle();if(this.deck.length)this.players[index].hand.push(this.deck.pop());}
  }
  isPlayable(p,c){
    const top=this.discard[this.discard.length-1];
    if(c.type==="wild") return true;
    if(c.type==="wild4") return !p.hand.some(x=>x.id!==c.id && x.color===this.activeColor);
    return c.color===this.activeColor || (c.type===top.type && c.type!=="number") ||
      (c.type==="number" && top.type==="number" && c.value===top.value);
  }
  play(playerId,cardId,chosenColor){
    const i=this.players.findIndex(p=>p.id===playerId);
    if(i!==this.turn) throw Error("Not your turn");
    const p=this.players[i], ci=p.hand.findIndex(c=>c.id===cardId);
    if(ci<0) throw Error("You do not own this card");
    const c=p.hand[ci];
    if(!this.isPlayable(p,c)) throw Error("Invalid card");
    if(c.color==="wild" && !COLORS.includes(chosenColor)) throw Error("Choose a valid color");
    p.hand.splice(ci,1); this.discard.push(c);
    this.activeColor=c.color==="wild"?chosenColor:c.color;
    if(p.hand.length===1) this.pendingCatch=p.id;
    else this.pendingCatch=null;
    if(p.hand.length===0){this.winner=p.id;return;}
    if(c.type==="reverse"){
      if(this.players.length===2) this.advance(2);
      else {this.direction*=-1;this.advance(1);}
    } else if(c.type==="skip") this.advance(2);
    else if(c.type==="draw2"){this.advance(1);this.drawTo(this.turn,2);this.advance(1);}
    else if(c.type==="wild4"){this.advance(1);this.drawTo(this.turn,4);this.advance(1);}
    else this.advance(1);
  }
  draw(playerId){
    const i=this.players.findIndex(p=>p.id===playerId);
    if(i!==this.turn) throw Error("Not your turn");
    this.recycle(); if(!this.deck.length) throw Error("No cards left");
    const c=this.deck.pop(); this.players[i].hand.push(c);
    if(!this.isPlayable(this.players[i],c)) this.advance(1);
    return c;
  }
  callUno(id){const p=this.players.find(p=>p.id===id);if(p&&p.hand.length===1){p.uno=true;this.pendingCatch=null;}}
  catchUno(catcher){
    if(!this.pendingCatch || this.pendingCatch===catcher) throw Error("No valid UNO catch");
    const p=this.players.find(x=>x.id===this.pendingCatch);
    if(!p||p.hand.length!==1) throw Error("No valid UNO catch");
    this.drawTo(this.players.indexOf(p),2);p.uno=false;this.pendingCatch=null;
  }
}
module.exports=GameEngine;
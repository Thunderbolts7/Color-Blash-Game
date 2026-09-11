const COLORS = ["red","blue","green","yellow"];
let uid = 0;
const card = (color, type, value=type) => ({id:`c${++uid}`, color, type, value});

function createDeck(){
  const deck=[];
  for(const color of COLORS){
    deck.push(card(color,"number",0));
    for(let n=1;n<=9;n++){ deck.push(card(color,"number",n),card(color,"number",n)); }
    for(const type of ["skip","reverse","draw2"])
      deck.push(card(color,type),card(color,type));
  }
  for(let i=0;i<4;i++) deck.push(card("wild","wild"),card("wild","wild4"));
  return deck;
}
function shuffle(deck){
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return deck;
}
module.exports={createDeck,shuffle,COLORS};
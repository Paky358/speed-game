// controlla che ogni voce abbia un disegno (suo o simile) e che ogni combinazione dia un SVG senza errori
global.window={};global.document={createElement:()=>({})};
require('D:/SG-avatar-a/js/omino.js');require('D:/SG-avatar-a/js/omino-a.js');require('D:/SG-avatar-a/js/omino-a-pezzi.js');
const O=window.SGOmino,A=window.SGOminoA;global.SGOminoA=A;O.stile('illustrato');
const voci={capelli:'capelli',capo:'capo',sotto:'sotto',modScarpe:'scarpe',cappello:'cappelli',bocca:'bocca',barba:'barba',segno:'segno'};
for(const v in voci){const tipo=voci[v];const fatti=[],simili=[];O.OPZ[v].forEach(x=>{if(/^(nessun[oa]|no)$/.test(x))return;if(A[tipo][x])fatti.push(x);else{const p=A.pezzoDi(tipo,x);simili.push(x+'→'+(p?p.nome:'NIENTE'));}});console.log(v+': '+fatti.length+' disegnati; '+(simili.length?'ripieghi: '+simili.join(' '):'tutti'));}
let err=0,n=0,max=0;for(let i=0;i<400;i++){const c=O.casuale('p'+i);c.cappello=i%3?c.cappello:'nessuno';try{const s=O.svg(c,i%5?{}:{busto:true});n++;max=Math.max(max,s.length);if(!/omino-a/.test(s))console.log('non illustrato',i);}catch(e){err++;if(err<5)console.log('ERRORE',i,e.message);}}
['su','uno','canna'].forEach(b=>{try{O.svg(O.casuale('x'),{braccia:b,angolo:40});}catch(e){console.log('ERR braccia',b,e.message)}});
console.log('prove '+n+', errori '+err+', svg più lungo '+max+' caratteri');

/* Lanterne · gioco di deduzione per SPeeD GAME.
   File unito da gioco/costruisci.mjs: si cambiano i pezzi in gioco/src/, non questo file. */
(function () {
"use strict";

// ===== mappa.js =====
// Mappe e geometria: le usano sia il telefono sia il server delle stanze.
const T = 32;
const RP = 0.3 * T;
const DIR4 = [[1,0],[-1,0],[0,1],[0,-1]];
const CORRIDOIO = { nome:'Corridoio', in:'in un corridoio' };

function crea(d){
  const { GW, GH } = d, N = GW*GH;
  const PAV = new Int8Array(N).fill(-2);   // -2 fuori, -1 corridoio, >=0 stanza
  const MURO = new Uint8Array(N), SOL = new Uint8Array(N), BORDO = new Uint8Array(N), ACQUA = new Uint8Array(N);
  // una stanza è il suo rettangolo, più le «parti» (nicchie, absidi, moli), meno i «tagli» (angoli e rientri)
  const segna=(r,v)=>{ for(let y=r.y;y<r.y+r.h;y++) for(let x=r.x;x<r.x+r.w;x++) PAV[y*GW+x]=v; };
  d.stanze.forEach((s,i)=>{ segna(s,i); (s.parti||[]).forEach(r=>segna(r,i)); });
  d.stanze.forEach(s=>(s.tagli||[]).forEach(r=>segna(r,-2)));
  d.corridoi.forEach(([x0,y0,w,h])=>{ for(let y=y0;y<y0+h;y++) for(let x=x0;x<x0+w;x++) if(PAV[y*GW+x]===-2) PAV[y*GW+x]=-1; });
  d.acqua.forEach(([x0,y0,w,h])=>{ for(let y=y0;y<Math.min(GH,y0+h);y++) for(let x=x0;x<Math.min(GW,x0+w);x++) if(PAV[y*GW+x]===-2) ACQUA[y*GW+x]=1; });
  for(let i=0;i<N;i++){ MURO[i] = (PAV[i]===-2 && !ACQUA[i]) ? 1 : 0; SOL[i] = PAV[i]===-2 ? 1 : 0; }
  d.ostacoli.forEach(o=>{ for(let y=o.y;y<o.y+o.h;y++) for(let x=o.x;x<o.x+o.w;x++) SOL[y*GW+x]=1; });
  for(let y=0;y<GH;y++) for(let x=0;x<GW;x++){
    const i=y*GW+x; if(!MURO[i]) continue;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const xx=x+dx, yy=y+dy; if(xx>=0&&yy>=0&&xx<GW&&yy<GH&&PAV[yy*GW+xx]!==-2) BORDO[i]=1; }
  }
  return { ...d, N, PAV, MURO, SOL, BORDO, ACQUA };
}

// Palazzo Velmare: disegno originale. Il Cortile è il centro; l'ala ovest (Cappella, Sala della musica) e la Sala del telegrafo
// non toccano il Cortile: ci si arriva solo dai corridoi laterali. Le botole sono a gruppetti vicini.
const PALAZZO = crea({
  nome:'Palazzo Velmare', GW:72, GH:50,
  stanze:[
    { nome:'Biblioteca', in:'in Biblioteca', x:3, y:3, w:12, h:8, c1:'#3b3029', c2:'#41352d',
      parti:[{x:6,y:2,w:3,h:1}], tagli:[{x:12,y:3,w:3,h:2}] },                     // nicchia di lettura a nord, angolo rientrato a est
    { nome:'Salone delle feste', in:'nel Salone', x:26, y:3, w:18, h:9, c1:'#4a3236', c2:'#52393d',
      parti:[{x:31,y:2,w:10,h:1}], tagli:[{x:26,y:3,w:2,h:2},{x:42,y:3,w:2,h:2},{x:26,y:10,w:2,h:2},{x:42,y:10,w:2,h:2}] },   // angoli smussati, nicchia dell'orchestra
    { nome:"Torre dell'orologio", in:'nella Torre', x:56, y:3, w:9, h:7, c1:'#33363f', c2:'#3a3d47',
      parti:[{x:59,y:2,w:3,h:1}], tagli:[{x:56,y:3,w:1,h:1},{x:64,y:3,w:1,h:1}] },  // la nicchia del quadrante
    { nome:'Cortile', in:'nel Cortile', x:27, y:18, w:18, h:12, c1:'#3a3f3a', c2:'#414741',
      tagli:[{x:27,y:28,w:2,h:2},{x:43,y:28,w:2,h:2}] },
    { nome:'Cappella', in:'in Cappella', x:3, y:15, w:8, h:6, c1:'#2f3046', c2:'#35364d',
      parti:[{x:5,y:13,w:4,h:2}], tagli:[{x:3,y:20,w:1,h:1},{x:10,y:20,w:1,h:1}] },   // l'abside con l'altare
    { nome:'Sala della musica', in:'nella Sala della musica', x:3, y:24, w:8, h:6, c1:'#3f2f3a', c2:'#463440',
      parti:[{x:1,y:25,w:2,h:4}], tagli:[{x:3,y:24,w:1,h:1},{x:10,y:24,w:1,h:1},{x:3,y:29,w:1,h:1},{x:10,y:29,w:1,h:1}] },   // bovindo a ovest
    { nome:'Cucine', in:'nelle Cucine', x:16, y:15, w:9, h:9, c1:'#463b2c', c2:'#4d4131',
      parti:[{x:17,y:24,w:4,h:2}], tagli:[{x:16,y:15,w:2,h:2}] },                   // la dispensa a sud
    { nome:'Cantina', in:'in Cantina', x:3, y:36, w:12, h:9, c1:'#2f2a30', c2:'#353036',
      parti:[{x:5,y:45,w:5,h:2}], tagli:[{x:3,y:36,w:2,h:2}] },                    // la grotta dei vini
    { nome:'Lavanderia', in:'in Lavanderia', x:17, y:38, w:8, h:6, c1:'#2e3a3f', c2:'#344247',
      parti:[{x:19,y:44,w:4,h:2}], tagli:[{x:17,y:38,w:2,h:1}] },                   // il cortiletto per stendere
    { nome:'Galleria dei ritratti', in:'nella Galleria', x:28, y:35, w:14, h:6, c1:'#3d3346', c2:'#44394e',
      tagli:[{x:28,y:35,w:1,h:1},{x:41,y:35,w:1,h:1},{x:41,y:40,w:1,h:1}] },
    { nome:'Sorveglianza', in:'in Sorveglianza', x:48, y:19, w:8, h:5, c1:'#253038', c2:'#2a363f',
      tagli:[{x:48,y:23,w:1,h:1}] },
    { nome:'Serra', in:'nella Serra', x:58, y:14, w:11, h:11, c1:'#2c3f33', c2:'#314638',
      parti:[{x:69,y:17,w:2,h:5}], tagli:[{x:58,y:14,w:1,h:1},{x:68,y:14,w:1,h:1},{x:58,y:24,w:1,h:1},{x:68,y:24,w:1,h:1}] },   // la veranda di vetro a est
    { nome:'Sala del telegrafo', in:'nella Sala del telegrafo', x:60, y:31, w:8, h:5, c1:'#38332a', c2:'#3f3930',
      tagli:[{x:66,y:31,w:2,h:1}] },
    { nome:'Molo', in:'sul Molo', x:46, y:38, w:20, h:7, c1:'#4a3b2b', c2:'#55442f', assi:true,
      parti:[{x:57,y:45,w:2,h:3}], tagli:[{x:64,y:38,w:2,h:1}] },                   // il pontile della barca
  ],
  corridoi:[
    [15,6,11,2],   // Biblioteca - Salone
    [44,6,12,2],   // Salone - Torre
    [34,12,4,6],   // Salone - Cortile
    [12,11,2,25],  // il corridoio dell'ala ovest
    [11,17,1,2], [11,26,1,2], [14,19,2,2],   // porte di Cappella, Sala della musica e Cucine sul corridoio ovest
    [25,19,2,3],   // Cucine - Cortile
    [45,20,3,2],   // Cortile - Sorveglianza
    [56,20,2,2],   // Sorveglianza - Serra
    [60,10,2,4],   // Torre - Serra
    [63,25,2,6],   // Serra - Sala del telegrafo
    [62,36,2,2],   // Sala del telegrafo - Molo
    [33,30,3,5],   // Cortile - Galleria
    [42,38,4,2],   // Galleria - Molo
    [25,39,3,2],   // Galleria - Lavanderia
    [15,40,2,2],   // Cantina - Lavanderia
  ],
  acqua:[[44,45,28,5],[66,36,6,14]],
  // i mobili: ognuno è un oggetto a sé (tipo, posto, misure), anche per il nascondino che verrà
  ostacoli:[
    {x:34,y:22,w:4,h:4,t:'fontana'},
    {x:33,y:18,w:1,h:1,t:'albero'},{x:38,y:18,w:1,h:1,t:'albero'},{x:27,y:26,w:1,h:1,t:'albero'},{x:44,y:26,w:1,h:1,t:'albero'},
    {x:30,y:29,w:2,h:1,t:'panchina'},{x:40,y:29,w:2,h:1,t:'panchina'},
    {x:3,y:3,w:3,h:1,t:'scaffale'},{x:9,y:3,w:3,h:1,t:'scaffale'},{x:9,y:7,w:3,h:1,t:'scaffale'},
    {x:6,y:2,w:1,h:1,t:'poltrona'},
    {x:28,y:3,w:3,h:2,t:'tavolo'},{x:39,y:3,w:3,h:2,t:'tavolo'},{x:28,y:10,w:3,h:2,t:'tavolo'},{x:39,y:10,w:3,h:2,t:'tavolo'},
    {x:32,y:2,w:1,h:1,t:'candelabro'},{x:33,y:2,w:1,h:1,t:'arpa'},{x:39,y:2,w:1,h:1,t:'candelabro'},
    {x:59,y:4,w:3,h:3,t:'ingranaggio'},{x:62,y:5,w:2,h:2,t:'plastico'},
    {x:5,y:13,w:4,h:1,t:'altare'},{x:3,y:18,w:2,h:1,t:'panca'},
    {x:3,y:15,w:1,h:1,t:'candelabro'},{x:10,y:15,w:1,h:1,t:'candelabro'},
    {x:4,y:24,w:3,h:2,t:'piano'},{x:1,y:26,w:1,h:1,t:'arpa'},
    {x:21,y:15,w:4,h:1,t:'banco'},{x:22,y:22,w:2,h:2,t:'forno'},
    {x:17,y:25,w:2,h:1,t:'sacchi'},{x:19,y:25,w:2,h:1,t:'dispensa'},
    {x:4,y:38,w:2,h:2,t:'botte'},{x:4,y:43,w:2,h:2,t:'botte'},{x:10,y:43,w:2,h:2,t:'botte'},
    {x:6,y:46,w:3,h:1,t:'rastrelliera'},
    {x:20,y:38,w:4,h:1,t:'stendino'},{x:20,y:44,w:2,h:1,t:'tinozza'},{x:19,y:45,w:4,h:1,t:'stendino'},
    {x:37,y:40,w:1,h:1,t:'cavalletto'},
    {x:49,y:19,w:5,h:1,t:'console'},{x:48,y:19,w:1,h:1,t:'armadietto'},{x:55,y:19,w:1,h:1,t:'armadietto'},
    {x:59,y:22,w:3,h:3,t:'aiuola'},{x:58,y:15,w:2,h:4,t:'aiuola'},{x:66,y:22,w:3,h:2,t:'aiuola'},
    {x:70,y:17,w:1,h:1,t:'albero'},
    {x:60,y:31,w:3,h:1,t:'telegrafo'},   // nell'angolo: la porta dalla Serra (x 63-64) resta libera
    {x:66,y:32,w:2,h:1,t:'baule'},
    {x:46,y:41,w:1,h:3,t:'cassa'},{x:55,y:38,w:3,h:1,t:'cassa'},{x:64,y:41,w:2,h:1,t:'cassa'},
    // dal 30/10 sera tutto quello che ha un volume nel palazzo reso in Blender è solido: niente sedie o vasi che si attraversano
    {x:7,y:2,w:1,h:1,t:'tavolino'},{x:8,y:2,w:1,h:1,t:'libri'},{x:13,y:5,w:2,h:1,t:'scrittoio'},{x:12,y:5,w:1,h:1,t:'sedia'},{x:3,y:10,w:1,h:1,t:'mappamondo'},{x:3,y:7,w:1,h:1,t:'libri'},{x:11,y:8,w:1,h:1,t:'scala'},{x:4,y:10,w:3,h:1,t:'tavolo_mappe'},{x:3,y:8,w:1,h:1,t:'rotoli'},{x:3,y:9,w:1,h:1,t:'statua'},   // Biblioteca (tutto a corona: scaffali al muro nord, angolo di lettura nella nicchia, scrittoio sotto la finestra, tavolo delle carte a sud; in mezzo solo lo scaffale del compito con la sua scala)
    {x:31,y:11,w:1,h:1,t:'sedia'},{x:34,y:2,w:1,h:1,t:'sedia'},{x:37,y:2,w:1,h:1,t:'leggio'},{x:38,y:2,w:1,h:1,t:'sedia'},{x:40,y:2,w:1,h:1,t:'vaso'},
    {x:26,y:5,w:1,h:1,t:'vaso'},{x:43,y:5,w:1,h:1,t:'vaso'},{x:26,y:9,w:1,h:1,t:'vaso'},{x:43,y:9,w:1,h:1,t:'vaso'},{x:33,y:11,w:1,h:1,t:'statua'},{x:38,y:11,w:1,h:1,t:'statua'},{x:27,y:5,w:1,h:1,t:'tavolino'},{x:42,y:5,w:1,h:1,t:'tavolino'},{x:27,y:9,w:1,h:1,t:'tavolino'},{x:42,y:9,w:1,h:1,t:'tavolino'},   // Salone (le quattro tavole nei quattro angoli, la sala libera sull'intarsio; le statue ai lati della porta sud, i tavolini nelle rientranze delle ali)
    {x:56,y:9,w:3,h:1,t:'banco_attrezzi'},{x:64,y:5,w:1,h:2,t:'armadio'},{x:57,y:3,w:1,h:1,t:'cassa'},{x:63,y:3,w:1,h:1,t:'regolatore'},{x:64,y:4,w:1,h:1,t:'contrappesi'},   // Torre (la piazza a L fra le due porte, la botola e i compiti; i mobili a nord e a est della macchina)
    {x:29,y:18,w:1,h:1,t:'campana'},{x:29,y:28,w:1,h:1,t:'lampione'},{x:42,y:28,w:1,h:1,t:'lampione'},{x:31,y:18,w:2,h:1,t:'fioriera'},{x:39,y:18,w:2,h:1,t:'fioriera'},
    {x:27,y:22,w:1,h:1,t:'statua'},{x:44,y:22,w:1,h:1,t:'statua'},{x:27,y:18,w:1,h:1,t:'vaso'},{x:44,y:18,w:1,h:1,t:'vaso'},{x:42,y:18,w:2,h:1,t:'cassa'},{x:30,y:18,w:1,h:1,t:'cesto'},{x:28,y:18,w:1,h:1,t:'appoggio'},{x:41,y:18,w:1,h:1,t:'botte'},{x:27,y:27,w:2,h:1,t:'tavolino'},{x:43,y:27,w:2,h:1,t:'tavolino'},{x:29,y:27,w:1,h:1,t:'sedia'},{x:42,y:27,w:1,h:1,t:'sedia'},{x:29,y:29,w:1,h:1,t:'vaso'},{x:42,y:29,w:1,h:1,t:'vaso'},   // Cortile (scopa e secchio, botte del vino, i due tavoli del rinfresco con le sedie, gli alberelli negli angoli sud)
    {x:3,y:16,w:2,h:1,t:'panca'},{x:9,y:16,w:2,h:1,t:'panca'},{x:5,y:14,w:1,h:1,t:'leggio'},{x:8,y:14,w:1,h:1,t:'vaso'},{x:10,y:19,w:1,h:1,t:'vaso'},{x:3,y:19,w:1,h:1,t:'statua'},{x:4,y:15,w:1,h:1,t:'sgabello'},{x:9,y:15,w:1,h:1,t:'sgabello'},{x:3,y:17,w:1,h:1,t:'appoggio'},{x:4,y:20,w:1,h:1,t:'cassa'},   // Cappella (banchi contro i fianchi, navata libera; panchetto dei cuscini fra i banchi a ovest, acquasantiera accanto alla porta, santo, ceri e cassone nell'angolo sud-ovest)
    {x:3,y:25,w:1,h:1,t:'sgabello'},{x:10,y:25,w:1,h:1,t:'sedia'},{x:9,y:29,w:1,h:1,t:'leggio'},{x:1,y:27,w:1,h:1,t:'leggio'},{x:5,y:29,w:3,h:1,t:'divano'},{x:1,y:25,w:2,h:1,t:'credenza'},{x:9,y:24,w:1,h:1,t:'violoncello'},{x:1,y:28,w:2,h:1,t:'tavolo_basso'},{x:8,y:29,w:1,h:1,t:'tavolino'},{x:4,y:29,w:1,h:1,t:'appoggio'},{x:7,y:24,w:2,h:1,t:'credenza'},   // Sala della musica (il pianoforte contro il muro nord, il tavolino del tè e il secondo leggio nel bovindo, la sedia del violino nell'angolo: tre righe libere dal bovindo alla porta)
    {x:16,y:21,w:1,h:1,t:'sgabello'},{x:24,y:16,w:1,h:1,t:'botte'},{x:16,y:17,w:3,h:2,t:'tavolo_cucina'},{x:18,y:15,w:3,h:1,t:'credenza'},{x:24,y:17,w:1,h:1,t:'botte'},{x:16,y:22,w:1,h:1,t:'cesto'},{x:16,y:23,w:1,h:1,t:'cesto'},{x:24,y:22,w:1,h:2,t:'legna'},{x:18,y:16,w:1,h:1,t:'cesto'},   // Cucine (tutto a corona: il tavolo nell'angolo sotto la stanga, il forno e la legna a sud-est, il banco sotto il rame, l'orcio dell'olio accanto alla piattaia)
    {x:12,y:44,w:1,h:1,t:'botte'},{x:6,y:38,w:1,h:1,t:'cassa'},{x:5,y:36,w:1,h:2,t:'cassa'},{x:9,y:36,w:2,h:1,t:'cassa'},{x:14,y:37,w:1,h:2,t:'bottiglie'},{x:3,y:38,w:1,h:2,t:'botti'},{x:6,y:36,w:1,h:1,t:'tavolino'},{x:9,y:44,w:1,h:1,t:'volante'},{x:14,y:42,w:1,h:2,t:'botti'},{x:14,y:39,w:1,h:1,t:'cassa'},{x:14,y:44,w:1,h:1,t:'cassa'},{x:14,y:36,w:1,h:1,t:'cassa'},{x:3,y:43,w:1,h:2,t:'botti'},{x:5,y:45,w:1,h:1,t:'cassa'},{x:5,y:46,w:1,h:1,t:'cassa'},   // Cantina (tutto contro i muri: in mezzo solo pavimento; il banco dell'imbottigliatura a nord, la botte grande accanto alla chiusa)
    {x:23,y:42,w:1,h:1,t:'quadro_luci'},{x:19,y:43,w:1,h:1,t:'cesto'},{x:19,y:38,w:1,h:1,t:'cesto'},{x:24,y:41,w:1,h:1,t:'stufa'},{x:24,y:38,w:1,h:1,t:'armadio'},{x:17,y:39,w:2,h:1,t:'lavatoio'},{x:17,y:43,w:2,h:1,t:'asse_stiro'},{x:19,y:39,w:1,h:1,t:'cesto'},{x:24,y:42,w:1,h:1,t:'cesto'},{x:19,y:44,w:1,h:1,t:'cesto'},{x:22,y:44,w:1,h:1,t:'cesto'},   // Lavanderia (il mangano accanto al lavatoio, il carbone nella nicchia dietro il quadro, secchi, tinozze e lino nel cortiletto: a ovest resta il passaggio libero dalla porta)
    {x:31,y:40,w:2,h:1,t:'panca'},{x:28,y:37,w:1,h:1,t:'statua'},{x:41,y:37,w:1,h:1,t:'statua'},{x:34,y:38,w:2,h:1,t:'teca'},{x:39,y:40,w:1,h:1,t:'tele'},{x:38,y:40,w:1,h:1,t:'tavolino'},{x:30,y:35,w:2,h:1,t:'credenza'},{x:38,y:35,w:2,h:1,t:'credenza'},{x:29,y:35,w:1,h:1,t:'vaso'},{x:40,y:35,w:1,h:1,t:'vaso'},{x:40,y:40,w:1,h:1,t:'tele'},   // Galleria (la teca è il cuore, con due caselle libere intorno; il banco del restauratore nell'angolo sud-est)
    {x:54,y:19,w:1,h:1,t:'armadietto'},{x:50,y:23,w:3,h:1,t:'scrivania'},{x:54,y:23,w:1,h:1,t:'schedario'},{x:49,y:23,w:1,h:1,t:'cassa'},{x:53,y:23,w:1,h:1,t:'cassa'},   // Sorveglianza (la sedia sta dentro lo scrittoio: fra la console e la fila sud si cammina dritti da porta a porta)
    {x:69,y:21,w:2,h:1,t:'panchina'},{x:69,y:20,w:2,h:1,t:'fioriera'},{x:62,y:14,w:6,h:1,t:'banco_serra'},{x:65,y:24,w:3,h:1,t:'banco_serra'},{x:65,y:23,w:1,h:1,t:'botte'},{x:58,y:22,w:1,h:2,t:'cassa'},{x:59,y:14,w:1,h:1,t:'cesto'},{x:69,y:17,w:1,h:1,t:'vaso'},   // Serra (tutto in corona: le aiuole ai muri, il prato in mezzo è una piazza; panchina e graticcio in fondo alla veranda, la botte e il banco accanto al compito)
    {x:60,y:35,w:2,h:1,t:'scrivania'},{x:67,y:33,w:1,h:2,t:'armadio'},{x:65,y:31,w:1,h:1,t:'schedario'},{x:65,y:35,w:1,h:1,t:'cassa'},   // Sala del telegrafo (la sedia sta dentro il tavolino, la cassetta degli isolatori sul baule)
    {x:4,y:19,w:1,h:1,t:'appoggio'},   // cassette, ceste, pentole e ceri a terra: bassi ma ci si sbatte (l'oggetto è nel fondo, t:'appoggio' non disegna niente)
    {x:51,y:38,w:2,h:1,t:'botti'},{x:53,y:38,w:2,h:1,t:'cassa'},{x:59,y:38,w:2,h:1,t:'reti'},{x:46,y:44,w:1,h:1,t:'bitta'},{x:53,y:44,w:1,h:1,t:'volante'},{x:49,y:38,w:2,h:1,t:'reti'},{x:64,y:39,w:2,h:2,t:'appoggio'},{x:34,y:13,w:1,h:1,t:'statua'},{x:37,y:13,w:1,h:1,t:'statua'},{x:34,y:16,w:1,h:1,t:'vaso'},{x:37,y:16,w:1,h:1,t:'vaso'},{x:33,y:31,w:1,h:1,t:'vaso'},   // Molo
  ],
});
// la barca ormeggiata a est del pontile (si muove col mare, non si cammina): centro e dove è legata la cima
PALAZZO.barca = { x:60.7*T, y:46.3*T, cima:[59*T - 2, 45.5*T] };
// dove scrivere il nome di una stanza: il centro del rettangolo, o la casella della stanza più vicina se lì c'è un taglio
PALAZZO.stanze.forEach((st,i)=>{
  let cx=Math.floor(st.x+st.w/2), cy=Math.floor(st.y+st.h/2), best=null, bd=1e9;
  for(let y=st.y;y<st.y+st.h;y++) for(let x=st.x;x<st.x+st.w;x++){ if(PALAZZO.PAV[y*PALAZZO.GW+x]!==i) continue; const d=(x-cx)**2+(y-cy)**2; if(d<bd){ bd=d; best=[x,y]; } }
  st.lx=best[0]+0.5; st.ly=best[1]+0.5;
});

// Sala d'attesa: dove si aspetta che l'host faccia partire la partita
const ATRIO = crea({
  nome:"Sala d'attesa", GW:26, GH:16,
  stanze:[{ nome:"Sala d'attesa", in:'nella sala', x:2, y:2, w:22, h:12, c1:'#3d3346', c2:'#44394e' }],
  corridoi:[], acqua:[],
  ostacoli:[
    {x:2,y:5,w:1,h:1,t:'pilastro'},{x:23,y:5,w:1,h:1,t:'pilastro'},{x:2,y:10,w:1,h:1,t:'pilastro'},{x:23,y:10,w:1,h:1,t:'pilastro'},
    {x:10,y:2,w:6,h:1,t:'panca'},
    {x:12,y:6,w:2,h:1,t:'computer'},   // il computer della saletta: l'host ci sceglie le regole e fa partire la partita
    {x:2,y:2,w:1,h:1,t:'albero'},{x:23,y:2,w:1,h:1,t:'albero'},{x:2,y:13,w:1,h:1,t:'albero'},{x:23,y:13,w:1,h:1,t:'albero'},
    {x:2,y:6,w:1,h:1,t:'sedia'},{x:23,y:6,w:1,h:1,t:'sedia'},{x:2,y:9,w:1,h:1,t:'sedia'},{x:23,y:9,w:1,h:1,t:'sedia'},
    {x:20,y:2,w:3,h:1,t:'valigie'},{x:3,y:2,w:3,h:1,t:'credenza'},{x:2,y:7,w:1,h:2,t:'credenza'},{x:23,y:7,w:1,h:2,t:'credenza'},
  ],
});
ATRIO.centro = { x:13*T, y:10*T };
const COMPUTER = { tx:13, ty:7 };   // dove ci si mette per usarlo (davanti alla scrivania)

const POSTAZIONI = [
  { id:'libri',      nome:'Riordina i libri',      tx:10, ty:8,  gioco:'sequenza' },
  { id:'lampadario', nome:'Accendi il lampadario', tx:35, ty:4,  gioco:'tieni', visibile:'luce' },
  { id:'orologio',   nome:"Carica l'orologio",     tx:60, ty:7,  gioco:'leva', visibile:'ingranaggio' },
  { id:'dolci',      nome:'Sforna i dolci',        tx:21, ty:23, gioco:'trascina', visibile:'fuoco' },
  { id:'vino',       nome:'Travasa il vino',       tx:6,  ty:39, gioco:'versa' },
  { id:'piante',     nome:'Annaffia le piante',    tx:65, ty:22, gioco:'versa', visibile:'acqua' },
  { id:'barca',      nome:'Carica la barca',       tx:58, ty:46, gioco:'trascina' },
  { id:'quadri',     nome:'Raddrizza i quadri',    tx:37, ty:35, gioco:'quadri' },
  { id:'candele',    nome:'Accendi le candele',    tx:7,  ty:14, gioco:'tieni' },
  { id:'pianoforte', nome:'Accorda il pianoforte', tx:7,  ty:25, gioco:'sequenza' },
  { id:'bucato',     nome:'Stendi il bucato',      tx:21, ty:39, gioco:'trascina' },
  { id:'telegramma', nome:'Trasmetti il telegramma', tx:60, ty:32, gioco:'leva' },
];
const CAMPANA = { tx:29, ty:19, oy:18 };   // tx, ty: dove ci si mette per suonarla; oy: la riga dove sta la campana (solida, un passo più a nord)
// la Sorveglianza: dal monitor si guardano le telecamere fisse e quelle della Sentinella
const MONITOR = { tx:51, ty:20 };
// il plastico del palazzo, nella Torre: mostra chi c'è in ogni stanza (teste grigie; la Spia vede i colori)
const PLASTICO = { tx:62, ty:7 };
const TELECAMERE_BASE = [
  { nome:'Cortile', x:28*T, y:18.6*T, vx:33*T, vy:21.5*T },
  { nome:'Corridoio ovest', x:12.9*T, y:22*T, vx:13*T, vy:22*T },
  { nome:'Salone delle feste', x:28.4*T, y:3.6*T, vx:33*T, vy:7*T },
  { nome:'Molo', x:46.6*T, y:38.6*T, vx:52*T, vy:41*T },
];
const QUADRO = { id:'quadro', tx:23, ty:43, nome:'Ripara il quadro delle luci', gioco:'tieni' };
// le chiuse dell'«Acqua alta» (una sul Molo, una in Cantina) e il telegrafo da riparare con l'«Interferenza»
const CHIUSA_A = { id:'chiusaA', tx:52, ty:44, nome:'Chiudi la chiusa del Molo', gioco:'tieni' };
const CHIUSA_B = { id:'chiusaB', tx:8, ty:44, nome:'Chiudi la chiusa della Cantina', gioco:'tieni' };
const CONSOLE = { id:'console', tx:62, ty:32, nome:'Ripara il telegrafo', gioco:'sequenza' };
// le botole: ognuna porta alla prossima del suo gruppo (ovest, sud-ovest, centro, est, sud-est)
const BOTOLE = [
  [[5,9],[9,20],[4,28]],      // Biblioteca, Cappella, Sala della musica
  [[13,43],[24,43]],          // Cantina, Lavanderia
  [[23,16],[41,28],[29,39]],  // Cucine, Cortile, Galleria
  [[64,9],[68,15],[55,23]],   // Torre, Serra, Sorveglianza
  [[67,35],[47,43]],          // Sala del telegrafo, Molo
];
const ESTREMI = [];
BOTOLE.forEach((g,gi)=>g.forEach((a,i)=>ESTREMI.push({ tx:a[0], ty:a[1], va:g[(i+1)%g.length], g:gi })));
// le botole collegate a una botola (stesso gruppetto): indici in ESTREMI
function botoleCollegate(i){ const e=ESTREMI[i]; return e ? ESTREMI.map((x,j)=>j).filter(j=>j!==i && ESTREMI[j].g===e.g) : []; }
const FONTANA = { x:36*T, y:24*T };

const centro = t => (t+0.5)*T;
const tX = (m,x) => Math.max(0, Math.min(m.GW-1, Math.floor(x/T)));
const tY = (m,y) => Math.max(0, Math.min(m.GH-1, Math.floor(y/T)));
function stanzaDi(m,o){ const p=m.PAV[tY(m,o.y)*m.GW+tX(m,o.x)]; return p>=0 ? m.stanze[p] : CORRIDOIO; }
function solidoA(m,px,py){ const tx=Math.floor(px/T), ty=Math.floor(py/T); if(tx<0||ty<0||tx>=m.GW||ty>=m.GH) return true; return m.SOL[ty*m.GW+tx]===1; }
function libero(m,x,y){ return !solidoA(m,x-RP,y-RP) && !solidoA(m,x+RP,y-RP) && !solidoA(m,x-RP,y+RP) && !solidoA(m,x+RP,y+RP); }
// Il corpo a terra è più largo di chi cammina: la stoffa non deve finire sul muro né sul nero. CORPO_L è la sagoma del telo steso, CORPO_S quella del telo raccolto
// lungo un muro, dove il largo non ci sta. Numeri rispetto al punto del giocatore, misurati sul telo disegnato (prova: gioco/prove/browser/lenzuolo-gioco.mjs)
const CORPO_L=[[46,14],[-46,14],[32,0],[-32,0],[32,30],[-32,30],[0,-6],[0,36],[20,-6],[-20,-6],[20,36],[-20,36]];
const CORPO_S=[[21,12],[-21,12],[0,-14],[0,40],[14,-8],[-14,-8],[14,32],[-14,32]];
const corpoCi=(m,x,y,S)=>{ for(const q of S) if(solidoA(m,x+q[0],y+q[1])) return false; return true; };
function corpoStretto(m,x,y){ return !corpoCi(m,x,y,CORPO_L) && corpoCi(m,x,y,CORPO_S); }
// dove cade il corpo: il punto più vicino dove il telo sta tutto sul pavimento, senza mai passare oltre un muro. Largo se si può, raccolto se no
function corpoCerca(m,x,y,S,r0,r1){
  for(let r=r0;r<=r1;r+=4) for(let a=0;a<16;a++){ const X=Math.round(x+Math.cos(a*0.3927)*r), Y=Math.round(y+Math.sin(a*0.3927)*r); if(libero(m,X,Y) && corpoCi(m,X,Y,S) && vede(m,x,y,X,Y)) return { x:X, y:Y }; }
  return null;
}
function postoCorpo(m,x,y){ return corpoCi(m,x,y,CORPO_L) ? { x, y } : corpoCerca(m,x,y,CORPO_L,4,48) || corpoCerca(m,x,y,CORPO_S,0,48) || corpoCerca(m,x,y,CORPO_L,52,72) || { x, y }; }
function vede(m,ax,ay,bx,by){
  const dx=bx-ax, dy=by-ay, n=Math.ceil(Math.hypot(dx,dy)/(T*0.2));
  for(let k=1;k<n;k++){ const x=ax+dx*k/n, y=ay+dy*k/n; const tx=Math.floor(x/T), ty=Math.floor(y/T); if(tx<0||ty<0||tx>=m.GW||ty>=m.GH||m.MURO[ty*m.GW+tx]) return false; }
  return true;
}
function segmentoLibero(m,ax,ay,bx,by){
  const n=Math.ceil(Math.hypot(bx-ax,by-ay)/(T*0.25));
  for(let k=1;k<=n;k++){ if(!libero(m, ax+(bx-ax)*k/n, ay+(by-ay)*k/n)) return false; }
  return true;
}
function percorso(m,sx,sy,ex,ey){
  const { GW, GH, N, SOL } = m, s=sy*GW+sx, e=ey*GW+ex;
  if(s===e) return [];
  const prev=new Int32Array(N).fill(-1), q=new Int32Array(N); let h=0, t=0; prev[s]=s; q[t++]=s;
  while(h<t){ const c=q[h++]; if(c===e) break; const cx=c%GW, cy=(c/GW)|0;
    for(const [dx,dy] of DIR4){ const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=GW||ny>=GH) continue; const n=ny*GW+nx; if(prev[n]!==-1||SOL[n]) continue; prev[n]=c; q[t++]=n; } }
  if(prev[e]===-1) return null;
  const out=[]; for(let c=e;c!==s;c=prev[c]) out.push([centro(c%GW), centro((c/GW)|0)]);
  return out.reverse();
}
// quanti passi servono da una casella a tutte le altre (per la freccia: il compito più vicino a piedi, non in linea d'aria)
function distanze(m,sx,sy){
  const { GW, GH, N, SOL } = m, d=new Int16Array(N).fill(-1), q=new Int32Array(N); let h=0, t=0;
  const s=sy*GW+sx; if(s<0||s>=N) return d; d[s]=0; q[t++]=s;
  while(h<t){ const c=q[h++], cx=c%GW, cy=(c/GW)|0;
    for(const [dx,dy] of DIR4){ const nx=cx+dx, ny=cy+dy; if(nx<0||ny<0||nx>=GW||ny>=GH) continue; const n=ny*GW+nx; if(d[n]!==-1||SOL[n]) continue; d[n]=d[c]+1; q[t++]=n; } }
  return d;
}
function liscia(m,p,sx,sy){
  const out=[]; let cx=sx, cy=sy, i=0;
  while(i<p.length){ let j=Math.min(p.length-1, i+24); while(j>i && !segmentoLibero(m,cx,cy,p[j][0],p[j][1])) j--; out.push(p[j]); cx=p[j][0]; cy=p[j][1]; i=j+1; }
  return out;
}
function puntoACaso(m){
  for(let k=0;k<40;k++){ const s=m.stanze[Math.floor(Math.random()*m.stanze.length)], tx=s.x+1+Math.floor(Math.random()*(s.w-2)), ty=s.y+1+Math.floor(Math.random()*(s.h-2)); if(!m.SOL[ty*m.GW+tx]) return {tx,ty}; }
  return { tx:Math.floor(m.GW/2), ty:Math.floor(m.GH/2) };
}

// ===== regole.js =====
// Ruoli e impostazioni dell'host. Li usano la partita (sul telefono dell'host) e la schermata delle regole.
const RUOLI = {
  ospite:        { nome:'Ospite',        squadra:'ospiti', desc:'Fai i tuoi compiti e scopri chi sono le ombre. Se trovi una lanterna spenta, segnalala.' },
  investigatore: { nome:'Investigatore', squadra:'ospiti', desc:'Vedi le orme degli altri, ognuna del colore di chi l\'ha lasciata. Svaniscono dopo qualche secondo.' },
  veggente:      { nome:'Veggente',      squadra:'ospiti', abil:'Leggi',     desc:"Leggi chi ti sta vicino: il suo nome diventa verde se è un ospite, rosso se è un'ombra o un ruolo da solo." },
  spia:          { nome:'Spia',          squadra:'ospiti', abil:'Schermo',   desc:'Al plastico del palazzo, nella Torre, vedi i colori di chi è in ogni stanza (gli altri vedono teste grigie). Col tuo schermo portatile lo guardi per pochi secondi da dove sei.' },
  bracconiere:   { nome:'Bracconiere',   squadra:'ospiti', abil:'Trappola',  desc:'Piazzi una trappola che vedi solo tu. Quando ci passano abbastanza persone, alla riunione scopri i loro ruoli, senza nomi e in ordine sparso.' },
  imitatore:     { nome:'Imitatore',     squadra:'ospiti', desc:'In riunione puoi prendere il ruolo di un ospite già eliminato, una volta a partita. Dal round dopo sei tu quel ruolo.' },
  trasportatore: { nome:'Trasportatore', squadra:'ospiti', abil:'Scambia',   desc:'Scegli due persone qualsiasi: si scambiano di posto all\'istante, ovunque siano.' },
  medico:        { nome:'Medico',        squadra:'ospiti', abil:'Scudo',     desc:"Dai uno scudo a chi ti sta vicino: non lo possono eliminare. Lo vedono tutti tranne lui e le ombre; quando si rompe, lo sai subito." },
  sceriffo:      { nome:'Sceriffo',      squadra:'ospiti', abil:'Spara',     desc:"Spari alle ombre e ai ruoli da soli. Se spari a un ospite, cadi tu e lui resta in piedi." },
  sindaco:       { nome:'Sindaco',       squadra:'ospiti', desc:'In riunione puoi rivelarti: da lì il tuo voto vale doppio, ma tutti sanno chi sei.' },
  campanaro:     { nome:'Campanaro',     squadra:'ospiti', abil:'Campana',   desc:'Suoni la riunione da qualsiasi punto del palazzo, senza correre alla campana.' },
  vedetta:       { nome:'Vedetta',       squadra:'ospiti', desc:'Vedi più lontano di tutti e il buio non ti acceca.' },
  segugio:       { nome:'Segugio',       squadra:'ospiti', abil:'Segui',     desc:'Fiuti chi ti sta vicino: per un po\' vedi dove va, anche dietro i muri.' },
  bengala:       { nome:'Bengala',       squadra:'ospiti', abil:'Bengala',   desc:'Accendi un bengala: per qualche secondo il palazzo si illumina e tutti vedono tutti.' },
  vendicatore:   { nome:'Vendicatore',   squadra:'ospiti', desc:'Chi ti elimina resta segnato da un alone rosso fino alla riunione.' },
  sentinella:    { nome:'Sentinella',    squadra:'ospiti', abil:'Telecamera', desc:'Ogni tot compiti fatti guadagni una telecamera da piazzare dove vuoi: tutti la vedono dal monitor della Sorveglianza.' },
  ingegnere:     { nome:'Ingegnere',     squadra:'ospiti', abil:'Ripara',    desc:'Ripari i sabotaggi da qualsiasi punto del palazzo, con una ricarica. Puoi usare le botole come le ombre.' },
  veterano:      { nome:'Veterano',      squadra:'ospiti', abil:'Allerta',   desc:'Ti metti in allerta per qualche secondo: chiunque ti tocchi, buono o cattivo, cade.' },
  portiere:      { nome:'Portiere',      squadra:'ospiti', abil:'Sorveglia', desc:'Scegli una stanza: da lì in poi sai chi entra e chi esce, in ordine, e quanto tempo fa.' },
  rianimatore:   { nome:'Rianimatore',   squadra:'ospiti', abil:'Riaccendi', desc:'Riaccendi una lanterna spenta: resta fermo accanto al corpo finché il cerchio si chiude.' },
  ombra:         { nome:'Ombra',         squadra:'ombre',  desc:'Elimina gli ospiti quando nessuno ti vede. Usa le botole e spegni le luci.' },
  silenziatore:  { nome:'Ricattatore',   squadra:'ombre',  abil:'Ricatta',   desc:'Elimini come le altre ombre e ricatti chi ti sta vicino: alla prossima riunione non potrà scrivere. Puoi rifarlo ogni round, anche sulla stessa persona.' },
  nebbia:        { nome:'Nebbia',        squadra:'ombre',  abil:'Nebbia',    desc:'Elimini come le altre ombre e stendi la nebbia: per qualche secondo tutti diventano grigi e senza nome.' },
  trasformista:  { nome:'Mutaforma',     squadra:'ombre',  abil:'Campiona',  desc:"Campioni chi ti sta vicino, poi quando vuoi ti trasformi in lui per qualche secondo: se qualcuno ti vede eliminare, darà la colpa a lui." },
  spettro:       { nome:'Spettro',       squadra:'ombre',  desc:'Elimini come le altre ombre. Se ti cacciano o ti spengono, continui a sabotare da anima.' },
  burattinaio:   { nome:'Burattinaio',   squadra:'ombre',  abil:'Controlla', desc:'Prendi il controllo di chi ti sta vicino per qualche secondo: lo muovi tu col joystick, lui resta fermo davanti allo schermo.' },
  spazzino:      { nome:'Spazzino',      squadra:'ombre',  abil:'Pulisci',   desc:'Fai sparire le lanterne spente: nessuno potrà più segnalarle.' },
  ipnotista:     { nome:'Ipnotista',     squadra:'ombre',  abil:'Ipnotizza', desc:'Blocchi chi ti sta vicino per qualche secondo: non può muoversi.' },
  avvelenatore:  { nome:'Avvelenatore',  squadra:'ombre',  desc:'Non spegni subito: avveleni. La lanterna si spegne qualche secondo dopo, quando sei già lontano.' },
  giullare:      { nome:'Giullare',      squadra:'soli',   desc:"Giochi da solo: vinci se ti cacciano col voto. Vedi lontano come le ombre, ma hai la frenesia: non puoi restare troppo nella stessa stanza." },
  indovino:      { nome:'Indovino',      squadra:'soli',   desc:'Giochi da solo. In riunione indovini il ruolo di qualcuno: se ci prendi cade, e nessuno sa che sei stato tu; se sbagli cadi tu. Arrivato al numero giusto, vinci.' },
  sopravvissuto: { nome:'Sopravvissuto', squadra:'soli',   desc:'Giochi da solo: vinci se arrivi vivo alla fine, chiunque vinca. Hai la frenesia: non puoi restare troppo nella stessa stanza.' },
  accusatore:    { nome:'Accusatore',    squadra:'soli',   desc:'Giochi da solo: hai un bersaglio. Vinci se lo cacciano col voto.' },
  avvoltoio:     { nome:'Avvoltoio',     squadra:'soli',   abil:'Mangia',    desc:'Giochi da solo: fai sparire le lanterne spente. Se ne mangi abbastanza, vinci tu.' },
  gatto:         { nome:'Gatto',         squadra:'soli',   desc:'Hai due vite: la prima volta che ti spengono ti rialzi, ma chi ti ha colpito può riprovare presto. Vinci se arrivi vivo alla fine e le ombre non hanno vinto.' },
};
const SPECIALI_OSPITI = ['investigatore','veggente','spia','trasportatore','bracconiere','imitatore','portiere','medico','sceriffo','sindaco','campanaro','vedetta','segugio','bengala','vendicatore','rianimatore','sentinella','ingegnere','veterano'];
const SPECIALI_OMBRE = ['silenziatore','nebbia','trasformista','spazzino','ipnotista','avvelenatore','spettro','burattinaio'];
const SPECIALI_SOLI = ['giullare','accusatore','avvoltoio','gatto','indovino','sopravvissuto'];
// i modificatori: si aggiungono sopra il ruolo, rari, e solo chi ce l'ha lo sa (solo: la squadra che può averlo; senza, chiunque)
// i ruoli dei fantasmi: un ospite spento può diventarlo (con la sua probabilità); poteri da fantasma
const FANTASMI = {
  custode: { nome:'Custode', abil:'Proteggi', desc:'Da fantasma dai uno scudo a un vivo che hai vicino: il prossimo che prova a spegnerlo fallisce, e tu lo sai.' },
  medium:  { nome:'Medium',  abil:'Foto',     desc:'Da fantasma scatti una foto confusa di chi ti ha spento o di dove è successo. Alla riunione dopo la vedono tutti, senza il tuo nome. Se non ti piace, la rifai.' },
};
const MODIFICATORI = {
  urlatore:  { nome:'Urlatore',  icona:'🔊', desc:'Quando ti spengono, tutti ricevono subito un avviso e una freccia rossa che indica il punto.' },
  celebrita: { nome:'Celebrità', icona:'⭐', desc:'Quando ti spengono, alla riunione dopo tutti sanno dove sei caduto e quanto tempo prima.' },
  ago:       { nome:'Ago della bilancia', icona:'⚖️', desc:'Il tuo voto vale un pelo di più (1,01): nei pareggi vince la tua parte. Nessuno sa che sei tu.' },
  esca:      { nome:'Esca',      icona:'🎣', solo:'ospiti', desc:'Quando ti spengono, chi è stato segnala da solo: la riunione si apre subito a suo nome. Solo tra gli ospiti.' },
};
// chi ha la frenesia: se resta troppo nella stessa stanza, la lanterna si spegne
const FRENESIA = ['giullare','sopravvissuto'];

const prob = v => Object.fromEntries([...SPECIALI_OSPITI, ...SPECIALI_OMBRE, ...SPECIALI_SOLI].map(r => [r, v]));
const IMP_BASE = {
  ombre:0, ricarica:25, velocita:1, vistaOspiti:6, vistaOmbre:7, compiti:0, soli:1, compitiVisibili:true,
  rev:2,   // (pulisci: da quale edizione delle regole vengono quelle che arrivano da fuori)
  discussione:30, voto:45, campane:1, mostraRuolo:true,
  prob: prob(25),
  sceriffo:{ ricarica:25, soli:true },
  investigatore:{ orme:10 },
  veggente:{ ricarica:45, usi:1 },
  medico:{ ricarica:25, se:false, dura:'rompe' },
  sentinella:{ ogni:3, max:4, extra:7 },
  ingegnere:{ ricarica:30 },
  veterano:{ durata:15, ricarica:35, usi:2 },
  spia:{ durata:5, ricarica:60 },
  bracconiere:{ quanti:3, ricarica:30 },
  modificatori:{ urlatore:10, celebrita:10, ago:10, esca:10 },
  trasportatore:{ ricarica:45, usi:2 },
  campanaro:{ volte:2 },
  segugio:{ durata:30, ricarica:35 },
  bengala:{ durata:5, usi:1 },
  rianimatore:{ usi:1, tempo:6 },
  silenziatore:{ ricarica:35 },
  nebbia:{ durata:15, ricarica:30 },
  trasformista:{ durata:10, ricarica:50 },
  spazzino:{ ricarica:35, tempo:5 },
  ipnotista:{ durata:6, ricarica:35 },
  avvelenatore:{ ritardo:15 },
  burattinaio:{ durata:8, ricarica:40 },
  portiere:{ ricarica:30 },
  sabotaggi:{ ricarica:45, acqua:60, interferenza:60, acquaSi:true, interferenzaSi:true },
  avvoltoio:{ quanti:2 },
  indovino:{ quanti:3, perRiunione:2, sbaglia:'muore' },
  gatto:{ ricarica:4 },
  frenesia:{ attiva:true, secondi:45 },
  fantasmi:{ attivi:true, custode:50, medium:50, ricarica:45 },
};

// Ogni voce: un gruppo di bottoni nella schermata delle regole. opz = valori, oppure [valore, scritta].
const P = [0,25,50,75,100];
const probVoce = (r) => ({ g:'Probabilità dei ruoli', k:'prob.'+r, et:RUOLI[r].nome, opz:P, u:'%' });
const VOCI = [
  { g:'Partita', k:'ombre', et:'Ombre', opz:[[0,'in base ai giocatori'],1,2,3,4] },
  { g:'Partita', k:'soli', et:'Ruoli da soli al massimo', opz:[0,1,2] },
  { g:'Partita', k:'ricarica', et:'Ricarica per eliminare', opz:[15,20,25,30,40], u:' s' },
  { g:'Partita', k:'velocita', et:'Velocità', opz:[[0.8,'lenta'],[1,'normale'],[1.25,'veloce'],[1.5,'molto veloce'],[1.75,'velocissima']] },
  { g:'Partita', k:'vistaOspiti', et:'Vista degli ospiti', opz:[[3,'cortissima'],[4,'corta'],[6,'media'],[8,'lunga'],[10,'lunghissima']] },
  { g:'Partita', k:'vistaOmbre', et:'Vista delle ombre', opz:[[4,'cortissima'],[5,'corta'],[7,'media'],[9,'lunga'],[12,'lunghissima']] },
  { g:'Partita', k:'compiti', et:'Compiti a testa', opz:[[0,'in base ai giocatori'],3,4,5,6,8] },
  { g:'Partita', k:'compitiVisibili', et:'Compiti visibili (lampadario, orologio, forno, serra)', opz:[[true,'sì'],[false,'no']] },
  { g:'Riunioni', k:'discussione', et:'Tempo per parlare', opz:[0,15,30,45,60], u:' s' },
  { g:'Riunioni', k:'voto', et:'Tempo per votare', opz:[20,30,45,60,90], u:' s' },
  { g:'Riunioni', k:'campane', et:'Campane a testa', opz:[0,1,2,3] },
  { g:'Riunioni', k:'mostraRuolo', et:'Chi esce mostra il ruolo', opz:[[true,'sì'],[false,'no']] },
  ...SPECIALI_OSPITI.map(probVoce), ...SPECIALI_OMBRE.map(probVoce), ...SPECIALI_SOLI.map(probVoce),
  { g:'Sceriffo', k:'sceriffo.ricarica', et:'Ricarica', opz:[15,25,35,45], u:' s' },
  { g:'Sceriffo', k:'sceriffo.soli', et:'Può colpire i ruoli da soli', opz:[[true,'sì'],[false,'no']] },
  { g:'Investigatore', k:'investigatore.orme', et:'Quanto restano le orme', opz:[5,10,15], u:' s' },
  { g:'Veggente', k:'veggente.ricarica', et:'Ricarica', opz:[30,45,60], u:' s' },
  { g:'Veggente', k:'veggente.usi', et:'Letture per round', opz:[1,2] },
  { g:'Medico', k:'medico.ricarica', et:'Ricarica', opz:[15,25,35], u:' s' },
  { g:'Medico', k:'medico.se', et:'Può proteggere sé stesso', opz:[[false,'no'],[true,'sì']] },
  { g:'Medico', k:'medico.dura', et:'Lo scudo dura', opz:[['rompe','finché non si rompe'],['riunione','fino alla riunione']] },
  { g:'Sentinella', k:'sentinella.ogni', et:'Compiti per una telecamera', opz:[1,2,3] },
  { g:'Sentinella', k:'sentinella.max', et:'Telecamere al massimo', opz:[2,4,6] },
  { g:'Sentinella', k:'sentinella.extra', et:'Compiti in più rispetto agli altri', opz:[0,3,7] },
  { g:'Ingegnere', k:'ingegnere.ricarica', et:'Ricarica', opz:[20,30,45], u:' s' },
  { g:'Bracconiere', k:'bracconiere.quanti', et:'Persone per riempire la trappola', opz:[2,3,4] },
  { g:'Bracconiere', k:'bracconiere.ricarica', et:'Ricarica', opz:[20,30,45], u:' s' },
  { g:'Modificatori', k:'modificatori.urlatore', et:'Urlatore', opz:[0,5,10,25,50], u:'%' },
  { g:'Modificatori', k:'modificatori.celebrita', et:'Celebrità', opz:[0,5,10,25,50], u:'%' },
  { g:'Modificatori', k:'modificatori.ago', et:'Ago della bilancia', opz:[0,5,10,25,50], u:'%' },
  { g:'Modificatori', k:'modificatori.esca', et:'Esca', opz:[0,5,10,25,50], u:'%' },
  { g:'Spia', k:'spia.durata', et:'Schermo portatile', opz:[3,5,8], u:' s' },
  { g:'Spia', k:'spia.ricarica', et:'Ricarica dello schermo', opz:[45,60,90], u:' s' },
  { g:'Trasportatore', k:'trasportatore.ricarica', et:'Ricarica', opz:[30,45,60], u:' s' },
  { g:'Trasportatore', k:'trasportatore.usi', et:'Scambi a partita', opz:[1,2,3] },
  { g:'Veterano', k:'veterano.durata', et:'Durata dell\'allerta', opz:[10,15,20], u:' s' },
  { g:'Veterano', k:'veterano.ricarica', et:'Ricarica', opz:[25,35,50], u:' s' },
  { g:'Veterano', k:'veterano.usi', et:'Allerte a partita', opz:[1,2,3] },
  { g:'Campanaro', k:'campanaro.volte', et:'Campane a distanza', opz:[1,2,3] },
  { g:'Segugio', k:'segugio.durata', et:'Quanto segue', opz:[20,30,45], u:' s' },
  { g:'Segugio', k:'segugio.ricarica', et:'Ricarica', opz:[25,35,50], u:' s' },
  { g:'Bengala', k:'bengala.durata', et:'Quanto dura la luce', opz:[3,5,8], u:' s' },
  { g:'Bengala', k:'bengala.usi', et:'Bengala a partita', opz:[1,2] },
  { g:'Rianimatore', k:'rianimatore.usi', et:'Lanterne da riaccendere', opz:[1,2] },
  { g:'Rianimatore', k:'rianimatore.tempo', et:'Tempo fermo accanto', opz:[4,6,8], u:' s' },
  { g:'Ricattatore', k:'silenziatore.ricarica', et:'Ricarica', opz:[20,35,50], u:' s' },
  { g:'Nebbia', k:'nebbia.durata', et:'Durata', opz:[6,10,15], u:' s' },
  { g:'Nebbia', k:'nebbia.ricarica', et:'Ricarica', opz:[30,40,60], u:' s' },
  { g:'Mutaforma', k:'trasformista.durata', et:'Quanto dura la trasformazione', opz:[10,15,20], u:' s' },
  { g:'Mutaforma', k:'trasformista.ricarica', et:'Ricarica', opz:[25,35,50], u:' s' },
  { g:'Burattinaio', k:'burattinaio.durata', et:'Quanto dura il controllo', opz:[5,8,12], u:' s' },
  { g:'Burattinaio', k:'burattinaio.ricarica', et:'Ricarica', opz:[30,40,60], u:' s' },
  { g:'Portiere', k:'portiere.ricarica', et:'Ricarica per cambiare stanza', opz:[20,30,45], u:' s' },
  { g:'Sabotaggi', k:'sabotaggi.ricarica', et:'Ricarica tra un sabotaggio e l\'altro', opz:[30,45,60], u:' s' },
  { g:'Sabotaggi', k:'sabotaggi.acquaSi', et:'Acqua alta', opz:[[true,'sì'],[false,'no']] },
  { g:'Sabotaggi', k:'sabotaggi.acqua', et:'Tempo per chiudere le chiuse', opz:[40,60,90], u:' s' },
  { g:'Sabotaggi', k:'sabotaggi.interferenzaSi', et:'Interferenza', opz:[[true,'sì'],[false,'no']] },
  { g:'Sabotaggi', k:'sabotaggi.interferenza', et:'Quanto dura l\'interferenza (se nessuno ripara)', opz:[30,60,90], u:' s' },
  { g:'Spazzino', k:'spazzino.ricarica', et:'Ricarica', opz:[15,25,35], u:' s' },
  { g:'Spazzino', k:'spazzino.tempo', et:'Tempo fermo accanto alla lanterna', opz:[3,5,8], u:' s' },
  { g:'Ipnotista', k:'ipnotista.durata', et:'Blocco', opz:[4,6,8], u:' s' },
  { g:'Ipnotista', k:'ipnotista.ricarica', et:'Ricarica', opz:[25,35,50], u:' s' },
  { g:'Avvelenatore', k:'avvelenatore.ritardo', et:'Dopo quanto si spegne', opz:[10,15,20], u:' s' },
  { g:'Avvoltoio', k:'avvoltoio.quanti', et:'Corpi per vincere', opz:[2,3,4] },
  { g:'Indovino', k:'indovino.quanti', et:'Ruoli da indovinare per vincere', opz:[2,3,4] },
  { g:'Indovino', k:'indovino.perRiunione', et:'Tentativi per riunione', opz:[1,2,3] },
  { g:'Indovino', k:'indovino.sbaglia', et:'Se sbaglia', opz:[['muore','cade lui'],['niente','non succede niente']] },
  { g:'Gatto', k:'gatto.ricarica', et:'Dopo che si rialza, chi lo ha colpito riprova dopo', opz:[4,8,15,25], u:' s' },
  { g:'Frenesia (Giullare e Sopravvissuto)', k:'frenesia.attiva', et:'Frenesia', opz:[[true,'sì'],[false,'no']] },
  { g:'Frenesia (Giullare e Sopravvissuto)', k:'frenesia.secondi', et:'Secondi nella stessa stanza', opz:[30,45,60,90], u:' s' },
  { g:'Fantasmi', k:'fantasmi.attivi', et:'Ruoli dei fantasmi', opz:[[true,'sì'],[false,'no']] },
  { g:'Fantasmi', k:'fantasmi.custode', et:'Custode (scudo da fantasma)', opz:[0,25,50,75,100], u:'%' },
  { g:'Fantasmi', k:'fantasmi.medium', et:'Medium (foto da fantasma)', opz:[0,25,50,75,100], u:'%' },
  { g:'Fantasmi', k:'fantasmi.ricarica', et:'Ricarica dei poteri', opz:[20,30,45,60], u:' s' },
];

const PRESET = {
  classica: {},
  tanti: { soli:2, prob: prob(75) },
  caos: { soli:2, ricarica:15, velocita:1.25, vistaOspiti:4, discussione:15, voto:30, campane:2, prob: prob(100), nebbia:{ durata:15, ricarica:30 } },
};

const valoreOpz = o => Array.isArray(o) ? o[0] : o;
const scrittaOpz = (o,u) => Array.isArray(o) ? o[1] : String(o)+(u||'');
function leggi(imp,k){ return k.split('.').reduce((o,p)=>(o==null?undefined:o[p]), imp); }
function scrivi(imp,k,v){ const p=k.split('.'); let o=imp; for(let i=0;i<p.length-1;i++){ if(typeof o[p[i]]!=='object'||!o[p[i]]) o[p[i]]={}; o=o[p[i]]; } o[p[p.length-1]]=v; }
function unisci(base, sopra){ for(const k in sopra){ if(sopra[k] && typeof sopra[k]==='object' && !Array.isArray(sopra[k])){ if(typeof base[k]!=='object'||!base[k]) base[k]={}; unisci(base[k], sopra[k]); } else base[k]=sopra[k]; } return base; }
// Tiene solo valori ammessi: quello che arriva da fuori (o da una partita salvata) non può rompere niente
function pulisci(imp){
  const out = JSON.parse(JSON.stringify(IMP_BASE));
  for(const v of VOCI){ const x=leggi(imp||{}, v.k); if(v.opz.some(o=>valoreOpz(o)===x)) scrivi(out, v.k, x); }
  // dall'1/11 l'Indovino parte da 3: le regole ricordate da prima (senza rev) col vecchio 2 salgono. Chi sceglie 2 adesso resta a 2: le sue regole hanno rev
  if(!(imp && imp.rev) && out.indovino.quanti===2) out.indovino.quanti=3;
  return out;
}
function conPreset(nome){ return pulisci(unisci(JSON.parse(JSON.stringify(IMP_BASE)), PRESET[nome]||{})); }
// Da 11 giocatori in su: [ombre, compiti a testa] per ogni numero, tarati con partite di soli Bot (node gioco/prove/equilibrio.mjs 400 grandi).
// I compiti possono avere i decimali: 3,15 vuol dire che a un giocatore su sette ne toccano 4 invece di 3 (così le ombre vincono fra il 30 e il 45%).
const GRANDI = { 11:[2,10], 12:[3,3.15], 13:[3,4.15], 14:[3,5.2], 15:[4,3] };
// Quante ombre: «in base ai giocatori» (0) dà 1 ombra fino a 7 giocatori, 2 da 8 a 10, poi 2, 3 e 4 secondo la tabella dei grandi.
// Mai più di 1 fino a 6 giocatori, 2 fino a 8, 3 fino a 13, 4 da 14 in su.
function quanteOmbre(imp, n){
  const max = n<=6 ? 1 : n<=8 ? 2 : n<=13 ? 3 : 4, voluto = imp.ombre>0 ? imp.ombre : (GRANDI[n] ? GRANDI[n][0] : n>15 ? 4 : n>=8 ? 2 : 1);
  return Math.max(1, Math.min(voluto, max));
}
// Compiti a testa: «in base ai giocatori» (0) li sceglie da quanti ospiti ci sono per ogni ombra (r).
// Tarati con migliaia di partite di soli Bot (gioco/prove/equilibrio.mjs) per stare vicino a metà e metà:
// r fino a 3 → 3 compiti, fino a 3,5 → 4, fino a 4 → 6, fino a 5 → 8, oltre → 12 (con 7 giocatori e un'ombra sola, con 8 compiti le ombre vincevano 2 volte su 10).
function compitiPer(imp, n, ombre){
  if(imp.compiti>0) return imp.compiti;
  if(GRANDI[n] && GRANDI[n][0]===ombre) return GRANDI[n][1];
  const r = (n-ombre)/Math.max(1,ombre);
  return r<=3 ? 3 : r<=3.5 ? 4 : r<=4 ? 6 : r<=5 ? 8 : 12;
}
function riassunto(imp){
  const ruoli = Object.keys(imp.prob).filter(r=>imp.prob[r]>0).length;
  const om = imp.ombre>0 ? `${imp.ombre} ${imp.ombre===1?'ombra':'ombre'}` : 'ombre in base ai giocatori';
  const co = imp.compiti>0 ? `${imp.compiti} compiti` : 'compiti in base ai giocatori';
  return `${om} · ${co} · ${ruoli} ruoli speciali`;
}

// ===== partita.js =====
// La partita vera: gira solo sul telefono di chi la tiene (l'host). Gli altri mandano mosse e ricevono foto e posizioni.


const rnd = Math.random;
const pick = a => a[Math.floor(rnd()*a.length)];
function mescola(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const dist = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
const elenco = n => n.length<2 ? (n[0]||'') : n.slice(0,-1).join(', ')+' e '+n[n.length-1];
const R_USA = 1.5*T, R_SPEGNI = 1.45*T, R_ABIL = 1.8*T, R_SEGNALA = 2.6*T;
// a cosa punta l'abilità di ogni ruolo: una persona viva, un corpo, nessuno
const BERSAGLIO = { veggente:'vivo', medico:'vivo', sceriffo:'vivo', segugio:'vivo', silenziatore:'vivo', trasformista:'mutaforma', ipnotista:'vivo',
  rianimatore:'corpo', spazzino:'corpo', avvoltoio:'corpo', campanaro:'nessuno', bengala:'nessuno', nebbia:'nessuno', sentinella:'nessuno', ingegnere:'nessuno', veterano:'nessuno', spia:'nessuno', trasportatore:'due', bracconiere:'nessuno', burattinaio:'vivo', portiere:'stanza' };
// dove si ripara ogni sabotaggio
const STAZ_RIP = { luci:QUADRO, console:CONSOLE, chiusaA:CHIUSA_A, chiusaB:CHIUSA_B };
const TOLL = 1.4;              // margine per chi è un po' in ritardo sulla rete
const VEL_ANIMA = 1.7;  // le anime vanno più veloci: seguono meglio la partita
const R_PARLA = 7*T;    // la chat di prossimità: si sente entro questo raggio, se non ci sono muri in mezzo
const R_MURO = 3*T;     // attraverso un muro si sente solo da molto vicino, e più piano
const MAX_PARLA = 80;   // caratteri di un messaggio
const T_PARLA = 1.5;           // un messaggio ogni 1,5 secondi
const R_RISPOSTA = 5*T;        // un Bot risponde a una persona solo se le è così vicino (e la vede)
// il testo di un messaggio: una riga, senza caratteri strani, al massimo MAX_PARLA lettere
const pulisciTesto = x => Array.from(String(x==null?'':x).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g,' ').replace(/\s+/g,' ').trim()).slice(0,MAX_PARLA).join('').trim();
// un testo in minuscolo, senza punteggiatura, con uno spazio ai lati di ogni parola (e il «?» staccato) per cercarci dentro parole intere
const normChat = x => ' '+String(x).toLowerCase().replace(/[’']/g,' ').replace(/\?/g,' ? ').replace(/[^a-z0-9àèéìòóù? ]+/g,' ').replace(/\s+/g,' ').trim()+' ';
const VEL_BASE = 3.8;   // caselle al secondo a velocità «normale» (era 3,4: un po' più di corsa)
const POSTI_SALA = [[9.6,11.6],[16.6,11.4],[8.4,7.8],[17.6,7.8],[6,4.8],[20,4.8],[10.4,4.4],[15.8,4.4],[5,10.4],[21,10.4],[13,12.8],[4.6,7.6],[21.4,7.6],[7,12.6],[19,12.6]];   // in caselle: sparsi per la sala
const DUR_ATRIO = 20, DUR_SVELA = 6, DUR_ESITO = 7, DUR_SIGILLI = 6;
const MAX_CHAT = 40;
const RITARDO_ESCA = 0.4;      // chi spegne un'Esca segnala da solo dopo 0,4 s: il minimo per vedere la lanterna che si spegne (il lampo a schermo dura 0,5 s) e prima di qualunque Bot (0,5 s)
const SOGLIA_VOTO = 18;        // quanto sospetto serve a un Bot ospite per votare qualcuno (con 30 sette riunioni su dieci finivano senza nessuno fuori)
const PROV_GIULLARE = 2;       // quante volte a partita un Giullare Bot si fa vedere uscire da una botola
const FRASI_COMPITO = { luce:'accendere il lampadario', ingranaggio:"caricare l'orologio", fuoco:'sfornare i dolci', acqua:'annaffiare la serra' };
// ----- le cose che arrivano insieme (vedi REGOLE-CONTEMPORANEE.md) -----
// L'host è l'arbitro unico, ma un ospite arriva 0,1-0,3 s dopo l'host: due tocchi «insieme» arrivano in un ordine che dipende solo dalla rete.
// FINESTRA è il tratto in cui due azioni contano come contemporanee: dentro quel tratto il risultato deve essere lo stesso in qualunque ordine arrivino.
const FINESTRA = 0.3;
// GRAZIA: il voto e l'acqua alta finiscono sul telefono mezzo secondo prima che sull'host. Così il sigillo o la chiusa messi all'ultimo istante visto arrivano ancora in tempo
const GRAZIA = 0.5;
// l'esito di una mossa, rimandato al telefono di chi l'ha fatta (con la ricevuta): ok, oppure perché non è andata.
// Senza testo: ok, detto (il motore ha già mandato il suo avviso), fine (arriva il finale), vecchia (mossa superata da una più nuova).
// Frasi senza maschile sui nomi
const TESTO_ESITO = {
  riu: 'Troppo tardi: la riunione è già cominciata.',
  chiamata: 'La riunione era appena stata chiamata: è la stessa.',
  spento: 'Troppo tardi: la tua lanterna si era già spenta.',
  giaSpenta: 'Troppo tardi: quella lanterna si era già spenta.',
  corpo: 'Troppo tardi: la lanterna spenta non c\'è più.',
  botola: 'Troppo tardi: ora è dentro una botola.',
  lontano: 'Troppo lontano: avvicinati e riprova.',
  ricarica: 'Non ancora: si sta ricaricando.',
  riparato: 'Qualcuno l\'aveva appena riparato.',
  sabAttivo: 'C\'è già un sabotaggio in corso.',
  chiuso: 'Troppo tardi: il voto si è chiuso, il tuo sigillo non conta.',
  presto: 'Il voto non è ancora aperto.',
  votato: 'Hai già votato: il sigillo non si cambia.',
  fermo: 'Qualcuno ti controlla: adesso non puoi.',
  no: 'Adesso non si può.',
  rete: 'L\'host non risponde: la mossa forse non è arrivata.'
};

class Partita {
  // lista: [{ id, nome, bot }]; eventi: { privato(id,msg), tutti(msg) }
  // opz.saletta: la saletta d'attesa nell'atrio (nessun ruolo, nessun compito, si gira finché l'host non fa partire)
  constructor(lista, imp, eventi, opz){
    this.imp = imp; this.ev = eventi; this.saletta = !!(opz && opz.saletta);
    this.VEL = VEL_BASE*T*imp.velocita;
    this.gioc = lista.map(g=>this.nuovo(g));
    // si comincia nell'atrio: tutti girano liberi qualche secondo, poi escono i ruoli e si entra nel palazzo
    this.M = ATRIO; this.fase = 'atrio'; this.t = 0; this.fineFase = this.saletta ? Infinity : DUR_ATRIO;
    this.corpi = []; this.buio = null; this.interf = null; this.acqua = null; this.cdBuio = 30; this.nebbiaFine = 0; this.bengalaFine = 0; this.pub = {};
    this.riu = null; this.esito = null; this.vincitore = null; this.chat = []; this.round = 1; this.dichiarati = {}; this.esche = [];
    // riuInArrivo: la riunione chiamata che parte tra FINESTRA s; spariti: le lanterne a terra tolte da poco (pulite, mangiate, riaccese); nImp: cresce a ogni fatto che l'host deve salvare subito
    this.riuInArrivo = null; this.spariti = []; this.nImp = 0; this.tFine = null; this.fineDetta = false;
    this.telecamere = TELECAMERE_BASE.map(c=>({ x:c.x, y:c.y, nome:c.nome, base:true }));
    this.cambiata = true;
    if(this.saletta){ this.ombreIniziali=1; this.celebri=[]; }
    else { this.assegnaRuoli(); this.gioc.forEach(g=>this.assegnaCompiti(g)); }
    const messi=[]; this.gioc.forEach(p=>{ const q=this.postoSala(messi); messi.push(q); this.teletrasporta(p, q.x, q.y); });
  }
  // un posto nella sala d'attesa: il più lontano da chi c'è già e non troppo dal centro. Mai sotto il lampadario né attaccati alla scrivania: si deve vedere che siamo in tanti
  postoSala(chi){
    let m=POSTI_SALA[0], d=-1e9;
    for(const q of POSTI_SALA){ const x=q[0]*T, y=q[1]*T; let v=1e9; for(const o of chi) v=Math.min(v,Math.hypot(o.x-x,o.y-y)); if(v>1e8) v=0; v-=0.3*Math.hypot(x-ATRIO.centro.x,y-ATRIO.centro.y); if(v>d){ d=v; m=q; } }
    return { x:m[0]*T+(rnd()-.5)*8, y:m[1]*T+(rnd()-.5)*8 };
  }
  // solo per le prove (versione da soli): dà a un giocatore il ruolo scelto, scambiandolo con chi ce l'aveva
  forzaRuolo(id, ruolo){
    const p=this.per(id); if(!p||!RUOLI[ruolo]||p.ruolo===ruolo) return;
    let altro=this.gioc.find(q=>q!==p&&q.ruolo===ruolo);
    if(!altro && (RUOLI[ruolo].squadra==='ombre')!==(p.squadra==='ombre')) altro=this.gioc.find(q=>q!==p&&(q.squadra==='ombre')===(RUOLI[ruolo].squadra==='ombre'));
    if(altro){ altro.ruolo=p.ruolo; this.preparaRuolo(altro); this.assegnaCompiti(altro); }
    p.ruolo=ruolo; this.preparaRuolo(p); this.assegnaCompiti(p);
    [p,altro].forEach(q=>{ const m=q&&MODIFICATORI[q.mod]; if(m&&m.solo&&m.solo!==q.squadra) q.mod=null; });
    this.gioc.forEach(g=>{ if(g.ruolo==='accusatore'&&!g.bersaglio){ const c=this.gioc.filter(q=>q!==g&&q.squadra==='ospiti'); g.bersaglio=c.length?pick(c).id:null; } });
    this.segna();
  }
  // la saletta: chi arriva e chi se ne va mentre si aspetta
  aggiungi(g){
    if(!this.saletta || this.per(g.id)) return;
    const p=this.nuovo(g); this.gioc.push(p);
    const q=this.postoSala(this.gioc.filter(o=>o!==p)); this.teletrasporta(p, q.x, q.y); this.segna();
  }
  togli(id){ if(!this.saletta) return; this.gioc=this.gioc.filter(p=>p.id!==id); this.segna(); }
  // dalla saletta alla partita: le regole scelte al computer, poi ruoli e compiti, e via nel palazzo
  inizia(imp){
    if(!this.saletta) return;
    this.saletta=false; this.imp=imp; this.VEL=VEL_BASE*T*imp.velocita;
    this.gioc.forEach(g=>{ g.campane=imp.campane; g.cd=15; g.cdA=8; });
    this.assegnaRuoli(); this.gioc.forEach(g=>this.assegnaCompiti(g));
    this.fineFase=this.t; this.via();
  }
  // dall'atrio al palazzo (a tempo scaduto, o quando l'host tocca «Via»)
  via(){
    if(this.fase!=='atrio') return;
    this.M = PALAZZO; this.fase = 'svela'; this.fineFase = this.t + DUR_SVELA;
    this.inCerchio(); this.segna();
  }
  nuovo(g){
    return { id:g.id, nome:g.nome, bot:!!g.bot, ruolo:'ospite', squadra:'ospiti', x:0, y:0, dir:Math.PI/2, vivo:true, fantasma:false, uscito:false,
      compiti:[], cd:15, cdA:8, usi:0, campane:this.imp.campane, zittito:false, protettoDa:null, ep:0, tPos:0, tCorr:-9, vPriv:0, tChat:-9, tParla:-9,
      vite:1, aspetto:null, aspettoFine:0, bloccatoFine:0, veleno:null, traccia:null, rianima:null, usiRian:0, usiBeng:0, campVolte:0, mangiati:0, bersaglio:null, rivelato:false, segnato:false, indovinati:0, tentativi:0, frenStanza:null, frenDa:0, frenAvvisato:false, camPiazzate:0, usiVet:0, allertaFine:0, letti:{}, osserva:false, usiTra:0, schermoFine:0, mod:null, trappola:null, trapRuoli:null, imitato:false, imita:null,
      path:[], meta:null, attesa:0, azione:null, pensa:rnd()*0.4, visti:{}, storia:[], ultimaStoria:{}, sosp:{}, mem:{controlli:[], puliti:[]}, segnala:null, corpoVisto:null, muove:false,
      ripara:null, campione:null, controllo:null, controllatoDa:null, portineria:null, tTp:0, prossimoGiro:false, dopoSpegni:false, ricalcola:0, cacciaFine:0,
      noti:{}, provocaz:0, insegue:null, insegueFine:0, vistoTrasf:{} };
  }
  per(id){ return this.gioc.find(p=>p.id===id); }
  nomeDi(id){ const p=this.per(id); return p ? p.nome : '?'; }
  nebbiaAttiva(){ return this.nebbiaFine > this.t; }
  bengalaAttivo(){ return this.bengalaFine > this.t; }
  vista(g){
    if(this.bengalaAttivo()) return 40*T;
    if(g.squadra==='ombre' || g.ruolo==='giullare') return this.imp.vistaOmbre*T;
    if(g.ruolo==='vedetta') return (this.imp.vistaOspiti+2)*T;
    const v=this.imp.vistaOspiti*T; return this.buio ? Math.min(v, 2.2*T) : v;
  }
  segna(){ this.cambiata = true; }
  subitoATutti(){ this.cambiata = true; this.subito = true; }   // i sabotaggi non aspettano il giro della foto: partono al primo battito
  priv(p){ p.vPriv++; }
  avviso(p, testo, tipo){ if(p && !p.bot) this.ev.privato(p.id, { t:'avviso', testo, tipo:tipo||'' }); }
  // (quello che vede uno solo non passa dalla foto comune: dice chi ha usato il potere)
  fx(k, x, y, extra){ const m=Object.assign({ t:'fx', k, x:Math.round(x), y:Math.round(y) }, extra||{}); if(m.solo){ const q=this.per(m.solo); if(q&&!q.bot) this.ev.privato(q.id, m); return; } this.ev.tutti(m); }

  assegnaRuoli(){
    const n=this.gioc.length, imp=this.imp, k=Math.max(1, Math.min(quanteOmbre(imp, n), Math.floor((n-1)/2)));
    this.ombreIniziali=k; this.nCompiti=compitiPer(imp, n, k);
    const ruoli=[];
    const ombreSpec = mescola(SPECIALI_OMBRE.filter(r=>rnd()*100 < imp.prob[r]));
    for(let i=0;i<k;i++) ruoli.push(ombreSpec[i] || 'ombra');
    const soli = mescola(SPECIALI_SOLI.filter(r=>rnd()*100 < imp.prob[r])).slice(0, imp.soli);
    for(const r of mescola([...SPECIALI_OSPITI.filter(r=>rnd()*100 < imp.prob[r]), ...soli])) if(ruoli.length<n) ruoli.push(r);
    while(ruoli.length<n) ruoli.push('ospite');
    mescola(ruoli);
    this.gioc.forEach((g,i)=>{ g.ruolo=ruoli[i]; this.preparaRuolo(g); });
    // l'Accusatore riceve un bersaglio tra gli ospiti
    // i modificatori: ognuno esce con la sua probabilità, al massimo uno a testa (quelli con solo: li ha soltanto quella squadra)
    for(const m of Object.keys(MODIFICATORI)) if(rnd()*100 < (imp.modificatori[m]||0)){ const solo=MODIFICATORI[m].solo, liberi=this.gioc.filter(g=>!g.mod&&(!solo||g.squadra===solo)); if(liberi.length) pick(liberi).mod=m; }
    this.celebri=[];
    this.gioc.filter(g=>g.ruolo==='accusatore').forEach(g=>{ const c=this.gioc.filter(q=>q!==g&&q.squadra==='ospiti'); g.bersaglio = c.length ? pick(c).id : null; if(!g.bersaglio){ g.ruolo='giullare'; this.preparaRuolo(g); } });
  }
  preparaRuolo(g){
    g.squadra=RUOLI[g.ruolo].squadra; g.usi=this.imp.veggente.usi; g.usiVet = g.ruolo==='veterano' ? this.imp.veterano.usi : 0; g.usiTra = g.ruolo==='trasportatore' ? this.imp.trasportatore.usi : 0;
    g.vite = g.ruolo==='gatto' ? 2 : 1;
    g.usiRian = g.ruolo==='rianimatore' ? this.imp.rianimatore.usi : 0;
    g.usiBeng = g.ruolo==='bengala' ? this.imp.bengala.usi : 0;
    g.campVolte = g.ruolo==='campanaro' ? this.imp.campanaro.volte : 0;
  }
  assegnaCompiti(g){
    // (con i decimali, 3,15 vuol dire che a un giocatore su sette ne toccano 4)
    const nc = this.nCompiti||compitiPer(this.imp, this.gioc.length, this.ombreIniziali||1), quanti = Math.floor(nc) + (rnd() < nc-Math.floor(nc) ? 1 : 0);
    const lista = mescola(POSTAZIONI.slice()).slice(0, quanti);
    g.compiti = lista.map(p=>({ post:p, fatto:false, finto:g.squadra!=='ospiti' }));
    // i compiti in più della Sentinella le servono per le telecamere: non contano nella barra di tutti
    if(g.ruolo==='sentinella') for(let i=0;i<this.imp.sentinella.extra;i++) g.compiti.push({ post:pick(POSTAZIONI), fatto:false, finto:false, extra:true });
  }
  teletrasporta(p,x,y){ p.x=x; p.y=y; p.ep++; p.tPos=this.t; p.path=[]; p.meta=null; if(!p.bot) this.ev.privato(p.id, { t:'tp', x:Math.round(x), y:Math.round(y), ep:p.ep }); }
  inCerchio(){
    const vivi=this.gioc.filter(p=>!p.uscito), n=vivi.length;
    vivi.forEach((p,i)=>{ const a=i/n*Math.PI*2-Math.PI/2; p.dir=a+Math.PI; p.attesa=0; p.azione=null; this.teletrasporta(p, FONTANA.x+Math.cos(a)*3.6*T, FONTANA.y+Math.sin(a)*3.6*T); });
  }
  contaCompiti(){
    let tot=0, fatti=0;
    for(const p of this.gioc){ if(p.squadra!=='ospiti') continue; for(const c of p.compiti){ if(c.extra) continue; tot++; if(c.fatto) fatti++; } }
    return { tot, fatti };
  }
  travestito(p){ return p.aspetto && p.aspettoFine>this.t ? p.aspetto : null; }

  /* ----- cosa vede chi gioca ----- */
  foto(){
    const { tot, fatti } = this.contaCompiti();
    const sec = f => Math.max(0, Math.ceil(f-this.t-1e-9));   // (il margine: lo scarto dei conti fra secondi faceva leggere 7 invece di 6)
    // la fine decisa in gioco si annuncia FINESTRA s dopo: un ultimo compito arrivato insieme a uno spegnimento decisivo può ancora cambiarla (vedi fatto), e nessun telefono vede un vincitore che poi cambia
    const fineNascosta = this.fase==='fine' && this.tFine!=null && this.t-this.tFine<FINESTRA;
    const f = { fase:fineNascosta?'gioco':this.fase, mappa:this.M===ATRIO?'atrio':'palazzo', sec:sec(this.fineFase), round:this.round,
      g:this.gioc.map(p=>[p.id, p.vivo?1:0, p.uscito?1:0]), pc: tot?Math.round(fatti/tot*100):0,
      buio: this.buio ? sec(this.buio.fine) : 0, interf: this.interf ? sec(this.interf.fine) : 0, acqua: this.acqua ? [sec(this.acqua.fine-GRAZIA), this.acqua.a?1:0, this.acqua.b?1:0] : null, neb: this.nebbiaAttiva() ? sec(this.nebbiaFine) : 0, bengala: this.bengalaAttivo() ? sec(this.bengalaFine) : 0,
      corpi: this.corpi.map(c=>[c.id, Math.round(c.x), Math.round(c.y)]),
      segnati: this.gioc.filter(p=>p.segnato&&p.vivo).map(p=>p.id), sindaci: this.gioc.filter(p=>p.rivelato).map(p=>p.id),
      scudi: this.gioc.filter(p=>p.vivo&&p.protettoDa!=null).map(p=>p.id), cam: this.telecamere.map(c=>[Math.round(c.x),Math.round(c.y),c.base?1:0]), osservate: this.gioc.some(p=>p.osserva&&p.vivo) };
    // (di chi è la lanterna non parte più: nemmeno i telefoni con la versione vecchia in cache lo sanno. Senza il campo non vanno in errore: sotto «Lanterna spenta!» scrivono «ha suonato la campana»)
    if(this.riu){ const R=this.riu, fv=this.fineVotoVisto(R)+R.t0; f.riu = { motivo:R.motivo, da:R.da, disc:sec(R.disc+R.t0), voto:sec(fv), df:Math.max(0,Math.round((R.disc+R.t0-this.t)*1000)), vf:Math.max(0,Math.round((fv-this.t)*1000)), votati:[...R.voti.keys()], zittiti:R.zittiti, chat:this.chat.slice(-MAX_CHAT) }; }
    if(this.esito) f.esito = this.esito;
    if(this.vincitore && !fineNascosta) f.fine = { ...this.vincitore, ruoli:this.gioc.map(p=>[p.id, p.ruolo, p.vivo?1:0]) };
    return f;
  }
  posizioni(){
    return this.gioc.filter(p=>!p.uscito && p.inBotola==null).map(p=>{ /* chi è dentro una botola non si vede */ const a=[p.id, Math.round(p.x), Math.round(p.y), Math.round(p.dir*100)/100, (p.muove?1:0)|(p.fantasma?2:0)|(p.bloccatoFine>this.t?4:0)]; const tr=this.travestito(p); if(tr) a.push(tr); return a; });
  }
  privato(id){
    const p=this.per(id); if(!p) return null;
    const om=p.squadra==='ombre', sec=f=>Math.max(0,Math.ceil(f-this.t));
    return { ruolo:p.ruolo, squadra:p.squadra, compagni: om ? this.gioc.filter(q=>q!==p&&q.squadra==='ombre').map(q=>q.id) : [],
      compiti:p.compiti.map(c=>[c.post.id, c.fatto?1:0]), finti: p.squadra!=='ospiti',
      cd: om ? sec(p.cd+this.t) : 0, cdA:sec(p.cdA+this.t), usi:p.usi, campane:p.campane, cdBuio: om ? sec(this.cdBuio+this.t) : 0,
      zittito: !!(this.riu && this.riu.zittiti.includes(p.id)), voto:(this.riu && this.riu.voti.get(p.id)) || null, ep:p.ep, v:p.vPriv,
      vite:p.vite, bersaglio:p.bersaglio, mangiati:p.mangiati, quanti:this.imp.avvoltoio.quanti, usiRian:p.usiRian, usiBeng:p.usiBeng, campVolte:p.campVolte,
      bloccato: sec(p.bloccatoFine), traccia: p.traccia && p.traccia.fine>this.t ? [p.traccia.id, sec(p.traccia.fine)] : null,
      rianima: p.rianima ? sec(p.rianima.fine) : 0, travestito: this.travestito(p), rivelato:p.rivelato,
      indovinati:p.indovinati, quantiInd:this.imp.indovino.quanti, tentativi:p.tentativi, botola:p.inBotola==null?null:p.inBotola, fantasmaRuolo:p.fantasmaRuolo||null, cdF:sec(p.cdF||0), foto:p.foto||null, frenesia: this.haFrenesia(p) && this.M===PALAZZO ? sec(p.frenDa+this.imp.frenesia.secondi) : 0,
      camDisp:this.camDisp(p), camPiazzate:p.camPiazzate, usiVet:p.usiVet, allerta:sec(p.allertaFine), letti:Object.entries(p.letti), usiTra:p.usiTra, schermo:sec(p.schermoFine), campione:p.campione,
      controllo: p.controllo ? (q=>[p.controllo.v, sec(p.controllo.fine), q?Math.round(q.x):0, q?Math.round(q.y):0])(this.per(p.controllo.v)) : null, controllato: !!p.controllatoDa,
      portineria: p.portineria ? { st:p.portineria.st, log:p.portineria.log.slice(-8).map(([id,e,t])=>[id,e,Math.round(this.t-t)]) } : null, mod:p.mod, trappola: p.trappola ? [Math.round(p.trappola.x), Math.round(p.trappola.y), p.trappola.ids.length, this.imp.bracconiere.quanti] : null, trapRuoli:p.trapRuoli, imitato:p.imitato, imita:p.imita };
  }
  haFrenesia(p){ return !!(this.imp.frenesia.attiva && FRENESIA.includes(p.ruolo) && p.vivo);
  }
  camDisp(p){ if(p.ruolo!=='sentinella') return 0; const fatti=p.compiti.filter(c=>c.fatto).length; return Math.max(0, Math.min(this.imp.sentinella.max, Math.floor(fatti/this.imp.sentinella.ogni)) - p.camPiazzate); }
  classifica(){
    const v=this.vincitore; if(!v) return [];
    return this.gioc.map(p=>{
      const vince = v.id ? p.id===v.id : p.squadra===v.chi;
      // il Sopravvissuto vince se è vivo, chiunque vinca; il Gatto solo se le ombre non hanno vinto (con due vite era troppo facile: 7 volte su 10)
      return { id:p.id, nome:p.nome, bot:p.bot, pos: vince || (p.ruolo==='sopravvissuto' && p.vivo) || (p.ruolo==='gatto' && p.vivo && v.chi!=='ombre') ? 1 : 2 };
    });
  }
  // la partita da ricordare se l'host ricarica la pagina: solo dati semplici
  salva(){
    const resta=f=>Math.max(0,Math.round((f-this.t)*10)/10), R=this.riu;
    return { round:this.round, vincitore:this.vincitore, cdBuio:Math.round(this.cdBuio), ombreIniziali:this.ombreIniziali, dichiarati:this.dichiarati,
      cam:this.telecamere.filter(c=>!c.base).map(c=>[Math.round(c.x), Math.round(c.y), c.nome, c.da]),
      // a che punto era tutto: la fase, i sabotaggi aperti, le lanterne a terra, la riunione coi voti (daStato li tratta come facoltativi: una copia vecchia non li ha)
      fase:this.fase, resto:resta(this.fineFase),
      buio:this.buio?resta(this.buio.fine):0, interf:this.interf?resta(this.interf.fine):0, acqua:this.acqua?[resta(this.acqua.fine),this.acqua.a?1:0,this.acqua.b?1:0]:null,
      neb:this.nebbiaFine>this.t?resta(this.nebbiaFine):0, ben:this.bengalaFine>this.t?resta(this.bengalaFine):0,
      corpi:this.corpi.map(c=>[c.id,Math.round(c.x),Math.round(c.y),c.stanza,c.da]), esche:this.esche.map(e=>[e.da,e.corpo,resta(e.t)]),
      // la riunione già chiamata che sta per partire (FINESTRA): se l'host ricarica proprio lì, parte lo stesso
      ria:this.riuInArrivo && this.fase==='gioco' ? [this.riuInArrivo.m.tipo, this.riuInArrivo.m.da, this.riuInArrivo.m.corpo!=null?this.riuInArrivo.m.corpo:null, this.riuInArrivo.m.stanza||null, resta(this.riuInArrivo.t)] : null,
      riu:R?{ motivo:R.motivo, da:R.da, corpo:R.corpo, stanza:R.stanza, t:Math.round(R.t*10)/10, disc:R.disc, voto:R.voto, voti:[...R.voti], zittiti:R.zittiti, chiusa:R.chiusa }:null,
      chat:R?this.chat:null, esito:this.esito||null,
      gioc:this.gioc.map(p=>({ id:p.id, nome:p.nome, bot:p.bot, ruolo:p.ruolo, vivo:p.vivo, uscito:p.uscito, usciVivo:p.usciVivo, x:Math.round(p.x), y:Math.round(p.y), dir:Math.round(p.dir*100)/100, ep:p.ep, cd:Math.round(p.cd), cdA:Math.round(p.cdA), usi:p.usi, campane:p.campane, vite:p.vite, bersaglio:p.bersaglio, mangiati:p.mangiati,
        usiRian:p.usiRian, usiBeng:p.usiBeng, campVolte:p.campVolte, rivelato:p.rivelato, camPiazzate:p.camPiazzate, usiVet:p.usiVet, usiTra:p.usiTra, mod:p.mod, imitato:p.imitato, imita:p.imita,
        indovinati:p.indovinati, tentativi:p.tentativi, fotoMostrata:p.fotoMostrata, fantasmaRuolo:p.fantasmaRuolo||null, foto:p.foto||null, morte:p.morte||null, letti:p.letti, protettoDa:p.protettoDa, zittito:p.zittito, segnato:p.segnato, campione:p.campione, trapRuoli:p.trapRuoli,
        compiti:p.compiti.map(c=>[c.post.id, c.fatto?1:0, c.extra?1:0]) })) };
  }
  // si riparte dal palazzo com'era: ruoli, compiti, eliminati, posti, sabotaggi, riunione. Con una copia di una versione vecchia (senza quei campi) tutti alla fontana
  static daStato(s, imp, eventi){
    const P=new Partita(s.gioc.map(g=>({ id:g.id, nome:g.nome, bot:g.bot })), imp, eventi);
    P.round=s.round||1; P.cdBuio=Math.max(20, s.cdBuio||0);
    if(s.ombreIniziali) P.ombreIniziali=s.ombreIniziali;
    if(s.dichiarati && typeof s.dichiarati==='object') P.dichiarati=s.dichiarati;
    (s.cam||[]).forEach(([x,y,nome,da])=>{ if(isFinite(x)&&isFinite(y)) P.telecamere.push({ x, y, nome:String(nome||'Telecamera'), da }); });
    s.gioc.forEach(g=>{
      const p=P.per(g.id); p.ruolo=RUOLI[g.ruolo]?g.ruolo:'ospite'; P.preparaRuolo(p);
      p.vivo=!!g.vivo; p.fantasma=!g.vivo; p.uscito=!!g.uscito; p.usciVivo=!!g.usciVivo; p.campane=g.campane|0; p.cd=g.cd!=null?+g.cd||0:18; p.cdA=g.cdA!=null?+g.cdA||0:10;
      ['usi','vite','bersaglio','mangiati','usiRian','usiBeng','campVolte','rivelato','camPiazzate','usiVet','usiTra','mod','imitato','imita','indovinati','tentativi','fotoMostrata','fantasmaRuolo','foto','morte','letti','protettoDa','zittito','segnato','campione','trapRuoli'].forEach(k=>{ if(g[k]!=null) p[k]=g[k]; });
      p.mod = g.mod || null;
      // il numero dei salti (ep) riparte da dove era: un salto vecchio arrivato tardi non deve sembrare nuovo al telefono (vedi «tp» in gioco.js)
      if(g.ep>0) p.ep=g.ep|0;
      p.compiti=(g.compiti||[]).map(([id,f,x])=>({ post:POSTAZIONI.find(q=>q.id===id), fatto:!!f, finto:p.squadra!=='ospiti', extra:!!x })).filter(c=>c.post);
    });
    P.M=PALAZZO; P.inCerchio();
    s.gioc.forEach(g=>{
      const p=P.per(g.id); if(p.uscito || !isFinite(g.x) || !isFinite(g.y) || g.x==null || g.y==null || (p.vivo && !libero(P.M,g.x,g.y))) return;
      P.teletrasporta(p,g.x,g.y); if(isFinite(g.dir) && g.dir!=null) p.dir=g.dir;
    });
    const f=s.fase, inRiu=(f==='riunione'||f==='esito') && !!s.riu;
    if(s.vincitore){ P.vincitore=s.vincitore; P.fase='fine'; }
    else if(f==='gioco' || inRiu){
      P.fase=f; P.fineFase=P.t+(+s.resto||0);
      (s.corpi||[]).forEach(([id,x,y,stanza,da])=>{ if(P.per(id)) P.corpi.push({ id, x, y, stanza, da, t:P.t }); });
      if(f==='gioco') (s.esche||[]).forEach(([da,corpo,r])=>{ P.esche.push({ da, corpo, t:P.t+(+r||0) }); });
      if(f==='gioco' && Array.isArray(s.ria) && P.per(s.ria[1])) P.riuInArrivo={ m:{ tipo:s.ria[0], da:s.ria[1], corpo:s.ria[2], stanza:s.ria[3] }, t:P.t+(+s.ria[4]||0), t0:P.t };
      if(s.buio) P.buio={ fine:P.t+s.buio };
      if(s.interf) P.interf={ fine:P.t+s.interf };
      if(s.acqua) P.acqua={ fine:P.t+s.acqua[0], a:!!s.acqua[1], b:!!s.acqua[2] };
      if(s.neb) P.nebbiaFine=P.t+s.neb;
      if(s.ben) P.bengalaFine=P.t+s.ben;
      if(P.buio||P.interf||P.acqua) P.assegnaRiparatori();
      if(inRiu){
        const r=s.riu, R={ motivo:r.motivo, da:r.da, corpo:r.corpo, stanza:r.stanza, t:+r.t||0, t0:P.t-(+r.t||0), disc:r.disc, voto:r.voto, voti:new Map(r.voti||[]), coda:[], chiusa:!!r.chiusa, zittiti:r.zittiti||[] };
        P.riu=R; P.chat=s.chat||[]; if(s.esito) P.esito=s.esito;
        // quello che i Bot dovevano dire è perso; il loro voto no
        for(const b of P.gioc) if(b.bot&&b.vivo&&!R.voti.has(b.id)) R.coda.push({ t:Math.max(R.t+1,R.disc+1.5)+rnd()*R.voto*0.5, chi:b, voto:true });
        R.coda.sort((a,b)=>a.t-b.t);
      }
    }
    else { P.fase='svela'; P.fineFase=P.t+(f==='svela'?Math.min(DUR_SVELA,+s.resto||0):DUR_SVELA); }
    P.segna();
    return P;
  }

  /* ----- mosse che arrivano dai telefoni ----- */
  muovi(id, m){
    const p=this.per(id); if(!p||p.bot||(this.fase!=='gioco'&&this.fase!=='atrio')||p.uscito) return;
    if(m.ep!==p.ep){ this.ritp(p); return; }
    if(p.inBotola!=null) return;   // dentro una botola non si cammina
    const x=+m.x, y=+m.y; if(!isFinite(x)||!isFinite(y)) return;
    const dt=Math.max(0.05, this.t-p.tPos), max=this.VEL*(p.fantasma?VEL_ANIMA:1)*dt*1.6+8, d=Math.hypot(x-p.x,y-p.y);
    if(d>max || x<T || y<T || x>(this.M.GW-1)*T || y>(this.M.GH-1)*T || (!p.fantasma && !libero(this.M,x,y))){ this.correggi(p); return; }
    if(p.bloccatoFine>this.t && d>4){ this.correggi(p); return; }
    if(p.rianima && Math.hypot(x-p.rianima.x, y-p.rianima.y)>0.6*T){ const pu=p.rianima.pulisci; p.rianima=null; this.priv(p); this.avviso(p, pu ? 'Ti sei mosso: la lanterna spenta è rimasta lì.' : 'Ti sei mosso: la lanterna non si è riaccesa.'); }
    p.x=x; p.y=y; p.dir=+m.d||0; p.muove=!!m.m; p.tPos=this.t;
  }
  correggi(p){ if(this.t-p.tCorr<0.4) return; p.tCorr=this.t; this.teletrasporta(p,p.x,p.y); }
  // il telefono ha un «ep» vecchio (ha perso un tp): gli rimando posizione ed ep giusti, senza cambiarli
  ritp(p){ if(p.bot||this.t-p.tCorr<0.6) return; p.tCorr=this.t; this.ev.privato(p.id, { t:'tp', x:Math.round(p.x), y:Math.round(p.y), ep:p.ep }); }
  vicino(p,x,y,r){ return Math.hypot(x-p.x,y-p.y) <= r*TOLL; }
  // una mossa dal telefono di p. Torna l'esito per quel telefono: 'ok', oppure perché no (le chiavi di TESTO_ESITO). Undefined vale ok.
  // Le mosse arrivano una alla volta (JavaScript non ne fa due insieme): «insieme» vuol dire nello stesso giro o a pochi giri di distanza, e le regole qui sotto
  // fanno in modo che dentro FINESTRA l'ordine d'arrivo non cambi il risultato.
  azione(id, m){
    const p=this.per(id); if(!p||p.uscito) return 'no';
    // chi è controllato dal Burattinaio è fermo: niente compiti, poteri o segnalazioni finché dura
    if(p.controllatoDa && this.fase==='gioco' && m.k!=='chat' && m.k!=='rapida') return 'fermo';
    // dentro una botola si può solo spostarsi tra le botole o uscire (sotto terra non si parla: la chat di prossimità resta spenta)
    if(p.inBotola!=null && this.fase==='gioco' && m.k!=='botola') return 'no';
    switch(m.k){
      case 'fatto': return this.fatto(p, m.post);
      // RIPARAZIONE DOPPIA: due persone riparano la stessa cosa insieme. Ripara la prima che arriva, alla seconda «Qualcuno l'aveva appena riparato» (e il suo telefono non torna indietro)
      case 'ripara': { const cosa=m.cosa||'luci', st=STAZ_RIP[cosa]; if(!st) return 'no'; if(this.fase!=='gioco') return this.tardi(); if(!p.vivo) return 'spento';   // (anche le ombre: fingono di aiutare)
        if(!this.lavoroAttivo(cosa)) return 'riparato';
        if(!this.vicino(p,centro(st.tx),centro(st.ty),R_USA)) return 'lontano';
        this.ripara(p, cosa); return 'ok'; }
      // CAMPANA E SEGNALAZIONE: la riunione parte FINESTRA s dopo la prima chiamata (chiamaRiunione). Chi è appena caduto (entro FINESTRA) chiama lo stesso: ha premuto quando era vivo
      case 'campana': { if(this.fase!=='gioco') return this.tardi(); if(!p.vivo && !this.appenaCaduto(p)) return 'spento'; if(this.riuInArrivo && this.riuInArrivo.m.da===p.id) return 'detto'; if(p.campane<=0) return 'no';
        if(!this.vicino(p,centro(CAMPANA.tx),centro(CAMPANA.ty),R_USA)) return 'lontano';
        const r=this.chiamaRiunione({ tipo:'campana', da:p.id }); if(r==='ok'){ p.campane--; this.priv(p); } return r; }   // (una chiamata che si unisce a un'altra non consuma la campana)
      // LANTERNA PULITA, MANGIATA O RIACCESA mentre la segnalano: una lanterna tolta da meno di FINESTRA s si segnala ancora (spariti)
      case 'segnala': { if(this.fase!=='gioco') return this.tardi(); if(!p.vivo && !this.appenaCaduto(p)) return 'spento';
        const c=this.corpi.find(c=>c.id===m.id) || this.sparito(m.id); if(!c) return 'corpo';
        if(!this.vicino(p,c.x,c.y,R_SEGNALA) || !vede(this.M,p.x,p.y,c.x,c.y)) return 'lontano';
        return this.chiamaRiunione({ tipo:'corpo', da:p.id, corpo:c.id, stanza:c.stanza }); }
      // DUE OMBRE SULLA STESSA PERSONA: spegne la prima che arriva; la seconda non perde la ricarica e legge «si era già spenta». Col Gatto ognuna toglie una vita.
      // OMBRA COLPITA DALLO SCERIFFO mentre spegne: se è caduta da meno di FINESTRA s lo spegnimento vale (e il colpo dello Sceriffo pure: cadono tutti e due, in qualunque ordine).
      // BOTOLA: chi è entrato in una botola da meno di FINESTRA s si spegne lo stesso (esce e cade lì)
      case 'spegni': { const ff=this.fotofinish(); if(this.fase!=='gioco' && !ff) return this.tardi(); if(p.squadra!=='ombre') return 'no'; if(!p.vivo && !this.appenaCaduto(p)) return 'spento'; if(p.cd>0) return 'ricarica';
        const v=this.per(m.id); if(!v || v.squadra==='ombre' || v.uscito) return 'no'; if(!v.vivo) return 'giaSpenta';
        if(v.inBotola!=null && !this.appenaInBotola(v)) return 'botola';
        if(!this.vicino(p,v.x,v.y,R_SPEGNI) || !vede(this.M,p.x,p.y,v.x,v.y)) return 'lontano';
        if(p.ruolo==='avvelenatore' && v.veleno) return 'no';   // (già avvelenata: si spegnerà da sola)
        if(v.inBotola!=null) this.tiraFuori(v);
        const fatto=this.provaSpegni(p,v); if(ff) this.riconta(); return fatto ? 'ok' : 'detto'; }
      case 'abil': { const v0=p.vPriv, f0=this.fase, ff=this.fotofinish(); this.abilita(p, m.id, m.id2); if(ff) this.riconta(); return p.vPriv!==v0 || this.fase!==f0 ? 'ok' : this.perche(p, m); }
      case 'botola': return this.botola(p, m);
      case 'parla': return this.parla(p, m.testo);
      case 'fantasma': return this.poteriFantasma(p, m);
      // DUE SABOTAGGI INSIEME: vale il primo, al secondo «C'è già un sabotaggio in corso»
      case 'buio': case 'sabota': { if(this.fase!=='gioco') return this.tardi(); if(p.squadra!=='ombre' || !(p.vivo || p.ruolo==='spettro')) return 'no';
        if(this.sabAttivo()) return 'sabAttivo'; if(this.cdBuio>0) return 'ricarica';
        this.attivaSab(p, m.tipo||'buio'); return this.sabAttivo() ? 'ok' : 'no'; }
      case 'pc': return this.muoviControllato(p, m);
      case 'chat': return this.chatUmana(p, String(m.testo||''));
      case 'rapida': return this.rapida(p, m.tipo, m.id);
      case 'voto': return this.vota(p, m.su);
      case 'rivela': return this.rivela(p);
      case 'indovina': return this.indovina(p, m.id, m.ruolo);
      case 'imita': return this.imita(p, m.id);
      case 'guardo': { const on=!!m.on && this.fase==='gioco' && this.vicino(p,centro(MONITOR.tx),centro(MONITOR.ty),R_USA*1.3); if(on!==p.osserva){ p.osserva=on; this.segna(); } return 'ok'; }
    }
  }
  // perché una mossa non è andata, quando la fase è cambiata: riunione già partita, o partita finita
  tardi(){ return this.fase==='fine' ? 'fine' : (this.fase==='riunione'||this.fase==='esito') ? 'riu' : 'no'; }
  // perché un potere non è andato (abilita non lo dice): si guarda com'è adesso
  perche(p, m){
    if(this.fase!=='gioco') return this.tardi();
    if(!p.vivo) return 'spento';
    if(p.ruolo==='campanaro' && this.riuInArrivo) return this.riuInArrivo.m.da===p.id ? 'detto' : 'chiamata';
    if(p.cdA>0) return 'ricarica';
    const tipo=BERSAGLIO[p.ruolo];
    if(tipo==='vivo' && m.id!=null){ const v=this.per(m.id); if(v && !v.vivo) return 'giaSpenta'; if(v && v.inBotola!=null) return 'botola'; if(v && !this.vicino(p,v.x,v.y,R_ABIL)) return 'lontano'; }
    if(tipo==='corpo' && m.id!=null){ const c=this.corpi.find(k=>k.id===m.id); if(!c) return 'corpo'; if(!this.vicino(p,c.x,c.y,R_ABIL)) return 'lontano'; }
    return 'no';
  }
  // caduto da meno di FINESTRA s, in gioco: le sue ultime mosse erano partite quando sul suo telefono era ancora vivo
  appenaCaduto(p){ return !p.vivo && !p.uscito && p.tCade!=null && (this.fase==='gioco' || this.fotofinish()) && this.t-p.tCade<=FINESTRA; }
  // FOTOFINISH: la fine decisa in gioco da meno di FINESTRA s (la foto non l'ha ancora detta). Uno spegnimento, un colpo dello Sceriffo o un compito che arrivano lì valgono ancora,
  // come se fossero arrivati un attimo prima; il vincitore si ricalcola con riconta. Il resto risponde «fine»
  fotofinish(){ return this.fase==='fine' && this.tFine!=null && this.t-this.tFine<FINESTRA; }
  // ULTIMO COMPITO, ULTIMA OMBRA E SPEGNIMENTO DECISIVO INSIEME: se le ombre avevano vinto e nella fotofinish vale anche la vittoria degli ospiti
  // (la festa pronta, o nessuna ombra viva), vincono gli ospiti: a parità vince la festa. Se avevano vinto gli ospiti, restano loro
  riconta(){
    if(!this.vincitore || this.vincitore.chi!=='ombre') return;
    const om=this.gioc.filter(p=>p.vivo&&p.squadra==='ombre').length, { tot, fatti }=this.contaCompiti(), insieme=', nello stesso istante dell\'ultima lanterna spenta.';
    if(om===0) this.vincitore={ chi:'ospiti', perche:'Tutte le ombre sono state smascherate'+insieme };
    else if(tot>0 && fatti>=tot) this.vincitore={ chi:'ospiti', perche:'Tutti i preparativi della festa sono pronti'+insieme };
    if(this.vincitore.chi==='ospiti') this.segna();
  }
  appenaInBotola(v){ return v.inBotola!=null && v.tBotola!=null && this.t-v.tBotola<=FINESTRA; }
  // fuori dalla botola (era appena entrato): resta sulla botola, dove il telefono di chi spegne lo vedeva
  tiraFuori(v){ v.inBotola=null; this.priv(v); this.fx('botola', v.x, v.y); }
  // una lanterna tolta da poco: si può ancora segnalare
  sparito(id){ return this.spariti.find(s=>s.id===id && this.t-s.t<=FINESTRA) || null; }
  togliCorpo(c){ this.corpi=this.corpi.filter(k=>k!==c); this.spariti=this.spariti.filter(s=>this.t-s.t<=FINESTRA); this.spariti.push({ id:c.id, x:c.x, y:c.y, stanza:c.stanza, t:this.t }); this.nImp++; }
  // RIUNIONE CHIAMATA (campana, segnalazione, Campanaro, Bot): parte FINESTRA s dopo la prima chiamata. Intanto il gioco va avanti: chi spegne, ripara o fa un compito
  // in quel tratto conta, come se fosse arrivato un attimo prima. Una seconda chiamata nel tratto si unisce alla prima (risponde 'chiamata'). Se intanto la partita finisce, niente riunione
  chiamaRiunione(m){
    if(this.fase!=='gioco') return this.tardi();
    if(this.riuInArrivo) return this.riuInArrivo.m.da===m.da ? 'detto' : 'chiamata';   // (lo stesso che ripreme mentre la sua sta partendo: niente frase, niente seconda campana)
    this.riuInArrivo={ m, t:this.t+FINESTRA, t0:this.t }; this.nImp++; this.segna();
    return 'ok';
  }
  // COMPITO E FINE INSIEME: un compito che arriva nella fotofinish vale ancora (vedi riconta: se completa la festa dopo la vittoria delle ombre, vincono gli ospiti)
  fatto(p, postId){
    if(this.fotofinish()){
      const c=p.compiti.find(c=>c.post.id===postId && !c.fatto); if(!c || !this.vicino(p, centro(c.post.tx), centro(c.post.ty), R_USA)) return 'fine';
      c.fatto=true; this.priv(p); this.segna(); this.nImp++; this.riconta();
      return 'ok';
    }
    if(this.fase!=='gioco') return this.tardi();
    const c=p.compiti.find(c=>c.post.id===postId && !c.fatto); if(!c) return p.compiti.some(c=>c.post.id===postId) ? 'ok' : 'no';   // (già fatto: una ripetizione)
    if(!this.vicino(p, centro(c.post.tx), centro(c.post.ty), R_USA)) return 'lontano';
    this.completaCompito(p,c); return 'ok';
  }
  completaCompito(p,c){
    if(c.fatto) return;
    c.fatto=true; this.priv(p); this.segna();
    // i compiti visibili: chi è lì vicino vede l'effetto, e sa che chi l'ha fatto non è un'ombra (le ombre fingono e basta)
    if(!c.finto && c.post.visibile && this.imp.compitiVisibili && !this.nebbiaAttiva()){
      this.fx('compito', centro(c.post.tx), centro(c.post.ty), { v:c.post.visibile });   // (senza chi l'ha fatto: un compito vero dice che non è un'ombra)
      if(!p.bot) this.ev.privato(p.id, { t:'fx', k:'compitoMio', x:0, y:0 });
      for(const o of this.gioc){ if(!o.bot||!o.vivo||o===p) continue; if(dist(o,p)<=this.vista(o) && vede(this.M,o.x,o.y,p.x,p.y)){ o.sosp[p.id]=(o.sosp[p.id]||0)-35; o.mem.puliti.push({ id:p.id, v:c.post.visibile }); } }
    }
    this.nImp++;
    if(!c.finto && this.controllaVittoria()) this.chiudi();
  }
  abilita(p, bersId, bers2){
    // lo Sceriffo caduto da meno di FINESTRA s spara lo stesso: aveva premuto da vivo (vedi 'spegni' in azione)
    if((this.fase!=='gioco' && !(p.ruolo==='sceriffo' && this.fotofinish())) || (!p.vivo && !(p.ruolo==='sceriffo' && this.appenaCaduto(p)))) return;
    const tipo=BERSAGLIO[p.ruolo]; if(!tipo) return;
    if(tipo==='mutaforma'){
      if(bersId!=null){ // campiona chi ha vicino
        const q=this.per(bersId); if(!q||!q.vivo||q===p||!this.vicino(p,q.x,q.y,R_ABIL)||!vede(this.M,p.x,p.y,q.x,q.y)) return;
        if(q.ruolo==='veterano' && q.allertaFine>this.t){ this.respinto(q,p); return; }
        p.campione=q.id; this.priv(p); this.avviso(p, `Hai il campione di ${q.nome}: trasformati quando vuoi.`, 'ombra'); return;
      }
      if(!p.campione||p.cdA>0||this.travestito(p)) return;
      p.aspetto=p.campione; p.aspettoFine=this.t+this.imp.trasformista.durata; p.cdA=this.imp.trasformista.ricarica; this.priv(p);
      this.avviso(p, `Ora sembri ${this.nomeDi(p.campione)}.`, 'ombra'); this.fx('trasforma', p.x, p.y);
      // il lampo della trasformazione lo nota chi sta guardando (sei Bot su dieci, se è a portata d'occhio)
      for(const o of this.gioc){ if(!o.bot||!o.vivo||o===p||o.squadra==='ombre') continue; if(dist(o,p)<=this.vista(o) && vede(this.M,o.x,o.y,p.x,p.y) && rnd()<.6) o.vistoTrasf[p.id]=this.t; }
      return;
    }
    if(tipo==='stanza'){
      const st=+bersId; if(p.cdA>0 || !(st>=0 && st<PALAZZO.stanze.length)) return;
      p.portineria={ st, log:[], prev:{} }; this.gioc.forEach(q=>{ p.portineria.prev[q.id]=this.stanzaIdx(q); });
      p.cdA=this.imp.portiere.ricarica; this.priv(p); this.avviso(p, `Ora sai chi entra ed esce ${PALAZZO.stanze[st].in}.`);
      return;
    }
    let v=null, c=null;
    if(tipo==='vivo'){ v = bersId!=null ? this.per(bersId) : null; if(!v || !v.vivo || (v.inBotola!=null && !(p.ruolo==='sceriffo' && this.appenaInBotola(v))) || !this.vicino(p,v.x,v.y,R_ABIL) || (v!==p && !vede(this.M,p.x,p.y,v.x,v.y))) return; }
    if(tipo==='corpo'){ c = this.corpi.find(k=>k.id===bersId); if(!c || !this.vicino(p,c.x,c.y,R_ABIL)) return; }
    if(tipo==='due'){
      const a=this.per(bersId), b=this.per(bers2);
      if(!a||!b||a===b||!a.vivo||!b.vivo||a.uscito||b.uscito||p.cdA>0||p.usiTra<=0) return;
      const vet=[a,b].find(q=>q!==p&&q.ruolo==='veterano'&&q.allertaFine>this.t); if(vet){ this.respinto(vet,p); return; }
      // chi viene spostato smette di essere controllato dal Burattinaio
      [a,b].forEach(q=>{ const bur=q.controllatoDa!=null ? this.per(q.controllatoDa) : null; if(bur && bur.controllo) this.fineControllo(bur); });
      p.usiTra--; p.cdA=this.imp.trasportatore.ricarica; this.priv(p);
      const ax=a.x, ay=a.y; this.fx('trasporto',a.x,a.y); this.fx('trasporto',b.x,b.y);
      [a,b].forEach(q=>{ q.rianima=null; q.attesa=0; q.azione=null; });
      this.teletrasporta(a, b.x, b.y); this.teletrasporta(b, ax, ay);
      [a,b].forEach(q=>{ if(q!==p) this.avviso(q,'Il Trasportatore ti ha scambiato di posto!'); });
      this.avviso(p, `Hai scambiato ${a.nome} e ${b.nome}.`);
      return;
    }
    // il Veterano in allerta: chiunque lo tocchi cade
    if(v && v!==p && v.ruolo==='veterano' && v.allertaFine>this.t){ this.respinto(v,p); return; }
    switch(p.ruolo){
      case 'veggente':
        if(p.usi<=0 || p.cdA>0 || v===p) return;
        p.usi--; p.cdA=this.imp.veggente.ricarica;
        { const buono = v.squadra==='ospiti'; p.letti[v.id] = buono ? 'buono' : 'cattivo'; this.priv(p);
          if(p.bot){ p.mem.controlli.push({ id:v.id, ok:buono }); p.sosp[v.id]=(p.sosp[v.id]||0)+(buono?-40:70); }
          else this.avviso(p, buono ? `${v.nome} è dei buoni.` : `${v.nome} è un'ombra o gioca da solo!`, buono?'':'ombra');
          this.fx('lente', v.x, v.y, { solo:p.id }); }
        return;
      case 'medico':
        if(p.cdA>0 || (v===p && !this.imp.medico.se)) return;
        this.gioc.forEach(q=>{ if(q.protettoDa===p.id) q.protettoDa=null; });
        v.protettoDa=p.id; p.cdA=this.imp.medico.ricarica; this.priv(p);
        this.avviso(p, v===p ? 'Ti proteggi fino alla prossima riunione.' : `Proteggi ${v.nome} fino alla prossima riunione.`);
        this.fx('scudo', v.x, v.y, { solo:p.id });
        return;
      case 'sceriffo':
        if(p.cdA>0 || v===p) return;
        p.cdA=this.imp.sceriffo.ricarica; this.priv(p);
        if(v.inBotola!=null) this.tiraFuori(v);   // (entrata da meno di FINESTRA s: il colpo era partito prima)
        this.fx('sparo', p.x, p.y, { x2:Math.round(v.x), y2:Math.round(v.y) }); this.noto(p,'sceriffo');
        if(v.squadra==='ombre' || (v.squadra==='soli' && this.imp.sceriffo.soli)){
          if(v.protettoDa!=null){ this.rompiScudo(v, p); return; }
          this.spegni(p, v, 'sceriffo'); this.avviso(p, `Colpito: ${v.nome} era ${RUOLI[v.ruolo].nome}.`);
          if(p.bot) p.mem.sparato={ id:v.id, ombra:v.squadra==='ombre' };
        } else { this.avviso(p, `${v.nome} è dei buoni: cadi tu.`, 'morte'); this.spegni(p, p, 'sceriffo'); }
        return;
      case 'segugio':
        if(p.cdA>0 || v===p) return;
        p.traccia={ id:v.id, fine:this.t+this.imp.segugio.durata }; p.cdA=this.imp.segugio.ricarica; this.priv(p);
        this.avviso(p, `Hai preso la scia di ${v.nome}.`); this.fx('fiuto', v.x, v.y, { solo:p.id });
        return;
      case 'campanaro':
        if(p.campVolte<=0) return;
        if(this.chiamaRiunione({ tipo:'campana', da:p.id })!=='ok') return;   // (un'altra chiamata è già in arrivo: il tocco non si consuma)
        p.campVolte--; this.priv(p); this.fx('campana', p.x, p.y);
        return;
      case 'bengala':
        if(p.usiBeng<=0 || this.bengalaAttivo()) return;
        p.usiBeng--; this.bengalaFine=this.t+this.imp.bengala.durata; this.priv(p); this.segna(); this.noto(p,'bengala');
        this.fx('bengala', 0, 0, { globale:1 });   // (a tutto schermo: il posto direbbe chi l'ha acceso)
        return;
      case 'rianimatore':
        if(p.usiRian<=0 || p.rianima) return;
        if(p.bot){ if(p.azione && p.azione.tipo==='rianima') return; p.attesa=this.imp.rianimatore.tempo; p.azione={ tipo:'rianima', corpo:c.id }; p.path=[]; p.meta=null; return; }
        p.rianima={ corpo:c.id, fine:this.t+this.imp.rianimatore.tempo, x:p.x, y:p.y }; this.priv(p);
        this.avviso(p, 'Resta fermo finché la lanterna non si riaccende.');
        return;
      case 'sentinella':
        if(this.camDisp(p)<=0) return;
        p.camPiazzate++; this.telecamere.push({ x:p.x, y:p.y, nome:`Telecamera ${p.camPiazzate}`, da:p.id }); this.priv(p); this.segna();
        this.avviso(p, `Telecamera piazzata ${stanzaDi(this.M,p).in}.`); this.fx('telecamera', p.x, p.y, { solo:p.id });
        return;
      case 'ingegnere':
        if(p.cdA>0 || !this.sabAttivo()) return;
        p.cdA=this.imp.ingegnere.ricarica; this.priv(p); this.fineSab(p);
        return;
      case 'veterano':
        if(p.cdA>0 || p.usiVet<=0 || p.allertaFine>this.t) return;
        p.usiVet--; p.allertaFine=this.t+this.imp.veterano.durata; p.cdA=this.imp.veterano.ricarica; this.priv(p);
        this.avviso(p, `In allerta per ${this.imp.veterano.durata} secondi: chi ti tocca cade.`);
        return;
      case 'bracconiere':
        if(p.cdA>0) return;
        p.trappola={ x:p.x, y:p.y, ids:[] }; p.trapRuoli=null; p.cdA=this.imp.bracconiere.ricarica; this.priv(p);
        this.avviso(p, 'Trappola piazzata: la vedi solo tu.');
        return;
      case 'spia':
        if(p.cdA>0) return;
        p.cdA=this.imp.spia.ricarica; p.schermoFine=this.t+this.imp.spia.durata; this.priv(p);
        return;
      case 'burattinaio':
        if(p.cdA>0 || v===p || v.squadra==='ombre' || p.controllo) return;
        p.controllo={ v:v.id, fine:this.t+this.imp.burattinaio.durata }; v.controllatoDa=p.id; v.bloccatoFine=p.controllo.fine; v.path=[]; v.meta=null;
        p.cdA=this.imp.burattinaio.ricarica; this.priv(p); this.priv(v);
        this.avviso(v, 'Qualcuno ti controlla: sei fermo!', 'ombra'); this.avviso(p, `Controlli ${v.nome}: muovilo col joystick.`, 'ombra');
        return;
      case 'silenziatore':
        if(p.cdA>0 || v===p || v.zittito) return;
        v.zittito=true; p.cdA=this.imp.silenziatore.ricarica; this.priv(p);
        this.avviso(p, `${v.nome} non potrà parlare alla prossima riunione.`, 'ombra');
        return;
      case 'nebbia':
        if(p.cdA>0 || this.nebbiaAttiva()) return;
        this.nebbiaFine=this.t+this.imp.nebbia.durata; p.cdA=this.imp.nebbia.ricarica; this.priv(p); this.segna();
        this.fx('nebbia', 0, 0, { globale:1 });
        return;
      case 'trasformista':
        if(p.cdA>0 || v===p) return;
        p.aspetto=v.id; p.aspettoFine=this.t+this.imp.trasformista.durata; p.cdA=this.imp.trasformista.ricarica; this.priv(p);
        this.avviso(p, `Ora sembri ${v.nome}.`, 'ombra'); this.fx('trasforma', p.x, p.y);
        return;
      case 'spazzino':
        // pulire vuol dire restare fermi accanto alla lanterna spenta (qualche secondo): chi passa lo vede
        if(p.cdA>0 || p.rianima) return;
        { const tempo=this.imp.spazzino.tempo;
          if(p.bot){ if(p.azione && p.azione.tipo==='pulisci') return; p.attesa=tempo; p.azione={ tipo:'pulisci', corpo:c.id }; p.path=[]; p.meta=null; return; }
          p.rianima={ corpo:c.id, fine:this.t+tempo, x:p.x, y:p.y, pulisci:true }; this.priv(p);
          this.avviso(p, `Resta fermo ${tempo} secondi: la lanterna sparisce.`, 'ombra'); }
        return;
      case 'ipnotista':
        if(p.cdA>0 || v===p || v.squadra==='ombre') return;
        v.bloccatoFine=this.t+this.imp.ipnotista.durata; p.cdA=this.imp.ipnotista.ricarica; this.priv(p); this.priv(v);
        this.avviso(v, 'Sei ipnotizzato: non riesci a muoverti!', 'ombra'); this.fx('ipnosi', v.x, v.y);
        return;
      case 'avvoltoio':
        this.togliCorpo(c); p.mangiati++; this.priv(p); this.segna();
        this.fx('mangia', c.x, c.y); this.noto(p,'avvoltoio');
        if(p.mangiati>=this.imp.avvoltoio.quanti){ this.vincitore={ chi:'avvoltoio', id:p.id, perche:`L'Avvoltoio (${p.nome}) ha fatto sparire ${p.mangiati} lanterne.` }; this.chiudi(); }
        else this.avviso(p, `Lanterne mangiate: ${p.mangiati} su ${this.imp.avvoltoio.quanti}.`);
        return;
    }
  }
  rivela(p){
    if(this.fase!=='riunione'||!p.vivo||p.ruolo!=='sindaco'||p.rivelato) return;
    p.rivelato=true; this.priv(p); this.dichiarati[p.id]='sindaco';
    this.scrivi(null, `${p.nome} si rivela: è il Sindaco. Il suo voto vale doppio.`);
    this.sospetta(p,-60,null);
  }

  /* ----- eliminazioni, buio ----- */
  rompiScudo(v, chi){
    const md=this.per(v.protettoDa); v.protettoDa=null; this.priv(v); this.segna();
    this.avviso(chi, 'Non puoi: ha lo scudo del Medico. Ora lo scudo si è rotto.', 'ombra');
    if(md && md.bot) md.mem.scudoRotto=v.id;
    if(md) this.avviso(md, `Lo scudo di ${v.nome} si è rotto: qualcuno ci ha provato!`, 'ombra');
    this.fx('scudoRotto', v.x, v.y, { noOmbre:1 });
  }
  respinto(vet, chi){
    this.avviso(chi, 'Hai toccato il Veterano in allerta: la tua lanterna si è spenta.', 'morte');
    this.avviso(vet, `${chi.nome} ti ha toccato mentre eri in allerta: la sua lanterna si è spenta.`);
    this.spegni(vet, chi, 'veterano');
  }
  provaSpegni(k,v){
    if(v.ruolo==='veterano' && v.allertaFine>this.t){ this.respinto(v,k); return false; }
    if(v.protettoDa!=null){ k.cd=12; this.priv(k); this.rompiScudo(v,k); return false; }
    if(k.ruolo==='avvelenatore'){
      if(v.veleno) return false;
      v.veleno={ da:k.id, fine:this.t+this.imp.avvelenatore.ritardo }; k.cd=this.imp.ricarica; this.priv(k);
      this.avviso(k, `Hai avvelenato ${v.nome}: si spegnerà tra ${this.imp.avvelenatore.ritardo} secondi.`, 'ombra');
      return true;
    }
    k.cd=this.imp.ricarica; this.priv(k);
    this.spegni(k,v,'normale'); return true;
  }
  // modo: 'normale' (un'ombra), 'veleno' (nessuno vicino), 'sceriffo'
  spegni(k,v,modo){
    if(!v.vivo) return;
    if(v.ruolo==='gatto' && v.vite>1 && modo!=='sceriffo'){
      v.vite--; this.priv(v);
      this.avviso(v, 'Ti hanno quasi spento: ti resta una vita.', 'ombra');
      if(k!==v) this.avviso(k, `${v.nome} si è rialzato: era un Gatto!`, 'ombra');
      this.fx('gatto', v.x, v.y);
      // chi l'ha colpito ora sa che è un Gatto: può riprovare presto, e un'ombra Bot lo insegue per un po'
      if(k!==v && modo==='normale' && k.squadra==='ombre'){ k.cd=Math.min(k.cd, this.imp.gatto.ricarica); this.priv(k); if(k.bot){ k.insegue=v.id; k.insegueFine=this.t+25; } }
      return;
    }
    v.vivo=false; v.fantasma=true; v.protettoDa=null; v.path=[]; v.meta=null; v.attesa=0; v.segnala=null; v.ripara=null; v.veleno=null; v.rianima=null; v.tCade=this.t; this.nImp++;
    if(v.controllo) this.fineControllo(v);
    if(v.ruolo==='medico') this.gioc.forEach(q=>{ if(q.protettoDa===v.id) q.protettoDa=null; });
    const dove=postoCorpo(this.M,v.x,v.y), c={ id:v.id, x:dove.x, y:dove.y, stanza:stanzaDi(this.M,v).in, da:k.id, t:this.t };   // (il telo steso è largo: mai a cavallo di un muro)
    this.corpi.push(c);
    this.fx('spegni', v.x, v.y);
    if(v.mod==='urlatore') this.fx('urlo', v.x, v.y, { globale:1 });
    if(v.mod==='celebrita') this.celebri.push({ id:v.id, stanza:c.stanza, t:this.t });
    if(v.mod==='esca' && k!==v && k.vivo && this.fase==='gioco') this.esche.push({ da:k.id, corpo:c.id, t:this.t+RITARDO_ESCA });   // la riunione la apre passoGioco: qui siamo a metà di uno spegnimento, magari dentro iniziaRiunione
    if(modo==='normale' && k.bot){ k.dopoSpegni=true; k.path=[]; k.meta=null; k.autoSegnala=rnd()<.3; }   // un'ombra su tre fa finta di trovarla lei
    if(modo==='normale'){
      const neb=this.nebbiaAttiva(), travest=this.travestito(k);
      for(const o of this.gioc){
        if(!o.bot||!o.vivo||o===k||o.squadra==='ombre') continue;
        if(dist(o,k)<=this.vista(o) && vede(this.M,o.x,o.y,k.x,k.y)){
          // chi ha visto con i suoi occhi la trasformazione sa chi è davvero; gli altri vedono il travestimento
          const visto = travest && !(this.t-(o.vistoTrasf[k.id]||-99) <= this.imp.trasformista.durata+1) ? travest : k.id;
          if(neb) o.mem.nebbia={ vittima:v.id };
          else if(visto===o.id) o.mem.copia={ vittima:v.id };   // vede uno identico a sé che spegne qualcuno: c'è un Mutaforma, ma non sa chi è
          else { o.mem.testimone={ killer:visto, vittima:v.id, stanza:c.stanza }; o.sosp[visto]=(o.sosp[visto]||0)+100; }
          if(o.segnala==null){ o.segnala=0.7+rnd()*0.6; o.corpoVisto=c; }
        }
      }
    }
    if(v.ruolo==='vendicatore' && k!==v && modo!=='sceriffo') k.segnato=true;
    // il bersaglio dell'Accusatore è uscito senza voto: l'Accusatore diventa Giullare
    this.gioc.filter(a=>a.ruolo==='accusatore'&&a.vivo&&a.bersaglio===v.id).forEach(a=>{ a.ruolo='giullare'; this.priv(a); this.avviso(a, 'Il tuo bersaglio è uscito: ora sei il Giullare. Fatti cacciare col voto!'); });
    this.priv(v); this.segna();
    // un ospite spento può diventare un fantasma col suo potere (Custode o Medium)
    if(v.squadra==='ospiti' && !v.fantasmaRuolo && this.imp.fantasmi && this.imp.fantasmi.attivi){
      // al massimo un Custode e un Medium per partita: più scudi insieme lasciavano un'ombra sola senza speranza
      const F=this.imp.fantasmi, ha=x=>this.gioc.some(g=>g.fantasmaRuolo===x), r = !ha('custode') && rnd()*100<F.custode ? 'custode' : !ha('medium') && rnd()*100<F.medium ? 'medium' : null;
      if(r){ v.fantasmaRuolo=r; v.cdF=8; v.morte={ da: k!==v ? (modo==='normale' ? (this.travestito(k)||k.id) : k.id) : null, st:this.stanzaIdx(v), x:Math.round(v.x), y:Math.round(v.y) };
        if(r==='medium') v.foto=this.nuovaFoto(v);
        this.avviso(v, `Da fantasma sei il ${FANTASMI[r].nome}: ${FANTASMI[r].desc}`); }
    }
    // chi viene spento vede chi è stato (se l'ombra era travestita, vede il travestimento)
    if(v!==k && !v.bot) this.ev.privato(v.id, { t:'morte', da: modo==='normale' ? (this.travestito(k)||k.id) : k.id, modo });
    if(v!==k && modo!=='veterano'){
      this.avviso(v, "Hanno spento la tua lanterna. Ora sei un'anima: puoi ancora finire i compiti.", 'morte');
      if(modo==='normale') this.avviso(k, `Hai spento la lanterna di ${v.nome}.`, 'ombra');
    }
    if(this.controllaVittoria()) this.chiudi();
  }
  // chi ha spento un'Esca segnala da solo, per la stessa strada di una segnalazione normale. Se nel frattempo è caduto o la lanterna non c'è più, niente riunione a suo nome.
  // Una riunione aperta da altri svuota la coda: due spegnimenti insieme fanno una riunione sola.
  // ESCA E UN'ALTRA CHIAMATA: se una riunione è già in arrivo, l'Esca non ne apre un'altra (è la stessa)
  scattaEsca(){
    if(this.riuInArrivo) return false;
    while(this.esche.length && this.t>=this.esche[0].t){
      const e=this.esche.shift(), k=this.per(e.da), c=this.corpi.find(q=>q.id===e.corpo);
      if(!k || !k.vivo || !c) continue;
      k.dopoSpegni=false; k.autoSegnala=false; k.segnala=null; k.corpoVisto=null;
      this.iniziaRiunione({ tipo:'corpo', da:k.id, corpo:c.id, stanza:c.stanza });
      if(this.fase==='riunione'){ this.avviso(k, "Era un'Esca: ti ha tradito.", 'ombra'); this.subitoATutti(); }
      return true;
    }
    return false;
  }
  stanzaIdx(q){ return this.M.PAV[tY(this.M,q.y)*this.M.GW+tX(this.M,q.x)]; }
  sabAttivo(){ return !!(this.buio || this.interf || this.acqua); }
  lavoroAttivo(cosa){ return cosa==='luci' ? !!this.buio : cosa==='console' ? !!this.interf : cosa==='chiusaA' ? !!(this.acqua && !this.acqua.a) : cosa==='chiusaB' ? !!(this.acqua && !this.acqua.b) : false; }
  // i Bot ospiti si dividono le riparazioni: uno per ogni punto da sistemare
  assegnaRiparatori(){
    const lavori=['luci','console','chiusaA','chiusaB'].filter(c=>this.lavoroAttivo(c));
    for(const c of lavori){
      if(this.gioc.some(b=>b.bot&&b.vivo&&b.ripara===c)) continue;
      const st=STAZ_RIP[c], q={ x:centro(st.tx), y:centro(st.ty) };
      const liberi=this.gioc.filter(b=>b.bot&&b.vivo&&b.squadra!=='ombre'&&!b.ripara&&b.bloccatoFine<=this.t).sort((a,b)=>dist(a,q)-dist(b,q));
      if(liberi.length){ const b=liberi[0]; b.ripara=c; b.path=[]; b.meta=null; b.attesa=0; b.azione=null; }
    }
  }
  attivaSab(chi, tipo){
    if(this.sabAttivo() || this.cdBuio>0 || this.fase!=='gioco') return;
    const S=this.imp.sabotaggi;
    if(tipo==='interferenza' && S.interferenzaSi){ this.interf={ fine:this.t+S.interferenza }; this.fx('interferenza', centro(CONSOLE.tx), centro(CONSOLE.ty), { globale:1 }); }
    else if(tipo==='acqua' && S.acquaSi){ this.acqua={ fine:this.t+S.acqua, a:false, b:false }; this.fx('acqua', centro(CHIUSA_A.tx), centro(CHIUSA_A.ty), { globale:1 }); }
    else if(tipo==='buio') return this.attivaBuio(chi);
    else return;
    this.cdBuio=S.ricarica; this.subitoATutti(); this.nImp++;
    this.gioc.forEach(p=>this.priv(p));   // (a tutti, anche se la ricarica serve solo alle ombre: sul broker non si deve vedere a chi arriva un privato subito dopo un sabotaggio)
    this.assegnaRiparatori();
  }
  ripara(p, cosa){
    if(cosa==='luci') return this.fineBuio(true, p);
    if(cosa==='console' && this.interf){ this.interf=null; this.nImp++; this.liberaRip('console'); this.subitoATutti(); this.ev.tutti({ t:'avviso', testo:`${p.nome} ha riparato il telegrafo.` }); this.fx('luci', centro(CONSOLE.tx), centro(CONSOLE.ty), { globale:1 }); return; }
    if((cosa==='chiusaA'||cosa==='chiusaB') && this.acqua){
      const k=cosa==='chiusaA'?'a':'b'; if(this.acqua[k] && !(this.acqua.a && this.acqua.b)) return;   // (chiusa già chiusa: niente secondo avviso «manca l'altra»)
      this.acqua[k]=true; this.liberaRip(cosa); this.subitoATutti(); this.nImp++;
      if(this.acqua.a && this.acqua.b){ this.acqua=null; this.ev.tutti({ t:'avviso', testo:'Le chiuse sono chiuse: l\'acqua si ritira.' }); this.fx('luci', p.x, p.y, { globale:1 }); }
      else this.ev.tutti({ t:'avviso', testo:`${p.nome} ha chiuso una chiusa: manca l'altra!` });
    }
  }
  liberaRip(cosa){ this.gioc.forEach(b=>{ if(b.ripara===cosa){ b.ripara=null; if(b.meta&&b.meta.tipo==='ripara'){ b.path=[]; b.meta=null; } } }); }
  fineSab(p){ if(this.buio) this.fineBuio(true,p); if(this.interf) this.ripara(p,'console'); if(this.acqua){ this.acqua.a=this.acqua.b=true; this.ripara(p,'chiusaA'); } }
  attivaBuio(chi){
    if(this.sabAttivo() || this.cdBuio>0) return;
    this.buio={ fine:this.t+40 }; this.cdBuio=this.imp.sabotaggi.ricarica; this.subitoATutti(); this.nImp++;
    this.gioc.forEach(p=>this.priv(p));   // (a tutti, anche se la ricarica serve solo alle ombre: sul broker non si deve vedere a chi arriva un privato subito dopo un sabotaggio)
    this.fx('buio', centro(QUADRO.tx), centro(QUADRO.ty), { globale:1 });
    const vivi=this.gioc.filter(p=>p.bot&&p.vivo&&p.squadra!=='ombre');
    this.assegnaRiparatori();
  }
  fineBuio(riparato, chi){
    if(!this.buio) return;
    this.buio=null; this.liberaRip('luci'); this.subitoATutti(); this.nImp++;
    if(riparato && chi){ this.ev.tutti({ t:'avviso', testo:`${chi.nome} ha riacceso le luci.` }); this.fx('luci', centro(QUADRO.tx), centro(QUADRO.ty), { globale:1 }); }
  }
  controllaVittoria(){
    if(this.vincitore) return true;
    const vivi=this.gioc.filter(p=>p.vivo), om=vivi.filter(p=>p.squadra==='ombre').length, altri=vivi.length-om;
    const { tot, fatti } = this.contaCompiti();
    if(om===0) this.vincitore={ chi:'ospiti', perche:'Tutte le ombre sono state smascherate.' };
    else if(om>=altri) this.vincitore={ chi:'ombre', perche:'Le ombre sono tante quanto gli ospiti rimasti.' };
    else if(tot>0 && fatti>=tot) this.vincitore={ chi:'ospiti', perche:'Tutti i preparativi della festa sono pronti.' };
    return !!this.vincitore;
  }
  // FINE PARTITA MENTRE ARRIVANO AZIONI: dopo la fine nessuna mossa vale (esito 'fine'), salvo l'ultimo compito della fotofinish (vedi fatto). La riunione in arrivo non parte
  chiudi(){ if(this.fase==='gioco'){ this.tFine=this.t; this.fineDetta=false; } this.fase='fine'; this.riu=null; this.riuInArrivo=null; this.fineFase=this.t; this.nImp++; this.segna(); }

  /* ----- chi esce e chi torna ----- */
  esce(id){
    const p=this.per(id); if(!p||p.uscito) return;
    p.usciVivo=p.vivo;   // (chi era già fantasma non ha perso niente: al ritorno niente avviso)
    p.uscito=true; p.vivo=false; p.fantasma=true; p.compiti.forEach(c=>c.fatto=true);
    this.segna();
    if(this.fase!=='fine' && this.controllaVittoria()) this.chiudi();
  }

  // chi torna quando il suo posto non c'è più (oltre un minuto e mezzo senza rete): resta fantasma e guarda la partita, mai fermo
  rientra(id){
    const p=this.per(id); if(!p||!p.uscito) return;
    p.uscito=false; p.vivo=false; p.fantasma=true;
    this.priv(p); this.segna(); if(p.usciVivo) this.avviso(p, 'Troppo tempo via: ora sei un fantasma.');
  }

  /* ----- il tempo che passa ----- */
  tick(dt){
    this.t+=dt;
    if(this.fase==='atrio'){
      for(const b of this.gioc){ if(!b.bot) continue; b.muove=false; if(b.attesa>0){ b.attesa-=dt; continue; } if(!b.path.length){ const q=puntoACaso(this.M); this.vaiA(b,q.tx,q.ty,null); b.attesa=1+rnd()*3; continue; } this.segui(b,dt); }
      if(this.t>=this.fineFase) this.via();
      return;
    }
    if(this.fase==='svela'){ if(this.t>=this.fineFase){ this.fase='gioco'; this.segna(); } return; }
    if(this.fase==='gioco') return this.passoGioco(dt);
    if(this.fase==='riunione') return this.passoRiunione(dt);
    if(this.fase==='esito'){ if(this.t>=this.fineFase) this.dopoEsito(); return; }
    // la fine decisa in gioco si annuncia ora (vedi foto): la foto parte subito
    if(this.fase==='fine' && this.tFine!=null && !this.fineDetta && this.t-this.tFine>=FINESTRA){ this.fineDetta=true; this.subitoATutti(); }
  }
  passoGioco(dt){
    if(this.riuInArrivo && this.t>=this.riuInArrivo.t){ const r=this.riuInArrivo; this.riuInArrivo=null; this.iniziaRiunione(Object.assign({}, r.m, { t0:r.t0 })); if(this.fase==='riunione') this.subitoATutti(); return; }
    if(this.esche.length && this.scattaEsca()) return;
    if(this.codaBot && this.codaBot.length) this.botRispondono();
    for(const g of this.gioc){ if(g.cd>0) g.cd-=dt; if(g.cdA>0) g.cdA-=dt; if(g.cdF>0) g.cdF-=dt; }
    if(this.cdBuio>0) this.cdBuio-=dt;
    if(this.buio && this.t>this.buio.fine) this.fineBuio(false);
    if(this.interf && this.t>this.interf.fine){ this.interf=null; this.liberaRip('console'); this.segna(); }
    // (sui telefoni l'acqua finisce GRAZIA s prima: vedi foto)
    if(this.acqua && this.t>this.acqua.fine){ this.vincitore={ chi:'ombre', perche:"Le chiuse sono rimaste aperte: il palazzo è finito sott'acqua." }; this.acqua=null; this.chiudi(); return; }
    // il Burattinaio: il controllo finisce da solo; chi è controllato vede dove lo stanno portando
    for(const p of this.gioc){
      if(!p.controllo) continue;
      const v=this.per(p.controllo.v);
      if(this.t>p.controllo.fine || !v || !v.vivo || !p.vivo){ this.fineControllo(p); continue; }
      if(!v.bot && this.t-v.tTp>0.3){ v.tTp=this.t; this.ev.privato(v.id, { t:'tp', x:Math.round(v.x), y:Math.round(v.y), ep:v.ep }); }
    }
    // il Portiere: chi entra ed esce dalla sua stanza
    for(const p of this.gioc){
      const P=p.portineria; if(!P) continue;
      let cambio=false;
      for(const q of this.gioc){ if(q===p||!q.vivo) continue; const ora=this.stanzaIdx(q), prima=P.prev[q.id];
        if(ora!==prima){ if(ora===P.st){ P.log.push([this.travestito(q)||q.id, 1, this.t]); cambio=true; } else if(prima===P.st){ P.log.push([this.travestito(q)||q.id, 0, this.t]); cambio=true; } P.prev[q.id]=ora; } }
      if(cambio){ if(P.log.length>12) P.log.splice(0, P.log.length-12); this.priv(p); }
    }
    if(this.nebbiaFine && this.t>this.nebbiaFine){ this.nebbiaFine=0; this.segna(); }
    if(this.bengalaFine && this.t>this.bengalaFine){ this.bengalaFine=0; this.segna(); }
    for(const p of this.gioc){
      if(p.aspetto && p.aspettoFine<=this.t){ p.aspetto=null; this.priv(p); }
      if(this.haFrenesia(p)){
        const st=this.M.PAV[tY(this.M,p.y)*this.M.GW+tX(this.M,p.x)];
        if(st!==p.frenStanza){ p.frenStanza=st; p.frenDa=this.t; p.frenAvvisato=false; this.priv(p); }
        else if(!p.frenAvvisato && this.t-p.frenDa>this.imp.frenesia.secondi-10){ p.frenAvvisato=true; this.avviso(p,'Frenesia: cambia stanza, o la tua lanterna si spegne!','ombra'); }
        if(this.t-p.frenDa>this.imp.frenesia.secondi){ this.avviso(p,'Sei rimasto troppo nella stessa stanza: la tua lanterna si è spenta.','morte'); this.spegni(p,p,'frenesia'); if(this.fase!=='gioco') return; }
      }
      if(p.veleno && p.vivo && this.t>=p.veleno.fine){ const k=this.per(p.veleno.da)||p; p.veleno=null; this.spegni(k,p,'veleno'); if(this.fase!=='gioco') return; }
      if(p.rianima && this.t>=p.rianima.fine){ const r=p.rianima; p.rianima=null; this.priv(p); if(r.pulisci) this.pulisci(p, r.corpo); else this.riaccendi(p, r.corpo); if(this.fase!=='gioco') return; }
    }
    for(const p of this.gioc){
      const tr=p.trappola; if(!tr || tr.ids.length>=this.imp.bracconiere.quanti) continue;
      for(const q of this.gioc){ if(q===p||!q.vivo||tr.ids.includes(q.id)) continue; if(Math.hypot(q.x-tr.x,q.y-tr.y)<0.9*T){ tr.ids.push(q.id); this.priv(p); if(tr.ids.length>=this.imp.bracconiere.quanti){ this.avviso(p,'La trappola è piena: alla prossima riunione saprai chi c\'è passato.'); break; } } }
    }
    for(const g of this.gioc){ if(!g.bot||g.uscito) continue; this.bot(g,dt); if(this.fase!=='gioco') return; }
  }
  fineControllo(p){
    const v=this.per(p.controllo.v); p.controllo=null; this.priv(p);
    if(v){ v.controllatoDa=null; v.bloccatoFine=Math.min(v.bloccatoFine,this.t); this.priv(v); if(!v.bot) this.ev.privato(v.id, { t:'tp', x:Math.round(v.x), y:Math.round(v.y), ep:v.ep }); }
  }
  muoviControllato(p, m){
    const c=p.controllo; if(!c||this.fase!=='gioco'||!p.vivo) return;
    const v=this.per(c.v); if(!v||!v.vivo) return;
    const x=+m.x, y=+m.y; if(!isFinite(x)||!isFinite(y)) return;
    const dt=Math.max(0.05, this.t-v.tPos), max=this.VEL*dt*1.6+8;
    if(Math.hypot(x-v.x,y-v.y)>max || !libero(this.M,x,y)) return;
    v.x=x; v.y=y; v.dir=+m.d||0; v.muove=!!m.m; v.tPos=this.t;
  }
  // lo Spazzino finisce di pulire: la lanterna spenta sparisce; pulire costa, anche la ricarica per spegnere riparte da capo
  pulisci(p, corpoId){
    const c=this.corpi.find(k=>k.id===corpoId);
    if(!c || !p.vivo || p.cdA>0 || !this.vicino(p,c.x,c.y,R_ABIL)) return;
    this.togliCorpo(c); p.cdA=this.imp.spazzino.ricarica; p.cd=Math.max(p.cd, this.imp.ricarica); this.priv(p); this.segna(); this.noto(p,'spazzino');
    this.fx('sparisce', c.x, c.y);
  }
  riaccendi(r, corpoId){
    const c=this.corpi.find(k=>k.id===corpoId), v=this.per(corpoId);
    if(!c || !v || v.uscito || !r.vivo || r.usiRian<=0 || !this.vicino(r,c.x,c.y,R_ABIL)) return;
    r.usiRian--; this.priv(r);
    this.togliCorpo(c);
    v.vivo=true; v.fantasma=false; this.priv(v); this.teletrasporta(v, c.x, c.y);
    this.avviso(v, `${r.nome} ti ha riacceso: sei di nuovo in gioco!`); this.avviso(r, `Hai riacceso la lanterna di ${v.nome}.`);
    this.fx('rianima', c.x, c.y); this.segna(); this.noto(r,'rianimatore');
  }

  /* ----- bot ----- */
  vaiA(b, tx, ty, meta){
    const p=percorso(this.M, tX(this.M,b.x), tY(this.M,b.y), tx, ty);
    if(!p){ b.meta=null; b.path=[]; b.attesa=0.5; b.azione=null; return; }
    b.meta=meta; b.path=liscia(this.M,p,b.x,b.y);
  }
  preda(b){
    if(b.insegue && this.t<b.insegueFine){ const g=this.per(b.insegue); if(g && g.vivo && dist(g,b)<26*T) return g; }
    const cand=this.gioc.filter(p=>p.vivo&&p.squadra!=='ombre'&&dist(p,b)<26*T);
    if(!cand.length) return null;
    const solo=p=>this.gioc.filter(q=>q!==p&&q.vivo&&q.squadra!=='ombre'&&dist(p,q)<6*T).length;
    cand.sort((a,c)=>solo(a)-solo(c) || dist(a,b)-dist(c,b));
    return pick(cand.slice(0,2));
  }
  scegliMeta(b){
    if(b.ripara && b.vivo && this.lavoroAttivo(b.ripara)){ const st=STAZ_RIP[b.ripara]; this.vaiA(b, st.tx, st.ty, {tipo:'ripara', cosa:b.ripara}); return; }
    if(b.squadra==='ombre' && b.vivo && b.cd<=0 && (this.t<b.insegueFine || rnd()<.55)){ const p=this.preda(b); if(p){ this.vaiA(b, tX(this.M,p.x), tY(this.M,p.y), {tipo:'caccia', id:p.id}); b.ricalcola=1.2; b.cacciaFine=this.t+12; return; } }
    if(b.dopoSpegni){ b.dopoSpegni=false;
      let bo=null, bd=7*T; for(const e of ESTREMI){ const d=Math.hypot(centro(e.tx)-b.x, centro(e.ty)-b.y); if(d<bd){ bd=d; bo=e; } }
      if(bo && rnd()<.55){ this.vaiA(b, bo.tx, bo.ty, {tipo:'botola', bo}); return; }
    }
    if(b.prossimoGiro){ b.prossimoGiro=false; const q=puntoACaso(this.M); this.vaiA(b,q.tx,q.ty,{tipo:'giro'}); return; }
    // prima i compiti che contano per la barra (la Sentinella lascia per ultimi quelli delle telecamere)
    let da=b.compiti.filter(c=>!c.fatto&&!c.extra);
    if(!da.length) da=b.compiti.filter(c=>!c.fatto);
    if(!da.length && b.squadra!=='ospiti'){ b.compiti.forEach(c=>c.fatto=false); da=b.compiti.slice(); }
    if(da.length){
      const d2=c=>Math.hypot(centro(c.post.tx)-b.x, centro(c.post.ty)-b.y);
      da.sort((a,c)=>d2(a)-d2(c)); const c=pick(da.slice(0,2)); this.vaiA(b, c.post.tx, c.post.ty, {tipo:'compito', c}); return;
    }
    const q=puntoACaso(this.M); this.vaiA(b,q.tx,q.ty,{tipo:'giro'});
  }
  arrivo(b){
    const m=b.meta; if(!m) return;
    if(m.tipo==='compito'){ b.attesa=(6+rnd()*4)*(b.vivo?1:1.6); b.azione=m; }
    else if(m.tipo==='ripara'){ b.attesa=1.8; b.azione=m; }
    else if(m.tipo==='botola' && m.prov){ b.provocaz++; this.vistoInBotola(b); this.fx('botola',b.x,b.y); b.attesa=0.6; b.azione=null; }   // il Giullare non va da nessuna parte: si fa solo vedere
    else if(m.tipo==='botola'){ this.vistoInBotola(b); this.fx('botola',b.x,b.y); b.x=centro(m.bo.va[0]); b.y=centro(m.bo.va[1]); b.attesa=0.3+rnd()*0.6; b.azione=null; }
    else if(m.tipo==='giro'){ b.attesa=1.5+rnd()*3; b.azione=null; }
    else if(m.tipo==='campana'){ b.meta=null; if(b.vivo && b.campane>0 && this.vicino(b,centro(CAMPANA.tx),centro(CAMPANA.ty),R_USA) && this.chiamaRiunione({ tipo:'campana', da:b.id })==='ok') b.campane--; return; }   // (i Bot come le persone: passano dalla FINESTRA)
    else b.azione=null;
    b.meta=null;
  }
  fineAttesa(b){
    const a=b.azione; b.azione=null; if(!a) return;
    if(a.tipo==='compito'){ this.completaCompito(b, a.c); b.prossimoGiro=rnd()<.6; }
    else if(a.tipo==='ripara' && this.lavoroAttivo(a.cosa)) this.ripara(b, a.cosa);
    else if(a.tipo==='rianima') this.riaccendi(b, a.corpo);
    else if(a.tipo==='pulisci') this.pulisci(b, a.corpo);
  }
  segui(b,dt){
    const [wx,wy]=b.path[0], dx=wx-b.x, dy=wy-b.y, d=Math.hypot(dx,dy), passo=this.VEL*dt;
    if(d>0.01) b.dir=Math.atan2(dy,dx);
    if(d<=passo){ b.x=wx; b.y=wy; b.path.shift(); } else { b.x+=dx/d*passo; b.y+=dy/d*passo; }
    b.muove=true;
  }
  bersaglio(g, r, filtro){
    let best=null, bd=r;
    for(const p of this.gioc){ if(p===g||!p.vivo||!filtro(p)) continue; const d=dist(g,p); if(d<bd && vede(this.M,g.x,g.y,p.x,p.y)){ bd=d; best=p; } }
    return best;
  }
  // i poteri dei fantasmi. La foto del Medium: un dettaglio di chi l'ha spento, o un angolo della stanza dov'è successo.
  // Non dice mai chi l'ha scattata: l'id è di chi ha spento (serve a disegnare il suo telo), il punto esatto parte solo fuori dalle stanze. Spento da un Mutaforma col suo stesso aspetto, niente telo: sarebbe il suo
  nuovaFoto(p){
    const M=p.morte||{}, seme=Math.floor(rnd()*1e9);
    if(M.da && M.da!==p.id && rnd()<.6) return { tipo:'chi', id:M.da, seme };
    return M.st>=0 ? { tipo:'dove', st:M.st, seme } : { tipo:'dove', st:M.st, x:M.x, y:M.y, seme };
  }
  poteriFantasma(p, m){
    if(this.fase!=='gioco' || p.vivo || p.uscito || !p.fantasmaRuolo) return;
    if(p.fantasmaRuolo==='medium'){ if(!m.rifai || p.cdF>0) return; p.foto=this.nuovaFoto(p); p.cdF=Math.round(this.imp.fantasmi.ricarica/2); this.priv(p); return; }
    if(p.cdF>0) return;
    const v=this.per(m.id); if(!v || !v.vivo || v.inBotola!=null || v.protettoDa!=null || !this.vicino(p,v.x,v.y,R_ABIL)) return;
    this.gioc.forEach(q=>{ if(q.protettoDa===p.id) q.protettoDa=null; });
    v.protettoDa=p.id; p.cdF=this.imp.fantasmi.ricarica; this.priv(p); this.segna();
    this.avviso(p, `Proteggi ${v.nome}: se ci provano, lo saprai.`); this.fx('scudo', v.x, v.y, { solo:p.id });
  }
  // la chat di prossimità (nell'atrio e nel gioco; in riunione c'è la sua chat): l'host manda il fumetto SOLO a chi lo può sentire,
  // con un messaggio privato a testa. I vivi si sentono da vicino (a vista, o da molto vicino attraverso un muro, più piano);
  // le anime sentono tutti e parlano solo tra loro.
  parla(p, testo){
    if((this.fase!=='gioco' && this.fase!=='atrio') || p.uscito || p.inBotola!=null || this.t-p.tParla<T_PARLA) return;
    testo=pulisciTesto(testo); if(!testo) return;
    p.tParla=this.t;
    this.emetti(p, testo);
    this.rispondonoBot(p, testo);
  }
  // quanto «q» sente ciò che dice «p»: 0 niente · 1 forte · 2 attutito (attraverso un muro, da molto vicino)
  sentePar(p,q){
    if(q===p) return 1;
    if(!p.vivo) return q.vivo ? 0 : 1;
    if(!q.vivo) return 1;
    const d=dist(p,q); if(d>R_PARLA) return 0;
    if(vede(this.M,p.x,p.y,q.x,q.y)) return 1;
    return d<=R_MURO ? 2 : 0;
  }
  // il fumetto di «p» (una persona o un Bot) a chi lo sente: un messaggio privato per ognuno, mai a tutti.
  // «c»: se è travestito, chi sembra; «a»: lo dice un'anima; «w»: lo sente attutito
  emetti(p, testo){
    const base={ t:'bolla', id:p.id, testo, n:this.nParla=(this.nParla||0)+1 }, tr=this.travestito(p);
    if(tr) base.c=tr;
    if(!p.vivo) base.a=1;
    for(const q of this.gioc){
      if(q.bot||q.uscito) continue;
      const k=this.sentePar(p,q); if(!k) continue;
      const m=Object.assign({}, base); if(k===2) m.w=1;
      this.ev.privato(q.id, m);
    }
  }
  // ogni tanto un Bot vicino risponde a una persona che ha scritto: poco, breve, e solo con quello che sa
  rispondonoBot(p, testo){
    if(this.fase!=='gioco' || this.saletta || !p.vivo || p.bot || this.t<(this.botParlaDopo||0)) return;
    const cand=this.gioc.filter(b=>b.bot&&b.vivo&&!b.uscito&&b.inBotola==null&&!b.controllatoDa&&b.bloccatoFine<=this.t&&this.t>=(b.tBotParla||0)&&dist(b,p)<=R_RISPOSTA&&vede(this.M,b.x,b.y,p.x,p.y));
    if(!cand.length) return;
    const b=cand.sort((x,y)=>dist(x,p)-dist(y,p))[0], s=normChat(testo), nominato=s.includes(normChat(b.nome)), chiede=/ (\?|ciao|ehi|salve|hey) /.test(s);
    if(rnd()>=(nominato ? 0.8 : chiede ? 0.45 : 0.1)) return;
    b.tBotParla=this.t+30; this.botParlaDopo=this.t+9;
    (this.codaBot=this.codaBot||[]).push({ t:this.t+1.1+rnd()*1.4, b:b.id, p:p.id, s, nominato });
  }
  // le risposte dei Bot arrivate al momento (ricontrollando che siano ancora vicini e vivi)
  botRispondono(){
    const coda=this.codaBot; if(!coda || !coda.length) return;
    for(let i=coda.length-1;i>=0;i--){
      const e=coda[i]; if(e.t>this.t) continue;
      coda.splice(i,1);
      const b=this.per(e.b), p=this.per(e.p);
      if(!b||!p||!b.vivo||!p.vivo||b.uscito||p.uscito||b.inBotola!=null||b.bloccatoFine>this.t||dist(b,p)>R_PARLA||!vede(this.M,b.x,b.y,p.x,p.y)) continue;
      const frase=this.fraseBot(b,p,e.s,e.nominato); if(frase) this.emetti(b, frase);
    }
  }
  // cosa dice un Bot a chi gli ha scritto: frasi corte, in base a quello che chiede e a quello che il Bot sa davvero
  // (le ombre fingono: non dicono mai la verità sui compagni)
  fraseBot(b, p, s, nominato){
    const ombra=b.squadra==='ombre', ha=re=>re.test(s), stanza=stanzaDi(this.M,b).in;
    if(nominato && ha(/ (sospett|ombra|bugiard|ment|strano|strana|spegn|uccid|botol|colpevol) /)) return ombra ? pick(['Io? Ma se sono qui con i compiti!','Io? Hai preso un granchio.']) : `Io? Ero ${stanza}, non ho fatto niente.`;
    if(ha(/ (dove|dov) /)) return `Io sono ${stanza}.`;
    if(ha(/ (sospett\w*|ombr\w+|vist[oa]|stran[oa]|chi (e|è) stato|chi ha|chi hai) /)){
      const vivi=this.gioc.filter(q=>q.vivo&&!q.uscito&&q!==b&&q!==p);
      if(ombra){ const buoni=vivi.filter(q=>q.squadra!=='ombre'); return rnd()<.5 && buoni.length ? `Io terrei d'occhio ${pick(buoni).nome}.` : 'Non ho visto niente di strano.'; }
      const t=b.mem.testimone, K=t&&this.per(t.killer); if(K && K.vivo && K!==b) return `Ho visto ${K.nome} spegnere una lanterna ${t.stanza}!`;
      const bo=b.mem.botola, B=bo&&this.per(bo.id); if(B && B.vivo && B!==b) return `Ho visto ${B.nome} uscire da una botola ${bo.stanza}.`;
      const forte=vivi.filter(q=>(b.sosp[q.id]||0)>=25).sort((x,y)=>(b.sosp[y.id]||0)-(b.sosp[x.id]||0))[0];
      return forte ? `Io terrei d'occhio ${forte.nome}.` : pick(['Non ho visto niente di strano.','Per ora niente di strano.']);
    }
    if(ha(/ (che fai|cosa fai|tutto ok|tutto bene|come va) /)) return pick(['Faccio i miei compiti.','Tutto bene, giro e faccio i compiti.']);
    if(ha(/ (aiuto|serve|vieni|seguimi|con me) /)) return pick(['Ora ho i miei compiti.','Non posso, ho i miei compiti.']);
    if(ha(/ (ciao|ehi|ehila|salve|hey|buonasera) /)) return pick(['Ciao!','Ehi, ciao.','Ciao, tutto bene?']);
    return nominato ? 'Dimmi.' : pick(['Ok.','Va bene.','Tutto tranquillo qui.','Boh, qui niente.']);
  }
  // le botole: si entra (e si resta nascosti), ci si sposta tra quelle collegate restando dentro, si esce da quella in cui si è.
  // Ombre e Ingegnere viaggiano; il Giullare entra, resta ed esce dalla stessa.
  // Fuori dalla botola, «esci» e «verso» non fanno entrare: arrivati in ritardo (dopo l'uscita) non devono rimandare dentro
  botola(p, m){
    if(this.fase!=='gioco') return this.tardi(); if(!p.vivo) return 'spento';
    const puo = p.squadra==='ombre' || p.ruolo==='ingegnere' || p.ruolo==='giullare'; if(!puo) return 'no';
    if(p.inBotola==null){
      if(m.esci || m.verso!=null) return 'no';
      const i=ESTREMI.findIndex(e=>this.vicino(p,centro(e.tx),centro(e.ty),0.9*T)); if(i<0) return 'lontano';
      this.vistoInBotola(p); this.fx('botola',p.x,p.y);
      p.inBotola=i; p.tBotola=this.t; this.teletrasporta(p, centro(ESTREMI[i].tx), centro(ESTREMI[i].ty)); this.priv(p); return 'ok';
    }
    if(m.esci){ const e=ESTREMI[p.inBotola]; p.inBotola=null; this.teletrasporta(p, centro(e.tx), centro(e.ty)); this.vistoInBotola(p); this.fx('botola',p.x,p.y); this.priv(p); return 'ok'; }
    if(m.verso==null) return 'no';
    const j=+m.verso; if(p.ruolo==='giullare' || !botoleCollegate(p.inBotola).includes(j)) return 'no';
    p.inBotola=j; this.teletrasporta(p, centro(ESTREMI[j].tx), centro(ESTREMI[j].ty)); this.priv(p); return 'ok';
  }
  // chi esce da una botola davanti a un ospite si fa vedere
  vistoInBotola(p){
    const id=this.travestito(p)||p.id;
    if(this.nebbiaAttiva()) return;   // nella nebbia nessuno riconosce chi è
    for(const o of this.gioc){ if(!o.bot||!o.vivo||o===p||o.squadra==='ombre') continue;
      // chi lo vede se lo ricorda e ne parlerà in riunione; correre a suonare la campana lo fa solo 7 volte su 10, dopo un attimo di incredulità
      if(dist(o,p)<=this.vista(o) && vede(this.M,o.x,o.y,p.x,p.y)){ o.sosp[id]=(o.sosp[id]||0)+80; o.mem.botola={ id, stanza:stanzaDi(this.M,p).in, suona:rnd()<.7, quando:this.t+0.8+rnd()*1.7 }; } }
  }
  campioneVivo(b){ const c=b.campione ? this.per(b.campione) : null; return !!(c && c.vivo); }
  // i Bot ricordano chi hanno visto usare un potere che si vede (serve all'Indovino per non tirare a caso)
  noto(p, ruolo){
    for(const o of this.gioc){ if(!o.bot||!o.vivo||o===p||o.ruolo!=='indovino') continue;
      if(dist(o,p)<=this.vista(o) && vede(this.M,o.x,o.y,p.x,p.y)) o.noti[p.id]=ruolo; }
  }
  testimoni(k,v){
    let n=0;
    for(const p of this.gioc){ if(p===k||p===v||!p.vivo||p.squadra==='ombre') continue; if(dist(p,k)<=this.vista(p) && vede(this.M,p.x,p.y,k.x,k.y)) n++; }
    return n;
  }
  pensaBot(b){
    const rv=this.vista(b);
    // cosa vede: l'ultima volta di ognuno, e una storia corta (una voce al secondo a testa, 45 secondi) per ragionare in riunione
    // (nella nebbia tutti sono grigi e senza nome: nessuno si ricorda chi ha visto)
    if(!this.nebbiaAttiva()) for(const p of this.gioc){ if(p===b||!p.vivo) continue; if(dist(b,p)<=rv && vede(this.M,b.x,b.y,p.x,p.y)){ const id=this.travestito(p)||p.id; b.visti[id]={ t:this.t, x:p.x, y:p.y };
      if(p.segnato && b.squadra!=='ombre') b.sosp[p.id]=Math.max(b.sosp[p.id]||0, 100);   // l'alone rosso del Vendicatore: chi lo porta ha spento qualcuno
      if(b.squadra!=='ombre' && this.t-(b.ultimaStoria[id]||-9)>=1){ b.ultimaStoria[id]=this.t; b.storia.push([this.t, id, p.x, p.y]); } } }
    if(b.storia.length>40 && b.storia[0][0]<this.t-45){ let i=0; while(i<b.storia.length && b.storia[i][0]<this.t-45) i++; b.storia.splice(0,i); }
    // l'Avvoltoio sente le lanterne spente (ha la freccia): ci va dritto
    if(b.ruolo==='avvoltoio' && b.vivo && this.corpi.length && b.bloccatoFine<=this.t){
      let c=null, bd=1e9; for(const k of this.corpi){ const d=Math.hypot(k.x-b.x,k.y-b.y); if(d<bd){ bd=d; c=k; } }
      if(this.vicino(b,c.x,c.y,R_ABIL*0.9)) this.abilita(b,c.id);
      else if(!b.meta || b.meta.tipo!=='mangia' || b.meta.id!==c.id) this.vaiA(b,tX(this.M,c.x),tY(this.M,c.y),{tipo:'mangia', id:c.id});
      if(this.fase!=='gioco') return;
    }
    if(!b.vivo && b.ruolo==='spettro' && this.cdBuio<=0 && !this.sabAttivo() && rnd()<.01) this.attivaSab(b, pick(['buio','interferenza','acqua']));
    if(!b.vivo && b.fantasmaRuolo && (b.cdF||0)<=0){
      if(b.fantasmaRuolo==='custode' && rnd()<.3){ const v=this.bersaglio(b,R_ABIL,q=>q.squadra!=='ombre'&&q.protettoDa==null); if(v) this.poteriFantasma(b,{id:v.id}); }
      if(b.fantasmaRuolo==='medium' && rnd()<.05) this.poteriFantasma(b,{rifai:1});
    }
    if(!b.vivo || b.bloccatoFine>this.t) return;
    if(b.segnala==null){
      for(const c of this.corpi){
        if(Math.hypot(c.x-b.x,c.y-b.y)<=rv && vede(this.M,b.x,b.y,c.x,c.y)){
          const vicinoC=this.vicino(b,c.x,c.y,R_ABIL*0.9);
          if(b.ruolo==='avvoltoio') break;
          if(b.ruolo==='spazzino' && b.cdA<=0 && c.da===b.id){ if(vicinoC){ this.abilita(b,c.id); break; } }
          if(b.ruolo==='rianimatore' && b.usiRian>0 && rnd()<.35 && !this.gioc.some(q=>q!==b&&q.vivo&&q.squadra==='ombre'&&dist(q,c)<5*T)){
            if(vicinoC){ this.abilita(b,c.id); break; } this.vaiA(b,tX(this.M,c.x),tY(this.M,c.y),{tipo:'giro'}); break; }
          if(b.squadra==='ombre'){ if(c.da===b.id && b.autoSegnala){ b.autoSegnala=false; b.segnala=0.9+rnd()*1.5; b.corpoVisto=c; } }
          else { b.segnala=0.5+rnd()*0.7; b.corpoVisto=c; }
          break;
        }
      }
    }
    // ha visto spegnere qualcuno o uscire da una botola, ma la lanterna spenta non c'è più da segnalare: va a suonare la campana
    if(b.squadra!=='ombre' && b.campane>0 && (b.mem.testimone || (b.mem.botola && b.mem.botola.suona && this.t>=b.mem.botola.quando)) && b.segnala==null && !b.ripara && !(b.meta&&b.meta.tipo==='campana'))
      this.vaiA(b, CAMPANA.tx, CAMPANA.ty, {tipo:'campana'});
    if(this.sabAttivo() && b.squadra!=='ombre') this.assegnaRiparatori();
    if(b.ruolo==='portiere' && !b.portineria && b.cdA<=0 && rnd()<.05) this.abilita(b, Math.floor(rnd()*PALAZZO.stanze.length));
    const chiunque=()=>true;
    if(b.ruolo==='veggente' && b.usi>0 && b.cdA<=0 && rnd()<.25){ const p=this.bersaglio(b,R_ABIL,chiunque); if(p) this.abilita(b,p.id); }
    if(b.ruolo==='medico' && b.cdA<=0 && rnd()<.2){ const p=this.bersaglio(b,R_ABIL,chiunque); if(p) this.abilita(b,p.id); }
    if(b.ruolo==='sentinella' && this.camDisp(b)>0 && rnd()<.04) this.abilita(b,null);
    if(b.ruolo==='ingegnere' && this.buio && b.cdA<=0 && rnd()<.3) this.abilita(b,null);
    if(b.ruolo==='veterano' && b.usiVet>0 && b.cdA<=0 && rnd()<.05 && this.bersaglio(b,3*T,q=>(b.sosp[q.id]||0)>=20)) this.abilita(b,null);
    if(b.ruolo==='bracconiere' && b.cdA<=0 && !b.trappola && rnd()<.05) this.abilita(b,null);
    if(b.ruolo==='trasportatore' && b.usiTra>0 && b.cdA<=0 && rnd()<.02){ const v=this.gioc.filter(q=>q.vivo); if(v.length>2){ mescola(v); this.abilita(b, v[0].id, v[1].id); } }
    if(b.ruolo==='segugio' && b.cdA<=0 && rnd()<.15){ const p=this.bersaglio(b,R_ABIL,chiunque); if(p) this.abilita(b,p.id); }

    if(b.ruolo==='bengala' && b.usiBeng>0 && this.buio && rnd()<.3) this.abilita(b,null);
    if(b.ruolo==='campanaro' && b.campVolte>0 && b.mem.testimone && rnd()<.5){ this.abilita(b,null); return; }
    if(b.ruolo==='sceriffo' && b.cdA<=0){
      const p=this.bersaglio(b,R_ABIL,q=>(b.sosp[q.id]||0)>=80);
      if(p && rnd()<.5){ this.abilita(b,p.id); if(this.fase!=='gioco') return; }
    }
    // il Mutaforma campiona chiunque gli passi vicino e si tiene il campione fino a che è vivo: poi, con qualcuno intorno, si trasforma e la colpa va a quello
    if(b.ruolo==='trasformista' && !this.campioneVivo(b)){ const q=this.bersaglio(b,R_ABIL,x=>x.squadra!=='ombre'); if(q) this.abilita(b,q.id); }
    // il Giullare Bot vuole farsi cacciare, ma con misura: ogni tanto esce da una botola sotto gli occhi di qualcuno (poche volte a partita)
    if(b.ruolo==='giullare' && b.provocaz<PROV_GIULLARE && this.t>40 && !(b.meta&&b.meta.tipo==='botola') && rnd()<.03){
      const e=ESTREMI.find(x=>Math.hypot(centro(x.tx)-b.x, centro(x.ty)-b.y)<6*T);
      if(e && this.gioc.some(o=>o!==b&&o.vivo&&o.squadra!=='ombre'&&dist(o,b)<=this.vista(o)&&vede(this.M,o.x,o.y,b.x,b.y))) this.vaiA(b, e.tx, e.ty, {tipo:'botola', bo:e, prov:true});
    }
    if(b.squadra==='ombre'){
      if(b.ruolo==='silenziatore' && b.cdA<=0 && rnd()<.15){ const p=this.bersaglio(b,R_ABIL,q=>q.squadra!=='ombre'&&!q.zittito); if(p) this.abilita(b,p.id); }
      if(b.ruolo==='ipnotista' && b.cdA<=0 && rnd()<.1){ const p=this.bersaglio(b,R_ABIL,q=>q.squadra!=='ombre'); if(p) this.abilita(b,p.id); }
      if(b.cd<=0){
        const v=this.bersaglio(b,R_SPEGNI,p=>p.squadra!=='ombre');
        if(v){
          const t=this.testimoni(b,v);
          if(b.ruolo==='trasformista' && this.campioneVivo(b) && b.cdA<=0 && t<=1) this.abilita(b,null);
          // il veleno non si vede: l'Avvelenatore lo dà anche con una o due persone intorno, che non sapranno mai cos'è successo
          if(b.ruolo==='avvelenatore' && t<=2 && !v.veleno && rnd()<.65){ this.provaSpegni(b,v); return; }
          if(t===0 && rnd()<.65){ this.provaSpegni(b,v); return; }
          if(t<=1 && (this.nebbiaAttiva()||this.travestito(b)) && rnd()<.7){ this.provaSpegni(b,v); return; }
          if(t<=1 && b.ruolo==='nebbia' && b.cdA<=0 && !this.nebbiaAttiva()) this.abilita(b,null);
        }
      }
      if(!this.sabAttivo() && this.cdBuio<=0 && rnd()<.012) this.attivaSab(b, rnd()<.5 ? 'buio' : rnd()<.6 ? 'interferenza' : 'acqua');
    }
  }
  bot(b,dt){
    b.muove=false;
    b.pensa-=dt;
    if(b.pensa<=0){ b.pensa=0.35+rnd()*0.15; this.pensaBot(b); if(this.fase!=='gioco') return; }
    if(b.bloccatoFine>this.t) return;
    if(b.segnala!=null){
      b.segnala-=dt;
      if(b.segnala<=0){ const c=b.corpoVisto; b.segnala=null; if(b.vivo && this.corpi.includes(c)){ this.chiamaRiunione({ tipo:'corpo', da:b.id, corpo:c.id, stanza:c.stanza }); return; } }
    }
    if(b.attesa>0){ b.attesa-=dt; if(b.attesa<=0) this.fineAttesa(b); return; }
    if(b.meta && b.meta.tipo==='caccia'){
      const p=this.per(b.meta.id);
      if(!p||!p.vivo||b.cd>0||this.t>b.cacciaFine){ b.path=[]; b.meta=null; }
      else if(dist(b,p)<5*T && vede(this.M,b.x,b.y,p.x,p.y) && segmentoLibero(this.M,b.x,b.y,p.x,p.y)) b.path=[[p.x,p.y]];
      else { b.ricalcola-=dt; if(b.ricalcola<=0){ b.ricalcola=1.2; this.vaiA(b, tX(this.M,p.x), tY(this.M,p.y), b.meta); } }
    }
    if(!b.path.length){ if(b.meta) this.arrivo(b); else this.scegliMeta(b); return; }
    this.segui(b,dt);
  }

  /* ----- riunione ----- */
  iniziaRiunione(m){
    // il veleno non aspetta la riunione: chi era avvelenato cade adesso
    const avvelenati=[];
    for(const p of this.gioc){ if(p.veleno && p.vivo){ const k=this.per(p.veleno.da)||p; p.veleno=null; this.spegni(k,p,'veleno'); if(!p.vivo) avvelenati.push(p); } }
    this.esche=[]; this.riuInArrivo=null;   // (anche un'Esca caduta col veleno qui sopra: la riunione è già questa)
    if(this.vincitore) return;
    // chi stava riaccendendo o pulendo una lanterna: la riunione lo interrompe, e glielo si dice (prima era in silenzio)
    for(const p of this.gioc){ if(p.rianima && !p.bot) this.avviso(p, p.rianima.pulisci ? 'È cominciata la riunione: la lanterna spenta è rimasta lì.' : 'È cominciata la riunione: la lanterna non si è riaccesa.'); }
    this.fase='riunione'; this.codaBot=[];   // (in riunione la chat di prossimità è spenta: le risposte dei Bot in attesa cadono)
    const R={ motivo:m.tipo, da:m.da, corpo:m.corpo!=null?m.corpo:null, stanza:m.stanza||null, t:0, t0:this.t, disc:this.imp.discussione, voto:this.imp.voto, voti:new Map(), coda:[], chiusa:false,
      zittiti:this.gioc.filter(p=>p.vivo&&p.zittito).map(p=>p.id) };
    this.riu=R; this.chat=[]; this.esito=null;
    const da=this.per(m.da), corpo=m.tipo==='corpo';
    // solo chi ha chiamato: niente dove, niente di chi. Sul suo telefono «Hai…» (tuo, da); i telefoni con la versione vecchia non lo guardano e leggono la terza persona
    this.scrivi(null, corpo ? `${da.nome} ha segnalato una lanterna spenta.` : `${da.nome} ha suonato la campana.`, { da:da.id, tuo: corpo ? 'Hai segnalato una lanterna spenta.' : 'Hai suonato la campana.' });
    for(const p of this.gioc){ if(p.fantasmaRuolo==='medium' && p.foto && p.fotoMostrata!==p.foto.seme){ p.fotoMostrata=p.foto.seme; this.scrivi(null, "Una foto dall'aldilà:", { foto:p.foto }); } }   // (senza nome: chi l'ha mandata lo sa già)
    for(const v of avvelenati) this.scrivi(null, 'Proprio adesso si è spenta un\'altra lanterna.');
    // le lanterne spente mentre la riunione stava partendo (la FINESTRA dopo la chiamata): si dice che sono appena successe, come col veleno
    if(m.t0!=null) for(const c of this.corpi) if(c.t>=m.t0-FINESTRA && c.id!==m.corpo) this.scrivi(null, 'Proprio adesso si è spenta un\'altra lanterna.');
    for(const c of this.celebri) this.scrivi(null, `${this.nomeDi(c.id)} era una Celebrità: la sua lanterna si è spenta ${c.stanza} circa ${Math.max(1,Math.round(this.t-c.t))} secondi fa.`);
    this.celebri=[];
    // il Bracconiere scopre chi è passato nella trappola piena (solo i ruoli, in ordine sparso)
    for(const p of this.gioc){ const tr=p.trappola; if(!tr || tr.ids.length<this.imp.bracconiere.quanti) continue;
      p.trapRuoli=mescola(tr.ids.map(id=>RUOLI[this.per(id).ruolo].nome)); p.trappola=null; this.priv(p);
      this.avviso(p, `Nella trappola sono passati: ${p.trapRuoli.join(', ')}.`); }
    for(const b of this.gioc.filter(q=>q.bot&&q.vivo&&q.ruolo==='imitatore'&&!q.imitato)){ const morti=this.gioc.filter(q=>!q.vivo&&!q.uscito&&q.squadra==='ospiti'&&q.ruolo!=='ospite'&&q.ruolo!=='imitatore'); if(morti.length && rnd()<.6) this.imita(b, pick(morti).id); }
    // ogni Bot ospite ripensa a cosa ha visto prima di parlare
    if(m.tipo==='corpo'){ const k=this.corpi.find(k=>k.id===m.corpo); if(k) for(const b of this.gioc) if(b.bot&&b.vivo&&b.squadra!=='ombre') this.ragiona(b, m.corpo, k); }
    const parlano=mescola(this.gioc.filter(p=>p.vivo&&p.bot&&!R.zittiti.includes(p.id)));
    if(da.bot && parlano.includes(da)){ parlano.splice(parlano.indexOf(da),1); parlano.unshift(da); }
    const finePar=Math.max(8, R.disc + R.voto*0.5); let tt=1.5;
    for(const b of parlano){ for(const l of this.frasiBot(b,m)){ R.coda.push({ t:Math.min(tt,finePar), chi:b, testo:l.testo, eff:l.eff, az:l.az }); tt+=1.2+rnd()*1.3; } }
    for(const b of this.gioc.filter(p=>p.vivo&&p.bot)) R.coda.push({ t:R.disc+1.5+rnd()*R.voto*0.6, chi:b, voto:true });
    R.coda.sort((a,b)=>a.t-b.t);
    this.corpi=[]; this.spariti=[]; this.buio=null; this.interf=null; this.acqua=null; this.nebbiaFine=0; this.bengalaFine=0; this.nImp++;
    this.gioc.forEach(p=>{ if(p.controllo) this.fineControllo(p); p.ripara=null; });
    this.gioc.forEach(p=>{ p.path=[]; p.meta=null; p.attesa=0; p.azione=null; p.muove=false; p.veleno=null; p.rianima=null; p.aspetto=null; p.bloccatoFine=0; p.inBotola=null;
      p.tentativi = p.ruolo==='indovino' ? this.imp.indovino.perRiunione : 0; p.osserva=false; this.priv(p); });
    for(const b of this.gioc.filter(q=>q.bot&&q.vivo&&q.ruolo==='indovino')) if(rnd()<.9) R.coda.push({ t:3+rnd()*Math.max(4,R.disc), chi:b, az:()=>this.indovinaBot(b) });
    R.coda.sort((a,b)=>a.t-b.t);
    this.segna();
  }
  scrivi(p, testo, extra){ this.chat.push(extra ? [p?p.id:null, testo, extra] : [p?p.id:null, testo]); if(this.chat.length>MAX_CHAT) this.chat.shift(); this.segna(); }
  // un'accusa (q>0) o una difesa (q<0) detta da «chi»: ogni Bot ospite la pesa in base a quanto si fida di chi parla
  sospetta(p, q, chi){
    if(!p) return;
    this.pub[p.id]=(this.pub[p.id]||0)+q;
    for(const o of this.gioc){
      if(!o.bot||!o.vivo||o===chi||o.squadra==='ombre') continue;
      if(o===p){ if(chi && q>0) o.sosp[chi.id]=(o.sosp[chi.id]||0)+q*0.5; continue; }   // chi è accusato sa di essere innocente: diffida di chi lo accusa
      let w=1; if(chi){ const s=o.sosp[chi.id]||0; w = s>=50 ? 0.25 : s>=25 ? 0.6 : s<=-20 ? 1.3 : 1; }
      o.sosp[p.id]=(o.sosp[p.id]||0)+q*w;
    }
  }
  // chi girava vicino alla lanterna spenta dopo l'ultima volta che il Bot ha visto viva la vittima, e chi era lontano sotto i suoi occhi
  ragiona(b, vId, c){
    const S=b.storia; let tV=this.t-40;
    for(let i=S.length-1;i>=0;i--) if(S[i][1]===vId){ tV=S[i][0]; break; }
    const vicini=new Set(), lontano={};
    for(const [t,id,x,y] of S){ if(t<tV-2||id===vId) continue; if(Math.hypot(x-c.x,y-c.y)<5*T) vicini.add(id); else lontano[id]=(lontano[id]||0)+1; }
    const vivo=id=>{ const q=this.per(id); return !!(q && q.vivo && q!==b); };
    const serve=Math.max(3, Math.min(8, (this.t-tV)*0.6));
    b.mem.vicini=[...vicini].filter(vivo);
    b.mem.alibi=Object.keys(lontano).filter(id=>!vicini.has(id) && lontano[id]>=serve && vivo(id));
    for(const id of b.mem.vicini) b.sosp[id]=(b.sosp[id]||0)+14;
    for(const id of b.mem.alibi) b.sosp[id]=(b.sosp[id]||0)-14;
  }
  frasiBot(b,m){
    const out=[], crewVivi=()=>this.gioc.filter(p=>p.vivo&&p!==b&&p.squadra!=='ombre');
    if(b.ruolo==='sindaco' && !b.rivelato && rnd()<.5) out.push({ testo:'Mi rivelo: sono il Sindaco.', az:()=>this.rivela(b) });
    // quando la partita è sul filo (un'ombra in più e vincono loro) gli ospiti con un ruolo si dichiarano per aiutare a votare giusto
    // (negli altri momenti qualcuno lo fa lo stesso, ogni tanto: 1 volta su 10)
    if(b.squadra==='ospiti' && b.ruolo!=='ospite' && b.ruolo!=='sindaco' && !this.dichiarati[b.id]){
      const om=this.ombreNote(), altri=this.gioc.filter(p=>p.vivo).length-om;
      if(altri<=om+1 ? rnd()<.8 : rnd()<.1){ const nome=RUOLI[b.ruolo].nome, art = ['spia','sentinella','vedetta'].includes(b.ruolo) ? 'la' : /^[aeiou]/i.test(nome) ? "l'" : 'il ';
        out.push({ testo:`Sono ${art}${art==='la'?' ':''}${nome}.`, eff:()=>{ this.dichiarati[b.id]=b.ruolo; } }); }
    }
    if(b.squadra==='ombre'){
      const cv=crewVivi(), soci=this.gioc.filter(p=>p.vivo&&p!==b&&p.squadra==='ombre');
      // un socio nei guai: a volte lo copre
      const socio=soci.find(p=>(this.pub[p.id]||0)>=30);
      if(socio && rnd()<.45){ out.push({ testo:`${socio.nome} era con me ${pick(this.M.stanze).in}, non c'entra.`, eff:()=>this.sospetta(socio,-14,b) }); return out; }
      if(m.tipo==='corpo' && m.da===b.id && cv.length && rnd()<.6){ const p=pick(cv); out.push({ testo:`Poco prima lì vicino c'era ${p.nome}.`, eff:()=>{ this.sospetta(p,18,b); this.rispostaBot(p,false); } }); return out; }
      if(cv.length && rnd()<.3){ const p=pick(cv); out.push({ testo:`Ho visto ${p.nome} uscire di corsa ${pick(this.M.stanze).in}.`, eff:()=>{ this.sospetta(p,16,b); this.rispostaBot(p,false); } }); }
      else out.push({ testo:`Io ero ${pick(this.M.stanze).in}. Niente di strano.` });
      return out;
    }
    if(b.mem.testimone){ const t=b.mem.testimone, K=this.per(t.killer); if(K && K.vivo) out.push({ testo:`Ho visto ${K.nome} spegnere la lanterna di ${this.nomeDi(t.vittima)} ${t.stanza}!`, eff:()=>this.sospetta(K,55,b) }); }
    else if(b.mem.nebbia) out.push({ testo:`C'era qualcuno vicino a ${this.nomeDi(b.mem.nebbia.vittima)}, ma con la nebbia erano tutti grigi.` });
    else if(b.mem.copia) out.push({ testo:`Ho visto uno identico a me spegnere la lanterna di ${this.nomeDi(b.mem.copia.vittima)}: qui c'è un Mutaforma!` });
    if(b.mem.botola){ const K=this.per(b.mem.botola.id); if(K && K.vivo) out.push({ testo:`Ho visto ${K.nome} uscire da una botola ${b.mem.botola.stanza}!`, eff:()=>this.sospetta(K,45,b) }); }
    const vic=(b.mem.vicini||[]).map(id=>this.per(id)).filter(Boolean).slice(0,2);
    if(vic.length && (m.da===b.id || rnd()<.6)){
      const nomi=elenco(vic.map(p=>p.nome)), ruoloDetto = b.ruolo==='investigatore' && rnd()<.5 ? 'investigatore' : b.ruolo==='vedetta' && rnd()<.5 ? 'vedetta' : null;
      const testo = ruoloDetto==='investigatore' ? `Sono l'Investigatore: le orme di ${nomi} stavano lì vicino.` : ruoloDetto==='vedetta' ? `Sono la Vedetta: da lontano ho visto ${nomi} da quelle parti.`
        : m.da===b.id ? `Poco prima lì vicino c'era ${nomi}.` : `Ho visto ${nomi} da quelle parti poco prima.`;
      out.push({ testo, eff:()=>{ if(ruoloDetto) this.dichiarati[b.id]=ruoloDetto; vic.forEach(p=>{ this.sospetta(p, m.da===b.id?18:14, b); if(vic.length===1) this.rispostaBot(p,false); }); } });
    }
    const ali=(b.mem.alibi||[]).map(id=>this.per(id)).filter(p=>p && (b.sosp[p.id]||0)<20);
    if(ali.length && rnd()<.5){ const p=pick(ali); out.push({ testo:`${p.nome} era sotto i miei occhi, lontano da lì: non c'entra.`, eff:()=>this.sospetta(p,-14,b) }); }
    for(const x of b.mem.puliti.slice(0,1)){ const p=this.per(x.id); if(p && p.vivo) out.push({ testo:`Ho visto ${p.nome} ${FRASI_COMPITO[x.v]}: per me è pulito.`, eff:()=>this.sospetta(p,-25,b) }); }
    if(b.ruolo==='veggente') for(const r of b.mem.controlli){ const p=this.per(r.id); if(p) out.push({ testo: r.ok ? `Ho letto ${p.nome}: è dei buoni.` : `Ho letto ${p.nome}: è dei cattivi!`, eff:()=>{ this.dichiarati[b.id]='veggente'; this.sospetta(p, r.ok?-25:45, b); } }); }
    if(b.ruolo==='sceriffo' && b.mem.sparato && rnd()<.8){ const x=this.per(b.mem.sparato.id); if(x) out.push({ testo:`Sono lo Sceriffo: ho spento ${x.nome}, ${b.mem.sparato.ombra?"era un'ombra":'non era dei buoni'}.`, eff:()=>{ this.dichiarati[b.id]='sceriffo'; } }); }
    if(b.ruolo==='medico' && b.mem.scudoRotto && rnd()<.7){ const x=this.per(b.mem.scudoRotto); if(x) out.push({ testo:`Sono il Medico: proteggevo ${x.nome} e qualcuno ha provato a spegnerlo.`, eff:()=>{ this.dichiarati[b.id]='medico'; } }); }
    if(b.ruolo==='bracconiere' && b.trapRuoli && rnd()<.7){ const r=b.trapRuoli; b.trapRuoli=null; out.push({ testo:`Sono il Bracconiere: nella mia trappola sono passati ${elenco(r)}.`, eff:()=>{ this.dichiarati[b.id]='bracconiere'; } }); }
    if(b.ruolo==='accusatore' && b.bersaglio){ const p=this.per(b.bersaglio); if(p && p.vivo) out.push({ testo:pick([`Io di ${p.nome} non mi fido per niente.`,`${p.nome} si muove in modo strano.`,`Secondo me è ${p.nome}.`]), eff:()=>this.sospetta(p,15,b) }); }
    if(b.ruolo==='giullare' && rnd()<.4) out.push({ testo:pick(['Io? Ero a farmi gli affari miei.','Guardate pure me, non ho niente da nascondere. Forse.','Che sguardi. Sembra che abbiate già deciso.']), eff:()=>this.sospetta(b,6,b) });
    if(!out.length) out.push({ testo: rnd()<.55 ? `Io ero ${stanzaDi(this.M,b).in}.` : pick(['Io non ho visto niente.','Ho fatto i miei compiti, tutto tranquillo.','Non ho prove, per ora salto.']) });
    return out.slice(0,3);
  }
  chatUmana(p, testo){
    const R=this.riu; if(this.fase!=='riunione'||!R||R.chiusa||!p.vivo) return;
    if(R.zittiti.includes(p.id)){ this.avviso(p,'Ti hanno zittito: in questa riunione non puoi scrivere.','ombra'); return; }
    if(this.t-p.tChat<1.2) return;
    testo=testo.replace(/\s+/g,' ').trim().slice(0,90); if(!testo) return;
    p.tChat=this.t; this.scrivi(p, testo);
    this.capisci(p, testo);
  }
  // i Bot leggono la chat delle persone: nomi con accuse o difese, e chi dice il proprio ruolo
  capisci(p, testo){
    const norm=x=>' '+x.toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9àèéìòóù ]+/g,' ').replace(/\s+/g,' ').trim()+' ';
    const io=norm(testo).match(/ sono (?:il |la |lo |l |un |una )?([a-zàèéìòù]+) /);
    if(io){ const r=Object.keys(RUOLI).find(k=>RUOLI[k].nome.toLowerCase()===io[1]); if(r) this.dichiarati[p.id]=r; }
    const fatti=new Set();
    for(const pezzo of testo.split(/[.,;:!?]| ma | però | invece /i)){   // ogni pezzo di frase a sé: «Bianca è pulita, Ettore no»
      const s=norm(pezzo);
      for(const q of this.gioc){
        if(q===p||!q.vivo||fatti.has(q.id)) continue;
        const nome=norm(q.nome); if(nome.trim().length<2 || !s.includes(nome)) continue;
        if(/ (pulit|innocent|con me|fidat|buon|non e lui|non è lui|non e lei|non è lei)/.test(s)){ fatti.add(q.id); this.sospetta(q,-12,p); this.rispostaBot(q,true); }
        else if(/ (spegn|uccid|ammazz|botol)/.test(s) && / (vist|visto|vista|beccat)/.test(s)){ fatti.add(q.id); this.sospetta(q,40,p); this.rispostaBot(q,false); }
        else if(/ (sospett|ombra|e lui|è lui|e lei|è lei|vot|caccia|fuori|bugiard|strano|strana|ment)/.test(s)){ fatti.add(q.id); this.sospetta(q,18,p); this.rispostaBot(q,false); }
      }
    }
  }
  rapida(p, tipo, id){
    const R=this.riu; if(this.fase!=='riunione'||!R||R.chiusa||!p.vivo) return;
    if(R.zittiti.includes(p.id)){ this.avviso(p,'Ti hanno zittito: in questa riunione non puoi scrivere.','ombra'); return; }
    if(this.t-p.tChat<1.2) return; p.tChat=this.t;
    const x=this.per(id);
    if(tipo==='sospetto' && x && x!==p){ this.scrivi(p, `Sospetto di ${x.nome}.`); this.sospetta(x,20,p); this.rispostaBot(x,false); }
    else if(tipo==='pulito' && x && x!==p){ this.scrivi(p, `Per me ${x.nome} è pulito.`); this.sospetta(x,-15,p); this.rispostaBot(x,true); }
    else if(tipo==='ero') this.scrivi(p, `Io ero ${stanzaDi(this.M,p).in}.`);
    else if(tipo==='salto') this.scrivi(p, 'Non ho prove, salto.');
  }
  rispostaBot(x, pulito){
    const R=this.riu;
    const cand=this.gioc.filter(p=>p.vivo&&p.bot&&p!==x&&!R.zittiti.includes(p.id)); if(!cand.length) return;
    const r=pick(cand); let testo=null, eff=null;
    if(x.bot && x.vivo && !pulito && !R.zittiti.includes(x.id) && rnd()<.45){ R.coda.push({ t:R.t+1.4, chi:x, testo: x.squadra==='ombre' ? `Io? Ma se ero ${pick(this.M.stanze).in}!` : `Io? Ero ${stanzaDi(this.M,x).in}, chiedete in giro.` }); }
    else if(r.squadra!=='ombre' && r.visti[x.id] && this.t-r.visti[x.id].t<20 && (r.sosp[x.id]||0)<20){ testo=`${x.nome} era con me poco fa, secondo me no.`; eff=()=>this.sospetta(x,-10,r); }
    else if((r.sosp[x.id]||0)>=20 || (r.squadra==='ombre' && x.squadra!=='ombre')){ testo = pulito ? `Io su ${x.nome} non ci metterei la mano sul fuoco.` : `Anch'io non mi fido di ${x.nome}.`; eff=()=>this.sospetta(x,10,r); }
    if(testo) R.coda.push({ t:R.t+1.6+rnd(), chi:r, testo, eff });
    R.coda.sort((a,b)=>a.t-b.t);
  }
  // l'Indovino in riunione: se indovina il ruolo, quella persona cade (e nessuno sa chi è stato)
  cadeInRiunione(v, testoVittima, indovino){
    const R=this.riu; v.vivo=false; v.fantasma=true;
    if(R){ R.voti.delete(v.id);
      // chi aveva votato per lui rivota: il sigillo gli torna in mano, il Bot ci ripensa
      for(const [chi,su] of [...R.voti]) if(su===v.id){ R.voti.delete(chi); const q=this.per(chi); this.priv(q); if(q.bot) R.coda.push({ t:R.t+1+rnd()*3, chi:q, voto:true }); else if(q!==indovino) this.avviso(q, `La lanterna di ${v.nome} si è spenta: vota di nuovo.`); }
      R.coda.sort((a,b)=>a.t-b.t); }
    this.gioc.filter(a=>a.ruolo==='accusatore'&&a.vivo&&a.bersaglio===v.id).forEach(a=>{ a.ruolo='giullare'; this.priv(a); this.avviso(a,'Il tuo bersaglio è uscito: ora sei il Giullare. Fatti cacciare col voto!'); });
    this.scrivi(null, `La lanterna di ${v.nome} si è spenta.`); this.priv(v); this.segna();
    this.ev.tutti({ t:'fx', k:'cade', x:0, y:0, id:v.id });
    this.avviso(v, testoVittima || "Un indovino ha letto il tuo ruolo: la tua lanterna si è spenta.", 'morte');
  }
  indovina(p, id, ruolo){
    const R=this.riu, v=this.per(id); if(!p.vivo||p.ruolo!=='indovino'||p.tentativi<=0||!RUOLI[ruolo]||!v||v===p) return;
    // il foglietto era aperto ma è tardi: il tentativo non si perde, e sul suo telefono si capisce perché
    if(this.fase!=='riunione'||!R||R.chiusa||!v.vivo){ this.priv(p); this.avviso(p, v.vivo ? 'Troppo tardi: il voto è chiuso.' : `La lanterna di ${v.nome} è già spenta.`); return; }
    p.tentativi--; this.priv(p);
    if(v.ruolo===ruolo){
      const rivota=R.voti.get(p.id)===id;   // aveva votato proprio chi cade: un avviso copre quello di prima, quindi il sigillo che torna lo dice la stessa riga
      p.indovinati++; this.cadeInRiunione(v, null, p);
      if(p.indovinati>=this.imp.indovino.quanti){ this.vincitore={ chi:'indovino', id:p.id, perche:`L'Indovino (${p.nome}) ha indovinato ${p.indovinati} ruoli.` }; this.chiudi(); return; }
      this.avviso(p, `Giusto: ${v.nome} era ${RUOLI[ruolo].nome}. Indovinati ${p.indovinati} su ${this.imp.indovino.quanti}.${rivota?' Vota di nuovo.':''}`);
    } else {
      const no=`Sbagliato: ${v.nome} non è ${RUOLI[ruolo].nome}.`;
      if(this.imp.indovino.sbaglia==='muore') this.cadeInRiunione(p, no+' Cadi tu.');   // (una riga sola: due di fila, la prima non si leggerebbe)
      else this.avviso(p, no, 'ombra');
    }
    if(this.controllaVittoria()) this.chiudi();
  }
  indovinaBot(b){
    const cand=this.gioc.filter(q=>q.vivo&&q!==b); if(!cand.length) return;
    // prova solo con un buon motivo: un ruolo detto in pubblico (il Sindaco che si rivela, chi racconta cosa ha fatto)
    // o un potere che ha visto usare con i suoi occhi (Sceriffo che spara, Bengala acceso)
    const sa=q=>this.dichiarati[q.id]||b.noti[q.id];
    const buoni=cand.filter(q=>sa(q) && !(b.provati||[]).includes(q.id));
    if(buoni.length){ const q=pick(buoni); (b.provati=b.provati||[]).push(q.id); this.indovina(b, q.id, sa(q)); return; }
    // senza un buon motivo, se sbagliare costa la lanterna sta zitto: tra una trentina di ruoli tirare a caso è una condanna
    if(this.imp.indovino.sbaglia==='muore') return;
    cand.sort((x,y)=>(b.sosp[y.id]||0)-(b.sosp[x.id]||0));
    const forte=cand[0];
    if((b.sosp[forte.id]||0)>=60) this.indovina(b, forte.id, 'ombra');
    else if(rnd()<.6) this.indovina(b, pick(cand).id, 'ospite');
  }
  peso(id){ const p=this.per(id); if(!p) return 1; return (p.ruolo==='sindaco' && p.rivelato ? 2 : 1) + (p.mod==='ago' ? 0.01 : 0); }
  imita(p, id){
    if(this.fase!=='riunione'||!p.vivo||p.ruolo!=='imitatore'||p.imitato) return;
    const v=this.per(id); if(!v||v.vivo||v.uscito) return;
    if(v.squadra!=='ospiti'||v.ruolo==='imitatore'){ this.avviso(p, 'Puoi imitare solo il ruolo di un ospite.'); return; }
    p.imitato=true; p.imita=v.id; this.priv(p);
    this.avviso(p, `Dal prossimo round sarai ${RUOLI[v.ruolo].nome}.`);
  }
  votiPer(id){ let n=0; for(const [chi,v] of this.riu.voti) if(v===id) n+=this.peso(chi); return n; }
  // la fine del voto come la vede il telefono: GRAZIA s prima della chiusura vera (il sigillo messo all'ultimo secondo visto arriva in tempo).
  // Con tutti i sigilli messi vale l'attesa di DUR_SIGILLI, senza margine: nessun voto è più in viaggio
  fineVotoVisto(R){ return Math.min(R.disc+R.voto-GRAZIA, R.conta!=null?R.conta:Infinity); }
  // VOTO ALL'ULTIMO: vale se arriva prima della chiusura vera (GRAZIA dopo la fine vista). VOTO CAMBIATO: il primo sigillo resta, il secondo risponde 'votato'.
  // ZITTITO: vota come gli altri (zittito vuol dire che non parla). Chi cade in riunione non vota più
  vota(p, su){
    const R=this.riu;
    if(this.fase==='fine') return 'fine';
    if(this.fase!=='riunione'||!R||R.chiusa) return 'chiuso';
    if(!p.vivo) return 'spento';
    if(R.t<R.disc) return 'presto';
    if(R.voti.has(p.id)) return R.voti.get(p.id)===su ? 'ok' : 'votato';
    if(su!=='salta'){ const x=this.per(su); if(!x) return 'no'; if(!x.vivo) return 'giaSpenta'; }   // (anche se stessi: si può sempre)
    R.voti.set(p.id, su); this.segna(); return 'ok';
  }
  // quante ombre restano secondo chi gioca: se i ruoli si vedono quando uno esce lo sanno tutti, se no si parte dal numero iniziale
  ombreNote(){
    if(!this.imp.mostraRuolo) return this.ombreIniziali||1;
    return this.gioc.filter(p=>p.vivo&&p.squadra==='ombre').length;
  }
  votoBot(b){
    const cand=this.gioc.filter(p=>p.vivo&&p!==b); let scelta=null;
    // quando saltare vuol dire perdere (al prossimo spegnimento le ombre pareggerebbero), un Bot ospite vota comunque il più sospetto
    const om=this.ombreNote(), altri=this.gioc.filter(p=>p.vivo).length-om, critico = altri<=om+1;
    if(b.squadra==='ombre'){ let bv=28; for(const p of cand){ if(p.squadra==='ombre') continue; const v=(this.pub[p.id]||0)+this.votiPer(p.id)*12; if(v>bv){ bv=v; scelta=p; } } }
    else if(b.ruolo==='giullare') scelta = rnd()<.35 ? pick(cand) : null;
    else if(b.ruolo==='accusatore'){ const x=this.per(b.bersaglio); scelta = x && x.vivo ? x : null; }
    else { let bv = critico ? 2 : SOGLIA_VOTO; for(const p of cand){ const v=(b.sosp[p.id]||0)+this.votiPer(p.id)*(critico?14:6)+rnd()*6; if(v>bv){ bv=v; scelta=p; } } }
    this.riu.voti.set(b.id, scelta?scelta.id:'salta'); this.segna();
  }
  passoRiunione(dt){
    const R=this.riu; R.t+=dt;
    while(R.coda.length && R.coda[0].t<=R.t){
      const ev=R.coda.shift(); if(!ev.chi.vivo || R.chiusa) continue;
      if(ev.voto){ if(!R.voti.has(ev.chi.id) && R.t>=R.disc) this.votoBot(ev.chi); }
      else { if(ev.az) ev.az(); else this.scrivi(ev.chi, ev.testo); if(ev.eff) ev.eff(); }
      if(this.fase!=='riunione' || this.riu!==R) return;   // l'Indovino può aver chiuso la partita
    }
    const vivi=this.gioc.filter(p=>p.vivo), tutti=R.t>=R.disc && vivi.every(p=>R.voti.has(p.id));
    // messo l'ultimo sigillo il voto resta aperto ancora un poco, sempre: se si chiudesse lì, l'Indovino dovrebbe tentare prima di votare e chi cade indicherebbe l'unico senza sigillo
    const conta = tutti ? (R.conta!=null ? R.conta : R.t+DUR_SIGILLI) : null;
    if(conta!=R.conta){ R.conta=conta; this.segna(); }
    if(!R.chiusa && (R.t>=R.disc+R.voto || (tutti && R.t>=conta))) this.concludiRiunione();
  }
  concludiRiunione(){
    const R=this.riu; R.chiusa=true;
    const conta=new Map(); let salta=0;
    for(const [chi,v] of R.voti){ const w=this.peso(chi); if(v==='salta') salta+=w; else conta.set(v,(conta.get(v)||0)+w); }
    let max=0, top=null, pari=false;
    for(const [id,n] of conta){ if(n>max){ max=n; top=id; pari=false; } else if(n===max) pari=true; }
    const e = (top!=null && !pari && max>salta) ? this.per(top) : null;
    let titolo, sotto;
    if(e){
      e.vivo=false; e.fantasma=true;
      titolo=`${e.nome} lascia il palazzo.`;
      const acc=this.gioc.find(a=>a.ruolo==='accusatore'&&a.vivo&&a.bersaglio===e.id);
      if(e.ruolo==='giullare'){ sotto='Era il Giullare: voleva proprio questo.'; this.vincitore={ chi:'giullare', id:e.id, perche:`Il Giullare (${e.nome}) voleva il voto contro di sé, e l'ha avuto.` }; }
      else if(acc){ sotto = this.imp.mostraRuolo ? `Era ${RUOLI[e.ruolo].nome}. Ed era il bersaglio dell'Accusatore!` : `Era il bersaglio dell'Accusatore!`; this.vincitore={ chi:'accusatore', id:acc.id, perche:`L'Accusatore (${acc.nome}) ha fatto cacciare ${e.nome}.` }; }
      else if(this.imp.mostraRuolo) sotto = e.squadra==='ombre' ? `Era un'ombra (${RUOLI[e.ruolo].nome}).` : `Non era un'ombra (${RUOLI[e.ruolo].nome}).`;
      else sotto='';
    } else { titolo='Nessuno lascia il palazzo.'; sotto = salta>=max ? 'Troppi hanno saltato il voto.' : 'Voti divisi.'; }
    if(!this.vincitore && this.imp.mostraRuolo){ const om=this.gioc.filter(p=>p.vivo&&p.squadra==='ombre').length; if(om) sotto=(sotto?sotto+' ':'')+`Ombre ancora nel palazzo: ${om}.`; }
    this.esito={ voti:[...R.voti.entries()].map(([chi,su])=>[chi,su,this.peso(chi)]), espulso:e?e.id:null, titolo, sotto };
    this.fase='esito'; this.fineFase=this.t+DUR_ESITO; this.segna();
  }
  dopoEsito(){
    this.riu=null; this.esito=null;
    if(this.controllaVittoria()) return this.chiudi();
    for(const p of this.gioc){ if(!p.imita) continue; const v=this.per(p.imita); p.imita=null; if(!p.vivo||!v) continue; p.ruolo=v.ruolo; this.preparaRuolo(p); p.cdA=10; this.priv(p); this.avviso(p, `Ora sei ${RUOLI[p.ruolo].nome}: ${RUOLI[p.ruolo].desc}`); }
    this.fase='gioco'; this.round++;
    this.inCerchio();
    for(const g of this.gioc){
      g.frenDa=this.t; g.frenAvvisato=false;
      g.segnala=null; g.corpoVisto=null; g.mem={ controlli:[], puliti:[] }; if(this.imp.medico.dura==='riunione') g.protettoDa=null; g.osserva=false; g.ripara=null; g.dopoSpegni=false; g.prossimoGiro=false; g.zittito=false; g.segnato=false; g.traccia=null;
      g.usi=this.imp.veggente.usi;
      for(const k in g.sosp) g.sosp[k]*=0.6;
      if(g.squadra==='ombre') g.cd=Math.max(g.cd,18);
      if(g.ruolo==='sceriffo') g.cdA=Math.max(g.cdA,10);
      this.priv(g);
    }
    for(const k in this.pub) this.pub[k]*=0.5;
    this.buio=null; this.interf=null; this.acqua=null; this.nebbiaFine=0; this.bengalaFine=0; this.cdBuio=Math.max(this.cdBuio,20);
    for(const p of this.gioc) if(p.portineria) this.gioc.forEach(q=>{ p.portineria.prev[q.id]=this.stanzaIdx(q); });
    this.segna();
  }
}

// ===== arredi.js =====
// Il palazzo in finto 3D: pavimenti diversi per stanza, muri alti con la loro carta o pietra, mobili con volume e ombra.
// Le parti ferme si disegnano una volta sola in tele nascoste (pezzi di 8×8 caselle e una figurina per ogni mobile), poi si copiano.
// A ogni fotogramma si ridisegna solo quello che si muove: fiamme, schermi, acqua, l'ingranaggio quando si carica l'orologio.
// I mobili restano oggetti distinti (tipo, posto, misure): servono anche al nascondino futuro.

const PEZZO = 8;   // caselle per lato di un pezzo di pavimento
const TELE = new Map(); let telePx = 0;
const TELE_MAX = 20e6;    // pixel in tutto (circa 80 MB): oltre, si buttano le tele usate meno di recente
let teleExtra = 0;        // in più, quando il telefono ha memoria a sufficienza per tenere decodificato tutto il palazzo (vedi il precarico)
// una voce nuova nella cache (tela disegnata o immagine arrivata dalla rete); se si supera il tetto, escono le più vecchie
function metti(chiave, e){
  TELE.set(chiave, e); telePx += e.px;
  for(const [k, v] of TELE){
    if(telePx <= TELE_MAX + teleExtra || k === chiave) break;
    TELE.delete(k); telePx -= v.px; if(v.cv){ v.cv.width = 0; v.cv.height = 0; }
    if(v.libera) v.libera();   // le immagini: si segna che vanno riscaricate se servono ancora
  }
}
function prendi(chiave, fare){
  let e = TELE.get(chiave);
  if(e){ TELE.delete(chiave); TELE.set(chiave, e); return e; }
  e = fare() || { cv:null, px:0 }; e.nuovo = true;
  metti(chiave, e);
  return e;
}
// una voce già in cache, senza farla (e rimessa in fondo alla coda: è appena stata usata)
function cerca(chiave){
  const e = TELE.get(chiave);
  if(e){ TELE.delete(chiave); TELE.set(chiave, e); }
  return e;
}

// un numero «a caso» ma sempre uguale per la stessa casella: i pezzi combaciano e non cambiano mai
function fisso(a, b, k){
  let n = Math.imul(a|0, 374761393) + Math.imul(b|0, 668265263) + Math.imul((k|0) + 7, 1274126177);
  n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
// un colore più chiaro (f > 0) o più scuro (f < 0): calcolato una volta sola per ogni centesimo di f
const TINTE = {};
function tinta(hex, f){
  const q = Math.round(f*100) + 100, a = TINTE[hex] || (TINTE[hex] = []);
  if(a[q]) return a[q];
  const n = parseInt(hex.slice(1), 16), g = (q - 100)/100, m = g >= 0 ? (x => x + (255 - x)*g) : (x => x*(1 + g));
  return (a[q] = 'rgb(' + (m(n >> 16)|0) + ',' + (m((n >> 8) & 255)|0) + ',' + (m(n & 255)|0) + ')');
}
function rombo(c, x, y, r){ c.beginPath(); c.moveTo(x, y - r); c.lineTo(x + r, y); c.lineTo(x, y + r); c.lineTo(x - r, y); c.closePath(); c.fill(); }
const LIBRI = ['#6e2430', '#23395b', '#2f5240', '#8a6a2a', '#5a3a2a', '#3f2a4f', '#7a4a22', '#26464a', '#9a8a6a', '#4a1e22'];

// ── Stile di ogni stanza: pavimento, muro, decori a terra ──
const STILE_CORR = { pav:'listoni', legno:'#4a3224', muro:'carta', carta:'#57242e', fregio:'#b8914e', zoccolo:'#33211a', torce:[5, 2], cornici:true };
const STILI = {
  'Biblioteca': { pav:'listoni', legno:'#4d3424', muro:'libreria', terra:terraBiblioteca },
  'Salone delle feste': { pav:'scacchi', chiaro:'#b9ad98', scuro:'#3a2f33', muro:'finestre', carta:'#5e1f2c', fregio:'#d4af62', zoccolo:'#3a1820', tenda:'#3f1a3a', terra:terraSalone },
  "Torre dell'orologio": { pav:'lastre', pietra:'#5c5c66', muro:'orologio', pietraMuro:'#4e4e59', terra:terraTorre },
  'Cortile': { pav:'ciottoli', pietra:'#6f6a5e', muro:'edera', pietraMuro:'#57554e', torce:[6, 3], terra:terraCortile },
  'Cappella': { pav:'lastre', pietra:'#6b6879', muro:'vetrate', pietraMuro:'#4c495b', terra:terraCappella },
  'Sala della musica': { pav:'quadrotti', legno:'#6d4c2f', muro:'carta', carta:'#1d4542', fregio:'#c9a35a', zoccolo:'#2a1f17', spartiti:true, terra:terraMusica },
  'Cucine': { pav:'cotto', cotto:'#9c5b3b', muro:'maioliche', maiolica:'#d8d1c0', fascia:'#3d6a8a', pentole:true, terra:terraCucine },
  'Cantina': { pav:'mattoni', mattone:'#5f3b2f', muro:'archi', pietraMuro:'#5c3a30', torce:[4, 3], terra:terraCantina },
  'Lavanderia': { pav:'piastrelle', piastrella:'#7e98a5', muro:'maioliche', maiolica:'#c3d2d8', fascia:'#5f8a96', tubi:true, terra:terraLavanderia },
  'Galleria dei ritratti': { pav:'listoni', legno:'#3e2b22', muro:'quadri', carta:'#38234c', fregio:'#d4af62', zoccolo:'#22162c', terra:terraGalleria },
  'Sorveglianza': { pav:'metallo', metallo:'#3b454d', muro:'pannelli', pannello:'#262f37', terra:terraSorveglianza },
  'Serra': { pav:'erba', erba:'#2e5032', muro:'vetro', terra:terraSerra },
  'Sala del telegrafo': { pav:'listoni', legno:'#6f5337', muro:'carte', legnoMuro:'#4d3826', terra:terraTelegrafo },
  'Molo': { pav:'assi', legno:'#5d4d3c', muro:'banchina', pietraMuro:'#4d4b47', torce:[5, 2], terra:terraMolo },
  "Sala d'attesa": { pav:'scacchi', chiaro:'#b5aa9a', scuro:'#3d3249', muro:'finestre', carta:'#3a2950', fregio:'#d4af62', zoccolo:'#241a31', tenda:'#5a2a3a', terra:terraAtrio },
};
function stileDi(M, p){
  if(p < 0) return STILE_CORR;
  const st = M.stanze[p];
  return STILI[st.nome] || st._stile || (st._stile = { pav:'semplice', c1:st.c1, c2:st.c2, muro:'carta', carta:'#3a2e3a', zoccolo:'#2a2026' });
}

// ── Pavimenti: una casella alla volta, con i motivi agganciati alle coordinate del mondo (così le caselle combaciano) ──
const PAVIMENTI = {
  semplice(c, X, Y, tx, ty, s){ c.fillStyle = ((tx + ty) & 1) ? s.c1 : s.c2; c.fillRect(X, Y, T, T); },
  listoni(c, X, Y, tx, ty, s){   // legno a listoni: 4 assi per casella, giunti sfalsati
    const ph = T/4;
    for(let k = 0; k < 4; k++){
      const riga = ty*4 + k, L = T*(2 + (riga*7) % 3), off = fisso(riga, 3, 1)*L, y = Y + k*ph;
      let a = X;
      while(a < X + T){
        const n = Math.floor((a - off)/L), fine = Math.min(X + T, off + (n + 1)*L);
        c.fillStyle = tinta(s.legno, fisso(n, riga, 5)*0.24 - 0.12); c.fillRect(a, y, fine - a + 0.3, ph);
        c.fillStyle = 'rgba(255,230,190,.05)'; c.fillRect(a, y + 1.5 + fisso(n, riga, 9)*(ph - 4), fine - a, 1);
        if(fine < X + T){ c.fillStyle = 'rgba(0,0,0,.42)'; c.fillRect(fine - 0.5, y, 1, ph); }
        a = fine;
      }
      c.fillStyle = 'rgba(0,0,0,.32)'; c.fillRect(X, y, T, 0.8);
    }
  },
  scacchi(c, X, Y, tx, ty, s){   // marmo a scacchiera con le venature
    const chiaro = ((tx + ty) & 1) === 0;
    c.fillStyle = tinta(chiaro ? s.chiaro : s.scuro, fisso(tx, ty, 1)*0.08 - 0.04); c.fillRect(X, Y, T, T);
    c.strokeStyle = chiaro ? 'rgba(90,80,70,.22)' : 'rgba(220,210,200,.12)'; c.lineWidth = 0.7;
    for(let v = 0; v < 2; v++){ c.beginPath(); c.moveTo(X + fisso(tx, ty, 10 + v)*T, Y); c.bezierCurveTo(X + fisso(tx, ty, 20 + v)*T, Y + T*0.35, X + fisso(tx, ty, 30 + v)*T, Y + T*0.65, X + fisso(tx, ty, 40 + v)*T, Y + T); c.stroke(); }
    const g = c.createLinearGradient(X, Y, X + T, Y + T); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(X, Y, T, T);
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(X, Y, T, 0.6); c.fillRect(X, Y, 0.6, T);
  },
  lastre(c, X, Y, tx, ty, s){    // lastre di pietra irregolari
    c.fillStyle = tinta(s.pietra, -0.5); c.fillRect(X, Y, T, T);
    const sy = T*(0.35 + fisso(tx, ty, 1)*0.3);
    [[Y, sy], [Y + sy, T - sy]].forEach(([y, h], r) => {
      const sx = T*(0.3 + fisso(tx, ty, 2 + r)*0.4), pezzi = fisso(tx, ty, 4 + r) > 0.35 ? [[X, sx], [X + sx, T - sx]] : [[X, T]];
      pezzi.forEach(([x, w], k) => {
        c.fillStyle = tinta(s.pietra, fisso(tx*3 + k, ty*3 + r, 6)*0.26 - 0.13); c.fillRect(x + 1, y + 1, w - 2, h - 2);
        c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x + 1, y + 1, w - 2, 1.2);
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x + 1, y + h - 2.2, w - 2, 1.2);
      });
    });
    c.fillStyle = 'rgba(0,0,0,.16)'; for(let k = 0; k < 4; k++) c.fillRect(X + fisso(tx, ty, 50 + k)*T, Y + fisso(tx, ty, 60 + k)*T, 1.2, 1.2);
  },
  ciottoli(c, X, Y, tx, ty, s){  // il selciato del cortile, con l'erba tra le pietre
    c.fillStyle = tinta(s.pietra, -0.4); c.fillRect(X, Y, T, T);
    for(let k = 0; k < 9; k++){
      const x = X + ((k % 3) + 0.5)*T/3 + (fisso(tx, ty, k) - 0.5)*4, y = Y + (((k/3)|0) + 0.5)*T/3 + (fisso(tx, ty, k + 20) - 0.5)*4, r = T/6.8 + fisso(tx, ty, k + 40)*1.4;
      c.fillStyle = tinta(s.pietra, fisso(tx, ty, k + 60)*0.16 - 0.08); c.beginPath(); c.ellipse(x, y, r, r*0.85, fisso(tx, ty, k + 80)*3, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.05)'; c.beginPath(); c.ellipse(x - 1, y - 1.5, r*0.55, r*0.35, 0, 0, 7); c.fill();
    }
    if(fisso(tx, ty, 99) < 0.25){
      const x = X + fisso(tx, ty, 98)*T, y = Y + fisso(tx, ty, 97)*T;
      c.strokeStyle = 'rgba(90,140,70,.6)'; c.lineWidth = 1; c.beginPath();
      for(let k = 0; k < 4; k++){ c.moveTo(x + k*1.5, y); c.lineTo(x + k*1.5 + (k - 1.5), y - 3 - (k % 2)*2); }
      c.stroke();
    }
  },
  cotto(c, X, Y, tx, ty, s){     // cotto delle cucine: quattro mattonelle per casella
    c.fillStyle = '#5a3a2a'; c.fillRect(X, Y, T, T);
    for(let k = 0; k < 4; k++){
      const x = X + (k & 1)*T/2, y = Y + (k >> 1)*T/2;
      c.fillStyle = tinta(s.cotto, fisso(tx*2 + (k & 1), ty*2 + (k >> 1), 3)*0.18 - 0.14); c.fillRect(x + 0.7, y + 0.7, T/2 - 1.4, T/2 - 1.4);
      c.fillStyle = 'rgba(255,220,180,.07)'; c.fillRect(x + 0.8, y + 0.8, T/2 - 1.6, 1.4);
    }
  },
  quadrotti(c, X, Y, tx, ty, s){ // parquet a quadrotti intrecciati
    const q = T/2;
    for(let k = 0; k < 4; k++){
      const qx = tx*2 + (k & 1), qy = ty*2 + (k >> 1), x = X + (k & 1)*q, y = Y + (k >> 1)*q, oriz = ((qx + qy) & 1) === 0;
      for(let j = 0; j < 3; j++){
        c.fillStyle = tinta(s.legno, fisso(qx*3 + j, qy, 2)*0.24 - 0.12);
        if(oriz) c.fillRect(x, y + j*q/3, q, q/3); else c.fillRect(x + j*q/3, y, q/3, q);
        c.fillStyle = 'rgba(0,0,0,.28)'; if(oriz) c.fillRect(x, y + j*q/3, q, 0.6); else c.fillRect(x + j*q/3, y, 0.6, q);
      }
    }
    c.fillStyle = 'rgba(255,230,190,.04)'; c.fillRect(X, Y, T, T);
  },
  piastrelle(c, X, Y, tx, ty, s){
    c.fillStyle = tinta(s.piastrella, -0.38); c.fillRect(X, Y, T, T);
    for(let k = 0; k < 16; k++){
      const v = fisso(tx*4 + (k & 3), ty*4 + (k >> 2), 2);
      c.fillStyle = tinta(s.piastrella, v < 0.08 ? -0.25 : v*0.12 - 0.04); c.fillRect(X + (k & 3)*8 + 0.6, Y + (k >> 2)*8 + 0.6, 6.8, 6.8);
    }
  },
  metallo(c, X, Y, tx, ty, s){   // lamiera bugnata con i rivetti
    c.fillStyle = tinta(s.metallo, fisso(tx, ty, 1)*0.1 - 0.05); c.fillRect(X, Y, T, T);
    c.fillStyle = 'rgba(255,255,255,.06)';
    for(let yy = 2; yy < T; yy += 5) for(let xx = ((yy/5) & 1)*3 + 1; xx < T - 1; xx += 6) c.fillRect(X + xx, Y + yy, 2.4, 0.9);
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(X, Y, T, 0.8); c.fillRect(X, Y, 0.8, T);
    c.fillStyle = 'rgba(200,210,220,.28)'; [[3, 3], [T - 4, 3], [3, T - 4], [T - 4, T - 4]].forEach(([a, b]) => { c.beginPath(); c.arc(X + a, Y + b, 1, 0, 7); c.fill(); });
  },
  erba(c, X, Y, tx, ty, s){
    c.fillStyle = tinta(s.erba, fisso(tx, ty, 1)*0.12 - 0.06); c.fillRect(X, Y, T, T);
    c.strokeStyle = tinta(s.erba, 0.16); c.lineWidth = 0.8; c.beginPath();
    for(let k = 0; k < 10; k++){ const x = X + fisso(tx, ty, k)*T, y = Y + fisso(tx, ty, k + 20)*T; c.moveTo(x, y); c.lineTo(x + (fisso(tx, ty, k + 40) - 0.5)*3, y - 2.5 - fisso(tx, ty, k + 60)*2); }
    c.stroke();
    if(fisso(tx, ty, 90) < 0.18){
      const x = X + fisso(tx, ty, 92)*T, y = Y + fisso(tx, ty, 93)*T;
      c.fillStyle = fisso(tx, ty, 91) < 0.5 ? '#e8d27a' : '#e3e0f0';
      for(let k = 0; k < 3; k++){ c.beginPath(); c.arc(x + k*3 - 3, y + (k & 1)*2, 1.1, 0, 7); c.fill(); }
    }
  },
  assi(c, X, Y, tx, ty, s){      // le assi del molo, bagnate, con le fessure sull'acqua
    c.fillStyle = '#1a2129'; c.fillRect(X, Y, T, T);
    for(let k = 0; k < 4; k++){
      const col = tx*4 + k, L = T*(2 + (col*5) % 3), off = fisso(col, 7, 1)*L;
      let a = Y;
      while(a < Y + T){
        const n = Math.floor((a - off)/L), fine = Math.min(Y + T, off + (n + 1)*L);
        c.fillStyle = tinta(s.legno, fisso(col, n, 3)*0.16 - 0.08); c.fillRect(X + k*8 + 0.4, a, 7.2, fine - a);
        c.fillStyle = 'rgba(0,0,0,.09)'; c.fillRect(X + k*8 + 2 + fisso(col, n, 5)*3, a, 0.7, fine - a);
        if(fine < Y + T){ c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(X + k*8 + 0.4, fine - 0.6, 7.2, 1.2); c.fillStyle = 'rgba(190,180,160,.45)'; c.fillRect(X + k*8 + 2, fine - 3, 1.2, 1.2); c.fillRect(X + k*8 + 5, fine - 3, 1.2, 1.2); }
        a = fine;
      }
    }
    if(fisso(tx, ty, 30) < 0.3){ const g = c.createRadialGradient(X + 16, Y + 16, 0, X + 16, Y + 16, 14); g.addColorStop(0, 'rgba(160,190,220,.13)'); g.addColorStop(1, 'rgba(160,190,220,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
  },
  mattoni(c, X, Y, tx, ty, s){   // pavimento di mattoni a correre
    c.fillStyle = '#2a1d18'; c.fillRect(X, Y, T, T);
    for(let r = 0; r < 4; r++){
      const riga = ty*4 + r, off = (riga & 1)*8;
      for(let k = -1; k < 2; k++){
        const x = X + off + k*16, a = Math.max(X, x + 0.8), b = Math.min(X + T, x + 15.2);
        if(b <= a) continue;
        c.fillStyle = tinta(s.mattone, fisso(Math.floor((tx*T + off + k*16)/16), riga, 2)*0.3 - 0.15); c.fillRect(a, Y + r*8 + 0.8, b - a, 6.4);
      }
    }
  },
};

// ── Decori a terra (tappeti, passatoie, intarsi): si disegnano nei pezzi, sotto le ombre dei muri ──
function tappeto(c, x, y, w, h, p){
  c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x + 1, y + 2, w, h);
  c.fillStyle = p.bordo; c.fillRect(x, y, w, h);
  const b = Math.min(7, h*0.16);
  c.fillStyle = p.fondo; c.fillRect(x + b, y + b, w - 2*b, h - 2*b);
  c.strokeStyle = p.oro; c.lineWidth = 1; c.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5); c.strokeRect(x + b + 1.5, y + b + 1.5, w - 2*b - 3, h - 2*b - 3);
  c.fillStyle = p.oro;
  for(let k = x + b + 4; k < x + w - b - 2; k += 8){ rombo(c, k, y + b/2 + 0.5, 1.8); rombo(c, k, y + h - b/2 - 0.5, 1.8); }
  for(let k = y + b + 4; k < y + h - b - 2; k += 8){ rombo(c, x + b/2 + 0.5, k, 1.8); rombo(c, x + w - b/2 - 0.5, k, 1.8); }
  const cx = x + w/2, cy = y + h/2, m = Math.min(w, h);
  c.fillStyle = p.bordo; rombo(c, cx, cy, m*0.32); c.fillStyle = p.fondo; rombo(c, cx, cy, m*0.22); c.fillStyle = p.oro; rombo(c, cx, cy, m*0.08);
  c.fillStyle = 'rgba(255,255,255,.05)';
  for(let k = x + b + 10; k < x + w - b - 6; k += 14) for(let j = y + b + 9; j < y + h - b - 5; j += 12) rombo(c, k, j, 2.5);
  c.strokeStyle = p.frangia || '#d8cdb2'; c.lineWidth = 0.7; c.beginPath();
  for(let k = y + 2; k < y + h - 1; k += 2){ c.moveTo(x, k); c.lineTo(x - 3, k); c.moveTo(x + w, k); c.lineTo(x + w + 3, k); }
  c.stroke();
}
function tappetoTondo(c, cx, cy, rx, ry, p){
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(cx + 1, cy + 2, rx, ry, 0, 0, 7); c.fill();
  c.fillStyle = p.bordo; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, 7); c.fill();
  c.fillStyle = p.fondo; c.beginPath(); c.ellipse(cx, cy, rx - 7, ry - 7*ry/rx, 0, 0, 7); c.fill();
  c.strokeStyle = p.oro; c.lineWidth = 1; c.beginPath(); c.ellipse(cx, cy, rx - 2.5, ry - 2.5*ry/rx, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(cx, cy, rx - 8.5, ry - 8.5*ry/rx, 0, 0, 7); c.stroke();
  c.fillStyle = p.oro; for(let k = 0; k < 28; k++){ const a = k/28*Math.PI*2; rombo(c, cx + Math.cos(a)*(rx - 5), cy + Math.sin(a)*(ry - 5*ry/rx), 1.5); }
  c.save(); c.translate(cx, cy); c.scale(1, ry/rx);
  for(let s = 0; s < 2; s++){
    c.beginPath();
    for(let k = 0; k < 16; k++){ const a = k/16*Math.PI*2 + s*Math.PI/8, r = k & 1 ? rx*0.2 : rx*0.55; if(k) c.lineTo(Math.cos(a)*r, Math.sin(a)*r); else c.moveTo(Math.cos(a)*r, Math.sin(a)*r); }
    c.closePath(); c.fillStyle = s ? p.bordo : 'rgba(255,255,255,.08)'; c.fill();
  }
  c.fillStyle = p.oro; c.beginPath(); c.arc(0, 0, rx*0.07, 0, 7); c.fill();
  c.restore();
}
function stella(c, cx, cy, R){
  c.fillStyle = 'rgba(30,22,26,.32)'; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
  c.strokeStyle = 'rgba(212,175,98,.5)'; c.lineWidth = 1.2;
  c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke(); c.beginPath(); c.arc(cx, cy, R*0.92, 0, 7); c.stroke();
  for(let s = 0; s < 2; s++){
    c.beginPath();
    for(let k = 0; k < 16; k++){ const a = k/16*Math.PI*2 + s*Math.PI/8, r = k & 1 ? R*0.34 : R*0.86, px = cx + Math.cos(a)*r, py = cy + Math.sin(a)*r; if(k) c.lineTo(px, py); else c.moveTo(px, py); }
    c.closePath(); c.fillStyle = s ? 'rgba(212,175,98,.16)' : 'rgba(235,225,205,.10)'; c.fill(); c.stroke();
  }
  c.fillStyle = 'rgba(212,175,98,.7)'; c.beginPath(); c.arc(cx, cy, R*0.08, 0, 7); c.fill();
}
function passatoia(c, x, y, w, h, oriz){
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 1, y + 1.5, w, h);
  c.fillStyle = '#6a2030'; c.fillRect(x, y, w, h);
  c.fillStyle = '#3a1520';
  if(oriz){ c.fillRect(x, y, w, 3); c.fillRect(x, y + h - 3, w, 3); } else { c.fillRect(x, y, 3, h); c.fillRect(x + w - 3, y, 3, h); }
  c.fillStyle = 'rgba(212,175,98,.6)';
  if(oriz){ c.fillRect(x, y + 4, w, 0.8); c.fillRect(x, y + h - 4.8, w, 0.8); } else { c.fillRect(x + 4, y, 0.8, h); c.fillRect(x + w - 4.8, y, 0.8, h); }
  c.fillStyle = 'rgba(212,175,98,.22)';
  if(oriz) for(let k = x + 8; k < x + w - 4; k += 12) rombo(c, k, y + h/2, 3);
  else for(let k = y + 8; k < y + h - 4; k += 12) rombo(c, x + w/2, k, 3);
}
function centroDi(M, st, tipo){ const o = M.ostacoli.find(q => q.t === tipo && q.x >= st.x && q.x < st.x + st.w && q.y >= st.y && q.y < st.y + st.h); return o ? [(o.x + o.w/2)*T, (o.y + o.h/2)*T] : [(st.x + st.w/2)*T, (st.y + st.h/2)*T]; }
function fogli(c, x, y, n, seme){
  for(let k = 0; k < n; k++){
    c.save(); c.translate(x + (fisso(k, seme, 1) - 0.5)*40, y + (fisso(k, seme, 2) - 0.5)*24); c.rotate((fisso(k, seme, 3) - 0.5)*1.4);
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-4.5, -5.5, 10, 13); c.fillStyle = '#e3d8bc'; c.fillRect(-5, -6.5, 10, 13);
    c.fillStyle = 'rgba(60,45,30,.4)'; for(let l = 0; l < 4; l++) c.fillRect(-3.5, -4 + l*2.6, 7 - (l & 1)*2, 0.6);
    c.restore();
  }
}
function pozza(c, x, y, rx, ry){ const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, 'rgba(120,160,200,.22)'); g.addColorStop(1, 'rgba(120,160,200,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(220,235,255,.18)'; c.beginPath(); c.ellipse(x - rx*0.3, y - ry*0.3, rx*0.25, ry*0.15, 0, 0, 7); c.fill(); }
function grata(c, x, y){ c.fillStyle = '#1a1a1e'; c.fillRect(x - 7, y - 7, 14, 14); c.fillStyle = '#3a3a42'; for(let k = 0; k < 4; k++) c.fillRect(x - 6 + k*3.5, y - 6, 1.6, 12); c.strokeStyle = '#4a4a52'; c.lineWidth = 1; c.strokeRect(x - 7, y - 7, 14, 14); }

function terraBiblioteca(c, st){ tappeto(c, (st.x + 1.5)*T, (st.y + 5.15)*T, (st.w - 3)*T, 2.6*T, { fondo:'#5a1e28', bordo:'#1f3048', oro:'#c9a35a' }); }
function terraSalone(c, st){
  const x = st.x*T, y = st.y*T, w = st.w*T, h = st.h*T;
  c.strokeStyle = 'rgba(20,14,16,.5)'; c.lineWidth = 3; c.strokeRect(x + T*0.5 + 3, y + T*0.5 + 3, w - T - 6, h - T - 6);
  c.strokeStyle = 'rgba(212,175,98,.45)'; c.lineWidth = 1.2; c.strokeRect(x + T*0.5, y + T*0.5, w - T, h - T);
  stella(c, x + w/2, y + h/2, Math.min(w, h)*0.38);
}
function terraTorre(c, st, M){
  const [cx, cy] = centroDi(M, st, 'ingranaggio'), R = 2.4*T;
  c.strokeStyle = 'rgba(30,30,36,.6)'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(201,163,90,.45)'; c.lineWidth = 1.2; c.beginPath(); c.arc(cx, cy, R + 4, 0, 7); c.stroke();
  c.fillStyle = 'rgba(201,163,90,.55)'; for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2; rombo(c, cx + Math.cos(a)*R, cy + Math.sin(a)*R, k % 3 ? 1.8 : 3); }
}
function terraCortile(c, st, M){
  const [cx, cy] = centroDi(M, st, 'fontana');
  c.strokeStyle = 'rgba(160,155,140,.22)'; c.lineWidth = 12; c.beginPath(); c.arc(cx, cy, 2.75*T, 0, 7); c.stroke();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; [2.75*T - 6, 2.75*T + 6].forEach(r => { c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); });
  [[st.x, st.y], [st.x + st.w, st.y], [st.x, st.y + st.h], [st.x + st.w, st.y + st.h]].forEach(([a, b]) => { const g = c.createRadialGradient(a*T, b*T, 0, a*T, b*T, 2.5*T); g.addColorStop(0, 'rgba(70,110,60,.32)'); g.addColorStop(1, 'rgba(70,110,60,0)'); c.fillStyle = g; c.fillRect(a*T - 2.5*T, b*T - 2.5*T, 5*T, 5*T); });
}
function terraCappella(c, st){ const ab = (st.parti || [])[0]; passatoia(c, (st.x + st.w/2)*T - 12, (ab ? ab.y + 1 : st.y)*T, 24, (st.y + st.h - (ab ? ab.y + 1 : st.y))*T, false); }
function terraMusica(c, st){ tappetoTondo(c, (st.x + st.w*0.62)*T, (st.y + st.h*0.62)*T, 2.3*T, 1.6*T, { fondo:'#17403a', bordo:'#3a2a1c', oro:'#c9a35a' }); fogli(c, (st.x + st.w - 2)*T, (st.y + st.h - 1.2)*T, 2, 11); }
function terraCucine(c, st, M){
  const o = M.ostacoli.find(q => q.t === 'banco' && q.x >= st.x && q.x < st.x + st.w && q.y >= st.y && q.y < st.y + st.h);
  if(o){ c.fillStyle = 'rgba(245,240,228,.14)'; for(let k = 0; k < 40; k++){ c.beginPath(); c.arc((o.x + fisso(k, 1, 4)*o.w)*T, (o.y + o.h + fisso(k, 2, 4)*1.2)*T, 0.8 + fisso(k, 3, 4)*1.6, 0, 7); c.fill(); } }
  grata(c, (st.x + st.w/2)*T, (st.y + st.h - 1.5)*T);
}
function terraCantina(c, st){
  c.strokeStyle = 'rgba(200,170,90,.35)'; c.lineWidth = 0.8; c.beginPath();
  for(let k = 0; k < 40; k++){ const x = (st.x + 0.5 + fisso(k, 1, 7)*(st.w - 1))*T, y = (st.y + 0.5 + fisso(k, 2, 7)*(st.h - 1))*T, a = fisso(k, 3, 7)*3; c.moveTo(x, y); c.lineTo(x + Math.cos(a)*5, y + Math.sin(a)*5); }
  c.stroke();
  pozza(c, (st.x + st.w*0.62)*T, (st.y + st.h*0.4)*T, 22, 10);
  grata(c, (st.x + st.w*0.4)*T, (st.y + st.h*0.75)*T);
}
function terraLavanderia(c, st){ pozza(c, (st.x + st.w*0.35)*T, (st.y + st.h*0.55)*T, 26, 11); pozza(c, (st.x + st.w*0.7)*T, (st.y + st.h*0.8)*T, 14, 6); grata(c, (st.x + st.w*0.55)*T, (st.y + st.h*0.5)*T); }
function terraGalleria(c, st){ passatoia(c, (st.x + 0.6)*T, (st.y + st.h/2)*T - 14, (st.w - 1.2)*T, 28, true); }
function terraSorveglianza(c, st, M){
  const o = M.ostacoli.find(q => q.t === 'console');
  c.strokeStyle = 'rgba(10,12,16,.7)'; c.lineWidth = 2;
  for(let k = 0; k < 3; k++){ const x0 = o ? (o.x + 0.5 + k*1.6)*T : (st.x + 1)*T, y0 = o ? (o.y + 1)*T : st.y*T; c.beginPath(); c.moveTo(x0, y0); c.bezierCurveTo(x0 + 10, y0 + 30 + k*8, (st.x + st.w)*T - 40, (st.y + st.h)*T - 20 - k*6, (st.x + st.w)*T, (st.y + st.h - 1 - k*0.6)*T); c.stroke(); }
}
function terraSerra(c, st){
  const cx = (st.x + st.w/2)*T, cy = (st.y + st.h/2)*T;
  for(let k = 0; k < st.w*1.3; k++){ const x = st.x*T + 10 + k*T*0.78, y = cy + (fisso(k, 1, 8) - 0.5)*6; sasso(c, x, y, fisso(k, 2, 8)); }
  for(let k = 0; k < st.h*1.3; k++){ const y = st.y*T + 10 + k*T*0.78, x = cx + (fisso(k, 3, 8) - 0.5)*6; if(Math.abs(y - cy) > 14) sasso(c, x, y, fisso(k, 4, 8)); }
}
function sasso(c, x, y, q){ c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + 1, y + 1.5, 9, 6, q, 0, 7); c.fill(); c.fillStyle = tinta('#8a8476', q*0.2 - 0.1); c.beginPath(); c.ellipse(x, y, 9, 6, q, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.1)'; c.beginPath(); c.ellipse(x - 2, y - 2, 4, 2.4, q, 0, 7); c.fill(); }
function terraTelegrafo(c, st){ tappeto(c, (st.x + 3.2)*T, (st.y + 2.1)*T, 3.4*T, 2.2*T, { fondo:'#4a4a2a', bordo:'#2a2418', oro:'#a88a52' }); fogli(c, (st.x + 2)*T, (st.y + st.h - 1)*T, 4, 23); }
function terraMolo(c, st, M){
  const { GW, GH, PAV, ACQUA } = M, k = M.stanze.indexOf(st), acqua = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && ACQUA[y*GW + x] && PAV[y*GW + x] === -2;
  const caselle = [];
  for(let y = 0; y < GH; y++) for(let x = 0; x < GW; x++) if(PAV[y*GW + x] === k) caselle.push([x, y]);
  // la trave del bordo dove le assi finiscono sull'acqua
  caselle.forEach(([x, y]) => {
    c.fillStyle = '#2e241a';
    if(acqua(x, y + 1)){ c.fillRect(x*T, (y + 1)*T - 5, T, 5); c.fillStyle = 'rgba(255,230,190,.08)'; c.fillRect(x*T, (y + 1)*T - 5, T, 1); c.fillStyle = '#2e241a'; }
    if(acqua(x + 1, y)) c.fillRect((x + 1)*T - 5, y*T, 5, T);
    if(acqua(x - 1, y)) c.fillRect(x*T, y*T, 5, T);
  });
  // i pali agli angoli che danno sull'acqua
  caselle.forEach(([x, y]) => {
    [[-1, 1, 4, T - 4], [1, 1, T - 4, T - 4]].forEach(([dx, dy, px, py]) => {
      if(!acqua(x + dx, y) || !acqua(x, y + dy)) return;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x*T + px + 1, y*T + py + 1.5, 4.5, 0, 7); c.fill();
      c.fillStyle = '#3e3022'; c.beginPath(); c.arc(x*T + px, y*T + py, 4.2, 0, 7); c.fill(); c.fillStyle = '#5a4632'; c.beginPath(); c.arc(x*T + px - 0.8, y*T + py - 0.8, 2.4, 0, 7); c.fill();
    });
  });
  // bitte e cime lungo il bordo sud
  caselle.filter(([x, y]) => acqua(x, y + 1) && !acqua(x - 1, y) && !acqua(x + 1, y) && x % 5 === 2).forEach(([x, y]) => {
    const bx = (x + 0.5)*T, by = (y + 1)*T - 9;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(bx + 1, by + 3, 6, 3, 0, 0, 7); c.fill();
    c.fillStyle = '#26262c'; c.fillRect(bx - 4.5, by - 7, 9, 8); c.beginPath(); c.ellipse(bx, by + 1, 4.5, 2, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#3e3e46'; c.beginPath(); c.ellipse(bx, by - 7, 5.5, 2.5, 0, 0, 7); c.fill();
    if(fisso(x, 1, 6) < 0.6){ c.strokeStyle = '#b8a07a'; c.lineWidth = 1.4; for(let q = 0; q < 3; q++){ c.beginPath(); c.ellipse(bx - 15, by - 2, 7 - q*2, 3.5 - q, 0, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(bx - 8, by - 2); c.quadraticCurveTo(bx - 4, by - 8, bx - 3, by - 6); c.stroke(); }
  });
}
function terraAtrio(c, st){ tappetoTondo(c, (st.x + st.w/2)*T, (st.y + st.h*0.66)*T, 4.6*T, 2.7*T, { fondo:'#3c2552', bordo:'#1f1630', oro:'#d4af62' }); }
function terraCorridoio(c, r){
  const [x, y, w, h] = r;
  if(w >= 4 && h >= 2 && w >= h){ const lw = Math.min(h*T - 18, 32); passatoia(c, x*T, (y + h/2)*T - lw/2, w*T, lw, true); }
  else if(h >= 4 && w >= 2){ const lw = Math.min(w*T - 18, 32); passatoia(c, (x + w/2)*T - lw/2, y*T, lw, h*T, false); }
}

// ── I muri: dove sotto un muro c'è pavimento, il muro mostra la sua faccia, alta 1,5 caselle se dietro c'è altro muro ──
function prepara(M){
  if(M._ar) return M._ar;
  const { GW, GH, PAV, ACQUA } = M;
  const muro = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH || (PAV[y*GW + x] === -2 && !ACQUA[y*GW + x]);
  const pav = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && PAV[y*GW + x] !== -2;
  const facce = [], torce = [];
  for(let y = 0; y < GH - 1; y++){
    let run = null;
    for(let x = 0; x <= GW; x++){
      const ok = x < GW && muro(x, y) && pav(x, y + 1), p = ok ? PAV[(y + 1)*GW + x] : null, alto = ok && muro(x, y - 1);
      if(run && (!ok || p !== run.p || alto !== run.alto)){ facce.push(run); run = null; }
      if(ok){ if(run) run.x1 = x + 1; else run = { x0:x, x1:x + 1, y, p, alto }; }
    }
  }
  facce.forEach(f => {
    f.h = f.alto ? T*1.5 : T*0.85; f.st = stileDi(M, f.p); f.torce = [];
    const tc = f.st.torce;
    if(tc && f.x1 - f.x0 >= 3) for(let k = f.x0 + tc[1]; k < f.x1 - 1; k += tc[0]){ f.torce.push(k); torce.push({ x:(k + 0.5)*T, y:(f.y + 1)*T - Math.min(f.h*0.62, f.h - 9) - 2 }); }
  });
  // il mare: le righe d'acqua, le rive (dove l'acqua tocca assi o pietra) e quanto è profonda ogni casella
  const acqua = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && ACQUA[y*GW + x] && PAV[y*GW + x] === -2;
  const acque = [], rive = [], prof = new Float32Array(GW*GH);
  for(let y = 0; y < GH; y++){ let a = -1; for(let x = 0; x <= GW; x++){ const w = x < GW && acqua(x, y); if(w && a < 0) a = x; if(!w && a >= 0){ acque.push([y, a, x]); a = -1; } } }
  for(let y = 0; y < GH; y++) for(let x = 0; x < GW; x++){
    if(!acqua(x, y)) continue;
    let d = 6; for(let r = 1; r <= 5 && d === 6; r++) for(let dy = -r; dy <= r; dy++) for(let dx = -r; dx <= r; dx++){ const xx = x + dx, yy = y + dy; if(xx < 0 || yy < 0 || xx >= GW || yy >= GH) continue; if(!acqua(xx, yy)){ d = Math.min(d, r); } }
    prof[y*GW + x] = d;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => { const xx = x + dx, yy = y + dy; if(xx < 0 || yy < 0 || xx >= GW || yy >= GH || acqua(xx, yy)) return;
      if(dy) rive.push({ x1:x*T, x2:(x + 1)*T, y1:(dy < 0 ? y : y + 1)*T, y2:(dy < 0 ? y : y + 1)*T, nx:0, ny:-dy });
      else rive.push({ x1:(dx < 0 ? x : x + 1)*T, x2:(dx < 0 ? x : x + 1)*T, y1:y*T, y2:(y + 1)*T, nx:-dx, ny:0 }); });
  }
  M._ar = { facce, torce, acque, rive, prof };
  return M._ar;
}
function zoccolo(c, g, col, fregio){
  const h = Math.min(g.H*0.38, 20), y = g.yb - h;
  c.fillStyle = col; c.fillRect(g.X0, y, g.W, h);
  for(let x = g.X0 + 3; x < g.X1 - 5; x += 16){
    const w = Math.min(12, g.X1 - 3 - x); if(w < 5) break;
    c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(x, y + 3, w, h - 6);
    c.fillStyle = 'rgba(255,222,176,.09)'; c.fillRect(x, y + h - 4, w, 1); c.fillRect(x + w - 1, y + 3, 1, h - 6);
  }
  c.fillStyle = fregio || tinta(col, 0.3); c.fillRect(g.X0, y - 2, g.W, 2);
  c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(g.X0, g.yb - 2, g.W, 2);
}
function blocchi(c, g, col, rh, lmin, lvar, seme){
  c.fillStyle = tinta(col, -0.5); c.fillRect(g.X0, g.ya, g.W, g.H);
  let r = 0;
  for(let y = g.yb - rh; y > g.ya - rh; y -= rh, r++){
    let x = g.X0 - (r & 1 ? lmin*0.6 : 0), k = 0;
    while(x < g.X1){
      const L = lmin + fisso(Math.round(x) + k, r + seme, 1)*lvar, a = Math.max(g.X0, x + 0.8), b = Math.min(g.X1, x + L - 0.8), yy = Math.max(g.ya, y + 0.8);
      if(b > a){ c.fillStyle = tinta(col, fisso(Math.round(x), r + seme, 2)*0.28 - 0.14); c.fillRect(a, yy, b - a, y + rh - 0.8 - yy); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(a, yy, b - a, 1); }
      x += L; k++;
    }
  }
}
function finestra(c, x, y, w, h){
  const arco = dx => { c.beginPath(); c.moveTo(x - dx, y + h + dx); c.lineTo(x - dx, y + w/2); c.arc(x + w/2, y + w/2, w/2 + dx, Math.PI, 0); c.lineTo(x + w + dx, y + h + dx); c.closePath(); };
  c.fillStyle = '#211a26'; arco(2.5); c.fill();
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#18223f'); g.addColorStop(1, '#33466a');
  c.fillStyle = g; arco(0); c.fill();
  c.fillStyle = 'rgba(235,240,255,.75)'; c.beginPath(); c.arc(x + w*0.68, y + h*0.3, 1.9, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,.55)'; [[0.25, 0.55], [0.38, 0.22], [0.8, 0.62]].forEach(([a, b]) => c.fillRect(x + w*a, y + h*b, 0.8, 0.8));
  c.fillStyle = 'rgba(210,225,255,.10)'; c.beginPath(); c.moveTo(x + w*0.12, y + h); c.lineTo(x + w*0.42, y + w*0.3); c.lineTo(x + w*0.6, y + w*0.3); c.lineTo(x + w*0.3, y + h); c.fill();
  c.fillStyle = '#211a26'; c.fillRect(x + w/2 - 1, y, 2, h); c.fillRect(x, y + h*0.5, w, 1.6);
  c.fillStyle = '#8a7a66'; c.fillRect(x - 4, y + h, w + 8, 3); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x - 4, y + h + 3, w + 8, 1.5);
}
function ogiva(c, x, y, w, h){ c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w*0.6); c.quadraticCurveTo(x, y, x + w/2, y - w*0.15); c.quadraticCurveTo(x + w, y, x + w, y + w*0.6); c.lineTo(x + w, y + h); c.closePath(); }
function arcata(c, x, y, w, h){ c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w*0.3); c.quadraticCurveTo(x, y, x + w/2, y); c.quadraticCurveTo(x + w, y, x + w, y + w*0.3); c.lineTo(x + w, y + h); c.closePath(); }
function cornicetta(c, x, y, w, h, q){
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - 1, y, w + 5, h + 5);
  c.fillStyle = '#9a7a3c'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
  c.fillStyle = q < 0.5 ? '#283848' : '#3a2a22'; c.fillRect(x, y, w, h);
  c.fillStyle = q < 0.5 ? '#3e5a4a' : '#6a4a2a'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h*0.6); c.quadraticCurveTo(x + w*0.4, y + h*0.35, x + w, y + h*0.62); c.lineTo(x + w, y + h); c.fill();
  c.fillStyle = 'rgba(240,230,200,.55)'; c.beginPath(); c.arc(x + w*0.72, y + h*0.3, 1.8, 0, 7); c.fill();
}
function spartito(c, x, y, q){
  const w = 16, h = 20;
  c.fillStyle = '#5a4630'; c.fillRect(x - 1.5, y - 1.5, w + 3, h + 3); c.fillStyle = '#e8dfc8'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(40,30,20,.55)';
  for(let r = 0; r < 3; r++){
    for(let l = 0; l < 5; l++) c.fillRect(x + 1.5, y + 3 + r*6 + l*0.9, w - 3, 0.4);
    for(let n = 0; n < 4; n++){ c.beginPath(); c.arc(x + 3 + n*3.3, y + 3.5 + r*6 + fisso(n, r, q*100)*3, 0.8, 0, 7); c.fill(); }
  }
}
function applique(c, x, y){
  c.fillStyle = '#1a1414'; c.fillRect(x - 2.5, y + 4, 5, 8);
  c.fillStyle = '#3a2e26'; c.fillRect(x - 1, y + 1, 2, 5);
  c.fillStyle = '#5a4632'; c.beginPath(); c.moveTo(x - 4, y); c.lineTo(x + 4, y); c.lineTo(x + 2.5, y + 2.5); c.lineTo(x - 2.5, y + 2.5); c.fill();
}
function miniPalazzo(c, M, x, y, w, h, alto, col, tetto){
  const k = Math.min(w/M.GW, h/M.GH), ox = x + (w - M.GW*k)/2, oy = y + (h - M.GH*k)/2;
  if(!alto){ c.strokeStyle = col; c.lineWidth = 0.7; M.stanze.forEach(st => c.strokeRect(ox + st.x*k, oy + st.y*k, st.w*k, st.h*k)); M.corridoi.forEach(([a, b, cw, ch]) => { c.fillStyle = col; c.globalAlpha = 0.35; c.fillRect(ox + a*k, oy + b*k, cw*k, ch*k); c.globalAlpha = 1; }); return; }
  c.fillStyle = 'rgba(0,0,0,.3)'; M.corridoi.forEach(([a, b, cw, ch]) => c.fillRect(ox + a*k, oy + b*k, cw*k, ch*k));
  M.stanze.slice().sort((a, b) => (a.y + a.h) - (b.y + b.h)).forEach(st => {
    const sx = ox + st.x*k, sy = oy + st.y*k, sw = st.w*k, sh = st.h*k;
    if(st.nome === 'Cortile'){ c.fillStyle = '#5a6a4a'; c.fillRect(sx, sy, sw, sh); c.fillStyle = '#7ab0c0'; c.beginPath(); c.arc(sx + sw/2, sy + sh/2, 1.4, 0, 7); c.fill(); return; }
    c.fillStyle = tinta(col, -0.35); c.fillRect(sx, sy + sh - alto, sw, alto);
    c.fillStyle = tetto; c.fillRect(sx, sy - alto, sw, sh);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(sx, sy - alto, sw, 0.6);
  });
}

const FACCE = {
  carta(c, g, s, f){
    c.fillStyle = s.carta; c.fillRect(g.X0, g.ya, g.W, g.H);
    const alto = g.yb - Math.min(g.H*0.38, 20);
    c.fillStyle = 'rgba(255,232,196,.07)';
    for(let y = g.ya + 6, r = 0; y < alto - 3; y += 9, r++) for(let x = g.X0 + 3 + (r & 1)*6; x < g.X1; x += 12) rombo(c, x, y, 2.4);
    c.fillStyle = 'rgba(0,0,0,.09)'; for(let x = g.X0 + 9; x < g.X1; x += 12) c.fillRect(x, g.ya, 1, alto - g.ya);
    zoccolo(c, g, s.zoccolo || '#2c1d14', s.fregio);
    if(g.H > T && s.cornici && f.x1 - f.x0 >= 4) for(let k = f.x0 + 2; k < f.x1 - 1; k += 7){ if(f.torce.some(q => Math.abs(q - k) < 2)) continue; cornicetta(c, k*T + 6, g.ya + g.H*0.16, T - 12, g.H*0.3, fisso(k, f.y, 3)); }
    if(g.H > T && s.spartiti) for(let k = f.x0 + 1; k < f.x1 - 1; k += 3) spartito(c, k*T + 8, g.ya + g.H*0.14, fisso(k, f.y, 4));
  },
  finestre(c, g, s, f){
    FACCE.carta(c, g, s, f);
    if(g.H <= T) return;
    for(let k = f.x0 + 1; k < f.x1 - 1; k += 3){
      const x = k*T + 5, w = T - 10, top = g.ya + g.H*0.14, bot = g.yb - g.H*0.42;
      c.fillStyle = 'rgba(150,180,255,.05)'; c.beginPath(); c.moveTo(x, g.yb); c.lineTo(x + w, g.yb); c.lineTo(x + w + 12, g.yb + T*1.7); c.lineTo(x - 8, g.yb + T*1.7); c.fill();
      finestra(c, x, top, w, bot - top);
      c.fillStyle = s.tenda || '#4a1828';
      [x - 8, x + w + 1].forEach((tx, i) => { c.fillRect(tx, top - 4, 7, bot - top + 9); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(tx + 2, top - 4, 1, bot - top + 9); c.fillRect(tx + 4.5, top - 4, 1, bot - top + 9); c.fillStyle = '#c9a35a'; c.fillRect(tx - 0.5, top + (bot - top)*0.62, 8, 1.6); c.fillStyle = s.tenda || '#4a1828'; });
      c.fillRect(x - 10, top - 8, w + 20, 5); c.fillStyle = '#c9a35a'; c.fillRect(x - 10, top - 3.5, w + 20, 1);
    }
  },
  libreria(c, g, s, f){
    c.fillStyle = '#2a1a10'; c.fillRect(g.X0, g.ya, g.W, g.H);
    const righe = g.H > T ? 3 : 2, top = g.ya + 4, bot = g.yb - 5, rh = (bot - top)/righe;
    for(let r = 0; r < righe; r++){
      const y1 = top + (r + 1)*rh;
      c.fillStyle = '#150d08'; c.fillRect(g.X0 + 2, top + r*rh, g.W - 4, rh);
      let x = g.X0 + 3, k = 0;
      while(x < g.X1 - 3){
        const id = Math.round(x)*3 + r;
        k++;
        if(fisso(id, f.y, 1) < 0.05){ x += 4; continue; }
        const bw = 2.2 + fisso(id, f.y, 2)*2.6, bh = (rh - 2)*(0.62 + fisso(id, f.y, 3)*0.32);
        c.fillStyle = LIBRI[(fisso(id, f.y, 4)*LIBRI.length)|0]; c.fillRect(x, y1 - bh - 1, bw - 0.4, bh);
        if(bw > 3.4){ c.fillStyle = 'rgba(230,190,110,.5)'; c.fillRect(x, y1 - bh + 1, bw - 0.4, 0.8); c.fillRect(x, y1 - 4, bw - 0.4, 0.7); }
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + bw - 1, y1 - bh - 1, 0.6, bh);
        x += bw;
      }
      c.fillStyle = '#5a3a22'; c.fillRect(g.X0 + 2, y1 - 1, g.W - 4, 2.2);
    }
    c.fillStyle = '#3d2616'; for(let x = g.X0; x <= g.X1; x += 2*T) c.fillRect(Math.min(x, g.X1 - 4), g.ya, 4, g.H);
    c.fillStyle = '#6b4a2e'; c.fillRect(g.X0, g.ya, g.W, 3);
  },
  pietra(c, g, s, f){ blocchi(c, g, s.pietraMuro, 8, 12, 14, f.y*31); },
  orologio(c, g, s, f){
    blocchi(c, g, s.pietraMuro, 8, 12, 14, f.y*31);
    if(g.H <= T || f.x1 - f.x0 < 3) return;
    const cx = (g.X0 + g.X1)/2, cy = g.ya + g.H*0.46, r = g.H*0.36;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(cx + 1.5, cy + 2, r + 3, 0, 7); c.fill();
    c.fillStyle = '#9a7a3c'; c.beginPath(); c.arc(cx, cy, r + 3, 0, 7); c.fill();
    c.fillStyle = '#e9e0c8'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(60,40,20,.8)'; c.lineWidth = 1.2;
    for(let k = 0; k < 12; k++){ const a = k/12*Math.PI*2, l = k % 3 ? 2.5 : 4.5; c.beginPath(); c.moveTo(cx + Math.cos(a)*(r - 1.5), cy + Math.sin(a)*(r - 1.5)); c.lineTo(cx + Math.cos(a)*(r - 1.5 - l), cy + Math.sin(a)*(r - 1.5 - l)); c.stroke(); }
    c.strokeStyle = '#2a1e14'; c.lineCap = 'round';
    c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(-1.75)*r*0.5, cy + Math.sin(-1.75)*r*0.5); c.stroke();
    c.lineWidth = 1.3; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(-2.35)*r*0.78, cy + Math.sin(-2.35)*r*0.78); c.stroke();
    c.lineCap = 'butt'; c.fillStyle = '#9a7a3c'; c.beginPath(); c.arc(cx, cy, 1.8, 0, 7); c.fill();
  },
  edera(c, g, s, f){
    blocchi(c, g, s.pietraMuro, 8, 12, 14, f.y*31);
    for(let k = f.x0; k < f.x1; k++){
      if(fisso(k, f.y, 9) > 0.45) continue;
      const bx = k*T + fisso(k, f.y, 10)*T, alt = g.H*(0.4 + fisso(k, f.y, 11)*0.55);
      c.strokeStyle = '#2c3a22'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, g.yb); c.bezierCurveTo(bx + 6, g.yb - alt*0.4, bx - 6, g.yb - alt*0.7, bx + 2, g.yb - alt); c.stroke();
      for(let j = 0; j < 9; j++){ const tt = j/9, lx = bx + Math.sin(tt*5 + k)*5, ly = g.yb - alt*tt; c.fillStyle = j & 1 ? '#3f6b35' : '#2f5428'; c.beginPath(); c.ellipse(lx + (j & 1 ? 3 : -3), ly, 3.2, 2.2, j & 1 ? 0.5 : -0.5, 0, 7); c.fill(); }
    }
  },
  vetrate(c, g, s, f){
    blocchi(c, g, s.pietraMuro, 8, 12, 14, f.y*31);
    if(g.H <= T) return;
    const COL = ['#8a2a34', '#2a4a8a', '#c9a35a', '#2f6a4a', '#6a3a8a'];
    for(let k = f.x0 + 1; k < f.x1 - 1; k += 2){
      const x = k*T + 8, w = T - 16, top = g.ya + g.H*0.12, h = g.H*0.6;
      ['rgba(200,80,90,.07)', 'rgba(90,120,220,.07)', 'rgba(220,180,90,.06)'].forEach((cc, i) => { const fx = x - 6 + i*7; c.fillStyle = cc; c.beginPath(); c.moveTo(fx, g.yb); c.lineTo(fx + 8, g.yb); c.lineTo(fx + 14, g.yb + T*1.3); c.lineTo(fx + 4, g.yb + T*1.3); c.fill(); });
      c.fillStyle = '#1e1a22'; ogiva(c, x - 2, top - 2, w + 4, h + 4); c.fill();
      c.save(); ogiva(c, x, top, w, h); c.clip();
      for(let r = 0; r < 6; r++) for(let q = 0; q < 3; q++){ c.fillStyle = COL[(fisso(k*3 + q, r, f.y)*COL.length)|0]; c.fillRect(x + q*w/3, top - w*0.2 + r*(h + w*0.2)/6, w/3, (h + w*0.2)/6 + 0.5); }
      c.fillStyle = 'rgba(0,0,0,.55)'; for(let q = 1; q < 3; q++) c.fillRect(x + q*w/3 - 0.5, top - w*0.2, 1, h + w*0.2); for(let r = 1; r < 6; r++) c.fillRect(x, top - w*0.2 + r*(h + w*0.2)/6 - 0.5, w, 1);
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x, top - w*0.2, w*0.35, h + w*0.2);
      c.restore();
    }
  },
  archi(c, g, s, f){
    blocchi(c, g, s.pietraMuro, 6, 14, 4, f.y*17);
    if(g.H <= T) return;
    for(let k = f.x0 + 1; k + 1 < f.x1; k += 4){
      const x = k*T + 4, w = 2*T - 8, top = g.ya + g.H*0.16, bot = g.yb - 3;
      c.fillStyle = '#3a2620'; arcata(c, x - 3, top - 3, w + 6, bot - top + 3); c.fill();
      c.fillStyle = '#140e0c'; arcata(c, x, top, w, bot - top); c.fill();
      for(let r = 0; r < 4; r++) for(let q = 0; q < 7; q++){
        const bx = x + 5 + q*(w - 10)/6, by = top + w*0.3 + r*6.5; if(by > bot - 4) continue;
        c.fillStyle = fisso(q, r, k) < 0.15 ? '#140e0c' : (fisso(q, r, k + 1) < 0.5 ? '#2a4a2a' : '#3a2018'); c.beginPath(); c.arc(bx, by, 2.4, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(bx - 1.2, by - 1.4, 1, 1);
      }
    }
  },
  banchina(c, g, s, f){
    blocchi(c, g, s.pietraMuro, 10, 18, 14, f.y*23);
    const gr = c.createLinearGradient(0, g.yb - g.H*0.35, 0, g.yb); gr.addColorStop(0, 'rgba(60,110,70,0)'); gr.addColorStop(1, 'rgba(60,110,70,.35)'); c.fillStyle = gr; c.fillRect(g.X0, g.yb - g.H*0.35, g.W, g.H*0.35);
    for(let k = f.x0 + 1; k < f.x1; k += 4){ if(f.torce.indexOf(k) >= 0) continue; const x = k*T + T/2, y = g.yb - g.H*0.4; c.strokeStyle = '#26262a'; c.lineWidth = 2; c.beginPath(); c.arc(x, y + 5, 4, 0, 7); c.stroke(); c.fillStyle = '#3a3a40'; c.fillRect(x - 2.5, y - 1, 5, 3); }
  },
  maioliche(c, g, s, f){
    const col = s.maiolica;
    c.fillStyle = tinta(col, -0.3); c.fillRect(g.X0, g.ya, g.W, g.H);
    for(let y = g.yb - 8, r = 0; y > g.ya - 8; y -= 8, r++) for(let x = g.X0; x < g.X1; x += 8){ const yy = Math.max(g.ya, y + 0.6); c.fillStyle = tinta(col, fisso(Math.round(x), r, 5)*0.1 - 0.05); c.fillRect(x + 0.6, yy, 6.8, y + 7.4 - yy); }
    const fy = g.yb - g.H*0.45;
    if(fy > g.ya + 4){ c.fillStyle = s.fascia; c.fillRect(g.X0, fy, g.W, 5); c.fillStyle = 'rgba(255,255,255,.5)'; for(let x = g.X0 + 4; x < g.X1; x += 8) rombo(c, x, fy + 2.5, 1.7); }
    if(g.H > T && s.pentole){
      const y = g.ya + g.H*0.18; c.fillStyle = '#5a4a3a'; c.fillRect(g.X0 + 6, y, g.W - 12, 2);
      for(let x = g.X0 + 14, k = 0; x < g.X1 - 10; x += 13 + fisso(k, f.y, 2)*8, k++){
        const tipo = fisso(k, f.y, 3);
        c.strokeStyle = '#3a2a1a'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x, y + 2); c.lineTo(x, y + 5); c.stroke();
        if(tipo < 0.45){ const r = 4 + fisso(k, f.y, 4)*2.5; c.fillStyle = '#b06a3a'; c.beginPath(); c.arc(x, y + 6 + r, r, 0, 7); c.fill(); c.fillStyle = 'rgba(255,220,180,.35)'; c.beginPath(); c.arc(x - r*0.35, y + 6 + r*0.7, r*0.35, 0, 7); c.fill(); c.fillStyle = '#7a4a2a'; c.fillRect(x - 1, y + 4, 2, 3); }
        else if(tipo < 0.75){ c.fillStyle = '#8a8f96'; c.fillRect(x - 0.7, y + 4, 1.4, 9); c.beginPath(); c.ellipse(x, y + 14, 2.8, 2, 0, 0, 7); c.fill(); }
        else { c.fillStyle = '#6a4a2e'; c.fillRect(x - 0.8, y + 4, 1.6, 8); c.fillStyle = '#9a7a52'; c.fillRect(x - 2.2, y + 11, 4.4, 4); }
      }
    }
    if(g.H > T && s.tubi){
      const y1 = g.ya + g.H*0.22;
      [y1, y1 + 6].forEach((y, i) => { c.fillStyle = i ? '#6a7a82' : '#8a6a4a'; c.fillRect(g.X0, y, g.W, 3); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(g.X0, y, g.W, 0.8); });
      for(let k = f.x0 + 1; k < f.x1; k += 3){ const x = k*T + 10; c.fillStyle = '#4a3a2a'; c.fillRect(x - 1, y1 - 1, 5, 5); c.fillStyle = '#b8483a'; c.beginPath(); c.arc(x + 1.5, y1 - 3, 2.6, 0, 7); c.fill(); }
    }
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(g.X0, g.yb - 2, g.W, 2);
  },
  quadri(c, g, s, f){
    FACCE.carta(c, g, s, f);
    if(g.H <= T) return;
    const FONDI = ['#2a3a2a', '#3a1e24', '#1e2a3e', '#3e3020', '#2a2236'];
    for(let k = f.x0, i = 0; k + 1 < f.x1; k += 3, i++){
      const w = T*1.25, h = g.H*0.5, cx = k*T + T, x = cx - w/2, y = g.ya + g.H*0.13;
      c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - 3, y - 1, w + 9, h + 8);
      const gr = c.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#e2c47a'); gr.addColorStop(0.5, '#9a7a3c'); gr.addColorStop(1, '#c9a35a');
      c.fillStyle = gr; c.fillRect(x - 4, y - 4, w + 8, h + 8);
      c.fillStyle = '#5a4420'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
      c.fillStyle = FONDI[(k*7 + f.y) % FONDI.length]; c.fillRect(x, y, w, h);
      const tipo = (k + f.y) % 3;
      if(tipo === 0){
        c.fillStyle = tinta(FONDI[(k + 2) % 5], 0.25); c.beginPath(); c.ellipse(cx, y + h, w*0.36, h*0.26, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#c9a888'; c.fillRect(cx - 2, y + h*0.6, 4, h*0.18); c.beginPath(); c.ellipse(cx, y + h*0.45, w*0.13, h*0.17, 0, 0, 7); c.fill();
        c.fillStyle = '#2a1e18'; c.beginPath(); c.ellipse(cx, y + h*0.36, w*0.14, h*0.1, 0, Math.PI, 0); c.fill();
      } else if(tipo === 1){
        c.fillStyle = '#3a5a6a'; c.fillRect(x, y, w, h*0.55);
        c.fillStyle = '#3e5a3a'; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h*0.6); c.quadraticCurveTo(x + w*0.3, y + h*0.38, x + w*0.6, y + h*0.58); c.quadraticCurveTo(x + w*0.8, y + h*0.45, x + w, y + h*0.55); c.lineTo(x + w, y + h); c.fill();
        c.fillStyle = 'rgba(240,230,200,.7)'; c.beginPath(); c.arc(x + w*0.75, y + h*0.22, 2.4, 0, 7); c.fill();
      } else {
        c.fillStyle = '#5a3a2a'; c.beginPath(); c.moveTo(cx - 4, y + h - 3); c.lineTo(cx + 4, y + h - 3); c.lineTo(cx + 3, y + h*0.6); c.lineTo(cx - 3, y + h*0.6); c.fill();
        [['#c43a4a', -4, 0.45], ['#e3b04a', 3, 0.42], ['#d8d0e8', 0, 0.35], ['#4f8a55', -1, 0.52]].forEach(([col, a, b]) => { c.fillStyle = col; c.beginPath(); c.arc(cx + a, y + h*b, 2.6, 0, 7); c.fill(); });
      }
      const lu = c.createLinearGradient(0, y, 0, y + h); lu.addColorStop(0, 'rgba(255,230,170,.18)'); lu.addColorStop(1, 'rgba(255,230,170,0)'); c.fillStyle = lu; c.fillRect(x, y, w, h);
      c.fillStyle = '#b8914e'; c.fillRect(cx - 8, y - 8, 16, 2.5);
    }
  },
  pannelli(c, g, s, f, M){
    c.fillStyle = s.pannello; c.fillRect(g.X0, g.ya, g.W, g.H);
    for(let x = g.X0; x < g.X1; x += 16){ c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x, g.ya, 1, g.H); c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(x + 1, g.ya, 1, g.H); c.fillStyle = 'rgba(200,210,220,.3)'; c.fillRect(x + 3, g.ya + 4, 1.2, 1.2); c.fillRect(x + 3, g.yb - 5, 1.2, 1.2); }
    for(let x = g.X0 + 6, k = 0; x < g.X1 - 4; x += 5, k++){ const q = fisso(k, f.y, 7); c.fillStyle = q < 0.5 ? 'rgba(120,220,150,.85)' : q < 0.75 ? 'rgba(240,190,90,.85)' : 'rgba(240,90,90,.85)'; c.fillRect(x, g.yb - g.H*0.28, 2, 2); }
    if(g.H > T && f.x1 - f.x0 >= 4){
      const w = Math.min(g.W - 24, 3.4*T), h = g.H*0.5, x = (g.X0 + g.X1)/2 - w/2, y = g.ya + g.H*0.12;
      c.fillStyle = '#122a33'; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(140,220,230,.55)'; c.lineWidth = 0.8; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      if(M && M.stanze.length > 3) miniPalazzo(c, M, x + 3, y + 3, w - 6, h - 6, 0, 'rgba(140,220,230,.75)');
    }
    c.strokeStyle = '#11161b'; c.lineWidth = 2; c.beginPath(); c.moveTo(g.X0, g.ya + 6); c.bezierCurveTo(g.X0 + g.W*0.3, g.ya + 10, g.X0 + g.W*0.6, g.ya + 3, g.X1, g.ya + 8); c.stroke();
  },
  vetro(c, g, s, f){
    const gr = c.createLinearGradient(0, g.ya, 0, g.yb); gr.addColorStop(0, '#0e1930'); gr.addColorStop(1, '#1e384a'); c.fillStyle = gr; c.fillRect(g.X0, g.ya, g.W, g.H);
    c.fillStyle = 'rgba(255,255,255,.6)'; for(let k = 0; k < g.W/10; k++) c.fillRect(g.X0 + fisso(k, f.y, 1)*g.W, g.ya + fisso(k, f.y, 2)*g.H*0.6, 0.8, 0.8);
    c.fillStyle = 'rgba(200,230,255,.07)'; for(let x = g.X0 - 20; x < g.X1; x += 26){ c.beginPath(); c.moveTo(x, g.yb); c.lineTo(x + 14, g.ya); c.lineTo(x + 22, g.ya); c.lineTo(x + 8, g.yb); c.fill(); }
    c.fillStyle = '#2a3330'; for(let x = g.X0; x <= g.X1; x += 16) c.fillRect(Math.min(x, g.X1 - 2), g.ya, 2, g.H);
    [0.34, 0.67].forEach(q => c.fillRect(g.X0, g.ya + g.H*q, g.W, 1.6)); c.fillRect(g.X0, g.ya, g.W, 3);
    for(let x = g.X0 + 4, k = 0; x < g.X1; x += 7, k++){ const h = 6 + fisso(k, f.y, 3)*12; c.fillStyle = k & 1 ? '#2f5a33' : '#3d7040'; c.beginPath(); c.ellipse(x, g.yb - h/2 - 3, 3.5, h/2, (fisso(k, f.y, 4) - 0.5)*0.8, 0, 7); c.fill(); }
    c.fillStyle = '#5a4a3a'; c.fillRect(g.X0, g.yb - 4, g.W, 4);
  },
  carte(c, g, s, f){
    c.fillStyle = s.legnoMuro; c.fillRect(g.X0, g.ya, g.W, g.H);
    for(let x = g.X0, k = 0; x < g.X1; x += 8, k++){ c.fillStyle = tinta(s.legnoMuro, fisso(Math.round(x), f.y, 1)*0.2 - 0.1); c.fillRect(x + 0.5, g.ya, 7, g.H); }
    zoccolo(c, g, '#2e2216', '#8a6a3e');
    if(g.H > T) for(let k = f.x0, i = 0; k < f.x1; k += 2, i++){
      const w = 18 + fisso(k, 3, 2)*8, h = 12 + fisso(k, 4, 2)*6, x = k*T + 4 + fisso(k, 1, 2)*6, y = g.ya + 7 + fisso(k, 2, 2)*5, a = (fisso(k, 5, 2) - 0.5)*0.12;
      c.save(); c.translate(x + w/2, y + h/2); c.rotate(a);
      c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-w/2 + 1, -h/2 + 1.5, w, h);
      c.fillStyle = i % 3 ? '#d8cba8' : '#c9b48a'; c.fillRect(-w/2, -h/2, w, h);
      c.strokeStyle = 'rgba(80,60,40,.5)'; c.lineWidth = 0.6; c.beginPath();
      for(let l = 0; l < 4; l++){ c.moveTo(-w/2 + 2, -h/2 + 3 + l*2.6); c.lineTo(w/2 - 2 - fisso(k, l, 6)*6, -h/2 + 3 + l*2.6); }
      c.stroke();
      if(i % 3 === 0){ c.strokeStyle = 'rgba(140,60,40,.6)'; c.beginPath(); c.moveTo(-w/2 + 3, h/2 - 3); c.bezierCurveTo(-2, -2, 3, 4, w/2 - 3, -h/2 + 3); c.stroke(); }
      c.fillStyle = '#b8483a'; c.beginPath(); c.arc(0, -h/2 + 1.5, 1.3, 0, 7); c.fill();
      c.restore();
    }
    c.strokeStyle = 'rgba(20,16,10,.8)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(g.X0, g.ya + 4); for(let x = g.X0; x < g.X1; x += 24) c.quadraticCurveTo(x + 12, g.ya + 8, Math.min(g.X1, x + 24), g.ya + 4); c.stroke();
  },
};
function faccia(c, f, M){
  const g = { X0:f.x0*T, X1:f.x1*T, yb:(f.y + 1)*T, H:f.h }; g.ya = g.yb - g.H; g.W = g.X1 - g.X0;
  (FACCE[f.st.muro] || FACCE.carta)(c, g, f.st, f, M);
  const gr = c.createLinearGradient(0, g.ya, 0, g.yb); gr.addColorStop(0, 'rgba(6,5,12,.5)'); gr.addColorStop(0.55, 'rgba(6,5,12,.12)'); gr.addColorStop(1, 'rgba(6,5,12,0)');
  c.fillStyle = gr; c.fillRect(g.X0, g.ya, g.W, g.H);
  c.fillStyle = '#4a3d52'; c.fillRect(g.X0, g.ya, g.W, 2); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(g.X0, g.ya + 2, g.W, 1);
  [[g.X0, g.X0 + 6], [g.X1, g.X1 - 6]].forEach(([a, b]) => { const s = c.createLinearGradient(a, 0, b, 0); s.addColorStop(0, 'rgba(0,0,0,.42)'); s.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = s; c.fillRect(Math.min(a, b), g.ya, 6, g.H); });
  f.torce.forEach(k => applique(c, (k + 0.5)*T, g.yb - Math.min(g.H*0.62, g.H - 9)));
}

// ── Un pezzo di pavimento: caselle, decori, ombre dei muri e dei mobili, facce dei muri ──
function cima(c, X, Y, tx, ty){
  c.fillStyle = '#1d1824'; c.fillRect(X, Y, T, T);
  c.fillStyle = 'rgba(255,255,255,.025)'; c.fillRect(X + fisso(tx, ty, 1)*T*0.6, Y + fisso(tx, ty, 2)*T*0.6, T*0.4, T*0.3);
}
const BASSA = [48, 92, 112], FONDA = [10, 28, 44];
function acquaFerma(c, X, Y, tx, ty, M){
  const { GW, GH } = M, P = prepara(M).prof, d = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH ? 6 : (P[y*GW + x] || 0);
  // la profondità agli angoli della casella (media delle quattro intorno), poi 4×4 quadretti sfumati
  const ang = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => (d(tx + a - 1, ty + b - 1) + d(tx + a, ty + b - 1) + d(tx + a - 1, ty + b) + d(tx + a, ty + b))/4);
  for(let j = 0; j < 4; j++) for(let i = 0; i < 4; i++){
    const u = (i + 0.5)/4, v = (j + 0.5)/4, q = Math.min(1, ((ang[0]*(1 - u) + ang[1]*u)*(1 - v) + (ang[2]*(1 - u) + ang[3]*u)*v)/4.5);
    c.fillStyle = 'rgb(' + Math.round(BASSA[0] + (FONDA[0] - BASSA[0])*q) + ',' + Math.round(BASSA[1] + (FONDA[1] - BASSA[1])*q) + ',' + Math.round(BASSA[2] + (FONDA[2] - BASSA[2])*q) + ')';
    c.fillRect(X + i*8, Y + j*8, 8.4, 8.4);
  }
  c.fillStyle = 'rgba(120,170,210,.06)'; for(let k = 0; k < 3; k++) c.fillRect(X + fisso(tx, ty, k)*T*0.7, Y + 4 + k*9 + fisso(tx, ty, k + 5)*4, 6 + fisso(tx, ty, k + 9)*10, 1.2);
}
function disegnaPezzo(c, M, A, i, j, res){
  const { GW, GH, PAV, ACQUA, BORDO } = M, x0 = i*PEZZO, y0 = j*PEZZO, L = PEZZO*T, X0 = x0*T, Y0 = y0*T;
  const xa = Math.max(0, x0), xb = Math.min(GW, x0 + PEZZO), ya = Math.max(0, y0), yb = Math.min(GH, y0 + PEZZO);
  const muro = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH || (PAV[y*GW + x] === -2 && !ACQUA[y*GW + x]);
  c.fillStyle = '#090b16'; c.fillRect(X0, Y0, L, L);
  for(let ty = ya; ty < yb; ty++) for(let tx = xa; tx < xb; tx++){
    const k = ty*GW + tx, p = PAV[k], X = tx*T, Y = ty*T;
    if(p === -2){ if(ACQUA[k]) acquaFerma(c, X, Y, tx, ty, M); else if(BORDO[k]) cima(c, X, Y, tx, ty); continue; }
    const st = stileDi(M, p); (PAVIMENTI[st.pav] || PAVIMENTI.semplice)(c, X, Y, tx, ty, st);
  }
  const tocca = (x, y, w, h, m) => !(x - m > x0 + PEZZO || x + w + m < x0 || y - m > y0 + PEZZO || y + h + m < y0);
  M.stanze.forEach((st, k) => { const s = stileDi(M, k); if(!s.terra || ![st].concat(st.parti || []).some(r => tocca(r.x, r.y, r.w, r.h, 1))) return;
    // i decori a terra restano dentro le caselle della stanza (rettangolo, parti, meno i tagli)
    c.save(); c.beginPath();
    for(let y = Math.max(0, y0 - 1); y < Math.min(GH, y0 + PEZZO + 1); y++){ let a = -1; for(let x = Math.max(0, x0 - 1); x <= Math.min(GW, x0 + PEZZO + 1); x++){ const dentro = x < GW && PAV[y*GW + x] === k; if(dentro && a < 0) a = x; if(!dentro && a >= 0){ c.rect(a*T, y*T, (x - a)*T, T); a = -1; } } if(a >= 0) c.rect(a*T, y*T, (Math.min(GW, x0 + PEZZO + 1) - a)*T, T); }
    c.clip(); s.terra(c, st, M); c.restore(); });
  M.corridoi.forEach(r => { if(tocca(r[0], r[1], r[2], r[3], 1)) terraCorridoio(c, r); });
  // ombre morbide ai piedi dei muri (quattro sfumature fatte una volta, spostate casella per casella)
  const sf = (x0, y0, x1, y1, a) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); return g; };
  const ao = [[sf(0, 0, 0, T*0.55, 0.5), 0, 0, T, T*0.55, 0, -1], [sf(0, 0, T*0.32, 0, 0.36), 0, 0, T*0.32, T, -1, 0], [sf(T, 0, T*0.68, 0, 0.36), T*0.68, 0, T*0.32, T, 1, 0], [sf(0, T, 0, T*0.75, 0.3), 0, T*0.75, T, T*0.25, 0, 1]];
  for(let ty = ya; ty < yb; ty++) for(let tx = xa; tx < xb; tx++){
    if(PAV[ty*GW + tx] === -2) continue;
    const X = tx*T, Y = ty*T;
    for(const [g, x, y, w, h, dx, dy] of ao) if(muro(tx + dx, ty + dy)){ c.translate(X, Y); c.fillStyle = g; c.fillRect(x, y, w, h); c.translate(-X, -Y); }
  }
  // ombre dei mobili
  M.ostacoli.forEach(o => {
    if(!tocca(o.x, o.y, o.w, o.h, 2)) return;
    const mod = MOBILI[o.t]; if(!mod) return;
    const b = mod.base(o.w*T, o.h*T), x = o.x*T + b[0], y = o.y*T + b[1] + 2, w = b[2], h = b[3];
    for(let k = 4; k >= 0; k--){
      const e = k*2.2; c.fillStyle = k ? 'rgba(0,0,0,.09)' : 'rgba(0,0,0,.3)'; c.beginPath();
      if(mod.tondo) c.ellipse(x + w/2, y + h/2, w/2 + e, h/2 + e*0.7, 0, 0, 7); else c.rect(x - e, y - e*0.6, w + 2*e, h + e*1.4);
      c.fill();
    }
  });
  // l'orlo chiaro della cima dei muri, verso il pavimento
  c.fillStyle = '#3a2f43';
  for(let ty = ya; ty < yb; ty++) for(let tx = xa; tx < xb; tx++){
    if(!BORDO[ty*GW + tx] || !muro(tx, ty)) continue;
    const X = tx*T, Y = ty*T, pv = (x, y) => !muro(x, y) && x >= 0 && y >= 0 && x < GW && y < GH && PAV[y*GW + x] !== -2;
    if(pv(tx - 1, ty)) c.fillRect(X, Y, 2, T);
    if(pv(tx + 1, ty)) c.fillRect(X + T - 2, Y, 2, T);
    if(pv(tx, ty - 1)) c.fillRect(X, Y, T, 2);
  }
  A.facce.forEach(f => { const yb2 = (f.y + 1)*T; if(f.x1*T < X0 || f.x0*T > X0 + L || yb2 < Y0 || yb2 - f.h > Y0 + L) return; faccia(c, f, M); });
}
// la tela di un pezzo: chiave = mappa, posto e risoluzione
function pezzo(M, i, j, res, soloSePronto){
  if(soloSePronto){ const e = TELE.get('P|' + M.nome + '|' + i + ',' + j + '|' + res); return e || null; }
  return prendi('P|' + M.nome + '|' + i + ',' + j + '|' + res, () => {
    const A = prepara(M), L = PEZZO*T, cv = document.createElement('canvas');
    cv.width = cv.height = Math.ceil(L*res);
    const c = cv.getContext('2d');
    c.setTransform(res, 0, 0, res, -i*L*res, -j*L*res);
    c.save(); c.beginPath(); c.rect(i*L, j*L, L, L); c.clip(); disegnaPezzo(c, M, A, i, j, res); c.restore();
    return { cv, px:cv.width*cv.height };
  });
}
// prepara in anticipo un pezzo che manca nel rettangolo (i0..i1, j0..j1); vero se ne ha fatto uno
function anticipa(M, i0, j0, i1, j1, res){
  const ni = Math.ceil(M.GW/PEZZO), nj = Math.ceil(M.GH/PEZZO);
  for(let j = Math.max(0, j0); j <= Math.min(nj - 1, j1); j++) for(let i = Math.max(0, i0); i <= Math.min(ni - 1, i1); i++){
    if(immCopre(M, i, j)) continue;   // c'è (o sta arrivando) l'immagine di Blender: il pezzo a codice non serve
    if(!TELE.has('P|' + M.nome + '|' + i + ',' + j + '|' + res)){ pezzo(M, i, j, res).nuovo = false; return true; }
  }
  return false;
}

// ── Il palazzo reso in Blender: immagini al posto del disegno a codice ──
// Il disegno a codice resta come riserva: con l'interruttore spento, o se l'indice o un'immagine non arrivano (rete, file che manca),
// si usa il disegno di sempre, pezzo per pezzo. Le immagini si scaricano solo quando servono: i pezzi sullo schermo e quelli appena fuori.
// Cartella (relativa alla pagina, come carte/giochi/ di SPeeD GAME): carte/lanterne/<mappa>/, con <mappa> = palazzo o atrio.
// Il formato vero (quello che consegna Blender, vedi LEGGIMI.txt del SanDisk), letto da immLeggi:
//   indice.json          { px_per_casella:64, pezzi:['p_5_4', ...],
//                          mobili:[{ k, tipo, x, y, w, h (caselle), extra, file, rect:{ x, y, w, h } (pixel) }, ...],
//                          animati:{ barca:{ file, rect, centro:[x, y], perno:[x, y] }, campana:{...}, ruota:{..., raggio} } }
//     · extra:false → è il mobile k di M.ostacoli (stesso ordine della mappa); file 'mobili/<k>.webp'
//     · extra:true  → oggetto di scena (sedia, vaso, lampione, sostegno della campana...): k è null, file 'mobili/x<n>.webp'.
//                     Non è un ostacolo e sta già nel fondo: il ritaglio serve solo a coprire chi passa dietro. Si ordina per profondità
//                     come i mobili, con la base nel bordo sud dell'impronta: (y + h) caselle.
//     · (vecchia forma, ancora letta) mobili:{ '<k>':[x, y, larg, alt] } e extra:[{ f, rett, base }]
//   p_<i>_<j>.webp       pezzo di 512×512 (8×8 caselle a 64 px per casella): caselle 8i…8i+7 e 8j…8j+7
//   mobili/<k>.webp      ritaglio con alfa del mobile k di M.ostacoli
//   animati/<nome>.webp  barca (dondola), campana (oscilla), ruota (gira col compito): NON stanno nel fondo, le muove il gioco
// Nell'indice tutti i pixel sono a 64 px per casella, dall'angolo in alto a sinistra della mappa; rect è dove sta l'immagine, perno è il punto
// attorno a cui ruota o dondola (barca: la linea dell'acqua; campana: il giogo; ruota: il centro).
// Il gioco è a 32 px per casella: le immagini si disegnano scalate a metà (sugli schermi ad alta densità restano nitide).
// (Non usare imageSmoothingQuality='high': provato a CPU ×4, i fotogrammi passano da 60 a 8-12 al secondo.)
const IMMAGINI_PALAZZO = true;    // l'interruttore: acceso dal 30/10 col palazzo intero e la sala d'attesa (mai stanze vere mescolate a stanze disegnate)
const IMM_VERSIONE = '5';                // da cambiare quando le immagini cambiano: il telefono non usa le vecchie
const IMM_CARTELLA = 'carte/lanterne/';
const IMM_IN_VOLO = 8;                   // scaricamenti insieme
let immVolo = 0, immReali = 0, immAcceso0;   // immReali: quante delle immagini in corso servono adesso a chi gioca (non le ha chieste il precarico)
const immCoda = [];                      // cosa scaricare: si prende dalla fine, così quello che serve adesso passa avanti
// con LT_PROVA, ?blender=1 accende e ?blender=0 spegne (per provare); altrimenti vale l'interruttore
function immAcceso(){
  if(immAcceso0 === undefined){
    let v = IMMAGINI_PALAZZO;
    try{ if(window.LT_PROVA){ const q = /[?&]blender=(\d)/.exec(location.search); if(q) v = q[1] === '1'; } }catch(e){}
    immAcceso0 = v;
  }
  return immAcceso0;
}
// lo stato delle immagini di una mappa (null se la mappa non ne ha o l'interruttore è spento)
function immMappa(M){
  if(!immAcceso()) return null;
  if(M._im === undefined){
    const nome = M === PALAZZO ? 'palazzo' : M === ATRIO ? 'atrio' : null;
    M._im = nome ? { nome, base:IMM_CARTELLA + nome + '/', stato:0, prove:0, riprova:0, quando:0, s:{}, f:{}, k:{}, sporco:true, ultQ:-1, pz:null, mobili:null, anim:null, extra:null, kk:0.5, ante:null, aP:null, aN:0, aDopo:0 } : null;
  }
  return M._im;
}
// stato dell'indice: 0 da scaricare · 1 in arrivo · 2 pronto · 3 non arrivato (si riprova) · 4 la mappa non ha immagini
function immIndice(m){
  if(m.stato === 1 || m.stato === 2 || m.stato === 4) return;
  if(m.stato === 3 && (m.prove >= 3 || performance.now() < m.riprova)) return;
  if(typeof fetch !== 'function' || (typeof location !== 'undefined' && location.protocol === 'file:')){ m.stato = 4; return; }   // (da file:// il browser non lascia leggere le immagini: resta il disegno a codice, senza errori in console)
  m.stato = 1; m.prove++;
  fetch(m.base + 'indice.json?v=' + IMM_VERSIONE).then(r => r.status === 404 ? 404 : r.ok ? r.json() : Promise.reject()).then(j => {
    if(j === 404){ m.stato = 4; return; }
    const ix = immLeggi(j); if(!ix){ m.stato = 4; return; }
    m.pz = ix.pz; m.mobili = ix.mobili; m.anim = ix.anim; m.extra = ix.extra; m.kk = ix.kk; m.fiamme = Array.isArray(j.fiamme) ? j.fiamme : []; m.stato = 2; m.sporco = true;
  }).catch(() => { m.stato = 3; m.riprova = performance.now() + 15000; });
}
// l'indice, letto con un po' di tolleranza (liste o oggetti), con le misure già nei pixel del gioco
function immLeggi(j){
  if(!j || typeof j !== 'object') return null;
  const kk = T/(+j.pixel_per_casella || +j.px_per_casella || +j.ppc || 64);
  // un rettangolo: [x, y, larg, alt] oppure { x, y, w, h } (anche dentro v.rect o v.rett), in pixel dell'indice → pixel del gioco
  const rett = v => {
    let r = Array.isArray(v) ? v : v && (v.rett || v.rect) ? (v.rett || v.rect) : v;
    if(r && !Array.isArray(r)) r = [r.x != null ? r.x : r.px, r.y != null ? r.y : r.py, r.w != null ? r.w : r.larg, r.h != null ? r.h : r.alt];
    return r && r.length >= 4 && r.every(n => typeof n === 'number' && isFinite(n)) ? { x:r[0]*kk, y:r[1]*kk, w:r[2]*kk, h:r[3]*kk } : null;
  };
  const pz = new Set();
  (j.pezzi || []).forEach(p => {   // ogni pezzo: 'p_5_4.webp' o '5_4', oppure [5, 4], oppure { i:5, j:4 }
    let a = null;
    if(Array.isArray(p)) a = p; else if(p && typeof p === 'object') a = [p.i, p.j]; else { const q = /(\d+)_(\d+)/.exec(String(p)); if(q) a = [+q[1], +q[2]]; }
    if(a && isFinite(a[0]) && isFinite(a[1]) && a[0] >= 0 && a[0] < 16) pz.add(a[1]*16 + a[0]);
  });
  if(!pz.size) return null;
  const mobili = new Map(), extra = [], lista = j.mobili || [];
  // (lista: una riga per mobile, con k e rect; oppure, nella vecchia forma, un oggetto { '<k>': [x, y, larg, alt] })
  (Array.isArray(lista) ? lista.map((v, i) => [v && v.k != null ? +v.k : i, v]) : Object.keys(lista).map(k => [+k, lista[k]])).forEach(([k, v]) => {
    const r = rett(v); if(!r) return;
    if(v && !Array.isArray(v) && (v.extra === true || (v.k == null && v.file))){   // oggetto di scena: non è in M.ostacoli
      if(!v.file) return;
      const base = isFinite(v.y) && isFinite(v.h) ? (+v.y + +v.h)*T : r.y + r.h;   // il bordo sud dell'impronta, in pixel del gioco
      extra.push({ f:String(v.file), x:r.x, y:r.y, w:r.w, h:r.h, base, fl:v.fiamme || [] });
    } else if(isFinite(k)){ r.fl = v.fiamme || []; mobili.set(k, r); }   // (fl: le fiamme vive di quel mobile, in caselle sullo schermo: le manda Blender)
  });
  (j.extra || []).forEach(v => { const r = rett(v); if(r && v.f) extra.push({ f:String(v.f), x:r.x, y:r.y, w:r.w, h:r.h, base:(v.base != null ? v.base*kk : r.y + r.h) }); });   // (vecchia forma)
  const anim = {}, an = j.animati || {};
  Object.keys(an).forEach(nome => {
    const a = an[nome], c = a && a.centro, r = rett(a); if(!c || !isFinite(c[0]) || !isFinite(c[1])) return;
    const p = a.perno;
    // r: dove sta l'immagine (se manca, si centra su `centro` con la misura del file); px, py: il perno (se manca, il centro)
    anim[nome] = { cx:c[0]*kk, cy:c[1]*kk, px:p ? p[0]*kk : null, py:p ? p[1]*kk : null, r };
  });
  return { pz, mobili, anim, extra, kk };
}
// l'immagine di una voce: se è in cache la dà, se no la mette in coda (una volta sola) e dà null
function immVoce(m, chiave, url){
  const e = cerca(m.k[chiave] || (m.k[chiave] = 'I|' + m.nome + '|' + chiave));
  if(e) return e.img;
  immAccoda(m, chiave, url); immPompa();
  return null;
}
function immAccoda(m, chiave, url, pre){
  if(immSosp && !pre) return;
  const st = m.s[chiave];
  if(st === 0 || st === 1 || st === 2) return;
  if(st === 3){ const f = m.f[chiave]; if(f.n >= 3 || performance.now() - f.t < 15000) return; }
  m.s[chiave] = 0; immCoda.push({ m, chiave, url:m.base + url + '?v=' + IMM_VERSIONE, pre:!!pre });
}
// Ogni file si scarica UNA volta (fetch) e si tiene in memoria come blob (circa 1,5 MB in tutto): le immagini si decodificano da lì,
// così anche se la rete rallenta, la cache del browser scade o la partita dura a lungo, un pezzo che serve di nuovo non ripassa dalla rete.
const immBlobP = new Map();    // indirizzo → promessa del blob (in arrivo o già arrivato)
const immBlobV = new Map();    // indirizzo → blob arrivato
const immOgg = new Map();      // indirizzo → indirizzo temporaneo del blob (per l'<img>)
const immNonCe = new Set();    // indirizzi che il server non ha (404): inutile riprovare
function immScarica(url){
  let p = immBlobP.get(url); if(p) return p;
  p = (typeof fetch === 'function' ? fetch(url).then(r => { if(r.status === 404 || r.status === 410) immNonCe.add(url); return r.ok ? r.blob() : null; }).catch(() => null) : Promise.resolve(null)).then(b => { if(b && b.size) immBlobV.set(url, b); else { b = null; immBlobP.delete(url); } return b; });
  immBlobP.set(url, p); return p;
}
function immOggetto(url, b){ let o = immOgg.get(url); if(!o){ o = URL.createObjectURL(b); immOgg.set(url, o); } return o; }
function immPompa(){
  const max = preKbs() < 300 ? 3 : IMM_IN_VOLO;   // su una rete lenta più file insieme non vanno più in fretta: lasciano solo indietro i messaggi del gioco
  while(immVolo < max && immCoda.length){
    const q = immCoda.pop(), m = q.m, chiave = q.chiave;
    if(m.s[chiave] !== 0) continue;
    m.s[chiave] = 1; immVolo++; if(!q.pre) immReali++;
    const im = new Image(); im.decoding = 'async';
    let daBlob = false;
    const fatto = ok => {
      immVolo--; if(!q.pre) immReali--;
      if(ok){
        im._t = immUltimo = performance.now();
        m.s[chiave] = 2; delete m.f[chiave];
        metti(m.k[chiave] || (m.k[chiave] = 'I|' + m.nome + '|' + chiave), { img:im, px:im.naturalWidth*im.naturalHeight, libera(){ delete m.s[chiave]; m.sporco = true; } });
      } else {
        if(daBlob){ immBlobV.delete(q.url); immBlobP.delete(q.url); immOgg.delete(q.url); }   // la copia in memoria non si legge: la prossima volta dalla rete
        m.s[chiave] = 3; const f = m.f[chiave] || (m.f[chiave] = { n:0, t:0 }); f.n++; f.t = performance.now();
      }
      immPompa();
    };
    const parti = src => {
      im.src = src;
      if(im.decode) im.decode().then(() => fatto(true), () => fatto(false)); else { im.onload = () => fatto(true); im.onerror = () => fatto(false); }
    };
    const b = immBlobV.get(q.url);
    if(b){ daBlob = true; parti(immOggetto(q.url, b)); }
    else immScarica(q.url).then(bb => { if(bb){ daBlob = true; parti(immOggetto(q.url, bb)); } else fatto(false); });   // (se lo sta già scaricando il precarico, si aspetta lui: mai due volte)
  }
}
// ── L'anteprima: tutta la mappa in piccolo, in un file solo (anteprima.webp, fatta da gioco/anteprima.py con i pezzi veri) ──
// Arriva per prima e sta sotto i pezzi che mancano: chi cammina verso una zona non ancora arrivata vede il palazzo sfocato, mai il vuoto né il disegno a codice.
// Il file scaricato non si tiene: resta una copia sola, decodificata fuori dal giro principale, e conta nel tetto delle tele. Esce dalla memoria quando
// tutti i pezzi sono arrivati; sul telefono piccolo, dove i pezzi entrano ed escono dalla cache, resta come rete.
// Se il file non c'è tutto va come prima: disegno a codice dove manca un pezzo, «pronto» solo a fine scaricamento.
const DISSOLVI = 200;   // ms: il pezzo vero entra in dissolvenza sopra l'anteprima
const IMM_FERMO = (() => { try{ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } })();   // chi non vuole movimento: il pezzo si cambia e basta
let immUltimo = 0;      // quando è arrivata l'ultima immagine (l'anteprima esce a dissolvenze finite)
let immSosp = false;    // chi rientra in partita: sotto il mini caricamento passa solo l'anteprima. La scena dietro segue ancora un altro: chiederebbe pezzi che non servono, davanti a quelli veri
function immSospendi(v){
  if(immSosp === !!v) return;
  immSosp = !!v;
  if(!v) (PRE.mappe || []).forEach(m => { m.sporco = true; });   // adesso si sa dove chiedere
}
function anteLeggi(b){
  const fatta = (img, w, h) => ({ img, w, h, px:w*h, size:b.size });
  const daImg = () => {
    const u = URL.createObjectURL(b), im = new Image(); im.decoding = 'async'; im.src = u;
    const p = im.decode ? im.decode() : new Promise((ok, no) => { im.onload = ok; im.onerror = no; });
    return p.then(() => { URL.revokeObjectURL(u); return fatta(im, im.naturalWidth, im.naturalHeight); }, () => { URL.revokeObjectURL(u); return null; });
  };
  return typeof createImageBitmap === 'function' ? createImageBitmap(b).then(x => fatta(x, x.width, x.height), daImg) : daImg();
}
// si chiede una volta sola, anche se la vogliono insieme il precarico e chi sta disegnando. Dà la promessa dell'anteprima, o null se per ora non si può chiedere
function antePrendi(m){
  if(m.ante || m.aP) return m.aP;
  const url = m.base + 'anteprima.webp?v=' + IMM_VERSIONE;
  if(immNonCe.has(url) || m.aN >= 3 || performance.now() < m.aDopo) return null;
  m.aN++;
  return m.aP = fetch(url).then(r => { if(r.status === 404 || r.status === 410) immNonCe.add(url); return r.ok ? r.blob() : null; }).then(b => b && b.size ? anteLeggi(b) : null).catch(() => null).then(a => {
    if(a){ m.ante = a; telePx += a.px; } else { m.aP = null; m.aDopo = performance.now() + 800; }
    return a;
  });
}
function immAnteprima(M){ const m = M._im; return m ? m.ante : null; }
// quanto è entrata un'immagine appena arrivata, da 0 a 1 (in uscita rapida, come --faro-ease). Senza anteprima sotto si cambia e basta, come sempre
function immDissolvi(m, im){
  if(!m.ante || IMM_FERMO) return 1;
  const a = (performance.now() - im._t)/DISSOLVI;
  return a >= 1 ? 1 : a <= 0 ? 0 : 1 - Math.pow(1 - a, 3);
}
// tutti i pezzi di questa mappa sono in memoria, a dissolvenze finite: l'anteprima lascia il posto
function anteLascia(m){
  if(!m.ante || m.stato !== 2 || performance.now() - immUltimo < 2*DISSOLVI) return;
  for(const n of m.pz){ const k = m.k['p' + (n % 16) + '_' + ((n / 16) | 0)]; if(!k || !TELE.has(k)) return; }
  const a = m.ante; m.ante = null; m.aFatta = true; telePx -= a.px; if(a.img.close) a.img.close();
}
// la coda di quello che serve a chi gioca non vale più (si è appena scoperto dove sono, e le immagini chieste intorno alla fontana starebbero davanti a quelle vere): si ricomincia da quello che serve adesso
function immCodaDaCapo(){
  const resta = [];
  for(const q of immCoda){ if(q.pre) resta.push(q); else { if(q.m.s[q.chiave] === 0) delete q.m.s[q.chiave]; q.m.sporco = true; } }
  immCoda.length = 0; immCoda.push(...resta);
}
// le immagini di una mappa, se sono accese e l'indice è arrivato (se no null: si disegna a codice; l'indice parte da solo)
function immPronta(M){
  try{
    const m = immMappa(M); if(!m) return null;
    if(m.stato !== 2){ immIndice(m); return null; }
    const ora = performance.now();
    if(ora > m.quando){ m.quando = ora + 5000; if(Object.keys(m.f).length) m.sporco = true; }   // chi non è arrivato si riprova (ogni 15 s, al massimo 3 volte)
    return m;
  }catch(e){ immAcceso0 = false; return null; }   // rete di sicurezza: se qualcosa va storto le immagini si spengono e resta il disegno a codice
}
// vero se i pezzi di questa mappa li coprono le immagini (o l'indice sta arrivando): allora il pezzo a codice non va preparato in anticipo
function immCopre(M, i, j){
  if(!immAcceso() || !M._im) return false;
  const m = M._im; return m.stato === 1 || (m.stato === 2 && m.pz.has(j*16 + i));
}
// il pezzo i, j come immagine (null se non c'è o non è ancora arrivato: allora resta il disegno a codice)
function immPezzo(m, i, j){
  const n = j*16 + i; if(!m.pz.has(n)) return null;
  return immVoce(m, 'p' + i + '_' + j, 'p_' + i + '_' + j + '.webp');
}
// chiede le immagini che servono nel rettangolo di pezzi (i0..i1, j0..j1), più un anello intorno (anello = 1): i pezzi e poi i mobili, quelli sullo schermo per primi
function immChiedi(m, M, i0, j0, i1, j1, anello){
  if(!m || m.stato !== 2) return;
  try{ immChiedi0(m, M, i0, j0, i1, j1, anello); }catch(e){ immAcceso0 = false; }   // (come sopra)
}
function immChiedi0(m, M, i0, j0, i1, j1, anello){
  const gioca = anello && m.nome === 'palazzo';   // qualcuno sta camminando qui (dalla sala d'attesa si chiede il palazzo senza anello, solo intorno alla fontana)
  if(PRE.liv === 2) anello = 0;   // col caricamento a tutto schermo l'anello passa dopo: sulla pila finirebbe sopra a quello che si sta aspettando
  const q = (((i0 + 2)*256 + j0 + 2)*256 + i1 + 2)*256 + j1 + 2 + (anello ? 4294967296 : 0);   // il rettangolo, in un numero solo
  if(q === m.ultQ && !m.sporco) return;
  m.ultQ = q; m.sporco = false;
  antePrendi(m);
  const L = PEZZO*T, ni = Math.ceil(M.GW/PEZZO), nj = Math.ceil(M.GH/PEZZO);
  if(gioca) preVerso(m, (i0 + i1 + 1)*L/2, (j0 + j1 + 1)*L/2);
  const tocca = (r, a) => r.x < (i1 + 1 + a)*L && r.x + r.w > (i0 - a)*L && r.y < (j1 + 1 + a)*L && r.y + r.h > (j0 - a)*L;
  const pezzi = a => { for(let j = Math.max(0, j0 - a); j <= Math.min(nj - 1, j1 + a); j++) for(let i = Math.max(0, i0 - a); i <= Math.min(ni - 1, i1 + a); i++){
    if(a && i >= i0 && i <= i1 && j >= j0 && j <= j1) continue; if(m.pz.has(j*16 + i)) immAccoda(m, 'p' + i + '_' + j, 'p_' + i + '_' + j + '.webp'); } };
  const altro = a => {
    m.mobili.forEach((r, k) => { if(tocca(r, a) && !(a && tocca(r, 0))) immAccoda(m, 'm' + k, 'mobili/' + k + '.webp'); });
    m.extra.forEach((e, n) => { if(tocca(e, a) && !(a && tocca(e, 0))) immAccoda(m, 'e' + n, e.f); });
    for(const nome in m.anim){ const A = m.anim[nome], r = { x:A.cx - 40, y:A.cy - 40, w:80, h:80 }; if(tocca(r, a) && !(a && tocca(r, 0))) immAccoda(m, 'a_' + nome, 'animati/' + nome + '.webp'); }
  };
  if(anello){ altro(1); pezzi(1); }   // l'anello, in fondo alla pila: arriva per ultimo
  altro(0); pezzi(0);                 // quello che si vede: in cima, arriva per primo
  immPompa();
}
// i pezzi di fondo di Blender che coprono il mobile k sono tutti arrivati? Allora il mobile è già nel fondo (e anche la sua ombra):
// se il suo ritaglio non c'è ancora, non si disegna quello a codice sopra il render (il ritaglio serve solo a coprire chi passa dietro)
function immFondoCopre(M, k){
  const m = M._im; if(!m || !immAcceso()) return false;
  if(m.ante && (m.stato !== 2 || m.mobili.has(k))) return true;   // nell'anteprima il mobile c'è già
  if(m.stato !== 2) return false;
  const r = m.mobili.get(k); if(!r) return false;   // senza ritaglio nell'indice non sappiamo dov'è: resta a codice
  const L = PEZZO*T;
  for(let j = Math.floor(r.y/L); j <= Math.floor((r.y + r.h - 0.01)/L); j++) for(let i = Math.floor(r.x/L); i <= Math.floor((r.x + r.w - 0.01)/L); i++){
    if(!m.pz.has(j*16 + i)) continue;   // pezzo tutto nero: non c'è nell'indice
    const ch = 'p' + i + '_' + j;
    if(!cerca(m.k[ch] || (m.k[ch] = 'I|' + m.nome + '|' + ch))) return false;
  }
  return true;
}
// il ritaglio del mobile k di M.ostacoli: { img, x, y, w, h } nei pixel del gioco (null se non c'è o non è arrivato)
function immMobile(M, k){
  const m = M._im; if(!m || m.stato !== 2 || !immAcceso()) return null;
  const r = m.mobili.get(k); if(!r) return null;
  const img = immVoce(m, 'm' + k, 'mobili/' + k + '.webp');
  return img ? { img, x:r.x, y:r.y, w:r.w, h:r.h, fl:r.fl } : null;
}
// gli oggetti di scena (extra) da mettere in ordine di profondità insieme ai mobili
function immExtra(m){ return m && m.stato === 2 ? m.extra : []; }
function disegnaExtra(c, m, n, t){
  const e = m.extra[n], img = immVoce(m, 'e' + n, e.f); if(!img) return;
  const g = c.globalAlpha; c.globalAlpha = g*immDissolvi(m, img); c.drawImage(img, e.x, e.y, e.w, e.h); c.globalAlpha = g;
  fiammeDi(c, e.fl, t || 0, 100 + n);
}
// un'immagine animata (barca, campana, ruota): centro e perno dal file indice; dx, dy spostano, ang gira intorno al perno. Vero se l'ha disegnata.
function immAnimata(c, M, nome, dx, dy, ang){
  const m = M._im; if(!m || m.stato !== 2 || !immAcceso()) return false;
  const a = m.anim[nome]; if(!a) return false;
  const img = immVoce(m, 'a_' + nome, 'animati/' + nome + '.webp'); if(!img) return false;
  const r = a.r || { x:a.cx - (img.naturalWidth||img.width)*m.kk/2, y:a.cy - (img.naturalHeight||img.height)*m.kk/2, w:(img.naturalWidth||img.width)*m.kk, h:(img.naturalHeight||img.height)*m.kk };   // dove sta l'immagine
  const px = a.px != null ? a.px : a.cx, py = a.py != null ? a.py : nome === 'campana' ? r.y : a.cy;   // la campana si appende in alto, il resto gira dal centro
  c.save(); c.translate(px + (dx || 0), py + (dy || 0)); if(ang) c.rotate(ang);
  c.drawImage(img, r.x - px, r.y - py, r.w, r.h); c.restore();
  return true;
}
// l'indice ha questa immagine animata (anche se il file non è ancora arrivato)? Serve a non disegnare a codice una parte che sta per arrivare
function immIndiceHa(M, nome){
  const m = M._im; return !!(m && m.stato === 2 && immAcceso() && m.anim[nome]);
}
// c'è l'immagine animata e (se ancora non è arrivata) la si chiede? Serve a scegliere tra immagine e disegno a codice
function immHa(M, nome){
  const m = M._im; if(!m || m.stato !== 2 || !immAcceso() || !m.anim[nome]) return false;
  return !!immVoce(m, 'a_' + nome, 'animati/' + nome + '.webp');
}

// ── Il precarico: nella saletta si scarica tutto il palazzo ──
// Appena si entra parte lo scaricamento di TUTTE le immagini (indici, anteprime, pezzi, ritagli, oggetti di scena, animati), pochi file alla volta
// (3, per non rallentare la saletta; 8 quando si sta solo aspettando il caricamento). Ogni file resta in memoria come blob.
// Si decodifica tutto quando il telefono ha memoria (navigator.deviceMemory > 2, o sconosciuta come su iPhone); con poca memoria
// solo l'atrio e i pezzi intorno alla fontana, da dove si parte. Il resto si decodifica in un attimo dalla memoria, quando serve.
// «Pronto» = l'anteprima del palazzo, l'atrio e i pezzi intorno alla fontana, arrivati e decodificati. Il resto continua dietro, anche a partita
// cominciata, prima quello vicino a chi cammina: nel frattempo si vede l'anteprima. Se l'anteprima non c'è, «pronto» = tutto scaricato (o perso).
// Senza immagini (interruttore spento, indice che manca, da file://) è pronto subito: si parte a codice senza aspettare.
const PRE = { avviato:false, spento:false, tier:'tutto', liv:1, volo:0, scarico:[], lista:[], voci:[], pronto:false, giro:null, t0:0, pct:0, vAnte:null };
const PRE_STIMA = { atrio:63, palazzo:68 };   // il peso che si conta per una mappa finché il suo indice non è arrivato (pezzo = 5, ritaglio = 1)
const PRE_GRANDE = 8192;   // la velocità della rete si misura sui file da qui in su: su quelli piccoli si misurerebbe solo la latenza
function preAttivo(){
  try{
    if(!immAcceso() || typeof fetch !== 'function' || typeof location === 'undefined' || location.protocol === 'file:') return false;
    if(window.LT_PROVA && /[?&]precarico=0/.test(location.search)) return false;   // (solo per le prove: precarico spento)
    return true;
  }catch(e){ return false; }
}
function precaricoAvvia(){
  if(PRE.avviato) return; PRE.avviato = true; PRE.t0 = performance.now();
  if(window.LT_PROVA) window.LT_PRE = { stato:precaricoStato, voci:() => PRE.voci.filter(v => !v.ante).length, decodificate:() => { let n = 0; for(const k of TELE.keys()) if(k.charCodeAt(0) === 73) n++; return n; }, blob:() => immBlobV.size, kb:() => { let n = 0; immBlobV.forEach(b => { n += b.size; }); return Math.round(n/1024); }, teleExtra:() => teleExtra, tele:() => telePx, ante:() => (PRE.mappe || []).map(m => [m.nome, m.ante ? m.ante.px : 0, m.ante ? Math.round(m.ante.size/1024) : 0]) };   // (per le prove a schermo)
  if(!preAttivo()){ PRE.spento = true; return; }
  const dm = navigator.deviceMemory;   // solo Chrome: 0,25 … 8 (GB, arrotondati). Safari non lo dice.
  PRE.tier = dm && dm <= 2 ? 'vicino' : 'tutto';
  if(PRE.tier === 'tutto') teleExtra = 8e6;   // tutto il palazzo decodificato sta nel tetto: niente uscite dalla cache
  PRE.mappe = [ATRIO, PALAZZO].map(M => immMappa(M)).filter(Boolean);
  if(!PRE.mappe.length){ PRE.spento = true; return; }
  PRE.mappe.forEach(m => { if(m.nome === 'atrio') antePrendi(m); });   // subito, senza aspettare l'indice: è quello che si ha davanti appena si entra
  PRE.giro = setInterval(preGiro, 150); preGiro();
}
// quanto in fretta si scarica: 0 = a partita cominciata (uno alla volta, il gioco ha la precedenza; 2 se la rete è buona), 1 = nella saletta (3 insieme),
// 2 = si sta solo aspettando il caricamento a tutto schermo (8 insieme). Con una rete lentissima si scende ancora (vedi prePompa).
function precaricoFretta(liv){ PRE.liv = liv === true ? 2 : liv === false ? 1 : liv; }
// quanto va la rete, in KB/s: la velocità di ogni file (byte diviso il tempo che ci ha messo), moltiplicata per quanti ne scaricavano insieme, sugli ultimi 8 file grandi.
function preKbs(){
  const r = PRE.scarico; if(r.length < 3) return Infinity;
  let kb = 0, ms = 0, k = 0; for(const x of r){ kb += x[1]; ms += x[2]; k += x[3]; }
  return ms > 0 ? kb / ms * 1000 * (k / r.length) / 1024 : Infinity;
}
// la rete è lentissima? Sotto i 50 KB/s più file insieme non danno più velocità ma i messaggi del gioco restano indietro: allora uno alla volta.
function preLenta(){ return preKbs() < 50; }
function preGiro(){
  try{ preGiro0(); }catch(e){ PRE.spento = true; clearInterval(PRE.giro); }   // rete di sicurezza: se qualcosa va storto il precarico si ferma e il gioco resta com'è
}
function preGiro0(){
  for(const m of PRE.mappe){
    if(m.stato !== 2 && m.stato !== 4) immIndice(m);   // (parte da solo; se non arriva, riprova da solo)
    if(m.stato === 2 && !m.preFatta) preCostruisci(m);
  }
  const risolti = PRE.mappe.every(m => m.stato !== 0 && m.stato !== 1);
  prePompa();
  // quello che serve per partire dev'essere decodificato: se non è in coda, si rimette
  let coreOk = true;
  for(const v of PRE.voci){
    if(!v.attendi || v.perso || v.ante) continue;
    if(!v.ok){ coreOk = false; continue; }
    if(!immPronta0(v.m, v.chiave)){ coreOk = false; if(v.m.s[v.chiave] === undefined) immAccoda(v.m, v.chiave, v.rel, true); }
  }
  const finita = !PRE.lista.length && !PRE.volo, aV = PRE.vAnte;
  if(!PRE.pronto && risolti && coreOk && (finita || (aV && aV.m.ante))){ PRE.pronto = true; PRE.tPronto = performance.now(); }
  if(PRE.pronto && finita && PRE.mappe.every(m => m.stato === 2 || m.stato === 4)){   // tutto scaricato: l'anteprima esce, se non serve più, e il giro si ferma
    if(!PRE.tFine) PRE.tFine = performance.now();
    const persi = PRE.voci.some(v => v.perso);
    if(PRE.tier === 'tutto' && !persi) PRE.mappe.forEach(anteLascia);
    if(persi || PRE.tier !== 'tutto' || PRE.mappe.every(m => !m.ante) || performance.now() - PRE.tFine > 30000) clearInterval(PRE.giro);
  }
  immPompa();   // (le decodifiche messe in coda partono anche se nessuno sta disegnando: l'host in attesa, la pagina in secondo piano)
}
// a partita cominciata quello che resta arriva prima vicino a chi cammina; l'atrio, che ormai serve solo alla prossima partita, per ultimo
const preOrdine = (a, b) => (a.pri - b.pri) || (a.d - b.d);
function preVerso(m, x, y){
  if(!PRE.lista.length) return;
  for(const v of PRE.lista){ v.pri = v.m !== m ? 9 : v.ante ? 0 : 1; v.d = Math.hypot(v.x - x, v.y - y); }
  PRE.lista.sort(preOrdine);
}
// pochi scaricamenti insieme; appena uno finisce parte il prossimo (senza aspettare il giro); chi è fallito aspetta un po' (al massimo 3 tentativi)
function prePompa(){
  if(immSosp) return;
  const ora = performance.now();
  let max = PRE.liv === 2 ? 8 : PRE.liv === 0 ? (preKbs() < 300 ? 1 : 2) : 3;
  if(PRE.scarico.length < 3) max = Math.min(max, PRE.liv === 2 ? 3 : 1);   // si parte piano: i primi file uno alla volta, per capire quanto va la rete
  else if(preLenta()) max = Math.min(max, PRE.liv === 2 ? 2 : 1);
  else if(preKbs() < 300) max = Math.min(max, 3);
  if(immReali > 0) max = Math.min(max, 1);   // se chi gioca ha bisogno di qualcosa adesso, il precarico si fa da parte (passa uno alla volta)
  if(PRE.liv !== 2 && PRE.pausaFino > ora) return;   // rete lentissima: fra un file e l'altro un respiro, perché i messaggi del gioco passino
  while(PRE.volo < max){
    const n = PRE.lista.findIndex(v => !v.dopo || v.dopo <= ora); if(n < 0) break;
    const v = PRE.lista.splice(n, 1)[0]; PRE.volo++; v.t0 = performance.now(); v.k = PRE.volo;
    (v.ante ? antePrendi(v.m) || Promise.resolve(null) : immScarica(v.url)).then(b => {
      PRE.volo--; if(PRE.liv !== 2 && preLenta()) PRE.pausaFino = performance.now() + 300;
      if(b){ v.ok = true; if(b.size >= PRE_GRANDE){ PRE.scarico.push([performance.now(), b.size, performance.now() - v.t0, v.k]); if(PRE.scarico.length > 8) PRE.scarico.shift(); } if(!v.ante && (v.core || PRE.tier === 'tutto')){ immAccoda(v.m, v.chiave, v.rel, true); immPompa(); } }
      else if(!immNonCe.has(v.url) && ++v.prove < 3){ v.dopo = performance.now() + 900*v.prove; PRE.lista.push(v); }
      else v.perso = true;   // non arriva: resterà il disegno a codice (e il gioco ci riprova da solo quando serve)
      v.fatto = !!(b || v.perso);
      try{ prePompa(); }catch(e){}
    });
  }
}
// l'immagine è decodificata (o ha già provato e non è arrivata: allora si disegna a codice e non si aspetta)?
function immPronta0(m, chiave){ const k = m.k[chiave]; return (!!k && TELE.has(k)) || m.s[chiave] === 3; }
function preCostruisci(m){
  m.preFatta = true;
  const L = PEZZO*T, fi = Math.floor(FONTANA.x/L), fj = Math.floor(FONTANA.y/L), atrio = m.nome === 'atrio';
  const vicino = r => r.x < (fi + 2)*L && r.x + r.w > (fi - 1)*L && r.y < (fj + 2)*L && r.y + r.h > (fj - 1)*L;   // i 3×3 pezzi intorno alla fontana
  const voci = [];
  // core: si decodifica subito anche sul telefono piccolo. attendi: «pronto» lo aspetta. I ritagli del palazzo non si aspettano: il mobile è già nel fondo, il ritaglio serve a coprire chi gli passa dietro
  const aggiungi = (chiave, rel, peso, core, attendi, pri, x, y) => voci.push({ m, chiave, rel, url:m.base + rel + '?v=' + IMM_VERSIONE, peso, core:atrio || core, attendi:atrio || attendi, pri:atrio ? 1 : pri, x, y, d:Math.hypot(x - FONTANA.x, y - FONTANA.y), prove:0, ok:false, perso:false, fatto:false });
  m.pz.forEach(n => { const i = n % 16, j = (n / 16) | 0, q = i >= fi - 1 && i <= fi + 1 && j >= fj - 1 && j <= fj + 1; aggiungi('p' + i + '_' + j, 'p_' + i + '_' + j + '.webp', 5, q, q, q ? 3 : 4, (i + 0.5)*L, (j + 0.5)*L); });
  m.mobili.forEach((r, k) => aggiungi('m' + k, 'mobili/' + k + '.webp', 1, vicino(r), false, 4, r.x + r.w/2, r.y + r.h/2));
  m.extra.forEach((e, n) => aggiungi('e' + n, e.f, 1, vicino(e), false, 4, e.x + e.w/2, e.y + e.h/2));
  for(const nome in m.anim){ const A = m.anim[nome]; aggiungi('a_' + nome, 'animati/' + nome + '.webp', 1, true, true, 3, A.cx, A.cy); }   // (non stanno nel fondo: nell'anteprima non ci sono)
  aggiungi('ante', 'anteprima.webp', atrio ? 2 : 20, true, true, 2, FONTANA.x, FONTANA.y);
  const a = voci[voci.length - 1]; a.ante = true; a.pri = atrio ? 0 : 0.5; if(!atrio) PRE.vAnte = a;
  m.preTot = voci.reduce((s, v) => s + v.peso, 0);
  m.preAttendi = voci.reduce((s, v) => s + (v.attendi ? v.peso : 0), 0);
  PRE.voci.push(...voci); PRE.lista.push(...voci);
  // prima le due anteprime (sul telefono lento la partita può partire prima che finisca l'atrio: senza quella del palazzo resterebbe il caricamento), poi l'atrio che si ha davanti, poi i pezzi del palazzo intorno alla fontana, poi il resto dal più vicino al più lontano
  PRE.lista.sort(preOrdine);
}
// com'è messo: pct 0…100 (99 finché non è pronto, mai indietro), pronto, tutto (ogni file è arrivato), quanti file non sono arrivati
function precaricoStato(){
  if(!PRE.avviato || PRE.spento) return { attivo:false, pct:100, pronto:true, tutto:true, tier:PRE.tier, persi:0 };
  const solo = !(PRE.vAnte && PRE.vAnte.perso);   // con l'anteprima si conta solo quello che «pronto» aspetta; senza, tutto
  let tot = 0, fatto = 0, persi = 0;
  for(const m of PRE.mappe) tot += m.preFatta ? (solo ? m.preAttendi : m.preTot) : PRE_STIMA[m.nome] || 0;
  for(const v of PRE.voci){ if((!solo || v.attendi) && (v.fatto || immBlobV.has(v.url))) fatto += v.peso; if(v.perso) persi++; }   // (conta anche quello che è arrivato perché serviva subito a chi gioca)
  PRE.pct = Math.max(PRE.pct, tot ? Math.min(99, Math.floor(100*fatto/tot)) : 0);
  return { attivo:true, pct:PRE.pronto ? 100 : PRE.pct, pronto:PRE.pronto, tutto:!!PRE.tFine, tier:PRE.tier, persi, secondi:+(((PRE.tPronto || performance.now()) - PRE.t0)/1000).toFixed(1), secondiTutto:+(((PRE.tFine || performance.now()) - PRE.t0)/1000).toFixed(1) };   // (secondi: da quando è partito il precarico a quando è stato pronto, o a adesso)
}
// le immagini intorno a un punto (quello che si vede e un poco di più) sono già decodificate? Le chiede, se mancano.
// Vero anche se la mappa non ha immagini o non sono arrivate (resta il disegno a codice, senza aspettare). Falso solo mentre si aspetta davvero.
function immIntorno(M, x, y, mw, mh, cerco){   // mw, mh: metà della larghezza e dell'altezza che si vede (pixel del gioco); senza, una finestra larga. cerco: non so ancora dove sono, non si chiedono pezzi
  // Risposta { ok, pct }: ok = tutto pronto (o niente da aspettare); pct = quante di quelle immagini sono già pronte. Con l'anteprima basta lei: i pezzi veri arrivano dopo, in dissolvenza
  try{
    const m = immMappa(M); if(!m) return { ok:true, pct:100 };
    if(m.stato !== 2) immIndice(m);
    if(m.stato !== 4) antePrendi(m);
    if(m.ante) return { ok:true, pct:100 };
    if(m.aP && !m.aFatta) return { ok:false, pct:m.stato === 2 ? 50 : 0 };
    if(m.stato !== 2){ const ok = m.stato !== 0 && m.stato !== 1; return { ok, pct:ok ? 100 : 0 }; }
    if(cerco) return { ok:false, pct:0 };
    const L = PEZZO*T, ni = Math.ceil(M.GW/PEZZO), nj = Math.ceil(M.GH/PEZZO);
    const hw = mw ? mw + 4*T : 13*T, hh = mh ? mh + 4*T : 10*T;   // quello che si vede, più mezzo pezzo
    const i0 = Math.max(0, Math.floor((x - hw)/L)), i1 = Math.min(ni - 1, Math.floor((x + hw)/L)), j0 = Math.max(0, Math.floor((y - hh)/L)), j1 = Math.min(nj - 1, Math.floor((y + hh)/L));
    const s = immSosp; immSosp = false; immChiedi(m, M, i0, j0, i1, j1, 1); immSosp = s;
    let tot = 0, manca = 0;
    const conta = chiave => { tot++; if(!immPronta0(m, chiave)) manca++; };
    for(let j = j0; j <= j1; j++) for(let i = i0; i <= i1; i++) if(m.pz.has(j*16 + i)) conta('p' + i + '_' + j);
    const tocca = r => r.x < (i1 + 1)*L && r.x + r.w > i0*L && r.y < (j1 + 1)*L && r.y + r.h > j0*L;
    m.mobili.forEach((r, k) => { if(tocca(r)) conta('m' + k); });
    m.extra.forEach((e, n) => { if(tocca(e)) conta('e' + n); });
    return { ok:manca === 0, pct:tot ? Math.floor(100*(tot - manca)/tot) : 100 };
  }catch(e){ return { ok:true, pct:100 }; }
}

// ── Mobili: ogni tipo ha l'altezza, l'impronta dell'ombra, il disegno fermo e (se serve) la parte viva ──
function cubo(c, x, y, w, d, h, sopra, davanti, z0){
  z0 = z0 || 0;
  const fy = y + d - h, fh = h - z0;
  if(fh > 0){ const g = c.createLinearGradient(0, fy, 0, fy + fh); g.addColorStop(0, davanti); g.addColorStop(1, tinta(davanti, -0.32)); c.fillStyle = g; c.fillRect(x, fy, w, fh); }
  c.fillStyle = sopra; c.fillRect(x, y - h, w, d);
  c.fillStyle = 'rgba(255,240,215,.16)'; c.fillRect(x, fy - 0.6, w, 1.2);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, y - h, 1, d + fh); c.fillRect(x + w - 1, y - h, 1, d + fh);
}
function cilindro(c, cx, cy, rx, ry, h, sopra, lato){
  const g = c.createLinearGradient(cx - rx, 0, cx + rx, 0); g.addColorStop(0, tinta(lato, -0.45)); g.addColorStop(0.35, tinta(lato, 0.12)); g.addColorStop(1, tinta(lato, -0.55));
  c.fillStyle = g; c.beginPath(); c.moveTo(cx - rx, cy - h); c.lineTo(cx - rx, cy); c.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); c.lineTo(cx + rx, cy - h); c.closePath(); c.fill();
  c.fillStyle = sopra; c.beginPath(); c.ellipse(cx, cy - h, rx, ry, 0, 0, 7); c.fill();
}
function tavola(c, x, y, w, d, h, col){
  c.fillStyle = tinta(col, -0.5); c.fillRect(x + 2, y - h + 4, 3, h - 4); c.fillRect(x + w - 5, y - h + 4, 3, h - 4);
  c.fillStyle = tinta(col, -0.3); c.fillRect(x + 2, y + d - h, 3.5, h); c.fillRect(x + w - 5.5, y + d - h, 3.5, h);
  c.fillStyle = col; c.fillRect(x, y - h, w, d);
  c.fillStyle = tinta(col, -0.22); c.fillRect(x, y + d - h, w, 4);
  c.fillStyle = 'rgba(255,240,215,.14)'; c.fillRect(x, y + d - h - 0.6, w, 1);
}
// una forma qualunque alzata da terra: tanti strati uno sopra l'altro, l'ultimo è il coperchio
function estrudi(c, forma, z0, z1, col){
  for(let z = z0; z < z1; z++){ c.save(); c.translate(0, -z); c.fillStyle = tinta(col, -0.3 + 0.45*(z - z0)/(z1 - z0)); c.fill(forma); c.restore(); }
}
function muroMattoni(c, x, y, w, h, col){
  c.fillStyle = tinta(col, -0.45); c.fillRect(x, y, w, h);
  for(let r = 0, yy = y; yy < y + h; r++, yy += 5) for(let xx = x - (r & 1)*5; xx < x + w; xx += 10){
    const a = Math.max(x, xx + 0.5), b = Math.min(x + w, xx + 9.5);
    if(b > a){ c.fillStyle = tinta(col, fisso(Math.round(xx), r, 3)*0.24 - 0.12); c.fillRect(a, yy + 0.5, b - a, Math.min(4, y + h - yy - 0.5)); }
  }
}
function ruota(c, cx, cy, r, n, col, ang){
  c.save(); c.translate(cx, cy); c.scale(1, 0.8);
  c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(1, 3, r + 3, 0, 7); c.fill();
  c.rotate(ang);
  c.fillStyle = col;
  for(let k = 0; k < n; k++){ c.save(); c.rotate(k/n*Math.PI*2); c.fillRect(-r*0.16, -r - 4, r*0.32, 6); c.restore(); }
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
  c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.arc(0, 0, r*0.72, 0, 7); c.fill();
  c.fillStyle = col; for(let k = 0; k < 2; k++){ c.save(); c.rotate(k*Math.PI/2); c.fillRect(-r*0.09, -r*0.72, r*0.18, r*1.44); c.restore(); }
  c.fillStyle = 'rgba(255,240,200,.35)'; c.beginPath(); c.arc(0, 0, r*0.2, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,240,200,.14)'; c.beginPath(); c.arc(-r*0.3, -r*0.3, r*0.5, 0, 7); c.fill();
  c.restore();
}
function fiamma(c, x, y, t, k){
  const fl = 0.8 + 0.2*Math.sin(t*11 + k*2.3) + 0.06*Math.sin(t*27 + k);
  c.fillStyle = 'rgba(255,190,90,' + (0.22*fl).toFixed(3) + ')'; c.beginPath(); c.ellipse(x, y - 1, 4.5, 5.5, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,226,150,.95)'; c.beginPath(); c.ellipse(x, y - 1.2*fl, 1.3, 2.6*fl, 0, 0, 7); c.fill();
}
function cespuglio(c, x, y, R, fiore, k){
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + 1, y + 2, R, R*0.6, 0, 0, 7); c.fill();
  [[0, 0, 1, '#2e5a32'], [-R*0.45, -R*0.25, 0.7, '#3a6e3c'], [R*0.4, -R*0.35, 0.65, '#3f7a42'], [0, -R*0.55, 0.6, '#4f8a4e']].forEach(([a, b, s, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x + a, y + b, R*s, 0, 7); c.fill(); });
  c.fillStyle = 'rgba(200,255,180,.14)'; c.beginPath(); c.arc(x - R*0.3, y - R*0.6, R*0.35, 0, 7); c.fill();
  if(fiore){ c.fillStyle = fiore; for(let j = 0; j < 4; j++){ const a = j*1.7 + k; c.beginPath(); c.arc(x + Math.cos(a)*R*0.5, y - R*0.3 + Math.sin(a)*R*0.35, 1.5, 0, 7); c.fill(); } }
}
function felce(c, x, y, h, q){
  c.strokeStyle = '#3f7a42'; c.lineWidth = 1;
  for(let f = 0; f < 5; f++){
    const a = -Math.PI/2 + (f - 2)*0.42 + (q - 0.5)*0.3, ex = x + Math.cos(a)*h*0.7, ey = y + Math.sin(a)*h;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + ex)/2 + Math.cos(a + 1.2)*3, (y + ey)/2, ex, ey); c.stroke();
    c.beginPath();
    for(let l = 1; l < 5; l++){ const tt = l/5, lx = x + (ex - x)*tt, ly = y + (ey - y)*tt; c.moveTo(lx, ly); c.lineTo(lx - 3*(1 - tt) - 1, ly - 1); c.moveTo(lx, ly); c.lineTo(lx + 3*(1 - tt) + 1, ly - 1); }
    c.stroke();
  }
}
function cassaLegno(c, x, y, w, d, h, z0){
  cubo(c, x, y, w, d, h, '#9a7444', '#7e5c34', z0);
  const fy = y + d - h, fh = h - z0;
  c.strokeStyle = 'rgba(40,24,10,.5)'; c.lineWidth = 0.8; for(let k = 1; k < 4; k++){ c.beginPath(); c.moveTo(x, fy + fh*k/4); c.lineTo(x + w, fy + fh*k/4); c.stroke(); }
  c.fillStyle = '#5e4322'; c.fillRect(x, fy, 3, fh); c.fillRect(x + w - 3, fy, 3, fh); c.fillRect(x, fy, w, 2.5); c.fillRect(x, fy + fh - 2.5, w, 2.5);
  c.strokeStyle = '#5e4322'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 3, fy + fh - 2); c.lineTo(x + w - 3, fy + 2); c.stroke();
  c.strokeStyle = 'rgba(40,24,10,.4)'; c.lineWidth = 0.8; for(let k = 1; k < 4; k++){ c.beginPath(); c.moveTo(x + w*k/4, y - h); c.lineTo(x + w*k/4, y + d - h); c.stroke(); }
  c.fillStyle = 'rgba(30,20,10,.5)'; c.fillRect(x + w*0.18, fy + fh*0.36, w*0.2, 1.2); c.fillRect(x + w*0.18, fy + fh*0.52, w*0.14, 1.2);
}
const MOBILI = {
  scaffale: { h:58, base:(w, d) => [0, d*0.3, w, d*0.7], fermo(c, w, d, o, r){
    const y0 = d*0.3, dd = d - y0 - 1, h = 54, x0 = 1, ww = w - 2, fy = y0 + dd - h, ty = y0 - h;
    c.fillStyle = '#3a2416'; c.fillRect(x0, fy, ww, h);
    c.fillStyle = '#5a3a24'; c.fillRect(x0, ty, ww, dd);
    c.fillStyle = 'rgba(255,230,190,.12)'; c.fillRect(x0, fy - 0.8, ww, 1.2);
    const top = fy + 3, bot = y0 + dd - 4, n = 3, rh = (bot - top)/n;
    for(let k = 0; k < n; k++){
      const y1 = top + (k + 1)*rh;
      c.fillStyle = '#140c07'; c.fillRect(x0 + 3, top + k*rh + 1, ww - 6, rh - 1.5);
      let x = x0 + 4, q = 0;
      while(x < x0 + ww - 5){
        const id = k*60 + q; q++;
        if(r(id + 700) < 0.07){ x += 3 + r(id + 800)*3; continue; }
        const bw = Math.min(x0 + ww - 4 - x, 2.3 + r(id)*2.6), bh = (rh - 3)*(0.6 + r(id + 900)*0.36);
        if(bw < 1.2) break;
        c.fillStyle = LIBRI[(r(id + 300)*LIBRI.length)|0]; c.fillRect(x, y1 - 1.5 - bh, bw - 0.4, bh);
        if(bw > 3.2){ c.fillStyle = 'rgba(232,196,120,.5)'; c.fillRect(x, y1 - bh + 0.5, bw - 0.4, 0.8); c.fillRect(x, y1 - 4.5, bw - 0.4, 0.7); }
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x + bw - 1, y1 - 1.5 - bh, 0.6, bh);
        x += bw;
      }
      c.fillStyle = '#6b4a2e'; c.fillRect(x0 + 2, y1 - 1.5, ww - 4, 1.8);
    }
    c.fillStyle = '#4e321e'; c.fillRect(x0, fy, 3, h); c.fillRect(x0 + ww - 3, fy, 3, h);
    for(let x = x0 + 48; x < x0 + ww - 20; x += 48) c.fillRect(x - 1.5, fy, 3, h);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x0, y0 + dd - 3, ww, 3);
    c.fillStyle = '#6e2430'; c.fillRect(x0 + 6, ty + 5, 15, 5); c.fillStyle = '#23395b'; c.fillRect(x0 + 8, ty + 2, 12, 4); c.fillStyle = 'rgba(232,196,120,.5)'; c.fillRect(x0 + 6, ty + 7, 15, 0.7);
    if(r(5) < 0.6){
      const gx = x0 + ww - 16, gy = ty + dd/2 + 3;
      c.fillStyle = '#3a2a1c'; c.fillRect(gx - 4, gy, 8, 2); c.fillRect(gx - 0.8, gy - 4, 1.6, 4);
      c.fillStyle = '#2f5a6b'; c.beginPath(); c.arc(gx, gy - 9, 5.5, 0, 7); c.fill();
      c.fillStyle = '#8a6a2a'; c.beginPath(); c.ellipse(gx - 1.5, gy - 10, 2.5, 2, 0.4, 0, 7); c.fill();
      c.strokeStyle = '#a07a32'; c.lineWidth = 0.8; c.beginPath(); c.arc(gx, gy - 9, 6.8, -1.2, 2.2); c.stroke();
    }
  } },
  tavolo: { h:32, base:(w, d) => [2, d*0.2, w - 4, d*0.75], fermo(c, w, d, o, r){
    const sedia = (x, y) => { c.fillStyle = '#2e1c12'; c.fillRect(x - 5, y - 24, 10, 15); c.fillStyle = '#7a2e33'; c.fillRect(x - 3.5, y - 22, 7, 10); c.fillStyle = '#4a2e1e'; c.fillRect(x - 5.5, y - 10, 11, 8); c.fillStyle = '#6b4630'; c.fillRect(x - 5.5, y - 11, 11, 2); };
    for(let k = 0; k < 3; k++) sedia(w*(0.22 + k*0.28), 8);
    const x = 3, y = 7, ww = w - 6, dd = d - 13, h = 18, ty = y - h;
    c.fillStyle = '#d6cbb3'; c.fillRect(x, y + dd - h, ww, h);
    c.fillStyle = 'rgba(0,0,0,.09)'; for(let k = x + 7; k < x + ww; k += 9) c.fillRect(k, y + dd - h + 2, 1.2, h - 2);
    c.fillStyle = '#d6cbb3'; for(let k = 0; k < ww - 2; k += 7){ c.beginPath(); c.arc(x + k + 3.5, y + dd, 3.5, 0, Math.PI); c.fill(); }
    c.fillStyle = '#ebe3d1'; c.fillRect(x, ty, ww, dd);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, y + dd - h - 0.6, ww, 1.2);
    c.fillStyle = '#7a2433'; c.fillRect(x + 4, ty + dd/2 - 5, ww - 8, 10);
    c.fillStyle = 'rgba(212,175,98,.85)'; c.fillRect(x + 4, ty + dd/2 - 5, ww - 8, 0.9); c.fillRect(x + 4, ty + dd/2 + 4.1, ww - 8, 0.9);
    const n = Math.max(2, Math.round(ww/26));
    for(let k = 0; k < n; k++){
      const px = x + 12 + k*((ww - 24)/(n - 1));
      [ty + 7, ty + dd - 7].forEach(py => { c.fillStyle = '#f8f4ea'; c.beginPath(); c.ellipse(px, py, 5.6, 4, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(170,150,115,.6)'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(px, py, 3.6, 2.5, 0, 0, 7); c.stroke(); c.fillStyle = '#a9a49a'; c.fillRect(px + 7, py - 3, 0.9, 6); c.fillRect(px - 7.9, py - 3, 0.9, 6); });
      if(r(k) < 0.7){ c.fillStyle = 'rgba(210,225,235,.8)'; c.beginPath(); c.arc(px + 6, ty + 12.5, 1.6, 0, 7); c.fill(); }
    }
    for(let k = 0; k < 3; k++){
      const px = x + ww*(0.25 + k*0.25), py = ty + dd/2;
      if(k === 1){ c.fillStyle = '#a07a32'; c.beginPath(); c.ellipse(px, py, 6, 3, 0, 0, 7); c.fill(); [['#c43a4a', -3, -1], ['#e3b04a', 1, -2], ['#7a3a8a', 3, 0.5], ['#4f8a55', -1, 1.5]].forEach(([col, a, b]) => { c.fillStyle = col; c.beginPath(); c.arc(px + a, py - 3 + b, 2.2, 0, 7); c.fill(); }); continue; }
      c.fillStyle = '#a07a32'; c.beginPath(); c.ellipse(px, py + 1, 3.5, 2, 0, 0, 7); c.fill();
      c.fillStyle = '#d4af62'; c.fillRect(px - 1, py - 8, 2, 9); c.fillRect(px - 4, py - 8, 8, 1.4);
      c.fillStyle = '#efe6d0'; c.fillRect(px - 4.6, py - 12, 2, 4); c.fillRect(px - 1, py - 13, 2, 5); c.fillRect(px + 2.6, py - 12, 2, 4);
    }
  }, vivo(c, w, d, o, t){
    const x = 3, ww = w - 6, ty = 7 - 18, dd = d - 13;
    for(const k of [0, 2]){ const px = x + ww*(0.25 + k*0.25), py = ty + dd/2; fiamma(c, px - 3.6, py - 12.5, t, k*3 + o.x); fiamma(c, px, py - 13.5, t, k*3 + 1 + o.x); fiamma(c, px + 3.6, py - 12.5, t, k*3 + 2 + o.x); }
  } },
  ingranaggio: { h:46, base:(w, d) => [4, d*0.18, w - 8, d*0.78], fermo(c, w, d, o, r){
    const x = 6, y = 12, ww = w - 12, dd = d - 16, h = 12;
    c.fillStyle = '#2a2830'; c.fillRect(w/2 - 9, y - h - 30, 18, 32); c.fillStyle = '#9a7a3c'; c.fillRect(w/2 - 9, y - h - 30, 18, 2);
    c.fillStyle = '#16141a'; c.fillRect(w/2 - 6, y - h - 26, 12, 24); c.fillStyle = '#c9a35a'; c.fillRect(w/2 - 0.6, y - h - 25, 1.2, 15); c.beginPath(); c.arc(w/2, y - h - 9, 3.5, 0, 7); c.fill();
    cubo(c, x, y, ww, dd, h, '#4c4b55', '#3a3942');
    c.fillStyle = 'rgba(210,210,220,.3)'; for(let k = 0; k < 7; k++){ c.beginPath(); c.arc(x + 6 + k*((ww - 12)/6), y + dd - h + 5, 1.1, 0, 7); c.fill(); }
    ruota(c, x + ww - 15, y - h + 13, 11, 9, '#8a7440', 0.3);
    ruota(c, x + 15, y - h + dd - 14, 9, 8, '#6e5c34', 0.1);
  }, vivo(c, w, d, o, t, eff){
    const gira = (eff || []).some(e => e.k === 'compito' && e.v === 'ingranaggio');
    ruota(c, w/2, (d - 16)/2, 26, 12, '#a88a4a', gira ? t*6 : 0.15);
  } },
  plastico: { h:34, base:(w, d) => [3, d*0.2, w - 6, d*0.75], fermo(c, w, d, o, r, M){
    const x = 3, y = 9, ww = w - 6, dd = d - 14, h = 20, ty = y - h;
    tavola(c, x, y, ww, dd, h, '#6b4a30');
    c.fillStyle = '#2c3a2c'; c.fillRect(x + 3, ty + 3, ww - 6, dd - 6);
    if(M) miniPalazzo(c, M, x + 5, ty + 7, ww - 10, dd - 11, 3, '#d8cdb2', '#9a4a32');
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x + 3, ty + 3, ww - 6, 1);
  } },
  altare: { h:46, base:(w, d) => [4, d*0.25, w - 8, d*0.72], fermo(c, w, d, o, r){
    const x = 6, y = 9, ww = w - 12, dd = d - 11, h = 22, ty = y - h, cy = ty + dd/2, cx = w/2;
    cubo(c, x, y, ww, dd, h, '#cfc6b2', '#b9af99');
    for(let k = 0; k < 3; k++){ const pw = (ww - 16)/3 - 5, px = x + 8 + k*((ww - 16)/3) + 2.5; c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(px, y + dd - h + 9, pw, h - 13); c.fillStyle = 'rgba(255,255,255,.13)'; c.fillRect(px, y + dd - 4, pw, 1); c.fillStyle = 'rgba(201,163,90,.5)'; rombo(c, px + pw/2, y + dd - h + 9 + (h - 13)/2, 2.5); }
    c.fillStyle = '#f2ede1'; c.fillRect(x - 2, ty - 0.5, ww + 4, dd + 0.5); c.fillRect(x - 2, y + dd - h, ww + 4, 6);
    c.fillStyle = '#c9a35a'; c.fillRect(x - 2, y + dd - h + 5, ww + 4, 1.4);
    c.fillStyle = '#7a2433'; c.fillRect(cx - 10, cy - 6, 20, 11); c.fillStyle = '#efe6d0'; c.fillRect(cx - 9, cy - 5.5, 8.4, 10); c.fillRect(cx + 0.6, cy - 5.5, 8.4, 10);
    c.fillStyle = 'rgba(60,40,30,.35)'; for(let k = 0; k < 4; k++){ c.fillRect(cx - 8, cy - 3.5 + k*2.2, 6.5, 0.6); c.fillRect(cx + 1.5, cy - 3.5 + k*2.2, 6.5, 0.6); }
    [x + 9, x + ww - 9].forEach(px => { c.fillStyle = '#a07a32'; c.beginPath(); c.ellipse(px, cy + 2, 3.4, 1.9, 0, 0, 7); c.fill(); c.fillStyle = '#d4af62'; c.fillRect(px - 1, cy - 13, 2, 15); c.fillStyle = '#efe6d0'; c.fillRect(px - 1.4, cy - 19, 2.8, 6); });
    [x + 24, x + ww - 24].forEach(px => { c.fillStyle = '#9a96a0'; c.fillRect(px - 3, cy - 4, 6, 7); c.fillStyle = '#4f8a55'; c.beginPath(); c.arc(px - 2.5, cy - 7, 3, 0, 7); c.arc(px + 2.5, cy - 8, 3, 0, 7); c.fill(); c.fillStyle = '#ece4f2'; [[-3, -9], [2.5, -11], [0, -7], [4, -7.5]].forEach(([a, b]) => { c.beginPath(); c.arc(px + a, cy + b, 1.4, 0, 7); c.fill(); }); });
  }, vivo(c, w, d, o, t){ const x = 6, ww = w - 12, cy = 9 - 22 + (d - 11)/2; fiamma(c, x + 9, cy - 19, t, 1); fiamma(c, x + ww - 9, cy - 19, t, 2); } },
  panca: { h:30, base:(w, d) => [2, d*0.15, w - 4, d*0.8], fermo(c, w, d, o, r){
    const x = 3, ww = w - 6, yb = 27;
    cubo(c, x, 5, ww, 14, 12, '#7a5434', '#5a3c24');
    c.fillStyle = '#4e3320'; c.fillRect(x, yb - 22, ww, 22);
    c.fillStyle = '#6b4a2e'; c.fillRect(x, yb - 25, ww, 4); c.fillStyle = 'rgba(255,230,190,.12)'; c.fillRect(x, yb - 25, ww, 1);
    for(let k = 0; k < 2; k++){ const px = x + 6 + k*(ww - 12)/2, pw = (ww - 12)/2 - 4; c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(px, yb - 18, pw, 12); c.fillStyle = 'rgba(255,220,170,.07)'; c.fillRect(px, yb - 7, pw, 1); }
    c.fillStyle = '#3a2416'; c.fillRect(x + 3, yb - 9, ww - 6, 2.5);
    for(let k = 0; k < 5; k++){ c.fillStyle = ['#6e2430', '#23395b', '#2f5240'][k % 3]; c.fillRect(x + 8 + k*((ww - 18)/5), yb - 14, 3.2, 5); }
    [x - 1, x + ww - 3].forEach(px => { c.fillStyle = '#3e2818'; c.fillRect(px, yb - 27, 4, 27); c.beginPath(); c.arc(px + 2, yb - 27, 2.4, 0, 7); c.fill(); });
  } },
  piano: { h:36, base:(w, d) => [4, d*0.15, w - 10, d*0.75], fermo(c, w, d, o, r){
    const xe = w - 16, y0 = 8, y1 = d - 8, ym = (y0 + y1)/2, sag = new Path2D();
    sag.moveTo(xe, y0); sag.lineTo(xe, y1); sag.lineTo(40, y1); sag.bezierCurveTo(22, y1, 8, y1 - 6, 6, ym + 4); sag.bezierCurveTo(4, y0 + 8, 14, y0, 30, y0); sag.closePath();
    c.fillStyle = '#0e0c10'; [[xe - 6, y1 - 2], [xe - 6, y0 + 6], [16, ym + 8]].forEach(([a, b]) => c.fillRect(a - 2, b - 14, 4, 14));
    estrudi(c, sag, 12, 22, '#2a2430');
    c.save(); c.translate(0, -22);
    c.save(); c.clip(sag);
    c.fillStyle = '#9a7a3c'; c.fillRect(0, 0, w, d);
    c.fillStyle = '#6e5228'; c.beginPath(); c.ellipse(36, ym + 2, 14, 9, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(240,225,190,.6)'; c.lineWidth = 0.5; c.beginPath(); for(let k = y0 + 3; k < y1 - 2; k += 2.2){ c.moveTo(xe - 4, k); c.lineTo(10 + Math.abs(k - ym)*0.6, k + (k - ym)*0.1); } c.stroke();
    c.restore();
    c.strokeStyle = '#0c0a0e'; c.lineWidth = 3; c.stroke(sag);
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.beginPath(); c.moveTo(42, y1 - 1.5); c.lineTo(xe - 3, y1 - 1.5); c.stroke();
    c.fillStyle = '#0e0c10'; c.fillRect(xe - 1, y0 - 1, 12, y1 - y0 + 2);
    c.fillStyle = '#efe8d8'; c.fillRect(xe + 1, y0 + 2, 8, y1 - y0 - 4);
    c.fillStyle = 'rgba(0,0,0,.35)'; for(let k = y0 + 2; k < y1 - 2; k += 2.4) c.fillRect(xe + 1, k, 8, 0.5);
    c.fillStyle = '#121014'; for(let k = 0, yy = y0 + 3.5; yy < y1 - 3; k++, yy += 2.4) if([0, 1, 3, 4, 5].indexOf(k % 7) >= 0) c.fillRect(xe + 1, yy, 4.5, 1.4);
    c.fillStyle = '#0e0c10'; c.fillRect(xe - 5, y0 + 10, 2, y1 - y0 - 20); c.fillStyle = '#e8dfc8'; c.fillRect(xe - 9, y0 + 12, 4, y1 - y0 - 24);
    c.restore();
    cubo(c, w - 2, d/2 - 9, 10, 18, 10, '#7a2433', '#2a1e18');
  } },
  banco: { h:46, base:(w, d) => [0, d*0.15, w, d*0.8], fermo(c, w, d, o, r){
    const y = 5, dd = d - 7, h = 28, ty = y - h;
    cubo(c, 0, y, w, dd, h, '#b7b0a3', '#6b4a30');
    c.strokeStyle = 'rgba(90,85,80,.25)'; c.lineWidth = 0.7; for(let k = 0; k < 6; k++){ const a = r(k)*w; c.beginPath(); c.moveTo(a, ty); c.bezierCurveTo(a + 10, ty + dd*0.4, a - 6, ty + dd*0.6, a + 8, ty + dd); c.stroke(); }
    c.fillStyle = '#4e3320'; c.fillRect(0, y + dd - h + 1, w, 5);
    const n = Math.round(w/32);
    for(let k = 0; k < n; k++){ const pw = w/n - 4, px = k*(w/n) + 2, py = y + dd - h + 8, ph = h - 11; c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(px, py, pw, ph); c.fillStyle = 'rgba(255,220,170,.09)'; c.fillRect(px + 2, py + 2, pw - 4, ph - 4); c.fillStyle = '#c9a35a'; c.beginPath(); c.arc(px + (k & 1 ? 3.5 : pw - 3.5), py + ph/2, 1.3, 0, 7); c.fill(); }
    c.fillStyle = '#c79a64'; c.fillRect(18, ty + 4, 34, dd - 9); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(18, ty + dd - 5.5, 34, 1.2);
    c.fillStyle = '#cdd2d8'; c.fillRect(24, ty + dd/2 - 2, 16, 1.8); c.fillStyle = '#3a2a1c'; c.fillRect(40, ty + dd/2 - 2.4, 8, 2.6);
    [['#c43a3a', 60, 6, 3.4], ['#d04040', 66, 10, 3], ['#c43a3a', 63, 15, 3.2], ['#e07a2a', 74, 8, 0], ['#4f8a3a', 80, 14, 0]].forEach(([col, a, b, rr]) => { c.fillStyle = col; c.beginPath(); if(rr) c.arc(a, ty + b, rr, 0, 7); else c.ellipse(a + 4, ty + b, 6, 1.8, 0.2, 0, 7); c.fill(); if(rr){ c.fillStyle = '#3a6a2a'; c.fillRect(a - 0.6, ty + b - rr - 0.6, 1.4, 1.4); } });
    c.fillStyle = '#8a7a6a'; c.beginPath(); c.ellipse(108, ty + dd/2, 10, 7, 0, 0, 7); c.fill(); c.fillStyle = '#f2ede2'; c.beginPath(); c.ellipse(108, ty + dd/2 - 0.5, 8, 5.5, 0, 0, 7); c.fill();
    for(let k = 0; k < 4; k++){ const px = 128 + k*8; c.fillStyle = 'rgba(200,215,220,.55)'; c.fillRect(px, ty + 2, 6, 9); c.fillStyle = ['#c9a35a', '#8a3a2a', '#e8dfc8', '#5a7a3a'][k]; c.fillRect(px + 0.8, ty + 5, 4.4, 5.5); c.fillStyle = '#6b4a30'; c.fillRect(px, ty + 1, 6, 2); }
    if(w > 172){ cilindro(c, 170, ty + dd/2 + 4, 9, 5, 8, '#8a8f96', '#6a6f76'); c.fillStyle = '#3a3a40'; c.fillRect(168.5, ty + dd/2 - 6, 3, 2); }
  } },
  forno: { h:72, base:(w, d) => [2, d*0.15, w - 4, d*0.8], fermo(c, w, d, o, r){
    const x = 3, y = 12, ww = w - 6, dd = d - 14, h = 16, cx = w/2, by = y + dd - h;
    c.fillStyle = '#4a2a22'; c.fillRect(cx + 6, by - 58, 10, 34); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(cx + 12, by - 58, 4, 34); c.fillStyle = '#2a1812'; c.fillRect(cx + 5, by - 60, 12, 4);
    cubo(c, x, y, ww, dd, h, '#6a3a2a', '#5e3426');
    muroMattoni(c, x, by, ww, h, '#7a3e2c');
    const gr = c.createRadialGradient(cx - 8, by - 30, 4, cx, by - 12, ww/2); gr.addColorStop(0, '#9a5a3e'); gr.addColorStop(1, '#4a2418');
    c.fillStyle = gr; c.beginPath(); c.ellipse(cx, by, ww/2 - 3, 34, 0, Math.PI, 0); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(30,14,10,.45)'; c.lineWidth = 0.8; for(let k = 1; k < 5; k++){ c.beginPath(); c.ellipse(cx, by, ww/2 - 3, 34*k/5, 0, Math.PI, 0); c.stroke(); }
    c.fillStyle = '#1a0c08'; arcata(c, cx - 12, by - 20, 24, 20); c.fill();
    c.fillStyle = '#8a7a6a'; c.fillRect(cx - 15, by - 1, 30, 3);
    for(let k = 0; k < 5; k++){ const lx = w + 2 + (k % 2)*5, ly = d - 6 - Math.floor(k/2)*5; c.fillStyle = '#6a4630'; c.beginPath(); c.arc(lx, ly, 2.6, 0, 7); c.fill(); c.fillStyle = '#b08a5a'; c.beginPath(); c.arc(lx, ly, 1.5, 0, 7); c.fill(); }
  }, vivo(c, w, d, o, t, eff, pit){
    const acceso = (eff || []).some(e => e.k === 'compito' && e.v === 'fuoco'), cx = w/2, by = 12 + (d - 14) - 16;
    const a = acceso ? 0.95 : 0.5 + Math.sin(t*3)*0.12;
    c.fillStyle = 'rgba(255,140,60,' + a.toFixed(3) + ')'; arcata(c, cx - 10, by - 17, 20, 16); c.fill();
    c.fillStyle = 'rgba(255,210,120,' + (a*0.7).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx, by - 3, 7, 3 + Math.sin(t*9), 0, 0, 7); c.fill();
    if(acceso && Math.random() < 0.5) pit.sparpaglia('fiamma', o.x*T + cx, o.y*T + by - 8, 1, { v:10, su:40, vita:0.6, r:4 });
  } },
  botte: { h:42, tondo:true, base:(w, d) => [6, d*0.42, w - 12, d*0.5], fermo(c, w, d, o, r){
    const cx = w/2, cy = d*0.66, rx = w/2 - 7, ry = rx*0.42, h = 36, gonfio = 3.5;
    const fianco = new Path2D();
    fianco.moveTo(cx - rx, cy - h); fianco.quadraticCurveTo(cx - rx - gonfio*2, cy - h/2, cx - rx, cy); fianco.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); fianco.quadraticCurveTo(cx + rx + gonfio*2, cy - h/2, cx + rx, cy - h); fianco.closePath();
    const g = c.createLinearGradient(cx - rx - gonfio, 0, cx + rx + gonfio, 0); g.addColorStop(0, '#3a2414'); g.addColorStop(0.32, '#8a5a32'); g.addColorStop(0.55, '#6e4426'); g.addColorStop(1, '#2e1c10');
    c.fillStyle = g; c.fill(fianco);
    c.save(); c.clip(fianco);
    c.strokeStyle = 'rgba(30,16,8,.45)'; c.lineWidth = 0.8;
    for(let k = 1; k < 8; k++){ const a = -1 + k/4, x = cx + a*rx; c.beginPath(); c.moveTo(x, cy - h); c.quadraticCurveTo(x + a*gonfio*2, cy - h/2, x, cy + ry*Math.sqrt(Math.max(0, 1 - a*a))); c.stroke(); }
    [0.18, 0.82].forEach(q => { const yy = cy - h*(1 - q), b = gonfio*Math.sin(q*Math.PI); c.strokeStyle = '#2a2a2e'; c.lineWidth = 3; c.beginPath(); c.ellipse(cx, yy, rx + b, ry, 0, 0, Math.PI); c.stroke(); c.strokeStyle = 'rgba(200,200,210,.25)'; c.lineWidth = 0.8; c.beginPath(); c.ellipse(cx, yy - 1, rx + b, ry, 0, 0.2, Math.PI - 0.2); c.stroke(); });
    c.restore();
    c.fillStyle = '#7a5030'; c.beginPath(); c.ellipse(cx, cy - h, rx, ry, 0, 0, 7); c.fill();
    c.strokeStyle = '#3a2414'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(30,16,8,.35)'; c.lineWidth = 0.7;
    for(let k = -2; k <= 2; k++){ const yy = cy - h + k*ry*0.36, half = rx*Math.sqrt(Math.max(0, 1 - (k*0.36)*(k*0.36))); c.beginPath(); c.moveTo(cx - half + 1, yy); c.lineTo(cx + half - 1, yy); c.stroke(); }
    c.fillStyle = '#2a1810'; c.beginPath(); c.arc(cx + rx*0.4, cy - h, 1.6, 0, 7); c.fill();
    c.fillStyle = '#b8914e'; c.fillRect(cx - 1.5, cy - h*0.32, 3, 6); c.fillRect(cx - 3, cy - h*0.32 + 5, 6, 1.6);
    if(r(1) < 0.5){ c.fillStyle = 'rgba(200,215,220,.6)'; c.fillRect(cx - 7, cy - h - 4, 4, 5); c.fillStyle = '#6e1f2a'; c.fillRect(cx - 6.4, cy - h - 1.5, 2.8, 2.2); }
  } },
  stendino: { h:46, base:(w, d) => [2, d*0.45, w - 4, d*0.45], fermo(c, w, d, o, r){
    const yb = d*0.72, top = yb - 40;
    c.fillStyle = '#7a6448'; [4, w - 4].forEach(px => { c.fillRect(px - 1.5, top, 3, 40); c.fillRect(px - 6, yb - 1.5, 12, 3); c.fillRect(px - 5, top - 1, 10, 2.5); });
    c.strokeStyle = '#cfc4b0'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(4, top + 1); c.quadraticCurveTo(w/2, top + 5, w - 4, top + 1); c.stroke();
    const panni = [['camicia', '#c9443f'], ['lenzuolo', '#e6e0d4'], ['calze', '#3a5aa8'], ['camicia', '#2f8a5e'], ['asciugamano', '#e3a23b']];
    let x = 12;
    panni.forEach(([tipo, col]) => {
      const yy = top + 1 + Math.sin((x/w)*Math.PI)*4;
      c.fillStyle = col;
      if(tipo === 'camicia'){ c.beginPath(); c.moveTo(x, yy); c.lineTo(x + 16, yy); c.lineTo(x + 21, yy + 7); c.lineTo(x + 17, yy + 9); c.lineTo(x + 16, yy + 21); c.lineTo(x, yy + 21); c.lineTo(x - 1, yy + 9); c.lineTo(x - 5, yy + 7); c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x + 7.5, yy + 2, 1, 19); c.fillStyle = 'rgba(255,255,255,.5)'; for(let b = 0; b < 3; b++) c.fillRect(x + 6.3, yy + 5 + b*5, 1.2, 1.2); x += 26; }
      else if(tipo === 'lenzuolo'){ c.fillRect(x, yy, 22, 30); c.fillStyle = 'rgba(0,0,0,.1)'; for(let f = 4; f < 22; f += 6) c.fillRect(x + f, yy, 1.5, 30); c.fillStyle = 'rgba(120,150,200,.3)'; c.fillRect(x, yy + 25, 22, 2); x += 26; }
      else if(tipo === 'calze'){ [0, 7].forEach(a => { c.fillRect(x + a, yy, 4.5, 11); c.fillRect(x + a, yy + 9, 7, 4.5); }); x += 18; }
      else { c.fillRect(x, yy, 14, 20); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, yy + 15, 14, 1.5); c.fillRect(x, yy + 17.5, 14, 1); x += 18; }
      c.fillStyle = '#b8a06a'; c.fillRect(x - 10, yy - 2, 2, 4);
    });
    c.fillStyle = '#8a6a3e'; c.beginPath(); c.ellipse(w - 16, d - 6, 10, 5, 0, 0, 7); c.fill(); c.fillStyle = '#e6e0d4'; c.beginPath(); c.ellipse(w - 16, d - 8, 7, 3, 0, 0, 7); c.fill();
  } },
  tinozza: { h:30, tondo:true, base:(w, d) => [4, d*0.3, w - 12, d*0.62], fermo(c, w, d, o, r){
    const cx = w/2 - 4, cy = d*0.62, rx = w/2 - 10, ry = 8, h = 13;
    cilindro(c, cx, cy, rx, ry, h, '#6a4a2a', '#7a5432');
    c.strokeStyle = '#2a2a2e'; c.lineWidth = 1.6; [0.3, 0.8].forEach(q => { c.beginPath(); c.ellipse(cx, cy - h*(1 - q), rx, ry, 0, 0, Math.PI); c.stroke(); });
    c.fillStyle = '#5a3a20'; c.beginPath(); c.ellipse(cx, cy - h, rx, ry, 0, 0, 7); c.fill();
    c.fillStyle = '#8fb8d0'; c.beginPath(); c.ellipse(cx, cy - h + 0.5, rx - 2.5, ry - 2, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)'; for(let k = 0; k < 9; k++){ c.beginPath(); c.arc(cx - rx*0.6 + r(k)*rx*1.2, cy - h - ry*0.4 + r(k + 20)*ry*0.8, 1 + r(k + 40)*1.6, 0, 7); c.fill(); }
    c.fillStyle = '#9a7a52'; c.fillRect(w - 13, cy - 24, 9, 24); c.fillStyle = 'rgba(0,0,0,.25)'; for(let k = 0; k < 7; k++) c.fillRect(w - 12, cy - 21 + k*3, 7, 1);
  } },
  piedistallo: { h:58, base:(w, d) => [w/2 - 15, d*0.3, 30, d*0.6], fermo(c, w, d, o, r){
    const cx = w/2, y = 10, dd = d - 13;
    cubo(c, cx - 14, y, 28, dd, 5, '#a8a2b0', '#8e8898');
    cubo(c, cx - 10, y + 2, 20, dd - 4, 30, '#c4bfcc', '#a9a3b3', 5);
    cubo(c, cx - 13, y + 1, 26, dd - 2, 34, '#d6d1dc', '#b4aebd', 30);
    const ty = y - 34 + (dd - 2)/2 + 1;
    if(Math.floor(o.x/8) % 2 === 0){
      const g = c.createLinearGradient(cx - 10, 0, cx + 10, 0); g.addColorStop(0, '#bdb6a6'); g.addColorStop(0.4, '#efe9dc'); g.addColorStop(1, '#a39c8e');
      c.fillStyle = g; c.beginPath(); c.ellipse(cx, ty - 1, 10, 5, 0, Math.PI, 0); c.lineTo(cx + 10, ty + 1); c.lineTo(cx - 10, ty + 1); c.fill();
      c.fillRect(cx - 2.5, ty - 10, 5, 6); c.beginPath(); c.ellipse(cx, ty - 14, 5, 6.2, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(cx + 2, ty - 13, 2, 4, 0, 0, 7); c.fill();
    } else {
      const g = c.createLinearGradient(cx - 8, 0, cx + 8, 0); g.addColorStop(0, '#6a3420'); g.addColorStop(0.4, '#c26a3e'); g.addColorStop(1, '#5a2a18');
      c.fillStyle = g; c.beginPath(); c.moveTo(cx - 3, ty - 20); c.lineTo(cx + 3, ty - 20); c.quadraticCurveTo(cx + 2, ty - 15, cx + 8, ty - 9); c.quadraticCurveTo(cx + 9, ty - 2, cx + 3, ty + 1); c.lineTo(cx - 3, ty + 1); c.quadraticCurveTo(cx - 9, ty - 2, cx - 8, ty - 9); c.quadraticCurveTo(cx - 2, ty - 15, cx - 3, ty - 20); c.fill();
      c.fillStyle = '#1a1210'; c.fillRect(cx - 7.5, ty - 9, 15, 2.5);
      c.strokeStyle = '#5a2a18'; c.lineWidth = 1.2; c.beginPath(); c.arc(cx - 6, ty - 15, 3, 1.2, 4.2); c.stroke(); c.beginPath(); c.arc(cx + 6, ty - 15, 3, -1.2, 1.9); c.stroke();
    }
  } },
  console: { h:50, base:(w, d) => [0, d*0.2, w, d*0.75], fermo(c, w, d, o, r){
    const y = 8, dd = d - 10, h = 20, ty = y - h;
    for(let k = 0; k < o.w; k++){
      const sx = k*T + 3, sw = T - 6, sy = ty + 2;
      c.fillStyle = '#1a1e24'; c.fillRect(sx, sy - 24, sw, 6); c.fillStyle = '#23282f'; c.fillRect(sx, sy - 18, sw, 20);
      c.fillStyle = '#0a1a14'; c.fillRect(sx + 2.5, sy - 16, sw - 5, 15);
      c.fillStyle = 'rgba(120,220,170,.22)'; c.fillRect(sx + 4, sy - 7, sw - 8, 5); c.fillRect(sx + 6 + r(k)*(sw - 16), sy - 14, 4, 7);
      c.fillStyle = 'rgba(0,0,0,.3)'; for(let l = 0; l < 7; l++) c.fillRect(sx + 2.5, sy - 16 + l*2.2, sw - 5, 0.7);
    }
    cubo(c, 0, y, w, dd, h, '#2b323a', '#1d242b');
    for(let k = 0; k < o.w; k++){ const kx = k*T + 6; c.fillStyle = '#14181d'; c.fillRect(kx, ty + dd - 10, T - 12, 6); c.fillStyle = 'rgba(200,210,220,.25)'; for(let a = 0; a < 6; a++) for(let b = 0; b < 2; b++) c.fillRect(kx + 1.5 + a*3.3, ty + dd - 9 + b*2.6, 2.2, 1.5); }
    ['#d94a4a', '#e3b04a', '#5ac08a'].forEach((col, k) => { c.fillStyle = col; c.beginPath(); c.arc(w - 18 + k*5, ty + 6, 1.6, 0, 7); c.fill(); });
    c.fillStyle = '#e8e0d0'; c.beginPath(); c.ellipse(14, ty + 7, 3.2, 2.2, 0, 0, 7); c.fill(); c.fillStyle = '#3a2416'; c.beginPath(); c.ellipse(14, ty + 6.6, 2.2, 1.4, 0, 0, 7); c.fill();
  }, vivo(c, w, d, o, t){
    const sy = 8 - 20 + 2;
    for(let k = 0; k < o.w; k++){ c.fillStyle = 'rgba(140,240,190,' + (0.06 + 0.05*Math.sin(t*5 + k*1.3)).toFixed(3) + ')'; c.fillRect(k*T + 5.5, sy - 16, T - 11, 15); }
    if(Math.sin(t*4) > 0){ c.fillStyle = 'rgba(255,70,80,.9)'; c.beginPath(); c.arc(T - 8, sy - 13, 1.2, 0, 7); c.fill(); }
  } },
  aiuola: { h:34, base:(w, d) => [2, d*0.1, w - 4, d*0.88], fermo(c, w, d, o, r){
    const x = 3, y = 6, ww = w - 6, dd = d - 9, h = 12, ty = y - h;
    cubo(c, x, y, ww, dd, h, '#3a2818', '#6a5a4a');
    muroMattoni(c, x, y + dd - h, ww, h, '#7a5a48');
    c.strokeStyle = '#9a8a76'; c.lineWidth = 3; c.strokeRect(x + 1.5, ty + 1.5, ww - 3, dd - 3);
    c.fillStyle = 'rgba(0,0,0,.25)'; for(let k = 0; k < 30; k++) c.fillRect(x + 4 + r(k)*(ww - 8), ty + 4 + r(k + 30)*(dd - 8), 1.2, 1.2);
    const n = Math.round(o.w*o.h*2.2), piante = [];
    for(let k = 0; k < n; k++) piante.push([x + 9 + r(k + 60)*(ww - 18), ty + 9 + r(k + 90)*(dd - 18), k]);
    piante.sort((a, b) => a[1] - b[1]);
    piante.forEach(([px, py, k]) => { const q = r(k + 120); if(q < 0.22) felce(c, px, py, 12 + r(k + 150)*8, r(k + 180)); else cespuglio(c, px, py, 5 + r(k + 210)*3.5, q < 0.55 ? (r(k + 240) < 0.5 ? '#d77a9a' : '#f0d070') : null, k); });
  }, vivo(c, w, d, o, t, eff, pit){
    if((eff || []).some(e => e.k === 'compito' && e.v === 'acqua') && Math.random() < 0.6) pit.sparpaglia('goccia', o.x*T + w/2, o.y*T - 10, 2, { v:40, su:80, vita:0.7, r:3 });
  } },
  cassa: { h:46, base:(w, d) => [2, d*0.15, w - 4, d*0.8], fermo(c, w, d, o, r){
    const x = 3, y = 10, ww = w - 6, dd = d - 13, h = 24;
    cassaLegno(c, x, y, ww, dd, h, 0);
    const w2 = Math.min(ww*0.62, 40), d2 = dd*0.6, x2 = x + (r(1) < 0.5 ? 4 : ww - w2 - 4), y2 = y + 4;
    cassaLegno(c, x2, y2, w2, d2, h + 16, h);
    const fx = r(1) < 0.5 ? x + ww - 12 : x + 12, fy = y - h + dd*0.7;
    c.strokeStyle = '#b8a07a'; c.lineWidth = 1.4; for(let k = 0; k < 3; k++){ c.beginPath(); c.ellipse(fx, fy, 7 - k*2, 3.5 - k, 0, 0, 7); c.stroke(); }
  } },
  fontana: { h:52, tondo:true, base:(w, d) => [4, 10, w - 8, d - 12], fermo(c, w, d, o, r){
    const cx = w/2, cy = d/2 + 4, R = w/2 - 3, h = 14;
    const ott = (rr, dy) => { const p = new Path2D(); for(let k = 0; k < 8; k++){ const a = Math.PI/8 + k*Math.PI/4, px = cx + Math.cos(a)*rr, py = cy + dy + Math.sin(a)*rr*0.86; if(k) p.lineTo(px, py); else p.moveTo(px, py); } p.closePath(); return p; };
    const fuori = ott(R, 0);
    estrudi(c, fuori, 0, h, '#8a8578');
    c.save(); c.translate(0, -h); c.fillStyle = '#a39e90'; c.fill(fuori); c.restore();
    const dentro = ott(R - 7, -h);
    const g = c.createRadialGradient(cx, cy - h, 4, cx, cy - h, R); g.addColorStop(0, '#2a6a80'); g.addColorStop(1, '#123a4c');
    c.fillStyle = g; c.fill(dentro); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.stroke(dentro);
    cilindro(c, cx, cy - h + 2, 7, 3.5, 30, '#b5af9f', '#a39e90');
    c.fillStyle = '#8a8578'; c.beginPath(); c.ellipse(cx, cy - h - 28, 17, 7, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#b5af9f'; c.beginPath(); c.ellipse(cx, cy - h - 30, 17, 7, 0, 0, 7); c.fill();
    c.fillStyle = '#2a6a80'; c.beginPath(); c.ellipse(cx, cy - h - 30, 13.5, 5, 0, 0, 7); c.fill();
    c.fillStyle = '#cdc7b6'; c.beginPath(); c.ellipse(cx, cy - h - 35, 3.5, 4.5, 0, 0, 7); c.fill();
  }, vivo(c, w, d, o, t){
    const cx = w/2, cy = d/2 + 4 - 14, R = w/2 - 10;
    c.strokeStyle = 'rgba(180,220,240,.22)'; c.lineWidth = 1.2;
    for(let k = 0; k < 3; k++){ const a = t*0.6 + k*2.1, rr = 5 + ((t*7 + k*4) % 9); c.beginPath(); c.ellipse(cx + Math.cos(a)*R*0.55, cy + 6 + Math.sin(a)*R*0.4, rr, rr*0.8, 0, 0, 7); c.stroke(); }
    for(let k = 0; k < 4; k++){ const ph = (t*1.3 + k/4) % 1, a = k*Math.PI/2 + 0.6; c.fillStyle = 'rgba(200,235,250,' + (0.65*(1 - ph)).toFixed(3) + ')'; c.beginPath(); c.ellipse(cx + Math.cos(a)*(15 + ph*4), cy - 30 + Math.sin(a)*6 + ph*26, 1.4, 2.4, 0, 0, 7); c.fill(); }
  } },
  telegrafo: { h:40, base:(w, d) => [2, d*0.25, w - 4, d*0.7], fermo(c, w, d, o, r){
    const x = 2, y = 9, ww = w - 4, dd = d - 11, h = 22, ty = y - h, fy = y + dd - h;
    cubo(c, x, y, ww, dd, h, '#6a4e32', '#4e3824');
    for(let k = 0; k < 3; k++){ const px = x + 4 + k*(ww - 8)/3, pw = (ww - 8)/3 - 3; c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(px, fy + 4, pw, 6); c.fillStyle = '#c9a35a'; c.fillRect(px + pw/2 - 2, fy + 6.5, 4, 1.2); }
    c.fillStyle = '#2a2420'; c.fillRect(10, ty + 4, 16, 9); c.fillStyle = '#c9a35a'; c.fillRect(12, ty + 7.5, 13, 2); c.fillStyle = '#1a1414'; c.beginPath(); c.arc(24, ty + 8.5, 2.4, 0, 7); c.fill();
    c.fillStyle = '#2a2420'; c.fillRect(34, ty + 3, 18, 10); [38, 47].forEach(px => cilindro(c, px, ty + 9, 3.2, 1.6, 7, '#b8914e', '#8a6a32'));
    cilindro(c, 66, ty + 9, 5, 2.4, 7, '#efe8d8', '#d8cfbe');
    c.fillStyle = '#efe8d8'; c.beginPath(); c.moveTo(68, ty + 11); c.lineTo(72, ty + 11); c.bezierCurveTo(74, fy + 6, 66, fy + 12, 72, y + dd - 3); c.lineTo(69, y + dd - 3); c.bezierCurveTo(63, fy + 12, 71, fy + 6, 68, ty + 11); c.fill();
    c.fillStyle = 'rgba(40,30,20,.6)'; for(let k = 0; k < 6; k++) c.fillRect(69.5 + Math.sin(k)*1.2, fy + 2 + k*3, k & 1 ? 2.2 : 0.9, 0.8);
    c.fillStyle = '#e3d8bc'; c.save(); c.translate(84, ty + 8); c.rotate(0.15); c.fillRect(-6, -5, 12, 10); c.restore();
    c.fillStyle = '#16141a'; c.beginPath(); c.arc(80, ty + 14, 2.4, 0, 7); c.fill();
  }, vivo(c, w, d, o, t){ if(Math.sin(t*12) > 0.3){ const ty = 9 - 22; c.fillStyle = 'rgba(255,200,120,.25)'; c.beginPath(); c.arc(43, ty + 3, 5, 0, 7); c.fill(); c.fillStyle = 'rgba(255,200,120,.95)'; c.beginPath(); c.arc(43, ty + 3, 1.6, 0, 7); c.fill(); } } },
  computer: { h:50, base:(w, d) => [0, d*0.25, w, d*0.7], fermo(c, w, d, o, r){
    const y = 10, dd = d - 12, h = 20, ty = y - h, sx = w/2 - 17, sy = ty - 22;
    c.fillStyle = '#23263a'; c.fillRect(sx - 2, sy - 2, 38, 26); c.fillStyle = '#2f3348'; c.fillRect(sx - 2, sy - 6, 38, 4);
    c.fillStyle = '#0d2a22'; c.fillRect(sx, sy, 34, 22);
    c.fillStyle = '#2b2f3d'; c.fillRect(sx + 14, sy + 24, 6, 4);
    cubo(c, 0, y, w, dd, h, '#5a4434', '#43322a');
    c.fillStyle = '#2a2d3a'; c.fillRect(w/2 - 13, ty + 6, 26, 6); c.fillStyle = 'rgba(200,210,230,.3)'; for(let a = 0; a < 8; a++) for(let b = 0; b < 2; b++) c.fillRect(w/2 - 12 + a*3.2, ty + 7 + b*2.4, 2.2, 1.4);
    c.fillStyle = '#e8e0d0'; c.beginPath(); c.ellipse(w - 8, ty + 8, 3, 2, 0, 0, 7); c.fill();
    c.fillStyle = '#2a2420'; c.fillRect(5, ty + 6, 6, 2); c.fillRect(7.3, ty - 6, 1.4, 12);
    c.fillStyle = '#2f6a4a'; c.beginPath(); c.moveTo(3, ty - 6); c.lineTo(13, ty - 6); c.lineTo(11, ty - 11); c.lineTo(5, ty - 11); c.fill();
  }, vivo(c, w, d, o, t){
    const ty = 10 - 20, sx = w/2 - 17, sy = ty - 22, g = 0.6 + 0.25*Math.sin(t*2.2);
    c.fillStyle = 'rgba(90,209,154,' + (0.16*g).toFixed(3) + ')'; c.fillRect(sx - 8, sy - 8, 50, 38);
    for(let k = 0; k < 4; k++){ const lw = 10 + ((k*7 + Math.floor(t*3)) % 18); c.fillStyle = 'rgba(140,240,190,' + (0.55 + 0.3*Math.sin(t*4 + k)).toFixed(3) + ')'; c.fillRect(sx + 3, sy + 3 + k*5, lw, 2); }
    c.fillStyle = 'rgba(255,230,160,.18)'; c.beginPath(); c.ellipse(8, ty + 2, 8, 4, 0, 0, 7); c.fill();
  } },
  pilastro: { h:80, base:(w, d) => [2, d*0.3, w - 4, d*0.65], fermo(c, w, d, o, r){
    const cx = w/2, y = 12, dd = d - 14, cy = y + dd/2 - 7;
    cubo(c, 3, y, w - 6, dd, 7, '#c9c0d4', '#a79db4');
    cilindro(c, cx, cy, 9, 4, 57, '#ddd5e6', '#c4bad0');
    c.strokeStyle = 'rgba(80,60,100,.22)'; c.lineWidth = 0.8;
    for(let k = -2; k <= 2; k++){ c.beginPath(); c.moveTo(cx + k*3.4, cy + 4*Math.sqrt(Math.max(0, 1 - (k/2.7)*(k/2.7)))); c.lineTo(cx + k*3.4, cy - 55); c.stroke(); }
    cubo(c, 2, y + 1, w - 4, dd - 2, 72, '#e8e1ef', '#cfc6da', 64);
    c.fillStyle = 'rgba(212,175,98,.6)'; c.fillRect(2, y + dd - 1 - 66, w - 4, 1);
  } },
  poltrona: { h:34, base:(w, d) => [2, d*0.25, w - 4, d*0.7], fermo(c, w, d, o, r){
    const col = '#6e2430';
    c.fillStyle = '#1a1210'; [[6, 27], [w - 8, 27]].forEach(([a, b]) => c.fillRect(a, b - 3, 2, 4));
    c.fillStyle = tinta(col, -0.35); c.beginPath(); c.moveTo(5, 10); c.lineTo(5, -12); c.quadraticCurveTo(w/2, -22, w - 5, -12); c.lineTo(w - 5, 10); c.fill();
    c.fillStyle = col; c.beginPath(); c.moveTo(7, 10); c.lineTo(7, -10); c.quadraticCurveTo(w/2, -18, w - 7, -10); c.lineTo(w - 7, 10); c.fill();
    c.fillStyle = 'rgba(0,0,0,.35)'; [[w/2 - 5, -8], [w/2 + 5, -8], [w/2, -2], [w/2 - 5, 4], [w/2 + 5, 4]].forEach(([a, b]) => { c.beginPath(); c.arc(a, b, 0.9, 0, 7); c.fill(); });
    cubo(c, 6, 10, w - 12, 15, 11, tinta(col, 0.12), tinta(col, -0.2));
    cubo(c, 2, 6, 6, 20, 16, tinta(col, 0.05), tinta(col, -0.28)); cubo(c, w - 8, 6, 6, 20, 16, tinta(col, 0.05), tinta(col, -0.28));
    c.fillStyle = 'rgba(255,230,200,.12)'; c.fillRect(8, -8, 3, 14);
  } },
  candelabro: { h:62, tondo:true, base:(w, d) => [8, d*0.45, w - 16, d*0.4], fermo(c, w, d, o, r){
    const cx = w/2, cy = d*0.65;
    c.fillStyle = '#6e5426'; c.beginPath(); c.ellipse(cx, cy, 8, 3.5, 0, 0, 7); c.fill(); c.fillStyle = '#a07a32'; c.beginPath(); c.ellipse(cx, cy - 1.5, 6, 2.5, 0, 0, 7); c.fill();
    const g = c.createLinearGradient(cx - 2, 0, cx + 2, 0); g.addColorStop(0, '#8a6a2a'); g.addColorStop(0.5, '#e2c47a'); g.addColorStop(1, '#7a5a22');
    c.fillStyle = g; c.fillRect(cx - 1.5, cy - 50, 3, 49); c.beginPath(); c.ellipse(cx, cy - 20, 3.2, 1.6, 0, 0, 7); c.fill();
    c.strokeStyle = '#c9a35a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx - 11, cy - 46); c.quadraticCurveTo(cx, cy - 36, cx + 11, cy - 46); c.stroke();
    [-11, -5.5, 0, 5.5, 11].forEach(a => { const yy = cy - (a === 0 ? 50 : 44 - Math.abs(a)*0.2); c.fillStyle = '#a07a32'; c.fillRect(cx + a - 2, yy, 4, 1.6); c.fillStyle = '#efe6d0'; c.fillRect(cx + a - 1, yy - 5, 2, 5); });
  }, vivo(c, w, d, o, t){ const cx = w/2, cy = d*0.65; [-11, -5.5, 0, 5.5, 11].forEach((a, i) => fiamma(c, cx + a, cy - (a === 0 ? 50 : 44 - Math.abs(a)*0.2) - 6, t, i + o.x*3)); } },
  arpa: { h:58, base:(w, d) => [5, d*0.45, w - 10, d*0.45], fermo(c, w, d, o, r){
    const cy = d*0.72, sb = x => cy - 6 - (x - 9)/16*34;
    cubo(c, 5, cy - 8, 22, 8, 5, '#6a4428', '#4a2e1a');
    c.strokeStyle = 'rgba(240,230,210,.7)'; c.lineWidth = 0.5; c.beginPath();
    for(let x = 11; x < 25; x += 1.5){ const top = cy - 52 + (x - 8)*0.55 + Math.sin((x - 8)/16*Math.PI)*-4; c.moveTo(x, top); c.lineTo(x, sb(x)); }
    c.stroke();
    c.strokeStyle = '#8a5a32'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(9, cy - 6); c.lineTo(25, cy - 40); c.stroke();
    c.strokeStyle = '#c9a35a'; c.lineWidth = 3; c.beginPath(); c.moveTo(8, cy - 5); c.lineTo(8, cy - 52); c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(8, cy - 52); c.bezierCurveTo(14, cy - 58, 20, cy - 40, 25, cy - 41); c.stroke(); c.lineCap = 'butt';
    c.fillStyle = '#e2c47a'; c.beginPath(); c.arc(8, cy - 54, 2.2, 0, 7); c.fill();
  } },
  sacchi: { h:28, base:(w, d) => [2, d*0.3, w - 4, d*0.6], fermo(c, w, d, o, r){
    const sacco = (x, y, sw, sh, col) => {
      c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x + sw/2, y, sw/2 + 2, 3, 0, 0, 7); c.fill();
      c.fillStyle = col; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 3, y - sh*0.55, x + sw*0.22, y - sh); c.lineTo(x + sw*0.78, y - sh); c.quadraticCurveTo(x + sw + 3, y - sh*0.55, x + sw, y); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(x + sw*0.62, y); c.quadraticCurveTo(x + sw + 3, y - sh*0.55, x + sw*0.78, y - sh); c.lineTo(x + sw, y); c.fill();
      c.fillStyle = tinta(col, -0.12); c.beginPath(); c.moveTo(x + sw*0.3, y - sh); c.lineTo(x + sw*0.36, y - sh - 5); c.lineTo(x + sw*0.64, y - sh - 5); c.lineTo(x + sw*0.7, y - sh); c.fill();
      c.fillStyle = '#6a4a2a'; c.fillRect(x + sw*0.3, y - sh - 1, sw*0.4, 1.4);
      c.strokeStyle = 'rgba(140,70,50,.55)'; c.lineWidth = 0.9; c.beginPath(); c.arc(x + sw/2, y - sh*0.45, sw*0.16, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x + sw*0.36, y - sh*0.45); c.lineTo(x + sw*0.64, y - sh*0.45); c.stroke();
    };
    sacco(4, d - 3, 18, 20, '#d8cba8'); sacco(24, d - 6, 17, 22, '#cfc09a'); sacco(43, d - 3, 17, 18, '#ddd2b4');
  } },
  dispensa: { h:50, base:(w, d) => [0, d*0.3, w, d*0.7], fermo(c, w, d, o, r){
    const y0 = d*0.3, dd = d - y0 - 1, h = 46, fy = y0 + dd - h, ty = y0 - h;
    c.fillStyle = '#3a2618'; c.fillRect(1, fy, w - 2, h); c.fillStyle = '#5e4028'; c.fillRect(1, ty, w - 2, dd);
    const top = fy + 3, rh = (h - 7)/3;
    for(let k = 0; k < 3; k++){
      const y1 = top + (k + 1)*rh; c.fillStyle = '#1a120c'; c.fillRect(4, top + k*rh + 1, w - 8, rh - 2);
      for(let x = 6, q = 0; x < w - 8; q++){
        const tipo = r(k*20 + q);
        if(tipo < 0.4){ const jw = 6; c.fillStyle = 'rgba(200,215,220,.55)'; c.fillRect(x, y1 - 10, jw, 9); c.fillStyle = ['#c9a35a', '#8a3a2a', '#e8dfc8', '#5a7a3a', '#c45a3a'][(r(k*20 + q + 50)*5)|0]; c.fillRect(x + 0.8, y1 - 7, jw - 1.6, 5.5); c.fillStyle = '#7a5a3a'; c.fillRect(x - 0.3, y1 - 11, jw + 0.6, 1.8); x += jw + 2; }
        else if(tipo < 0.65){ c.fillStyle = '#2a4a2a'; c.fillRect(x + 1, y1 - 12, 3.2, 11); c.fillRect(x + 1.8, y1 - 15, 1.6, 3); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(x + 1.4, y1 - 11, 0.8, 7); x += 6; }
        else if(tipo < 0.85){ c.fillStyle = '#e3b04a'; c.beginPath(); c.ellipse(x + 5, y1 - 4, 5, 3.4, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, y1 - 4, 10, 1); x += 12; }
        else { c.fillStyle = '#c9b48a'; c.beginPath(); c.ellipse(x + 4, y1 - 4.5, 4, 4.5, 0, 0, 7); c.fill(); x += 9; }
      }
      c.fillStyle = '#6b4a2e'; c.fillRect(3, y1 - 1.5, w - 6, 2);
    }
    c.fillStyle = '#4e321e'; c.fillRect(1, fy, 3, h); c.fillRect(w - 4, fy, 3, h);
    c.fillStyle = '#b06a3a'; c.beginPath(); c.arc(12, ty + dd/2, 4.5, 0, 7); c.fill(); c.fillStyle = '#d8cba8'; c.fillRect(w - 20, ty + 4, 12, 7);
  } },
  rastrelliera: { h:46, base:(w, d) => [0, d*0.3, w, d*0.7], fermo(c, w, d, o, r){
    const y0 = d*0.3, dd = d - y0 - 1, h = 42, fy = y0 + dd - h, ty = y0 - h;
    c.fillStyle = '#2e1e14'; c.fillRect(1, fy, w - 2, h); c.fillStyle = '#4e3220'; c.fillRect(1, ty, w - 2, dd);
    const nx = Math.floor((w - 8)/7), ny = 5;
    for(let j = 0; j < ny; j++) for(let i = 0; i < nx; i++){
      const bx = 4 + 3.5 + i*7 + (j & 1)*3.5, by = fy + 5 + j*7.6; if(bx > w - 6) continue;
      const q = r(j*40 + i);
      c.fillStyle = q < 0.12 ? '#0e0a08' : (q < 0.6 ? '#22401f' : '#3a1a14'); c.beginPath(); c.arc(bx, by, 2.8, 0, 7); c.fill();
      if(q >= 0.12){ c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(bx - 0.9, by - 0.9, 0.9, 0, 7); c.fill(); }
    }
    c.strokeStyle = '#5a3a24'; c.lineWidth = 1.4; c.beginPath();
    for(let x = -h; x < w; x += 10){ c.moveTo(x, fy + h); c.lineTo(x + h, fy); c.moveTo(x + h, fy + h); c.lineTo(x, fy); }
    c.save(); c.beginPath(); c.rect(1, fy, w - 2, h); c.clip(); c.stroke(); c.restore();
    c.fillStyle = '#5a3a24'; c.fillRect(1, fy, w - 2, 3); c.fillRect(1, fy + h - 3, w - 2, 3); c.fillRect(1, fy, 3, h); c.fillRect(w - 4, fy, 3, h);
  } },
  albero: { h:74, tondo:true, base:(w, d) => [4, d*0.45, w - 8, d*0.45], fermo(c, w, d, o, r){
    const cx = w/2, cy = d*0.72;
    cilindro(c, cx, cy, 10, 4.5, 13, '#5a3a24', '#b0623c');
    c.fillStyle = '#3a2416'; c.beginPath(); c.ellipse(cx, cy - 13, 8.5, 3.5, 0, 0, 7); c.fill();
    c.fillStyle = '#5a3e26'; c.beginPath(); c.moveTo(cx - 2.5, cy - 13); c.lineTo(cx - 1.2, cy - 40); c.lineTo(cx + 1.2, cy - 40); c.lineTo(cx + 2.5, cy - 13); c.fill();
    const blob = (x, y, R, col) => { c.fillStyle = col; c.beginPath(); c.arc(cx + x, cy + y, R, 0, 7); c.fill(); };
    blob(0, -44, 16, 'rgba(0,0,0,.25)');
    [[-8, -46, 10, '#24451f'], [8, -46, 10, '#24451f'], [0, -52, 11, '#2c5427'], [-5, -40, 9, '#2f5a2a'], [6, -41, 9, '#2f5a2a'], [-6, -55, 8, '#386a31'], [5, -56, 8, '#3d7034'], [0, -47, 9, '#356530']].forEach(([x, y, R, col]) => blob(x, y, R, col));
    c.fillStyle = 'rgba(210,255,180,.13)'; [[-6, -57, 4], [3, -58, 3.5], [-9, -49, 3]].forEach(([x, y, R]) => { c.beginPath(); c.arc(cx + x, cy + y, R, 0, 7); c.fill(); });
  } },
  panchina: { h:20, base:(w, d) => [2, d*0.3, w - 4, d*0.55], fermo(c, w, d, o, r){
    cubo(c, 7, 12, 8, 10, 8, '#6e6a60', '#5e5a52'); cubo(c, w - 15, 12, 8, 10, 8, '#6e6a60', '#5e5a52');
    cubo(c, 2, 10, w - 4, 13, 13, '#a39e90', '#8a8578', 8);
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(4, -2, w - 8, 1.2);
    c.fillStyle = 'rgba(60,90,50,.4)'; c.beginPath(); c.ellipse(w - 9, 21, 5, 1.6, 0, 0, 7); c.fill();
  } },
  armadietto: { h:44, base:(w, d) => [2, d*0.3, w - 4, d*0.65], fermo(c, w, d, o, r){
    cubo(c, 3, 9, w - 6, 18, 38, '#525c66', '#3c454e');
    const fy = 9 + 18 - 38;
    for(let k = 0; k < 3; k++){ const y = fy + 2 + k*12; c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(5, y, w - 10, 10.5); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(5, y, w - 10, 1); c.fillStyle = '#b8bec6'; c.fillRect(w/2 - 4, y + 4, 8, 1.6); c.fillStyle = '#e8e0d0'; c.fillRect(w/2 - 3, y + 1.6, 6, 2); }
    c.fillStyle = '#e3d8bc'; c.fillRect(7, 9 - 38 + 3, 12, 8); c.fillStyle = '#d0c4a2'; c.fillRect(8, 9 - 38 + 1.5, 12, 8);
  } },
  cavalletto: { h:56, base:(w, d) => [5, d*0.5, w - 10, d*0.4], fermo(c, w, d, o, r){
    const cx = w/2, cy = d*0.75;
    c.strokeStyle = '#5a3e26'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy - 52); c.lineTo(cx + 1, cy - 8); c.stroke();
    c.strokeStyle = '#7a5a36'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(cx - 1, cy - 52); c.lineTo(cx - 10, cy); c.moveTo(cx + 1, cy - 52); c.lineTo(cx + 10, cy); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(cx - 11, cy - 46, 24, 26);
    c.fillStyle = '#efe8d8'; c.fillRect(cx - 12, cy - 47, 24, 25);
    const g = c.createLinearGradient(0, cy - 46, 0, cy - 30); g.addColorStop(0, '#5a7aa0'); g.addColorStop(1, '#c9b48a'); c.fillStyle = g; c.fillRect(cx - 11, cy - 46, 22, 14);
    c.fillStyle = '#4f7a4a'; c.beginPath(); c.moveTo(cx - 11, cy - 23); c.lineTo(cx - 11, cy - 32); c.quadraticCurveTo(cx - 2, cy - 38, cx + 6, cy - 31); c.lineTo(cx + 6, cy - 23); c.fill();
    c.fillStyle = '#7a5a36'; c.fillRect(cx - 14, cy - 22, 28, 2.4);
    c.fillStyle = '#c9a888'; c.beginPath(); c.ellipse(cx + 12, cy - 2, 6, 3, 0.3, 0, 7); c.fill(); [['#c43a3a', 10, -3], ['#3a5aa8', 13, -1], ['#e3b04a', 15, -3]].forEach(([col, a, b]) => { c.fillStyle = col; c.beginPath(); c.arc(cx + a, cy + b, 1.1, 0, 7); c.fill(); });
  } },
  baule: { h:26, base:(w, d) => [3, d*0.3, w - 6, d*0.6], fermo(c, w, d, o, r){
    const x = 4, y = 8, ww = w - 8, dd = d - 12, h = 18, fy = y + dd - h;
    cubo(c, x, y, ww, dd, h, '#7a5030', '#5e3c22');
    c.fillStyle = 'rgba(255,230,190,.12)'; c.fillRect(x, y - h, ww, 3);
    c.fillStyle = '#3a2a1a'; [0.22, 0.78].forEach(q => { c.fillRect(x + ww*q - 2, y - h, 4, dd + h); });
    c.fillStyle = '#b8914e'; [[x, fy], [x + ww - 3, fy], [x, y + dd - 3], [x + ww - 3, y + dd - 3]].forEach(([a, b]) => c.fillRect(a, b, 3, 3));
    c.fillRect(x + ww/2 - 3, fy + 1, 6, 6); c.fillStyle = '#2a1a10'; c.fillRect(x + ww/2 - 0.8, fy + 3, 1.6, 3);
  } },
};
// i mobili che da subito esistono solo come immagine di Blender: se le immagini non arrivano resta un volume semplice della misura giusta (così si vede dove si sbatte)
[['sedia', 30, '#5e4228', '#46301c'], ['sgabello', 20, '#6a4a2c', '#4e3620'], ['tavolino', 26, '#6a4a2c', '#4e3620'], ['scrittoio', 30, '#5a3c24', '#442c1a'], ['mappamondo', 34, '#7a6a4a', '#5a4c34'], ['libri', 18, '#6e3a34', '#50281f'],
 ['credenza', 40, '#5a3c24', '#442c1a'], ['vaso', 26, '#8a6a4a', '#664c34'], ['statua', 54, '#a5a095', '#7c776d'], ['banco_attrezzi', 30, '#5e4a34', '#463624'], ['armadio', 52, '#553a24', '#402a1a'], ['campana', 44, '#4a4a4e', '#333338'],
 ['lampione', 56, '#2c2c30', '#1e1e22'], ['fioriera', 22, '#7a5a42', '#5a402e'], ['leggio', 32, '#6e5636', '#524026'], ['divano', 26, '#5a2f36', '#432228'], ['tavolo_cucina', 28, '#7a5a3a', '#5a4028'], ['bottiglie', 46, '#4a3a2a', '#35291d'],
 ['cesto', 20, '#8a7044', '#675230'], ['stufa', 36, '#3a3a3e', '#28282c'], ['scrivania', 28, '#5e4a34', '#463624'], ['schedario', 40, '#5a6268', '#42484e'], ['bitta', 18, '#4a4038', '#352e28'], ['botti', 34, '#6a4a2c', '#4e3620'],
 ['reti', 16, '#6a6048', '#4e4634'], ['banco_serra', 26, '#6a5236', '#4e3c26'], ['valigie', 24, '#6a4a2c', '#4e3620'], ['regolatore', 50, '#6a5a3a', '#4e4228'], ['contrappesi', 44, '#4a4a4e', '#333338'], ['volante', 20, '#3a3a3e', '#28282c'], ['legna', 26, '#6a4a2c', '#4e3620'], ['quadro_luci', 44, '#4a4a4e', '#333338'], ['lavatoio', 26, '#8a8a84', '#6a6a64'], ['asse_stiro', 22, '#8a7a64', '#675a48'], ['scala', 40, '#6a4a2c', '#4e3620'], ['tavolo_mappe', 28, '#5a3c24', '#442c1a'], ['rotoli', 26, '#a08a64', '#7a6848'], ['teca', 34, '#6a5236', '#4e3c26'], ['tele', 30, '#6a5236', '#4e3c26'], ['violoncello', 44, '#6a3a22', '#4e2a18'], ['tavolo_basso', 18, '#5a3c24', '#442c1a']].forEach(([n, h, a, b]) => {
  MOBILI[n] = { h, base:(w, d) => [3, d*0.2, w - 6, d*0.72], fermo(c, w, d){ cubo(c, 3, d*0.2, w - 6, d*0.72, h, a, b); } };
});
// la figurina di un mobile (una tela per mobile e risoluzione)
function figurina(M, o, k, res){
  return prendi('F|' + M.nome + '|' + k + '|' + res, () => {
    const mod = MOBILI[o.t]; if(!mod) return null;
    const w = o.w*T, d = o.h*T, m = 16, su = mod.h + m, W = w + 2*m, H = d + su + m;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(W*res); cv.height = Math.ceil(H*res);
    const c = cv.getContext('2d'); c.setTransform(res, 0, 0, res, m*res, su*res);
    mod.fermo(c, w, d, o, n => fisso(o.x*7 + n, o.y*13 + k, n), M);
    return { cv, px:cv.width*cv.height, ox:-m, oy:-su, w:W, h:H };
  });
}
// altezza di un mobile sopra la sua impronta (per sapere se è sullo schermo)
// (con M e k: se il mobile ha il ritaglio di Blender, conta il suo rettangolo, che può essere più alto del disegno a codice)
function altezzaMobile(o, M, k){
  const m = MOBILI[o.t]; let h = m ? m.h + 16 : 0;
  const im = M && M._im && M._im.mobili && M._im.mobili.get(k); if(im) h = Math.max(h, o.y*T - im.y);
  return h;
}
function disegnaMobile(c, M, o, k, res, t, eff, pit){
  const mod = MOBILI[o.t]; if(!mod) return;
  const x = o.x*T, y = o.y*T, r = immMobile(M, k);
  if(r || immFondoCopre(M, k)){   // il mobile di Blender (nel fondo, e col suo ritaglio sopra): le fiamme sono tolte dal render (restano le luci), le parti vive sono quelle fatte su misura per l'immagine
    if(r){ const g = c.globalAlpha; c.globalAlpha = g*immDissolvi(M._im, r.img); c.drawImage(r.img, r.x, r.y, r.w, r.h); c.globalAlpha = g; fiammeDi(c, r.fl, t, k); }
    // l'ingranaggio: la ruota grande non è nel ritaglio, gira lei col compito (dall'angolo fermo, 0); finché non è arrivata non si disegna quella a codice
    if(o.t === 'ingranaggio' && immIndiceHa(M, 'ruota')){ immAnimata(c, M, 'ruota', 0, 0, (eff || []).some(e => e.k === 'compito' && e.v === 'ingranaggio') ? t*6 : 0); return; }
    const v = VIVO_IMM[o.t];
    if(v){ c.save(); v(c, o, t, eff, pit); c.restore(); }
    else if(VIVO_SOLO_PARTICELLE[o.t] && mod.vivo){ c.save(); c.translate(x, y); mod.vivo(c, o.w*T, o.h*T, o, t, eff, pit); c.restore(); }   // (poi niente: le parti vive del disegno a codice sono tarate su quel disegno)
    return;
  }
  const f = figurina(M, o, k, res); if(f.cv) c.drawImage(f.cv, x + f.ox, y + f.oy, f.w, f.h);                    // la riserva: il disegno a codice
  // le parti vive (fiamme, schermi, acqua) a codice sopra il disegno
  if(mod.vivo){ c.save(); c.translate(x, y); mod.vivo(c, o.w*T, o.h*T, o, t, eff, pit); c.restore(); }
}
// ── Le parti vive sopra le immagini di Blender ──
// Blender mette ogni mobile con X verso est, Y verso nord (dal bordo sud dell'impronta) e Z in su, in caselle; sullo schermo del gioco il punto (X, Y, Z)
// diventa (x, y - z). Le posizioni qui sotto vengono dagli stessi numeri degli script di Blender (blender/lanterne_mobili*.py): così fiamme e schermi
// cadono dove stanno nell'immagine. I mobili che non sono qui non hanno parti vive sulle immagini: meglio fermo che sbagliato.
const bl = (o, X, Y, Z) => [(o.x + X)*T, (o.y + o.h - Y - Z)*T];
const VIVO_SOLO_PARTICELLE = { aiuola:1 };   // l'acqua del compito (gocce): non dipende da dove sta il disegno
// la fiamma di una candela vera, piccola: x, y è la base dello stoppino
function fiammaBl(c, x, y, t, k, s = 1){
  if(LUCI_ACCESE && !LUCI_ACCESE(x, y)) return;   // (luci staccate: la fiamma non c'è)
  const fl = 0.8 + 0.2*Math.sin(t*11 + k*2.3) + 0.06*Math.sin(t*27 + k);
  c.fillStyle = 'rgba(255,190,90,' + (0.14*fl).toFixed(3) + ')'; c.beginPath(); c.arc(x, y - 1.5*s, 4.2*s, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,214,130,.92)'; c.beginPath(); c.ellipse(x, y - 1.3*fl*s, 1.05*s, 2.3*fl*s, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,248,215,.95)'; c.beginPath(); c.ellipse(x, y - 0.8*fl*s, 0.45*s, 1.2*fl*s, 0, 0, 7); c.fill();
}
// un vetro acceso (schermo): un velo che pulsa e qualche riga di testo che scorre; x, y è l'angolo in alto a sinistra
function schermoBl(c, x, y, w, h, t, k, righe){
  c.fillStyle = 'rgba(140,240,190,' + (0.06 + 0.05*Math.sin(t*5 + k*1.3)).toFixed(3) + ')'; c.fillRect(x, y, w, h);
  for(let j = 0; j < righe; j++){
    const lw = (0.25 + 0.6*((j*7 + k*3 + Math.floor(t*2.5)) % 5)/4)*(w - 4);
    c.fillStyle = 'rgba(190,255,230,' + (0.35 + 0.25*Math.sin(t*4 + j + k)).toFixed(3) + ')'; c.fillRect(x + 2, y + 1.6 + j*(h - 3)/righe, lw, 1);
  }
}
const VIVO_IMM = {
  // forno: la bocca ad arco è nera nel render (resta la luce): il fuoco ci balla dentro, tagliato sull'arco
  forno(c, o, t, eff, pit){
    const acceso = (eff || []).some(e => e.k === 'compito' && e.v === 'fuoco');
    const [xa, yb] = bl(o, 0.66, 0.2, 0.72), xb = bl(o, 1.34, 0.2, 0.72)[0], yc = bl(o, 1.0, 0.2, 1.02)[1], cx = (xa + xb)/2, R = (xb - xa)/2;   // (0,72: la cima della soglia di pietra davanti alla bocca: il fuoco nasce dietro, non ci passa sopra)
    const a = acceso ? 1 : 0.62 + Math.sin(t*3)*0.1;
    c.beginPath(); c.moveTo(xa, yb); c.lineTo(xa, yc); c.arc(cx, yc, R, Math.PI, 0); c.lineTo(xb, yb); c.closePath(); c.clip();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(cx, yb, 0, cx, yb, R*1.7); g.addColorStop(0, 'rgba(255,150,60,' + (0.5*a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,110,30,0)');
    c.fillStyle = g; c.fillRect(xa, yc - R, xb - xa, yb - yc + R);
    for(let i = 0; i < 4; i++){   // lingue di fuoco morbide: ovali che si allungano in su e ballano, sempre in movimento
      const fx = xa + (i + 0.5)*(xb - xa)/4 + Math.sin(t*4 + i*2)*0.8, h = (7.5 + 6*(0.5 + 0.5*Math.sin(t*7.3 + i*1.9)))*(acceso ? 1.3 : 1);
      c.save(); c.translate(fx, yb - h*0.4); c.scale(1.15, h*0.6/3.4);
      const f = c.createRadialGradient(0, 0, 0, 0, 0, 3.4); f.addColorStop(0, 'rgba(255,238,175,' + (0.85*a).toFixed(3) + ')'); f.addColorStop(0.45, 'rgba(255,170,70,' + (0.55*a).toFixed(3) + ')'); f.addColorStop(1, 'rgba(255,110,30,0)');
      c.fillStyle = f; c.beginPath(); c.arc(0, 0, 3.4, 0, 7); c.fill(); c.restore();
    }
    if(acceso && Math.random() < 0.5) pit.sparpaglia('fiamma', cx, yb - 6, 1, { v:8, su:18, vita:0.5, r:2.2 });   // (faville piccole: restano dentro la bocca, sotto l'architrave)
  },
  // console: cinque schermi in due altezze
  console(c, o, t){
    const n = 5;
    for(let k = 0; k < n; k++){
      const alto = 0.04*(k % 2), p = bl(o, (k + 0.5)*o.w/n - 0.3, 0.485, 1.17 + alto);
      schermoBl(c, p[0], p[1], 0.6*T, 0.28*T, t, k, 3);
    }
  },
  // computer della sala d'attesa
  computer(c, o, t){
    const p = bl(o, o.w/2 - 0.4, 0.495, 0.7 + 0.67);
    schermoBl(c, p[0], p[1], 0.8*T, 0.57*T, t, 1, 5);
  },
  // fontana: luccichii sull'acqua della vasca, come quelli del mare. Dietro la colonna c'è la vasca alta che copre l'acqua: solo a est, sud e ovest.
  fontana(c, o, t){
    const p = bl(o, o.w/2, o.h/2, 0.37);
    for(let k = 0; k < 6; k++){
      const ciclo = t*0.8 + k*0.31, n = Math.floor(ciclo), f = (ciclo - n)/0.4;
      if(f >= 1) continue;
      const a = Math.sin(f*Math.PI), ang = -0.1*Math.PI + fisso(n, k, 90)*1.2*Math.PI, r = (0.95 + fisso(n, k, 91)*0.4)*T;
      const x = p[0] + Math.cos(ang)*r, y = p[1] + Math.sin(ang)*r*0.88;   // (0,88: a sud l'acqua finisce prima, i luccichii non salgono sul bordo della vasca)
      c.fillStyle = 'rgba(235,245,255,' + (0.7*a).toFixed(3) + ')'; c.fillRect(x - 2.5, y, 5, 1.2); c.fillRect(x - 0.6, y - 1, 1.2, 3.2);
    }
  },
};
// le fiamme delle candele di fondo (posizioni in caselle sullo schermo, le manda Blender in indice.json): solo se il pezzo che le contiene è arrivato, o se sotto c'è l'anteprima
function candeleVive(c, M, t, x0, y0, x1, y1){
  const m = M._im; if(!m || m.stato !== 2 || !immAcceso() || !m.fiamme) return;
  const L = PEZZO*T;
  for(let n = 0; n < m.fiamme.length; n++){
    const q = m.fiamme[n], x = q[0]*T, y = q[1]*T;
    if(x < x0 || x > x1 || y < y0 || y > y1) continue;
    const i = Math.floor(x/L), j = Math.floor(y/L), ch = 'p' + i + '_' + j;
    if(!m.ante && m.pz.has(j*16 + i) && !cerca(m.k[ch] || (m.k[ch] = 'I|' + m.nome + '|' + ch))) continue;
    fiammaBl(c, x, y, t, 30 + n, q[2]);
  }
}
// le fiamme di un mobile, sopra il suo ritaglio
function fiammeDi(c, lista, t, k){ if(lista) for(let n = 0; n < lista.length; n++) fiammaBl(c, lista[n][0]*T, lista[n][1]*T, t, k + n, lista[n][2]); }
// le fiamme delle torce sui muri (vive)
function torceVive(c, M, t, x0, y0, x1, y1){
  if(M._im && M._im.stato === 2 && M._im.fiamme && immAcceso()) return;   // (con le immagini di Blender anche le fiamme dei muri arrivano da lì, in candeleVive)
  for(const q of prepara(M).torce){
    if(q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) continue;
    if(LUCI_ACCESE && !LUCI_ACCESE(q.x, q.y)) continue;
    const fl = 0.6 + Math.sin(t*9 + q.x)*0.2 + Math.sin(t*23 + q.y)*0.1;
    const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, 26); g.addColorStop(0, 'rgba(255,180,80,' + (0.28*fl).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,180,80,0)');
    c.fillStyle = g; c.fillRect(q.x - 26, q.y - 26, 52, 52);
    c.fillStyle = 'rgba(255,190,90,' + fl.toFixed(3) + ')'; c.beginPath(); c.ellipse(q.x, q.y - 2, 3, 4.5, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,240,190,.9)'; c.beginPath(); c.ellipse(q.x, q.y - 1, 1.3, 2.2, 0, 0, 7); c.fill();
  }
}

// La scogliera di Blender a ovest del mare (x 44-46): i massi stanno nell'acqua, onde, luccichii e schiuma cominciano dove finiscono loro.
// SCOGLIO_RIGHE, per ogni riga d'acqua: x in caselle della prima onda, della seconda e dei luccichii. SCOGLIO_RIVA: il filo dei massi, da nord a sud, per la schiuma.
const SCOGLIO_RIGHE = { 45:[45.2, 46.2, 46.2], 46:[45.9, 45.15, 46.2], 47:[45.15, 45.55, 45.55], 48:[45.1, 45, 45.1], 49:[45.15, 45.5, 45.5] };
const SCOGLIO_RIVA = [[46.12, 45.5], [46.12, 45.85], [45.95, 46.15], [45.6, 46.25], [45.25, 46.3], [45.05, 46.45], [45.05, 47], [45, 47.25], [45.02, 47.38], [45.46, 47.42], [45.46, 47.95], [45.1, 48.1], [44.98, 48.3], [44.75, 48.62], [44.8, 48.95], [45.05, 49.25], [45.05, 49.62], [45.4, 49.66], [45.4, 50]];
// ── Il mare vivo: onde che scorrono, luccichii, schiuma sulle rive, cerchi d'acqua, la barca che dondola ──
function mareVivo(c, M, t, x0, y0, x1, y1, onde, res){
  const A = prepara(M); if(!A.acque.length) return;
  const q = M._im && M._im.stato === 2 && immAcceso() ? 0.7 : 1;   // sull'acqua di Blender onde e schiuma sono più discrete
  // le onde: due linee per riga d'acqua, la cresta chiara e il cavo scuro, che scorrono piano
  for(const [ty, a, b] of A.acque){
    if((ty + 1)*T < y0 || ty*T > y1) continue;
    const mg = q < 1 ? 8 : 0;   // (sull'acqua di Blender le onde si fermano prima del bordo di assi di moli e pontile)
    const xa = Math.max(a*T + mg, Math.floor(x0/8)*8), xb = Math.min(b*T - mg, x1); if(xb <= xa) continue;
    const sc = q < 1 && a === 44 ? SCOGLIO_RIGHE[ty] : null;
    for(let k = 0; k < 2; k++){
      const yb = ty*T + 9 + k*15, xk = sc ? Math.max(xa, sc[k]*T) : xa;
      c.lineWidth = 1.4; c.strokeStyle = 'rgba(8,20,32,' + (0.4*q).toFixed(3) + ')'; c.beginPath();
      for(let x = xk; x <= xb; x += 8){ const y = yb + 2 + Math.sin(x*0.05 + t*1.3 + ty*1.7 + k*2.1)*2.4 + Math.sin(x*0.13 - t*2.1 + k)*1; if(x === xk) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
      c.lineWidth = 1; c.strokeStyle = 'rgba(160,205,235,' + (0.16*q).toFixed(3) + ')'; c.beginPath();
      for(let x = xk; x <= xb; x += 8){ const y = yb + Math.sin(x*0.05 + t*1.3 + ty*1.7 + k*2.1)*2.4 + Math.sin(x*0.13 - t*2.1 + k)*1; if(x === xk) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    }
  }
  // luccichii della luna: ogni casella ha il suo, che si accende di rado
  const tx0 = Math.max(0, Math.floor(x0/T)), tx1 = Math.min(M.GW - 1, Math.floor(x1/T)), ty0 = Math.max(0, Math.floor(y0/T)), ty1 = Math.min(M.GH - 1, Math.floor(y1/T)), suBl = q < 1;
  for(let ty = ty0; ty <= ty1; ty++) for(let tx = tx0; tx <= tx1; tx++){
    const k = ty*M.GW + tx; if(!M.ACQUA[k] || M.PAV[k] !== -2) continue;
    for(let q = 0; q < 2; q++){
      const b = Math.sin(t*(1.1 + fisso(tx, ty, 70 + q)) + fisso(tx, ty, 71 + q)*40); if(b < 0.9) continue;
      // (sull'acqua di Blender le prime caselle sotto una riva e a fianco di un pontile hanno davanti la faccia delle assi: il luccichio sta sull'acqua, non sul legno)
      let fx = fisso(tx, ty, 72 + q)*T, fy = fisso(tx, ty, 73 + q)*T;
      if(suBl){ const acq = n => M.ACQUA[n] && M.PAV[n] === -2; if(!acq(k - M.GW)) fy = 9 + fy*(T - 9)/T; if(!acq(k - 1)) fx = Math.max(fx, 6); if(!acq(k + 1)) fx = Math.min(fx, T - 6); if(SCOGLIO_RIGHE[ty] && tx*T + fx < SCOGLIO_RIGHE[ty][2]*T) continue; }
      const a = (b - 0.9)*10, x = tx*T + fx, y = ty*T + fy + Math.sin(t + q)*1.5;
      c.fillStyle = 'rgba(235,245,255,' + (0.75*a).toFixed(3) + ')'; c.fillRect(x - 2.5, y, 5, 1.2); c.fillRect(x - 0.6, y - 1, 1.2, 3.2);
    }
  }
  // la schiuma che lambisce le rive: due righe tratteggiate che scorrono in versi opposti
  const riva = (off, w, alfa, dash, vel) => {
    c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = 'rgba(225,240,250,' + (alfa*q).toFixed(3) + ')'; c.setLineDash(dash); c.lineDashOffset = -t*vel; c.beginPath();
    for(const r of A.rive){
      if(Math.max(r.x1, r.x2) < x0 || Math.min(r.x1, r.x2) > x1 || Math.max(r.y1, r.y2) < y0 || Math.min(r.y1, r.y2) > y1) continue;
      if(suBl && r.x1 === 44*T && (r.nx > 0 || r.y1 === 45*T)) continue;   // (la riva dritta a x=44 sta sotto i massi: lì la schiuma segue il loro filo, qui sotto)
      // (sull'acqua di Blender la riva a sud ha davanti la faccia delle assi e dei conci, a est e a ovest il bordo del pontile: la schiuma sta dove comincia l'acqua vera)
      const o = off + (suBl ? (r.ny > 0 ? 7 : r.nx ? 3 : 0) : 0) + Math.sin(t*2.2 + (r.x1 + r.y1)*0.05)*1.6;
      c.moveTo(r.x1 + r.nx*o, r.y1 + r.ny*o); c.lineTo(r.x2 + r.nx*o, r.y2 + r.ny*o);
    }
    if(suBl && x0 < 47*T && x1 > 44*T && y1 > 45*T) SCOGLIO_RIVA.forEach(([x, y], n) => { const px = x*T + off + Math.sin(t*2.2 + n*0.9)*1.6; if(n) c.lineTo(px, y*T); else c.moveTo(px, y*T); });
    c.stroke();
  };
  riva(3, 2.2, 0.32, [7, 5, 3, 6], 9); riva(7.5, 1.4, 0.16, [2, 11], -6); c.setLineDash([]); c.lineDashOffset = 0; c.lineCap = 'butt';
  // i cerchi d'acqua (passi sul bordo, la barca, i pali)
  for(let i = onde.length - 1; i >= 0; i--){
    const o = onde[i], f = (t - o.t0)/1.6;
    if(f >= 1 || f < 0){ onde.splice(i, 1); continue; }
    c.strokeStyle = 'rgba(200,230,250,' + (0.45*(1 - f)).toFixed(3) + ')'; c.lineWidth = 1.3;
    c.beginPath(); c.ellipse(o.x, o.y, 3 + f*(o.r || 18), (3 + f*(o.r || 18))*0.42, 0, 0, 7); c.stroke();
    if(f > 0.25){ const g = f - 0.25; c.beginPath(); c.ellipse(o.x, o.y, 2 + g*(o.r || 18)*0.8, (2 + g*(o.r || 18)*0.8)*0.42, 0, 0, 7); c.stroke(); }
  }
  // la barca ormeggiata al pontile
  const B = M.barca; if(!B || B.x + 80 < x0 || B.x - 80 > x1 || B.y + 40 < y0 || B.y - 50 > y1) return;
  const bob = Math.sin(t*1.25)*1.6, roll = Math.sin(t*0.95 + 0.6)*0.03;
  // con l'immagine di Blender (ombra sull'acqua, cima e lanterna sono già nel fondo o nel ritaglio) la barca dondola intorno al suo perno
  if(immHa(M, 'barca')){
    // Blender non mette l'ombra della barca sull'acqua: una macchia scura sotto lo scafo, che segue il dondolio
    c.fillStyle = 'rgba(3,10,18,.32)'; c.beginPath(); c.ellipse(B.x + 2, B.y + 10.5 + bob*0.4, 50, 10.5, roll, 0, 7); c.fill();
    immAnimata(c, M, 'barca', 0, bob, roll);
  } else {
    const f = barca(res || 2);
    c.fillStyle = 'rgba(4,12,20,.45)'; c.beginPath(); c.ellipse(B.x, B.y + 8, 52, 14, roll, 0, 7); c.fill();
    c.strokeStyle = 'rgba(180,165,130,.9)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(B.cima[0], B.cima[1]); c.quadraticCurveTo((B.cima[0] + B.x - 44)/2, B.y + 10 + bob, B.x - 44, B.y - 6 + bob); c.stroke();
    c.save(); c.translate(B.x, B.y + bob); c.rotate(roll); if(f.cv) c.drawImage(f.cv, f.ox, f.oy, f.w, f.h);
    const fl = 0.8 + 0.2*Math.sin(t*9); c.fillStyle = 'rgba(255,200,110,' + (0.25*fl).toFixed(3) + ')'; c.beginPath(); c.arc(-36, -21, 9, 0, 7); c.fill(); c.fillStyle = 'rgba(255,226,150,.95)'; c.beginPath(); c.ellipse(-36, -21, 1.4, 2.4*fl, 0, 0, 7); c.fill();
    c.restore();
  }
  if(!B.ultima || t - B.ultima > 1.3){ B.ultima = t; onde.push({ x:B.x + (Math.random() < 0.5 ? -40 : 44), y:B.y + 8 + Math.random()*4, t0:t, r:16 }); }
}
// la barca: scafo con la fiancata, assi, panche, remi, una cima e la lanterna a poppa (tela fatta una volta)
function barca(res){
  res = Math.min(3, Math.ceil(res*10)/10);
  return prendi('B|' + res, () => {
    const W = 120, H = 70, ox = -60, oy = -40, cv = document.createElement('canvas'); cv.width = Math.ceil(W*res); cv.height = Math.ceil(H*res);
    const c = cv.getContext('2d'); c.setTransform(res, 0, 0, res, -ox*res, -oy*res);
    const L = 92, Bm = 30, sx = -46, sy = -22;   // lo scafo visto da sopra: poppa a sinistra, prua a destra
    const forma = new Path2D(); forma.moveTo(sx + 6, sy); forma.lineTo(sx + L*0.62, sy); forma.quadraticCurveTo(sx + L*0.95, sy + 2, sx + L, sy + Bm/2); forma.quadraticCurveTo(sx + L*0.95, sy + Bm - 2, sx + L*0.62, sy + Bm); forma.lineTo(sx + 6, sy + Bm); forma.quadraticCurveTo(sx, sy + Bm/2, sx + 6, sy); forma.closePath();
    for(let z = 11; z > 0; z--){ c.save(); c.translate(0, z); c.fillStyle = tinta('#5a3a22', -0.35 + 0.3*(11 - z)/11); c.fill(forma); c.restore(); }
    c.save(); c.translate(0, 11); c.fillStyle = 'rgba(30,60,70,.55)'; c.fill(forma); c.restore();
    c.save(); c.translate(0, 8); c.fillStyle = '#e8e0d0'; c.globalAlpha = 0.5; c.fill(forma); c.restore(); c.globalAlpha = 1;
    c.fillStyle = '#8a6a44'; c.fill(forma);
    c.save(); c.clip(forma);
    c.fillStyle = '#a07a50'; c.fillRect(sx, sy + 3, L, Bm - 6);
    c.strokeStyle = 'rgba(60,36,20,.45)'; c.lineWidth = 0.8; for(let k = 1; k < 5; k++){ c.beginPath(); c.moveTo(sx, sy + 3 + k*(Bm - 6)/5); c.lineTo(sx + L, sy + 3 + k*(Bm - 6)/5); c.stroke(); }
    c.restore();
    c.strokeStyle = '#4a2e1a'; c.lineWidth = 3; c.stroke(forma); c.strokeStyle = 'rgba(255,230,190,.25)'; c.lineWidth = 1; c.stroke(forma);
    [[sx + 22, 6], [sx + 46, 7], [sx + 70, 5]].forEach(([x, w]) => { c.fillStyle = '#6b4a2e'; c.fillRect(x - w/2, sy + 2, w, Bm - 4); c.fillStyle = 'rgba(255,230,190,.15)'; c.fillRect(x - w/2, sy + 2, 1, Bm - 4); });
    c.save(); c.translate(sx + 50, sy + Bm/2); c.rotate(-0.12); c.fillStyle = '#c9a874'; c.fillRect(-36, -9, 70, 2.2); c.fillRect(30, -12, 10, 8); c.rotate(0.22); c.fillRect(-34, 7, 66, 2.2); c.fillRect(28, 5, 10, 8); c.restore();
    c.strokeStyle = '#b8a07a'; c.lineWidth = 1.3; for(let k = 0; k < 3; k++){ c.beginPath(); c.ellipse(sx + L - 18, sy + Bm/2, 6 - k*1.8, 4 - k*1.2, 0, 0, 7); c.stroke(); }
    c.fillStyle = '#2a2420'; c.fillRect(sx + 7, sy + 1, 6, 4); c.fillStyle = '#3a3020'; c.fillRect(sx + 7, -27, 6, 9); c.fillStyle = 'rgba(246,217,153,.9)'; c.fillRect(sx + 8.5, -25.5, 3, 6); c.fillStyle = '#2a2420'; c.fillRect(sx + 6.5, -28, 7, 2);
    return { cv, px:cv.width*cv.height, ox, oy, w:W, h:H };
  });
}

// ── Le luci che si spengono: il pittore dice quali fiamme sono accese (null = tutte). Le torce e le candele spente non si disegnano ──
let LUCI_ACCESE = null;
function luciAccese(f){ LUCI_ACCESE = f; }

// ── L'acqua alta: dove può stare e quanto dista dalle due chiuse, una volta per mappa ──
// dA, dB: distanza in caselle dalla chiusa del Molo e da quella della Cantina, camminando sul pavimento (-1 = non ci arriva). La maschera dice dove l'acqua si vede:
// pavimento libero, senza l'impronta dei mobili e senza la faccia dei muri (che coprono il pavimento a nord). Si fa a 12 punti per casella, con i bordi morbidi.
const ACQUA_K = 12, ACQUA_MURO = 0.8;
function acquaDati(M, A, B){
  if(M._acq) return M._acq;
  const { GW, GH, N, PAV, MURO } = M, K = ACQUA_K;
  const dist = (sx, sy) => {   // il cammino più corto, in diagonale solo se i due lati sono liberi (l'acqua non passa negli spigoli dei muri)
    const d = new Float32Array(N).fill(-1), q = [], ok = i => PAV[i] !== -2;
    const s = sy*GW + sx; if(s < 0 || s >= N || !ok(s)) return d;
    d[s] = 0; q.push(s);
    for(let h = 0; h < q.length; h++){
      const c = q[h], cx = c%GW, cy = (c/GW)|0;
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){
        if(!dx && !dy) continue; const nx = cx + dx, ny = cy + dy; if(nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
        const n = ny*GW + nx; if(!ok(n)) continue;
        if(dx && dy && (!ok(cy*GW + nx) || !ok(ny*GW + cx))) continue;
        const w = d[c] + (dx && dy ? 1.414 : 1); if(d[n] < 0 || w < d[n] - 1e-4){ d[n] = w; q.push(n); }
      }
    }
    return d;
  };
  const dA = dist(A.tx, A.ty), dB = dist(B.tx, B.ty); let dMax = 1; for(let i = 0; i < N; i++){ if(dA[i] > dMax) dMax = dA[i]; if(dB[i] > dMax) dMax = dB[i]; }
  const cv = document.createElement('canvas'); cv.width = GW*K; cv.height = GH*K; const g = cv.getContext('2d');
  g.fillStyle = '#fff';
  for(let y = 0; y < GH; y++){ let x0 = -1; for(let x = 0; x <= GW; x++){ const p = x < GW && PAV[y*GW + x] !== -2; if(p && x0 < 0) x0 = x; if(!p && x0 >= 0){ g.fillRect(x0*K, y*K, (x - x0)*K, K); x0 = -1; } } }
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  for(const o of M.ostacoli) g.fillRect((o.x - 0.06)*K, (o.y - 0.06)*K, (o.w + 0.12)*K, (o.h + 0.12)*K);
  for(let y = 1; y < GH; y++) for(let x = 0; x < GW; x++) if(MURO[y*GW + x] && PAV[(y - 1)*GW + x] !== -2) g.fillRect(x*K, (y - ACQUA_MURO)*K, K, ACQUA_MURO*K);
  return M._acq = { dA, dB, dMax, mask:cv, K };
}

// ===== lenzuolo.js =====
// Il lenzuolo: la stoffa che ogni giocatore ha addosso. Un telo vero a nodi (Verlet e vincoli), tenuto da testa e spalle,
// libero sotto, disegnato su canvas con ombre che nascono dalla forma simulata. Nessuna immagine, nessuna libreria.
// La simulazione ha 24 colonne; il disegno ne ha 48 e traccia solo i contorni (sagoma, pieghe, alone): circa 480 punti a personaggio.
//
// Uso (da persona() in disegno.js):
//   const l = new Lenzuolo({ c:3, m:null }, { seme:7 });     c: indice in LENZUOLI; m: il disegno sul telo ('righe', 'pois', 'quadri'), se il telo non ne ha già uno
//   l.aggiorna(dt, x, y, dir, muove, attivo);                 attivo=false: fuori dalla luce o dallo schermo, non si simula
//   l.disegna(ctx, { x, y, alfa, lanterna, ombra, grigio, t, scala, fine });   x,y: i piedi sul pavimento, nelle coordinate del mondo; fine: più sfumature, per il ritratto
//   l.cadi()  l.subito()  l.spegni(stretto)  l.fantasma(si)   caduta in saletta, posa pronta, telo afflosciato (stretto: raccolto lungo un muro), fantasma
//   l.copre()                                                 quanto il telo ha coperto chi sta sotto (0-1): a 1 l'avatar non si disegna più
//   l.cede()                                                  di quante unità la testa di chi sta sotto cede all'impatto del telo
//   l.guarda(x, y)                                            gli occhi vanno verso chi si muove; l.guarda() li libera
//   l.cima()                                                  di quanto sale la testa sopra i piedi, sullo schermo (per il nome)
//   ritrattoLenzuolo(c, lato)                                 mezzo busto fermo, una canvas quadrata per il registro
//   teloLibero(presi)                                         per l'host: il primo telo che nessuno ha. Quindici teli per quindici giocatori, mai due uguali
//
// Coordinate del telo: X a destra, Y verso chi guarda, Z in alto, origine ai piedi. Vista obliqua: LZ_KY schiaccia il
// pavimento, LZ_KZ l'altezza. I nodi stanno rispetto al corpo: spostarsi non scala i numeri e un teletrasporto non tira nulla.

const LZ_C = 24, LZ_R = 7, LZ_N = 1 + LZ_C * LZ_R;       // colonne attorno, anelli dalla testa all'orlo, nodi
const LZ_H = 1 / 60, LZ_MAXP = 2;                         // tempo fisso, al massimo due sotto-passi per fotogramma
const LZ_KY = 0.46, LZ_KZ = 0.888;                        // la vista: sin e cos dell'inclinazione
const LZ_VX = 0, LZ_VY = LZ_KZ, LZ_VZ = LZ_KY;            // verso chi guarda
const LZ_G = 0.2;                                         // gravità per passo al quadrato
const LZ_ARIA = 0.972;                                    // l'aria frena la stoffa
const LZ_SALTO = 46;                                      // oltre questo in un colpo è un teletrasporto: il telo non se ne accorge
const LZ_INERZIA = 0.36;                                   // quanta velocità del corpo sente la stoffa: a piena velocità sbandiererebbe, qui ha il peso di un lenzuolo
const LZ_INERZIA_O = 0.46, LZ_FRUSTA = 1;                // gli ultimi due anelli: restano più indietro e, quando il corpo frena o parte, frustano
const LZ_PIEDE = 8, LZ_RL = 13, LZ_FIANCO = 6, LZ_TORCE = 0.4, LZ_ORLOG = 0.1;          // quanto il piede solleva l'orlo, fin dove arriva, quanto girano le spalle a ogni passo
const LZ_PZ = 11, LZ_PUGNO = 4;                           // la presa della mano: fin dove raccoglie la stoffa, quanto sporge il pugno
const LZ_Z0 = 190, LZ_TC = 0.82;                          // la caduta: da che altezza parte la cima (l'orlo resta 30-40 px sopra la testa) e quanto ci mette ad arrivare
const LZ_VOLOZ = 0.66, LZ_VOLOR = 0.32;                  // in volo è una campana stretta: più bassa del telo addosso e un po' più larga in fondo, circa una volta e mezzo l'omino
const LZ_TIRO = 7.5;                                      // spinta massima per passo: un fotogramma lungo non fa esplodere nulla
const LZ_SEGUE = 0.05;                                    // dopo un giro l'orlo raggiunge il corpo in mezzo secondo
const LZ_ORLOSU = 15;                                     // l'orlo oltre quest'altezza, per più di un attimo, è un telo rovesciato
// il corpo sotto il telo
const LZ_ZT = 55.5, LZ_RT = 12.4, LZ_SP = 0.9;            // testa: altezza del centro, raggio, spessore della stoffa
const LZ_ZS = 38.5, LZ_SX = 18.5, LZ_SY = 10.5, LZ_SZ = 8; // spalle: altezza, semiassi
const LZ_RB = 13;                                         // busto e gambe
const LZ_RP = 5.6;                                        // piedi
const LZ_CIMA = LZ_ZT + LZ_RT + LZ_SP;                    // la cima del telo addosso
const LZ_RM = 5;                                          // la mano che regge la lanterna (solleva il telo)
const LZ_KT = 0.08, LZ_GY = 10, LZ_GS = 28, LZ_CY = 6, LZ_GZ = 4;   // il corpo a terra: quanto resta del corpo; di quanto la testa finisce dietro il punto del giocatore (telo largo e telo raccolto lungo il muro); dove sta il centro della stoffa, davanti alla testa; di quanto la testa resta alzata
const LZ_DPI = 2 * Math.PI;

// i teli: si dicono in chat con una parola. Tinte di stoffa, non da giocattolo. b base, s ombra delle pieghe, l cresta chiara, d interno del telo.
// Gli ultimi tre sono a disegno: a il colore del disegno. Stesse tinte sul pavimento e sotto la lanterna: la prova è in prove/lenzuolo-colori.mjs
const LENZUOLI = [
  { n: 'Rosso',    b: '#b9252b', s: '#661314', l: '#de6f63', d: '#36090b' },
  { n: 'Turchese', b: '#0db6c8', s: '#075f69', l: '#8be0e3', d: '#07393f' },
  { n: 'Senape',   b: '#d8b13d', s: '#8c6a14', l: '#f2dc90', d: '#48370c' },
  { n: 'Viola',    b: '#8b50c2', s: '#4a2474', l: '#c19ae6', d: '#2a1442' },
  { n: 'Verde',    b: '#1a7d5c', s: '#0a4a36', l: '#69c3a3', d: '#082c21' },
  { n: 'Zucca',    b: '#c9620f', s: '#7c3806', l: '#f0a05e', d: '#3d1d05' },
  { n: 'Blu',      b: '#2e49a3', s: '#141f5e', l: '#6f8fe0', d: '#0b1334' },
  { n: 'Confetto', b: '#e486a0', s: '#a24b66', l: '#f6c1d0', d: '#502433' },
  { n: 'Panna',    b: '#eeebe2', s: '#8d8b88', l: '#ffffff', d: '#4d4b4a' },
  { n: 'Oliva',    b: '#979b5e', s: '#565a2c', l: '#cdd09a', d: '#2d2f14' },
  { n: 'Grigio',   b: '#7b7f90', s: '#444753', l: '#b3b7c6', d: '#292b33' },
  { n: 'Nero',     b: '#2b2d36', s: '#15161b', l: '#8a8d9a', d: '#0b0b0e', c: 'rgb(84,82,88)', fori: true },   // c: la luce calda del Nero. Se schiarisse come le altre tinte diventerebbe un grigio
  { n: 'Righe',    b: '#e4dbc7', s: '#8f8776', l: '#fbf6ea', d: '#4a4640', a: '#2d4274', m: 'righe' },
  { n: 'Pois',     b: '#3b2c4d', s: '#1d1428', l: '#7a6890', d: '#120c1a', a: '#e8dcc2', m: 'pois', fori: true },
  { n: 'Quadri',   b: '#e6d9c2', s: '#928672', l: '#fbf4e6', d: '#4c463d', a: '#a93f3a', m: 'quadri' },
];
const lzNebbia = { n: 'Nebbia', b: '#8b8f99', s: '#55585f', l: '#a9acb4', d: '#33353a' };      // nella nebbia non si vede di chi è

// per l'host: il primo telo che nessuno ha. presi: gli indici già assegnati. Nessun DOM, si può chiamare anche lontano dalla canvas.
function teloLibero(presi) {
  const n = LENZUOLI.length, a = presi || [];
  for (let i = 0; i < n; i++) if (a.indexOf(i) < 0) return i;
  return a.length % n;                                                                          // più di quindici non si gioca: resta un numero valido
}

// ---------- la forma: uguale per tutti tranne quattro varianti dell'orlo ----------
let lzTopo = null;
const lzForme = [];

function lzCaso(s) { let v = (s * 2654435761) >>> 0; return () => { v ^= v << 13; v >>>= 0; v ^= v >>> 17; v ^= v << 5; v >>>= 0; return v / 4294967296; }; }
function lzI(i, j) { return i === 0 ? 0 : 1 + (i - 1) * LZ_C + ((j % LZ_C) + LZ_C) % LZ_C; }

function lzTopologia() {
  if (lzTopo) return lzTopo;
  const a = [], b = [], gr = {};
  const metti = (p, q) => { a.push(p); b.push(q); };
  gr.r0 = 0;                                                     // lungo le colonne, dalla testa in giù (così il tiro scende in un giro)
  for (let i = 0; i < LZ_R; i++) for (let j = 0; j < LZ_C; j++) metti(lzI(i, j), lzI(i + 1, j));
  gr.r1 = a.length; gr.a0 = a.length;                            // lungo gli anelli
  for (let i = 1; i <= LZ_R; i++) for (let j = 0; j < LZ_C; j++) metti(lzI(i, j), lzI(i, j + 1));
  gr.a1 = a.length; gr.d0 = a.length;                            // in diagonale, a scacchi: tiene la trama
  for (let i = 1; i < LZ_R; i++) for (let j = 0; j < LZ_C; j++) { if ((i + j) & 1) metti(lzI(i, j), lzI(i + 1, j + 1)); else metti(lzI(i, j + 1), lzI(i + 1, j)); }
  gr.d1 = a.length; gr.p0 = a.length;                            // la memoria delle pieghe lungo gli anelli
  for (let i = 3; i < LZ_R - 1; i++) for (let j = 0; j < LZ_C; j++) metti(lzI(i, j), lzI(i, j + 2));
  gr.p1 = a.length; gr.c0 = a.length;                            // la rigidità lungo le colonne
  for (let i = 2; i < LZ_R; i++) for (let j = 0; j < LZ_C; j++) metti(lzI(i - 1, j), lzI(i + 1, j));
  gr.c1 = a.length; gr.b0 = a.length;                            // sugli ultimi due anelli la stoffa resiste a piegarsi di colpo: gli angoli si arrotondano invece di spezzarsi
  for (let i = LZ_R - 1; i <= LZ_R; i++) for (let j = 0; j < LZ_C; j++) metti(lzI(i, j), lzI(i, j + 2));
  gr.b1 = a.length;
  lzTopo = { ca: Int16Array.from(a), cb: Int16Array.from(b), gr, nc: a.length };
  return lzTopo;
}

// dove si poggia una colonna del telo a distanza s dalla cima: testa, tenda fino alla spalla, gonna, poi strascico a terra
function lzProfilo(s, th, rO, out) {
  const c = Math.cos(th), d = Math.sin(th), rS = 1 / Math.sqrt(c * c / (LZ_SX * LZ_SX) + d * d / (LZ_SY * LZ_SY)) + LZ_SP;
  const R = LZ_RT + LZ_SP, fi = 1.2, s1 = R * fi, ax = R * Math.sin(fi), az = LZ_ZT + R * Math.cos(fi);
  if (s <= s1) { out.r = R * Math.sin(s / R); out.z = LZ_ZT + R * Math.cos(s / R); return; }
  const bx = rS, bz = LZ_ZS + 2, s2 = s1 + Math.hypot(bx - ax, az - bz);
  if (s <= s2) { const u = (s - s1) / (s2 - s1); out.r = ax + (bx - ax) * u; out.z = az + (bz - az) * u; return; }
  const s3 = s2 + Math.hypot(rO - bx, bz);
  if (s <= s3) { const u = (s - s2) / (s3 - s2), g = u * u; out.r = bx + (rO - bx) * (0.35 * u + 0.65 * g); out.z = bz * (1 - u); return; }
  out.r = rO + (s - s3); out.z = 0;
}

function lzForma(k) {
  if (lzForme[k]) return lzForme[k];
  const T = lzTopologia(), N = LZ_N, C = LZ_C, R = LZ_R, rnd = lzCaso(1237 + k * 977);
  const px = new Float32Array(N), py = new Float32Array(N), pz = new Float32Array(N);        // la posa drappeggiata (faccia verso chi guarda)
  const fx = new Float32Array(N), fy = new Float32Array(N), fz = new Float32Array(N);        // il telo steso, aperto
  const lra = new Float32Array(N), bas = new Float32Array(N);                                // distanza massima dalla cima; rilievi a terra
  const f = [0, 0.09, 0.18, 0.28, 0.4, 0.55, 0.74, 1];                                        // gli anelli: fitti sulla testa
  const a0 = 72.5, pw = 2.7, spig = rnd() * LZ_DPI;                                             // mezzo lato; gli spigoli del lenzuolo
  const ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28, rnd() * 6.28];
  const A = [0, 0, 0, 0.5, 2.2, 4, 5.4, 6.4];                                               // quanto sono profonde le pieghe, anello per anello
  const o = { r: 0, z: 0 };
  pz[0] = LZ_ZT + LZ_RT + LZ_SP; fz[0] = 0;
  for (let j = 0; j < C; j++) {
    const th = j / C * LZ_DPI, cu = Math.abs(Math.cos(th - spig)), si = Math.abs(Math.sin(th - spig));
    const L = a0 / Math.pow(Math.pow(cu, pw) + Math.pow(si, pw), 1 / pw) * (1 + 0.035 * Math.sin(3 * th + ph[0]) + 0.02 * (rnd() - 0.5));
    const rO = 20.5 + 3.2 * Math.cos(th) ** 2 + 1.2 * Math.sin(3 * th + ph[1]);             // l'orlo: più largo ai fianchi
    for (let i = 1; i <= R; i++) {
      const u = i <= 4 ? 0 : (i - 4) / (R - 4), Lc = a0 + (L - a0) * u * u, s = f[i] * Lc;
      lzProfilo(s, th, rO, o);
      const n = lzI(i, j), tw = 0.3 * f[i];
      const pieg = 0.62 * Math.cos(5 * th + ph[2] + tw) + 0.5 * Math.cos(7 * th + ph[3] - tw) + 0.3 * Math.cos(3 * th + ph[4]);
      const r = o.r + A[i] * pieg;
      px[n] = r * Math.cos(th); py[n] = r * Math.sin(th); pz[n] = o.z;
      fx[n] = s * Math.cos(th); fy[n] = s * Math.sin(th);
      lra[n] = s * 1.015; bas[n] = i >= 6 ? 0.25 + rnd() * 1.1 : 0.2 + rnd() * 0.3;
    }
  }
  // la posa non deve entrare nel corpo
  const fin = new Lenzuolo({ c: 0 }, null, { px, py, pz }); fin.mz = -60;
  for (let p = 0; p < 3; p++) fin.scosta(px, py, pz);
  // le lunghezze a riposo si misurano sulla posa: le pieghe restano nella stoffa come quelle di un lenzuolo stirato
  const rest = new Float32Array(T.nc), restA = new Float32Array(T.nc);
  for (let c = 0; c < T.nc; c++) {
    const a = T.ca[c], b = T.cb[c];
    rest[c] = Math.hypot(px[b] - px[a], py[b] - py[a], pz[b] - pz[a]);
    restA[c] = Math.hypot(fx[b] - fx[a], fy[b] - fy[a], fz[b] - fz[a]);
  }
  for (let c = T.gr.r0; c < T.gr.r1; c++) rest[c] = restA[c];                                 // lungo le colonne la stoffa non si allunga: vale il telo vero
  // il mucchio non è una focaccia: ogni colonna arriva dove vuole e un lembo arriva più lontano degli altri
  const lim = new Float32Array(C), dis = new Float32Array(C), lembo = rnd() * LZ_DPI;
  for (let j = 0; j < C; j++) {
    const th = j / C * LZ_DPI; let dl = th - lembo; while (dl > Math.PI) dl -= LZ_DPI; while (dl < -Math.PI) dl += LZ_DPI;
    lim[j] = 37 + 5 * Math.sin(2 * th + ph[1]) + 3 * Math.sin(3 * th + ph[2]) + 11 * Math.exp(-dl * dl / 0.26);
    dis[j] = 1 + 0.32 * Math.sin(2 * th + ph[3]) + 0.2 * Math.sin(5 * th + ph[4]);
  }
  // le piegoline: pieghe strette che scendono dalle spalle verso l'orlo, solo nel tono. Sono loro a dire «stoffa fine» e non «feltro»
  const mic = new Float32Array(LZ_DN), W = [0, 0.05, 0.34, 0.66, 0.8, 0.92, 1, 0.82];
  for (let q = 0; q < 15; q++) {
    const c0 = rnd() * LZ_DC, der = (rnd() - 0.5) * 0.9, lar = 0.95 + rnd() * 0.7, pro = 0.28 + rnd() * 0.3, ini = 1 + Math.floor(rnd() * 3), e1 = 1 / (2 * lar * lar), e2 = 1 / (2 * lar * lar * 1.7);
    for (let r = ini; r < LZ_RR; r++) for (let j = 0; j < LZ_DC; j++) {
      let d = j - c0 - der * r; while (d > LZ_DC / 2) d -= LZ_DC; while (d < -LZ_DC / 2) d += LZ_DC;
      const e = d - lar * 1.5;
      mic[1 + r * LZ_DC + j] += W[r] * Math.min(1, (r - ini + 1) / 2) * (-pro * Math.exp(-d * d * e1) + pro * 0.62 * Math.exp(-e * e * e2));
    }
  }
  const F = { px, py, pz, fx, fy, fz, lra, bas, rest, restA, lim, dis, mic, cor: null, gx: [-3, 2, 4, -2][k & 3] };          // gx: da che parte finisce la testa quando il telo crolla
  lzForme[k] = F;
  // l'assestamento una volta sola, per ogni forma: poi chi arriva a partita iniziata ha già il telo a posto
  const l = new Lenzuolo({ c: 0 }, { seme: k }, F);
  l.pronto = true; l.posa(); l.corpo();
  for (let p = 0; p < 110; p++) l.passo(0, 0);
  F.px = l.x.slice(); F.py = l.y.slice(); F.pz = l.z.slice();
  return F;
}

// ---------- due disegnini morbidi, una volta sola: l'ombra a terra e l'alone della lanterna ----------
let lzOmbraT = null, lzAlone = null;
function lzPrepara() {
  if (lzOmbraT) return;
  const o = document.createElement('canvas'); o.width = 96; o.height = 48;
  const oc = o.getContext('2d'); oc.setTransform(1, 0, 0, 0.5, 0, 0);
  const g = oc.createRadialGradient(48, 48, 0, 48, 48, 47); g.addColorStop(0, 'rgba(4,4,10,.62)'); g.addColorStop(0.55, 'rgba(4,4,10,.42)'); g.addColorStop(0.82, 'rgba(4,4,10,.14)'); g.addColorStop(1, 'rgba(4,4,10,0)');
  oc.fillStyle = g; oc.fillRect(0, 0, 96, 96);
  lzOmbraT = o;
  const w = document.createElement('canvas'); w.width = w.height = 48; const wc = w.getContext('2d'), gw = wc.createRadialGradient(24, 24, 0, 24, 24, 23.5);
  gw.addColorStop(0, 'rgba(255,214,140,.5)'); gw.addColorStop(0.3, 'rgba(255,200,120,.14)'); gw.addColorStop(0.65, 'rgba(255,190,110,.04)'); gw.addColorStop(1, 'rgba(255,190,110,0)'); wc.fillStyle = gw; wc.fillRect(0, 0, 48, 48);
  lzAlone = w;
}

// i fogli di lavoro del disegno: uno solo, si disegna un personaggio alla volta. Anelli e colonne raddoppiano solo sullo schermo.
const LZ_RG = [1, 2, 4, 5, 5.5, 6, 6.5, 7], LZ_RR = LZ_RG.length, LZ_DC = LZ_C * 2, LZ_DN = 1 + LZ_DC * LZ_RR, LZ_CL = LZ_DC * LZ_RR;
const lzGx = new Float32Array(LZ_DN), lzGy = new Float32Array(LZ_DN), lzGz = new Float32Array(LZ_DN), lzSx = new Float32Array(LZ_DN * 3), lzSy = new Float32Array(LZ_DN * 3);       // dopo i nodi, i punti dove le curve di livello tagliano i lati
const lzTono = new Float32Array(LZ_DN), lzT2 = new Float32Array(LZ_DN), lzCal = new Float32Array(LZ_DN), lzCell = new Uint8Array(LZ_CL);
// le soglie del tono: due verso il buio, due verso il chiaro. Sono velature: una sopra l'altra fanno la piega, e il disegno del telo resta sotto
const LZ_LIV = [-0.16, -0.46, 0.2, 0.54], LZ_LIVA = [0.3, 0.42, 0.16, 0.24];
const LZ_LIVF = [-0.1, -0.24, -0.4, -0.58, -0.84, 0.14, 0.32, 0.56], LZ_LIVFA = [0.18, 0.2, 0.22, 0.26, 0.32, 0.11, 0.14, 0.22];     // nel ritratto, fermo e grande, un passo di sfumatura in più
const LZ_ORLOC = 4;                                                  // l'orlo cucito si vede solo su tratti dritti di almeno due celle vere
const LZ_WR = [0, 0.3, 1, 0.5], LZ_WA = [0, 0, 0, 0.1, 0.24, 0.48, 0.74, 1];     // quanto respirano gli anelli delle spalle, quanta aria sentono quelli verso l'orlo
const LZ_QR = [0, 1, 1, 0, 0, 1, 1, 0], LZ_OTTA = [1, 0.707, 0, -0.707, -1, -0.707, 0, 0.707];     // le file dei quadri, il giro di un pois
const lzSen = k => { const a = new Float32Array(LZ_DC); for (let j = 0; j < LZ_DC; j++) a[j] = Math.sin(j / LZ_DC * LZ_DPI * k); return a; }, lzCos = k => { const a = new Float32Array(LZ_DC); for (let j = 0; j < LZ_DC; j++) a[j] = Math.cos(j / LZ_DC * LZ_DPI * k); return a; };
const LZ_S3 = lzSen(3), LZ_C3 = lzCos(3), LZ_S4 = lzSen(4), LZ_C4 = lzCos(4), LZ_S5 = lzSen(5), LZ_C5 = lzCos(5);

function lzRidotto() { try { return !!(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } }

class Lenzuolo {
  constructor(d, o, forma) {
    d = d || {}; o = o || {};
    this.c = ((d.c | 0) % LENZUOLI.length + LENZUOLI.length) % LENZUOLI.length; this.m = d.m || LENZUOLI[this.c].m || null;        // m: il disegno sul telo
    this.seme = o.seme | 0;
    const n = LZ_N;
    this.x = new Float32Array(n); this.y = new Float32Array(n); this.z = new Float32Array(n);
    this.ox = new Float32Array(n); this.oy = new Float32Array(n); this.oz = new Float32Array(n);
    this.F = forma && forma.lra ? forma : null;
    this.stato = 'su';      // su · cade · steso · fantasma
    this.fermoV = lzRidotto();
    this.pronto = false; this.acc = 0; this.wx = 0; this.wy = 0; this.vx = 0; this.vy = 0; this.vxS = 0; this.vyS = 0;
    this.dir = Math.PI / 2; this.fa = Math.PI / 2; this.spalle = Math.PI / 2; this.muove = false;
    this.anda = 0; this.fase = (this.seme * 1.7) % 6.28; this.t = 0; this.tStato = 0;
    this.hx = 0; this.hy = 0; this.hz = LZ_ZT; this.sx = 0; this.sy = 0; this.sz = LZ_ZS; this.sc = 0; this.ss = 1; this.alz = 0;
    this.pp = 0; this.p1x = 0; this.p1y = 0; this.p1z = 0; this.p2x = 0; this.p2y = 0; this.p2z = 0;
    this.lato = 0; this.latoV = 0; this.mx = 21; this.my = 3; this.mz = 30; this.lx = 27; this.ly = 4; this.lz = 19; this.lvx = 0; this.lvy = 0; this.lvz = 0;
    this.tw = 0; this.storto = 0; this.calmo = 0; this.corpoK = 1; this.ap = 0; this.dorme = false; this.quieto = 0; this.cop = 1; this.xv = 0; this.yv = 0; this.en = 0; this.appeso = true;
    this.al = 0; this.bl = 0; this.nato = -9; this.pT = -1; this.l0x = 0; this.l0y = 0; this.l0z = 0; this.lfx = 0; this.lfy = 0;
    this.ev = new Uint8Array(2); this.ev[0] = this.ev[1] = 1; this.ea = new Float32Array(2); this.ea[0] = this.ea[1] = 1;
    this.rnd = ((this.seme + 1) * 2654435761) >>> 0 || 1; this.bT = 1.5 + this.caso() * 4; this.sgT = 2 + this.caso() * 4; this.sgX = 0;
    this.gOn = false; this.gX = 0; this.gY = 0; this.gx = 0; this.gy = 0; this.stretto = false; this.capA = 0;
    if (!forma) { this.F = lzForma(this.seme & 3); this.posa(); }
    else if (forma.lra) this.posa();
  }

  // ---------- gli stati ----------
  posa() { const F = this.F; this.tw = 0; this.x.set(F.px); this.y.set(F.py); this.z.set(F.pz); this.ox.set(F.px); this.oy.set(F.py); this.oz.set(F.pz); this.ruota(this.dir - Math.PI / 2); this.fa = this.spalle = this.dir; }
  ruota(a) { const c = Math.cos(a), s = Math.sin(a), x = this.x, y = this.y, ox = this.ox, oy = this.oy; for (let n = 0; n < LZ_N; n++) { const u = x[n], v = y[n]; x[n] = u * c - v * s; y[n] = u * s + v * c; const p = ox[n], q = oy[n]; ox[n] = p * c - q * s; oy[n] = p * s + q * c; } }
  subito() { this.stato = 'su'; this.ap = 0; this.corpoK = 1; this.cop = 1; this.dorme = false; this.quieto = 0; this.nato = -9; this.pT = -1; this.appeso = true; this.posa(); }
  caso() { let v = this.rnd; v ^= v << 13; v ^= v >>> 17; v ^= v << 5; this.rnd = v >>>= 0; return v / 4294967296; }
  guarda(x, y) { if (x == null) this.gOn = false; else { this.gOn = true; this.gX = x; this.gY = y; } }
  // all'impatto la testa di chi sta sotto cede di 3 unità per 0,12 secondi
  cede() { if (this.stato !== 'cade') return 0; const u = (this.tStato - LZ_TC) / 0.12; return u > 0 && u < 1 ? 3 * Math.sin(Math.PI * u) : 0; }
  // il telo parte raccolto in alto, si apre stretto come una campana con le sue pieghe, scende sopra la testa e poi l'orlo scivola giù lungo il corpo
  cadi() {
    if (lzRidotto()) { this.subito(); return; }               // chi non vuole movimento trova il telo già addosso
    const F = this.F, x = this.x, y = this.y, z = this.z; this.stato = 'cade'; this.tStato = 0; this.ap = 0.4; this.cop = 0; this.dorme = false; this.quieto = 0; this.corpoK = 1; this.appeso = false; this.nato = 1e9; this.pT = -1; this.ev[0] = this.ev[1] = 1; this.ea[0] = this.ea[1] = 1;
    const a = this.seme * 2.1;
    for (let n = 0; n < LZ_N; n++) { x[n] = F.px[n] * 0.3 + 3 * Math.sin(n * 7.1 + a); y[n] = F.py[n] * 0.3 + 2.5 * Math.sin(n * 3.3 + a); z[n] = LZ_Z0 + (F.pz[n] - LZ_CIMA) * 0.2 + 3 * Math.sin(n * 5.7 + a); }
    this.ox.set(x); this.oy.set(y); this.oz.set(z);
  }
  // la lanterna cade dove stava la mano e si rovescia accanto al mucchio: dice anche dove è successo
  // stretto: lo spazio non basta, il telo si raccoglie lungo il muro con la testa in fondo. La testa si gira verso chi guarda: il corpo si deve capire senza leggere nulla
  spegni(stretto) {
    if (this.stato === 'steso') return;
    this.stato = 'steso'; this.tStato = 0; this.dorme = false; this.quieto = 0; this.appeso = true; this.capA = this.fa - Math.PI / 2; this.dir = Math.PI / 2; this.stretto = !!stretto;
    const a = this.lx >= 0 ? 0.32 : Math.PI - 0.32, j = ((Math.round((a - this.fa + Math.PI / 2) / LZ_DPI * LZ_C) % LZ_C) + LZ_C) % LZ_C, r = stretto ? 33 : Math.min(this.F.lim[j] * 1.02, 46) + 9;
    this.l0x = this.lx; this.l0y = this.ly; this.l0z = this.lz; this.lfx = Math.cos(a) * r; this.lfy = Math.sin(a) * r;
  }
  fantasma(si) { if (this.stato === 'steso' || this.stato === 'cade') this.subito(); this.stato = si ? 'fantasma' : 'su'; this.tStato = 0; this.dorme = false; this.quieto = 0; }
  copre() { return this.cop; }
  cima() { return (this.stato === 'steso' ? 22 : this.z[0]) * LZ_KZ; }
  // il mucchio finito, una volta sola per forma: serve a chi si spegne dove nessuno guarda
  mucchio() {
    const F = this.F, k = this.stretto ? 'mS' : 'mL';
    if (!F[k]) { const l = new Lenzuolo({ c: 0 }, { seme: 0 }, F); l.pronto = true; l.corpo(); l.spegni(this.stretto); for (let p = 0; p < 170; p++) l.passo(0, 0); F[k] = [l.x.slice(), l.y.slice(), l.z.slice()]; }
    this.capA = 0; const m = F[k]; this.x.set(m[0]); this.y.set(m[1]); this.z.set(m[2]); this.ox.set(m[0]); this.oy.set(m[1]); this.oz.set(m[2]); this.corpoK = LZ_KT; this.ap = 0.14; this.dorme = true; this.cop = 1; this.tStato = 9;
    this.fa = this.spalle = this.dir = Math.PI / 2; this.corpo();
  }

  // ---------- un passo della stoffa ----------
  corpo() {
    const v = this.t, f = this.fase, an = this.anda, cf = Math.cos(this.fa), sf = Math.sin(this.fa), sp = Math.sin(f), cp = Math.cos(f);
    const lean = an * 0.55;
    const acX = (this.vx - this.vxS) * 2, acY = (this.vy - this.vyS) * 2;
    const px = -sf, py = cf, ond = sp * 2.2 * an, lX = cf * 2.6 * lean + acX * 2.4, lY = sf * 2.6 * lean + acY * 2.4;
    const fant = this.stato === 'fantasma', alt = this.alz = this.alz + ((fant ? 14 + 2.4 * Math.sin(v * 1.7 + this.seme) : 0) - this.alz) * 0.05;
    const crolla = this.stato === 'steso' ? this.corpoK : 1;
    this.hx = lX + px * ond; this.hy = lY + py * ond; this.hz = (LZ_ZT + alt - Math.abs(sp) * 1.5 * an) * crolla - this.cede();
    if (this.stato === 'steso') { const g = 1 - crolla; this.hx += this.F.gx * g; this.hy -= (this.stretto ? LZ_GS : LZ_GY) * g; this.hz += LZ_GZ * g; }      // cadendo la testa va dietro il centro del telo: il corpo si stende davanti a lei
    this.sx = lX * 0.55 + px * ond * 0.6; this.sy = lY * 0.55 + py * ond * 0.6; this.sz = (LZ_ZS + alt - Math.abs(sp) * 1.1 * an) * crolla;
    const a = this.spalle + LZ_TORCE * sp * an; this.sc = Math.cos(a); this.ss = Math.sin(a);
    // i piedi vanno avanti e indietro: quello in aria alza l'orlo, una volta da un lato e una dall'altro
    const pas = 16 * sp * an, sol = LZ_PIEDE * an, al = this.al = cp > 0 ? Math.sqrt(cp) * sol : 0, bl = this.bl = cp < 0 ? Math.sqrt(-cp) * sol : 0;
    this.p1x = cf * pas + px * 10; this.p1y = sf * pas + py * 10; this.p1z = 3 + al * 0.6 + alt;
    this.p2x = -cf * pas - px * 10; this.p2y = -sf * pas - py * 10; this.p2z = 3 + bl * 0.6 + alt;
    // la mano con la lanterna: a destra o a sinistra, passando davanti e mai dietro
    const ml = Math.cos(this.lato), ms = Math.sin(this.lato), oscilla = sp * 2.2 * an;
    this.mx = ml * 20 + this.sx * 0.8 + px * oscilla * 0.3; this.my = ms * 19 + 2 + this.sy * 0.8 + oscilla * 0.6; this.mz = (30.5 + alt + Math.abs(cp) * 0.9 * an) * crolla;
    if (fant) { this.mz = this.p1z = this.p2z = -60; this.al = this.bl = 0; }         // il fantasma non ha piedi né lanterna
  }

  // porta fuori dal corpo una posa (x,y,z): serve anche alla forma, a telo fermo
  scosta(x, y, z) {
    const hR = LZ_RT + LZ_SP, hR2 = hR * hR, hx = this.hx, hy = this.hy, hz = this.hz, sx = this.sx, sy = this.sy, sz = this.sz, c = this.sc, s = this.ss;
    const rb = LZ_RB + LZ_SP, ia = 1 / (LZ_SX + LZ_SP), ib = 1 / (LZ_SY + LZ_SP), ic = 1 / (LZ_SZ + LZ_SP), rM = LZ_RM + LZ_SP, rM2 = rM * rM, rP = LZ_RP + LZ_SP, rP2 = rP * rP;
    const mx = this.mx, my = this.my, mz = this.mz, p1x = this.p1x, p1y = this.p1y, p1z = this.p1z, p2x = this.p2x, p2y = this.p2y, p2z = this.p2z, cima = sz - 2;
    for (let n = 1; n < LZ_N; n++) {
      let X = x[n], Y = y[n], Z = z[n], dx = X - hx, dy = Y - hy, dz = Z - hz, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < hR2 && d2 > 1e-4) { const q = hR / Math.sqrt(d2); X = hx + dx * q; Y = hy + dy * q; Z = hz + dz * q; }
      // spalle: un ellissoide girato come il corpo
      dx = X - sx; dy = Y - sy; dz = Z - sz;
      const a = (dx * s - dy * c), b = (dx * c + dy * s);          // a di lato, b avanti
      const ua = a * ia, ub = b * ib, uc = dz * ic, e = ua * ua + ub * ub + uc * uc;
      if (e < 1 && e > 1e-4) { const q = 1 / Math.sqrt(e), ra = a * q, rb2 = b * q; X = sx + ra * s + rb2 * c; Y = sy - ra * c + rb2 * s; Z = sz + dz * q; }
      if (Z < cima) {
        dx = X - sx * 0.6; dy = Y - sy * 0.6; d2 = dx * dx + dy * dy;
        if (d2 < rb * rb && d2 > 1e-4) { const q = rb / Math.sqrt(d2); X = sx * 0.6 + dx * q; Y = sy * 0.6 + dy * q; }
      }
      dx = X - mx; dy = Y - my; dz = Z - mz; d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < rM2 && d2 > 1e-4) { const q = rM / Math.sqrt(d2); X = mx + dx * q; Y = my + dy * q; Z = mz + dz * q; }
      if (n > 1 + LZ_C * 4) {
        dx = X - p1x; dy = Y - p1y; dz = Z - p1z; d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < rP2 && d2 > 1e-4) { const q = rP / Math.sqrt(d2); X = p1x + dx * q; Y = p1y + dy * q; Z = p1z + dz * q; }
        dx = X - p2x; dy = Y - p2y; dz = Z - p2z; d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < rP2 && d2 > 1e-4) { const q = rP / Math.sqrt(d2); X = p2x + dx * q; Y = p2y + dy * q; Z = p2z + dz * q; }
      }
      x[n] = X; y[n] = Y; z[n] = Z;
    }
  }

  // dX, dY: quanto si è spostato il corpo in questo passo
  passo(dX, dY) {
    const h = LZ_H, F = this.F, T = lzTopo, x = this.x, y = this.y, z = this.z, ox = this.ox, oy = this.oy, oz = this.oz, st = this.stato;
    this.t += h; this.tStato += h;
    // il corpo: velocità, passo, sguardo
    const d = Math.sqrt(dX * dX + dY * dY); let kT = 1; if (d > LZ_TIRO) kT = LZ_TIRO / d;
    const vT = 0.3, vP = this.vx, vQ = this.vy; this.vx += (dX * kT * LZ_INERZIA - this.vx) * vT; this.vy += (dY * kT * LZ_INERZIA * 1.2 - this.vy) * vT;
    const vX = this.vx, vY = this.vy, fX = (vX - vP) * LZ_FRUSTA, fY = (vY - vQ) * LZ_FRUSTA; this.vxS += (vX - this.vxS) * 0.14; this.vyS += (vY - this.vyS) * 0.14;
    this.anda += ((this.muove && st !== 'steso' ? Math.min(1, d / 1.6) : 0) - this.anda) * 0.16;
    this.fase += LZ_DPI * 1.75 * h * (0.45 + 0.55 * this.anda);
    let dA = this.dir - this.fa; while (dA > Math.PI) dA -= LZ_DPI; while (dA < -Math.PI) dA += LZ_DPI;
    const rot = Math.max(-0.17, Math.min(0.17, dA * 0.16)), rotT = st === 'steso' ? 0 : rot; this.fa += rot;      // (a terra gira solo lo sguardo: la stoffa resta dov'è)
    let dS = this.fa - this.spalle; while (dS > Math.PI) dS -= LZ_DPI; while (dS < -Math.PI) dS += LZ_DPI; this.spalle += dS * 0.13;
    // la lanterna cambia mano passando davanti
    const cd = Math.cos(this.fa), tg = Math.abs(cd) > 0.5 ? 1.57 - cd * 0.8 : this.lato > 1.57 ? Math.PI : 0;
    this.latoV += (tg - this.lato) * 0.03; this.latoV *= 0.8; this.lato += this.latoV;
    if (st === 'steso') this.corpoK += (LZ_KT - this.corpoK) * Math.min(1, this.tStato * 0.34);
    this.corpo();
    const appeso = st !== 'steso' && (st !== 'cade' || this.tStato >= LZ_TC);
    this.appeso = appeso;
    // arrivato sulla testa il telo riprende la sua misura di telo addosso; steso resta un po' raccolto
    if (st === 'cade') {
      if (appeso) { this.cop = Math.min(1, this.cop + 0.04); this.ap = Math.max(0, this.ap - 0.03); }
      if (this.nato > 1e8 && this.tStato >= LZ_TC + 0.74) { this.nato = this.t; this.bT = this.t + 0.42; }      // il telo è fermo sulla testa: qui nasce il personaggio
      if (this.tStato > LZ_TC + 1.25) { this.stato = 'su'; this.cop = 1; this.ap = 0; }
    } else if (st === 'steso') this.ap = Math.min(0.14, this.ap + 0.008);
    // integra: il corpo si sposta, la stoffa resta dov'era finché qualcosa non la tira
    this.calmo = this.muove || d > 0.01 || Math.abs(dA) > 0.01 || st === 'cade' ? 0 : this.calmo + 1;   // dopo un secondo fermo la stoffa si calma e si addormenta
    const aria = st === 'cade' && !appeso ? 0.88 : st === 'fantasma' ? 0.965 : LZ_ARIA - 0.1 * Math.max(0, Math.min(1, (this.calmo - 34) / 44)), gi = st === 'cade' && !appeso ? 0 : LZ_G, tt = this.t;
    const nO = 1 + (LZ_R - 2) * LZ_C, kO = LZ_INERZIA_O / LZ_INERZIA;
    for (let n = 0; n < LZ_N; n++) {
      const orlo = n >= nO, sX = orlo ? vX * kO : vX, sY = orlo ? vY * kO : vY, X = x[n] - sX, Y = y[n] - sY, Z = z[n];
      let wx = (x[n] - ox[n]) * aria, wy = (y[n] - oy[n]) * aria, wz = (Z - oz[n]) * aria - gi;
      if (orlo) { wx -= fX; wy -= fY; if (st === 'su') wz -= LZ_ORLOG * this.anda; }                                                // il corpo frena e l'orlo continua: la frusta
      if (wx * wx + wy * wy + wz * wz > 36) { wx *= 0.5; wy *= 0.5; wz *= 0.5; }     // niente esplosioni
      ox[n] = X; oy[n] = Y; oz[n] = Z;
      x[n] = X + wx; y[n] = Y + wy; z[n] = Z + wz;
    }
    // nell'aria il telo è una campana stretta, con le pieghe e l'orlo del telo vero: si apre in un attimo, ondeggia mentre scende, l'orlo resta indietro e sbatte
    if (st === 'cade' && !appeso) {
      const q = this.tStato, u = Math.min(1, q / LZ_TC), ap0 = 1 - Math.min(1, q / 0.3), o = 0.3 + 0.7 * (1 - ap0 * ap0 * ap0), zc = LZ_Z0 + (this.hz + LZ_RT + LZ_SP - LZ_Z0) * u * u * (0.55 + 0.45 * u);
      const gi2 = this.fa - Math.PI / 2 + 0.7 * (1 - u) * (1 - u), c = Math.cos(gi2) * o, s = Math.sin(gi2) * o, px = F.px, py = F.py, pz = F.pz, sw = 5 * (1 - u) * Math.sin(tt * 3.4 + this.seme), kz = LZ_VOLOZ * o;
      for (let n = 0; n < LZ_N; n++) {
        const a = px[n], b = py[n], e = 1 - pz[n] / LZ_CIMA, e2 = e * e, fl = 1 + LZ_VOLOR * e2 * (1 + 0.3 * Math.sin(tt * 9 + a * 0.09 + b * 0.05 + this.seme)), fo = 0.3 - 0.14 * e;
        x[n] += (this.hx + sw * (1 - 0.7 * e) + (a * c - b * s) * fl - x[n]) * fo; y[n] += (this.hy + (a * s + b * c) * fl - y[n]) * fo; z[n] += (zc - (LZ_CIMA - pz[n]) * kz + e2 * 3.6 * Math.cos(tt * 7.4 + b * 0.09 - a * 0.06) - z[n]) * fo;
      }
    }
    if (st === 'fantasma') for (let n = 1 + 4 * LZ_C; n < LZ_N; n++) { const r = (n - 1) % LZ_C * 0.2618; x[n] += 0.05 * Math.sin(tt * 1.9 + r * 3); y[n] += 0.04 * Math.cos(tt * 1.6 + r * 2); }
    // il girarsi: la cima del telo gira con la testa, il resto segue tardi. Tardi, non mai: quello che l'orlo ha lasciato indietro (tw) lo recupera piano,
    // se no a forza di girarsi la stoffa si attorciglia attorno al corpo come una corda e l'orlo sale
    this.tw += rotT * 0.58;
    const segue = this.tw * LZ_SEGUE; this.tw -= segue;
    if (Math.abs(rotT) > 1e-4 || Math.abs(segue) > 1e-4) {
      const hx = this.hx, hy = this.hy;
      for (let i = 1; i <= LZ_R; i++) {
        const w = (i <= 4 ? rotT : i === 5 ? rotT * 0.86 + segue * 0.24 : i === 6 ? rotT * 0.62 + segue * 0.655 : rotT * 0.42 + segue), c = Math.cos(w), s = Math.sin(w), a = 1 + (i - 1) * LZ_C;
        for (let n = a; n < a + LZ_C; n++) { const u = x[n] - hx, v = y[n] - hy; x[n] = hx + u * c - v * s; y[n] = hy + u * s + v * c; const p = ox[n] - hx, q = oy[n] - hy; ox[n] = hx + p * c - q * s; oy[n] = hy + p * s + q * c; }
      }
    }
    // i vincoli: dalla testa in giù
    const ax = this.hx, ay = this.hy, az = this.hz + LZ_RT + LZ_SP;
    if (appeso) { const q = st === 'cade' ? 0.3 : 1; x[0] += (ax - x[0]) * q; y[0] += (ay - y[0]) * q; z[0] += (az - z[0]) * q; ox[0] = x[0] - (x[0] - ox[0]) * 0.3; oy[0] = y[0] - (y[0] - oy[0]) * 0.3; oz[0] = z[0] - (z[0] - oz[0]) * 0.3; }
    const G = T.gr, ap = this.ap, rest = F.rest, restA = F.restA, ca = T.ca, cb = T.cb;
    if (st !== 'cade' || appeso) {
      const kR = st === 'steso' ? 0.3 : 1, q1 = st === 'cade' ? 1 - ap : 1, K = lzK;        // finché il telo è aperto si può solo arricciare: niente memoria delle pieghe
      K[0] = ap;
      for (let g = 0; g < 2; g++) {
        K[1] = 1; K[2] = kR; K[3] = appeso ? 0.12 : 0.5; lzVincola(x, y, z, ca, cb, rest, restA, G.r0, G.r1);
        K[1] = 0.85; K[2] = 0.3 * q1; K[3] = 0.5; lzVincola(x, y, z, ca, cb, rest, restA, G.a0, G.a1);
        if (appeso) { x[0] += (ax - x[0]) * 0.9; y[0] += (ay - y[0]) * 0.9; z[0] += (az - z[0]) * 0.9; }
      }
      K[1] = 0.5; K[2] = 0.12 * q1; lzVincola(x, y, z, ca, cb, rest, restA, G.d0, G.d1);
      K[1] = 0.14 * q1; K[2] = 0.2 * q1; lzVincola(x, y, z, ca, cb, rest, restA, G.p0, G.p1);
      K[1] = 0.28 * q1; K[2] = 0.3 * q1; lzVincola(x, y, z, ca, cb, rest, restA, G.c0, G.c1);
      K[1] = (st === 'steso' ? 0.2 : 0.7) * q1; K[2] = (st === 'steso' ? 0.12 : 0.7) * q1; lzVincola(x, y, z, ca, cb, rest, restA, G.b0, G.b1);
    }
    // l'assestamento: gli ultimi attimi della caduta accompagnano la stoffa alla sua posa, così qualunque cosa sia successa nell'aria il telo finisce bene
    if (st === 'cade' && appeso && this.tStato > LZ_TC + 0.14) {
      const k = Math.min(0.2, (this.tStato - LZ_TC - 0.14) * 0.3), g = this.fa - Math.PI / 2, c = Math.cos(g), s = Math.sin(g), px = F.px, py = F.py, pz = F.pz;
      for (let n = 1; n < LZ_N; n++) { const a = px[n], b = py[n]; x[n] += (a * c - b * s - x[n]) * k; y[n] += (a * s + b * c - y[n]) * k; z[n] += (pz[n] - z[n]) * k; }
    }
    // la rete di sicurezza: se la stoffa si impiglia nella mano o nel corpo e l'orlo resta su, la posa la riporta giù in un attimo, come una stoffa che ricade.
    // Una frusta normale dura meno e qui non arriva: entra solo chi resta rovesciato
    if (st === 'su') {
      let zo = 0; for (let n = 1 + (LZ_R - 1) * LZ_C; n < LZ_N; n += 2) zo += z[n];
      zo /= LZ_C / 2; this.storto = zo > LZ_ORLOSU ? Math.min(1, this.storto + 0.07) : zo < 8 ? Math.max(0, this.storto - 0.05) : this.storto;   // (lascia solo quando l'orlo è tornato giù)
      if (this.storto > 0.2) {
        const k = 0.16 * (this.storto - 0.2), g = this.fa - Math.PI / 2, c = Math.cos(g), s = Math.sin(g), px = F.px, py = F.py, pz = F.pz;
        for (let n = 1 + 2 * LZ_C; n < LZ_N; n++) { const a = px[n], b = py[n]; x[n] += (a * c - b * s - x[n]) * k; y[n] += (a * s + b * c - y[n]) * k; z[n] += (pz[n] - z[n]) * k; }
        this.tw *= 0.9;
      }
    }
    // corpo e pavimento
    if ((st !== 'steso' || this.corpoK > 0.3) && (st !== 'cade' || appeso)) this.scosta(x, y, z);
    if (st === 'steso') {             // a terra la testa resta una gobba sotto la stoffa, davanti a lei il corpo: una spalla di stoffa, l'aria sotto, mai un adesivo. L'allargarsi si ferma dove l'orlo ha toccato terra
      if (this.corpoK <= 0.3) {
        const hx = this.hx, hy = this.hy, hz = this.hz, hR = LZ_RT + LZ_SP - 1, hR2 = hR * hR;
        // la cima del telo resta calzata sulla testa come un berretto: è lei a fare la gobba, e con la gobba il corpo si capisce senza leggere nulla
        const kc = Math.min(0.3, 0.05 + (0.3 - this.corpoK) * 2), cc = Math.cos(this.capA), sc = Math.sin(this.capA), fx = F.fx, fy = F.fy;
        x[0] += (hx - x[0]) * kc; y[0] += (hy - y[0]) * kc; z[0] += (hz + hR - z[0]) * kc;
        for (let n = 1; n < 1 + 3 * LZ_C; n++) {
          const a = fx[n], b = fy[n], s0 = Math.sqrt(a * a + b * b), fi = s0 / hR, r = hR * Math.sin(fi) / s0;
          x[n] += (hx + (a * cc - b * sc) * r - x[n]) * kc; y[n] += (hy + (a * sc + b * cc) * r - y[n]) * kc; z[n] += (hz + hR * Math.cos(fi) - z[n]) * kc;
        }
        for (let n = 0; n < LZ_N; n++) {
          const dx = x[n] - hx, dy = y[n] - hy, dz = z[n] - hz, d2 = dx * dx + dy * dy + dz * dz; if (d2 >= hR2 || d2 < 1e-4) continue;
          if (dz >= 0) { const q = hR / Math.sqrt(d2); x[n] = hx + dx * q; y[n] = hy + dy * q; z[n] = hz + dz * q; }
          else { const m = Math.sqrt(dx * dx + dy * dy) + 1e-3, q = Math.sqrt(hR2 - dz * dz) / m; x[n] = hx + dx * q; y[n] = hy + dy * q; }
        }
      }
      const lim = F.lim, dis = F.dis, str = this.stretto, cy = str ? 0 : LZ_CY, cm = str ? 12 : LZ_CY + 5, ra = 1 / 25, rb = 1 / 70;
      for (let i = 1; i <= LZ_R; i++) {
        const a = 1 + (i - 1) * LZ_C, w = i < 5 ? 0 : i === 5 ? 0.66 : i === 6 ? 0.83 : 1;
        for (let j = 0; j < LZ_C; j++) {
          const n = a + j, X = x[n], Y = y[n], Yc = Y - cy, Ym = Y - cm, r2 = X * X + Yc * Yc, m = 6.5 * dis[j] * Math.exp(-(X * X + Ym * Ym * (str ? 0.2 : 1)) / 380); if (z[n] < m) z[n] += (m - z[n]) * 0.2;
          if (w <= 0) continue;
          if (str) {
            const u = X * ra, v = Y * rb, e2 = u * u + v * v;
            if (e2 > w * w) { const q = (1 - w / Math.sqrt(e2)) * 0.34; x[n] -= X * q; y[n] -= Y * q; }
            else if (i > 5) y[n] += Y * 0.018;                 // la stoffa si stira lungo il muro
          } else { const L = lim[j] * w; if (r2 > L * L) { const q = (1 - L / Math.sqrt(r2)) * 0.34; x[n] -= X * q; y[n] -= Yc * q; } }
        }
      }
    }
    // i piedi sollevano l'orlo: un rigonfiamento che sale sotto la stoffa e la lascia ricadere, a ogni passo
    if (st === 'su' && this.anda > 0.04) {
      const r2 = LZ_RL * LZ_RL, ir = 1 / r2, lx = -Math.sin(this.fa) * LZ_FIANCO, ly = Math.cos(this.fa) * LZ_FIANCO, p1x = this.p1x + lx, p1y = this.p1y + ly, p2x = this.p2x - lx, p2y = this.p2y - ly, a1 = this.al, a2 = this.bl;
      for (let n = nO; n < LZ_N; n++) {
        const X = x[n], Y = y[n], d1 = (X - p1x) * (X - p1x) + (Y - p1y) * (Y - p1y), d2 = (X - p2x) * (X - p2x) + (Y - p2y) * (Y - p2y);
        let m = 0; if (d1 < r2) m = a1 * (1 - d1 * ir); if (d2 < r2) { const b = a2 * (1 - d2 * ir); if (b > m) m = b; }
        if (z[n] < m) z[n] += (m - z[n]) * 0.55;
      }
    }
    // la mano stringe la stoffa: i nodi più vicini vengono raccolti sul pugno, così le pieghe convergono lì e il filo parte da lì
    if (st === 'su' && this.mz > 0) {
      const mx = this.mx, my = this.my, mz = this.mz, ml = LZ_PUGNO / (Math.sqrt(mx * mx + my * my) + 1e-3), gx = mx + mx * ml, gy = my + my * ml, r2 = LZ_PZ * LZ_PZ, ir = 1 / r2;
      let mi = 1e9, nn = -1;
      for (let n = 1 + 3 * LZ_C; n < 1 + 6 * LZ_C; n++) {
        const dx = x[n] - gx, dy = y[n] - gy, dz = z[n] - mz, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < mi) { mi = d2; nn = n; }
        if (d2 < r2) { const w = 1 - d2 * ir, k = w * w * 0.5; x[n] -= dx * k; y[n] -= dy * k; z[n] -= dz * k; }
      }
      if (nn > 0 && mi >= r2 * 0.2) { x[nn] += (gx - x[nn]) * 0.3; y[nn] += (gy - y[nn]) * 0.3; z[nn] += (mz - z[nn]) * 0.3; }      // anche se il telo vola via, un lembo resta nel pugno
    }
    // nessun nodo più lontano dalla cima della stoffa che ha: così basta un giro di vincoli e il telo non si allunga mai
    if (appeso) {
      const lra = F.lra, X0 = x[0], Y0 = y[0], Z0 = z[0];
      for (let n = 1; n < LZ_N; n++) { const dx = x[n] - X0, dy = y[n] - Y0, dz = z[n] - Z0, d2 = dx * dx + dy * dy + dz * dz, m = lra[n]; if (d2 > m * m) { const q = m / Math.sqrt(d2); x[n] = X0 + dx * q; y[n] = Y0 + dy * q; z[n] = Z0 + dz * q; } }
    }
    const terra = st !== 'fantasma' && (st !== 'cade' || appeso), bas = F.bas, attr = st === 'steso' ? 0.5 : 0.1, gr = st === 'steso' ? 3.2 : 1;
    if (terra) for (let n = 1; n < LZ_N; n++) { const m = bas[n] * gr; if (z[n] < m) { z[n] = m; x[n] += (ox[n] - x[n]) * attr; y[n] += (oy[n] - y[n]) * attr; } }
    if (st === 'cade' && appeso && this.pT < 0) { let zm = 0; for (let n = 1 + (LZ_R - 1) * LZ_C; n < LZ_N; n += 4) zm += z[n]; if (zm / 6 < 6) this.pT = this.t; }      // l'orlo ha toccato terra
    // la lanterna pende e dondola
    const lk = 0.07; let lvx = this.lvx, lvy = this.lvy;
    const hm = 1 + LZ_PUGNO / (Math.sqrt(this.mx * this.mx + this.my * this.my) + 1e-3);
    lvx += (this.mx * hm - this.lx) * lk - vX * 0.06; lvy += (this.my * hm - this.ly) * lk - vY * 0.06; lvx *= 0.92; lvy *= 0.92;
    this.lx += lvx; this.ly += lvy; this.lvx = lvx; this.lvy = lvy; this.lz = this.mz - 11.5;
    this.vista();
    // a riposo la stoffa dorme: fermo non costa niente
    if (!this.muove && d < 0.01 && st !== 'cade' && st !== 'fantasma' && Math.abs(dA) < 0.01 && (st !== 'steso' || this.tStato > 1.2)) {
      let m = 0; for (let n = 1 + (LZ_R - 1) * LZ_C; n < LZ_N; n += 3) { const a = x[n] - ox[n], b = y[n] - oy[n], c = z[n] - oz[n]; m += a * a + b * b + c * c; }
      if (m < 0.003) { if (++this.quieto > 24) this.dorme = true; } else this.quieto = 0;
      if (st === 'steso' && this.tStato > 3.4) this.dorme = true;                                 // a terra si smette comunque: un corpo fermo non deve costare niente
    } else this.quieto = 0;
  }

  aggiorna(dt, x, y, dir, muove, attivo) {
    this.xv = x; this.yv = y;
    if (dir != null) this.dir = dir;
    this.muove = !!muove;
    if (!this.pronto) { this.pronto = true; this.wx = x; this.wy = y; this.fa = this.spalle = this.dir; this.posa(); this.corpo(); return; }
    if (attivo === false) {                 // fuori dalla luce non si simula, ma chi torna a guardare deve trovare il telo giusto
      this.wx = x; this.wy = y; this.acc = 0; this.vx = this.vy = 0; this.anda = 0;
      if (this.stato === 'cade') this.subito(); else if (this.stato === 'steso' && !this.dorme) this.mucchio();
      return;
    }
    const dX = x - this.wx, dY = y - this.wy, salto = dX * dX + dY * dY > LZ_SALTO * LZ_SALTO;
    if (this.dorme) { if (dX * dX + dY * dY > 0.01 || this.muove || this.stato === 'cade' || Math.abs(this.dir - this.fa) > 0.02) { this.dorme = false; this.quieto = 0; } else { this.wx = x; this.wy = y; this.acc = 0; this.t += dt; return; } }
    this.acc += Math.min(dt, 0.1);
    let n = Math.floor(this.acc / LZ_H); if (n < 1) return;
    if (n > LZ_MAXP) { n = LZ_MAXP; this.acc = 0; } else this.acc -= n * LZ_H;
    const px = salto ? 0 : dX / n, py = salto ? 0 : dY / n;
    this.wx = x; this.wy = y;
    for (let i = 0; i < n; i++) this.passo(px, py);
  }

  // ---------- il disegno ----------
  // Niente qui tocca la simulazione: un telo addormentato resta addormentato, l'aria e il respiro vivono solo sullo schermo.
  disegna(ctx, o) {
    o = o || {}; lzPrepara();
    const X0 = o.x != null ? o.x : this.xv, Y0 = o.y != null ? o.y : this.yv, S = o.scala || 1, alfa = o.alfa == null ? 1 : o.alfa, t = o.t != null ? o.t : this.t;
    const stato = this.stato, fant = stato === 'fantasma', steso = stato === 'steso', vola = stato === 'cade' && !this.appeso, L = o.grigio ? lzNebbia : LENZUOLI[this.c];
    const alza = vola ? (this.z[0] - LZ_CIMA) * LZ_KZ : 0;      // in volo la sfumatura della stoffa sale col telo
    const C = LZ_DC, R = LZ_RR, N = LZ_DN, gx = lzGx, gy = lzGy, gz = lzGz, sx = lzSx, sy = lzSy, tono = lzTono, t2 = lzT2, cal = lzCal, cell = lzCell, mic = this.F.mic;
    const base = (fant ? alfa * 0.5 : alfa) * (vola ? Math.min(1, this.tStato / 0.12) : 1), hLant = !fant && !steso && o.lanterna !== false;
    lzGriglia(this.x, this.y, this.z); lzOrlo(gx); lzOrlo(gy);
    if (!this.fermoV && (stato === 'su' || fant)) this.aria(t);
    lzInfittisci(gx); lzInfittisci(gy); lzInfittisci(gz);
    for (let n = 0; n < N; n++) { sx[n] = gx[n]; sy[n] = gy[n] * LZ_KY - gz[n] * LZ_KZ + alza; }
    // le normali e il tono nascono dalla forma simulata, sulla griglia fine
    const lux = this.lx, luy = this.ly, luz = this.lz + 4;
    for (let r = 0; r < R; r++) {
      const d = 1 + r * C;
      for (let j = 0; j < C; j += 2) {
        const n = d + j, a = d + (j === C - 2 ? 0 : j + 2), b = d + (j === 0 ? C - 2 : j - 2), u = r === 0 ? 0 : n - C, v = r === R - 1 ? n : n + C, X = gx[n], Y = gy[n], Z = gz[n];
        const ux = gx[a] - gx[b], uy = gy[a] - gy[b], uz = gz[a] - gz[b], vx = gx[v] - gx[u], vy = gy[v] - gy[u], vz = gz[v] - gz[u];
        let qx = vy * uz - vz * uy, qy = vz * ux - vx * uz, qz = vx * uy - vy * ux; const m = 1 / (Math.sqrt(qx * qx + qy * qy + qz * qz) + 1e-5);
        qx *= m; qy *= m; qz *= m;
        // luce di taglio dall'alto a sinistra: fa nascere le pieghe. La conca fra due creste è scura
        const dif = qx * -0.52 + qy * 0.5 + qz * 0.69;
        const ce = ((gx[a] + gx[b]) * 0.5 - X) * X + ((gy[a] + gy[b]) * 0.5 - Y) * Y, rr = 1 / (Math.sqrt(X * X + Y * Y) + 3), conca = ce * rr * 0.34;
        tono[n] = (dif - 0.42) * 1.15 - (conca > 1 ? 1 : conca < -1 ? -1 : conca) * 0.9;
        if (hLant) { const dx = lux - X, dy = luy - Y, dz = luz - Z, d2 = dx * dx + dy * dy + dz * dz, l = (dx * qx + dy * qy + dz * qz) / Math.sqrt(d2 + 1); cal[n] = l < 0 ? 0 : l * 2100 / (d2 + 900); }
      }
    }
    // la morbidezza: lungo gli anelli sui nodi veri, poi lungo le colonne. Il mucchio, tutto schiacciato, ne vuole di più
    for (let g = steso ? 2 : 1; g > 0; g--) {
      for (let r = 0; r < R; r++) { const d = 1 + r * C; for (let j = 0; j < C; j += 2) t2[d + j] = 0.5 * tono[d + j] + 0.25 * (tono[d + (j === C - 2 ? 0 : j + 2)] + tono[d + (j === 0 ? C - 2 : j - 2)]); }
      for (let r = 0; r < R; r++) { const d = 1 + r * C; for (let j = 0; j < C; j += 2) { const n = d + j; tono[n] = r === R - 1 ? t2[n] : 0.5 * t2[n] + 0.25 * ((r === 0 ? t2[n] : t2[n - C]) + t2[n + C]); } }
    }
    lzInfittisci(tono); if (hLant) lzInfittisci(cal);
        { const k = steso ? 0.8 : 1; for (let n = 1; n < N; n++) tono[n] += mic[n] * k; }      // le piegoline sottili: il telo è fine, non è feltro
    let acc = 0; for (let j = 0; j < C; j++) acc += tono[1 + j]; tono[0] = acc / C;
    // la cella guarda chi osserva? L'area sullo schermo lo dice senza sbagliare
    for (let r = 0; r < R; r++) for (let j = 0; j < C; j++) {
      const j2 = (j + 1) % C, a = r === 0 ? 0 : 1 + (r - 1) * C + j, b = r === 0 ? 0 : 1 + (r - 1) * C + j2, c = 1 + r * C + j2, d = 1 + r * C + j;
      cell[r * C + j] = (sx[c] - sx[a]) * (sy[d] - sy[b]) - (sx[d] - sx[b]) * (sy[c] - sy[a]) < 0 ? 1 : 0;
    }
    // la stoffa dritta in un elenco, con i suoi lati aperti e il minimo e il massimo del tono: ogni soglia guarda solo quello che le serve
    { let nf = 0; const fr = lzFr, bo = lzBordo, lo = lzTm, hi = lzTM, ko = lzKm, kh = lzKM;
      for (let r = 0; r < R; r++) { const d = r * C; for (let j = 0; j < C; j++) {
        const k = d + j; if (!cell[k]) continue; fr[nf++] = k;
        bo[k] = (cell[d + (j + C - 1) % C] ? 0 : 1) | (r === R - 1 || !cell[k + C] ? 2 : 0) | (cell[d + (j + 1) % C] ? 0 : 4) | (r > 0 && !cell[k - C] ? 8 : 0);
        const a = LZ_CA[k], e = LZ_CB[k], c = LZ_CC[k], w = LZ_CD[k]; let v = tono[a], mn = v, mx = v; v = tono[e]; if (v < mn) mn = v; else if (v > mx) mx = v; v = tono[c]; if (v < mn) mn = v; else if (v > mx) mx = v; v = tono[w]; if (v < mn) mn = v; else if (v > mx) mx = v; lo[k] = mn; hi[k] = mx;
        if (hLant) { v = cal[a]; mn = v; mx = v; v = cal[e]; if (v < mn) mn = v; else if (v > mx) mx = v; v = cal[c]; if (v < mn) mn = v; else if (v > mx) mx = v; v = cal[w]; if (v < mn) mn = v; else if (v > mx) mx = v; ko[k] = mn; kh[k] = mx; }
      } }
      lzNf = nf;
    }
    ctx.save(); ctx.translate(X0, Y0); if (S !== 1) ctx.scale(S, S);
    if (o.ombra !== false && !fant) this.ombra(ctx, alfa, base);
    if (alza) ctx.translate(0, -alza);
    // l'interno del telo, dove si vede da dentro: il fantasma è trasparente e deve restare pulito
    ctx.globalAlpha = base; ctx.fillStyle = fant ? L.b : steso ? L.s : lzDentro(L); ctx.beginPath(); lzMaschera(ctx, sx, sy, cell, 0, 44, 2.2); ctx.fill();
    // i piedi: stanno sotto il telo, si vedono solo quando l'orlo si alza
    if (this.anda > 0.08 && stato === 'su') {
      ctx.fillStyle = '#14110e';
      ctx.beginPath(); ctx.ellipse(this.p1x * 0.7, this.p1y * 0.7 * LZ_KY - (this.p1z - 2.5) * LZ_KZ, 3, 1.7, 0, 0, LZ_DPI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(this.p2x * 0.7, this.p2y * 0.7 * LZ_KY - (this.p2z - 2.5) * LZ_KZ, 3, 1.7, 0, 0, LZ_DPI); ctx.fill();
    }
    // la stoffa: dall'alto più chiara, in basso più scura. Sopra il disegno del telo, poi le pieghe come velature: seguono la forma e non coprono il disegno
    ctx.fillStyle = steso ? L.b : lzTelo(L); ctx.beginPath(); lzSagoma(ctx, sx, sy); if (stato === 'su' || fant) { const hy = this.hy * LZ_KY - this.hz * LZ_KZ, hr = LZ_RT + LZ_SP; ctx.moveTo(this.hx + hr, hy); ctx.arc(this.hx, hy, hr, 0, LZ_DPI); } ctx.fill();
    if (L.fori && !steso && !fant) { ctx.globalAlpha = base * 0.5; ctx.strokeStyle = L.l; ctx.lineWidth = 0.8; ctx.lineJoin = 'round'; ctx.beginPath(); lzSagoma(ctx, sx, sy); ctx.stroke(); }      // il telo scuro ha un filo chiaro sul bordo: fuori dalla lanterna non sparisce, e chi lo sceglie non ha un vantaggio
    if (this.m && !o.grigio) lzMotivo(ctx, sx, sy, cell, this.m, L);
    const liv = o.fine ? LZ_LIVF : LZ_LIV, liva = o.fine ? LZ_LIVFA : LZ_LIVA;
    for (let k = 0; k < liv.length; k++) { const q = liv[k]; ctx.globalAlpha = base * liva[k]; ctx.fillStyle = q > 0 ? L.l : L.s; ctx.beginPath(); lzRegione(ctx, sx, sy, tono, lzTm, lzTM, q < 0 ? -1 : 1, Math.abs(q)); ctx.fill(); }
    if (hLant) {
      ctx.fillStyle = lzCalda(L); ctx.globalAlpha = base * 0.17; ctx.beginPath(); lzRegione(ctx, sx, sy, cal, lzKm, lzKM, 1, 0.24); ctx.fill();
      ctx.globalAlpha = base * 0.21; ctx.beginPath(); lzRegione(ctx, sx, sy, cal, lzKm, lzKM, 1, 0.6); ctx.fill();
    }
    // l'orlo cucito: una riga appena più chiara poco sopra il bordo, solo dove il telo si vede davanti per un buon tratto
    {
      const a = 1 + (R - 1) * C, e = (R - 1) * C; let via = -1;
      for (let j = 0; j < C; j++) if (cell[e + j] !== 1) { via = j; break; }
      ctx.strokeStyle = L.l; ctx.lineWidth = 0.7; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.globalAlpha = base * 0.42; ctx.beginPath();
      if (via < 0) { for (let j = 0; j <= C; j++) { const n = a + j % C, b = n - C, X = sx[n] + (sx[b] - sx[n]) * 0.16, Y = sy[n] + (sy[b] - sy[n]) * 0.16; if (j) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } }
      else {
        let lun = 0;
        for (let i = 1; i <= C; i++) {
          const j = (via + i) % C, front = i < C && cell[e + j] === 1;
          if (front) lun++;
          else {
            if (lun >= LZ_ORLOC) for (let k = lun; k >= 0; k--) { const n = a + (j + C - k) % C, b = n - C, X = sx[n] + (sx[b] - sx[n]) * 0.16, Y = sy[n] + (sy[b] - sy[n]) * 0.16; if (k === lun) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
            lun = 0;
          }
        }
      }
      ctx.stroke();
    }
    // i fori per gli occhi, sul telo: si muovono con la stoffa e di spalle non si vedono
    this.occhi(ctx, L, base, t, hLant);
    if (alza) ctx.translate(0, alza);
    if (stato === 'cade') this.polvere(ctx, base);
    if (!fant && o.lanterna !== false) this.lanterna(ctx, alfa, t);
    ctx.restore();
  }

  // l'ombra a terra: larga e morbida, si stringe quando il telo scende. Dove l'orlo tocca è una riga scura, dove si solleva si stacca
  ombra(ctx, alfa, base) {
    const x = this.x, y = this.y, z = this.z, a = 1 + (LZ_R - 1) * LZ_C, C = LZ_C; let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, zm = 0, zo = 0;
    for (let n = a; n < LZ_N; n++) { const u = x[n], v = y[n]; if (u < a0) a0 = u; if (u > a1) a1 = u; if (v < b0) b0 = v; if (v > b1) b1 = v; zm += z[n]; }
    zm /= C; const qa = Math.max(0.25, 1 - zm / 150), ww = (a1 - a0 + 16) * (1 + zm * 0.005), hh = (b1 - b0) * LZ_KY + 12;
    ctx.globalAlpha = alfa * qa; ctx.drawImage(lzOmbraT, (a0 + a1) * 0.5 - ww * 0.5, (b0 + b1) * 0.5 * LZ_KY - hh * 0.5 + 1.5, ww, hh);
    for (let j = 0; j < C; j += 4) zo += z[a + j];
    ctx.globalAlpha = base * Math.max(0, 1 - zo / 36); ctx.fillStyle = 'rgba(5,4,11,.38)'; ctx.beginPath();
    for (let j = 0; j < C; j++) { const n = a + j, px = x[n], py = y[n] * LZ_KY + 0.9; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    if (this.stato === 'steso') {                 // l'ombra di contatto: il telo sta a terra e pesa, non è una macchia sul pavimento
      for (let k = 0; k < 2; k++) {
        const g = k ? 1.02 : 1.07, dy = k ? 1.7 : 3.4; ctx.globalAlpha = base * (k ? 0.4 : 0.26); ctx.beginPath();
        for (let j = 0; j < C; j++) { const n = a + j, px = x[n] * g, py = y[n] * g * LZ_KY + dy; if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.closePath(); ctx.fill();
      }
    }
  }

  // l'aria ferma e il respiro, solo nel disegno. Il respiro muove le spalle, non tutta la figura; camminando un'onda corre giù per la stoffa
  aria(t) {
    const C = LZ_DC, gx = lzGx, gy = lzGy, gz = lzGz, an = this.anda, ferma = 1 - an * 0.75, sem = this.seme * 1.31, re = Math.sin(t * 1.9 + sem) * 0.75 * ferma;
    const s1 = Math.sin(t * 1.25 + sem), c1 = Math.cos(t * 1.25 + sem), s2 = Math.sin(t * 2.1 + sem * 2), c2 = Math.cos(t * 2.1 + sem * 2);
    for (let r = 1; r <= 3; r++) { const w = LZ_WR[r] * re, d = 1 + r * C; for (let j = 0; j < C; j += 2) { const n = d + j, u = gx[n], v = gy[n], m = 1 / (Math.sqrt(u * u + v * v) + 1); gx[n] = u + u * m * w; gy[n] = v + v * m * w; } }
    for (let r = 3; r < LZ_RR; r++) {
      const w = LZ_WA[r], d = 1 + r * C, f = this.fase * 2 - r * 1.05, s3 = Math.sin(f), c3 = Math.cos(f), p1 = w * ferma * 0.72, p2 = w * ferma * 0.48, p3 = w * an * 1.9;
      for (let j = 0; j < C; j += 2) {
        const n = d + j, u = gx[n], v = gy[n], m = 1 / (Math.sqrt(u * u + v * v) + 1);
        // sin(a + k j) con le tabelle: tre onde lente attorno all'orlo, cinque contrarie, quattro che scendono quando si cammina
        const q = p1 * (s1 * LZ_C3[j] + c1 * LZ_S3[j]) + p2 * (s2 * LZ_C5[j] - c2 * LZ_S5[j]) + p3 * (s3 * LZ_C4[j] + c3 * LZ_S4[j]);
        gx[n] = u + u * m * q; gy[n] = v + v * m * q; gz[n] += Math.abs(q) * 0.32;
      }
    }
  }

  // I fori stanno sulla testa, non sui nodi: la stoffa lì è tesa, e così non possono finire uno sull'altro quando il telo si assesta.
  // L'occhio di là non si schiaccia: si stringe un poco, scivola verso il centro della testa e svanisce. Si spegne sotto 0,30 e si riaccende sopra 0,42
  occhi(ctx, L, base, t, hLant) {
    const st = this.stato, morto = st === 'steso';
    const vt = this.t - this.nato;
    if (vt < 0) return;                                               // finché il telo non è fermo sulla testa non ci sono occhi: si aprono lì
    const fant = st === 'fantasma', nA = vt >= 0.16 ? 1 : lzFaro(vt / 0.16), vivo = !this.fermoV && !morto, lol = morto ? (this.F.gx < 0 ? -0.26 : 0.26) : 0;
    // il battito: ogni 3-6 secondi, un decimo di secondo
    let chiude = 0, bt = this.t - this.bT;
    if (bt >= 0.1) { this.bT = this.t + 3 + 3 * this.caso(); bt = -1; }
    if (vivo && bt >= 0) chiude = Math.sin(Math.PI * bt / 0.1);
    // lo sguardo: un punto verso chi si muove; se nessuno si muove, ogni tanto si guarda attorno
    let tx = 0, ty = 0;
    if (vivo) {
      if (this.gOn) { const dx = this.gX - this.xv, dy = this.gY - this.yv, m = Math.sqrt(dx * dx + dy * dy); if (m > 1) { tx = dx / m; ty = dy / m * 0.6; } }
      else { if (this.t > this.sgT) { const v = this.caso(); this.sgX = v < 0.5 ? 0 : v < 0.75 ? 1 : -1; this.sgT = this.t + (this.sgX ? 0.9 : 2 + 4 * this.caso()); } tx = this.sgX; }
    }
    this.gx += (tx - this.gx) * 0.2; this.gy += (ty - this.gy) * 0.2;
    const hR = LZ_RT + LZ_SP, hcx = this.hx, hcy = this.hy * LZ_KY - this.hz * LZ_KZ, si = morto ? 0.86 : 0.71, co = morto ? 0.5 : 0.7;
    for (let k = 0; k < 2; k++) {
      const e = k ? 1 : -1, th = this.fa + e * 0.4, ct = Math.cos(th), sn = Math.sin(th), q = si * sn * LZ_VY + co * LZ_VZ;
      const ch = Math.max(0, Math.min(1, (q - 0.3) / 0.3)), ea = this.ea[k]; if (ea < 0.03) continue;
      const qx = -sn, qy = ct * LZ_KY, sc = Math.sqrt(qx * qx + qy * qy), ry0 = morto ? 3.5 : 3.1, ry = ry0 * nA * (1 - 0.88 * chiude), rx = Math.max(0.45 * ry0, (morto ? 2.6 : 2.3) * sc), rot = Math.atan2(qx < 0 ? -qy : qy, Math.abs(qx)) * ch + lol;
      let px = hcx + hR * si * ct, py = (this.hy + hR * si * sn) * LZ_KY - (this.hz + hR * co) * LZ_KZ, ux = hcx - px, uy = hcy - py, dm = Math.sqrt(ux * ux + uy * uy) + 1e-4; ux /= dm; uy /= dm;
      px += ux * (1 - ch) * 2.5 + this.gx; py += uy * (1 - ch) * 2.5 + this.gy + e * lol * 5;      // (la testa a terra è reclinata: un occhio più basso dell'altro)
      // il foro sta dentro la sagoma della testa, sempre
      ux = px - hcx; uy = py - hcy; dm = Math.sqrt(ux * ux + uy * uy) + 1e-4; const ec = Math.cos(rot), es = Math.sin(rot), pa = (ux * ec + uy * es) / dm * rx, pb = (uy * ec - ux * es) / dm * ry, lim = hR - 0.7 - Math.sqrt(pa * pa + pb * pb);
      if (dm > lim) { const m = lim / dm; px = hcx + ux * m; py = hcy + uy * m; }
      if (fant) {             // il fantasma ha gli occhi accesi: è l'unica luce che gli resta
        ctx.globalAlpha = 0.16 * ea * nA; ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.ellipse(px, py, rx * 2, ry * 1.7, rot, 0, LZ_DPI); ctx.fill();
        ctx.globalAlpha = Math.min(1, base * 1.9) * ea; ctx.fillStyle = '#e4f4ff'; ctx.beginPath(); ctx.ellipse(px, py, rx, Math.max(0.25, ry), rot, 0, LZ_DPI); ctx.fill();
        continue;
      }
      ctx.globalAlpha = base * ea; ctx.fillStyle = '#0b0910'; ctx.beginPath(); ctx.ellipse(px, py, rx, Math.max(0.25, ry), rot, 0, LZ_DPI); ctx.fill();
      if (L.fori) { ctx.globalAlpha = base * ea * 0.55; ctx.strokeStyle = L.l; ctx.lineWidth = 0.55; ctx.stroke(); }      // sul telo scuro un filo chiaro attorno ai fori
      if (!morto && chiude < 0.5 && nA > 0.5) { ctx.globalAlpha = base * ea * (hLant ? 0.72 + 0.14 * Math.sin(t * 7 + e) : 0.5); ctx.fillStyle = hLant ? '#f2c777' : '#8f8aa0'; ctx.beginPath(); ctx.ellipse(px + 0.3, py + 1.7 * (ry / ry0), rx * 0.5, ry * 0.14, rot, 0, LZ_DPI); ctx.fill(); }
    }
  }

  // un filo di polvere attorno all'orlo, quando tocca terra
  polvere(ctx, base) {
    const q = (this.t - this.pT) / 0.46; if (this.pT < 0 || q < 0 || q >= 1) return;
    const x = this.x, y = this.y, a = 1 + (LZ_R - 1) * LZ_C, e = 1 - (1 - q) * (1 - q);
    ctx.fillStyle = '#d9ccb4'; ctx.globalAlpha = base * 0.2 * (1 - q) * (1 - q);
    ctx.beginPath();
    for (let j = 0; j < LZ_C; j += 2) {
      const n = a + j, u = x[n], v = y[n], m = 1 / (Math.sqrt(u * u + v * v) + 1), o = 2 + 11 * e * (0.7 + 0.3 * LZ_S3[j * 2]), X = u + u * m * o, Y = (v + v * m * o) * LZ_KY - (0.8 + 4.5 * e * (0.6 + 0.4 * LZ_C5[j * 2])) * LZ_KZ, r = (0.55 + 0.3 * (j % 3)) * (1 + 1.2 * e);
      ctx.moveTo(X + r, Y); ctx.arc(X, Y, r, 0, LZ_DPI);
    }
    ctx.fill();
  }

  // quanto si vede ogni occhio: si spegne sotto 0,30, si riaccende sopra 0,42, e nel mezzo sfuma. A tempo fisso, così non dipende da quanto si disegna
  vista() {
    for (let k = 0; k < 2; k++) {
      const q = 0.71 * Math.sin(this.fa + (k ? 0.4 : -0.4)) * LZ_VY + 0.7 * LZ_VZ, ch = Math.max(0, Math.min(1, (q - 0.3) / 0.3));
      if (this.ev[k] && q < 0.3) this.ev[k] = 0; else if (!this.ev[k] && q > 0.42) this.ev[k] = 1;
      this.ea[k] += ((this.ev[k] ? ch * ch : 0) - this.ea[k]) * 0.3;
    }
  }

  // la lanterna resta fuori dal telo: la mano la stringe attraverso la stoffa e pende, con il suo alone. Quando il telo crolla cade, si rovescia e si spegne
  lanterna(ctx, alfa, t) {
    if (this.stato === 'steso') {
      const q = this.tStato, u = Math.min(1, q / 0.34), e = u * u, sp = Math.max(0, 1 - q / 0.5), lato = this.lfx >= 0 ? 1 : -1, b = q - 0.34;
      const lx = this.l0x + (this.lfx - this.l0x) * u, ly = this.l0y + (this.lfy - this.l0y) * u, lz = this.l0z + (2.6 - this.l0z) * e + (b > 0 ? 4.2 * Math.abs(Math.sin(b * 13)) * Math.exp(-b * 9) : 0), rot = lato * 1.46 * Math.min(1, u * u * (3 - 2 * u)) + (b > 0 ? lato * 0.14 * Math.sin(b * 16) * Math.exp(-b * 7) : 0), X = lx, Y = ly * LZ_KY - lz * LZ_KZ;
      if (sp > 0) { const r = 17 * (0.6 + 0.4 * sp); ctx.globalAlpha = alfa * 0.6 * sp; ctx.drawImage(lzAlone, X - r, Y - r, r * 2, r * 2); }
      ctx.globalAlpha = alfa * 0.5 * u; ctx.fillStyle = '#05040b'; ctx.beginPath(); ctx.ellipse(X, ly * LZ_KY + 1.4, 8, 2.6, 0, 0, LZ_DPI); ctx.fill();
      ctx.translate(X, Y); ctx.rotate(rot); ctx.globalAlpha = alfa;
      lzLanternaSpenta(ctx, sp);
      ctx.rotate(-rot); ctx.translate(-X, -Y);
      return;
    }
    const hm = LZ_PUGNO / (Math.sqrt(this.mx * this.mx + this.my * this.my) + 1e-3), hx = this.mx * (1 + hm), hy = this.my * (1 + hm) * LZ_KY - this.mz * LZ_KZ, lx = this.lx, ly = this.ly * LZ_KY - this.lz * LZ_KZ;
    const f = 0.86 + 0.14 * Math.sin(t * 13 + this.seme), r = 17 * (0.96 + 0.04 * f);
    ctx.globalAlpha = alfa * 0.62 * f; ctx.drawImage(lzAlone, lx - r, ly - r, r * 2, r * 2);
    ctx.globalAlpha = alfa; ctx.strokeStyle = '#1f1910'; ctx.lineCap = 'round'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(lx, ly - 6.2); ctx.stroke();
    lzLanternaCorpo(ctx, lx, ly, f, 1);
    ctx.globalAlpha = alfa;
  }
}

// il corpo della lanterna: acceso a 1, spento a 0
function lzLanternaCorpo(ctx, lx, ly, f, luce) {
  const a = ctx.globalAlpha;
  ctx.fillStyle = '#231c12'; ctx.beginPath(); ctx.moveTo(lx - 3.4, ly - 4); ctx.lineTo(lx, ly - 6.6); ctx.lineTo(lx + 3.4, ly - 4); ctx.lineTo(lx + 3, ly + 4.6); ctx.lineTo(lx - 3, ly + 4.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3d3020'; ctx.fillRect(lx - 2.3, ly - 3.4, 4.6, 7.2);
  if (luce > 0) { ctx.globalAlpha = a * luce; ctx.fillStyle = '#ffb44f'; ctx.fillRect(lx - 2.3, ly - 3.4, 4.6, 7.2); ctx.fillStyle = '#ffe9b0'; ctx.globalAlpha = a * f * luce; ctx.fillRect(lx - 1.2, ly - 1.9, 2.4, 4.6); ctx.globalAlpha = a; }
}

// la lanterna spenta e rovesciata: ottone e vetro freddo, così sul pavimento scuro resta una lanterna e non un puntino. Il manico aiuta a capirla
function lzLanternaSpenta(ctx, sp) {
  const a = ctx.globalAlpha;
  ctx.strokeStyle = '#a58a55'; ctx.lineWidth = 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, -6.6, 2.4, Math.PI, 0, false); ctx.stroke();
  ctx.fillStyle = '#6f5a38'; ctx.beginPath(); ctx.moveTo(-3.6, -4); ctx.lineTo(0, -6.8); ctx.lineTo(3.6, -4); ctx.lineTo(3.2, 4.8); ctx.lineTo(-3.2, 4.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4b4a48'; ctx.fillRect(-2.4, -3.4, 4.8, 7.4); ctx.fillStyle = '#8f8d82'; ctx.fillRect(-1.9, -2.9, 1.3, 6.4);
  if (sp > 0) { ctx.globalAlpha = a * sp; ctx.fillStyle = '#ffb44f'; ctx.fillRect(-2.4, -3.4, 4.8, 7.4); ctx.globalAlpha = a; }
}

// la griglia fine, solo per il disegno: fra i nodi veri una curva che passa per i nodi, prima lungo le colonne, poi attorno al telo
function lzGriglia(x, y, z) {
  const C = LZ_C, D = LZ_DC, R = LZ_R, gx = lzGx, gy = lzGy, gz = lzGz;
  gx[0] = x[0]; gy[0] = y[0]; gz[0] = z[0];
  for (let r = 0; r < LZ_RR; r++) {
    const g = LZ_RG[r], i = g | 0, d = 1 + r * D, e = 1 + (i - 1) * C;
    if (g === i) for (let j = 0; j < C; j++) { const k = d + j * 2, n = e + j; gx[k] = x[n]; gy[k] = y[n]; gz[k] = z[n]; }
    else for (let j = 0; j < C; j++) {
      const k = d + j * 2, p = e + j - C, a = e + j, b = a + C, q = i + 2 <= R ? b + C : b;
      gx[k] = (x[a] + x[b]) * 0.5625 - (x[p] + x[q]) * 0.0625; gy[k] = (y[a] + y[b]) * 0.5625 - (y[p] + y[q]) * 0.0625; gz[k] = (z[a] + z[b]) * 0.5625 - (z[p] + z[q]) * 0.0625;
    }
  }
}
// l'orlo un filo più morbido: le rientranze strette non devono fare angolo
function lzOrlo(g) {
  const D = LZ_DC, d = 1 + (LZ_RR - 1) * D, a = lzT2;
  for (let j = 0; j < D; j += 2) a[j] = g[d + j] * 0.7 + (g[d + (j === D - 2 ? 0 : j + 2)] + g[d + (j === 0 ? D - 2 : j - 2)]) * 0.15;
  for (let j = 0; j < D; j += 2) g[d + j] = a[j];
}
// le colonne dispari, attorno al telo: la stessa curva a quattro punti
function lzInfittisci(g) {
  const D = LZ_DC;
  for (let r = 0; r < LZ_RR; r++) {
    const d = 1 + r * D;
    for (let j = 1; j < D; j += 2) { const a = d + j - 1, b = d + (j === D - 1 ? 0 : j + 1), p = d + (j === 1 ? D - 2 : j - 3), q = d + (j >= D - 3 ? j + 3 - D : j + 3); g[d + j] = (g[a] + g[b]) * 0.5625 - (g[p] + g[q]) * 0.0625; }
  }
}

// un giro di vincoli su un tratto: duro a tirare (ks), morbido a comprimere (kc), con le misure del telo aperto se ap>0
const lzK = new Float64Array(4);      // ap, ks, kc, wa: stanno qui e non negli argomenti, così nessun numero viene impacchettato a ogni passo
function lzVincola(x, y, z, ca, cb, rest, restA, i0, i1) {
  const ap = lzK[0], ks = lzK[1], kc = lzK[2], wa = lzK[3], wb = 1 - wa, ap1 = 1 - ap;
  for (let c = i0; c < i1; c++) {
    const a = ca[c], b = cb[c], dx = x[b] - x[a], dy = y[b] - y[a], dz = z[b] - z[a], d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < 1e-8) continue;
    const r = rest[c] * ap1 + restA[c] * ap, d = Math.sqrt(d2), e = (d - r) / d, q = e * (e > 0 ? ks : kc), qa = q * wa, qb = q * wb;
    x[a] += dx * qa; y[a] += dy * qa; z[a] += dz * qa;
    x[b] -= dx * qb; y[b] -= dy * qb; z[b] -= dz * qb;
  }
}

// ---------- le regioni del telo: solo il contorno ----------
// Riempire cella per cella costa migliaia di punti a personaggio. Qui ogni cella dice solo quali pezzi di bordo ha, i pezzi si legano in giri chiusi
// e ogni giro diventa una curva che passa per i punti medi: pochi punti, niente denti di sega, pieghe e sagoma morbide.
const LZ_DN2 = LZ_DN * 2, LZ_PT = LZ_DN * 3;
const LZ_CA = new Int16Array(LZ_CL), LZ_CB = new Int16Array(LZ_CL), LZ_CC = new Int16Array(LZ_CL), LZ_CD = new Int16Array(LZ_CL);
for (let r = 0; r < LZ_RR; r++) for (let j = 0; j < LZ_DC; j++) { const j2 = (j + 1) % LZ_DC, k = r * LZ_DC + j; LZ_CA[k] = r === 0 ? 0 : 1 + (r - 1) * LZ_DC + j; LZ_CB[k] = r === 0 ? 0 : 1 + (r - 1) * LZ_DC + j2; LZ_CC[k] = 1 + r * LZ_DC + j2; LZ_CD[k] = 1 + r * LZ_DC + j; }
const lzNext = new Int16Array(LZ_PT), lzNext2 = new Int16Array(LZ_PT), lzTimbro = new Int32Array(LZ_PT), lzVia = new Int16Array(LZ_PT), lzGiro = new Int16Array(LZ_PT * 2), LZ_SCHEGGIA = 12;
const lzFr = new Int16Array(LZ_CL), lzBordo = new Uint8Array(LZ_CL), lzMot = new Uint8Array(LZ_CL), lzTm = new Float32Array(LZ_CL), lzTM = new Float32Array(LZ_CL), lzKm = new Float32Array(LZ_CL), lzKM = new Float32Array(LZ_CL);
let lzMarca = 0, lzNv = 0, lzNf = 0, lzUsc = -1, lzEnt = -1, lzEsile = 0;

const LZ_TIENI = new Uint8Array(LZ_PT);
for (let n = 0; n < LZ_DN; n++) { const r = n ? ((n - 1) / LZ_DC) | 0 : 0, j = n ? (n - 1) % LZ_DC : 0; LZ_TIENI[n] = 1; LZ_TIENI[LZ_DN + n] = r & 1 ? 0 : 1; LZ_TIENI[LZ_DN2 + n] = j & 1 ? 0 : 1; }

function lzLega(p, q) { if (lzTimbro[p] !== lzMarca) { lzTimbro[p] = lzMarca; lzNext[p] = q; lzNext2[p] = -1; lzVia[lzNv++] = p; } else if (lzNext2[p] < 0) lzNext2[p] = q; }

// un lato di una cella tagliata dalla curva di livello. aperto: oltre questo lato la stoffa non continua
function lzLato(sx, sy, p, q, fp, fq, id, aperto, L) {
  const ip = fp >= L, iq = fq >= L;
  if (ip && iq) { if (aperto) lzLega(p, q); return; }
  if (!ip && !iq) return;
  const u = (L - fp) / (fq - fp); sx[id] = sx[p] + (sx[q] - sx[p]) * u; sy[id] = sy[p] + (sy[q] - sy[p]) * u;
  if (ip) { if (aperto) lzLega(p, id); lzUsc = id; }
  else { if (lzUsc >= 0) { lzLega(lzUsc, id); lzUsc = -1; } else lzEnt = id; if (aperto) lzLega(id, q); }
}

// lega i pezzi in giri chiusi e li traccia con curve per i punti medi. I giri più piccoli di amin si scartano: sono schegge, non pieghe.
// tutti false: i giri girati al contrario sono buchi nella sagoma, cioè una piega vista di taglio, e la stoffa li copre
function lzCammina(ctx, sx, sy, amin, tutti) {
  const nx = lzNext, n2 = lzNext2, tm = lzTimbro, mk = lzMarca, n = lzNv, via = lzVia, gi = lzGiro;
  for (let i = 0; i < n; i++) {
    const s = via[i];
    while (nx[s] >= 0) {
      let p = s, m = 0, ar = 0, gi2 = 0;
      for (;;) {
        gi[m++] = p;
        const q = nx[p]; nx[p] = n2[p]; n2[p] = -1;
        const ux = sx[q] - sx[p], uy = sy[q] - sy[p]; gi2 += (ux < 0 ? -ux : ux) + (uy < 0 ? -uy : uy);
        ar += sx[p] * sy[q] - sx[q] * sy[p];
        p = q;
        if (p === s || tm[p] !== mk || nx[p] < 0) break;
      }
      if (m < 3 || (ar < amin && ar > -amin) || (!tutti && ar < 0) || (tutti && (ar < 0 ? -ar : ar) < gi2 * lzEsile)) continue;      // anche i fili sottili: una piega ha sempre un po' di larghezza
      if (lzEsile > 0 && m >= 10) { let w = 0; for (let k = 0; k < m; k++) if (LZ_TIENI[gi[k]]) gi[w++] = gi[k]; if (w >= 4) m = w; }      // nelle pieghe basta un punto ogni due: sempre gli stessi, così la curva non trema da un fotogramma all'altro
      const a = gi[m - 1], b = gi[0], x0 = (sx[a] + sx[b]) * 0.5, y0 = (sy[a] + sy[b]) * 0.5;
      ctx.moveTo(x0, y0);
      for (let k = 0; k < m - 1; k++) { const u = gi[k], v = gi[k + 1]; ctx.quadraticCurveTo(sx[u], sy[u], (sx[u] + sx[v]) * 0.5, (sy[u] + sy[v]) * 0.5); }
      ctx.quadraticCurveTo(sx[a], sy[a], x0, y0); ctx.closePath();
    }
  }
}

// dove il campo f (per il verso sg) supera la soglia L, sulla stoffa dritta. lo e hi: minimo e massimo per cella, così le celle che non c'entrano costano un confronto
function lzRegione(ctx, sx, sy, f, lo, hi, sg, L) {
  lzMarca++; lzNv = 0; lzEsile = 1.5;
  const fr = lzFr, bo = lzBordo, nf = lzNf;
  for (let i = 0; i < nf; i++) {
    const k = fr[i], mn = sg > 0 ? lo[k] : -hi[k], mx = sg > 0 ? hi[k] : -lo[k], b = bo[k];
    if (mx < L || (mn >= L && !b)) continue;
    const a = LZ_CA[k], e = LZ_CB[k], c = LZ_CC[k], d = LZ_CD[k], fa = f[a] * sg, fe = f[e] * sg, fc = f[c] * sg, fd = f[d] * sg;
    lzUsc = -1; lzEnt = -1;
    lzLato(sx, sy, a, d, fa, fd, LZ_DN2 + d, b & 1, L);
    lzLato(sx, sy, d, c, fd, fc, LZ_DN + d, b & 2, L);
    lzLato(sx, sy, c, e, fc, fe, LZ_DN2 + c, b & 4, L);
    if (a !== e) lzLato(sx, sy, e, a, fe, fa, LZ_DN + a, b & 8, L);
    if (lzUsc >= 0 && lzEnt >= 0) lzLega(lzUsc, lzEnt);
  }
  lzCammina(ctx, sx, sy, LZ_SCHEGGIA, true);
}

// tutta la stoffa dritta: il suo bordo è la sagoma
function lzSagoma(ctx, sx, sy) {
  lzMarca++; lzNv = 0; lzEsile = 0;
  const fr = lzFr, bo = lzBordo, nf = lzNf;
  for (let i = 0; i < nf; i++) {
    const k = fr[i], b = bo[k]; if (!b) continue;
    const a = LZ_CA[k], e = LZ_CB[k], c = LZ_CC[k], d = LZ_CD[k];
    if (b & 1) lzLega(a, d); if (b & 2) lzLega(d, c); if (b & 4) lzLega(c, e); if ((b & 8) && a !== e) lzLega(e, a);
  }
  lzCammina(ctx, sx, sy, LZ_SCHEGGIA, false);
}

// le celle di una maschera m dove m vale v: l'interno del telo, le righe e i quadri del disegno
function lzMaschera(ctx, sx, sy, m, v, amin, esile) {
  lzMarca++; lzNv = 0; lzEsile = esile;
  const C = LZ_DC, R = LZ_RR;
  for (let r = 0; r < R; r++) for (let j = 0; j < C; j++) {
    const k = r * C + j; if (m[k] !== v) continue;
    const a = LZ_CA[k], e = LZ_CB[k], c = LZ_CC[k], d = LZ_CD[k];
    if (m[r * C + (j + C - 1) % C] !== v) lzLega(a, d);
    if (r === R - 1 || m[k + C] !== v) lzLega(d, c);
    if (m[r * C + (j + 1) % C] !== v) lzLega(c, e);
    if (r > 0 && m[k - C] !== v) lzLega(e, a);
  }
  lzCammina(ctx, sx, sy, amin, true);
}

// il disegno sul telo: segue le celle, quindi pieghe e movimento lo portano con sé. Si legge in una parola: Righe, Pois, Quadri
function lzMotivo(ctx, sx, sy, cell, m, L) {
  const C = LZ_DC, R = LZ_RR;
  ctx.fillStyle = L.a; ctx.beginPath();
  if (m === 'pois') {
    for (let r = 1; r < R - 1; r += 2) for (let j = (r & 2) ? 3 : 0; j < C; j += 6) {
      if (cell[r * C + j] !== 1 || cell[(r + 1) * C + j] !== 1) continue;
      const n = 1 + r * C + j, d = 1 + r * C, a = d + (j + 1) % C, b = d + (j + C - 1) % C, ux = (sx[a] - sx[b]) * 0.62, uy = (sy[a] - sy[b]) * 0.62, vx = (sx[n + C] - sx[n - C]) * 0.21, vy = (sy[n + C] - sy[n - C]) * 0.21, X = sx[n], Y = sy[n];
      ctx.moveTo(X + ux, Y + uy);
      for (let k = 1; k < 8; k++) { const p = LZ_OTTA[k], q = LZ_OTTA[(k + 2) & 7]; ctx.lineTo(X + ux * p + vx * q, Y + uy * p + vy * q); }
      ctx.closePath();
    }
  } else {
    const mo = lzMot;
    for (let r = 0; r < R; r++) for (let j = 0; j < C; j++) { const k = r * C + j, dis = (j >> 2) & 1; mo[k] = cell[k] && (m === 'righe' ? dis : dis ^ LZ_QR[r]) ? 1 : 0; }
    lzMaschera(ctx, sx, sy, mo, 1, LZ_SCHEGGIA, 0);
  }
  ctx.fill();
}

function lzFaro(u) { const v = 1 - u; return 1 - v * v * v * (1 + 0.6 * u); }                // come --faro-ease: parte svelta, arriva piano
function lzMisto(a, b, u) { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), c = s => { const x = (p >> s) & 255, y = (q >> s) & 255; return Math.round(x + (y - x) * u); }; return `rgb(${c(16)},${c(8)},${c(0)})`; }
function lzHue(r, g, b) { const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m; if (d === 0) return { h: 0, s: 0, l: (M + m) / 510 }; const l = (M + m) / 510, s = d / (255 - Math.abs(M + m - 255)), h = M === r ? ((g - b) / d + 6) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: h * 60, s, l }; }
function lzRgb(h, s, l) { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, k = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return k.map(v => Math.round((v + m) * 255)); }
// la luce calda sulla stoffa: la stessa tinta più chiara, 70 di cresta e 30 di caldo, e mai più di 12 gradi lontana. «Ho visto il viola» deve restare vero anche vicino alla lanterna
function lzCalda(L) {
  if (L.c) return L.c;
  const hex = (s) => { const n = parseInt(s.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }, a = hex(L.l), b = hex(L.b), w = [255, 214, 150], m = [0, 1, 2].map(i => a[i] * 0.7 + w[i] * 0.3), H0 = lzHue(b[0], b[1], b[2]), H = lzHue(m[0], m[1], m[2]);
  let h = H.h;
  if (H0.s > 0.16) { let d = h - H0.h; while (d > 180) d -= 360; while (d < -180) d += 360; h = (H0.h + Math.max(-11.5, Math.min(11.5, d)) + 360) % 360; }
  const r = lzRgb(h, H.s, H.l);
  L.c = `rgb(${r[0]},${r[1]},${r[2]})`;
  return L.c;
}
// l'interno del telo: in ombra, ma è la stessa stoffa
function lzDentro(L) { if (!L.i) L.i = lzMisto(L.d, L.s, 0.5); return L.i; }
// la stoffa in piedi: dall'alto chiara, verso l'orlo più scura. Una sfumatura sola per tinta, in unità del telo: vale per tutti e non costa niente
function lzTelo(L) {
  if (L.g) return L.g;
  const g = lzOmbraT.getContext('2d').createLinearGradient(0, -64, 0, 2);
  g.addColorStop(0, lzMisto(L.b, L.l, 0.14)); g.addColorStop(0.3, L.b); g.addColorStop(0.72, lzMisto(L.b, L.s, 0.18)); g.addColorStop(1, lzMisto(L.b, L.s, 0.52));
  L.g = g; return g;
}

// il mezzo busto fermo, per il registro: una canvas quadrata, con un passo di sfumatura in più
const lzRitratti = {};
function ritrattoLenzuolo(c, lato) {
  lato = lato || 96; const k = c + ':' + lato; if (lzRitratti[k]) return lzRitratti[k];
  const cv = document.createElement('canvas'); cv.width = cv.height = lato;
  const q = cv.getContext('2d'), l = new Lenzuolo({ c }, { seme: c }), S = lato / 46;
  l.pronto = true; l.corpo();
  l.disegna(q, { x: lato / 2, y: lato * 0.05 + 70 * LZ_KZ * S, scala: S, ombra: false, lanterna: false, t: 0, fine: true });
  lzRitratti[k] = cv; return cv;
}

// ===== disegno.js =====
// Il disegno della mappa, degli avatar, della luce delle lanterne e degli effetti (uguale su tutti i telefoni).



const CORR1 = '#5a2b33', CORR2 = '#612f38';
const FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue","Inter",system-ui,sans-serif';
const ORO = '231,183,92', ROSSO = '240,90,110', VOCE_COL = '150,235,200';   // VOCE_COL: l'anello della voce

// I teli di chi gioca stanno qui e non nel Pittore: la scena e gli schermi delle telecamere disegnano le stesse persone,
// e la stoffa si simula una volta sola a fotogramma, da chi la disegna per prima (tU: l'ultimo momento simulato).
// tV: l'ultima volta che qualcuno l'ha disegnata. Chi non si vede da un quarto di secondo non si simula.
const TELO_K = 0.86;             // alto come era l'omino: fumetti, nomi e mobili restano giusti
const TELO_PIEDI = T * 0.38;     // da dove sta il punto del giocatore a dove poggia il telo
const TELO_ORLO = T * 0.68;      // fin dove arriva l'orlo davanti: è lì che si decide chi sta davanti a un mobile basso
const TELO_ATTESA = 1.15;        // in saletta: quanto si vede l'omino prima che il telo gli cada in testa
const TELO_FUORI = 0.25;
const TELO_TETTO = 2.4;          // millisecondi a fotogramma per tutti i teli a schermo: oltre, si diradano
const TELO_STRAPPO = 420;        // oltre questi pixel al secondo non si cammina più (il passo più svelto, da anima, arriva a 310)
const TELO_BASE = { c: 0, m: null };
// Il telo degli altri si stampa su una tavoletta sua e si copia sulla scena: la stoffa viva si disegna a turno (con tanta gente a schermo una volta ogni due
// o tre fotogrammi, sul telefono non si nota) e la copia costa pochissimo. Il mio telo no: si disegna sempre, è quello che si guarda.
const STAMPA_W = 116, STAMPA_H = 104, STAMPA_X = 58, STAMPA_Y = 76;           // la tavoletta di chi sta in piedi: i piedi stanno a (X,Y)
const STESO_W = 164, STESO_H = 92, STESO_X = 80, STESO_Y = 52;                // quella del telo a terra, con la lanterna accanto
let TELI = {}, STESI = {}, NOMI = {}, nNomi = 0, RES = 2, NUM = 0, NOMI_SU = {};
const NOMI_MAX = 24, NOMI_C = [];      // i nomi da scrivere in questo fotogramma: oggetti riusati, nessuna allocazione
for(let i=0;i<NOMI_MAX;i++) NOMI_C.push({ id:'', nome:'', col:'', x:0, y:0, a:1, w:0, yF:0 });
function teliAzzera(){ TELI = {}; STESI = {}; NOMI = {}; nNomi = 0; NOMI_SU = {}; }
function tavoletta(w, h){ const cv = document.createElement('canvas'), q = RES; cv.width = Math.ceil(w*q); cv.height = Math.ceil(h*q); return { cv, c:cv.getContext('2d'), res:q, t:-9, g:false }; }

class Pittore {
  constructor(cv){
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.ombra = document.createElement('canvas'); this.octx = this.ombra.getContext('2d');
    this.cam = { x:0, y:0 }; this.DPR = 1; this.SCALA = 1; this.w = 0; this.h = 0;
    this.parti = [];        // particelle nel mondo (polvere dei passi, fumo, scintille)
    this.polvere = Array.from({length:26}, ()=>({ x:Math.random(), y:Math.random(), v:0.2+Math.random()*0.5, f:Math.random()*6 }));
    this.passi = {}; this.onde = []; this.ondaDi = {};
    this.fum = {};   // i fumetti della chat: lo spostamento morbido di ogni pila (per non coprirsi)
    this.acquaOnde = []; this.ondaA = {}; this.acqCov = null; this.acqN = 0;   // i cerchi nell'acqua
    this.ridotto = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);   // chi non vuole movimento: i fumetti non scivolano
  }
  misura(){
    // (le misure del riquadro, non dello schermo: se il gioco è girato di lato restano giuste)
    const w = Math.max(1, Math.round(this.cv.offsetWidth || this.cv.getBoundingClientRect().width)), h = Math.max(1, Math.round(this.cv.offsetHeight || this.cv.getBoundingClientRect().height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if(w===this.w && h===this.h && dpr===this.DPR) return;
    this.w = w; this.h = h; this.DPR = dpr;
    this.cv.width = Math.round(w*dpr); this.cv.height = Math.round(h*dpr);
    this.ombra.width = Math.ceil(this.cv.width/3); this.ombra.height = Math.ceil(this.cv.height/3);   // il buio a un terzo: costa meno e il bordo della luce viene morbido
    this.SCALA = Math.max(0.6, Math.min(1.6, Math.min(w,h)/(13*T)));
  }
  ell(x,y,rx,ry,rot){ const c=this.ctx; c.beginPath(); c.ellipse(x,y,rx,ry,rot||0,0,Math.PI*2); }
  // particelle: tipo 'polvere' | 'fumo' | 'scintilla' | 'goccia' | 'fiamma' | 'zampa'
  sparpaglia(tipo, x, y, n, opz){
    opz = opz || {};
    for(let i=0;i<n;i++){
      const a=Math.random()*Math.PI*2, v=(opz.v||30)*(0.4+Math.random());
      this.parti.push({ tipo, x, y, vx:Math.cos(a)*v, vy:Math.sin(a)*v - (opz.su||0), vita:(opz.vita||0.8)*(0.6+Math.random()*0.6), t:0, r:(opz.r||3)*(0.6+Math.random()*0.8), col:opz.col });
    }
    if(this.parti.length>500) this.parti.splice(0, this.parti.length-500);
  }

  // S: { M, palazzo, t, dt, io, altri, corpi, R, anima, neb, buio, bengala, miei, freccia, botole, segui, effetti, segnati, traccia, rianima, ipno, scossa }
  disegna(S){
    this.misura();
    const c=this.ctx, W=this.cv.width, H=this.cv.height, s=(S.scala||this.SCALA)*this.DPR, M=S.M, t=S.t, io=S.io, dt=S.dt||0.016;
    const seg = S.segui || io;
    // le luci (solo per chi gioca da ospite: le ombre vedono comunque): sfarfallio e buio; dopo la riparazione la luce torna dal quadro, una stanza dopo l'altra
    const liv = S.buio ? livelloLuci(this.ridotto ? (S.buioE < 0.12 ? 1 : 0) : S.buioE) : 1;
    const onda = !S.buio && S.buioR >= 0 && S.buioR < LUCI_RITORNO ? S.buioR*LUCI_ONDA*T : -1, qx = centro(QUADRO.tx), qy = centro(QUADRO.ty);
    luciAccese(S.buio ? () => liv > 0.5 : onda >= 0 ? (x, y) => Math.hypot(x - qx, y - qy) < onda : null);
    this.acqCov = null;
    if(!this.cam.ok){ this.cam.x=seg.x; this.cam.y=seg.y; this.cam.ok=true; }
    this.cam.x += (seg.x-this.cam.x)*0.2; this.cam.y += (seg.y-this.cam.y)*0.2;
    if(Math.hypot(seg.x-this.cam.x, seg.y-this.cam.y) > 8*T){ this.cam.x=seg.x; this.cam.y=seg.y; }
    const sc = S.scossa>0 ? S.scossa*6 : 0;
    const al=(S.alza||0)*this.DPR;   // mentre si scrive con la tastiera aperta la scena si alza: chi gioca resta sopra la barra
    const cx=this.cam.x-W/(2*s)+(Math.random()-0.5)*sc, cy=this.cam.y-H/(2*s)+al/s+(Math.random()-0.5)*sc;
    c.setTransform(1,0,0,1,0,0); c.fillStyle='#090b16'; c.fillRect(0,0,W,H);
    // il palazzo fermo (pavimenti, tappeti, muri, ombre) è già disegnato a pezzi: si copiano quelli sullo schermo
    const res=Math.min(3, Math.ceil(s*10)/10), L=PEZZO*T, ni=Math.ceil(M.GW/PEZZO)-1, nj=Math.ceil(M.GH/PEZZO)-1;
    const i0=Math.max(0,Math.floor(cx/L)), j0=Math.max(0,Math.floor(cy/L)), i1=Math.min(ni,Math.floor((cx+W/s)/L)), j1=Math.min(nj,Math.floor((cy+H/s)/L));
    // le immagini del palazzo reso in Blender (null se spente o se l'indice non è ancora arrivato: allora tutto a codice, come prima)
    const imm=immPronta(M);
    if(imm) immChiedi(imm, M, i0, j0, i1, j1, 1);   // scarica quello che serve: lo schermo e un anello di pezzi intorno
    // al massimo ~6 ms per fotogramma a fare pezzi nuovi: quelli che mancano ancora si abbozzano e arrivano al prossimo
    let nuovi=0, spesa=0, manca=0, vuoti=0;
    // l'anteprima sotto i pezzi che mancano o stanno entrando: una pennellata sola su tutto il rettangolo, così fra un pezzo e l'altro non resta nessuna riga
    const ante=immAnteprima(M);
    if(ante){
      let a0=ni+1, a1=-1, b0=nj+1, b1=-1;
      for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
        const im=imm && immPezzo(imm, i, j);
        if(im && immDissolvi(imm, im)>=1) continue;
        if(i<a0) a0=i; if(i>a1) a1=i; if(j<b0) b0=j; if(j>b1) b1=j;
      }
      if(a1>=0){ const k=ante.w/(M.GW*T), x=Math.round((a0*L-cx)*s), y=Math.round((b0*L-cy)*s);
        c.drawImage(ante.img, a0*L*k, b0*L*k, (a1-a0+1)*L*k, (b1-b0+1)*L*k, x, y, Math.round(((a1+1)*L-cx)*s)-x+1, Math.round(((b1+1)*L-cy)*s)-y+1); }
    }
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
      const dx=Math.round((i*L-cx)*s), dy=Math.round((j*L-cy)*s), dw=Math.round(((i+1)*L-cx)*s)-dx, dh=Math.round(((j+1)*L-cy)*s)-dy;
      const im=imm && immPezzo(imm, i, j);   // l'immagine di Blender del pezzo, se è già arrivata: prende il posto del disegno
      if(im){ if(ante){ c.globalAlpha=immDissolvi(imm, im); c.drawImage(im, dx, dy, dw+1, dh+1); c.globalAlpha=1; } else c.drawImage(im, dx, dy, dw+1, dh+1); continue; }
      if(imm && imm.pz.has(j*16+i)) manca++;   // (doveva esserci l'immagine di Blender e non c'è ancora: per le prove e per il caricamento d'ingresso)
      if(ante) continue;                        // (sotto c'è già l'anteprima)
      vuoti++;
      let e=pezzo(M,i,j,res,true);
      if(!e && (spesa<6 || !nuovi)){ const a=performance.now(); e=pezzo(M,i,j,res); e.nuovo=false; nuovi++; spesa+=performance.now()-a; }
      if(e) c.drawImage(e.cv, dx, dy, dw+1, dh+1); else this.abbozzo(M, i, j, dx, dy, dw/(PEZZO*T));   // +1: nessuna riga tra un pezzo e l'altro
    }
    this.meta={ w:W/s, h:H/s };   // quanto vedo, in pixel del gioco (lo usa il caricamento d'ingresso per sapere quali pezzi servono)
    this.manca=manca; if(manca) this.fotMancano=(this.fotMancano||0)+1;   // pezzi di Blender mancanti in questo fotogramma / fotogrammi con pezzi mancanti dall'inizio
    if(vuoti) this.fotVuoti=(this.fotVuoti||0)+1;                         // fotogrammi con pezzi a codice (né l'immagine né l'anteprima): per le prove
    c.setTransform(s,0,0,s,-cx*s,-cy*s);
    const tx0=Math.max(0,Math.floor(cx/T)-1), ty0=Math.max(0,Math.floor(cy/T)-1), tx1=Math.min(M.GW-1,Math.ceil((cx+W/s)/T)+1), ty1=Math.min(M.GH-1,Math.ceil((cy+H/s)/T)+1);
    // solo il mare e le torce si muovono
    mareVivo(c, M, t, cx-T, cy-T, cx+W/s+T, cy+H/s+T, this.onde, res);
    torceVive(c, M, t, cx-T, cy-T, cx+W/s+T, cy+H/s+2*T);
    candeleVive(c, M, t, cx-T, cy-T, cx+W/s+T, cy+H/s+2*T);   // (con le immagini di Blender: le fiamme delle candele sul pavimento)
    if(S.palazzo && S.acquaV) this.acquaDisegna(S, c, cx, cy, s, W, H, t);   // l'acqua alta: sul pavimento, sotto mobili e persone
    const vx0=cx-3*T, vy0=cy-3*T, vx1=cx+W/s+3*T, vy1=cy+H/s+3*T;
    const campanaImm=!!(S.palazzo && imm && immHa(M,'campana'));
    if(S.palazzo){
      for(const p of POSTAZIONI) this.postazione(p,S.miei.has(p.id),t);
      if(!campanaImm) this.postazione({ tx:CAMPANA.tx, ty:CAMPANA.ty, tipo:'campana' },false,t);   // (con l'immagine di Blender la campana sta tra i mobili, in ordine di profondità)
      this.postazione({ tx:QUADRO.tx, ty:QUADRO.ty, tipo:'quadro' },!!S.buio,t);
      [[CHIUSA_A,0],[CHIUSA_B,1]].forEach(([q,i])=>this.postazione({ tx:q.tx, ty:q.ty, tipo:'chiusa' }, !!(S.chiuse&&S.chiuse[i]), t));
      if(S.botole) for(const e of ESTREMI){ const x=centro(e.tx), y=centro(e.ty); c.fillStyle='#121019'; this.ell(x,y,12,12); c.fill(); c.strokeStyle='#4a3b52'; c.lineWidth=2; c.stroke(); c.beginPath(); c.moveTo(x-8,y); c.lineTo(x+8,y); c.moveTo(x,y-8); c.lineTo(x,y+8); c.stroke(); }
      // le telecamere (fisse e della Sentinella): la lucina rossa lampeggia quando qualcuno guarda gli schermi
      for(const k of S.telecamere||[]){ const x=k[0], y=k[1];
        c.fillStyle='#1c1f26'; c.fillRect(x-7,y-20,14,9); c.fillStyle='#3a3f4c'; c.fillRect(x-2,y-11,4,8);
        c.fillStyle='#8fb6d8'; this.ell(x+5,y-15.5,2.6,2.6); c.fill();
        if(S.osservate && Math.sin(t*8)>0){ c.fillStyle='rgba(255,60,70,.95)'; this.ell(x-4,y-17,2,2); c.fill(); } }
      // le lucciole della serra
      const serra=M.stanze.find(st=>st.nome==='Serra');
      if(serra) for(let i=0;i<9;i++){ const x=(serra.x+1+((i*37)%11)+Math.sin(t*0.7+i)*0.8)*T, y=(serra.y+1+((i*53)%11)+Math.cos(t*0.9+i*2)*0.8)*T, a=0.4+0.4*Math.sin(t*3+i*1.7); const g=c.createRadialGradient(x,y,0,x,y,9); g.addColorStop(0,`rgba(210,255,140,${a})`); g.addColorStop(1,'rgba(210,255,140,0)'); c.fillStyle=g; c.fillRect(x-9,y-9,18,18); }
    }
    const R=S.R, anima=S.anima;
    this.cx=cx; this.cy=cy; this.s=s; if(S.scala==null) RES=s;   // (per copiare le tavolette sui pixel giusti)
    const visibile = q => anima || (Math.hypot(q.x-io.x,q.y-io.y)<=R*0.97 && vede(M,io.x,io.y,q.x,q.y));
    for(const k of S.corpi) this.corpo(k,t,visibile(k)&&k.x>vx0&&k.x<vx1&&k.y>vy0&&k.y<vy1,S.neb,M);
    if(S.scala==null){ let n=0; for(const id in STESI) n++; if(n!==S.corpi.length) for(const id in STESI) if(!S.corpi.some(k=>k.id===id)) delete STESI[id]; }   // (rianimato, mangiato, pulito: il mucchio va via)
    // gli effetti nel mondo (sotto i personaggi quelli a terra)
    for(const e of S.effetti||[]) if(e.terra && (e.sempre || visibile(e))) this.effetto(e,t);
    // le orme (solo l'Investigatore): una per passo, del colore di chi l'ha lasciata
    for(const o of S.orme||[]){ const a=Math.max(0,1-(t-o.t)/(S.durOrme||10)); if(a<=0) continue; c.save(); c.translate(o.x,o.y+T*0.3); c.rotate(o.dir+Math.PI/2); c.globalAlpha=0.65*a; c.fillStyle=o.col; this.ell(o.lato*4,0,2.6,4.2); c.fill(); if(o.bordo){ c.strokeStyle=o.bordo; c.lineWidth=1; c.stroke(); } c.restore(); }
    c.globalAlpha=1;
    const tutti=S.altri.filter(p=>(!p.fantasma||anima) && (visibile(p) || (S.traccia && p.id===S.traccia)));
    if(io.mostra) tutti.push(io);
    this.saletta=!!S.saletta; this.sguardo=S.scala==null && io.muove ? io : null;   // nella saletta il telo cade; gli occhi di chi è fermo seguono chi cammina vicino
    this.mio=S.scala==null?io:null;
    // quante persone a schermo decidono ogni quanto si ridisegna ognuna; se il telefono non ce la fa (piu) si dirada ancora: la scena resta fluida, la stoffa fa meno pose
    if(S.scala==null){ this.turno=(this.turno||0)+1; this.piu=this.piu||0; this.gruppi=Math.min(5,(tutti.length<=3?1:tutti.length<=7?2:3)+this.piu); this.spesa=0; } else this.gruppi=0;
    // mentre scrivo, un anello d'oro sotto chi mi sentirà (solo chi vedo: il buio non tradisce nessuno)
    if(S.parla){ const P=S.parla, a=0.6+0.25*Math.sin(t*4);
      for(const p of tutti){ if(p===io || (P.anima ? !p.fantasma : p.fantasma)) continue;
        if(!P.anima && (Math.hypot(p.x-io.x,p.y-io.y)>P.R || !vede(M,io.x,io.y,p.x,p.y))) continue;
        c.strokeStyle=`rgba(${ORO},${a})`; c.lineWidth=2; this.ell(p.x,p.y+T*0.34,T*0.5,T*0.2); c.stroke(); } }
    // la voce: un anello verde chiaro sotto chi parla e lo sento (anche sotto di me, quando parlo). S.voce[id]: da 0 a 1, già morbido.
    // Solo chi vedo: chi parla dietro un muro non si vede e non ha anello. Due cerchi, il più largo più leggero: pulsa con la voce.
    // (chi non vuole movimento: l'anello non si allarga, cambia solo la trasparenza)
    if(S.voce) for(const p of tutti){ const v=S.voce[p.id]; if(!(v>0.02)) continue; const w=this.ridotto?0.5:v;
      c.lineWidth=2; c.strokeStyle=`rgba(${VOCE_COL},${0.3+0.5*v})`; this.ell(p.x,p.y+T*0.34,T*(0.5+0.14*w),T*(0.2+0.06*w)); c.stroke();
      c.lineWidth=1.5; c.strokeStyle=`rgba(${VOCE_COL},${0.12+0.25*v})`; this.ell(p.x,p.y+T*0.34,T*(0.62+0.3*w),T*(0.25+0.12*w)); c.stroke(); }
    // mobili e persone in ordine di profondità: chi passa dietro un mobile alto ne resta coperto
    const scena=[];
    M.ostacoli.forEach((o,k)=>{ if((o.x+o.w)*T<vx0||o.x*T>vx1||(o.y+o.h)*T<vy0||o.y*T-altezzaMobile(o,M,k)>vy1) return; scena.push({ y:(o.y+o.h)*T, o, k }); });
    if(imm){   // gli oggetti di scena di Blender (lampioni, sedie...) e la campana: anche loro dietro o davanti a chi passa
      immExtra(imm).forEach((e,n)=>{ if(e.x+e.w<vx0||e.x>vx1||e.y+e.h<vy0||e.y>vy1) return; scena.push({ y:e.base, ex:n }); });
      if(campanaImm){ const bx=centro(CAMPANA.tx), by=centro(CAMPANA.ty); if(bx>vx0 && bx<vx1 && by>vy0 && by<vy1+2*T) scena.push({ y:(CAMPANA.oy+1)*T, campana:true }); }
    }
    for(const p of tutti) if(p===io || (p.x>vx0 && p.x<vx1 && p.y>vy0 && p.y<vy1)) scena.push({ y:p.y+TELO_ORLO, p });   // chi è fuori dallo schermo non si disegna e non si simula
    scena.sort((a,b)=>a.y-b.y);
    let dopoIo=false, coperto=false;   // qualcosa di alto mi sta davanti? Solo allora serve la mia sagoma trasparente
    for(const q of scena){
      if(q.o){ if(dopoIo && !coperto) coperto=(q.o.x*T<io.x+T && (q.o.x+q.o.w)*T>io.x-T && q.o.y*T-altezzaMobile(q.o,M,q.k)<io.y+T*0.4); disegnaMobile(c, M, q.o, q.k, res, t, S.effetti, this); continue; }
      if(q.ex!==undefined){ if(dopoIo && !coperto){ const e=immExtra(imm)[q.ex]; coperto=e.x<io.x+T && e.x+e.w>io.x-T && e.y<io.y+T*0.4; } disegnaExtra(c, imm, q.ex, t); continue; }
      if(q.campana){ coperto=coperto||dopoIo; immAnimata(c, M, 'campana', 0, 0, Math.sin(t*2)*0.08); continue; }
      const p=q.p; if(p===io) dopoIo=true;
      if(p.muove && !p.fantasma){ const k=this.passi[p.id]||0; if(t-k>0.22){ this.passi[p.id]=t; this.sparpaglia('polvere', p.x+(Math.random()-0.5)*8, p.y+T*0.36, 2, { v:12, vita:0.5, r:2.5 }); }
        // sul bordo del molo i passi fanno cerchi nell'acqua
        if(t-(this.ondaDi[p.id]||0)>0.5 && this.onde.length<24){ const px=Math.floor(p.x/T), py=Math.floor((p.y+T*0.36)/T);
          for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){ const n=(py+dy)*M.GW+px+dx; if(px+dx>=0 && px+dx<M.GW && py+dy>=0 && py+dy<M.GH && M.ACQUA[n] && M.PAV[n]===-2){ this.ondaDi[p.id]=t; this.onde.push({ x:(px+dx+0.5)*T-dx*10+(Math.random()-0.5)*10, y:(py+dy+0.5)*T-dy*12+(Math.random()-0.5)*6, t0:t, r:20 }); break; } } } }
      if(this.acqCov && !this.ridotto && p.muove && !p.fantasma && t-(this.ondaA[p.id]||0)>0.26 && this.acqCov((p.x/T)|0, ((p.y+T*0.3)/T)|0)>0.4){   // chi cammina nell'acqua fa cerchi e spruzzi
        this.ondaA[p.id]=t; if(this.acquaOnde.length<40) this.acquaOnde.push({ x:p.x, y:p.y+T*0.34, t0:t });
        this.sparpaglia('goccia', p.x+(Math.random()-0.5)*10, p.y+T*0.3, 3, { v:46, su:70, vita:0.55, r:2.6 }); }
      const grigio=S.neb && p!==io;
      if(S.segnati && S.segnati.indexOf(p.id)>=0 && !grigio){ const g=c.createRadialGradient(p.x,p.y-T*0.4,0,p.x,p.y-T*0.4,T*1.2); g.addColorStop(0,`rgba(${ROSSO},${0.45+0.2*Math.sin(t*6)})`); g.addColorStop(1,`rgba(${ROSSO},0)`); c.fillStyle=g; c.fillRect(p.x-T*1.2,p.y-T*1.6,T*2.4,T*2.4); }
      if(S.traccia && p.id===S.traccia){ c.strokeStyle=`rgba(${ORO},.8)`; c.lineWidth=2; c.setLineDash([4,4]); this.ell(p.x,p.y+T*0.3,T*0.55,T*0.22); c.stroke(); c.setLineDash([]); }
      const ini=performance.now();
      this.persona(p,t,{ alfa:p.fantasma?0.45:1, grigio, nome:!grigio, coloreNome:p.coloreNome||(p.alleata?'#f2a7b6':null) });
      this.spesa+=performance.now()-ini;
      if(this.acqCov && !p.fantasma && this.acqCov((p.x/T)|0, ((p.y+T*0.3)/T)|0)>0.4){   // la linea dell'acqua intorno ai piedi
        const a=0.4+0.15*Math.sin(t*3+p.x); c.fillStyle='rgba(40,110,150,.28)'; this.ell(p.x,p.y+T*0.3,T*0.46,T*0.16); c.fill(); c.strokeStyle=`rgba(215,240,252,${a})`; c.lineWidth=1.4; this.ell(p.x,p.y+T*0.3,T*0.46,T*0.16); c.stroke(); }
      if(S.scudi && S.scudi.indexOf(p.id)>=0 && !p.fantasma){ const a=0.35+0.15*Math.sin(t*3); c.strokeStyle=`rgba(120,220,255,${a+0.25})`; c.lineWidth=2; this.ell(p.x,p.y-T*0.45,T*0.62,T*0.85); c.stroke(); c.fillStyle=`rgba(120,220,255,${a*0.25})`; c.fill(); }
    }
    if(io.mostra && !io.fantasma && coperto) this.persona(io,t,{ alfa:0.55, nome:false });   // la propria sagoma trasparente: dietro un pilastro o uno scaffale chi gioca non si perde (solo la sua, gli altri restano nascosti)
    this.scriviNomi(dt);
    // chi è fuori dalla luce o dallo schermo: la stoffa non si simula, ma chi torna a guardare trova il telo giusto
    if(S.scala==null){
      for(const p of S.altri){ const r=TELI[p.id]; if(r && !r.attesa && t-r.tV>TELO_FUORI){ const fa=t-r.tU; r.tU=t; r.l.aggiorna(fa>0.1?0.1:fa, p.x, p.y, p.dir, false, false); } }
      this.spesaM=(this.spesaM||0)+(this.spesa-(this.spesaM||0))*0.08;
      if(this.turno%30===0){ if(this.spesaM>TELO_TETTO && this.piu<3) this.piu++; else if(this.spesaM<TELO_TETTO*0.5 && this.piu>0) this.piu--; }
    }
    // la freccetta d'oro dei miei compiti resta sopra i mobili
    if(S.palazzo) for(const p of POSTAZIONI) if(S.miei.has(p.id)){ const x=centro(p.tx), y=centro(p.ty), b=Math.sin(t*4)*3; c.fillStyle='#e7b75c'; c.beginPath(); c.moveTo(x-6,y-24+b); c.lineTo(x+6,y-24+b); c.lineTo(x,y-16+b); c.closePath(); c.fill(); }
    // particelle
    for(let i=this.parti.length-1;i>=0;i--){
      const q=this.parti[i]; q.t+=dt; if(q.t>=q.vita){ this.parti.splice(i,1); continue; }
      q.x+=q.vx*dt; q.y+=q.vy*dt; q.vx*=0.94; q.vy*=0.94; if(q.tipo==='goccia') q.vy+=220*dt; if(q.tipo==='fumo'||q.tipo==='fiamma') q.vy-=25*dt;
      if(!anima && Math.hypot(q.x-io.x,q.y-io.y)>R) continue;
      const a=1-q.t/q.vita;
      if(q.tipo==='polvere'){ c.fillStyle=`rgba(200,190,170,${0.35*a})`; this.ell(q.x,q.y,q.r*(1+q.t*2),q.r*0.6*(1+q.t*2)); c.fill(); }
      else if(q.tipo==='fumo'){ c.fillStyle=`rgba(170,170,185,${0.45*a})`; this.ell(q.x,q.y,q.r*(1+q.t*3),q.r*(1+q.t*3)); c.fill(); }
      else if(q.tipo==='scintilla'){ c.fillStyle=q.col||`rgba(${ORO},${a})`; c.globalAlpha=a; c.fillRect(q.x-q.r/2,q.y-q.r/2,q.r,q.r); c.globalAlpha=1; }
      else if(q.tipo==='goccia'){ c.fillStyle=`rgba(120,190,255,${0.8*a})`; this.ell(q.x,q.y,q.r*0.6,q.r); c.fill(); }
      else if(q.tipo==='fiamma'){ c.fillStyle=`rgba(255,${120+Math.floor(100*a)},40,${a})`; this.ell(q.x,q.y,q.r,q.r*1.4); c.fill(); }
    }
    for(const e of S.effetti||[]) if(!e.terra && !e.schermo && (e.sempre || visibile(e))) this.effetto(e,t);
    if(S.trappola){ const x=S.trappola[0], y=S.trappola[1]; c.strokeStyle='rgba(203,162,255,.8)'; c.setLineDash([3,4]); c.lineWidth=2; c.beginPath(); c.arc(x,y,0.9*T,0,Math.PI*2); c.stroke(); c.setLineDash([]); c.fillStyle='rgba(203,162,255,.9)'; c.font='700 11px '+FONT; c.textAlign='center'; c.fillText(''+S.trappola[2]+'/'+S.trappola[3], x, y+4); }
    if(S.rianima) this.anello(io.x, io.y-T*0.5, S.rianima, `rgba(${ORO},.95)`);
    if(S.ipno){ c.save(); c.translate(io.x, io.y-T*1.9); c.rotate(t*4); c.strokeStyle='rgba(190,140,255,.9)'; c.lineWidth=2.5; c.beginPath(); for(let a=0;a<Math.PI*5;a+=0.25){ const r=a*1.6; c.lineTo(Math.cos(a)*r, Math.sin(a)*r); } c.stroke(); c.restore(); }
    if(S.freccia) this.freccia(io, S.freccia, t);
    if(S.neb){ c.setTransform(1,0,0,1,0,0); for(let i=0;i<6;i++){ const x=((t*20*(i%2?1:-1)+i*W/3)%(W*1.4))-W*0.2, y=H*(0.15+i*0.14); const g=c.createRadialGradient(x,y,0,x,y,W*0.35); g.addColorStop(0,'rgba(170,175,190,.18)'); g.addColorStop(1,'rgba(170,175,190,0)'); c.fillStyle=g; c.fillRect(0,0,W,H); } c.setTransform(s,0,0,s,-cx*s,-cy*s); }
    if(!anima){
      const o=this.octx, Rf=R*(1+0.015*Math.sin(t*7)+0.01*Math.sin(t*13)), oW=this.ombra.width, oH=this.ombra.height, k=oW/W;
      // il buio: sempre un velo del .8; mentre le luci sono staccate se ne aggiunge un secondo (quasi nero). Dopo la riparazione il secondo velo
      // si apre in un cerchio che parte dal quadro e cresce: la luce arriva stanza per stanza
      const extra = S.buio ? 1-liv : (onda >= 0 ? 1 : 0), spento = !!S.buio && extra > 0.5;
      o.setTransform(1,0,0,1,0,0); o.globalCompositeOperation='source-over'; o.clearRect(0,0,oW,oH);
      if(extra>0){
        o.fillStyle=`rgba(2,3,9,${(0.83*extra).toFixed(3)})`; o.fillRect(0,0,oW,oH);
        if(onda>=0){ o.setTransform(s*k,0,0,s*k,-cx*s*k,-cy*s*k); o.globalCompositeOperation='destination-out';
          const g=o.createRadialGradient(qx,qy,onda*0.6,qx,qy,onda+2.5*T); g.addColorStop(0,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)'); o.fillStyle=g; const q=onda+3*T; o.fillRect(qx-q,qy-q,2*q,2*q); o.setTransform(1,0,0,1,0,0); }
        o.globalCompositeOperation='destination-over';
      }
      o.fillStyle='rgba(4,6,14,.8)'; o.fillRect(0,0,oW,oH); o.globalCompositeOperation='source-over';
      o.setTransform(s*k,0,0,s*k,-cx*s*k,-cy*s*k);
      // la pianta dei muri sta nel buio: oltre la lanterna si capisce dove continua la stanza e dov'è la porta (il varco nella riga). Non mostra nessuno
      if(!spento){ o.strokeStyle='rgba(216,195,160,.3)'; o.lineWidth=1.6*(this.DPR||1)/s; o.lineJoin='round'; o.stroke(this.pianta(M)); }
      o.globalCompositeOperation='destination-out';
      const gr=o.createRadialGradient(io.x,io.y,0,io.x,io.y,Rf); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(0.55,'rgba(0,0,0,.98)'); gr.addColorStop(0.82,'rgba(0,0,0,.55)'); gr.addColorStop(1,'rgba(0,0,0,0)');
      const pts=this.luce(M,io.x,io.y,spento?Rf:Rf*1.45);
      o.beginPath(); o.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) o.lineTo(pts[i][0],pts[i][1]); o.closePath();
      o.fillStyle=gr; o.fill();
      if(!spento){ const al=o.createRadialGradient(io.x,io.y,Rf*0.6,io.x,io.y,Rf*1.45); al.addColorStop(0,'rgba(0,0,0,.3)'); al.addColorStop(1,'rgba(0,0,0,0)'); o.fillStyle=al; o.fill(); }
      o.globalCompositeOperation='source-over';
      c.setTransform(1,0,0,1,0,0); c.imageSmoothingEnabled=true; c.drawImage(this.ombra,0,0,W,H);
      c.setTransform(s,0,0,s,-cx*s,-cy*s);
      // dentro la luce schiarisce senza velare i neri: gli oggetti si staccano dal pavimento
      c.globalCompositeOperation='soft-light';
      const calda=c.createRadialGradient(io.x,io.y,0,io.x,io.y,R*0.85); calda.addColorStop(0,'rgba(255,236,205,.34)'); calda.addColorStop(1,'rgba(255,236,205,0)');
      c.fillStyle=calda; c.fillRect(io.x-R,io.y-R,R*2,R*2); c.globalCompositeOperation='source-over';
      // i miei compiti si vedono anche nel buio; a portata di mano l'anello batte
      if(S.palazzo && !S.interf) for(const p of POSTAZIONI){
        if(!S.miei.has(p.id)) continue;
        const px=centro(p.tx), py=centro(p.ty), d=Math.hypot(px-io.x,py-io.y);
        c.globalAlpha=d<R*0.8?1:0.75; this.postazione(p,true,t); c.globalAlpha=1;
        if(d<T*1.7){ const q=17*(1.06+0.06*Math.sin(t*10.5)); c.strokeStyle=`rgba(${ORO},.95)`; c.lineWidth=2.2; c.beginPath(); c.arc(px,py,q,0,Math.PI*2); c.stroke(); }
      }
      // pulviscolo nella luce
      for(const d of this.polvere){ d.f+=dt*d.v; const ang=d.x*Math.PI*2, rr=d.y*R*0.8, px=io.x+Math.cos(ang+d.f*0.2)*rr, py=io.y+Math.sin(ang+d.f*0.2)*rr - (d.f*6%20); c.fillStyle=`rgba(255,235,190,${0.15+0.15*Math.sin(d.f*2)})`; c.fillRect(px,py,1.6,1.6); }
      if(S.traccia){ const tg=S.altri.find(p=>p.id===S.traccia); if(tg) this.freccia(io, { x:tg.x, y:tg.y, col:'#cba2ff' }, t); }
      if(S.freccia) this.freccia(io, S.freccia, t);   // la freccia resta visibile anche fuori dalla luce
    } else if(S.palazzo && !S.bengala){ c.setTransform(1,0,0,1,0,0); c.fillStyle='rgba(60,80,150,.1)'; c.fillRect(0,0,W,H); }
    // mentre scrivo, il raggio a cui mi sentono (i muri lo fermano; attraverso un muro solo da vicino), sopra il buio
    if(S.parla && !S.parla.anima){ const P=S.parla; c.setTransform(s,0,0,s,-cx*s,-cy*s);
      const pts=this.luce(M,io.x,io.y,P.R); c.beginPath(); pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])); c.closePath();
      c.fillStyle=`rgba(${ORO},.06)`; c.fill(); c.strokeStyle=`rgba(${ORO},.42)`; c.lineWidth=1.5; c.setLineDash([6,6]); c.lineDashOffset=this.ridotto?0:-t*8; c.stroke();
      c.strokeStyle=`rgba(${ORO},.2)`; c.setLineDash([2,6]); c.beginPath(); c.arc(io.x,io.y,P.Rm,0,Math.PI*2); c.stroke(); c.setLineDash([]); c.lineDashOffset=0; }
    if(S.bolle && S.bolle.length){ c.setTransform(s,0,0,s,-cx*s,-cy*s); this.vista={ x0:cx, y0:cy, x1:cx+W/s, y1:cy+H/s }; this.bolle(S); }   // i fumetti della chat di prossimità, sopra il buio
    if(S.urlo) this.freccia(io, S.urlo, t);
    // le scintille del quadro delle luci (buio) e del telegrafo (interferenza): si vedono anche al buio, da chi è nella stanza
    if(S.palazzo){ c.setTransform(s,0,0,s,-cx*s,-cy*s); const vx=cx-60, vy=cy-60, vw=cx+W/s+60, vh=cy+H/s+60;
      if(onda>=0){   // la luce che torna: un anello caldo che parte dal quadro e corre fino ai muri
        const g=c.createRadialGradient(qx,qy,Math.max(0,onda-4*T),qx,qy,onda+0.7*T), a=0.2*(1-S.buioR/LUCI_RITORNO);
        g.addColorStop(0,'rgba(255,205,130,0)'); g.addColorStop(0.82,`rgba(255,205,130,${a.toFixed(3)})`); g.addColorStop(1,'rgba(255,205,130,0)');
        c.globalCompositeOperation='lighter'; c.fillStyle=g; c.fillRect(cx,cy,W/s,H/s); c.globalCompositeOperation='source-over'; }
      if((S.buioE>=0 || (S.buioR>=0 && S.buioR<0.7)) && qx>vx && qx<vw && qy>vy && qy<vh) this.elettrico(c, qx, qy, t, '255,214,120', S.buioE>=0 ? 1 : 1.7-S.buioR*2);
      if(S.interf){ const ex=centro(CONSOLE.tx), ey=centro(CONSOLE.ty); if(ex>vx && ex<vw && ey>vy && ey<vh) this.elettrico(c, ex, ey, t, '130,225,255', 1); } }
    c.setTransform(1,0,0,1,0,0);
    if(S.bengala){ c.fillStyle=`rgba(255,220,180,${0.08+0.04*Math.sin(t*20)})`; c.fillRect(0,0,W,H); }
    if(S.interf && S.palazzo) this.disturbo(c, W, H, t);   // il disturbo vero: neve, righe che tremano
    for(const e of S.effetti||[]) if(e.schermo) this.effettoSchermo(e,t,W,H);
    if(S.cctv){ // l'aspetto delle telecamere: verde scuro, righe, scritta
      c.fillStyle='rgba(40,90,60,.22)'; c.fillRect(0,0,W,H);
      c.fillStyle='rgba(0,0,0,.18)'; for(let y=(t*40)%4;y<H;y+=4) c.fillRect(0,y,W,1.5);
      c.font=`700 ${11*this.DPR}px ${FONT}`; c.textAlign='left'; c.fillStyle='rgba(220,255,230,.9)'; c.fillText(S.cctv, 6*this.DPR, 15*this.DPR);
      if(Math.sin(t*4)>0){ c.fillStyle='rgba(255,70,80,.95)'; this.ell(W-12*this.DPR, 11*this.DPR, 4*this.DPR, 4*this.DPR); c.fill(); }
    }
    // a fotogrammi alterni si prepara un pezzo vicino che manca; nella sala d'attesa, quelli del palazzo intorno alla fontana
    if(S.scala==null){
      this.giro=(this.giro||0)+1;
      // nella sala d'attesa si cominciano a scaricare anche le immagini del palazzo intorno alla fontana (dove si parte)
      if(M!==PALAZZO){ const pi=immPronta(PALAZZO); if(pi){ const fi=Math.floor(FONTANA.x/L), fj=Math.floor(FONTANA.y/L); immChiedi(pi, PALAZZO, fi-1, fj-1, fi+1, fj+1, 0); } }
      if(!nuovi && this.giro%4===0 && !anticipa(M,i0-1,j0-1,i1+1,j1+1,res) && M!==PALAZZO){ const fi=Math.floor(FONTANA.x/L), fj=Math.floor(FONTANA.y/L); anticipa(PALAZZO,fi-1,fj-1,fi+1,fj+1,res); }
    }
  }
  // un pezzo non ancora pronto: i colori di base delle caselle, per un fotogramma o due
  abbozzo(M, i, j, dx, dy, k){
    const c=this.ctx, x0=i*PEZZO, y0=j*PEZZO, q=T*k;
    for(let ty=y0;ty<Math.min(M.GH,y0+PEZZO);ty++) for(let tx=x0;tx<Math.min(M.GW,x0+PEZZO);tx++){
      const n=ty*M.GW+tx, p=M.PAV[n];
      c.fillStyle = p>=0 ? M.stanze[p].c1 : p===-1 ? CORR1 : M.ACQUA[n] ? '#0f2738' : M.BORDO[n] ? '#1d1824' : '#090b16';
      c.fillRect(Math.floor(dx+(tx-x0)*q), Math.floor(dy+(ty-y0)*q), Math.ceil(q)+1, Math.ceil(q)+1);
    }
  }
  anello(x,y,f,col){ const c=this.ctx; c.lineWidth=4; c.strokeStyle='rgba(0,0,0,.4)'; c.beginPath(); c.arc(x,y,16,0,Math.PI*2); c.stroke(); c.strokeStyle=col; c.beginPath(); c.arc(x,y,16,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,Math.min(1,f))); c.stroke(); }
  // un effetto: { k, x, y, t0, dur, ... }; e.f = 0..1
  effetto(e,t){
    const c=this.ctx, f=Math.min(1,(t-e.t0)/e.dur), a=1-f;
    switch(e.k){
      case 'spegni': { c.fillStyle=`rgba(255,200,120,${0.5*a})`; this.ell(e.x,e.y-T*0.4,T*(0.5+f*1.4),T*(0.5+f*1.4)); c.fill(); break; }
      case 'sparo': { c.strokeStyle=`rgba(255,240,180,${a})`; c.lineWidth=3*a+1; c.beginPath(); c.moveTo(e.x,e.y-T*0.5); c.lineTo(e.x2,e.y2-T*0.5); c.stroke(); break; }
      case 'scudo': { c.strokeStyle=`rgba(120,220,255,${a})`; c.lineWidth=3; this.ell(e.x,e.y-T*0.4,T*(0.7+f*0.4),T*(0.9+f*0.4)); c.stroke(); break; }
      case 'lente': { c.strokeStyle=`rgba(${ORO},${a})`; c.lineWidth=3; c.beginPath(); c.arc(e.x,e.y-T*1.1,9+f*4,0,Math.PI*2); c.stroke(); c.beginPath(); c.moveTo(e.x+7,e.y-T*1.1+7); c.lineTo(e.x+15,e.y-T*1.1+15); c.stroke(); break; }
      case 'fiuto': case 'ipnosi': case 'trasforma': case 'botola': case 'sparisce': case 'mangia': case 'gatto': case 'rianima': case 'campana': case 'scudoRotto': case 'telecamera': case 'trasporto': {
        const col = { fiuto:'203,162,255', ipnosi:'190,140,255', trasforma:'208,80,106', botola:'120,100,140', sparisce:'150,150,160', mangia:'150,120,90', gatto:'255,200,120', rianima:ORO, campana:ORO, scudoRotto:'120,220,255', telecamera:'143,182,216', trasporto:'160,230,255' }[e.k];
        c.strokeStyle=`rgba(${col},${a})`; c.lineWidth=3; c.beginPath(); c.arc(e.x,e.y-T*0.4,T*(0.3+f*1.6),0,Math.PI*2); c.stroke();
        if(e.k==='rianima'){ c.fillStyle=`rgba(${ORO},${0.4*a})`; c.fillRect(e.x-6,e.y-T*4*f,12,T*4*f); }
        break; }
      case 'compito': {
        if(e.v==='luce'){ const g=c.createRadialGradient(e.x,e.y+T*2,0,e.x,e.y+T*2,T*6); g.addColorStop(0,`rgba(255,230,160,${0.5*a})`); g.addColorStop(1,'rgba(255,230,160,0)'); c.fillStyle=g; c.fillRect(e.x-T*6,e.y-T*4,T*12,T*12);
          for(let i=0;i<10;i++){ const ang=i/10*Math.PI*2+t; c.strokeStyle=`rgba(255,230,160,${0.4*a})`; c.lineWidth=2; c.beginPath(); c.moveTo(e.x,e.y-T*2); c.lineTo(e.x+Math.cos(ang)*T*3,e.y-T*2+Math.sin(ang)*T*3); c.stroke(); } }
        else if(e.v==='ingranaggio'){ c.save(); c.translate(e.x,e.y-T*2.1); c.rotate(t*12); c.strokeStyle=`rgba(${ORO},${a})`; c.lineWidth=3; for(let i=0;i<8;i++){ c.rotate(Math.PI/4); c.beginPath(); c.moveTo(0,10); c.lineTo(0,26); c.stroke(); } c.restore(); }
        else if(e.v==='fuoco'){ const gx=e.x+T*0.5, gy=e.y-T*1.6, g=c.createRadialGradient(gx,gy,0,gx,gy,T*3); g.addColorStop(0,`rgba(255,140,40,${0.6*a})`); g.addColorStop(1,'rgba(255,140,40,0)'); c.fillStyle=g; c.fillRect(gx-T*3,gy-T*3,T*6,T*6); }
        c.fillStyle=`rgba(${ORO},${a})`; c.font='700 16px '+FONT; c.textAlign='center'; c.fillText('✓', e.x, e.y-T*0.9-f*14);
        break; }
    }
  }
  effettoSchermo(e,t,W,H){
    const c=this.ctx, f=Math.min(1,(t-e.t0)/e.dur), a=1-f;
    if(e.k==='bengala'||e.k==='luci'){ c.fillStyle=`rgba(255,240,210,${(e.k==='luci'?0.08:0.7)*a*a})`; c.fillRect(0,0,W,H); }
    else if(e.k==='spegni'){ c.fillStyle=`rgba(${ROSSO},${0.35*a})`; c.fillRect(0,0,W,H); }
  }
  // i bordi fra pavimento e muro, una volta sola per mappa: righe unite, così il disegno a ogni fotogramma è una riga sola
  pianta(M){
    if(M.pianta) return M.pianta;
    const P=new Path2D(), { GW, GH, MURO }=M, mu=(x,y)=>x<0||y<0||x>=GW||y>=GH||MURO[y*GW+x]===1;
    for(let y=0;y<=GH;y++){ let x0=-1; for(let x=0;x<=GW;x++){ const b=x<GW && mu(x,y-1)!==mu(x,y); if(b&&x0<0) x0=x; if(!b&&x0>=0){ P.moveTo(x0*T,y*T); P.lineTo(x*T,y*T); x0=-1; } } }
    for(let x=0;x<=GW;x++){ let y0=-1; for(let y=0;y<=GH;y++){ const b=y<GH && mu(x-1,y)!==mu(x,y); if(b&&y0<0) y0=y; if(!b&&y0>=0){ P.moveTo(x*T,y0*T); P.lineTo(x*T,y*T); y0=-1; } } }
    return M.pianta=P;
  }
  luce(M,ox,oy,R){
    const n=180, pts=new Array(n), passo=T*0.2, G=M.GW, A=M.GH, MU=M.MURO;
    if(!this.luceD){ this.luceD=new Float32Array(n); this.luceU=new Uint8Array(n); this.luceC=new Float32Array(n); this.luceS=new Float32Array(n); for(let i=0;i<n;i++){ this.luceC[i]=Math.cos(i/n*Math.PI*2); this.luceS[i]=Math.sin(i/n*Math.PI*2); } }
    const ds=this.luceD, ur=this.luceU, CO=this.luceC, SE=this.luceS;
    for(let i=0;i<n;i++){
      const dx=CO[i], dy=SE[i]; let d=0, urto=0;
      while(d<R){ d+=passo; const x=ox+dx*d, y=oy+dy*d; if(x<0||y<0){ urto=1; break; } const tx=x/T|0, ty=y/T|0; if(tx>=G||ty>=A||MU[ty*G+tx]){ urto=1; break; } }
      if(urto){
        // il punto esatto dove il raggio tocca il muro: così il bordo della luce segue il muro e non fa scalini
        let a0=d-passo, b0=d; for(let k=0;k<2;k++){ const m=(a0+b0)/2, x=ox+dx*m, y=oy+dy*m, tx=x/T|0, ty=y/T|0; if(x<0||y<0||tx>=G||ty>=A||MU[ty*G+tx]) b0=m; else a0=m; } d=b0;
        // contro un muro la luce entra un po'; verso nord sale sulla faccia alta del muro (se dietro c'è altro muro)
        let ext=T*0.6;
        if(dy<-0.2){ const tx=(ox+dx*d)/T|0, ty=((oy+dy*d)/T|0)-1; if(ty>=0 && tx>=0 && tx<G && MU[ty*G+tx]) ext+=T*0.9*(-dy); }
        d=Math.min(R,d+ext);
      }
      ds[i]=d; ur[i]=urto;
    }
    // lungo uno stesso muro due raggi vicini non fanno dente: si lisciano (mai sopra uno spigolo vero, dove la distanza salta)
    for(let i=0;i<n;i++){
      const p=i?i-1:n-1, q=i<n-1?i+1:0; let d=ds[i];
      if(ur[i] && ur[p] && ur[q] && Math.abs(ds[p]-d)<T*0.8 && Math.abs(ds[q]-d)<T*0.8) d=(ds[p]+2*d+ds[q])/4;
      pts[i]=[ox+CO[i]*d, oy+SE[i]*d];
    }
    return pts;
  }
  // le righe di un fumetto: si calcolano UNA volta per messaggio (poi stanno nel messaggio), non a ogni fotogramma.
  // Va a capo tra le parole; una parola più larga del fumetto si spezza.
  righeDi(b){
    const c=this.ctx, MAXW=130, righe=[]; let r='';
    c.font='600 11px '+FONT;
    const spezza=w=>{ const out=[]; let x=''; for(const ch of w){ if(x && c.measureText(x+ch).width>MAXW){ out.push(x); x=ch; } else x+=ch; } if(x) out.push(x); return out; };
    for(const w0 of b.testo.split(' ')){
      for(const w of (c.measureText(w0).width>MAXW ? spezza(w0) : [w0])){
        if(w!==w0 && r){ righe.push(r); r=''; }
        const prova=r?r+' '+w:w;
        if(c.measureText(prova).width>MAXW && r){ righe.push(r); r=w; } else r=prova;
      }
    }
    if(r) righe.push(r);
    b.righe=righe; b.lw=Math.max(...righe.map(x=>c.measureText(x).width))+16; b.lh=righe.length*14+10;
  }
  // i fumetti sopra chi parla (S.bolle: i messaggi vivi, S.ora: adesso).
  // Più messaggi della stessa persona si impilano (il più nuovo in basso, vicino alla testa e scivola su quando ne arriva un altro);
  // due persone vicine non si coprono: la pila si sposta di lato (se la testa resta sotto il fumetto) o più in alto.
  // Ogni messaggio svanisce nell'ultimo mezzo secondo. «w»: attutito (dietro un muro) · «a»: lo dice un'anima.
  bolle(S){
    const c=this.ctx, ora=S.ora||performance.now(), V=this.vista, dt=Math.min(0.1,S.dt||0.016), k=this.ridotto?1:1-Math.exp(-dt*16), GAP=3;
    const gente={}; for(const p of [S.io].concat(S.altri||[])) if(p) gente[p.id]=p;
    const pile={}; const lista=[];
    for(const b of S.bolle){
      const p=gente[b.id]; if(!p || p.y<V.y0-20 || p.y>V.y1+60 || p.x<V.x0-120 || p.x>V.x1+120) continue;
      if(!b.righe) this.righeDi(b);
      let q=pile[b.id]; if(!q){ q=pile[b.id]={ p, l:[], w:0, h:0 }; lista.push(q); }
      q.l.push(b); q.w=Math.max(q.w,b.lw);
    }
    if(!lista.length) return;
    // posizione di ogni messaggio dentro la pila (relativa alla base: negativa = in su) e altezza totale
    for(const q of lista){
      let y=0;
      for(let i=q.l.length-1;i>=0;i--){ const b=q.l[i]; y-=b.lh; const tgt=y; y-=GAP;
        if(b.py==null) b.py=tgt; else b.py+=(tgt-b.py)*k; }
      q.h=-y-GAP;
    }
    // le persone più in basso sullo schermo (più avanti) tengono il loro posto, le altre si spostano
    lista.sort((a,b)=>b.p.y-a.p.y);
    const messi=[];
    for(const q of lista){
      const f=this.fum[q.p.id]||(this.fum[q.p.id]={ dx:0, dy:0, t:0 }); f.t=ora;
      const ax=q.p.x, ab=q.p.y-T*1.75; let dx=0, dy=0;
      for(let it=0;it<8;it++){
        const r={ l:ax-q.w/2+dx, r:ax+q.w/2+dx, t:ab-q.h+dy, b:ab+6+dy };
        const urto=messi.find(m=>r.l<m.r+2 && r.r>m.l-2 && r.t<m.b+2 && r.b>m.t-2); if(!urto) break;
        const sx=urto.l-4-r.r, dd=urto.r+4-r.l, sh=Math.abs(sx)<Math.abs(dd)?sx:dd;
        if(Math.abs(dx+sh)<=q.w/2-12) dx+=sh; else dy-=(r.b-urto.t)+GAP;
      }
      f.dx+=(dx-f.dx)*k; f.dy+=(dy-f.dy)*k;
      messi.push({ l:ax-q.w/2+dx, r:ax+q.w/2+dx, t:ab-q.h+dy, b:ab+6+dy });
      q.fx=f.dx; q.fy=f.dy; q.ab=ab;
    }
    for(const id in this.fum) if(ora-this.fum[id].t>3000) delete this.fum[id];   // (chi non parla più perde il suo spostamento)
    c.font='600 11px '+FONT; c.textAlign='center'; c.textBaseline='middle';
    for(const q of lista){
      const x0=q.p.x+q.fx, n=q.l.length;
      q.l.forEach((b,i)=>{
        const ultimo=i===n-1, e=Math.min(1,(ora-b.t0)/160), ease=this.ridotto?1:1-Math.pow(1-e,3);
        const y=q.ab+q.fy+b.py+(1-ease)*6, lw=b.lw, lh=b.lh;
        c.globalAlpha=Math.min(1,(b.fine-ora)/500)*(this.ridotto?1:ease)*(b.w?0.72:1);
        c.fillStyle=b.a?'rgba(196,212,255,.9)':b.w?'rgba(214,216,226,.92)':'rgba(246,240,226,.96)';
        // il filo del fumetto è del colore di chi parla (nella nebbia no: non si vede di chi è). Il testo resta scuro su carta chiara
        const tl=!b.a && !S.neb && q.p.lenz ? LENZUOLI[q.p.lenz.c] : null;
        c.strokeStyle=tl ? tl.b : b.a?'rgba(60,80,150,.55)':'rgba(20,16,10,.35)'; c.lineWidth=tl?1.6:1; c.setLineDash(b.w?[3,3]:[]);
        c.beginPath(); c.roundRect ? c.roundRect(x0-lw/2,y,lw,lh,8) : c.rect(x0-lw/2,y,lw,lh);
        if(ultimo){   // la codina verso chi parla (se la pila è stata spostata in su, un filo dritto fino alla testa)
          const tx=Math.max(x0-lw/2+10,Math.min(x0+lw/2-10,q.p.x));
          if(q.fy>-2){ c.moveTo(tx-5,y+lh); c.lineTo(Math.max(x0-lw/2+8,Math.min(x0+lw/2-8,q.p.x)),y+lh+6); c.lineTo(tx+5,y+lh); }
        }
        c.fill(); c.stroke(); c.setLineDash([]);
        if(ultimo && q.fy<=-2){ c.strokeStyle=b.a?'rgba(150,170,230,.6)':'rgba(246,240,226,.55)'; c.beginPath(); c.moveTo(q.p.x,y+lh); c.lineTo(q.p.x,q.ab-2); c.stroke(); }
        c.fillStyle=b.a?'#1b2440':b.w?'#3b3f50':'#22180c'; b.righe.forEach((rr,j)=>c.fillText(rr, x0, y+12+j*14));
      });
    }
    c.globalAlpha=1; c.textBaseline='alphabetic';
  }
  freccia(io, f, t){
    const c=this.ctx, dx=f.x-io.x, dy=f.y-io.y, d=Math.hypot(dx,dy); if(d<3*T) return;
    const a=Math.atan2(dy,dx), su=Math.max(0,-dy/d), r=(2.1+su*su*1.15)*T+Math.sin(t*5)*3, x=io.x+Math.cos(a)*r, y=io.y+Math.sin(a)*r;   // (verso l'alto gira più largo: non copre il mio nome)
    let tx=x, ty=y, al=1, ghost=0;
    if(f.glitch && !this.ridotto){   // con l'interferenza la freccia trema, sparisce a tratti e si sdoppia (cieleste e rosa)
      const k=Math.floor(t*15), h=n=>{ const v=Math.sin(k*12.9898+n*78.233)*43758.5453; return v-Math.floor(v); };
      tx+=(h(1)-0.5)*9; ty+=(h(2)-0.5)*9; al=h(3)<0.22?0.12:(h(4)<0.3?0.55:1); ghost=h(5)<0.5?1:0;
    }
    const pezzo=(px,py,col,alfa)=>{ c.save(); c.globalAlpha=alfa; c.translate(px,py); c.rotate(a); c.fillStyle=col; c.strokeStyle='rgba(9,11,22,.8)'; c.lineWidth=3; c.lineJoin='round';
      c.beginPath(); c.moveTo(15,0); c.lineTo(-9,-7); c.lineTo(-4,0); c.lineTo(-9,7); c.closePath(); c.stroke(); c.fill(); c.restore(); };
    if(ghost){ pezzo(tx-5,ty,'#6ef0ff',al*0.55); pezzo(tx+5,ty,'#ff5a8c',al*0.5); }
    pezzo(tx,ty,f.col,al);
  }
  postazione(p,attiva,t){
    const c=this.ctx, x=centro(p.tx), y=centro(p.ty), tipo=p.tipo||'compito';
    if(tipo==='campana'){
      const sw=Math.sin(t*2)*0.08;
      c.save(); c.translate(x,y-12); c.rotate(sw); c.translate(-x,-(y-12));
      c.fillStyle='#3a3530'; c.fillRect(x-12,y+8,24,5);
      c.fillStyle='#d9a94a'; c.beginPath(); c.moveTo(x-11,y+8); c.quadraticCurveTo(x-11,y-12,x,y-12); c.quadraticCurveTo(x+11,y-12,x+11,y+8); c.closePath(); c.fill();
      c.fillStyle='#7a5a20'; this.ell(x,y+10,3,3); c.fill(); c.restore();
      return;
    }
    if(tipo==='chiusa'){
      c.strokeStyle = attiva ? `rgba(90,176,255,${0.7+0.3*Math.sin(t*6)})` : '#7a6c4f'; c.lineWidth=4; c.beginPath(); c.arc(x,y,10,0,Math.PI*2); c.stroke();
      c.save(); c.translate(x,y); c.rotate(attiva ? t*3 : 0); c.beginPath(); for(let k=0;k<3;k++){ const a=k*Math.PI/3, qx=Math.cos(a)*10, qy=Math.sin(a)*10; c.moveTo(-qx,-qy); c.lineTo(qx,qy); } c.stroke(); c.restore();   // un volano a sei raggi: la botola è la croce
      if(attiva){ const g=c.createRadialGradient(x,y,0,x,y,44); g.addColorStop(0,'rgba(90,176,255,.4)'); g.addColorStop(1,'rgba(90,176,255,0)'); c.fillStyle=g; c.fillRect(x-44,y-44,88,88); }
      return;
    }
    if(tipo==='quadro'){
      c.fillStyle='#2b2732'; c.fillRect(x-11,y-13,22,26);
      c.fillStyle = attiva ? `rgba(${ROSSO},${0.6+Math.sin(t*6)*0.3})` : '#7fb68f'; c.fillRect(x-6,y-8,4,8); c.fillRect(x+2,y-8,4,8);
      if(attiva){ const g=c.createRadialGradient(x,y,0,x,y,46); g.addColorStop(0,`rgba(${ROSSO},.45)`); g.addColorStop(1,`rgba(${ROSSO},0)`); c.fillStyle=g; c.fillRect(x-46,y-46,92,92);
        if(Math.random()<0.15) this.sparpaglia('scintilla', x, y-6, 3, { v:50, vita:0.4, r:2.5, col:'rgba(255,220,120,1)' }); }
      return;
    }
    if(attiva){ const g=c.createRadialGradient(x,y,0,x,y,32); g.addColorStop(0,`rgba(${ORO},${0.32+Math.sin(t*4)*0.12})`); g.addColorStop(1,`rgba(${ORO},0)`); c.fillStyle=g; c.fillRect(x-32,y-32,64,64); }
    c.fillStyle='#2a2833'; c.strokeStyle = attiva ? '#e7b75c' : 'rgba(241,232,214,.18)'; c.lineWidth=2;
    c.beginPath(); if(c.roundRect) c.roundRect(x-11,y-11,22,22,5); else c.rect(x-11,y-11,22,22); c.fill(); c.stroke();
    c.fillStyle = attiva ? '#f6d999' : 'rgba(241,232,214,.25)'; this.ell(x,y,4,4); c.fill();
    if(p.visibile){ c.strokeStyle='rgba(241,232,214,.35)'; c.lineWidth=1.2; c.beginPath(); c.arc(x,y,15,0,Math.PI*2); c.stroke(); }
  }
  // p: { x, y, dir, muove, fantasma, nome, colore, img, imgS (di spalle), seme }
  // il telo di una persona, simulato fino a t. Un telo nuovo nella saletta aspetta un attimo sopra l'omino; fuori dalla saletta è già addosso.
  // Cambiare colore (o travestirsi) è un telo nuovo: stessa stoffa, stessa forma di chi ha quel colore, così il travestimento non si tradisce
  teloDi(p, t){
    const d=p.lenz||TELO_BASE, m=d.m||null, salt=this.saletta; let r=TELI[p.id];
    if(!r || r.c!==d.c || r.m!==m){
      r=TELI[p.id]={ l:new Lenzuolo(d,{ seme:d.c }), c:d.c, m, t0:t, tU:t, tV:t, attesa:!!salt && !r, ricade:!!salt && !!r, num:NUM++, sp:r?r.sp:null };
      if(r.sp) r.sp.t=-9;
    }
    const l=r.l; r.tV=t;
    if(r.attesa){ if(!salt) r.attesa=false; else if(t-r.t0<TELO_ATTESA+(r.num%5)*0.1) return r; else { r.attesa=false; r.ricade=true; } }   // (uno dopo l'altro: si capisce quale telo va su quale testa)
    if(r.ricade){ r.ricade=false; r.tU=t; l.aggiorna(0, p.x, p.y, p.dir, false, true); if(salt) l.cadi(); }
    const fa=t-r.tU;
    if(fa>0 && this.tocca(r,p,fa)){
      r.tU=t;
      if(!!p.fantasma!==(l.stato==='fantasma')) l.fantasma(!!p.fantasma);
      // uno strattone che camminando non si può fare (botola, Trasportatore, rete che recupera in un colpo) è un salto: la stoffa non se ne accorge.
      // E chi è fermo non si gira: la stoffa non deve attorcigliarsi attorno a chi cambia direzione sul posto
      if(Math.hypot(p.x-l.wx, p.y-l.wy)>TELO_STRAPPO*fa+6){ l.wx=p.x; l.wy=p.y; }
      l.aggiorna(fa>0.1?0.1:fa, p.x, p.y, p.muove?p.dir:null, !!p.muove, true);
    }
    const g=this.sguardo;
    if(g && g!==p && Math.abs(g.x-p.x)<5*T && Math.abs(g.y-p.y)<4*T) l.guarda(g.x, g.y); else if(l.gOn) l.guarda();
    return r;
  }
  teloStato(id){ const r=TELI[id]; return r ? (r.attesa ? 'attesa' : r.l.stato) : null; }   // (per le prove)
  // tocca a questa persona? Il mio telo sempre; gli altri a turno: chi guarda la scena con dieci persone li vede muovere lo stesso,
  // e nessun fotogramma paga per tutti insieme. Gli schermi delle telecamere vanno a 15 al secondo
  tocca(r, p, fa){ return p===this.mio || r.l.stato==='cade' || (this.gruppi ? this.gruppi===1 || (r.num+this.turno)%this.gruppi===0 : fa>=0.066); }
  persona(p, t, o){
    const c=this.ctx, x=p.x, y=p.y, r=this.teloDi(p,t), l=r.l, sotto=r.attesa||l.copre()<1;
    let testa=y+TELO_PIEDI-l.cima()*TELO_K;
    if(sotto) testa=this.omino(p, t, o, r.attesa, r.attesa?0:l.cede());
    if(!r.attesa){
      if(o.alfa<0.9 && !p.fantasma || l.stato==='cade' || (p===this.mio && !l.dorme)) l.disegna(c,{ x, y:y+TELO_PIEDI, alfa:p.fantasma?1:o.alfa, grigio:o.grigio, lanterna:!o.grigio, ombra:o.alfa>=0.9, t, scala:TELO_K });
      else this.stampa(r, x, y+TELO_PIEDI, t, !!o.grigio);
    }
    if(o.nome) this.nomeDopo(p.id, p.nome, o.coloreNome||'#f1e8d6', x, testa-5, o.alfa);
    c.globalAlpha=1;
  }
  // i nomi si scrivono dopo tutta la scena: lampadari e mobili non li coprono mai. Due etichette che si toccano non si accavallano: quella dietro sale, piano, così non saltella
  nomeDopo(id, nome, col, x, y, alfa){ const n=this.nN|0; if(n>=NOMI_MAX) return; const q=NOMI_C[n]; q.id=id; q.nome=nome; q.col=col; q.x=x; q.y=y; q.a=alfa; q.w=this.nomeLargo(nome,col); this.nN=n+1; }
  scriviNomi(dt){
    const n=this.nN|0; this.nN=0; if(!n) return;
    for(let i=1;i<n;i++){ const q=NOMI_C[i]; let j=i-1; while(j>=0 && NOMI_C[j].y<q.y){ NOMI_C[j+1]=NOMI_C[j]; j--; } NOMI_C[j+1]=q; }      // dal più vicino al più lontano
    for(let i=0;i<n;i++){
      const q=NOMI_C[i]; let y=q.y;
      for(let g=0;g<5;g++){ let urta=false; for(let j=0;j<i;j++){ const o=NOMI_C[j]; if(Math.abs(o.x-q.x)<(o.w+q.w)/2-5 && Math.abs(o.yF-y)<13){ y=o.yF-13; urta=true; } } if(!urta) break; }
      q.yF=y;
      const su=(NOMI_SU[q.id]||0)+(q.y-y-(NOMI_SU[q.id]||0))*Math.min(1,dt*16); NOMI_SU[q.id]=su;
      this.scriviNome(q.nome, q.col, q.x, q.y-su, q.a);
    }
    this.ctx.globalAlpha=1;
  }
  // una tavoletta sulla scena, sui pixel giusti: copiata uno a uno resta nitida come se fosse disegnata lì
  copia(sp, wx, wy, w, h){
    const c=this.ctx, s=this.s, q=sp.res;
    if(Math.abs(s-q)<0.001) c.drawImage(sp.cv, Math.round((wx-this.cx)*s)/s+this.cx, Math.round((wy-this.cy)*s)/s+this.cy, sp.cv.width/q, sp.cv.height/q);
    else c.drawImage(sp.cv, wx, wy, w, h);
  }
  // il telo degli altri: si ristampa quando tocca, si copia sempre
  stampa(r, x, y, t, grigio){
    let sp=r.sp;
    if(!sp || sp.res!==RES) sp=r.sp=tavoletta(STAMPA_W, STAMPA_H);
    if((r.tU>sp.t && (!r.l.dorme || t-sp.t>=0.1)) || sp.g!==grigio){   // (chi dorme respira soltanto: dieci pose al secondo bastano)
      const q=sp.c; q.setTransform(1,0,0,1,0,0); q.clearRect(0,0,sp.cv.width,sp.cv.height); q.setTransform(sp.res,0,0,sp.res,0,0);
      r.l.disegna(q,{ x:STAMPA_X, y:STAMPA_Y, grigio, lanterna:!grigio, t, scala:TELO_K });
      sp.t=t; sp.g=grigio;
    }
    this.ctx.globalAlpha=1; this.copia(sp, x-STAMPA_X, y-STAMPA_Y, STAMPA_W, STAMPA_H);
  }
  // il nome sopra la testa: scrivere con il contorno è la cosa più lenta del fotogramma, e il nome non cambia mai
  nomeTav(nome, col){
    const k=RES+'|'+col+'|'+nome; let n=NOMI[k];
    if(!n){
      if(nNomi>48){ NOMI={}; nNomi=0; }
      const m=this.ctx; m.save(); m.font='600 11px '+FONT; const w=Math.ceil(m.measureText(nome).width)+10; m.restore();
      n=NOMI[k]=tavoletta(w, 18); n.w=w; nNomi++;
      const q=n.c; q.setTransform(n.res,0,0,n.res,0,0); q.font='600 11px '+FONT; q.textAlign='center'; q.lineJoin='round';
      q.lineWidth=3; q.strokeStyle='rgba(9,11,22,.85)'; q.strokeText(nome,w/2,13); q.fillStyle=col; q.fillText(nome,w/2,13);
    }
    return n;
  }
  nomeLargo(nome, col){ return this.nomeTav(nome,col).w; }
  scriviNome(nome, col, x, y, alfa){ const n=this.nomeTav(nome,col); this.ctx.globalAlpha=alfa; this.copia(n, x-n.w/2, y-13, n.w, 18); }
  // chi sta sotto il telo: si vede nella saletta, per un attimo, finché la stoffa non lo copre. All'impatto la testa cede. Torna dove sta la testa
  omino(p, t, o, conLanterna, cede){
    const c=this.ctx, ph=t*10+(p.seme||0), bob=p.muove?Math.abs(Math.sin(ph))*3:Math.sin(t*2+(p.seme||0))*0.6, x=p.x, y=p.y+cede;
    const incl = p.muove ? Math.sin(ph)*0.07 : 0, sq = p.muove ? 1+Math.abs(Math.cos(ph))*0.04 : 1+Math.sin(t*2+(p.seme||0))*0.015;
    c.globalAlpha=o.alfa;
    c.fillStyle='rgba(0,0,0,.35)'; this.ell(x,p.y+T*0.36,T*0.38*(1-bob*0.03),T*0.15); c.fill();
    const img = o.grigio ? null : (Math.sin(p.dir||0)<-0.6 && p.imgS && p.imgS.complete && p.imgS.naturalWidth ? p.imgS : (p.img && p.img.complete && p.img.naturalWidth ? p.img : null));
    let testa;
    c.save(); c.translate(x, y+T*0.38-bob); c.rotate(incl); c.scale(1/sq, sq);
    if(img){
      const H=T*1.6, W=H*img.naturalWidth/img.naturalHeight;
      if(Math.cos(p.dir||0)<-0.3) c.scale(-1,1);
      c.drawImage(img,-W/2,-H,W,H);
      testa = y+T*0.38-bob-H;
    } else {
      // la figura di riserva: mantello, cappuccio e maschera, con le gambe che camminano
      const col = o.grigio ? '#8b8f99' : (p.colore||'#999'), d=p.dir||0, gamba = p.muove ? Math.sin(ph)*4 : 0;
      c.fillStyle='#1e1a26'; c.fillRect(-7+gamba*0.5,-6,5,7); c.fillRect(2-gamba*0.5,-6,5,7);
      c.fillStyle=col; c.beginPath(); c.moveTo(-12,-4); c.quadraticCurveTo(-14,-26,0,-34); c.quadraticCurveTo(14,-26,12,-4); c.closePath(); c.fill();
      c.fillStyle='rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(0,-34); c.quadraticCurveTo(14,-26,12,-4); c.lineTo(4,-4); c.quadraticCurveTo(8,-24,0,-34); c.fill();
      c.fillStyle=col; this.ell(0,-36,9,9); c.fill();
      if(!o.grigio && Math.sin(d)>-0.6){ c.fillStyle='#f3ead8'; this.ell(Math.cos(d)*2,-36,6.5,5); c.fill(); c.fillStyle='#1a1622'; this.ell(Math.cos(d)*2-2.6,-36.5,1.6,1.2); c.fill(); this.ell(Math.cos(d)*2+2.6,-36.5,1.6,1.2); c.fill(); }
      testa = y+T*0.38-bob-46;
    }
    c.restore();
    if(conLanterna && !p.fantasma && !o.grigio){   // (dove la terrà poi il telo: quando la stoffa arriva la lanterna non salta)
      const sw=Math.sin(ph*0.5)*(p.muove?3:1), lx=x+T*0.7+sw, ly=y-bob;
      const g=c.createRadialGradient(lx,ly,0,lx,ly,18); g.addColorStop(0,'rgba(246,217,153,.55)'); g.addColorStop(1,'rgba(246,217,153,0)');
      c.fillStyle=g; this.ell(lx,ly,18,18); c.fill();
      c.strokeStyle='#3a3020'; c.lineWidth=1.2; c.beginPath(); c.moveTo(lx,ly-5); c.lineTo(lx-sw*0.4,ly-10); c.stroke();
      c.fillStyle='#3a3020'; c.fillRect(lx-3.5,ly-5,7,10); c.fillStyle=`rgba(246,217,153,${0.85+0.15*Math.sin(t*13+(p.seme||0))})`; c.fillRect(lx-2,ly-3.5,4,7);
    }
    return testa;
  }
  // il corpo: il telo afflosciato del suo colore, con la lanterna spenta accanto. Se chi cade è sotto gli occhi il telo si affloscia davvero;
  // se no (è già a terra, o si guarda da un'altra parte) è il mucchio finito. vis: lo si vede adesso
  corpo(k,t,vis,neb,M){
    const c=this.ctx, d=k.lenz||TELO_BASE; let r=STESI[k.id];
    if(!r){
      const v=TELI[k.id], s=corpoStretto(M,k.x,k.y);
      if(v && vis && !v.attesa && v.c===d.c && v.l.stato==='su' && t-v.tV<=TELO_FUORI){ r={ l:v.l, tU:v.tU, sx:v.l.wx-k.x, sy:v.l.wy-k.y }; delete TELI[k.id]; r.l.spegni(s); }      // (se il corpo finisce un po' più in là del muro, il telo ci scivola mentre crolla)
      else { r={ l:new Lenzuolo(d,{ seme:d.c }), tU:t, sx:0, sy:0 }; r.l.aggiorna(0, k.x, k.y, null, false, true); r.l.spegni(s); r.l.mucchio(); }
      STESI[k.id]=r;
    }
    const l=r.l, fa=t-r.tU, x=k.x+r.sx, y=k.y+r.sy;
    if(fa>0){ r.tU=t; l.aggiorna(fa>0.1?0.1:fa, x, y, null, false, vis); const q=Math.exp(-fa*8); r.sx*=q; r.sy*=q; if(Math.abs(r.sx)+Math.abs(r.sy)<0.4) r.sx=r.sy=0; }
    if(!vis) return;
    if(l.dorme){   // fermo a terra non cambia più: una stampa sola
      const g=!!neb; let sp=r.sp;
      if(!sp || sp.res!==RES) sp=r.sp=tavoletta(STESO_W, STESO_H);
      if(sp.t<0 || sp.g!==g){ const q=sp.c; q.setTransform(1,0,0,1,0,0); q.clearRect(0,0,sp.cv.width,sp.cv.height); q.setTransform(sp.res,0,0,sp.res,0,0); l.disegna(q,{ x:STESO_X, y:STESO_Y, grigio:g, t, scala:TELO_K, fine:true }); sp.t=t; sp.g=g; }
      c.globalAlpha=1; this.copia(sp, x-STESO_X, y+TELO_PIEDI-STESO_Y, STESO_W, STESO_H);
    } else l.disegna(c,{ x, y:y+TELO_PIEDI, grigio:!!neb, t, scala:TELO_K, fine:true });
    // il filo di fumo della lanterna appena spenta
    const fx=x+l.lfx*TELO_K, fy=y+TELO_PIEDI+l.lfy*0.46*TELO_K-T*0.2;
    for(let i=0;i<2;i++){ const ph=((t*0.6)+i*0.5)%1; c.strokeStyle=`rgba(200,200,210,${0.35*(1-ph)})`; c.lineWidth=1.5; c.beginPath(); const yy=fy-4-ph*24; c.moveTo(fx,yy+6); c.quadraticCurveTo(fx+5+Math.sin(t*2+i)*3,yy,fx,yy-6); c.stroke(); }
    c.globalAlpha=1;
  }
}

// la mappa piccola (tasto «Mappa»)
function disegnaMappa(cv, M, segni, maxW, maxH, sopra){
  const sc=Math.min(maxW/(M.GW*T), maxH/(M.GH*T)), w=M.GW*T*sc, h=M.GH*T*sc, dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); cv.style.width=w+'px'; cv.style.height=h+'px';
  const m=cv.getContext('2d'); m.setTransform(dpr*sc,0,0,dpr*sc,0,0); m.fillStyle='#0b0d18'; m.fillRect(0,0,M.GW*T,M.GH*T);
  for(let y=0;y<M.GH;y++) for(let x=0;x<M.GW;x++){ const i=y*M.GW+x, p=M.PAV[i]; if(p===-2){ if(M.ACQUA[i]){ m.fillStyle='#132c40'; m.fillRect(x*T,y*T,T+.5,T+.5); } continue; } m.fillStyle = p===-1 ? CORR2 : M.stanze[p].c2; m.fillRect(x*T,y*T,T+.5,T+.5); }
  for(const g of segni){ m.fillStyle=g.col; m.beginPath(); m.arc(g.x,g.y,(g.r||5)/sc,0,Math.PI*2); m.fill(); if(g.bordo){ m.strokeStyle='#0b0d18'; m.lineWidth=2/sc; m.stroke(); } }
  if(sopra) sopra(m, sc);
  // i nomi delle stanze dopo i pallini, su un fondo scuro. Un pallino non sta mai sotto le lettere: se c'è, il nome si sposta sopra o sotto
  m.font=`600 ${11/sc}px ${FONT}`; m.textAlign='center';
  const riga=13/sc, sotto=3/sc, su=10/sc;
  for(const s of M.stanze){
    const lw=m.measureText(s.nome).width/2+3/sc, x=Math.max(lw, Math.min(M.GW*T-lw, (s.lx!=null?s.lx:s.x+s.w/2)*T)), y0=(s.ly!=null?s.ly:s.y+s.h/2)*T; let y=y0;
    for(const k of [0,-1,1,-2,2]){ const q=y0+k*riga; if(!segni.some(g=>{ const r=(g.r||5)/sc; return Math.abs(g.x-x)<lw+r && g.y>q-su-r && g.y<q+sotto+r; })){ y=q; break; } }
    m.fillStyle='rgba(11,13,24,.62)'; m.beginPath(); if(m.roundRect) m.roundRect(x-lw,y-su-1/sc,lw*2,riga+1/sc,3/sc); else m.rect(x-lw,y-su-1/sc,lw*2,riga+1/sc); m.fill();
    m.fillStyle='rgba(241,232,214,.92)'; m.fillText(s.nome,x,y);
  }
}

// ======================================================================================================
//  I SABOTAGGI, DA VEDERE (tutto dipende dai tempi dello stato che manda l'host: lo stesso su ogni telefono)
// ======================================================================================================
// Livello delle luci nel buio (e = secondi dall'inizio): un attimo di sfarfallio, poi buio per davvero. 1 = accese, 0 = spente.
function livelloLuci(e){
  if(e < 0.12) return 1; if(e < 0.2) return 0.1; if(e < 0.34) return 0.95; if(e < 0.42) return 0.06;
  if(e < 0.56) return 0.8; if(e < 0.64) return 0.03; if(e < 0.74) return 0.55; if(e < 0.8) return 0.05;
  return 0;
}
const LUCI_ONDA = 14, LUCI_RITORNO = 4.8;   // la luce che torna: caselle al secondo dal quadro, e quanto dura (il palazzo è lungo circa 65 caselle)
const ACQUA_RIT = 6;                         // l'acqua che si ritira dopo la chiusa: caselle al secondo, a partire dalla chiusa
const ACQUA_BORDO = 1.8;                     // quanto è morbido il bordo dell'acqua, in caselle

// Le scintille di un quadro o di un telegrafo rotto: bagliore, archi che saltano, scintille. forza: 0..1.7
Pittore.prototype.elettrico = function(c, x, y, t, col, forza){
  const r = this.ridotto, k = r ? Math.floor(t*3) : Math.floor(t*18), h = n => { const v = Math.sin(k*12.9898 + n*78.233 + x*0.01)*43758.5453; return v - Math.floor(v); };
  const f = forza*(0.55 + 0.45*h(1));
  const g = c.createRadialGradient(x, y - 8, 0, x, y - 8, 72); g.addColorStop(0, `rgba(${col},${(0.62*f).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.fillRect(x - 72, y - 80, 144, 144);
  c.lineCap = 'round'; c.lineJoin = 'round';
  for(let a = 0; a < (r ? 1 : 3); a++){
    if(h(2 + a) < 0.35) continue;   // non a ogni fotogramma: guizza
    const ang = h(5 + a)*Math.PI*2, len = 20 + h(8 + a)*36; c.beginPath(); c.moveTo(x, y - 10);
    for(let i = 1; i <= 4; i++) c.lineTo(x + Math.cos(ang)*len*i/4 + (h(11 + i + a) - 0.5)*9, y - 10 + Math.sin(ang)*len*i/4*0.8 + (h(20 + i + a) - 0.5)*9);
    c.strokeStyle = `rgba(${col},${(0.35*f).toFixed(3)})`; c.lineWidth = 4; c.stroke(); c.strokeStyle = `rgba(255,255,255,${(0.9*f).toFixed(3)})`; c.lineWidth = 1.3; c.stroke();
  }
  if(!r) for(let i = 0; i < 5; i++){ const q = (t*2.2 + i*0.37)%1, a = h(30 + i)*Math.PI*2, d = q*(14 + h(40 + i)*18); c.fillStyle = `rgba(255,235,170,${((1 - q)*0.9*f).toFixed(3)})`; c.fillRect(x + Math.cos(a)*d - 1, y - 10 + Math.sin(a)*d*0.7 + q*q*16 - 1, 2, 2); }
};

// Il disturbo dell'interferenza su tutto lo schermo: neve leggera, righe che scendono, e a raffiche strisce che si spostano di lato
Pittore.prototype.disturbo = function(c, W, H, t){
  const D = this.DPR || 1, r = this.ridotto;
  if(!this.neve){ const n = document.createElement('canvas'); n.width = n.height = 96; const g = n.getContext('2d'), im = g.createImageData(96, 96);
    for(let i = 0; i < im.data.length; i += 4){ const v = Math.random()*255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); this.neve = c.createPattern(n, 'repeat'); }
  const ph = t%3.1, raffica = !r && (ph < 0.22 || (ph > 1.4 && ph < 1.5)), k = Math.floor(t*22), h = n => { const v = Math.sin(k*12.9898 + n*78.233)*43758.5453; return v - Math.floor(v); };
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  if(this.neve.setTransform) this.neve.setTransform(new DOMMatrix([D*1.4, 0, 0, D*1.4, r ? 0 : (h(1)*96)|0, r ? 0 : (h(2)*96)|0]));
  c.globalAlpha = r ? 0.03 : raffica ? 0.17 : 0.05; c.fillStyle = this.neve; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
  if(raffica){
    for(let i = 0; i < 4; i++){ const y = h(3 + i)*H, hh = (5 + h(8 + i)*26)*D, dx = (h(13 + i) - 0.5)*44*D; c.drawImage(this.cv, 0, y, W, hh, dx, y, W, hh); c.fillStyle = i%2 ? 'rgba(255,90,140,.10)' : 'rgba(110,255,240,.12)'; c.fillRect(0, y, W, hh); }
  }
  if(!r){ const y = ((t*80)%(H/D + 60) - 30)*D; c.fillStyle = 'rgba(190,255,240,.045)'; c.fillRect(0, y, W, 22*D); }
  c.restore();
};

// L'acqua alta. V = { e: secondi dall'inizio, tot: durata, ea, eb: secondi trascorsi alla chiusura delle due chiuse (-1 = aperta), ca, cb: da quanto sono chiuse }.
// Parte dalle due chiuse (Molo e Cantina) e si allarga sul pavimento, stanza dopo stanza e lungo i corridoi, alla velocità del tempo che resta; chi ha chiuso la chiusa
// vede l'acqua ritirarsi da lì. Si disegna per caselle visibili: una piccola immagine (una casella = un punto) ingrandita con bordi morbidi, onde che scorrono e,
// sopra, la maschera del pavimento libero (niente acqua sui mobili né sui muri).
Pittore.prototype.acquaDisegna = function(S, c, cx, cy, s, W, H, t){
  const M = S.M, V = S.acquaV, D = acquaDati(M, CHIUSA_A, CHIUSA_B), GW = M.GW, GH = M.GH, K = D.K, rid = this.ridotto;
  const tx0 = Math.max(0, Math.floor(cx/T)), ty0 = Math.max(0, Math.floor(cy/T)), tx1 = Math.min(GW - 1, Math.floor((cx + W/s)/T)), ty1 = Math.min(GH - 1, Math.floor((cy + H/s)/T));
  if(tx1 < tx0 || ty1 < ty0) return;
  const tot = V.tot || 60, dMax = D.dMax, F = e => dMax*1.1*Math.pow(Math.min(1, Math.max(0, e)/(0.88*tot)), 0.85);
  const frA = V.ea >= 0 ? F(V.ea) : F(V.e), frB = V.eb >= 0 ? F(V.eb) : F(V.e), recA = V.ca >= 0 ? V.ca*ACQUA_RIT : -9, recB = V.cb >= 0 ? V.cb*ACQUA_RIT : -9;
  let dp = 0;   // la profondità dell'ultima casella calcolata (colore più scuro dove l'acqua è alta da più tempo)
  const calc = (i, tx, ty) => {
    let m = 0; const w = rid ? 0 : 0.45*Math.sin(tx*0.9 + ty*1.3 + t*1.5);
    for(let q = 0; q < 2; q++){
      const d = q ? D.dB[i] : D.dA[i]; if(d < 0) continue;
      const fr = q ? frB : frA, rec = q ? recB : recA; let v = (fr + w - d)/ACQUA_BORDO; if(v <= 0) continue; v = Math.min(1, v);
      if(rec > -1){ const r = (d - rec)/ACQUA_BORDO; if(r <= 0) continue; v *= Math.min(1, r); }
      if(v > m){ m = v; dp = Math.min(1, Math.max(0, (fr - d)/14)); }
    }
    return m;
  };
  // 1) la copertura di ogni casella, in una piccola immagine (una casella = un punto)
  const nw = tx1 - tx0 + 1, nh = ty1 - ty0 + 1;
  if(!this.acqG || this.acqG.width !== nw || this.acqG.height !== nh){ this.acqG = document.createElement('canvas'); this.acqG.width = nw; this.acqG.height = nh; this.acqGc = this.acqG.getContext('2d'); this.acqI = this.acqGc.createImageData(nw, nh); this.acqC = new Float32Array(nw*nh); }
  const dat = this.acqI.data, cov = this.acqC, rifa = !(this.acqN++ & 1) || this.acqX !== tx0 || this.acqY !== ty0;   // la copertura si rifà un fotogramma su due (si muove piano)
  this.acqX = tx0; this.acqY = ty0;
  if(rifa) for(let y = 0; y < nh; y++) for(let x = 0; x < nw; x++){
    const tx = tx0 + x, ty = ty0 + y, i = ty*GW + tx, m = calc(i, tx, ty), o = (y*nw + x)*4; cov[y*nw + x] = m;
    // dal verde chiaro dei bassi fondali al blu profondo dove l'acqua è alta
    dat[o] = 118 - 100*dp; dat[o + 1] = 202 - 140*dp; dat[o + 2] = 218 - 100*dp; dat[o + 3] = 255*m*(0.34 + 0.34*dp);
  }
  if(rifa) this.acqGc.putImageData(this.acqI, 0, 0);
  this.acqCov = (tx, ty) => (tx >= tx0 && tx <= tx1 && ty >= ty0 && ty <= ty1) ? cov[(ty - ty0)*nw + (tx - tx0)] : 0;
  // 2) a mezza risoluzione: copertura ingrandita (bordi morbidi), onde che scorrono, maschera del pavimento libero
  const Wt = Math.ceil(W*0.5), Ht = Math.ceil(H*0.5), kk = 0.5*s;
  if(!this.acqT){ this.acqT = document.createElement('canvas'); this.acqTc = this.acqT.getContext('2d'); }
  if(this.acqT.width !== Wt || this.acqT.height !== Ht){ this.acqT.width = Wt; this.acqT.height = Ht; }
  const tc = this.acqTc; tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.globalAlpha = 1; tc.clearRect(0, 0, Wt, Ht); tc.imageSmoothingEnabled = true;
  tc.drawImage(this.acqG, 0, 0, nw, nh, (tx0*T - cx)*kk, (ty0*T - cy)*kk, nw*T*kk, nh*T*kk);
  if(!this.acqP){   // il disegno delle onde: righe chiare e sottili che si ripetono senza giunture
    const n = document.createElement('canvas'); n.width = n.height = 128; const g = n.getContext('2d'); g.lineCap = 'round';
    for(let j = 0; j < 9; j++){ const y0 = 8 + j*14, ph = j*1.7, nn = 1 + (j%3); g.strokeStyle = `rgba(225,246,255,${0.5 - (j%3)*0.12})`; g.lineWidth = 1.2 + (j%2)*0.5; g.beginPath();
      for(let x = 0; x <= 128; x += 4){ const y = y0 + Math.sin(x/128*Math.PI*2*nn + ph)*3.2; if(x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
    for(let j = 0; j < 14; j++){ const x = (j*47)%128, y = (j*71)%128; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x, y, 3, 1); }
    this.acqP = tc.createPattern(n, 'repeat');
  }
  tc.globalCompositeOperation = 'source-atop';
  if(this.acqP.setTransform){
    const dr = rid ? 0 : t;
    for(const [sc, vx, vy, a] of [[1, 9, 4, 0.5], [1.7, -6, 7, 0.34]]){ this.acqP.setTransform(new DOMMatrix([kk*sc, 0, 0, kk*sc, -cx*kk + dr*vx*kk, -cy*kk + dr*vy*kk])); tc.globalAlpha = a; tc.fillStyle = this.acqP; tc.fillRect(0, 0, Wt, Ht); }
  }
  tc.globalAlpha = 1; tc.globalCompositeOperation = 'destination-in';
  const sx0 = Math.max(0, cx*K/T), sy0 = Math.max(0, cy*K/T), sx1 = Math.min(GW*K, (cx + W/s)*K/T), sy1 = Math.min(GH*K, (cy + H/s)*K/T);
  if(sx1 > sx0 && sy1 > sy0) tc.drawImage(D.mask, sx0, sy0, sx1 - sx0, sy1 - sy0, (sx0*T/K - cx)*kk, (sy0*T/K - cy)*kk, (sx1 - sx0)*T/K*kk, (sy1 - sy0)*T/K*kk);
  tc.globalCompositeOperation = 'source-over';
  c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(this.acqT, 0, 0, Wt, Ht, 0, 0, W, H); c.setTransform(s, 0, 0, s, -cx*s, -cy*s);
  // 3) schiuma: intorno ai mobili e lungo i muri dove arriva l'acqua; luccichii; cerchi di chi cammina
  const acq = (tx, ty) => this.acqCov(tx, ty);
  c.lineJoin = 'round';
  M.ostacoli.forEach((o, k) => {
    if((o.x + o.w)*T < cx || o.x*T > cx + W/s || (o.y + o.h)*T < cy || o.y*T > cy + H/s) return;
    const m = acq(o.x + (o.w >> 1), o.y + o.h);   // la casella davanti al mobile, dove ci si bagna
    if(m < 0.3) return;
    const a = (0.5*m*(0.75 + 0.25*Math.sin(t*3 + k*1.3))).toFixed(3), w = rid ? 0 : Math.sin(t*2.2 + k)*1.2;
    c.strokeStyle = `rgba(236,248,255,${a})`; c.lineWidth = 2; c.strokeRect(o.x*T - 2.5 - w, o.y*T - 2.5 - w, o.w*T + 5 + 2*w, o.h*T + 5 + 2*w);
    c.strokeStyle = `rgba(190,228,245,${(0.28*m).toFixed(3)})`; c.lineWidth = 1; c.strokeRect(o.x*T - 6 - w, o.y*T - 6 - w, o.w*T + 12 + 2*w, o.h*T + 12 + 2*w);
  });
  c.beginPath();
  for(let ty = ty0; ty <= ty1; ty++) for(let tx = tx0; tx <= tx1; tx++){
    const m = acq(tx, ty); if(m < 0.3) continue; const i = ty*GW + tx;
    if(ty > 0 && M.MURO[i + GW] && ty + 1 < GH){   // un muro a sud: l'acqua finisce contro la sua faccia
      const y0 = (ty + 1 - ACQUA_MURO)*T; c.moveTo(tx*T, y0); for(let x = 4; x <= T; x += 4) c.lineTo(tx*T + x, y0 + (rid ? 0 : Math.sin(x*0.4 + t*3 + tx)*1.2)); }
    if(tx + 1 < GW && M.MURO[i + 1]){ c.moveTo((tx + 1)*T - 1, ty*T); for(let y = 4; y <= T; y += 4) c.lineTo((tx + 1)*T - 1 + (rid ? 0 : Math.sin(y*0.4 + t*3 + ty)*1), ty*T + y); }
    if(tx > 0 && M.MURO[i - 1]){ c.moveTo(tx*T + 1, ty*T); for(let y = 4; y <= T; y += 4) c.lineTo(tx*T + 1 + (rid ? 0 : Math.sin(y*0.4 + t*3 + ty)*1), ty*T + y); }
  }
  c.strokeStyle = 'rgba(236,248,255,.4)'; c.lineWidth = 2; c.stroke();
  if(!rid){
    c.fillStyle = 'rgba(255,255,255,.8)';
    for(let ty = ty0; ty <= ty1; ty++) for(let tx = tx0; tx <= tx1; tx++){
      if(acq(tx, ty) < 0.6) continue; const h = ((tx*73856093) ^ (ty*19349663))>>>0; if(h%4) continue;
      const f = Math.sin(t*2.4 + (h%997)*0.37); if(f > 0.82) c.fillRect(tx*T + (h%23) + 4, ty*T + ((h>>5)%23) + 4, 3, 1.2);
    }
    // i cerchi lasciati da chi cammina
    for(let i = this.acquaOnde.length - 1; i >= 0; i--){ const q = this.acquaOnde[i], age = t - q.t0; if(age > 1.1 || age < 0){ this.acquaOnde.splice(i, 1); continue; }
      c.strokeStyle = `rgba(225,245,255,${(0.55*(1 - age/1.1)).toFixed(3)})`; c.lineWidth = 1.3; this.ell(q.x, q.y, 5 + age*26, 2 + age*10); c.stroke(); }
  }
};

// ===== minigiochi.js =====
// I minigiochi dei compiti: si giocano sul telefono di chi li fa; all'host arriva solo «fatto».

const ISTRUZIONI = {
  tieni: 'Tieni premuto finché il cerchio non si chiude.',
  sequenza: "Tocca i numeri dall'1 al 5, in ordine.",
  leva: 'Ferma la lancetta dentro la zona dorata.',
  trascina: 'Trascina le tre cose dentro il riquadro.',
  versa: 'Tieni premuto per versare. Lascia quando arrivi alla fascia dorata.',
  quadri: 'Tocca i quadri per girarli: il cielo in alto.',
};
// le cose da trascinare, disegnate (niente emoji): 64×64, ombra a terra e luce da sinistra
const svg = d => '<svg viewBox="0 0 64 64" aria-hidden="true">' + d + '</svg>';
const OMBRA = (rx, cy) => '<ellipse cx="32" cy="' + (cy || 57) + '" rx="' + rx + '" ry="3.5" fill="rgba(0,0,0,.35)"/>';
const DISEGNI = {
  pasticcino: svg('<defs><linearGradient id="lt-d1" x1="0" x2="1"><stop offset="0" stop-color="#b03a58"/><stop offset=".45" stop-color="#f08aa2"/><stop offset="1" stop-color="#9a2e4a"/></linearGradient><radialGradient id="lt-d2" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e2c9aa"/></radialGradient></defs>'
    + OMBRA(16) + '<path d="M14 34h36l-5 22H19z" fill="url(#lt-d1)"/><path d="M20 34l2 22M26 34l1 22M32 34v22M38 34l-1 22M44 34l-2 22" stroke="rgba(80,16,34,.45)" stroke-width="1.5"/>'
    + '<path d="M12 35c0-5 4-8 8-8 0-6 6-9 12-9s12 3 12 9c4 0 8 3 8 8z" fill="url(#lt-d2)"/><path d="M17 31c5 2 10 2 15 0s10-2 15 0M22 23c4 1.6 8 1.6 12 0" stroke="#d6b994" stroke-width="1.5" fill="none"/>'
    + '<g stroke-width="2" stroke-linecap="round"><path d="M20 28l2-1" stroke="#e3b04a"/><path d="M40 27l2 1" stroke="#4a9ad8"/><path d="M28 21l1 1.6" stroke="#5ab07a"/><path d="M36 22l2-.6" stroke="#e3b04a"/></g>'
    + '<path d="M33 10c1-3 3-5 6-6" stroke="#4a6a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="32.5" cy="14.5" r="5" fill="#c4202e"/><circle cx="31" cy="13" r="1.6" fill="#ff9a9a"/>'),
  torta: svg('<defs><linearGradient id="lt-d3" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f6dc8a"/><stop offset="1" stop-color="#d8a84a"/></linearGradient></defs>'
    + OMBRA(24, 56) + '<path d="M6 32L54 36V54L6 48z" fill="url(#lt-d3)"/><path d="M6 37.5L54 42M6 43L54 48" stroke="#fff3df" stroke-width="2.6"/><path d="M6 37.5L54 42M6 43L54 48" stroke="#d04a5a" stroke-width=".9" opacity=".7"/>'
    + '<path d="M54 36l4-12v18l-4 12z" fill="#ead9c2"/><path d="M6 32L44 18l14 6-4 12z" fill="#fbe9ef"/><path d="M6 32L54 36" stroke="#f3cdd9" stroke-width="2"/>'
    + '<path d="M14 33q1 4 2 0M26 34q1 5 2 0M40 35q1 4 2 0" stroke="#fbe9ef" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
    + '<path d="M40 22c-3-5 2-8 5-5 3-3 8 0 5 5-2 4-5 6-5 6s-3-2-5-6z" fill="#d42a3a"/><path d="M42 17l3 2 3-2-3-2z" fill="#4f8a3a"/><circle cx="43" cy="21" r=".8" fill="#ffd0a0"/><circle cx="47" cy="22" r=".8" fill="#ffd0a0"/>'),
  cornetto: svg('<defs><linearGradient id="lt-d4" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f0b860"/><stop offset=".6" stop-color="#c6782e"/><stop offset="1" stop-color="#8a4a1a"/></linearGradient></defs>'
    + OMBRA(24, 50) + '<path d="M5 42c1-13 14-22 27-22s26 9 27 22c-4 3-9 1-11-2-4 4-10 6-16 6s-12-2-16-6c-2 3-7 5-11 2z" fill="url(#lt-d4)"/>'
    + '<path d="M19 25c2.5 6 2.5 13 0 20M32 21v24M45 25c-2.5 6-2.5 13 0 20" stroke="rgba(110,50,14,.5)" stroke-width="2.2" fill="none" stroke-linecap="round"/>'
    + '<path d="M13 31c4-5 10-7 15-7M36 24c5 0 10 2 14 6" stroke="rgba(255,236,190,.55)" stroke-width="2" fill="none" stroke-linecap="round"/>'),
  cassa: svg(OMBRA(24) + '<path d="M8 24h42v32H8z" fill="#9a6e3e"/><path d="M8 24l8-8h42l-8 8z" fill="#c69a68"/><path d="M50 24l8-8v32l-8 8z" fill="#74502c"/>'
    + '<path d="M8 34.5h42M8 45h42M16 16l-8 8M24 16h0M26 20h28" stroke="#6b4a26" stroke-width="1.4"/><path d="M20 16l-4 4M36 16l-4 4" stroke="#8a6438" stroke-width="1.2"/>'
    + '<path d="M8 24h42v32H8z" fill="none" stroke="#5a3c1c" stroke-width="3.2"/><path d="M10 54L48 26" stroke="#5a3c1c" stroke-width="3.2"/><path d="M50 24l8-8v32l-8 8z" fill="none" stroke="#4a3016" stroke-width="2"/>'
    + '<path d="M22 31h10M22 34h6" stroke="rgba(40,24,10,.5)" stroke-width="1.4"/>'),
  botte: svg('<defs><linearGradient id="lt-d5" x1="0" x2="1"><stop offset="0" stop-color="#3a2414"/><stop offset=".32" stop-color="#9a6a3a"/><stop offset=".6" stop-color="#7a4c28"/><stop offset="1" stop-color="#2e1c10"/></linearGradient></defs>'
    + OMBRA(19, 58) + '<path d="M15 14c-5 14-5 28 0 42h34c5-14 5-28 0-42z" fill="url(#lt-d5)"/>'
    + '<path d="M22 14c-2 14-2 28 0 42M32 14v42M42 14c2 14 2 28 0 42" stroke="rgba(30,16,8,.45)" stroke-width="1.2" fill="none"/>'
    + '<path d="M13 23q19 5 38 0M12 47q20 5 40 0" stroke="#2a2a30" stroke-width="3.6" fill="none"/><path d="M13 22q19 5 38 0" stroke="rgba(220,220,230,.3)" stroke-width="1" fill="none"/>'
    + '<ellipse cx="32" cy="14" rx="17" ry="5" fill="#8a5a32" stroke="#3a2414" stroke-width="2"/><path d="M19 14h26M21 12h22M21 16h22" stroke="rgba(40,20,10,.35)" stroke-width=".9"/><circle cx="38" cy="14" r="1.6" fill="#2a1810"/>'
    + '<rect x="30" y="38" width="4" height="6" rx="1" fill="#c9a35a"/><rect x="28" y="43" width="8" height="2" rx="1" fill="#c9a35a"/>'),
  sacco: svg('<defs><radialGradient id="lt-d6" cx=".38" cy=".4" r=".75"><stop offset="0" stop-color="#e6d6ae"/><stop offset="1" stop-color="#a8946a"/></radialGradient></defs>'
    + OMBRA(20) + '<path d="M14 56c-7-14-3-28 8-36h20c11 8 15 22 8 36z" fill="url(#lt-d6)"/><path d="M23 21l2-9h14l2 9z" fill="#c4b088"/>'
    + '<path d="M22 18h20" stroke="#6a4a2a" stroke-width="2.6" stroke-linecap="round"/><path d="M41 18c4 1 6 4 5 7" stroke="#6a4a2a" stroke-width="1.8" fill="none"/>'
    + '<path d="M18 30q14 3 28 0M16 40q16 3 32 0M17 50q15 3 30 0" stroke="rgba(110,90,50,.3)" stroke-width="1" fill="none" stroke-dasharray="2 2"/>'
    + '<circle cx="32" cy="40" r="6.5" fill="none" stroke="#8a3a2a" stroke-width="1.6"/><path d="M27 40h10" stroke="#8a3a2a" stroke-width="1.6"/>'),
  camicia: svg('<defs><linearGradient id="lt-d7" x1="0" x2="1"><stop offset="0" stop-color="#3a5fbd"/><stop offset=".5" stop-color="#6a90ee"/><stop offset="1" stop-color="#3456ad"/></linearGradient></defs>'
    + OMBRA(16, 60) + '<path d="M22 8L8 16l5 12 7-3v31h24V25l7 3 5-12L42 8c-2 4-6 6-10 6s-8-2-10-6z" fill="url(#lt-d7)"/>'
    + '<path d="M8 16l5 12 7-3M56 16l-5 12-7-3" stroke="rgba(0,0,0,.18)" stroke-width="1.4" fill="none"/>'
    + '<path d="M22 8c2 4 6 6 10 6s8-2 10-6l-3-1.4c-1.4 3-4 4.4-7 4.4s-5.6-1.4-7-4.4z" fill="#f2f0ea"/><path d="M32 14v42" stroke="rgba(0,0,0,.22)" stroke-width="1.2"/>'
    + '<g fill="#f2f0ea"><circle cx="32" cy="21" r="1.1"/><circle cx="32" cy="29" r="1.1"/><circle cx="32" cy="37" r="1.1"/><circle cx="32" cy="45" r="1.1"/></g><rect x="36.5" y="24" width="6" height="6" rx="1" fill="none" stroke="rgba(0,0,0,.22)" stroke-width="1"/>'
    + '<rect x="27" y="2" width="10" height="4" rx="1" fill="#c9a874"/>'),
  calzini: svg('<g transform="rotate(-6 22 30)"><path d="M14 6h12v28c0 6 2 9 8 10 6 1 6 10-2 11H20c-6 0-8-4-8-11z" fill="#ece5d6"/><path d="M14 11h12M14 17h12M14 23h12" stroke="#c9443f" stroke-width="3"/><path d="M12 47c0 5 2 8 8 8h6c-1-5-3-8-7-8z" fill="#c9443f" opacity=".85"/></g>'
    + '<g transform="rotate(6 42 30)"><path d="M34 6h12v28c0 6 2 9 8 10 6 1 6 10-2 11H40c-6 0-8-4-8-11z" fill="#3a5aa8"/><path d="M34 11h12M34 17h12M34 23h12" stroke="#e3b04a" stroke-width="3"/><path d="M32 47c0 5 2 8 8 8h6c-1-5-3-8-7-8z" fill="#22386e"/></g>'
    + '<rect x="18" y="2" width="8" height="4" rx="1" fill="#c9a874"/><rect x="38" y="2" width="8" height="4" rx="1" fill="#c9a874"/>'),
  vestito: svg('<defs><linearGradient id="lt-d8" x1="0" x2="1"><stop offset="0" stop-color="#1f6a46"/><stop offset=".5" stop-color="#3aa572"/><stop offset="1" stop-color="#1a5a3c"/></linearGradient></defs>'
    + OMBRA(22, 60) + '<path d="M24 6h3l3 8h4l3-8h3l-1 10 3 10-2 3 13 29H11l13-29-2-3 3-10z" fill="url(#lt-d8)"/>'
    + '<path d="M22 27h20" stroke="#e3b04a" stroke-width="3"/><path d="M27 31l-6 26M32 31v26M37 31l6 26" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>'
    + '<path d="M11 58h42" stroke="rgba(255,255,255,.35)" stroke-width="1.6"/><rect x="27" y="1" width="10" height="4" rx="1" fill="#c9a874"/>'),
};
const COSE = { dolci:['pasticcino','torta','cornetto'], barca:['cassa','botte','sacco'], bucato:['camicia','calzini','vestito'] };
// dove vanno le cose: un vassoio d'argento, l'interno della barca, la corda dello stendino
const SFONDI = {
  dolci: '<svg class="sfondo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="58" rx="46" ry="36" fill="#8a8f98"/><ellipse cx="50" cy="56" rx="42" ry="32" fill="#c6cbd2"/><ellipse cx="50" cy="56" rx="36" ry="26" fill="none" stroke="#9aa0a8" stroke-width="1.5"/><ellipse cx="38" cy="44" rx="14" ry="6" fill="rgba(255,255,255,.35)"/></svg>',
  barca: '<svg class="sfondo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M8 20h70q20 2 20 30t-20 30H8q-6-30 0-60z" fill="#5a3a22"/><path d="M14 26h62q16 2 16 24t-16 24H14q-4-24 0-48z" fill="#a07a50"/><path d="M14 38h76M14 50h80M14 62h76" stroke="rgba(60,36,20,.4)" stroke-width="1.2"/><path d="M40 26v48M68 26v48" stroke="#6b4a2e" stroke-width="5"/></svg>',
  bucato: '<svg class="sfondo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M4 10v86M96 10v86" stroke="#7a6448" stroke-width="4"/><path d="M4 14q46 10 92 0" stroke="#cfc4b0" stroke-width="1.6" fill="none"/></svg>',
};
const META = { dolci:'Vassoio', barca:'Barca', bucato:'Stendino' };
const VASI = { vino:{ col:'#7a1f33', nome:'Caraffa' }, piante:{ col:'#3d7fb0', nome:'Annaffiatoio' } };

function el(tag, cls, testo){ const e=document.createElement(tag); if(cls) e.className=cls; if(testo!=null) e.textContent=testo; return e; }
function scuoti(e){ e.classList.remove('lt-scuoti'); void e.offsetWidth; e.classList.add('lt-scuoti'); }
// col gioco girato di lato (telefono in verticale) il dito si muove sullo schermo, la cosa nel gioco: giro lo spostamento
function nelGioco(n, dx, dy){ return n.closest && n.closest('.lt-ruota') ? [dy, -dx] : [dx, dy]; }

// box: dove disegnare; post: la postazione; fatto(): da chiamare quando il compito è riuscito
function apriMinigioco(box, post, fatto){
  box.textContent='';
  box.appendChild(el('p','lt-istr', ISTRUZIONI[post.gioco]||''));
  const zona=el('div','lt-mg'); box.appendChild(zona);
  let chiuso=false;
  const riuscito=()=>{ if(chiuso) return; chiuso=true; const ok=el('p','lt-ok','Fatto'); box.appendChild(ok); setTimeout(fatto, 380); };
  const g = { tieni, sequenza, leva, trascina, versa, quadri }[post.gioco] || tieni;
  const tick = g(zona, post, riuscito) || null;
  return { tick: dt => { if(!chiuso && tick) tick(dt); } };
}

function tieni(z, post, ok){
  z.innerHTML='<button class="lt-tieni" type="button"><svg viewBox="0 0 120 120" aria-hidden="true"><circle class="tr" cx="60" cy="60" r="52"/><circle class="rp" cx="60" cy="60" r="52" stroke-dasharray="326.7" stroke-dashoffset="326.7"/></svg><span>Tieni</span></button>';
  const b=z.querySelector('button'), arco=z.querySelector('.rp'); let giu=false, p=0;
  const su=()=>{ giu=false; b.classList.remove('giu'); };
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); giu=true; b.classList.add('giu'); try{ b.setPointerCapture(e.pointerId); }catch(_){} });
  b.addEventListener('pointerup',su); b.addEventListener('pointercancel',su); b.addEventListener('lostpointercapture',su);
  return dt=>{ p = giu ? p+dt/2.2 : Math.max(0,p-dt*0.6); arco.setAttribute('stroke-dashoffset', String(326.7*(1-Math.min(1,p)))); if(p>=1) ok(); };
}
function sequenza(z, post, ok){
  const fila=el('div','lt-seq'); z.appendChild(fila); let prossimo=1;
  mescola([1,2,3,4,5]).forEach(n=>{
    const b=el('button','',String(n)); b.type='button';
    b.addEventListener('pointerdown',e=>{
      e.preventDefault(); if(b.classList.contains('ok')) return;
      if(n===prossimo){ b.classList.add('ok'); prossimo++; if(prossimo>5) ok(); }
      else { prossimo=1; fila.querySelectorAll('button').forEach(x=>x.classList.remove('ok')); scuoti(fila); }
    });
    fila.appendChild(b);
  });
}
function leva(z, post, ok){
  z.innerHTML='<div class="lt-leva"><div class="zona"></div><div class="ago"></div></div><button class="lt-btn" type="button">Ferma</button>';
  const tr=z.querySelector('.lt-leva'), zona=z.querySelector('.zona'), ago=z.querySelector('.ago'), b=z.querySelector('button');
  const z0=0.2+Math.random()*0.55, zw=0.17; zona.style.left=(z0*100)+'%'; zona.style.width=(zw*100)+'%';
  let t=Math.random()*3, vel=2.1, pos=0, fermo=false;
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); if(fermo) return; if(pos>=z0 && pos<=z0+zw){ fermo=true; ok(); } else { vel=Math.min(3.4,vel+0.25); scuoti(tr); } });
  return dt=>{ if(fermo) return; t+=dt*vel; pos=(Math.sin(t)+1)/2; ago.style.left=(pos*100)+'%'; };
}
function trascina(z, post, ok){
  const cose=COSE[post.id]||COSE.dolci;
  z.innerHTML='<div class="lt-tr"><div class="meta">'+(SFONDI[post.id]||SFONDI.dolci)+'<span>'+(META[post.id]||'Vassoio')+'</span></div></div>';
  const area=z.querySelector('.lt-tr'), meta=area.querySelector('.meta'); let dentro=0;
  cose.forEach((e,i)=>{
    const c=el('div','cosa'); c.innerHTML=DISEGNI[e]; c.style.left='5%'; c.style.top=(4+i*31)+'%'; area.appendChild(c);
    let id=null, ox=0, oy=0, x0=0, y0=0;
    c.addEventListener('pointerdown',ev=>{ if(c.classList.contains('ok')) return; ev.preventDefault(); id=ev.pointerId; ox=ev.clientX; oy=ev.clientY; x0=0; y0=0; c.classList.add('su'); try{ c.setPointerCapture(id); }catch(_){} });
    c.addEventListener('pointermove',ev=>{ if(ev.pointerId!==id) return; [x0,y0]=nelGioco(c, ev.clientX-ox, ev.clientY-oy); c.style.transform=`translate(${x0}px,${y0}px)`; });
    const lascia=ev=>{
      if(ev.pointerId!==id) return; id=null; c.classList.remove('su');
      const r=c.getBoundingClientRect(), m=meta.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
      if(cx>m.left && cx<m.right && cy>m.top && cy<m.bottom){
        c.classList.add('ok'); c.style.transform=''; meta.appendChild(c); c.style.left=''; c.style.top='';
        if(++dentro>=cose.length) ok();
      } else c.style.transform='';
    };
    c.addEventListener('pointerup',lascia); c.addEventListener('pointercancel',lascia);
  });
}
function versa(z, post, ok){
  const v=VASI[post.id]||VASI.vino;
  z.innerHTML='<div class="lt-vaso"><div class="fascia"></div><div class="liv"></div></div><button class="lt-btn" type="button">Versa</button>';
  const vaso=z.querySelector('.lt-vaso'), liv=z.querySelector('.liv'), fa=z.querySelector('.fascia'), b=z.querySelector('button');
  liv.style.background=v.col;
  const f0=0.6+Math.random()*0.2, fh=0.12; fa.style.bottom=(f0*100)+'%'; fa.style.height=(fh*100)+'%';
  let l=0, giu=false;
  const lascia=()=>{ if(!giu) return; giu=false; b.classList.remove('giu');
    if(l>=f0 && l<=f0+fh) ok();
    else if(l>f0+fh){ l=0; scuoti(vaso); } };
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); giu=true; b.classList.add('giu'); try{ b.setPointerCapture(e.pointerId); }catch(_){} });
  b.addEventListener('pointerup',lascia); b.addEventListener('pointercancel',lascia); b.addEventListener('lostpointercapture',lascia);
  return dt=>{ if(giu){ l+=dt*0.42; if(l>1.02){ l=0; giu=false; b.classList.remove('giu'); scuoti(vaso); } } liv.style.height=(Math.min(1,l)*100)+'%'; };
}
// quattro quadretti diversi, ognuno col suo cielo: si capisce da solo qual è il verso giusto
const QUADRETTI = [['#5a7ab0','#e8c9a0','#4f7a4a','#f6e3a0'], ['#2a3a6a','#7a6aa0','#3a5a46','#f2f0e0'], ['#8ab0d0','#f0e0c0','#6a8a4a','#fff2b0'], ['#c06a4a','#f0c080','#5a4a3a','#ffe0a0']].map((c, i) =>
  '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lt-q' + i + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient></defs>'
  + '<rect x="1" y="1" width="62" height="62" rx="3" fill="#b8914e"/><rect x="5" y="5" width="54" height="54" fill="#5a4420"/><rect x="7" y="7" width="50" height="50" fill="url(#lt-q' + i + ')"/>'
  + '<circle cx="' + (40 - i*4) + '" cy="19" r="' + (i === 1 ? 4 : 6) + '" fill="' + c[3] + '"/>' + (i === 1 ? '<g fill="#fff"><circle cx="16" cy="14" r=".9"/><circle cx="26" cy="22" r=".7"/><circle cx="50" cy="12" r=".8"/></g>' : '')
  + '<path d="M7 42q12-10 25-3t25-6v24H7z" fill="' + c[2] + '"/><path d="M7 50q18-6 50 0v7H7z" fill="rgba(0,0,0,.25)"/>'
  + (i === 2 ? '<path d="M18 42l5-12 5 12z" fill="#2a4a2a"/><rect x="22" y="42" width="2" height="4" fill="#3a2a1a"/>' : i === 3 ? '<path d="M38 44h12v-8l-6-5-6 5z" fill="#e8dcc0"/><rect x="42" y="39" width="3" height="5" fill="#5a3a22"/>' : '')
  + '<rect x="1" y="1" width="62" height="62" rx="3" fill="none" stroke="rgba(255,240,200,.35)" stroke-width="1"/></svg>');
function quadri(z, post, ok){
  const g=el('div','lt-quadri'); z.appendChild(g);
  const giri=[0,0,0,0].map(()=>1+Math.floor(Math.random()*3));
  giri.forEach((k,i)=>{
    const q=el('button','q'); q.type='button'; const f=el('span'); f.innerHTML=QUADRETTI[i%4]; q.appendChild(f); f.style.transform=`rotate(${k*90}deg)`;
    let ang=k*90;
    q.addEventListener('pointerdown',e=>{ e.preventDefault(); if(!giri.some(x=>x)) return; giri[i]=(giri[i]+1)%4; ang+=90; f.style.transform=`rotate(${ang}deg)`; q.classList.toggle('ok', giri[i]===0); if(!giri.some(x=>x)) ok(); });
    g.appendChild(q);
  });
}

// ===== voce.js =====
// Voce di prossimità di Lanterne: si parla a voce e si sente chi è vicino. Più piano da lontano, attutito dietro un muro,
// da sinistra o da destra secondo dove sta chi parla. Stessa regola della chat scritta (Partita.sentePar).
//
// Quattro pezzi che non si conoscono fra loro, così il trasporto si cambia senza toccare il resto:
//   1. voceRegola()       LA REGOLA: chi sente chi, quanto forte, quanto attutito, da che lato. Solo numeri: niente audio, niente rete.
//   2. VoceMixer          IL MIXER (Web Audio): per ogni voce un filtro, un volume e una direzione. Non sa da dove arriva l'audio.
//   3. TrasportoDiretto   IL TRASPORTO: WebRTC fra i telefoni, a maglia (ognuno con ognuno, fino a 10). Sceglie lui come arriva la voce.
//   4. VOCE               IL COLLEGAMENTO COL GIOCO: microfono, timer da 10 al secondo, anelli, messaggi della stanza.
//
// Quando ci sarà il server (LiveKit), si scrive un TrasportoLiveKit con la stessa forma e si cambia UNA riga: la fabbrica
// VOCE.nuovoTrasporto (più sotto), che oggi dà un TrasportoDiretto. Regola, mixer, tasti e anelli restano uguali.
// La forma del trasporto:
//   new Trasporto({ io, sess, manda(a, dati), onFlusso(id, flusso), onFine(id), onStato(id, stato), diario(testo) })
//   .microfono(traccia o null)    metto o tolgo la mia voce (senza ricollegare nessuno)
//   .persone([[id, sessione], …]) chi c'è adesso in voce (con un server non serve: lo sa lui)
//   .segnale(da, dati)            è arrivato un messaggio di collegamento (con un server non serve)
//   .risveglia()                  (facoltativo) il telefono torna dal blocco schermo: i collegamenti caduti si riprendono subito
//   .stati()                      { id: 'connected' | … } per le prove
//   .chiudi()
// In più, il trasporto diretto ha bisogno di qualcuno che porti i messaggi di collegamento da un telefono all'altro:
// è VoceStanza, sul telefono dell'host (fa da portalettere, non conserva niente). Con un server sparisce anche lui.


// =========================================================
//  1. LA REGOLA
// =========================================================
var VOCE_PIENO = 1.5 * T;          // entro questa distanza si sente al massimo
var VOCE_PIENO_MURO = 1 * T;       // dietro un muro, da così vicino si sente al massimo (che è comunque più piano)
var VOCE_APERTO = 16000;           // filtro passa-basso senza muri: non toglie niente
var VOCE_MURO = 800;               // dietro un muro: restano solo i suoni gravi (circa 700-900 Hz)
var VOCE_VOL_MURO = 0.6;           // e la voce è più bassa
var VOCE_VOL_ANIME = 0.85;         // le anime sentono tutti: un po' più piano, così le voci non si coprono
var VOCE_PAN_MAX = 0.85;           // quanto si sposta a sinistra o a destra al massimo
var VOCE_PAN_DIST = 3 * T;         // a questa distanza di lato la voce è tutta da una parte
var VOCE_FASI_VICINO = { atrio: 1, svela: 1, gioco: 1 };   // si sente per vicinanza
var VOCE_FASI_RIUNIONE = { riunione: 1, esito: 1 };        // si sentono tutti i vivi

// una curva morbida da 0 a 1 (piatta alle due estremità: nessuno scatto quando si entra o si esce dal raggio)
function voceMorbido(t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
function voceLato(a, b) { var p = (b.x - a.x) / VOCE_PAN_DIST; return VOCE_PAN_MAX * (p < -1 ? -1 : p > 1 ? 1 : p); }

// ascolta: chi sente, { x, y, vivo }   parla: chi parla, { x, y, vivo, muto }
//   «muto»: è in una botola, è uscito, non ha una posizione, o in riunione è stato zittito.
// fase: la fase della partita (atrio, svela, gioco, riunione, esito, fine); M: la mappa dove si trovano.
// Risposta: { vol: 0..1, taglio: Hz del filtro, pan: -1..1, k } con k come in Partita.sentePar: 0 niente, 1 forte, 2 attutito.
// Vale la stessa regola della chat scritta:
//   · i vivi si sentono entro R_PARLA caselle a vista; attraverso un muro solo entro R_MURO, e attutiti;
//   · le anime sentono tutti e parlano solo alle anime;
//   · in riunione si sentono tutti i vivi (le anime parlano solo alle anime e sentono tutti);
//   · a partita finita si sentono tutti.
function voceRegola(fase, M, ascolta, parla) {
  var zero = { vol: 0, taglio: VOCE_APERTO, pan: 0, k: 0 };
  if (!parla || parla.muto) return zero;
  var libera = { vol: 1, taglio: VOCE_APERTO, pan: 0, k: 1 };
  if (VOCE_FASI_VICINO[fase]) {
    if (!parla.vivo) return ascolta.vivo ? zero : libera;
    if (!ascolta.vivo) return { vol: VOCE_VOL_ANIME, taglio: VOCE_APERTO, pan: 0, k: 1 };
    var d = Math.hypot(parla.x - ascolta.x, parla.y - ascolta.y);
    if (d > R_PARLA) return zero;
    var pan = voceLato(ascolta, parla);
    if (vede(M, ascolta.x, ascolta.y, parla.x, parla.y)) return { vol: voceMorbido((R_PARLA - d) / (R_PARLA - VOCE_PIENO)), taglio: VOCE_APERTO, pan: pan, k: 1 };
    if (d <= R_MURO) return { vol: VOCE_VOL_MURO * voceMorbido((R_MURO - d) / (R_MURO - VOCE_PIENO_MURO)), taglio: VOCE_MURO, pan: pan, k: 2 };
    return zero;
  }
  if (VOCE_FASI_RIUNIONE[fase]) return !parla.vivo && ascolta.vivo ? zero : libera;
  return libera;
}

// =========================================================
//  2. IL MIXER (Web Audio)
// =========================================================
// Ogni voce: MediaStreamSource → filtro passa-basso → volume → direzione → uscita.
// A valle di tutto un compressore, così con tante voci insieme non si va in distorsione.
function VoceMixer(ctx) {
  this.ctx = ctx; this.v = {}; this.mio = null;
  this.master = ctx.createGain(); this.master.gain.value = 0.9;
  this.comp = ctx.createDynamicsCompressor();
  this.comp.threshold.value = -16; this.comp.knee.value = 14; this.comp.ratio.value = 4; this.comp.attack.value = 0.005; this.comp.release.value = 0.2;
  this.master.connect(this.comp); this.comp.connect(ctx.destination);
}
VoceMixer.prototype.aggiungi = function (id, flusso) {
  var c = this.ctx; this.togli(id);
  var src = c.createMediaStreamSource(flusso), fil = c.createBiquadFilter(), gan = c.createGain(), an = c.createAnalyser();
  var pan = c.createStereoPanner ? c.createStereoPanner() : null;
  fil.type = 'lowpass'; fil.frequency.value = VOCE_APERTO; fil.Q.value = 0.7;
  gan.gain.value = 0;   // si parte da zero: il volume giusto arriva morbido dal primo giro della regola
  an.fftSize = 1024;
  src.connect(fil); fil.connect(gan); gan.connect(an);   // (l'analizzatore sta dopo il volume: l'anello compare solo per ciò che si sente)
  if (pan) { gan.connect(pan); pan.connect(this.master); } else gan.connect(this.master);
  this.v[id] = { src: src, fil: fil, gan: gan, an: an, pan: pan, buf: new Uint8Array(an.fftSize), ultimo: null };
};
VoceMixer.prototype.togli = function (id) {
  var x = this.v[id]; if (!x) return;
  [x.src, x.fil, x.gan, x.an, x.pan].forEach(function (n) { if (n) try { n.disconnect(); } catch (e) {} });
  delete this.v[id];
};
// volume, filtro e direzione di una voce: transizioni morbide, mai salti (si chiama circa 10 volte al secondo)
VoceMixer.prototype.regola = function (id, r) {
  var x = this.v[id]; if (!x) return;
  var u = x.ultimo; if (u && Math.abs(u.vol - r.vol) < 0.004 && u.taglio === r.taglio && Math.abs(u.pan - r.pan) < 0.01) return;
  x.ultimo = { vol: r.vol, taglio: r.taglio, pan: r.pan };
  var t = this.ctx.currentTime;
  x.gan.gain.setTargetAtTime(r.vol, t, 0.07);
  x.fil.frequency.setTargetAtTime(r.taglio, t, 0.1);
  if (x.pan) x.pan.pan.setTargetAtTime(r.pan, t, 0.1);
};
function voceRms(an, buf) { an.getByteTimeDomainData(buf); var m = 0; for (var i = 0; i < buf.length; i++) { var s = (buf[i] - 128) / 128; m += s * s; } return Math.sqrt(m / buf.length); }
// quanto forte arriva una voce (dopo il volume), da 0 a circa 1
VoceMixer.prototype.livello = function (id) { var x = this.v[id]; return x ? voceRms(x.an, x.buf) : 0; };
// la mia voce: solo da misurare (non va all'uscita, sennò mi sentirei)
VoceMixer.prototype.ascoltaMio = function (flusso) {
  this.smettiMio();
  try { var src = this.ctx.createMediaStreamSource(flusso), an = this.ctx.createAnalyser(); an.fftSize = 1024; src.connect(an); this.mio = { src: src, an: an, buf: new Uint8Array(an.fftSize) }; } catch (e) { this.mio = null; }
};
VoceMixer.prototype.smettiMio = function () { if (this.mio) { try { this.mio.src.disconnect(); } catch (e) {} this.mio = null; } };
VoceMixer.prototype.livelloMio = function () { return this.mio ? voceRms(this.mio.an, this.mio.buf) : 0; };
VoceMixer.prototype.chiudi = function () {
  var M = this; Object.keys(M.v).forEach(function (id) { M.togli(id); }); M.smettiMio();
  try { M.master.disconnect(); M.comp.disconnect(); } catch (e) {}
};

// =========================================================
//  3. IL TRASPORTO DIRETTO (WebRTC a maglia)
// =========================================================
// Solo audio. Ogni telefono ha un collegamento con ciascuno degli altri. Si usa solo lo STUN di Google per trovarsi (niente TURN:
// su certe reti 4G/5G il collegamento può non riuscire). Offerta e risposta vanno COMPLETE (dentro ci sono i percorsi ICE trovati, niente
// candidati uno per uno): si parte appena c'è un indirizzo pubblico. In ogni coppia propone chi ha l'id che viene prima,
// così le offerte non si incrociano. Il canale audio è sempre «sendrecv»: la mia traccia si mette e si toglie con replaceTrack,
// senza rifare i collegamenti, così si può anche solo ascoltare e accendere il microfono dopo.
var VOCE_ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
var VOCE_PUBBLICO = / typ (srflx|relay) /;   // un percorso ICE con l'indirizzo pubblico
var VOCE_BITRATE = 24000;             // con 10 persone un telefono manda 9 voci: 24 kbit/s bastano per parlare
function voceId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }

// Opus nel testo dell'offerta e della risposta: 24 kbit/s, il silenzio non viaggia (DTX), i pacchetti persi si ricostruiscono (FEC).
// Questi numeri dicono all'altro telefono come mandare: si scrivono su quello che parte e su quello che arriva, così valgono
// tutte e due le direzioni anche se l'altro ha una versione vecchia. Passarci due volte non cambia niente.
function voceOpus(sdp) {
  var m = /a=rtpmap:(\d+) opus\/48000/i.exec(sdp); if (!m) return sdp;
  var riga = new RegExp('a=fmtp:' + m[1] + ' ([^\\r\\n]*)'), vuoi = ['usedtx=1', 'useinbandfec=1', 'maxaveragebitrate=' + VOCE_BITRATE];
  if (riga.test(sdp)) return sdp.replace(riga, function (t, par) {
    return 'a=fmtp:' + m[1] + ' ' + par.split(';').filter(function (x) { return x && !/^\s*(usedtx|useinbandfec|maxaveragebitrate)=/.test(x); }).concat(vuoi).join(';');
  });
  return sdp.replace(new RegExp('(a=rtpmap:' + m[1] + ' opus/48000[^\\r\\n]*(\\r?\\n))', 'i'), function (t, r, a) { return r + 'a=fmtp:' + m[1] + ' ' + vuoi.join(';') + a; });
}

function TrasportoDiretto(o) {
  this.o = o; this.io = o.io; this.sess = o.sess || voceId(); this.pc = {}; this.membri = {}; this.falli = {}; this.attesa = {};
  this.traccia = null; this.chiuso = false; this.visti = {}; this.n = 0;
}
// un diario corto di quello che fa (per capire cosa è successo; chi usa il trasporto può ignorarlo): o.diario(testo)
TrasportoDiretto.prototype.dice = function (t) { if (this.o.diario) this.o.diario(t); };
TrasportoDiretto.prototype.microfono = function (traccia) {
  var X = this; X.traccia = traccia || null;
  Object.keys(X.pc).forEach(function (id) { X.metti(X.pc[id]); });
};
// la mia traccia (o nessuna) sul canale audio di un collegamento
// I messaggi di collegamento viaggiano su canali veloci che ogni tanto ne perdono uno: il primo prende la strada più rapida (il filo, se è aperto);
// se dopo 0,8 s serve ancora, una seconda copia passa dal broker (bis). Chi li riceve scarta il doppione (offerta già vista, risposta quando non la aspetta più).
// (Non prima: con 10 persone sono 45 collegamenti tutti insieme, e dall'host passano tutte le copie.)
// sempre: la seconda copia parte comunque (la risposta a un rinfresco: qui il collegamento può restare «connected» mentre l'altro aspetta, lo stato non dice se è arrivata)
TrasportoDiretto.prototype.invia = function (a, d, pc, sempre) {
  var X = this; X.o.manda(a, d);
  setTimeout(function () {
    if (X.chiuso || (pc && (X.pc[a] !== pc || (d.tipo === 'off' ? pc.signalingState !== 'have-local-offer' : !sempre && pc.connectionState === 'connected')))) return;
    X.o.manda(a, d, true);
  }, 800);
};
TrasportoDiretto.prototype.metti = function (pc) {
  if (!pc.trAudio) return;
  try { var p = pc.trAudio.sender.replaceTrack(this.traccia); if (p && p.catch) p.catch(function () {}); } catch (e) {}
};
// chi c'è adesso in voce (arriva dalla stanza): chiude i collegamenti di chi è uscito e propone quelli che mancano
TrasportoDiretto.prototype.persone = function (lista) {
  var X = this, nuovi = {}; if (X.chiuso) return;
  lista.forEach(function (r) { if (r[0] !== X.io) nuovi[r[0]] = r[1]; });
  X.membri = nuovi;
  Object.keys(X.pc).forEach(function (id) { var pc = X.pc[id]; if (!(id in nuovi) || (pc.suaSess && pc.suaSess !== nuovi[id])) { X.dice('chiudo ' + id + ': ' + (id in nuovi ? 'ha una sessione nuova' : 'non è più in elenco')); X.chiudiPc(id); } });
  Object.keys(nuovi).forEach(function (id) { if (!X.pc[id] && X.io < id && !(X.attesa[id] > Date.now())) X.offri(id); });
};
TrasportoDiretto.prototype.nuovo = function (id, suaSess) {
  var X = this, pc = new RTCPeerConnection({ iceServers: VOCE_ICE });
  pc.suaSess = suaSess; pc.t0 = Date.now(); X.pc[id] = pc;
  pc.tCon = setTimeout(function () { if (X.pc[id] === pc && pc.connectionState !== 'connected') { X.dice(id + ': non si collega, rifaccio'); X.rifai(id); } }, 15000);
  pc.ontrack = function (e) {
    if (X.pc[id] !== pc) return;
    X.o.onFlusso(id, e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]));
  };
  pc.onconnectionstatechange = function () {
    if (X.pc[id] !== pc) return; var s = pc.connectionState;
    X.dice(id + ': ' + s);
    if (s === 'connected') { clearTimeout(pc.tDisc); clearTimeout(pc.tCon); clearTimeout(pc.tRi); pc.tRi = 0; pc.vivo = true; X.falli[id] = 0; X.tetto(pc); X.o.onStato(id, 'connesso'); }
    else if (s === 'disconnected') { clearTimeout(pc.tDisc); X.o.onStato(id, 'instabile'); pc.tDisc = setTimeout(function () { if (X.pc[id] === pc && pc.connectionState !== 'connected') X.rinfresca(id); }, 1500); }
    else if (s === 'failed') X.rinfresca(id);
    else X.o.onStato(id, 'collego');
  };
  return pc;
};
// il tetto dei 24 kbit/s anche sul mittente: vale qualunque cosa dica l'altro telefono
TrasportoDiretto.prototype.tetto = function (pc) {
  var s = pc.trAudio && pc.trAudio.sender; if (!s || !s.getParameters || !s.setParameters) return;
  try {
    var par = s.getParameters(); if (!par.encodings || !par.encodings.length || par.encodings[0].maxBitrate === VOCE_BITRATE) return;
    par.encodings[0].maxBitrate = VOCE_BITRATE;
    var p = s.setParameters(par); if (p && p.catch) p.catch(function () {});
  } catch (e) {}
};
// basta un messaggio solo per parte: si parte appena c'è un indirizzo pubblico, gli altri percorsi non servono. Se non arriva, si aspetta la fine della raccolta (al massimo 2,5 secondi).
// rifatta: dopo un rinfresco la raccolta ricomincia da zero, lo stato «complete» di prima non vale
TrasportoDiretto.prototype.raccolto = function (pc, rifatta) {
  return new Promise(function (r) {
    if (!rifatta && (pc.iceGatheringState === 'complete' || VOCE_PUBBLICO.test(pc.localDescription ? pc.localDescription.sdp : ''))) { r(); return; }
    var t = setTimeout(fine, 2500);
    function fine() { clearTimeout(t); pc.removeEventListener('icecandidate', perCand); pc.removeEventListener('icegatheringstatechange', perStato); r(); }
    function perCand(e) { if (!e.candidate || VOCE_PUBBLICO.test(e.candidate.candidate)) fine(); }
    function perStato() { if (pc.iceGatheringState === 'complete') fine(); }
    pc.addEventListener('icecandidate', perCand); pc.addEventListener('icegatheringstatechange', perStato);
  });
};
TrasportoDiretto.prototype.offri = function (id) {
  var X = this, suaSess = X.membri[id]; if (!suaSess || X.chiuso || !window.RTCPeerConnection) return;
  var pc = X.nuovo(id, suaSess), oid = X.sess + '.' + (++X.n); pc.oid = oid; X.dice('offro a ' + id);
  pc.trAudio = pc.addTransceiver('audio', { direction: 'sendrecv' }); X.metti(pc);
  pc.createOffer().then(function (of) { return pc.setLocalDescription(of); }).then(function () { return X.raccolto(pc); }).then(function () {
    if (X.pc[id] !== pc) return;
    X.invia(id, { tipo: 'off', sdp: voceOpus(pc.localDescription.sdp), oid: oid, sda: X.sess, sa: suaSess }, pc);
    // se la risposta non arriva (messaggio perso) si riprova da capo
    pc.tRis = setTimeout(function () { if (X.pc[id] === pc && pc.signalingState === 'have-local-offer') X.rifai(id); }, 6000);
  }).catch(function () { if (X.pc[id] === pc) X.rifai(id); });
};
// collegamento caduto: prima si cerca un percorso nuovo sullo stesso collegamento (ICE restart): flusso, mixer e audio restano dove sono. Se in 8 secondi non torna, si rifà da capo.
// Propone sempre l'id che viene prima: l'altro glielo chiede. Con una versione vecchia dall'altra parte la richiesta si perde o l'offerta diventa un collegamento nuovo: si finisce da capo come sempre.
TrasportoDiretto.prototype.rinfresca = function (id) {
  var X = this, pc = X.pc[id]; if (X.chiuso || !pc || pc.tRi) return;
  if (!pc.vivo || pc.signalingState !== 'stable' || !X.membri[id]) { X.rifai(id); return; }   // (mai collegato: non c'è niente da rinfrescare)
  X.dice('rinfresco ' + id); X.o.onStato(id, 'instabile'); clearTimeout(pc.tDisc);
  pc.tRi = setTimeout(function () { pc.tRi = 0; if (X.pc[id] === pc && (pc.connectionState !== 'connected' || pc.signalingState !== 'stable')) X.rifai(id); }, 8000);
  if (X.io > id) { X.invia(id, { tipo: 'ri', sda: X.sess, sa: X.membri[id] }, pc); return; }
  var oid = X.sess + '.' + (++X.n);
  pc.createOffer({ iceRestart: true }).then(function (of) { return pc.setLocalDescription(of); }).then(function () { return X.raccolto(pc, true); }).then(function () {
    if (X.pc[id] !== pc) return;
    pc.oid = oid; X.invia(id, { tipo: 'off', sdp: voceOpus(pc.localDescription.sdp), oid: oid, sda: X.sess, sa: X.membri[id], ri: 1 }, pc);
  }).catch(function () { if (X.pc[id] === pc) X.rifai(id); });
};
// il percorso nuovo è arrivato senza mai perdere «connected»: nessun altro segnale dirà che il rinfresco è finito
TrasportoDiretto.prototype.rinfrescato = function (id, pc) {
  if (!pc.tRi || this.pc[id] !== pc || pc.connectionState !== 'connected') return;
  clearTimeout(pc.tRi); pc.tRi = 0; this.o.onStato(id, 'connesso');
};
// il telefono torna dal blocco schermo: quello che è caduto mentre dormiva si riprende subito, e le attese dei tentativi di prima non valgono più
TrasportoDiretto.prototype.risveglia = function () {
  var X = this; if (X.chiuso) return; X.attesa = {}; X.falli = {};
  Object.keys(X.pc).forEach(function (id) { var s = X.pc[id].connectionState; if (s === 'disconnected' || s === 'failed') X.rinfresca(id); });
  Object.keys(X.membri).forEach(function (id) {
    if (X.pc[id]) return;
    if (X.io < id) X.offri(id); else X.invia(id, { tipo: 'rifai', sda: X.sess, sa: X.membri[id], su: 1 });
  });
};
// collegamento perso o mai nato: chi propone riprova; dopo 3 tentativi falliti di fila si ferma per 30 secondi
TrasportoDiretto.prototype.rifai = function (id) {
  var X = this; if (X.chiuso) return;
  X.dice('rifaccio ' + id); X.chiudiPc(id); X.falli[id] = (X.falli[id] || 0) + 1;
  if (X.falli[id] >= 3) { X.falli[id] = 0; X.attesa[id] = Date.now() + 30000; X.o.onStato(id, 'fallito'); return; }
  X.o.onStato(id, 'collego');
  if (X.io < id) setTimeout(function () { if (!X.chiuso && !X.pc[id] && X.membri[id]) X.offri(id); }, 1500);
  else if (X.membri[id]) X.invia(id, { tipo: 'rifai', sda: X.sess, sa: X.membri[id] });   // chi non propone chiede all'altro di rifarlo
};
TrasportoDiretto.prototype.segnale = function (da, d) {
  var X = this; if (X.chiuso || !d || da === X.io || d.sa !== X.sess) return;   // (un messaggio per una mia entrata precedente non vale)
  if (d.tipo === 'off' && typeof d.sdp === 'string' && d.sdp.length < 40000 && d.oid) {
    if (X.visti[d.oid]) return; X.visti[d.oid] = 1;   // (la stessa offerta arrivata due volte vale una)
    X.dice('offerta da ' + da);
    var ks = Object.keys(X.visti); if (ks.length > 40) delete X.visti[ks[0]];
    var pc = X.pc[da];
    if (d.ri && pc && pc.suaSess === d.sda && pc.signalingState === 'stable') { X.rispondi(da, pc, d); return; }   // un rinfresco: lo stesso collegamento, percorso nuovo
    X.chiudiPc(da);
    X.rispondi(da, X.nuovo(da, d.sda), d);
  } else if (d.tipo === 'ris' && typeof d.sdp === 'string' && d.sdp.length < 40000) {
    var p = X.pc[da]; X.dice('risposta da ' + da + (p && p.signalingState === 'have-local-offer' && p.oid === d.oid ? '' : ' (scartata)'));
    if (!p || p.signalingState !== 'have-local-offer' || p.oid !== d.oid) return;
    clearTimeout(p.tRis);
    p.setRemoteDescription({ type: 'answer', sdp: voceOpus(d.sdp) }).then(function () { X.rinfrescato(da, p); }).catch(function () { if (X.pc[da] === p) X.rifai(da); });
  } else if (d.tipo === 'ri') {
    X.dice(da + ' chiede di rinfrescare');
    if (X.io < da) X.rinfresca(da);
  } else if (d.tipo === 'rifai') {
    X.dice(da + ' chiede di rifare');
    if (d.su) delete X.attesa[da];   // (è tornato dal blocco schermo: la pausa dei tentativi falliti non vale più)
    var vecchio = X.pc[da]; if (vecchio && Date.now() - vecchio.t0 < 2500) return;   // (la richiesta è arrivata due volte: ho già ricominciato)
    if (X.io < da && X.membri[da] && !(X.attesa[da] > Date.now())) { X.chiudiPc(da); X.offri(da); }
  }
};
// la risposta a un'offerta: su un collegamento nuovo o, per un rinfresco, su quello che c'è già
TrasportoDiretto.prototype.rispondi = function (da, pc, d) {
  var X = this; pc.oid = d.oid;
  pc.setRemoteDescription({ type: 'offer', sdp: voceOpus(d.sdp) }).then(function () {
    var tr = pc.getTransceivers().filter(function (x) { return x.receiver && x.receiver.track && x.receiver.track.kind === 'audio'; })[0];
    if (tr) { pc.trAudio = tr; try { tr.direction = 'sendrecv'; } catch (e) {} X.metti(pc); }
    return pc.createAnswer();
  }).then(function (a) { return pc.setLocalDescription(a); }).then(function () { return X.raccolto(pc, !!d.ri); }).then(function () {
    if (X.pc[da] !== pc) return;
    X.invia(da, { tipo: 'ris', sdp: voceOpus(pc.localDescription.sdp), oid: d.oid, sda: X.sess, sa: d.sda }, pc, !!d.ri);
    X.rinfrescato(da, pc);
  }).catch(function () { if (X.pc[da] === pc) X.rifai(da); });
};
TrasportoDiretto.prototype.chiudiPc = function (id) {
  var pc = this.pc[id]; if (!pc) return;
  delete this.pc[id]; clearTimeout(pc.tDisc); clearTimeout(pc.tRis); clearTimeout(pc.tCon); clearTimeout(pc.tRi);
  pc.ontrack = null; pc.onconnectionstatechange = null; try { pc.close(); } catch (e) {}
  this.o.onFine(id);
};
TrasportoDiretto.prototype.stati = function () { var X = this, s = {}; Object.keys(X.pc).forEach(function (id) { s[id] = X.pc[id].connectionState; }); return s; };
TrasportoDiretto.prototype.chiudi = function () { var X = this; X.chiuso = true; Object.keys(X.pc).forEach(function (id) { X.chiudiPc(id); }); };

// =========================================================
//  3b. IL PORTALETTERE (solo sul telefono dell'host)
// =========================================================
// Tiene l'elenco di chi è in voce (con un battito ogni 6 secondi: chi tace da 22 secondi esce) e porta i messaggi di collegamento
// da un telefono all'altro. Non conserva niente: i messaggi passano e basta.
//   dal telefono all'host:  { t:'vc', k:'su', sess, mic } · { t:'vc', k:'giu' } · { t:'vc', k:'sig', a:<destinatario>, d:<dati> }
//   dall'host a un telefono: { t:'vc', k:'sig', da:<chi lo manda>, d:<dati> }
//   dall'host a tutti:       { t:'vcl', n:<numero>, l:[[id, sessione], …] }   (l'elenco, ogni volta che cambia e ogni 5 secondi)
// Viaggiano sul filo diretto quando è aperto, sennò dal broker. Due campi facoltativi: g (leggero: col filo aperto il broker non serve),
// b (la seconda copia: passa dal broker anche se il filo c'è, nell'ultimo tratto compreso). Una versione vecchia li ignora.
// o: { invia(a, m) a un telefono, tutti(m, ripetuto) a tutti }   ripetuto: l'elenco non è cambiato, è solo il giro dei 5 secondi
function VoceStanza(o) { this.o = o; this.l = {}; this.n = 0; this.vuoto = true; }
VoceStanza.prototype.arriva = function (da, m) {
  var S = this; if (!m || typeof da !== 'string') return;
  if (m.k === 'su') {
    var sess = String(m.sess || '').slice(0, 24); if (!sess) return;
    var x = S.l[da], nuovo = !x || x.sess !== sess;
    S.l[da] = { sess: sess, t: Date.now(), mic: m.mic ? 1 : 0 };
    if (nuovo) S.manda();
  } else if (m.k === 'giu') { if (S.l[da]) { delete S.l[da]; S.manda(); } }
  else if (m.k === 'sig') {
    var a = String(m.a || '');
    if (!S.l[da] || !S.l[a] || a === da || !m.d || typeof m.d !== 'object') return;   // solo fra chi è in voce
    if (S.o.nota) S.o.nota('porto ' + m.d.tipo + ' da ' + da + ' a ' + a);
    var fuori = { t: 'vc', k: 'sig', da: da, d: m.d }; if (m.b) fuori.b = 1;
    S.o.invia(a, fuori);
  }
};
VoceStanza.prototype.via = function (id) { if (this.l[id]) { delete this.l[id]; this.manda(); } };
// la ripresa: l'elenco per la copia, e dall'elenco di prima si riparte (chi non si rifà vivo esce da solo dopo 22 s, come sempre)
VoceStanza.prototype.elenco = function () { var S = this; return Object.keys(S.l).map(function (id) { return [id, S.l[id].sess, S.l[id].mic]; }); };
VoceStanza.prototype.semina = function (l, tranne) {
  var S = this, ora = Date.now();
  (Array.isArray(l) ? l : []).forEach(function (r) { if (Array.isArray(r) && typeof r[0] === 'string' && typeof r[1] === 'string' && r[0] !== tranne) S.l[r[0]] = { sess: r[1].slice(0, 24), t: ora, mic: r[2] ? 1 : 0 }; });
  S.vuoto = !Object.keys(S.l).length;
};
VoceStanza.prototype.manda = function (ripetuto) {
  var S = this, l = Object.keys(S.l).map(function (id) { return [id, S.l[id].sess]; });
  S.vuoto = !l.length; this.o.tutti({ t: 'vcl', n: ++S.n, l: l }, !!ripetuto);
};
// ogni 5 secondi: toglie chi non dà più segno di vita e rimanda l'elenco (così chi l'ha perso lo ritrova). Se non c'è nessuno, tace.
VoceStanza.prototype.giro = function () {
  var S = this, ora = Date.now();
  Object.keys(S.l).forEach(function (id) { if (ora - S.l[id].t > 22000) delete S.l[id]; });
  if (Object.keys(S.l).length || !S.vuoto) S.manda(true);
};

// =========================================================
//  4. IL COLLEGAMENTO COL GIOCO
// =========================================================
// Il microfono resta sempre acceso, da quando la persona lo permette, e si parla e si ascolta INSIEME (niente turni, niente «premi per parlare»).
// Il solo comando è «Muto». La scelta si ricorda (localStorage 'lt-voce'): la volta dopo la voce si accende al primo tocco nella saletta.
// stato: spenta · accendo (aspetto il permesso) · parlo (microfono acceso) · muto (microfono spento da me) · ascolto (senza microfono: negato o assente)
var VOCE = {
  stato: 'spenta', canale: null, roster: [], sess: '', ctx: null, mixer: null, tr: null, stream: null, traccia: null,
  audio: {}, stati: {}, regole: {}, liv: {}, parla: {}, ascoltatori: [], fonte: null, fonteDi: null, nome: null, avvisa: null,
  storia: [], ioStato: null, battito: 0, timer: null, ultimaMisura: 0, ultimoAvviso: '', ultimoAvvisoT: 0, legato: false,
  vclN: 0, vclT: 0, ctxPausa: false, svegliaT: 0, ridando: false, ridaT: 0
};
var VOCE_MIC = { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false };
// la fabbrica del trasporto: QUI si cambia da WebRTC diretto a LiveKit (domani: return new TrasportoLiveKit(o))
VOCE.nuovoTrasporto = function (o) { return new TrasportoDiretto(o); };
// il diario (gli ultimi 60 fatti), per capire cosa è successo
VOCE.nota = function (t) { this.storia.push(((Date.now() % 100000) / 1000).toFixed(1) + ' ' + t); if (this.storia.length > 60) this.storia.shift(); };
VOCE.cambiato = function () { var V = this; V.ascoltatori = V.ascoltatori.filter(function (f) { try { return f() !== false; } catch (e) { return true; } }); };
VOCE.suCambio = function (f) { this.ascoltatori.push(f); f(); };
// un avviso corto, mai lo stesso due volte di fila a breve
VOCE.dici = function (testo) {
  var V = this, ora = Date.now(); if (V.ultimoAvviso === testo && ora - V.ultimoAvvisoT < 8000) return;
  V.ultimoAvviso = testo; V.ultimoAvvisoT = ora; if (V.avvisa) V.avvisa(testo);
};
// la scelta ricordata: '1' = la voce era accesa, '0' = il microfono era stato negato, null = mai chiesto
VOCE.ricordo = function () { try { return localStorage.getItem('lt-voce'); } catch (e) { return null; } };
VOCE.ricorda = function (v) { try { localStorage.setItem('lt-voce', v); } catch (e) {} };
// al primo tocco nella saletta si accende da sola, a meno che il microfono non sia stato negato (allora c'è solo il tasto «Attiva la voce»)
VOCE.vuoleAuto = function () { return this.stato === 'spenta' && !this.autoProvata && this.ricordo() !== '0'; };
VOCE.nomeDi = function (id) { var n = this.nome ? this.nome(id) : ''; return n && n !== '?' ? n : 'un altro'; };
// c'è una stanza online, e questo telefono sa fare la voce
VOCE.disponibile = function () { return !!(this.canale && window.RTCPeerConnection && (window.AudioContext || window.webkitAudioContext)); };
// la stanza si apre (host o ospite). canale: { io: il mio id, manda(m): porta un messaggio {t:'vc'…} all'host }
VOCE.apri = function (canale) {
  var V = this;
  if (V.canale && V.canale.io !== canale.io) V.chiudiStanza();
  V.canale = canale;
  if (!V.legato && typeof window !== 'undefined') {
    V.legato = true;
    window.addEventListener('pagehide', function (e) { if (!e.persisted) VOCE.esci(); });   // chiudendo la pagina la voce si chiude (se resta in memoria può tornare)
    window.addEventListener('pageshow', function (e) { if (e.persisted) VOCE.riprendi(); });
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') VOCE.riprendi(); });   // tornando sull'app la voce riparte (su iPhone si ferma con lo schermo bloccato)
    // l'audio riparte solo dentro un gesto: su un telefono conta la fine del tocco, non l'inizio
    ['pointerdown', 'pointerup', 'touchend', 'click'].forEach(function (k) { document.addEventListener(k, function () { if (VOCE.stato !== 'spenta') VOCE.riprova(); }, { capture: true, passive: true }); });
  }
  if (window.LT_PROVA) window.LT_VOCE = V.prova();
  V.cambiato();
};
VOCE.chiudiStanza = function () { var V = this; V.esci(); V.canale = null; V.roster = []; V.vclN = 0; V.cambiato(); };
// dalla rete del gioco: l'elenco di chi è in voce, o un messaggio di collegamento da un altro telefono
VOCE.arriva = function (m) {
  var V = this; if (!m || !V.canale) return;
  if (m.t === 'vcl' && Array.isArray(m.l)) {
    // lo stesso elenco può arrivare dal filo e dal broker: un numero già visto non conta (nemmeno se più vecchio: chiuderebbe chi è appena entrato). Solo un host nuovo riparte da 1, e dopo 4 s vale
    var ora = Date.now(); if (m.n != null) { if (m.n <= V.vclN && ora - V.vclT < 4000) return; V.vclN = m.n; V.vclT = ora; }
    V.roster = m.l.filter(function (r) { return Array.isArray(r) && typeof r[0] === 'string' && typeof r[1] === 'string'; });
    if (V.stato === 'spenta') return;
    if (!V.roster.some(function (r) { return r[0] === V.canale.io && r[1] === V.sess; })) V.annuncia();   // l'host non mi ha in elenco: mi rifaccio vivo
    if (V.tr) V.tr.persone(V.roster);
  } else if (m.t === 'vc' && m.k === 'sig' && V.tr && typeof m.da === 'string') { V.nota('arriva ' + (m.d && m.d.tipo) + ' da ' + m.da); V.tr.segnale(m.da, m.d); }
};
// mi faccio vivo con l'host. battito: è solo quello dei 6 secondi, col filo aperto il broker non serve
VOCE.annuncia = function (battito) {
  var V = this; if (!V.canale || V.stato === 'spenta' || V.stato === 'accendo') return;
  var m = { t: 'vc', k: 'su', sess: V.sess, mic: V.traccia ? 1 : 0 }; if (battito) m.g = 1;
  V.battito = Date.now(); V.canale.manda(m);
};
// il tasto principale: spenta → accende (e chiede il microfono); ascolto → prova ad accendere il microfono; parlo/muto → si alterna
VOCE.tocca = function () {
  var V = this;
  if (V.stato === 'spenta') V.entra(true);
  else if (V.stato === 'ascolto') V.accendiMic();
  else if (V.stato === 'parlo' || V.stato === 'muto') {
    V.stato = V.stato === 'parlo' ? 'muto' : 'parlo';
    if (V.traccia) V.traccia.enabled = V.stato === 'parlo';
    V.cambiato();
  }
};
// il tasto piccolo: da spenta «solo ascolto», altrimenti «esci dalla voce»
VOCE.secondo = function () { if (this.stato === 'spenta') this.entra(false); else this.esci(); };
// Va chiamata DENTRO il tocco dell'utente: su iPhone l'audio parte solo da lì.
VOCE.entra = function (conMic) {
  var V = this; if (V.stato !== 'spenta' || !V.canale) return;
  V.autoProvata = true;   // (chiesta una volta: il tocco automatico non insiste)
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !window.RTCPeerConnection) { V.dici('Voce: qui non funziona'); return; }
  try { if (!V.ctx) { V.ctx = new AC(); V.ctx.onstatechange = function () { VOCE.statoAudio(); }; } if (V.ctx.state !== 'running') V.ctx.resume(); } catch (e) { V.dici('Voce: audio non disponibile'); return; }
  V.stato = 'accendo'; V.cambiato();
  if (conMic) V.chiediMic(function (st) { V.avvia(st); }); else V.avvia(null);
};
// il permesso e il microfono (da chiamare dentro il tocco); se non va, va avanti senza
VOCE.chiediMic = function (fatto) {
  var V = this, md = navigator.mediaDevices;
  if (!md || !md.getUserMedia) { V.dici('Voce: qui il microfono non va'); fatto(null); return; }
  md.getUserMedia(VOCE_MIC)
    .then(fatto)
    .catch(function (e) { var neg = e && (e.name === 'NotAllowedError' || e.name === 'SecurityError'); if (neg) V.ricorda('0'); V.dici(neg ? 'Voce: microfono non permesso' : 'Voce: microfono non disponibile'); fatto(null); });
};
VOCE.avvia = function (st) {
  var V = this;
  if (V.stato !== 'accendo') { if (st) st.getTracks().forEach(function (t) { t.stop(); }); return; }   // nel frattempo ho cambiato idea
  V.sess = voceId();
  V.mixer = new VoceMixer(V.ctx);
  V.tr = V.nuovoTrasporto({
    io: V.canale.io, sess: V.sess,
    manda: function (a, d, bis) { if (V.canale) { V.canale.manda(bis ? { t: 'vc', k: 'sig', a: a, d: d, b: 1 } : { t: 'vc', k: 'sig', a: a, d: d, g: 1 }); V.nota('mando ' + d.tipo + ' a ' + a + ' (' + (d.sdp ? d.sdp.length : 0) + ' car.)' + (bis ? ' copia' : '')); } },
    onFlusso: function (id, flusso) { V.flusso(id, flusso); },
    onFine: function (id) { V.fineFlusso(id); },
    diario: function (t) { V.nota(t); },
    onStato: function (id, s) { V.stati[id] = s; if (s === 'fallito') V.dici('Voce: con ' + V.nomeDi(id) + ' non si collega'); V.cambiato(); }
  });
  V.mettiMic(st);
  V.stato = V.traccia ? 'parlo' : 'ascolto';
  if (V.traccia) V.ricorda('1');
  V.annuncia();
  clearInterval(V.timer); V.timer = setInterval(function () { VOCE.giro(); }, 100);
  if (V.roster.length) V.tr.persone(V.roster);
  V.cambiato();
};
// il mio microfono (o nessuno): lo sentono tutti i collegamenti, anche quelli già aperti
VOCE.mettiMic = function (st) {
  var V = this;
  if (V.stream && V.stream !== st) V.stream.getTracks().forEach(function (t) { t.stop(); });
  V.stream = st || null; V.traccia = st ? st.getAudioTracks()[0] || null : null;
  if (V.traccia) { V.traccia.enabled = true; V.traccia.addEventListener('ended', function () { if (VOCE.traccia === this && document.visibilityState === 'visible') VOCE.ridaiMic(); }); }   // (a schermo bloccato ci pensa riprendi, al ritorno)
  if (V.mixer) { if (st) V.mixer.ascoltaMio(st); else V.mixer.smettiMio(); }
  if (V.tr) V.tr.microfono(V.traccia);
};
VOCE.microfonoPerso = function () {
  var V = this; if (V.stato !== 'parlo' && V.stato !== 'muto') return;
  V.mettiMic(null); V.stato = 'ascolto'; V.dici('Voce: microfono staccato'); V.annuncia(); V.cambiato();
};
// il microfono si è fermato da solo (schermo bloccato, telefonata): si richiede senza disturbare e sugli stessi collegamenti. Solo se non torna si resta in ascolto
VOCE.ridaiMic = function () {
  var V = this, ora = Date.now(), md = navigator.mediaDevices;
  if (V.ridando || (V.stato !== 'parlo' && V.stato !== 'muto')) return;
  if (!md || !md.getUserMedia || ora - V.ridaT < 5000) { V.microfonoPerso(); return; }   // (appena richiesto e già fermo: non si insiste)
  V.ridando = true; V.ridaT = ora; V.nota('richiedo il microfono');
  md.getUserMedia(VOCE_MIC).then(function (st) {
    V.ridando = false;
    if (V.stato !== 'parlo' && V.stato !== 'muto') { st.getTracks().forEach(function (t) { t.stop(); }); return; }
    V.mettiMic(st); if (V.traccia) V.traccia.enabled = V.stato === 'parlo';
    V.annuncia(); V.cambiato();
  }).catch(function () { V.ridando = false; V.microfonoPerso(); });
};
VOCE.accendiMic = function () {
  var V = this; if (V.stato !== 'ascolto') return;
  V.chiediMic(function (st) {
    if (!st || V.stato !== 'ascolto') { if (st) st.getTracks().forEach(function (t) { t.stop(); }); return; }
    V.mettiMic(st); V.stato = 'parlo'; V.ricorda('1'); V.annuncia(); V.cambiato();
  });
};
VOCE.esci = function () {
  var V = this; if (V.stato === 'spenta') return;
  var eraIn = V.stato !== 'accendo';
  V.stato = 'spenta'; clearInterval(V.timer); V.timer = null;
  if (eraIn && V.canale) { try { V.canale.manda({ t: 'vc', k: 'giu' }); } catch (e) {} }
  if (V.tr) { V.tr.chiudi(); V.tr = null; }
  V.mettiMic(null);
  if (V.mixer) { V.mixer.chiudi(); V.mixer = null; }
  Object.keys(V.audio).forEach(function (id) { V.fineFlusso(id); });
  V.stati = {}; V.regole = {}; V.liv = {}; V.parla = {}; V.ctxPausa = false;
  try { if (V.ctx && V.ctx.state === 'running') V.ctx.suspend(); } catch (e) {}
  V.cambiato();
};
// arriva la voce di qualcuno: un <audio> muto resta collegato (a Chrome serve per far scorrere il flusso), il suono esce dal mixer
VOCE.flusso = function (id, flusso) {
  var V = this; if (V.stato === 'spenta' || !V.mixer) return;
  var a = V.audio[id];
  if (!a) { a = document.createElement('audio'); a.autoplay = true; a.muted = true; a.setAttribute('playsinline', ''); a.dataset.voce = id; a.style.display = 'none'; document.body.appendChild(a); V.audio[id] = a; }
  a.srcObject = flusso;
  var p = a.play(); if (p && p.catch) p.catch(function () { /* riprova al tocco successivo (VOCE.riprova) */ });
  try { V.mixer.aggiungi(id, flusso); } catch (e) { V.dici('Voce: con ' + V.nomeDi(id) + ' non si sente'); }
  V.regola();
};
VOCE.fineFlusso = function (id) {
  var V = this, a = V.audio[id];
  if (a) { try { a.pause(); } catch (e) {} a.srcObject = null; a.remove(); delete V.audio[id]; }
  if (V.mixer) V.mixer.togli(id);
  delete V.regole[id]; delete V.liv[id]; delete V.parla[id];
};
// l'orologio dell'audio riparte. Su iPhone oltre a «suspended» c'è «interrupted» (schermo bloccato, telefonata); fuori da un gesto può non riuscire, e ci riprova il tocco dopo
VOCE.sveglia = function () {
  var c = this.ctx; if (!c || c.state === 'running' || c.state === 'closed') return;
  try { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
};
// al tocco o quando la pagina torna visibile: l'audio fermo riparte
VOCE.riprova = function () {
  var V = this; V.sveglia();
  Object.keys(V.audio).forEach(function (id) { var a = V.audio[id]; if (a.paused && a.srcObject) { var p = a.play(); if (p && p.catch) p.catch(function () {}); } });
};
// l'audio torna dopo una pausa: su iPhone le voci già collegate possono restare mute, si ricollegano al mixer (il volume giusto arriva dal giro dopo)
VOCE.statoAudio = function () {
  var V = this, s = V.ctx ? V.ctx.state : ''; if (!V.mixer) return;
  if (s !== 'running') { V.ctxPausa = true; return; }
  if (!V.ctxPausa) return; V.ctxPausa = false; V.nota('audio ripartito');
  Object.keys(V.audio).forEach(function (id) { var fl = V.audio[id].srcObject; if (fl) try { V.mixer.aggiungi(id, fl); } catch (e) {} });
  if (V.stream) V.mixer.ascoltaMio(V.stream);
  V.regola();
};
// il telefono torna sull'app: audio, microfono, posto nell'elenco, collegamenti caduti. Non chiede niente a chi guarda lo schermo
VOCE.riprendi = function () {
  var V = this; if (V.stato === 'spenta' || V.stato === 'accendo') return;
  V.riprova(); V.annuncia();
  if (V.traccia && V.traccia.readyState === 'ended') V.ridaiMic();
  else if (V.traccia && V.traccia.muted) setTimeout(function () { if (V.traccia && V.traccia.muted && document.visibilityState === 'visible') V.ridaiMic(); }, 1500);   // (iPhone: traccia viva ma muta dopo il blocco)
  if (V.tr && V.tr.risveglia) V.tr.risveglia();
};
// il giro da 10 al secondo: regola volumi, battito, orologio dell'audio
VOCE.giro = function () {
  var V = this; if (V.stato === 'spenta') return;
  var ora = Date.now();
  if (ora - V.battito > 6000) V.annuncia(true);
  if (ora - V.svegliaT > 1000 && (typeof document === 'undefined' || document.visibilityState === 'visible')) { V.svegliaT = ora; V.sveglia(); }
  V.regola();
};
// applica la regola a ogni voce (chi sente chi lo dice la foto del gioco; senza gioco aperto si sentono tutti)
VOCE.regola = function () {
  var V = this; if (!V.mixer) return;
  var S = V.fonte ? V.fonte() : null;
  V.ioStato = S ? S.io : null;   // (come sto io: lo legge misura(), che gira molto più spesso)
  Object.keys(V.mixer.v).forEach(function (id) {
    var r = S ? voceRegola(S.fase, S.M, S.io, S.altri[id]) : { vol: 1, taglio: VOCE_APERTO, pan: 0, k: 1 };
    V.regole[id] = r; V.mixer.regola(id, r);
  });
};
// chi sta parlando adesso (per gli anelli): si chiama a ogni fotogramma, ma lavora al massimo ogni 33 ms.
// liv: 0..1 (si smorza piano), parla: sopra la soglia
VOCE.misura = function (ora) {
  var V = this; if (V.stato === 'spenta' || !V.mixer || ora - V.ultimaMisura < 33) return;
  V.ultimaMisura = ora;
  function aggiorna(id, rms, sorda) {
    var l = sorda ? 0 : Math.min(1, rms / 0.1), p = V.liv[id] || 0;
    p = l > p ? l : p * 0.86; V.liv[id] = p; V.parla[id] = p > 0.12;
  }
  Object.keys(V.mixer.v).forEach(function (id) { aggiorna(id, V.mixer.livello(id), false); });
  if (V.canale) {
    var io = V.canale.io, zitto = V.stato !== 'parlo' || (V.ioStato && V.ioStato.muto);
    aggiorna(io, zitto ? 0 : V.mixer.livelloMio(), zitto);
  }
};
// per le prove a schermo: i numeri veri di quello che sta succedendo
VOCE.prova = function () {
  var V = this;
  return {
    stato: function () { return V.stato; },
    stati: function () { return V.tr ? V.tr.stati() : {}; },
    roster: function () { return V.roster; },
    tracce: function () { return Object.keys(V.audio).filter(function (id) { var s = V.audio[id].srcObject; return s && s.getAudioTracks().length > 0; }); },
    mic: function () { return V.traccia ? { attiva: V.traccia.enabled, stato: V.traccia.readyState, eco: (V.traccia.getSettings ? V.traccia.getSettings() : {}).echoCancellation } : null; },
    esci: function () { V.esci(); },   // (solo per le prove: il gioco non ha più un tasto «Esci dalla voce»)
    regole: function () { var o = {}; Object.keys(V.regole).forEach(function (id) { o[id] = V.regole[id]; }); return o; },
    gain: function () {
      var o = {}; if (!V.mixer) return o;
      Object.keys(V.mixer.v).forEach(function (id) { var x = V.mixer.v[id]; o[id] = { vol: x.gan.gain.value, taglio: x.fil.frequency.value, pan: x.pan ? x.pan.pan.value : 0 }; });
      return o;
    },
    livelli: function () { return { liv: V.liv, parla: V.parla, mio: V.mixer ? V.mixer.livelloMio() : 0 }; },
    ricordo: function () { return V.ricordo(); },
    audio: function () { return V.ctx ? { stato: V.ctx.state, t: V.ctx.currentTime } : null; },
    storia: function () { return V.storia.slice(); },
    guasto: function (id) { if (V.tr) V.tr.o.onStato(id, 'fallito'); },   // (solo per provare l'avviso «non si collega»)
    trasporto: function () { return V.tr; }, ctx: function () { return V.ctx; }, traccia: function () { return V.traccia; },
    elementi: function () { return Object.keys(V.audio).map(function (id) { var a = V.audio[id]; return { id: id, muto: a.muted, paused: a.paused, autoplay: a.autoplay, playsinline: a.hasAttribute('playsinline') }; }); }
  };
};

// ===== gioco.js =====
// Lanterne dentro SPeeD GAME. Parte dal modello del progetto (.agents/skills/nuovo-gioco/modello-gioco-online.js):
// l'host tiene la partita vera (Partita) e manda a tutti la foto (vm) e le posizioni; gli altri mandano solo mosse e posizione.







var ID = "lanterne";
var MIN = 4, MAX = 10;
var RIEMPI = 6;   // in prova: con pochi amici la saletta si riempie da sola coi Bot fino a 6 (escono man mano che arriva gente)
// Per ora Lanterne è in prova: la stanza la aprono solo questi account; tutti gli altri entrano solo se invitati.
var AMMESSI = ["IL PAPPONE", "GAY", "MARIO"];
function nomeAccount() { try { var p = window.SGNube && SGNube.profilo && SGNube.profilo(); return String((p && p.nome) || "").trim().toUpperCase(); } catch (e) { return ""; } }
function ammesso() { return AMMESSI.indexOf(nomeAccount()) >= 0; }
// la chat di prossimità: frasi a un tocco (poche e brevi) e quanti messaggi tiene lo storico
var PARLA_RAPIDE = ["Ciao!", "Dove sei?", "Seguimi", "Aiuto!", "Occhio!"];
var PARLA_STORICO = 4;
var AVVIO_MAX = 18000;   // al massimo, quanto aspetta la partita chi ha il telefono lento (poi si parte lo stesso: dove manca un pezzo si vede l'anteprima, o il disegno a codice se manca anche quella)
var RESPIRO = 5000;      // l'host riprende: da quando è di nuovo sul broker la partita sta ferma al massimo così, mentre gli ospiti tornano
var TACE_MS = 8000;      // da quanto non si sentono le posizioni dell'host prima di dirlo sullo schermo
var RITARDATARI = "partita";   // chi arriva a partita cominciata la guarda ed entra alla prossima
function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }

// I lenzuoli: ognuno ha il suo colore, lo decide l'host e viaggia nella foto (mai nelle posizioni).
// Valgono i dodici a tinta unita del modulo: i tre a disegno e il campo m restano per quando si potrà personalizzare il telo.
var LENZ_N = 12;
var LENZ_DI = {}, COLORI_DI = {};   // id → { c, m } e id → colore, dall'ultima foto dell'host
var RITR = {}, RITR_C = [];         // i ritratti del Registro, uno per colore
function lenzValido(x) { var c = x && x.c; return typeof c === "number" && c >= 0 && c < LENZ_N && c === Math.floor(c) ? { c: c, m: null } : null; }
function lenzMio() { try { var v = localStorage.getItem("lt-lenz"); return v == null || v === "" ? null : lenzValido({ c: +v }); } catch (e) { return null; } }
var NOMI_COLORE = LENZUOLI.map(function (L) { return L.n; }).concat(["Rosa", "Bianca", "Bianco", "Giallo", "Azzurra", "Azzurro", "Marrone", "Arancio", "Celeste", "Ambra", "Rubino", "Viola", "Lilla", "Perla", "Smeralda"]);
function lenzRicorda(c) { try { localStorage.setItem("lt-lenz", String(c)); } catch (e) {} }
function liberoLenz(presi) { var c = teloLibero(presi); return c < LENZ_N ? c : presi.length % LENZ_N; }
// le partite salvate prima del lenzuolo, o con numeri strani: ognuno ne ha uno, senza doppioni
function lenzInOrdine(lista) {
  var presi = [];
  lista.forEach(function (p) { var v = lenzValido(p.lenz) || lenzValido({ c: p.telo }); if (v && presi.indexOf(v.c) >= 0) v = null; p.lenz = v; if (v) presi.push(v.c); delete p.telo; });
  lista.forEach(function (p) { if (!p.lenz) { p.lenz = { c: liberoLenz(presi), m: null }; presi.push(p.lenz.c); } });
}
// quello che arriva con la foto dell'host non è detto che sia giusto: si tiene solo un colore vero. Un telo, una tinta sola ovunque: dove il Nero sparirebbe, orme e plastico gli mettono attorno il filo chiaro di orloTinta
function notaLenz(players) {
  (players || []).forEach(function (p, i) {
    var d = lenzValido(p.lenz) || lenzValido({ c: p.telo }) || LENZ_DI[p.id] || { c: i % LENZ_N, m: null }, L = LENZUOLI[d.c];
    LENZ_DI[p.id] = d; COLORI_DI[p.id] = L.b; ritrattoDopo(d.c);
  });
}
function orloTinta(col) { var L = LENZUOLI.filter(function (x) { return x.b === col && x.fori; })[0]; return L ? L.l : null; }
function panno(id) { return LENZUOLI[(LENZ_DI[id] || { c: 0 }).c]; }
// il mezzo busto del Registro: si prepara con calma, a uno a uno, così la riunione si apre senza strappi
function ritrattoUrl(c) { if (RITR[c] == null) { try { RITR[c] = ritrattoLenzuolo(c, 168).toDataURL(); } catch (e) { RITR[c] = ""; } } return RITR[c]; }
function ritrattoDopo(c) { if (RITR[c] != null || RITR_C.indexOf(c) >= 0) return; RITR_C.push(c); if (RITR_C.length === 1) setTimeout(ritrattiGiro, 400); }
function ritrattiGiro() { if (!RITR_C.length) return; ritrattoUrl(RITR_C[0]); RITR_C.shift(); if (RITR_C.length) setTimeout(ritrattiGiro, 160); }
// la figura intera, ferma: per la scena della morte e per le foto dall'aldilà. Una canvas per colore
var FIGURE = {};
function figuraTelo(c) {
  if (FIGURE[c]) return FIGURE[c];
  var S = 3, cv = document.createElement("canvas"), l = new Lenzuolo({ c: c }, { seme: c }); cv.width = 112 * S; cv.height = 84 * S;
  l.pronto = true; l.corpo(); l.disegna(cv.getContext("2d"), { x: cv.width * 0.44, y: 76 * S, scala: S, ombra: false, t: 0, fine: true });
  FIGURE[c] = cv; return cv;
}

// gli avatar disegnati una volta sola (davanti, di spalle, busto per la riunione)
var AVATAR = {};
function avatarDi(id, cfg) {
  if (!cfg || !window.SGOmino || !SGOmino.svg) return AVATAR[id] || null;
  var k = JSON.stringify(cfg);
  if (AVATAR[id] && AVATAR[id].k === k) return AVATAR[id];
  function img(o) { var i = new Image(); try { i.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, o)); } catch (e) {} return i; }
  AVATAR[id] = { k: k, img: img({}), imgS: img({ spalle: true }), busto: img({ busto: true }) };
  return AVATAR[id];
}
var PENDENTI = { priv: null, tp: null };   // messaggi arrivati prima che la schermata di gioco ci sia

// suoni fatti al momento (niente file): partono dal primo tocco, si spengono col tasto 🔊
var AUDIO = { ctx: null, muto: false };
try { AUDIO.muto = localStorage.getItem("lt-muto") === "1"; } catch (e) {}
function audio() { if (AUDIO.muto) return null; try { if (!AUDIO.ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AUDIO.ctx = new C(); } if (AUDIO.ctx.state === "suspended") AUDIO.ctx.resume(); return AUDIO.ctx; } catch (e) { return null; } }
function nota(f, dur, tipo, vol, quando, f2) {
  var a = audio(); if (!a) return;
  var t0 = a.currentTime + (quando || 0), o = a.createOscillator(), g = a.createGain();
  o.type = tipo || "sine"; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
function soffio(dur, vol, quando, freq) {
  var a = audio(); if (!a) return;
  var t0 = a.currentTime + (quando || 0), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  var s = a.createBufferSource(); s.buffer = b; var fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = freq || 900;
  var g = a.createGain(); g.gain.value = vol || 0.2; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t0);
}
var SUONO = {
  compito: function () { nota(660, 0.12, "triangle", 0.12); nota(990, 0.22, "triangle", 0.12, 0.09); },
  spegni: function () { soffio(0.5, 0.35, 0, 500); nota(160, 0.5, "sine", 0.2, 0, 60); },
  campana: function () { [0, 0.45].forEach(function (q) { nota(784, 1.2, "sine", 0.16, q); nota(1176, 0.9, "sine", 0.07, q); nota(392, 1.4, "sine", 0.06, q); }); },
  corpo: function () { nota(440, 0.18, "sawtooth", 0.08); nota(415, 0.18, "sawtooth", 0.08, 0.16); nota(311, 0.6, "sawtooth", 0.08, 0.32); },
  allarme: function () { for (var i = 0; i < 4; i++) nota(i % 2 ? 330 : 247, 0.32, "square", 0.045, i * 0.34); },
  abil: function () { nota(523, 0.2, "sine", 0.1); nota(784, 0.3, "sine", 0.08, 0.08); },
  voto: function (q) { nota(880, 0.08, "triangle", 0.07, q || 0); },
  sigillo: function () { nota(150, 0.09, "triangle", 0.2, 0, 70); soffio(0.05, 0.12, 0, 1100); },
  esce: function () { nota(600, 1.1, "sine", 0.12, 0, 150); soffio(0.8, 0.1, 0.1, 1500); },
  vince: function () { [523, 659, 784, 1046].forEach(function (f, i) { nota(f, 0.45, "triangle", 0.12, i * 0.13); }); },
  perde: function () { [392, 330, 262].forEach(function (f, i) { nota(f, 0.55, "triangle", 0.1, i * 0.2); }); },
  luci: function () { nota(392, 0.15, "triangle", 0.1); nota(784, 0.3, "triangle", 0.1, 0.1); },
  ruolo: function () { nota(330, 0.5, "sine", 0.1); nota(494, 0.7, "sine", 0.08, 0.2); }
};
function vibra(ms) { try { if (!AUDIO.toccato) return; if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

// =========================================================
//  HOST: tiene la partita vera
// =========================================================
// ----- il filo diretto fra telefoni -----
// I messaggi della partita passano dai broker pubblici: su HiveMQ vanno bene, su EMQX (chi ci finisce perché HiveMQ tarda) si sono visti buchi fino a 2 s.
// Fra l'host e ogni ospite si apre anche un canale WebRTC di soli dati: niente server, niente microfono. Quello che passa da lì arriva prima;
// il broker resta sempre acceso e chi riceve un messaggio due volte tiene il primo (numero u). Se il canale non si apre, non cambia niente.
var FILO_ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];
function FiloDiretto(manda, arriva) { this.manda = manda; this.arriva = arriva; this.pc = null; this.ch = null; this.coda = []; this.t0 = Date.now(); this.giuDa = 0; this.o = null; }
FiloDiretto.prototype.pronto = function () { var p = this.pc, st = p && p.iceConnectionState; return !!(this.ch && this.ch.readyState === "open" && (st === "connected" || st === "completed")); };
// si rifà il filo? Aperto mai. Se è caduto, passati 1,5 s (un buco breve si riprende da solo). Se la risposta non è arrivata un messaggio si è perso sul broker:
// si riprova presto e poi sempre più di rado, fino a 60 s (certe reti mobili non lo aprono mai). Con la risposta in mano i telefoni si stanno cercando: non si interrompono.
FiloDiretto.prototype.daRifare = function (n) {
  if (this.pronto()) return false;
  var ora = Date.now(), attesa = Math.min(2500 * Math.pow(2, Math.max(0, n - 1)), 60000);
  if (this.giuDa) return ora - this.giuDa >= 1500;
  if (this.pc && this.pc.signalingState === "stable") attesa = Math.max(attesa, 12000);
  return ora - this.t0 >= attesa;
};
FiloDiretto.prototype.lega = function (ch) {
  var F = this; F.ch = ch;
  ch.onopen = function () { if (window.LT_PROVA) window.LT_DIRETTO = (window.LT_DIRETTO || 0) + 1; if (F.aperto) F.aperto(); };
  ch.onclose = function () { if (F.ch === ch && F.caduto) F.caduto(); };
  ch.onmessage = function (e) { var m = null; try { m = JSON.parse(e.data); } catch (_) {} if (m) F.arriva(m); };
};
// ogni messaggio dice di quale tentativo è (o): la risposta a un'offerta di prima, arrivata tardi, non deve finire sul filo nuovo. Chi ha una versione vecchia non lo ripete, e va bene lo stesso
FiloDiretto.prototype.dai = function (s) { if (this.o != null) s.o = this.o; this.manda(s); };
FiloDiretto.prototype.crea = function () {
  var F = this, pc = new RTCPeerConnection({ iceServers: FILO_ICE }); F.pc = pc; F.t0 = Date.now(); F.giuDa = 0;
  if (window.LT_PROVA) (window.LT_FILI = window.LT_FILI || []).push(F);
  pc.onicecandidate = function (e) { if (e.candidate && F.detto === pc) F.dai({ c: e.candidate }); };   // (quelli di prima sono già dentro l'offerta: un messaggio solo sul broker)
  pc.oniceconnectionstatechange = function () {
    if (F.pc !== pc) return;
    var st = pc.iceConnectionState;
    if (st === "disconnected") F.giuDa = F.giuDa || Date.now();
    else if (st === "connected" || st === "completed") F.giuDa = 0;
    else if (st === "failed" && F.caduto) F.caduto();
  };
  return pc;
};
// l'offerta e la risposta partono con gli indirizzi già dentro (si aspettano al massimo 1,2 s): meno messaggi sul broker, meno che se ne perda uno
FiloDiretto.prototype.dopoIndirizzi = function (pc, fatto) {
  var una = false, via = function () { if (una) return; una = true; fatto(); };
  if (pc.iceGatheringState === "complete") return via();
  pc.addEventListener("icegatheringstatechange", function () { if (pc.iceGatheringState === "complete") via(); });
  setTimeout(via, 1200);
};
FiloDiretto.prototype.dici = function (pc) { if (this.pc === pc) { this.detto = pc; this.dai({ d: pc.localDescription }); } };
FiloDiretto.prototype.offri = function () {
  var F = this, pc = F.crea();
  F.lega(pc.createDataChannel("lt", { ordered: false, maxRetransmits: 0 }));
  pc.createOffer().then(function (o) { return pc.setLocalDescription(o); }).then(function () { F.dopoIndirizzi(pc, function () { F.dici(pc); }); }).catch(function () { F.chiudi(); });
};
FiloDiretto.prototype.segnale = function (s) {
  var F = this, offerta = !!(s.d && s.d.type === "offer");
  if (offerta) F.o = s.o != null ? s.o : null;
  else if (s.o != null && F.o != null && s.o !== F.o) return;   // è del tentativo di prima
  if (s.d) {
    if (offerta) { var c = F.coda; F.chiudi(); F.coda = c; F.crea().ondatachannel = function (e) { F.lega(e.channel); }; }
    var pc = F.pc; if (!pc) return;
    pc.setRemoteDescription(s.d).then(function () {
      F.coda.splice(0).forEach(function (q) { pc.addIceCandidate(q).catch(function () {}); });
      if (!offerta) return;
      return pc.createAnswer().then(function (a) { return pc.setLocalDescription(a); }).then(function () { F.dopoIndirizzi(pc, function () { F.dici(pc); }); });
    }).catch(function () { F.chiudi(); });
  } else if (s.c) {
    if (F.pc && F.pc.remoteDescription) F.pc.addIceCandidate(s.c).catch(function () {}); else F.coda.push(s.c);
  }
};
FiloDiretto.prototype.invia = function (tx) { if (this.pronto()) try { this.ch.send(tx); } catch (e) {} };
FiloDiretto.prototype.chiudi = function () { try { if (this.ch) this.ch.close(); if (this.pc) this.pc.close(); } catch (e) {} this.ch = null; this.pc = null; this.coda = []; };

// ----- i messaggi privati sul broker -----
// Sul broker legge chiunque conosca il codice della stanza. Ruolo, compiti, avvisi privati e mosse non ci passano in chiaro: ogni ospite e l'host si fanno una chiave (ECDH P-256, WebCrypto)
// e con quella cifrano in AES-GCM (anche i messaggi per aprire il filo diretto, che hanno dentro gli indirizzi dei telefoni). Niente server: l'host mette la sua parte pubblica in ogni foto (ck), l'ospite nel «join» (ck, e un messaggio «ck» se serve ridirla).
// Chi non manda la chiave ha una versione vecchia, o un telefono senza crypto.subtle (c'è solo su https e localhost): per lui resta il chiaro di sempre, e il suo ruolo resta leggibile.
// Chi la manda non riceve mai niente in chiaro, nemmeno se la chiave è in ritardo: si aspetta. Sul filo diretto non serve, è già cifrato da WebRTC. La voce resta fuori.
// Il messaggio cifrato è { t: "z", c, to } e fuori si legge solo a chi va, come prima. La lunghezza dice poco: i testi si riempiono di spazi fino a un blocco (privati 512, il resto 128 byte).
// Protegge da chi ascolta il broker, non da chi fa da host né da chi inietta messaggi falsi: per quello servirebbe un server.
var CIF = { pub: null, priv: null, fatto: false, avvio: null };
var CIF_PRIV = 512, CIF_ALTRI = 128, CIF_ATTESA = 12000;   // (quanto resta buono un messaggio fermo per una chiave in ritardo: dopo vale meno di quello che è successo intanto)
function cifB64(u) { var s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
function cifByte(b) { var s = atob(b), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
function cifTesto(s) { return new TextEncoder().encode(s); }
function cifConta(k, t0) { if (!window.LT_PROVA) return; var c = window.LT_CIF = window.LT_CIF || { n: {}, ms: {} }; c.n[k] = (c.n[k] || 0) + 1; if (t0 != null) { c.ms[k] = (c.ms[k] || 0) + performance.now() - t0; } }
// la chiave comune, uguale sui due telefoni: hp e op sono le parti pubbliche di host e ospite, «loro» quella dell'altro
function cifDeriva(hp, op, loro) {
  var s = crypto.subtle, t0 = performance.now();
  return Promise.resolve().then(function () { return s.importKey("raw", cifByte(loro), { name: "ECDH", namedCurve: "P-256" }, false, []); })   // (una chiave rotta non deve fermare chi la riceve)
    .then(function (k) { return s.deriveBits({ name: "ECDH", public: k }, CIF.priv, 256); })
    .then(function (b) { return s.importKey("raw", b, "HKDF", false, ["deriveKey"]); })
    .then(function (b) { return s.deriveKey({ name: "HKDF", hash: "SHA-256", salt: cifTesto("lanterne"), info: cifTesto(hp + "|" + op) }, b, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]); })
    .then(function (k) { cifConta("chiave", t0); return k; });
}
// lato: a chi va, così un messaggio non vale nell'altro verso né per un altro ospite
function cifChiudi(k, tx, lato, blocco) {
  var t = cifTesto(tx), b = new Uint8Array(Math.ceil(t.length / blocco) * blocco), iv = crypto.getRandomValues(new Uint8Array(12)), t0 = performance.now();
  b.fill(32); b.set(t);
  return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: cifTesto(lato) }, k, b).then(function (c) {
    var u = new Uint8Array(12 + c.byteLength); u.set(iv); u.set(new Uint8Array(c), 12);
    var z = cifB64(u); cifConta("chiudi", t0); return z;
  });
}
function cifApri(k, tx, lato) {
  var u = cifByte(tx), t0 = performance.now();
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: u.subarray(0, 12), additionalData: cifTesto(lato) }, k, u.subarray(12)).then(function (b) {
    var m = JSON.parse(new TextDecoder().decode(b)); cifConta("apri", t0); return m;
  });
}
// appena caricato il gioco: la coppia di chiavi di questa pagina e una prova completa su se stessa. Se un passo non riesce CIF.pub resta vuoto e il telefono si comporta come una versione vecchia
CIF.avvio = (function () {
  function fine() { CIF.fatto = true; }
  try {
    if (window.LT_PROVA && window.LT_NOCIF) throw 0;   // (solo per le prove: un telefono senza crypto.subtle)
    if (!window.crypto || !crypto.subtle || !window.TextEncoder || !window.TextDecoder) throw 0;
    return crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]).then(function (c) {
      CIF.priv = c.privateKey;
      return crypto.subtle.exportKey("raw", c.publicKey).then(function (r) {
        var pub = cifB64(new Uint8Array(r));
        return cifDeriva(pub, pub, pub)
          .then(function (k) { return cifChiudi(k, "{\"a\":1}", "x", 16).then(function (z) { return cifApri(k, z, "x"); }); })
          .then(function (m) { if (m && m.a === 1) CIF.pub = pub; });
      });
    }).then(fine, fine);
  } catch (e) { fine(); return Promise.resolve(); }
})();
function cifPronta(f) { if (CIF.fatto) f(); else CIF.avvio.then(f); }
// la copia della partita per i vice (solo con l'host di riserva acceso): ha dentro tutti i ruoli e passa dal broker, quindi viaggia chiusa con una chiave di partita (CIF.kp)
// che l'host dà solo ai vice, dentro i loro privati. Chi prende il posto la apre: se non può, si riparte dalla saletta
function cifCopia(fatto) {
  if (CIF.kpK) return fatto(CIF.kpK);
  if (!CIF.kp) CIF.kp = cifB64(crypto.getRandomValues(new Uint8Array(32)));
  crypto.subtle.importKey("raw", cifByte(CIF.kp), "AES-GCM", false, ["encrypt", "decrypt"]).then(function (k) { CIF.kpK = k; fatto(k); }, function () {});
}

function host(t) {
  if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
  var copia = t.ripresa && t.ripresa.stato && t.ripresa.stato.z;
  if (copia) {
    var dopo = function (s) { if (s) t.ripresa.stato = s; else t.ripresa = null; host(t); };
    if (!CIF.kp) return dopo(null);
    CIF.kpK = null;
    return cifCopia(function (k) { cifApri(k, copia, "copia").then(dopo, function () { dopo(null); }); });
  }
  precaricoAvvia();   // appena si entra comincia lo scaricamento del palazzo: prima quello che serve per partire, poi il resto (anche a partita cominciata)
  var IO = t.mioId || "host";
  var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
  var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, rip: 0, imp: pulisci(t.impostazioni),
    players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), lenz: lenzMio() || { c: 0, m: null } }], guarda: [], classifica: null, fine: null };
  var P = null, rete = null, inviati = {}, ultimaN = {}, viaDa = {}, finePronta = false, roundDetto = 0, fili = {}, filiN = {}, nFilo = 0, nU = Date.now() % 1e9;
  var chiavi = {}, fermi = {}, ePriv = nU, viciOra = [], codaCopia = Promise.resolve();   // ePriv: quale giro di privati è (cambia con la partita: il numero v dei privati riparte da capo)
  // i messaggi che contano: dal broker e, a chi ha il filo diretto aperto, anche da lì (il primo che arriva vale). Quelli per uno solo sul broker vanno cifrati
  function veloce(m) {
    if (!rete) return;
    m.u = ++nU;
    if (m.to) perLui(m); else rete.inviaVeloce(m);
    var tx = null;
    for (var id in fili) { if (m.to && m.to !== id) continue; if (fili[id].pronto()) { if (tx === null) tx = JSON.stringify(m); fili[id].invia(tx); } }
  }
  // filiN: i tentativi di fila. Torna a zero quando il filo si apre, così se cade si riapre subito e non dopo l'attesa dei tentativi di prima
  function filoApri(id, subito) {
    if (!window.RTCPeerConnection || !rete) return;
    var F = fili[id], n = filiN[id] || 0; if (F && !subito && !F.daRifare(n)) return;
    filiN[id] = n + 1;
    if (F) F.chiudi();
    F = fili[id] = new FiloDiretto(function (s) { if (rete) perLui({ t: "fd", s: s, to: id }); }, function (m) { if (m && m.t && rete && arrivoOspite) arrivoOspite(id, m, true); });
    F.aperto = function () { filiN[id] = 0; };
    F.caduto = function () { var p = pById(id); tuttiFilo = false; if (fili[id] === F && !filiN[id] && p && !p.via) filoApri(id, true); };
    F.o = ++nFilo; F.offri();
  }
  function filiChiudi() { for (var id in fili) fili[id].chiudi(); fili = {}; }
  function filiControllo() {
    var tutti = !H.guarda.length && Date.now() - guardaT > 15000;
    H.players.forEach(function (p) {
      if (p.bot || p.id === IO || p.via) return;
      filoApri(p.id);
      if (!(fili[p.id] && fili[p.id].pronto())) tutti = false;
    });
    tuttiFilo = tutti;
  }
  function soloFilo(m) { var tx = null; for (var id in fili) if (fili[id].pronto()) { if (tx === null) tx = JSON.stringify(m); fili[id].invia(tx); } }
  // ----- le chiavi degli ospiti: vedi in cima -----
  // Cifrare è asincrono: per ogni ospite una fila in uscita (coda) e una in entrata (codaA), così i messaggi restano nell'ordine in cui sono nati
  function cifra(id, m) {
    var c = chiavi[id], k = c.k, tx = JSON.stringify(m), blocco = m.t === "priv" ? CIF_PRIV : CIF_ALTRI;
    c.coda = c.coda.then(function () { return cifChiudi(k, tx, "h" + id, blocco); }).then(function (z) { if (rete && !fermo && chiavi[id] === c) rete.inviaVeloce({ t: "z", to: id, c: z }); }, function () {});
  }
  // un messaggio per uno solo, sul broker. Il chiaro è solo per chi non sa cifrare. Se la chiave è in ritardo si aspetta: il privato lo rimanda da solo il battito quando la chiave c'è,
  // gli altri stanno fermi un momento in fila. La ricevuta di una mossa e gli avatar non dicono niente e non aspettano
  function perLui(m) {
    var id = m.to, c = chiavi[id], p = pById(id);
    if (c && c.k) return cifra(id, m);
    if (!c && !(p && p.cif) || (CIF.fatto && !CIF.pub)) return rete.inviaVeloce(m);
    if (m.t === "ak") return rete.inviaVeloce({ t: "ak", q: m.q, to: m.to, u: m.u });   // (in chiaro senza l'esito: direbbe a chi ascolta il broker che cosa ha tentato)
    if (m.t === "av") return rete.inviaVeloce(m);
    if (m.t === "priv") { cifConta("privFermo"); return; }
    var l = fermi[id] || (fermi[id] = []); l.push({ m: m, t: Date.now() }); if (l.length > 32) l.shift();
    cifConta("fermi");
  }
  function chiaveOspite(id, pub, ridico) {
    if (!pub) { delete chiavi[id]; delete fermi[id]; return; }
    if (!CIF.fatto) return cifPronta(function () { if (!fermo) chiaveOspite(id, pub, ridico); });
    if (!CIF.pub) return;
    var c = chiavi[id];
    if (c && c.pub === pub) { if (c.k && ridico) cifra(id, { t: "cko", to: id }); return; }
    var n = chiavi[id] = { pub: pub, k: null, coda: Promise.resolve(), codaA: Promise.resolve() };
    cifDeriva(CIF.pub, pub, pub).then(function (k) {
      var rit = window.LT_PROVA && window.LT_CKRITARDO;   // (solo per le prove: una chiave in ritardo)
      return rit ? new Promise(function (ok) { setTimeout(function () { ok(k); }, rit); }) : k;
    }).then(function (k) {
      if (fermo || chiavi[id] !== n) return;
      n.k = k; cifra(id, { t: "cko", to: id });
      inviati[id] = -1;   // il privato parte al prossimo battito
      var ora = Date.now(), l = fermi[id] || []; delete fermi[id];
      l.forEach(function (x) { if (ora - x.t < CIF_ATTESA) cifra(id, x.m); });
    }, function () { if (chiavi[id] === n) delete chiavi[id]; });
  }
  function chiaveManca(p) { return !!p.cif && !p.bot && p.id !== IO && !!CIF.pub && !(chiavi[p.id] && chiavi[p.id].k); }
  // la copia per i vice (la manda il core, con l'host di riserva acceso): chiusa, se tutti e due sanno cifrare. Il core sa solo la fase
  function copiaChiusa(m, manda) {
    if (!CIF.pub || !m.vici.every(function (id) { var p = pById(id); return p && p.cif; })) return manda.call(rete, m);
    var tx = JSON.stringify(m.s), fase = m.s.fase; viciOra = m.vici;
    cifCopia(function (k) {
      codaCopia = codaCopia.then(function () { return cifChiudi(k, tx, "copia", CIF_ALTRI); }).then(function (z) { if (rete && !fermo) manda.call(rete, Object.assign({}, m, { s: { z: z, fase: fase } })); }, function () {});
    });
  }
  function kpPer(id) { return viciOra.indexOf(id) >= 0 ? CIF.kp : undefined; }
  // EMQX accetta circa 10 messaggi al secondo da ogni telefono (misurato l'1/11: a 8 passano tutti in 60 ms, a 10 ci mettono 200 ms, a 20 se ne perde metà); HiveMQ non ha questo tetto.
  // Le posizioni si ripetono da sole e cedono il posto agli altri messaggi: sul broker al massimo 8 al secondo, 4 se tutti hanno il filo; se nell'ultimo secondo ne sono già partiti 9 si salta, ma mai per più di 330 ms
  var tuttiFilo = false, guardaT = 0, posCr = 0, posT = 0, partiti = [];
  function brokerLibero() { var ora = Date.now(); while (partiti.length && ora - partiti[0] >= 1000) partiti.shift(); return partiti.length < 9 || ora - posT >= 330; }
  var arrivoOspite = null;
  var eventi = {
    privato: function (id, m) { if (id === IO) { if (UI) UI.messaggio(m); else conserva(m); return; } m.to = id; veloce(m); if (m.t === "avviso" || m.t === "morte") ripetiUnaVolta(m, true); },
    tutti: function (m) { veloce(m); if (UI) UI.messaggio(m); if (m.t === "avviso" || (m.t === "fx" && FX_UNA_VOLTA[m.k])) ripetiUnaVolta(m, false); }
  };
  // gli effetti a tutto schermo dei sabotaggi e della caduta in riunione: rari, e se si perdono il telefono resta senza la sua scena
  var FX_UNA_VOLTA = { buio: 1, luci: 1, interferenza: 1, acqua: 1, cade: 1, nebbia: 1, bengala: 1 };
  // un avviso e la scena della morte partono una volta sola, e non si rimandano da soli come la foto e i privati: senza filo diretto (una strada sola, il broker)
  // si ripetono dopo 300 ms con lo stesso numero u, così chi li ha già li scarta e chi li aveva persi li vede
  function ripetiUnaVolta(m, perUno) {
    setTimeout(function () {
      if (!rete || fermo) return;
      if (perUno) { var F = fili[m.to]; if (!(F && F.pronto()) && pById(m.to)) perLui(m); }
      else if (!tuttiFilo) rete.inviaVeloce(m);
    }, 300);
  }
  var R = t.ripresa, riprendo = !!(R && R.stato && R.stato.fase && R.stato.fase !== "lobby" && R.stato.players);
  // il respiro: l'host riprende e la partita sta ferma finché gli ospiti tornano, così nessun tempo salta mentre si ricollegano.
  // Prima che l'host sia sul broker nessuno può tornare: i 5 s partono da lì (onConnesso; se il broker non risponde ci pensa onErrore)
  var respiro = 0;
  if (riprendo) {
    H = R.stato; H.pronta = false; H.rip = (H.rip || 0) + 1; H.guarda = H.guarda || []; H.imp = pulisci(H.imp);
    H.players.forEach(function (p) { p.forse = false; p.via = p.id !== IO && !p.bot; if (p.id === IO) p.omino = t.mioOmino(p.nome); });
    lenzInOrdine(H.players);
    if (H.fase === "gioco" && H.salvata) {
      P = Partita.daStato(H.salvata, H.imp, eventi); respiro = Infinity;
      H.players.forEach(function (p) { if (p.via) viaDa[p.id] = Date.now(); });   // chi non torna esce come gli altri, dopo un minuto e mezzo
      if (window.LT_PROVA) window.LT_P = P;
    }
    else if (H.fase === "gioco") H.fase = "lobby";
    delete H.salvata;
  }
  function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
  function presenti() { return H.players.filter(function (p) { return !p.via; }); }
  // il lenzuolo lo decide l'host: due giocatori non hanno mai lo stesso. Chi entra col suo colore lo trova, se è libero o se ce l'ha un Bot (che ne prende un altro)
  function presiLenz() { return H.players.map(function (p) { return p.lenz ? p.lenz.c : -1; }); }
  function lenzNuovo(voluto) {
    var v = lenzValido(voluto);
    if (v) {
      var chi = H.players.filter(function (p) { return p.lenz && p.lenz.c === v.c; })[0];
      if (!chi) return v;
      if (chi.bot) { chi.lenz = { c: liberoLenz(presiLenz().concat(v.c)), m: null }; return v; }
    }
    return { c: liberoLenz(presiLenz()), m: null };
  }
  // la mossa «lenz», nella saletta: se due toccano lo stesso colore vince il primo, un Bot invece cede il suo e prende quello lasciato.
  // Comunque vada parte una foto: chi è arrivato tardi vede com'è andata
  function cambiaLenz(id, c) {
    var p = pById(id), v = lenzValido({ c: c }); if (H.fase !== "lobby" || !p || !v) return;
    if (p.lenz && p.lenz.c === v.c) return bd();
    var altro = H.players.filter(function (q) { return q.id !== id && q.lenz && q.lenz.c === v.c; })[0];
    if (altro && !altro.bot) return bd();
    if (altro) altro.lenz = p.lenz || { c: liberoLenz(presiLenz()), m: null };
    p.lenz = v; bd();
  }
  // chi ha la mappa pronta: i Bot sempre; io col mio precarico; gli altri dicono la loro («pr»). Chi non lo dice mai (un telefono con una versione vecchia) vale pronto dopo 5 s.
  function pronto(p) { return !!p.bot || (p.id === IO ? precaricoStato().pronto : p.pr !== undefined ? !!p.pr : Date.now() - (p.t0 || 0) > 5000); }
  function mappaPct(p) { return pronto(p) ? 100 : p.id === IO ? precaricoStato().pct : (p.mp || 0); }
  function inAttesa() { return presenti().filter(function (p) { return !pronto(p) || chiaveManca(p); }); }   // (la partita aspetta anche le chiavi: si fanno nella saletta, un attimo)
  // i Bot automatici: finché l'host non tocca i tasti dei Bot, la saletta sta a RIEMPI posti (le persone prendono il posto dei Bot)
  if (H.auto == null) H.auto = true;
  // la saletta: una partita nell'atrio senza ruoli, dove si gira finché l'host non fa partire dal computer
  function nuovaSaletta() {
    P = new Partita(presenti().map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot }; }), H.imp, eventi, { saletta: true });
    ePriv = ++nU;
    if (window.LT_PROVA) window.LT_P = P;
  }
  function allinea() {
    if (!P || !P.saletta) return;
    var qui = presenti(), ids = qui.map(function (p) { return p.id; });
    qui.forEach(function (p) { P.aggiungi({ id: p.id, nome: p.nome, bot: !!p.bot }); });
    P.gioc.slice().forEach(function (g) { if (ids.indexOf(g.id) < 0) P.togli(g.id); });
  }
  function riempi() {
    if (!H.auto || H.fase !== "lobby") return allinea();
    var umani = H.players.filter(function (p) { return !p.bot; }).length, voluti = Math.max(0, Math.min(MAX - umani, RIEMPI - umani));
    var bot = H.players.filter(function (p) { return p.bot; }).length;
    while (bot < voluti) { aggiungiBot(true); bot++; }
    while (bot > voluti) { togliBot(true); bot--; }
    allinea();
  }

  t.onRegole = function (im) { if (H.fase !== "lobby") return; H.imp = pulisci(im); bd(); };

  rete = SGNet.ospita(ID, {
    onCodice: function (c) { H.codice = c; bd(); },
    onConnesso: function () {
      H.pronta = true;
      if (respiro === Infinity) { respiro = Date.now() + RESPIRO; Object.keys(viaDa).forEach(function (id) { viaDa[id] = Date.now(); }); }   // solo adesso gli ospiti possono tornare: da qui contano i 5 s e il minuto e mezzo
      bd();
    },
    onErrore: function () { if (H.pronta) return; ferma(); VOCE.chiudiStanza(); if (rete) rete.chiudi(); erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); }); },
    onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
    onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
    onAddio: function (id) {
      if (VS) VS.via(id);
      if (H.guarda.some(function (x) { return x.id === id; })) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
      var p = pById(id); if (!p) return;
      p.forse = false;
      if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); riempi(); bd(); return; }
      p.via = true; if (!viaDa[id]) viaDa[id] = Date.now(); bd();   // resta in partita: se torna entro un minuto e mezzo riprende il suo posto (dopo una ripresa il conto è già partito)
    },
    onMsg: function arrivo(id, m, sulFilo) {
      arrivoOspite = arrivo;
      if (!m || !m.t) return;
      if (rimescola(m, function (x) { arrivo(id, x, sulFilo); })) return;   // (solo per le prove)
      if (m.t === "fd") { if (fili[id]) fili[id].segnale(m.s); return; }   // il filo diretto: i messaggi per aprirlo
      if (m.t === "z") {   // una mossa cifrata: se non si apre si scarta, l'ospite la ripete
        var cz = chiavi[id]; if (!cz || !cz.k) return;
        var kz = cz.k; cz.codaA = cz.codaA.then(function () { return cifApri(kz, m.c, "o" + id); }).then(function (x) { if (!fermo && x && (x.t === "a" || x.t === "pc" || x.t === "fd")) arrivo(id, x); }, function () { cifConta("scarti"); });
        return;
      }
      if (m.t === "ck") { var pk = pById(id); if (pk) pk.cif = 1; chiaveOspite(id, m.k, true); return; }   // la sua chiave, ridetta: l'host ne ha una nuova, o il «join» è di prima
      if (m.t === "vc") { var pv = pById(id); if (pv && !pv.via && VS) VS.arriva(id, m); return; }   // la voce: messaggi di collegamento
      if (m.t === "pr") {   // la mappa di quel telefono: percentuale e pronto. Si ridice a tutti solo se cambia davvero (pronto, o 10 punti)
        var pq = pById(id); if (!pq || pq.bot) return;
        var np = Math.max(0, Math.min(100, m.p | 0)), nok = m.ok ? 1 : 0, cambio = pq.pr !== nok || Math.abs((pq.mp || 0) - np) >= 10;
        pq.mp = np; pq.pr = nok; if (cambio) mandaPm();
        return;
      }
      if (m.t === "join") {
        var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
        chiaveOspite(id, m.ck);   // (chi manda la chiave sa cifrare: lo si sa da subito, senza attese. Prima di tutto il resto: anche i primi messaggi per lui devono trovarla)
        if (p) p.cif = m.ck ? 1 : 0;
        if (!p && !t.puoSedersi(id, nome)) { if (!H.guarda.some(function (x) { return x.id === id; })) H.guarda.push({ id: id, nome: nome }); bd(); return; }
        if (!p && H.fase === "lobby" && H.players.length >= MAX && H.auto) togliBot(true);   // un Bot automatico lascia il posto
        if (!p && H.fase === "lobby" && H.players.length < MAX) { H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), t0: Date.now(), lenz: lenzNuovo(m.lenz), cif: m.ck ? 1 : 0 }); riempi(); }
        if (p) { p.forse = false; if (p.via && H.fase !== "lobby") { p.via = false; delete viaDa[id]; } if (!p.omino) p.omino = avatarValido(m.omino); if (P && H.fase === "gioco") P.rientra(id); }
        bd();
        if (p && P) {
          inviati[id] = -1; ultimaN[id] = 0; delete ultimaQ[id];   // (rientrato: le sue mosse ripartono da un numero nuovo)
          var g = P.per(id); if (g) perLui({ t: "tp", x: Math.round(g.x), y: Math.round(g.y), ep: g.ep, to: id });
          // gli avatar non viaggiano nella foto durante la partita: a chi rientra li mando a parte
          perLui({ t: "av", l: H.players.filter(function (q) { return q.omino; }).map(function (q) { return [q.id, q.omino]; }), to: id });
        }
        if (p && fili[id] && !fili[id].pronto()) filiN[id] = 0;   // chi rientra non aspetta i tentativi fatti mentre non c'era
        tuttiFilo = false; if (pById(id)) filoApri(id); else guardaT = Date.now();   // (arrivato a partita cominciata: guarda, e le posizioni gli arrivano solo dal broker)
        return;
      }
      if (m.t === "rf") { if (Date.now() - ultimaFoto >= 150) bd(); else if (!fotoDopo) fotoDopo = setTimeout(bd, 150); return; }   // ha perso una foto
      if (m.t === "a" && m.q != null) return mossaConRicevuta(id, m, sulFilo);   // (anche a fine partita: la ricevuta dice «troppo tardi», niente silenzio)
      if (!P || !pById(id) || (H.fase !== "gioco" && H.fase !== "lobby")) return;
      if (H.fase === "lobby" && m.t !== "p" && !(m.t === "a" && (m.k === "parla" || m.k === "lenz"))) return;   // nella saletta: si cammina, si parla, si cambia lenzuolo
      if (m.t === "p") { if (m.n <= (ultimaN[id] || 0)) return; ultimaN[id] = m.n; P.muovi(id, m); }
      else if (m.t === "a") esegui(id, m);   // (un telefono con la versione vecchia: mossa senza ricevuta)
      else if (m.t === "pc") P.azione(id, { k: "pc", x: m.x, y: m.y, d: m.d, m: m.m });   // il Burattinaio muove la sua vittima
    }
  }, { ripresa: riprendo });
  if (!rete) return senzaRete(t);
  if (window.LT_PROVA) window.LT_RETE = rete;
  // senza rete i messaggi veloci non partono: tanto non arriverebbero, e nel collegamento fermo si accumulerebbero fino a far scattare un difetto di mqtt 4.3.7 (oltre 512 KB in coda chiama due volte la stessa funzione: «Callback called multiple times»)
  ["invia", "inviaVeloce"].forEach(function (k) { var f = rete[k]; rete[k] = function (m) { if (k === "inviaVeloce" && navigator.onLine === false) return; if (m && m.t === "__ris" && m.s) return copiaChiusa(m, f); partiti.push(Date.now()); if (partiti.length > 64) partiti.shift(); return f.call(rete, m); }; });
  if (riprendo && rete.codice) H.codice = rete.codice;
  // la voce: l'host fa da portalettere dei messaggi di collegamento fra i telefoni (non conserva niente, sono messaggi veloci)
  // Col filo aperto passano da lì: arrivano prima e non consumano i messaggi del broker (con 10 persone sono 45 collegamenti). Solo il giro dei 5 secondi resta fuori dal broker: un elenco nuovo passa da tutte e due le strade
  var VS = new VoceStanza({
    nota: function (t) { VOCE.nota(t); },
    invia: function (a, m) {
      if (a === IO) { VOCE.arriva(m); return; }
      m.to = a; var F = fili[a];
      if (!m.b && F && F.pronto()) F.invia(JSON.stringify(m)); else rete.inviaVeloce(m);
    },
    tutti: function (m, ripetuto) {
      VOCE.arriva(m);
      var tx = null, broker = !ripetuto;
      H.players.forEach(function (p) {
        if (p.bot || p.id === IO) return;
        var F = fili[p.id];
        if (F && F.pronto()) { if (tx === null) tx = JSON.stringify(m); F.invia(tx); } else broker = true;
      });
      if (broker) rete.inviaVeloce(m);
    } });
  // chi era in voce prima della ripresa resta in elenco finché non si rifà vivo: senza, il primo elenco chiuderebbe i collegamenti fra gli altri telefoni.
  // Tolto solo chi non c'è più: io che ho ricaricato (la mia voce riparte da capo), o l'host di prima se ho preso il suo posto
  if (riprendo) { VS.semina(H.voce, R.daRiserva ? R.vecchioHost : IO); delete H.voce; }
  VOCE.apri({ io: IO, manda: function (m) { VS.arriva(IO, m); } });
  var vsT = setInterval(function () { VS.giro(); }, 5000);

  function vm() {
    var v = { ver: H.ver, fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, rip: H.rip, tiene: IO, imp: H.imp, auto: !!H.auto, ck: CIF.pub || undefined,
      players: H.players.map(function (p) { return { id: p.id, nome: p.nome, lenz: p.lenz, bot: !!p.bot, via: !!p.via, forse: !!p.forse, omino: H.fase === "lobby" || p.bot ? (p.omino || null) : undefined, mp: H.fase === "lobby" ? mappaPct(p) : undefined, pr: H.fase === "lobby" ? (pronto(p) ? 1 : 0) : undefined }; }),
      avvio: H.avvio ? { n: inAttesa().length, t: H.avvio.t0 + avvioMax() } : null,
      guarda: H.guarda, classifica: H.classifica, fine: H.fine };
    if (P && (H.fase === "gioco" || H.fase === "lobby")) v.g = P.foto();
    return v;
  }
  function ricorda() {
    if (H.fase === "lobby") return t.ricorda(null);
    t.ricorda({ fase: H.fase, codice: H.codice, partita: H.partita, rip: H.rip, imp: H.imp, guarda: H.guarda, classifica: H.classifica, fine: H.fine, voce: VS ? VS.elenco() : null,
      players: H.players.map(function (p) { return { id: p.id, nome: p.nome, lenz: p.lenz, bot: !!p.bot, via: !!p.via, omino: p.bot ? p.omino : undefined, cif: p.cif ? 1 : undefined }; }),
      salvata: P && H.fase === "gioco" ? P.salva() : null });
  }
  var visteA = {}, ultimaQ = {}, giroPriv = 0, nImpDetto = 0;   // le mosse già fatte (numero q, esito, foto) e l'ultima di ogni famiglia, per ospite
  // MOSSE CON RICEVUTA. La mossa vale una volta sola; la ricevuta parte sempre (anche per un doppione: la prima può essersi persa) e porta l'esito (e)
  // e il numero della foto di quel momento (v): dalla foto dopo, sul telefono di chi l'ha fatta, si vede l'effetto. Torna da dove è venuta: col filo aperto sul broker non si deve vedere a chi rispondo
  function mossaConRicevuta(id, m, sulFilo) {
    var vq = visteA[id] || (visteA[id] = []), r = null;
    for (var i = 0; i < vq.length; i++) if (vq[i].q === m.q) { r = vq[i]; break; }
    if (!r) {
      var e = "no";
      if (P && pById(id) && (H.fase === "gioco" || H.fase === "lobby")) e = esegui(id, m);
      else if (H.fase === "fine") e = "fine";
      r = { q: m.q, e: e || "ok", v: H.ver || 0 }; vq.push(r); if (vq.length > 64) vq.shift();
    }
    var Fq = sulFilo === true && fili[id], ak = { t: "ak", q: m.q, to: id, e: r.e, v: r.v };
    if (Fq && Fq.pronto()) Fq.invia(JSON.stringify(ak)); else veloce(ak);
  }
  // la mossa vera. Prima il posto da cui è partita, se è più nuovo dell'ultimo passo arrivato: i passi viaggiano a 8 al secondo, la mossa subito,
  // e l'host non deve trovare chi preme «lontano» solo perché il suo ultimo passo è ancora per strada. Torna l'esito (vedi TESTO_ESITO in partita.js)
  function esegui(id, m) {
    if (H.fase === "lobby" && m.k !== "parla" && m.k !== "lenz") return "no";
    if (m.k === "lenz") { cambiaLenz(id, m.c); return "ok"; }
    if (m.n != null && m.x != null && m.n > (ultimaN[id] || 0)) { ultimaN[id] = m.n; P.muovi(id, { x: m.x, y: m.y, d: m.d, m: m.mv, ep: m.ep }); }
    // botola e telecamere: l'ordine conta (entra ed esci, accendi e spegni). Una mossa più vecchia dell'ultima della stessa famiglia è arrivata tardi: non vale
    var fam = m.k === "botola" || m.k === "guardo" ? m.k : null;
    if (fam && m.q != null) { var uq = ultimaQ[id] || (ultimaQ[id] = {}); if (uq[fam] != null && m.q < uq[fam]) return "vecchia"; uq[fam] = m.q; }
    return P.azione(id, m) || "ok";
  }
  var ultimaFoto = 0, fotoDopo = null, ricordaT = 0, ricordaFase = null;   // (lo stato per la ripresa si salva ogni 2 s, e a ogni cambio di fase)
  var ultimaV = null, fotoRip = [], fotoFase = null;
  // la foto che conta (un sabotaggio aperto o chiuso, un cambio di fase) parte altre 2 volte: una perdita sul broker non costa secondi, e il numero ver evita i doppioni.
  // A un cambio di fase, la seconda volta anche la copia trattenuta: chi ricarica la pagina deve trovare quella giusta, non una di prima
  function ripetiFoto(trattieni) {
    fotoRip.forEach(clearTimeout);
    fotoRip = [150, 400].map(function (ms, i) {
      return setTimeout(function () { if (!rete || fermo || !ultimaV) return; veloce({ t: "vm", vm: ultimaV }); if (i && trattieni) rete.invia({ t: "vm", vm: ultimaV }); }, ms);
    });
  }
  function bd(conta) {
    if (fermo) return;
    if (fotoDopo) { clearTimeout(fotoDopo); fotoDopo = null; }
    ultimaFoto = Date.now(); H.ver = (H.ver || ultimaFoto) + 1;
    var v = ultimaV = vm(), ff = H.fase + "|" + (P ? P.fase : "");
    if (conta === true || ff !== fotoFase) { ripetiFoto(ff !== fotoFase); fotoFase = ff; }
    // in partita la foto parte veloce: quella trattenuta dal broker (per chi rientra) ci ha messo fino a 4,6 s nella prova del 31/10, e un sabotaggio deve arrivare subito.
    // Quella trattenuta resta una ogni 2 s e a ogni cambio di fase: chi la trova vecchia vede il numero nel battito e chiede l'ultima
    if (H.fase === "gioco" || H.avvio) veloce({ t: "vm", vm: v });
    if ((H.fase !== "gioco" && !H.avvio) || H.faseT !== H.fase || ultimaFoto - (H.tT || 0) >= 2000) { H.faseT = H.fase; H.tT = ultimaFoto; rete.invia({ t: "vm", vm: v }); }
    var rk = ff + "|" + (P && P.riu ? P.riu.voti.size : 0);   // (un sabotaggio o un voto si ricordano subito: chi prende il posto dell'host non deve perderli)
    if (conta === true || rk !== ricordaFase || ultimaFoto - ricordaT > 2000) { ricordaFase = rk; ricordaT = ultimaFoto; ricorda(); } disegna(t, v, cbHost);
  }
  function mandaPrivati(tutti) {
    if (!P) return;
    H.players.forEach(function (p) {
      if (p.bot) return;
      var pr = P.privato(p.id); if (!pr) return;
      if (!tutti && inviati[p.id] === pr.v) return;
      if (p.id !== IO && chiaveManca(p)) return;   // (partirà quando la chiave c'è: un ruolo non esce mai in chiaro)
      inviati[p.id] = pr.v;
      if (p.id === IO) { if (UI) UI.privato(pr); else PENDENTI.priv = pr; }
      else veloce({ t: "priv", p: pr, to: p.id, e: ePriv, kp: kpPer(p.id) });
    });
  }
  // la rete può perdere un messaggio e il ruolo o le ricariche non si rimandano da soli: ogni secondo e mezzo si ribadiscono (uguali: l'ospite li ignora)
  function ribadisciPrivati() {
    var sulBroker = [];
    H.players.forEach(function (p) {
      if (p.bot || p.id === IO || p.via) return;
      var pr = P.privato(p.id); if (!pr) return;
      var m = { t: "priv", p: pr, to: p.id, r: 1, e: ePriv, kp: kpPer(p.id) }, F = fili[p.id];
      if (F && F.pronto()) F.invia(JSON.stringify(m)); else if (!chiaveManca(p)) sulBroker.push(m);
    });
    for (var i = 0; i < Math.min(2, sulBroker.length); i++) veloce(sulBroker[(giroPriv + i) % sulBroker.length]);   // chi non ha il filo, due alla volta: con 9 telefoni sarebbero 6 messaggi al secondo
    giroPriv += 2;
  }
  // il tempo della partita: 20 volte al secondo; le posizioni a tutti 10 volte al secondo
  var ultimo = Date.now(), nTick = 0, fermo = false;
  var loop = setInterval(function () {
    if (fermo) return;
    if (rete && (rete._chiusa || (rete.stato && rete.stato().chiusa))) { ferma(); if (UI && UI.t === t) chiudiUI(); return; }   // la stanza non è più mia (il core l'ha chiusa, o la tiene un altro e io rientro da giocatore: cediPosto)
    var ora = Date.now(), dt = Math.min(0.1, (ora - ultimo) / 1000); ultimo = ora;
    if (H.fase === "lobby") seguiPrecarico();
    if (!P || (H.fase !== "gioco" && H.fase !== "lobby")) return;   // (anche nella saletta: si gira nell'atrio)
    if (respiro && (ora >= respiro || !H.players.some(function (p) { return p.via; }))) respiro = 0;
    if (!respiro) P.tick(dt);
    if (P.cambiata) { P.cambiata = false; if (P.subito || ora - ultimaFoto >= 250) { var urgente = !!P.subito; P.subito = false; bd(urgente); } else if (!fotoDopo) fotoDopo = setTimeout(bd, 250); }
    var pos = P.posizioni();
    if (UI) UI.posizioni(pos);
    nTick++; posCr += tuttiFilo ? 0.2 : 0.4;
    var mPos = { t: "pos", s: nTick, p: pos, v: H.ver };   // v: l'ultima foto: chi non ce l'ha se ne accorge al battito dopo
    if (nTick % 2 === 0 || !window.LT_POS10) soloFilo(mPos);   // sul filo 20 volte al secondo: si vede 26 ms prima (75 → 49) e il telefono non lavora di più (prova P, 1/11)
    if (posCr >= 1) { posCr -= 1; if (rete && brokerLibero()) { posT = Date.now(); rete.inviaVeloce(mPos); } }
    mandaPrivati(false);
    if (nTick % 30 === 0) ribadisciPrivati();
    if (nTick % 20 === 0) filiControllo();
    if (nTick % 40 === 0 && H.fase === "gioco" && ora - ricordaT >= 2000) { ricordaT = ora; ricorda(); }   // (i posti cambiano anche senza foto nuove)
    if (P.round !== roundDetto && P.fase === "gioco") { roundDetto = P.round; t.aCheSiamo("Round " + P.round); }
    // uno spegnimento, un compito, una riparazione, una riunione chiamata: si salva subito, non al giro dei 2 s (se l'host ricarica proprio ora non si perdono)
    if (P.nImp !== nImpDetto && H.fase === "gioco") { nImpDetto = P.nImp; ricordaT = ora; ricorda(); }
    Object.keys(viaDa).forEach(function (id) { if (ora - viaDa[id] > 90000) { delete viaDa[id]; P.esce(id); } });
    if (P.fase === "fine" && !finePronta) { finePronta = true; setTimeout(fine, 2600); }
  }, 50);
  function ferma() { fermo = true; clearInterval(loop); clearInterval(vsT); if (fotoDopo) clearTimeout(fotoDopo); fotoRip.forEach(clearTimeout); filiChiudi(); }

  // il mio precarico (quello dell'host): se cambia lo dico a tutti; se si sta aspettando per cominciare, guardo se si può partire
  var mioPre = { ok: -1, p: -1 }, pmT = 0;
  // chi ha la mappa pronta, a tutti, con un messaggio piccolo (una riga per persona): il «vm» intero pesa 8 KB e su una rete lenta farebbe aspettare gli altri messaggi
  function mandaPm() {
    pmT = Date.now();
    var l = H.players.filter(function (p) { return !p.bot && !p.via; }).map(function (p) { return [p.id, mappaPct(p), pronto(p) ? 1 : 0]; });
    rete.inviaVeloce({ t: "pm", l: l }); if (UI) UI.pronti(l);
  }
  function seguiPrecarico() {
    var ps = precaricoStato(), ok = ps.pronto ? 1 : 0;
    if (ok !== mioPre.ok || Math.abs(ps.pct - mioPre.p) >= 10) { mioPre.ok = ok; mioPre.p = ps.pct; mandaPm(); }
    else if (Date.now() - pmT > 2000 && inAttesa().length) mandaPm();   // finché qualcuno manca, si ripete ogni 2 s (un messaggio veloce può perdersi)
    if (H.avvio) controllaAvvio();
  }
  // «Comincia»: se qualcuno non ha ancora la mappa, prima un caricamento breve per tutti (al massimo AVVIO_MAX); la partita (tempo e ruoli) parte dopo.
  function comincia() {
    if (H.fase !== "lobby" || presenti().length < MIN || H.avvio) return;
    if (inAttesa().length) { H.avvio = { t0: Date.now() }; precaricoFretta(2); bd(); return; }
    parti();
  }
  function avvioMax() { return (window.LT_PROVA && window.LT_AVVIO_MAX) || AVVIO_MAX; }
  function controllaAvvio() {
    if (!H.avvio || H.fase !== "lobby") return;
    if (presenti().length < MIN) { H.avvio = null; precaricoFretta(1); bd(); return; }   // nel frattempo se ne sono andati: si torna alla saletta
    if (!inAttesa().length || Date.now() - H.avvio.t0 >= avvioMax()) parti();
  }
  function parti() {
    if (H.fase !== "lobby" || presenti().length < MIN) return;
    H.avvio = null; precaricoFretta(0);
    H.players = presenti(); if (!P || !P.saletta) nuovaSaletta(); allinea();
    H.fase = "gioco"; H.partita++; H.classifica = null; H.fine = null; inviati = {}; viaDa = {}; finePronta = false; roundDetto = 0;
    P.inizia(H.imp);                                    // dalla saletta al palazzo: ruoli e compiti adesso
    if (t.ruoloProva) P.forzaRuolo(IO, t.ruoloProva);   // (solo nella versione da soli, per provare un ruolo)
    if (window.LT_PROVA) window.LT_P = P;               // (solo nella versione da soli: le prove automatiche guardano la partita)
    t.aCheSiamo("Si gioca");
    bd(); mandaPrivati(true);
  }
  function fine() {
    if (!P || H.fase !== "gioco") return;
    H.classifica = P.classifica().map(function (r) { return { id: r.id, nome: r.nome, pos: r.pos, bot: !!r.bot }; });
    H.fine = { vincitore: P.vincitore, ruoli: P.gioc.map(function (p) { return [p.id, p.ruolo, p.vivo ? 1 : 0]; }) };
    H.fase = "fine"; bd();
    if (t.risultato) t.risultato(H.classifica.map(function (r) { var x = { nome: r.nome, pos: r.pos }; if (r.bot) x.bot = true; return x; }));
  }
  function nuova() { if (H.fase !== "fine") return; H.avvio = null; H.fase = "lobby"; H.classifica = null; H.fine = null; H.players = presenti(); nuovaSaletta(); riempi(); bd(); mandaPrivati(true); }
  t.onRivincita = nuova;
  function aggiungiBot(da) {
    if (H.fase !== "lobby" || H.players.length >= MAX) return;
    if (da !== true) H.auto = false;   // l'host ha deciso lui: da qui i Bot li gestisce a mano
    var usati = H.players.map(function (p) { return p.nome; }).concat(NOMI_COLORE), b = null;   // (un Bot che si chiama Rosa non si può dire: «ho visto Rosa» è un nome o un telo?)
    try { b = SG.bot && SG.bot.prendi ? SG.bot.prendi(1, { escludi: usati })[0] : null; } catch (e) {}
    var n = H.players.filter(function (p) { return p.bot; }).length + 1;
    H.players.push({ id: "bot-" + Date.now().toString(36) + n, nome: b ? b.nome : "Bot " + n, omino: b ? avatarValido(b.omino) : null, bot: true, lenz: lenzNuovo(null) });
    if (da !== true) allinea();
    bd();
  }
  function togliBot(da) { if (da !== true) H.auto = false; for (var i = H.players.length - 1; i >= 0; i--) if (H.players[i].bot) { H.players.splice(i, 1); if (da !== true) allinea(); bd(); return; } }

  var cbHost = { sonoHost: true, myId: IO, onComincia: comincia, onNuova: nuova, onBot: aggiungiBot, onTogliBot: togliBot,
    onVia: function () { if (P && !P.saletta) P.via(); },
    // (le mie mosse non viaggiano: l'esito torna subito, per la Vista è come la ricevuta di un ospite)
    mossa: function (m) { if (!P || (H.fase !== "gioco" && H.fase !== "lobby")) return m.t === "a" ? (H.fase === "fine" ? "fine" : "no") : undefined; if (m.t === "p") P.muovi(IO, m); else if (m.t === "a") { if (m.k === "lenz") { cambiaLenz(IO, m.c); return "ok"; } return P.azione(IO, m) || "ok"; } else if (m.t === "pc") P.azione(IO, { k: "pc", x: m.x, y: m.y, d: m.d, m: m.m }); },
    onEsci: function () {
      function via() { ferma(); VOCE.chiudiStanza(); t.ricorda(null); rete.chiudi(); chiudiUI(); t.esci(); }
      if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
      via();
    } };
  if (!riprendo || H.fase === "lobby") { nuovaSaletta(); riempi(); }
  bd();
  if (P) mandaPrivati(true);
  if (!CIF.fatto) cifPronta(function () { if (!fermo) bd(); });   // (la parte pubblica della chiave non era ancora pronta per la prima foto)
}

// =========================================================
//  OSPITE: disegna le foto dell'host e manda posizione e mosse
// =========================================================
function ospite(t, codice) {
  if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
  precaricoAvvia();   // subito, anche prima di essere dentro: la mappa si scarica mentre ci si collega
  var S = { rete: null, myId: null, nome: "", vm: null, prInt: null, prOk: -1, prP: -1, prT: 0 };
  // dico all'host a che punto è la mappa su questo telefono (a ogni cambio, e ogni tanto: un messaggio può perdersi)
  function riferisci(forza) {
    var ps = precaricoStato(), ok = ps.pronto ? 1 : 0, ora = Date.now();
    if (forza !== true && ok === S.prOk && Math.abs(ps.pct - S.prP) < 8 && ora - S.prT < (ok ? 8000 : 3000)) return;
    S.prOk = ok; S.prP = ps.pct; S.prT = ora; if (S.rete) S.rete.invia({ t: "pr", p: ps.pct, ok: ok });
  }
  function fermaPr() { clearInterval(S.prInt); S.prInt = null; }
  function chiudiFilo() { if (S.filo) { S.filo.chiudi(); S.filo = null; } }
  // l'host tace: da 8 s niente posizioni, che arrivano da 4 a 20 volte al secondo. Lo dice un bigliettino, che se ne va da solo quando tornano; se l'app sta già
  // parlando con una pillola (rete giù, host sparito, partita ripresa) non serve.
  // Con la riserva accesa si avvisa anche il core, senza aspettare i 30-40 s del testamento: il primo vice dopo 8 s (più 6 suoi), il secondo dopo 16 (più 12), perché il primo ci mette
  // qualche secondo a farsi sentire e se partissero insieme sarebbero due host (misurato: 14 s e 20 s si sovrapponevano)
  function ogniSecondo() {
    riferisci(); dicoChiave();
    var st = S.rete && S.rete.stato ? S.rete.stato() : null;
    if (!st || st.chiusa) { S.finita = true; fermaPr(); chiudiFilo(); return; }   // la stanza non c'è più: ho preso il posto dell'host, o sono uscito
    var vm = S.vm, gioco = !!vm && (vm.fase === "gioco" || (vm.fase === "lobby" && !!vm.g)), ora = Date.now();
    if (!gioco || document.hidden) { S.posT = 0; return taceHost(false, false); }
    if (!S.posT) S.posT = ora;
    var fermo = navigator.onLine === false ? 0 : ora - S.posT;   // (senza rete sono io, non l'host: lo dice la pillola «Mi ricollego»)
    taceHost(fermo >= TACE_MS, fermo >= TACE_MS * (postoVice(vm) + 1));
    if (UI) UI.tace(S.tace && !document.querySelector(".sg-pillola"));
  }
  // chi prende il posto per primo: il primo arrivato ancora presente (il core sceglie allo stesso modo)
  function postoVice(vm) { return vm.players.filter(function (p) { return !p.bot && !p.via && p.id !== vm.tiene; })[0] === vm.players.filter(function (p) { return p.id === S.myId; })[0] ? 0 : 1; }
  function taceHost(si, via) {
    if (!si) via = false;
    if (!!S.tace !== si) { S.tace = si; if (UI) UI.tace(false); }
    if (!!S.viaDetta !== !!via) { S.viaDetta = !!via; if (S.cbRete && S.cbRete.onHostVia) S.cbRete.onHostVia(!!via); }
  }
  // ----- la chiave con l'host: vedi in cima -----
  // S.cif: null finché l'host non ne ha una (e per sempre se ha una versione vecchia, o se questo telefono non sa cifrare). h: la sua parte pubblica; ok: sappiamo che la mia gli è arrivata.
  // Una foto senza chiave dello stesso host è solo di quando la sua non era ancora pronta
  function chiaveHost(v) {
    if (!CIF.pub) return;
    var c = S.cif;
    if (!v.ck) { if (c && c.tiene !== v.tiene) S.cif = null; return; }
    if (c && c.h === v.ck) return;
    var n = S.cif = { h: v.ck, tiene: v.tiene, k: null, ok: false, dT: Date.now(), coda: null, codaU: Promise.resolve() };
    n.coda = cifDeriva(v.ck, CIF.pub, v.ck).then(function (k) { n.k = k; }, function () { if (S.cif === n) S.cif = null; });
    var l = S.zFermi; S.zFermi = null; if (l) l.forEach(apriZ);
  }
  // il «join» porta già la mia parte: la ridico solo se dopo un po' non ho sentito niente di cifrato dall'host
  function dicoChiave() {
    var c = S.cif, ora = Date.now();
    if (!c || !c.k || c.ok || ora - c.dT < 1200 || !S.rete) return;
    c.dT = ora; S.rete.invia({ t: "ck", k: CIF.pub });
  }
  // dall'host, in fila. Quello che non si apre (una chiave di prima) si scarta: i privati tornano col ribadire ogni 1,5 s, la chiave si ridice
  function apriZ(m) {
    var c = S.cif;
    if (!c) { if (CIF.pub) { var l = S.zFermi = S.zFermi || []; l.push(m); if (l.length > 16) l.shift(); } return; }
    c.coda = c.coda.then(function () { return c.k ? cifApri(c.k, m.c, "h" + S.myId) : null; }).then(function (x) {
      if (!x) return;
      c.ok = true;
      if (x.t !== "cko") S.dalHost(x);
    }, function () { cifConta("scarti"); c.dT = 0; });
  }
  // una mossa verso il broker. Se l'host cifra e la chiave non è pronta non parte: mandaSicura la ripete. In uscita in fila anche qui
  function alBroker(m) {
    var c = S.cif;
    if (!c) return S.rete.invia(m);
    if (!c.ok) return;
    var tx = JSON.stringify(m), k = c.k;
    c.codaU = c.codaU.then(function () { return cifChiudi(k, tx, "o" + S.myId, CIF_ALTRI); }).then(function (z) { if (S.rete && S.cif === c) S.rete.invia({ t: "z", c: z }); }, function () {});
  }
  // le mosse (non i passi) si ripetono finché l'host non dà la ricevuta: la rete può perderne una, e un sabotaggio o una riparazione non possono sparire
  function perdo() { return window.LT_PROVA && window.LT_PERDI && Math.random() < window.LT_PERDI; }   // (solo per le prove: rete che perde messaggi)
  // Dopo 9 volte senza ricevuta la Vista lo dice («l'host non risponde»); se la ricevuta arriva tardi, l'esito vero si legge lo stesso (S.persi)
  function mandaSicura(m) {
    S.q = (S.q || (Date.now() % 1e9)) + 1; m.q = S.q;
    var v = { n: 0, t: 0 }; S.attese = S.attese || {}; S.attese[m.q] = v;
    (function giro() {
      if (!S.attese[m.q]) return;
      if (++v.n > 9 || !S.rete) { delete S.attese[m.q]; S.persi = S.persi || {}; S.persi[m.q] = Date.now(); if (UI && UI.ricevuta) UI.ricevuta(m.q, "rete"); return; }   // (9 volte in circa 3 s)
      // col filo aperto la mossa passa da lì: sul broker si vedrebbe chi l'ha fatta un attimo prima dell'effetto per tutti. Il broker è la riserva, dopo 0,4 s senza ricevuta (il filo può perdere)
      if (!perdo()) { if (v.n > 2 || !(S.filo && S.filo.pronto())) alBroker(m); if (S.filo) S.filo.invia(JSON.stringify(m)); }
      v.t = setTimeout(giro, 130 + v.n * 50);
    })();
  }
  // l'ultima foto dell'host (numero nel battito) non è arrivata: dopo un attimo la si chiede
  function controllaFoto(v) {
    if (v == null || S.vmV == null || v <= S.vmV) { S.mancaDa = 0; return; }
    var ora = Date.now(); if (!S.mancaDa) { S.mancaDa = ora; return; }
    if (ora - S.mancaDa >= 200 && ora - (S.rfT || 0) >= 400 && S.rete) { S.rfT = ora; S.rete.invia({ t: "rf" }); }
  }
  // l'host mi crede via ma io ci sono (una mossa persa, o un host nuovo che ha parlato prima di sapere di me): mi rifaccio vivo, al massimo una volta al secondo
  function miCredeVia(v) {
    var io = (v.players || []).filter(function (p) { return p.id === S.myId; })[0], ora = Date.now();
    if (!io || !io.via || !S.rete || !S.rete.riprova || ora - (S.viaT || 0) < 1000) return;
    S.viaT = ora; S.rete.riprova();
  }
  function fotoVecchia(v) {
    if (v.ver == null) return false;
    if (S.vmH === v.tiene && S.vmV != null && v.ver <= S.vmV) return true;
    S.vmH = v.tiene; S.vmV = v.ver; S.mancaDa = 0; return false;
  }
  var cb = { sonoHost: false, myId: null,
    mossa: function (m) {
      if (!S.rete) return;
      if (m.t === "a") return mandaSicura(m);
      if (perdo()) return;
      var sulFilo = S.filo && S.filo.pronto();
      if (sulFilo) S.filo.invia(JSON.stringify(m));
      if (sulFilo && m.t === "pc") return;   // (i passi del Burattinaio dicono chi è: col filo aperto sul broker non passano)
      // i passi sono 10 al secondo: sul broker 8 (il tetto di EMQX, vedi l'host), 3 o 4 se c'è il filo
      if (m.t === "p" || m.t === "pc") { S.pCr = Math.min(1.5, (S.pCr || 0) + (sulFilo ? 0.35 : 0.8)); if (S.pCr < 1) return; S.pCr -= 1; }
      if (m.t === "pc") alBroker(m); else S.rete.invia(m);   // (i passi del Burattinaio dicono chi è: gli altri passi sono nelle posizioni)
    },
    onEsci: function () {
      function via() { fermaPr(); chiudiFilo(); VOCE.chiudiStanza(); if (S.rete) S.rete.chiudi(); chiudiUI(); t.esci(); }
      if (t.guarda) return t.conferma("Smetti di guardare?", null, "Esci", via);
      if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", null, "Esci", via);
      via();
    } };
  if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
  function chiediNome() {
    var s = t.schermata({ icona: "🏮", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
    var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
    s._contenuto.appendChild(input);
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () { S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega(); } }));
    t.mostra(s);
  }
  function collega() {
    attesa();
    var cbRete = S.cbRete = {   // (il core ci mette il suo onHostVia, se la riserva è accesa)
      onAperto: function (id) { S.myId = id; cb.myId = id; VOCE.apri({ io: id, manda: function (m) { var f = S.filo && S.filo.pronto(); if (f && !m.b) S.filo.invia(JSON.stringify(m)); if (S.rete && (!f || !m.g)) S.rete.invia(m); } }); cifPronta(function () { if (S.rete) S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome), lenz: lenzMio(), ck: CIF.pub || undefined }); }); riferisci(true); fermaPr(); S.prInt = setInterval(ogniSecondo, 1000); },
      onMsg: function dalHost(m) {
        if (!m || !m.t || S.finita) return;
        if (m.to && m.to !== S.myId) return;
        if (rimescola(m, dalHost)) return;   // (solo per le prove)
        if (m.t === "fd") {   // il filo diretto: l'host lo apre, io rispondo
          if (window.LT_PROVA && window.LT_SALTAFD > 0) { window.LT_SALTAFD--; return; }   // (solo per le prove: il messaggio si perde)
          if (!S.filo) S.filo = new FiloDiretto(function (x) { if (S.rete) alBroker({ t: "fd", s: x }); }, dalHost);
          S.filo.segnale(m.s); return;
        }
        if (m.t === "z") { S.dalHost = dalHost; return apriZ(m); }
        if (m.u != null) { var uv = S.uViste || (S.uViste = []); if (uv.indexOf(m.u) >= 0) return; uv.push(m.u); if (uv.length > 80) uv.shift(); }   // già arrivato dall'altra strada
        if (perdo() && (m.t === "vm" || m.t === "pos" || m.t === "priv" || m.t === "ak")) return;
        if (m.t === "vm") { if (fotoVecchia(m.vm)) return; chiaveHost(m.vm); S.vm = m.vm; miCredeVia(m.vm); disegna(t, m.vm, cb); }
        else if (m.t === "pos") { S.posT = Date.now(); if (S.tace) taceHost(false, false); if (UI) UI.posizioni(m.p, m.s); controllaFoto(m.v); }
        else if (m.t === "ak") {   // la ricevuta: la mossa è arrivata, e com'è andata (e). Anche se arriva dopo che il telefono aveva smesso di ripeterla
          var at = S.attese && S.attese[m.q], tardi = !at && S.persi && S.persi[m.q];
          if (at) { clearTimeout(at.t); delete S.attese[m.q]; }
          if (tardi) delete S.persi[m.q];
          if ((at || tardi) && UI && UI.ricevuta) UI.ricevuta(m.q, m.e || "ok", m.v);
        }
        else if (m.t === "priv") {
          if (m.kp) { if (CIF.kp !== m.kp) CIF.kpK = null; CIF.kp = m.kp; }   // (sono un vice: serve ad aprire la copia della partita)
          if (m.r && UI && UI.priv && UI.priv.v === m.p.v) return;
          if (m.e != null) { if (S.privE === m.e && m.p.v < S.privV) return; S.privE = m.e; S.privV = m.p.v; }   // cifrare e strade diverse possono invertire: uno di prima non copre mai uno più nuovo
          if (UI) UI.privato(m.p); else PENDENTI.priv = m.p;
        }
        else if (m.t === "tp" || m.t === "avviso" || m.t === "morte" || m.t === "bolla") { if (UI) UI.messaggio(m); else conserva(m); }
        else if (m.t === "fx") { if (UI) UI.messaggio(m); }
        else if (m.t === "av") (m.l || []).forEach(function (x) { avatarDi(x[0], avatarValido(x[1])); });
        else if (m.t === "pm") { if (UI) UI.pronti(m.l); }   // chi ha la mappa pronta (messaggio piccolo)
        else if (m.t === "vc" || m.t === "vcl") VOCE.arriva(m);   // la voce: l'elenco di chi c'è e i messaggi di collegamento
      },
      onChiuso: function (perche) { fermaPr(); chiudiFilo(); VOCE.chiudiStanza(); chiudiUI(); errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
      onErrore: function () { fermaPr(); chiudiFilo(); VOCE.chiudiStanza(); if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
    };
    S.rete = SGNet.entra(codice, cbRete);
    if (window.LT_PROVA) { window.LT_RETE_O = S.rete; window.LT_S = S; }
    if (!S.rete) senzaRete(t);
  }
  function attesa() {
    var s = t.schermata({ icona: "🏮", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
    t.mostra(s);
  }
}
function conserva(m) { if (m.t === "tp") PENDENTI.tp = m; }
// SOLO PER LE PROVE (window.LT_RIMESCOLA = ms): ogni messaggio in arrivo tarda a caso fino a quei ms, e tre su dieci arrivano due volte.
// Serve a vedere che ordine rovesciato e doppioni finiscono nello stesso stato. Fuori dalle prove non fa niente
function rimescola(m, poi) {
  if (!window.LT_PROVA || !(window.LT_RIMESCOLA > 0) || m.__r || !/^(vm|pos|priv|ak|tp|avviso|morte|fx|bolla|a|p|pc|rf)$/.test(m.t)) return false;   // (i messaggi del filo, della voce e delle chiavi restano com'erano)
  var x = Object.assign({}, m, { __r: 1 }), ms = window.LT_RIMESCOLA;
  setTimeout(function () { poi(x); }, Math.random() * ms);
  if (Math.random() < 0.3) setTimeout(function () { poi(x); }, Math.random() * ms * 2);
  return true;
}

// =========================================================
//  DISEGNO: saletta, partita, fine
// =========================================================
var UI = null, FIN = null;
// la voce chiede i nomi e gli avvisi a chi sta disegnando il gioco
VOCE.nome = function (id) { var c = UI && UI.cache && UI.cache[id]; return c ? c.nome : ""; };
// gli avvisi della voce si scrivono nel tasto stesso, così non coprono mai niente; se il tasto non si vede, un bigliettino in basso
VOCE.avvisa = function (testo) {
  if (!/^Voce:/.test(testo)) { if (UI) UI.avviso(testo); return; }
  var corto = testo.replace(/^Voce:\s*/, ""), visibili = [].some.call(document.querySelectorAll(".lt-vbtn"), function (b) { return b.offsetParent; });
  corto = corto.charAt(0).toUpperCase() + corto.slice(1);
  if (!visibili) { if (UI) UI.avviso(corto, "voce"); return; }
  VOCE.detto = corto; VOCE.cambiato(); clearTimeout(VOCE.dettoT);
  VOCE.dettoT = setTimeout(function () { VOCE.detto = null; VOCE.cambiato(); }, 3200);
};
function chiudiUI() { if (UI) { UI.stop(); UI = null; } }
function disegna(t, vm, cb) {
  notaLenz(vm.players);
  if (vm.fase === "lobby" && (!vm.g || t.salettaClassica)) { chiudiUI(); FIN = null; return lobby(t, vm, cb); }
  if (vm.fase === "fine") {
    chiudiUI();
    var kf = "fine|" + vm.partita;
    if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
    FIN = { k: kf, t: t, s: finale(t, vm, cb) };
    return;
  }
  FIN = null;
  if (!UI || UI.t !== t || !document.body.contains(UI.s)) { chiudiUI(); UI = new Vista(t, cb); }
  if (window.LT_PROVA) window.LT_UI = UI;
  UI.foto(vm);
}
function lobby(t, vm, cb) {
  stile();
  vm.players.forEach(function (p) { if (p.omino) avatarDi(p.id, p.omino); });
  var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
  var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
  var extra = [];
  if (cb.sonoHost) {
    var nb = vm.players.filter(function (p) { return p.bot; }).length;
    extra.push(t.el("div", { class: "lt-bot" }, [
      t.el("button", { class: "btn btn-fantasma", text: "Aggiungi un Bot", onclick: cb.onBot }),
      nb ? t.el("button", { class: "btn btn-fantasma", text: "Togli un Bot", onclick: cb.onTogliBot }) : null ].filter(Boolean)));
  }
  if (vm.players.length < MIN) extra.push(t.el("p", { class: "modulo-nota", text: "Servono almeno " + MIN + " giocatori (anche Bot)." }));
  else if (vm.auto && vm.players.some(function (p) { return p.bot; })) extra.push(t.el("p", { class: "modulo-nota", text: "I Bot tengono i posti fino a " + RIEMPI + ": chi arriva prende il posto di un Bot." }));
  if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
  t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
    vuoti: Math.max(0, MIN - vm.players.length),
    giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, colore: COLORI_DI[p.id], host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
    extra: extra,
    spettatore: t.guarda ? "Guardi soltanto" : guardo ? "Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX ? "La stanza è piena: guardi la partita" : false,
    attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
}

var TITOLI = { ospiti: "Vincono gli ospiti", ombre: "Vincono le ombre", giullare: "Vince il Giullare", accusatore: "Vince l'Accusatore", avvoltoio: "Vince l'Avvoltoio", indovino: "Vince l'Indovino" };
function titoloVince(v) { return !v ? "Fine della notte" : TITOLI[v.chi] || "Fine della notte"; }
// chi ha vinto, dai ruoli svelati a fine partita (la stessa regola della classifica)
function vincitoriDi(v) {
  if (!v || !v.ruoli) return [];
  return v.ruoli.filter(function (r) { var ru = RUOLI[r[1]] || {}; return (v.id ? r[0] === v.id : ru.squadra === v.chi) || (r[1] === "sopravvissuto" && r[2]) || (r[1] === "gatto" && r[2] && v.chi !== "ombre"); }).map(function (r) { return r[0]; });
}
function finale(t, vm, cb) {
  stile();
  var f = vm.fine || {}, v = f.vincitore;
  var s = t.schermata({});
  var targa = !!t.guarda && !t.eliminazione, cl = (vm.classifica || []).slice().sort(function (a, b) { return a.pos - b.pos; }), fac = targa ? null : t.faccine();
  s.classList.add("lt-fine"); if (targa) s.classList.add("lt-fine-targa");
  // l'ultima pagina del registro: chi ha vinto e chi ha perso, a due colonne, con ritratto, nome e ruolo
  var pag = E("div", "lt-foglio lt-ultima"), tes = E("div", "tes"), mio = cl.filter(function (r) { return r.id === cb.myId; })[0]; if (mio && mio.pos !== 1) pag.classList.add("perso");
  tes.append(E("p", "occh", "Ultima pagina"), E("h2", "", titoloVince(v))); if (v) tes.appendChild(E("p", "lt-perche", v.perche));
  pag.append(intestazione("Registro di Palazzo Velmare"), tes);
  var ruoli = {}; (f.ruoli || []).forEach(function (r) { ruoli[r[0]] = r; });
  var vinti = cl.filter(function (r) { return r.pos === 1; }), persi = cl.filter(function (r) { return r.pos !== 1; });
  var righeF = Math.max(vinti.length, persi.length, 1), quadro = E("div", "classifica" + (vinti.length && persi.length ? "" : " solo") + (righeF <= 4 ? " pochi" : "")); quadro.style.setProperty("--n", righeF);
  [[vinti, "Vincitori", "vinc"], [persi, "Sconfitti", "scon"]].forEach(function (x) {
    if (!x[0].length) return;
    var col = E("div", "col " + x[2]), righe = E("div", "righe"); col.append(E("h3", "", x[1]), righe);
    x[0].forEach(function (r) {
      var ru = ruoli[r.id], nomeR = ru && RUOLI[ru[1]] ? RUOLI[ru[1]].nome : "", spento = ru && !ru[2], rg = E("div", "rg" + (r.pos === 1 ? " vincitore" : "") + (spento ? " spento" : "")), tx = E("div");
      var riga2 = E("span", "punti lt-ruolo"); riga2.append(tintaDi(r.id), E("span", "ru", (nomeR ? nomeR : "") + (spento ? (nomeR ? ", " : "") + "spento" : "")));   // (il ruolo è il dato di questa pagina: va a capo, mai tagliato; con la virgola la riga spezzata si legge)
      tx.append(E("span", "nome", r.id === cb.myId ? r.nome + " (tu)" : r.nome), riga2);
      rg.append(ritratto(r.id), tx); righe.appendChild(rg);
    });
    quadro.appendChild(col);
  });
  pag.append(quadro, E("i", "chiusa")); s._contenuto.appendChild(pag); ltSfuma(quadro);   // il sigillo chiude il registro della notte
  // sotto il foglio, sul tavolo, un vassoio solo: la voce e le faccine dell'app
  var vass = E("div", "fine-fila");
  if (!targa && cb.myId) vass.appendChild(creaVoce("riga fine"));   // a partita finita la voce resta accesa e si sentono tutti
  if (fac) { fac.classList.add("fine-faccine"); vass.appendChild(fac); }
  if (vass.firstChild) s._contenuto.appendChild(vass);
  if (!cl.some(function (r) { return r.id === cb.myId; })) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
  if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: targa ? "Se si gioca ancora, entri anche tu nella saletta." : "Se si gioca ancora, torni da solo nella saletta." }));
    if (!targa) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "Esci", onclick: cb.onEsci }));
  }
  senzaEmoji(s._piede);
  t.mostra(s);
  return s;
}
function errore(t, testo) {
  var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
  s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
  s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Torna alla home", onclick: t.esci }));
  t.mostra(s);
}
function erroreRete(t, testo, riprova) {
  var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
  s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
  s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
  s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "Torna alla home", onclick: t.esci }));
  t.mostra(s);
}
function senzaRete(t) {
  var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
  s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Questo gioco si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
  s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
  t.mostra(s);
}

// =========================================================
//  LA SCHERMATA DI GIOCO (costruita una volta, poi aggiornata a pezzi)
// =========================================================
// le icone del gioco: disegni a tratto (niente emoji), colore del testo intorno
var ICONE = {
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
  micOff: '<path d="M12 19v3M15 9.3V5a3 3 0 0 0-5.7-1.3M17 17A7 7 0 0 1 5 12v-2M19 12v-2M2 2l20 20M9 9v3a3 3 0 0 0 5.1 2.1"/>',
  cuffia: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  esciVoce: '<path d="M6 6l12 12M18 6L6 18"/>',
  parla: '<path d="M4 5h16v10H10l-5 4v-4H4z"/>',
  invia: '<path d="M4 12h14M13 6l6 6-6 6"/>',
  mappa: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  suono: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.6 6.4a7.6 7.6 0 0 1 0 11.2"/>',
  muto: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
  vota: '<path d="M4 11h16v9H4z"/><path d="M8 11V4h8v7M10 7.5h4"/>',
  sospetto: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',
  pulito: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  piu: '<path d="M12 5v14M5 12h14"/>',
  meno: '<path d="M5 12h14"/>',
  salta: '<path d="M5 6l7 6-7 6M13 6l7 6-7 6"/>',
  pin: '<path d="M12 21s-6-6.3-6-11a6 6 0 0 1 12 0c0 4.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  boh: '<path d="M9 9a3 3 0 1 1 4.6 2.5c-1 .7-1.6 1.3-1.6 2.5"/><path d="M12 18.2v.3"/>',
  partita: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  campana: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  maschera: '<path d="M3 6c3 1 6 1 9 0 3 1 6 1 9 0 0 7-3 12-9 12S3 13 3 6z"/><path d="M7.5 10.5h3M13.5 10.5h3"/>',
  potere: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/>',
  sabota: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  lanterna: '<path d="M9 4h6M10 4V2.5h4V4M7 7h10l-1 12H8z"/><path d="M12 10c1.4 1.4 1.4 3.6 0 5-1.4-1.4-1.4-3.6 0-5z"/>',
  corona: '<path d="M4 18h16M5 17l-1-9 4.5 4L12 6l3.5 6L20 8l-1 9"/>',
  bersaglio: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
  buio: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  antenna: '<path d="M12 12v9M8 21h8"/><circle cx="12" cy="10" r="2"/><path d="M8.5 6.5a5 5 0 0 0 0 7M15.5 6.5a5 5 0 0 1 0 7M5.5 3.5a9 9 0 0 0 0 13M18.5 3.5a9 9 0 0 1 0 13"/>',
  onda: '<path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 14c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>',
  gira: '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M3.5 9.5A9 9 0 0 1 7 5M20.5 14.5A9 9 0 0 1 17 19"/><path d="M3 6.5l.5 3 3-.5M21 17.5l-.5-3-3 .5"/>',
  // --- le immagini dietro le scritte dei tasti rotondi (tabella TASTO_ICONA qui sotto) ---
  compiti: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8.5 8.5l1.4 1.4 2.4-2.6M8.5 14l1.4 1.4 2.4-2.6M14.5 9h2M14.5 14.5h2"/>',
  t_usa: '<path d="M9 11.5V5.2a1.6 1.6 0 0 1 3.2 0V10"/><path d="M12.2 9.6a1.6 1.6 0 0 1 3.1.4v1.2"/><path d="M15.3 11a1.6 1.6 0 0 1 3.1.5v4.2a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.6-2.1L4.4 15.6a1.6 1.6 0 0 1 2.4-2.1L9 15.4"/>',
  t_computer: '<rect x="3" y="4" width="18" height="12.5" rx="1.6"/><path d="M7 8h7M7 11h4.5M8 20.5h8M12 16.5v4"/>',
  t_ripara: '<path d="M14.8 3.8a5 5 0 0 0-4.6 6.9L3.9 17a2.2 2.2 0 0 0 3.1 3.1l6.3-6.3a5 5 0 0 0 6.9-4.6l-3.1 2.2-2.4-.5-.5-2.4z"/><circle cx="5.5" cy="18.5" r=".7"/>',
  t_sabota: '<path d="M14.8 3.8a5 5 0 0 0-4.6 6.9L3.9 17a2.2 2.2 0 0 0 3.1 3.1l6.3-6.3"/><path d="M13.3 13.8a5 5 0 0 0 6.9-4.6l-3.1 2.2-2.4-.5-.5-2.4 2.3-3.1M19 15.5l1.5 1.5M16 17.5l.4 2.2M20.6 19.4l1 .2"/>',
  t_segnala: '<path d="M2.5 20h19"/><path d="M8.5 14.2h9.5a3 3 0 0 1 3 3V20H8.5z"/><circle cx="5.8" cy="17" r="2.4"/><path d="M14 3.5v6M14 12.2v.4"/>',
  t_spegni: '<path d="M9.5 5.5a2.5 2.5 0 0 1 5 0"/><path d="M8 6.5h8l1 2H7z"/><path d="M7.5 8.5h9l-.9 9.5H8.4z"/><path d="M7 18h10v2.2H7z"/><path d="M12 3.2c1.300-1 .1-1.800 1.200-2.600" transform="translate(0 0.5)"/><path d="M10.200 12.500h3.600"/>',
  t_avvelena: '<path d="M9.2 3h5.6M10.2 3v5.4L5.6 17a3 3 0 0 0 2.7 4.3h7.4a3 3 0 0 0 2.7-4.3l-4.6-8.6V3"/><path d="M7.4 14.5h9.2"/><circle cx="10.5" cy="18" r=".8"/><circle cx="14" cy="17" r=".6"/>',
  t_botola: '<rect x="3" y="5" width="18" height="14" rx="1.8"/><path d="M7 9.2h10M7 12h10M7 14.8h10"/><circle cx="5.3" cy="7" r=".5"/><circle cx="18.7" cy="7" r=".5"/><circle cx="5.3" cy="17" r=".5"/><circle cx="18.7" cy="17" r=".5"/>',
  t_lenzuolo: '<path d="M5 20.5V10.5a7 7 0 0 1 14 0v10l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z"/><circle cx="9.7" cy="10.5" r=".9"/><circle cx="14.3" cy="10.5" r=".9"/>',
  t_schermi: '<rect x="3" y="4" width="8" height="6.5" rx="1"/><rect x="13" y="4" width="8" height="6.5" rx="1"/><rect x="3" y="13" width="8" height="6.5" rx="1"/><rect x="13" y="13" width="8" height="6.5" rx="1"/>',
  t_plastico: '<path d="M2.5 16.5l9.5 4.5 9.5-4.5-9.5-4.5z"/><path d="M6.5 14.6V8.5l5.5-2.4 5.5 2.4v6.1M12 6.1V3M9.3 10.2h.1M14.6 10.2h.1"/>',
  t_leggi: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r=".7"/>',
  t_letto: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><path d="M4 4l16 16"/>',
  t_schermo: '<rect x="3" y="4" width="18" height="12" rx="1.6"/><path d="M8.5 20h7M12 16v4"/><path d="M6 10s2-3 6-3 6 3 6 3-2 3-6 3-6-3-6-3z"/><circle cx="12" cy="10" r="1.2"/>',
  t_trappola: '<circle cx="12" cy="12" r="8.500"/><path d="M3.500 12l2-3.200 2 3.200 2-3.200 2 3.200 2-3.200 2 3.200 2-3.200 2 3.200"/><path d="M3.500 12l2 3.200 2-3.200 2 3.200 2-3.200 2 3.200 2-3.200 2 3.200 2-3.200"/><circle cx="12" cy="12" r="1.600"/>',
  t_scambia: '<path d="M4 8h14M14.5 4.5L18 8l-3.5 3.5M20 16H6M9.5 12.5L6 16l3.5 3.5"/>',
  t_scudo: '<path d="M12 3l7.5 2.8v5.7c0 4.4-3 8-7.5 9.5-4.5-1.5-7.5-5.1-7.5-9.5V5.8z"/><path d="M12 7.5v9"/>',
  t_proteggi: '<path d="M12 3l7.5 2.8v5.7c0 4.4-3 8-7.5 9.5-4.5-1.5-7.5-5.1-7.5-9.5V5.8z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  t_spara: '<circle cx="12" cy="12" r="7.5"/><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/><circle cx="12" cy="12" r=".9"/>',
  t_campana: '<path d="M6 16.5v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0M12 3v2.5"/><path d="M3 9a10 10 0 0 1 2-3M21 9a10 10 0 0 0-2-3"/>',
  t_segui: '<path d="M8 3.500c-2 0-3.200 2.200-3 4.700.2 2 1.200 3.300 2.700 3.300S10.200 10.200 10 8.200C9.800 5.700 9.200 3.500 8 3.500z"/><circle cx="7.300" cy="14.200" r="1.800"/><path d="M16.500 10c-2 0-3.200 2.200-3 4.700.2 2 1.200 3.300 2.700 3.300s2.800-1.300 2.600-3.300c-.2-2.500-.8-4.700-2.300-4.700z"/><circle cx="15.800" cy="20.600" r="1.600"/>',
  t_bengala: '<path d="M10 21l4.5-9"/><path d="M14.5 12l2.5-5"/><path d="M17 7V2.5M17 7l3.5-2.5M17 7l-3.5-2.5M17 7l4 1.5M17 7l-4 1.5"/>',
  t_telecamera: '<rect x="2.5" y="7" width="13" height="10" rx="2"/><path d="M15.5 11l6-3.5v9l-6-3.5z"/><circle cx="7" cy="12" r="1.5"/>',
  t_allerta: '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  t_sorveglia: '<path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21M3 21h18"/><circle cx="15.5" cy="15.5" r=".8"/><path d="M8.5 9s1.5-2 3.5-2 3.5 2 3.5 2-1.5 2-3.5 2-3.5-2-3.5-2z"/>',
  t_riaccendi: '<path d="M9.5 5.5a2.5 2.5 0 0 1 5 0"/><path d="M8 6.5h8l1 2H7z"/><path d="M7.5 8.5h9l-.9 9.5H8.4z"/><path d="M7 18h10v2.2H7z"/><path d="M12 10.5c1.7 1.6 1.7 3.8 0 5.2-1.7-1.400-1.700-3.600 0-5.200z"/>',
  t_ricatta: '<rect x="3" y="5.5" width="18" height="13" rx="1.8"/><path d="M3.5 7l8.5 6 8.5-6"/><circle cx="12" cy="15.5" r="1.2"/>',
  t_nebbia: '<path d="M7 10a4 4 0 0 1 7.5-1.5A3.2 3.2 0 0 1 17 15H7a2.5 2.5 0 0 1 0-5z"/><path d="M4 18.5h8M14 18.5h6M7 21.5h10"/>',
  t_campiona: '<path d="M3 6c3 1 6 1 9 0 3 1 6 1 9 0 0 7-3 12-9 12S3 13 3 6z"/><path d="M7.5 10.5h3M13.5 10.5h3"/><path d="M8 20.5h8M14 19l2 1.5-2 1.5"/>',
  t_controlla: '<path d="M5 3.500h14M8 3.500l3 7.500M16 3.500l-3 7.500M12 3.500V9"/><circle cx="12" cy="13.200" r="2.200"/><path d="M12 15.400v3.600M9 17l3-.8 3 .8M10.200 21.500L12 19l1.800 2.500"/>',
  t_pulisci: '<path d="M14 3.5l-4.5 8"/><path d="M9.5 11.5c-3 .5-5.5 3-6 9 4 .5 9 .5 12.5-1.5.5-2.5-.5-5.5-3-7.5"/><path d="M7 14.5l-.5 5M10.5 15l-.5 4.5M13.5 15.5l-1 3.5"/>',
  t_ipnotizza: '<path d="M12 12a1.5 1.5 0 0 1 3 0 3.5 3.5 0 0 1-7 0 5.5 5.5 0 0 1 11 0 7.5 7.5 0 0 1-15 0"/>',
  t_mangia: '<path d="M8 3v6.500a2.500 2.500 0 0 0 5 0V3M10.500 3v18"/><path d="M17.500 3c-2 1.500-3 4-3 7h3v11"/>',
  t_foto: '<rect x="3.5" y="3.5" width="17" height="17" rx="1.8"/><circle cx="12" cy="10.5" r="3.8"/><path d="M3.5 16.5h17"/>',
  t_potere: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/>'
};
// tabella unica: scritta del tasto (senza il « ×N» dei conti) → immagine. Ogni tasto nuovo ha qui la sua riga.
var TASTO_ICONA = {
  usa: "t_usa", computer: "t_computer", ripara: "t_ripara", campana: "t_campana", schermi: "t_schermi", plastico: "t_plastico",
  segnala: "t_segnala", spegni: "t_spegni", avvelena: "t_avvelena", botola: "t_botola", sabota: "t_sabota", buio: "t_sabota", lenzuolo: "t_lenzuolo",
  leggi: "t_leggi", letto: "t_letto", schermo: "t_schermo", trappola: "t_trappola", scambia: "t_scambia", scudo: "t_scudo", proteggi: "t_proteggi", spara: "t_spara",
  segui: "t_segui", bengala: "t_bengala", telecamera: "t_telecamera", allerta: "t_allerta", sorveglia: "t_sorveglia", riaccendi: "t_riaccendi",
  ricatta: "t_ricatta", nebbia: "t_nebbia", campiona: "t_campiona", trasformati: "t_campiona", controlla: "t_controlla", pulisci: "t_pulisci", ipnotizza: "t_ipnotizza", mangia: "t_mangia", foto: "t_foto"
};
var TASTO_ICONA_K = { usa: "t_usa", segnala: "t_segnala", spegni: "t_spegni", botola: "t_botola", buio: "t_sabota", lenz: "t_lenzuolo", abil: "t_potere" };
function icona(n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONE[n] || "") + "</svg>"; }
// un tasto con icona e scritta
function tastoIco(cls, ico, testo) { var b = document.createElement("button"); b.type = "button"; if (cls) b.className = cls; b.innerHTML = icona(ico) + (testo ? "<span>" + testo + "</span>" : ""); return b; }
function E(tag, cls, testo) { var e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; }
// il ritratto di un ospite: il suo telo a mezzo busto. Se non si sa ancora di chi è, una sagoma scura
function ritratto(id) {
  var d = LENZ_DI[id], u = d ? ritrattoUrl(d.c) : "", f;
  if (u) { f = new Image(); f.src = u; f.alt = ""; f.className = "faccia"; return f; }
  return E("i", "pall");
}
// il colore detto a parole, con la sua tinta accanto: «ho visto Mario, quello rosso»
function tintaDi(id) { var L = panno(id), s = E("span", "lt-tinta"), i = E("i"); i.style.background = L.b; s.append(i, L.n); return s; }
function pezzetta(id) { var i = E("i", "lt-pz"); i.style.background = panno(id).b; return i; }
// lo stemma del palazzo, inciso: uno scudo con la lanterna
var STEMMA = '<svg class="stemma" viewBox="0 0 28 32" aria-hidden="true"><path d="M3 3.5h22v14c0 6-5.2 9.6-11 12.4C8.2 27.1 3 23.5 3 17.5z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.3 5.8h17.4v11.6c0 4.7-3.9 7.7-8.7 10.1-4.8-2.4-8.7-5.4-8.7-10.1z" fill="none" stroke="currentColor" stroke-width=".6"/><path d="M11.8 9.2a2.2 2.2 0 0 1 4.4 0M10 11.6h8l-1.6-2.2h-4.8zM10.7 11.6l-.9 9.4h8.4l-.9-9.4zM8.8 21h10.4v1.8H8.8z" fill="currentColor"/><path d="M14 13.4c1.5 1.7 1.5 3.7 0 5.2-1.5-1.5-1.5-3.5 0-5.2z" fill="#f4e6c6"/></svg>';
function intestazione(testo) { var d = E("div", "intest"); d.innerHTML = STEMMA; d.appendChild(E("span", "", testo)); return d; }
// una sfumatura in fondo a ogni zona che scorre: dice che c'è dell'altro. Si aggiorna scorrendo; chi cambia il contenuto richiama quello che restituisce
function ltSfuma(el) {
  el.classList.add("lt-sf");
  function agg() { el.classList.toggle("lt-piu", el.scrollHeight - el.clientHeight - el.scrollTop > 6); }
  el.addEventListener("scroll", agg, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(agg).observe(el);
  setTimeout(agg, 0); return agg;
}
// l'app scrive i suoi tasti con le emoji: sulle schermate di Lanterne si tolgono
var EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{25B6}]/gu;
function senzaEmoji(box) { [].forEach.call(box.querySelectorAll("button"), function (b) { var tx = b.textContent.replace(EMOJI, "").trim(); if (tx && tx !== b.textContent) b.textContent = tx; }); }
// «Era un'ombra (Ombra).» ripete la parola: si scrive solo il ruolo, se dice qualcosa in più
function testoEsito(s) { return String(s || "").replace(/(Non era|Era) un'ombra \(([^)]+)\)\./, function (m, a, r) { return /^(Ombra|Ospite)$/.test(r) ? a + " un'ombra." : a + " un'ombra: " + r + "."; }); }
// un tocco che funziona anche con l'altro dito sul joystick: su iPhone il «click» non parte finché c'è un altro dito sullo schermo, «touchend» sì.
// Il «click» resta per mouse e tastiera (se è appena partito il tocco, non conta due volte).
function tocca(el, fn) {
  var su = false, ultimo = -1e9;
  el.addEventListener("touchstart", function () { su = true; }, { passive: true });
  el.addEventListener("touchcancel", function () { su = false; }, { passive: true });
  el.addEventListener("touchend", function (e) { if (!su) return; su = false; if (e.cancelable) e.preventDefault(); ultimo = performance.now(); if (!el.disabled) fn(e); });
  el.addEventListener("click", function (e) { if (performance.now() - ultimo > 500) fn(e); });
}
// Il tasto della voce (uguale nel gioco, nella riunione e a fine partita). Il microfono resta sempre acceso e si parla e si ascolta insieme,
// come dal vivo: niente turni. Prima c'è solo l'invito «Attiva la voce» (il tocco chiede il permesso); poi resta un tasto piccolo «Muto»
// che spegne e riaccende il microfono. Chi parla si vede dall'anello sotto i piedi, non da una scritta.
var VOCE_ET = { spenta: ["mic", "Attiva la voce"], ascolto: ["mic", "Attiva la voce"], accendo: ["mic", "Attivo…"], parlo: ["mic", "Muto"], muto: ["micOff", "Muto"] };
function creaVoce(extra) {
  var el = E("div", "lt-voce" + (extra ? " " + extra : "")), b = E("button", "lt-vbtn"), visto = false;
  b.type = "button"; el.appendChild(b);
  tocca(b, function () { VOCE.tocca(); });
  function agg() {
    if (el.isConnected) visto = true; else if (visto) return false;   // tolto dalla pagina: smetto di aggiornarlo
    var st = VOCE.stato, e = VOCE_ET[st] || VOCE_ET.spenta, detto = VOCE.detto, k = st + "|" + VOCE.disponibile() + "|" + (detto || "");
    if (el._k === k) return true; el._k = k;
    el.hidden = !VOCE.disponibile();
    b.className = "lt-vbtn " + (st === "ascolto" ? "spenta" : st) + (detto ? " detto" : ""); b.innerHTML = icona(e[0]) + "<span>" + (detto || e[1]) + "</span>"; b.disabled = st === "accendo";
    b.setAttribute("aria-label", st === "parlo" ? "Microfono acceso: tocca per mettere il muto" : st === "muto" ? "Microfono in muto: tocca per riaccenderlo" : st === "accendo" ? "Attivo la voce" : "Attiva la voce: parli e senti chi ti passa vicino");
    if (st === "parlo" || st === "muto") b.setAttribute("aria-pressed", st === "muto" ? "true" : "false"); else b.removeAttribute("aria-pressed");
    return true;
  }
  VOCE.suCambio(agg);
  return el;
}
function Vista(t, cb) {
  stile();
  teliAzzera();
  var V = this; V.t = t; V.cb = cb; V.vivo = true;
  V.s = t.schermata({}); V.s.classList.add("lt-piena");
  var sc = E("div", "lt-scena"); V.s._contenuto.appendChild(sc); V.sc = sc;
  // il gioco segue il telefono (verticale o orizzontale). Chi ha la rotazione bloccata e vuole giocare di lato
  // tocca il tasto «gira» in alto: col telefono in verticale la scena si gira (il telefono se lo ricorda)
  try { V.oriz = localStorage.getItem("lt-oriz") === "1"; } catch (e) { V.oriz = false; }
  V.ruota = function () {
    var W = window.innerWidth, H = window.innerHeight, gira = V.oriz && H > W * 1.05;
    V.girato = gira; sc.classList.toggle("lt-ruota", gira);
    var lw = gira ? H : W, lh = gira ? W : H; sc.classList.toggle("oriz", lw > lh * 1.05);   // schermo largo: riunione e pannelli si dispongono di lato
    sc.style.width = gira ? H + "px" : ""; sc.style.height = gira ? W + "px" : "";
    sc.style.transform = gira ? "translate(" + W + "px,0) rotate(90deg)" : "";
  };
  V.ruota(); window.addEventListener("resize", V.ruota); window.addEventListener("orientationchange", V.ruota);
  // niente zoom col doppio tocco o col pizzico mentre si gioca
  V.noZoom = function (e) { e.preventDefault(); }; document.addEventListener("gesturestart", V.noZoom);
  V.cv = E("canvas", "lt-cv"); sc.appendChild(V.cv); V.pit = new Pittore(V.cv);
  V.joyZona = E("div", "lt-joyzona"); V.joy = E("div", "lt-joy"); V.knob = E("div", "lt-knob"); V.joy.appendChild(V.knob); V.joyZona.appendChild(V.joy); sc.appendChild(V.joyZona);
  var sx = E("div", "lt-sx");
  var esci = E("button", "lt-esci", "‹"); esci.setAttribute("aria-label", "Esci"); esci.addEventListener("click", cb.onEsci);
  // il nome del ruolo è il tasto unico: cosa fa il mio ruolo, il mio tasto, come si vince
  V.chip = E("button", "lt-chip", ""); V.chip.type = "button"; V.chip.setAttribute("aria-label", "Il tuo ruolo");
  tocca(V.chip, function () { V.apriInfo(); });
  sx.appendChild(E("div", "lt-riga", null)); sx.firstChild.append(esci, V.chip);
  V.barra = E("div", "lt-barra"); V.barra.innerHTML = '<span>Preparativi</span><div class="tr"><i></i></div>'; sx.appendChild(V.barra);
  V.info = E("div", "lt-info", ""); V.info.hidden = true; sx.appendChild(V.info);
  V.registroBox = E("div"); sx.appendChild(V.registroBox);
  V.btnLista = E("button", "lt-lista-btn", "Compiti"); V.btnLista.type = "button"; sx.appendChild(V.btnLista);
  V.lista = E("ol", "lt-lista"); V.lista.hidden = true; sx.appendChild(V.lista);
  tocca(V.btnLista, function () { V.lista.hidden = !V.lista.hidden; V.aggLista(); });
  sc.appendChild(sx);
  var dx = E("div", "lt-dx"); V.btnSuono = E("button", "lt-hbtn ico"); V.btnSuono.innerHTML = icona(AUDIO.muto ? "muto" : "suono"); V.btnSuono.setAttribute("aria-label", "Suono"); V.btnMappa = E("button", "lt-hbtn"); V.btnMappa.innerHTML = icona("mappa") + "<span>Mappa</span>"; V.btnMappa.setAttribute("aria-label", "Mappa"); dx.append(V.btnSuono, V.btnMappa); sc.appendChild(dx);
  tocca(V.btnMappa, function () { V.apriMappa(); });
  // la chat di prossimità: «Parla» apre la barra in basso (sempre sopra la tastiera). Il messaggio compare come fumetto sopra chi parla
  // e nello storico di chi lo sente: l'host lo manda solo a chi è abbastanza vicino. In riunione è spenta (c'è la chat della riunione).
  V.bolle = []; V.storico = []; V.bVisti = []; V.ultimoParla = -99999; V.parlaAttesa = 0; V.parlaAlza = 0; V.parlaAlzaVista = 0; V.parlaSotto = -1;
  V.btnGira = E("button", "lt-hbtn ico"); V.btnGira.innerHTML = icona("gira"); V.btnGira.setAttribute("aria-label", "Gioca di lato"); dx.insertBefore(V.btnGira, dx.firstChild);
  V.btnGira.classList.toggle("acceso", !!V.oriz);
  tocca(V.btnGira, function () { V.oriz = !V.oriz; try { localStorage.setItem("lt-oriz", V.oriz ? "1" : "0"); } catch (e) {} V.btnGira.classList.toggle("acceso", V.oriz); V.joyReset(); V.ruota(); });
  V.btnParla = E("button", "lt-hbtn ico"); V.btnParla.innerHTML = icona("parla"); V.btnParla.setAttribute("aria-label", "Parla a chi è vicino"); dx.insertBefore(V.btnParla, V.btnMappa);
  V.parlaBar = E("form", "lt-parla"); V.parlaBar.hidden = true; V.parlaBar.setAttribute("autocomplete", "off");
  var pTesta = E("div", "lt-pt"); V.parlaUdi = E("span", "lt-udi", ""); V.parlaCont = E("span", "lt-cont", "0/" + MAX_PARLA); pTesta.append(V.parlaUdi, V.parlaCont);
  var pCho = E("div", "lt-pcho"); PARLA_RAPIDE.forEach(function (f) { var b = E("button", "", f); b.type = "button"; b.addEventListener("click", function () { V.parlaManda(f); }); pCho.appendChild(b); });
  var pRiga = E("div", "lt-priga"), pIn = E("input"), pOk = E("button");
  pIn.type = "text"; pIn.maxLength = MAX_PARLA; pIn.placeholder = "Scrivi a chi è vicino"; pIn.setAttribute("enterkeyhint", "send"); pIn.setAttribute("autocomplete", "off"); pIn.setAttribute("aria-label", "Messaggio a chi è vicino");
  pOk.type = "submit"; pOk.innerHTML = icona("invia"); pOk.setAttribute("aria-label", "Invia");
  pRiga.append(pIn, pOk); V.parlaBar.append(pTesta, pCho, pRiga); sc.appendChild(V.parlaBar); V.parlaIn = pIn;
  V.parlaStor = E("div", "lt-chatst"); V.parlaStor.setAttribute("aria-live", "polite"); sc.appendChild(V.parlaStor);
  tocca(V.btnParla, function () { V.parlaApri(); });
  V.parlaBar.addEventListener("submit", function (e) { e.preventDefault(); V.parlaManda(pIn.value); });   // Invio: manda e chiude
  pIn.addEventListener("input", function () { V.parlaConta(); });
  pIn.addEventListener("keydown", function (e) { if (e.key === "Escape") V.parlaApri(false); });
  V.parlaVV = function () { V.parlaPosiz(); V.chatPosiz(); };   // la tastiera di iPhone cambia il «visualViewport»: la barra la segue
  if (window.visualViewport) { visualViewport.addEventListener("resize", V.parlaVV); visualViewport.addEventListener("scroll", V.parlaVV); }
  tocca(V.btnSuono, function () { AUDIO.muto = !AUDIO.muto; try { localStorage.setItem("lt-muto", AUDIO.muto ? "1" : "0"); } catch (e) {} V.btnSuono.innerHTML = icona(AUDIO.muto ? "muto" : "suono"); if (!AUDIO.muto) SUONO.voto(); });
  V.s.addEventListener("pointerdown", function (e) { if (e.isTrusted) AUDIO.toccato = true; audio(); }, { passive: true });
  // la voce di prossimità: i tasti sotto la fila in alto a destra; la regola di chi sente chi la legge dalla foto di questo telefono
  V.voceGr = E("div", "lt-vx"); V.voceGr.hidden = true; V.voceGr.appendChild(creaVoce()); sc.appendChild(V.voceGr);
  V.voceA = {}; VOCE.fonte = function () { return V.vivo ? V.statoVoce() : null; }; VOCE.fonteDi = V;
  // al primo tocco nella saletta parte la richiesta del microfono (su iPhone l'audio parte solo da un gesto: «touchend» e «click» lo sono, «pointerdown» no).
  // Poi la voce resta accesa per tutta la partita e quelle dopo. Se il microfono era stato negato, non insiste: c'è il tasto «Attiva la voce».
  V.primoTocco = function (e) {
    if (!V.vivo || V.guardo || !V.priv || !VOCE.disponibile() || !VOCE.vuoleAuto()) return;
    var el = e && e.target && e.target.closest ? e.target.closest(".lt-esci,.lt-voce") : null; if (el) return;   // «Esci» e il tasto stesso fanno per conto loro
    VOCE.entra(true);
  };
  sc.addEventListener("touchend", V.primoTocco, true); sc.addEventListener("click", V.primoTocco, true);
  V.guida = E("div", "lt-guida"); sc.appendChild(V.guida);
  V.nomeStanza = E("div", "lt-nomestanza"); V.nomeStanza.setAttribute("aria-live", "polite"); sc.appendChild(V.nomeStanza);
  V.via = E("div", "lt-via"); sc.appendChild(V.via);
  V.az = E("div", "lt-azioni"); sc.appendChild(V.az);
  V.btn = {};
  [["abil", "Abilità", "viola"], ["botola", "Botola", "rosso"], ["buio", "Buio", "rosso"], ["segnala", "Segnala", ""], ["spegni", "Spegni", "rosso"], ["usa", "Usa", "oro"], ["lenz", "Lenzuolo", "telo"]].forEach(function (b) {
    var e = E("button", "lt-az " + b[2]); e.innerHTML = '<span class="ic" aria-hidden="true"></span><span class="et"></span><span class="cd" hidden></span>'; e.dataset.k = b[0]; e.style.gridArea = b[0] === "lenz" ? "spegni" : b[0];   // (il tasto del lenzuolo c'è solo nella saletta: accanto a «Usa»)
    e.addEventListener("pointerdown", function (ev) { ev.preventDefault(); if (!e.disabled) V.azione(b[0]); });
    V.btn[b[0]] = e; V.az.appendChild(e);
  });
  V.avv = E("div", "lt-avviso"); sc.appendChild(V.avv);
  V.velo = E("div", "lt-velo"); V.velo.hidden = true; sc.appendChild(V.velo);
  V.taceEl = E("div", "lt-tace"); V.taceEl.setAttribute("role", "status"); V.taceEl.innerHTML = icona("lanterna") + "<span>L'host non risponde</span>"; sc.appendChild(V.taceEl);   // (dopo il velo: sui fogli sta in basso, vedi la CSS)
  V.intro = E("div", "lt-intro"); V.intro.hidden = true; sc.appendChild(V.intro);
  V.carica = E("div", "lt-carica"); V.carica.hidden = true; V.carica.setAttribute("role", "status");   // il caricamento a tutto schermo (a «Comincia», o entrando a partita già cominciata)
  V.carica.innerHTML = icona("lanterna") + '<b class="tit"></b><div class="bar"><i></i></div><span class="num"></span>'; sc.appendChild(V.carica);
  V.fermo = E("div", "lt-fermo", "FERMO"); V.fermo.appendChild(E("small", "", "Qualcuno ti sta controllando")); V.fermo.hidden = true; sc.appendChild(V.fermo);
  V.registro = E("ol", "lt-registro"); V.registro.hidden = true;
  V.effetti = []; V.scossa = 0; V.bloccFine = 0; V.rianFine = 0; V.rianTot = 1; V.tracciaFine = 0; V.orme = []; V.letti = {}; V.allFine = 0; V.pannello = null;
  // stato
  V.vm = null; V.g = null; V.M = ATRIO; V.priv = null; V.cdFine = 0; V.cdAFine = 0; V.cdBFine = 0;
  V.me = { x: ATRIO.centro.x, y: ATRIO.centro.y, dir: Math.PI / 2, muove: false, ep: 0, n: 0, ok: false };
  V.buf = []; V.joyV = { id: null, x: 0, y: 0, ox: 0, oy: 0 }; V.tasti = {}; V.mg = null; V.cache = {}; V.fatti = {};
  V.ultimoInvio = 0; V.ultimaPos = { x: 0, y: 0 }; V.tempo = 0; V.fase = null; V.kVia = null; V.riuK = null;
  V.legaComandi();
  if (PENDENTI.tp) { V.messaggio(PENDENTI.tp); PENDENTI.tp = null; }
  if (PENDENTI.priv) { V.privato(PENDENTI.priv); PENDENTI.priv = null; }
  t.mostra(V.s);
  var ultimo = performance.now();
  function giro(now) {
    if (!V.vivo) return;
    if (!document.body.contains(V.s)) { V.vivo = false; V.slega(); return; }
    var dt = Math.min(0.05, (now - ultimo) / 1000); ultimo = now; V.tempo += dt;
    V.passo(dt);
    requestAnimationFrame(giro);
  }
  requestAnimationFrame(giro);
}
Vista.prototype.stop = function () { this.vivo = false; this.slega(); if (VOCE.fonteDi === this) { VOCE.fonte = null; VOCE.fonteDi = null; } };
Vista.prototype.legaComandi = function () {
  var V = this, j = V.joyV;
  V.joyZona.addEventListener("pointerdown", function (e) {
    if (j.id !== null) return; j.id = e.pointerId; j.ox = e.clientX; j.oy = e.clientY;
    var p = V.locale(e); V.joy.style.left = p.x + "px"; V.joy.style.top = p.y + "px"; V.joy.classList.add("on");
    try { V.joyZona.setPointerCapture(e.pointerId); } catch (_) {}
  });
  V.joyZona.addEventListener("pointermove", function (e) {
    if (e.pointerId !== j.id) return;
    var dx = e.clientX - j.ox, dy = e.clientY - j.oy, max = 50;
    if (V.girato) { var t0 = dx; dx = dy; dy = -t0; }   // gioco girato di lato: lo spostamento del dito va girato anche lui
    var d = Math.hypot(dx, dy);
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    j.x = d < 6 ? 0 : dx / max; j.y = d < 6 ? 0 : dy / max;
    V.knob.style.transform = "translate(" + dx + "px," + dy + "px)";
  });
  var fine = function (e) { if (e.pointerId === j.id) V.joyReset(); };
  V.joyZona.addEventListener("pointerup", fine); V.joyZona.addEventListener("pointercancel", fine); V.joyZona.addEventListener("lostpointercapture", fine);
  V.suGiu = function (e) {
    if (!V.vivo || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) return;
    V.tasti[e.code] = e.type === "keydown";
    if (e.type !== "keydown" || e.repeat) return;
    var k = { KeyE: "usa", KeyR: "segnala", KeyQ: "spegni", KeyF: "abil", KeyV: "botola", KeyB: "buio", KeyL: "lenz" }[e.code];
    if (k && V.btn[k] && !V.btn[k].disabled && !V.btn[k].hidden) V.azione(k);
    if (e.code === "KeyM") V.apriMappa();
  };
  document.addEventListener("keydown", V.suGiu); document.addEventListener("keyup", V.suGiu);
};
Vista.prototype.slega = function () {
  if (this.suGiu) { document.removeEventListener("keydown", this.suGiu); document.removeEventListener("keyup", this.suGiu); }
  if (this.ruota) { window.removeEventListener("resize", this.ruota); window.removeEventListener("orientationchange", this.ruota); }
  if (this.noZoom) document.removeEventListener("gesturestart", this.noZoom);
  if (this.primoTocco && this.sc) { this.sc.removeEventListener("touchend", this.primoTocco, true); this.sc.removeEventListener("click", this.primoTocco, true); }
  if (this.parlaVV && window.visualViewport) { visualViewport.removeEventListener("resize", this.parlaVV); visualViewport.removeEventListener("scroll", this.parlaVV); }
};
// un punto del dito dentro la scena (in pixel della scena, anche quando è girata di lato)
Vista.prototype.locale = function (e) {
  var sc = this.sc;
  if (this.girato) return { x: e.clientY, y: window.innerWidth - e.clientX };
  var r = sc.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top };
};
Vista.prototype.joyReset = function () { var j = this.joyV; j.id = null; j.x = 0; j.y = 0; this.joy.classList.remove("on"); this.joy.style.left = ""; this.joy.style.top = ""; this.knob.style.transform = ""; };

// il passo: si scivola lungo muri e mobili. Contro uno spigolo, se pochi pixel più in là si passa, si gira attorno da soli: niente fermate secche
var AGGIRA = T * 0.55;
function cammina(M, me, vx, vy) {
  var okX = !vx || libero(M, me.x + vx, me.y), okY = !vy || libero(M, me.x, me.y + vy);
  if (okX) me.x += vx; if (okY) me.y += vy;
  if (okX && okY) return;
  var passo = Math.hypot(vx, vy);
  if (!okX) aggira(M, me, Math.sign(vx), 0, passo); else aggira(M, me, 0, Math.sign(vy), passo);
}
function aggira(M, me, dx, dy, passo) {
  var px = dy ? 1 : 0, py = dx ? 1 : 0;   // la direzione di lato rispetto a dove si spinge
  for (var s = 2; s <= AGGIRA; s += 2) for (var q = -1; q <= 1; q += 2) {
    var x = me.x + px * q * s, y = me.y + py * q * s;
    if (libero(M, x, y) && libero(M, x + dx * 3, y + dy * 3)) {
      var n = Math.min(s, passo), x2 = me.x + px * q * n, y2 = me.y + py * q * n;
      if (libero(M, x2, y2)) { me.x = x2; me.y = y2; }
      return;
    }
  }
}
// chi ripara vede subito il risultato: l'host lo conferma un attimo dopo, e una foto partita prima del tocco non lo smentisce
function mascheraRip(g, cosa) { if (cosa === "luci") g.buio = 0; else if (cosa === "console") g.interf = 0; else if (g.acqua) g.acqua[cosa === "chiusaA" ? 1 : 2] = 1; }
Vista.prototype.ottimista = function (cosa) {
  var V = this; V.ottimo = { cosa: cosa, fine: performance.now() + 1500 };
  if (V.vm) V.foto(V.vm);
  setTimeout(function () { if (V.vivo) V.cb.mossa({ t: "rf" }); }, 1600);   // scaduta la promessa, si chiede la foto vera
};

// ----- quello che arriva dall'host -----
Vista.prototype.foto = function (vm) {
  var V = this; V.vm = vm; V.g = vm.g || null;
  // la riparazione promessa resta finché arriva una foto partita dopo la riparazione (numero ver oltre quello della ricevuta): niente lampo del sabotaggio che torna
  if (V.ottimo) { if (performance.now() > V.ottimo.fine || (V.ottimo.ver != null && vm.ver > V.ottimo.ver)) V.ottimo = null; else if (V.g) mascheraRip(V.g, V.ottimo.cosa); }
  if (V.compAgg) V.compAgg();
  vm.players.forEach(function (p) { var c = V.cache[p.id] = V.cache[p.id] || {}; c.nome = p.nome; c.lenz = LENZ_DI[p.id]; c.colore = COLORI_DI[p.id]; if (p.omino) avatarDi(p.id, p.omino); });
  var io = vm.players.filter(function (p) { return p.id === V.cb.myId; })[0];
  V.guardo = !io || !!io.via || !V.priv;
  V.notaAssenti(vm);
  if (!V.g) return;
  var M = V.g.mappa === "palazzo" ? PALAZZO : ATRIO;
  if (M !== V.M) { V.M = M; V.pit.cam.ok = false; V.buf = []; }   // la posizione nuova arriva col «tp» dell'host
  V.secFine = performance.now() + V.g.sec * 1000;
  if (V.g.acqua) V.acquaFine = performance.now() + V.g.acqua[0] * 1000;
  if (V.g.buio > 0) V.buioFine = performance.now() + V.g.buio * 1000;   // (per la vista dei sabotaggi: i secondi che restano, come li dice l'host)
  if (V.g.interf > 0) V.interfFine = performance.now() + V.g.interf * 1000;
  // (df e vf: i millesimi che mancano, più precisi dei secondi interi; un host con la versione vecchia manda solo i secondi)
  if (V.g.riu) { var Rr = V.g.riu; V.discFine = performance.now() + (Rr.df != null ? Rr.df : Rr.disc * 1000); V.votoFine = performance.now() + (Rr.vf != null ? Rr.vf : Rr.voto * 1000); }
  if (V.fase !== V.g.fase) { V.fase = V.g.fase; V.cambioFase(); }
  V.aggVelo(); V.aggHud();
};
Vista.prototype.posDi = function (id) { var B = this.buf; if (!B.length) return null; var l = B[B.length - 1].p; for (var i = 0; i < l.length; i++) if (l[i][0] === id) return l[i]; return null; };
// le posizioni degli altri: ogni pacchetto porta il battito dell'host (s, uno ogni 50 ms), così si sa quando è partito anche se
// la rete li consegna a raffica. Si riproducono con un piccolo ritardo che si adatta alla rete (quello che serve al 90% dei pacchetti).
Vista.prototype.posizioni = function (p, s) {
  var V = this, B = V.buf, ora = performance.now(), ht;
  if (s == null) { ht = ora; V.offMin = 0; V.ritardo = 60; }   // (sul telefono dell'host: niente rete)
  else {
    ht = s * 50;
    if (B.length && ht <= B[B.length - 1].ht) { if (ht < B[B.length - 1].ht - 2000) { B.length = 0; V.offs = []; } else return; }   // vecchio, o l'host è ripartito
    var off = ora - ht; V.offs = V.offs || []; V.offs.push(off); if (V.offs.length > 60) V.offs.shift();
    var m = Infinity; for (var i = 0; i < V.offs.length; i++) if (V.offs[i] < m) m = V.offs[i];
    var d = V.offs.map(function (o) { return o - m; }).sort(function (a, b) { return a - b; });
    V.offMin = m; V.ritardo = Math.max(B.length >= 30 ? 50 : 70, Math.min(350, d[Math.floor(d.length * 0.9)] + 35));   // (almeno 30 pacchetti in 2 s: sul filo arrivano 20 volte al secondo, e si può stare più vicini)
  }
  B.push({ ht: ht, p: p });
  while (B.length > 2 && B[B.length - 1].ht - B[0].ht > 2000) B.shift();
  if (!this.me.ok) { var mio = this.posDi(this.cb.myId); if (mio) { this.me.x = mio[1]; this.me.y = mio[2]; this.me.ok = true; } }
};
Vista.prototype.privato = function (pr) {
  var V = this, ora = performance.now();
  V.aggRegistro(pr);
  V.priv = pr; V.cdFine = ora + pr.cd * 1000; V.cdAFine = ora + pr.cdA * 1000; V.cdBFine = ora + pr.cdBuio * 1000;
  V.frenFine = pr.frenesia ? ora + pr.frenesia * 1000 : 0;
  if (pr.controllo) { if (!V.ctrl || V.ctrl.id !== pr.controllo[0]) V.ctrl = { id: pr.controllo[0], x: pr.controllo[2], y: pr.controllo[3], dir: 0, muove: false, n: 0, inv: 0 }; V.ctrl.fine = ora + pr.controllo[1] * 1000; } else V.ctrl = null;
  V.fermo.hidden = !pr.controllato;
  // controllato dal Burattinaio: si chiude il compito o il pannello aperto (finché dura non si può fare niente)
  if (pr.controllato) { if (V.veloTipo === "compito") { V.mg = null; V.velo.hidden = true; V.veloTipo = null; V.velo.textContent = ""; } if (V.pannello) V.pannello.chiudi(); V.joyReset(); }
  V.allFine = ora + (pr.allerta || 0) * 1000; V.letti = {}; (pr.letti || []).forEach(function (x) { V.letti[x[0]] = x[1]; });
  if (pr.schermo > 0 && (!V.schermoFino || ora > V.schermoFino) && !V.mg) { V.schermoFino = ora + pr.schermo * 1000; V.apriPlastico(pr.schermo); }
  V.bloccFine = ora + (pr.bloccato || 0) * 1000; V.tracciaFine = pr.traccia ? ora + pr.traccia[1] * 1000 : 0;
  if (pr.rianima && !V.rianFine) { V.rianFine = ora + pr.rianima * 1000; V.rianTot = pr.rianima * 1000; } else if (!pr.rianima) V.rianFine = 0;
  if (pr.ep > V.me.ep) V.me.ep = pr.ep;
  pr.compiti.forEach(function (c) { if (c[1]) delete V.fatti[c[0]]; });
  if (V.vm) { var io = V.vm.players.filter(function (p) { return p.id === V.cb.myId; })[0]; V.guardo = !io || !!io.via; }
  if (pr.voto && !V.mioVoto) V.mioVoto = pr.voto;   // (chi rientra durante il voto: l'host si ricorda del suo)
  V.aggLista(); V.aggHud(); if (V.g) V.aggVelo();
};
Vista.prototype.messaggio = function (m) {
  if (m.t === "tp") {
    // un salto più vecchio di quello che ho (broker e filo diretto possono invertire due salti vicini): lo scarto, una volta.
    // Se l'host lo ripete (ripresa da una copia di prima, numeri ripartiti) vale il suo: è lui l'arbitro
    if (m.ep != null && m.ep < this.me.ep) {
      var oraTp = performance.now();
      if (!(this.tpVecchio === m.ep && oraTp - this.tpVecchioT < 3000)) { this.tpVecchio = m.ep; this.tpVecchioT = oraTp; return; }
    }
    var salto = Math.hypot(m.x - this.me.x, m.y - this.me.y) > 4 * T; this.me.x = m.x; this.me.y = m.y; this.me.ep = m.ep; this.me.ok = true;
    if (salto) {   // spostati lontano (Trasportatore, botola, riunione): si chiude quello che era aperto lì
      this.pit.cam.ok = false;
      if (this.veloTipo === "compito") { this.mg = null; this.velo.hidden = true; this.veloTipo = null; this.velo.textContent = ""; this.aggVelo(); }
      if (this.pannello) this.pannello.chiudi();
    }
  }
  else if (m.t === "avviso") { this.avviso(m.testo, m.tipo); if (m.tipo === "morte") vibra(120); }
  else if (m.t === "morte") this.scenaMorte(m);
  else if (m.t === "bolla") this.sentito(m);
  else if (m.t === "fx") this.effetto(m);
};
// ----- la chat di prossimità -----
// apre o chiude la barra (senza argomento la gira)
Vista.prototype.parlaApri = function (on) {
  var V = this; if (on === undefined) on = V.parlaBar.hidden;
  if (on && V.btnParla.hidden) return;
  V.parlaBar.hidden = !on; V.btnParla.classList.toggle("acceso", !!on);
  if (on) { V.parlaConta(); V.parlaStato(); V.parlaPosiz(); try { V.parlaIn.focus({ preventScroll: true }); } catch (e) { V.parlaIn.focus(); } }
  else { V.parlaIn.blur(); V.parlaPosiz(); }
};
// la barra sta in basso, sopra la tastiera di iPhone («visualViewport»); con la scena girata di lato sta in alto.
// Lo storico sale con lei, e la scena si alza quel tanto che serve perché chi gioca resti visibile sopra la barra.
Vista.prototype.parlaPosiz = function () {
  var V = this, aperta = !V.parlaBar.hidden, vv = window.visualViewport, r = V.sc.getBoundingClientRect(), alto = !!V.girato, sotto = 0, alza = 0;
  if (aperta && vv && !alto) sotto = Math.max(0, Math.round(r.bottom - (vv.offsetTop + vv.height)));
  V.parlaBar.classList.toggle("alto", alto);
  if (V.parlaSotto !== sotto) { V.parlaSotto = sotto; V.sc.style.setProperty("--sotto", sotto + "px"); }
  if (aperta && !alto) {
    var h = V.parlaBar.offsetHeight, hs = V.parlaStor.offsetHeight, cima = V.parlaBar.getBoundingClientRect().top - r.top - (hs ? hs + 6 : 0);
    V.parlaStor.style.bottom = "calc(max(env(safe-area-inset-bottom,0px)," + sotto + "px) + " + (h + 14) + "px)";
    alza = Math.max(0, Math.round(r.height / 2 + 36 - cima));
  } else V.parlaStor.style.bottom = "";
  V.parlaAlza = alza;
};
// il contatore delle lettere (max MAX_PARLA)
Vista.prototype.parlaConta = function () {
  var n = Array.from(this.parlaIn.value).length; this.parlaCont.textContent = n + "/" + MAX_PARLA; this.parlaCont.classList.toggle("pieno", n >= MAX_PARLA - 10);
};
// la riga in alto nella barra: quante persone che vedo mi sentiranno (solo quelle che vedo: il buio non tradisce nessuno)
Vista.prototype.parlaStato = function () {
  var V = this, g = V.g, me = V.me, t, si = false; if (!g) return;
  if (performance.now() < V.parlaAttesa) t = "Aspetta un attimo";
  else if (!V.sonoVivo()) t = "Ti sentono i fantasmi";
  else {
    var anima = g.mappa !== "palazzo" || g.bengala > 0, R = anima ? R_PARLA : Math.min(R_PARLA, V.raggio() * 0.97), n = 0;
    V.altri().forEach(function (p) { if (!p.fantasma && Math.hypot(p.x - me.x, p.y - me.y) <= R && vede(V.M, me.x, me.y, p.x, p.y)) n++; });
    t = n === 0 ? "Nessuno vicino a te" : n === 1 ? "1 persona ti sente" : n + " persone ti sentono"; si = n > 0;
  }
  if (V.parlaUdi._t !== t) { V.parlaUdi._t = t; V.parlaUdi.textContent = t; }
  V.parlaUdi.classList.toggle("si", si);
};
// manda un messaggio (scritto o a un tocco) e chiude la barra; un messaggio ogni 1,5 secondi
Vista.prototype.parlaManda = function (testo) {
  var V = this, tx = Array.from(String(testo || "").replace(/\s+/g, " ").trim()).slice(0, MAX_PARLA).join(""), ora = performance.now();
  if (!tx) { V.parlaApri(false); return; }
  if (ora - V.ultimoParla < 1500) { V.parlaAttesa = ora + 1200; V.parlaStato(); return; }
  V.ultimoParla = ora; V.manda("parla", { testo: tx });
  V.parlaIn.value = ""; V.parlaConta(); V.parlaApri(false);
};
// un messaggio sentito: il fumetto sopra chi parla (si impila e svanisce) e una riga nello storico. In riunione è spento.
Vista.prototype.sentito = function (m) {
  var V = this, g = V.g, ora = performance.now(), id = String(m.id || ""), testo = Array.from(String(m.testo || "").replace(/\s+/g, " ").trim()).slice(0, MAX_PARLA).join("");
  if (!testo || !id || (g && g.fase !== "gioco" && g.fase !== "atrio")) return;
  var k = id + "|" + m.n + "|" + testo; if (V.bVisti.indexOf(k) >= 0) return;   // (lo stesso messaggio arrivato due volte vale una)
  V.bVisti.push(k); if (V.bVisti.length > 16) V.bVisti.shift();
  var dur = Math.max(4200, Math.min(7500, 3000 + testo.length * 55)), mie = V.bolle.filter(function (x) { return x.id === id; });
  if (mie.length >= 3) V.bolle.splice(V.bolle.indexOf(mie[0]), 1);   // al massimo tre fumetti per persona
  V.bolle.push({ id: id, testo: testo, t0: ora, fine: ora + dur, w: !!m.w, a: !!m.a, righe: null });
  var io = id === V.cb.myId, c = V.cache[m.c || id] || {};
  V.storicoAgg({ nome: io ? "Tu" : (c.nome || "?"), id: m.c || id, testo: testo, t0: ora, w: !!m.w, a: !!m.a, io: io });
};
// lo storico: gli ultimi messaggi sentiti, sopra la barra; sfumano da soli (prima se la barra è chiusa)
Vista.prototype.storicoAgg = function (s) {
  var V = this, el = E("div", "lt-ch" + (s.io ? " io" : "") + (s.w ? " w" : "") + (s.a ? " a" : ""));
  el.append(pezzetta(s.id), E("b", "", s.nome), document.createTextNode(s.testo));
  s.el = el; s.op = 1; V.storico.push(s); V.parlaStor.appendChild(el);
  while (V.storico.length > PARLA_STORICO) V.storico.shift().el.remove();
  if (!V.parlaBar.hidden) V.parlaPosiz();
};
Vista.prototype.storicoGira = function (ora) {
  var V = this, vita = V.parlaBar.hidden ? 7000 : 20000;
  for (var i = V.storico.length - 1; i >= 0; i--) {
    var s = V.storico[i], eta = ora - s.t0, op = eta < vita * 0.6 ? 1 : Math.max(0, 1 - (eta - vita * 0.6) / (vita * 0.4));
    if (op <= 0) { s.el.remove(); V.storico.splice(i, 1); continue; }
    op = Math.round(op * 10) / 10; if (s.op !== op) { s.op = op; s.el.style.opacity = op; }
  }
};
// la riunione (o la fine) spegne la chat di prossimità: via fumetti, storico e barra
Vista.prototype.parlaPulisci = function () {
  var V = this; V.bolle.length = 0; V.bVisti.length = 0;
  V.storico.forEach(function (s) { s.el.remove(); }); V.storico.length = 0;
  if (!V.parlaBar.hidden) V.parlaApri(false);
};
var DURATE = { urlo: 6, scudoRotto: 1.2, telecamera: 1, trasporto: 1, spegni: 1.2, sparo: 0.5, scudo: 1.2, lente: 1.2, fiuto: 1, ipnosi: 1, trasforma: 0.9, botola: 0.7, sparisce: 1, mangia: 1, gatto: 1.2, rianima: 1.6, campana: 1.2, compito: 2.6, bengala: 1.2, luci: 0.8 };
Vista.prototype.effetto = function (m) {
  var V = this, ora = V.tempo, P = V.pit;
  if (m.k === "cade") { SUONO.spegni(); vibra(60); return; }
  if (m.k === "compitoMio") { SUONO.compito(); return; }
  if (m.k === "interferenza" || m.k === "acqua") { if (V.squadra() !== "ombre") { SUONO.allarme(); vibra(100); } V.avviso(m.k === "acqua" ? "Acqua alta!" : "Interferenza!", "morte"); return; }
  if (m.k === "urlo") { V.urlo = { x: m.x, y: m.y, col: "#ff5a6e", fine: V.tempo + 6 }; SUONO.corpo(); vibra(150); V.avviso("Un urlo! Segui la freccia rossa.", "morte"); return; }
  if (m.solo && m.solo !== V.cb.myId) return;
  if (m.noOmbre && V.squadra() === "ombre") return;
  if (!DURATE[m.k]) { if (m.k === "buio" && V.squadra() !== "ombre") { SUONO.allarme(); vibra(80); } return; }
  var e = { k: m.k, x: m.x, y: m.y, x2: m.x2, y2: m.y2, v: m.v, t0: ora, dur: DURATE[m.k], sempre: !!m.globale, terra: m.k === "spegni" };
  if (m.k === "bengala" || m.k === "luci") e.schermo = true;
  V.effetti.push(e);
  var anima = !V.sonoVivo() || V.guardo || (V.g && V.g.bengala > 0);
  var visto = m.globale || anima || (Math.hypot(m.x - V.me.x, m.y - V.me.y) < V.raggio() + T && vede(V.M, V.me.x, V.me.y, m.x, m.y));
  if (!visto) return;
  if (m.k === "spegni") { P.sparpaglia("fumo", m.x, m.y - T * 0.4, 14, { v: 40, vita: 1.2, r: 6 }); P.sparpaglia("scintilla", m.x, m.y - T * 0.4, 8, { v: 60, vita: 0.5, r: 2 }); V.scossa = 0.45; SUONO.spegni(); V.effetti.push({ k: "spegni", schermo: true, t0: ora, dur: 0.5, x: m.x, y: m.y }); }
  else if (m.k === "compito") P.sparpaglia("scintilla", m.x, m.y - T * 0.5, 18, { v: 70, vita: 0.9, r: 3 });
  else if (m.k === "rianima" || m.k === "gatto") { P.sparpaglia("scintilla", m.x, m.y - T * 0.5, 26, { v: 90, vita: 1.2, r: 3 }); SUONO.abil(); }
  else if (m.k === "sparo") { SUONO.spegni(); V.scossa = 0.3; }
  else if (m.k === "bengala" || m.k === "luci") SUONO.luci();
  else if (/sparisce|mangia|botola|trasforma/.test(m.k)) P.sparpaglia("fumo", m.x, m.y - T * 0.3, 10, { v: 30, vita: 0.9, r: 5 });
  else SUONO.abil();
};
Vista.prototype.tace = function (si) { var e = this.taceEl; if (e.classList.contains("su") !== !!si) e.classList.toggle("su", !!si); };
// chi perde la rete e chi torna: una riga, una volta sola. V.assenti: 1 via senza averlo detto (appena dopo una ripresa risultano via tutti: non è una notizia), 2 detto, 3 fuori dalla partita
Vista.prototype.notaAssenti = function (vm) {
  var V = this, prima = V.assenti || {}, ora = V.assenti = {}, nuova = V.assRip !== (vm.rip || 0), gioco = vm.fase === "gioco" && !!V.g;
  V.assRip = vm.rip || 0;
  vm.players.forEach(function (p) {
    if (p.bot || p.id === V.cb.myId) return;
    var via = !!(p.via || p.forse), era = prima[p.id] || 0, q = gioco ? V.g.g.filter(function (x) { return x[0] === p.id; })[0] : null, fuori = !!(q && q[2]);
    if (!via) { if (era > 1 && gioco) V.avviso(p.nome + " è di nuovo qui"); return; }
    if (!gioco || nuova) { ora[p.id] = era || 1; return; }
    if (fuori && era < 3) { V.avviso(p.nome + " ha lasciato la partita"); ora[p.id] = 3; return; }
    if (!era) V.avviso(p.nome + " ha perso la rete");
    ora[p.id] = era || 2;
  });
};
Vista.prototype.avviso = function (testo, tipo) {
  var a = this.avv; a.textContent = testo; a.className = "lt-avviso su" + (tipo ? " " + tipo : "");
  clearTimeout(this.avvT); this.avvT = setTimeout(function () { a.className = "lt-avviso"; }, 2800);
};

// ----- il giro di ogni fotogramma -----
Vista.prototype.passo = function (dt) {
  var V = this, g = V.g, me = V.me, pr = V.priv;
  if (V.mg && V.mg.tick) V.mg.tick(dt);
  if (!g) return;
  V.effetti = V.effetti.filter(function (e) { return V.tempo - e.t0 < e.dur; });
  if (V.scossa > 0) V.scossa = Math.max(0, V.scossa - dt);
  V.dt = dt;
  var puoMuovere = !V.guardo && pr && pr.botola == null && (g.fase === "gioco" || g.fase === "atrio") && !V.mg && (!V.pannello || V.pannello.libero) && V.bloccFine <= performance.now();
  V.aggBotola();
  if (V.mappa && V.tempo - V.mappa.ultimo > 0.2) V.disegnaMappaViva();
  // entrando in una stanza il suo nome compare un attimo al centro (i corridoi no)
  if (g.fase === "gioco" && g.mappa === "palazzo") {
    var stQ = stanzaDi(PALAZZO, me);
    if (stQ !== V.stanzaQui) { V.stanzaQui = stQ; if (stQ.x != null) { V.nomeStanza.textContent = stQ.nome; V.nomeStanza.classList.remove("su"); void V.nomeStanza.offsetWidth; V.nomeStanza.classList.add("su"); } }
  }
  var mx = 0, my = 0;
  if (puoMuovere) {
    var k = V.tasti;
    if (k.ArrowLeft || k.KeyA) mx -= 1; if (k.ArrowRight || k.KeyD) mx += 1; if (k.ArrowUp || k.KeyW) my -= 1; if (k.ArrowDown || k.KeyS) my += 1;
    if (!mx && !my) { mx = V.joyV.x; my = V.joyV.y; }
  }
  var m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; m = 1; }
  // il Burattinaio muove la sua vittima al posto suo
  var C = V.ctrl && V.ctrl.fine > performance.now() && g.fase === "gioco" ? V.ctrl : null;
  if (C) {
    C.muove = m > 0.05;
    if (C.muove) { var velC = VEL_BASE * T * ((V.vm.imp && V.vm.imp.velocita) || 1); if (libero(V.M, C.x + mx * velC * dt, C.y)) C.x += mx * velC * dt; if (libero(V.M, C.x, C.y + my * velC * dt)) C.y += my * velC * dt; C.dir = Math.atan2(my, mx); }
    var oraC = performance.now(); if (oraC - C.inv >= 100) { C.inv = oraC; V.cb.mossa({ t: "pc", x: Math.round(C.x), y: Math.round(C.y), d: Math.round(C.dir * 100) / 100, m: C.muove ? 1 : 0 }); }
    mx = 0; my = 0; m = 0;
  }
  me.muove = m > 0.05;
  var anima = !V.sonoVivo();
  if (me.muove) {
    var vel = VEL_BASE * T * ((V.vm && V.vm.imp && V.vm.imp.velocita) || 1) * (anima && g.mappa === "palazzo" ? VEL_ANIMA : 1), vx = mx * vel * dt, vy = my * vel * dt, M = V.M;
    if (anima && g.mappa === "palazzo") { me.x = Math.max(T, Math.min((M.GW - 1) * T, me.x + vx)); me.y = Math.max(T, Math.min((M.GH - 1) * T, me.y + vy)); }
    else cammina(M, me, vx, vy);
    me.dir = Math.atan2(my, mx);
  }
  var ora = performance.now();
  if (puoMuovere && me.ok) {
    var mosso = Math.hypot(me.x - V.ultimaPos.x, me.y - V.ultimaPos.y) > 0.5;
    if ((mosso && ora - V.ultimoInvio >= 100) || ora - V.ultimoInvio >= 700) {
      V.ultimoInvio = ora; V.ultimaPos.x = me.x; V.ultimaPos.y = me.y;
      V.cb.mossa({ t: "p", x: Math.round(me.x), y: Math.round(me.y), d: Math.round(me.dir * 100) / 100, m: me.muove ? 1 : 0, ep: me.ep, n: ++me.n });
    }
  }
  // le orme per l'Investigatore
  if (pr && pr.ruolo === "investigatore" && g.mappa === "palazzo" && V.tempo - (V.ultimaOrma || 0) > 0.28) {
    V.ultimaOrma = V.tempo; V.lato = -(V.lato || 1);
    V.altri().forEach(function (p) { if (p.muove && !p.fantasma) V.orme.push({ x: p.x, y: p.y, dir: p.dir, col: p.colore || "#ccc", bordo: orloTinta(p.colore), t: V.tempo, lato: V.lato }); });
    var durO = (V.vm.imp.investigatore && V.vm.imp.investigatore.orme) || 10; V.orme = V.orme.filter(function (o) { return V.tempo - o.t < durO; });
  }
  if (VOCE.stato !== "spenta") VOCE.misura(ora);   // chi parla a voce (per gli anelli)
  if (V.feed) V.disegnaSchermi();
  if (V.plastico) { if (V.plastico.fine && ora > V.plastico.fine) V.pannello && V.pannello.chiudi(); else if (V.tempo - V.plastico.ultimo > 1) V.disegnaPlastico(); }
  // con un pannello aperto la scena dietro il velo scuro si ridisegna un fotogramma su tre: non si vede la differenza, il telefono respira
  var dietro = !V.velo.hidden && (V.veloTipo === "pannello" || V.veloTipo === "mappa" || V.veloTipo === "compito");
  V.nVelo = dietro ? (V.nVelo || 0) + 1 : 0;
  if (!dietro || V.nVelo % 3 === 1) V.disegnaScena();
  if (Math.floor(V.tempo * 6) !== V.kHud) { V.kHud = Math.floor(V.tempo * 6); V.aggHud(); V.aggVelo(true); }
};
Vista.prototype.sonoVivo = function () { var g = this.g; if (!g) return false; for (var i = 0; i < g.g.length; i++) if (g.g[i][0] === this.cb.myId) return !!g.g[i][1]; return false; };
// la foto per la voce: dove sono io e dove sono gli altri (le ultime posizioni arrivate), chi è vivo, chi non può parlare.
// Con le stesse regole della chat scritta (Partita.sentePar) ma calcolate qui, sul telefono di chi ascolta.
// «muto»: è uscito, è in una botola (o ancora senza posizione), o in riunione è zittito.
Vista.prototype.statoVoce = function () {
  var V = this, g = V.g, pr = V.priv; if (!g) return null;
  var l = V.buf.length ? V.buf[V.buf.length - 1].p : [], pos = {}, i;
  for (i = 0; i < l.length; i++) pos[l[i][0]] = l[i];
  var riu = g.fase === "riunione" || g.fase === "esito", zitti = (g.riu && g.riu.zittiti) || [];
  var out = { fase: g.fase, M: V.M, io: { x: V.me.x, y: V.me.y, vivo: V.sonoVivo(), muto: riu ? !!(pr && pr.zittito) : !!(pr && pr.botola != null) }, altri: {} };
  for (i = 0; i < g.g.length; i++) {
    var q = g.g[i], id = q[0]; if (id === V.cb.myId) continue;
    var p = pos[id];
    out.altri[id] = { x: p ? p[1] : 0, y: p ? p[2] : 0, vivo: !!q[1], muto: !!q[2] || (riu ? zitti.indexOf(id) >= 0 : !p) };
  }
  return out;
};
// gli anelli della voce sotto chi parla: da 0 a 1 per ogni persona, che sale svelto e scende piano (così non lampeggia)
Vista.prototype.voceAnelli = function () {
  var V = this, m = V.voceA, k = Math.min(1, (V.dt || 0.016) * 14), ids = {}, id;
  Object.keys(m).forEach(function (x) { ids[x] = 1; }); Object.keys(VOCE.liv).forEach(function (x) { ids[x] = 1; });
  for (id in ids) {
    var voluto = VOCE.parla[id] ? 0.3 + 0.7 * Math.min(1, VOCE.liv[id] || 0) : 0, a = (m[id] || 0) + (voluto - (m[id] || 0)) * k;
    if (a < 0.02 && !voluto) delete m[id]; else m[id] = a;
  }
  return m;
};
Vista.prototype.altri = function () {
  var B = this.buf, V = this; if (!B.length) return [];
  // il momento da mostrare, nell'orologio dell'host; se il pacchetto dopo non è ancora arrivato si prolunga il moto (al massimo 250 ms)
  var quando = performance.now() - (V.offMin || 0) - (V.ritardo || 110), a = B[0], b = null, f = 0;
  for (var i = 0; i < B.length; i++) { if (B[i].ht <= quando) a = B[i]; else { b = B[i]; break; } }
  if (b && b.ht > a.ht) f = Math.max(0, Math.min(1, (quando - a.ht) / (b.ht - a.ht)));
  else if (!b && B.length > 1) { var a0 = B[B.length - 2]; b = a; a = a0; f = 1 + Math.min(250, quando - b.ht) / Math.max(1, b.ht - a.ht); }
  var mb = {}; if (b) b.p.forEach(function (q) { mb[q[0]] = q; });
  var out = [], comp = V.priv && V.priv.compagni || [];
  a.p.forEach(function (q) {
    if (q[0] === V.cb.myId && !V.guardo) return;
    var r = mb[q[0]], x = q[1], y = q[2];
    if (r && f) { var ff = f > 1 && !(r[4] & 1) ? 1 : f; x += (r[1] - x) * ff; y += (r[2] - y) * ff; if (Math.hypot(r[1] - q[1], r[2] - q[2]) > 4 * T) { x = r[1]; y = r[2]; } }
    var come = q[5] || q[0];   // il Trasformista si vede con la faccia di un altro
    var c = V.cache[come] || {}, av = AVATAR[come];
    var lt = V.letti[q[0]];
    if (V.ctrl && V.ctrl.id === q[0] && V.ctrl.fine > performance.now()) { x = V.ctrl.x; y = V.ctrl.y; }
    out.push({ id: q[0], x: x, y: y, dir: q[3], muove: !!(q[4] & 1), fantasma: !!(q[4] & 2), nome: c.nome || "?", colore: c.colore, lenz: c.lenz, img: av && av.img, imgS: av && av.imgS, seme: (q[0].length * 7) % 11, alleata: comp.indexOf(q[0]) >= 0, coloreNome: lt === "buono" ? "#8ee6a8" : lt === "cattivo" ? "#ff7a8a" : null });
  });
  return out;
};
Vista.prototype.squadra = function () { return this.priv ? this.priv.squadra : "ospiti"; };
Vista.prototype.raggio = function () {
  var imp = (this.vm && this.vm.imp) || { vistaOspiti: 6, vistaOmbre: 7 };
  if (this.g && this.g.bengala > 0) return 40 * T;
  if (this.squadra() === "ombre" || (this.priv && this.priv.ruolo === "giullare")) return imp.vistaOmbre * T;
  if (this.priv && this.priv.ruolo === "vedetta") return (imp.vistaOspiti + 2) * T;
  var liv = this.g && this.g.buio ? this.luciLivello() : 1;   // (nel buio la lanterna si restringe; durante lo sfarfallio va e viene con le luci)
  return (imp.vistaOspiti + (Math.min(imp.vistaOspiti, 2.2) - imp.vistaOspiti) * (1 - liv)) * T;
};
// ---- i sabotaggi da vedere: tempi uguali su ogni telefono, perché partono dallo stato dell'host (secondi che restano, chiuse chiuse) e non da timer propri ----
var DUR_BUIO = 40;   // come in partita.js (attivaBuio)
Vista.prototype.luciLivello = function () { var b = this.sab && this.sab.buio; return b && b.att ? livelloLuci(performance.now() / 1000 - b.t0) : 1; };
Vista.prototype.sabAgg = function (ora) {
  var V = this, g = V.g, sb = V.sab || (V.sab = { buio: { att: false, t0: 0, rip: -1 }, interf: { att: false, t0: 0, rip: -1 }, acqua: { att: false, on: false, t0: 0, tot: 60, ca: -1, cb: -1, ea: -1, eb: -1 } });
  var imp = (V.vm && V.vm.imp && V.vm.imp.sabotaggi) || {}, sec = ora / 1000;
  var b = sb.buio, t0;
  if (g.buio > 0 && V.buioFine) { t0 = V.buioFine / 1000 - DUR_BUIO; if (!b.att) { b.att = true; b.rip = -1; b.t0 = t0; } else if (Math.abs(t0 - b.t0) > 1.3) b.t0 = t0; }
  else if (b.att) { b.att = false; b.rip = sec; }
  var i = sb.interf, durI = imp.interferenza || 60;
  if (g.interf > 0 && V.interfFine) { t0 = V.interfFine / 1000 - durI; if (!i.att) { i.att = true; i.rip = -1; i.t0 = t0; } else if (Math.abs(t0 - i.t0) > 1.3) i.t0 = t0; }
  else if (i.att) { i.att = false; i.rip = sec; }
  var a = sb.acqua, tot = imp.acqua || 60;
  if (g.acqua && V.acquaFine) {
    t0 = V.acquaFine / 1000 - tot;
    if (!a.att) { a.att = a.on = true; a.tot = tot; a.t0 = t0; a.ca = a.cb = a.ea = a.eb = -1; } else if (Math.abs(t0 - a.t0) > 1.3) a.t0 = t0;
    if (g.acqua[1] && a.ca < 0) { a.ca = sec - (sec - a.t0 > 1.5 && !a.visto ? 3 : 0); a.ea = a.ca - a.t0; }
    if (g.acqua[2] && a.cb < 0) { a.cb = sec - (sec - a.t0 > 1.5 && !a.visto ? 3 : 0); a.eb = a.cb - a.t0; }
    a.visto = true;
  } else if (a.att) { a.att = false; if (a.ca < 0) { a.ca = sec; a.ea = sec - a.t0; } if (a.cb < 0) { a.cb = sec; a.eb = sec - a.t0; } }
  if (a.on && !a.att && sec - Math.max(a.ca, a.cb) > 14) { a.on = false; a.visto = false; }   // l'acqua si è ritirata del tutto
  var ombra = V.squadra() === "ombre" || !V.sonoVivo();
  return {
    buioE: b.att ? sec - b.t0 : -1, buioR: !b.att && b.rip >= 0 && !ombra ? sec - b.rip : -1, interfE: i.att ? sec - i.t0 : -1,
    acquaV: a.on ? { e: sec - a.t0, tot: a.tot, ea: a.ea, eb: a.eb, ca: a.ca >= 0 ? sec - a.ca : -1, cb: a.cb >= 0 ? sec - a.cb : -1 } : null
  };
};
Vista.prototype.compitiAperti = function () { var V = this; if (!V.priv) return []; return V.priv.compiti.filter(function (c) { return !c[1] && !V.fatti[c[0]]; }).map(function (c) { return POSTAZIONI.filter(function (p) { return p.id === c[0]; })[0]; }).filter(Boolean); };
// la foto del Medium: la si guarda, la si rifà (con la ricarica); alla riunione la vedono tutti
// i campioni di stoffa, nella saletta. I colori presi hanno scritto di chi sono; quello di un Bot si può prendere lo stesso.
// La scelta parte con la mossa con ricevuta: decide l'host, e il foglio si chiude quando la foto dice che il telo è mio
Vista.prototype.apriLenzuolo = function () {
  var V = this; if (V.pannello || V.guardo || !V.vm || V.vm.fase !== "lobby") return;
  var box = E("div", "lt-pannello lt-foglio lt-lenz"), testa = E("div", "testa"), ch = E("button", "lt-chiudi", "×"), gr = E("div", "campioni"), righe = [];
  ch.type = "button"; ch.setAttribute("aria-label", "Chiudi"); testa.append(E("h3", "", "Il tuo lenzuolo"), ch);
  box.append(intestazione("Registro di Palazzo Velmare"), testa, gr, E("p", "nota", "Ti riconosceranno da questo colore."));
  LENZUOLI.slice(0, LENZ_N).forEach(function (L, c) {
    var b = E("button", "cmp"), st = E("span", "stoffa"), chi = E("span", "chi", "");
    b.type = "button"; st.style.setProperty("--b", L.b); st.style.setProperty("--s", L.s); st.style.setProperty("--l", L.l);
    b.append(st, E("span", "nm", L.n), chi); gr.appendChild(b); righe.push({ b: b, chi: chi, n: L.n });
    b.addEventListener("click", function () { if (b.disabled) return; V.lenzVoluto = c; lenzRicorda(c); vibra(15); V.manda("lenz", { c: c }); agg(); });
  });
  var agg = function () {
    if (!V.vm) return;
    var qui = (V.vm.players || []).filter(function (p) { return !p.via; }), voluto = V.lenzVoluto, mio = (LENZ_DI[V.cb.myId] || {}).c;
    righe.forEach(function (x, c) {
      var chi = qui.filter(function (p) { return LENZ_DI[p.id] && LENZ_DI[p.id].c === c; })[0], io = !!chi && chi.id === V.cb.myId, altro = !!chi && !chi.bot && !io, nome = chi && !io ? "di " + chi.nome : io ? "il tuo" : "";
      x.b.className = "cmp" + (io ? " mio" : "") + (altro ? " preso" : "") + (chi && chi.bot ? " bot" : "") + (voluto === c && !io ? " atteso" : "");
      x.b.disabled = altro; if (x.chi.textContent !== nome) x.chi.textContent = nome;
      x.b.setAttribute("aria-label", x.n + (nome ? ", " + nome : ", libero"));
      if (voluto === c && altro) V.lenzVoluto = null;   // è arrivato prima un altro: si resta qui e si sceglie ancora
    });
    if (voluto != null && mio === voluto) { V.lenzVoluto = null; setTimeout(function () { if (V.pannello && V.pannello.tipo === "lenz") V.pannello.chiudi(); }, 260); }
  };
  V.apriPannello("lenz", box, function () { V.compAgg = null; V.lenzVoluto = null; });
  V.compAgg = agg; agg();
  ch.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  ltSfuma(gr);
};
Vista.prototype.apriFoto = function () {
  var V = this, pr = V.priv; if (!pr || !pr.foto || !V.g || V.g.fase !== "gioco") return;
  var box = E("div", "lt-pannello lt-foto"), testa = E("div", "testa"), ch = E("button", "lt-chiudi", "×"), cv = E("canvas", "foto");
  testa.append(E("h3", "", "La tua foto dall'aldilà"), ch); box.append(testa, cv, E("p", "nota", "Alla prossima riunione la vedranno tutti, senza il tuo nome."));
  var rifai = tastoIco("rifai", "gira", "Rifai"); box.appendChild(rifai);
  var k = null, agg = function () { if (!V.priv || !V.priv.foto) return; if (k !== V.priv.foto.seme) { k = V.priv.foto.seme; disegnaFoto(cv, V.priv.foto); } var cdF = V.priv.cdF || 0; rifai.disabled = cdF > 0; rifai.querySelector("span").textContent = cdF > 0 ? "Rifai tra " + cdF + " s" : "Rifai"; };
  rifai.addEventListener("click", function () { V.manda("fantasma", { rifai: 1 }); });
  V.apriPannello("foto", box, function () { clearInterval(V.fotoT); });
  ch.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  agg(); clearInterval(V.fotoT); V.fotoT = setInterval(agg, 400);
};
// una foto dall'aldilà, disegnata dal vero: un pezzo del telo di chi è stato (la testa, un fianco, l'orlo sul pavimento) o un angolo della stanza,
// virata e sgranata come una vecchia stampa colorata a mano: il colore del telo si riconosce, è lui l'indizio.
// Il seme decide tutto: la stessa foto viene uguale su tutti i telefoni.
function casoDa(seme) { var x = seme >>> 0; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
// dove guarda la foto (centro, in frazioni della figura) e quanta figura entra in larghezza. C'è sempre qualcosa che dice cos'è: un occhio, il bordo della sagoma, l'orlo sul pavimento
var PEZZI = [[0.5, 0.2, 0.8], [0.2, 0.42, 0.86], [0.8, 0.46, 0.86], [0.24, 0.84, 0.9], [0.78, 0.84, 0.9], [0.5, 0.8, 1.04]];
function disegnaFoto(cv, f) {
  var c = cv.getContext("2d"), w = cv.offsetWidth || 220, h = cv.offsetHeight || 160, dpr = Math.min(2, window.devicePixelRatio || 1), r = casoDa(f.seme);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  var fine = function () {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = "saturation"; c.globalAlpha = 0.34; c.fillStyle = "#808080"; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    c.globalCompositeOperation = "multiply"; c.fillStyle = "#e8d2ac"; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    for (var i = 0; i < 900; i++) { c.fillStyle = "rgba(" + (r() < .5 ? "0,0,0" : "255,240,210") + "," + (0.05 + r() * 0.12) + ")"; c.fillRect(r() * w, r() * h, 1.2, 1.2); }
    var g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, "rgba(40,25,10,0)"); g.addColorStop(1, "rgba(40,25,10,.75)");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  };
  c.fillStyle = "#2b2420"; c.fillRect(0, 0, w, h);
  if (f.tipo === "chi") {
    var pz = PEZZI[Math.floor(r() * PEZZI.length)], jx = (r() - 0.5) * 0.06, jy = (r() - 0.5) * 0.05, rot = (r() - 0.5) * 0.22;
    var img = figuraTelo((LENZ_DI[f.id] || { c: 0 }).c), iw = img.width * 0.54, ih = img.height * 0.86, cx = img.width * 0.17 + (pz[0] + jx) * iw, cy = img.height * 0.07 + (pz[1] + jy) * ih, sc = w / (pz[2] * iw) * 1.08;   // (il riquadro del telo dentro la canvas)
    var suolo = img.height * 0.8;      // il pavimento: un'ombra sotto i piedi e le assi, così il pezzo di stoffa ha un posto dove stare
    c.save(); c.translate(w / 2, h / 2); c.rotate(rot); c.scale(sc, sc); c.translate(-cx, -cy);
    c.fillStyle = "#4a3a2c"; c.fillRect(-img.width, suolo, img.width * 3, img.height * 2);
    c.fillStyle = "rgba(20,12,8,.5)"; for (var a = 0; a < 7; a++) c.fillRect(-img.width, suolo + a * a * 5 + 8, img.width * 3, 2.2);
    c.fillStyle = "rgba(10,6,4,.55)"; c.beginPath(); c.ellipse(img.width * 0.45, img.height * 0.905, img.width * 0.27, img.height * 0.06, 0, 0, 6.3); c.fill();
    c.drawImage(img, 0, 0); c.restore(); fine();
  } else {
    var st = f.st >= 0 ? PALAZZO.stanze[f.st] : null, px = st ? (st.x + 1 + r() * Math.max(1, st.w - 2)) * T : f.x + (r() - 0.5) * 4 * T, py = st ? (st.y + 1 + r() * Math.max(1, st.h - 2)) * T : f.y + (r() - 0.5) * 4 * T;
    if (st && PALAZZO.PAV[Math.floor(py / T) * PALAZZO.GW + Math.floor(px / T)] !== f.st) { px = st.lx * T; py = st.ly * T; }   // la stanza ha un angolo tagliato lì
    var pit = new Pittore(cv);
    for (var k = 0; k < 30; k++) pit.disegna({ M: PALAZZO, palazzo: true, t: 0, dt: 0, io: { x: px, y: py, mostra: false }, altri: [], corpi: [], R: 9 * T, anima: true, neb: false, buio: false, miei: new Set(), freccia: null, botole: false, effetti: [], telecamere: [], scala: 0.55 + r() * 0.25 });
    fine();
  }
}
// la scheda del mio ruolo: corta, tre cose (cosa fai, il tuo tasto, come si vince)
var VINCI = { ospiti: "Vinci con gli ospiti: finite i compiti, o cacciate tutte le ombre col voto.", ombre: "Vinci con le ombre: quando siete tanti quanti gli altri. Ti aiutano botole e sabotaggi." };
var TASTI = { ospiti: "Usa: compiti e riparazioni · Segnala: una lanterna spenta · Campana: nel Cortile", ombre: "Spegni: chi ti è vicino · Botola: sparisci e riappari · Sabota: luci, telegrafo, acqua" };
Vista.prototype.apriInfo = function () {
  var V = this, pr = V.priv; if (!pr || !RUOLI[pr.ruolo] || !V.g || (V.g.fase !== "gioco" && V.g.fase !== "atrio")) return;
  if (!V.sonoVivo() && pr.fantasmaRuolo && FANTASMI[pr.fantasmaRuolo]) {
    var F = FANTASMI[pr.fantasmaRuolo], bf = E("div", "lt-pannello lt-foglio lt-infor fantasma"), tf = E("div", "testa"), cf = E("button", "lt-chiudi", "×");
    tf.append(E("span", "sq", "Fantasma"), E("h3", "", F.nome), cf); bf.append(intestazione("Registro di Palazzo Velmare"), tf, E("p", "desc", F.desc));
    var ulf = E("ul"); ulf.append(E("li", "", "Il tuo tasto: " + F.abil), E("li", "", "Vai più veloce e passi dai muri. Puoi ancora finire i tuoi compiti.")); bf.appendChild(ulf);
    V.apriPannello("info", bf); tocca(cf, function () { if (V.pannello) V.pannello.chiudi(); }); return;
  }
  var R = RUOLI[pr.ruolo], box = E("div", "lt-pannello lt-foglio lt-infor " + pr.squadra), testa = E("div", "testa"), ch = E("button", "lt-chiudi", "×");
  testa.append(E("span", "sq", { ospiti: "Ospite", ombre: "Ombra", soli: "Da solo" }[pr.squadra] || ""), E("h3", "", R.nome), ch); box.append(intestazione("Registro di Palazzo Velmare"), testa);
  box.appendChild(E("p", "desc", R.desc));
  var ul = E("ul");
  if (R.abil) ul.appendChild(E("li", "", "Il tuo tasto: " + R.abil));
  if (TASTI[pr.squadra]) ul.appendChild(E("li", "", TASTI[pr.squadra]));
  if (VINCI[pr.squadra]) ul.appendChild(E("li", "", VINCI[pr.squadra]));
  if (pr.ruolo === "indovino") { var impI = (V.vm && V.vm.imp && V.vm.imp.indovino) || {}; ul.appendChild(E("li", "", "Il tuo tasto in riunione: la maschera sulle schede. Indovinati " + pr.indovinati + " su " + pr.quantiInd + (impI.sbaglia === "niente" ? ". Se sbagli, in questa partita non cadi." : "."))); }
  if (pr.mod && MODIFICATORI[pr.mod]) ul.appendChild(E("li", "", MODIFICATORI[pr.mod].nome + ": " + MODIFICATORI[pr.mod].desc));
  box.appendChild(ul);
  V.apriPannello("info", box); tocca(ch, function () { if (V.pannello) V.pannello.chiudi(); });
};
// la saletta nell'atrio: in alto il codice della stanza, quanti siamo e «Invita»
Vista.prototype.aggSaletta = function (sal) {
  var V = this;
  if (!V.salBox) {
    V.salBox = E("div", "lt-saletta"); V.salTesto = E("span", "cod"); V.salInv = tastoIco("inv", "invia", "Invita");
    V.salInv.addEventListener("click", function () { V.invita(); }); V.salBox.append(V.salTesto, V.salInv); V.velo.parentNode.appendChild(V.salBox);
  }
  V.salBox.hidden = !sal; V.sc.classList.toggle("sal", !!sal); if (!sal) return;
  var n = (V.vm.players || []).filter(function (p) { return !p.via; }).length, tx = (V.oriz ? "Stanza " : "") + (V.vm.codice || "…") + " · " + n + "/" + MAX;   // (in verticale la riga è stretta: bastano codice e numero)
  if (V.salTesto.textContent !== tx) V.salTesto.textContent = tx;
};
// il link d'invito della stanza (gli amici entrano direttamente nella saletta)
Vista.prototype.invita = function () {
  var V = this, cod = V.vm && V.vm.codice; if (!cod || cod === "…") return;
  var url = location.origin + location.pathname + "#gioco=" + ID + "&stanza=" + cod, testo = "Vieni a giocare a Lanterne: stanza " + cod;
  if (navigator.share) { navigator.share({ title: "Lanterne", text: testo, url: url }).catch(function () {}); return; }
  try { navigator.clipboard.writeText(testo + " " + url).then(function () { V.avviso("Link copiato: mandalo agli amici."); }, function () { V.avviso("Codice della stanza: " + cod); }); } catch (e) { V.avviso("Codice della stanza: " + cod); }
};
// il registro delle regole, nella saletta: l'host sceglie le regole, i Bot e fa partire; gli altri vedono le regole e aspettano
Vista.prototype.apriComputer = function () {
  var V = this, host = !!V.cb.sonoHost, box = E("div", "lt-pannello lt-foglio lt-computer"), testa = E("div", "testa"), tit = E("div", "tit"), ch = E("button", "lt-chiudi", "×");
  ch.setAttribute("aria-label", "Chiudi"); tit.appendChild(E("h3", "", "Regole della notte")); testa.append(tit, ch); box.append(intestazione("Registro di Palazzo Velmare"), testa);
  var dove = JSON.parse(JSON.stringify((V.vm && V.vm.imp) || {})), corpo = E("div", "corpo"); box.appendChild(corpo);
  var applica = function () { if (host && V.t.onRegole) V.t.onRegole(dove); };
  if (host) {
    impostazioni(corpo, dove, { el: V.t.el });
    var pronti = E("div", "lt-pronti"); pronti.setAttribute("aria-label", "Chi ha la mappa pronta"); corpo.insertBefore(pronti, corpo.firstChild);   // chi ha già scaricato la mappa
    var piede = E("div", "piede"), bAdd = tastoIco("", "piu", "<i>Aggiungi un </i>Bot"), bTogli = tastoIco("", "meno", "<i>Togli un </i>Bot"), via = tastoIco("via", "", "Comincia");
    bAdd.addEventListener("click", function () { V.cb.onBot && V.cb.onBot(); });
    bTogli.addEventListener("click", function () { V.cb.onTogliBot && V.cb.onTogliBot(); });
    via.addEventListener("click", function () { applica(); if (V.pannello) V.pannello.chiudi(); V.cb.onComincia && V.cb.onComincia(); });
    var nota = E("p", "nota", ""); piede.append(bAdd, bTogli, via); box.append(piede, nota);
    V.compAgg = function () {
      var qui = (V.vm.players || []).filter(function (p) { return !p.via; }), umani = qui.filter(function (p) { return !p.bot; }), kp = umani.map(function (p) { var x = V.prDi(p); return p.nome + ":" + (x.pr ? "ok" : x.mp); }).join("|");
      if (pronti._k !== kp) {
        pronti._k = kp; pronti.textContent = ""; pronti.hidden = umani.length < 2;
        umani.forEach(function (p) { var x = V.prDi(p), c = E("span", x.pr ? "ok" : "", p.nome), b = E("b"); b.innerHTML = x.pr ? icona("pulito") : x.mp + "%"; c.appendChild(b); pronti.appendChild(c); });
      }
      var n = qui.length; via.disabled = n < MIN || !!V.vm.avvio; nota.textContent = n < MIN ? "Servono almeno " + MIN + " giocatori: aggiungi un Bot." : n + " giocatori nella saletta"; };
    V.compAgg();
  } else {
    // chi non ha aperto la stanza vede lo stesso registro, in sola lettura; se le regole cambiano si aggiorna da solo
    var ultimo = JSON.stringify(dove);
    impostazioni(corpo, dove, { el: V.t.el, sola: true });
    box.appendChild(E("p", "nota", "Le regole le sceglie chi ha aperto la stanza."));
    V.compAgg = function () { var ora = JSON.stringify((V.vm && V.vm.imp) || {}); if (ora === ultimo) return; ultimo = ora; dove = JSON.parse(ora); impostazioni(corpo, dove, { el: V.t.el, sola: true }); };
  }
  V.apriPannello("computer", box, function () { applica(); V.compAgg = null; });
  ch.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
};
// dentro una botola: frecce verso le botole collegate (ci si sposta restando dentro) e «Esci» al centro.
// Il Giullare ha solo «Esci»: entra, resta ed esce dalla stessa.
Vista.prototype.aggBotola = function () {
  var V = this, pr = V.priv, i = pr && pr.botola != null && V.g && V.g.fase === "gioco" ? pr.botola : null;
  var k = i == null ? "" : i + "|" + pr.ruolo;
  if (V.botK === k) return; V.botK = k;
  if (V.botUI) { V.botUI.remove(); V.botUI = null; }
  if (i == null) return;
  var box = E("div", "lt-botola"), e = ESTREMI[i], dove = function (x) { return stanzaDi(PALAZZO, { x: centro(x.tx), y: centro(x.ty) }).nome; };
  box.appendChild(E("div", "qui", dove(e)));
  (pr.ruolo === "giullare" ? [] : botoleCollegate(i)).forEach(function (j) {
    var f = ESTREMI[j], a = Math.atan2(f.ty - e.ty, f.tx - e.tx), b = E("button", "va");
    b.type = "button"; b.style.setProperty("--a", a + "rad");
    b.style.left = "calc(50% + " + (Math.cos(a) * 34).toFixed(1) + "vmin)"; b.style.top = "calc(50% + " + (Math.sin(a) * 30).toFixed(1) + "vmin)";
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h12M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    b.appendChild(E("span", "", dove(f)));
    b.addEventListener("click", function () { V.manda("botola", { verso: j }); vibra(15); });
    box.appendChild(b);
  });
  var esci = E("button", "esci", "Esci"); esci.type = "button";
  esci.addEventListener("click", function () { V.manda("botola", { esci: 1 }); vibra(15); });
  box.appendChild(esci);
  V.velo.parentNode.appendChild(box); V.botUI = box;
};
// quanti passi da me a una casella (mappa delle distanze rifatta quando cambio casella): la freccia sceglie a piedi, non in linea d'aria
Vista.prototype.passi = function (tx, ty) {
  var V = this, M = PALAZZO, cx = Math.floor(V.me.x / T), cy = Math.floor(V.me.y / T), k = cx + "," + cy;
  if (V.distK !== k) { V.distK = k; V.dist = distanze(M, cx, cy); }
  var d = V.dist[ty * M.GW + tx]; return d < 0 ? 9999 : d;
};
// la freccia e la riga in alto: corta, solo quello che serve
Vista.prototype.meta = function () {
  var V = this, g = V.g, me = V.me;
  if (V.vm && V.vm.fase === "lobby") return V.cb.sonoHost ? { x: centro(COMPUTER.tx), y: centro(COMPUTER.ty), col: "#5ad19a", testo: "Al registro: regole e Comincia" } : { x: me.x, y: me.y, testo: "Aspettiamo chi ha aperto la stanza" };
  if (!g || g.mappa !== "palazzo" || V.guardo) return null;
  var vivo = V.sonoVivo(), piu = function (l) { return l.slice().sort(function (a, b) { return V.passi(a.tx, a.ty) - V.passi(b.tx, b.ty); })[0]; };
  // i sabotaggi: la freccia la vedono tutti i vivi, ombre comprese (anche loro possono riparare)
  if (g.acqua && vivo) {
    var resta = Math.max(0, Math.ceil((V.acquaFine - performance.now()) / 1000)), aperte = [];
    if (!g.acqua[1]) aperte.push(CHIUSA_A); if (!g.acqua[2]) aperte.push(CHIUSA_B);
    var ch = piu(aperte.length ? aperte : [CHIUSA_A]);
    return { x: centro(ch.tx), y: centro(ch.ty), col: "#5ab0ff", testo: "Chiusa " + (ch === CHIUSA_A ? "del Molo" : "della Cantina") + " · " + resta + " s", rosso: true };
  }
  if (g.buio && vivo) return { x: centro(QUADRO.tx), y: centro(QUADRO.ty), col: "#f05a6e", testo: "Al quadro delle luci", rosso: true };
  if (g.interf && vivo) return { x: centro(CONSOLE.tx), y: centro(CONSOLE.ty), col: "#ffb35a", testo: "Al telegrafo", rosso: true, glitch: true };
  if (g.interf) return null;   // con l'interferenza niente frecce dei compiti
  // l'Avvoltoio sente le lanterne spente: la freccia porta alla più vicina
  if (V.priv && V.priv.ruolo === "avvoltoio" && vivo && g.corpi && g.corpi.length) {
    var k = piu(g.corpi.map(function (c) { return { tx: Math.floor(c[1] / T), ty: Math.floor(c[2] / T), c: c }; })).c;
    return { x: k[1], y: k[2], col: "#c9a27a", testo: "Una lanterna spenta · mangiala" };
  }
  var ap = V.compitiAperti(); if (!ap.length) return null;
  var p = piu(ap);
  return { x: centro(p.tx), y: centro(p.ty), col: "#e7b75c", testo: (V.squadra() === "ombre" ? "Fingi · " : "") + p.nome, post: p };
};
Vista.prototype.disegnaScena = function () {
  var V = this, g = V.g, io = V.me; if (!g) return;
  var altri = V.altri(), corpi = (g.corpi || []).map(function (k) { return { id: k[0], x: k[1], y: k[2], lenz: LENZ_DI[k[0]] }; });
  var segui = null;
  if (V.guardo) { var vivi = altri.filter(function (p) { return !p.fantasma; }); segui = vivi[0] || altri[0] || { x: FALLBACK.x, y: FALLBACK.y }; }
  if (V.ctrl && V.ctrl.fine > performance.now()) segui = { x: V.ctrl.x, y: V.ctrl.y };
  var pr = V.priv || {}, come = pr.travestito || V.cb.myId;
  var mioAv = AVATAR[come], c = V.cache[come] || {};
  var ioD = { x: io.x, y: io.y, dir: io.dir, muove: io.muove, fantasma: !V.sonoVivo(), nome: c.nome || "", colore: c.colore, lenz: c.lenz, img: mioAv && mioAv.img, imgS: mioAv && mioAv.imgS, mostra: !V.guardo && !(pr && pr.botola != null), seme: 3, id: V.cb.myId };
  var oraB = performance.now(); for (var ib = V.bolle.length - 1; ib >= 0; ib--) if (V.bolle[ib].fine <= oraB) V.bolle.splice(ib, 1);   // i fumetti scaduti
  var apertaP = !V.parlaBar.hidden, vivoP = V.sonoVivo();
  V.parlaAlzaVista = V.pit.ridotto ? V.parlaAlza : V.parlaAlzaVista + (V.parlaAlza - V.parlaAlzaVista) * Math.min(1, V.dt * 10);
  var sab = V.sabAgg(performance.now());
  var miei = new Set(g.interf ? [] : V.compitiAperti().map(function (p) { return p.id; })), meta = V.meta(), ora = performance.now();
  if (meta && meta.nessunaFreccia) meta = null;
  V.pit.disegna({ M: V.M, palazzo: g.mappa === "palazzo", saletta: !!(V.vm && V.vm.fase === "lobby"), t: V.tempo, dt: V.dt, io: ioD, altri: altri, corpi: corpi, R: V.raggio(),
    buioE: sab.buioE, buioR: sab.buioR, interfE: sab.interfE, acquaV: g.mappa === "palazzo" ? sab.acquaV : null,
    anima: V.guardo || !V.sonoVivo() || g.mappa !== "palazzo" || g.bengala > 0, neb: g.neb > 0, buio: g.buio > 0 && V.squadra() !== "ombre" && V.sonoVivo(), bengala: g.bengala > 0,
    miei: miei, freccia: meta, acqua: !!g.acqua, chiuse: g.acqua ? [!g.acqua[1], !g.acqua[2]] : null, interf: g.interf > 0, botole: V.squadra() === "ombre" || !V.sonoVivo() || pr.ruolo === "ingegnere", segui: segui, effetti: V.effetti, segnati: g.segnati, scossa: V.scossa,
    scudi: V.squadra() !== "ombre" ? (g.scudi || []).filter(function (id) { return id !== V.cb.myId; }) : [], telecamere: g.cam, osservate: g.osservate, orme: V.orme, durOrme: (V.vm.imp.investigatore && V.vm.imp.investigatore.orme) || 10,
    traccia: pr.traccia && V.tracciaFine > ora ? pr.traccia[0] : null, ipno: V.bloccFine > ora,
    trappola: g.mappa === "palazzo" ? pr.trappola : null, urlo: V.urlo && V.urlo.fine > V.tempo && g.mappa === "palazzo" ? V.urlo : null,
    rianima: V.rianFine > ora ? 1 - (V.rianFine - ora) / V.rianTot : 0, bolle: V.bolle, ora: ora, alza: V.parlaAlzaVista, voce: V.voceAnelli(),
    parla: apertaP ? { R: R_PARLA, Rm: R_MURO, anima: !vivoP } : null });
};
var FALLBACK = { x: 32 * T, y: 22 * T };

// ----- pulsanti e scritte -----
Vista.prototype.vicinoUsa = function () {
  var V = this, me = V.me, g = V.g;
  if (V.vm && V.vm.fase === "lobby") return g && Math.hypot(centro(COMPUTER.tx) - me.x, centro(COMPUTER.ty) - me.y) < R_USA * 1.2 ? { tipo: "computer" } : null;
  if (!g || g.fase !== "gioco" || V.guardo) return null;
  var d = function (tx, ty) { return Math.hypot(centro(tx) - me.x, centro(ty) - me.y); };
  var crew = V.sonoVivo();   // (riparano tutti i vivi, ombre comprese)
  if (g.buio && crew && d(QUADRO.tx, QUADRO.ty) < R_USA) return { tipo: "ripara", cosa: "luci", post: QUADRO };
  if (g.interf && crew && d(CONSOLE.tx, CONSOLE.ty) < R_USA) return { tipo: "ripara", cosa: "console", post: CONSOLE };
  if (g.acqua && crew && !g.acqua[1] && d(CHIUSA_A.tx, CHIUSA_A.ty) < R_USA) return { tipo: "ripara", cosa: "chiusaA", post: CHIUSA_A };
  if (g.acqua && crew && !g.acqua[2] && d(CHIUSA_B.tx, CHIUSA_B.ty) < R_USA) return { tipo: "ripara", cosa: "chiusaB", post: CHIUSA_B };
  // le ombre vedono i compiti per fingere (ci stanno accanto), ma non li possono fare
  if (V.squadra() !== "ombre") { var ap = V.compitiAperti(); for (var i = 0; i < ap.length; i++) if (d(ap[i].tx, ap[i].ty) < R_USA) return { tipo: "compito", post: ap[i] }; }
  if (d(MONITOR.tx, MONITOR.ty) < R_USA) return { tipo: "telecamere" };
  if (d(PLASTICO.tx, PLASTICO.ty) < R_USA) return { tipo: "plastico" };
  if (V.sonoVivo() && V.priv && V.priv.campane > 0 && d(CAMPANA.tx, CAMPANA.ty) < R_USA) return { tipo: "campana" };
  return null;
};
Vista.prototype.bersaglio = function (r, filtro) {
  var V = this, me = V.me, best = null, bd = r;
  V.altri().forEach(function (p) { if (p.fantasma || !filtro(p)) return; var d = Math.hypot(p.x - me.x, p.y - me.y); if (d < bd && vede(V.M, me.x, me.y, p.x, p.y)) { bd = d; best = p; } });
  return best;
};
Vista.prototype.corpoVicino = function (r) {
  var V = this, me = V.me; r = r || R_SEGNALA; if (!V.g) return null;
  var c = (V.g.corpi || []).filter(function (k) { return Math.hypot(k[1] - me.x, k[2] - me.y) < r && vede(V.M, me.x, me.y, k[1], k[2]); })[0];
  return c ? c[0] : null;
};
// ---- le scritte dei tasti rotondi: sempre tutte dentro il cerchio e al centro, in orizzontale e in verticale ----
// Il carattere si rimpicciolisce da solo, misurando la larghezza vera della scritta (stesso carattere del tasto) e quanto spazio c'è nel cerchio
// RIGA PER RIGA (più si va verso il bordo, più la corda del cerchio si accorcia). Si va a capo solo se rimpicciolire non basta: prima dove c'è
// uno spazio («TELECAMERA» / «×3»), poi spezzando la parola lunga in una sillaba («TELE-» / «CAMERA»). Poi il blocco si sposta di quel poco
// che serve perché sia centrato com'è DISEGNATO (le maiuscole non hanno code sotto: la riga da sola sembrerebbe un po' troppo in alto).
var TASTO = { max: 10, piano: 8, min: 5.5, lh: 1.12, ls: 0.02, resp: 3.5 };   // px: carattere più grande, più piccolo che si legge bene, minimo assoluto; interlinea; spaziatura (em); respiro dal bordo
var TASTO_CV = null, TASTO_REF = {};
function tastoMisura(t, fam) {   // larghezza e ingombro verticale di una riga, riportati a 100 px, con la spaziatura delle lettere
  // (si misura a 10 px, vicino alla misura vera: i caratteri di sistema cambiano forma e spaziatura col corpo, a 100 px la larghezza verrebbe più stretta)
  var k = fam + "|" + t; if (TASTO_REF[k]) return TASTO_REF[k];
  TASTO_CV = TASTO_CV || document.createElement("canvas").getContext("2d");
  TASTO_CV.font = "600 10px " + fam;
  var m = TASTO_CV.measureText(t), n = t.length;
  return (TASTO_REF[k] = { w: m.width * 10 + (n - 1) * TASTO.ls * 100, su: (m.actualBoundingBoxAscent || 7.2) * 10, giu: (m.actualBoundingBoxDescent || 0) * 10, fa: (m.fontBoundingBoxAscent || 9.5) * 10, fd: (m.fontBoundingBoxDescent || 2.5) * 10 });
}
// dove spezzare una parola lunga: vicino al mezzo, fra sillabe (vocale-consonante-vocale: prima della consonante; consonante doppia: in mezzo; altrimenti dopo la prima consonante)
function tastoSpezza(w) {
  var V = "AEIOUÀÈÉÌÒÙ", pos = [], i;
  for (i = 2; i <= w.length - 3; i++) {
    var a = w[i - 1], b = w[i], c = w[i + 1], vA = V.indexOf(a) >= 0, vB = V.indexOf(b) >= 0, vC = V.indexOf(c) >= 0;
    if (vA && !vB && vC) pos.push(i);                    // te|le
    else if (!vA && !vB && a === b) pos.push(i);          // riac|cendi
    else if (vA && !vB && !vC) pos.push(i + 1);           // con|trolla
  }
  pos = pos.filter(function (p) { return p >= 3 && p <= w.length - 3; });
  if (!pos.length) return null;
  var mezzo = w.length / 2; pos.sort(function (x, y) { return Math.abs(x - mezzo) - Math.abs(y - mezzo) || x - y; });
  return [w.slice(0, pos[0]) + "-", w.slice(pos[0])];
}
function tastoLayout(T) {
  var parole = T.split(" "), out = [[T]];
  if (parole.length > 1) out.push([parole.slice(0, -1).join(" "), parole[parole.length - 1]]);
  var sp = tastoSpezza(parole[0]);
  if (sp) { var resto = parole.slice(1).join(" "); out.push([sp[0], sp[1] + (resto ? " " + resto : "")]); if (resto) out.push([sp[0], sp[1], resto]); }
  return out;
}
// il carattere più grande (a passi di 0,25 px) con cui il blocco sta nel cerchio di raggio R; 0 se nemmeno al minimo
function tastoCorpo(righe, fam, R) {
  var n = righe.length, ref = righe.map(function (t) { return tastoMisura(t, fam); });
  for (var f = TASTO.max; f >= TASTO.min - 0.001; f -= 0.25) {
    var h = f * TASTO.lh, ok = true;
    for (var k = 0; k < n && ok; k++) {
      var y = (k - (n - 1) / 2) * h, lembo = Math.abs(y) + (ref[k].su + ref[k].giu) / 2 * f / 100;   // il bordo (in alto o in basso) della riga più lontano dal centro
      var corda = 2 * Math.sqrt(Math.max(0, R * R - lembo * lembo));
      if (ref[k].w * f / 100 > corda - 1) ok = false;
    }
    if (ok) return f;
  }
  return 0;
}
function scrittaTasto(b, testo) {
  var et = b.querySelector(".et"); if (!et) return;
  b.setAttribute("aria-label", testo || ""); b.dataset.scritta = testo || "";   // (a chi legge lo schermo resta la scritta intera, senza sillabe)
  if (!testo) { et.textContent = ""; return; }
  var T = testo.toUpperCase(), fam = getComputedStyle(b).fontFamily, D = b.offsetWidth || 62, R = D / 2 - TASTO.resp;
  var scelta = null, lay = tastoLayout(T);
  // 1) una riga sola, rimpicciolita fino a «piano»; 2) se non basta, andare a capo con il carattere più grande possibile; 3) se nemmeno così, il minimo
  var f1 = tastoCorpo(lay[0], fam, R);
  if (f1 >= TASTO.piano) scelta = { righe: lay[0], f: f1 };
  else {
    var migliore = null;
    for (var i = 1; i < lay.length; i++) { var f = tastoCorpo(lay[i], fam, R); if (f && (!migliore || f > migliore.f + 0.5 || (f > migliore.f - 0.5 && lay[i].length < migliore.righe.length))) migliore = { righe: lay[i], f: f }; }
    if (migliore && migliore.f >= TASTO.piano) scelta = migliore;
    else { scelta = f1 ? { righe: lay[0], f: f1 } : null; if (migliore && (!scelta || migliore.f > scelta.f)) scelta = migliore; }
    if (!scelta) scelta = { righe: lay[0], f: TASTO.min };
  }
  var f = scelta.f, n = scelta.righe.length, h = f * TASTO.lh, ref = scelta.righe.map(function (t) { return tastoMisura(t, fam); });
  // la scritta è un SVG: la linea di base di ogni riga si mette al decimo di pixel (nel testo normale il browser la arrotonda al pixel intero e il blocco
  // verrebbe fuori centro). L'inchiostro di tutto il blocco, dalla cima delle maiuscole della prima riga al fondo dell'ultima, sta al centro del tasto.
  var W = b.clientWidth || D - 3, c = W / 2, y1 = c - ((n - 1) * h + ref[n - 1].giu * f / 100 - ref[0].su * f / 100) / 2, dx = TASTO.ls * f / 2;   // dx: dopo l'ultima lettera la spaziatura è vuota
  var NS = "http:" + "/" + "/www.w3.org/2000/svg", sv = document.createElementNS(NS, "svg");
  sv.setAttribute("viewBox", "0 0 " + W + " " + W); sv.setAttribute("aria-hidden", "true"); sv.setAttribute("focusable", "false");
  scelta.righe.forEach(function (r, k) {
    var t = document.createElementNS(NS, "text"); t.setAttribute("x", (c + dx).toFixed(2)); t.setAttribute("y", (y1 + k * h).toFixed(2)); t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", f.toFixed(2)); t.textContent = r; sv.appendChild(t);
  });
  et.textContent = ""; et.appendChild(sv); et.style.fontSize = ""; et.style.transform = "";
  b.dataset.corpo = f.toFixed(2); b.dataset.righe = String(n);
}
// il ruolo in alto: i nomi lunghi si stringono, così non finiscono sotto i tasti di destra
Vista.prototype.scriviChip = function (nr) { var c = this.chip; c.textContent = nr; c.classList.toggle("lunga", nr.length >= 9); c.classList.toggle("lunghissima", nr.length >= 12); };
Vista.prototype.setBtn = function (k, vis, abil, et, cd) {
  var b = this.btn[k], key = vis + "|" + abil + "|" + et + "|" + cd; if (b._k === key) return; b._k = key;
  b.hidden = !vis; b.disabled = !abil; scrittaTasto(b, et); b.classList.toggle("conta", !!cd);
  // l'immagine grande e trasparente dietro la scritta: dalla tabella TASTO_ICONA (la scritta senza il « ×N»); cambia solo se cambia l'immagine
  var icn = TASTO_ICONA[String(et || "").replace(/ ×\d+$/, "").toLowerCase()] || (et ? (TASTO_ICONA_K[k] || "t_potere") : ""), ic = b.querySelector(".ic");
  if (ic && ic._n !== icn) { ic._n = icn; ic.innerHTML = icn ? icona(icn) : ""; }
  var c = b.querySelector(".cd"); c.hidden = !cd; c.textContent = cd || "";
};
Vista.prototype.aggHud = function () {
  var V = this, g = V.g, pr = V.priv; if (!g) return;
  var inGioco = g.fase === "gioco" && !V.guardo && !!pr, palazzo = g.mappa === "palazzo", sal = V.vm && V.vm.fase === "lobby";
  V.az.hidden = !(inGioco && palazzo) && !sal;
  V.s.querySelector(".lt-sx").hidden = (!palazzo && !sal) || V.guardo || !pr;
  V.aggSaletta(sal); V.aggMappa(sal);
  V.setBtn("lenz", !!sal && !V.guardo && !!pr, true, "Lenzuolo", 0);
  if (sal && !V.btn.lenz.hidden) {   // il tasto ha il colore del mio telo; lo scritto si legge sempre
    var telo = panno(V.cb.myId), rr = parseInt(telo.b.slice(1), 16), luce = 0.3 * (rr >> 16) + 0.59 * ((rr >> 8) & 255) + 0.11 * (rr & 255);
    if (V.btn.lenz._c !== telo.b) { V.btn.lenz._c = telo.b; V.btn.lenz.style.setProperty("--telo", telo.b); V.btn.lenz.style.setProperty("--orlo", telo.l); V.btn.lenz.style.color = luce > 135 ? "#1d1508" : "#fff4e0"; }
  }
  V.btnMappa.hidden = !palazzo;
  // la chat di prossimità c'è nel gioco e nella saletta; non in riunione, non a chi guarda, non da una botola
  V.btnParla.hidden = V.guardo || !pr || ((!palazzo || g.fase !== "gioco" || pr.botola != null) && !sal);
  if (V.btnParla.hidden && !V.parlaBar.hidden) V.parlaApri(false);
  // la voce: nella saletta e nel gioco (in riunione i tasti stanno nella riunione), non a chi guarda; senza stanza online non c'è
  V.voceGr.hidden = !(VOCE.disponibile() && !V.guardo && !!pr && (g.fase === "gioco" || g.fase === "atrio"));
  V.storicoGira(performance.now()); if (!V.parlaBar.hidden) { V.parlaStato(); V.parlaPosiz(); }
  var ora = performance.now(), sec = function (f) { return Math.max(0, Math.ceil((f - ora) / 1000)); };
  if (sal) {   // nella saletta: solo «Usa» davanti al computer
    var uS = V.vicinoUsa();
    ["segnala", "spegni", "botola", "buio", "abil"].forEach(function (k) { V.setBtn(k, false, false, "", 0); });
    V.setBtn("usa", true, !!uS, "Computer", 0);
  } else if (inGioco && palazzo) {
    var vivo = V.sonoVivo(), om = pr.squadra === "ombre", u = V.vicinoUsa();
    V.setBtn("usa", true, !!u, u ? ({ ripara: "Ripara", campana: "Campana", telecamere: "Schermi", plastico: "Plastico" }[u.tipo] || "Usa") : "Usa", 0);
    V.setBtn("segnala", vivo, vivo && !!V.corpoVicino(), "Segnala", 0);
    var comp = pr.compagni || [];
    if (om) {
      var cd = sec(V.cdFine), tg = vivo && !cd ? V.bersaglio(R_SPEGNI, function (p) { return comp.indexOf(p.id) < 0; }) : null;
      V.setBtn("spegni", vivo, !!tg, pr.ruolo === "avvelenatore" ? "Avvelena" : "Spegni", cd);
      var bo = vivo && ESTREMI.some(function (e) { return Math.hypot(centro(e.tx) - V.me.x, centro(e.ty) - V.me.y) < 0.9 * T; });
      V.setBtn("botola", vivo, bo && pr.botola == null, "Botola", 0);
      var cdb = sec(V.cdBFine), sabA = g.buio || g.interf || g.acqua; V.setBtn("buio", vivo || pr.ruolo === "spettro", !sabA && !cdb, "Sabota", cdb);
    } else {
      var ing = (pr.ruolo === "ingegnere" || pr.ruolo === "giullare") && vivo, boI = ing && pr.botola == null && ESTREMI.some(function (e) { return Math.hypot(centro(e.tx) - V.me.x, centro(e.ty) - V.me.y) < 0.9 * T; });
      V.setBtn("spegni", false, false, "Spegni", 0); V.setBtn("botola", ing, boI, "Botola", 0); V.setBtn("buio", false, false, "Buio", 0);
    }
    var cda = sec(V.cdAFine), r = pr.ruolo, ab = RUOLI[r] && RUOLI[r].abil, tipo = BERSAGLIO[r];
    if (ab && vivo) {
      var ok = false, et = ab, num = 0;
      if (tipo === "mutaforma") { if (pr.campione) { ok = !cda && !pr.travestito; et = "Trasformati"; num = cda; } else ok = !!V.bersaglio(R_ABIL, function (p) { return comp.indexOf(p.id) < 0; }); }
      else if (tipo === "stanza") { ok = !cda; num = cda; }
      else if (tipo === "vivo") {
        var filt = (r === "silenziatore" || r === "ipnotista") ? function (p) { return comp.indexOf(p.id) < 0; } : function () { return true; };
        ok = !!V.bersaglio(R_ABIL, filt) || (r === "medico" && !!(V.vm.imp.medico && V.vm.imp.medico.se));
        if (r === "veggente") { ok = ok && pr.usi > 0 && !cda; num = cda; if (pr.usi <= 0) et = "Letto"; } else { ok = ok && !cda; num = cda; }
      } else if (tipo === "corpo") {
        ok = V.corpoVicino(R_ABIL) != null;
        if (r === "rianimatore") { ok = ok && pr.usiRian > 0 && !pr.rianima; et = ab + " ×" + pr.usiRian; } else if (r === "spazzino") { ok = ok && !cda; num = cda; }
      } else if (r === "campanaro") { ok = pr.campVolte > 0; et = ab + " ×" + pr.campVolte; }
      else if (r === "bengala") { ok = pr.usiBeng > 0 && !g.bengala; et = ab + " ×" + pr.usiBeng; }
      else if (tipo === "due") { ok = pr.usiTra > 0 && !cda; et = ab + " ×" + pr.usiTra; num = cda; }
      else if (r === "sentinella") { ok = pr.camDisp > 0; et = ab + (pr.camDisp ? " ×" + pr.camDisp : ""); }
      else if (r === "ingegnere") { ok = !cda && !!g.buio; num = cda; }
      else if (r === "veterano") { ok = !cda && pr.usiVet > 0 && !(V.allFine > ora); et = ab + " ×" + pr.usiVet; num = cda; }
      else if (r === "spia" || r === "bracconiere") { ok = !cda; num = cda; }
      else { ok = !cda && !g.neb; num = cda; }
      V.setBtn("abil", true, ok, et, num);
    } else if (!vivo && pr.fantasmaRuolo && FANTASMI[pr.fantasmaRuolo]) {   // i poteri da fantasma
      var cdF = pr.cdF || 0, okF = pr.fantasmaRuolo === "medium" ? true : !cdF && !!V.bersaglio(R_ABIL, function (p) { return !p.fantasma; });
      V.setBtn("abil", true, okF, FANTASMI[pr.fantasmaRuolo].abil, pr.fantasmaRuolo === "medium" ? 0 : cdF);
    } else V.setBtn("abil", false, false, "", 0);
  }
  // barra dei preparativi, ruolo e guida in alto
  if (pr) {
    var nr = sal ? "Saletta" : !V.sonoVivo() && pr.fantasmaRuolo && FANTASMI[pr.fantasmaRuolo] ? FANTASMI[pr.fantasmaRuolo].nome : RUOLI[pr.ruolo] ? RUOLI[pr.ruolo].nome : ""; if (V.chip.textContent !== nr) { V.scriviChip(nr); V.chip.dataset.squadra = pr.squadra; }
    // le cose da sapere del proprio ruolo, in una riga
    var info = [], nome = function (id) { return (V.cache[id] || {}).nome || "?"; };
    if (V.bloccFine > ora) info.push("Sei ipnotizzato!");
    if (V.rianFine > ora) info.push("Resta fermo…");
    if (pr.ruolo === "gatto") info.push("Vite: " + pr.vite);
    if (pr.ruolo === "accusatore" && pr.bersaglio) info.push("Bersaglio: " + nome(pr.bersaglio));
    if (pr.ruolo === "avvoltoio") info.push("Mangiate: " + pr.mangiati + "/" + pr.quanti);
    if (pr.travestito) info.push("Sembri " + nome(pr.travestito));
    if (pr.traccia && V.tracciaFine > ora) info.push("Segui " + nome(pr.traccia[0]));
    if (pr.ruolo === "sindaco") info.push(pr.rivelato ? "Voto doppio" : "Rivelati in riunione");
    if (pr.ruolo === "indovino") info.push("Indovinati " + pr.indovinati + "/" + pr.quantiInd);
    if (pr.mod && MODIFICATORI[pr.mod]) info.push(MODIFICATORI[pr.mod].nome);
    if (pr.trappola) info.push("Trappola " + pr.trappola[2] + "/" + pr.trappola[3]);
    if (pr.trapRuoli) info.push("Passati: " + pr.trapRuoli.join(", "));
    if (pr.ruolo === "imitatore" && pr.imita) info.push("Imiterai " + nome(pr.imita));
    if (pr.campione) info.push("Campione: " + nome(pr.campione));
    if (V.ctrl && V.ctrl.fine > ora) info.push("Controlli " + nome(V.ctrl.id) + ": " + Math.ceil((V.ctrl.fine - ora) / 1000) + " s");
    if (pr.portineria) info.push("Sorvegli " + PALAZZO.stanze[pr.portineria.st].nome);
    if (V.allFine > ora) info.push("In allerta: " + Math.ceil((V.allFine - ora) / 1000) + " s");
    if (pr.ruolo === "sentinella") info.push("Piazzate " + pr.camPiazzate + (pr.camDisp ? " · pronte " + pr.camDisp : ""));
    var fr = V.frenFine && g.fase === "gioco" ? Math.max(0, Math.ceil((V.frenFine - ora) / 1000)) : 99;
    if (fr <= 15) info.unshift("Cambia stanza: " + fr + " s");
    var ti = info.join(" · "); if (V.info.textContent !== ti) V.info.textContent = ti; V.info.hidden = !ti; V.info.classList.toggle("urgente", fr <= 10);
  }
  var pc = (g.pc || 0) + "%"; var fill = V.barra.querySelector("i"); if (fill.style.width !== pc) fill.style.width = pc;
  var meta = V.meta(), testo = "", rosso = false;
  if (V.vm && V.vm.fase === "lobby") testo = (V.meta() || {}).testo || "";
  else if (g.mappa !== "palazzo") testo = "Atrio · si comincia tra " + sec(V.secFine);
  else if (g.fase === "gioco") {
    if (V.guardo) testo = "Guardi la partita";
    else if (meta) { testo = meta.testo; rosso = !!meta.rosso; }
    else if (!V.sonoVivo()) testo = "Sei un'anima: guardi e basta";
    else if (pr && pr.squadra === "ospiti") testo = "Compiti finiti: tieni d'occhio gli altri";
    if (g.neb > 0 && !rosso) testo = "Nebbia: nessuno si riconosce";
  }
  // la scritta in basso: compare quando cambia, resta 2 secondi e svanisce (la freccia resta). Gli allarmi (rosso) restano.
  var oraG = performance.now();
  if (V.guida.textContent !== testo) { V.guida.textContent = testo; V.guidaFine = oraG + 2200; }
  var mostraG = !!testo && (rosso || oraG < V.guidaFine);
  V.guida.hidden = !testo; V.guida.classList.toggle("rosso", rosso); V.guida.classList.toggle("via", !mostraG);
  // «Via ▶» dell'host nell'atrio
  var kv = g.fase === "atrio" && V.vm.fase !== "lobby" ? "atrio|" + (V.vm.partita || 0) + "|" + (V.vm.rip || 0) : null;
  if (kv !== V.kVia) {
    V.kVia = kv; V.via.textContent = "";
    if (kv && V.cb.sonoHost) { var b = V.t.el("button", { class: "btn btn-primario lt-vai", text: "Via ▶", onclick: V.cb.onVia }); V.via.appendChild(b); }
  }
  V.aggCarica();
};
// chi ha la mappa pronta: [[id, percentuale, pronto], …]. Arriva a parte (messaggio piccolo) e vale più di quello che c'è nel «vm».
Vista.prototype.pronti = function (l) {
  var m = {}; (l || []).forEach(function (r) { m[r[0]] = [r[1] | 0, r[2] ? 1 : 0]; });
  this.pm = m; if (this.compAgg) this.compAgg(); if (this.vm) this.aggMappa(this.vm.fase === "lobby");
};
Vista.prototype.prDi = function (p) { var x = this.pm && this.pm[p.id]; return x ? { mp: x[0], pr: x[1] } : { mp: p.mp | 0, pr: p.pr ? 1 : 0 }; };
// la mappa nella saletta: la mia percentuale, piccola e discreta; l'host vede anche quanti sono pronti
Vista.prototype.aggMappa = function (sal) {
  var V = this, el = V.salMappa, ps = precaricoStato(), ora = performance.now();
  if (!el) { el = V.salMappa = E("div", "lt-premappa"); el.hidden = true; el.innerHTML = '<span class="t"></span><i></i>'; V.sc.appendChild(el); }
  var pl = ((V.vm && V.vm.players) || []).filter(function (p) { return !p.via; }), nPronti = pl.filter(function (p) { return p.bot || V.prDi(p).pr; }).length, testo = "", ok = false;
  if (sal && ps.attivo) {
    if (!ps.pronto) testo = "Mappa " + ps.pct + "%";
    else {
      if (!V.mappaPronta) V.mappaPronta = ora;
      ok = true;
      if (V.cb.sonoHost && nPronti < pl.length) testo = "Mappa pronta · " + nPronti + "/" + pl.length + " pronti";
      else if (ora - V.mappaPronta < 2600) testo = V.cb.sonoHost && pl.length > 1 ? "Mappa pronta · tutti pronti" : "Mappa pronta";
    }
  }
  var k = testo + "|" + ps.pct; if (el._k === k) return; el._k = k;
  el.hidden = !testo; el.classList.toggle("ok", ok); el.querySelector(".t").textContent = testo; el.style.setProperty("--p", ps.pct + "%");
};
// il caricamento a tutto schermo. Due casi: (1) l'host ha premuto «Comincia» e qualcuno non ha ancora la mappa: tutti aspettano (al massimo AVVIO_MAX,
// poi si parte lo stesso e chi è rimasto indietro vede l'anteprima, o il disegno a codice). (2) arrivo a partita già cominciata (tardi, o pagina ricaricata):
// finché non c'è l'anteprima, o i pezzi intorno a me se l'anteprima manca, al massimo 10 secondi.
Vista.prototype.aggCarica = function () {
  var V = this, vm = V.vm, ora = performance.now(), mod = null, el = V.carica; if (!vm || !el) return;
  var ps = precaricoStato();
  if (V.nataT == null) V.nataT = ora;
  if (vm.fase === "lobby") V.inSala = true;
  // chi ricarica la pagina può trovare sul broker una foto vecchia, ancora con l'attesa di «Comincia»: quella vera dell'host arriva subito dopo.
  // Appena aperta la pagina non ci si crede, e il mini caricamento d'ingresso si salta solo se l'attesa si è vista davvero
  if (vm.avvio) {
    if (V.avvioT == null) V.avvioT = ora;
    if (ora - V.avvioT >= 2000) V.vistoAvvio = true;
    if (ora - V.nataT >= 1500) mod = "avvio";
  }
  else if (vm.fase !== "lobby" && V.g && !V.vistoAvvio && !V.ingressoFatto) {
    if (V.ingressoT == null) { V.ingressoT = ora; precaricoFretta(2); }   // (prima di chiedere i pezzi: se l'indice è già arrivato, l'anello non deve passare davanti)
    if (!V.me.ok) V.ingCerco = true; else if (V.ingCerco) { V.ingCerco = false; immCodaDaCapo(); }
    immSospendi(true);   // sotto il caricamento non si chiede niente per conto del disegno: arriva prima l'anteprima, poi quello che serve davvero
    var ioQui = vm.players.filter(function (p) { return p.id === V.cb.myId; })[0];   // (V.guardo qui non basta: finché non arrivano i privati vale anche per chi gioca, e la scena segue un altro)
    var cerco = !!ioQui && !ioQui.via && !(V.inSala ? V.me.ok || V.guardo : V.me.ok && V.priv);   // (chi arriva dalla saletta è già a posto: per lui i privati sono questione di un attimo, niente caricamento)
    var qui = V.me.ok ? V.me : { x: FONTANA.x, y: FONTANA.y }, pv = V.pit.meta;
    var ing = immIntorno(V.M, qui.x, qui.y, pv && pv.w / 2, pv && pv.h / 2, cerco); V.ingPct = Math.max(V.ingPct || 0, ing.pct);
    if (ora - V.ingressoT >= 10000) V.ingressoFatto = true;
    else if (!ing.ok || cerco) mod = "ingresso";
    else V.ingressoFatto = true;
  }
  // l'ultimo secondo e mezzo dell'attesa (t: quando scade, orologio dell'host) niente file nuovi: su una rete lenta il via e il ruolo resterebbero dietro ai file
  var allaFine = vm.avvio && vm.avvio.t ? Date.now() - vm.avvio.t : -1e9;
  if (mod !== "ingresso") immSospendi(allaFine > -1500 && allaFine < 1500);
  precaricoFretta(mod ? 2 : vm.fase !== "lobby" ? 0 : 1);   // col caricamento a tutto schermo si scarica più in fretta; a partita cominciata piano, il gioco ha la precedenza
  if (!mod) { if (!el.hidden && !V.caricaT) { el.classList.remove("su"); V.caricaT = setTimeout(function () { el.hidden = true; V.caricaT = null; }, 330); } return; }
  if (V.caricaT) { clearTimeout(V.caricaT); V.caricaT = null; }
  if (el.hidden) { el.hidden = false; void el.offsetWidth; }
  el.classList.add("su");
  var aspetto = mod === "avvio" && (ps.pronto || !ps.attivo), pct = mod === "ingresso" ? V.ingPct || 0 : aspetto || !ps.attivo ? 100 : ps.pct;
  var tit = mod === "ingresso" ? "Entro nel palazzo" : aspetto ? "Aspetto gli altri" : "Preparo il palazzo";
  var mancano = (vm.players || []).filter(function (p) { return !p.via && !p.bot && !V.prDi(p).pr; }).length;
  var num = aspetto && vm.avvio && mancano ? "Mancano " + mancano : pct + "%", k = tit + "|" + num + "|" + pct;
  if (el._k === k) return; el._k = k;
  el.querySelector(".tit").textContent = tit; el.querySelector(".num").textContent = num; el.querySelector(".bar i").style.width = pct + "%";
};
Vista.prototype.aggLista = function () {
  var V = this, pr = V.priv; if (!pr) return;
  var fatti = pr.compiti.filter(function (c) { return c[1] || V.fatti[c[0]]; }).length;
  V.btnLista.innerHTML = icona("compiti") + "<span>" + (pr.finti ? "Compiti finti " : "Compiti ") + fatti + "/" + pr.compiti.length + (V.lista.hidden ? " ▸" : " ▾") + "</span>";
  if (V.lista.hidden) return;
  V.lista.textContent = "";
  if (pr.finti) V.lista.appendChild(E("li", "nota", pr.squadra === "ombre" ? "Fingi di farli: non contano." : "Non contano: pensa a farti cacciare."));
  pr.compiti.forEach(function (c) {
    var p = POSTAZIONI.filter(function (q) { return q.id === c[0]; })[0]; if (!p) return;
    var li = E("li", c[1] || V.fatti[c[0]] ? "fatto" : ""); li.append(E("b", "", stanzaDi(PALAZZO, { x: centro(p.tx), y: centro(p.ty) }).nome), " · " + p.nome);
    V.lista.appendChild(li);
  });
};

// ----- le azioni -----
// Il tasto premuto risponde subito: «in attesa» (lt-attende) finché arriva la ricevuta dell'host, poi l'esito anche quando è «troppo tardi» (ricevuta, esitoMossa).
// Con la mossa parte il posto da cui la si fa (x, y, ep, n come un passo): l'host lo usa se il passo non gli è ancora arrivato (vedi esegui)
var TASTO_DI = { spegni: "spegni", segnala: "segnala", abil: "abil", campana: "usa", fatto: "usa", ripara: "usa", botola: "botola", sabota: "buio", buio: "buio" };
var ESITO_MUTO = { ok: 1, detto: 1, fine: 1, vecchia: 1 };
Vista.prototype.manda = function (k, extra) {
  var V = this, m = { t: "a", k: k }; if (extra) for (var x in extra) m[x] = extra[x];
  // VOTO: sul telefono si chiude quando il tempo visto arriva a zero; l'host aspetta ancora GRAZIA s i sigilli in viaggio (vedi partita.js)
  if (k === "voto" && V.g && V.g.fase === "riunione" && V.votoFine && performance.now() > V.votoFine + 80) return V.esitoPoi(k, extra, "chiuso", null, null);
  if (V.g && V.g.fase === "gioco" && V.me.ok && !V.cb.sonoHost) { m.x = Math.round(V.me.x); m.y = Math.round(V.me.y); m.d = Math.round(V.me.dir * 100) / 100; m.mv = V.me.muove ? 1 : 0; m.ep = V.me.ep; m.n = ++V.me.n; }
  var r = V.cb.mossa(m), b = V.btn[TASTO_DI[k]] || null;
  if (r !== undefined) return V.esitoPoi(k, extra, r, null, b);   // (sull'host l'esito c'è già)
  if (m.q == null) return;
  var ora = performance.now(); V.attese = V.attese || {};
  for (var q in V.attese) if (V.attese[q].persa && ora - V.attese[q].t > 15000) delete V.attese[q];
  V.attese[m.q] = { k: k, extra: extra || null, b: b, t: ora };
  if (b) { b.classList.remove("lt-no"); b.classList.add("lt-attende"); }
};
// l'esito subito (host, voto chiuso sul telefono): dopo il gestore del tocco, che intanto ha già segnato il suo voto o il suo compito
Vista.prototype.esitoPoi = function (k, extra, e, v, b) { var V = this; Promise.resolve().then(function () { if (V.vivo) V.esitoMossa(k, extra, e, v, b); }); };
// la ricevuta di una mossa (dalla rete dell'ospite): e = esito, v = numero della foto in quel momento. «rete»: nessuna ricevuta dopo 9 volte
Vista.prototype.ricevuta = function (q, e, v) {
  var V = this, a = V.attese && V.attese[q]; if (!a) return;
  var tardiva = !!a.persa;
  if (e === "rete") a.persa = true; else delete V.attese[q];
  var altre = !!a.b && Object.keys(V.attese).some(function (x) { var o = V.attese[x]; return o.b === a.b && !o.persa; });
  if (a.b && !altre) a.b.classList.remove("lt-attende");
  if (tardiva && e === "ok") return;   // (arrivata dopo il «non risponde», ma andata: l'effetto si vede da sé)
  V.esitoMossa(a.k, a.extra, e, v, a.b);
};
// com'è andata: se no, il telefono torna allo stato vero (compito non contato, riparazione, sigillo) e lo dice in una riga; il tasto fa un piccolo «no»
Vista.prototype.esitoMossa = function (k, extra, e, v, b) {
  var V = this, ora = performance.now(), dopoFoto = function () { if (!V.ottimo) return; V.ottimo.ver = v != null ? v : (V.vm && V.vm.ver) || 0; V.ottimo.fine = ora + 5000; };
  if (!e || ESITO_MUTO[e]) { if (e === "ok" && k === "ripara") dopoFoto(); return; }
  if (k === "fatto" && extra && extra.post != null) { delete V.fatti[extra.post]; V.aggLista(); }
  if (k === "ripara" && V.ottimo) { if (e === "riparato") dopoFoto(); else { V.ottimo = null; if (!V.cb.sonoHost) V.cb.mossa({ t: "rf" }); } }   // (riparato da un altro: resta riparato. Se no, la foto vera)
  if (k === "voto") { V.mioVoto = (V.priv && V.priv.voto) || null; V.conf = null; if (V.g && (V.g.fase === "riunione" || V.g.fase === "esito")) V.riunione(); }
  var tx = TESTO_ESITO[e]; if (tx) V.avviso(tx);
  if (b) { b.classList.remove("lt-no"); void b.offsetWidth; b.classList.add("lt-no"); clearTimeout(b._noT); b._noT = setTimeout(function () { b.classList.remove("lt-no"); }, 420); }
};
Vista.prototype.azione = function (k) {
  var V = this, pr = V.priv, comp = (pr && pr.compagni) || [];
  if (V.vm && V.vm.fase === "lobby") { if (k === "lenz") V.apriLenzuolo(); else if (k === "usa" && V.vicinoUsa() && !V.pannello) V.apriComputer(); return; }
  if (V.pannello && V.pannello.libero) V.pannello.chiudi();   // il tasto vale anche con la scheda del ruolo aperta
  if (!V.g || V.g.fase !== "gioco" || V.guardo || V.mg || V.pannello) return;
  if (!V.sonoVivo() && k === "abil" && pr && pr.fantasmaRuolo) {
    if (pr.fantasmaRuolo === "medium") return V.apriFoto();
    var vf = V.bersaglio(R_ABIL, function (p) { return !p.fantasma; }); if (vf) V.manda("fantasma", { id: vf.id }); return;
  }
  if (!V.sonoVivo() && k !== "buio" && k !== "usa") return;
  if (k === "usa") {
    var u = V.vicinoUsa(); if (!u) return;
    if (u.tipo === "campana") return V.manda("campana");
    if (u.tipo === "telecamere") return V.apriTelecamere();
    if (u.tipo === "plastico") return V.apriPlastico(0);
    var post = u.post;
    V.apriCompito(post, function () {
      if (u.tipo === "ripara") { V.manda("ripara", { cosa: u.cosa }); V.ottimista(u.cosa); }
      else { V.fatti[post.id] = 1; V.manda("fatto", { post: post.id }); V.aggLista(); }
    });
  } else if (k === "segnala") { var c = V.corpoVicino(); if (c != null) V.manda("segnala", { id: c }); }
  else if (k === "spegni") { var b = V.bersaglio(R_SPEGNI, function (p) { return comp.indexOf(p.id) < 0; }); if (b) V.manda("spegni", { id: b.id }); }
  else if (k === "botola") V.manda("botola");
  else if (k === "buio") V.apriSabota();
  else if (k === "abil") {
    var tipo = BERSAGLIO[pr.ruolo];
    if (tipo === "nessuno") return V.manda("abil", { id: null });
    if (tipo === "due") return V.apriScambio();
    if (tipo === "stanza") return V.apriPortineria();
    if (tipo === "mutaforma") { if (pr.campione) return V.manda("abil", { id: null }); var cm = V.bersaglio(R_ABIL, function (p) { return comp.indexOf(p.id) < 0; }); if (cm) V.manda("abil", { id: cm.id }); return; }
    if (tipo === "corpo") { var cc = V.corpoVicino(R_ABIL); if (cc != null) V.manda("abil", { id: cc }); return; }
    var f = (pr.ruolo === "silenziatore" || pr.ruolo === "ipnotista") ? function (p) { return comp.indexOf(p.id) < 0; } : function () { return true; };
    var t = V.bersaglio(R_ABIL, f);
    if (!t && pr.ruolo === "medico") return V.manda("abil", { id: V.cb.myId });
    if (t) V.manda("abil", { id: t.id });
  }
};
Vista.prototype.apriCompito = function (post, fatto) {
  var V = this; V.joyReset();
  var box = E("div", "lt-pannello lt-compito"); var ch = E("button", "lt-chiudi", "×"); ch.setAttribute("aria-label", "Chiudi");
  box.append(ch, E("h3", "", post.nome)); var corpo = E("div"); box.appendChild(corpo);
  V.velo.textContent = ""; V.velo.appendChild(box); V.velo.hidden = false; V.veloTipo = "compito";
  var chiudi = function () { V.mg = null; V.velo.hidden = true; V.veloTipo = null; V.velo.textContent = ""; V.aggVelo(); };
  ch.addEventListener("click", chiudi);
  V.mg = apriMinigioco(corpo, post, function () { chiudi(); fatto(); });
};
// la mappa: un riquadro sopra il gioco che non ferma niente (ci si muove con la mappa aperta), si aggiorna da sola
// e si chiude con la ✕ (o di nuovo col tasto Mappa)
Vista.prototype.apriMappa = function () {
  var V = this; if (!V.g || V.g.mappa !== "palazzo" || V.mg) return;
  if (V.mappa) return V.chiudiMappa();
  var box = E("div", "lt-minimappa"), testa = E("div", "testa"), x = E("button", "lt-chiudi", "×"), cv = E("canvas"), leg = E("p", "leg", "");
  x.type = "button"; x.setAttribute("aria-label", "Chiudi la mappa");
  var tit = E("b"); tit.innerHTML = icona("mappa") + "<span>Mappa del palazzo</span>"; testa.append(tit, x); box.append(testa, cv, leg);
  tocca(x, function (e) { e.stopPropagation(); V.chiudiMappa(); });
  V.velo.parentNode.appendChild(box);
  V.mappa = { box: box, cv: cv, leg: leg, ultimo: -9 };
  V.mappaAperta = true; V.disegnaMappaViva();
};
Vista.prototype.chiudiMappa = function () { var V = this; if (!V.mappa) return; V.mappa.box.remove(); V.mappa = null; V.mappaAperta = false; V.aggVelo(); };
Vista.prototype.disegnaMappaViva = function () {
  var V = this, M = V.mappa; if (!M || !V.g) return;
  M.ultimo = V.tempo;
  var mioC = (V.cache[(V.priv && V.priv.travestito) || V.cb.myId] || {}).colore || "#ffffff", mioP = panno((V.priv && V.priv.travestito) || V.cb.myId);
  var segni = V.compitiAperti().map(function (p) { return { x: centro(p.tx), y: centro(p.ty), col: "#e7b75c" }; }), leg = [[mioC, "tu · " + mioP.n], ["#e7b75c", "compiti"]];
  if (V.g.buio) { segni.push({ x: centro(QUADRO.tx), y: centro(QUADRO.ty), col: "#f05a6e", r: 7 }); leg.push(["#f05a6e", "luci"]); }
  if (V.squadra() === "ombre") { ESTREMI.forEach(function (e) { segni.push({ x: centro(e.tx), y: centro(e.ty), col: "#a993e6", r: 4 }); }); leg.push(["#a993e6", "botole"]); }
  segni.push({ x: centro(CAMPANA.tx), y: centro(CAMPANA.ty), col: "#d9a94a", r: 4 });
  // il Segugio: il pallino di chi sta seguendo, finché dura la scia
  var tr = V.priv && V.priv.traccia && V.tracciaFine > performance.now() ? V.priv.traccia[0] : null;
  if (tr) { var q = V.altri().filter(function (p) { return p.id === tr; })[0]; if (q) { segni.push({ x: q.x, y: q.y, col: "#cba2ff", r: 8, bordo: true }, { x: q.x, y: q.y, col: q.colore || "#cba2ff", r: 5 }); leg.push([q.colore || "#cba2ff", ((V.cache[tr] || {}).nome || "la scia") + " · " + panno(tr).n]); } }
  segni.push({ x: V.me.x, y: V.me.y, col: "#ffffff", r: 7, bordo: true }, { x: V.me.x, y: V.me.y, col: mioC, r: 4.5 });
  var w = M.box.clientWidth - 16, h = Math.max(80, M.box.clientHeight - 58);
  disegnaMappa(M.cv, PALAZZO, segni, w, h);
  var t = leg.map(function (l) { return '<i style="background:' + l[0] + '"></i>' + l[1]; }).join(""); if (M.legK !== t) { M.legK = t; M.leg.innerHTML = t; }
};

// i pannelli sopra il gioco: schermi delle telecamere, plastico, scambio del Trasportatore
Vista.prototype.apriPannello = function (tipo, box, chiudi) {
  var V = this, libero = tipo === "info" || tipo === "sabota";   // scheda del ruolo e scelta del sabotaggio: si continua a camminare, il joystick resta libero
  if (!libero) V.joyReset();
  if (V.pannello) V.pannello.chiudi();
  V.velo.textContent = ""; V.velo.appendChild(box); V.velo.hidden = false; V.veloTipo = "pannello"; V.velo.classList.toggle("passa", libero);
  V.pannello = { tipo: tipo, libero: libero, chiudi: function () { if (V.pannello === null) return; V.pannello = null; V.velo.hidden = true; V.velo.classList.remove("passa"); V.veloTipo = null; V.velo.textContent = ""; if (chiudi) chiudi(); V.aggVelo(); } };
};
Vista.prototype.apriTelecamere = function () {
  var V = this, box = E("div", "lt-pannello lt-cam"), testa = E("div", "testa"), ch = E("button", "lt-chiudi", "×");
  testa.append(E("h3", "", "Telecamere"), ch); box.appendChild(testa);
  var grid = E("div", "griglia"); box.appendChild(grid);
  var nav = E("div", "nav"), prec = E("button", "", "‹"), pag = E("span", "", ""), succ = E("button", "", "›"); nav.append(prec, pag, succ); box.appendChild(nav);
  V.feed = { pagina: 0, schermi: [], pag: pag, ultimo: -9 };
  for (var i = 0; i < 4; i++) { var w = E("div", "schermo"), cv = E("canvas"); w.appendChild(cv); grid.appendChild(w); V.feed.schermi.push({ cv: cv, pit: new Pittore(cv), w: w }); }
  prec.addEventListener("click", function () { if (V.feed) V.feed.pagina = Math.max(0, V.feed.pagina - 1); });
  succ.addEventListener("click", function () { if (V.feed) V.feed.pagina++; });
  ch.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  V.apriPannello("telecamere", box, function () { V.feed = null; V.manda("guardo", { on: 0 }); });
  V.manda("guardo", { on: 1 });
};
// le telecamere: uno schermo per fotogramma, a giro (ognuno si aggiorna 15 volte al secondo e il lavoro non si ammucchia)
Vista.prototype.disegnaSchermi = function () {
  var V = this, g = V.g, F = V.feed;
  if (g && g.interf) { if (V.tempo - F.ultimo < 0.1) return; F.ultimo = V.tempo; F.schermi.forEach(function (sc) { sc.w.hidden = false; V.statico(sc.cv); }); F.pag.textContent = "Nessun segnale"; return; }
  F.ultimo = V.tempo; F.giro = ((F.giro || 0) + 1) % 4;
  var cams = (g && g.cam) || [], n = Math.max(1, Math.ceil(cams.length / 4)); F.pagina = Math.min(F.pagina, n - 1);
  F.pag.textContent = (F.pagina + 1) + " / " + n;
  var gente = V.altri().filter(function (p) { return !p.fantasma; });
  if (V.sonoVivo() && !V.guardo) { var c0 = V.cache[(V.priv && V.priv.travestito) || V.cb.myId] || {}, a0 = AVATAR[V.cb.myId]; gente.push({ id: V.cb.myId, x: V.me.x, y: V.me.y, dir: V.me.dir, muove: V.me.muove, nome: c0.nome, colore: c0.colore, lenz: c0.lenz, img: a0 && a0.img, imgS: a0 && a0.imgS }); }
  var corpi = (g.corpi || []).map(function (k) { return { id: k[0], x: k[1], y: k[2], lenz: LENZ_DI[k[0]] }; });
  var nBase = 0;
  F.schermi.forEach(function (sc, i) {
    var k = cams[F.pagina * 4 + i]; sc.w.hidden = !k; if (!k) return;
    if (i !== F.giro && sc.fatto === F.pagina) return;
    sc.fatto = F.pagina;
    var idx = F.pagina * 4 + i, nome = k[2] ? (TELECAMERE_BASE[idx] || {}).nome || "Telecamera" : "Sentinella " + (idx - TELECAMERE_BASE.length + 1);
    sc.pit.disegna({ M: PALAZZO, palazzo: true, t: V.tempo, dt: 0.1, io: { x: k[0], y: k[1], mostra: false }, altri: gente, corpi: corpi, R: 16 * T, anima: false, neb: g.neb > 0,
      buio: false, miei: new Set(), freccia: null, botole: false, effetti: [], telecamere: [], scala: 0.5, cctv: nome,
      segui: k[2] && TELECAMERE_BASE[idx] ? { x: TELECAMERE_BASE[idx].vx, y: TELECAMERE_BASE[idx].vy } : null });
  });
};
Vista.prototype.statico = function (cv, w, h) {
  var r = cv.getBoundingClientRect(); w = w || Math.max(80, Math.round(r.width)); h = h || Math.max(60, Math.round(r.height));
  cv.width = w; cv.height = h; if (!r.width) { cv.style.width = w + "px"; cv.style.height = h + "px"; }
  var c = cv.getContext("2d"), img = c.createImageData(w, h), ora = performance.now() / 1000;
  // neve vera, con una barra chiara che scorre e righe che si spostano di lato; al centro un'antenna barrata, senza scritte
  for (var i = 0; i < img.data.length; i += 4) { var v = Math.random() * 170; img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v + 18; img.data[i + 3] = 255; }
  c.putImageData(img, 0, 0);
  var yb = (ora * h * 0.55) % (h * 1.3) - h * 0.15; c.fillStyle = "rgba(220,235,255,.2)"; c.fillRect(0, yb, w, h * 0.11);
  for (var k = 0; k < 4; k++) { var ys = Math.floor(Math.random() * h), hs = 3 + Math.random() * 9, dx = (Math.random() - 0.5) * w * 0.3; c.drawImage(cv, 0, ys, w, hs, dx, ys, w, hs); }
  c.fillStyle = "rgba(0,0,0,.18)"; for (var y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);
  var m = Math.min(w, h) * 0.2, cxs = w / 2, cys = h / 2; c.save(); c.translate(cxs, cys); c.strokeStyle = "rgba(255,255,255,.88)"; c.lineWidth = Math.max(2, m * 0.09); c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(0, m * 0.1); c.lineTo(0, m * 0.95); c.moveTo(-m * 0.4, m * 0.95); c.lineTo(m * 0.4, m * 0.95); c.stroke();
  c.beginPath(); c.arc(0, -m * 0.1, m * 0.12, 0, 7); c.stroke(); c.beginPath(); c.arc(0, -m * 0.1, m * 0.42, Math.PI * 1.15, Math.PI * 1.85); c.arc(0, -m * 0.1, m * 0.42, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
  c.beginPath(); c.arc(0, -m * 0.1, m * 0.42, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); c.beginPath(); c.arc(0, -m * 0.1, m * 0.8, Math.PI * 1.2, Math.PI * 1.8); c.stroke(); c.beginPath(); c.arc(0, -m * 0.1, m * 0.8, Math.PI * 0.2, Math.PI * 0.8); c.stroke();
  c.strokeStyle = "rgba(255,90,110,.95)"; c.beginPath(); c.moveTo(-m * 0.95, -m * 0.95); c.lineTo(m * 0.95, m * 0.95); c.stroke(); c.restore();
};
Vista.prototype.apriPlastico = function (secondi) {
  var V = this, box = E("div", "lt-pannello lt-mappa lt-plastico"), cv = E("canvas"), nota = E("p", "", "");
  box.append(E("h3", "", secondi ? "Schermo portatile" : "Plastico del palazzo"), cv, nota);
  V.plastico = { cv: cv, nota: nota, ultimo: -9, fine: secondi ? performance.now() + secondi * 1000 : 0 };
  V.apriPannello("plastico", box, function () { V.plastico = null; });
  box.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  V.disegnaPlastico();
};
Vista.prototype.disegnaPlastico = function () {
  var V = this, P = V.plastico; if (!P) return; P.ultimo = V.tempo;
  if (V.g && V.g.interf) { V.statico(P.cv, 320, 220); P.nota.textContent = "Nessun segnale"; return; }
  var spia = V.priv && V.priv.ruolo === "spia";
  var gente = V.altri().filter(function (p) { return !p.fantasma; });
  if (V.sonoVivo() && !V.guardo) gente.push({ id: V.cb.myId, x: V.me.x, y: V.me.y, colore: (V.cache[(V.priv && V.priv.travestito) || V.cb.myId] || {}).colore });
  var stanze = {};
  gente.forEach(function (p) { var st = stanzaDi(PALAZZO, p); if (st.x == null) return; (stanze[st.nome] = stanze[st.nome] || { st: st, l: [] }).l.push(p); });
  var r = V.s.getBoundingClientRect();
  disegnaMappa(P.cv, PALAZZO, [], Math.min(r.width - 40, 900), r.height - 150, function (m, sc) {
    Object.keys(stanze).forEach(function (k) {
      var o = stanze[k], st = o.st, per = Math.max(1, Math.floor((st.w - 1) / 2.8));
      o.l.forEach(function (p, i) {
        var cx = (st.x + 1.6 + (i % per) * 2.8) * T, cy = (st.y + st.h - 1.8 - Math.floor(i / per) * 3) * T;
        m.fillStyle = spia ? (p.colore || "#ccc") : "#d9dce4"; m.strokeStyle = (spia && orloTinta(p.colore)) || "rgba(0,0,0,.55)"; m.lineWidth = 2 / sc;
        m.beginPath(); m.arc(cx, cy - 0.6 * T, 0.95 * T, 0, Math.PI * 2); m.fill(); m.stroke();
        m.beginPath(); m.ellipse(cx, cy + 0.85 * T, 1.3 * T, 0.75 * T, 0, Math.PI, 0); m.fill(); m.stroke();
      });
    });
  });
  var resta = P.fine ? Math.max(0, Math.ceil((P.fine - performance.now()) / 1000)) : 0;
  P.nota.textContent = (spia ? "Vedi i colori: sei la Spia. " : "Teste in ogni stanza (non nei corridoi). ") + (P.fine ? "Si chiude tra " + resta + " s" : "Tocca per chiudere");
};
Vista.prototype.apriScambio = function () {
  var V = this, scelti = [], box = E("div", "lt-pannello lt-foglio lt-scambio");
  box.append(E("h3", "", "Chi scambi di posto?"), E("p", "", "Tocca due persone: si scambiano all'istante, ovunque siano."));
  var gr = E("div", "griglia"); box.appendChild(gr);
  var vivi = (V.g.g || []).filter(function (q) { return q[1] && !q[2]; });
  var vai = E("button", "btn btn-primario", "Scambia"), no = E("button", "btn btn-fantasma", "Annulla"); vai.disabled = true;
  vivi.forEach(function (q, j) {
    var b = E("button", "", (V.cache[q[0]] || {}).nome || "?"); b.type = "button"; b.prepend(pezzetta(q[0]));
    b.addEventListener("click", function () { var i = scelti.indexOf(q[0]); if (i >= 0) scelti.splice(i, 1); else if (scelti.length < 2) scelti.push(q[0]); [].forEach.call(gr.children, function (x, k) { x.classList.toggle("sel", scelti.indexOf(vivi[k][0]) >= 0); }); vai.disabled = scelti.length !== 2; });
    gr.appendChild(b);
  });
  var piede = E("div", "piede"); piede.append(vai, no); box.appendChild(piede);
  vai.addEventListener("click", function () { if (scelti.length === 2) V.manda("abil", { id: scelti[0], id2: scelti[1] }); if (V.pannello) V.pannello.chiudi(); });
  no.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  V.apriPannello("scambio", box);
};

// le ombre scelgono il sabotaggio
Vista.prototype.apriSabota = function () {
  var V = this, imp = (V.vm && V.vm.imp && V.vm.imp.sabotaggi) || {}, box = E("div", "lt-pannello lt-foglio lt-scambio");
  box.append(intestazione("Registro di Palazzo Velmare"), E("h3", "", "Che sabotaggio?"), E("p", "", "Uno alla volta. Gli ospiti vedono subito dove ripararlo."));
  var gr = E("div", "griglia sab");
  [["buio", "Buio", "Gli ospiti vedono pochissimo finché non riparano il quadro delle luci in Lavanderia."], ["interferenza", "Interferenza", "Si spengono telecamere, plastico e frecce dei compiti, finché non riparano il telegrafo (Sala del telegrafo)."], ["acqua", "Acqua alta", "Il palazzo si allaga: se non chiudono le due chiuse (Molo e Cantina) in tempo, vincete voi."]].forEach(function (x) {
    if ((x[0] === "acqua" && imp.acquaSi === false) || (x[0] === "interferenza" && imp.interferenzaSi === false)) return;
    var b = E("button", "", ""), tit = E("b"); b.type = "button"; tit.innerHTML = icona({ buio: "buio", interferenza: "antenna", acqua: "onda" }[x[0]]) + "<span>" + x[1] + "</span>"; b.append(tit, E("small", "", x[2]));
    tocca(b, function () { V.manda("sabota", { tipo: x[0] }); if (V.pannello) V.pannello.chiudi(); });
    gr.appendChild(b);
  });
  var no = E("button", "btn btn-fantasma", "Annulla"); tocca(no, function () { if (V.pannello) V.pannello.chiudi(); });
  box.append(gr, no);
  V.apriPannello("sabota", box);
};
// il Portiere sceglie la stanza da tenere d'occhio
Vista.prototype.apriPortineria = function () {
  var V = this, box = E("div", "lt-pannello lt-foglio lt-scambio"), gr = E("div", "griglia");
  box.append(E("h3", "", "Quale stanza sorvegli?"), E("p", "", "Da adesso saprai chi entra e chi esce, in ordine."));
  PALAZZO.stanze.forEach(function (st, i) { var b = E("button", "", st.nome); b.type = "button"; b.addEventListener("click", function () { V.manda("abil", { id: i }); if (V.pannello) V.pannello.chiudi(); }); gr.appendChild(b); });
  var no = E("button", "btn btn-fantasma", "Annulla"); tocca(no, function () { if (V.pannello) V.pannello.chiudi(); });
  box.append(gr, no);
  V.apriPannello("portineria", box);
};
Vista.prototype.aggRegistro = function (pr) {
  var V = this, P = pr.portineria, box = V.registroBox; box.textContent = "";
  if (!P || !P.log.length) return;
  var ol = E("ol", "lt-registro");
  P.log.slice(-5).forEach(function (x) { var li = E("li", x[1] ? "entra" : "esce", ((V.cache[x[0]] || {}).nome || "?") + (x[1] ? " entra" : " esce") + " · " + (x[2] < 2 ? "ora" : x[2] + " s fa")); li.prepend(pezzetta(x[0])); ol.appendChild(li); });
  box.appendChild(ol);
};

// l'Imitatore sceglie un eliminato (il server accetta solo gli ospiti)
Vista.prototype.apriImita = function (bottone) {
  var V = this, box = V.velo.querySelector(".lt-riu"); if (!box) return;
  var p = E("div", "lt-indov lt-foglio"), gr = E("div", "griglia");
  p.append(E("h3", "", "Di chi prendi il ruolo?"), E("p", "", "Solo il ruolo di un ospite eliminato. Lo diventi dal prossimo round."));
  V.g.g.filter(function (q) { return !q[1] && !q[2]; }).forEach(function (q) { var b = E("button", "", (V.cache[q[0]] || {}).nome || "?"); b.type = "button"; b.addEventListener("click", function () { V.manda("imita", { id: q[0] }); p.remove(); if (bottone) bottone.remove(); }); gr.appendChild(b); });
  var no = E("button", "annulla", "Annulla"); no.type = "button"; no.addEventListener("click", function () { p.remove(); });
  p.append(gr, no); box.appendChild(p);
};

// l'Indovino sceglie il ruolo da indovinare. Il foglietto si apre solo qui: nessun altro telefono sa niente, nemmeno che è aperto
Vista.prototype.rigaIndov = function () { var pr = this.priv || {}; return "Tentativi rimasti: " + pr.tentativi + " · Indovinati " + pr.indovinati + " su " + pr.quantiInd; };
Vista.prototype.apriIndovina = function (id) {
  var V = this, box = V.velo.querySelector(".lt-riu"); if (!box || !V.priv) return;
  var vecchio = box.querySelector(".lt-indov"); if (vecchio) vecchio.remove();
  // si sceglie tra tutti i ruoli del gioco, anche quelli spenti nelle regole
  var imp = (V.vm && V.vm.imp) || {}, cade = !imp.indovino || imp.indovino.sbaglia !== "niente";
  var ruoli = Object.keys(RUOLI);
  var p = E("div", "lt-indov lt-foglio");
  var riga = E("span", "", V.rigaIndov()), sotto = E("p"); sotto.appendChild(riga); if (cade) sotto.append(" · se sbagli, cadi tu");
  var capo = E("div", "capo"); capo.append(ritratto(id), E("h3", "", "Che ruolo ha " + ((V.cache[id] || {}).nome || "?") + "?"));
  p.append(capo, sotto);
  V.indovF = { el: p, id: id, riga: riga };
  var gr = E("div", "griglia gruppi");
  [["ospiti", "Ospiti"], ["ombre", "Ombre"], ["soli", "Da soli"]].forEach(function (sq) {
    var voci = ruoli.filter(function (r) { return RUOLI[r].squadra === sq[0]; }), fila = E("div", "gruppo"); if (!voci.length) return;
    fila.style.flexGrow = Math.ceil(voci.length / 3);
    voci.forEach(function (r) { var b = E("button", sq[0], RUOLI[r].nome); b.type = "button"; b.addEventListener("click", function () { V.manda("indovina", { id: id, ruolo: r }); V.priv.tentativi = Math.max(0, V.priv.tentativi - 1); p.remove(); V.indovF = null; V.riunione(); }); fila.appendChild(b); });
    gr.append(E("h4", sq[0], sq[1]), fila);
  });
  var no = E("button", "annulla", "Annulla"); no.type = "button"; no.addEventListener("click", function () { p.remove(); V.indovF = null; });
  p.append(gr, no); box.appendChild(p); ltSfuma(gr);
};
// chi ha chiamato la riunione: «Hai segnalato…» sul suo telefono, «Matt ha segnalato…» su tutti gli altri, fantasmi e chi guarda compresi
Vista.prototype.fraseRiunione = function (R) { return (R.da === this.cb.myId ? "Hai" : ((this.cache[R.da] || {}).nome || "?") + " ha") + (R.motivo === "corpo" ? " segnalato una lanterna spenta" : " suonato la campana"); };

// ----- i pannelli sopra la mappa: ruolo, riunione, esito, fine -----
Vista.prototype.cambioFase = function () {
  var V = this, f = V.fase;
  if (f !== "gioco" && f !== "atrio") { V.parlaPulisci(); V.joyReset(); if (V.pannello) V.pannello.chiudi(); V.chiudiMappa(); if (V.mg) { V.mg = null; V.velo.hidden = true; V.veloTipo = null; } }
  if (f !== "esito") V.riuK = null;   // dalla riunione al verdetto il foglio resta quello: niente ridisegno, niente scritta d'apertura rifatta, il sigillo resta dov'è
  if (f !== "riunione" && f !== "esito") { V.chatS = null; clearTimeout(V.bigT); V.bigT = null; }   // (la riunione dopo riparte con la chat chiusa)
};
Vista.prototype.aggVelo = function (soloTempi) {
  var V = this, g = V.g; if (!g) return;
  if (V.veloTipo === "compito" || V.veloTipo === "mappa" || V.veloTipo === "pannello") return;
  var f = g.fase, ora = performance.now();
  if (f === "svela" && V.priv && !V.guardo) {
    if (V.veloTipo !== "svela") {
      var r = RUOLI[V.priv.ruolo], box = E("div", "lt-pannello lt-foglio lt-svela " + V.priv.squadra);
      box.appendChild(intestazione("Registro di Palazzo Velmare"));
      var im = ritratto(V.cb.myId); if (im.tagName === "IMG") { im.className = "lt-svela-av"; box.appendChild(im); }
      box.append(E("p", "lt-sopra", "Questa notte sei"), E("h2", "", r.nome), E("p", "", r.desc));
      if (V.priv.squadra === "ombre") {
        var nn = V.priv.compagni.map(function (id) { var n = (V.cache[id] || {}).nome; return n && n + " (" + panno(id).n + ")"; }).filter(Boolean);
        box.appendChild(E("p", "lt-comp", nn.length ? "Le altre ombre: " + nn.join(", ") + "." : "Sei l'unica ombra nel palazzo."));
        var fila = E("div", "lt-alleati"); V.priv.compagni.forEach(function (id) { fila.appendChild(ritratto(id)); }); if (fila.firstChild) box.appendChild(fila);
      } else if (V.priv.ruolo === "accusatore" && V.priv.bersaglio) box.appendChild(E("p", "lt-comp", "Il tuo bersaglio: " + ((V.cache[V.priv.bersaglio] || {}).nome || "?") + " (" + panno(V.priv.bersaglio).n + ")."));
      else box.appendChild(E("p", "lt-comp", "Attento: tra voi ci sono delle ombre."));
      if (V.priv.mod && MODIFICATORI[V.priv.mod]) { var md = MODIFICATORI[V.priv.mod]; box.appendChild(E("p", "lt-mod", "Modificatore: " + md.nome + ". " + md.desc)); }
      SUONO.ruolo();
      V.svelaConto = E("p", "lt-conto", ""); box.appendChild(V.svelaConto);
      V.velo.textContent = ""; V.velo.appendChild(box); V.velo.hidden = false; V.veloTipo = "svela";
    }
    V.svelaConto.textContent = "Si entra nel palazzo tra " + Math.max(0, Math.ceil((V.secFine - ora) / 1000)) + "…";
    return;
  }
  if (f === "riunione" || f === "esito") return V.riunione(soloTempi);
  if (f === "fine") {
    if (V.veloTipo !== "vince") {
      var b = E("div", "lt-pannello lt-foglio lt-vince"), v = g.fine || {}, tes = E("div", "tes"), fila = E("div", "fila");
      tes.append(E("p", "occh", "Proclama · Fine della notte"), E("h2", "", titoloVince(v)), E("p", "", v.perche || ""));
      vincitoriDi(v).forEach(function (id) { var u = E("div", "u"); u.append(ritratto(id), E("span", "", (V.cache[id] || {}).nome || "?"), tintaDi(id)); fila.appendChild(u); });
      b.append(intestazione("Registro di Palazzo Velmare"), E("i", "sig"), tes); if (fila.firstChild) b.appendChild(fila);
      V.velo.textContent = ""; V.velo.appendChild(b); V.velo.hidden = false; V.veloTipo = "vince";
      var pr = V.priv || {}, ho = v.id ? v.id === V.cb.myId : pr.squadra === v.chi;
      if (V.sonoVivo() && (pr.ruolo === "sopravvissuto" || (pr.ruolo === "gatto" && v.chi !== "ombre"))) ho = true;   /* il Gatto vince solo se le ombre non hanno vinto */
      if (!V.guardo) { (ho ? SUONO.vince : SUONO.perde)(); b.classList.add(ho ? "vinto" : "perso"); tes.appendChild(E("p", "mio", ho ? "Hai vinto" : "Hai perso")); }
    }
    return;
  }
  if (V.veloTipo) { V.velo.hidden = true; V.velo.textContent = ""; V.veloTipo = null; }
};
// la scena della morte: chi ti ha spento (grande, a sinistra, col telo che vedevi: travestito o no) e il tuo telo che si affloscia davvero,
// con la lanterna che cade e si spegne, come nel palazzo. Un tocco la chiude.
Vista.prototype.scenaMorte = function (m) {
  var V = this, sc = V.velo.parentNode, chi = (V.cache[m.da] || {}).nome || "Qualcuno", dk = LENZ_DI[m.da], io = LENZ_DI[V.cb.myId] || { c: 0, m: null };
  var vecchia = sc.querySelector(".lt-morte"); if (vecchia) vecchia.remove();
  var box = E("div", "lt-morte"), palco = E("div", "palco"), k, me = E("canvas", "vittima"), S = 3, q = me.getContext("2d");
  if (dk) { var fg = figuraTelo(dk.c); k = E("canvas"); k.width = fg.width; k.height = fg.height; k.getContext("2d").drawImage(fg, 0, 0); } else k = E("div", "sagoma");
  k.classList.add("killer");
  me.width = 140 * S; me.height = 84 * S; palco.append(k, me);
  var l = new Lenzuolo(io, { seme: io.c }), t0 = performance.now(), prima = t0, mostra = function () { q.clearRect(0, 0, me.width, me.height); l.disegna(q, { x: me.width * 0.46, y: 72 * S, scala: S, t: l.t, fine: true }); };
  l.aggiorna(0, 0, 0, Math.PI / 2, false, true);
  var giro = function () {
    if (!box.parentNode || box.classList.contains("via")) return;
    var ora = performance.now(), dt = Math.min(0.05, (ora - prima) / 1000); prima = ora;
    if (ora - t0 > 900) l.spegni();
    l.aggiorna(dt, 0, 0, null, false, true); mostra(); requestAnimationFrame(giro);
  };
  var testo = m.modo === "sceriffo" ? "Lo Sceriffo " + chi + " ti ha colpito" : m.modo === "veterano" ? chi + " era il Veterano in allerta" : m.modo === "veleno" ? "Il veleno di " + chi + " ha fatto effetto" : chi + " ti ha spento la lanterna";
  box.append(palco, E("h2", "", testo), E("p", "", m.modo === "veterano" ? "L'hai toccato mentre era in allerta." : "Ora sei un'anima: puoi ancora finire i compiti."));
  sc.appendChild(box); vibra([90, 60, 180]); SUONO.spegni();
  if (V.pit.ridotto) { l.spegni(); l.mucchio(); mostra(); } else giro();
  var via = function () { if (!box.parentNode || box.classList.contains("via")) return; box.classList.add("via"); setTimeout(function () { box.remove(); }, 320); };
  box.addEventListener("click", via); setTimeout(via, 3800);
};
// i tasti di una scheda in riunione (ak: "parla" | "vota" | "conf" | "mio" | "", più "|ind" per l'Indovino)
Vista.prototype.tastiCarta = function (c, id, ak) {
  var V = this, az = c.querySelector(".az"); az.textContent = "";
  var tasto = function (cls, testo, fn, ico) { var b = ico ? tastoIco(cls, ico, testo) : E("button", cls, testo); b.type = "button"; b.addEventListener("click", function (e) { e.stopPropagation(); fn(b); }); az.appendChild(b); return b; };
  var tipo = ak.split("|")[0];
  if (tipo === "parla") {
    tasto("dubbio", "Sospetto", function (b) { V.manda("rapida", { tipo: "sospetto", id: id }); V.lampo(b); }, "sospetto");
    tasto("fido", "Pulito", function (b) { V.manda("rapida", { tipo: "pulito", id: id }); V.lampo(b); }, "pulito");
  } else if (tipo === "vota") {
    var me = id === V.cb.myId;   // (votarsi da soli si può: il sigillo è pallido, così non capita per sbaglio)
    tasto("vota" + (me ? " me" : ""), me ? "Votati" : "Vota", function () { V.conf = id; clearTimeout(V.confT); V.confT = setTimeout(function () { if (V.conf === id) { V.conf = null; V.riunione(); } }, 4000); vibra(15); V.riunione(); }, "vota");
  } else if (tipo === "conf") {
    tasto("conf", "Confermi?", function () { if (V.mioVoto) return; V.manda("voto", { su: id }); V.mioVoto = id; V.conf = null; clearTimeout(V.confT); vibra(40); SUONO.sigillo(); V.riunione(); }, "pulito");
  } else if (tipo === "mio") { var mio = E("span", "mio"); mio.append(E("span", "", "Il tuo voto"), E("i", "sig")); az.appendChild(mio); }   // il sigillo cade sul biglietto
  if (ak.indexOf("|ind") >= 0) tasto("ind", "?", function () { V.apriIndovina(id); }, "maschera").setAttribute("aria-label", "Indovina il ruolo di " + ((V.cache[id] || {}).nome || "?"));
};
// in riunione la chat sta chiusa, quindi la lista prende tutto il foglio e le righe crescono fin dove c'è spazio (--rh).
// In verticale una riga per ospite se ci stanno, altrimenti due colonne; di lato tre colonne (il numero di ospiti lo decide, non il telefono)
Vista.prototype.riuAdatta = function () {
  var V = this, box = V.riuBox, lista = V.riuGrid; if (!box || !box.isConnected || !V.g) return;
  if (document.activeElement && document.activeElement.tagName === "INPUT") return;   // (mentre si scrive il foglio non si ridispone: la tastiera non deve spostare le righe)
  var n = V.g.g.length, oriz = V.sc.classList.contains("oriz"), h = lista.clientHeight, una = !oriz && h - 16 >= n * 44;
  box.classList.toggle("una", una);
  var col = oriz ? 3 : una ? 1 : 2, rh = Math.floor((h - V.riuCol.offsetHeight) / Math.ceil(n / col));
  rh = Math.max(una ? 44 : oriz ? 46 : 66, Math.min(oriz ? 92 : una ? 112 : 84, rh));   // (pochi ospiti: righe alte, ritratti e sigilli più grandi)
  box.style.setProperty("--rh", rh + "px");
  box.classList.toggle("ampia", rh >= (una ? 54 : 56));
  box.classList.toggle("grande", rh >= (una ? 86 : 74));
};
// quante righe di «ora» non erano in «prima». L'host tiene le ultime 40: a chat piena le vecchie escono dalla testa e la lunghezza non dice più niente
function righeNuove(prima, ora) {
  for (var s = 0; s < prima.length; s++) {
    var n = prima.length - s, i = 0; if (n > ora.length) continue;
    while (i < n && prima[s + i][0] === ora[i][0] && prima[s + i][1] === ora[i][1]) i++;
    if (i === n) return ora.length - n;
  }
  return ora.length;
}
// la chat della riunione si apre a mano: un foglietto sopra la lista, che non la sposta. Lo stato sta in V.chatS e dura tutta la riunione
Vista.prototype.chatApri = function (si) {
  var V = this, c = V.chatS; if (!c || !V.riuFog) return;
  c.aperta = si;
  V.riuFog.classList.toggle("su", si); V.btnChat.classList.toggle("aperta", si); V.btnChat.setAttribute("aria-expanded", si ? "true" : "false");
  if (si) {
    if (c.nuovi) c.fondo = true;   // (i non letti si leggono dall'ultimo)
    c.nuovi = 0; c.coda = []; if (c.ora) V.bigVia();   // (da qui le righe del gioco si leggono nel foglietto)
    if (c.fondo) V.riuChat.scrollTop = V.riuChat.scrollHeight;
  } else if (document.activeElement === V.riuInp) V.riuInp.blur();
  V.chatSegno(); V.chatPosiz();
};
// il sigillo di ceralacca col numero dei messaggi non letti: compare e sparisce con una transizione, il ridisegno non lo tocca
Vista.prototype.chatSegno = function () {
  var V = this, c = V.chatS; if (!c || !V.btnChat) return;
  if (c.nuovi) {
    var t = c.nuovi > 9 ? "9+" : String(c.nuovi);
    if (V.chatSeg.textContent !== t) {   // (a zero il numero resta mentre il sigillo svanisce)
      if (V.chatSeg.textContent && V.chatSeg.classList.contains("su")) { V.segScatto = !V.segScatto; V.chatSeg.classList.toggle("scatto-a", V.segScatto); V.chatSeg.classList.toggle("scatto-b", !V.segScatto); }   // (il numero cambia: uno scatto solo, i ridisegni non lo toccano)
      V.chatSeg.textContent = t;
    }
  }
  V.chatSeg.classList.toggle("su", c.nuovi > 0);
  V.btnChat.setAttribute("aria-label", c.nuovi ? "Chat, " + c.nuovi + (c.nuovi === 1 ? " messaggio nuovo" : " messaggi nuovi") : "Chat");
};
// con la tastiera aperta il foglietto sale sopra i tasti del telefono e si accorcia a quello che resta: il campo si vede sempre.
// Come la barra della chat di prossimità: la tastiera di iPhone cambia solo il «visualViewport». Con la scena girata il foglietto sta dal lato opposto alla tastiera
Vista.prototype.chatPosiz = function () {
  var V = this, f = V.riuFog, vv = window.visualViewport; if (!f || !f.isConnected) return;
  var sotto = 0, r = V.riuBox.getBoundingClientRect();
  if (vv && !V.girato && V.chatS && V.chatS.aperta && document.activeElement === V.riuInp) sotto = Math.max(0, Math.round(r.bottom - (vv.offsetTop + vv.height)));
  f.classList.toggle("tastiera", sotto > 0);
  if (!sotto) { f.style.top = f.style.bottom = f.style.height = ""; return; }
  var base = Math.round(r.bottom - V.riuFondo.getBoundingClientRect().top) + 6;
  f.style.top = "auto"; f.style.bottom = Math.max(base, sotto + 6) + "px"; f.style.height = Math.max(96, Math.min(Math.round(r.height * 0.6), Math.round(vv.height) - 12)) + "px";
};
// le righe del gioco (Celebrità, foto del Medium, lanterne cadute…) a chat chiusa: un bigliettino alla volta sopra le schede, che non sposta niente. Un tocco lo toglie
Vista.prototype.bigGiro = function () {
  var V = this, c = V.chatS, b = V.riuBig; if (!c || !b || V.bigT || c.aperta || !c.coda.length) return;
  if (!V.intro.hidden) { V.bigT = setTimeout(function () { V.bigT = null; if (V.vivo) V.bigGiro(); }, 250); return; }   // (prima finisce la scritta grande)
  var r = c.ora = c.coda.shift(), foto = r[2] && r[2].foto;
  b.textContent = ""; b.appendChild(E("span", "", r[1]));
  if (foto) { var fc = E("canvas", "foto"); b.appendChild(fc); disegnaFoto(fc, foto); }
  b.classList.add("su");
  V.bigT = setTimeout(function () { if (V.vivo) V.bigVia(); }, foto ? 7000 : 5000);
};
Vista.prototype.bigVia = function () {
  var V = this; clearTimeout(V.bigT); if (V.chatS) V.chatS.ora = null; if (V.riuBig) V.riuBig.classList.remove("su");
  V.bigT = setTimeout(function () { V.bigT = null; if (V.vivo) V.bigGiro(); }, 240);   // (il tempo di uscire, poi il prossimo)
};
// chi ha votato chi, in fondo al verdetto: in una deduzione è il dato che conta
Vista.prototype.chiHaVotato = function (esito) {
  var V = this, per = {}, ordine = [];
  esito.voti.forEach(function (x) { if (!per[x[1]]) { per[x[1]] = []; ordine.push(x[1]); } per[x[1]].push(x[0]); });
  if (!ordine.length) return null;
  ordine.sort(function (a, b) { return (a === "salta") - (b === "salta") || per[b].length - per[a].length; });
  var box = E("div", "chivoti"); box.appendChild(E("p", "occh", "Chi ha votato chi"));
  ordine.forEach(function (su) {
    var salto = su === "salta", r = E("div", "rg" + (salto ? " salto" : "")), dx = E("span", "su"), da = E("span", "da");
    if (!salto) dx.appendChild(ritratto(su)); dx.appendChild(E("b", "", salto ? "Hanno saltato" : (V.cache[su] || {}).nome || "?")); if (!salto) dx.appendChild(tintaDi(su));
    per[su].forEach(function (id) { var f = ritratto(id); f.title = (V.cache[id] || {}).nome || ""; da.appendChild(f); });
    r.append(dx, da); box.appendChild(r);
  });
  return box;
};
// un tasto premuto si accende un attimo (la frase è partita)
Vista.prototype.lampo = function (b) { b.classList.remove("fatto"); void b.offsetWidth; b.classList.add("fatto"); vibra(15); };
Vista.prototype.riunione = function (soloTempi) {
  var V = this, g = V.g, R = g.riu, ora = performance.now(), vivo = V.sonoVivo() && !V.guardo;
  var k = "riu|" + g.round + "|" + (V.vm.rip || 0) + "|" + (V.guardo ? 1 : 0);   // (chi rientra vede la foto prima del ruolo: la riunione si rifà quando arriva, coi tasti giusti)
  if (V.riuK !== k || V.veloTipo !== "riu") {   // (se un pannello l'ha coperta, la riunione si ridisegna)
    soloTempi = false;   // (il foglio nuovo si riempie subito: anche se a ridisegnarlo è il giro dei secondi)
    // la chat dura tutta la riunione: ridisegnare il foglio non la chiude, non perde il testo a metà, i non letti e il punto a cui si era arrivati
    var cs = V.chatS, scriveva = false;
    if (!cs || cs.r !== g.round) cs = V.chatS = { r: g.round, aperta: false, nuovi: 0, viste: [], testo: "", sc: 0, fondo: true, coda: [], ora: null };
    else if (V.riuInp) { cs.testo = V.riuInp.value; scriveva = document.activeElement === V.riuInp; }
    if (cs.ora) { cs.coda.unshift(cs.ora); cs.ora = null; }
    clearTimeout(V.bigT); V.bigT = null;
    V.riuK = k; V.veloTipo = "riu"; V.velo.textContent = ""; V.velo.hidden = false;
    var box = E("div", "lt-pannello lt-foglio lt-riu"); V.velo.appendChild(box); V.riuBox = box; V.riuFaseK = null;
    // in alto: chi ha chiamato la riunione, perché e quanto tempo resta
    var testa = E("div", "testa"), chiR = E("div", "chi"), titR = E("div", "tit"), occh = E("p", "occh");
    V.riuOcch = E("span", "", "Riunione n. " + g.round); occh.innerHTML = STEMMA; occh.append(E("span", "reg", "Registro di Palazzo Velmare · "), V.riuOcch);
    V.riuFase = E("b", "fase", ""); V.riuTit = E("h3", "", ""); V.riuPerche = E("p", "perche", ""); V.riuTimer = E("div", "timer", "");
    if (R && R.da != null) chiR.appendChild(ritratto(R.da));   // solo chi ha chiamato: di chi è la lanterna e dove stava non si dice
    chiR.appendChild(V.riuFase);   // il timbro: si parla, si vota, verdetto
    V.riuBig = E("div", "big"); V.riuBig.setAttribute("aria-live", "polite"); V.riuBig.addEventListener("click", function () { if (V.chatS && V.chatS.ora) V.bigVia(); });
    titR.append(occh, V.riuTit); testa.append(intestazione("Registro di Palazzo Velmare"), chiR, titR, V.riuTimer, V.riuPerche, V.riuBig); box.appendChild(testa);
    V.riuGrid = E("div", "grid"); box.appendChild(V.riuGrid);
    var colonne = E("div", "colonne"), legenda = E("span", "leg"); legenda.innerHTML = icona("sospetto") + "<i>sospetto</i>" + icona("pulito") + "<i>pulito</i>";   // (di lato i tasti sono solo icone: la legenda sta qui)
    V.riuC3 = E("span", "c3", ""); colonne.append(E("span", "c1", "Ospite"), E("span", "c2", "Note"), V.riuC3, legenda); V.riuGrid.appendChild(colonne); V.riuCol = colonne;
    V.riuPot = E("div", "poteri"); box.appendChild(V.riuPot);   // (i tasti dei ruoli non stanno nel foglietto: non si perdono a chat chiusa)
    // il foglietto della chat: messaggi, risposte rapide e la riga per scrivere
    V.riuFog = E("div", "foglietto" + (cs.aperta ? " su" : "")); var cimaF = E("div", "cima"), viaF = E("button", "via"); viaF.type = "button"; viaF.innerHTML = icona("esciVoce"); viaF.setAttribute("aria-label", "Chiudi la chat");
    viaF.addEventListener("click", function () { V.chatApri(false); }); cimaF.append(E("span", "ti", "Chat"), viaF);
    V.riuChat = E("div", "chat"); V.riuChat.addEventListener("scroll", function () { var el = this, c = V.chatS; if (!c || el !== V.riuChat) return; c.sc = el.scrollTop; c.fondo = el.scrollHeight - el.clientHeight - el.scrollTop < 24; }, { passive: true });
    var penna = E("div", "penna"); V.riuRap = E("div", "rapide"); penna.appendChild(V.riuRap); V.riuPen = penna; V.riuFog.append(cimaF, V.riuChat, penna);
    // la scritta grande che apre la riunione
    V.intro.textContent = ""; V.intro.className = "lt-intro " + (R && R.motivo === "corpo" ? "corpo" : "campana");
    var facce = E("div", "facce"); if (R && R.da != null) facce.appendChild(ritratto(R.da));
    var icI = E("div", "icona"); icI.innerHTML = icona(R && R.motivo === "corpo" ? "lanterna" : "campana"); V.intro.append(icI, E("h2", "", R && R.motivo === "corpo" ? "Lanterna spenta!" : "Riunione!"), facce, E("p", "", R ? V.fraseRiunione(R) : ""));
    if (V.introR !== g.round) {   // (ridisegnarla non la riapre: la scritta grande si vede una volta sola)
      V.introR = g.round; V.intro.hidden = false; vibra(80);
      (R && R.motivo === "corpo" ? SUONO.corpo : SUONO.campana)();
      clearTimeout(V.introT); V.introT = setTimeout(function () { V.intro.hidden = true; }, 2000);
    }
    // sospetti, «pulito», voto e Indovino stanno sulle schede dei giocatori; qui sotto solo le frasi per sé e i tasti dei ruoli
    var rapide = [["ero", "Io ero…", "pin"], ["salto", "Non so", "boh"]];
    if (V.priv && V.priv.ruolo === "sindaco" && !V.priv.rivelato && vivo) rapide.unshift(["rivela", "Rivelati", "corona"]);
    if (V.priv && V.priv.ruolo === "imitatore" && !V.priv.imitato && vivo && g.g.some(function (q) { return !q[1] && !q[2]; })) rapide.unshift(["imita", "Imita", "maschera"]);
    rapide.forEach(function (q) {
      var b = tastoIco("", q[2], q[1]); b.dataset.k = q[0];
      b.addEventListener("click", function () {
        if (q[0] === "rivela") { V.manda("rivela"); b.remove(); return; }
        if (q[0] === "imita") return V.apriImita(b);
        V.manda("rapida", { tipo: q[0] }); V.lampo(b);
      });
      (q[0] === "ero" || q[0] === "salto" ? V.riuRap : V.riuPot).appendChild(b);
    });
    V.riuForm = E("form", "scrivi"); var inp = E("input"); inp.type = "text"; inp.maxLength = 90; inp.placeholder = "Scrivi…"; var inv = E("button", "", "Invia"); inv.type = "submit"; V.riuForm.append(inp, inv); penna.appendChild(V.riuForm);
    V.riuInp = inp; inp.value = cs.testo; inp.addEventListener("focus", function () { V.chatPosiz(); }); inp.addEventListener("blur", function () { V.chatPosiz(); V.riuAdatta(); });
    V.riuForm.addEventListener("submit", function (e) { e.preventDefault(); var tx = inp.value.trim(); if (!tx) return; V.manda("chat", { testo: tx }); inp.value = ""; inp.blur(); });
    V.riuVoto = E("div", "voto"); V.btnSalta = tastoIco("btn btn-fantasma salta", "salta", "Salto il voto"); V.riuVoto.append(V.btnSalta);
    V.btnChat = tastoIco("btn btn-fantasma cht" + (cs.aperta ? " aperta" : ""), "parla", "Chat"); V.chatSeg = E("i", "nuovi" + (cs.nuovi ? " su" : "")); V.btnChat.appendChild(V.chatSeg); V.btnChat.setAttribute("aria-expanded", cs.aperta ? "true" : "false");
    V.btnChat.addEventListener("click", function () { V.chatApri(!V.chatS.aperta); });
    var fondo = E("div", "fondo"); if (!V.guardo) fondo.appendChild(creaVoce("riga")); fondo.append(V.btnChat, V.riuVoto); box.append(fondo, V.riuFog); V.riuFondo = fondo;   // (la voce: anche qui si parla)
    V.btnSalta.addEventListener("click", function () { if (V.mioVoto) return; V.manda("voto", { su: "salta" }); V.mioVoto = "salta"; V.conf = null; vibra(25); V.riunione(); });
    V.conf = null; V.mioVoto = (V.priv && V.priv.voto) || null; V.carte = {}; V.riuRighe = null; V.espK = null;
    g.g.forEach(function (q) {
      var io = q[0] === V.cb.myId, c = E("div", "carta" + (io ? " io" : "")), nt = E("span", "nt");
      if (io) nt.appendChild(E("span", "tu", "tu")); nt.appendChild(tintaDi(q[0])); nt.appendChild(E("span", "st", ""));
      c.append(ritratto(q[0]), E("span", "nm", (V.cache[q[0]] || {}).nome || "?"), nt, E("span", "vt", ""), E("div", "az"));
      V.carte[q[0]] = c; V.riuGrid.appendChild(c);
    });
    if (V.riuRO) V.riuRO.disconnect();
    if (window.ResizeObserver) { V.riuRO = new ResizeObserver(function () { V.riuAdatta(); }); V.riuRO.observe(box); V.riuRO.observe(V.riuGrid); }
    V.riuAdatta(); V.chatSegno();
  }
  // tempi
  var disc = Math.max(0, Math.ceil((V.discFine - ora) / 1000)), voto = Math.max(0, Math.ceil((V.votoFine - ora) / 1000));
  var faseK = g.fase === "esito" ? "esito" : disc > 0 ? "parla" : "vota", resta = faseK === "parla" ? disc : voto;
  if (V.riuFaseK !== faseK) { V.riuFaseK = faseK; V.riuTot = Math.max(1, resta); V.riuFase.textContent = { parla: "Si parla", vota: "Si vota", esito: "Verdetto" }[faseK]; V.riuC3.textContent = { parla: "Di' la tua", vota: "Voto", esito: "Voti" }[faseK]; V.riuBox.dataset.fase = faseK; var vistaF = g.round + "|" + faseK; V.riuFase.classList.toggle("cade", V.faseVista !== vistaF); V.faseVista = vistaF; }   // (il timbro cade quando la fase cambia, non quando il foglio si rifà)
  var tmr = faseK === "esito" ? "✓" : String(resta);
  if (V.riuTimer.textContent !== tmr) { V.riuTimer.textContent = tmr; V.riuTimer.style.setProperty("--lt-giro", faseK === "esito" ? 100 : Math.min(100, Math.round(100 * resta / V.riuTot))); V.riuTimer.classList.toggle("stretta", faseK === "vota" && resta <= 10); if (faseK === "vota" && resta > 0 && resta <= 10) { V.riuBatte = !V.riuBatte; V.riuTimer.classList.toggle("batte-a", V.riuBatte); V.riuTimer.classList.toggle("batte-b", !V.riuBatte); } }   // (gli ultimi dieci secondi battono: una volta per numero)
  if (R) {   // (prima del ritorno dei soli tempi: la scritta cambia nel momento in cui si apre il voto)
    // chi cade in riunione porta via i voti: il mio per lui non vale più e il sigillo torna in mano. Caduto io, il mio non conta
    if (g.fase === "riunione" && V.mioVoto) { var votoSu = g.g.filter(function (q) { return q[0] === V.mioVoto; })[0]; if (!V.sonoVivo() || (votoSu && !votoSu[1])) V.mioVoto = null; }
    // una riga sola, sempre piena: la testata non cambia altezza e la lista non si muove quando si apre il voto
    var devo = faseK === "vota" && vivo && !V.mioVoto, salti = g.esito ? g.esito.voti.filter(function (x) { return x[1] === "salta"; }).length : 0;
    var tuttiVot = faseK === "vota" && g.g.every(function (q) { return !q[1] || R.votati.indexOf(q[0]) >= 0; });   // (l'ultimo sigillo è messo, il verdetto arriva tra pochi secondi)
    var pe = faseK === "esito" ? (salti ? "Hanno saltato: " + salti + "." : "Si contano i voti.") : !vivo ? "Sei un'anima: guardi la riunione." : faseK === "parla" ? (R.zittiti.indexOf(V.cb.myId) >= 0 ? "Sei stato zittito: non parli, ma voti." : "Si parla: il voto si apre tra " + disc + " s") : devo ? "Premi il sigillo di chi vuoi cacciare." : tuttiVot ? "Hanno votato tutti: si chiude tra " + voto + " s" : V.mioVoto === "salta" ? "Hai saltato. Aspettiamo gli altri." : "Hai votato " + ((V.cache[V.mioVoto] || {}).nome || "") + ". Aspettiamo gli altri.";
    if (V.riuPerche.textContent !== pe) { V.riuPerche.textContent = pe; V.riuPerche.classList.toggle("chiede", devo); }
  }
  if (soloTempi) return;
  if (R) {
    V.riuTit.textContent = V.fraseRiunione(R);
    var chat = R.chat || [], cs2 = V.chatS, disegna = V.riuRighe ? righeNuove(V.riuRighe, chat) : chat.length, nuove = righeNuove(cs2.viste, chat);
    for (var i = chat.length - disegna; i < chat.length; i++) {
      var p = E("p"); var chi = chat[i][0]; if (chi != null) { var pt = ritratto(chi); pt.classList.add("pt"); p.append(pt, E("b", "", (V.cache[chi] || {}).nome || "?"), E("span", "tc", " " + panno(chi).n), ": "); } else p.className = "sis"; p.append(chat[i][2] && chat[i][2].tuo && chat[i][2].da === V.cb.myId ? chat[i][2].tuo : chat[i][1]); V.riuChat.appendChild(p);
      if (chat[i][2] && chat[i][2].foto) { var fc = E("canvas", "foto"); V.riuChat.appendChild(fc); disegnaFoto(fc, chat[i][2].foto); }
    }
    if (disegna && (cs2.fondo || !V.riuRighe)) V.riuChat.scrollTop = cs2.fondo ? V.riuChat.scrollHeight : cs2.sc;   // (chi sta leggendo più su resta dov'è)
    if (!V.riuRighe && scriveva) inp.focus();
    V.riuRighe = chat; cs2.viste = chat;
    // a chat chiusa: i messaggi degli altri fanno il numero sul sigillo, le righe del gioco diventano bigliettini. «Ha segnalato» e «ha suonato» stanno già nella testata
    if (!cs2.aperta) for (var j = chat.length - nuove; j < chat.length; j++) {
      if (chat[j][0] != null) { if (chat[j][0] !== V.cb.myId) cs2.nuovi++; }
      else if (!/ ha (segnalato una lanterna spenta|suonato la campana)\.$/.test(chat[j][1])) cs2.coda.push(chat[j]);
    }
    // quello che il Bracconiere legge nella trappola: è suo e basta, non passa dalla chat. L'avviso cade sulla scritta grande, il bigliettino resta da leggere
    var trap = V.priv && V.priv.trapRuoli ? V.priv.trapRuoli.join(", ") : null;
    if (trap && V.trapVisto !== trap) { V.trapVisto = trap; cs2.coda.push([null, "Nella trappola sono passati: " + trap + "."]); }
    V.chatSegno(); V.bigGiro();
  }
  var votati = R ? R.votati : [], zitt = R ? R.zittiti : [], esito = g.esito, sindaci = g.sindaci || [];
  var mioBers = V.priv && V.priv.ruolo === "accusatore" ? V.priv.bersaglio : null;
  var nVoto = 0, kEs = esito ? "es|" + g.round : null, nuovoEsito = kEs && V.kVoti !== kEs;
  var zittitoIo = !!(R && zitt.indexOf(V.cb.myId) >= 0), indov = V.priv && V.priv.ruolo === "indovino" && vivo && V.priv.tentativi > 0;
  // il foglietto dell'Indovino aperto: si chiude da solo se il voto finisce, se i tentativi finiscono o se chi guardava è caduto; il conto in alto è sempre quello vero
  var fi = V.indovF;
  if (fi) { var suChi = g.g.filter(function (q) { return q[0] === fi.id; })[0]; if (!fi.el.isConnected || !indov || g.fase !== "riunione" || !suChi || !suChi[1]) { fi.el.remove(); V.indovF = null; } else { var rgI = V.rigaIndov(); if (fi.riga.textContent !== rgI) fi.riga.textContent = rgI; } }
  g.g.forEach(function (q) {
    var c = V.carte[q[0]]; if (!c) return;
    var ass = !!q[1] && !!(V.assenti || {})[q[0]];   // (senza rete: una scheda sola per volta dice una cosa)
    c.classList.toggle("spento", !q[1]); c.classList.toggle("rete", ass); c.classList.toggle("zitto", !!q[1] && !ass && zitt.indexOf(q[0]) >= 0); c.classList.toggle("mio-voto", V.mioVoto === q[0]); c.classList.toggle("votato", votati.indexOf(q[0]) >= 0);
    // i tasti sulla scheda: mentre si parla «Sospetto» e «Pulito», quando si vota «Vota» (al secondo tocco «Confermi?»)
    var altro = q[0] !== V.cb.myId, puo = vivo && !!q[1] && g.fase === "riunione";   // (votarsi da soli si può sempre)
    var ak = !puo ? (g.fase === "esito" && V.mioVoto === q[0] ? "mio" : "") : disc > 0 ? (zittitoIo || !altro ? "" : "parla") : V.mioVoto ? (V.mioVoto === q[0] ? "mio" : "") : V.conf === q[0] ? "conf" : "vota";
    if (puo && indov && altro) ak += "|ind";
    if (c.dataset.ak !== ak) { c.dataset.ak = ak; V.tastiCarta(c, q[0], ak); }
    var nm = ((V.cache[q[0]] || {}).nome || "?") + (sindaci.indexOf(q[0]) >= 0 ? " ★" : "") + (q[0] === mioBers ? " ◎" : "");
    var nmE = c.querySelector(".nm"); if (nmE.textContent !== nm) nmE.textContent = nm;
    nmE.classList.toggle("buono", V.letti[q[0]] === "buono"); nmE.classList.toggle("cattivo", V.letti[q[0]] === "cattivo");
    var stt = !q[1] ? "spento" : ass ? "assente" : zitt.indexOf(q[0]) >= 0 ? "zittito" : "";
    var st = c.querySelector(".st"); if (st.textContent !== stt) st.textContent = stt;
    if (votati.indexOf(q[0]) >= 0 && !c.dataset.batti) { c.dataset.batti = "1"; c.classList.remove("lt-batti"); void c.offsetWidth; c.classList.add("lt-batti"); }
    if (!nuovoEsito) return;
    var vt = c.querySelector(".vt"); vt.textContent = "";
    // i voti compaiono uno alla volta
    esito.voti.forEach(function (x) { if (x[1] !== q[0]) return; for (var w = 0, peso = Math.round(x[2] || 1); w < peso; w++) { var d = ritratto(x[0]); d.title = (V.cache[x[0]] || {}).nome || ""; d.style.animationDelay = (0.2 + nVoto * 0.18) + "s"; SUONO.voto(0.2 + nVoto * 0.18); nVoto++; vt.appendChild(d); } });
  });
  if (nuovoEsito) V.kVoti = kEs;
  var aperto = g.fase === "riunione" && disc <= 0;
  var zittito = R && zitt.indexOf(V.cb.myId) >= 0;
  V.riuRap.hidden = V.riuForm.hidden = V.riuPen.hidden = V.riuPot.hidden = !vivo || g.fase !== "riunione" || zittito;
  V.riuVoto.hidden = !vivo || g.fase !== "riunione";
  V.btnSalta.disabled = !aperto || !!V.mioVoto;
  var ts = V.mioVoto === "salta" ? "Hai saltato" : V.mioVoto ? "Hai votato" : "Salto il voto", tsp = V.btnSalta.querySelector("span"); if (tsp && tsp.textContent !== ts) tsp.textContent = ts;
  if (esito && V.espK !== esito.titolo + "|" + g.round) {
    V.espK = esito.titolo + "|" + g.round;
    var box = V.velo.querySelector(".lt-riu");
    setTimeout(function () {
      if (V.riuK !== k || !V.vivo) return;
      var es = E("div", "lt-esp lt-foglio"), rt = E("div", "ritr" + (esito.espulso == null ? " vuoto" : "")), tx = E("div", "txt");
      if (esito.espulso != null) { var ft = ritratto(esito.espulso); if (ft.tagName === "IMG") { ft.src = ritrattoLenzuolo(LENZ_DI[esito.espulso].c, 330).toDataURL(); rt.appendChild(ft); } else rt.classList.add("sagoma"); }   // (il verdetto lo porta grande)
      rt.appendChild(E("div", "timbro", esito.espulso != null ? "Cacciato" : "Nessuno"));
      tx.append(E("p", "occh", "Verdetto · Riunione n. " + g.round), E("h2", "", esito.titolo)); if (esito.espulso != null) tx.appendChild(tintaDi(esito.espulso)); if (esito.sotto) tx.appendChild(E("p", "sotto", testoEsito(esito.sotto)));
      var nVoti = 0, nSalti = 0; esito.voti.forEach(function (x) { var u = Math.round(x[2] || 1); if (x[1] === "salta") nSalti += u; else if (x[1] === esito.espulso) nVoti += u; });
      var conto = E("div", "conto");   // la riga del registro: quanti voti, quanti hanno saltato
      if (esito.espulso != null) { var c1 = E("span"); c1.append(E("b", "", String(nVoti)), nVoti === 1 ? "voto" : "voti"); conto.appendChild(c1); }
      var c2 = E("span"); c2.append(E("b", "", String(nSalti)), nSalti === 1 ? "ha saltato" : "hanno saltato"); conto.appendChild(c2); tx.appendChild(conto);
      es.append(intestazione("Registro di Palazzo Velmare"), rt, tx); var cv = V.chiHaVotato(esito); if (cv) es.appendChild(cv); box.appendChild(es); if (cv) ltSfuma(cv); SUONO.esce();
    }, 2600);
  }
};

// =========================================================
//  STILE (prefisso lt-)
// =========================================================
// =========================================================
//  IL REGISTRO DI PALAZZO VELMARE
//  Riunione, voto, esito, regole dell'host, ruolo e finale sono fogli di carta su un tavolo di noce:
//  ceralacca, ottone, inchiostro. Tutto in CSS: l'unica immagine è la grana qui sotto (5,6 KB, ripetuta).
// =========================================================
var GRANA = "iVBORw0KGgoAAAANSUhEUgAAAIwAAACMBAMAAABc7lwNAAAAMFBMVEU6JBI6JBI6JBI6JBI6JBI6JBI6JBI6JBIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADW+9ABAAAACHRSTlMABgwSGB4kKhCTungAABV1SURBVHjabVpHc+TMkS3Ts+cyoM5lQJ3LoEfXBgo933XIbo6u2jGh+26E9u/vyyo0OZ9CjDE0QJk0L1++JPNqFhsTPAau2OwdY0yJqTDDmaqv9CVjXND/0TPu8f/iU2CKPT6S8nVmSVS2C2M5k4lH6xPPysREL2uz4nVOz9JbOlbeGJPCM+veV+EuaLkzx7PembFL0kV7mbfpwtyMZXjKCW8L8XjBTJntjE/C8T33dfoOOYnisY/1mxJKOi34EsuPmhzH4oqvwSs8yY+dlTEiR8eFZHrGD/CH83HQrGiZEFxkIi1MvIXyP9E4jZ86e6FH1HEjfMj86bKa/umiFZYxj3PumYXgvXECD50uOLP+aoqiezhxmJepMh7WeOKVGeOczrTH8YFNzhVnxvcd889f5wsT8FJIfQEl1XiIs6AYnY/VL+U7K4yvTGiy2mHjLKaFmVTxrXkP63XlSl44PEV3SdKN6/CHb7k/75uNQqV+tvfLMiNvLMc9OREzL3GVN+5nU72DIZMQajzO+5HwNHt62VulT5hiHzbDDXbmT1sKf10D16xc91KWqSC4cKzjGT3ibxh51fLxLfbuQlwP+8x7rudL0MLfvzWxniM2SeJEyyj/2FJQ+HqjlDjszj/CGCmgaKfIZqcrz9fr3ZRFIeoTp7v86eHhXa8C+/eP/lB0shpuWJjKMn+Xtfp+Gk4Bz4c7wmMxZMdpxQGPYOrfxgOSX5ifn3fNgs9/udXt9hRjUYa7OisKphHvipMZkbVeqxnpoBytwPtq/dCIIgS0NtPW8vO2JX3izxt+1ioCykjbE74vIyRFPJIy0tXEe3DDWBwZQIAwZ16bD2VldlHPjZ7znml5qtn5cSIRpUhKa5vJ6hIBlh6WwR+eKGyvRdYZn4c0L+l868nmsIz3+Xi4xyIWkDvuxfxSQ3x3E/0TEAR1uUeledXXvOz62yu+yQhnkOQmaQoPnhAFgV7ITG9O7pXuOeKn3498GpLZXNO5Vp2Q5D+VUwp+FTUROvDDT8paz3wSek2wPr3dY2k4oQNPdfDDstrrXXNmEMNJw0u8KDKmfjxFSOpg5swylz03yXD8WArHXREqJtzmedWcnxG+jvsl88R+SxzBhPNccBhJYBnj6Tqlh5YbOABjprCnVz45n5eIa8OLGqnfg9eNNBfwHj+iSDMpm4ebEdnCHrjkgOebWmCNk/alxm5eRIl06h1vyVlW65KOdyQ/r3Q8xZYF8YSjOWU8XGNzq5aZfP1BuwvEh3Suu/KxjIkCYXCYNQBGyYd6D6XvFXC6Bhy1t+vNFPb0v32/YCrXPceP7ORsdzIpQcdB8NV5lJ4U+MguUbjHuZxy+bVqdtp6PCVCGJhl1LV+sd1RlaBVhRO7T4yqSvXGaKb71n5EonrRSovS0yWbUUNGNh8gJzVSq4MwgoFTGhHA0xVxDM6tHUm20sZbvwLSHLiDK7mRw+y4oiVbca6PVGO6oNr+Fhcaoa90ZvKlu3djkuCrh/oIPriCoxCK7gGZ81jHD0hyfXFmexrhsO7IXAfrMNQ0eouurFF4VUzKDVQWob7nN66H0Eh9eddXlNXJAbaKJyMCFZGgND0tbEr6ogZkcv4gA0rTNjhEG0W9Z+Dsy8hY3RCB7JzwvO9Vi1mhFL+MqIE9By7TuTR9ZQH3sDfewY4Uhqynm8p6kRxAn/FjQXaWWS7b2qEh8NJtiu8WHFpFzipb4Qhhi9LhiFhQIQSl4xZmf83k2BFgi62jmCcWDz8J5QgyQK9YI0NEFVyOBAqnADvB0Vo++bzflpJ7cVHsNC+LO+hVPVCP5+74AMRYHawRcbs5cRzn00KBTcedvVmTaL2SYSETzJa7D6PLB/Q9vy54hRs3sYuycJQxBO+wkNS9xvOI3UK8XZfDcR1ZyabZV7cdy5w8p22Yrz1lowMMyUCfilGcOBBSRG++tUT10lHQ8IZYYiFVB3tSVWXyPiUqzPWNNWQ/Aa+fcudg8shoOxMmWkclnZwybXAYVmzwHc6e6cyGlhE1yJmVtb+WuaiPuBSIIRH5yDQCdrpA8OdOMjaDGJMdNpW9Toni/pQJJcmhYXDeUZMBHFhEMunLl9tgKHyu9UL1PQax3T1zOKbOz28td6OwmnogHfSiX8pmsoHFDUL5dhtsRsR4/W/VPczd7PUFdgKnqj8CK5nKRKcaoR8D7qKajDKLg5yuXPP5bR2EyCw/ZyR/yJoWnzVxF6xqfni5bjUeruNUzbXlOhj2jDjj0SwtgCPMlQ2YvO5Tyd7j/Gx5nRTDUky6uHL54ukIXhHU4NGCEg//82A5QpK/XaNY4zTjpIEnMa92e54buSAEYn8TcjKtzYZboOIYCsEbCp1jfCSKCAaE/va32bxqwLPwzRer7o2drrmj8rxkJq4ABbO+yHYlm5o8p0yw8EHQrDQgcuXbqzcBDMfWZzQF/rqZ57NtVJvWs2HyX1MuvNXTvHcX68lFbY1+r+vGWudXF+93O60ZL5SnF5Sg82KfPy8FhxWrEN7++NJM3u4VuEgYiPJfneXqg0gLbWpBKd1AulEauHlqJYu3Vq/f9mSpZFWg3tuvxGt+neKSDyZJFfFxJaqgoFp1xVoGWxCHlaGGMJd135sJ2dXVKuFivEz+vofdDG6CYKqcPRqw0GHZal+nF478II4i6znz51u71ojywFFAFJWo1tbW7svIQnFVpj0o96DniG2zyVOKjr5AfOjrztv1120FwPUCiP+cjPs/wtdzDLazKGJsg2+wI5sZKM+Vf7rV1JRcQka/Vn0Ja60P81XmwC7++tIuM6xo1EexoaDxA/aTXPIunm7XF0DiE2pJPG8ibhf4dhxaJ0S9aLbM6rxrLt57HP5O3f2AA2Hi6x+/VqMnzuN2Aq7qWlYwLTqypxIjr99+gphvD9JOfylsiBhxajeQiWEK0+vfbq9szYQcz/i3gRUT3vencbvTvtyZWnHOg0z2/NQaXSvhO5NfHXB5un/7vF6nHy0EEXAdG3VQ0XdkHp2Wmfbi4hWMcByDmKDyOj7CzwES5ent8+L/uW918qe5Xgy6cFQvuj03/Cie5vw6f4tOv5MXp/rnThIwG4OA4ftil3/+3OaTmZd2qTHmVOAi7Ua8G4TWEl4QN53dHc5CP5toA1RWYd2sN27uf7wu+1rBYexd7RI9eGL2wxeyJVlub8sI2zkc/FdcYD8ivKcWWrlIHv6a0c9FqUAn0JcKgeJBDY6gQgPm4pDVzk+2M+hPSXZSCS+mAencoMzqSdpztk5U2V/UaN1KteHJANPJEUQDjcpob3u4zUkKwyEvoMPjo9Qh/bAWNQUavAT9F1UPW5xPKj6BrFPeEdESsUDH4FS02FOss/DI/Koj1QcsUFAO1ODomVhMgC80zIJ8efo8eAVYu+5Yj+6b8kc/Oz93ZK8l9cP4GN4acR0DJ8MCndLyorvk8OlcHWWmr7969IbmRxBNq4fygpagn51wedpvNYw9dzB50E7QE9qcGpAaEiixmsuvEXGTG00x3/SyR7ehbxvAkeJutkre4D2wlL44HvLwqw1OAfWc3UIM9IKlIKYX18vzfVb3CoOyoUkVRNGgw/S1kC9upBKYj7BEjwUXbVdId8ckNbGEET7919v5dRH3NMCrm5cYlB56lHaXhGLm2ZE2RBzU872tvW94ij1VRTHtc3wrCzEeOl5n1ErkjxaQLADAZqnjIo6Qizf+Fr68du6FR8C0bClzPKcFbVUnLdRSUERlm/zo2ywJR2DWCSv4Hid0gF8vTytfjxYRcth92cPcXtFrOUMBqXEedaHGXWjKweBFpx+W+ApuJy8oa6K81ql1KQclF7TmfN9XG1B65t6ldQ7OU8K9Sr8Y+AVH5dDC0tZEErccUANRy8i3xEBgG7nnztc3/vmeulgQEEPrhm+ikSZqgFVKRKPWUyAIzptrWAv4Q/xM4sJYyIbNGSXivixvCNiMZayCVHf4BLxShwUlmGmkuSaziaQrijteflLgHtgWez/f8bKJfn+7ofaTrOYimlFdlNVdrQCKZUpmVy56UEPAMw+rPdsniHu9TRDs7+2euDev/vn6DWKZeEVvTDW0N0zjPUYNpwdnHTKg+LUq3dpW2GkZWDVptn/5kUBLbuHt9q+GgMuhEaun6DH0mnxXEP3QJBhv59Utzy+Rn0BQEA02Gna9RZRGptrb8qYDBEneyhSokZSBjiOP7u6Ae14Fi+XFi+WVezkFYLyT58a+fNfZXbi/PG2IQMQjs/ZKtEZLTTljxml4TzCKInGp4AJITQBinjMiT7xlNn+PFVrtGmalT/fOqWfodjiPCcM8RDzq6J/AUlr0bc6nMqM3JgkU+SOXle1XbW9Zzxuu8NxIyoDouyyFLwZkgjCImrau4qGvoTZji9vPyhfdU5cOGeXCrtd6QuScMxDqXHlvlEtEg7XIEnzPR47ClXoDA1dqyDyqRcp4DsPA2Y1SDuRU6xzOryGxpXSfIKHvasliUXbTCZ1RlKXgQp5ErMl6UEITQ3G95Go2X3KnVwrtX/v56yuro2PdOFq7ZyNLtqFpSj++uV462P4UwT6nNlUKBlRabqAUY3si12Cbtx/7cjFNkEcK85/maqsFTALmgaR2S4SGvLTnzC8TFOWiKd1QgaE7fjVkf3HKquztbXNdMUbY1fq8n6c8zTukDMqxpZGmCMwBow6X0JiFeOIYxHfOzfVGiUao7NwZjU4a6UE69bSci+axtrZAFQOFpUaAao0arbPOGteCJwVUVKpcuqum3E6lgIoJEbuOLs+bIkVDZwj31Iuy0ONY+f48ZwVMiNodnFAq2Cj32iTTtO5lDQzZjW+Kv9y1XUxI0PAD2okATUIQ6BbeqTNWdURZJZ0Qa8WeyQpsZC7QnUigKejkr+eflp1KSQ7dLBEeCFskgozyYDMMBRUDqpKCcicz+H7qRBeVETwAFhfAOL6Ev303RoKXM9gM4V1LeCE5BFIo1Q2cS8zoL4kNgIpHzFq6/oD8NzBXHI+GZ/P0RgqH0PLb+QYchir0lXaj/rRrkByGxfwCRhauWmQ4Sh+HfEPpYXeSz1Ahdgx2ZqfQ0uu4dyBn4dIznZaxmk/RfeoKIgYB4Xq+o5MFEdMd5TCqcXR7CQQQM3EbEJxp2YbxnDv6Yo3eFwztFGK2AoASy7Qk4hhDJ0RIPVN9cyC/hlptRsAcRZH0qemqC2qFi2YzuzOnW5Y2yI1tO4kaH6Md2dpkumLqhHanwKnlXLAh9oYGt1O9xJYxgEuY5akZkD1wfoCnoE6S8UEceD1HVANlu+wUOc6i8brSSw8WZHS/2RVEO6JVJ7oEPQDH5SYzkkZGKQY9+lXgjwC9k5PAChClvoyTXA5FsHsU7TNEc7AdKj34okXKZEnggMpDhFB+/r9fPa1sfYh4ufcGODK7pA7rFAVuRoI4TTMmThGvCHlJGDANL/j5jx///NlI4h0lxfXVnD5RAc4rVXOChoobgMQhxJDzPoL6eOShQfSieKGw7k+3v98y6xIhmKlNJMJBe5OBWzqHkyuBO9VNIJi8QFug/huDrNn1giZi2293M5u3JT1mYIpMrHqj/xCNAfccTuFFINCsAoChgaitwy6SEcZo5/tmF7+J5MY8jnCFm95hkLV8ir4IYmE4PKYVKIOpGKBc2CKTeE5zv+JriWD4dgtl6LpwkQJxIMNr3rGMxiPIO3dMdUjXz+xiQCX2TjaDzCGmaCIHLdJ7r/VYxpNM4ePHTILTSAJKIhhS7RSxmooJJBXwXhZB/8SKMsDiavxkzG+DJ7TomGbqvn3oR4DmCNzsdK8V3qOrQvMWVMHQnXY7dMeYhzbQm2vgsWXHTIqT+ETDTHqEp4rI413nRZ6CXpnJWFIQQwWNDf636QLNPspjRNDvpvrNInU12x1xI0Ivs7QgP9mNq6lwBKdVv8/B0DKdKvdeH3OoPpJS2pB70vZCnbL0XcuihnfGjY3dlU5dnvsYLvig0BA4MgZQaLgMOmqAUxDjKIZcLJ1zU5xPgB1I7KggPl/X0Ucd2nfrzXAXy0+4DMyAOU8nUNgiT5eetL15BtLxuOYMFoXTLP5j6oQQLp0gHgoRCcNolxCfcYOTdBVoulL3B1FF2FGvSDbMuaAau/fhDfVbmMsAerqvtSl4N/UAjGfRp0DGpmFC0AfKxcXirJt+CCadKRLRMSeafNYxDKDGKSWUYfTWBt3QfgEHJSUe0/o6v0KOXTbYsYyIObTV8WYXxXt/BC0AQaFJ1pv9W0tCfRnMQRF2fQ93GCeWQxJV/DGeJmIeJsI4jD37cBJsEJHhTiKu55Ct3bfDoehSvi8klPo6fj9gLKPepxjcjzk8kse5ECVgr8hwer3bVcaJ9FQQBQ89abmTcBFD7/V/H+TqjhawHJ3EcY0RLiGFUkWY69uXTUd+TP881GtMbUQPElkOxeQxPB3ly1HFZnglGDWhXbkgpk7X89VBodq57gWQXo8djvu4aCx/VC5SHqhBG50DLqWyRLfs0KXBLN8SR4l4D05KrrF//G343xe6lT6NQselqY1q0IhQ4KgTK/K8aNs41V6qb26wjF5TjPrzfNokN3pYRR2xDHY97gyyxX8qMS9IZDTQUYTwmGNxS8T3uF4/EO8/IhUyFlIKzNAsSdvEAX+A5J/BO7C8YB8zcoFkYeqwi0KweP0YV5r9lz5BvtnikNRALqQmvfpkJmevAM+Q2e8+dscY1/c5sUjHhGSmphjNJQTE7noADqoEcvAEhWo/oWVk/+ED6mGP+rgNOiNEofpJapoagzFwLhKsxRQg+MLOgT1yUbyP+hDGBS6e8j7mP3huJYmgU8ShLICvBBA0Me1WGAhk+uFf8afz0Pw5brPhj5vy/fdygfFEJS7Anq+Ewf33Yh5y3Z8vpli7LODNpL/3f9jD/p0ZnVoi4X2iSaZ0ZaDBfzAPZy31MSsnZ1LwgBIcy0DtPGHgBPW3zylFa+r3qNW/LyRWlx6/qUJclfktHz+izhxMuSvP2pAq5d7TUP3brcC/DC1M3AOIC5zeto/NwG06FyHvLfpQrB21V+pPv31iXEhBkKyBDgLKXgMQpA/Lib7ScLEcNIyCHlIeRsdevSMxgB2JpHmXSzr1Vty925EA6P33VDAGpMJN00eohfhVnlC0eWzpQrfNGPTT5ka955roBOPwLkSfMWVzKeV0SLTRD0T2eYbsIbhxR5lQIr3f+XQMWQ5cehwrNdLjPQoq/UJR/1lT+6vj70eXY/HeTDHx6XjIvfuZ6CR1JKQhYMLB0mEAkmgyZpvhWMb0OQHNidATfMp9WeWOmO4FCHiinbdIR4AN/qp+OS10FmH6+IUfsqU2PSJn3eccobsHl4UyHv8fh8PL05dcArcAAAAASUVORK5CYII=";
function ltCaso(seme) { var r = seme; return function () { r = (r * 16807) % 2147483647; return r / 2147483647; }; }
// il bordo rifilato male: un poligono solo, calcolato una volta, che taglia tutti i fogli
function ltStrappo() {
  var a = ltCaso(4242), p = [], i, N = 30, M = 44, d = 1.6;
  function passo(max) { d += (a() - 0.5) * 1.5; if (a() < 0.1) d = max; if (a() < 0.12) d = 0.3; d = Math.max(0, Math.min(max, d)); return d.toFixed(1); }
  for (i = 0; i < N; i++) p.push((i / N * 100).toFixed(1) + "% " + passo(4) + "px");
  for (i = 0; i < M; i++) p.push("calc(100% - " + passo(3.4) + "px) " + (i / M * 100).toFixed(1) + "%");
  for (i = N; i > 0; i--) p.push((i / N * 100).toFixed(1) + "% calc(100% - " + passo(4.4) + "px)");
  for (i = M; i > 0; i--) p.push(passo(3.4) + "px " + (i / M * 100).toFixed(1) + "%");
  return "polygon(" + p.join(",") + ")";
}
// la filigrana: la lanterna del palazzo dentro la carta, che si vede appena
function ltFiligrana(colore, forza) {
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 170' fill='none' stroke='" + (colore || "#5e4018") + "' stroke-opacity='" + (forza || ".065") + "' stroke-width='2.2' stroke-linejoin='round' stroke-linecap='round'><path d='M60 4v10M48 26a12 12 0 0 1 24 0'/><path d='M38 42h44L72 26H48z'/><path d='M42 42 34 134h52L78 42z'/><path d='M26 134h68v12H26z'/><path d='M60 68c14 15 14 34 0 48-14-14-14-33 0-48z'/><path d='M40 150h40L60 166z'/></svg>";
  return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
}
// chi non ha la faccia caricata: una sagoma scura, mai un disco di colore
function ltSagoma() {
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 53' preserveAspectRatio='none'><path d='M22 11a9.6 11 0 1 1 0 22 9.6 11 0 0 1 0-22zM3 53c1-11 9-17 19-17s18 6 19 17z' fill='#1f120a'/></svg>";
  return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
}
// il bordo a dentelli dei campioni di stoffa: un poligono solo, come le forbici da sarta
function ltDentelli() {
  var p = [], i, N = 16, M = 9, d = 2.4;
  for (i = 0; i <= N * 2; i++) p.push((i / (N * 2) * 100).toFixed(2) + "% " + (i % 2 ? d : 0) + "px");
  for (i = 1; i <= M * 2; i++) p.push("calc(100% - " + (i % 2 ? d : 0) + "px) " + (i / (M * 2) * 100).toFixed(2) + "%");
  for (i = N * 2 - 1; i >= 0; i--) p.push((i / (N * 2) * 100).toFixed(2) + "% calc(100% - " + (i % 2 ? d : 0) + "px)");
  for (i = M * 2 - 1; i > 0; i--) p.push((i % 2 ? d : 0) + "px " + (i / (M * 2) * 100).toFixed(2) + "%");
  return "polygon(" + p.join(",") + ")";
}
// il sigillo di ceralacca: una goccia irregolare e il cerchio premuto; con la lanterna del palazzo quando è stato impresso
function ltCera(conLanterna, pallida) {
  var a = ltCaso(977), n = 11, pt = [], i, d = "";
  for (i = 0; i < n; i++) { var an = i / n * 6.2832, r = 27.5 + a() * 3.6; pt.push([32 + Math.cos(an) * r, 32 + Math.sin(an) * r]); }
  for (i = 0; i < n; i++) { var q = pt[i], w = pt[(i + 1) % n], mx = (q[0] + w[0]) / 2, my = (q[1] + w[1]) / 2; d += (i ? "" : "M" + ((pt[n - 1][0] + q[0]) / 2).toFixed(1) + " " + ((pt[n - 1][1] + q[1]) / 2).toFixed(1)) + "Q" + q[0].toFixed(1) + " " + q[1].toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1); }
  var lan = "<path d='M29 21.4a3 3 0 0 1 6 0M26.4 24.6h11.2l-2.1-3.2h-7zM27.3 24.6 26 40.4h12l-1.3-15.8zM24.6 40.4h14.8v2.8H24.6zM32 28.6c2.5 2.7 2.5 6 0 8.4-2.5-2.4-2.5-5.7 0-8.4z'";
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><radialGradient id='a' cx='.34' cy='.28' r='.9'><stop offset='0' stop-color='" + (pallida ? "#f4ead4" : "#dd5a64") + "'/><stop offset='.42' stop-color='" + (pallida ? "#ddc9a2" : "#a92433") + "'/><stop offset='1' stop-color='" + (pallida ? "#a98c5e" : "#570c17") + "'/></radialGradient><radialGradient id='b' cx='.62' cy='.72' r='.8'><stop offset='0' stop-color='" + (pallida ? "#efe2c6" : "#a62735") + "'/><stop offset='1' stop-color='" + (pallida ? "#d3bc90" : "#6d131d") + "'/></radialGradient></defs>" +
    "<path d='" + d + "z' fill='#3a0710' opacity='.45' transform='translate(1.1 1.8)'/><path d='" + d + "z' fill='url(#a)'/><path d='" + d + "z' fill='none' stroke='#f0a0a0' stroke-opacity='.3'/>" +
    "<circle cx='32' cy='32' r='22' fill='url(#b)' stroke='" + (pallida ? "#8a6d44" : "#470912") + "' stroke-width='1.7'/><circle cx='32.5' cy='32.7' r='22.2' fill='none' stroke='#ee9a9a' stroke-opacity='.42' stroke-width='.8'/>" +
    (conLanterna ? lan + " fill='#ee9a9a' fill-opacity='.4' transform='translate(.5 .6)'/>" + lan + " fill='#4c0a13'/>" : "") + "</svg>";
  return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
}
// il segno di spunta tirato a penna: chi ha già votato
function ltSpunta() {
  var svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path d='M2.2 8.8c1.3 1 2.4 2.3 3.5 4.2C7.5 8.4 10.3 5 13.9 2.9' fill='none' stroke='#1d5a3b' stroke-width='2.3' stroke-linecap='round' stroke-linejoin='round'/></svg>";
  return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
}
function cssRegistro() {
  return `
:root{--lt-ease:cubic-bezier(.22,1,.36,1);--r-carta:#ecdfc4;--r-chiara:#f8f0de;--r-scura:#d9c59c;--r-ink:#28180d;--r-ink2:#54402b;--r-ink3:#755d42;--r-filo:rgba(84,60,34,.36);--r-oro:#8a6519;--r-ottone:#c39a48;--r-ottone-ch:#efd595;--r-cera:#8f1d2b;--r-cera-ch:#bb3445;--r-cera-sc:#5c0f1b;--r-verde:#1d5a3b;--r-viola:#4a3678;--r-ardesia:#2c4660;--r-crema:#fff1da;--r-serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,"Times New Roman",serif;--r-sans:-apple-system,BlinkMacSystemFont,"SF Pro Text","SF Pro Display","Helvetica Neue","Inter",system-ui,sans-serif;--r-grana:url(data:image/png;base64,@GRANA@);--r-sigillo:@SIGILLO@;--r-sigillo-vuoto:@VUOTO@;--r-sigillo-pallido:@PALLIDO@;--r-filigrana:@FILIGRANA@;--r-sagoma:@SAGOMA@;--r-spunta:@SPUNTA@;--r-lanterna:@LANTERNA@;--r-seppia:rgba(84,60,34,.18);--r-seppia2:rgba(84,60,34,.3);--r-strappo:@STRAPPO@;--r-dentelli:@DENTELLI@;--r-tavolo:radial-gradient(85% 55% at 4% -4%,rgba(255,170,76,.36),rgba(255,170,76,0) 65%),radial-gradient(90% 70% at 104% 106%,rgba(104,16,40,.66),rgba(104,16,40,0) 70%),repeating-linear-gradient(91deg,rgba(255,214,160,.035) 0 1px,rgba(0,0,0,0) 1px 6px,rgba(0,0,0,.13) 6px 7px,rgba(0,0,0,0) 7px 17px),repeating-linear-gradient(88.5deg,rgba(0,0,0,0) 0 38px,rgba(255,214,160,.03) 38px 41px,rgba(0,0,0,0) 41px 73px),linear-gradient(165deg,#34211a,#1c110b)}

/* il tavolo di noce e velluto sotto i fogli */
.lt-velo:has(>.lt-riu),.lt-velo:has(>.lt-computer),.lt-velo:has(>.lt-svela),.lt-velo:has(>.lt-vince),.lt-velo:has(>.lt-lenz){background:var(--r-tavolo)}

/* il colore detto a parole: la tinta del telo, una pezzetta di stoffa e il suo nome. Sulla carta scrive sempre l'inchiostro */
.lt-tinta{display:inline-flex;align-items:center;gap:3px;min-width:0;font:italic 12.5px/1 var(--r-serif);color:var(--r-ink2);white-space:nowrap}
.lt-tinta i{flex:none;width:9px;height:9px;border-radius:1.5px;box-shadow:inset 0 0 0 .5px rgba(20,10,4,.6),0 0 0 .5px rgba(84,60,34,.4)}
.lt-pz{display:inline-block;flex:none;width:8px;height:8px;margin-right:4px;border-radius:1.5px;vertical-align:.02em;box-shadow:0 0 0 1px rgba(241,232,214,.4)}
.lt-foglio .lt-pz{box-shadow:inset 0 0 0 .5px rgba(20,10,4,.6),0 0 0 .5px rgba(84,60,34,.4)}
.lt-riu .chat .tc{font-style:italic;font-size:13px;color:var(--r-ink2)}
.lt-riu:not(.una) .carta.spento .lt-tinta,.lt-riu:not(.una) .carta.zitto .lt-tinta{gap:0;font-size:0}
.lt-riu:not(.una) .carta.rete .lt-tinta{display:none}
.lt-scena:not(.oriz) .lt-riu:not(.una)[data-fase="vota"] .carta.votato .lt-tinta{gap:0;font-size:0}
.lt-esp .txt .lt-tinta{justify-content:center;font-size:14.5px}.lt-esp .txt .lt-tinta i{width:11px;height:11px}
.lt-esp .rg .su .lt-tinta{margin-left:3px;font-size:12px}
.lt-vince .u .lt-tinta{justify-content:center;max-width:64px;font-size:11.5px}.lt-vince .u .lt-tinta i{width:8px;height:8px}
.lt-ultima .lt-ruolo .lt-tinta{vertical-align:baseline;font-size:12px}
.lt-scambio .griglia button .lt-pz{margin-right:5px}

/* i campioni di stoffa: pezzi tagliati con le forbici a dentelli, appuntati sul Registro */
.lt-lenz.lt-foglio{box-sizing:border-box;width:100%;max-width:460px;max-height:100%;display:flex;flex-direction:column;padding:15px 16px 12px;animation:ltGira .24s var(--lt-ease) both}
.lt-lenz .testa{flex:none;display:flex;align-items:center;justify-content:space-between;min-height:40px}
.lt-lenz h3{margin:0;font-size:23px}
.lt-lenz .campioni{flex:1 1 auto;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:max-content;gap:7px 8px;padding:3px 2px 2px}
.lt-lenz .cmp{position:relative;display:grid;justify-items:center;align-content:start;min-width:0;min-height:44px;margin:0;padding:0;border:0;background:none;font-family:var(--r-serif);color:var(--r-ink);filter:drop-shadow(0 1.5px 1.5px rgba(50,28,10,.5));transition:transform .16s var(--lt-ease)}
.lt-lenz .cmp:active:not(:disabled){transform:scale(.96)}
.lt-lenz .stoffa{position:relative;display:block;width:100%;aspect-ratio:5/3;clip-path:var(--r-dentelli);background:var(--b);transition:opacity .2s var(--lt-ease),filter .2s var(--lt-ease)}
.lt-lenz .stoffa::before{content:"";position:absolute;inset:0;opacity:.62;background:linear-gradient(112deg,transparent 12%,var(--l) 25%,transparent 40%,transparent 58%,var(--l) 70%,transparent 84%)}
.lt-lenz .stoffa::after{content:"";position:absolute;inset:0;opacity:.68;background:linear-gradient(112deg,transparent 30%,var(--s) 45%,transparent 58%),linear-gradient(112deg,transparent 80%,var(--s) 100%)}
.lt-lenz .nm{max-width:100%;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:italic 700 15px/1.1 var(--r-serif)}
.lt-lenz .chi{display:block;max-width:100%;min-height:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:12px/13px var(--r-serif);color:var(--r-ink3)}
.lt-lenz .cmp.preso .stoffa{opacity:.46;filter:saturate(.6)}
.lt-lenz .cmp.preso .nm{color:var(--r-ink3);font-weight:400}.lt-lenz .cmp.preso .chi{color:var(--r-ink2);font-weight:700}
.lt-lenz .cmp.preso:disabled{opacity:1}
.lt-lenz .cmp.mio .chi{color:var(--r-cera);font-weight:700}
.lt-lenz .cmp.mio::after,.lt-lenz .cmp.atteso::after{content:"";position:absolute;right:-3px;top:-3px;width:30px;height:30px;background:var(--r-sigillo) center/100% 100% no-repeat;transform:rotate(-10deg);animation:ltSigillo .22s var(--lt-ease) both}
.lt-lenz .cmp.atteso::after{opacity:.55}
.lt-lenz .nota{flex:none;margin:6px 0 0;text-align:center;font:italic 14px/1.2 var(--r-serif);color:var(--r-ink2)}
.lt-scena.oriz .lt-lenz.lt-foglio{max-width:760px;padding:10px 16px 8px}
.lt-scena.oriz .lt-lenz .testa{min-height:34px}
.lt-scena.oriz .lt-lenz .campioni{grid-template-columns:repeat(6,minmax(0,1fr))}
.lt-scena.oriz .lt-lenz .stoffa{aspect-ratio:7/3}

/* il foglio: carta rifilata male, il foglio sotto, candela in alto a sinistra, filo d'oro */
.lt-foglio{position:relative;isolation:isolate;background:none;border:0;border-radius:0;box-shadow:0 16px 34px rgba(0,0,0,.6);color:var(--r-ink);font-family:var(--r-serif);letter-spacing:0;font-variant-numeric:lining-nums}
.lt-foglio::before{content:"";position:absolute;inset:0;z-index:-1;clip-path:var(--r-strappo);box-shadow:inset 0 0 46px rgba(112,70,24,.36);background:linear-gradient(var(--r-ottone),var(--r-ottone)) 8px 8px/calc(100% - 16px) 1px no-repeat,linear-gradient(var(--r-ottone),var(--r-ottone)) 8px calc(100% - 8px)/calc(100% - 16px) 1px no-repeat,linear-gradient(var(--r-ottone),var(--r-ottone)) 8px 8px/1px calc(100% - 16px) no-repeat,linear-gradient(var(--r-ottone),var(--r-ottone)) calc(100% - 8px) 8px/1px calc(100% - 16px) no-repeat,radial-gradient(130% 70% at -4% -6%,rgba(255,206,120,.66),rgba(255,206,120,0) 60%),radial-gradient(100% 70% at 108% 108%,rgba(92,54,20,.34),rgba(92,54,20,0) 62%),radial-gradient(10px 8px at 84% 7%,rgba(118,74,28,.22),rgba(118,74,28,0)),radial-gradient(16px 12px at 7% 64%,rgba(118,74,28,.14),rgba(118,74,28,0)),var(--r-filigrana) 50% 58%/min(62%,250px) auto no-repeat,linear-gradient(rgba(236,223,196,.42),rgba(236,223,196,.42)),var(--r-grana),linear-gradient(var(--r-carta),var(--r-carta))}
.lt-foglio::after{content:"";position:absolute;inset:5px -4px -6px 3px;z-index:-2;clip-path:var(--r-strappo);transform:rotate(.55deg);background:var(--r-grana),linear-gradient(170deg,#c9b288,#a48a5e)}
.lt-foglio h2,.lt-foglio h3{margin:0;color:var(--r-ink);font-family:var(--r-serif);font-weight:700;letter-spacing:0;line-height:1.12}
.lt-foglio .occh{margin:0;font:700 11px/1.25 var(--r-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--r-ink3)}
.lt-foglio button{-webkit-tap-highlight-color:transparent;touch-action:manipulation;cursor:pointer;transition:transform .16s var(--lt-ease),background-color .2s var(--lt-ease),color .2s var(--lt-ease),box-shadow .2s var(--lt-ease),opacity .2s var(--lt-ease)}
.lt-foglio button:active:not(:disabled){transform:scale(.95)}
.lt-foglio button:focus-visible,.lt-foglio input:focus-visible{outline:2px solid var(--r-oro);outline-offset:1px}
.lt-foglio .btn{width:auto;margin:0;min-height:46px;border:0;border-radius:4px;font:700 16px/1.1 var(--r-serif);box-shadow:none;filter:none}
.lt-foglio .btn.btn-fantasma{background:rgba(255,250,236,.5);color:var(--r-ink);box-shadow:inset 0 0 0 1.5px var(--r-ink2)}
.lt-foglio .btn.btn-primario{background:linear-gradient(180deg,var(--r-cera-ch),var(--r-cera));color:var(--r-crema);box-shadow:inset 0 0 0 1px var(--r-ottone),0 2px 5px rgba(60,16,10,.35)}
.lt-foglio .btn:disabled{opacity:.45}
.lt-foglio .lt-chiudi{position:static;flex:none;width:44px;height:44px;margin:-4px -6px -4px 0;padding:0;border:0;border-radius:50%;background:none;color:var(--r-ink);font:400 27px/44px var(--r-serif);text-align:center}
.lt-pannello>.lt-chiudi{top:3px;right:3px}
.lt-foglio>.lt-chiudi{position:absolute;top:8px;right:8px;margin:0}
.lt-foglio .lt-chiudi:active{background:rgba(84,60,34,.14)}

/* la riunione: il registro aperto */
.lt-foglio .stemma{display:inline-block;flex:none;width:20px;height:23px;color:var(--r-cera-sc);vertical-align:-6px}
.lt-foglio .intest{display:flex;align-items:center;justify-content:center;gap:7px;min-width:0;font:700 11px/1.2 var(--r-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--r-ink2);white-space:nowrap}
.lt-foglio .intest::before,.lt-foglio .intest::after{content:"";flex:1 1 0;min-width:6px;height:2px;border-top:1px solid var(--r-filo);border-bottom:1px solid var(--r-filo)}
.lt-foglio .pall{display:block;background:var(--r-sagoma) center/100% 100% no-repeat,linear-gradient(#a08a6d,#6d5740)}
.lt-riu{--vn:66px;--vv:150px;--rh:66px;display:flex;flex-direction:column;gap:5px;height:100%;max-height:900px;padding:14px 15px 12px}
.lt-riu .testa{position:relative;flex:none;display:grid;margin:0;grid-template-columns:78px minmax(0,1fr) auto;grid-template-areas:'i i i' 'c t o' 'p p p';align-items:center;column-gap:9px;row-gap:3px;padding-bottom:5px;border-bottom:3px double var(--r-filo)}
.lt-riu .intest{grid-area:i}
.lt-riu .chi{grid-area:c;position:relative;display:flex;justify-content:center}
.lt-riu .chi .faccia,.lt-riu .chi .pall{display:block;flex:none;width:48px;height:58px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1.5px var(--r-ottone),0 0 0 2.5px rgba(40,20,8,.4),0 2px 4px rgba(40,20,8,.45)}
.lt-riu .chi .faccia{background:linear-gradient(#4a3325,#21150e)}
.lt-riu .fase{position:absolute;left:50%;bottom:-6px;box-sizing:border-box;padding:2px 5px 1px;border:3px double var(--r-ink2);border-radius:3px;font:700 12px/1.1 var(--r-serif);letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;color:var(--r-ink2);background:rgba(248,240,222,.88);transform:translateX(-50%) rotate(-6deg)}
.lt-riu[data-fase="vota"] .fase{border-color:var(--r-cera);color:var(--r-cera);font-size:13px}
.lt-riu[data-fase="esito"] .fase{border-color:var(--r-cera);color:var(--r-cera);font-size:11.5px;letter-spacing:.03em}
.lt-riu[data-fase="vota"] .fase.cade{animation:ltTimbroV .24s var(--lt-ease) both}
.lt-riu[data-fase="esito"] .fase.cade{animation:ltTimbroE .24s var(--lt-ease) both}
@keyframes ltTimbroV{0%{transform:translateX(-50%) rotate(-14deg) scale(1.7);opacity:0}60%{transform:translateX(-50%) rotate(-5deg) scale(.95);opacity:1}100%{transform:translateX(-50%) rotate(-6deg) scale(1);opacity:1}}
@keyframes ltTimbroE{0%{transform:translateX(-50%) rotate(-14deg) scale(1.7);opacity:0}60%{transform:translateX(-50%) rotate(-5deg) scale(.95);opacity:1}100%{transform:translateX(-50%) rotate(-6deg) scale(1);opacity:1}}
.lt-riu .tit{grid-area:t;min-width:0}
.lt-riu .occh .stemma,.lt-riu .occh .reg{display:none}
.lt-riu h3{font-size:19px;margin:1px 0 0}
.lt-riu .perche{grid-area:p;margin:0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;font:italic 15px/18px var(--r-serif);color:var(--r-ink2);transition:color .2s var(--lt-ease)}
.lt-riu .perche.chiede{font-style:normal;font-weight:700;color:var(--r-cera)}
@property --lt-giro{syntax:"<number>";inherits:false;initial-value:100}
.lt-riu .timer{--lt-giro:100;transition:--lt-giro .24s var(--lt-ease),color .2s var(--lt-ease);grid-area:o;flex:none;width:58px;height:58px;box-sizing:border-box;border-radius:50%;display:grid;place-items:center;font:700 24px/1 var(--r-serif);font-variant-numeric:tabular-nums lining-nums;color:var(--r-ink);background:radial-gradient(circle,var(--r-chiara) 0 60%,rgba(0,0,0,0) 61%),conic-gradient(var(--r-ink) calc(var(--lt-giro)*1%),rgba(84,60,34,.2) 0);box-shadow:0 0 0 1px var(--r-filo),0 1px 3px rgba(60,36,14,.35)}
.lt-riu[data-fase="vota"] .timer{background:radial-gradient(circle,var(--r-chiara) 0 60%,rgba(0,0,0,0) 61%),conic-gradient(var(--r-cera) calc(var(--lt-giro)*1%),rgba(84,60,34,.2) 0)}
.lt-riu .timer.stretta{color:var(--r-cera)}
.lt-riu .timer.batte-a{animation:ltBattito1 .24s var(--lt-ease)}
.lt-riu .timer.batte-b{animation:ltBattito2 .24s var(--lt-ease)}
@keyframes ltBattito1{0%{transform:scale(1.09)}100%{transform:none}}
@keyframes ltBattito2{0%{transform:scale(1.09)}100%{transform:none}}

/* gli ospiti: righe tirate sul foglio. Di solito due colonne di registro (nome sopra, tasti sotto); con .una, quando c'è spazio, una riga per ospite a colonne Ospite · Note · Voto */
.lt-riu .grid{position:relative;flex:1 1 0;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:var(--rh);align-content:start;column-gap:13px}
.lt-riu .grid::-webkit-scrollbar{display:none}
.lt-riu .grid::before{content:"";position:absolute;top:0;bottom:0;left:50%;width:1px;margin-left:-2px;border-left:1px solid var(--r-filo);border-right:1px solid var(--r-filo);pointer-events:none}
.lt-riu .colonne{display:none;grid-column:1/-1}
.lt-riu .colonne span{min-width:0}
.lt-riu .colonne,.lt-riu .colonne i{font:700 11px/16px var(--r-sans);letter-spacing:.1em;text-transform:uppercase;color:var(--r-ink3)}
.lt-riu .colonne i{font-style:normal;letter-spacing:.04em;text-transform:none;font-size:11px}
.lt-riu .leg{display:none;align-items:center;gap:3px}
.lt-riu .leg svg.ico{width:13px;height:13px;stroke-width:2.5;color:var(--r-cera)}
.lt-riu .leg svg.ico~svg.ico{margin-left:7px;color:var(--r-verde)}
.lt-riu .carta{position:relative;display:grid;grid-template-columns:27px minmax(0,1fr) auto;grid-template-rows:minmax(24px,1fr) 44px;grid-template-areas:'f n s' 'a a a';column-gap:6px;align-items:center;padding:2px 1px 1px;font-family:var(--r-serif);color:var(--r-ink);border-bottom:1px solid var(--r-seppia2);transition:background-color .2s var(--lt-ease)}
.lt-riu .carta>.faccia,.lt-riu .carta>.pall{grid-area:f;display:block;width:27px;height:29px;margin-top:3px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1px var(--r-ottone),0 0 0 2px rgba(40,20,8,.32)}
.lt-riu .carta>.faccia{background:linear-gradient(#4a3325,#21150e)}
.lt-riu .carta .nm{grid-area:n;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:italic 700 16.5px/1.15 var(--r-serif);color:var(--r-ink)}
.lt-riu .carta .nm.buono{color:var(--r-verde);text-decoration:underline}.lt-riu .carta .nm.cattivo{color:var(--r-cera);text-decoration:underline}
.lt-riu .carta .nt{grid-area:s;display:flex;align-items:center;justify-content:flex-end;gap:4px;min-width:0;white-space:nowrap;font:italic 12.5px/1 var(--r-serif);color:var(--r-ink3)}
.lt-riu .carta .tu{font-weight:700;color:var(--r-ink2)}
.lt-riu .carta .st:empty{display:none}
.lt-riu .carta.spento .st,.lt-riu .carta.zitto .st,.lt-riu .carta.rete .st{flex:none;box-sizing:border-box;padding:2px 5px 1px;border:2.5px double currentColor;border-radius:2px;font:700 11.5px/1.1 var(--r-serif);letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.lt-riu .carta.spento .st{color:var(--r-ink2);background:rgba(248,240,222,.5);transform:rotate(-4deg)}
.lt-riu .carta.rete .st{color:var(--r-oro);background:rgba(248,240,222,.5);transform:rotate(-3deg)}
.lt-riu .carta.zitto .st{padding:3px 6px 2px;border:0;color:var(--r-chiara);background:var(--r-ink);box-shadow:1px 1px 0 rgba(40,20,8,.3);clip-path:polygon(0 8%,3% 0,98% 6%,100% 92%,96% 100%,2% 94%);transform:rotate(-2deg)}
.lt-riu .carta.spento>.faccia,.lt-riu .carta.spento>.pall{filter:saturate(.6) contrast(.86);opacity:.78}
.lt-riu .carta.spento .nm{color:var(--r-ink3);text-decoration:line-through;text-decoration-thickness:1.5px}
.lt-riu .carta.zitto::before{content:"";pointer-events:none;position:absolute;left:0;top:21px;width:28px;height:6px;background:var(--r-ink);box-shadow:0 1px 1px rgba(0,0,0,.4);transform:rotate(-9deg);z-index:1}
.lt-riu .carta .vt{grid-area:a;justify-self:start;align-self:center;display:flex;min-width:0;padding-left:1px}
.lt-riu .carta .vt:empty{display:none}
.lt-riu .carta .vt .faccia,.lt-riu .carta .vt .pall{display:block;flex:none;width:21px;height:24px;margin-right:-5px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1px var(--r-ottone),0 0 0 2px var(--r-chiara);animation:ltPop .26s var(--lt-ease) both}
.lt-riu .carta .vt .faccia{background:linear-gradient(#4a3325,#21150e)}
@keyframes ltPop{from{transform:scale(0);opacity:0}60%{transform:scale(1.3)}to{transform:scale(1);opacity:1}}
.lt-riu .carta .az{grid-area:a;display:flex;gap:4px;align-items:center;justify-content:flex-end;min-width:0}
.lt-riu .carta .az:empty{display:none}
.lt-riu .carta .az button{position:relative;z-index:0;flex:1 1 0;min-width:0;height:44px;margin:0;padding:0 3px;border:0;background:none;display:flex;align-items:center;justify-content:center;gap:3px;font:700 13px/1 var(--r-serif);color:var(--r-ink)}
.lt-riu .carta .az button::before{content:"";position:absolute;inset:6px 0;z-index:-1;border-radius:3px;background:rgba(255,250,236,.6);box-shadow:inset 0 0 0 1px var(--r-filo);transition:background-color .2s var(--lt-ease),box-shadow .2s var(--lt-ease)}
.lt-riu .carta .az button svg.ico{width:13px;height:13px;stroke-width:2.6}
.lt-riu .carta .az .dubbio{flex:1.3 1 0;color:var(--r-cera)}.lt-riu .carta .az .fido{color:var(--r-verde)}
.lt-riu .carta .az button.fatto::before{animation:ltLampo .3s var(--lt-ease)}
@keyframes ltLampo{0%{background:var(--r-ottone-ch)}100%{background:rgba(255,250,236,.6)}}
.lt-riu .carta .az .ind{flex:0 0 34px;gap:1px;color:var(--r-viola)}
.lt-riu .carta[data-ak*="ind"] .az .dubbio,.lt-riu .carta[data-ak*="ind"] .az .fido{font-size:11.5px}
.lt-riu .carta[data-ak*="ind"] .az .dubbio svg.ico,.lt-riu .carta[data-ak*="ind"] .az .fido svg.ico{display:none}
.lt-riu .carta[data-ak*="ind"] .az .mio span{display:none}

/* il voto: il sigillo di ceralacca */
.lt-riu .carta .az .vota{flex:none;width:48px;height:48px;margin:-2px 0;border-radius:50%;background:var(--r-sigillo-vuoto) center/100% 100% no-repeat;font:700 14px/1 var(--r-serif);letter-spacing:.01em;color:var(--r-crema);text-shadow:0 1px 0 rgba(50,0,8,.9),0 0 3px rgba(50,0,8,.45);filter:none}
.lt-riu .carta .az .vota.me{background-image:var(--r-sigillo-pallido);font-size:12px;letter-spacing:-.02em;color:var(--r-ink);text-shadow:0 1px 0 rgba(255,250,236,.6)}
.lt-riu .carta .az .vota:active:not(:disabled){transform:scale(.86) rotate(-6deg)}
@media (hover:hover){.lt-riu .carta .az .vota:hover{transform:translateY(-1px) rotate(-3deg)}}
.lt-riu .carta .az .vota::before{display:none}.lt-riu .carta .az .vota svg.ico{display:none}
.lt-riu .carta .az .conf{flex:none;height:44px;padding:0 12px;border-radius:22px;background:linear-gradient(180deg,var(--r-cera-ch),var(--r-cera) 60%,var(--r-cera-sc));font:700 14px/1 var(--r-serif);color:var(--r-crema);box-shadow:0 0 0 2px var(--r-ottone-ch),0 3px 8px rgba(60,10,10,.55);animation:ltSu .18s var(--lt-ease) both}
.lt-riu .carta .az .conf::before{display:none}
@keyframes ltSu{from{transform:scale(.8)}to{transform:none}}
.lt-riu .carta .az .mio{display:flex;align-items:center;gap:3px;font:italic 700 13px/1 var(--r-serif);color:var(--r-cera);white-space:nowrap}
.lt-riu .carta .az .sig{display:block;flex:none;width:50px;height:50px;margin:-3px 0;background:var(--r-sigillo) center/100% 100% no-repeat;transform:rotate(-10deg);transition:width .2s var(--lt-ease),height .2s var(--lt-ease);animation:ltSigillo .22s var(--lt-ease) both}
.lt-riu[data-fase="esito"] .carta .az .sig{width:34px;height:34px;margin:0}
@keyframes ltSigillo{0%{transform:translateY(-12px) scale(1.9) rotate(-28deg);opacity:0}58%{transform:scale(.9) rotate(-8deg);opacity:1}100%{transform:scale(1) rotate(-10deg);opacity:1}}
.lt-riu .carta.mio-voto{background-color:rgba(187,52,69,.11)}
.lt-riu[data-fase="esito"] .carta .az .mio span{display:none}
.lt-riu:not(.una)[data-fase="vota"] .carta.votato .nt::after{content:"votato";padding-left:14px;font-weight:700;color:var(--r-verde);background:var(--r-spunta) 0 50%/12px 12px no-repeat}
.lt-riu .carta .vt:has(>:nth-child(7))>*{margin-right:-10px}
.lt-batti{animation:ltBatti .3s var(--lt-ease)}
@keyframes ltBatti{50%{background-color:rgba(195,154,72,.3)}}

/* una riga per ospite */
.lt-riu.una .grid{grid-template-columns:minmax(0,1fr);grid-template-rows:auto}
.lt-riu.una .grid::before{display:none}
.lt-riu.una .colonne{display:grid;grid-template-columns:minmax(0,1fr) var(--vv);border-bottom:1px solid var(--r-filo)}
.lt-riu.una .colonne .c2{display:none}
.lt-riu.una .colonne .c3{padding-left:6px}
.lt-riu.una .carta{grid-template-columns:40px auto minmax(0,1fr) var(--vv);grid-template-rows:minmax(0,1fr) auto auto minmax(0,1fr);grid-template-areas:'f . . a' 'f n n a' 'f c s a' 'f . . a';column-gap:0;padding:0;background-image:linear-gradient(var(--r-seppia2),var(--r-seppia2));background-size:1px 100%;background-repeat:no-repeat;background-position:calc(100% - var(--vv)) 0}
.lt-riu.una .carta>.faccia,.lt-riu.una .carta>.pall{width:33px;height:38px;margin:0 0 0 1px}
.lt-riu.una .carta .nm{align-self:end;font-size:17px;line-height:1.14}
.lt-riu.una .carta.io .nm::after{content:"\\00a0(tu)";font-size:.74em;font-weight:400;color:var(--r-ink3)}
.lt-riu.una .carta .nt{display:contents}
.lt-riu.una .carta .tu{display:none}
.lt-riu.una .carta .lt-tinta{grid-area:c;align-self:start}
.lt-riu.una .carta .st{grid-area:s;align-self:center;justify-self:start;margin:1px 0 0 6px}
.lt-riu.una.grande .carta.spento .lt-tinta,.lt-riu.una.grande .carta.zitto .lt-tinta,.lt-riu.una.grande .carta.rete .lt-tinta{gap:0;font-size:0}
.lt-riu.una .carta .az,.lt-riu.una .carta .vt{padding-left:6px}
.lt-riu.una .carta .az{padding-right:1px}
.lt-riu.una[data-fase="vota"] .carta.votato .az:empty{display:flex}
.lt-riu.una[data-fase="vota"] .carta.votato .az::before{content:"votato";flex:none;margin-right:auto;padding-left:17px;font:italic 700 13.5px/16px var(--r-serif);color:var(--r-verde);background:var(--r-spunta) 0 50%/14px 14px no-repeat}
.lt-riu.una[data-fase="vota"] .carta.votato.mio-voto .az .mio span{display:none}
.lt-riu.una .carta.zitto::before{left:0;top:calc(50% + 2px);width:35px;height:7px}
.lt-riu.una.ampia .carta{grid-template-columns:50px auto minmax(0,1fr) var(--vv)}
.lt-riu.una.ampia .carta>.faccia,.lt-riu.una.ampia .carta>.pall{width:min(42px,calc(var(--rh)*.72));height:min(50px,calc(var(--rh)*.84))}
.lt-riu.una.ampia .carta .nm{font-size:19px}
.lt-riu.una.ampia .carta .lt-tinta{font-size:13.5px}
.lt-riu.una.ampia .carta .lt-tinta i{width:10px;height:10px}
.lt-riu.una.ampia .carta .st{font-size:12px}
.lt-riu.una.ampia .carta .az{gap:5px}
.lt-riu.una.ampia .carta .az .vota{width:min(60px,calc(var(--rh) - 5px));height:min(60px,calc(var(--rh) - 5px));margin:0;font-size:16px}
.lt-riu.una.ampia .carta .az .vota.me{font-size:13px}
.lt-riu.una.ampia .carta .az .sig{width:min(62px,calc(var(--rh) - 3px));height:min(62px,calc(var(--rh) - 3px));margin:0}
.lt-riu.una.ampia[data-fase="esito"] .carta .az .sig{width:34px;height:34px}
.lt-riu.una.ampia .carta.zitto::before{width:44px}
.lt-riu.una.grande .carta{grid-template-columns:72px auto minmax(0,1fr) var(--vv)}
.lt-riu.una.grande .carta>.faccia,.lt-riu.una.grande .carta>.pall{width:60px;height:72px}
.lt-riu.una.grande .carta .nm{font-size:22px}
.lt-riu.una.grande .carta .lt-tinta{gap:4px;font-size:15px}
.lt-riu.una.grande .carta .lt-tinta i{width:12px;height:12px}
.lt-riu.una.grande .carta .az .vota{width:70px;height:70px;font-size:18px}
.lt-riu.una.grande .carta .az .vota.me{font-size:15px}
.lt-riu.una.grande .carta .az .sig{width:72px;height:72px}
.lt-riu.una.grande .carta.zitto::before{top:calc(50% + 4px);width:62px;height:10px}
.lt-riu.una.grande .carta .st{font-size:13px}

/* le note a margine */
.lt-riu .foglietto{position:absolute;z-index:2;left:11px;right:11px;bottom:59px;height:60%;box-sizing:border-box;display:flex;flex-direction:column;gap:5px;padding:2px 9px 9px;border-radius:3px;background:var(--r-grana),linear-gradient(180deg,var(--r-chiara),var(--r-carta));box-shadow:inset 0 0 0 1px var(--r-ottone),0 0 0 1px rgba(60,36,14,.3),0 -6px 20px rgba(60,36,14,.42);opacity:0;visibility:hidden;transform:translateY(12px);transition:transform .24s var(--lt-ease),opacity .18s var(--lt-ease),visibility 0s linear .24s}
.lt-riu .foglietto.su{opacity:1;visibility:visible;transform:none;transition-delay:0s}
.lt-riu .foglietto .cima{flex:none;display:flex;align-items:center;justify-content:space-between;height:36px}
.lt-riu .foglietto .ti{font:700 11px/1 var(--r-sans);letter-spacing:.13em;text-transform:uppercase;color:var(--r-ink3)}
.lt-riu .foglietto .via{flex:none;width:44px;height:44px;margin:-4px -9px -4px 0;padding:0;border:0;border-radius:50%;background:none;display:grid;place-items:center;color:var(--r-ink)}
.lt-riu .foglietto .via:active{background:rgba(84,60,34,.14)}
.lt-riu .foglietto .via svg.ico{width:18px;height:18px;stroke-width:2.4}
.lt-riu .foglietto.tastiera .cima,.lt-riu .foglietto.tastiera .rapide{display:none}
.lt-riu .big{-webkit-tap-highlight-color:transparent;position:absolute;z-index:2;grid-area:c-start/c-start/p-end/t-end;top:0;left:0;right:0;min-height:100%;box-sizing:border-box;display:flex;align-items:center;gap:9px;padding:6px 11px 6px 36px;border-radius:2px;font:italic 15px/20px var(--r-serif);color:var(--r-ink);background:var(--r-sigillo) 8px 50%/22px 22px no-repeat,var(--r-grana),linear-gradient(var(--r-chiara),var(--r-chiara));box-shadow:inset 0 0 0 1px var(--r-ottone),0 4px 12px rgba(60,36,14,.45);cursor:pointer;opacity:0;visibility:hidden;transform:translateY(-6px);transition:transform .22s var(--lt-ease),opacity .18s var(--lt-ease),visibility 0s linear .22s}
.lt-riu .big.su{opacity:1;visibility:visible;transform:none;transition-delay:0s}
.lt-riu .testa:has(.big.su) .chi,.lt-riu .testa:has(.big.su) .perche{visibility:hidden}
.lt-riu .big span{flex:1 1 auto;min-width:0}
.lt-riu .big canvas.foto{flex:none;width:92px;height:68px;border-radius:1px;box-shadow:0 0 0 2px var(--r-crema),0 1px 3px rgba(40,20,8,.45);transform:rotate(1.5deg)}
.lt-riu:not(.una) .big canvas.foto{width:82px;height:60px}
.lt-riu .chat{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;margin-top:1px;padding:0 4px 0 0;border-top:1px solid var(--r-filo);font:15px/21px var(--r-serif);color:var(--r-ink);background:repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 20px,var(--r-seppia) 20px 21px),linear-gradient(90deg,rgba(0,0,0,0) 24px,var(--r-seppia2) 24px 25px,rgba(0,0,0,0) 25px 27px,var(--r-seppia2) 27px 28px,rgba(0,0,0,0) 28px);background-attachment:local,scroll}
.lt-riu .chat p{flex:none;position:relative;margin:0;padding-left:32px}
.lt-riu .chat .pt{position:absolute;left:3px;top:1px;display:block;width:17px;height:19px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1px var(--r-ottone)}
.lt-riu .chat .faccia.pt{background:linear-gradient(#4a3325,#21150e)}
.lt-riu .chat b{font-weight:700}
.lt-riu .chat .sis{color:var(--r-ink2);font-style:italic}
.lt-riu .chat canvas.foto{flex:none;width:min(200px,70%);margin:4px 0 6px 32px}
.lt-riu .penna{flex:none;display:flex;flex-wrap:wrap;gap:5px}
.lt-riu .rapide{flex:1 1 100%;display:flex;gap:4px;min-width:0}
.lt-riu .rapide button{flex:1 1 0;height:44px;margin:0;padding:0 9px;border:0;border-radius:4px;display:flex;align-items:center;justify-content:center;gap:4px;font:700 14px/1 var(--r-serif);color:var(--r-ink);background:rgba(255,250,236,.62);box-shadow:inset 0 0 0 1px var(--r-filo);white-space:nowrap}
.lt-riu .rapide button svg.ico{width:15px;height:15px}
.lt-riu .rapide button.fatto{animation:ltLampoT .3s var(--lt-ease)}
@keyframes ltLampoT{0%{background:var(--r-ottone-ch)}100%{background:rgba(255,250,236,.62)}}
.lt-riu .scrivi{flex:1 1 100%;min-width:0;margin:0;display:flex;gap:4px}
.lt-riu .scrivi input{flex:1;min-width:0;height:44px;box-sizing:border-box;margin:0;padding:0 9px;border:0;border-radius:4px;font:16px var(--r-serif);color:var(--r-ink);background:var(--r-chiara);box-shadow:inset 0 0 0 1px var(--r-filo);-webkit-user-select:text;user-select:text;transition:box-shadow .2s var(--lt-ease)}
.lt-riu .scrivi input::placeholder{color:var(--r-ink3);font-style:italic}
.lt-riu .scrivi input:focus{outline:none;box-shadow:inset 0 0 0 1.5px var(--r-oro),0 0 0 3px rgba(195,154,72,.3)}
.lt-riu .scrivi button{flex:none;height:44px;margin:0;padding:0 11px;border:0;border-radius:4px;font:700 15px/1 var(--r-serif);color:var(--r-crema);background:var(--r-ink)}
.lt-riu .fondo{flex:none;display:flex;gap:6px;min-width:0}
.lt-riu .fondo .lt-voce{flex:none}
.lt-riu .fondo .cht{position:relative;flex:none;display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;height:44px;padding:0 11px;font:700 15px/1 var(--r-serif);white-space:nowrap}
.lt-riu .fondo .cht svg.ico{width:16px;height:16px}
.lt-riu .fondo .cht.aperta{color:var(--r-crema);background:var(--r-ink);box-shadow:none}
.lt-riu .fondo:has(>.voto[hidden]) .cht{flex:1}
.lt-riu .cht .nuovi{position:absolute;top:-9px;right:-6px;width:25px;height:25px;display:grid;place-items:center;background:var(--r-sigillo-vuoto) center/100% 100% no-repeat;font:700 11.5px/1 var(--r-sans);font-style:normal;font-variant-numeric:lining-nums;color:var(--r-crema);text-shadow:0 1px 1px rgba(60,0,10,.8);pointer-events:none;opacity:0;transform:scale(.55) rotate(-10deg);transition:transform .2s var(--lt-ease),opacity .16s var(--lt-ease)}
.lt-riu .cht .nuovi.su{opacity:1;transform:rotate(-10deg)}
.lt-riu .cht .nuovi.scatto-a{animation:ltNumero1 .24s var(--lt-ease)}
.lt-riu .cht .nuovi.scatto-b{animation:ltNumero2 .24s var(--lt-ease)}
@keyframes ltNumero1{0%{transform:scale(1.36) rotate(-16deg)}100%{transform:rotate(-10deg)}}
@keyframes ltNumero2{0%{transform:scale(1.36) rotate(-16deg)}100%{transform:rotate(-10deg)}}
.lt-riu .poteri{flex:none;display:flex;gap:6px}
.lt-riu .poteri:empty{display:none}
.lt-riu .poteri button{flex:1 1 auto;height:44px;margin:0;padding:0 11px;border:0;border-radius:4px;display:flex;align-items:center;justify-content:center;gap:5px;font:700 15px/1 var(--r-serif);color:var(--r-cera);background:rgba(255,250,236,.62);box-shadow:inset 0 0 0 1.5px var(--r-cera);white-space:nowrap}
.lt-riu .poteri button svg.ico{width:16px;height:16px}
.lt-riu .voto{flex:1 1 auto;min-width:0;display:flex}
.lt-riu .voto .salta{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;min-height:44px;height:44px;padding:0 6px;font:700 15px/1 var(--r-serif);white-space:nowrap}
.lt-riu .voto .salta svg.ico{width:16px;height:16px}
.lt-foglio .lt-vbtn{height:44px;min-height:44px;box-sizing:border-box;padding:0 10px;border:0;border-radius:4px;font:700 14px/1 var(--r-serif);color:var(--r-ink);background:rgba(255,250,236,.62);box-shadow:inset 0 0 0 1px var(--r-filo)}
.lt-foglio .lt-vbtn.parlo{color:var(--r-verde)}.lt-foglio .lt-vbtn.muto{color:var(--r-cera);box-shadow:inset 0 0 0 1.5px var(--r-cera)}
.lt-foglio .lt-vbtn.spenta{color:var(--r-ottone-ch);background:var(--r-ink);box-shadow:none;animation:none}
.lt-foglio .lt-vbtn.detto{font-size:13px;color:var(--r-cera);background:var(--r-chiara);box-shadow:inset 0 0 0 1.5px var(--r-cera);animation:none}
.lt-vbtn.detto{animation:none}

/* una zona che scorre: la sfumatura in fondo dice che c'è dell'altro */
.lt-sf::after{content:"";flex:none;display:block;grid-column:1/-1;position:sticky;left:0;right:0;bottom:0;height:26px;margin-top:-26px;pointer-events:none;background:linear-gradient(rgba(233,219,190,0),rgba(233,219,190,.97));opacity:0;transition:opacity .2s var(--lt-ease)}
.lt-sf.lt-piu::after{opacity:1}
.lt-sf{scrollbar-width:none}.lt-sf::-webkit-scrollbar{display:none}

/* un avviso della voce quando il tasto non si vede: un bigliettino in basso, non copre mai i titoli */
.lt-avviso.voce{top:auto;bottom:calc(10px + env(safe-area-inset-bottom));padding:7px 12px;border:0;border-radius:2px;font:700 14px/1.2 var(--r-serif);color:var(--r-ink);background:var(--r-grana),linear-gradient(var(--r-carta),var(--r-carta));box-shadow:0 3px 8px rgba(0,0,0,.5);transform:translate(-50%,6px) rotate(-1deg)}
.lt-avviso.voce.su{transform:translate(-50%,0) rotate(-1deg)}
/* l'host non risponde: lo stesso bigliettino, che resta finché non torna. In alto a destra sotto la voce: in basso ci sono i tasti. Sui fogli del registro in fondo, sotto la penna. Non prende i tocchi */
.lt-tace{--ltx:0;--lty:-6px;--ltr:1deg;position:absolute;right:calc(10px + env(safe-area-inset-right));top:calc(104px + env(safe-area-inset-top));z-index:5;display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:2px;font:700 14px/1.2 var(--r-serif);color:var(--r-ink);background:var(--r-grana),linear-gradient(var(--r-carta),var(--r-carta));box-shadow:0 3px 8px rgba(0,0,0,.5);white-space:nowrap;pointer-events:none;opacity:0;transform:translate(var(--ltx),var(--lty)) rotate(var(--ltr));transition:opacity .22s var(--lt-ease),transform .22s var(--lt-ease)}
.lt-tace.su{--lty:0px;opacity:1}
.lt-tace .ico{flex:none;width:15px;height:15px;color:var(--r-oro)}
.lt-velo:not([hidden])~.lt-tace{--ltx:-50%;--ltr:-1deg;left:50%;right:auto;top:auto;bottom:calc(10px + env(safe-area-inset-bottom))}

/* il verdetto: una riga di registro col timbro */
.lt-esp.lt-foglio{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;gap:12px;padding:14px 15px 13px;text-align:center;box-shadow:none;animation:ltSale .24s var(--lt-ease)}
.lt-esp.lt-foglio::after{display:none}
.lt-esp .intest{flex:none;align-self:stretch}
.lt-esp .ritr{position:relative;flex:none;width:132px;height:160px;margin-top:auto;border-radius:50%;background:linear-gradient(#4a3325,#21150e);box-shadow:0 0 0 2px var(--r-ottone),0 0 0 5px var(--r-chiara),0 0 0 6px var(--r-filo),0 6px 14px rgba(50,28,10,.45);animation:ltBotta .16s var(--lt-ease) .46s}
@keyframes ltBotta{0%{transform:none}40%{transform:translateY(3px) scale(.985)}100%{transform:none}}
.lt-esp .ritr.vuoto{background:var(--r-lanterna) center 44%/52% auto no-repeat,linear-gradient(#4a3325,#21150e)}
.lt-esp .ritr.sagoma{background:var(--r-sagoma) center/100% 100% no-repeat,linear-gradient(#a08a6d,#6d5740)}
.lt-esp .ritr .faccia{display:block;width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:top}
.lt-esp .timbro{position:absolute;left:50%;bottom:6px;box-sizing:border-box;padding:4px 10px 3px;border:3px double var(--r-cera);border-radius:3px;font:700 20px/1 var(--r-serif);letter-spacing:.08em;text-transform:uppercase;color:var(--r-cera);background:rgba(248,240,222,.86);white-space:nowrap;transform:translateX(-50%) rotate(-9deg);animation:ltTimbro .22s var(--lt-ease) .34s both}
@keyframes ltTimbro{0%{transform:translateX(-50%) rotate(-16deg) scale(1.9);opacity:0}60%{transform:translateX(-50%) rotate(-8deg) scale(.94);opacity:1}100%{transform:translateX(-50%) rotate(-9deg) scale(1);opacity:1}}
.lt-esp .txt{flex:none;width:100%;display:grid;gap:7px;justify-items:center;min-width:0;margin-bottom:auto}
.lt-esp .conto{display:flex;align-items:stretch;justify-content:center;margin-top:2px}
.lt-esp .conto span{display:grid;justify-items:center;align-content:start;gap:2px;min-width:96px;padding:0 14px;font:italic 14.5px/1.15 var(--r-serif);color:var(--r-ink2)}
.lt-esp .conto span+span{box-shadow:inset 3px 0 0 -2px var(--r-filo),inset 5px 0 0 -4px var(--r-filo)}
.lt-esp .conto b{font:700 31px/1 var(--r-serif);font-style:normal;font-variant-numeric:tabular-nums lining-nums;color:var(--r-ink)}
@media (min-height:701px){.lt-scena:not(.oriz) .lt-esp .ritr{width:166px;height:200px}.lt-scena:not(.oriz) .lt-esp h2{font-size:33px}}
.lt-esp h2{font-size:29px}
.lt-esp .sotto{width:100%;box-sizing:border-box;margin:0;padding:7px 8px 0;border-top:3px double var(--r-filo);font:17px/1.28 var(--r-serif);color:var(--r-ink2)}
.lt-esp .chivoti{flex:0 1 auto;width:100%;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;text-align:left;border-top:3px double var(--r-filo)}
.lt-esp .chivoti .occh{padding:5px 0 4px;text-align:center;border-bottom:1px solid var(--r-filo)}
.lt-esp .rg{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:8px;min-height:42px;border-bottom:1px solid var(--r-seppia2)}
.lt-esp .rg:last-child{border-bottom:0}
.lt-esp .rg .su{display:flex;align-items:center;gap:7px;min-width:0}
.lt-esp .rg b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:italic 700 16.5px/1.14 var(--r-serif);color:var(--r-ink)}
.lt-esp .rg.salto b{font-weight:400;color:var(--r-ink2)}
.lt-esp .rg .da{display:flex;padding:0 2px 0 6px}
.lt-esp .rg .da:has(>:nth-child(7))>*{margin-left:-11px}
.lt-esp .rg .faccia,.lt-esp .rg .pall{display:block;flex:none;width:28px;height:33px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1px var(--r-ottone)}
.lt-esp .rg .faccia{background:linear-gradient(#4a3325,#21150e)}
.lt-esp .rg .da .faccia,.lt-esp .rg .da .pall{margin-left:-6px;box-shadow:0 0 0 1px var(--r-ottone),0 0 0 2px var(--r-chiara)}

/* l'Indovino e l'Imitatore: un foglietto sopra il registro */
.lt-indov.lt-foglio{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;gap:7px;padding:17px 15px 13px;box-shadow:none;animation:ltSale .22s var(--lt-ease)}
.lt-indov.lt-foglio::after{display:none}
.lt-riu .lt-indov h3{flex:none;margin:0;font-size:21px;white-space:normal;overflow:visible}
.lt-indov .capo{flex:none;display:flex;align-items:center;gap:9px;min-width:0}
.lt-riu .lt-indov .capo h3{flex:1 1 auto;min-width:0}
.lt-indov .capo .faccia,.lt-indov .capo .pall{display:block;flex:none;width:30px;height:34px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1px var(--r-ottone),0 0 0 2px rgba(40,20,8,.32)}
.lt-indov .capo .faccia{background:linear-gradient(#4a3325,#21150e)}
.lt-indov p{flex:none;margin:0;font:italic 14px/1.25 var(--r-serif);color:var(--r-ink2)}
.lt-indov .griglia{flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:max-content;gap:4px;align-content:start}
.lt-indov .griglia.gruppi{display:flex;flex-direction:column;gap:3px}
.lt-indov h4{flex:none;margin:4px 0 0;padding-bottom:1px;border-bottom:1px solid currentColor;font:700 11px/1.3 var(--r-sans);letter-spacing:.13em;text-transform:uppercase;color:var(--r-ink2)}
.lt-indov h4.ombre{color:var(--r-cera)}.lt-indov h4.soli{color:var(--r-viola)}
.lt-indov .gruppo{flex:1 0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(44px,1fr);gap:3px}
.lt-indov .griglia button{min-height:44px;margin:0;padding:3px;border:0;border-radius:3px;font:700 14px/1.08 var(--r-serif);color:var(--r-ink);background:rgba(255,250,236,.56);box-shadow:inset 0 0 0 1px var(--r-filo)}
.lt-indov .griglia button.ombre{color:var(--r-cera)}.lt-indov .griglia button.soli{color:var(--r-viola)}
.lt-indov .annulla{flex:none;min-height:44px;margin:0;border:0;border-radius:4px;font:700 15px/1 var(--r-serif);color:var(--r-ink);background:rgba(255,250,236,.5);box-shadow:inset 0 0 0 1.5px var(--r-ink2)}

/* la scheda del ruolo, le scelte, la rivelazione, il risultato */
.lt-infor.lt-foglio{max-width:420px;padding:14px 16px 15px;text-align:left}
.lt-infor .testa{display:flex;align-items:center;gap:9px;min-height:40px;margin:4px 0 7px;padding-bottom:4px;border-bottom:3px double var(--r-filo)}
.lt-infor h3{flex:1;min-width:0;font-size:24px}
.lt-infor .sq{flex:none;box-sizing:border-box;padding:3px 6px 2px;border:2.5px double currentColor;border-radius:2px;font:700 12px/1.1 var(--r-serif);letter-spacing:.06em;text-transform:uppercase;color:var(--r-oro);transform:rotate(-3deg)}
.lt-infor.ombre .sq,.lt-infor.ombre h3{color:var(--r-cera)}.lt-infor.soli .sq,.lt-infor.soli h3{color:var(--r-viola)}.lt-infor.fantasma .sq,.lt-infor.fantasma h3{color:var(--r-ardesia)}
.lt-infor .desc{margin:0 0 8px;font:16px/1.38 var(--r-serif);color:var(--r-ink)}
.lt-infor ul{margin:0;padding-left:18px;display:grid;gap:5px;font:14.5px/1.32 var(--r-serif);color:var(--r-ink2);text-align:left}
.lt-scambio.lt-foglio{display:flex;flex-direction:column;gap:8px;padding:14px 16px 15px}
.lt-scambio h3{font-size:22px}
.lt-scambio p{margin:0;font:italic 15px/1.3 var(--r-serif);color:var(--r-ink2)}
.lt-scambio .griglia{min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:max-content;gap:5px}
.lt-scambio .griglia button{min-height:46px;margin:0;padding:6px 4px;border:0;border-radius:3px;font:700 14px/1.1 var(--r-serif);color:var(--r-ink);background:rgba(255,250,236,.66);box-shadow:inset 0 0 0 1px var(--r-filo)}
.lt-scambio .griglia button.sel{color:var(--r-cera);background:rgba(187,52,69,.14);box-shadow:inset 0 0 0 2px var(--r-cera)}
.lt-scambio .griglia.sab{grid-template-columns:minmax(0,1fr)}
.lt-scambio .griglia.sab button{display:grid;gap:3px;padding:9px 11px;text-align:left}
.lt-scambio .griglia.sab b{display:flex;align-items:center;gap:8px;font:700 17px/1.1 var(--r-serif)}
.lt-scambio .griglia.sab b svg{width:21px;height:21px;flex:none;color:var(--r-cera)}
.lt-scambio .griglia.sab small{font:14px/1.25 var(--r-serif);color:var(--r-ink2)}
.lt-scambio .piede{display:flex;gap:8px}.lt-scambio .piede .btn{flex:1}
.lt-svela.lt-foglio{max-width:420px;padding:14px 18px 18px;text-align:center;animation:ltGira .3s var(--lt-ease) both}
.lt-svela .intest{margin-bottom:12px}
.lt-svela h2{margin:4px 0 8px;font-size:39px;color:var(--r-oro)}.lt-svela.ombre h2{color:var(--r-cera)}.lt-svela.soli h2{color:var(--r-viola)}
.lt-svela p{margin:0 0 8px;font:16px/1.38 var(--r-serif);color:var(--r-ink2)}
.lt-svela .lt-sopra{font:700 11px/1.2 var(--r-sans);letter-spacing:.14em;text-transform:uppercase;color:var(--r-ink3)}
.lt-svela .lt-comp{font-weight:700;color:var(--r-ink)}
.lt-svela .lt-conto{font:700 15.5px/1.2 var(--r-serif);color:var(--r-ink)!important;font-variant-numeric:tabular-nums}
.lt-svela .lt-mod{color:var(--r-viola)!important}
.lt-svela-av{display:block;width:84px;height:100px;margin:0 auto 8px;border-radius:50%;object-fit:cover;object-position:top;background:linear-gradient(#4a3325,#21150e);box-shadow:0 0 0 2px var(--r-ottone),0 0 0 4px var(--r-chiara),0 0 0 5px var(--r-filo)}
.lt-alleati{display:flex;justify-content:center;gap:9px;margin-top:6px}
.lt-alleati img{width:44px;height:52px;border-radius:50%;object-fit:cover;object-position:top;background:linear-gradient(#4a3325,#21150e);box-shadow:0 0 0 1.5px var(--r-cera)}
.lt-vince.lt-foglio{position:relative;width:100%;max-width:480px;height:100%;max-height:800px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px 22px;text-align:center}
.lt-vince .intest{position:absolute;left:15px;right:15px;top:14px}
.lt-vince .sig{display:block;flex:none;width:128px;height:128px;background:var(--r-sigillo) center/100% 100% no-repeat;transform:rotate(-10deg);animation:ltSigillo .24s var(--lt-ease) .08s both}
.lt-vince .tes{display:grid;gap:6px;justify-items:center;min-width:0}
.lt-vince h2{font-size:38px;animation:ltColpo .3s var(--lt-ease) both}
.lt-vince.perso h2{color:var(--r-cera)}
.lt-vince p{margin:0;font:18px/1.32 var(--r-serif);color:var(--r-ink2)}
.lt-vince p.occh{font:700 11px/1.25 var(--r-sans)}
.lt-vince p.mio{font:italic 700 16px/1.2 var(--r-serif);color:var(--r-ink)}
.lt-vince .fila{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 10px;min-width:0;padding-top:9px;border-top:3px double var(--r-filo)}
.lt-vince .u{display:grid;justify-items:center;gap:4px;width:64px;min-width:0}
.lt-vince .u .faccia,.lt-vince .u .pall{display:block;width:54px;height:64px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1.5px var(--r-ottone),0 0 0 3px var(--r-chiara),0 0 0 4px var(--r-filo)}
.lt-vince .u .faccia{background:linear-gradient(#4a3325,#21150e)}
.lt-vince .u>span:not(.lt-tinta){max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:italic 700 14.5px/1.15 var(--r-serif);color:var(--r-ink)}

/* le regole dell'host: il registro coi segnalibri di nastro */
.lt-computer.lt-foglio{max-width:480px;height:100%;max-height:min(100%,800px);display:flex;flex-direction:column;padding:14px 15px 12px}
.lt-computer>.intest{flex:none}
.lt-computer .testa{flex:none;display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;min-height:38px}
.lt-computer .tit{grid-column:2;min-width:0;text-align:center}
.lt-computer h3{font-size:22px}
.lt-computer .lt-chiudi{grid-column:3;justify-self:end}
.lt-computer .corpo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.lt-computer .lt-pc{flex:1 1 auto;min-height:0}
.lt-computer .piede{flex:none;display:flex;flex-direction:row;flex-wrap:wrap;gap:5px;margin-top:6px;padding:0}
.lt-computer .piede button{flex:1 1 40%;width:auto;min-width:0;min-height:44px;margin:0;padding:0 7px;border:0;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;gap:4px;font:700 14.5px/1.05 var(--r-serif);color:var(--r-ink);background:rgba(255,250,236,.6);box-shadow:inset 0 0 0 1px var(--r-ink2)}
.lt-computer .piede button svg.ico{width:15px;height:15px}
.lt-computer .piede button i{font-style:normal}
.lt-computer .piede .via{flex:1 1 100%;min-height:50px;font:700 19px/1 var(--r-serif);color:var(--r-crema);background:linear-gradient(180deg,var(--r-cera-ch),var(--r-cera) 62%,var(--r-cera-sc));box-shadow:inset 0 0 0 1px var(--r-ottone),0 3px 7px rgba(60,16,10,.42)}
.lt-computer .piede .via:disabled{opacity:.45}.lt-computer .piede .via svg.ico{display:none}
.lt-computer>.nota{flex:none;margin:5px 0 0;font:italic 13.5px/1.2 var(--r-serif);color:var(--r-ink2);text-align:center}
.lt-pronti{flex:none;display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 4px}.lt-pronti[hidden]{display:none}
.lt-pronti span{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:2px;font:700 12.5px/1.1 var(--r-serif);color:var(--r-ink2);box-shadow:inset 0 0 0 1px var(--r-filo)}
.lt-pronti span.ok{color:var(--r-verde)}.lt-pronti svg.ico{width:.95em;height:.95em;vertical-align:-.12em}
.lt-pc{display:flex;flex-direction:column;min-height:0;font-family:var(--r-serif);color:var(--r-ink);font-variant-numeric:lining-nums}
.lt-pc.lt-foglio{box-sizing:border-box;width:100%;max-width:480px;margin:0 auto;padding:11px 13px 9px;box-shadow:0 10px 24px rgba(0,0,0,.45)}
.lt-pc button{font:inherit;border:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
.lt-pc svg.ico{width:1.2em;height:1.2em;flex:none;vertical-align:-.22em}
.lt-pc-barra{flex:none;display:flex;align-items:center;gap:6px;min-height:44px}
.lt-pc-barra>span:first-child{flex:1;min-width:0;font:700 11px/1.2 var(--r-sans);letter-spacing:.12em;text-transform:uppercase;color:var(--r-ink3)}
.lt-pc-barra>span.tit{font:700 19px/1.05 var(--r-serif);letter-spacing:0;text-transform:none;color:var(--r-ink)}
.lt-pc-preset{display:flex;gap:4px}
.lt-pc-preset button{position:relative;z-index:0;height:44px;padding:0 10px;background:none;font:700 14px/1 var(--r-serif);color:var(--r-ink2)}
.lt-pc-preset button::before{content:"";position:absolute;inset:6px 0;z-index:-1;border-radius:3px;box-shadow:inset 0 0 0 1px var(--r-filo);transition:background-color .2s var(--lt-ease),box-shadow .2s var(--lt-ease)}
.lt-pc-preset button.attiva{color:var(--r-cera)}
.lt-pc-preset button.attiva::before{background:rgba(187,52,69,.1);box-shadow:inset 0 0 0 1.5px var(--r-cera),inset 0 0 0 3px rgba(248,240,222,.8),inset 0 0 0 3.5px var(--r-cera)}
.lt-pc-preset .scelta{font:italic 700 15.5px/44px var(--r-serif);color:var(--r-cera)}
.lt-pc-schede{position:relative;z-index:1;flex:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:start;gap:4px;height:56px;padding:0 3px;border-top:3px double var(--r-filo)}
.lt-pc-schede button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;height:46px;padding:0 0 9px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,rgba(0,0,0,.06) 1px 2px),linear-gradient(90deg,#4f3625,#6e4e36 50%,#4f3625);color:#f0dfc2;font:700 12px/1 var(--r-serif);clip-path:polygon(0 0,100% 0,100% 100%,50% calc(100% - 7px),0 100%);transition:height .2s var(--lt-ease),transform .16s var(--lt-ease)}
.lt-pc-schede button::after{content:"";position:absolute;left:3px;right:3px;top:3px;border-top:1.5px dashed rgba(255,235,200,.5);pointer-events:none}
.lt-pc-schede button.attiva{height:54px;background:repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,rgba(0,0,0,.06) 1px 2px),linear-gradient(90deg,var(--r-cera),var(--r-cera-ch) 50%,var(--r-cera));color:var(--r-crema)}
.lt-foglio .lt-pc-schede button:active:not(:disabled){transform:translateY(2px)}
.lt-pc-schede b{display:block;line-height:0}.lt-pc-schede b svg{width:18px;height:18px}
.lt-pc-corpo{position:relative;z-index:2;flex:1 1 auto;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 3px;border-bottom:3px double var(--r-filo)}
.lt-pc-pag{display:flex;flex-direction:column;min-height:100%;animation:ltPcEntra .2s var(--lt-ease) both}
@keyframes ltPcEntra{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.lt-pc-riga{flex:1 0 44px;max-height:60px;display:flex;align-items:center;gap:5px;min-height:44px;border-bottom:1px solid var(--r-seppia2)}
.lt-pc-riga:last-child{border-bottom:0}
.lt-pc-riga .et{flex:0 1 auto;min-width:0;font:600 15.5px/1.1 var(--r-serif);color:var(--r-ink)}
.lt-pc-riga .pp{flex:1 1 6px;min-width:4px;height:12px;margin-top:6px;border-bottom:1.5px dotted rgba(84,60,34,.42)}
.lt-pc-riga .ctr{flex:none;display:flex;align-items:center}
.lt-pc-riga .fr{width:34px;height:44px;padding:0;background:none;color:var(--r-cera);font:400 27px/40px var(--r-serif)}
.lt-pc-riga .fr:disabled{color:rgba(84,60,34,.28)}
.lt-pc-riga .val{position:relative;z-index:0;min-width:64px;max-width:108px;height:44px;padding:0 7px;background:none;font:700 14.5px/1.04 var(--r-serif);color:var(--r-ink)}
.lt-pc-riga .val::before{content:"";position:absolute;inset:6px 0;z-index:-1;border-radius:3px;background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1px var(--r-filo)}
.lt-pc-riga span.val{flex:none;display:block;height:auto;text-align:right;font-style:italic;font-weight:700}
.lt-pc-riga span.val::before{display:none}
.lt-pc .pop{animation:ltPcPop .2s var(--lt-ease)}
@keyframes ltPcPop{from{transform:scale(.88)}to{transform:none}}
.lt-pc-aiuto{flex:none;margin:4px 2px 5px;font:italic 14px/1.22 var(--r-serif);color:var(--r-ink2)}
.lt-pc-sq{flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;border-bottom:1px solid var(--r-filo)}
.lt-pc-sq button{height:44px;padding:0;background:none;font:700 14px/1 var(--r-serif);color:var(--r-ink3);box-shadow:inset 0 0 0 rgba(0,0,0,0)}
.lt-pc-sq button.attiva{color:var(--r-ink);box-shadow:inset 0 -3px 0 var(--r-ink)}
.lt-pc-sq button.ombre.attiva{color:var(--r-cera);box-shadow:inset 0 -3px 0 var(--r-cera)}
.lt-pc-sq button.soli.attiva{color:var(--r-viola);box-shadow:inset 0 -3px 0 var(--r-viola)}
.lt-pc-sq button.mod.attiva{color:var(--r-ardesia);box-shadow:inset 0 -3px 0 var(--r-ardesia)}
.lt-pc-ruoli{flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid var(--r-seppia2);border-left:1px solid var(--r-seppia2)}
.lt-pc-r{position:relative;display:flex;flex-direction:column;justify-content:center;gap:1px;min-width:0;height:47px;box-sizing:border-box;padding:2px 5px;overflow:hidden;text-align:left;background:none;border-right:1px solid var(--r-seppia2);border-bottom:1px solid var(--r-seppia2);color:var(--r-ink)}
.lt-pc .lt-pc-r{border-right:1px solid var(--r-seppia2);border-bottom:1px solid var(--r-seppia2)}
.lt-pc-r b{display:block;font:700 13.5px/1.14 var(--r-serif);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-pc-r .quanto{display:flex;align-items:flex-end;gap:5px;height:16px}
.lt-pc-r .sp{font:italic 12.5px/1 var(--r-serif);color:var(--r-ink2)}
.lt-pc .cand{display:inline-flex;align-items:flex-end;gap:2px;height:16px}
.lt-pc .cand i{position:relative;display:block;width:6px;height:9px;border-radius:1px 1px 0 0;background:rgba(84,60,34,.14);box-shadow:inset 0 0 0 .5px rgba(84,60,34,.5);transition:background-color .2s var(--lt-ease)}
.lt-pc .cand i::before{content:"";position:absolute;left:.5px;bottom:9.5px;width:5px;height:6px;border-radius:50% 50% 45% 45%/65% 65% 35% 35%;background:radial-gradient(circle at 50% 72%,#fff2b8 0 24%,#f2a93a 56%,#c9541e 100%);opacity:0;transform:scaleY(.5);transform-origin:50% 100%;transition:opacity .2s var(--lt-ease),transform .2s var(--lt-ease)}
.lt-pc .cand i.on{background:linear-gradient(90deg,#fff6e2,#e4cfa4);box-shadow:inset 0 0 0 .5px rgba(84,60,34,.65)}
.lt-pc .cand i.on::before{opacity:1;transform:none}
.lt-pc-r.zero{background:rgba(84,60,34,.05)}.lt-pc-r.zero b{color:var(--r-ink3);text-decoration:line-through}.lt-pc-r.zero .sp{color:var(--r-ink3)}
.lt-pc-tutti{flex:none;display:flex;align-items:center;gap:3px;margin-top:2px;font:italic 14px/1 var(--r-serif);color:var(--r-ink2)}
.lt-pc-tutti span{margin-right:3px}
.lt-pc-tutti button{position:relative;z-index:0;flex:1;height:44px;padding:0;background:none;font:700 13.5px/1 var(--r-serif);font-variant-numeric:tabular-nums lining-nums;color:var(--r-ink)}
.lt-pc-tutti button::before{content:"";position:absolute;inset:7px 0;z-index:-1;border-radius:3px;box-shadow:inset 0 0 0 1px var(--r-filo)}
.lt-pc-pick{flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px 3px;margin-bottom:3px}
.lt-pc-pick button{position:relative;z-index:0;min-width:0;height:44px;padding:0 1px;background:none;font:700 12px/1.05 var(--r-serif);letter-spacing:-.015em;color:var(--r-ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-pc-pick button::before{content:"";position:absolute;inset:4px 0;z-index:-1;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(84,60,34,.24)}
.lt-pc-pick button.attiva{color:var(--r-crema)}
.lt-pc-pick button.attiva::before{background:var(--r-ink);box-shadow:none}
.lt-pc-regole{flex:none;border-top:3px double var(--r-filo)}
.lt-pc-nota{margin:5px 0 0;font:italic 14px/1.25 var(--r-serif);color:var(--r-ink2)}
.lt-pc-stato{flex:none;margin-top:5px;padding:0 3px;font:italic 14px/1.22 var(--r-serif);color:var(--r-ink2);text-align:center}

/* la schermata dell'app con le regole, prima di aprire la stanza: anche lei sul tavolo, niente blu di SPeeD GAME (solo per Lanterne) */
html:has(.lt-pc.lt-foglio),body:has(.lt-pc.lt-foglio){background:#1c110b}
#app:has(.lt-pc.lt-foglio){max-width:none}
.schermata:has(.lt-pc.lt-foglio){max-width:none;background:var(--r-tavolo);color:var(--r-crema)}
.schermata:has(.lt-pc.lt-foglio)>.testa h1,.schermata:has(.lt-pc.lt-foglio)>.testa h2{margin:0;color:var(--r-ottone-ch);font-family:var(--r-serif);font-weight:700;letter-spacing:0}
.schermata:has(.lt-pc.lt-foglio)>.testa .sotto{color:#ecdcc0;font-family:var(--r-serif);opacity:1}
.schermata:has(.lt-pc.lt-foglio)>.testa .stemma{display:block;flex:none;width:30px;height:35px;color:var(--r-ottone-ch)}
.schermata:has(.lt-pc.lt-foglio)>.testa .btn{color:var(--r-ottone-ch);background:none;border-color:rgba(195,154,72,.6)}
.schermata:has(.lt-pc.lt-foglio) .modulo-nota{margin:0 0 7px;color:#ecdcc0;font-family:var(--r-serif);font-size:15px}
.schermata:has(.lt-pc.lt-foglio)>.contenuto{display:flex;flex-direction:column;min-height:0;overflow:hidden;padding:0 4px 8px 0}
.schermata:has(.lt-pc.lt-foglio)>.contenuto>:has(>.lt-pc.lt-foglio){flex:1 1 auto;min-height:0;display:flex;flex-direction:column}
.schermata:has(.lt-pc.lt-foglio) .lt-pc.lt-foglio{flex:1 1 auto;max-height:680px}
.schermata:has(.lt-pc.lt-foglio) .piede .btn{border-radius:4px;font-family:var(--r-serif);font-weight:700;letter-spacing:0}
.schermata:has(.lt-pc.lt-foglio) .piede .btn-primario{color:var(--r-crema);background:linear-gradient(180deg,var(--r-cera-ch),var(--r-cera) 62%,var(--r-cera-sc));border:0;box-shadow:inset 0 0 0 1px var(--r-ottone),0 3px 8px rgba(0,0,0,.45)}
.schermata:has(.lt-pc.lt-foglio) .piede .btn-fantasma{color:var(--r-crema);background:none;border:0;box-shadow:inset 0 0 0 1px rgba(195,154,72,.7)}
@media (orientation:landscape) and (max-height:520px){
.schermata:has(.lt-pc.lt-foglio){display:grid;grid-template-columns:minmax(0,1fr) 190px;grid-template-rows:auto minmax(0,1fr);column-gap:14px}
.schermata:has(.lt-pc.lt-foglio)>.testa{grid-column:1/-1}
.schermata:has(.lt-pc.lt-foglio)>.contenuto{grid-column:1;min-height:0}
.schermata:has(.lt-pc.lt-foglio)>.piede{grid-column:2;display:flex;flex-direction:column;justify-content:flex-end;gap:7px}
.schermata:has(.lt-pc.lt-foglio) .modulo-nota{display:none}
.lt-pc.lt-foglio .lt-pc-stato{display:none}
}

/* telefono piccolo, in verticale */
@media (max-height:700px){
.lt-scena:not(.oriz) .lt-riu{gap:4px;padding:12px 12px 9px}
.lt-scena:not(.oriz) .lt-riu .testa{grid-template-columns:68px minmax(0,1fr) auto;grid-template-areas:'c t o' 'p p p';column-gap:7px;row-gap:2px;padding-bottom:3px}
.lt-scena:not(.oriz) .lt-riu .intest{display:none}
.lt-scena:not(.oriz) .lt-riu .occh .stemma{display:inline-block;width:12px;height:14px;margin-right:4px;vertical-align:-3px}
.lt-scena:not(.oriz) .lt-riu .occh{font-size:11px;letter-spacing:.07em}
.lt-scena:not(.oriz) .lt-riu .chi .faccia,.lt-scena:not(.oriz) .lt-riu .chi .pall{width:40px;height:48px}
.lt-scena:not(.oriz) .lt-riu .fase{bottom:-5px;font-size:11px;padding:1px 4px 0;border-width:2.5px}
.lt-scena:not(.oriz) .lt-riu[data-fase="vota"] .fase{font-size:11.5px}
.lt-scena:not(.oriz) .lt-riu[data-fase="esito"] .fase{font-size:11px;letter-spacing:0;padding:1px 3px 0}
.lt-scena:not(.oriz) .lt-riu h3{font-size:16px}
.lt-scena:not(.oriz) .lt-riu .perche{font-size:13.5px;line-height:16px}
.lt-scena:not(.oriz) .lt-riu .timer{width:46px;height:46px;font-size:20px}
.lt-scena:not(.oriz) .lt-riu:not(.una) .grid{column-gap:11px}
.lt-scena:not(.oriz) .lt-riu:not(.una) .carta{grid-template-columns:22px minmax(0,1fr) auto;grid-template-rows:minmax(21px,1fr) 44px;column-gap:5px;padding:1px 0 0}
.lt-scena:not(.oriz) .lt-riu:not(.una) .carta>.faccia,.lt-scena:not(.oriz) .lt-riu:not(.una) .carta>.pall{width:22px;height:24px;margin-top:2px}
.lt-scena:not(.oriz) .lt-riu:not(.una) .carta .nm{font-size:15px}
.lt-scena:not(.oriz) .lt-riu:not(.una) .carta.spento .nt{grid-area:a;justify-self:start}
.lt-scena:not(.oriz) .lt-riu:not(.una) .carta.zitto .st,.lt-scena:not(.oriz) .lt-riu:not(.una) .carta.rete .st{font-size:11px;letter-spacing:.02em;padding-left:3px;padding-right:3px}
.lt-scena:not(.oriz) .lt-riu:not(.una) .carta.zitto .lt-tinta{display:none}
.lt-scena:not(.oriz) .lt-riu:not(.una) .carta.zitto::before{top:15px;width:23px;height:5px}
.lt-scena:not(.oriz) .lt-riu .carta .az .sig{width:46px;height:46px;margin:-1px 0}
.lt-scena:not(.oriz) .lt-riu .chat{font-size:14.5px}
.lt-scena:not(.oriz) .lt-computer>.intest{display:none}
.lt-scena:not(.oriz) .lt-computer .piede button{flex:0 0 66px;min-height:46px;padding:0 4px;font-size:14px}
.lt-scena:not(.oriz) .lt-computer .piede button i{display:none}
.lt-scena:not(.oriz) .lt-computer .piede .via{flex:1 1 0;font-size:18px}
.lt-computer .testa{min-height:32px}
.lt-computer.lt-foglio{padding:12px 12px 9px}
.lt-pc-barra{min-height:40px}
.lt-pc-schede{height:52px}
.lt-pc-schede button{height:44px;font-size:11.5px}
.lt-pc-schede button.attiva{height:50px}
.lt-pc-sq button{font-size:12.5px}
.lt-pc-stato{font-size:13px}
.lt-indov.lt-foglio{padding:14px 12px 10px;gap:5px}
.lt-vince .sig{width:96px;height:96px}
.lt-vince h2{font-size:32px}
.lt-vince p{font-size:16.5px}
.lt-vince .u .faccia,.lt-vince .u .pall{width:44px;height:52px}
.lt-vince .fila{gap:6px}
}

@media (max-width:375px){
.lt-riu{--vn:60px;--vv:138px}
.lt-riu.una .carta .nm{font-size:16px}
.lt-riu.una.ampia .carta{grid-template-columns:46px auto minmax(0,1fr) var(--vv)}
.lt-riu.una.ampia .carta .nm{font-size:18px}
.lt-riu.una.ampia .carta .lt-tinta{font-size:12.5px}
.lt-riu.una.ampia .carta .st{font-size:11px}
.lt-pc-r b{font-size:12.5px;letter-spacing:-.012em}
.lt-pc-pick button{font-size:11px;letter-spacing:-.025em}
.lt-pc-sq button{font-size:12px}
.lt-riu .carta .az button{font-size:12.5px}
.lt-riu .carta .az button svg.ico{width:12px;height:12px}
.lt-riu .fondo{gap:5px}
.lt-riu .fondo .lt-vbtn{padding:0 7px;font-size:13.5px}
.lt-riu .fondo .cht{gap:4px;padding:0 8px;font-size:14px}
.lt-riu .voto .salta{padding:0 4px;font-size:14px}
.lt-riu .voto .salta svg.ico{display:none}
}
@media (max-width:340px){
.lt-riu .fondo .cht span{display:none}
}

/* di lato (telefono girato o scena girata col tasto) */
.lt-scena.oriz .lt-riu{width:min(100%,980px);max-width:none;height:100%;max-height:none;padding:10px 15px 9px}
.lt-scena.oriz .lt-riu .testa{grid-template-columns:68px minmax(0,1fr) auto;grid-template-areas:'c t o' 'c p o';row-gap:0;padding-bottom:3px}
.lt-scena.oriz .lt-riu .intest{display:none}
.lt-scena.oriz .lt-riu .occh{font-size:11px;letter-spacing:.07em}
.lt-scena.oriz .lt-riu .occh .stemma{display:inline-block;width:12px;height:14px;margin-right:4px;vertical-align:-3px}
.lt-scena.oriz .lt-riu .occh .reg{display:inline}
.lt-scena.oriz .lt-riu .chi .faccia,.lt-scena.oriz .lt-riu .chi .pall{width:38px;height:45px}
.lt-scena.oriz .lt-riu .fase{bottom:-4px;font-size:11px;padding:1px 4px 0;border-width:2.5px}
.lt-scena.oriz .lt-riu[data-fase="vota"] .fase{font-size:11.5px}
.lt-scena.oriz .lt-riu[data-fase="esito"] .fase{font-size:11px;letter-spacing:0;padding:1px 3px 0}
.lt-scena.oriz .lt-riu h3{font-size:17.5px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt-scena.oriz .lt-riu .perche{text-align:left;font-size:14px;line-height:16px}
.lt-scena.oriz .lt-riu .timer{width:46px;height:46px;font-size:20px}
.lt-scena.oriz .lt-riu .grid{grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:auto;gap:0 13px;padding:0 1px}
.lt-scena.oriz .lt-riu .grid::before{top:16px;left:33.33%}
.lt-scena.oriz .lt-riu .grid::after{content:"";position:absolute;top:16px;bottom:0;left:66.66%;width:1px;margin-left:-2px;border-left:1px solid var(--r-filo);border-right:1px solid var(--r-filo);pointer-events:none}
.lt-scena.oriz .lt-riu .colonne{display:flex;align-items:center;justify-content:space-between;grid-column:1/-1;border-bottom:1px solid var(--r-filo)}
.lt-scena.oriz .lt-riu .colonne .c2{display:none}
.lt-scena.oriz .lt-riu[data-fase="parla"] .colonne .c3{display:none}
.lt-scena.oriz .lt-riu[data-fase="parla"] .leg{display:flex}
.lt-scena.oriz .lt-riu .carta{grid-template-columns:28px minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr) minmax(0,1fr);grid-template-areas:'f n a' 'f s a';column-gap:5px;padding:0 1px}
.lt-scena.oriz .lt-riu .carta>.faccia,.lt-scena.oriz .lt-riu .carta>.pall{width:27px;height:31px;margin:0}
.lt-scena.oriz .lt-riu .carta .nm{grid-row:1;align-self:end;font-size:15px}
.lt-scena.oriz .lt-riu .carta.spento .nm,.lt-scena.oriz .lt-riu .carta.zitto .nm,.lt-scena.oriz .lt-riu .carta.rete .nm,.lt-scena.oriz .lt-riu .carta.io .nm,.lt-scena.oriz .lt-riu .carta.votato .nm{grid-row:1;align-self:end}
.lt-scena.oriz .lt-riu .carta .nt{justify-content:flex-start;align-self:start;font-size:11.5px}
.lt-scena.oriz .lt-riu .carta .az{grid-row:1/span 2;align-self:center}
.lt-scena.oriz .lt-riu .carta .vt{grid-area:a;grid-row:1/span 2;justify-self:end;padding-right:11px}
.lt-scena.oriz .lt-riu .carta .vt .faccia,.lt-scena.oriz .lt-riu .carta .vt .pall{margin-right:-11px}
.lt-scena.oriz .lt-riu .carta .az .dubbio,.lt-scena.oriz .lt-riu .carta .az .fido{flex:none;width:37px}
.lt-scena.oriz .lt-riu .carta .az .dubbio span,.lt-scena.oriz .lt-riu .carta .az .fido span{display:none}
.lt-scena.oriz .lt-riu .carta .az .dubbio svg.ico,.lt-scena.oriz .lt-riu .carta .az .fido svg.ico{display:block;width:15px;height:15px}
.lt-scena.oriz .lt-riu .carta .az .vota{width:44px;height:44px;margin:0;font-size:13px}
.lt-scena.oriz .lt-riu .carta .az .vota.me{font-size:11px;letter-spacing:-.03em}
.lt-scena.oriz .lt-riu .carta .az .conf{height:44px;padding:0 10px;font-size:13px}
.lt-scena.oriz .lt-riu .carta .az .sig{width:44px;height:44px;margin:0}
.lt-scena.oriz .lt-riu .carta .az .mio span{display:none}
.lt-scena.oriz .lt-riu[data-fase="esito"] .carta .az .mio{opacity:0;transition:opacity .2s var(--lt-ease)}
.lt-scena.oriz .lt-riu .carta.zitto::before{left:0;top:calc(50% + 1px);width:28px;height:6px}
.lt-scena.oriz .lt-riu.ampia .carta{grid-template-columns:34px minmax(0,1fr) auto;column-gap:6px}
.lt-scena.oriz .lt-riu.ampia .carta>.faccia,.lt-scena.oriz .lt-riu.ampia .carta>.pall{width:33px;height:38px}
.lt-scena.oriz .lt-riu.ampia .carta .nm{font-size:16.5px}
.lt-scena.oriz .lt-riu.ampia .carta .az .vota{width:48px;height:48px;font-size:13.5px}
.lt-scena.oriz .lt-riu.ampia .carta .az .sig{width:48px;height:48px}
.lt-scena.oriz .lt-riu.ampia .carta.zitto::before{width:34px}
.lt-scena.oriz .lt-riu.grande .carta{grid-template-columns:48px minmax(0,1fr) auto}
.lt-scena.oriz .lt-riu.grande .carta>.faccia,.lt-scena.oriz .lt-riu.grande .carta>.pall{width:46px;height:54px}
.lt-scena.oriz .lt-riu.grande .carta .nm{font-size:19px}
.lt-scena.oriz .lt-riu.grande .carta .nt{font-size:13px}
.lt-scena.oriz .lt-riu.grande .carta .az .vota{width:56px;height:56px;font-size:15px}
.lt-scena.oriz .lt-riu.grande .carta .az .sig{width:56px;height:56px}
.lt-scena.oriz .lt-riu.grande .carta.zitto::before{width:46px;height:8px}
.lt-scena.oriz .lt-riu .foglietto{left:auto;right:15px;top:63px;bottom:59px;width:min(54%,400px);height:auto;transform:translateX(12px)}
.lt-scena.oriz .lt-riu .foglietto.su{transform:none}
.lt-scena.oriz.lt-ruota .lt-riu .foglietto{left:15px;right:auto;transform:translateX(-12px)}
.lt-scena.oriz.lt-ruota .lt-riu .foglietto.su{transform:none}
.lt-scena.oriz .lt-riu .foglietto .cima{height:32px}
.lt-scena.oriz .lt-riu .foglietto .via{margin:-6px -9px -6px 0}
.lt-scena.oriz .lt-riu .penna{flex-wrap:nowrap}
.lt-scena.oriz .lt-riu .scrivi{flex:1 1 0}
.lt-scena.oriz .lt-riu .rapide{flex:none}
.lt-scena.oriz .lt-riu .rapide button{flex:none;padding:0 7px}
.lt-scena.oriz .lt-riu .big{padding-top:3px;padding-bottom:3px}
.lt-scena.oriz .lt-riu .big canvas.foto{width:60px;height:44px}
.lt-scena.oriz .lt-riu .fondo .voto{flex:0 1 240px;margin-left:auto}
.lt-scena.oriz .lt-riu .fondo .cht{flex:none}
@media (max-width:720px){
.lt-scena.oriz .lt-riu{padding-left:12px;padding-right:12px;column-gap:10px}
.lt-scena.oriz .lt-riu .grid{column-gap:9px}
.lt-scena.oriz .lt-riu .carta{column-gap:4px}
.lt-scena.oriz .lt-riu .carta .az{gap:2px}
.lt-scena.oriz .lt-riu .carta .az .dubbio,.lt-scena.oriz .lt-riu .carta .az .fido{width:30px}
.lt-scena.oriz .lt-riu .carta .az .ind{flex:0 0 28px}
.lt-scena.oriz .lt-riu .carta .nm{font-size:14.5px}
}
.lt-scena.oriz .lt-riu .carta[data-ak*="ind"] .az .dubbio,.lt-scena.oriz .lt-riu .carta[data-ak*="ind"] .az .fido{width:28px}
.lt-scena.oriz .lt-esp.lt-foglio{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);justify-items:start;align-items:center;gap:4px 22px;padding:12px 24px 12px 30px;text-align:left}
.lt-scena.oriz .lt-esp .intest{display:flex;grid-column:1/-1;grid-row:1;width:100%}
.lt-scena.oriz .lt-esp .ritr{grid-row:2;width:124px;height:150px;margin:0}
.lt-scena.oriz .lt-esp .txt{grid-row:2;justify-items:start;margin:0}
.lt-scena.oriz .lt-esp .sotto{padding:6px 0 0}
.lt-scena.oriz .lt-esp .conto{justify-content:flex-start}
.lt-scena.oriz .lt-esp .conto span{min-width:0;padding:0 12px;font-size:13.5px}
.lt-scena.oriz .lt-esp .conto span:first-child{padding-left:0}
.lt-scena.oriz .lt-esp .conto b{font-size:25px}
.lt-scena.oriz .lt-esp .chivoti{grid-row:2;align-self:center;max-height:100%}
.lt-scena.oriz .lt-esp .rg{min-height:38px}
.lt-scena.oriz .lt-esp .rg .faccia,.lt-scena.oriz .lt-esp .rg .pall{width:25px;height:29px}
.lt-scena.oriz .lt-esp .rg .su .lt-tinta{display:none}
.lt-scena.oriz .lt-esp .rg .da:has(>:nth-child(5))>*{margin-left:-13px}
.lt-scena.oriz .lt-esp h2{font-size:25px}
.lt-scena.oriz .lt-esp .sotto{font-size:15.5px}
.lt-scena.oriz .lt-indov.lt-foglio{padding:11px 14px 9px;gap:4px}
.lt-scena.oriz .lt-riu .lt-indov h3{font-size:19px}
.lt-scena.oriz .lt-indov .griglia{grid-template-columns:repeat(auto-fill,minmax(112px,1fr))}
.lt-scena.oriz .lt-indov .gruppo{flex:none;grid-template-columns:repeat(auto-fill,minmax(102px,1fr));grid-auto-rows:44px}
.lt-scena.oriz .lt-scambio.lt-foglio:has(.griglia.sab){width:100%;max-width:760px}
.lt-scena.oriz .lt-scambio .griglia.sab{grid-template-columns:repeat(3,minmax(0,1fr))}
.lt-scena.oriz .lt-vince.lt-foglio{max-width:760px;display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-areas:'s t' 's f';align-content:center;gap:10px 26px;padding:34px 34px 16px;text-align:left}
.lt-scena.oriz .lt-vince .sig{grid-area:s;width:120px;height:120px}
.lt-scena.oriz .lt-vince .tes{grid-area:t;justify-items:start}
.lt-scena.oriz .lt-vince .fila{grid-area:f;justify-content:flex-start;padding-top:7px}
.lt-scena.oriz .lt-vince h2{font-size:31px}
.lt-scena.oriz .lt-vince p{font-size:16px}
.lt-scena.oriz .lt-vince .u{width:68px}
.lt-scena.oriz .lt-vince .u .faccia,.lt-scena.oriz .lt-vince .u .pall{width:40px;height:47px}
.lt-scena.oriz .lt-vince .u span{font-size:13px;max-width:68px}
.lt-scena.oriz .lt-vince .u .lt-tinta{max-width:68px;font-size:11.5px}
.lt-scena.oriz .lt-computer.lt-foglio{width:100%;max-width:900px;height:100%;max-height:100%;display:grid;grid-template-columns:minmax(0,1fr) 172px;grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:'t t' 'c p' 'c n';column-gap:12px;padding:8px 14px 8px}
.lt-scena.oriz .lt-computer>.intest{display:none}
.lt-scena.oriz .lt-computer .testa{grid-area:t;display:flex;gap:10px;min-height:30px}
.lt-scena.oriz .lt-computer .tit{flex:1;text-align:left}
.lt-scena.oriz .lt-computer h3{font-size:20px}
.lt-scena.oriz .lt-computer .corpo{grid-area:c}
.lt-scena.oriz .lt-computer .piede{grid-area:p;flex-direction:column;flex-wrap:nowrap;justify-content:flex-end;margin-top:0}
.lt-scena.oriz .lt-computer .piede button{flex:none;width:100%;min-height:44px}
.lt-scena.oriz .lt-computer .piede .via{min-height:58px}
.lt-scena.oriz .lt-computer>.nota{grid-area:n;margin:3px 0 0;text-align:left;font-size:12.5px}
.lt-scena.oriz .lt-pc{display:grid;grid-template-columns:96px minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;grid-template-areas:'s c' 's z';column-gap:0}
.lt-scena.oriz .lt-pc-barra{position:absolute;top:4px;right:58px;min-height:40px}
.lt-scena.oriz .lt-pc-barra>span:first-child{flex:none}
.lt-scena.oriz .lt-pc-schede{grid-area:s;grid-template-columns:minmax(0,1fr);grid-auto-rows:44px;justify-items:end;align-items:start;gap:3px;height:auto;padding:3px 0;border-top:0;border-right:3px double var(--r-filo)}
.lt-scena.oriz .lt-pc-schede button{flex-direction:row;justify-content:flex-start;gap:5px;width:86px;height:44px;padding:0 6px 0 12px;background:repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,rgba(0,0,0,.06) 1px 2px),linear-gradient(0deg,#4f3625,#6e4e36 50%,#4f3625);clip-path:polygon(0 0,100% 0,100% 100%,0 100%,7px 50%);transition:width .2s var(--lt-ease),transform .16s var(--lt-ease)}
.lt-scena.oriz .lt-pc-schede button::after{left:auto;right:3px;top:3px;bottom:3px;border-top:0;border-right:1.5px dashed rgba(255,235,200,.5)}
.lt-scena.oriz .lt-pc-schede button.attiva{width:96px;background:repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,rgba(0,0,0,.06) 1px 2px),linear-gradient(0deg,var(--r-cera),var(--r-cera-ch) 50%,var(--r-cera))}
.lt-scena.oriz .lt-foglio .lt-pc-schede button:active:not(:disabled){transform:translateX(2px)}
.lt-scena.oriz .lt-pc-corpo{grid-area:c;min-height:0;padding:0 8px;border-bottom:0}
.lt-scena.oriz .lt-pc-pag{display:grid;grid-template-columns:repeat(auto-fit,minmax(226px,1fr));column-gap:16px;align-content:start;min-height:0}
.lt-scena.oriz .lt-pc-sq,.lt-scena.oriz .lt-pc-ruoli,.lt-scena.oriz .lt-pc-tutti,.lt-scena.oriz .lt-pc-pick,.lt-scena.oriz .lt-pc-regole,.lt-scena.oriz .lt-pc-aiuto{grid-column:1/-1}
.lt-scena.oriz .lt-pc-pag.s-partita,.lt-scena.oriz .lt-pc-pag.s-riunioni,.lt-scena.oriz .lt-pc-pag.s-sabotaggi{grid-auto-rows:minmax(44px,58px)}
.lt-scena.oriz .lt-pc-pag.s-ruoli{grid-template-columns:repeat(2,minmax(0,1fr))}
.lt-scena.oriz .lt-pc-pag.s-ruoli .lt-pc-aiuto{display:none}
.lt-scena.oriz .lt-pc-pag.s-ruoli .lt-pc-sq{grid-column:1;grid-row:1}
.lt-scena.oriz .lt-pc-pag.s-ruoli .lt-pc-tutti{grid-column:2;grid-row:1;align-self:center;margin:0}
.lt-scena.oriz .lt-pc-pag.s-ruoli .lt-pc-ruoli{grid-row:2;margin-top:4px}
.lt-scena.oriz .lt-pc-pag.s-poteri .lt-pc-aiuto{display:none}
.lt-scena.oriz .lt-pc-pag.s-poteri .lt-pc-pick{margin-top:3px}
@media (max-width:720px){
.lt-scena.oriz .lt-pc-pag.s-ruoli{grid-template-columns:minmax(0,1fr)}
.lt-scena.oriz .lt-pc-pag.s-ruoli .lt-pc-tutti{grid-column:1;grid-row:3;margin-top:2px}
}
.lt-scena.oriz .lt-pc-regole{display:grid;grid-template-columns:repeat(auto-fit,minmax(226px,1fr));column-gap:16px}
.lt-scena.oriz .lt-pc-nota{grid-column:1/-1}
.lt-scena.oriz .lt-pc-riga{border-bottom:1px solid var(--r-seppia2)}
.lt-scena.oriz .lt-pc-riga .val{min-width:58px;max-width:88px;padding:0 4px;font-size:14px}
.lt-scena.oriz .lt-pc-riga .fr{width:30px}
.lt-scena.oriz .lt-pc-ruoli{grid-template-columns:repeat(auto-fill,minmax(92px,1fr))}
.lt-scena.oriz .lt-pc-r{padding:2px 4px}
.lt-scena.oriz .lt-pc-r b{font-size:13px;letter-spacing:-.01em}
.lt-scena.oriz .lt-pc-pick{grid-template-columns:repeat(auto-fill,minmax(78px,1fr))}
.lt-scena.oriz .lt-pc-stato{grid-area:z;margin-top:2px;padding-left:14px;font-size:13px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

/* la fine: l'ultima pagina del registro, sul tavolo */
html:has(.lt-fine),body:has(.lt-fine){background:#1c110b}
#app:has(.lt-fine){max-width:none}
.schermata.lt-fine{max-width:none;box-sizing:border-box;flex:0 0 auto;height:var(--alt,100dvh);max-height:var(--alt,100dvh);min-height:0;overflow:hidden;background:var(--r-tavolo);color:var(--r-crema)}
.schermata.lt-fine>.testa{display:none}
.schermata.lt-fine>.contenuto{display:flex;flex-direction:column;min-height:0}
.lt-ultima.lt-foglio{flex:1 1 auto;box-sizing:border-box;min-height:0;width:100%;max-width:480px;max-height:800px;margin:0 auto;display:flex;flex-direction:column;gap:6px;padding:14px 15px 12px;text-align:center}
.lt-ultima .intest{flex:none}
.lt-ultima .tes{flex:none;display:grid;gap:3px;justify-items:center;min-width:0}
.lt-ultima h2{font-size:30px}
.lt-ultima.perso h2{color:var(--r-cera)}
.lt-ultima .chiusa{flex:none;display:block;width:56px;height:56px;margin:auto auto 0;background:var(--r-sigillo) center/100% 100% no-repeat;transform:rotate(-10deg);animation:ltSigillo .24s var(--lt-ease) .24s both}
.lt-ultima .lt-perche{margin:0;font:italic 15.5px/1.25 var(--r-serif);color:var(--r-ink2)}
.schermata.lt-fine .lt-ultima .classifica{flex:1 1 auto;min-height:0;max-height:calc(var(--n)*96px + 28px);margin:2px 0 0;padding:0;overflow-y:auto;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0;border-top:3px double var(--r-filo)}
.lt-ultima .col{display:flex;flex-direction:column;min-height:0}
.lt-ultima .col h3{flex:none}
.lt-ultima .righe{flex:1 1 auto;display:grid;align-content:start}
.schermata.lt-fine .lt-ultima .classifica.solo{grid-template-columns:minmax(0,1fr)}
.lt-ultima .col{min-width:0}
.lt-ultima .col+.col{box-shadow:inset 3px 0 0 -2px var(--r-filo),inset 5px 0 0 -4px var(--r-filo)}
.lt-ultima .col h3{margin:0;padding:5px 0 4px;font:700 11px/1.25 var(--r-sans);letter-spacing:.13em;text-transform:uppercase;color:var(--r-ink2);border-bottom:1px solid var(--r-filo)}
.lt-ultima .col.vinc h3{color:var(--r-cera)}
.lt-ultima .rg{box-sizing:border-box;min-height:clamp(40px,calc((var(--alt,100dvh) - 420px)/var(--n)),96px);display:grid;grid-template-columns:29px minmax(0,1fr);align-items:center;column-gap:7px;padding:1px 5px 1px 7px;text-align:left;border-bottom:1px solid var(--r-seppia2)}
.lt-ultima .rg .faccia,.lt-ultima .rg .pall{display:block;width:29px;height:34px;border-radius:50%;object-fit:cover;object-position:top;box-shadow:0 0 0 1px var(--r-ottone),0 0 0 2px rgba(40,20,8,.32)}
.lt-ultima .rg .faccia{background:linear-gradient(#4a3325,#21150e)}
.lt-ultima .rg.spento .faccia,.lt-ultima .rg.spento .pall{filter:saturate(.6) contrast(.86);opacity:.8}
.schermata.lt-fine .lt-ultima .nome{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:italic 700 15.5px/1.14 var(--r-serif);color:var(--r-ink)}
.schermata.lt-fine .lt-ultima .punti{display:block;min-width:0;font:12.5px/1.18 var(--r-serif);color:var(--r-ink2)}
@media (max-height:739px){
.lt-ultima .lt-ruolo .lt-tinta{display:none}
}
@media (min-height:740px){
.lt-ultima .lt-ruolo .ru{display:block;margin-top:1px}
.lt-ultima .rg{grid-template-columns:38px minmax(0,1fr)}
.lt-ultima .rg .faccia,.lt-ultima .rg .pall{width:38px;height:45px}
.schermata.lt-fine .lt-ultima .nome{font-size:16.5px}
.lt-ultima .pochi .rg{grid-template-columns:54px minmax(0,1fr)}
.lt-ultima .pochi .rg .faccia,.lt-ultima .pochi .rg .pall{width:54px;height:64px}
.schermata.lt-fine .lt-ultima .pochi .nome{font-size:19px}
.schermata.lt-fine .lt-ultima .pochi .punti{font-size:13.5px}
}
.schermata.lt-fine .modulo-nota{color:#ddcbaa}
.schermata.lt-fine .btn{border-radius:4px;font-family:var(--r-serif);font-weight:700;letter-spacing:0}
.schermata.lt-fine .btn-primario{background:linear-gradient(180deg,var(--r-cera-ch),var(--r-cera));color:var(--r-crema);box-shadow:inset 0 0 0 1px var(--r-ottone),0 3px 8px rgba(0,0,0,.45)}
.schermata.lt-fine .btn-fantasma{background:none;color:var(--r-ottone-ch);box-shadow:inset 0 0 0 1px rgba(195,154,72,.7)}
.schermata.lt-fine .btn-verde{background:linear-gradient(180deg,#2d7a54,var(--r-verde));color:var(--r-crema);box-shadow:inset 0 0 0 1px var(--r-ottone),0 3px 8px rgba(0,0,0,.45)}
.schermata.lt-fine .fine-fila{flex:none;box-sizing:border-box;display:flex;align-items:stretch;width:100%;max-width:480px;margin:8px auto 0;border-radius:4px;background:rgba(20,10,5,.58);box-shadow:inset 0 0 0 1px rgba(195,154,72,.5),0 2px 7px rgba(0,0,0,.4)}
.schermata.lt-fine .fine-fila .lt-voce{flex:none;display:flex;margin:0}
.schermata.lt-fine .fine-fila .lt-voce:only-child{flex:1 1 auto}
.schermata.lt-fine .fine-fila .lt-voce:only-child .lt-vbtn{flex:1 1 auto;box-shadow:none}
.schermata.lt-fine .lt-vbtn{height:46px;min-height:46px;box-sizing:border-box;padding:0 12px;border:0;border-radius:0;background:none;font:700 14.5px/1 var(--r-serif);letter-spacing:0;color:var(--r-ottone-ch);box-shadow:inset -1px 0 0 rgba(195,154,72,.4);animation:none}
.schermata.lt-fine .lt-vbtn.parlo{color:#9fd8b4}.schermata.lt-fine .lt-vbtn.muto{color:#f0a9a0}
.schermata.lt-fine .fine-faccine{flex:1 1 0;min-width:0;margin:0;padding:0 2px;gap:0;border-radius:0;background:none;box-shadow:none}
.schermata.lt-fine .fine-faccine .sl-fa{height:46px;font-size:1.22rem;border-radius:3px;filter:sepia(.3) saturate(.85)}
.schermata.lt-fine>.piede{flex:none;display:flex;flex-wrap:wrap;gap:8px;width:100%;max-width:480px;margin:0 auto;padding-top:8px}
.schermata.lt-fine .fine-tasti{gap:8px;margin:0}
.schermata.lt-fine>.piede .btn{width:auto;min-width:0;min-height:50px;margin:0;padding:0 10px;border:0;font-size:15.5px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.schermata.lt-fine>.piede .btn-primario,.schermata.lt-fine>.piede .ft-primo{flex:1 1 0}
.schermata.lt-fine>.piede .btn-fantasma:not(.ft-primo){flex:0 0 84px;box-shadow:inset 0 0 0 1px rgba(195,154,72,.7)}
.schermata.lt-fine>.piede .ft-punti{flex:1 1 100%;min-height:0;font-family:var(--r-serif)}
@media (max-width:375px){
.schermata.lt-fine>.piede .btn{font-size:14.5px}
}
@media (max-width:340px){
.schermata.lt-fine>.piede .btn{padding:0 6px;font-size:13.5px}
.schermata.lt-fine>.piede .btn-fantasma:not(.ft-primo){flex:0 0 64px}
}
@media (max-height:680px){
.lt-ultima .chiusa{display:none}
}
@media (orientation:landscape) and (max-height:520px){
.schermata.lt-fine{display:grid;grid-template-columns:minmax(0,1fr) 216px;grid-template-rows:auto minmax(0,1fr);column-gap:12px}
.schermata.lt-fine>.contenuto{display:contents}
.lt-ultima.lt-foglio{grid-column:1;grid-row:1/-1;max-width:none;height:100%;margin:0;gap:3px;padding:9px 12px 9px}
.lt-ultima .tes{grid-template-columns:auto minmax(0,1fr);align-items:baseline;column-gap:12px;justify-items:start;text-align:left}
.lt-ultima .tes .occh{display:none}
.lt-ultima h2{font-size:22px;white-space:nowrap}
.lt-ultima .lt-perche{font-size:14px}
.schermata.lt-fine .lt-ultima .classifica{flex:1 1 auto;grid-template-columns:minmax(0,1fr);align-content:start;max-height:none}
.lt-ultima .col+.col{box-shadow:none}
.lt-ultima .righe{grid-template-columns:repeat(auto-fill,minmax(122px,1fr))}
.lt-ultima .rg{min-height:40px}
.lt-ultima .chiusa{display:none}
.schermata.lt-fine .fine-fila{grid-column:2;grid-row:1;flex-wrap:wrap;margin:0}
.schermata.lt-fine .fine-fila .lt-voce{flex:1 1 100%}
.schermata.lt-fine .fine-fila .lt-vbtn{flex:1 1 auto;box-shadow:inset 0 -1px 0 rgba(195,154,72,.4)}
.schermata.lt-fine .fine-faccine{flex:1 1 100%}
.schermata.lt-fine>.piede{grid-column:2;grid-row:2;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;padding-top:6px}
.schermata.lt-fine .fine-tasti{display:flex;flex-direction:column;flex-wrap:nowrap;gap:6px;width:100%}
.schermata.lt-fine>.piede{flex-wrap:nowrap;margin:0;max-width:none}
.schermata.lt-fine>.piede .btn,.schermata.lt-fine>.piede .btn-primario,.schermata.lt-fine>.piede .ft-primo,.schermata.lt-fine>.piede .btn-fantasma:not(.ft-primo){flex:none;width:100%;padding:0 6px;font-size:14px}
}

@media (prefers-reduced-motion:reduce){.lt-scena *,.lt-scena *::before,.lt-scena *::after,.lt-pc *,.lt-pc *::before,.lt-pc *::after,.lt-fine *,.lt-fine *::before,.lt-fine *::after{animation-duration:.01ms!important;animation-delay:0s!important;transition-duration:.01ms!important}}
`.replace("@GRANA@", GRANA).replace("@SIGILLO@", ltCera(true)).replace("@VUOTO@", ltCera(false)).replace("@PALLIDO@", ltCera(false, true)).replace("@FILIGRANA@", ltFiligrana()).replace("@LANTERNA@", ltFiligrana("#c39a48", ".85")).replace("@SAGOMA@", ltSagoma()).replace("@SPUNTA@", ltSpunta()).replace("@STRAPPO@", ltStrappo()).replace("@DENTELLI@", ltDentelli());
}
var cssFatto = false;
function stile() {
  if (cssFatto) return; cssFatto = true;
  var st = document.createElement("style");
  st.textContent = [
    ".schermata.lt-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#140c08;color:#f1e8d6}",
    ".schermata.lt-piena>.testa,.schermata.lt-piena>.piede{display:none}",
    ".schermata.lt-piena>.contenuto{height:100%;margin:0;padding:0}",
    ".lt-scena{position:fixed;left:0;top:0;z-index:800;width:100vw;height:var(--alt,100dvh);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"SF Pro Display\",\"Helvetica Neue\",\"Inter\",system-ui,sans-serif;-webkit-font-smoothing:antialiased;letter-spacing:-.005em;user-select:none;-webkit-user-select:none;touch-action:none;--lt-ease:cubic-bezier(.22,1,.36,1)}",
    ".lt-scena [hidden]{display:none!important}",
    ".lt-cv{position:absolute;inset:0;width:100%;height:100%;display:block}",
    ".lt-joyzona{position:absolute;left:0;top:0;bottom:0;width:50%;touch-action:none}",
    ".lt-joy{position:absolute;left:84px;bottom:56px;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;border:2px solid rgba(241,232,214,.22);background:rgba(241,232,214,.05);pointer-events:none;opacity:.4;transition:opacity .2s var(--lt-ease)}",
    ".lt-joy.on{opacity:1;bottom:auto}",
    ".lt-knob{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;background:rgba(231,183,92,.5);box-shadow:0 0 16px rgba(231,183,92,.4)}",
    ".lt-sx{position:absolute;left:calc(10px + env(safe-area-inset-left));top:calc(8px + env(safe-area-inset-top));width:min(230px,52vw);display:flex;flex-direction:column;gap:6px;align-items:flex-start;pointer-events:none}",
    ".lt-sx>*{pointer-events:auto}.lt-riga{display:flex;gap:8px;align-items:center}",
    ".lt-esci{width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer}",
    ".lt-chip{display:inline-flex;align-items:center;gap:6px;min-height:30px;box-sizing:border-box;padding:4px 7px 4px 11px;border-radius:999px;font:inherit;font-weight:600;font-size:.72rem;letter-spacing:.07em;text-transform:uppercase;background:rgba(33,21,14,.88);color:#f6d999;border:1px solid rgba(231,183,92,.4);cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent;transition:transform .16s var(--lt-ease)}.lt-chip:active{transform:scale(.95)}.lt-chip::after{content:'i';flex:none;width:17px;height:17px;border-radius:50%;border:1px solid currentColor;display:grid;place-items:center;font:700 italic 11px Georgia,'Times New Roman',serif;letter-spacing:0;text-transform:none;opacity:.85}.lt-scena.sal .lt-chip::after{display:none}",
    ".lt-scena:not(.oriz) .lt-chip.lunga{font-size:.64rem;letter-spacing:.03em;padding:4px 5px 4px 8px;gap:4px}.lt-scena:not(.oriz) .lt-chip.lunghissima{font-size:.58rem;letter-spacing:0}",
    "@media (max-width:380px){.lt-scena:not(.oriz) .lt-dx .lt-hbtn:not(.ico) span{display:none}}",
    ".lt-chip[data-squadra=ombre]{color:#f2a7b6;border-color:rgba(208,80,106,.5)}.lt-chip[data-squadra=soli]{color:#d5c9f7;border-color:rgba(169,147,230,.5)}",   // (fondo pieno: anche il fantasma, che vede tutto chiaro, lo legge sul marmo)
    ".lt-barra{width:100%;display:grid;gap:3px;font-size:.66rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#d9d2c3;text-shadow:0 0 2px #0a0705,0 1px 3px #0a0705,0 0 6px rgba(10,7,5,.8)}",
    ".lt-barra .tr{height:7px;border-radius:4px;background:rgba(14,9,6,.78);box-shadow:0 0 0 1px rgba(241,232,214,.16);overflow:hidden}.lt-barra i{display:block;height:100%;width:0;background:linear-gradient(90deg,#c9923a,#f6d999);transition:width .3s var(--lt-ease)}",
    ".lt-scena.oriz .lt-velo{padding:8px max(10px,env(safe-area-inset-right)) 8px max(10px,env(safe-area-inset-left))}",
    ".lt-scena.oriz .lt-minimappa{height:min(78%,420px)}",
    ".lt-scena.sal .lt-barra,.lt-scena.sal .lt-lista-btn,.lt-scena.sal .lt-lista,.lt-scena.sal .lt-ibtn,.lt-scena.sal .lt-info{display:none!important}",
    ".lt-scena.sal:not(.oriz) .lt-chip{display:none}",   // (in verticale la riga non basta per tutto: «Saletta» lo dice già la stanza)
    ".lt-saletta{position:absolute;z-index:1;left:0;right:0;margin:0 auto;top:calc(8px + env(safe-area-inset-top));width:max-content;max-width:calc(100% - 180px);box-sizing:border-box;min-height:36px;white-space:nowrap;display:flex;align-items:center;gap:8px;padding:5px 6px 5px 12px;border-radius:999px;background:rgba(20,12,8,.86);border:1px solid rgba(195,154,72,.55);font-weight:600;font-size:.85rem;color:#f0dcae}",
    ".lt-scena.sal:not(.oriz) .lt-saletta{left:calc(54px + env(safe-area-inset-left));right:auto;margin:0;max-width:calc(100% - 192px - env(safe-area-inset-left) - env(safe-area-inset-right));padding:3px 4px 3px 10px;gap:6px}.lt-saletta .cod{min-width:0;overflow:hidden;text-overflow:ellipsis}",
    ".lt-saletta .inv{display:inline-flex;align-items:center;gap:5px;font:inherit;font-weight:700;font-size:.8rem;border:0;border-radius:999px;padding:6px 11px;background:linear-gradient(180deg,#d9b56a,#a9812f);color:#22140a;cursor:pointer}",
    ".lt-foto{max-width:360px;display:flex;flex-direction:column;align-items:center;gap:8px}.lt-foto .testa{display:flex;align-items:center;gap:8px;width:100%}.lt-foto h3{margin:0;flex:1;color:#e9d3ae}.lt-foto .lt-chiudi{position:static}",
    "canvas.foto{display:block;width:min(260px,100%);aspect-ratio:4/3;height:auto;border:6px solid #efe6d2;border-bottom-width:18px;border-radius:2px;box-shadow:0 8px 20px rgba(0,0,0,.5);transform:rotate(-1.5deg);background:#2b2420}",
    ".lt-foto .nota{margin:0;font-size:.8rem;color:#b8b1a2}.lt-foto .rifai{display:inline-flex;align-items:center;gap:6px;font:inherit;font-weight:700;border:0;border-radius:10px;padding:9px 16px;background:#35241a;color:#f1e8d6;border:1px solid rgba(241,232,214,.18);cursor:pointer}.lt-foto .rifai:disabled{opacity:.45}",
    ".lt-ibtn{flex:none;width:26px;height:26px;margin-left:6px;border-radius:50%;border:1.5px solid rgba(246,217,153,.65);background:rgba(33,21,14,.85);color:#f6d999;font:700 italic 14px Georgia,'Times New Roman',serif;line-height:1;cursor:pointer;display:grid;place-items:center}.lt-chip{cursor:pointer}",
    ".lt-scena svg.ico,.lt-pc svg.ico{width:1.2em;height:1.2em;flex:none;vertical-align:-.22em}",
    ".lt-hbtn{display:inline-flex;align-items:center;gap:5px}.lt-hbtn.ico{padding:5px 8px}.lt-hbtn.acceso{color:#f6d999;border-color:rgba(231,183,92,.65);background:rgba(231,183,92,.16)}",
    ".lt-intro .icona svg{width:84px;height:84px;color:#f6d999;stroke-width:1.4}.lt-pc-schede b svg{width:20px;height:20px}",
    ".lt-minimappa .testa b{display:inline-flex;align-items:center;gap:6px}.lt-minimappa .leg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 4px 0 10px;vertical-align:middle;box-shadow:0 0 0 1px rgba(0,0,0,.4)}",
    ".lt-parla{position:absolute;z-index:5;left:0;right:0;margin:0 auto;bottom:calc(8px + max(env(safe-area-inset-bottom,0px),var(--sotto,0px)));width:min(440px,calc(100% - 24px));display:grid;gap:6px;padding:7px;border-radius:14px;background:rgba(20,12,8,.93);border:1px solid rgba(241,232,214,.18);box-shadow:0 8px 24px rgba(0,0,0,.45);animation:ltSale .2s var(--lt-ease)}",
    ".lt-parla.alto{bottom:auto;top:calc(58px + env(safe-area-inset-top))}",
    ".lt-pt{display:flex;justify-content:space-between;gap:8px;padding:0 3px;font-size:.7rem;font-weight:600;letter-spacing:.03em;color:#b8b1a2}.lt-udi{transition:color .2s var(--lt-ease)}.lt-udi.si{color:#f6d999}.lt-cont.pieno{color:#f2a7b6}",
    ".lt-pcho{display:flex;flex-wrap:wrap;gap:5px}.lt-pcho button{font:inherit;font-size:.78rem;font-weight:600;color:#f1e8d6;background:#35241a;border:1px solid rgba(241,232,214,.16);border-radius:999px;padding:5px 11px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .16s var(--lt-ease),background .2s var(--lt-ease)}.lt-pcho button:active{transform:scale(.94);background:#4a3325}",
    ".lt-priga{display:flex;gap:6px}.lt-priga input{flex:1;min-width:0;-webkit-user-select:text;user-select:text;font:inherit;font-size:16px;color:#f1e8d6;background:#140c08;border:1px solid rgba(241,232,214,.18);border-radius:10px;padding:7px 10px;transition:border-color .2s var(--lt-ease),box-shadow .2s var(--lt-ease)}.lt-priga input:focus{outline:none;border-color:rgba(231,183,92,.7);box-shadow:0 0 0 3px rgba(231,183,92,.18)}",
    ".lt-priga button{flex:none;width:42px;border-radius:10px;border:0;background:linear-gradient(180deg,#e7b75c,#c9923a);color:#1d1508;display:grid;place-items:center;cursor:pointer;touch-action:manipulation;transition:transform .16s var(--lt-ease)}.lt-priga button:active{transform:scale(.92)}",
    ".lt-chatst{position:absolute;z-index:4;left:calc(10px + env(safe-area-inset-left));bottom:calc(196px + env(safe-area-inset-bottom));width:min(60%,300px);display:flex;flex-direction:column;gap:3px;pointer-events:none}",
    ".lt-ch{align-self:flex-start;max-width:100%;overflow-wrap:anywhere;font-size:.8rem;line-height:1.3;color:#f1e8d6;background:rgba(20,12,8,.7);border-radius:10px;padding:3px 9px;transition:opacity .3s var(--lt-ease);animation:ltSale .2s var(--lt-ease)}.lt-ch b{margin-right:6px;font-weight:700;color:#f6d999}.lt-ch.io b{color:#b8b1a2}",
    ".lt-scena.oriz .lt-chatst{bottom:calc(110px + env(safe-area-inset-bottom))}",
    ".lt-ch.w{font-style:italic;color:#c9c2b4}.lt-ch.a{background:rgba(110,130,200,.38);color:#dfe8ff}.lt-ch.a b{color:#c9d8ff}",
    ".lt-lista-btn{display:inline-flex;align-items:center;gap:5px}.lt-lista-btn,.lt-hbtn{font:inherit;font-weight:700;font-size:.8rem;color:#f1e8d6;background:rgba(33,21,14,.85);border:1px solid rgba(241,232,214,.2);border-radius:9px;padding:5px 10px;cursor:pointer}",
    ".lt-lista{list-style:none;margin:0;padding:7px 9px;display:grid;gap:3px;background:rgba(20,12,8,.78);border-radius:10px;font-size:.78rem;line-height:1.3}",
    ".lt-lista li.fatto{opacity:.45;text-decoration:line-through}.lt-lista b{color:#f6d999}.lt-lista .nota{color:#b8b1a2;font-style:italic}",
    ".lt-dx{position:absolute;right:calc(10px + env(safe-area-inset-right));top:calc(8px + env(safe-area-inset-top))}",
    ".lt-guida{position:absolute;left:50%;bottom:calc(160px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100% - 24px);font-weight:600;font-size:.82rem;text-align:center;color:#f6d999;background:rgba(20,12,8,.82);border:1px solid rgba(231,183,92,.45);padding:6px 12px;border-radius:999px;pointer-events:none}",
    "@media (max-height:480px){.lt-guida{bottom:calc(20px + env(safe-area-inset-bottom))}}",
    ".lt-botola{position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 0 16vmin,rgba(4,6,14,.55) 34vmin,rgba(4,6,14,.85));animation:ltMorteEntra .2s var(--lt-ease) both}",
    ".lt-botola .qui{position:absolute;left:0;right:0;top:calc(14px + env(safe-area-inset-top));text-align:center;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:.8rem;color:rgba(203,162,255,.85)}",
    ".lt-botola button{pointer-events:auto;position:absolute;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .16s var(--lt-ease)}.lt-botola button:active{transform:translate(-50%,-50%) scale(.92)}",
    ".lt-botola .va{transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 8px;border-radius:14px;background:rgba(36,26,58,.9);border:1px solid rgba(203,162,255,.55);color:#e4d6ff;box-shadow:0 6px 18px rgba(0,0,0,.45)}",
    ".lt-botola .va svg{width:30px;height:30px;transform:rotate(var(--a))}.lt-botola .va span{font-size:.68rem;font-weight:600;white-space:nowrap}",
    ".lt-botola .esci{left:50%;top:50%;transform:translate(-50%,-50%);width:74px;height:74px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#4a3a6e,#241a3a);border:2px solid rgba(203,162,255,.7);color:#f1e8ff;font-weight:700;font-size:.9rem;box-shadow:0 0 0 6px rgba(203,162,255,.12),0 8px 22px rgba(0,0,0,.5)}",
    ".lt-nomestanza{position:absolute;left:0;right:0;top:30%;z-index:2;text-align:center;pointer-events:none;font-weight:700;font-size:clamp(1.6rem,6vmin,2.6rem);letter-spacing:.14em;text-transform:uppercase;color:rgba(246,217,153,.55);text-shadow:0 1px 0 rgba(255,236,190,.35),0 3px 0 rgba(90,60,20,.45),0 10px 24px rgba(0,0,0,.55);opacity:0;perspective:600px}",
    ".lt-nomestanza.su{animation:ltNomeStanza 1.6s var(--lt-ease) both}@keyframes ltNomeStanza{0%{opacity:0;transform:translateY(10px) rotateX(55deg) scale(.92)}18%{opacity:1;transform:none}70%{opacity:.9;transform:none}100%{opacity:0;transform:translateY(-8px) scale(1.03)}}",
    ".lt-guida{transition:opacity .35s var(--lt-ease),transform .35s var(--lt-ease)}.lt-guida.via{opacity:0;transform:translateX(-50%) translateY(6px);pointer-events:none}",
    ".lt-scena.oriz .lt-guida{top:calc(10px + env(safe-area-inset-top));bottom:auto;max-width:calc(100% - 480px);min-width:150px;background:rgba(20,12,8,.55)}",
    ".lt-guida.rosso{color:#ffd0d8;background:rgba(120,25,45,.85);border-color:rgba(240,90,110,.7);animation:ltPulsa 1.2s var(--lt-ease) infinite alternate}",
    "@keyframes ltPulsa{from{opacity:.7}to{opacity:1}}",
    ".lt-via{position:absolute;left:50%;bottom:calc(100px + env(safe-area-inset-bottom));transform:translateX(-50%)}.lt-vai{width:auto;min-width:160px;margin:0}",
    ".lt-azioni{position:absolute;right:calc(12px + env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(3,62px);grid-template-rows:repeat(2,62px);gap:9px;grid-template-areas:'abil botola buio' 'segnala spegni usa'}",
    ".lt-az{position:relative;width:62px;height:62px;border-radius:50%;border:1.5px solid rgba(241,232,214,.3);background:rgba(33,21,14,.85);color:#f1e8d6;font:inherit;font-weight:600;font-size:.62rem;letter-spacing:.02em;text-transform:uppercase;display:grid;place-items:center;padding:0;touch-action:manipulation;transition:transform .16s var(--lt-ease),opacity .2s var(--lt-ease)}",
    ".lt-az:active:not(:disabled){transform:scale(.9)}.lt-az:disabled{opacity:.62;border-color:rgba(255,255,255,.35)}.lt-az .et{position:absolute;inset:0;pointer-events:none}.lt-az .ic{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;overflow:hidden;border-radius:50%}.lt-az .ic svg.ico{width:78%;height:78%;vertical-align:baseline;opacity:.3;stroke-width:1.5;transition:opacity .2s var(--lt-ease)}.lt-az:disabled .ic svg.ico{opacity:.22}.lt-az.conta .ic svg.ico{opacity:.18}.lt-az .et text{paint-order:stroke;stroke:rgba(14,9,6,.55);stroke-width:2.4px;stroke-linejoin:round}.lt-az.oro:not(:disabled) .et text{stroke:rgba(255,236,190,.7)}.lt-az .et svg{display:block;width:100%;height:100%;overflow:visible;fill:currentColor;font:inherit;font-weight:600;letter-spacing:.02em;text-transform:uppercase}",
    ".lt-az.oro{border-color:rgba(231,183,92,.75);background:rgba(231,183,92,.22)}.lt-az.oro:not(:disabled){border-color:#f6d999;background:#e7b75c;color:#1d1508}.lt-az.rosso{border-color:rgba(208,80,106,.8);background:rgba(208,80,106,.26)}.lt-az.viola{border-color:rgba(169,147,230,.75);background:rgba(169,147,230,.2)}",
    ".lt-az.telo,.lt-az.telo:disabled{opacity:1;background:var(--telo,#7c8088);border:2px solid var(--orlo,#b4b8c0);box-shadow:0 2px 7px rgba(0,0,0,.5);transition:transform .16s var(--lt-ease),background-color .2s var(--lt-ease),border-color .2s var(--lt-ease)}",
    ".lt-az.conta .et{visibility:hidden}",
    ".lt-az .cd{position:absolute;inset:0;display:grid;place-items:center;font-size:1.15rem;background:rgba(14,9,6,.62);border-radius:50%}",
    ".lt-avviso{position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top));transform:translate(-50%,-6px);box-sizing:border-box;width:max-content;max-width:calc(100% - 32px);font-weight:700;font-size:.9rem;text-align:center;background:rgba(33,21,14,.95);border:1px solid rgba(231,183,92,.4);padding:9px 13px;border-radius:12px;opacity:0;pointer-events:none;transition:opacity .22s var(--lt-ease),transform .22s var(--lt-ease);z-index:5}",   // (sopra la scritta grande della riunione: gli avvisi privati di quel momento si devono leggere)
    ".lt-avviso.su{opacity:1;transform:translate(-50%,0)}.lt-avviso.ombra,.lt-avviso.morte{border-color:rgba(208,80,106,.7)}",
    ".lt-velo.passa{background:none;align-items:flex-start;pointer-events:none;padding-top:calc(58px + env(safe-area-inset-top))}.lt-velo.passa .lt-pannello{pointer-events:auto;max-width:360px;box-shadow:0 8px 24px rgba(0,0,0,.45)}",
    ".lt-velo{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;background:rgba(14,9,6,.78);padding:calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom))}",
    ".lt-pannello{position:relative;width:100%;max-width:480px;max-height:100%;box-sizing:border-box;background:linear-gradient(180deg,#2e1e14,#1f140d);border:1px solid rgba(195,154,72,.38);border-radius:6px;padding:16px;animation:ltSale .24s var(--lt-ease)}",
    "@keyframes ltSale{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}",
    ".lt-pannello h2,.lt-pannello h3{margin:0;color:#e7b75c;font-weight:700;letter-spacing:-.02em;line-height:1.15}",
    ".lt-compito{text-align:center}.lt-compito h3{font-size:1.3rem;padding-right:34px}",
    ".lt-chiudi{position:absolute;top:10px;right:10px;width:44px;height:44px;border-radius:50%;background:#35241a;border:1px solid rgba(241,232,214,.2);color:#f1e8d6;font-size:1.2rem;cursor:pointer;transition:transform .16s var(--lt-ease)}.lt-chiudi:active{transform:scale(.92)}",
    ".lt-istr{color:#b8b1a2;margin:6px 0 14px;font-size:.92rem}.lt-ok{font-weight:600;color:#7fb68f;margin:10px 0 0}",
    ".lt-mg{display:grid;justify-items:center;gap:12px}",
    ".lt-tieni{width:140px;height:140px;border-radius:50%;border:0;background:#140c08;position:relative;display:grid;place-items:center;color:#f1e8d6;font:inherit;font-weight:600;text-transform:uppercase;touch-action:none;transition:transform .16s var(--lt-ease)}",
    ".lt-tieni.giu{transform:scale(.95)}.lt-tieni svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}.lt-tieni .tr{fill:none;stroke:rgba(241,232,214,.12);stroke-width:9}.lt-tieni .rp{fill:none;stroke:#e7b75c;stroke-width:9;stroke-linecap:round}",
    ".lt-seq{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.lt-seq button{width:52px;height:70px;border-radius:8px;border:1px solid rgba(241,232,214,.2);background:linear-gradient(180deg,#5b3d2a,#3f2a1d);color:#f1e8d6;font:inherit;font-weight:600;font-size:1.3rem;transition:transform .16s var(--lt-ease)}",
    ".lt-seq button.ok{background:linear-gradient(180deg,#e7b75c,#b9862f);color:#1d1508}",
    ".lt-leva{position:relative;width:100%;max-width:320px;height:44px;border-radius:10px;background:#140c08;overflow:hidden}.lt-leva .zona{position:absolute;top:0;bottom:0;background:rgba(231,183,92,.32);border-left:2px solid #e7b75c;border-right:2px solid #e7b75c}.lt-leva .ago{position:absolute;top:4px;bottom:4px;width:6px;margin-left:-3px;border-radius:3px;background:#f1e8d6}",
    ".lt-btn{font:inherit;font-weight:600;color:#1d1508;background:#e7b75c;border:0;border-radius:12px;padding:12px 26px;touch-action:none;transition:transform .16s var(--lt-ease)}.lt-btn.giu,.lt-btn:active{transform:scale(.96)}",
    ".lt-tr{position:relative;width:100%;max-width:320px;height:200px;border-radius:12px;background:#140c08}.lt-tr .meta{position:absolute;right:8px;top:8px;bottom:8px;width:44%;border:2px dashed rgba(231,183,92,.6);border-radius:10px;display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px;padding:6px;box-sizing:border-box}.lt-tr .meta span{width:100%;font-size:.7rem;color:#b8b1a2;text-transform:uppercase;font-weight:600}",
    ".lt-tr .cosa{position:absolute;width:54px;height:54px;touch-action:none;cursor:grab;z-index:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))}.lt-tr .cosa svg{display:block;width:100%;height:100%;pointer-events:none}.lt-tr .cosa.su{z-index:3;transform-origin:center}.lt-tr .meta .cosa{position:relative;width:40px;height:40px}.lt-tr .meta .sfondo{position:absolute;inset:4px;width:calc(100% - 8px);height:calc(100% - 8px);z-index:0;pointer-events:none}.lt-tr .meta span{position:relative;z-index:1}",
    ".lt-vaso{position:relative;width:110px;height:170px;border:3px solid rgba(241,232,214,.5);border-top:0;border-radius:0 0 18px 18px;overflow:hidden;background:rgba(20,12,8,.6)}.lt-vaso .liv{position:absolute;left:0;right:0;bottom:0;height:0}.lt-vaso .fascia{position:absolute;left:0;right:0;background:rgba(231,183,92,.35);border-top:2px solid #e7b75c;border-bottom:2px solid #e7b75c;z-index:1}",
    ".lt-quadri{display:grid;grid-template-columns:repeat(2,84px);gap:10px}.lt-quadri .q{width:84px;height:84px;border-radius:6px;border:0;padding:0;background:transparent;display:grid;place-items:center;transition:box-shadow .2s var(--lt-ease)}.lt-quadri .q span{display:block;width:78px;height:78px;transition:transform .2s var(--lt-ease)}.lt-quadri .q svg{display:block;width:100%;height:100%}.lt-quadri .q.ok{box-shadow:0 0 0 3px #e7b75c,0 0 18px rgba(231,183,92,.45)}",
    ".lt-scuoti{animation:ltScuoti .3s var(--lt-ease)}@keyframes ltScuoti{0%,100%{translate:0}25%{translate:-8px}50%{translate:7px}75%{translate:-4px}}",
    ".lt-scena.lt-ruota{transform-origin:0 0}",
    ".lt-scena,.lt-scena *,.lt-pc,.lt-pc *{touch-action:manipulation}.lt-scena .lt-joyzona,.lt-scena canvas{touch-action:none}",
    ".lt-morte{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;text-align:center;background:radial-gradient(ellipse at center,rgba(70,10,22,.92),rgba(5,4,10,.97) 70%);animation:ltMorteEntra .25s var(--lt-ease) both}",
    ".lt-morte.via{animation:ltMorteVia .3s var(--lt-ease) both}@keyframes ltMorteEntra{from{opacity:0}to{opacity:1}}@keyframes ltMorteVia{to{opacity:0}}",
    ".lt-morte .palco{display:flex;align-items:flex-end;justify-content:center;gap:4%;width:100%;height:46%}",
    ".lt-morte .killer,.lt-morte .vittima{min-width:0;height:100%;object-fit:contain;object-position:50% 100%}.lt-morte .killer{flex:0 1 43%;width:43%}.lt-morte .vittima{flex:0 1 53%;width:53%}.lt-morte .sagoma{width:18%;max-width:120px;height:auto;aspect-ratio:1/2;border-radius:50% 50% 14% 14%/34% 34% 10% 10%;background:linear-gradient(#3a2a20,#1e130c)}",
    ".lt-morte .killer{filter:drop-shadow(0 0 18px rgba(240,90,110,.75));animation:ltKiller .45s var(--lt-ease) .1s both}@keyframes ltKiller{from{opacity:0;transform:translateX(-40%) scale(.9)}to{opacity:1;transform:none}}",
    ".lt-morte h2{margin:10px 0 0;font-size:1.45rem;font-weight:700;letter-spacing:-.02em;color:#ff9aa9;animation:ltKiller .4s var(--lt-ease) .5s both}.lt-morte p{margin:0;color:#c9bfb0;font-size:.9rem;animation:ltKiller .4s var(--lt-ease) .9s both}",
    ".lt-minimappa{position:absolute;z-index:3;left:0;right:0;margin:0 auto;top:calc(8px + env(safe-area-inset-top));width:min(560px,calc(100% - 24px));height:min(58%,420px);display:flex;flex-direction:column;padding:6px 8px 6px;border-radius:14px;background:rgba(20,12,8,.86);border:1px solid rgba(231,183,92,.3);box-shadow:0 10px 30px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:ltSale .22s var(--lt-ease)}",
    ".lt-minimappa .testa{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.82rem;color:#f6d999}.lt-minimappa .lt-chiudi{position:static;width:34px;height:34px;flex:none;font-size:1.3rem}",
    ".lt-minimappa canvas{display:block;margin:2px auto 0;border-radius:8px;max-width:100%;flex:1 1 auto;min-height:0;object-fit:contain}.lt-minimappa .leg{margin:4px 0 0;font-size:.7rem;color:#b8b1a2;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".lt-mappa{max-width:960px;text-align:center;padding:10px}.lt-mappa canvas{display:block;margin:0 auto;border-radius:10px;max-width:100%}.lt-mappa p{margin:8px 0 0;font-size:.78rem;color:#b8b1a2}",
    ".lt-bot{display:flex;gap:8px;flex-wrap:wrap}.lt-bot .btn{flex:1;margin:0;white-space:nowrap;font-size:.95rem}",
    ".lt-perche{text-align:center;margin:0 0 10px;opacity:.8;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"SF Pro Display\",\"Helvetica Neue\",\"Inter\",system-ui,sans-serif}.lt-ruolo{font-size:.8rem}",
    ".schermata.lt-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
    ".lt-dx{display:flex;gap:6px}",
    ".lt-vx{position:absolute;right:calc(10px + env(safe-area-inset-right));top:calc(54px + env(safe-area-inset-top));display:flex}",
    ".lt-voce{display:flex;flex-direction:column;align-items:flex-end;gap:6px}.lt-voce.riga{flex-direction:row;align-items:center;gap:6px}.lt-voce.fine{justify-content:center;margin:10px 0 2px}",
    ".lt-voce svg.ico{width:1.2em;height:1.2em;flex:none;vertical-align:-.22em}",
    ".lt-vbtn{font:inherit;font-weight:700;font-size:.8rem;color:#f1e8d6;background:rgba(33,21,14,.88);border:1px solid rgba(241,232,214,.22);border-radius:9px;padding:6px 11px;display:inline-flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;transition:transform .16s var(--lt-ease,cubic-bezier(.22,1,.36,1)),background-color .2s var(--lt-ease,cubic-bezier(.22,1,.36,1)),border-color .2s var(--lt-ease,cubic-bezier(.22,1,.36,1)),color .2s var(--lt-ease,cubic-bezier(.22,1,.36,1))}",
    ".lt-vbtn:active{transform:scale(.94)}",
    ".lt-vbtn.spenta{color:#f1e8d6;border-color:rgba(255,255,255,.35);background:rgba(33,21,14,.88)}",   // (l'oro resta solo per ciò che si può usare)
    ".lt-vbtn.parlo,.lt-vbtn.muto{font-size:.72rem;padding:4px 9px}",
    ".lt-vbtn.parlo{color:#d6fbe6;border-color:rgba(126,232,176,.6);background:rgba(46,150,104,.28)}.lt-vbtn.muto{color:#ffd0d8;border-color:rgba(240,90,110,.7);background:rgba(120,25,45,.6)}",
    ".lt-vbtn.accendo{opacity:.75;animation:ltVoceAttesa .9s var(--lt-ease,cubic-bezier(.22,1,.36,1)) infinite alternate}@keyframes ltVoceAttesa{to{opacity:.4}}@keyframes ltVoceInvito{to{box-shadow:0 0 0 4px rgba(231,183,92,.22)}}",
    "@media (prefers-reduced-motion:reduce){.lt-voce *{animation:none!important;transition:none!important}.lt-carica,.lt-carica *{animation:none!important;transition:none!important}}",
    ".lt-carica{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:radial-gradient(ellipse at 50% 42%,#1a1f38,#090b16 72%);opacity:0;transition:opacity .3s var(--lt-ease,cubic-bezier(.22,1,.36,1));touch-action:none}.lt-carica[hidden]{display:none}.lt-carica.su{opacity:1}",
    ".lt-carica svg.ico{width:72px;height:72px;color:#e7b75c;stroke-width:1.5;vertical-align:baseline}.lt-carica svg.ico path:last-child{fill:#f6d999;stroke:none;transform-box:fill-box;transform-origin:50% 100%;animation:ltFiamma 1.1s ease-in-out infinite alternate}@keyframes ltFiamma{to{transform:scale(1.18,1.3);opacity:.75}}",
    ".lt-carica .tit{font-weight:700;font-size:1.05rem;color:#f1e8d6;letter-spacing:-.01em}.lt-carica .bar{width:min(220px,60%);height:5px;border-radius:3px;background:rgba(241,232,214,.14);overflow:hidden}.lt-carica .bar i{display:block;height:100%;width:0;background:#e7b75c;border-radius:3px;transition:width .3s var(--lt-ease,cubic-bezier(.22,1,.36,1))}.lt-carica .num{font-size:.8rem;font-weight:700;color:#b8b1a2;font-variant-numeric:tabular-nums}",
    ".lt-premappa{position:absolute;z-index:1;left:0;right:0;margin:0 auto;width:max-content;max-width:calc(100% - 180px);top:calc(52px + env(safe-area-inset-top));font-size:.68rem;font-weight:700;color:#b8b1a2;background:rgba(20,12,8,.62);border-radius:999px;padding:2px 9px;display:flex;align-items:center;gap:6px;pointer-events:none}.lt-mappa[hidden]{display:none}.lt-mappa.ok{color:#9fe3bd}",
    ".lt-premappa i{display:inline-block;width:34px;height:3px;border-radius:2px;background:rgba(241,232,214,.18);position:relative;overflow:hidden}.lt-premappa i:after{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--p,0%);background:#e7b75c;transition:width .3s var(--lt-ease,cubic-bezier(.22,1,.36,1))}.lt-mappa.ok i{display:none}",
    ".lt-info{font-size:.74rem;font-weight:700;color:#f6d999;background:rgba(20,12,8,.78);border-radius:8px;padding:4px 8px;line-height:1.3}",
    ".lt-cam{display:flex;flex-direction:column;gap:8px;max-width:640px}.lt-cam .testa{display:flex;justify-content:space-between;align-items:center}.lt-cam .lt-chiudi{position:static}",
    ".lt-cam .griglia{display:grid;grid-template-columns:1fr 1fr;gap:6px}.lt-cam .schermo{position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#000;border:2px solid #2f3b44}.lt-cam .schermo canvas{width:100%;height:100%;display:block}",
    ".lt-cam .nav{display:flex;justify-content:center;align-items:center;gap:14px;font-weight:600}.lt-cam .nav button{font:inherit;font-size:1.2rem;font-weight:700;color:#f1e8d6;background:#35241a;border:1px solid rgba(241,232,214,.2);border-radius:10px;width:44px;height:36px}",
    ".lt-plastico h3{margin-bottom:6px}.lt-plastico{box-sizing:border-box;width:100%}",
    "@media (max-width:600px){.lt-plastico canvas{width:100%!important;height:auto!important}.lt-plastico p{margin-top:6px}}",
    ".lt-mod{color:#cbbcf6!important;font-weight:700}",
    ".lt-fermo{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;pointer-events:none;font-size:3.2rem;font-weight:700;letter-spacing:.08em;color:#ffd0d8;text-shadow:0 0 24px rgba(208,80,106,.8);background:radial-gradient(circle,rgba(90,20,35,.15),rgba(90,20,35,.55));animation:ltPulsa .8s var(--lt-ease) infinite alternate}",
    ".lt-fermo small{font-size:.9rem;letter-spacing:0;font-weight:700}",
    ".lt-registro{list-style:none;margin:0;padding:5px 8px;background:rgba(20,12,8,.78);border-radius:8px;font-size:.72rem;line-height:1.35;display:grid;gap:1px}.lt-registro .entra{color:#8ee6a8}.lt-registro .esce{color:#ffb3a1}",
    ".lt-info.urgente{color:#ffd0d8;background:rgba(120,25,45,.85);animation:ltPulsa .5s var(--lt-ease) infinite alternate}",
    ".lt-intro{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;pointer-events:none;background:radial-gradient(circle,rgba(50,18,24,.95),rgba(14,9,6,.98));animation:ltIntro 2s var(--lt-ease) both}",
    ".lt-intro.corpo{background:radial-gradient(circle,rgba(92,16,32,.95),rgba(14,9,6,.98))}",
    ".lt-intro .icona{font-size:4rem;animation:ltDondola .5s ease-in-out 3 alternate}.lt-intro h2{margin:0;padding:0 14px;font-family:var(--r-serif);font-size:2.5rem;font-weight:700;line-height:1.08;letter-spacing:0;color:#f6d999;animation:ltColpo .5s var(--lt-ease) both}",
    ".lt-intro.corpo h2{color:#f6d999}.lt-intro p{margin:0;font-family:var(--r-serif);font-size:1.1rem;font-style:italic;color:#f1e8d6}",
    ".lt-scena.oriz .lt-intro{padding-top:48px;gap:6px}.lt-scena.oriz .lt-intro .icona{font-size:2.5rem;line-height:1}.lt-scena.oriz .lt-intro .icona svg{width:44px;height:44px}.lt-scena.oriz .lt-intro .facce img,.lt-scena.oriz .lt-intro .facce .pall{width:50px;height:60px}",   // (di lato lo schermo è basso: l'avviso in alto non deve coprire la lanterna)
    ".lt-intro .facce{display:flex;gap:14px}.lt-intro .facce img,.lt-intro .facce .pall{width:72px;height:86px;border-radius:50%;object-fit:cover;object-position:top;background:#35241a;box-shadow:0 0 0 2px #c39a48,0 0 0 4px rgba(248,240,222,.85)}.lt-intro .facce .morto{filter:saturate(.6) brightness(.76);border-color:#8d7f6c}",
    "@keyframes ltIntro{0%{opacity:0}12%{opacity:1}82%{opacity:1}100%{opacity:0}}",
    "@keyframes ltDondola{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}",
    "@keyframes ltColpo{from{transform:scale(2.2);opacity:0}to{transform:scale(1);opacity:1}}",
    "@keyframes ltGira{from{transform:perspective(700px) rotateY(90deg) scale(.9);opacity:0}to{transform:perspective(700px) rotateY(0) scale(1);opacity:1}}",
    // (rete) il tasto premuto aspetta la ricevuta dell'host: un alone che respira; se l'host dice di no, un piccolo «no» di lato. Solo classi lt-attende e lt-no, il resto dei tasti non si tocca
    ".lt-az.lt-attende{animation:ltAttende .5s var(--lt-ease) infinite alternate}@keyframes ltAttende{from{box-shadow:0 0 0 0 rgba(246,217,153,0)}to{box-shadow:0 0 0 4px rgba(246,217,153,.5)}}",
    ".lt-az.lt-no{animation:ltNo .3s var(--lt-ease)}@keyframes ltNo{0%,100%{translate:0}25%{translate:-4px 0}75%{translate:4px 0}}",
  ].join("") + cssRegistro();
  document.head.appendChild(st);
}

// =========================================================
//  LE REGOLE DELL'HOST (bottoni .modo-chip, come gli altri giochi)
// =========================================================
// ⚙️ Le regole della partita: il registro del palazzo, coi segnalibri. Ogni scheda sta in uno schermo: righe corte con ‹ ›,
// i ruoli in una griglia (un tocco cambia la probabilità), i poteri ruolo per ruolo. Si ritrova la scheda di prima riaprendo.
var SCHEDE = [["partita", "partita", "Partita"], ["riunioni", "campana", "Riunioni"], ["ruoli", "maschera", "Ruoli"], ["poteri", "potere", "Poteri"], ["sabotaggi", "sabota", "Sabotaggi"]];
var SQUADRE = [["ospiti", "Ospiti"], ["ombre", "Ombre"], ["soli", "Da soli"], ["mod", "Modificatori"]];
var PC = { scheda: "partita", squadra: "ospiti", gruppo: null };
// quanto spesso esce un ruolo, a parole (il numero in % non dice niente a chi gioca)
function frequenza(x) { return !x ? "mai" : x >= 100 ? "sempre" : x === 75 ? "3 su 4" : "1 su " + Math.round(100 / x); }
// la riga di riepilogo, che si capisca senza conoscere le regole
function rigaStato(imp) {
  var ruoli = Object.keys(imp.prob).filter(function (r) { return imp.prob[r] > 0; }).length, om = imp.ombre > 0 ? imp.ombre + (imp.ombre === 1 ? " ombra" : " ombre") : "", co = imp.compiti > 0 ? imp.compiti + " compiti" : "";
  return (om && co ? om + " · " + co : om ? om + " · compiti in base a quanti siete" : co ? co + " · ombre in base a quanti siete" : "Ombre e compiti in base a quanti siete") + " · " + ruoli + " ruoli speciali";
}
// la schermata dell'app che ospita il foglio, prima di aprire la stanza: i colori li mette la CSS, qui si tolgono le emoji dai testi
function vestiRegole(box) {
  var s = box.closest && box.closest(".schermata"); if (!s) return;
  senzaEmoji(s.querySelector(".piede") || s);
  var so = s.querySelector(".testa .sotto"), nota = s.querySelector(".contenuto>.sl-prima"), ico = s.querySelector(".testa>span");
  if (so) so.textContent = so.textContent.replace(EMOJI, "").trim();
  if (nota) nota.textContent = "Scegli le regole, poi apri la stanza: gli amici entrano col tuo invito.";
  if (ico) ico.innerHTML = STEMMA;
}
function impostazioni(box, dove, aiuti) {
  stile();
  var sola = !!(aiuti && aiuti.sola);   // sola lettura: chi non ha aperto la stanza vede lo stesso registro, senza frecce
  var cur = pulisci(dove); Object.keys(cur).forEach(function (k) { dove[k] = cur[k]; });
  var perG = {}; VOCI.forEach(function (v) { (perG[v.g] = perG[v.g] || []).push(v); });
  var POTERI = Object.keys(perG).filter(function (g) { return ["Partita", "Riunioni", "Probabilità dei ruoli", "Sabotaggi", "Modificatori"].indexOf(g) < 0; });
  if (POTERI.indexOf(PC.gruppo) < 0) PC.gruppo = POTERI[0];
  function idx(v) { var x = leggi(dove, v.k); for (var i = 0; i < v.opz.length; i++) if (valoreOpz(v.opz[i]) === x) return i; return 0; }
  function pop(n) { n.classList.remove("pop"); void n.offsetWidth; n.classList.add("pop"); }
  box.textContent = "";
  var pc = E("div", "lt-pc"); box.appendChild(pc);
  pc.setAttribute("data-regola", "");   // (così l'app sa che Lanterne ha delle regole: in saletta c'è «⚙️ Regole»)
  // da solo (schermata dell'app) è un foglio a sé; nella saletta sta dentro il foglio con «Comincia»
  var aSe = !(box.closest && box.closest(".lt-computer")); if (aSe) { pc.classList.add("lt-foglio"); Promise.resolve().then(function () { vestiRegole(box); }); }
  var barra = E("div", "lt-pc-barra"), preset = E("div", "lt-pc-preset");
  barra.append(E("span", aSe ? "tit" : "", aSe ? "Regole della notte" : "Partenza"), preset);   // in alto le partenze veloci
  var schede = E("div", "lt-pc-schede"), corpo = E("div", "lt-pc-corpo"), stato = E("div", "lt-pc-stato");
  pc.append(barra, schede, corpo, stato); var sfuma = ltSfuma(corpo);
  function aggStato() {
    stato.textContent = rigaStato(pulisci(dove));
    var att = [["classica", "Classica"], ["tanti", "Tanti"], ["caos", "Caos"]].filter(function (p) { return JSON.stringify(conPreset(p[0])) === JSON.stringify(pulisci(dove)); })[0];
    if (sola) { preset.textContent = ""; preset.appendChild(E("span", "scelta", att ? att[1] : "Su misura")); }
    else [].forEach.call(preset.children, function (b) { b.classList.toggle("attiva", !!att && b.dataset.p === att[0]); });
  }
  if (!sola) [["classica", "Classica"], ["tanti", "Tanti"], ["caos", "Caos"]].forEach(function (p) {
    var b = E("button", "", p[1]); b.type = "button"; b.dataset.p = p[0];
    b.addEventListener("click", function () { var v = conPreset(p[0]); Object.keys(v).forEach(function (k) { dove[k] = v[k]; }); disegna(); aggStato(); });
    preset.appendChild(b);
  });
  SCHEDE.forEach(function (sc) {
    var b = E("button", sc[0] === PC.scheda ? "attiva" : ""); b.type = "button"; b.dataset.s = sc[0];
    var bi = E("b"); bi.innerHTML = icona(sc[1]); b.append(bi, E("span", "", sc[2]));
    b.addEventListener("click", function () { PC.scheda = sc[0]; [].forEach.call(schede.children, function (x) { x.classList.toggle("attiva", x === b); }); disegna(); });
    schede.appendChild(b);
  });
  // una regola: nome a sinistra, ‹ valore › a destra (il valore si tocca anche da solo: passa al successivo)
  function riga(v, et) {
    var nome = et || v.et.replace(/ \(.*\)$/, "");
    if (sola) { var rs = E("div", "lt-pc-riga"); rs.append(E("span", "et", nome), E("i", "pp"), E("span", "val", scrittaOpz(v.opz[idx(v)], v.u))); return rs; }
    var r = E("div", "lt-pc-riga"), c = E("div", "ctr"), meno = E("button", "fr", "‹"), val = E("button", "val"), piu = E("button", "fr", "›");
    meno.type = val.type = piu.type = "button"; meno.setAttribute("aria-label", "meno"); piu.setAttribute("aria-label", "più");
    function mostra() { var i = idx(v); val.textContent = scrittaOpz(v.opz[i], v.u); meno.disabled = i === 0; piu.disabled = i === v.opz.length - 1; }
    function vai(d, giro) { var i = idx(v) + d; if (giro) i = (i + v.opz.length) % v.opz.length; if (i < 0 || i >= v.opz.length) return; scrivi(dove, v.k, valoreOpz(v.opz[i])); mostra(); pop(val); aggStato(); }
    meno.addEventListener("click", function () { vai(-1); }); piu.addEventListener("click", function () { vai(1); }); val.addEventListener("click", function () { vai(1, true); });
    c.append(meno, val, piu); r.append(E("span", "et", nome), E("i", "pp"), c); mostra();
    return r;
  }
  // un ruolo nella griglia: tocco = quanto spesso esce, dopo (mai → 1 su 4 → 1 su 2 → 3 su 4 → sempre → mai); le candele accese lo dicono a colpo d'occhio
  function cella(v, nome) {
    var b = E(sola ? "div" : "button", "lt-pc-r"), n = E("b", "", nome), riga2 = E("span", "quanto"), cand = E("span", "cand"), q = E("span", "sp"), lumi = [];
    for (var i = 0; i < 4; i++) { var u = E("i"); lumi.push(u); cand.appendChild(u); }
    riga2.append(cand, q); b.append(n, riga2);
    function mostra() { var x = leggi(dove, v.k), j = idx(v); q.textContent = frequenza(x); lumi.forEach(function (u, k) { u.classList.toggle("on", k < j); }); b.classList.toggle("zero", !x); b.setAttribute("aria-label", nome + ": esce " + frequenza(x)); }
    if (!sola) { b.type = "button"; b.addEventListener("click", function () { var i = (idx(v) + 1) % v.opz.length; scrivi(dove, v.k, valoreOpz(v.opz[i])); mostra(); pop(q); aggStato(); }); }
    mostra(); return b;
  }
  function disegna() {
    corpo.textContent = "";
    var dentro = E("div", "lt-pc-pag s-" + PC.scheda); corpo.appendChild(dentro);
    if (PC.scheda === "partita") perG["Partita"].forEach(function (v) { dentro.appendChild(riga(v)); });
    else if (PC.scheda === "riunioni") perG["Riunioni"].forEach(function (v) { dentro.appendChild(riga(v)); });
    else if (PC.scheda === "sabotaggi") (perG["Sabotaggi"] || []).forEach(function (v) { dentro.appendChild(riga(v)); });
    else if (PC.scheda === "ruoli") {
      var sq = E("div", "lt-pc-sq");
      SQUADRE.forEach(function (x) { var b = E("button", x[0] + (x[0] === PC.squadra ? " attiva" : ""), x[1]); b.type = "button"; b.addEventListener("click", function () { PC.squadra = x[0]; disegna(); }); sq.appendChild(b); });
      var gr = E("div", "lt-pc-ruoli " + PC.squadra), voci;
      if (PC.squadra === "mod") voci = (perG["Modificatori"] || []).map(function (v) { return [v, v.et]; });
      else voci = perG["Probabilità dei ruoli"].filter(function (v) { return RUOLI[v.k.slice(5)].squadra === PC.squadra; }).map(function (v) { return [v, v.et]; });
      voci.forEach(function (x) { gr.appendChild(cella(x[0], x[1])); });
      dentro.append(sq, E("p", "lt-pc-aiuto", sola ? "Le candele dicono quanto spesso esce ogni ruolo." : PC.squadra === "mod" ? "Tocca per cambiare quanto spesso capita." : "Tocca un ruolo per cambiare quanto spesso esce."), gr);
      // tutti insieme: mai, poco, a metà, sempre
      if (!sola) {
        var tutti = E("div", "lt-pc-tutti"); tutti.appendChild(E("span", "", "Tutti:"));
        [0, 1, 2, -1].forEach(function (j) {
          var o = voci.length ? voci[0][0].opz : [], val = o.length ? valoreOpz(o[j < 0 ? o.length - 1 : Math.min(j, o.length - 1)]) : 0, sc = frequenza(val);
          var b = E("button", "", sc.charAt(0).toUpperCase() + sc.slice(1)); b.type = "button";
          b.addEventListener("click", function () { voci.forEach(function (x) { scrivi(dove, x[0].k, val); }); disegna(); aggStato(); });
          tutti.appendChild(b);
        });
        dentro.appendChild(tutti);
      }
    } else if (PC.scheda === "poteri") {
      var pick = E("div", "lt-pc-pick");
      POTERI.forEach(function (g) { var nome = g.replace(/ \(.*\)$/, ""); var b = E("button", g === PC.gruppo ? "attiva" : "", nome); b.type = "button"; b.addEventListener("click", function () { PC.gruppo = g; disegna(); }); pick.appendChild(b); });
      var regole = E("div", "lt-pc-regole");
      perG[PC.gruppo].forEach(function (v) { regole.appendChild(riga(v)); });
      var r = Object.keys(RUOLI).filter(function (k) { return RUOLI[k].nome === PC.gruppo; })[0];
      if (r) regole.appendChild(E("p", "lt-pc-nota", RUOLI[r].desc));
      dentro.append(E("p", "lt-pc-aiuto", sola ? "Scegli un ruolo e guarda i suoi poteri." : "Scegli un ruolo e regola i suoi poteri."), pick, regole);
    }
    sfuma();
  }
  disegna(); aggStato();
}

if (window.LT_PROVA) window.LT_RUOLI = Object.keys(RUOLI).map(function (r) { return [r, RUOLI[r].nome + " (" + { ospiti: "ospite", ombre: "ombra", soli: "da solo" }[RUOLI[r].squadra] + ")"]; });

// In prova: la tessera di Lanterne (home, categorie, Sala) si vede solo con gli account AMMESSI; per gli altri è nascosta.
// Il gioco resta registrato per tutti, così chi viene invitato (link, codice, Sala) entra lo stesso.
(function () {
  var st = document.createElement("style");
  st.textContent = 'html:not(.lt-ammesso) [data-gioco="' + ID + '"]{display:none!important}';
  (document.head || document.documentElement).appendChild(st);
  function aggiorna() { document.documentElement.classList.toggle("lt-ammesso", !!(window.LT_PROVA || ammesso())); }
  aggiorna(); setInterval(aggiorna, 1500);
})();
function soloAmmessi(t) {
  var s = t.schermata({ icona: "🏮", titolo: "Lanterne" });
  s._contenuto.appendChild(t.el("p", { class: "modulo-nota", text: "Lanterne è ancora in prova: per ora la stanza la aprono solo " + AMMESSI.slice(0, -1).join(", ") + " e " + AMMESSI[AMMESSI.length - 1] + ". Fatti invitare da loro: col link o col codice entri anche tu." }));
  s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Va bene", onclick: function () { t.esci(); } }));
  t.mostra(s);
}
SG.registra({
  id: ID, nome: "Lanterne", icona: "🏮",
  senzaSala: true,   // una stanza solo di Lanterne, col suo link (…#gioco=lanterne&stanza=CODICE): mai la Sala generica
  descrizione: "Una notte al palazzo: gli ospiti fanno i compiti, le ombre spengono le lanterne. Scoprite chi sono e votatele fuori.",
  giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 2,
  modi: [], soloOnline: true,
  postiOnline: MAX,
  ritardatari: RITARDATARI,
  riprende: true,
  // l'host di riserva: provato (prove/browser/rientri.mjs) ma SPENTO, l'AGENTS.md dell'app lo vieta nei giochi in tempo reale. Si accende solo col sì di Mario: qui, true al posto di window.LT_RISERVA
  riserva: !!window.LT_RISERVA,
  riassunto: function (imp) { return riassunto(pulisci(imp)); },
  regole: [
    "Gli <b>ospiti</b> fanno i compiti in giro per il palazzo. Le <b>ombre</b> spengono le lanterne quando nessuno le vede.",
    "Chi trova una lanterna spenta la <b>segnala</b>: si fa una riunione, si parla e si vota chi cacciare.",
    "Vincono gli ospiti se finiscono i compiti o cacciano tutte le ombre. Vincono le ombre se diventano tante quanto gli ospiti.",
    "Ruoli speciali: Investigatore, Medico, Sceriffo, Silenziatore, Nebbia e Giullare. Chi apre la stanza sceglie quanto spesso escono.",
    "Modelli 3D: Poly Haven, NVIDIA SimReady Assets (CC BY 4.0)."
  ],
  impostazioni: impostazioni,
  avvia: function (t) {
    if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);
    if (!window.LT_PROVA && !ammesso() && !(t.ripresa && t.ripresa.stato)) return soloAmmessi(t);
    return host(t);
  }
});

})();

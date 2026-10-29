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
  d.stanze.forEach((s,i)=>{ for(let y=s.y;y<s.y+s.h;y++) for(let x=s.x;x<s.x+s.w;x++) PAV[y*GW+x]=i; });
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
    { nome:'Biblioteca', in:'in Biblioteca', x:3, y:3, w:12, h:8, c1:'#3b3029', c2:'#41352d' },
    { nome:'Salone delle feste', in:'nel Salone', x:26, y:3, w:18, h:9, c1:'#4a3236', c2:'#52393d' },
    { nome:"Torre dell'orologio", in:'nella Torre', x:56, y:3, w:9, h:7, c1:'#33363f', c2:'#3a3d47' },
    { nome:'Cortile', in:'nel Cortile', x:27, y:18, w:18, h:12, c1:'#3a3f3a', c2:'#414741' },
    { nome:'Cappella', in:'in Cappella', x:3, y:15, w:8, h:6, c1:'#2f3046', c2:'#35364d' },
    { nome:'Sala della musica', in:'nella Sala della musica', x:3, y:24, w:8, h:6, c1:'#3f2f3a', c2:'#463440' },
    { nome:'Cucine', in:'nelle Cucine', x:16, y:15, w:9, h:9, c1:'#463b2c', c2:'#4d4131' },
    { nome:'Cantina', in:'in Cantina', x:3, y:36, w:12, h:9, c1:'#2f2a30', c2:'#353036' },
    { nome:'Lavanderia', in:'in Lavanderia', x:17, y:38, w:8, h:6, c1:'#2e3a3f', c2:'#344247' },
    { nome:'Galleria dei ritratti', in:'nella Galleria', x:28, y:35, w:14, h:6, c1:'#3d3346', c2:'#44394e' },
    { nome:'Sorveglianza', in:'in Sorveglianza', x:48, y:19, w:8, h:5, c1:'#253038', c2:'#2a363f' },
    { nome:'Serra', in:'nella Serra', x:58, y:14, w:11, h:11, c1:'#2c3f33', c2:'#314638' },
    { nome:'Sala del telegrafo', in:'nella Sala del telegrafo', x:60, y:31, w:8, h:5, c1:'#38332a', c2:'#3f3930' },
    { nome:'Molo', in:'sul Molo', x:46, y:38, w:20, h:7, c1:'#4a3b2b', c2:'#55442f', assi:true },
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
  ostacoli:[
    {x:34,y:22,w:4,h:4,t:'fontana'},
    {x:4,y:4,w:4,h:1,t:'scaffale'},{x:9,y:4,w:4,h:1,t:'scaffale'},{x:4,y:7,w:3,h:1,t:'scaffale'},{x:9,y:7,w:3,h:1,t:'scaffale'},
    {x:28,y:5,w:3,h:2,t:'tavolo'},{x:39,y:5,w:3,h:2,t:'tavolo'},{x:28,y:8,w:3,h:2,t:'tavolo'},{x:39,y:8,w:3,h:2,t:'tavolo'},
    {x:59,y:4,w:3,h:3,t:'ingranaggio'},{x:62,y:5,w:2,h:2,t:'plastico'},
    {x:5,y:15,w:4,h:1,t:'altare'},{x:4,y:18,w:2,h:1,t:'panca'},{x:7,y:18,w:2,h:1,t:'panca'},
    {x:4,y:25,w:3,h:2,t:'piano'},
    {x:17,y:17,w:6,h:1,t:'banco'},{x:21,y:21,w:2,h:2,t:'forno'},
    {x:4,y:38,w:2,h:2,t:'botte'},{x:4,y:42,w:2,h:2,t:'botte'},{x:9,y:42,w:2,h:2,t:'botte'},
    {x:20,y:38,w:4,h:1,t:'stendino'},{x:18,y:42,w:2,h:1,t:'tinozza'},
    {x:30,y:36,w:2,h:1,t:'piedistallo'},{x:38,y:36,w:2,h:1,t:'piedistallo'},
    {x:49,y:19,w:5,h:1,t:'console'},
    {x:60,y:16,w:3,h:3,t:'aiuola'},{x:65,y:16,w:3,h:3,t:'aiuola'},{x:62,y:21,w:3,h:2,t:'aiuola'},
    {x:60,y:31,w:3,h:1,t:'telegrafo'},   // nell'angolo: la porta dalla Serra (x 63-64) resta libera
    {x:49,y:40,w:2,h:2,t:'cassa'},{x:56,y:42,w:3,h:2,t:'cassa'},
  ],
});

// Sala d'attesa: dove si aspetta che l'host faccia partire la partita
const ATRIO = crea({
  nome:"Sala d'attesa", GW:26, GH:16,
  stanze:[{ nome:"Sala d'attesa", in:'nella sala', x:2, y:2, w:22, h:12, c1:'#3d3346', c2:'#44394e' }],
  corridoi:[], acqua:[],
  ostacoli:[
    {x:6,y:5,w:1,h:1,t:'pilastro'},{x:19,y:5,w:1,h:1,t:'pilastro'},{x:6,y:10,w:1,h:1,t:'pilastro'},{x:19,y:10,w:1,h:1,t:'pilastro'},
    {x:10,y:2,w:6,h:1,t:'panca'},
    {x:12,y:6,w:2,h:1,t:'computer'},   // il computer della saletta: l'host ci sceglie le regole e fa partire la partita
  ],
});
ATRIO.centro = { x:13*T, y:10*T };
const COMPUTER = { tx:13, ty:7 };   // dove ci si mette per usarlo (davanti alla scrivania)

const POSTAZIONI = [
  { id:'libri',      nome:'Riordina i libri',      tx:11, ty:9,  gioco:'sequenza' },
  { id:'lampadario', nome:'Accendi il lampadario', tx:35, ty:4,  gioco:'tieni', visibile:'luce' },
  { id:'orologio',   nome:"Carica l'orologio",     tx:57, ty:8,  gioco:'leva', visibile:'ingranaggio' },
  { id:'dolci',      nome:'Sforna i dolci',        tx:19, ty:22, gioco:'trascina', visibile:'fuoco' },
  { id:'vino',       nome:'Travasa il vino',       tx:7,  ty:40, gioco:'versa' },
  { id:'piante',     nome:'Annaffia le piante',    tx:67, ty:23, gioco:'versa', visibile:'acqua' },
  { id:'barca',      nome:'Carica la barca',       tx:64, ty:39, gioco:'trascina' },
  { id:'quadri',     nome:'Raddrizza i quadri',    tx:40, ty:39, gioco:'quadri' },
  { id:'candele',    nome:'Accendi le candele',    tx:9,  ty:16, gioco:'tieni' },
  { id:'pianoforte', nome:'Accorda il pianoforte', tx:8,  ty:25, gioco:'sequenza' },
  { id:'bucato',     nome:'Stendi il bucato',      tx:22, ty:40, gioco:'trascina' },
  { id:'telegramma', nome:'Trasmetti il telegramma', tx:66, ty:33, gioco:'leva' },
];
const CAMPANA = { tx:29, ty:19 };
// la Sorveglianza: dal monitor si guardano le telecamere fisse e quelle della Sentinella
const MONITOR = { tx:51, ty:20 };
// il plastico del palazzo, nella Torre: mostra chi c'è in ogni stanza (teste grigie; la Spia vede i colori)
const PLASTICO = { tx:62, ty:7 };
const TELECAMERE_BASE = [
  { nome:'Cortile', x:28*T, y:18.6*T, vx:33*T, vy:21.5*T },
  { nome:'Corridoio ovest', x:12.9*T, y:22*T, vx:13*T, vy:22*T },
  { nome:'Salone delle feste', x:27*T, y:3.6*T, vx:32*T, vy:7*T },
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
  [[23,16],[43,28],[29,39]],  // Cucine, Cortile, Galleria
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
  indovino:      { nome:'Indovino',      squadra:'soli',   desc:'Giochi da solo. In riunione indovini il ruolo di qualcuno, scegliendolo tra tutti i ruoli del gioco: se ci prendi, cade e nessuno sa chi è stato; se sbagli, cadi tu. Indovinane abbastanza e vinci tu.' },
  sopravvissuto: { nome:'Sopravvissuto', squadra:'soli',   desc:'Giochi da solo: vinci se arrivi vivo alla fine, chiunque vinca. Hai la frenesia: non puoi restare troppo nella stessa stanza.' },
  accusatore:    { nome:'Accusatore',    squadra:'soli',   desc:'Giochi da solo: hai un bersaglio. Vinci se lo cacciano col voto.' },
  avvoltoio:     { nome:'Avvoltoio',     squadra:'soli',   abil:'Mangia',    desc:'Giochi da solo: fai sparire le lanterne spente. Se ne mangi abbastanza, vinci tu.' },
  gatto:         { nome:'Gatto',         squadra:'soli',   desc:'Hai due vite: la prima volta che ti spengono ti rialzi. Vinci se arrivi vivo alla fine, chiunque vinca.' },
};
const SPECIALI_OSPITI = ['investigatore','veggente','spia','trasportatore','bracconiere','imitatore','portiere','medico','sceriffo','sindaco','campanaro','vedetta','segugio','bengala','vendicatore','rianimatore','sentinella','ingegnere','veterano'];
const SPECIALI_OMBRE = ['silenziatore','nebbia','trasformista','spazzino','ipnotista','avvelenatore','spettro','burattinaio'];
const SPECIALI_SOLI = ['giullare','accusatore','avvoltoio','gatto','indovino','sopravvissuto'];
// i modificatori: si aggiungono sopra il ruolo, rari, e solo chi ce l'ha lo sa
// i ruoli dei fantasmi: un ospite spento può diventarlo (con la sua probabilità); poteri da fantasma
const FANTASMI = {
  custode: { nome:'Custode', abil:'Proteggi', desc:'Da fantasma dai uno scudo a un vivo che hai vicino: il prossimo che prova a spegnerlo fallisce, e tu lo sai.' },
  medium:  { nome:'Medium',  abil:'Foto',     desc:'Da fantasma scatti una foto confusa di chi ti ha spento o di dove è successo. Alla riunione dopo la vedono tutti. Se non ti piace, la rifai.' },
};
const MODIFICATORI = {
  urlatore:  { nome:'Urlatore',  icona:'🔊', desc:'Quando ti spengono, tutti ricevono subito un avviso e una freccia rossa che indica il punto.' },
  celebrita: { nome:'Celebrità', icona:'⭐', desc:'Quando ti spengono, alla riunione dopo tutti sanno dove sei caduto e quanto tempo prima.' },
  ago:       { nome:'Ago della bilancia', icona:'⚖️', desc:'Il tuo voto vale un pelo di più (1,01): nei pareggi vince la tua parte. Nessuno sa che sei tu.' },
};
// chi ha la frenesia: se resta troppo nella stessa stanza, la lanterna si spegne
const FRENESIA = ['giullare','sopravvissuto'];

const prob = v => Object.fromEntries([...SPECIALI_OSPITI, ...SPECIALI_OMBRE, ...SPECIALI_SOLI].map(r => [r, v]));
const IMP_BASE = {
  ombre:0, ricarica:25, velocita:1, vistaOspiti:6, vistaOmbre:7, compiti:0, soli:1, compitiVisibili:true,
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
  modificatori:{ urlatore:10, celebrita:10, ago:10 },
  trasportatore:{ ricarica:45, usi:2 },
  campanaro:{ volte:2 },
  segugio:{ durata:30, ricarica:35 },
  bengala:{ durata:5, usi:1 },
  rianimatore:{ usi:1, tempo:6 },
  silenziatore:{ ricarica:35 },
  nebbia:{ durata:10, ricarica:40 },
  trasformista:{ durata:15, ricarica:35 },
  spazzino:{ ricarica:25 },
  ipnotista:{ durata:6, ricarica:35 },
  avvelenatore:{ ritardo:15 },
  burattinaio:{ durata:8, ricarica:40 },
  portiere:{ ricarica:30 },
  sabotaggi:{ ricarica:45, acqua:60, interferenza:60, acquaSi:true, interferenzaSi:true },
  avvoltoio:{ quanti:2 },
  indovino:{ quanti:2, perRiunione:2, sbaglia:'muore' },
  frenesia:{ attiva:true, secondi:45 },
  fantasmi:{ attivi:true, custode:50, medium:50, ricarica:30 },
};

// Ogni voce: un gruppo di bottoni nella schermata delle regole. opz = valori, oppure [valore, scritta].
const P = [0,25,50,75,100];
const probVoce = (r) => ({ g:'Probabilità dei ruoli', k:'prob.'+r, et:RUOLI[r].nome, opz:P, u:'%' });
const VOCI = [
  { g:'Partita', k:'ombre', et:'Ombre', opz:[[0,'in base ai giocatori'],1,2,3] },
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
  { g:'Ipnotista', k:'ipnotista.durata', et:'Blocco', opz:[4,6,8], u:' s' },
  { g:'Ipnotista', k:'ipnotista.ricarica', et:'Ricarica', opz:[25,35,50], u:' s' },
  { g:'Avvelenatore', k:'avvelenatore.ritardo', et:'Dopo quanto si spegne', opz:[10,15,20], u:' s' },
  { g:'Avvoltoio', k:'avvoltoio.quanti', et:'Corpi per vincere', opz:[2,3,4] },
  { g:'Indovino', k:'indovino.quanti', et:'Ruoli da indovinare per vincere', opz:[2,3,4] },
  { g:'Indovino', k:'indovino.perRiunione', et:'Tentativi per riunione', opz:[1,2,3] },
  { g:'Indovino', k:'indovino.sbaglia', et:'Se sbaglia', opz:[['muore','cade lui'],['niente','non succede niente']] },
  { g:'Frenesia (Giullare e Sopravvissuto)', k:'frenesia.attiva', et:'Frenesia', opz:[[true,'sì'],[false,'no']] },
  { g:'Frenesia (Giullare e Sopravvissuto)', k:'frenesia.secondi', et:'Secondi nella stessa stanza', opz:[30,45,60,90], u:' s' },
  { g:'Fantasmi', k:'fantasmi.attivi', et:'Ruoli dei fantasmi', opz:[[true,'sì'],[false,'no']] },
  { g:'Fantasmi', k:'fantasmi.custode', et:'Custode (scudo da fantasma)', opz:[0,25,50,75,100], u:'%' },
  { g:'Fantasmi', k:'fantasmi.medium', et:'Medium (foto da fantasma)', opz:[0,25,50,75,100], u:'%' },
  { g:'Fantasmi', k:'fantasmi.ricarica', et:'Ricarica dei poteri', opz:[20,30,45], u:' s' },
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
  return out;
}
function conPreset(nome){ return pulisci(unisci(JSON.parse(JSON.stringify(IMP_BASE)), PRESET[nome]||{})); }
// Quante ombre: «in base ai giocatori» (0) dà 1 ombra fino a 7 giocatori, 2 da 8 in su. Mai più di 1 fino a 6 giocatori, 2 fino a 8, 3 da 9 in su.
function quanteOmbre(imp, n){
  const max = n<=6 ? 1 : n<=8 ? 2 : 3, voluto = imp.ombre>0 ? imp.ombre : (n>=8 ? 2 : 1);
  return Math.max(1, Math.min(voluto, max));
}
// Compiti a testa: «in base ai giocatori» (0) li sceglie da quanti ospiti ci sono per ogni ombra (r).
// Tarati con migliaia di partite di soli Bot (gioco/prove/equilibrio.mjs) per stare vicino a metà e metà:
// r fino a 3 → 3 compiti, fino a 3,5 → 4, fino a 4 → 6, oltre → 8.
function compitiPer(imp, n, ombre){
  if(imp.compiti>0) return imp.compiti;
  const r = (n-ombre)/Math.max(1,ombre);
  return r<=3 ? 3 : r<=3.5 ? 4 : r<=4 ? 6 : 8;
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
const R_PARLA = 7*T;    // la chat di prossimità: si legge solo chi è entro questo raggio
const VEL_BASE = 3.8;   // caselle al secondo a velocità «normale» (era 3,4: un po' più di corsa)
const DUR_ATRIO = 20, DUR_SVELA = 6, DUR_ESITO = 7;
const MAX_CHAT = 40;
const FRASI_COMPITO = { luce:'accendere il lampadario', ingranaggio:"caricare l'orologio", fuoco:'sfornare i dolci', acqua:'annaffiare la serra' };

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
    this.riu = null; this.esito = null; this.vincitore = null; this.chat = []; this.round = 1; this.dichiarati = {};
    this.telecamere = TELECAMERE_BASE.map(c=>({ x:c.x, y:c.y, nome:c.nome, base:true }));
    this.cambiata = true;
    if(this.saletta){ this.ombreIniziali=1; this.celebri=[]; }
    else { this.assegnaRuoli(); this.gioc.forEach(g=>this.assegnaCompiti(g)); }
    const n=this.gioc.length;
    this.gioc.forEach((p,i)=>{ const a=i/n*Math.PI*2; this.teletrasporta(p, ATRIO.centro.x+Math.cos(a)*3*T, ATRIO.centro.y+Math.sin(a)*2*T); });
  }
  // solo per le prove (versione da soli): dà a un giocatore il ruolo scelto, scambiandolo con chi ce l'aveva
  forzaRuolo(id, ruolo){
    const p=this.per(id); if(!p||!RUOLI[ruolo]||p.ruolo===ruolo) return;
    let altro=this.gioc.find(q=>q!==p&&q.ruolo===ruolo);
    if(!altro && (RUOLI[ruolo].squadra==='ombre')!==(p.squadra==='ombre')) altro=this.gioc.find(q=>q!==p&&(q.squadra==='ombre')===(RUOLI[ruolo].squadra==='ombre'));
    if(altro){ altro.ruolo=p.ruolo; this.preparaRuolo(altro); this.assegnaCompiti(altro); }
    p.ruolo=ruolo; this.preparaRuolo(p); this.assegnaCompiti(p);
    this.gioc.forEach(g=>{ if(g.ruolo==='accusatore'&&!g.bersaglio){ const c=this.gioc.filter(q=>q!==g&&q.squadra==='ospiti'); g.bersaglio=c.length?pick(c).id:null; } });
    this.segna();
  }
  // la saletta: chi arriva e chi se ne va mentre si aspetta
  aggiungi(g){
    if(!this.saletta || this.per(g.id)) return;
    const p=this.nuovo(g); this.gioc.push(p);
    this.teletrasporta(p, ATRIO.centro.x+(rnd()-.5)*5*T, ATRIO.centro.y+(rnd()-.5)*2*T); this.segna();
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
      compiti:[], cd:15, cdA:8, usi:0, campane:this.imp.campane, zittito:false, protettoDa:null, ep:0, tPos:0, tCorr:-9, vPriv:0, tChat:-9,
      vite:1, aspetto:null, aspettoFine:0, bloccatoFine:0, veleno:null, traccia:null, rianima:null, usiRian:0, usiBeng:0, campVolte:0, mangiati:0, bersaglio:null, rivelato:false, segnato:false, indovinati:0, tentativi:0, frenStanza:null, frenDa:0, frenAvvisato:false, camPiazzate:0, usiVet:0, allertaFine:0, letti:{}, osserva:false, usiTra:0, schermoFine:0, mod:null, trappola:null, trapRuoli:null, imitato:false, imita:null,
      path:[], meta:null, attesa:0, azione:null, pensa:rnd()*0.4, visti:{}, storia:[], ultimaStoria:{}, sosp:{}, mem:{controlli:[], puliti:[]}, segnala:null, corpoVisto:null, muove:false,
      ripara:null, campione:null, controllo:null, controllatoDa:null, portineria:null, tTp:0, prossimoGiro:false, dopoSpegni:false, ricalcola:0, cacciaFine:0 };
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
  priv(p){ p.vPriv++; }
  avviso(p, testo, tipo){ if(p && !p.bot) this.ev.privato(p.id, { t:'avviso', testo, tipo:tipo||'' }); }
  fx(k, x, y, extra){ this.ev.tutti(Object.assign({ t:'fx', k, x:Math.round(x), y:Math.round(y) }, extra||{})); }

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
    // i modificatori: ognuno esce con la sua probabilità, al massimo uno a testa
    for(const m of Object.keys(MODIFICATORI)) if(rnd()*100 < (imp.modificatori[m]||0)){ const liberi=this.gioc.filter(g=>!g.mod); if(liberi.length) pick(liberi).mod=m; }
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
    const lista = mescola(POSTAZIONI.slice()).slice(0, this.nCompiti||compitiPer(this.imp, this.gioc.length, this.ombreIniziali||1));
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
    const sec = f => Math.max(0, Math.ceil(f-this.t));
    const f = { fase:this.fase, mappa:this.M===ATRIO?'atrio':'palazzo', sec:sec(this.fineFase), round:this.round,
      g:this.gioc.map(p=>[p.id, p.vivo?1:0, p.uscito?1:0]), pc: tot?Math.round(fatti/tot*100):0,
      buio: this.buio ? sec(this.buio.fine) : 0, interf: this.interf ? sec(this.interf.fine) : 0, acqua: this.acqua ? [sec(this.acqua.fine), this.acqua.a?1:0, this.acqua.b?1:0] : null, neb: this.nebbiaAttiva() ? sec(this.nebbiaFine) : 0, bengala: this.bengalaAttivo() ? sec(this.bengalaFine) : 0,
      corpi: this.corpi.map(c=>[c.id, Math.round(c.x), Math.round(c.y)]),
      segnati: this.gioc.filter(p=>p.segnato&&p.vivo).map(p=>p.id), sindaci: this.gioc.filter(p=>p.rivelato).map(p=>p.id),
      scudi: this.gioc.filter(p=>p.vivo&&p.protettoDa!=null).map(p=>p.id), cam: this.telecamere.map(c=>[Math.round(c.x),Math.round(c.y),c.base?1:0]), osservate: this.gioc.some(p=>p.osserva&&p.vivo) };
    if(this.riu){ const R=this.riu; f.riu = { motivo:R.motivo, da:R.da, corpo:R.corpo, disc:sec(R.disc+R.t0), voto:sec(R.disc+R.voto+R.t0), votati:[...R.voti.keys()], zittiti:R.zittiti, chat:this.chat.slice(-MAX_CHAT) }; }
    if(this.esito) f.esito = this.esito;
    if(this.vincitore) f.fine = { ...this.vincitore, ruoli:this.gioc.map(p=>[p.id, p.ruolo, p.vivo?1:0]) };
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
      zittito: !!(this.riu && this.riu.zittiti.includes(p.id)), ep:p.ep, v:p.vPriv,
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
      return { id:p.id, nome:p.nome, bot:p.bot, pos: vince || ((p.ruolo==='gatto' || p.ruolo==='sopravvissuto') && p.vivo) ? 1 : 2 };
    });
  }
  // la partita da ricordare se l'host ricarica la pagina: solo dati semplici
  salva(){
    return { round:this.round, vincitore:this.vincitore, cdBuio:Math.round(this.cdBuio), ombreIniziali:this.ombreIniziali, dichiarati:this.dichiarati,
      cam:this.telecamere.filter(c=>!c.base).map(c=>[Math.round(c.x), Math.round(c.y), c.nome, c.da]),
      gioc:this.gioc.map(p=>({ id:p.id, nome:p.nome, bot:p.bot, ruolo:p.ruolo, vivo:p.vivo, uscito:p.uscito, campane:p.campane, vite:p.vite, bersaglio:p.bersaglio, mangiati:p.mangiati,
        usiRian:p.usiRian, usiBeng:p.usiBeng, campVolte:p.campVolte, rivelato:p.rivelato, camPiazzate:p.camPiazzate, usiVet:p.usiVet, usiTra:p.usiTra, mod:p.mod, imitato:p.imitato, imita:p.imita,
        indovinati:p.indovinati, fantasmaRuolo:p.fantasmaRuolo||null, foto:p.foto||null, morte:p.morte||null, letti:p.letti, protettoDa:p.protettoDa, zittito:p.zittito, segnato:p.segnato, campione:p.campione, trapRuoli:p.trapRuoli,
        compiti:p.compiti.map(c=>[c.post.id, c.fatto?1:0, c.extra?1:0]) })) };
  }
  // si riparte dal palazzo, tutti alla fontana, con ruoli, compiti ed eliminati di prima
  static daStato(s, imp, eventi){
    const P=new Partita(s.gioc.map(g=>({ id:g.id, nome:g.nome, bot:g.bot })), imp, eventi);
    P.round=s.round||1; P.cdBuio=Math.max(20, s.cdBuio||0);
    if(s.ombreIniziali) P.ombreIniziali=s.ombreIniziali;
    if(s.dichiarati && typeof s.dichiarati==='object') P.dichiarati=s.dichiarati;
    (s.cam||[]).forEach(([x,y,nome,da])=>{ if(isFinite(x)&&isFinite(y)) P.telecamere.push({ x, y, nome:String(nome||'Telecamera'), da }); });
    s.gioc.forEach(g=>{
      const p=P.per(g.id); p.ruolo=RUOLI[g.ruolo]?g.ruolo:'ospite'; P.preparaRuolo(p);
      p.vivo=!!g.vivo; p.fantasma=!g.vivo; p.uscito=!!g.uscito; p.campane=g.campane|0; p.cd=18; p.cdA=10;
      ['vite','bersaglio','mangiati','usiRian','usiBeng','campVolte','rivelato','camPiazzate','usiVet','usiTra','mod','imitato','imita','indovinati','fantasmaRuolo','foto','morte','letti','protettoDa','zittito','segnato','campione','trapRuoli'].forEach(k=>{ if(g[k]!=null) p[k]=g[k]; });
      p.mod = g.mod || null;
      p.compiti=(g.compiti||[]).map(([id,f,x])=>({ post:POSTAZIONI.find(q=>q.id===id), fatto:!!f, finto:p.squadra!=='ospiti', extra:!!x })).filter(c=>c.post);
    });
    P.M=PALAZZO; P.inCerchio();
    if(s.vincitore){ P.vincitore=s.vincitore; P.fase='fine'; }
    else { P.fase='svela'; P.fineFase=P.t+DUR_SVELA; }
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
  azione(id, m){
    const p=this.per(id); if(!p||p.uscito) return;
    // chi è controllato dal Burattinaio è fermo: niente compiti, poteri o segnalazioni finché dura
    if(p.controllatoDa && this.fase==='gioco' && m.k!=='chat' && m.k!=='rapida') return;
    // dentro una botola si può solo spostarsi tra le botole o uscire (e parlare)
    if(p.inBotola!=null && this.fase==='gioco' && m.k!=='botola' && m.k!=='parla') return;
    switch(m.k){
      case 'fatto': return this.fatto(p, m.post);
      case 'ripara': { const cosa=m.cosa||'luci', st=STAZ_RIP[cosa]; if(this.fase==='gioco' && st && p.vivo && this.vicino(p,centro(st.tx),centro(st.ty),R_USA)) this.ripara(p, cosa); return; }   // (anche le ombre: fingono di aiutare)
      case 'campana': if(this.fase==='gioco' && p.vivo && p.campane>0 && this.vicino(p,centro(CAMPANA.tx),centro(CAMPANA.ty),R_USA)){ p.campane--; this.priv(p); this.iniziaRiunione({ tipo:'campana', da:p.id }); } return;
      case 'segnala': { if(this.fase!=='gioco'||!p.vivo) return; const c=this.corpi.find(c=>c.id===m.id); if(c && this.vicino(p,c.x,c.y,R_SEGNALA) && vede(this.M,p.x,p.y,c.x,c.y)) this.iniziaRiunione({ tipo:'corpo', da:p.id, corpo:c.id, stanza:c.stanza }); return; }
      case 'spegni': { if(this.fase!=='gioco'||!p.vivo||p.squadra!=='ombre'||p.cd>0) return; const v=this.per(m.id); if(v && v.vivo && v.squadra!=='ombre' && v.inBotola==null && this.vicino(p,v.x,v.y,R_SPEGNI) && vede(this.M,p.x,p.y,v.x,v.y)) this.provaSpegni(p,v); return; }
      case 'abil': return this.abilita(p, m.id, m.id2);
      case 'botola': return this.botola(p, m);
      case 'parla': return this.parla(p, m.testo);
      case 'fantasma': return this.poteriFantasma(p, m);
      case 'buio': case 'sabota': if(this.fase==='gioco' && p.squadra==='ombre' && (p.vivo || p.ruolo==='spettro')) this.attivaSab(p, m.tipo||'buio'); return;
      case 'pc': return this.muoviControllato(p, m);
      case 'chat': return this.chatUmana(p, String(m.testo||''));
      case 'rapida': return this.rapida(p, m.tipo, m.id);
      case 'voto': return this.vota(p, m.su);
      case 'rivela': return this.rivela(p);
      case 'indovina': return this.indovina(p, m.id, m.ruolo);
      case 'imita': return this.imita(p, m.id);
      case 'guardo': { const on=!!m.on && this.fase==='gioco' && this.vicino(p,centro(MONITOR.tx),centro(MONITOR.ty),R_USA*1.3); if(on!==p.osserva){ p.osserva=on; this.segna(); } return; }
    }
  }
  fatto(p, postId){
    if(this.fase!=='gioco') return;
    const c=p.compiti.find(c=>c.post.id===postId && !c.fatto); if(!c) return;
    if(!this.vicino(p, centro(c.post.tx), centro(c.post.ty), R_USA)) return;
    this.completaCompito(p,c);
  }
  completaCompito(p,c){
    if(c.fatto) return;
    c.fatto=true; this.priv(p); this.segna();
    // i compiti visibili: chi è lì vicino vede l'effetto, e sa che chi l'ha fatto non è un'ombra (le ombre fingono e basta)
    if(!c.finto && c.post.visibile && this.imp.compitiVisibili){
      this.fx('compito', centro(c.post.tx), centro(c.post.ty), { v:c.post.visibile, id:p.id });
      for(const o of this.gioc){ if(!o.bot||!o.vivo||o===p) continue; if(dist(o,p)<=this.vista(o) && vede(this.M,o.x,o.y,p.x,p.y)){ o.sosp[p.id]=(o.sosp[p.id]||0)-35; o.mem.puliti.push({ id:p.id, v:c.post.visibile }); } }
    }
    if(!c.finto && this.controllaVittoria()) this.chiudi();
  }
  abilita(p, bersId, bers2){
    if(this.fase!=='gioco'||!p.vivo) return;
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
      return;
    }
    if(tipo==='stanza'){
      const st=+bersId; if(p.cdA>0 || !(st>=0 && st<PALAZZO.stanze.length)) return;
      p.portineria={ st, log:[], prev:{} }; this.gioc.forEach(q=>{ p.portineria.prev[q.id]=this.stanzaIdx(q); });
      p.cdA=this.imp.portiere.ricarica; this.priv(p); this.avviso(p, `Ora sai chi entra ed esce ${PALAZZO.stanze[st].in}.`);
      return;
    }
    let v=null, c=null;
    if(tipo==='vivo'){ v = bersId!=null ? this.per(bersId) : null; if(!v || !v.vivo || v.inBotola!=null || !this.vicino(p,v.x,v.y,R_ABIL) || (v!==p && !vede(this.M,p.x,p.y,v.x,v.y))) return; }
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
        this.fx('sparo', p.x, p.y, { x2:Math.round(v.x), y2:Math.round(v.y) });
        if(v.squadra==='ombre' || (v.squadra==='soli' && this.imp.sceriffo.soli)){
          if(v.protettoDa!=null){ this.rompiScudo(v, p); return; }
          this.spegni(p, v, 'sceriffo'); this.avviso(p, `Colpito: ${v.nome} era ${RUOLI[v.ruolo].nome}.`);
        } else { this.avviso(p, `${v.nome} è dei buoni: cadi tu.`, 'morte'); this.spegni(p, p, 'sceriffo'); }
        return;
      case 'segugio':
        if(p.cdA>0 || v===p) return;
        p.traccia={ id:v.id, fine:this.t+this.imp.segugio.durata }; p.cdA=this.imp.segugio.ricarica; this.priv(p);
        this.avviso(p, `Hai preso la scia di ${v.nome}.`); this.fx('fiuto', v.x, v.y, { solo:p.id });
        return;
      case 'campanaro':
        if(p.campVolte<=0) return;
        p.campVolte--; this.priv(p); this.fx('campana', p.x, p.y);
        this.iniziaRiunione({ tipo:'campana', da:p.id });
        return;
      case 'bengala':
        if(p.usiBeng<=0 || this.bengalaAttivo()) return;
        p.usiBeng--; this.bengalaFine=this.t+this.imp.bengala.durata; this.priv(p); this.segna();
        this.fx('bengala', p.x, p.y, { globale:1 });
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
        this.avviso(p, `${v.nome} starà zitto alla prossima riunione.`, 'ombra');
        return;
      case 'nebbia':
        if(p.cdA>0 || this.nebbiaAttiva()) return;
        this.nebbiaFine=this.t+this.imp.nebbia.durata; p.cdA=this.imp.nebbia.ricarica; this.priv(p); this.segna();
        this.fx('nebbia', p.x, p.y, { globale:1 });
        return;
      case 'trasformista':
        if(p.cdA>0 || v===p) return;
        p.aspetto=v.id; p.aspettoFine=this.t+this.imp.trasformista.durata; p.cdA=this.imp.trasformista.ricarica; this.priv(p);
        this.avviso(p, `Ora sembri ${v.nome}.`, 'ombra'); this.fx('trasforma', p.x, p.y);
        return;
      case 'spazzino':
        // pulire vuol dire restare 3 secondi fermi accanto alla lanterna spenta: chi passa lo vede
        if(p.cdA>0 || p.rianima) return;
        if(p.bot){ if(p.azione && p.azione.tipo==='pulisci') return; p.attesa=3; p.azione={ tipo:'pulisci', corpo:c.id }; p.path=[]; p.meta=null; return; }
        p.rianima={ corpo:c.id, fine:this.t+3, x:p.x, y:p.y, pulisci:true }; this.priv(p);
        this.avviso(p, 'Resta fermo 3 secondi: la lanterna sparisce.', 'ombra');
        return;
      case 'ipnotista':
        if(p.cdA>0 || v===p || v.squadra==='ombre') return;
        v.bloccatoFine=this.t+this.imp.ipnotista.durata; p.cdA=this.imp.ipnotista.ricarica; this.priv(p); this.priv(v);
        this.avviso(v, 'Sei ipnotizzato: non riesci a muoverti!', 'ombra'); this.fx('ipnosi', v.x, v.y);
        return;
      case 'avvoltoio':
        this.corpi=this.corpi.filter(k=>k!==c); p.mangiati++; this.priv(p); this.segna();
        this.fx('mangia', c.x, c.y);
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
    if(md) this.avviso(md, `Lo scudo di ${v.nome} si è rotto: qualcuno ci ha provato!`, 'ombra');
    this.fx('scudoRotto', v.x, v.y, { noOmbre:1 });
  }
  respinto(vet, chi){
    this.avviso(chi, 'Hai toccato il Veterano in allerta: la tua lanterna si è spenta.', 'morte');
    this.avviso(vet, `${chi.nome} ti ha toccato mentre eri in allerta: è caduto.`);
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
      return;
    }
    v.vivo=false; v.fantasma=true; v.protettoDa=null; v.path=[]; v.meta=null; v.attesa=0; v.segnala=null; v.ripara=null; v.veleno=null; v.rianima=null;
    if(v.controllo) this.fineControllo(v);
    if(v.ruolo==='medico') this.gioc.forEach(q=>{ if(q.protettoDa===v.id) q.protettoDa=null; });
    const c={ id:v.id, x:v.x, y:v.y, stanza:stanzaDi(this.M,v).in, da:k.id, t:this.t };
    this.corpi.push(c);
    this.fx('spegni', v.x, v.y);
    if(v.mod==='urlatore') this.fx('urlo', v.x, v.y, { globale:1 });
    if(v.mod==='celebrita') this.celebri.push({ id:v.id, stanza:c.stanza, t:this.t });
    if(modo==='normale' && k.bot){ k.dopoSpegni=true; k.path=[]; k.meta=null; k.autoSegnala=rnd()<.3; }   // un'ombra su tre fa finta di trovarla lei
    if(modo==='normale'){
      const neb=this.nebbiaAttiva(), visto=this.travestito(k)||k.id;
      for(const o of this.gioc){
        if(!o.bot||!o.vivo||o===k||o.squadra==='ombre') continue;
        if(dist(o,k)<=this.vista(o) && vede(this.M,o.x,o.y,k.x,k.y)){
          if(neb) o.mem.nebbia={ vittima:v.id };
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
      const F=this.imp.fantasmi, r = rnd()*100<F.custode ? 'custode' : rnd()*100<F.medium ? 'medium' : null;
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
    this.cdBuio=S.ricarica; this.segna();
    this.gioc.forEach(p=>{ if(p.squadra==='ombre') this.priv(p); });
    this.assegnaRiparatori();
  }
  ripara(p, cosa){
    if(cosa==='luci') return this.fineBuio(true, p);
    if(cosa==='console' && this.interf){ this.interf=null; this.liberaRip('console'); this.segna(); this.ev.tutti({ t:'avviso', testo:`${p.nome} ha riparato il telegrafo.` }); this.fx('luci', centro(CONSOLE.tx), centro(CONSOLE.ty), { globale:1 }); return; }
    if((cosa==='chiusaA'||cosa==='chiusaB') && this.acqua){
      this.acqua[cosa==='chiusaA'?'a':'b']=true; this.liberaRip(cosa); this.segna();
      if(this.acqua.a && this.acqua.b){ this.acqua=null; this.ev.tutti({ t:'avviso', testo:'Le chiuse sono chiuse: l\'acqua si ritira.' }); this.fx('luci', p.x, p.y, { globale:1 }); }
      else this.ev.tutti({ t:'avviso', testo:`${p.nome} ha chiuso una chiusa: manca l'altra!` });
    }
  }
  liberaRip(cosa){ this.gioc.forEach(b=>{ if(b.ripara===cosa){ b.ripara=null; if(b.meta&&b.meta.tipo==='ripara'){ b.path=[]; b.meta=null; } } }); }
  fineSab(p){ if(this.buio) this.fineBuio(true,p); if(this.interf) this.ripara(p,'console'); if(this.acqua){ this.acqua.a=this.acqua.b=true; this.ripara(p,'chiusaA'); } }
  attivaBuio(chi){
    if(this.sabAttivo() || this.cdBuio>0) return;
    this.buio={ fine:this.t+40 }; this.cdBuio=this.imp.sabotaggi.ricarica; this.segna();
    this.gioc.forEach(p=>{ if(p.squadra==='ombre') this.priv(p); });
    this.fx('buio', centro(QUADRO.tx), centro(QUADRO.ty), { globale:1 });
    const vivi=this.gioc.filter(p=>p.bot&&p.vivo&&p.squadra!=='ombre');
    this.assegnaRiparatori();
  }
  fineBuio(riparato, chi){
    if(!this.buio) return;
    this.buio=null; this.liberaRip('luci'); this.segna();
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
  chiudi(){ this.fase='fine'; this.riu=null; this.fineFase=this.t; this.segna(); }

  /* ----- chi esce e chi torna ----- */
  esce(id){
    const p=this.per(id); if(!p||p.uscito) return;
    p.uscito=true; p.vivo=false; p.fantasma=true; p.compiti.forEach(c=>c.fatto=true);
    this.segna();
    if(this.fase!=='fine' && this.controllaVittoria()) this.chiudi();
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
  }
  passoGioco(dt){
    for(const g of this.gioc){ if(g.cd>0) g.cd-=dt; if(g.cdA>0) g.cdA-=dt; if(g.cdF>0) g.cdF-=dt; }
    if(this.cdBuio>0) this.cdBuio-=dt;
    if(this.buio && this.t>this.buio.fine) this.fineBuio(false);
    if(this.interf && this.t>this.interf.fine){ this.interf=null; this.liberaRip('console'); this.segna(); }
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
    this.corpi=this.corpi.filter(k=>k!==c); p.cdA=this.imp.spazzino.ricarica; p.cd=Math.max(p.cd, this.imp.ricarica); this.priv(p); this.segna();
    this.fx('sparisce', c.x, c.y);
  }
  riaccendi(r, corpoId){
    const c=this.corpi.find(k=>k.id===corpoId), v=this.per(corpoId);
    if(!c || !v || v.uscito || !r.vivo || r.usiRian<=0 || !this.vicino(r,c.x,c.y,R_ABIL)) return;
    r.usiRian--; this.priv(r);
    this.corpi=this.corpi.filter(k=>k!==c);
    v.vivo=true; v.fantasma=false; this.priv(v); this.teletrasporta(v, c.x, c.y);
    this.avviso(v, `${r.nome} ti ha riacceso: sei di nuovo in gioco!`); this.avviso(r, `Hai riacceso la lanterna di ${v.nome}.`);
    this.fx('rianima', c.x, c.y); this.segna();
  }

  /* ----- bot ----- */
  vaiA(b, tx, ty, meta){
    const p=percorso(this.M, tX(this.M,b.x), tY(this.M,b.y), tx, ty);
    if(!p){ b.meta=null; b.path=[]; b.attesa=0.5; b.azione=null; return; }
    b.meta=meta; b.path=liscia(this.M,p,b.x,b.y);
  }
  preda(b){
    const cand=this.gioc.filter(p=>p.vivo&&p.squadra!=='ombre'&&dist(p,b)<26*T);
    if(!cand.length) return null;
    const solo=p=>this.gioc.filter(q=>q!==p&&q.vivo&&q.squadra!=='ombre'&&dist(p,q)<6*T).length;
    cand.sort((a,c)=>solo(a)-solo(c) || dist(a,b)-dist(c,b));
    return pick(cand.slice(0,2));
  }
  scegliMeta(b){
    if(b.ripara && b.vivo && this.lavoroAttivo(b.ripara)){ const st=STAZ_RIP[b.ripara]; this.vaiA(b, st.tx, st.ty, {tipo:'ripara', cosa:b.ripara}); return; }
    if(b.squadra==='ombre' && b.vivo && b.cd<=0 && rnd()<.55){ const p=this.preda(b); if(p){ this.vaiA(b, tX(this.M,p.x), tY(this.M,p.y), {tipo:'caccia', id:p.id}); b.ricalcola=1.2; b.cacciaFine=this.t+12; return; } }
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
    else if(m.tipo==='botola'){ this.vistoInBotola(b); this.fx('botola',b.x,b.y); b.x=centro(m.bo.va[0]); b.y=centro(m.bo.va[1]); b.attesa=0.3+rnd()*0.6; b.azione=null; }
    else if(m.tipo==='giro'){ b.attesa=1.5+rnd()*3; b.azione=null; }
    else if(m.tipo==='campana'){ b.meta=null; if(b.vivo && b.campane>0 && this.vicino(b,centro(CAMPANA.tx),centro(CAMPANA.ty),R_USA)){ b.campane--; this.iniziaRiunione({ tipo:'campana', da:b.id }); } return; }
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
  // i poteri dei fantasmi. La foto del Medium: un dettaglio di chi l'ha spento, o un angolo della stanza dov'è successo
  nuovaFoto(p){
    const M=p.morte||{}, seme=Math.floor(rnd()*1e9);
    return M.da && rnd()<.6 ? { tipo:'chi', id:M.da, seme } : { tipo:'dove', st:M.st, x:M.x, y:M.y, seme };
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
  // la chat di prossimità (durante il gioco): i vivi si leggono da vicino, le anime leggono tutto e parlano solo tra loro
  parla(p, testo){
    if((this.fase!=='gioco' && this.fase!=='atrio') || p.inBotola!=null || this.t-(p.tParla||-9)<1.5) return;
    testo=String(testo||'').replace(/\s+/g,' ').trim().slice(0,60); if(!testo) return;
    p.tParla=this.t;
    const msg={ t:'bolla', id:p.id, testo };
    for(const q of this.gioc){
      if(q.bot||q.uscito) continue;
      const sente = p.vivo ? (!q.vivo || Math.hypot(q.x-p.x,q.y-p.y)<=R_PARLA) : !q.vivo;
      if(sente) this.ev.privato(q.id, msg);
    }
  }
  // le botole: si entra (e si resta nascosti), ci si sposta tra quelle collegate restando dentro, si esce da quella in cui si è.
  // Ombre e Ingegnere viaggiano; il Giullare entra, resta ed esce dalla stessa.
  botola(p, m){
    if(this.fase!=='gioco'||!p.vivo) return;
    const puo = p.squadra==='ombre' || p.ruolo==='ingegnere' || p.ruolo==='giullare'; if(!puo) return;
    if(p.inBotola==null){
      const i=ESTREMI.findIndex(e=>this.vicino(p,centro(e.tx),centro(e.ty),0.9*T)); if(i<0) return;
      this.vistoInBotola(p); this.fx('botola',p.x,p.y);
      p.inBotola=i; this.teletrasporta(p, centro(ESTREMI[i].tx), centro(ESTREMI[i].ty)); this.priv(p); return;
    }
    if(m.esci){ const e=ESTREMI[p.inBotola]; p.inBotola=null; this.teletrasporta(p, centro(e.tx), centro(e.ty)); this.vistoInBotola(p); this.fx('botola',p.x,p.y); this.priv(p); return; }
    const j=+m.verso; if(p.ruolo==='giullare' || !botoleCollegate(p.inBotola).includes(j)) return;
    p.inBotola=j; this.teletrasporta(p, centro(ESTREMI[j].tx), centro(ESTREMI[j].ty)); this.priv(p);
  }
  // chi esce da una botola davanti a un ospite si fa vedere
  vistoInBotola(p){
    const id=this.travestito(p)||p.id;
    for(const o of this.gioc){ if(!o.bot||!o.vivo||o===p||o.squadra==='ombre') continue;
      if(dist(o,p)<=this.vista(o) && vede(this.M,o.x,o.y,p.x,p.y)){ o.sosp[id]=(o.sosp[id]||0)+80; o.mem.botola={ id, stanza:stanzaDi(this.M,p).in }; } }
  }
  testimoni(k,v){
    let n=0;
    for(const p of this.gioc){ if(p===k||p===v||!p.vivo||p.squadra==='ombre') continue; if(dist(p,k)<=this.vista(p) && vede(this.M,p.x,p.y,k.x,k.y)) n++; }
    return n;
  }
  pensaBot(b){
    const rv=this.vista(b);
    // cosa vede: l'ultima volta di ognuno, e una storia corta (una voce al secondo a testa, 45 secondi) per ragionare in riunione
    for(const p of this.gioc){ if(p===b||!p.vivo) continue; if(dist(b,p)<=rv && vede(this.M,b.x,b.y,p.x,p.y)){ const id=this.travestito(p)||p.id; b.visti[id]={ t:this.t, x:p.x, y:p.y };
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
    if(b.squadra!=='ombre' && b.campane>0 && (b.mem.testimone||b.mem.botola) && b.segnala==null && !b.ripara && !(b.meta&&b.meta.tipo==='campana'))
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
    if(b.squadra==='ombre'){
      if(b.ruolo==='silenziatore' && b.cdA<=0 && rnd()<.15){ const p=this.bersaglio(b,R_ABIL,q=>q.squadra!=='ombre'&&!q.zittito); if(p) this.abilita(b,p.id); }
      if(b.ruolo==='ipnotista' && b.cdA<=0 && rnd()<.1){ const p=this.bersaglio(b,R_ABIL,q=>q.squadra!=='ombre'); if(p) this.abilita(b,p.id); }
      if(b.cd<=0){
        const v=this.bersaglio(b,R_SPEGNI,p=>p.squadra!=='ombre');
        if(v){
          const t=this.testimoni(b,v);
          if(b.ruolo==='trasformista' && !b.campione){ const altro=this.bersaglio(b,R_ABIL,q=>q!==v&&q.squadra!=='ombre'); if(altro) this.abilita(b,altro.id); }
          if(b.ruolo==='trasformista' && b.campione && b.cdA<=0 && t<=1) this.abilita(b,null);
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
      if(b.segnala<=0){ const c=b.corpoVisto; b.segnala=null; if(b.vivo && this.corpi.includes(c)){ this.iniziaRiunione({ tipo:'corpo', da:b.id, corpo:c.id, stanza:c.stanza }); return; } }
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
    if(this.vincitore) return;
    this.fase='riunione';
    const R={ motivo:m.tipo, da:m.da, corpo:m.corpo!=null?m.corpo:null, stanza:m.stanza||null, t:0, t0:this.t, disc:this.imp.discussione, voto:this.imp.voto, voti:new Map(), coda:[], chiusa:false,
      zittiti:this.gioc.filter(p=>p.vivo&&p.zittito).map(p=>p.id) };
    this.riu=R; this.chat=[]; this.esito=null;
    const da=this.per(m.da);
    this.scrivi(null, m.tipo==='corpo' ? `${da.nome} ha trovato la lanterna di ${this.nomeDi(m.corpo)} spenta ${m.stanza}.` : `${da.nome} ha suonato la campana.`);
    for(const p of this.gioc){ if(p.fantasmaRuolo==='medium' && p.foto && p.fotoMostrata!==p.foto.seme){ p.fotoMostrata=p.foto.seme; this.scrivi(null, `Una foto dall'aldilà, da ${p.nome}:`, { foto:p.foto }); } }
    for(const v of avvelenati) this.scrivi(null, `Proprio adesso si è spenta anche la lanterna di ${v.nome}.`);
    for(const c of this.celebri) this.scrivi(null, `${this.nomeDi(c.id)} era una Celebrità: è stato spento ${c.stanza} circa ${Math.max(1,Math.round(this.t-c.t))} secondi fa.`);
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
    this.corpi=[]; this.buio=null; this.interf=null; this.acqua=null; this.nebbiaFine=0; this.bengalaFine=0;
    this.gioc.forEach(p=>{ if(p.controllo) this.fineControllo(p); p.ripara=null; });
    this.gioc.forEach(p=>{ p.path=[]; p.meta=null; p.attesa=0; p.azione=null; p.muove=false; p.veleno=null; p.rianima=null; p.aspetto=null; p.bloccatoFine=0; p.inBotola=null;
      p.tentativi = p.ruolo==='indovino' ? this.imp.indovino.perRiunione : 0; p.osserva=false; this.priv(p); });
    for(const b of this.gioc.filter(q=>q.bot&&q.vivo&&q.ruolo==='indovino')) if(rnd()<.6) R.coda.push({ t:3+rnd()*Math.max(4,R.disc), chi:b, az:()=>this.indovinaBot(b) });
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
    if(b.squadra==='ombre'){
      const cv=crewVivi(), soci=this.gioc.filter(p=>p.vivo&&p!==b&&p.squadra==='ombre');
      // un socio nei guai: a volte lo copre
      const socio=soci.find(p=>(this.pub[p.id]||0)>=30);
      if(socio && rnd()<.45){ out.push({ testo:`${socio.nome} era con me ${pick(this.M.stanze).in}, non è stato lui.`, eff:()=>this.sospetta(socio,-14,b) }); return out; }
      if(m.tipo==='corpo' && m.da===b.id && cv.length && rnd()<.6){ const p=pick(cv); out.push({ testo:`Poco prima lì vicino c'era ${p.nome}.`, eff:()=>{ this.sospetta(p,18,b); this.rispostaBot(p,false); } }); return out; }
      if(cv.length && rnd()<.3){ const p=pick(cv); out.push({ testo:`Ho visto ${p.nome} uscire di corsa ${pick(this.M.stanze).in}.`, eff:()=>{ this.sospetta(p,16,b); this.rispostaBot(p,false); } }); }
      else out.push({ testo:`Io ero ${pick(this.M.stanze).in}. Niente di strano.` });
      return out;
    }
    if(b.mem.testimone){ const t=b.mem.testimone, K=this.per(t.killer); if(K && K.vivo) out.push({ testo:`Ho visto ${K.nome} spegnere la lanterna di ${this.nomeDi(t.vittima)} ${t.stanza}!`, eff:()=>this.sospetta(K,55,b) }); }
    else if(b.mem.nebbia) out.push({ testo:`C'era qualcuno vicino a ${this.nomeDi(b.mem.nebbia.vittima)}, ma con la nebbia erano tutti grigi.` });
    if(b.mem.botola){ const K=this.per(b.mem.botola.id); if(K && K.vivo) out.push({ testo:`Ho visto ${K.nome} uscire da una botola ${b.mem.botola.stanza}!`, eff:()=>this.sospetta(K,45,b) }); }
    const vic=(b.mem.vicini||[]).map(id=>this.per(id)).filter(Boolean).slice(0,2);
    if(vic.length && (m.da===b.id || rnd()<.6)) out.push({ testo: m.da===b.id ? `Poco prima lì vicino c'era ${elenco(vic.map(p=>p.nome))}.` : `Ho visto ${elenco(vic.map(p=>p.nome))} da quelle parti poco prima.`, eff:()=>vic.forEach(p=>{ this.sospetta(p, m.da===b.id?18:14, b); if(vic.length===1) this.rispostaBot(p,false); }) });
    const ali=(b.mem.alibi||[]).map(id=>this.per(id)).filter(p=>p && (b.sosp[p.id]||0)<20);
    if(ali.length && rnd()<.5){ const p=pick(ali); out.push({ testo:`${p.nome} era sotto i miei occhi, lontano da lì: non è stato lui.`, eff:()=>this.sospetta(p,-14,b) }); }
    for(const x of b.mem.puliti.slice(0,1)){ const p=this.per(x.id); if(p && p.vivo) out.push({ testo:`Ho visto ${p.nome} ${FRASI_COMPITO[x.v]}: per me è pulito.`, eff:()=>this.sospetta(p,-25,b) }); }
    if(b.ruolo==='veggente') for(const r of b.mem.controlli){ const p=this.per(r.id); if(p) out.push({ testo: r.ok ? `Ho letto ${p.nome}: è dei buoni.` : `Ho letto ${p.nome}: è dei cattivi!`, eff:()=>{ this.dichiarati[b.id]='veggente'; this.sospetta(p, r.ok?-25:45, b); } }); }
    if(b.ruolo==='accusatore' && b.bersaglio){ const p=this.per(b.bersaglio); if(p && p.vivo) out.push({ testo:pick([`Io di ${p.nome} non mi fido per niente.`,`${p.nome} si muove in modo strano.`,`Secondo me è ${p.nome}.`]), eff:()=>this.sospetta(p,15,b) }); }
    if(b.ruolo==='giullare' && rnd()<.4) out.push({ testo:pick(['Io? Ero a farmi gli affari miei.','Guardate pure me, non ho niente da nascondere. Forse.','Che sguardi. Sembra che abbiate già deciso.']), eff:()=>this.sospetta(b,6,b) });
    if(!out.length) out.push({ testo: rnd()<.55 ? `Io ero ${stanzaDi(this.M,b).in}.` : pick(['Io non ho visto niente.','Ho fatto i miei compiti, tutto tranquillo.','Non ho prove, per ora salto.']) });
    return out.slice(0,3);
  }
  chatUmana(p, testo){
    const R=this.riu; if(this.fase!=='riunione'||!R||R.chiusa||!p.vivo) return;
    if(R.zittiti.includes(p.id)){ this.avviso(p,'Sei stato zittito: in questa riunione non puoi scrivere.','ombra'); return; }
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
    if(R.zittiti.includes(p.id)){ this.avviso(p,'Sei stato zittito: in questa riunione non puoi scrivere.','ombra'); return; }
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
  cadeInRiunione(v, testoVittima){
    const R=this.riu; v.vivo=false; v.fantasma=true;
    if(R){ R.voti.delete(v.id); for(const [chi,su] of [...R.voti]) if(su===v.id) R.voti.delete(chi); }
    this.gioc.filter(a=>a.ruolo==='accusatore'&&a.vivo&&a.bersaglio===v.id).forEach(a=>{ a.ruolo='giullare'; this.priv(a); this.avviso(a,'Il tuo bersaglio è uscito: ora sei il Giullare. Fatti cacciare col voto!'); });
    this.scrivi(null, `${v.nome} è caduto.`); this.priv(v); this.segna();
    this.ev.tutti({ t:'fx', k:'cade', x:0, y:0, id:v.id });
    this.avviso(v, testoVittima || "Un indovino ha letto il tuo ruolo: la tua lanterna si è spenta.", 'morte');
  }
  indovina(p, id, ruolo){
    const R=this.riu; if(this.fase!=='riunione'||!R||R.chiusa||!p.vivo||p.ruolo!=='indovino'||p.tentativi<=0||!RUOLI[ruolo]) return;
    const v=this.per(id); if(!v||!v.vivo||v===p) return;
    p.tentativi--; this.priv(p);
    if(v.ruolo===ruolo){
      p.indovinati++; this.cadeInRiunione(v);
      if(p.indovinati>=this.imp.indovino.quanti){ this.vincitore={ chi:'indovino', id:p.id, perche:`L'Indovino (${p.nome}) ha indovinato ${p.indovinati} ruoli.` }; this.chiudi(); return; }
      this.avviso(p, `Giusto: ${v.nome} era ${RUOLI[ruolo].nome}. Indovinati ${p.indovinati} su ${this.imp.indovino.quanti}.`);
    } else {
      this.avviso(p, `Sbagliato: ${v.nome} non è ${RUOLI[ruolo].nome}.`, 'ombra');
      if(this.imp.indovino.sbaglia==='muore') this.cadeInRiunione(p, "Hai sbagliato: la tua lanterna si è spenta.");
    }
    if(this.controllaVittoria()) this.chiudi();
  }
  indovinaBot(b){
    const cand=this.gioc.filter(q=>q.vivo&&q!==b); if(!cand.length) return;
    // chi ha detto in pubblico il suo ruolo (il Sindaco che si rivela, chi racconta cosa ha letto) è il primo da provare
    const dich=cand.filter(q=>this.dichiarati[q.id] && !(b.provati||[]).includes(q.id));
    if(dich.length){ const q=pick(dich); (b.provati=b.provati||[]).push(q.id); this.indovina(b, q.id, this.dichiarati[q.id]); return; }
    // senza un ruolo detto in pubblico tira a indovinare solo se sbagliare non costa, o se di qualcuno è quasi sicuro
    cand.sort((x,y)=>(b.sosp[y.id]||0)-(b.sosp[x.id]||0));
    const forte=cand[0], sos=b.sosp[forte.id]||0, gratis=this.imp.indovino.sbaglia!=='muore';
    if(sos>=60 && (gratis || rnd()<.5)) this.indovina(b, forte.id, 'ombra');
    else if(gratis && rnd()<.6) this.indovina(b, pick(cand).id, 'ospite');
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
  vota(p, su){
    const R=this.riu; if(this.fase!=='riunione'||!R||R.chiusa||!p.vivo||R.t<R.disc||R.voti.has(p.id)) return;
    if(su!=='salta'){ const x=this.per(su); if(!x||!x.vivo) return; }   // (anche se stessi: si può sempre)
    R.voti.set(p.id, su); this.segna();
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
    else { let bv = critico ? 2 : 30; for(const p of cand){ const v=(b.sosp[p.id]||0)+this.votiPer(p.id)*(critico?14:6)+rnd()*6; if(v>bv){ bv=v; scelta=p; } } }
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
    const vivi=this.gioc.filter(p=>p.vivo);
    if(!R.chiusa && (R.t>=R.disc+R.voto || (R.t>=R.disc && vivi.every(p=>R.voti.has(p.id))))) this.concludiRiunione();
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
function prendi(chiave, fare){
  let e = TELE.get(chiave);
  if(e){ TELE.delete(chiave); TELE.set(chiave, e); return e; }
  e = fare() || { cv:null, px:0 }; e.nuovo = true;
  TELE.set(chiave, e); telePx += e.px;
  for(const [k, v] of TELE){
    if(telePx <= TELE_MAX || k === chiave) break;
    TELE.delete(k); telePx -= v.px; if(v.cv){ v.cv.width = 0; v.cv.height = 0; }
  }
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
function terraCappella(c, st){ passatoia(c, (st.x + st.w/2 - 0.5)*T - 12, (st.y + 1)*T, 24, (st.h - 1)*T, false); }
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
  const { GW, PAV } = M, acqua = (x, y) => y >= 0 && x >= 0 && x < GW && y < M.GH && PAV[y*GW + x] === -2 && M.ACQUA[y*GW + x];
  for(let x = st.x; x < st.x + st.w; x++) if(acqua(x, st.y + st.h)){ c.fillStyle = '#2e241a'; c.fillRect(x*T, (st.y + st.h)*T - 5, T, 5); c.fillStyle = 'rgba(255,230,190,.08)'; c.fillRect(x*T, (st.y + st.h)*T - 5, T, 1); }
  for(let y = st.y; y < st.y + st.h; y++) if(acqua(st.x + st.w, y)){ c.fillStyle = '#2e241a'; c.fillRect((st.x + st.w)*T - 5, y*T, 5, T); }
  for(let x = st.x + 2; x < st.x + st.w - 1; x += 5){ if(!acqua(x, st.y + st.h)) continue; const bx = (x + 0.5)*T, by = (st.y + st.h)*T - 9;
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(bx + 1, by + 3, 6, 3, 0, 0, 7); c.fill();
    c.fillStyle = '#26262c'; c.fillRect(bx - 4.5, by - 7, 9, 8); c.beginPath(); c.ellipse(bx, by + 1, 4.5, 2, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#3e3e46'; c.beginPath(); c.ellipse(bx, by - 7, 5.5, 2.5, 0, 0, 7); c.fill();
    if(fisso(x, 1, 6) < 0.6){ c.strokeStyle = '#b8a07a'; c.lineWidth = 1.4; for(let k = 0; k < 3; k++){ c.beginPath(); c.ellipse(bx - 15, by - 2, 7 - k*2, 3.5 - k, 0, 0, 7); c.stroke(); } c.beginPath(); c.moveTo(bx - 8, by - 2); c.quadraticCurveTo(bx - 4, by - 8, bx - 3, by - 6); c.stroke(); }
  }
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
  M._ar = { facce, torce };
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
function acquaFerma(c, X, Y, tx, ty){
  c.fillStyle = '#0f2738'; c.fillRect(X, Y, T, T);
  c.fillStyle = 'rgba(120,170,210,.06)'; for(let k = 0; k < 3; k++) c.fillRect(X + fisso(tx, ty, k)*T*0.7, Y + 4 + k*9 + fisso(tx, ty, k + 5)*4, 6 + fisso(tx, ty, k + 9)*10, 1.2);
}
function disegnaPezzo(c, M, A, i, j, res){
  const { GW, GH, PAV, ACQUA, BORDO } = M, x0 = i*PEZZO, y0 = j*PEZZO, L = PEZZO*T, X0 = x0*T, Y0 = y0*T;
  const xa = Math.max(0, x0), xb = Math.min(GW, x0 + PEZZO), ya = Math.max(0, y0), yb = Math.min(GH, y0 + PEZZO);
  const muro = (x, y) => x < 0 || y < 0 || x >= GW || y >= GH || (PAV[y*GW + x] === -2 && !ACQUA[y*GW + x]);
  c.fillStyle = '#090b16'; c.fillRect(X0, Y0, L, L);
  for(let ty = ya; ty < yb; ty++) for(let tx = xa; tx < xb; tx++){
    const k = ty*GW + tx, p = PAV[k], X = tx*T, Y = ty*T;
    if(p === -2){ if(ACQUA[k]) acquaFerma(c, X, Y, tx, ty); else if(BORDO[k]) cima(c, X, Y, tx, ty); continue; }
    const st = stileDi(M, p); (PAVIMENTI[st.pav] || PAVIMENTI.semplice)(c, X, Y, tx, ty, st);
  }
  const tocca = (x, y, w, h, m) => !(x - m > x0 + PEZZO || x + w + m < x0 || y - m > y0 + PEZZO || y + h + m < y0);
  M.stanze.forEach((st, k) => { const s = stileDi(M, k); if(s.terra && tocca(st.x, st.y, st.w, st.h, 1)){ c.save(); c.beginPath(); c.rect(st.x*T, st.y*T, st.w*T, st.h*T); c.clip(); s.terra(c, st, M); c.restore(); } });
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
    if(!TELE.has('P|' + M.nome + '|' + i + ',' + j + '|' + res)){ pezzo(M, i, j, res).nuovo = false; return true; }
  }
  return false;
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
};
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
function altezzaMobile(o){ const m = MOBILI[o.t]; return m ? m.h + 16 : 0; }
function disegnaMobile(c, M, o, k, res, t, eff, pit){
  const mod = MOBILI[o.t]; if(!mod) return;
  const f = figurina(M, o, k, res), x = o.x*T, y = o.y*T;
  if(f.cv) c.drawImage(f.cv, x + f.ox, y + f.oy, f.w, f.h);
  if(mod.vivo){ c.save(); c.translate(x, y); mod.vivo(c, o.w*T, o.h*T, o, t, eff, pit); c.restore(); }
}
// le fiamme delle torce sui muri (vive)
function torceVive(c, M, t, x0, y0, x1, y1){
  for(const q of prepara(M).torce){
    if(q.x < x0 || q.x > x1 || q.y < y0 || q.y > y1) continue;
    const fl = 0.6 + Math.sin(t*9 + q.x)*0.2 + Math.sin(t*23 + q.y)*0.1;
    const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, 26); g.addColorStop(0, 'rgba(255,180,80,' + (0.28*fl).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,180,80,0)');
    c.fillStyle = g; c.fillRect(q.x - 26, q.y - 26, 52, 52);
    c.fillStyle = 'rgba(255,190,90,' + fl.toFixed(3) + ')'; c.beginPath(); c.ellipse(q.x, q.y - 2, 3, 4.5, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,240,190,.9)'; c.beginPath(); c.ellipse(q.x, q.y - 1, 1.3, 2.2, 0, 0, 7); c.fill();
  }
}

// ===== disegno.js =====
// Il disegno della mappa, degli avatar, della luce delle lanterne e degli effetti (uguale su tutti i telefoni).


const CORR1 = '#5a2b33', CORR2 = '#612f38';
const FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue","Inter",system-ui,sans-serif';
const ORO = '231,183,92', ROSSO = '240,90,110';

class Pittore {
  constructor(cv){
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.ombra = document.createElement('canvas'); this.octx = this.ombra.getContext('2d');
    this.cam = { x:0, y:0 }; this.DPR = 1; this.SCALA = 1; this.w = 0; this.h = 0;
    this.parti = [];        // particelle nel mondo (polvere dei passi, fumo, scintille)
    this.polvere = Array.from({length:26}, ()=>({ x:Math.random(), y:Math.random(), v:0.2+Math.random()*0.5, f:Math.random()*6 }));
    this.passi = {};
  }
  misura(){
    // (le misure del riquadro, non dello schermo: se il gioco è girato di lato restano giuste)
    const w = Math.max(1, Math.round(this.cv.offsetWidth || this.cv.getBoundingClientRect().width)), h = Math.max(1, Math.round(this.cv.offsetHeight || this.cv.getBoundingClientRect().height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if(w===this.w && h===this.h && dpr===this.DPR) return;
    this.w = w; this.h = h; this.DPR = dpr;
    this.cv.width = Math.round(w*dpr); this.cv.height = Math.round(h*dpr);
    this.ombra.width = this.cv.width; this.ombra.height = this.cv.height;
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
    if(!this.cam.ok){ this.cam.x=seg.x; this.cam.y=seg.y; this.cam.ok=true; }
    this.cam.x += (seg.x-this.cam.x)*0.2; this.cam.y += (seg.y-this.cam.y)*0.2;
    if(Math.hypot(seg.x-this.cam.x, seg.y-this.cam.y) > 8*T){ this.cam.x=seg.x; this.cam.y=seg.y; }
    const sc = S.scossa>0 ? S.scossa*6 : 0;
    const cx=this.cam.x-W/(2*s)+(Math.random()-0.5)*sc, cy=this.cam.y-H/(2*s)+(Math.random()-0.5)*sc;
    c.setTransform(1,0,0,1,0,0); c.fillStyle='#090b16'; c.fillRect(0,0,W,H);
    // il palazzo fermo (pavimenti, tappeti, muri, ombre) è già disegnato a pezzi: si copiano quelli sullo schermo
    const res=Math.min(3, Math.ceil(s*10)/10), L=PEZZO*T, ni=Math.ceil(M.GW/PEZZO)-1, nj=Math.ceil(M.GH/PEZZO)-1;
    const i0=Math.max(0,Math.floor(cx/L)), j0=Math.max(0,Math.floor(cy/L)), i1=Math.min(ni,Math.floor((cx+W/s)/L)), j1=Math.min(nj,Math.floor((cy+H/s)/L));
    // al massimo ~6 ms per fotogramma a fare pezzi nuovi: quelli che mancano ancora si abbozzano e arrivano al prossimo
    let nuovi=0, spesa=0;
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){
      let e=pezzo(M,i,j,res,true);
      if(!e && (spesa<6 || !nuovi)){ const a=performance.now(); e=pezzo(M,i,j,res); e.nuovo=false; nuovi++; spesa+=performance.now()-a; }
      const dx=Math.round((i*L-cx)*s), dy=Math.round((j*L-cy)*s), dw=Math.round(((i+1)*L-cx)*s)-dx, dh=Math.round(((j+1)*L-cy)*s)-dy;
      if(e) c.drawImage(e.cv, dx, dy, dw, dh); else this.abbozzo(M, i, j, dx, dy, dw/(PEZZO*T));
    }
    c.setTransform(s,0,0,s,-cx*s,-cy*s);
    const tx0=Math.max(0,Math.floor(cx/T)-1), ty0=Math.max(0,Math.floor(cy/T)-1), tx1=Math.min(M.GW-1,Math.ceil((cx+W/s)/T)+1), ty1=Math.min(M.GH-1,Math.ceil((cy+H/s)/T)+1);
    // solo l'acqua e le torce si muovono
    c.strokeStyle='rgba(140,190,230,.12)'; c.lineWidth=1.5;
    for(let ty=ty0;ty<=ty1;ty++) for(let tx=tx0;tx<=tx1;tx++){
      if(!M.ACQUA[ty*M.GW+tx]) continue;
      const X=tx*T, Y=ty*T, o=Math.sin(t*1.5+tx*0.7+ty)*4; c.beginPath(); c.moveTo(X+4,Y+T/2+o); c.lineTo(X+T-4,Y+T/2+o); c.stroke();
    }
    torceVive(c, M, t, cx-T, cy-T, cx+W/s+T, cy+H/s+2*T);
    const vx0=cx-3*T, vy0=cy-3*T, vx1=cx+W/s+3*T, vy1=cy+H/s+3*T;
    if(S.palazzo){
      for(const p of POSTAZIONI) this.postazione(p,S.miei.has(p.id),t);
      this.postazione({ tx:CAMPANA.tx, ty:CAMPANA.ty, tipo:'campana' },false,t);
      this.postazione({ tx:QUADRO.tx, ty:QUADRO.ty, tipo:'quadro' },!!S.buio,t);
      [[CHIUSA_A,0],[CHIUSA_B,1]].forEach(([q,i])=>this.postazione({ tx:q.tx, ty:q.ty, tipo:'chiusa' }, !!(S.chiuse&&S.chiuse[i]), t));
      if(S.interf){ const x=centro(CONSOLE.tx), y=centro(CONSOLE.ty), g=c.createRadialGradient(x,y,0,x,y,40); g.addColorStop(0,`rgba(255,180,90,${0.4+0.2*Math.sin(t*6)})`); g.addColorStop(1,'rgba(255,180,90,0)'); c.fillStyle=g; c.fillRect(x-40,y-40,80,80); }
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
    const visibile = q => anima || (Math.hypot(q.x-io.x,q.y-io.y)<=R*0.97 && vede(M,io.x,io.y,q.x,q.y));
    for(const k of S.corpi) if(visibile(k)) this.corpo(k,t);
    // gli effetti nel mondo (sotto i personaggi quelli a terra)
    for(const e of S.effetti||[]) if(e.terra && (e.sempre || visibile(e))) this.effetto(e,t);
    // le orme (solo l'Investigatore): una per passo, del colore di chi l'ha lasciata
    for(const o of S.orme||[]){ const a=Math.max(0,1-(t-o.t)/(S.durOrme||10)); if(a<=0) continue; c.save(); c.translate(o.x,o.y+T*0.3); c.rotate(o.dir+Math.PI/2); c.globalAlpha=0.65*a; c.fillStyle=o.col; this.ell(o.lato*4,0,2.6,4.2); c.fill(); c.restore(); }
    c.globalAlpha=1;
    const tutti=S.altri.filter(p=>(!p.fantasma||anima) && (visibile(p) || (S.traccia && p.id===S.traccia)));
    if(io.mostra) tutti.push(io);
    // mobili e persone in ordine di profondità: chi passa dietro un mobile alto ne resta coperto
    const scena=[];
    M.ostacoli.forEach((o,k)=>{ if((o.x+o.w)*T<vx0||o.x*T>vx1||(o.y+o.h)*T<vy0||o.y*T-altezzaMobile(o)>vy1) return; scena.push({ y:(o.y+o.h)*T, o, k }); });
    for(const p of tutti) scena.push({ y:p.y+T*0.36, p });
    scena.sort((a,b)=>a.y-b.y);
    for(const q of scena){
      if(q.o){ disegnaMobile(c, M, q.o, q.k, res, t, S.effetti, this); continue; }
      const p=q.p;
      if(p.muove && !p.fantasma){ const k=this.passi[p.id]||0; if(t-k>0.22){ this.passi[p.id]=t; this.sparpaglia('polvere', p.x+(Math.random()-0.5)*8, p.y+T*0.36, 2, { v:12, vita:0.5, r:2.5 }); } }
      const grigio=S.neb && p!==io;
      if(S.segnati && S.segnati.indexOf(p.id)>=0 && !grigio){ const g=c.createRadialGradient(p.x,p.y-T*0.4,0,p.x,p.y-T*0.4,T*1.2); g.addColorStop(0,`rgba(${ROSSO},${0.45+0.2*Math.sin(t*6)})`); g.addColorStop(1,`rgba(${ROSSO},0)`); c.fillStyle=g; c.fillRect(p.x-T*1.2,p.y-T*1.6,T*2.4,T*2.4); }
      if(S.traccia && p.id===S.traccia){ c.strokeStyle=`rgba(${ORO},.8)`; c.lineWidth=2; c.setLineDash([4,4]); this.ell(p.x,p.y+T*0.3,T*0.55,T*0.22); c.stroke(); c.setLineDash([]); }
      this.persona(p,t,{ alfa:p.fantasma?0.45:1, grigio, nome:!grigio, coloreNome:p.coloreNome||(p.alleata?'#f2a7b6':null) });
      if(S.scudi && S.scudi.indexOf(p.id)>=0 && !p.fantasma){ const a=0.35+0.15*Math.sin(t*3); c.strokeStyle=`rgba(120,220,255,${a+0.25})`; c.lineWidth=2; this.ell(p.x,p.y-T*0.45,T*0.62,T*0.85); c.stroke(); c.fillStyle=`rgba(120,220,255,${a*0.25})`; c.fill(); }
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
      const o=this.octx, Rf=R*(1+0.015*Math.sin(t*7)+0.01*Math.sin(t*13));
      o.setTransform(1,0,0,1,0,0); o.globalCompositeOperation='source-over'; o.clearRect(0,0,W,H);
      o.fillStyle='rgba(4,6,14,.88)'; o.fillRect(0,0,W,H);
      o.setTransform(s,0,0,s,-cx*s,-cy*s); o.globalCompositeOperation='destination-out';
      const gr=o.createRadialGradient(io.x,io.y,0,io.x,io.y,Rf); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(0.72,'rgba(0,0,0,.96)'); gr.addColorStop(1,'rgba(0,0,0,0)');
      o.fillStyle=gr; o.beginPath(); const pts=this.luce(M,io.x,io.y,Rf); o.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) o.lineTo(pts[i][0],pts[i][1]); o.closePath(); o.fill();
      o.globalCompositeOperation='source-over';
      c.setTransform(1,0,0,1,0,0); c.drawImage(this.ombra,0,0);
      c.setTransform(s,0,0,s,-cx*s,-cy*s); c.globalCompositeOperation='lighter';
      const calda=c.createRadialGradient(io.x,io.y,0,io.x,io.y,R*0.8); calda.addColorStop(0,`rgba(${ORO},.08)`); calda.addColorStop(1,`rgba(${ORO},0)`);
      c.fillStyle=calda; c.fillRect(io.x-R,io.y-R,R*2,R*2); c.globalCompositeOperation='source-over';
      // pulviscolo nella luce
      for(const d of this.polvere){ d.f+=dt*d.v; const ang=d.x*Math.PI*2, rr=d.y*R*0.8, px=io.x+Math.cos(ang+d.f*0.2)*rr, py=io.y+Math.sin(ang+d.f*0.2)*rr - (d.f*6%20); c.fillStyle=`rgba(255,235,190,${0.15+0.15*Math.sin(d.f*2)})`; c.fillRect(px,py,1.6,1.6); }
      if(S.traccia){ const tg=S.altri.find(p=>p.id===S.traccia); if(tg) this.freccia(io, { x:tg.x, y:tg.y, col:'#cba2ff' }, t); }
      if(S.freccia) this.freccia(io, S.freccia, t);   // la freccia resta visibile anche fuori dalla luce
    } else if(S.palazzo && !S.bengala){ c.setTransform(1,0,0,1,0,0); c.fillStyle='rgba(60,80,150,.1)'; c.fillRect(0,0,W,H); }
    if(S.bolle){ c.setTransform(s,0,0,s,-cx*s,-cy*s); this.bolle(S); }   // i fumetti della chat di prossimità, sopra il buio
    if(S.urlo) this.freccia(io, S.urlo, t);
    c.setTransform(1,0,0,1,0,0);
    if(S.bengala){ c.fillStyle=`rgba(255,220,180,${0.08+0.04*Math.sin(t*20)})`; c.fillRect(0,0,W,H); }
    if(S.acqua){ c.fillStyle=`rgba(40,110,190,${0.16+0.05*Math.sin(t*2)})`; c.fillRect(0,0,W,H); c.strokeStyle='rgba(150,210,255,.18)'; c.lineWidth=2*this.DPR; for(let y=((t*30)%40)*this.DPR;y<H;y+=40*this.DPR){ c.beginPath(); for(let x=0;x<=W;x+=20*this.DPR) c.lineTo(x, y+Math.sin(x/(30*this.DPR)+t*2)*4*this.DPR); c.stroke(); } }
    if(S.buio){ const a=0.35+0.2*Math.sin(t*5); const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75); g.addColorStop(0,`rgba(${ROSSO},0)`); g.addColorStop(1,`rgba(${ROSSO},${a})`); c.fillStyle=g; c.fillRect(0,0,W,H); }
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
          for(let i=0;i<10;i++){ const ang=i/10*Math.PI*2+t; c.strokeStyle=`rgba(255,230,160,${0.4*a})`; c.lineWidth=2; c.beginPath(); c.moveTo(e.x,e.y); c.lineTo(e.x+Math.cos(ang)*T*3,e.y+Math.sin(ang)*T*3); c.stroke(); } }
        else if(e.v==='ingranaggio'){ c.save(); c.translate(e.x+T*2,e.y-T*2.5); c.rotate(t*12); c.strokeStyle=`rgba(${ORO},${a})`; c.lineWidth=3; for(let i=0;i<8;i++){ c.rotate(Math.PI/4); c.beginPath(); c.moveTo(0,10); c.lineTo(0,26); c.stroke(); } c.restore(); }
        else if(e.v==='fuoco'){ const g=c.createRadialGradient(e.x-T*7,e.y,0,e.x-T*7,e.y,T*3); g.addColorStop(0,`rgba(255,140,40,${0.6*a})`); g.addColorStop(1,'rgba(255,140,40,0)'); c.fillStyle=g; c.fillRect(e.x-T*10,e.y-T*3,T*6,T*6); }
        c.fillStyle=`rgba(${ORO},${a})`; c.font='700 16px '+FONT; c.textAlign='center'; c.fillText('✓', e.x, e.y-T*0.9-f*14);
        break; }
    }
  }
  effettoSchermo(e,t,W,H){
    const c=this.ctx, f=Math.min(1,(t-e.t0)/e.dur), a=1-f;
    if(e.k==='bengala'||e.k==='luci'){ c.fillStyle=`rgba(255,240,210,${0.7*a*a})`; c.fillRect(0,0,W,H); }
    else if(e.k==='spegni'){ c.fillStyle=`rgba(${ROSSO},${0.35*a})`; c.fillRect(0,0,W,H); }
  }
  luce(M,ox,oy,R){
    const n=160, pts=new Array(n), passo=T*0.2;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2, dx=Math.cos(a), dy=Math.sin(a); let d=0, urto=false, tx=0, ty=0;
      while(d<R){ d+=passo; tx=Math.floor((ox+dx*d)/T); ty=Math.floor((oy+dy*d)/T); if(tx<0||ty<0||tx>=M.GW||ty>=M.GH||M.MURO[ty*M.GW+tx]){ urto=true; break; } }
      // contro un muro la luce entra un po'; verso nord sale sulla faccia alta del muro (se dietro c'è altro muro)
      if(urto){ let ext=T*0.6; if(dy<-0.2 && ty>0 && tx>=0 && tx<M.GW && M.MURO[(ty-1)*M.GW+tx]) ext+=T*0.9*(-dy); d=Math.min(R,d+ext); }
      pts[i]=[ox+dx*d, oy+dy*d];
    }
    return pts;
  }
  // un fumetto sopra chi parla: va a capo da solo, svanisce nell'ultimo mezzo secondo
  bolle(S){
    const c=this.ctx, gente=[S.io].concat(S.altri||[]);
    c.font='600 11px '+FONT; c.textAlign='center'; c.textBaseline='middle';
    for(const p of gente){
      const b=p && S.bolle[p.id]; if(!b) continue;
      const parole=b.testo.split(' '), righe=[]; let r='';
      for(const w of parole){ const prova=r?r+' '+w:w; if(c.measureText(prova).width>130 && r){ righe.push(r); r=w; } else r=prova; }
      if(r) righe.push(r);
      const lw=Math.max(...righe.map(x=>c.measureText(x).width))+16, lh=righe.length*14+10, x=p.x, y=p.y-T*1.75-lh;
      c.globalAlpha=Math.min(1, b.f*9);
      c.fillStyle='rgba(246,240,226,.96)'; c.strokeStyle='rgba(20,16,10,.35)'; c.lineWidth=1;
      c.beginPath(); c.roundRect ? c.roundRect(x-lw/2,y,lw,lh,8) : c.rect(x-lw/2,y,lw,lh); c.moveTo(x-5,y+lh); c.lineTo(x,y+lh+6); c.lineTo(x+5,y+lh); c.fill(); c.stroke();
      c.fillStyle='#22180c'; righe.forEach((rr,i)=>c.fillText(rr, x, y+12+i*14));
      c.globalAlpha=1;
    }
    c.textBaseline='alphabetic';
  }
  freccia(io, f, t){
    const c=this.ctx, dx=f.x-io.x, dy=f.y-io.y, d=Math.hypot(dx,dy); if(d<3*T) return;
    const a=Math.atan2(dy,dx), r=2.1*T+Math.sin(t*5)*3, x=io.x+Math.cos(a)*r, y=io.y+Math.sin(a)*r;
    c.save(); c.translate(x,y); c.rotate(a);
    c.fillStyle=f.col; c.strokeStyle='rgba(9,11,22,.8)'; c.lineWidth=3; c.lineJoin='round';
    c.beginPath(); c.moveTo(11,0); c.lineTo(-7,-9); c.lineTo(-3,0); c.lineTo(-7,9); c.closePath(); c.stroke(); c.fill();
    c.restore();
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
      c.save(); c.translate(x,y); c.rotate(attiva ? t*3 : 0); c.beginPath(); c.moveTo(-10,0); c.lineTo(10,0); c.moveTo(0,-10); c.lineTo(0,10); c.stroke(); c.restore();
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
  persona(p, t, o){
    const c=this.ctx, ph=t*10+(p.seme||0), bob=p.muove?Math.abs(Math.sin(ph))*3:Math.sin(t*2+(p.seme||0))*0.6, x=p.x, y=p.y;
    const incl = p.muove ? Math.sin(ph)*0.07 : 0, sq = p.muove ? 1+Math.abs(Math.cos(ph))*0.04 : 1+Math.sin(t*2+(p.seme||0))*0.015;
    c.globalAlpha=o.alfa;
    c.fillStyle='rgba(0,0,0,.35)'; this.ell(x,y+T*0.36,T*0.38*(1-bob*0.03),T*0.15); c.fill();
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
    if(!p.fantasma && !o.grigio){
      const sw=Math.sin(ph*0.5)*(p.muove?3:1), lx=x+T*0.45+sw, ly=y-T*0.1-bob;
      const g=c.createRadialGradient(lx,ly,0,lx,ly,18); g.addColorStop(0,'rgba(246,217,153,.55)'); g.addColorStop(1,'rgba(246,217,153,0)');
      c.fillStyle=g; this.ell(lx,ly,18,18); c.fill();
      c.strokeStyle='#3a3020'; c.lineWidth=1.2; c.beginPath(); c.moveTo(lx,ly-5); c.lineTo(lx-sw*0.4,ly-10); c.stroke();
      c.fillStyle='#3a3020'; c.fillRect(lx-3.5,ly-5,7,10); c.fillStyle=`rgba(246,217,153,${0.85+0.15*Math.sin(t*13+(p.seme||0))})`; c.fillRect(lx-2,ly-3.5,4,7);
    }
    if(o.nome){
      c.font='600 11px '+FONT; c.textAlign='center'; c.lineJoin='round';
      c.lineWidth=3; c.strokeStyle='rgba(9,11,22,.85)'; c.strokeText(p.nome,x,testa-5);
      c.fillStyle=o.coloreNome||'#f1e8d6'; c.fillText(p.nome,x,testa-5);
    }
    c.globalAlpha=1;
  }
  corpo(k,t){
    const c=this.ctx, x=k.x, y=k.y;
    if(k.img && k.img.complete && k.img.naturalWidth){
      const H=T*1.5, W=H*k.img.naturalWidth/k.img.naturalHeight;
      c.save(); c.translate(x,y+4); c.rotate(-Math.PI/2); c.globalAlpha=.8; c.drawImage(k.img,-W/2,-H/2,W,H); c.restore(); c.globalAlpha=1;
    } else { c.fillStyle=k.colore||'#888'; c.globalAlpha=.75; this.ell(x,y+4,15,8,0.2); c.fill(); c.globalAlpha=1; c.fillStyle='#e9e0cc'; this.ell(x-6,y,6,9,0.9); c.fill(); }
    c.save(); c.translate(x+16,y+4); c.rotate(1.2); c.fillStyle='#4b4a52'; c.fillRect(-4,-5,8,11); c.fillStyle='#2a2a30'; c.fillRect(-2,-3,4,7); c.restore();
    for(let i=0;i<2;i++){ const ph=((t*0.6)+i*0.5)%1; c.strokeStyle=`rgba(200,200,210,${0.35*(1-ph)})`; c.lineWidth=1.5; c.beginPath(); const yy=y-4-ph*24; c.moveTo(x+16,yy+6); c.quadraticCurveTo(x+21+Math.sin(t*2+i)*3,yy,x+16,yy-6); c.stroke(); }
  }
}

// la mappa piccola (tasto «Mappa»)
function disegnaMappa(cv, M, segni, maxW, maxH, sopra){
  const sc=Math.min(maxW/(M.GW*T), maxH/(M.GH*T)), w=M.GW*T*sc, h=M.GH*T*sc, dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); cv.style.width=w+'px'; cv.style.height=h+'px';
  const m=cv.getContext('2d'); m.setTransform(dpr*sc,0,0,dpr*sc,0,0); m.fillStyle='#0b0d18'; m.fillRect(0,0,M.GW*T,M.GH*T);
  for(let y=0;y<M.GH;y++) for(let x=0;x<M.GW;x++){ const i=y*M.GW+x, p=M.PAV[i]; if(p===-2){ if(M.ACQUA[i]){ m.fillStyle='#132c40'; m.fillRect(x*T,y*T,T+.5,T+.5); } continue; } m.fillStyle = p===-1 ? CORR2 : M.stanze[p].c2; m.fillRect(x*T,y*T,T+.5,T+.5); }
  m.font=`600 ${11/sc}px ${FONT}`; m.textAlign='center'; m.fillStyle='rgba(241,232,214,.85)';
  for(const s of M.stanze){ const lw=m.measureText(s.nome).width/2+3/sc; m.fillText(s.nome, Math.max(lw, Math.min(M.GW*T-lw, (s.x+s.w/2)*T)), (s.y+s.h/2)*T); }
  for(const g of segni){ m.fillStyle=g.col; m.beginPath(); m.arc(g.x,g.y,(g.r||5)/sc,0,Math.PI*2); m.fill(); if(g.bordo){ m.strokeStyle='#0b0d18'; m.lineWidth=2/sc; m.stroke(); } }
  if(sopra) sopra(m, sc);
}

// ===== minigiochi.js =====
// I minigiochi dei compiti: si giocano sul telefono di chi li fa; all'host arriva solo «fatto».

const ISTRUZIONI = {
  tieni: 'Tieni premuto finché il cerchio non si chiude.',
  sequenza: "Tocca i numeri dall'1 al 5, in ordine.",
  leva: 'Ferma la lancetta dentro la zona dorata.',
  trascina: 'Trascina le tre cose dentro il riquadro.',
  versa: 'Tieni premuto per versare. Lascia quando arrivi alla fascia dorata.',
  quadri: 'Tocca i quadri per girarli: tutte le frecce in su.',
};
const COSE = { dolci:['🧁','🍰','🥐'], barca:['📦','🛢️','🎁'], bucato:['👕','🧦','👗'] };
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
  z.innerHTML='<div class="lt-tr"><div class="meta"><span>'+(META[post.id]||'Vassoio')+'</span></div></div>';
  const area=z.querySelector('.lt-tr'), meta=area.querySelector('.meta'); let dentro=0;
  cose.forEach((e,i)=>{
    const c=el('div','cosa',e); c.style.left='6%'; c.style.top=(8+i*30)+'%'; area.appendChild(c);
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
function quadri(z, post, ok){
  const g=el('div','lt-quadri'); z.appendChild(g);
  const giri=[0,0,0,0].map(()=>1+Math.floor(Math.random()*3));
  giri.forEach((k,i)=>{
    const q=el('button','q'); q.type='button'; const f=el('span','',  '↑'); q.appendChild(f); f.style.transform=`rotate(${k*90}deg)`;
    let ang=k*90;
    q.addEventListener('pointerdown',e=>{ e.preventDefault(); if(!giri.some(x=>x)) return; giri[i]=(giri[i]+1)%4; ang+=90; f.style.transform=`rotate(${ang}deg)`; q.classList.toggle('ok', giri[i]===0); if(!giri.some(x=>x)) ok(); });
    g.appendChild(q);
  });
}

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
var RITARDATARI = "partita";   // chi arriva a partita cominciata la guarda ed entra alla prossima
var COLORI = ["#d64550","#f0a23b","#2fa36b","#4a74de","#9b59c9","#ff7f6b","#9cbf8a","#1f9a9a","#e8c547","#b9a6f0"];
function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }

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
function host(t) {
  if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
  var IO = t.mioId || "host";
  var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
  var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, rip: 0, imp: pulisci(t.impostazioni),
    players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost) }], guarda: [], classifica: null, fine: null };
  var P = null, rete = null, inviati = {}, ultimaN = {}, viaDa = {}, finePronta = false, roundDetto = 0;
  var eventi = {
    privato: function (id, m) { if (id === IO) { if (UI) UI.messaggio(m); else conserva(m); return; } m.to = id; if (rete) rete.inviaVeloce(m); },
    tutti: function (m) { if (rete) rete.inviaVeloce(m); if (UI) UI.messaggio(m); }
  };
  var R = t.ripresa, riprendo = !!(R && R.stato && R.stato.fase && R.stato.fase !== "lobby" && R.stato.players);
  if (riprendo) {
    H = R.stato; H.pronta = false; H.rip = (H.rip || 0) + 1; H.guarda = H.guarda || []; H.imp = pulisci(H.imp);
    H.players.forEach(function (p) { p.forse = false; p.via = p.id !== IO && !p.bot; if (p.id === IO) p.omino = t.mioOmino(p.nome); });
    if (H.fase === "gioco" && H.salvata) P = Partita.daStato(H.salvata, H.imp, eventi);
    else if (H.fase === "gioco") H.fase = "lobby";
    delete H.salvata;
  }
  function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
  function presenti() { return H.players.filter(function (p) { return !p.via; }); }
  // i Bot automatici: finché l'host non tocca i tasti dei Bot, la saletta sta a RIEMPI posti (le persone prendono il posto dei Bot)
  if (H.auto == null) H.auto = true;
  // la saletta: una partita nell'atrio senza ruoli, dove si gira finché l'host non fa partire dal computer
  function nuovaSaletta() {
    P = new Partita(presenti().map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot }; }), H.imp, eventi, { saletta: true });
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
    onConnesso: function () { H.pronta = true; bd(); },
    onErrore: function () { if (H.pronta) return; ferma(); if (rete) rete.chiudi(); erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); }); },
    onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
    onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
    onAddio: function (id) {
      if (H.guarda.some(function (x) { return x.id === id; })) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
      var p = pById(id); if (!p) return;
      p.forse = false;
      if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); riempi(); bd(); return; }
      p.via = true; viaDa[id] = Date.now(); bd();   // resta in partita: se torna entro un minuto e mezzo riprende il suo posto
    },
    onMsg: function (id, m) {
      if (!m || !m.t) return;
      if (m.t === "join") {
        var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
        if (!p && !t.puoSedersi(id, nome)) { if (!H.guarda.some(function (x) { return x.id === id; })) H.guarda.push({ id: id, nome: nome }); bd(); return; }
        if (!p && H.fase === "lobby" && H.players.length >= MAX && H.auto) togliBot(true);   // un Bot automatico lascia il posto
        if (!p && H.fase === "lobby" && H.players.length < MAX) { H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino) }); riempi(); }
        if (p) { p.forse = false; if (p.via && H.fase !== "lobby") { p.via = false; delete viaDa[id]; } if (!p.omino) p.omino = avatarValido(m.omino); }
        bd();
        if (p && P) {
          inviati[id] = -1; ultimaN[id] = 0;
          var g = P.per(id); if (g) rete.inviaVeloce({ t: "tp", x: Math.round(g.x), y: Math.round(g.y), ep: g.ep, to: id });
          // gli avatar non viaggiano nella foto durante la partita: a chi rientra li mando a parte
          rete.inviaVeloce({ t: "av", l: H.players.filter(function (q) { return q.omino; }).map(function (q) { return [q.id, q.omino]; }), to: id });
        }
        return;
      }
      if (!P || !pById(id) || (H.fase !== "gioco" && H.fase !== "lobby")) return;
      if (H.fase === "lobby" && m.t !== "p" && !(m.t === "a" && m.k === "parla")) return;   // nella saletta: si cammina e si parla
      if (m.t === "p") { if (m.n <= (ultimaN[id] || 0)) return; ultimaN[id] = m.n; P.muovi(id, m); }
      else if (m.t === "a") P.azione(id, m);
    }
  }, { ripresa: riprendo });
  if (!rete) return senzaRete(t);
  if (riprendo && rete.codice) H.codice = rete.codice;

  function vm() {
    var v = { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, rip: H.rip, tiene: IO, imp: H.imp, auto: !!H.auto,
      players: H.players.map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot, via: !!p.via, forse: !!p.forse, omino: H.fase === "lobby" || p.bot ? (p.omino || null) : undefined }; }),
      guarda: H.guarda, classifica: H.classifica, fine: H.fine };
    if (P && (H.fase === "gioco" || H.fase === "lobby")) v.g = P.foto();
    return v;
  }
  function ricorda() {
    if (H.fase === "lobby") return t.ricorda(null);
    t.ricorda({ fase: H.fase, codice: H.codice, partita: H.partita, rip: H.rip, imp: H.imp, guarda: H.guarda, classifica: H.classifica, fine: H.fine,
      players: H.players.map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot, via: !!p.via, omino: p.bot ? p.omino : undefined }; }),
      salvata: P && H.fase === "gioco" ? P.salva() : null });
  }
  var ultimaFoto = 0, fotoDopo = null, ricordaT = 0, ricordaFase = null;   // (lo stato per la ripresa si salva ogni 2 s, e a ogni cambio di fase)
  function bd() {
    if (fotoDopo) { clearTimeout(fotoDopo); fotoDopo = null; }
    ultimaFoto = Date.now();
    var v = vm(); rete.invia({ t: "vm", vm: v }); if (H.fase !== ricordaFase || ultimaFoto - ricordaT > 2000) { ricordaFase = H.fase; ricordaT = ultimaFoto; ricorda(); } disegna(t, v, cbHost);
  }
  function mandaPrivati(tutti) {
    if (!P) return;
    H.players.forEach(function (p) {
      if (p.bot) return;
      var pr = P.privato(p.id); if (!pr) return;
      if (!tutti && inviati[p.id] === pr.v) return;
      inviati[p.id] = pr.v;
      if (p.id === IO) { if (UI) UI.privato(pr); else PENDENTI.priv = pr; }
      else rete.inviaVeloce({ t: "priv", p: pr, to: p.id });
    });
  }
  // il tempo della partita: 20 volte al secondo; le posizioni a tutti 10 volte al secondo
  var ultimo = Date.now(), nTick = 0, fermo = false;
  var loop = setInterval(function () {
    if (fermo) return;
    var ora = Date.now(), dt = Math.min(0.1, (ora - ultimo) / 1000); ultimo = ora;
    if (!P || (H.fase !== "gioco" && H.fase !== "lobby")) return;   // (anche nella saletta: si gira nell'atrio)
    P.tick(dt);
    if (P.cambiata) { P.cambiata = false; if (ora - ultimaFoto >= 250) bd(); else if (!fotoDopo) fotoDopo = setTimeout(bd, 250); }
    var pos = P.posizioni();
    if (UI) UI.posizioni(pos);
    if (++nTick % 2 === 0) rete.inviaVeloce({ t: "pos", s: nTick, p: pos });
    mandaPrivati(false);
    if (P.round !== roundDetto && P.fase === "gioco") { roundDetto = P.round; t.aCheSiamo("Round " + P.round); }
    Object.keys(viaDa).forEach(function (id) { if (ora - viaDa[id] > 90000) { delete viaDa[id]; P.esce(id); } });
    if (P.fase === "fine" && !finePronta) { finePronta = true; setTimeout(fine, 2600); }
  }, 50);
  function ferma() { fermo = true; clearInterval(loop); if (fotoDopo) clearTimeout(fotoDopo); }

  function comincia() {
    if (H.fase !== "lobby" || presenti().length < MIN) return;
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
  function nuova() { if (H.fase !== "fine") return; H.fase = "lobby"; H.classifica = null; H.fine = null; H.players = presenti(); nuovaSaletta(); riempi(); bd(); mandaPrivati(true); }
  t.onRivincita = nuova;
  function aggiungiBot(da) {
    if (H.fase !== "lobby" || H.players.length >= MAX) return;
    if (da !== true) H.auto = false;   // l'host ha deciso lui: da qui i Bot li gestisce a mano
    var usati = H.players.map(function (p) { return p.nome; }), b = null;
    try { b = SG.bot && SG.bot.prendi ? SG.bot.prendi(1, { escludi: usati })[0] : null; } catch (e) {}
    var n = H.players.filter(function (p) { return p.bot; }).length + 1;
    H.players.push({ id: "bot-" + Date.now().toString(36) + n, nome: b ? b.nome : "Bot " + n, omino: b ? avatarValido(b.omino) : null, bot: true });
    if (da !== true) allinea();
    bd();
  }
  function togliBot(da) { if (da !== true) H.auto = false; for (var i = H.players.length - 1; i >= 0; i--) if (H.players[i].bot) { H.players.splice(i, 1); if (da !== true) allinea(); bd(); return; } }

  var cbHost = { sonoHost: true, myId: IO, onComincia: comincia, onNuova: nuova, onBot: aggiungiBot, onTogliBot: togliBot,
    onVia: function () { if (P && !P.saletta) P.via(); },
    mossa: function (m) { if (!P || (H.fase !== "gioco" && H.fase !== "lobby")) return; if (m.t === "p") P.muovi(IO, m); else if (m.t === "a") P.azione(IO, m); },
    onEsci: function () {
      function via() { ferma(); t.ricorda(null); rete.chiudi(); chiudiUI(); t.esci(); }
      if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
      via();
    } };
  if (!riprendo || H.fase === "lobby") { nuovaSaletta(); riempi(); }
  bd();
  if (P) mandaPrivati(true);
}

// =========================================================
//  OSPITE: disegna le foto dell'host e manda posizione e mosse
// =========================================================
function ospite(t, codice) {
  if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
  var S = { rete: null, myId: null, nome: "", vm: null };
  var cb = { sonoHost: false, myId: null,
    mossa: function (m) { if (S.rete) S.rete.invia(m); },
    onEsci: function () {
      function via() { if (S.rete) S.rete.chiudi(); chiudiUI(); t.esci(); }
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
    S.rete = SGNet.entra(codice, {
      onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
      onMsg: function (m) {
        if (!m || !m.t) return;
        if (m.to && m.to !== S.myId) return;
        if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
        else if (m.t === "pos") { if (UI) UI.posizioni(m.p, m.s); }
        else if (m.t === "priv") { if (UI) UI.privato(m.p); else PENDENTI.priv = m.p; }
        else if (m.t === "tp" || m.t === "avviso" || m.t === "morte" || m.t === "bolla") { if (UI) UI.messaggio(m); else conserva(m); }
        else if (m.t === "av") (m.l || []).forEach(function (x) { avatarDi(x[0], avatarValido(x[1])); });
      },
      onChiuso: function (perche) { chiudiUI(); errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
      onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
    });
    if (!S.rete) senzaRete(t);
  }
  function attesa() {
    var s = t.schermata({ icona: "🏮", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
    t.mostra(s);
  }
}
function conserva(m) { if (m.t === "tp") PENDENTI.tp = m; }

// =========================================================
//  DISEGNO: saletta, partita, fine
// =========================================================
var UI = null, FIN = null;
function chiudiUI() { if (UI) { UI.stop(); UI = null; } }
function disegna(t, vm, cb) {
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
    giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
    extra: extra,
    spettatore: t.guarda ? "Guardi soltanto" : guardo ? "Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX ? "La stanza è piena: guardi la partita" : false,
    attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
}
function medaglie(posti) { var gruppi = 0, prec = null; return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return gruppi + "°"; }); }
var TITOLI = { ospiti: "Vincono gli ospiti", ombre: "Vincono le ombre", giullare: "Vince il Giullare", accusatore: "Vince l'Accusatore", avvoltoio: "Vince l'Avvoltoio", indovino: "Vince l'Indovino" };
function titoloVince(v) { return !v ? "Fine della notte" : TITOLI[v.chi] || "Fine della notte"; }
function finale(t, vm, cb) {
  stile();
  var f = vm.fine || {}, v = f.vincitore;
  var s = t.schermata({ icona: v && v.chi === "ombre" ? "🌑" : "🏮", titolo: titoloVince(v) });
  var targa = !!t.guarda && !t.eliminazione, cl = (vm.classifica || []).slice().sort(function (a, b) { return a.pos - b.pos; }), fac = targa ? null : t.faccine();
  if (targa) s.classList.add("lt-fine-targa");
  if (v) s._contenuto.appendChild(t.el("p", { class: "lt-perche", text: v.perche }));
  var ruoli = {}; (f.ruoli || []).forEach(function (r) { ruoli[r[0]] = r; });
  var ol = t.el("ol", { class: "classifica" + (cl.length > 6 ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; }));
  cl.forEach(function (r, i) {
    var ru = ruoli[r.id], nomeR = ru && RUOLI[ru[1]] ? RUOLI[ru[1]].nome : "";
    ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
      t.el("span", { class: "pos", text: med[i] }),
      t.el("span", { class: "nome", text: (r.id === cb.myId ? r.nome + " (tu)" : r.nome) }),
      t.el("span", { class: "punti lt-ruolo", text: nomeR + (ru && !ru[2] ? " · spento" : "") }) ]));
  });
  s._contenuto.appendChild(ol);
  if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
  if (!cl.some(function (r) { return r.id === cb.myId; })) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
  if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: targa ? "Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
    if (!targa) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "Esci", onclick: cb.onEsci }));
  }
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
  parla: '<path d="M4 5h16v10H10l-5 4v-4H4z"/>',
  invia: '<path d="M4 12h14M13 6l6 6-6 6"/>',
  mappa: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
  suono: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.6 6.4a7.6 7.6 0 0 1 0 11.2"/>',
  muto: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
  vota: '<path d="M4 11h16v9H4z"/><path d="M8 11V4h8v7M10 7.5h4"/>',
  sospetto: '<circle cx="10" cy="10" r="6"/><path d="M15 15l5 5"/>',
  pulito: '<path d="M5 12.5l4.5 4.5L19 7"/>',
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
  gira: '<rect x="8" y="4" width="8" height="16" rx="2"/><path d="M3.5 9.5A9 9 0 0 1 7 5M20.5 14.5A9 9 0 0 1 17 19"/><path d="M3 6.5l.5 3 3-.5M21 17.5l-.5-3-3 .5"/>'
};
function icona(n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONE[n] || "") + "</svg>"; }
// un tasto con icona e scritta
function tastoIco(cls, ico, testo) { var b = document.createElement("button"); b.type = "button"; if (cls) b.className = cls; b.innerHTML = icona(ico) + (testo ? "<span>" + testo + "</span>" : ""); return b; }
function E(tag, cls, testo) { var e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; }
function Vista(t, cb) {
  stile();
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
  V.chip = E("span", "lt-chip", "");
  // la «i»: cosa fa il mio ruolo, il mio tasto, come si vince (si apre anche toccando il nome del ruolo)
  V.btnInfo = E("button", "lt-ibtn", "i"); V.btnInfo.type = "button"; V.btnInfo.setAttribute("aria-label", "Il tuo ruolo");
  V.btnInfo.addEventListener("click", function () { V.apriInfo(); }); V.chip.addEventListener("click", function () { V.apriInfo(); });
  sx.appendChild(E("div", "lt-riga", null)); sx.firstChild.append(esci, V.chip, V.btnInfo);
  V.barra = E("div", "lt-barra"); V.barra.innerHTML = '<span>Preparativi</span><div class="tr"><i></i></div>'; sx.appendChild(V.barra);
  V.info = E("div", "lt-info", ""); V.info.hidden = true; sx.appendChild(V.info);
  V.registroBox = E("div"); sx.appendChild(V.registroBox);
  V.btnLista = E("button", "lt-lista-btn", "Compiti"); sx.appendChild(V.btnLista);
  V.lista = E("ol", "lt-lista"); V.lista.hidden = true; sx.appendChild(V.lista);
  V.btnLista.addEventListener("click", function () { V.lista.hidden = !V.lista.hidden; V.aggLista(); });
  sc.appendChild(sx);
  var dx = E("div", "lt-dx"); V.btnSuono = E("button", "lt-hbtn ico"); V.btnSuono.innerHTML = icona(AUDIO.muto ? "muto" : "suono"); V.btnSuono.setAttribute("aria-label", "Suono"); V.btnMappa = E("button", "lt-hbtn"); V.btnMappa.innerHTML = icona("mappa") + "<span>Mappa</span>"; dx.append(V.btnSuono, V.btnMappa); sc.appendChild(dx);
  V.btnMappa.addEventListener("click", function () { V.apriMappa(); });
  // la chat di prossimità: «Parla» apre una riga in basso; il messaggio compare come fumetto e lo legge solo chi è vicino
  V.bolle = {};
  V.btnGira = E("button", "lt-hbtn ico"); V.btnGira.innerHTML = icona("gira"); V.btnGira.setAttribute("aria-label", "Gioca di lato"); dx.insertBefore(V.btnGira, dx.firstChild);
  V.btnGira.classList.toggle("acceso", !!V.oriz);
  V.btnGira.addEventListener("click", function () { V.oriz = !V.oriz; try { localStorage.setItem("lt-oriz", V.oriz ? "1" : "0"); } catch (e) {} V.btnGira.classList.toggle("acceso", V.oriz); V.joyReset(); V.ruota(); });
  V.btnParla = E("button", "lt-hbtn ico"); V.btnParla.innerHTML = icona("parla"); V.btnParla.setAttribute("aria-label", "Parla a chi è vicino"); dx.insertBefore(V.btnParla, V.btnMappa);
  V.parlaBar = E("form", "lt-parla"); V.parlaBar.hidden = true;
  var pIn = E("input"); pIn.type = "text"; pIn.maxLength = 60; pIn.placeholder = "Scrivi a chi è vicino"; pIn.setAttribute("enterkeyhint", "send");
  var pOk = E("button"); pOk.type = "submit"; pOk.innerHTML = icona("invia"); pOk.setAttribute("aria-label", "Invia");
  V.parlaBar.append(pIn, pOk); sc.appendChild(V.parlaBar);
  V.btnParla.addEventListener("click", function () { V.parlaBar.hidden = !V.parlaBar.hidden; if (!V.parlaBar.hidden) pIn.focus(); else pIn.blur(); });
  V.parlaBar.addEventListener("submit", function (e) { e.preventDefault(); var tx = pIn.value.trim(); if (!tx) return; V.manda("parla", { testo: tx }); pIn.value = ""; pIn.blur(); V.parlaBar.hidden = true; });
  V.btnSuono.addEventListener("click", function () { AUDIO.muto = !AUDIO.muto; try { localStorage.setItem("lt-muto", AUDIO.muto ? "1" : "0"); } catch (e) {} V.btnSuono.innerHTML = icona(AUDIO.muto ? "muto" : "suono"); if (!AUDIO.muto) SUONO.voto(); });
  V.s.addEventListener("pointerdown", function (e) { if (e.isTrusted) AUDIO.toccato = true; audio(); }, { passive: true });
  V.guida = E("div", "lt-guida"); sc.appendChild(V.guida);
  V.nomeStanza = E("div", "lt-nomestanza"); V.nomeStanza.setAttribute("aria-live", "polite"); sc.appendChild(V.nomeStanza);
  V.via = E("div", "lt-via"); sc.appendChild(V.via);
  V.az = E("div", "lt-azioni"); sc.appendChild(V.az);
  V.btn = {};
  [["abil", "Abilità", "viola"], ["botola", "Botola", "rosso"], ["buio", "Buio", "rosso"], ["segnala", "Segnala", ""], ["spegni", "Spegni", "rosso"], ["usa", "Usa", "oro"]].forEach(function (b) {
    var e = E("button", "lt-az " + b[2]); e.innerHTML = '<span class="et"></span><span class="cd" hidden></span>'; e.style.gridArea = b[0];
    e.addEventListener("pointerdown", function (ev) { ev.preventDefault(); if (!e.disabled) V.azione(b[0]); });
    V.btn[b[0]] = e; V.az.appendChild(e);
  });
  V.avv = E("div", "lt-avviso"); sc.appendChild(V.avv);
  V.velo = E("div", "lt-velo"); V.velo.hidden = true; sc.appendChild(V.velo);
  V.intro = E("div", "lt-intro"); V.intro.hidden = true; sc.appendChild(V.intro);
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
Vista.prototype.stop = function () { this.vivo = false; this.slega(); };
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
  V.joyZona.addEventListener("pointerup", fine); V.joyZona.addEventListener("pointercancel", fine);
  V.suGiu = function (e) {
    if (!V.vivo || /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) return;
    V.tasti[e.code] = e.type === "keydown";
    if (e.type !== "keydown" || e.repeat) return;
    var k = { KeyE: "usa", KeyR: "segnala", KeyQ: "spegni", KeyF: "abil", KeyV: "botola", KeyB: "buio" }[e.code];
    if (k && V.btn[k] && !V.btn[k].disabled && !V.btn[k].hidden) V.azione(k);
    if (e.code === "KeyM") V.apriMappa();
  };
  document.addEventListener("keydown", V.suGiu); document.addEventListener("keyup", V.suGiu);
};
Vista.prototype.slega = function () {
  if (this.suGiu) { document.removeEventListener("keydown", this.suGiu); document.removeEventListener("keyup", this.suGiu); }
  if (this.ruota) { window.removeEventListener("resize", this.ruota); window.removeEventListener("orientationchange", this.ruota); }
  if (this.noZoom) document.removeEventListener("gesturestart", this.noZoom);
};
// un punto del dito dentro la scena (in pixel della scena, anche quando è girata di lato)
Vista.prototype.locale = function (e) {
  var sc = this.sc;
  if (this.girato) return { x: e.clientY, y: window.innerWidth - e.clientX };
  var r = sc.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top };
};
Vista.prototype.joyReset = function () { var j = this.joyV; j.id = null; j.x = 0; j.y = 0; this.joy.classList.remove("on"); this.joy.style.left = ""; this.joy.style.top = ""; this.knob.style.transform = ""; };

// ----- quello che arriva dall'host -----
Vista.prototype.foto = function (vm) {
  var V = this; V.vm = vm; V.g = vm.g || null;
  if (V.compAgg) V.compAgg();
  vm.players.forEach(function (p, i) { V.cache[p.id] = V.cache[p.id] || { colore: COLORI[i % COLORI.length] }; V.cache[p.id].nome = p.nome; COLORI_DI[p.id] = V.cache[p.id].colore; if (p.omino) avatarDi(p.id, p.omino); });
  var io = vm.players.filter(function (p) { return p.id === V.cb.myId; })[0];
  V.guardo = !io || !!io.via || !V.priv;
  if (!V.g) return;
  var M = V.g.mappa === "palazzo" ? PALAZZO : ATRIO;
  if (M !== V.M) { V.M = M; V.pit.cam.ok = false; V.buf = []; }   // la posizione nuova arriva col «tp» dell'host
  V.secFine = performance.now() + V.g.sec * 1000;
  if (V.g.acqua) V.acquaFine = performance.now() + V.g.acqua[0] * 1000;
  if (V.g.riu) { V.discFine = performance.now() + V.g.riu.disc * 1000; V.votoFine = performance.now() + V.g.riu.voto * 1000; }
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
    V.offMin = m; V.ritardo = Math.max(70, Math.min(350, d[Math.floor(d.length * 0.9)] + 35));
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
  V.aggLista(); V.aggHud(); if (V.g) V.aggVelo();
};
Vista.prototype.messaggio = function (m) {
  if (m.t === "tp") {
    var salto = Math.hypot(m.x - this.me.x, m.y - this.me.y) > 4 * T; this.me.x = m.x; this.me.y = m.y; this.me.ep = m.ep; this.me.ok = true;
    if (salto) {   // spostati lontano (Trasportatore, botola, riunione): si chiude quello che era aperto lì
      this.pit.cam.ok = false;
      if (this.veloTipo === "compito") { this.mg = null; this.velo.hidden = true; this.veloTipo = null; this.velo.textContent = ""; this.aggVelo(); }
      if (this.pannello) this.pannello.chiudi();
    }
  }
  else if (m.t === "avviso") { this.avviso(m.testo, m.tipo); if (m.tipo === "morte") vibra(120); }
  else if (m.t === "morte") this.scenaMorte(m);
  else if (m.t === "bolla") { this.bolle[m.id] = { testo: String(m.testo || "").slice(0, 60), fine: performance.now() + 4500 }; }
  else if (m.t === "fx") this.effetto(m);
};
var DURATE = { urlo: 6, scudoRotto: 1.2, telecamera: 1, trasporto: 1, spegni: 1.2, sparo: 0.5, scudo: 1.2, lente: 1.2, fiuto: 1, ipnosi: 1, trasforma: 0.9, botola: 0.7, sparisce: 1, mangia: 1, gatto: 1.2, rianima: 1.6, campana: 1.2, compito: 2.6, bengala: 1.2, luci: 0.8 };
Vista.prototype.effetto = function (m) {
  var V = this, ora = V.tempo, P = V.pit;
  if (m.k === "cade") { SUONO.spegni(); vibra(60); return; }
  if (m.k === "interferenza" || m.k === "acqua") { if (V.squadra() !== "ombre") { SUONO.allarme(); vibra(100); } V.avviso(m.k === "acqua" ? "Acqua alta! Una chiusa sul Molo, una in Cantina." : "Interferenza: telecamere, plastico e frecce sono spenti.", "morte"); return; }
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
  else if (m.k === "compito") { P.sparpaglia("scintilla", m.x, m.y - T * 0.5, 18, { v: 70, vita: 0.9, r: 3 }); if (m.id === V.cb.myId) SUONO.compito(); }
  else if (m.k === "rianima" || m.k === "gatto") { P.sparpaglia("scintilla", m.x, m.y - T * 0.5, 26, { v: 90, vita: 1.2, r: 3 }); SUONO.abil(); }
  else if (m.k === "sparo") { SUONO.spegni(); V.scossa = 0.3; }
  else if (m.k === "bengala" || m.k === "luci") SUONO.luci();
  else if (/sparisce|mangia|botola|trasforma/.test(m.k)) P.sparpaglia("fumo", m.x, m.y - T * 0.3, 10, { v: 30, vita: 0.9, r: 5 });
  else SUONO.abil();
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
  var puoMuovere = !V.guardo && pr && pr.botola == null && (g.fase === "gioco" || g.fase === "atrio") && !V.mg && !V.pannello && V.bloccFine <= performance.now();
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
    else { if (libero(M, me.x + vx, me.y)) me.x += vx; if (libero(M, me.x, me.y + vy)) me.y += vy; }
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
    V.altri().forEach(function (p) { if (p.muove && !p.fantasma) V.orme.push({ x: p.x, y: p.y, dir: p.dir, col: p.colore || "#ccc", t: V.tempo, lato: V.lato }); });
    var durO = (V.vm.imp.investigatore && V.vm.imp.investigatore.orme) || 10; V.orme = V.orme.filter(function (o) { return V.tempo - o.t < durO; });
  }
  if (V.feed) V.disegnaSchermi();
  if (V.plastico) { if (V.plastico.fine && ora > V.plastico.fine) V.pannello && V.pannello.chiudi(); else if (V.tempo - V.plastico.ultimo > 1) V.disegnaPlastico(); }
  // con un pannello aperto la scena dietro il velo scuro si ridisegna un fotogramma su tre: non si vede la differenza, il telefono respira
  var dietro = !V.velo.hidden && (V.veloTipo === "pannello" || V.veloTipo === "mappa" || V.veloTipo === "compito");
  V.nVelo = dietro ? (V.nVelo || 0) + 1 : 0;
  if (!dietro || V.nVelo % 3 === 1) V.disegnaScena();
  if (Math.floor(V.tempo * 6) !== V.kHud) { V.kHud = Math.floor(V.tempo * 6); V.aggHud(); V.aggVelo(true); }
};
Vista.prototype.sonoVivo = function () { var g = this.g; if (!g) return false; for (var i = 0; i < g.g.length; i++) if (g.g[i][0] === this.cb.myId) return !!g.g[i][1]; return false; };
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
    out.push({ id: q[0], x: x, y: y, dir: q[3], muove: !!(q[4] & 1), fantasma: !!(q[4] & 2), nome: c.nome || "?", colore: c.colore, img: av && av.img, imgS: av && av.imgS, seme: (q[0].length * 7) % 11, alleata: comp.indexOf(q[0]) >= 0, coloreNome: lt === "buono" ? "#8ee6a8" : lt === "cattivo" ? "#ff7a8a" : null });
  });
  return out;
};
Vista.prototype.squadra = function () { return this.priv ? this.priv.squadra : "ospiti"; };
Vista.prototype.raggio = function () {
  var imp = (this.vm && this.vm.imp) || { vistaOspiti: 6, vistaOmbre: 7 };
  if (this.g && this.g.bengala > 0) return 40 * T;
  if (this.squadra() === "ombre" || (this.priv && this.priv.ruolo === "giullare")) return imp.vistaOmbre * T;
  if (this.priv && this.priv.ruolo === "vedetta") return (imp.vistaOspiti + 2) * T;
  return (this.g && this.g.buio ? Math.min(imp.vistaOspiti, 2.2) : imp.vistaOspiti) * T;
};
Vista.prototype.compitiAperti = function () { var V = this; if (!V.priv) return []; return V.priv.compiti.filter(function (c) { return !c[1] && !V.fatti[c[0]]; }).map(function (c) { return POSTAZIONI.filter(function (p) { return p.id === c[0]; })[0]; }).filter(Boolean); };
// la foto del Medium: la si guarda, la si rifà (con la ricarica); alla riunione la vedono tutti
Vista.prototype.apriFoto = function () {
  var V = this, pr = V.priv; if (!pr || !pr.foto || !V.g || V.g.fase !== "gioco") return;
  var box = E("div", "lt-pannello lt-foto"), testa = E("div", "testa"), ch = E("button", "lt-chiudi", "×"), cv = E("canvas", "foto");
  testa.append(E("h3", "", "La tua foto dall'aldilà"), ch); box.append(testa, cv, E("p", "nota", "Alla prossima riunione la vedranno tutti."));
  var rifai = tastoIco("rifai", "gira", "Rifai"); box.appendChild(rifai);
  var k = null, agg = function () { if (!V.priv || !V.priv.foto) return; if (k !== V.priv.foto.seme) { k = V.priv.foto.seme; disegnaFoto(cv, V.priv.foto); } var cdF = V.priv.cdF || 0; rifai.disabled = cdF > 0; rifai.querySelector("span").textContent = cdF > 0 ? "Rifai tra " + cdF + " s" : "Rifai"; };
  rifai.addEventListener("click", function () { V.manda("fantasma", { rifai: 1 }); });
  V.apriPannello("foto", box, function () { clearInterval(V.fotoT); });
  ch.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  agg(); clearInterval(V.fotoT); V.fotoT = setInterval(agg, 400);
};
// una foto dall'aldilà, disegnata dal vero: un pezzo dell'avatar di chi è stato (cappello, viso, scarpe…) o un angolo della stanza,
// in seppia, sgranata e storta come una vecchia stampa. Il seme decide tutto: la stessa foto viene uguale su tutti i telefoni.
var COLORI_DI = {};   // (id → colore, per le foto di chi non ha l'avatar)
function casoDa(seme) { var x = seme >>> 0; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; }
var PEZZI = [[0.24, 0.0, 0.52, 0.34], [0.3, 0.1, 0.4, 0.28], [0.18, 0.3, 0.64, 0.34], [0.2, 0.58, 0.6, 0.3], [0.16, 0.78, 0.68, 0.22], [0.5, 0.36, 0.46, 0.34]];
function disegnaFoto(cv, f) {
  var c = cv.getContext("2d"), w = cv.offsetWidth || 220, h = cv.offsetHeight || 160, dpr = Math.min(2, window.devicePixelRatio || 1), r = casoDa(f.seme);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0);
  var fine = function () {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = "saturation"; c.fillStyle = "#808080"; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "multiply"; c.fillStyle = "#d9b98a"; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = "source-over";
    for (var i = 0; i < 900; i++) { c.fillStyle = "rgba(" + (r() < .5 ? "0,0,0" : "255,240,210") + "," + (0.05 + r() * 0.12) + ")"; c.fillRect(r() * w, r() * h, 1.2, 1.2); }
    var g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7); g.addColorStop(0, "rgba(40,25,10,0)"); g.addColorStop(1, "rgba(40,25,10,.75)");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  };
  c.fillStyle = "#2b2420"; c.fillRect(0, 0, w, h);
  if (f.tipo === "chi") {
    var av = AVATAR[f.id], img = av && av.img;
    var pz = PEZZI[Math.floor(r() * PEZZI.length)], jx = (r() - 0.5) * 0.08, jy = (r() - 0.5) * 0.06, rot = (r() - 0.5) * 0.35;
    var dis = function () {
      var iw = img.naturalWidth || 100, ih = img.naturalHeight || 160, sx = (pz[0] + jx) * iw, sy = Math.max(0, (pz[1] + jy) * ih), sw = pz[2] * iw, sh = pz[3] * ih, sc = Math.max(w / sw, h / sh) * 1.08;
      c.save(); c.translate(w / 2, h / 2); c.rotate(rot); c.drawImage(img, sx, sy, sw, sh, -sw * sc / 2, -sh * sc / 2, sw * sc, sh * sc); c.restore(); fine();
    };
    if (img && img.complete && img.naturalWidth) dis(); else if (img) img.addEventListener("load", dis, { once: true });
    else {   // senza avatar: una figura incappucciata del suo colore, vista da vicino
      var col = (COLORI_DI[f.id]) || "#8a7a9a", cx = w / 2 + (r() - 0.5) * w * 0.3, cy = h * (0.35 + r() * 0.5), k = 1.6 + r() * 1.2;
      c.save(); c.translate(cx, cy); c.rotate(rot); c.scale(k, k);
      c.fillStyle = col; c.beginPath(); c.ellipse(0, 24, 30, 34, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(0, -14, 20, 22, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#f1e8d6"; c.beginPath(); c.ellipse(0, -10, 11, 9, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#1a1420"; c.fillRect(-6, -13, 3, 3); c.fillRect(3, -13, 3, 3); c.restore(); fine();
    }
  } else {
    var st = f.st >= 0 ? PALAZZO.stanze[f.st] : null, px = st ? (st.x + 1 + r() * Math.max(1, st.w - 2)) * T : f.x + (r() - 0.5) * 4 * T, py = st ? (st.y + 1 + r() * Math.max(1, st.h - 2)) * T : f.y + (r() - 0.5) * 4 * T;
    var pit = new Pittore(cv);
    pit.disegna({ M: PALAZZO, palazzo: true, t: 0, dt: 0, io: { x: px, y: py, mostra: false }, altri: [], corpi: [], R: 9 * T, anima: true, neb: false, buio: false, miei: new Set(), freccia: null, botole: false, effetti: [], telecamere: [], scala: 0.55 + r() * 0.25 });
    fine();
  }
}
// la scheda del mio ruolo: corta, tre cose (cosa fai, il tuo tasto, come si vince)
var VINCI = { ospiti: "Vinci con gli ospiti: finite i compiti, o cacciate tutte le ombre col voto.", ombre: "Vinci con le ombre: quando siete tanti quanti gli altri. Ti aiutano botole e sabotaggi." };
var TASTI = { ospiti: "Usa: compiti e riparazioni · Segnala: una lanterna spenta · Campana: nel Cortile", ombre: "Spegni: chi ti è vicino · Botola: sparisci e riappari · Sabota: luci, telegrafo, acqua" };
Vista.prototype.apriInfo = function () {
  var V = this, pr = V.priv; if (!pr || !RUOLI[pr.ruolo] || !V.g || (V.g.fase !== "gioco" && V.g.fase !== "atrio")) return;
  if (!V.sonoVivo() && pr.fantasmaRuolo && FANTASMI[pr.fantasmaRuolo]) {
    var F = FANTASMI[pr.fantasmaRuolo], bf = E("div", "lt-pannello lt-infor fantasma"), tf = E("div", "testa"), cf = E("button", "lt-chiudi", "×");
    tf.append(E("span", "sq", "Fantasma"), E("h3", "", F.nome), cf); bf.append(tf, E("p", "desc", F.desc));
    var ulf = E("ul"); ulf.append(E("li", "", "Il tuo tasto: " + F.abil), E("li", "", "Vai più veloce e passi dai muri. Puoi ancora finire i tuoi compiti.")); bf.appendChild(ulf);
    V.apriPannello("info", bf); cf.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); }); return;
  }
  var R = RUOLI[pr.ruolo], box = E("div", "lt-pannello lt-infor " + pr.squadra), testa = E("div", "testa"), ch = E("button", "lt-chiudi", "×");
  testa.append(E("span", "sq", { ospiti: "Ospite", ombre: "Ombra", soli: "Da solo" }[pr.squadra] || ""), E("h3", "", R.nome), ch); box.appendChild(testa);
  box.appendChild(E("p", "desc", R.desc));
  var ul = E("ul");
  if (R.abil) ul.appendChild(E("li", "", "Il tuo tasto: " + R.abil));
  if (TASTI[pr.squadra]) ul.appendChild(E("li", "", TASTI[pr.squadra]));
  if (VINCI[pr.squadra]) ul.appendChild(E("li", "", VINCI[pr.squadra]));
  if (pr.mod && MODIFICATORI[pr.mod]) ul.appendChild(E("li", "", MODIFICATORI[pr.mod].nome + ": " + MODIFICATORI[pr.mod].desc));
  box.appendChild(ul);
  V.apriPannello("info", box); ch.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
};
// la saletta nell'atrio: in alto il codice della stanza, quanti siamo e «Invita»
Vista.prototype.aggSaletta = function (sal) {
  var V = this;
  if (!V.salBox) {
    V.salBox = E("div", "lt-saletta"); V.salTesto = E("span", "cod"); V.salInv = tastoIco("inv", "invia", "Invita");
    V.salInv.addEventListener("click", function () { V.invita(); }); V.salBox.append(V.salTesto, V.salInv); V.velo.parentNode.appendChild(V.salBox);
  }
  V.salBox.hidden = !sal; V.sc.classList.toggle("sal", !!sal); if (!sal) return;
  var n = (V.vm.players || []).filter(function (p) { return !p.via; }).length, tx = "Stanza " + (V.vm.codice || "…") + " · " + n + "/" + MAX;
  if (V.salTesto.textContent !== tx) V.salTesto.textContent = tx;
};
// il link d'invito della stanza (gli amici entrano direttamente nella saletta)
Vista.prototype.invita = function () {
  var V = this, cod = V.vm && V.vm.codice; if (!cod || cod === "…") return;
  var url = location.origin + location.pathname + "#gioco=" + ID + "&stanza=" + cod, testo = "Vieni a giocare a Lanterne: stanza " + cod;
  if (navigator.share) { navigator.share({ title: "Lanterne", text: testo, url: url }).catch(function () {}); return; }
  try { navigator.clipboard.writeText(testo + " " + url).then(function () { V.avviso("Link copiato: mandalo agli amici."); }, function () { V.avviso("Codice della stanza: " + cod); }); } catch (e) { V.avviso("Codice della stanza: " + cod); }
};
// il computer della saletta: l'host sceglie le regole, i Bot e fa partire; gli altri vedono le regole e aspettano
Vista.prototype.apriComputer = function () {
  var V = this, host = !!V.cb.sonoHost, box = E("div", "lt-pannello lt-computer"), testa = E("div", "testa"), ch = E("button", "lt-chiudi", "×");
  testa.append(E("h3", "", "Computer della saletta"), ch); box.appendChild(testa);
  var dove = JSON.parse(JSON.stringify((V.vm && V.vm.imp) || {})), corpo = E("div", "corpo"); box.appendChild(corpo);
  var applica = function () { if (host && V.t.onRegole) V.t.onRegole(dove); };
  if (host) {
    impostazioni(corpo, dove, { el: V.t.el });
    var piede = E("div", "piede"), bAdd = tastoIco("", "pulito", "Aggiungi un Bot"), bTogli = E("button", "", "Togli un Bot"), via = tastoIco("via", "invia", "Comincia");
    bTogli.type = "button";
    bAdd.addEventListener("click", function () { V.cb.onBot && V.cb.onBot(); });
    bTogli.addEventListener("click", function () { V.cb.onTogliBot && V.cb.onTogliBot(); });
    via.addEventListener("click", function () { applica(); if (V.pannello) V.pannello.chiudi(); V.cb.onComincia && V.cb.onComincia(); });
    var nota = E("p", "nota", ""); piede.append(bAdd, bTogli, via); box.append(piede, nota);
    V.compAgg = function () { var n = (V.vm.players || []).filter(function (p) { return !p.via; }).length; via.disabled = n < MIN; nota.textContent = n < MIN ? "Servono almeno " + MIN + " giocatori: aggiungi un Bot." : n + " giocatori · " + riassunto(pulisci(dove)); };
    V.compAgg();
  } else {
    corpo.appendChild(E("p", "desc", riassunto(pulisci(dove))));
    corpo.appendChild(E("p", "nota", "Le regole le sceglie l'host. Si parte quando tocca «Comincia»."));
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
  if (V.vm && V.vm.fase === "lobby") return V.cb.sonoHost ? { x: centro(COMPUTER.tx), y: centro(COMPUTER.ty), col: "#5ad19a", testo: "Al computer: regole e Comincia" } : { x: me.x, y: me.y, testo: "Aspettiamo che l'host cominci" };
  if (!g || g.mappa !== "palazzo" || V.guardo) return null;
  var vivo = V.sonoVivo(), piu = function (l) { return l.slice().sort(function (a, b) { return V.passi(a.tx, a.ty) - V.passi(b.tx, b.ty); })[0]; };
  // i sabotaggi: la freccia la vedono tutti i vivi, ombre comprese (anche loro possono riparare)
  if (g.acqua && vivo) {
    var resta = Math.max(0, Math.ceil((V.acquaFine - performance.now()) / 1000)), aperte = [];
    if (!g.acqua[1]) aperte.push(CHIUSA_A); if (!g.acqua[2]) aperte.push(CHIUSA_B);
    var ch = piu(aperte.length ? aperte : [CHIUSA_A]);
    return { x: centro(ch.tx), y: centro(ch.ty), col: "#5ab0ff", testo: "Acqua alta · chiusa " + (ch === CHIUSA_A ? "del Molo" : "della Cantina") + " · " + resta + " s", rosso: true };
  }
  if (g.buio && vivo) return { x: centro(QUADRO.tx), y: centro(QUADRO.ty), col: "#f05a6e", testo: "Luci spente · al quadro", rosso: true };
  if (g.interf && vivo) return { x: centro(CONSOLE.tx), y: centro(CONSOLE.ty), col: "#ffb35a", testo: "Interferenza · al telegrafo", rosso: true };
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
  var altri = V.altri(), corpi = (g.corpi || []).map(function (k) { var c = V.cache[k[0]] || {}, av = AVATAR[k[0]]; return { id: k[0], x: k[1], y: k[2], colore: c.colore, img: av && av.img }; });
  var segui = null;
  if (V.guardo) { var vivi = altri.filter(function (p) { return !p.fantasma; }); segui = vivi[0] || altri[0] || { x: FALLBACK.x, y: FALLBACK.y }; }
  if (V.ctrl && V.ctrl.fine > performance.now()) segui = { x: V.ctrl.x, y: V.ctrl.y };
  var pr = V.priv || {}, come = pr.travestito || V.cb.myId;
  var mioAv = AVATAR[come], c = V.cache[come] || {};
  var ioD = { x: io.x, y: io.y, dir: io.dir, muove: io.muove, fantasma: !V.sonoVivo(), nome: c.nome || "", colore: c.colore, img: mioAv && mioAv.img, imgS: mioAv && mioAv.imgS, mostra: !V.guardo && !(pr && pr.botola != null), seme: 3, id: V.cb.myId };
  var bolle = {}; Object.keys(V.bolle).forEach(function (id) { var b = V.bolle[id], r = (b.fine - performance.now()) / 4500; if (r <= 0) delete V.bolle[id]; else bolle[id] = { testo: b.testo, f: r }; });
  var miei = new Set(g.interf ? [] : V.compitiAperti().map(function (p) { return p.id; })), meta = V.meta(), ora = performance.now();
  if (meta && meta.nessunaFreccia) meta = null;
  V.pit.disegna({ M: V.M, palazzo: g.mappa === "palazzo", t: V.tempo, dt: V.dt, io: ioD, altri: altri, corpi: corpi, R: V.raggio(),
    anima: V.guardo || !V.sonoVivo() || g.mappa !== "palazzo" || g.bengala > 0, neb: g.neb > 0, buio: g.buio > 0 && V.squadra() !== "ombre" && V.sonoVivo(), bengala: g.bengala > 0,
    miei: miei, freccia: meta, acqua: !!g.acqua, chiuse: g.acqua ? [!g.acqua[1], !g.acqua[2]] : null, interf: g.interf > 0, botole: V.squadra() === "ombre" || !V.sonoVivo() || pr.ruolo === "ingegnere", segui: segui, effetti: V.effetti, segnati: g.segnati, scossa: V.scossa,
    scudi: V.squadra() !== "ombre" ? (g.scudi || []).filter(function (id) { return id !== V.cb.myId; }) : [], telecamere: g.cam, osservate: g.osservate, orme: V.orme, durOrme: (V.vm.imp.investigatore && V.vm.imp.investigatore.orme) || 10,
    traccia: pr.traccia && V.tracciaFine > ora ? pr.traccia[0] : null, ipno: V.bloccFine > ora,
    trappola: g.mappa === "palazzo" ? pr.trappola : null, urlo: V.urlo && V.urlo.fine > V.tempo && g.mappa === "palazzo" ? V.urlo : null,
    rianima: V.rianFine > ora ? 1 - (V.rianFine - ora) / V.rianTot : 0, bolle: bolle });
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
Vista.prototype.setBtn = function (k, vis, abil, et, cd) {
  var b = this.btn[k], key = vis + "|" + abil + "|" + et + "|" + cd; if (b._k === key) return; b._k = key;
  b.hidden = !vis; b.disabled = !abil; b.querySelector(".et").textContent = et;
  var c = b.querySelector(".cd"); c.hidden = !cd; c.textContent = cd || "";
};
Vista.prototype.aggHud = function () {
  var V = this, g = V.g, pr = V.priv; if (!g) return;
  var inGioco = g.fase === "gioco" && !V.guardo && !!pr, palazzo = g.mappa === "palazzo", sal = V.vm && V.vm.fase === "lobby";
  V.az.hidden = !(inGioco && palazzo) && !sal;
  V.s.querySelector(".lt-sx").hidden = (!palazzo && !sal) || V.guardo || !pr;
  V.aggSaletta(sal);
  V.btnMappa.hidden = !palazzo;
  V.btnParla.hidden = !palazzo || g.fase !== "gioco"; if (V.btnParla.hidden) V.parlaBar.hidden = true;
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
    var nr = sal ? "Saletta" : !V.sonoVivo() && pr.fantasmaRuolo && FANTASMI[pr.fantasmaRuolo] ? FANTASMI[pr.fantasmaRuolo].nome : RUOLI[pr.ruolo] ? RUOLI[pr.ruolo].nome : ""; if (V.chip.textContent !== nr) { V.chip.textContent = nr; V.chip.dataset.squadra = pr.squadra; }
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
};
Vista.prototype.aggLista = function () {
  var V = this, pr = V.priv; if (!pr) return;
  var fatti = pr.compiti.filter(function (c) { return c[1] || V.fatti[c[0]]; }).length;
  V.btnLista.textContent = (pr.finti ? "Compiti finti " : "Compiti ") + fatti + "/" + pr.compiti.length + (V.lista.hidden ? " ▸" : " ▾");
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
Vista.prototype.manda = function (k, extra) { var m = { t: "a", k: k }; if (extra) for (var x in extra) m[x] = extra[x]; this.cb.mossa(m); };
Vista.prototype.azione = function (k) {
  var V = this, pr = V.priv, comp = (pr && pr.compagni) || [];
  if (V.vm && V.vm.fase === "lobby") { if (k === "usa" && V.vicinoUsa() && !V.pannello) V.apriComputer(); return; }
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
      if (u.tipo === "ripara") V.manda("ripara", { cosa: u.cosa });
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
  x.addEventListener("click", function (e) { e.stopPropagation(); V.chiudiMappa(); });
  V.velo.parentNode.appendChild(box);
  V.mappa = { box: box, cv: cv, leg: leg, ultimo: -9 };
  V.mappaAperta = true; V.disegnaMappaViva();
};
Vista.prototype.chiudiMappa = function () { var V = this; if (!V.mappa) return; V.mappa.box.remove(); V.mappa = null; V.mappaAperta = false; V.aggVelo(); };
Vista.prototype.disegnaMappaViva = function () {
  var V = this, M = V.mappa; if (!M || !V.g) return;
  M.ultimo = V.tempo;
  var segni = V.compitiAperti().map(function (p) { return { x: centro(p.tx), y: centro(p.ty), col: "#e7b75c" }; }), leg = [["#ffffff", "tu"], ["#e7b75c", "compiti"]];
  if (V.g.buio) { segni.push({ x: centro(QUADRO.tx), y: centro(QUADRO.ty), col: "#f05a6e", r: 7 }); leg.push(["#f05a6e", "luci"]); }
  if (V.squadra() === "ombre") { ESTREMI.forEach(function (e) { segni.push({ x: centro(e.tx), y: centro(e.ty), col: "#a993e6", r: 4 }); }); leg.push(["#a993e6", "botole"]); }
  segni.push({ x: centro(CAMPANA.tx), y: centro(CAMPANA.ty), col: "#d9a94a", r: 4 });
  // il Segugio: il pallino di chi sta seguendo, finché dura la scia
  var tr = V.priv && V.priv.traccia && V.tracciaFine > performance.now() ? V.priv.traccia[0] : null;
  if (tr) { var q = V.altri().filter(function (p) { return p.id === tr; })[0]; if (q) { segni.push({ x: q.x, y: q.y, col: "#cba2ff", r: 7, bordo: true }); leg.push(["#cba2ff", (V.cache[tr] || {}).nome || "la scia"]); } }
  segni.push({ x: V.me.x, y: V.me.y, col: "#ffffff", r: 6, bordo: true });
  var w = M.box.clientWidth - 16, h = Math.max(80, M.box.clientHeight - 58);
  disegnaMappa(M.cv, PALAZZO, segni, w, h);
  var t = leg.map(function (l) { return '<i style="background:' + l[0] + '"></i>' + l[1]; }).join(""); if (M.legK !== t) { M.legK = t; M.leg.innerHTML = t; }
};

// i pannelli sopra il gioco: schermi delle telecamere, plastico, scambio del Trasportatore
Vista.prototype.apriPannello = function (tipo, box, chiudi) {
  var V = this; V.joyReset();
  if (V.pannello) V.pannello.chiudi();
  V.velo.textContent = ""; V.velo.appendChild(box); V.velo.hidden = false; V.veloTipo = "pannello";
  V.pannello = { tipo: tipo, chiudi: function () { if (V.pannello === null) return; V.pannello = null; V.velo.hidden = true; V.veloTipo = null; V.velo.textContent = ""; if (chiudi) chiudi(); V.aggVelo(); } };
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
  if (V.sonoVivo() && !V.guardo) { var c0 = V.cache[V.cb.myId] || {}, a0 = AVATAR[V.cb.myId]; gente.push({ id: V.cb.myId, x: V.me.x, y: V.me.y, dir: V.me.dir, muove: V.me.muove, nome: c0.nome, colore: c0.colore, img: a0 && a0.img, imgS: a0 && a0.imgS }); }
  var corpi = (g.corpi || []).map(function (k) { var c = V.cache[k[0]] || {}, av = AVATAR[k[0]]; return { id: k[0], x: k[1], y: k[2], colore: c.colore, img: av && av.img }; });
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
  var c = cv.getContext("2d"), img = c.createImageData(w, h);
  for (var i = 0; i < img.data.length; i += 4) { var v = Math.random() * 160; img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v + 20; img.data[i + 3] = 255; }
  c.putImageData(img, 0, 0); c.fillStyle = "rgba(255,255,255,.85)"; c.font = "600 13px -apple-system,BlinkMacSystemFont,system-ui,sans-serif"; c.textAlign = "center"; c.fillText("NESSUN SEGNALE", w / 2, h / 2);
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
  if (V.g && V.g.interf) { V.statico(P.cv, 320, 220); P.nota.textContent = "Nessun segnale: c'è un'interferenza."; return; }
  var spia = V.priv && V.priv.ruolo === "spia";
  var gente = V.altri().filter(function (p) { return !p.fantasma; });
  if (V.sonoVivo() && !V.guardo) gente.push({ id: V.cb.myId, x: V.me.x, y: V.me.y, colore: (V.cache[V.cb.myId] || {}).colore });
  var stanze = {};
  gente.forEach(function (p) { var st = stanzaDi(PALAZZO, p); if (st.x == null) return; (stanze[st.nome] = stanze[st.nome] || { st: st, l: [] }).l.push(p); });
  var r = V.s.getBoundingClientRect();
  disegnaMappa(P.cv, PALAZZO, [], Math.min(r.width - 40, 900), r.height - 150, function (m, sc) {
    Object.keys(stanze).forEach(function (k) {
      var o = stanze[k], st = o.st, per = Math.max(1, Math.floor((st.w - 1) / 2.8));
      o.l.forEach(function (p, i) {
        var cx = (st.x + 1.6 + (i % per) * 2.8) * T, cy = (st.y + st.h - 1.8 - Math.floor(i / per) * 3) * T;
        m.fillStyle = spia ? (p.colore || "#ccc") : "#d9dce4"; m.strokeStyle = "rgba(0,0,0,.55)"; m.lineWidth = 2 / sc;
        m.beginPath(); m.arc(cx, cy - 0.6 * T, 0.95 * T, 0, Math.PI * 2); m.fill(); m.stroke();
        m.beginPath(); m.ellipse(cx, cy + 0.85 * T, 1.3 * T, 0.75 * T, 0, Math.PI, 0); m.fill(); m.stroke();
      });
    });
  });
  var resta = P.fine ? Math.max(0, Math.ceil((P.fine - performance.now()) / 1000)) : 0;
  P.nota.textContent = (spia ? "Vedi i colori: sei la Spia. " : "Teste in ogni stanza (non nei corridoi). ") + (P.fine ? "Si chiude tra " + resta + " s" : "Tocca per chiudere");
};
Vista.prototype.apriScambio = function () {
  var V = this, scelti = [], box = E("div", "lt-pannello lt-scambio");
  box.append(E("h3", "", "Chi scambi di posto?"), E("p", "", "Tocca due persone: si scambiano all'istante, ovunque siano."));
  var gr = E("div", "griglia"); box.appendChild(gr);
  var vivi = (V.g.g || []).filter(function (q) { return q[1] && !q[2]; });
  var vai = E("button", "btn btn-primario", "Scambia"), no = E("button", "btn btn-fantasma", "Annulla"); vai.disabled = true;
  vivi.forEach(function (q, j) {
    var b = E("button", "", (V.cache[q[0]] || {}).nome || "?"); b.type = "button";
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
  var V = this, imp = (V.vm && V.vm.imp && V.vm.imp.sabotaggi) || {}, box = E("div", "lt-pannello lt-scambio");
  box.append(E("h3", "", "Che sabotaggio?"), E("p", "", "Uno alla volta. Gli ospiti vedono subito dove ripararlo."));
  var gr = E("div", "griglia sab");
  [["buio", "Buio", "Gli ospiti vedono pochissimo finché non riparano il quadro delle luci in Lavanderia."], ["interferenza", "📡 Interferenza", "Si spengono telecamere, plastico e frecce dei compiti, finché non riparano il telegrafo (Sala del telegrafo)."], ["acqua", "🌊 Acqua alta", "Il palazzo si allaga: se non chiudono le due chiuse (Molo e Cantina) in tempo, vincete voi."]].forEach(function (x) {
    if ((x[0] === "acqua" && imp.acquaSi === false) || (x[0] === "interferenza" && imp.interferenzaSi === false)) return;
    var b = E("button", "", ""); b.type = "button"; b.append(E("b", "", x[1]), E("small", "", x[2]));
    b.addEventListener("click", function () { V.manda("sabota", { tipo: x[0] }); if (V.pannello) V.pannello.chiudi(); });
    gr.appendChild(b);
  });
  var no = E("button", "btn btn-fantasma", "Annulla"); no.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  box.append(gr, no);
  V.apriPannello("sabota", box);
};
// il Portiere sceglie la stanza da tenere d'occhio
Vista.prototype.apriPortineria = function () {
  var V = this, box = E("div", "lt-pannello lt-scambio"), gr = E("div", "griglia");
  box.append(E("h3", "", "Quale stanza sorvegli?"), E("p", "", "Da adesso saprai chi entra e chi esce, in ordine."));
  PALAZZO.stanze.forEach(function (st, i) { var b = E("button", "", st.nome); b.type = "button"; b.addEventListener("click", function () { V.manda("abil", { id: i }); if (V.pannello) V.pannello.chiudi(); }); gr.appendChild(b); });
  var no = E("button", "btn btn-fantasma", "Annulla"); no.addEventListener("click", function () { if (V.pannello) V.pannello.chiudi(); });
  box.append(gr, no);
  V.apriPannello("portineria", box);
};
Vista.prototype.aggRegistro = function (pr) {
  var V = this, P = pr.portineria, box = V.registroBox; box.textContent = "";
  if (!P || !P.log.length) return;
  var ol = E("ol", "lt-registro");
  P.log.slice(-5).forEach(function (x) { var li = E("li", x[1] ? "entra" : "esce", ((V.cache[x[0]] || {}).nome || "?") + (x[1] ? " è entrato" : " è uscito") + " · " + (x[2] < 2 ? "ora" : x[2] + " s fa")); ol.appendChild(li); });
  box.appendChild(ol);
};

// l'Imitatore sceglie un eliminato (il server accetta solo gli ospiti)
Vista.prototype.apriImita = function (bottone) {
  var V = this, box = V.velo.querySelector(".lt-riu"); if (!box) return;
  var p = E("div", "lt-indov"), gr = E("div", "griglia");
  p.append(E("h3", "", "Di chi prendi il ruolo?"), E("p", "", "Solo il ruolo di un ospite eliminato. Lo diventi dal prossimo round."));
  V.g.g.filter(function (q) { return !q[1] && !q[2]; }).forEach(function (q) { var b = E("button", "", (V.cache[q[0]] || {}).nome || "?"); b.type = "button"; b.addEventListener("click", function () { V.manda("imita", { id: q[0] }); p.remove(); if (bottone) bottone.remove(); }); gr.appendChild(b); });
  var no = E("button", "annulla", "Annulla"); no.type = "button"; no.addEventListener("click", function () { p.remove(); });
  p.append(gr, no); box.appendChild(p);
};

// l'Indovino sceglie il ruolo da indovinare
Vista.prototype.apriIndovina = function (id) {
  var V = this, box = V.velo.querySelector(".lt-riu"); if (!box || !V.priv) return;
  var vecchio = box.querySelector(".lt-indov"); if (vecchio) vecchio.remove();
  // si sceglie tra tutti i ruoli del gioco, anche quelli spenti nelle regole
  var imp = (V.vm && V.vm.imp) || {}, cade = !imp.indovino || imp.indovino.sbaglia !== "niente";
  var ruoli = Object.keys(RUOLI);
  var p = E("div", "lt-indov");
  p.append(E("h3", "", "Che ruolo ha " + ((V.cache[id] || {}).nome || "?") + "?"), E("p", "", "Tentativi rimasti in questa riunione: " + V.priv.tentativi + (cade ? " · se sbagli, cadi tu" : "")));
  var gr = E("div", "griglia");
  ruoli.forEach(function (r) { var b = E("button", RUOLI[r].squadra, RUOLI[r].nome); b.type = "button"; b.addEventListener("click", function () { V.manda("indovina", { id: id, ruolo: r }); p.remove(); }); gr.appendChild(b); });
  var no = E("button", "annulla", "Annulla"); no.type = "button"; no.addEventListener("click", function () { p.remove(); });
  p.append(gr, no); box.appendChild(p);
};

// ----- i pannelli sopra la mappa: ruolo, riunione, esito, fine -----
Vista.prototype.cambioFase = function () {
  var V = this, f = V.fase;
  if (f !== "gioco" && f !== "atrio") { V.joyReset(); if (V.pannello) V.pannello.chiudi(); V.chiudiMappa(); if (V.mg) { V.mg = null; V.velo.hidden = true; V.veloTipo = null; } }
  V.riuK = null;
};
Vista.prototype.aggVelo = function (soloTempi) {
  var V = this, g = V.g; if (!g) return;
  if (V.veloTipo === "compito" || V.veloTipo === "mappa" || V.veloTipo === "pannello") return;
  var f = g.fase, ora = performance.now();
  if (f === "svela" && V.priv && !V.guardo) {
    if (V.veloTipo !== "svela") {
      var r = RUOLI[V.priv.ruolo], box = E("div", "lt-pannello lt-svela " + V.priv.squadra);
      var mio = AVATAR[V.cb.myId]; if (mio && mio.busto) { var im = mio.busto.cloneNode(); im.className = "lt-svela-av"; box.appendChild(im); }
      box.append(E("p", "lt-sopra", "Questa notte sei"), E("h2", "", r.nome), E("p", "", r.desc));
      if (V.priv.squadra === "ombre") {
        var nn = V.priv.compagni.map(function (id) { return (V.cache[id] || {}).nome; }).filter(Boolean);
        box.appendChild(E("p", "lt-comp", nn.length ? "Le altre ombre: " + nn.join(", ") + "." : "Sei l'unica ombra nel palazzo."));
        var fila = E("div", "lt-alleati"); V.priv.compagni.forEach(function (id) { var a = AVATAR[id]; if (a && a.busto) fila.appendChild(a.busto.cloneNode()); }); if (fila.firstChild) box.appendChild(fila);
      } else if (V.priv.ruolo === "accusatore" && V.priv.bersaglio) box.appendChild(E("p", "lt-comp", "Il tuo bersaglio: " + ((V.cache[V.priv.bersaglio] || {}).nome || "?") + "."));
      else box.appendChild(E("p", "lt-comp", "Attento: tra voi ci sono delle ombre."));
      if (V.priv.mod && MODIFICATORI[V.priv.mod]) { var md = MODIFICATORI[V.priv.mod]; box.appendChild(E("p", "lt-mod", md.icona + " Modificatore: " + md.nome + ". " + md.desc)); }
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
      var b = E("div", "lt-pannello lt-vince"); var v = g.fine || {}; b.append(E("h2", "", titoloVince(v)), E("p", "", v.perche || ""));
      V.velo.textContent = ""; V.velo.appendChild(b); V.velo.hidden = false; V.veloTipo = "vince";
      var pr = V.priv || {}, ho = v.id ? v.id === V.cb.myId : pr.squadra === v.chi;
      if ((pr.ruolo === "gatto" || pr.ruolo === "sopravvissuto") && V.sonoVivo()) ho = true;
      if (!V.guardo) { (ho ? SUONO.vince : SUONO.perde)(); b.classList.add(ho ? "vinto" : "perso"); }
    }
    return;
  }
  if (V.veloTipo) { V.velo.hidden = true; V.velo.textContent = ""; V.veloTipo = null; }
};
// la scena della morte: chi ti ha spento (grande, a sinistra), la lanterna che si spegne, tu che cadi. Un tocco la chiude.
Vista.prototype.scenaMorte = function (m) {
  var V = this, sc = V.velo.parentNode, chi = (V.cache[m.da] || {}).nome || "Qualcuno", a = AVATAR[m.da], io = AVATAR[V.cb.myId];
  var vecchia = sc.querySelector(".lt-morte"); if (vecchia) vecchia.remove();
  var box = E("div", "lt-morte"), palco = E("div", "palco");
  var k = a && a.img ? a.img.cloneNode() : E("div", "sagoma"); k.classList.add("killer");
  var me = io && io.img ? io.img.cloneNode() : E("div", "sagoma"); me.classList.add("vittima");
  var lan = E("div", "lanterna"); lan.append(E("i", "fiamma"), E("i", "fumo"), E("i", "fumo f2"));
  palco.append(k, lan, me);
  var testo = m.modo === "sceriffo" ? "Lo Sceriffo " + chi + " ti ha colpito" : m.modo === "veterano" ? chi + " era il Veterano in allerta" : m.modo === "veleno" ? "Il veleno di " + chi + " ha fatto effetto" : chi + " ti ha spento la lanterna";
  box.append(palco, E("h2", "", testo), E("p", "", m.modo === "veterano" ? "L'hai toccato mentre era in allerta." : "Ora sei un'anima: puoi ancora finire i compiti."));
  sc.appendChild(box); vibra([90, 60, 180]); SUONO.spegni();
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
    tasto("vota", "Vota", function () { V.conf = id; clearTimeout(V.confT); V.confT = setTimeout(function () { if (V.conf === id) { V.conf = null; V.riunione(); } }, 4000); vibra(15); V.riunione(); }, "vota");
  } else if (tipo === "conf") {
    tasto("conf", "Confermi?", function () { if (V.mioVoto) return; V.manda("voto", { su: id }); V.mioVoto = id; V.conf = null; clearTimeout(V.confT); vibra(40); V.riunione(); }, "pulito");
  } else if (tipo === "mio") az.appendChild(E("span", "mio", "Il tuo voto"));
  if (ak.indexOf("|ind") >= 0) tasto("ind", "", function () { V.apriIndovina(id); }, "potere");
};
// un tasto premuto si accende un attimo (la frase è partita)
Vista.prototype.lampo = function (b) { b.classList.remove("fatto"); void b.offsetWidth; b.classList.add("fatto"); vibra(15); };
Vista.prototype.riunione = function (soloTempi) {
  var V = this, g = V.g, R = g.riu, ora = performance.now(), vivo = V.sonoVivo() && !V.guardo;
  var k = "riu|" + g.round + "|" + (V.vm.rip || 0);
  if (V.riuK !== k || V.veloTipo !== "riu") {   // (se un pannello l'ha coperta, la riunione si ridisegna)
    V.riuK = k; V.veloTipo = "riu"; V.velo.textContent = ""; V.velo.hidden = false;
    var box = E("div", "lt-pannello lt-riu"); V.velo.appendChild(box);
    var testa = E("div", "testa"); V.riuTit = E("h3", "", ""); V.riuTimer = E("div", "timer", ""); testa.append(V.riuTit, V.riuTimer); box.appendChild(testa);
    V.riuGrid = E("div", "grid"); box.appendChild(V.riuGrid);
    V.riuChat = E("div", "chat"); box.appendChild(V.riuChat);
    V.riuRap = E("div", "rapide"); box.appendChild(V.riuRap);
    // la scritta grande che apre la riunione
    var da = R ? (V.cache[R.da] || {}).nome || "?" : "?", corpoN = R && R.corpo != null ? (V.cache[R.corpo] || {}).nome : null;
    V.intro.textContent = ""; V.intro.className = "lt-intro " + (R && R.motivo === "corpo" ? "corpo" : "campana");
    var facce = E("div", "facce"); [R && R.da, R && R.corpo].forEach(function (id, i) { if (id == null) return; var a = AVATAR[id]; var f = a && a.busto ? a.busto.cloneNode() : E("i", "pall"); f.className = i ? "morto" : ""; facce.appendChild(f); });
    var icI = E("div", "icona"); icI.innerHTML = icona(R && R.motivo === "corpo" ? "lanterna" : "campana"); V.intro.append(icI, E("h2", "", R && R.motivo === "corpo" ? "Lanterna spenta!" : "Riunione!"), facce, E("p", "", corpoN ? da + " ha trovato " + corpoN : da + " ha suonato la campana"));
    V.intro.hidden = false; vibra(80);
    (R && R.motivo === "corpo" ? SUONO.corpo : SUONO.campana)();
    clearTimeout(V.introT); V.introT = setTimeout(function () { V.intro.hidden = true; }, 2000);
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
      V.riuRap.appendChild(b);
    });
    V.riuForm = E("form", "scrivi"); var inp = E("input"); inp.type = "text"; inp.maxLength = 90; inp.placeholder = "Scrivi…"; var inv = E("button", "", "Invia"); inv.type = "submit"; V.riuForm.append(inp, inv); box.appendChild(V.riuForm);
    V.riuForm.addEventListener("submit", function (e) { e.preventDefault(); var tx = inp.value.trim(); if (!tx) return; V.manda("chat", { testo: tx }); inp.value = ""; inp.blur(); });
    V.riuVoto = E("div", "voto"); V.btnSalta = tastoIco("btn btn-fantasma salta", "salta", "Salto il voto"); V.riuVoto.append(V.btnSalta); box.appendChild(V.riuVoto);
    V.btnSalta.addEventListener("click", function () { if (V.mioVoto) return; V.manda("voto", { su: "salta" }); V.mioVoto = "salta"; V.conf = null; vibra(25); V.riunione(); });
    V.riuNota = E("p", "nota", ""); box.appendChild(V.riuNota);
    V.conf = null; V.mioVoto = null; V.carte = {}; V.nChat = 0; V.espK = null;
    g.g.forEach(function (q) {
      var c = E("div", "carta"); var av = AVATAR[q[0]];
      var fac = av && av.busto ? av.busto.cloneNode() : E("i", "pall", ""); if (!av) fac.style.background = (V.cache[q[0]] || {}).colore; fac.className = av ? "faccia" : "pall";
      c.append(fac, E("span", "nm", (V.cache[q[0]] || {}).nome || "?"), E("span", "st", ""), E("span", "vt", ""), E("div", "az"));
      V.carte[q[0]] = c; V.riuGrid.appendChild(c);
    });
  }
  // tempi
  var disc = Math.max(0, Math.ceil((V.discFine - ora) / 1000)), voto = Math.max(0, Math.ceil((V.votoFine - ora) / 1000));
  V.riuTimer.textContent = g.fase === "esito" ? "✓" : disc > 0 ? disc : voto;
  if (g.fase === "riunione") V.riuNota.textContent = !vivo ? "Sei un'anima: guardi la riunione." : R && R.zittiti.indexOf(V.cb.myId) >= 0 && disc > 0 ? "Sei stato zittito: non parli, ma voti." : disc > 0 ? "Si parla: il voto si apre tra " + disc + " s" : V.mioVoto === "salta" ? "Hai saltato il voto." : V.mioVoto ? "Hai votato " + ((V.cache[V.mioVoto] || {}).nome || "") + "." : "Vota: tocca Vota sotto chi vuoi cacciare.";
  if (soloTempi) return;
  if (R) {
    var da = (V.cache[R.da] || {}).nome || "?";
    V.riuTit.textContent = R.motivo === "corpo" ? da + " ha trovato una lanterna spenta" : da + " ha suonato la campana";
    var chat = R.chat || [];
    for (var i = V.nChat; i < chat.length; i++) {
      var p = E("p"); var chi = chat[i][0]; if (chi != null) { var b = E("b", "", ((V.cache[chi] || {}).nome || "?") + ": "); b.style.color = (V.cache[chi] || {}).colore; p.appendChild(b); } else p.className = "sis"; p.append(chat[i][1]); V.riuChat.appendChild(p);
      if (chat[i][2] && chat[i][2].foto) { var fc = E("canvas", "foto"); V.riuChat.appendChild(fc); disegnaFoto(fc, chat[i][2].foto); }
    }
    if (chat.length > V.nChat) V.riuChat.scrollTop = V.riuChat.scrollHeight;
    V.nChat = chat.length;
  }
  var votati = R ? R.votati : [], zitt = R ? R.zittiti : [], esito = g.esito, sindaci = g.sindaci || [];
  var mioBers = V.priv && V.priv.ruolo === "accusatore" ? V.priv.bersaglio : null;
  var nVoto = 0, kEs = esito ? "es|" + g.round : null, nuovoEsito = kEs && V.kVoti !== kEs;
  var zittitoIo = !!(R && zitt.indexOf(V.cb.myId) >= 0), indov = V.priv && V.priv.ruolo === "indovino" && vivo && V.priv.tentativi > 0;
  g.g.forEach(function (q) {
    var c = V.carte[q[0]]; if (!c) return;
    c.classList.toggle("spento", !q[1]); c.classList.toggle("mio-voto", V.mioVoto === q[0]); c.classList.toggle("votato", votati.indexOf(q[0]) >= 0);
    // i tasti sulla scheda: mentre si parla «Sospetto» e «Pulito», quando si vota «Vota» (al secondo tocco «Confermi?»)
    var altro = q[0] !== V.cb.myId, puo = vivo && !!q[1] && g.fase === "riunione";   // (votarsi da soli si può sempre)
    var ak = !puo ? "" : disc > 0 ? (zittitoIo || !altro ? "" : "parla") : V.mioVoto ? (V.mioVoto === q[0] ? "mio" : "") : V.conf === q[0] ? "conf" : "vota";
    if (puo && indov && altro) ak += "|ind";
    if (c.dataset.ak !== ak) { c.dataset.ak = ak; V.tastiCarta(c, q[0], ak); }
    var nm = ((V.cache[q[0]] || {}).nome || "?") + (sindaci.indexOf(q[0]) >= 0 ? " ★" : "") + (q[0] === mioBers ? " ◎" : "");
    var nmE = c.querySelector(".nm"); if (nmE.textContent !== nm) nmE.textContent = nm;
    nmE.style.color = V.letti[q[0]] === "buono" ? "#8ee6a8" : V.letti[q[0]] === "cattivo" ? "#ff7a8a" : "";
    var stt = !q[1] ? "spento" : zitt.indexOf(q[0]) >= 0 ? "zittito" : "";
    var st = c.querySelector(".st"); if (st.textContent !== stt) st.textContent = stt;
    if (votati.indexOf(q[0]) >= 0 && !c.dataset.batti) { c.dataset.batti = "1"; c.classList.remove("lt-batti"); void c.offsetWidth; c.classList.add("lt-batti"); }
    if (!nuovoEsito) return;
    var vt = c.querySelector(".vt"); vt.textContent = "";
    // i voti compaiono uno alla volta
    esito.voti.forEach(function (x) { if (x[1] !== q[0]) return; for (var w = 0; w < (x[2] || 1); w++) { var d = E("i"); d.style.background = (V.cache[x[0]] || {}).colore; d.title = (V.cache[x[0]] || {}).nome || ""; d.style.animationDelay = (0.2 + nVoto * 0.18) + "s"; SUONO.voto(0.2 + nVoto * 0.18); nVoto++; vt.appendChild(d); } });
  });
  if (nuovoEsito) V.kVoti = kEs;
  var aperto = g.fase === "riunione" && disc <= 0;
  var zittito = R && zitt.indexOf(V.cb.myId) >= 0;
  V.riuRap.hidden = V.riuForm.hidden = !vivo || g.fase !== "riunione" || zittito;
  V.riuVoto.hidden = !vivo || g.fase !== "riunione";
  V.btnSalta.disabled = !aperto || !!V.mioVoto;
  var ts = V.mioVoto === "salta" ? "Hai saltato" : V.mioVoto ? "Hai votato" : "Salto il voto", tsp = V.btnSalta.querySelector("span"); if (tsp && tsp.textContent !== ts) tsp.textContent = ts;
  if (esito && V.espK !== esito.titolo + "|" + g.round) {
    V.espK = esito.titolo + "|" + g.round;
    var box = V.velo.querySelector(".lt-riu"), salti = esito.voti.filter(function (x) { return x[1] === "salta"; }).length;
    V.riuNota.textContent = salti ? "Hanno saltato: " + salti + "." : "";
    setTimeout(function () {
      if (V.riuK !== k || !V.vivo) return;
      var es = E("div", "lt-esp"), av = esito.espulso != null ? AVATAR[esito.espulso] : null;
      if (av && av.img) { var im = av.img.cloneNode(); im.className = "vola"; es.appendChild(im); } else es.appendChild(E("div", "lt-masch" + (esito.espulso == null ? " vuota" : "")));
      es.append(E("h2", "", esito.titolo), E("p", "", esito.sotto || ""));
      box.appendChild(es); SUONO.esce();
    }, 2600);
  }
};

// =========================================================
//  STILE (prefisso lt-)
// =========================================================
var cssFatto = false;
function stile() {
  if (cssFatto) return; cssFatto = true;
  var st = document.createElement("style");
  st.textContent = [
    ".schermata.lt-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#0d1020;color:#f1e8d6}",
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
    ".lt-chip{padding:4px 10px;border-radius:999px;font-weight:600;font-size:.72rem;letter-spacing:.07em;text-transform:uppercase;background:rgba(231,183,92,.16);color:#f6d999;border:1px solid rgba(231,183,92,.4)}",
    ".lt-chip[data-squadra=ombre]{background:rgba(208,80,106,.16);color:#f2a7b6;border-color:rgba(208,80,106,.5)}.lt-chip[data-squadra=soli]{background:rgba(169,147,230,.16);color:#d5c9f7;border-color:rgba(169,147,230,.5)}",
    ".lt-barra{width:100%;display:grid;gap:3px;font-size:.66rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b8b1a2}",
    ".lt-barra .tr{height:7px;border-radius:4px;background:rgba(241,232,214,.12);overflow:hidden}.lt-barra i{display:block;height:100%;width:0;background:linear-gradient(90deg,#c9923a,#f6d999);transition:width .3s var(--lt-ease)}",
    ".lt-scena.oriz .lt-velo{padding:8px max(10px,env(safe-area-inset-right)) 8px max(10px,env(safe-area-inset-left))}",
    ".lt-scena.oriz .lt-riu{display:grid;width:min(100%,940px);max-width:none;height:100%;max-height:none;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto auto auto auto;grid-template-areas:'t t' 'g c' 'g r' 'g s' 'g v' 'g n';column-gap:12px;row-gap:6px;padding:10px 12px}",
    ".lt-scena.oriz .lt-riu .testa{grid-area:t}.lt-scena.oriz .lt-riu .grid{grid-area:g;min-height:0;overflow-y:auto;align-content:start;grid-template-columns:repeat(2,minmax(0,1fr))}.lt-scena.oriz .lt-riu .chat{grid-area:c;min-height:0}.lt-scena.oriz .lt-riu .rapide{grid-area:r}.lt-scena.oriz .lt-riu .scrivi{grid-area:s}.lt-scena.oriz .lt-riu .voto{grid-area:v}.lt-scena.oriz .lt-riu .nota{grid-area:n}",
    ".lt-scena.oriz .lt-riu .carta{grid-template-columns:26px minmax(0,1fr) auto;column-gap:6px;padding:3px 6px}.lt-scena.oriz .lt-riu .carta .faccia,.lt-scena.oriz .lt-riu .carta .pall{width:26px;height:26px}",
    ".lt-scena.oriz .lt-riu .carta .az{grid-column:3;grid-row:1/span 2;margin-top:0;align-self:center}.lt-scena.oriz .lt-riu .carta .vt{grid-column:2/-1}",
    ".lt-scena.oriz .lt-riu .carta .az .dubbio span,.lt-scena.oriz .lt-riu .carta .az .fido span{display:none}.lt-scena.oriz .lt-riu .carta .az button{padding:6px 7px;flex:none}.lt-scena.oriz .lt-riu .carta .az .mio{padding:0 4px;font-size:.68rem}",
    ".lt-scena.oriz .lt-minimappa{height:min(78%,420px)}",
    ".lt-scena.sal .lt-barra,.lt-scena.sal .lt-lista-btn,.lt-scena.sal .lt-lista,.lt-scena.sal .lt-ibtn,.lt-scena.sal .lt-info{display:none!important}",
    ".lt-computer .piede{flex-direction:row}.lt-computer .piede button{width:auto;margin:0}",
    ".lt-scena.oriz .lt-computer{max-width:860px;width:100%;display:grid;grid-template-columns:minmax(0,1fr) 210px;grid-template-rows:auto minmax(0,1fr) auto;grid-template-areas:'t t' 'c p' 'c n';column-gap:12px}",
    ".lt-scena.oriz .lt-computer .testa{grid-area:t}.lt-scena.oriz .lt-computer .corpo{grid-area:c}.lt-scena.oriz .lt-computer .piede{grid-area:p;flex-direction:column;justify-content:flex-end;margin-top:0}.lt-scena.oriz .lt-computer .piede button{flex:none}.lt-scena.oriz .lt-computer .nota{grid-area:n;text-align:left}",
    ".lt-saletta{position:absolute;z-index:1;left:0;right:0;margin:0 auto;top:calc(10px + env(safe-area-inset-top));width:max-content;max-width:calc(100% - 180px);display:flex;align-items:center;gap:8px;padding:5px 6px 5px 12px;border-radius:999px;background:rgba(13,16,32,.82);border:1px solid rgba(90,209,154,.45);font-weight:600;font-size:.85rem;color:#c9f2dc}",
    ".lt-saletta .inv{display:inline-flex;align-items:center;gap:5px;font:inherit;font-weight:700;font-size:.8rem;border:0;border-radius:999px;padding:6px 11px;background:linear-gradient(180deg,#5ad19a,#2f9e6c);color:#062314;cursor:pointer}",
    ".lt-computer{max-width:460px;max-height:100%;display:flex;flex-direction:column;padding:12px}.lt-computer .testa{display:flex;align-items:center;gap:8px;margin-bottom:8px}.lt-computer h3{margin:0;flex:1;color:#9fe8c0}.lt-computer .lt-chiudi{position:static}",
    ".lt-computer .corpo{flex:1 1 auto;min-height:0;overflow-y:auto}.lt-computer .piede{display:flex;gap:6px;margin-top:8px}.lt-computer .piede button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:5px;font:inherit;font-weight:700;font-size:.82rem;color:#f1e8d6;background:#242a45;border:1px solid rgba(241,232,214,.16);border-radius:10px;padding:9px 6px;cursor:pointer}",
    ".lt-computer .piede .via{flex:1.3;background:linear-gradient(180deg,#5ad19a,#2f9e6c);color:#062314;border-color:transparent}.lt-computer .piede .via:disabled{opacity:.4}.lt-computer .nota{margin:6px 0 0;font-size:.78rem;color:#b8b1a2;text-align:center}.lt-computer .desc{margin:0 0 8px;color:#ebe3d3}",
    ".lt-foto{max-width:360px;display:flex;flex-direction:column;align-items:center;gap:8px}.lt-foto .testa{display:flex;align-items:center;gap:8px;width:100%}.lt-foto h3{margin:0;flex:1;color:#e9d3ae}.lt-foto .lt-chiudi{position:static}",
    "canvas.foto{display:block;width:min(260px,100%);aspect-ratio:4/3;height:auto;border:6px solid #efe6d2;border-bottom-width:18px;border-radius:2px;box-shadow:0 8px 20px rgba(0,0,0,.5);transform:rotate(-1.5deg);background:#2b2420}",
    ".lt-foto .nota{margin:0;font-size:.8rem;color:#b8b1a2}.lt-foto .rifai{display:inline-flex;align-items:center;gap:6px;font:inherit;font-weight:700;border:0;border-radius:10px;padding:9px 16px;background:#242a45;color:#f1e8d6;border:1px solid rgba(241,232,214,.18);cursor:pointer}.lt-foto .rifai:disabled{opacity:.45}",
    ".lt-riu .chat canvas.foto{width:min(200px,70%);margin:4px 0 6px 6px}.lt-infor.fantasma .sq{background:rgba(160,190,255,.18);color:#c9d8ff}.lt-infor.fantasma h3{color:#c9d8ff}",
    ".lt-ibtn{flex:none;width:26px;height:26px;margin-left:6px;border-radius:50%;border:1.5px solid rgba(246,217,153,.65);background:rgba(25,29,49,.85);color:#f6d999;font:700 italic 14px Georgia,'Times New Roman',serif;line-height:1;cursor:pointer;display:grid;place-items:center}.lt-chip{cursor:pointer}",
    ".lt-infor{max-width:420px;padding:14px 16px}.lt-infor .testa{display:flex;align-items:center;gap:10px;margin-bottom:6px}.lt-infor h3{margin:0;flex:1;font-size:1.25rem;color:#f6d999}.lt-infor .sq{font-size:.7rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 8px;border-radius:999px;background:rgba(231,183,92,.16);color:#f6d999}",
    ".lt-infor.ombre .sq{background:rgba(208,80,106,.2);color:#f6a3b2}.lt-infor.ombre h3{color:#f08aa0}.lt-infor.soli .sq{background:rgba(169,147,230,.2);color:#d6c8ff}.lt-infor.soli h3{color:#cbbcf6}.lt-infor .lt-chiudi{position:static}",
    ".lt-infor .desc{margin:0 0 8px;line-height:1.45;color:#ebe3d3}.lt-infor ul{margin:0;padding-left:18px;display:grid;gap:5px;color:#c9bfb0;font-size:.86rem;line-height:1.4}",
    ".lt-scena svg.ico,.lt-pc svg.ico{width:1.2em;height:1.2em;flex:none;vertical-align:-.22em}",
    ".lt-hbtn{display:inline-flex;align-items:center;gap:5px}.lt-hbtn.ico{padding:5px 8px}.lt-hbtn.acceso{color:#f6d999;border-color:rgba(231,183,92,.65);background:rgba(231,183,92,.16)}",
    ".lt-riu .carta .az button,.lt-riu .rapide button,.lt-riu .voto .salta{display:flex;align-items:center;justify-content:center;gap:5px}",
    ".lt-intro .icona svg{width:64px;height:64px;color:#f6d999;stroke-width:1.6}.lt-pc-schede b svg{width:20px;height:20px}",
    ".lt-minimappa .testa b{display:inline-flex;align-items:center;gap:6px}.lt-minimappa .leg i{display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 4px 0 10px;vertical-align:middle;box-shadow:0 0 0 1px rgba(0,0,0,.4)}",
    ".lt-parla{position:absolute;z-index:5;left:0;right:0;margin:0 auto;top:calc(58px + env(safe-area-inset-top));width:min(440px,calc(100% - 24px));display:flex;gap:6px;padding:6px;border-radius:14px;background:rgba(13,16,32,.9);border:1px solid rgba(241,232,214,.18);box-shadow:0 8px 24px rgba(0,0,0,.45);animation:ltSale .2s var(--lt-ease)}",
    ".lt-parla input{flex:1;min-width:0;font:inherit;font-size:16px;color:#f1e8d6;background:#0d1020;border:1px solid rgba(241,232,214,.18);border-radius:10px;padding:7px 10px}.lt-parla button{flex:none;width:42px;border-radius:10px;border:0;background:linear-gradient(180deg,#e7b75c,#c9923a);color:#1d1508;display:grid;place-items:center;cursor:pointer}",
    ".lt-lista-btn,.lt-hbtn{font:inherit;font-weight:700;font-size:.8rem;color:#f1e8d6;background:rgba(25,29,49,.85);border:1px solid rgba(241,232,214,.2);border-radius:9px;padding:5px 10px;cursor:pointer}",
    ".lt-lista{list-style:none;margin:0;padding:7px 9px;display:grid;gap:3px;background:rgba(13,16,32,.78);border-radius:10px;font-size:.78rem;line-height:1.3}",
    ".lt-lista li.fatto{opacity:.45;text-decoration:line-through}.lt-lista b{color:#f6d999}.lt-lista .nota{color:#b8b1a2;font-style:italic}",
    ".lt-dx{position:absolute;right:calc(10px + env(safe-area-inset-right));top:calc(8px + env(safe-area-inset-top))}",
    ".lt-guida{position:absolute;left:50%;bottom:calc(160px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:calc(100% - 24px);font-weight:600;font-size:.82rem;text-align:center;color:#f6d999;background:rgba(13,16,32,.82);border:1px solid rgba(231,183,92,.45);padding:6px 12px;border-radius:999px;pointer-events:none}",
    ".lt-botola{position:absolute;inset:0;z-index:4;pointer-events:none;background:radial-gradient(circle at 50% 50%,transparent 0 16vmin,rgba(4,6,14,.55) 34vmin,rgba(4,6,14,.85));animation:ltMorteEntra .2s var(--lt-ease) both}",
    ".lt-botola .qui{position:absolute;left:0;right:0;top:calc(14px + env(safe-area-inset-top));text-align:center;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:.8rem;color:rgba(203,162,255,.85)}",
    ".lt-botola button{pointer-events:auto;position:absolute;font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .16s var(--lt-ease)}.lt-botola button:active{transform:translate(-50%,-50%) scale(.92)}",
    ".lt-botola .va{transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 8px;border-radius:14px;background:rgba(36,26,58,.9);border:1px solid rgba(203,162,255,.55);color:#e4d6ff;box-shadow:0 6px 18px rgba(0,0,0,.45)}",
    ".lt-botola .va svg{width:30px;height:30px;transform:rotate(var(--a))}.lt-botola .va span{font-size:.68rem;font-weight:600;white-space:nowrap}",
    ".lt-botola .esci{left:50%;top:50%;transform:translate(-50%,-50%);width:74px;height:74px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#4a3a6e,#241a3a);border:2px solid rgba(203,162,255,.7);color:#f1e8ff;font-weight:700;font-size:.9rem;box-shadow:0 0 0 6px rgba(203,162,255,.12),0 8px 22px rgba(0,0,0,.5)}",
    ".lt-nomestanza{position:absolute;left:0;right:0;top:30%;z-index:2;text-align:center;pointer-events:none;font-weight:700;font-size:clamp(1.6rem,6vmin,2.6rem);letter-spacing:.14em;text-transform:uppercase;color:rgba(246,217,153,.55);text-shadow:0 1px 0 rgba(255,236,190,.35),0 3px 0 rgba(90,60,20,.45),0 10px 24px rgba(0,0,0,.55);opacity:0;perspective:600px}",
    ".lt-nomestanza.su{animation:ltNomeStanza 1.6s var(--lt-ease) both}@keyframes ltNomeStanza{0%{opacity:0;transform:translateY(10px) rotateX(55deg) scale(.92)}18%{opacity:1;transform:none}70%{opacity:.9;transform:none}100%{opacity:0;transform:translateY(-8px) scale(1.03)}}",
    ".lt-guida{transition:opacity .35s var(--lt-ease),transform .35s var(--lt-ease)}.lt-guida.via{opacity:0;transform:translateX(-50%) translateY(6px);pointer-events:none}",
    ".lt-guida.rosso{color:#ffd0d8;background:rgba(120,25,45,.85);border-color:rgba(240,90,110,.7);animation:ltPulsa 1.2s var(--lt-ease) infinite alternate}",
    "@keyframes ltPulsa{from{opacity:.7}to{opacity:1}}",
    ".lt-via{position:absolute;left:50%;bottom:calc(100px + env(safe-area-inset-bottom));transform:translateX(-50%)}.lt-vai{width:auto;min-width:160px;margin:0}",
    ".lt-azioni{position:absolute;right:calc(12px + env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));display:grid;grid-template-columns:repeat(3,62px);grid-template-rows:repeat(2,62px);gap:9px;grid-template-areas:'abil botola buio' 'segnala spegni usa'}",
    ".lt-az{position:relative;width:62px;height:62px;border-radius:50%;border:1.5px solid rgba(241,232,214,.3);background:rgba(25,29,49,.85);color:#f1e8d6;font:inherit;font-weight:600;font-size:.62rem;letter-spacing:.03em;text-transform:uppercase;display:grid;place-items:center;padding:0;touch-action:manipulation;transition:transform .16s var(--lt-ease),opacity .2s var(--lt-ease)}",
    ".lt-az:active:not(:disabled){transform:scale(.9)}.lt-az:disabled{opacity:.3}",
    ".lt-az.oro{border-color:rgba(231,183,92,.75);background:rgba(231,183,92,.22)}.lt-az.rosso{border-color:rgba(208,80,106,.8);background:rgba(208,80,106,.26)}.lt-az.viola{border-color:rgba(169,147,230,.75);background:rgba(169,147,230,.2)}",
    ".lt-az .cd{position:absolute;inset:0;display:grid;place-items:center;font-size:1.15rem;background:rgba(9,11,22,.62);border-radius:50%}",
    ".lt-avviso{position:absolute;left:50%;top:calc(64px + env(safe-area-inset-top));transform:translate(-50%,-6px);max-width:calc(100% - 32px);font-weight:700;font-size:.9rem;text-align:center;background:rgba(25,29,49,.95);border:1px solid rgba(231,183,92,.4);padding:9px 13px;border-radius:12px;opacity:0;pointer-events:none;transition:opacity .22s var(--lt-ease),transform .22s var(--lt-ease);z-index:3}",
    ".lt-avviso.su{opacity:1;transform:translate(-50%,0)}.lt-avviso.ombra,.lt-avviso.morte{border-color:rgba(208,80,106,.7)}",
    ".lt-velo{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;background:rgba(9,11,22,.78);padding:calc(10px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom))}",
    ".lt-pannello{position:relative;width:100%;max-width:480px;max-height:100%;box-sizing:border-box;background:#191d31;border:1px solid rgba(231,183,92,.22);border-radius:16px;padding:16px;animation:ltSale .24s var(--lt-ease)}",
    "@keyframes ltSale{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}",
    ".lt-pannello h2,.lt-pannello h3{margin:0;color:#e7b75c;font-weight:700;letter-spacing:-.02em;line-height:1.15}",
    ".lt-svela{text-align:center}.lt-svela h2{font-size:2.4rem;margin:4px 0 8px}.lt-svela.ombre h2{color:#f08aa0}.lt-svela.soli h2{color:#cbbcf6}.lt-svela p{color:#b8b1a2;margin:0 0 8px;line-height:1.45}.lt-sopra{font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase}.lt-conto{font-weight:600;color:#f1e8d6!important}",
    ".lt-vince{text-align:center}.lt-vince h2{font-size:2rem}.lt-vince p{color:#b8b1a2}",
    ".lt-compito{text-align:center}.lt-compito h3{font-size:1.3rem;padding-right:34px}",
    ".lt-chiudi{position:absolute;top:10px;right:10px;width:34px;height:34px;border-radius:50%;background:#242a45;border:1px solid rgba(241,232,214,.2);color:#f1e8d6;font-size:1.1rem;cursor:pointer}",
    ".lt-istr{color:#b8b1a2;margin:6px 0 14px;font-size:.92rem}.lt-ok{font-weight:600;color:#7fb68f;margin:10px 0 0}",
    ".lt-mg{display:grid;justify-items:center;gap:12px}",
    ".lt-tieni{width:140px;height:140px;border-radius:50%;border:0;background:#0d1020;position:relative;display:grid;place-items:center;color:#f1e8d6;font:inherit;font-weight:600;text-transform:uppercase;touch-action:none;transition:transform .16s var(--lt-ease)}",
    ".lt-tieni.giu{transform:scale(.95)}.lt-tieni svg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}.lt-tieni .tr{fill:none;stroke:rgba(241,232,214,.12);stroke-width:9}.lt-tieni .rp{fill:none;stroke:#e7b75c;stroke-width:9;stroke-linecap:round}",
    ".lt-seq{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.lt-seq button{width:52px;height:70px;border-radius:8px;border:1px solid rgba(241,232,214,.2);background:linear-gradient(180deg,#5b3d2a,#3f2a1d);color:#f1e8d6;font:inherit;font-weight:600;font-size:1.3rem;transition:transform .16s var(--lt-ease)}",
    ".lt-seq button.ok{background:linear-gradient(180deg,#e7b75c,#b9862f);color:#1d1508}",
    ".lt-leva{position:relative;width:100%;max-width:320px;height:44px;border-radius:10px;background:#0d1020;overflow:hidden}.lt-leva .zona{position:absolute;top:0;bottom:0;background:rgba(231,183,92,.32);border-left:2px solid #e7b75c;border-right:2px solid #e7b75c}.lt-leva .ago{position:absolute;top:4px;bottom:4px;width:6px;margin-left:-3px;border-radius:3px;background:#f1e8d6}",
    ".lt-btn{font:inherit;font-weight:600;color:#1d1508;background:#e7b75c;border:0;border-radius:12px;padding:12px 26px;touch-action:none;transition:transform .16s var(--lt-ease)}.lt-btn.giu,.lt-btn:active{transform:scale(.96)}",
    ".lt-tr{position:relative;width:100%;max-width:320px;height:200px;border-radius:12px;background:#0d1020}.lt-tr .meta{position:absolute;right:8px;top:8px;bottom:8px;width:44%;border:2px dashed rgba(231,183,92,.6);border-radius:10px;display:flex;flex-wrap:wrap;align-content:flex-start;gap:4px;padding:6px;box-sizing:border-box}.lt-tr .meta span{width:100%;font-size:.7rem;color:#b8b1a2;text-transform:uppercase;font-weight:600}",
    ".lt-tr .cosa{position:absolute;font-size:2.2rem;line-height:1;touch-action:none;cursor:grab}.lt-tr .cosa.su{z-index:2;transform-origin:center}.lt-tr .meta .cosa{position:static;font-size:1.8rem}",
    ".lt-vaso{position:relative;width:110px;height:170px;border:3px solid rgba(241,232,214,.5);border-top:0;border-radius:0 0 18px 18px;overflow:hidden;background:rgba(13,16,32,.6)}.lt-vaso .liv{position:absolute;left:0;right:0;bottom:0;height:0}.lt-vaso .fascia{position:absolute;left:0;right:0;background:rgba(231,183,92,.35);border-top:2px solid #e7b75c;border-bottom:2px solid #e7b75c;z-index:1}",
    ".lt-quadri{display:grid;grid-template-columns:repeat(2,84px);gap:10px}.lt-quadri .q{width:84px;height:84px;border-radius:8px;border:5px solid #8a6538;background:#2b2f45;color:#f1e8d6;font-size:2.4rem;font-weight:700;display:grid;place-items:center}.lt-quadri .q span{transition:transform .2s var(--lt-ease)}.lt-quadri .q.ok{border-color:#e7b75c}",
    ".lt-scuoti{animation:ltScuoti .3s var(--lt-ease)}@keyframes ltScuoti{0%,100%{translate:0}25%{translate:-8px}50%{translate:7px}75%{translate:-4px}}",
    ".lt-scena.lt-ruota{transform-origin:0 0}",
    ".lt-scena,.lt-scena *,.lt-pc,.lt-pc *{touch-action:manipulation}.lt-scena .lt-joyzona,.lt-scena canvas{touch-action:none}",
    ".lt-morte{position:absolute;inset:0;z-index:8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;text-align:center;background:radial-gradient(ellipse at center,rgba(70,10,22,.92),rgba(5,4,10,.97) 70%);animation:ltMorteEntra .25s var(--lt-ease) both}",
    ".lt-morte.via{animation:ltMorteVia .3s var(--lt-ease) both}@keyframes ltMorteEntra{from{opacity:0}to{opacity:1}}@keyframes ltMorteVia{to{opacity:0}}",
    ".lt-morte .palco{display:flex;align-items:flex-end;justify-content:center;gap:4%;width:100%;height:46%}",
    ".lt-morte .killer,.lt-morte .vittima{height:100%;width:auto;max-width:34%;object-fit:contain}.lt-morte .sagoma{width:18%;max-width:120px;height:auto;aspect-ratio:1/2;border-radius:50% 50% 14% 14%/34% 34% 10% 10%;background:linear-gradient(#2a3150,#141a30)}",
    ".lt-morte .killer{filter:drop-shadow(0 0 18px rgba(240,90,110,.75));animation:ltKiller .45s var(--lt-ease) .1s both}@keyframes ltKiller{from{opacity:0;transform:translateX(-40%) scale(.9)}to{opacity:1;transform:none}}",
    ".lt-morte .vittima{transform-origin:50% 100%;animation:ltCade .7s cubic-bezier(.5,0,.75,0) 1.2s both}@keyframes ltCade{to{transform:rotate(84deg) translateY(10%);filter:grayscale(1) brightness(.55)}}",
    ".lt-morte .lanterna{position:relative;width:13%;max-width:70px;aspect-ratio:3/4;margin-bottom:6%;border-radius:30% 30% 22% 22%;background:linear-gradient(#3a2d3d,#1c1722);box-shadow:inset 0 0 0 3px #e7b75c}",
    ".lt-morte .fiamma{position:absolute;left:50%;top:22%;width:44%;height:52%;margin-left:-22%;border-radius:50% 50% 45% 45%;background:radial-gradient(ellipse at 50% 70%,#fff3c4,#ffb347 45%,#ff6a2a 80%);box-shadow:0 0 26px 10px rgba(255,170,70,.55);animation:ltSpegne .5s ease-in .8s both}@keyframes ltSpegne{to{transform:scale(.05);opacity:0;box-shadow:none}}",
    ".lt-morte .fumo{position:absolute;left:44%;top:10%;width:14%;height:14%;border-radius:50%;background:rgba(200,200,215,.5);opacity:0;animation:ltFumo 1.4s ease-out 1.1s both}.lt-morte .fumo.f2{left:52%;animation-delay:1.3s}@keyframes ltFumo{0%{opacity:.7;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-260%) scale(2.6)}}",
    ".lt-morte h2{margin:10px 0 0;font-size:1.45rem;font-weight:700;letter-spacing:-.02em;color:#ff9aa9;animation:ltKiller .4s var(--lt-ease) .5s both}.lt-morte p{margin:0;color:#c9bfb0;font-size:.9rem;animation:ltKiller .4s var(--lt-ease) .9s both}",
    ".lt-minimappa{position:absolute;z-index:3;left:0;right:0;margin:0 auto;top:calc(8px + env(safe-area-inset-top));width:min(560px,calc(100% - 24px));height:min(58%,420px);display:flex;flex-direction:column;padding:6px 8px 6px;border-radius:14px;background:rgba(13,16,32,.86);border:1px solid rgba(231,183,92,.3);box-shadow:0 10px 30px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);animation:ltSale .22s var(--lt-ease)}",
    ".lt-minimappa .testa{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:.82rem;color:#f6d999}.lt-minimappa .lt-chiudi{position:static;width:34px;height:34px;flex:none;font-size:1.3rem}",
    ".lt-minimappa canvas{display:block;margin:2px auto 0;border-radius:8px;max-width:100%;flex:1 1 auto;min-height:0;object-fit:contain}.lt-minimappa .leg{margin:4px 0 0;font-size:.7rem;color:#b8b1a2;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".lt-mappa{max-width:960px;text-align:center;padding:10px}.lt-mappa canvas{display:block;margin:0 auto;border-radius:10px;max-width:100%}.lt-mappa p{margin:8px 0 0;font-size:.78rem;color:#b8b1a2}",
    ".lt-riu{display:flex;flex-direction:column;gap:8px;height:100%;max-height:640px;padding:12px}",
    ".lt-riu .testa{display:flex;justify-content:space-between;align-items:center;gap:10px}.lt-riu h3{font-size:1rem}",
    ".lt-riu .timer{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:600;border:2px solid rgba(231,183,92,.55);color:#f6d999;font-variant-numeric:tabular-nums}",
    ".lt-riu .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}",
    ".lt-riu .carta{display:grid;grid-template-columns:28px minmax(0,1fr);grid-template-rows:auto auto;column-gap:7px;align-items:center;text-align:left;padding:4px 7px;border-radius:9px;background:#0d1020;border:1.5px solid rgba(241,232,214,.12);color:#f1e8d6;font:inherit;font-weight:700;font-size:.82rem;transition:border-color .2s var(--lt-ease),opacity .2s var(--lt-ease)}",
    ".lt-riu .carta .faccia,.lt-riu .carta .pall{grid-row:span 2;width:28px;height:28px;border-radius:50%;object-fit:cover;object-position:top;background:#242a45}",
    ".lt-riu .carta .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lt-riu .carta .st{font-size:.66rem;font-weight:600;color:#b8b1a2;min-height:.8rem}",
    ".lt-riu .carta .vt{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:3px}.lt-riu .carta .vt i{width:9px;height:9px;border-radius:50%;display:block}",
    ".lt-riu .carta.mio-voto{border-color:#e7b75c;background:rgba(231,183,92,.14)}.lt-riu .carta.spento{opacity:.38}.lt-riu .carta{position:relative}",
    ".lt-riu .carta.votato::after{content:'✓';position:absolute;left:24px;top:1px;width:14px;height:14px;border-radius:50%;background:#5ad19a;color:#062314;font-size:10px;font-weight:800;display:grid;place-items:center;box-shadow:0 0 0 2px #0d1020}",
    ".lt-riu .carta .az{grid-column:1/-1;display:flex;gap:4px;margin-top:4px}.lt-riu .carta .az:empty{display:none}",
    ".lt-riu .carta .az button{flex:1;min-width:0;font:inherit;font-size:.72rem;font-weight:700;color:#f1e8d6;background:#242a45;border:1px solid rgba(241,232,214,.16);border-radius:8px;padding:6px 2px;white-space:nowrap;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .16s var(--lt-ease),background-color .2s var(--lt-ease),box-shadow .2s var(--lt-ease)}",
    ".lt-riu .carta .az button:active{transform:scale(.94)}.lt-riu .carta .az button.fatto{animation:ltLampo .6s var(--lt-ease)}@keyframes ltLampo{0%{background:rgba(90,209,154,.45)}100%{background:#242a45}}",
    ".lt-riu .carta .az .vota{background:linear-gradient(180deg,#e7b75c,#c9923a);color:#1d1508;border-color:transparent;font-size:.8rem;padding:7px 2px}",
    ".lt-riu .carta .az .conf{background:#5ad19a;color:#062314;border-color:transparent;font-size:.8rem;padding:7px 2px;animation:ltConferma .9s var(--lt-ease) infinite}@keyframes ltConferma{50%{box-shadow:0 0 0 4px rgba(90,209,154,.25)}}",
    ".lt-riu .carta .az .ind{flex:0 0 34px}.lt-riu .carta .az .mio{flex:1;text-align:center;font-size:.74rem;font-weight:700;color:#f6d999;padding:5px 0}",
    ".lt-riu .voto .salta{font-size:.95rem}",
    ".lt-riu .chat{flex:1 1 auto;min-height:70px;overflow-y:auto;background:#0d1020;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:5px;font-size:.84rem;line-height:1.35;user-select:text;-webkit-user-select:text}",
    ".lt-riu .chat p{margin:0}.lt-riu .chat .sis{color:#b8b1a2;font-style:italic}",
    ".lt-riu .rapide{display:flex;gap:5px;flex-wrap:wrap}.lt-riu .rapide button{flex:1;font:inherit;font-weight:700;font-size:.76rem;color:#f1e8d6;background:#242a45;border:1px solid rgba(241,232,214,.16);border-radius:999px;padding:6px 8px}",
    ".lt-riu .scrivi{display:flex;gap:5px}.lt-riu .scrivi input{flex:1;min-width:0;font:inherit;font-size:16px;color:#f1e8d6;background:#0d1020;border:1px solid rgba(241,232,214,.18);border-radius:9px;padding:6px 9px}.lt-riu .scrivi button{font:inherit;font-weight:700;color:#f1e8d6;background:#242a45;border:1px solid rgba(241,232,214,.18);border-radius:9px;padding:0 12px}",
    ".lt-riu .voto{display:flex;gap:6px}.lt-riu .voto .btn{flex:1;margin:0;padding:10px}",
    ".lt-riu .nota{margin:0;font-size:.78rem;color:#b8b1a2;text-align:center;min-height:1em}",
    ".lt-esp{position:absolute;inset:0;border-radius:16px;background:rgba(13,16,32,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:20px;animation:ltSale .3s var(--lt-ease)}",
    ".lt-esp img{height:150px}.lt-esp h2{font-size:1.5rem;color:#f1e8d6}.lt-esp p{color:#b8b1a2;margin:0}",
    ".lt-masch{width:110px;height:72px;border-radius:55px 55px 40px 40px/46px 46px 26px 26px;background:#f1e8d6;box-shadow:0 0 0 6px #888}.lt-masch.vuota{background:transparent;box-shadow:0 0 0 2px rgba(241,232,214,.25)}",
    ".vola{animation:ltVola 2.6s var(--lt-ease) both}@keyframes ltVola{from{transform:translateY(20px) rotate(-8deg);opacity:0}30%{opacity:1}to{transform:translateY(-20px) rotate(8deg);opacity:.9}}",
    ".lt-bot{display:flex;gap:8px;flex-wrap:wrap}.lt-bot .btn{flex:1;margin:0;white-space:nowrap;font-size:.95rem}",
    ".lt-perche{text-align:center;margin:0 0 10px;opacity:.8;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"SF Pro Display\",\"Helvetica Neue\",\"Inter\",system-ui,sans-serif}.lt-ruolo{font-size:.8rem}",
    ".schermata.lt-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
    ".lt-dx{display:flex;gap:6px}",
    ".lt-info{font-size:.74rem;font-weight:700;color:#f6d999;background:rgba(13,16,32,.78);border-radius:8px;padding:4px 8px;line-height:1.3}",
    ".lt-cam{display:flex;flex-direction:column;gap:8px;max-width:640px}.lt-cam .testa{display:flex;justify-content:space-between;align-items:center}.lt-cam .lt-chiudi{position:static}",
    ".lt-cam .griglia{display:grid;grid-template-columns:1fr 1fr;gap:6px}.lt-cam .schermo{position:relative;aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#000;border:2px solid #2f3b44}.lt-cam .schermo canvas{width:100%;height:100%;display:block}",
    ".lt-cam .nav{display:flex;justify-content:center;align-items:center;gap:14px;font-weight:600}.lt-cam .nav button{font:inherit;font-size:1.2rem;font-weight:700;color:#f1e8d6;background:#242a45;border:1px solid rgba(241,232,214,.2);border-radius:10px;width:44px;height:36px}",
    ".lt-plastico h3{margin-bottom:6px}",
    ".lt-scambio{display:flex;flex-direction:column;gap:8px}.lt-scambio p{margin:0;color:#b8b1a2;font-size:.85rem}.lt-scambio .griglia{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}",
    ".lt-scambio .griglia button{font:inherit;font-weight:700;font-size:.85rem;color:#f1e8d6;background:#242a45;border:1.5px solid rgba(241,232,214,.18);border-radius:10px;padding:10px 4px}.lt-scambio .griglia button.sel{border-color:#a0e6ff;background:rgba(120,220,255,.15)}",
    ".lt-scambio .piede{display:flex;gap:8px}.lt-scambio .piede .btn{flex:1;margin:0}",
    ".lt-mod{color:#cbbcf6!important;font-weight:700}",
    ".lt-fermo{position:absolute;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;pointer-events:none;font-size:3.2rem;font-weight:700;letter-spacing:.08em;color:#ffd0d8;text-shadow:0 0 24px rgba(208,80,106,.8);background:radial-gradient(circle,rgba(90,20,35,.15),rgba(90,20,35,.55));animation:ltPulsa .8s var(--lt-ease) infinite alternate}",
    ".lt-fermo small{font-size:.9rem;letter-spacing:0;font-weight:700}",
    ".lt-registro{list-style:none;margin:0;padding:5px 8px;background:rgba(13,16,32,.78);border-radius:8px;font-size:.72rem;line-height:1.35;display:grid;gap:1px}.lt-registro .entra{color:#8ee6a8}.lt-registro .esce{color:#ffb3a1}",
    ".lt-scambio .griglia.sab{grid-template-columns:1fr}.lt-scambio .griglia.sab button{display:grid;gap:3px;text-align:left;padding:10px 12px}.lt-scambio .griglia.sab small{font-weight:500;color:#b8b1a2;font-size:.76rem}",
    ".lt-info.urgente{color:#ffd0d8;background:rgba(120,25,45,.85);animation:ltPulsa .5s var(--lt-ease) infinite alternate}",
    ".lt-indov{position:absolute;inset:0;border-radius:16px;background:rgba(13,16,32,.97);padding:14px;display:flex;flex-direction:column;gap:8px;z-index:2;animation:ltSale .22s var(--lt-ease)}",
    ".lt-indov h3{font-size:1.05rem}.lt-indov p{margin:0;font-size:.8rem;color:#b8b1a2}",
    ".lt-indov .griglia{flex:1 1 auto;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(3,1fr);gap:5px;align-content:start}",
    ".lt-indov .griglia button{font:inherit;font-weight:700;font-size:.74rem;color:#f1e8d6;background:#242a45;border:1px solid rgba(231,183,92,.35);border-radius:9px;padding:9px 4px}",
    ".lt-indov .griglia button.ombre{border-color:rgba(208,80,106,.6)}.lt-indov .griglia button.soli{border-color:rgba(169,147,230,.6)}",
    ".lt-indov .annulla{font:inherit;font-weight:700;color:#f1e8d6;background:transparent;border:1px solid rgba(241,232,214,.3);border-radius:10px;padding:9px}",
    ".lt-intro{position:absolute;inset:0;z-index:4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;pointer-events:none;background:radial-gradient(circle,rgba(13,16,32,.55),rgba(9,11,22,.92));animation:ltIntro 2s var(--lt-ease) both}",
    ".lt-intro.corpo{background:radial-gradient(circle,rgba(90,20,35,.6),rgba(9,11,22,.94))}",
    ".lt-intro .icona{font-size:4rem;animation:ltDondola .5s ease-in-out 3 alternate}.lt-intro h2{margin:0;font-size:2.4rem;font-weight:700;letter-spacing:.02em;color:#f6d999;text-transform:uppercase;animation:ltColpo .5s var(--lt-ease) both}",
    ".lt-intro.corpo h2{color:#ffb3c1}.lt-intro p{margin:0;font-weight:700;color:#f1e8d6}",
    ".lt-intro .facce{display:flex;gap:14px}.lt-intro .facce img,.lt-intro .facce .pall{width:64px;height:64px;border-radius:50%;object-fit:cover;object-position:top;background:#242a45;border:3px solid #e7b75c}.lt-intro .facce .morto{filter:grayscale(1) brightness(.6);border-color:#888}",
    "@keyframes ltIntro{0%{opacity:0}12%{opacity:1}82%{opacity:1}100%{opacity:0}}",
    "@keyframes ltDondola{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}",
    "@keyframes ltColpo{from{transform:scale(2.2);opacity:0}to{transform:scale(1);opacity:1}}",
    ".lt-svela{animation:ltGira .7s var(--lt-ease) both;transform-style:preserve-3d}.lt-svela.ombre{box-shadow:0 0 60px rgba(208,80,106,.35);border-color:rgba(208,80,106,.5)}.lt-svela.soli{box-shadow:0 0 60px rgba(169,147,230,.35);border-color:rgba(169,147,230,.5)}.lt-svela.ospiti{box-shadow:0 0 60px rgba(231,183,92,.3)}",
    "@keyframes ltGira{from{transform:perspective(700px) rotateY(90deg) scale(.9);opacity:0}to{transform:perspective(700px) rotateY(0) scale(1);opacity:1}}",
    ".lt-svela-av{width:84px;height:84px;border-radius:50%;object-fit:cover;object-position:top;background:#242a45;border:3px solid currentColor;color:#e7b75c;margin:0 auto 6px;display:block}.lt-svela.ombre .lt-svela-av{color:#f08aa0}",
    ".lt-alleati{display:flex;justify-content:center;gap:8px;margin-top:6px}.lt-alleati img{width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:top;background:#242a45;border:2px solid #f08aa0}",
    ".lt-riu .carta .vt i{animation:ltPop .35s var(--lt-ease) both}@keyframes ltPop{from{transform:scale(0);opacity:0}60%{transform:scale(1.5)}to{transform:scale(1);opacity:1}}",
    ".lt-batti{animation:ltBatti .4s var(--lt-ease)}@keyframes ltBatti{50%{transform:scale(1.05);border-color:#e7b75c}}",
    ".lt-vince.vinto{box-shadow:0 0 70px rgba(231,183,92,.45)}.lt-vince.perso{box-shadow:0 0 70px rgba(208,80,106,.35)}.lt-vince h2{animation:ltColpo .6s var(--lt-ease) both}",
    "@media (max-height:700px){.lt-riu{gap:5px;padding:9px}.lt-riu .grid{grid-template-columns:repeat(3,1fr);gap:4px}.lt-riu .carta{grid-template-columns:22px minmax(0,1fr);font-size:.72rem;padding:3px 5px;column-gap:5px}.lt-riu .carta .faccia,.lt-riu .carta .pall{width:22px;height:22px}.lt-riu .carta .st{font-size:.58rem}.lt-riu .chat{min-height:56px;font-size:.8rem}.lt-riu .voto .btn{padding:8px}.lt-riu .timer{width:38px;height:38px}}",
    // il «computer» delle regole (⚙️): schermo scuro del palazzo, schede, righe ‹ ›, griglia dei ruoli
    ".lt-pc{--pc-e:cubic-bezier(.22,1,.36,1);position:relative;border-radius:16px;overflow:hidden;color:#f1e8d6;font-family:-apple-system,BlinkMacSystemFont,\"SF Pro Text\",\"Helvetica Neue\",\"Inter\",system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:linear-gradient(180deg,#151b33,#0b0f1e);border:1px solid rgba(231,183,92,.3);box-shadow:0 12px 32px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)}",
    ".lt-pc::after{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 3px)}",
    ".lt-pc button{font:inherit;border:0;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .16s var(--pc-e),background-color .2s var(--pc-e),color .2s var(--pc-e),opacity .2s var(--pc-e)}.lt-pc button:active{transform:scale(.95)}",
    ".lt-pc-barra{display:flex;align-items:center;gap:6px;padding:6px 8px 6px 12px;background:rgba(231,183,92,.08);border-bottom:1px solid rgba(231,183,92,.16);font:600 11px ui-monospace,\"SF Mono\",Menlo,monospace;letter-spacing:.12em;color:#f6d999}",
    ".lt-pc-barra i{width:8px;height:8px;border-radius:50%;background:#f05a6e;opacity:.8}.lt-pc-barra i:nth-child(2){background:#e7b75c}.lt-pc-barra i:nth-child(3){background:#5ad19a}.lt-pc-barra span{margin-left:6px}",
    ".lt-pc-preset{display:flex;gap:4px;margin-left:auto;letter-spacing:0}",
    ".lt-pc-preset button{height:28px;padding:0 10px;border-radius:8px;background:rgba(241,232,214,.07);color:#d9d1c1;font:600 12px -apple-system,BlinkMacSystemFont,\"SF Pro Text\",system-ui,sans-serif}.lt-pc-preset button.attiva{background:rgba(231,183,92,.2);color:#f6d999;box-shadow:inset 0 0 0 1px rgba(231,183,92,.5)}",
    ".lt-pc-schede{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;padding:6px 10px}",
    ".lt-pc-schede button{display:flex;flex-direction:column;align-items:center;gap:0;padding:4px 0;border-radius:10px;background:transparent;color:#a9a294}.lt-pc-schede b{font-size:17px;line-height:1.1}.lt-pc-schede span{font-size:10.5px;font-weight:600}",
    ".lt-pc-schede button.attiva{background:rgba(231,183,92,.15);color:#f6d999;box-shadow:inset 0 0 0 1px rgba(231,183,92,.45)}",
    ".lt-pc-corpo{padding:0 10px 6px;min-height:236px}",
    ".lt-pc-pag{animation:ltPcEntra .22s var(--pc-e) both}@keyframes ltPcEntra{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}",
    ".lt-pc-riga{display:flex;align-items:center;gap:8px;min-height:37px;border-bottom:1px solid rgba(241,232,214,.06)}.lt-pc-riga:last-child{border-bottom:0}",
    ".lt-pc-riga .et{flex:1;min-width:0;font-size:14px;font-weight:600;color:#ebe3d3;line-height:1.2}",
    ".lt-pc-riga .ctr{display:flex;align-items:center;gap:3px;flex:none}",
    ".lt-pc-riga .fr{width:30px;height:30px;border-radius:8px;background:rgba(241,232,214,.07);color:#f6d999;font-size:18px;font-weight:700;line-height:1}.lt-pc-riga .fr:disabled{opacity:.22;cursor:default}",
    ".lt-pc-riga .val{min-width:96px;height:30px;padding:0 8px;border-radius:8px;background:rgba(231,183,92,.12);color:#f6d999;font:600 12.5px ui-monospace,\"SF Mono\",Menlo,monospace;white-space:nowrap}",
    ".lt-pc .pop{animation:ltPcPop .2s var(--pc-e)}@keyframes ltPcPop{from{transform:scale(.88)}to{transform:none}}",
    ".lt-pc-sq{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6px}",
    ".lt-pc-sq button{height:30px;border-radius:8px;background:rgba(241,232,214,.05);color:#a9a294;font-size:12px;font-weight:600}",
    ".lt-pc-sq button.attiva{color:#f6d999;background:rgba(231,183,92,.16);box-shadow:inset 0 0 0 1px rgba(231,183,92,.45)}.lt-pc-sq button.ombre.attiva{color:#f6a3b2;background:rgba(208,80,106,.18);box-shadow:inset 0 0 0 1px rgba(208,80,106,.5)}.lt-pc-sq button.soli.attiva{color:#d6c8ff;background:rgba(169,147,230,.18);box-shadow:inset 0 0 0 1px rgba(169,147,230,.5)}",
    ".lt-pc-ruoli{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}@media (max-width:370px){.lt-pc-ruoli{grid-template-columns:repeat(3,1fr)}}",
    ".lt-pc-r{position:relative;height:37px;padding:3px 6px;border-radius:9px;overflow:hidden;text-align:left;background:rgba(241,232,214,.06);color:#f1e8d6;box-shadow:inset 0 0 0 1px rgba(241,232,214,.07)}",
    ".lt-pc-r b{display:block;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lt-pc-r span{display:inline-block;font:600 11px ui-monospace,\"SF Mono\",Menlo,monospace;color:#f6d999}",
    ".lt-pc-r i{position:absolute;left:0;bottom:0;height:3px;background:linear-gradient(90deg,#c9923a,#f6d999);transition:width .25s var(--pc-e)}.lt-pc-ruoli.ombre .lt-pc-r i{background:linear-gradient(90deg,#a8344c,#f08aa0)}.lt-pc-ruoli.soli .lt-pc-r i{background:linear-gradient(90deg,#7d68c4,#cbbcf6)}",
    ".lt-pc-r.zero{opacity:.5}.lt-pc-r.zero span{color:#8c8577}",
    ".lt-pc-tutti{display:flex;align-items:center;gap:5px;margin-top:6px;font-size:12px;color:#a9a294}.lt-pc-tutti span{margin-right:2px}.lt-pc-tutti button{flex:1;height:28px;border-radius:8px;background:rgba(241,232,214,.06);color:#d9d1c1;font:600 11.5px ui-monospace,\"SF Mono\",Menlo,monospace}",
    ".lt-pc-pick{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6px}",
    ".lt-pc-pick button{height:28px;padding:0 3px;border-radius:8px;background:rgba(241,232,214,.05);color:#b8b1a2;font-size:11px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lt-pc-pick button.attiva{color:#f6d999;background:rgba(231,183,92,.16);box-shadow:inset 0 0 0 1px rgba(231,183,92,.45)}",
    ".lt-pc-regole{border-top:1px solid rgba(231,183,92,.16);padding-top:2px}.lt-pc-nota{margin:4px 0 0;font-size:12px;line-height:1.35;color:#a9a294;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}",
    ".lt-pc-stato{padding:7px 12px 8px;border-top:1px solid rgba(231,183,92,.14);font:500 11px/1.35 ui-monospace,\"SF Mono\",Menlo,monospace;color:#9fd8b0;background:rgba(0,0,0,.18)}.lt-pc-stato::after{content:'▍';margin-left:2px;animation:ltPcCursore 1s steps(1) infinite}@keyframes ltPcCursore{50%{opacity:0}}",
    "@media (max-height:700px){.lt-pc-riga{min-height:36px}.lt-pc-corpo{min-height:220px}.lt-pc-schede button{padding:4px 0}.lt-pc-r{height:36px}}",
    "@media (prefers-reduced-motion:reduce){.lt-pc *,.lt-pc *::after,.lt-pc::after{animation:none!important;transition:none!important}}",
    "@media (prefers-reduced-motion:reduce){.lt-scena *,.lt-scena *::before{animation-duration:.01ms!important;transition-duration:.01ms!important}}"
  ].join("");
  document.head.appendChild(st);
}

// =========================================================
//  LE REGOLE DELL'HOST (bottoni .modo-chip, come gli altri giochi)
// =========================================================
// ⚙️ Le regole della partita: il «computer» del palazzo, a schede. Ogni scheda sta in uno schermo: righe corte con ‹ ›,
// i ruoli in una griglia (un tocco cambia la probabilità), i poteri ruolo per ruolo. Si ritrova la scheda di prima riaprendo.
var SCHEDE = [["partita", "partita", "Partita"], ["riunioni", "campana", "Riunioni"], ["ruoli", "maschera", "Ruoli"], ["poteri", "potere", "Poteri"], ["sabotaggi", "sabota", "Sabotaggi"]];
var SQUADRE = [["ospiti", "Ospiti"], ["ombre", "Ombre"], ["soli", "Da soli"], ["mod", "Modificatori"]];
var PC = { scheda: "partita", squadra: "ospiti", gruppo: null };
function impostazioni(box, dove, aiuti) {
  stile();
  var cur = pulisci(dove); Object.keys(cur).forEach(function (k) { dove[k] = cur[k]; });
  var perG = {}; VOCI.forEach(function (v) { (perG[v.g] = perG[v.g] || []).push(v); });
  var POTERI = Object.keys(perG).filter(function (g) { return ["Partita", "Riunioni", "Probabilità dei ruoli", "Sabotaggi", "Modificatori"].indexOf(g) < 0; });
  if (POTERI.indexOf(PC.gruppo) < 0) PC.gruppo = POTERI[0];
  function idx(v) { var x = leggi(dove, v.k); for (var i = 0; i < v.opz.length; i++) if (valoreOpz(v.opz[i]) === x) return i; return 0; }
  function pop(n) { n.classList.remove("pop"); void n.offsetWidth; n.classList.add("pop"); }
  box.textContent = "";
  var pc = E("div", "lt-pc"); box.appendChild(pc);
  pc.setAttribute("data-regola", "");   // (così l'app sa che Lanterne ha delle regole: in saletta c'è «⚙️ Regole»)
  var barra = E("div", "lt-pc-barra"), preset = E("div", "lt-pc-preset");
  barra.append(E("i"), E("i"), E("i"), E("span", "", "REGOLE"), preset);   // in alto le partenze veloci, come i tasti di una finestra
  var schede = E("div", "lt-pc-schede"), corpo = E("div", "lt-pc-corpo"), stato = E("div", "lt-pc-stato");
  pc.append(barra, schede, corpo, stato);
  function aggStato() {
    stato.textContent = "> " + riassunto(pulisci(dove));
    [].forEach.call(preset.children, function (b) { b.classList.toggle("attiva", JSON.stringify(conPreset(b.dataset.p)) === JSON.stringify(pulisci(dove))); });
  }
  [["classica", "Classica"], ["tanti", "Tanti"], ["caos", "Caos"]].forEach(function (p) {
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
    var r = E("div", "lt-pc-riga"), c = E("div", "ctr"), meno = E("button", "fr", "‹"), val = E("button", "val"), piu = E("button", "fr", "›");
    meno.type = val.type = piu.type = "button"; meno.setAttribute("aria-label", "meno"); piu.setAttribute("aria-label", "più");
    function mostra() { var i = idx(v); val.textContent = scrittaOpz(v.opz[i], v.u); meno.disabled = i === 0; piu.disabled = i === v.opz.length - 1; }
    function vai(d, giro) { var i = idx(v) + d; if (giro) i = (i + v.opz.length) % v.opz.length; if (i < 0 || i >= v.opz.length) return; scrivi(dove, v.k, valoreOpz(v.opz[i])); mostra(); pop(val); aggStato(); }
    meno.addEventListener("click", function () { vai(-1); }); piu.addEventListener("click", function () { vai(1); }); val.addEventListener("click", function () { vai(1, true); });
    c.append(meno, val, piu); r.append(E("span", "et", et || v.et.replace(/ \(.*\)$/, "")), c); mostra();
    return r;
  }
  // un ruolo nella griglia: tocco = probabilità dopo (0 → 25 → 50 → 75 → 100 → 0); la barretta sotto dice quanto
  function cella(v, nome) {
    var b = E("button", "lt-pc-r"), n = E("b", "", nome), q = E("span"), bar = E("i"); b.type = "button"; b.append(n, q, bar);
    function mostra() { var x = leggi(dove, v.k), mx = valoreOpz(v.opz[v.opz.length - 1]) || 100; q.textContent = scrittaOpz(v.opz[idx(v)], v.u); bar.style.width = Math.round(100 * x / mx) + "%"; b.classList.toggle("zero", !x); }
    b.addEventListener("click", function () { var i = (idx(v) + 1) % v.opz.length; scrivi(dove, v.k, valoreOpz(v.opz[i])); mostra(); pop(q); aggStato(); });
    mostra(); return b;
  }
  function disegna() {
    corpo.textContent = "";
    var dentro = E("div", "lt-pc-pag"); corpo.appendChild(dentro);
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
      // tutti insieme: spenti, al minimo, a metà, sempre
      var tutti = E("div", "lt-pc-tutti"); tutti.appendChild(E("span", "", "Tutti:"));
      [0, 1, 2, -1].forEach(function (j) {
        var o = voci.length ? voci[0][0].opz : [], val = o.length ? valoreOpz(o[j < 0 ? o.length - 1 : Math.min(j, o.length - 1)]) : 0;
        var b = E("button", "", o.length ? scrittaOpz(o[j < 0 ? o.length - 1 : Math.min(j, o.length - 1)], voci[0][0].u) : ""); b.type = "button";
        b.addEventListener("click", function () { voci.forEach(function (x) { scrivi(dove, x[0].k, val); }); disegna(); aggStato(); });
        tutti.appendChild(b);
      });
      dentro.append(sq, gr, tutti);
    } else if (PC.scheda === "poteri") {
      var pick = E("div", "lt-pc-pick");
      POTERI.forEach(function (g) { var nome = g.replace(/ \(.*\)$/, ""); var b = E("button", g === PC.gruppo ? "attiva" : "", nome); b.type = "button"; b.addEventListener("click", function () { PC.gruppo = g; disegna(); }); pick.appendChild(b); });
      var regole = E("div", "lt-pc-regole");
      perG[PC.gruppo].forEach(function (v) { regole.appendChild(riga(v)); });
      var r = Object.keys(RUOLI).filter(function (k) { return RUOLI[k].nome === PC.gruppo; })[0];
      if (r) regole.appendChild(E("p", "lt-pc-nota", RUOLI[r].desc));
      dentro.append(pick, regole);
    }
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
  riprende: true,   // senza riserva: è un gioco in tempo reale
  riassunto: function (imp) { return riassunto(pulisci(imp)); },
  regole: [
    "Gli <b>ospiti</b> fanno i compiti in giro per il palazzo. Le <b>ombre</b> spengono le lanterne quando nessuno le vede.",
    "Chi trova una lanterna spenta la <b>segnala</b>: si fa una riunione, si parla e si vota chi cacciare.",
    "Vincono gli ospiti se finiscono i compiti o cacciano tutte le ombre. Vincono le ombre se diventano tante quanto gli ospiti.",
    "Ruoli speciali: Investigatore, Medico, Sceriffo, Silenziatore, Nebbia e Giullare. L'host sceglie quanto spesso escono."
  ],
  impostazioni: impostazioni,
  avvia: function (t) {
    if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);
    if (!window.LT_PROVA && !ammesso() && !(t.ripresa && t.ripresa.stato)) return soloAmmessi(t);
    return host(t);
  }
});

})();

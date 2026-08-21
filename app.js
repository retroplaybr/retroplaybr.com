const games = [
  {name:'Neon Drift',type:'Cloud',art:'neon'},
  {name:'Kingdom Zero',type:'Cloud',art:'kingdom'},
  {name:'Pixel Quest',type:'Retro • SNES',art:'pixel'},
  {name:'Racing Apex',type:'PC',art:'racing'},
  {name:'Galaxy Frontier',type:'Cloud',art:'galaxy'},
  {name:'Shadow Protocol',type:'PC',art:'shadow'},
  {name:'Arcade Legends',type:'Retro • Arcade',art:'arcade'},
  {name:'Ocean Drive 98',type:'Retro • PS1',art:'ocean'},
  {name:'Iron Horizon',type:'Cloud',art:'iron'},
  {name:'Moon Circuit',type:'PC',art:'moon'}
];

const artStyle = {
  galaxy:'linear-gradient(135deg,#482873,#12466d 55%,#08101f)',
  shadow:'linear-gradient(145deg,#34333b,#10151b 55%,#080b10)',
  arcade:'linear-gradient(145deg,#70244b,#2b1e58 45%,#122537)',
  ocean:'linear-gradient(155deg,#286878,#2a496e 50%,#191e38)',
  iron:'linear-gradient(145deg,#65412f,#202a32 60%,#11161c)',
  moon:'linear-gradient(145deg,#26335d,#16192b 55%,#0c0e16)'
};

function card(g){
  const known=['neon','kingdom','pixel','racing'].includes(g.art);
  return `<article class="game-card focusable" tabindex="0" data-game="${g.name}">
    <div class="game-art ${known?g.art:''}" ${known?'':`style="background:${artStyle[g.art]}"`}>
      <span class="tag ${g.type==='Cloud'?'cloud-tag':''}">${g.type==='Cloud'?'☁':g.type.split(' • ')[0]}</span>
      <div class="art-title">${g.name.toUpperCase().replace(' ','<br>')}</div>
    </div>
    <div class="game-meta"><strong>${g.name}</strong><span>${g.type}</span></div>
  </article>`;
}

const libraryGrid=document.querySelector('#libraryGrid');
const discoverGrid=document.querySelector('#discoverGrid');
const searchGrid=document.querySelector('#searchGrid');
libraryGrid.innerHTML=games.map(card).join('');
discoverGrid.innerHTML=[...games].reverse().map(card).join('');
searchGrid.innerHTML=games.map(card).join('');

const tabs=[...document.querySelectorAll('[data-tab]')];
function switchTab(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelector(`#view-${name}`)?.classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.drawer-item[data-tab]').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  closeDrawer();
  if(name==='find') setTimeout(()=>document.querySelector('#searchInput')?.focus(),100);
}
tabs.forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));

const drawer=document.querySelector('#drawer'),scrim=document.querySelector('#scrim');
function openDrawer(){drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');scrim.classList.add('show')}
function closeDrawer(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');scrim.classList.remove('show')}
document.querySelector('[data-action="menu"]').addEventListener('click',openDrawer);scrim.addEventListener('click',closeDrawer);

const modal=document.querySelector('#gameModal'),modalTitle=document.querySelector('#modalTitle'),modalArtTitle=document.querySelector('#modalArtTitle');
function openGame(name){modalTitle.textContent=name;modalArtTitle.textContent=name.toUpperCase();modal.classList.add('show');modal.setAttribute('aria-hidden','false')}
function closeGame(){modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}
document.addEventListener('click',e=>{const target=e.target.closest('[data-game]');if(target)openGame(target.dataset.game);const play=e.target.closest('[data-play]');if(play)openGame(play.dataset.play)});
document.querySelector('#modalClose').addEventListener('click',closeGame);modal.addEventListener('click',e=>{if(e.target===modal)closeGame()});

document.querySelector('#launchBtn').addEventListener('click',()=>{alert('Próxima etapa: conectar este botão ao servidor de cloud gaming.');});

const input=document.querySelector('#searchInput');
input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();searchGrid.innerHTML=games.filter(g=>g.name.toLowerCase().includes(q)||g.type.toLowerCase().includes(q)).map(card).join('')||'<p style="color:#747d8d">Nenhum jogo encontrado.</p>';});

document.querySelectorAll('.trending button').forEach(b=>b.addEventListener('click',()=>{input.value=b.textContent;input.dispatchEvent(new Event('input'));}));

function updateClock(){const d=new Date();document.querySelector('#clock').textContent=d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}updateClock();setInterval(updateClock,30000);

let tabIndex=0;const mainTabs=['my','discover','find'];
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'||e.key.toLowerCase()==='b'){if(modal.classList.contains('show'))closeGame();else closeDrawer();}
  if(e.key.toLowerCase()==='m') openDrawer();
  if(e.key.toLowerCase()==='y') switchTab('find');
  if(e.key==='['){tabIndex=(tabIndex-1+mainTabs.length)%mainTabs.length;switchTab(mainTabs[tabIndex]);}
  if(e.key===']'){tabIndex=(tabIndex+1)%mainTabs.length;switchTab(mainTabs[tabIndex]);}
  if(e.key==='Enter'){const a=document.activeElement;if(a?.classList.contains('game-card'))openGame(a.dataset.game)}
});

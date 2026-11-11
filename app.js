const person = `<svg viewBox="0 0 40 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="shirt" x2="1" y2="1"><stop stop-color="#80b8d5"/><stop offset="1" stop-color="#3e7192"/></linearGradient><radialGradient id="skin"><stop stop-color="#ffe2b3"/><stop offset="1" stop-color="#d9a271"/></radialGradient></defs><ellipse cx="21" cy="61" rx="14" ry="3" fill="#354534" opacity=".18"/><path d="M13 43l-1 16h8l2-15 2 15h7l-3-19" fill="#3e5261"/><path d="M10 58q-6 6 10 4v-5m4 1q0 7 12 3l-6-4" fill="#725d4b"/><path d="M10 27q10-8 21 0l3 19q-14 6-25-1z" fill="url(#shirt)"/><path d="M10 29L6 43m25-14 4 13" stroke="#dbab7c" stroke-width="6" stroke-linecap="round"/><circle cx="21" cy="16" r="12" fill="url(#skin)"/><path d="M9 15q-2-17 13-14 15 1 11 15l-6-8q-5 6-18 7" fill="#63503e"/><ellipse cx="18" cy="17" rx="1.3" ry="2" fill="#3f3932"/><ellipse cx="26" cy="17" rx="1.3" ry="2" fill="#3f3932"/><path d="M19 23q3 2 6-1" stroke="#9b6554" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`;

// Requests are separate from passengers: boarding never implies clearing a hall call.
export class Lift {
  constructor(policy='standard'){this.policy=policy;this.reset();}
  reset(){this.position=2;this.direction=1;this.calls=new Set([8]);this.hall=new Set();this.phase='idle';this.elapsed=0;this.person='waiting';this.personFloor=5;this.destination=null;this.boardProgress=0;this.stops=[];this.topRider=true;this.pausedForChoice=false;}
  call(direction){
    if(this.person==='arrived'){this.person='waiting';this.personFloor=5;this.destination=null;this.boardProgress=0;}
    if(this.person!=='waiting')return;
    this.hall.add(direction);
    if(this.phase==='idle'){if(this.position===5){this.direction=direction;this.open();}else this.phase='moving';}
  }
  select(floor){
    if(this.person!=='aboard')return;
    if(this.destination===null)this.destination=floor;
    this.calls.add(floor);this.pausedForChoice=false;
    if(this.phase==='idle')this.phase='moving';
    if(this.phase==='open'&&floor===this.position){this.person='leaving';this.personFloor=floor;this.elapsed=0;this.boardProgress=0;this.calls.delete(floor);}
  }
  hasAhead(direction){return [...this.calls,...(this.hall.size?[5]:[])].some(f=>(f-this.position)*direction>.001);}
  open(){
    const floor=Math.round(this.position),hallHere=floor===5&&this.hall.size>0;this.position=floor;this.phase='opening';this.elapsed=0;this.stops.push(floor);this.calls.delete(floor);
    if(floor===8)this.topRider=false;
    if(floor===5){
      this.hall.delete(this.direction);
      if(this.person==='waiting'&&hallHere)this.person='boarding';
    }
    if(this.person==='aboard'&&this.destination===floor){this.person='leaving';this.personFloor=floor;this.boardProgress=0;}
  }
  tick(dt){
    dt=Math.max(0,Math.min(dt,.08));
    if(this.phase==='idle')return;
    if(this.phase==='moving'){
      const next=this.position+this.direction*dt*.85;
      const boundary=this.direction===1?Math.floor(this.position+.00001)+1:Math.ceil(this.position-.00001)-1;
      if((next-boundary)*this.direction>=0){
        this.position=boundary;
        // Reverse at the furthest request even when its hall direction is opposite.
        if(!this.hasAhead(this.direction)&&this.hall.size&&boundary===5&&!this.calls.has(5))this.direction=this.hall.has(this.direction)?this.direction:-this.direction;
        const hallHere=boundary===5&&this.hall.size>0;
        if(this.calls.has(boundary)||(hallHere&&(this.policy==='observed'||this.hall.has(this.direction)))){this.open();}
        else this.chooseDirection();
      }else this.position=next;
    }else if(this.phase==='opening'){
      this.elapsed+=dt;
      if(this.elapsed>=.65){this.phase='open';this.elapsed=0;}
    }else if(this.phase==='open'){
      this.elapsed+=dt;
      if(this.person==='boarding'){
        this.boardProgress=Math.min(1,Math.max(0,this.elapsed/1.25));
        if(this.boardProgress===1){this.person='aboard';this.pausedForChoice=this.destination===null;}
      }
      if(this.person==='leaving'){
        this.boardProgress=Math.min(1,Math.max(0,this.elapsed/1.25));
        if(this.boardProgress===1)this.person='arrived';
      }
      if(this.elapsed>=2.3&&!this.pausedForChoice){this.phase='closing';this.elapsed=0;}
    }else if(this.phase==='closing'){
      this.elapsed+=dt;
      if(this.elapsed>=.65){this.chooseDirection();if(this.phase!=='idle')this.phase='moving';}
    }
  }
  chooseDirection(){
    if(this.hasAhead(this.direction))return;
    if(this.hasAhead(-this.direction)){this.direction*=-1;return;}
    this.phase='idle';
  }
}
let language='zh',lift=new Lift(),lastTime=null;
const labels={zh:{standard:'常规',observed:'校园',reset:'重置',up:'五楼上行',down:'五楼下行',floor:n=>`选择 ${n} 楼`,building:'电梯楼层',console:'轿厢按钮'},en:{standard:'Standard',observed:'Campus',reset:'Reset',up:'Floor 5 up',down:'Floor 5 down',floor:n=>`Select floor ${n}`,building:'Elevator floors',console:'Car buttons'}};
function build(){
  document.querySelector('#building').innerHTML=[8,7,6,5,4,3,2,1].map(n=>`<div class="floor" data-floor="${n}" style="--scene:${(8-n)/7*100}%"><span class="floor-label">${n}F</span>${n===5?'<div class="hall-panel"><button id="up" aria-pressed="false">↑</button><button id="down" aria-pressed="false">↓</button></div>':''}</div>`).join('')+`<div class="shaft"></div><div class="cabin"><div class="cabin-rope"></div><div class="cabin-shell"><div class="rider">${person}</div><div class="rider-main"><div class="inner-person">${person}</div></div><div class="door left"></div><div class="door right"></div></div></div><div class="passenger">${person}</div>`;
  document.querySelector('#destinations').innerHTML=[8,7,6,5,4,3,2,1].map(n=>`<button data-destination="${n}" aria-pressed="false" disabled>${n}</button>`).join('');
  document.querySelector('#up').onclick=()=>lift.call(1);
  document.querySelector('#down').onclick=()=>lift.call(-1);
  document.querySelectorAll('[data-destination]').forEach(b=>b.onclick=()=>lift.select(Number(b.dataset.destination)));
  localize();render();
}
function localize(){
  const t=labels[language];document.documentElement.lang=language==='zh'?'zh-CN':'en';
  for(const policy of ['standard','observed'])document.querySelector('#'+policy).textContent=t[policy];
  document.querySelector('#language').textContent=language==='zh'?'EN':'中';
  document.querySelector('#language').setAttribute('aria-label',language==='zh'?'Switch to English':'切换至中文');
  for(const key of ['reset','up','down']){const el=document.querySelector('#'+key);el.setAttribute('aria-label',t[key]);el.title=t[key];}
  document.querySelector('#building').setAttribute('aria-label',t.building);document.querySelector('.console').setAttribute('aria-label',t.console);
  document.querySelectorAll('[data-destination]').forEach(b=>b.setAttribute('aria-label',t.floor(b.dataset.destination)));
}
function render(){
  const building=document.querySelector('#building'),cabin=building.querySelector('.cabin'),p=building.querySelector('.passenger');
  const row=building.clientHeight/8;
  cabin.style.transform=`translateY(${(8-lift.position)*row}px)`;
  const aperture=lift.phase==='opening'?Math.min(1,lift.elapsed/.65):lift.phase==='open'?1:lift.phase==='closing'?Math.max(0,1-lift.elapsed/.65):0;
  cabin.style.setProperty('--aperture',aperture);cabin.classList.toggle('waiting',lift.pausedForChoice);
  building.querySelector('.rider').hidden=!lift.topRider;
  const aboard=['aboard','boarding','leaving'].includes(lift.person);
  let personFloor=aboard?lift.position:lift.personFloor;
  const start=innerWidth<=600?.23:.39,finish=(cabin.offsetLeft+cabin.clientWidth*.55-row*.73*40/64*.5)/building.clientWidth;
  let x=start;
  if(lift.person==='boarding')x=start+(finish-start)*lift.boardProgress;
  if(lift.person==='aboard')x=finish;
  if(lift.person==='leaving')x=finish+(start-finish)*lift.boardProgress;
  const personY=(8-personFloor)*row+row-10-row*.73,personX=x*building.clientWidth;
  p.style.left=`${personX}px`;p.style.top=`${personY}px`;
  p.style.height=`${row*.73}px`;p.classList.toggle('walking',['boarding','leaving'].includes(lift.person)&&lift.boardProgress>0&&lift.boardProgress<1);
  p.classList.toggle('boarded',aboard);p.classList.toggle('departed',lift.person==='arrived');
  const shell=cabin.querySelector('.cabin-shell'),inside=cabin.querySelector('.inner-person');
  inside.hidden=!aboard;inside.style.height=`${row*.73}px`;
  inside.style.left=`${personX-cabin.offsetLeft-shell.offsetLeft-shell.clientLeft}px`;
  inside.style.top=`${personY-(8-lift.position)*row-shell.offsetTop-shell.clientTop}px`;
  inside.classList.toggle('walking',p.classList.contains('walking'));
  for(const [id,dir] of [['up',1],['down',-1]]){document.querySelector('#'+id).setAttribute('aria-pressed',String(lift.hall.has(dir)));document.querySelector('#'+id).disabled=lift.person!=='waiting'&&lift.person!=='arrived';}
  document.querySelectorAll('[data-destination]').forEach(b=>{b.disabled=lift.person!=='aboard';b.setAttribute('aria-pressed',String(lift.calls.has(Number(b.dataset.destination))));});
  document.querySelector('.console').classList.toggle('ready',lift.person==='aboard');
  document.querySelector('#display').textContent=`${Math.round(lift.position)} ${lift.phase==='idle'?'•':lift.direction===1?'↑':'↓'}`;
  for(const policy of ['standard','observed'])document.querySelector('#'+policy).setAttribute('aria-pressed',String(lift.policy===policy));
}
if(typeof document!=='undefined'){
  for(const policy of ['standard','observed'])document.querySelector('#'+policy).onclick=()=>{lift=new Lift(policy);render();};
  document.querySelector('#reset').onclick=()=>{lift.reset();render();};
  document.querySelector('#language').onclick=()=>{language=language==='zh'?'en':'zh';localize();};
  build();
  function frame(now){if(lastTime!==null)lift.tick((now-lastTime)/1000);lastTime=now;render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
}

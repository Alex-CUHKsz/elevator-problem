const person = `<svg viewBox="0 0 40 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="21" cy="61" rx="14" ry="3" fill="#354534" opacity=".18"/><path d="M13 43l-1 16h8l2-15 2 15h7l-3-19" fill="#3e5261"/><path d="M10 58q-6 6 10 4v-5m4 1q0 7 12 3l-6-4" fill="#725d4b"/><path d="M10 27q10-8 21 0l3 19q-14 6-25-1z" fill="#72a5c0"/><path d="M10 29L6 43m25-14 4 13" stroke="#dbab7c" stroke-width="6" stroke-linecap="round"/><circle cx="21" cy="16" r="12" fill="#edc39b"/><path d="M9 15q-2-17 13-14 15 1 11 15l-6-8q-5 6-18 7" fill="#63503e"/><ellipse cx="18" cy="17" rx="1.3" ry="2" fill="#3f3932"/><ellipse cx="26" cy="17" rx="1.3" ry="2" fill="#3f3932"/><path d="M19 23q3 2 6-1" stroke="#9b6554" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`;

const girl = `<svg viewBox="0 0 40 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="21" cy="61" rx="14" ry="3" fill="#354534" opacity=".18"/><path d="M8 18Q5 0 21 1q16 0 13 23l2 13H7z" fill="#584033"/><path d="M16 46v13m11-13v13" stroke="#dba47b" stroke-width="5" stroke-linecap="round"/><path d="M12 58q-4 6 9 3v-4m3 1q-1 6 11 3l-6-4" fill="#73574c"/><path d="M13 28q9-5 15 0l7 22q-13 6-28 0z" fill="#c4898c"/><path d="M12 31L7 43m23-12 5 12" stroke="#e4b58c" stroke-width="5" stroke-linecap="round"/><circle cx="21" cy="17" r="11" fill="#edc39b"/><path d="M10 15Q8 1 22 2q15 1 11 15l-7-8q-5 6-16 6" fill="#584033"/><ellipse cx="17" cy="18" rx="1.2" ry="1.8" fill="#42362f"/><ellipse cx="25" cy="18" rx="1.2" ry="1.8" fill="#42362f"/><path d="M18 24q4 2 7-1" stroke="#a3695a" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M29 5l7-3-1 8-6-2" fill="#e7bc84"/></svg>`;
const clamp = n => Math.max(0,Math.min(1,n));

export class Lift {
  constructor(policy='standard'){this.policy=policy;this.reset();}
  reset(){
    this.position=2;this.direction=1;this.calls=new Set();this.hall=new Map();
    this.phase='idle';this.elapsed=0;this.serviceTime=0;this.serviceFloor=2;this.stops=[];
    this.person='waiting';this.personFloor=5;this.destination=null;this.boardProgress=0;
    this.mainRequested=false;this.pausedForChoice=false;this.entryDoor=0;this.exitDoor=2;
  }
  call(direction,floor=this.personFloor){
    if(floor!==this.personFloor||!['waiting','arrived'].includes(this.person)||!Number.isInteger(floor)||floor<1||floor>8||![1,-1].includes(direction)||(floor===8&&direction===1)||(floor===1&&direction===-1))return;
    if(this.phase==='idle'){this.calls.add(8);this.calls.add(2);this.direction=floor<this.position?-1:1;}
    if(floor===this.personFloor&&['waiting','arrived'].includes(this.person)){
      this.person='waiting';this.destination=null;this.boardProgress=0;this.mainRequested=true;
    }
    if(!this.hall.has(floor))this.hall.set(floor,new Set());
    this.hall.get(floor).add(direction);
    if(Math.abs(this.position-floor)<.001&&this.phase==='open'){
      if(direction===this.direction){
        this.hall.get(floor).delete(direction);
        if(!this.hall.get(floor).size)this.hall.delete(floor);
      }
      if(this.mainRequested&&(direction===this.direction||this.policy==='observed')){
        this.person='boarding';this.boardProgress=0;this.mainRequested=false;
        this.elapsed=0;this.serviceTime=0;
      }
    }else if(Math.abs(this.position-floor)<.001&&this.phase==='idle'){
      this.direction=direction;this.open();
    }else if(this.phase==='idle'){
      if(!this.hasAhead(this.direction))this.direction*=-1;
      this.phase='moving';
    }
  }
  select(floor){
    if(this.person!=='aboard'||!Number.isInteger(floor)||floor<1||floor>8)return;
    if(this.destination===null)this.destination=floor;
    this.calls.add(floor);this.pausedForChoice=false;
    if(this.phase==='idle')this.phase='moving';
    if(this.phase==='open'&&floor===this.position){
      this.person='leaving';this.personFloor=floor;this.elapsed=0;this.serviceTime=0;this.boardProgress=0;this.calls.delete(floor);
    }
  }
  hasAhead(direction){return [...this.calls,...this.hall.keys()].some(f=>(f-this.position)*direction>.001);}
  open(){
    const floor=Math.round(this.position),hallHere=this.hall.has(floor);
    this.position=floor;this.phase='opening';this.elapsed=0;this.serviceTime=0;this.serviceFloor=floor;this.entryDoor=Math.floor(Math.random()*2);this.exitDoor=2+Math.floor(Math.random()*2);this.stops.push(floor);this.calls.delete(floor);
    const hall=this.hall.get(floor);
    if(hall){hall.delete(this.direction);if(!hall.size)this.hall.delete(floor);}
    if(this.person==='waiting'&&this.personFloor===floor&&hallHere&&this.mainRequested){
      this.person='boarding';this.boardProgress=0;this.mainRequested=false;
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
        const hall=this.hall.get(boundary);
        if(!this.hasAhead(this.direction)&&hall&&!this.calls.has(boundary)&&!hall.has(this.direction))this.direction*=-1;
        if(this.calls.has(boundary)||(hall&&(this.policy==='observed'||hall.has(this.direction))))this.open();
        else this.chooseDirection();
      }else this.position=next;
    }else if(this.phase==='opening'){
      this.elapsed+=dt;
      if(this.elapsed>=.65){this.phase='open';this.elapsed=0;}
    }else if(this.phase==='open'){
      this.elapsed+=dt;this.serviceTime=this.elapsed;
      const boardingDelay=1.3;
      if(this.person==='boarding'){
        this.boardProgress=clamp((this.elapsed-boardingDelay)/1.4);
        if(this.boardProgress===1){this.person='aboard';this.pausedForChoice=this.destination===null;}
      }
      if(this.person==='leaving'){
        this.boardProgress=clamp(this.elapsed/1.4);
        if(this.boardProgress===1)this.person='arrived';
      }
      const dwell=4.5;
      if(this.elapsed>=dwell&&!this.pausedForChoice){this.phase='closing';this.elapsed=0;}
    }else if(this.phase==='closing'){
      this.elapsed+=dt;
      if(this.elapsed>=.65){this.chooseDirection();if(this.phase==='closing')this.phase='moving';}
    }
  }
  chooseDirection(){
    if(this.hasAhead(this.direction))return;
    if(this.hasAhead(-this.direction)){this.direction*=-1;return;}
    // A retained opposite hall call at the current floor still needs service.
    const here=this.hall.get(Math.round(this.position));
    if(here){this.direction=here.has(-this.direction)?-this.direction:this.direction;this.open();return;}
    if(Math.abs(this.position-2)>.001){this.calls.add(2);this.direction=this.position<2?1:-1;return;}
    this.phase='idle';this.direction=1;
  }
}
let language='zh',lift=new Lift(),lastTime=null;
const labels={
  zh:{standard:'常规',observed:'校园',reset:'重置',floor:n=>`选择 ${n} 楼`,hall:(n,d)=>`${n} 楼${d===1?'上行':'下行'}`,building:'电梯楼层',console:'轿厢按钮'},
  en:{standard:'Standard',observed:'Campus',reset:'Reset',floor:n=>`Select floor ${n}`,hall:(n,d)=>`Floor ${n} ${d===1?'up':'down'}`,building:'Elevator floors',console:'Car buttons'}
};
let ui;
function actor(className,art){return `<div class="${className}">${art}</div>`;}
function build(){
  document.querySelector('#building').innerHTML=[8,7,6,5,4,3,2,1].map(n=>`<div class="floor" data-floor="${n}" style="--scene:${(8-n)/7*100}%"><div class="landscape-window"><div class="window-view"></div><div class="window-pane"></div></div><span class="floor-label">${n}F</span>${[0,1,2,3].map(slot=>`<div class="dorm-room room-${slot}" data-slot="${slot}"><div class="room-interior"></div><div class="room-leaf"><span class="room-number">${n}0${slot+1}</span><i class="room-handle"></i></div></div>`).join('')}<div class="hallway-floor"></div></div>`).join('')+`<div class="shaft"></div><div class="cabin"><div class="cabin-rope"></div><div class="cabin-shell"><div class="rider-main">${actor('girl-seated',girl)}${actor('inner-person',person)}${actor('girl-in inner-npc',girl)}${actor('girl-out inner-npc',girl)}</div><div class="door left"></div><div class="door right"></div></div></div>${actor('passenger',person)}${actor('npc incoming',girl)}${actor('npc outgoing',girl)}`;
  document.querySelector('#hall-rail').innerHTML=[8,7,6,5,4,3,2,1].map(n=>`<div class="hall-cell"><div class="hall-buttons">${[1,-1].map(d=>`<button data-call-floor="${n}" data-direction="${d}" aria-pressed="false" disabled>${d===1?'↑':'↓'}</button>`).join('')}</div></div>`).join('');
  document.querySelector('#destinations').innerHTML=[8,7,6,5,4,3,2,1].map(n=>`<button data-destination="${n}" aria-pressed="false" disabled>${n}</button>`).join('');
  document.querySelectorAll('[data-call-floor]').forEach(b=>b.onclick=()=>lift.call(Number(b.dataset.direction),Number(b.dataset.callFloor)));
  document.querySelectorAll('[data-destination]').forEach(b=>b.onclick=()=>lift.select(Number(b.dataset.destination)));
  const building=document.querySelector('#building'),cabin=building.querySelector('.cabin'),shell=cabin.querySelector('.cabin-shell');
  ui={building,cabin,shell,boy:building.querySelector('.passenger'),inside:cabin.querySelector('.inner-person'),incoming:building.querySelector('.incoming'),outgoing:building.querySelector('.outgoing'),girlIn:cabin.querySelector('.girl-in'),girlOut:cabin.querySelector('.girl-out'),seated:cabin.querySelector('.girl-seated'),rooms:[...building.querySelectorAll('.dorm-room')],floors:[...building.querySelectorAll('.floor')],hall:[...document.querySelectorAll('[data-call-floor]')],buttons:[...document.querySelectorAll('[data-destination]')],console:document.querySelector('.console'),display:document.querySelector('#display')};
  localize();render();
}
function localize(){
  const t=labels[language];document.documentElement.lang=language==='zh'?'zh-CN':'en';
  for(const policy of ['standard','observed'])document.querySelector('#'+policy).textContent=t[policy];
  document.querySelector('#language').textContent=language==='zh'?'EN':'中';
  document.querySelector('#language').setAttribute('aria-label',language==='zh'?'Switch to English':'切换至中文');
  document.querySelector('#reset').setAttribute('aria-label',t.reset);
  document.querySelector('#building').setAttribute('aria-label',t.building);ui.console.setAttribute('aria-label',t.console);
  ui.hall.forEach(b=>b.setAttribute('aria-label',t.hall(b.dataset.callFloor,Number(b.dataset.direction))));
  ui.buttons.forEach(b=>b.setAttribute('aria-label',t.floor(b.dataset.destination)));
}
function placeActor(outside,inside,x,y,height,walking,opacity=1){
  const {cabin,shell}=ui;
  outside.style.cssText=`left:${x}px;top:${y}px;height:${height}px;opacity:${opacity}`;
  outside.classList.toggle('walking',walking);
  if(inside){
    inside.style.cssText=`left:${x-cabin.offsetLeft-shell.offsetLeft-shell.clientLeft}px;top:${y-(8-lift.position)*ui.building.clientHeight/8-shell.offsetTop-shell.clientTop}px;height:${height}px;opacity:${opacity}`;
    inside.classList.toggle('walking',walking);
  }
}
function render(){
  const {building,cabin,shell,boy,inside,incoming,outgoing,girlIn,girlOut,seated}=ui;
  const row=building.clientHeight/8,height=Math.min(row*.69,72,building.clientWidth*.19),width=height*40/64;
  const originY=f=>(8-f)*row+row-10-height;
  cabin.style.transform=`translateY(${(8-lift.position)*row}px)`;
  const aperture=lift.phase==='opening'?clamp(lift.elapsed/.65):lift.phase==='open'?1:lift.phase==='closing'?1-clamp(lift.elapsed/.65):0;
  cabin.style.setProperty('--aperture',aperture);cabin.classList.toggle('waiting',lift.pausedForChoice);
  const center=cabin.offsetLeft+cabin.clientWidth/2;
  const activeFloor=ui.floors[8-lift.serviceFloor];
  const leftRoom=activeFloor.querySelector(`[data-slot="${lift.entryDoor}"]`),rightRoom=activeFloor.querySelector(`[data-slot="${lift.exitDoor}"]`);
  const left=leftRoom.offsetLeft+leftRoom.offsetWidth/2,right=rightRoom.offsetLeft+rightRoom.offsetWidth/2;
  const boyHome=Math.max(8,center-cabin.clientWidth/2-width-8);
  const boySeat=center+width*.02;
  const aboard=['aboard','boarding','leaving'].includes(lift.person);
  const floor=aboard?lift.position:lift.personFloor;
  let x=boyHome;
  if(lift.person==='boarding')x=boyHome+(boySeat-boyHome)*lift.boardProgress;
  if(lift.person==='aboard')x=boySeat;
  if(lift.person==='leaving')x=boySeat+(boyHome-boySeat)*lift.boardProgress;
  placeActor(boy,inside,x,originY(floor),height,['boarding','leaving'].includes(lift.person)&&lift.boardProgress>0&&lift.boardProgress<1);
  inside.hidden=!aboard;
  const exchange=['opening','open','closing'].includes(lift.phase);
  const t=lift.serviceTime;
  const entryProgress=clamp((t-.65)/2.75),exitProgress=clamp((t-.15)/2.8);
  const girlSeat=center-width*.85;
  const girlY=originY(lift.serviceFloor);
  const inX=left-width/2+(girlSeat-left+width/2)*entryProgress;
  const outX=girlSeat+(right-width/2-girlSeat)*exitProgress;
  const incomingVisible=exchange&&lift.phase!=='opening';
  incoming.hidden=girlIn.hidden=!incomingVisible;
  outgoing.hidden=girlOut.hidden=!incomingVisible;
  seated.hidden=exchange&&lift.phase!=='opening';
  seated.style.cssText=`left:${girlSeat-cabin.offsetLeft-shell.offsetLeft-shell.clientLeft}px;top:${row-10-height-shell.offsetTop-shell.clientTop}px;height:${height}px`;
  placeActor(incoming,girlIn,inX,girlY,height,entryProgress>0&&entryProgress<1,clamp((t-.3)/.5));
  placeActor(outgoing,girlOut,outX,girlY,height,exitProgress>0&&exitProgress<1,1-clamp((t-2.75)/.65));
  ui.rooms.forEach(room=>{
    let openness=0;
    if(exchange&&room===leftRoom)openness=clamp(t/.45)*(1-clamp((t-1.5)/.6));
    if(exchange&&room===rightRoom)openness=clamp((t-1.9)/.5)*(1-clamp((t-3.5)/.6));
    room.style.setProperty('--room-open',openness);
  });
  ui.hall.forEach(b=>{
    const floor=Number(b.dataset.callFloor),direction=Number(b.dataset.direction);
    b.disabled=floor!==lift.personFloor||!['waiting','arrived'].includes(lift.person)||(floor===8&&direction===1)||(floor===1&&direction===-1);
    b.setAttribute('aria-pressed',String(lift.hall.get(floor)?.has(direction)??false));
  });
  ui.buttons.forEach(b=>{b.disabled=lift.person!=='aboard';b.setAttribute('aria-pressed',String(lift.calls.has(Number(b.dataset.destination))));});
  ui.console.classList.toggle('ready',lift.person==='aboard');
  ui.display.textContent=`${Math.round(lift.position)} ${lift.phase==='idle'?'•':lift.direction===1?'↑':'↓'}`;
  for(const policy of ['standard','observed'])document.querySelector('#'+policy).setAttribute('aria-pressed',String(lift.policy===policy));
}
if(typeof document!=='undefined'){
  for(const policy of ['standard','observed'])document.querySelector('#'+policy).onclick=()=>{lift=new Lift(policy);render();};
  document.querySelector('#reset').onclick=()=>{lift.reset();render();};
  document.querySelector('#language').onclick=()=>{language=language==='zh'?'en':'zh';localize();};
  build();
  function frame(now){if(lastTime!==null)lift.tick((now-lastTime)/1000);lastTime=now;render();requestAnimationFrame(frame);}requestAnimationFrame(frame);
}

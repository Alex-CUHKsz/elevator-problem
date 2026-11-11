// A deliberately bounded model: one car, one down call, one existing car call.
// Travel and dwell times are illustrative, not measurements of the campus lift.
export function simulate(mode) {
  if (!['standard', 'observed'].includes(mode)) throw new Error('Unknown policy');
  const events = [], carCalls = new Set([8]);
  let floor = 2, direction = 1, time = 0, hallPending = true, boarded = false;
  let boardTime = null, arrivalTime = null, stops = 0;
  const snapshot = (type, duration, from = floor, extra = {}) => {
    events.push({ type, start: time, end: time + duration, from, floor, direction,
      hallPending, boarded, boardTime, arrivalTime, stops, carCalls: [...carCalls], ...extra });
    time += duration;
  };
  while (carCalls.size || hallPending) {
    const from = floor;
    floor += direction;
    snapshot('travel', 2, from);
    const hallHere = floor === 5 && hallPending;
    const shouldStop = carCalls.has(floor) || (hallHere && (direction === -1 || mode === 'observed'));
    if (shouldStop) {
      stops++;
      const retained = hallHere && direction === 1;
      carCalls.delete(floor);
      if (hallHere && direction === -1) hallPending = false;
      if (hallHere && !boarded) { boarded = true; boardTime = time; carCalls.add(2); }
      if (floor === 2 && boarded) { boarded = false; arrivalTime = time; }
      snapshot('stop', 6, floor, { retained });
    }
    if (floor === 8) direction = -1;
  }
  return { events, duration: time, stops, boardTime, arrivalTime };
}
export function stateAt(model, time) {
  const done = time >= model.duration;
  const event = model.events.find(e => time >= e.start && time < e.end) || model.events.at(-1);
  const progress = done ? 1 : Math.max(0, Math.min(1, (time - event.start) / (event.end - event.start)));
  return { ...event, position: event.type === 'travel' ? event.from + (event.floor - event.from) * progress : event.floor, done };
}
const copy = {
  zh: {
    eyebrow:'一个校园观察 · 一次调度实验',title:'同一段旅程，为什么多停一次？',subtitle:'你在五楼按下「向下」，想去二楼。电梯正在上行去八楼。把两种停靠逻辑放在一起，看那盏没有熄灭的按钮。',
    scenario:'电梯 2 → 8 楼 · 你在 5 楼等候 ↓ 2 楼',fixed:'单梯 · 无新增呼叫',
    standard:'按方向响应',observed:'学校观察的复现',standardSub:'常见选择集选控制',observedSub:'可解释现象的假设模型',standardBadge:'回程接你',observedBadge:'提前接你，重复停靠',
    play:'▶ 播放对比',pause:'Ⅱ 暂停',replay:'↺ 再看一次',step:'下一事件',clock:'模拟时间',you:'蓝衣乘客 = 你',pending:'黄灯 = 下行呼叫保留',timing:'示意参数：每层 2 s，每次停靠 6 s；非实测',
    stops:'次停靠',arrival:'到达二楼',notYet:'—',sources:'参考资料与模型边界',
    observationLabel:'观察',hypothesisLabel:'解释',meaningLabel:'影响',finding:'门开了，呼叫却还在',findingText:'已知：第一次停五楼不是轿厢内选层触发；没有人再次呼叫；上行开门后，下行按钮仍然亮着。',reason:'停靠与销号，可能用了两套规则',reasonText:'假设：上行也响应下行呼叫，但只在下行停靠时清除它。因此，乘客上车后，五楼请求仍被保留，回程再次触发停靠。',meaning:'少等一会儿，多坐一会儿',meaningText:'在这个固定场景中，提前上车缩短候梯时间，却没有缩短路线，还多出一次停靠。应同时比较候梯、乘梯和到达时间，不能只看“多久开门”。',
    sourceIntro:'采用厂商控制规格作为基线，并参考候梯时间研究。以下资料未诊断学校电梯。',source1:'支持按运行方向服务厅外呼叫的基线规则。',source2:'启发：调度评价需要考虑乘客等待；本文研究的是群梯，不能直接证明本案例原因。',limits:'这是单梯、固定请求的教学模拟，不是学校控制器源码。按钮仍亮与呼叫保留相符，但也需排查指示灯、配置或控制状态。时间仅为示意；没有测量或估算耗电量。直接清除反向呼叫也可能漏接仍在等下行的乘客，不能作为未经验证的修复。',footer:'观察 → 假设 → 模拟；保留结论边界。',
    up:'上行至',down:'下行至',floor:'楼',wait:'你在五楼等候；下行呼叫保留。',ride:'你已上车；五楼下行呼叫仍保留。',rideCleared:'你已上车，正在前往二楼。',top:'八楼乘客下车，随后转为下行。',pickup:'五楼接你，下行呼叫清除。',early:'提前接你，但五楼下行呼叫没有清除。',repeat:'再次停五楼，清除原来的下行呼叫。',arrived:'你已到二楼。',finished:'旅程结束',floorNames:['花园','海岸','沙丘','草甸','森林','雪山','晚霞','星空']
  },
  en: {
    eyebrow:'A CAMPUS OBSERVATION · A DISPATCH EXPERIMENT',title:'Same journey. One extra stop.',subtitle:'You press “down” on floor 5, heading to floor 2. The lift is going up to floor 8. Compare two policies—and watch the call light that stays on.',
    scenario:'Lift: 2 → 8 · You: floor 5 ↓ floor 2',fixed:'One lift · No new calls',
    standard:'Directional service',observed:'Observed behavior',standardSub:'Selective collective baseline',observedSub:'A hypothesis reproducing the observation',standardBadge:'Pick up on return',observedBadge:'Early pickup, extra stop',
    play:'▶ Play comparison',pause:'Ⅱ Pause',replay:'↺ Replay',step:'Next event',clock:'Model time',you:'Blue passenger = you',pending:'Yellow = down call pending',timing:'Illustration: 2 s / floor, 6 s / stop. Not measured.',stops:'stops',arrival:'arrival at F2',notYet:'—',sources:'Sources & model boundaries',
    observationLabel:'OBSERVATION',hypothesisLabel:'HYPOTHESIS',meaningLabel:'IMPACT',finding:'The door opens. The call remains.',findingText:'Reported: no car call for floor 5, no new hall call, and the down button stays lit after the first upward stop.',reason:'Stopping and clearing may use different rules.',reasonText:'Hypothesis: the lift stops for a down call while going up, but only clears it on a downward stop. The original call triggers a second visit even after you board.',meaning:'Less waiting. More riding.',meaningText:'In this fixed scenario, early boarding reduces waiting but adds a stop without shortening the route. Compare waiting, riding and arrival times together—not just time until doors open.',
    sourceIntro:'The baseline follows a manufacturer specification; waiting-time research informs the evaluation. Neither source diagnoses the campus lift.',source1:'Supports the directional hall-call service baseline.',source2:'Motivates evaluating passenger waiting. This group-control study does not establish the cause of this single-car case.',limits:'An educational model with one car and fixed requests, not campus controller source code. A lit button is consistent with a retained call, but indicator, configuration and control-state issues remain alternatives. Timing is illustrative; energy is neither measured nor estimated. Simply clearing the opposite call could strand other waiting passengers and is not a validated fix.',footer:'Observe → hypothesize → simulate. Keep the limits visible.',
    up:'Going up to F',down:'Going down to F',floor:'',wait:'You wait at F5; the down call is pending.',ride:'You are on board; the F5 down call remains.',rideCleared:'You are on board, heading to F2.',top:'The F8 passenger exits; the lift then reverses.',pickup:'You board at F5; the down call clears.',early:'You board early; the F5 down call stays on.',repeat:'Another stop at F5 clears the original call.',arrived:'You have arrived at F2.',finished:'Journey complete',floorNames:['Garden','Coast','Dunes','Meadow','Forest','Alpine','Sunset','Starlight']
  }
};
const models = {standard:simulate('standard'),observed:simulate('observed')};
const person = `<svg viewBox="0 0 40 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="shirt" x2="1" y2="1"><stop stop-color="#80b8d5"/><stop offset="1" stop-color="#3e7192"/></linearGradient><radialGradient id="skin"><stop stop-color="#ffe2b3"/><stop offset="1" stop-color="#d9a271"/></radialGradient></defs><ellipse cx="21" cy="61" rx="14" ry="3" fill="#354534" opacity=".18"/><path d="M13 43l-1 16h8l2-15 2 15h7l-3-19" fill="#3e5261"/><path d="M10 58q-6 6 10 4v-5m4 1q0 7 12 3l-6-4" fill="#725d4b"/><path d="M10 27q10-8 21 0l3 19q-14 6-25-1z" fill="url(#shirt)"/><path d="M10 29L6 43m25-14 4 13" stroke="#dbab7c" stroke-width="6" stroke-linecap="round"/><circle cx="21" cy="16" r="12" fill="url(#skin)"/><path d="M9 15q-2-17 13-14 15 1 11 15l-6-8q-5 6-18 7" fill="#63503e"/><ellipse cx="18" cy="17" rx="1.3" ry="2" fill="#3f3932"/><ellipse cx="26" cy="17" rx="1.3" ry="2" fill="#3f3932"/><path d="M19 23q3 2 6-1" stroke="#9b6554" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>`;
let lang='zh', time=0, playing=false, speed=1, last=null;
function setup(){
  const t=copy[lang];
  document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.title=lang==='zh'?'Elevator Problem · 多停的一层':'Elevator Problem · One extra stop';
  document.querySelectorAll('[data-i]').forEach(el=>el.textContent=t[el.dataset.i]);
  document.querySelector('#language').textContent=lang==='zh'?'English ↗':'中文 ↗';
  document.querySelector('#language').setAttribute('aria-label',lang==='zh'?'Switch to English':'切换至中文');
  document.querySelector('#reset').setAttribute('aria-label',lang==='zh'?'重置':'Reset');
  document.querySelector('#speed').setAttribute('aria-label',lang==='zh'?'播放速度':'Playback speed');
  document.querySelector('#timeline').setAttribute('aria-label',lang==='zh'?'模拟时间轴':'Simulation timeline');
  document.querySelector('#comparison').innerHTML=Object.keys(models).map(mode=>`<article class="panel ${mode}" id="${mode}"><div class="panel-head"><div><h2>${t[mode]}</h2><div class="panel-sub">${t[mode+'Sub']}</div></div><span class="badge">${t[mode+'Badge']}</span></div><div class="building">${[8,7,6,5,4,3,2,1].map(n=>`<div class="floor" style="--scene:${(8-n)/7*100}%"><span class="floor-label">${n}F</span><span class="floor-name">${t.floorNames[n-1]}</span>${n===5?`<div class="waiting-person">${person}</div><div class="call">↓</div>`:''}${n===2?`<div class="arrived-person" hidden>${person}</div>`:''}</div>`).join('')}<div class="shaft"></div><div class="cabin"><div class="cabin-shell"><div class="cabin-person other-person">${person}</div><div class="cabin-person you-person">${person}</div></div></div></div><div class="status"><span class="status-icon">↳</span><span class="status-text"></span></div><div class="metrics"><span><strong class="stops">0</strong>${t.stops}</span><span>${t.arrival} <strong class="arrival">—</strong></span></div></article>`).join('');
  render();
}
function render(){
  const t=copy[lang];
  for(const [mode,model] of Object.entries(models)){
    const state=stateAt(model,time), root=document.querySelector('#'+mode);
    const cabin=root.querySelector('.cabin');
    cabin.style.transform=`translateY(${(8-state.position)*100}%)`;
    cabin.classList.toggle('open',state.type==='stop'&&!state.done);
    root.querySelector('.call').classList.toggle('lit',state.hallPending);
    root.querySelector('.waiting-person').hidden=state.boardTime!==null;
    root.querySelector('.you-person').hidden=!state.boarded;
    root.querySelector('.other-person').hidden=time>=model.events.find(e=>e.type==='stop'&&e.floor===8).start;
    root.querySelector('.arrived-person').hidden=state.arrivalTime===null;
    root.querySelector('.stops').textContent=state.stops;
    root.querySelector('.arrival').textContent=state.arrivalTime===null?'—':`${state.arrivalTime} s`;
    let status;
    if(state.done)status=`${t.finished} · ${model.arrivalTime} s ${t.arrival}`;
    else if(state.type==='stop')status=state.floor===8?t.top:state.floor===2?t.arrived:state.direction===1?t.early:mode==='observed'?t.repeat:t.pickup;
    else status=`${state.direction===1?t.up:t.down}${state.floor}${t.floor} · ${state.boarded?(state.hallPending?t.ride:t.rideCleared):t.wait}`;
    root.querySelector('.status-text').textContent=status;
  }
  document.querySelector('#clock').textContent=`${time.toFixed(1)} s`;
  document.querySelector('#timeline').value=time;
  document.querySelector('#play').textContent=playing?t.pause:time>=48?t.replay:t.play;
}
function frame(now){
  if(playing&&last!==null){time=Math.min(48,time+(now-last)/1000*speed);if(time>=48)playing=false;render();}
  last=now;requestAnimationFrame(frame);
}
if(typeof document!=='undefined'){
  document.querySelector('#language').onclick=()=>{lang=lang==='zh'?'en':'zh';setup();};
  document.querySelector('#play').onclick=()=>{if(time>=48)time=0;playing=!playing;last=null;render();};
  document.querySelector('#reset').onclick=()=>{playing=false;time=0;render();};
  document.querySelector('#step').onclick=()=>{playing=false;const boundaries=[...new Set(Object.values(models).flatMap(m=>m.events.flatMap(e=>[e.start,e.end])))].sort((a,b)=>a-b);time=boundaries.find(v=>v>time+.001)??48;render();};
  document.querySelector('#speed').onchange=e=>{speed=Number(e.target.value);};
  document.querySelector('#timeline').oninput=e=>{playing=false;time=Number(e.target.value);render();};
  setup();requestAnimationFrame(frame);
}

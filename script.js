/* ============================================================
   DSGNR³ — design performance benchmark (vanilla JS)
   ============================================================ */

const $  = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const escapeHTML = s => s.replace(/[&<>"']/g, c => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
));

/* ───────── topbar clock ───────── */
function tickClock(){
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  $('#now').textContent =
    `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} · ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
setInterval(tickClock, 1000); tickClock();

/* ───────── shared state / total ───────── */
const STATE = { bench: 0, squat: 0, dead: 0, rack: 20 };

/* ───────── ctrl+s next-section nav ───────── */
let nextSection = null;
const hintEl = $('#next-hint');
function showNext(targetId){
  nextSection = targetId;
  if (hintEl) hintEl.hidden = false;
}
function clearNext(){
  nextSection = null;
  if (hintEl) hintEl.hidden = true;
}
window.addEventListener('keydown', e => {
  // Ctrl+S (win/linux) or Cmd+S (mac)
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')){
    e.preventDefault();
    if (nextSection){
      const el = document.querySelector(nextSection);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      clearNext();
    }
  }
}, { capture: true });

function tierFor(kg){
  if (kg < 100) return 'UNRANKED';
  if (kg < 200) return 'D · ROOKIE';
  if (kg < 300) return 'C · AMATEUR';
  if (kg < 400) return 'B · TRAINEE';
  if (kg < 500) return 'A · PRO';
  if (kg < 600) return 'S · ELITE';
  return 'SS · WORLD CLASS';
}
function updateTotal(){
  $('#bd-bench').textContent = STATE.bench;
  $('#bd-squat').textContent = STATE.squat;
  $('#bd-dead').textContent  = STATE.dead;
  $('#bd-rack').textContent  = STATE.rack;
  const total = STATE.bench + STATE.squat + STATE.dead + STATE.rack;
  $('#grand-total').textContent = total;
  $('#total-tier').textContent  = tierFor(total);
}

/* ============================================================
   LIFT 01 / TYPING — bench press
   ============================================================ */
const TYPING_SCRIPTS = [
  '대표님이 방금 보시더니 전체 방향을 완전히 바꾸자고 하셔서요. 지금까지 작업해주신 건 너무 고생하셨는데, 처음 기획 단계 느낌으로 다시 새로 가볼 수 있을까요?',
  '뭔가 부족한 느낌은 있는데 정확히 뭐가 문제인지는 저희도 잘 모르겠어요. 일단 디자이너님 감각으로 여러 방향 시도해서 수정본 몇 가지 더 보여주시면 그중에서 느낌 오는 걸로 골라볼게요.',
  '수정은 진짜 간단한 부분이라 금방 끝날 것 같은데, 이런 정도는 추가 비용 없이 반영 가능한 거죠? 근데 수정사항은 제가 정리해서 다시 한번 더 보내드릴게요.'
];
let typingState = null;

function pickScript(){
  const i = Math.floor(Math.random() * TYPING_SCRIPTS.length);
  $('#typing-script-name').textContent = `SCRIPT ${String.fromCharCode(65 + i)}`;
  return TYPING_SCRIPTS[i];
}
function renderPrompt(target, typed){
  const out = [];
  for (let i = 0; i < target.length; i++){
    const ch = target[i];
    if (i < typed.length){
      out.push(typed[i] === ch
        ? `<span class="ok">${escapeHTML(ch)}</span>`
        : `<span class="bad">${escapeHTML(ch)}</span>`);
    } else if (i === typed.length){
      out.push(`<span class="cur">${escapeHTML(ch)}</span>`);
    } else {
      out.push(escapeHTML(ch));
    }
  }
  $('#typing-prompt').innerHTML = out.join('');
}
function startTyping(){
  if (typingState && typingState.running) return;
  clearNext();
  const target = pickScript();
  const input  = $('#typing-input');
  input.value = '';
  input.disabled = false;
  input.focus();
  $('#typing-start').disabled = true;
  $('#typing-start').textContent = 'RUNNING';
  $('#typing-wpm').textContent = '0';
  $('#typing-acc').textContent = '100';
  $('#typing-kg').textContent  = '0';
  renderPrompt(target, '');

  typingState = { running: true, target, started: performance.now(), duration: 30000 };

  const loop = () => {
    if (!typingState || !typingState.running) return;
    const elapsed = performance.now() - typingState.started;
    const remain  = Math.max(0, typingState.duration - elapsed);
    $('#typing-time').textContent = (remain / 1000).toFixed(1);
    if (remain <= 0){ endTyping(); return; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function endTyping(){
  if (!typingState) return;
  typingState.running = false;
  const input = $('#typing-input');
  input.disabled = true;
  const target = typingState.target;
  const typed  = input.value;

  let correct = 0, wrong = 0;
  for (let i = 0; i < typed.length; i++){
    if (typed[i] === target[i]) correct++; else wrong++;
  }
  const elapsedSec = (performance.now() - typingState.started) / 1000;
  const wpm = Math.round((correct / 5) / Math.max(elapsedSec, 1) * 60);
  const acc = typed.length ? Math.round(correct / typed.length * 100) : 100;
  const kg  = Math.max(0, correct - 2 * wrong) * 3;

  $('#typing-wpm').textContent = wpm;
  $('#typing-acc').textContent = acc;
  $('#typing-kg').textContent  = kg;
  $('#typing-time').textContent = '0.0';
  $('#typing-start').disabled = false;
  $('#typing-start').textContent = 'RETRY';

  STATE.bench = kg;
  updateTotal();
  showNext('#lift-02');
}
$('#typing-input').addEventListener('input', () => {
  if (!typingState || !typingState.running) return;
  const v = $('#typing-input').value;
  renderPrompt(typingState.target, v);
  if (v.length >= typingState.target.length) endTyping();
});
$('#typing-start').addEventListener('click', startTyping);
$('#typing-prompt').innerHTML = escapeHTML(TYPING_SCRIPTS[0]);
$('#typing-input').disabled = true;

/* ============================================================
   LIFT 02 / CLICK — squat
   ============================================================ */
let clickState = null;

function placeClickTarget(initial = false){
  const arena = $('.click-arena').getBoundingClientRect();
  const t = $('#click-target');
  const size = 180;
  const margin = 12;
  if (initial){
    t.style.left = ''; t.style.top = ''; t.style.transform = '';
    return;
  }
  const x = margin + Math.random() * Math.max(0, arena.width  - size - margin*2);
  const y = margin + Math.random() * Math.max(0, arena.height - size - margin*2);
  t.style.left = x + 'px';
  t.style.top  = y + 'px';
  t.style.transform = 'none';
}
function startClick(){
  if (clickState && clickState.running) return;
  clearNext();
  clickState = { running: true, hits: 0, started: performance.now(), duration: 10000 };
  $('#click-target').disabled = false;
  $('#click-start').disabled = true;
  $('#click-start').textContent = 'RUNNING';
  $('#click-hits').textContent = '0';
  $('#click-cps').textContent  = '0.0';
  $('#click-kg').textContent   = '0';
  $('#click-target-inner').textContent = '0';
  placeClickTarget();

  const loop = () => {
    if (!clickState || !clickState.running) return;
    const elapsed = performance.now() - clickState.started;
    const remain  = Math.max(0, clickState.duration - elapsed);
    $('#click-time').textContent = (remain / 1000).toFixed(1);
    $('#click-progress-bar').style.width = (elapsed / clickState.duration * 100) + '%';
    if (remain <= 0){ endClick(); return; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
function endClick(){
  if (!clickState) return;
  clickState.running = false;
  $('#click-target').disabled = true;
  $('#click-time').textContent = '0.0';
  $('#click-progress-bar').style.width = '100%';
  const cps = clickState.hits / 10;
  const kg  = Math.round(clickState.hits * 1.5) * 3;
  $('#click-cps').textContent  = cps.toFixed(1);
  $('#click-kg').textContent   = kg;
  $('#click-start').disabled = false;
  $('#click-start').textContent = 'RETRY';
  $('#click-target-inner').textContent = 'CLICK';
  placeClickTarget(true);
  setTimeout(() => $('#click-progress-bar').style.width = '0%', 600);
  STATE.squat = kg;
  updateTotal();
  showNext('#lift-03');
}
$('#click-target').addEventListener('click', () => {
  if (!clickState || !clickState.running) return;
  clickState.hits++;
  $('#click-hits').textContent = clickState.hits;
  $('#click-target-inner').textContent = clickState.hits;
  placeClickTarget();
});
$('#click-start').addEventListener('click', startClick);
$('#click-target').disabled = true;

/* ============================================================
   LIFT 03 / TRACE — deadlift
   ============================================================ */
const traceCanvas = $('#trace-canvas');
const tctx = traceCanvas.getContext('2d');
const traceState = { running: false, dragging: false, points: [], target: [] };

function generateTraceTarget(){
  const W = traceCanvas.width, H = traceCanvas.height;
  const pad = 70;
  const pts = [];
  for (let x = pad; x <= W - pad; x++){
    const t = (x - pad) / (W - pad * 2);
    const y = H/2
      + Math.sin(t * Math.PI * 2.4) * (H * 0.24)
      + Math.sin(t * Math.PI * 5.1 + 1.1) * (H * 0.06);
    pts.push({ x, y });
  }
  traceState.target = pts;
}
function drawTraceScene(){
  const W = traceCanvas.width, H = traceCanvas.height;
  tctx.clearRect(0, 0, W, H);

  // grid
  tctx.strokeStyle = 'rgba(0,0,0,0.08)';
  tctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40){
    tctx.beginPath(); tctx.moveTo(x, 0); tctx.lineTo(x, H); tctx.stroke();
  }
  for (let y = 0; y < H; y += 40){
    tctx.beginPath(); tctx.moveTo(0, y); tctx.lineTo(W, y); tctx.stroke();
  }

  // target dashed
  if (traceState.target.length){
    tctx.strokeStyle = '#000';
    tctx.lineWidth = 3;
    tctx.setLineDash([8, 10]);
    tctx.beginPath();
    traceState.target.forEach((p, i) => i ? tctx.lineTo(p.x, p.y) : tctx.moveTo(p.x, p.y));
    tctx.stroke();
    tctx.setLineDash([]);

    const s = traceState.target[0];
    const e = traceState.target[traceState.target.length - 1];
    tctx.fillStyle = '#FB3705';
    tctx.beginPath(); tctx.arc(s.x, s.y, 11, 0, Math.PI * 2); tctx.fill();
    tctx.fillStyle = '#000';
    tctx.beginPath(); tctx.arc(e.x, e.y, 11, 0, Math.PI * 2); tctx.fill();
  }

  // user path
  if (traceState.points.length > 1){
    tctx.strokeStyle = '#FB3705';
    tctx.lineWidth = 5;
    tctx.lineCap = 'round'; tctx.lineJoin = 'round';
    tctx.beginPath();
    traceState.points.forEach((p, i) => i ? tctx.lineTo(p.x, p.y) : tctx.moveTo(p.x, p.y));
    tctx.stroke();
  }
}
function pointerToCanvas(e){
  const r = traceCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (traceCanvas.width  / r.width),
    y: (e.clientY - r.top)  * (traceCanvas.height / r.height)
  };
}
function onTraceDown(e){
  if (!traceState.running) return;
  e.preventDefault();
  const p = pointerToCanvas(e);
  const start = traceState.target[0];
  if (Math.hypot(p.x - start.x, p.y - start.y) > 50){
    $('#trace-hint').innerHTML = '왼쪽 빨간 점에서 시작하세요';
    return;
  }
  traceCanvas.setPointerCapture(e.pointerId);
  traceState.points = [p];
  traceState.dragging = true;
  drawTraceScene();
}
function onTraceMove(e){
  if (!traceState.running || !traceState.dragging) return;
  const p = pointerToCanvas(e);
  // dedupe consecutive same points
  const last = traceState.points[traceState.points.length - 1];
  if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1){
    traceState.points.push(p);
    drawTraceScene();
  }
}
function onTraceUp(){
  if (!traceState.running || !traceState.dragging) return;
  traceState.dragging = false;
  finishTrace();
}
function finishTrace(){
  traceState.running = false;
  if (traceState.points.length < 8){
    $('#trace-hint').textContent = '경로가 너무 짧습니다 — RESET 후 다시 시도';
    $('#trace-start').disabled = false;
    $('#trace-start').textContent = 'RETRY';
    return;
  }
  const COV_THRESH = 30;
  let totalDev = 0, covered = 0;
  for (const t of traceState.target){
    let minD = Infinity;
    for (const u of traceState.points){
      const d = Math.hypot(t.x - u.x, t.y - u.y);
      if (d < minD) minD = d;
    }
    totalDev += Math.min(minD, 80);
    if (minD < COV_THRESH) covered++;
  }
  const avgDev = totalDev / traceState.target.length;
  const cov    = covered / traceState.target.length * 100;
  const accuracy = Math.max(0, 100 - avgDev * 1.5) * (cov / 100);
  const kg = Math.round(accuracy * 2) * 3;

  $('#trace-cov').textContent = Math.round(cov);
  $('#trace-dev').textContent = avgDev.toFixed(1);
  $('#trace-kg').textContent  = kg;
  $('#trace-start').disabled = false;
  $('#trace-start').textContent = 'RETRY';
  $('#trace-hint').textContent = `완료 · 정확도 ${Math.round(accuracy)}%`;

  STATE.dead = kg;
  updateTotal();
  showNext('#bonus');
}
function startTrace(){
  clearNext();
  generateTraceTarget();
  traceState.points = [];
  traceState.running = true;
  traceState.dragging = false;
  drawTraceScene();
  $('#trace-cov').textContent = '0';
  $('#trace-dev').textContent = '—';
  $('#trace-kg').textContent  = '0';
  $('#trace-start').disabled = true;
  $('#trace-start').textContent = 'RUNNING';
  $('#trace-hint').innerHTML = '왼쪽 끝의 <span class="dot"></span> 에서 시작 → 한 번에 따라 그릴 것';
}
function resetTrace(){
  traceState.points = [];
  traceState.running = false;
  traceState.dragging = false;
  generateTraceTarget();
  drawTraceScene();
  $('#trace-cov').textContent = '0';
  $('#trace-dev').textContent = '—';
  $('#trace-kg').textContent  = '0';
  $('#trace-start').disabled = false;
  $('#trace-start').textContent = 'START';
  $('#trace-hint').innerHTML = 'START → 왼쪽 끝의 <span class="dot"></span> 부터 오른쪽 끝까지 한 번에';
  STATE.dead = 0;
  updateTotal();
}
traceCanvas.addEventListener('pointerdown',  onTraceDown);
traceCanvas.addEventListener('pointermove',  onTraceMove);
traceCanvas.addEventListener('pointerup',    onTraceUp);
traceCanvas.addEventListener('pointercancel', onTraceUp);
$('#trace-start').addEventListener('click', startTrace);
$('#trace-reset').addEventListener('click', resetTrace);
generateTraceTarget();
drawTraceScene();

/* ============================================================
   BONUS / PLATE LOADING
   ============================================================ */
const PLATES = [
  { label: 'PS', name: 'PHOTOSHOP',   kg: 25 },
  { label: 'AI', name: 'ILLUSTRATOR', kg: 20 },
  { label: 'FG', name: 'FIGMA',       kg: 20 },
  { label: 'ID', name: 'INDESIGN',    kg: 15 },
  { label: 'AE', name: 'AFTER FX',    kg: 25 },
  { label: 'PR', name: 'PREMIERE',    kg: 20 },
  { label: 'SK', name: 'SKETCH',      kg: 10 },
  { label: 'FM', name: 'FRAMER',      kg: 10 },
  { label: 'XD', name: 'ADOBE XD',    kg:  5 }
];
const tray = $('#plate-tray');
PLATES.forEach(p => {
  const el = document.createElement('div');
  el.className = 'plate tray-item';
  el.draggable = true;
  el.innerHTML = `<b>${p.label}</b><i>${p.kg}KG</i>`;
  el.addEventListener('dragstart', e => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(p));
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  tray.appendChild(el);
});

const sleeves = ['left', 'right'].map(side => {
  const el = $('#sleeve-' + side);
  const collar = document.createElement('div');
  collar.className = 'bar-collar';
  el.appendChild(collar);
  el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      addPlate(side, data);
    } catch (_) {}
  });
  return { side, el, collar, plates: [] };
});
function addPlate(side, data){
  const s = sleeves.find(x => x.side === side);
  if (s.plates.length >= 5) return;
  const wpx = clamp(80 + data.kg * 2, 90, 140);
  const el = document.createElement('div');
  el.className = 'plate placed';
  el.style.setProperty('--ph', wpx + 'px');
  el.innerHTML = `<b>${data.label}</b><i>${data.kg}KG</i>`;
  el.addEventListener('click', () => {
    el.remove();
    s.plates = s.plates.filter(p => p.el !== el);
    updateRack();
  });
  s.collar.appendChild(el);
  s.plates.push({ kg: data.kg, el });
  updateRack();
}
function updateRack(){
  const left  = sleeves[0].plates.reduce((a, p) => a + p.kg, 0);
  const right = sleeves[1].plates.reduce((a, p) => a + p.kg, 0);
  $('#rack-left').textContent  = left;
  $('#rack-right').textContent = right;
  const total = left + right + 20;
  $('#rack-total').textContent = total;
  STATE.rack = total;
  updateTotal();
  // tilt: heavier side drops (right heavier → +deg → right end down)
  const tilt = clamp((right - left) * 0.3, -12, 12);
  const barEl = document.querySelector('.bar');
  if (barEl) barEl.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
  // any plate loaded → enable Ctrl+S to total
  const anyPlate = sleeves[0].plates.length + sleeves[1].plates.length > 0;
  if (anyPlate) showNext('#total');
  else if (nextSection === '#total') clearNext();
}
$('#rack-clear').addEventListener('click', () => {
  sleeves.forEach(s => { s.collar.innerHTML = ''; s.plates = []; });
  updateRack();
});

/* ============================================================
   COPY RESULT
   ============================================================ */
$('#copy-result').addEventListener('click', async () => {
  const total = STATE.bench + STATE.squat + STATE.dead + STATE.rack;
  const text =
    `DSGNR³ — ${tierFor(total)}\n` +
    `BENCH ${STATE.bench}kg / SQUAT ${STATE.squat}kg / DEAD ${STATE.dead}kg / RACK ${STATE.rack}kg\n` +
    `TOTAL ${total}kg · JUST DO THE WORK.`;
  const btn = $('#copy-result');
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'COPIED ✓';
  } catch (_) {
    window.prompt('아래 내용을 복사하세요', text);
  }
  setTimeout(() => btn.textContent = original, 1500);
});

/* init */
updateTotal();

// ===== respect reduced motion =====
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== 1. Winding ribbon painted on a fixed full-page canvas =====
const ribbonCanvas = document.getElementById('ribbon-canvas');
const rctx = ribbonCanvas.getContext('2d');

let vw = 0, vh = 0;

function resizeRibbon(){
  vw = window.innerWidth;
  vh = window.innerHeight;
  ribbonCanvas.width = vw * devicePixelRatio;
  ribbonCanvas.height = vh * devicePixelRatio;
  ribbonCanvas.style.width = vw + 'px';
  ribbonCanvas.style.height = vh + 'px';
  rctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
}

function ribbonXAt(docY){
  const amp = Math.min(vw * 0.28, 220);
  const period = 900;
  const center = vw / 2;
  return center + Math.sin(docY / period) * amp;
}

function drawRibbon(){
  rctx.clearRect(0,0,vw,vh);
  const scrollY = window.scrollY;
  const step = 12;

  rctx.beginPath();
  let started = false;
  for(let y = -step; y <= vh + step; y += step){
    const docY = scrollY + y;
    const x = ribbonXAt(docY);
    if(!started){ rctx.moveTo(x, y); started = true; }
    else rctx.lineTo(x, y);
  }
  rctx.strokeStyle = 'rgba(123, 97, 255, 0.18)';
  rctx.lineWidth = 26;
  rctx.lineCap = 'round';
  rctx.lineJoin = 'round';
  rctx.stroke();

  rctx.beginPath();
  started = false;
  for(let y = -step; y <= vh + step; y += step){
    const docY = scrollY + y;
    const x = ribbonXAt(docY);
    if(!started){ rctx.moveTo(x, y); started = true; }
    else rctx.lineTo(x, y);
  }
  rctx.setLineDash([2, 18]);
  rctx.strokeStyle = 'rgba(255, 93, 143, 0.35)';
  rctx.lineWidth = 4;
  rctx.stroke();
  rctx.setLineDash([]);
}

let ticking = false;
function onScrollOrResize(){
  if(!ticking){
    requestAnimationFrame(()=>{
      drawRibbon();
      updateCatPosition();
      ticking = false;
    });
    ticking = true;
  }
}

resizeRibbon();
drawRibbon();
window.addEventListener('resize', ()=>{ resizeRibbon(); drawRibbon(); });
window.addEventListener('scroll', onScrollOrResize, { passive:true });

// ===== 2. Floating ambient emoji =====
const floatersEl = document.getElementById('floaters');
if(!prefersReduced){
  const emojis = ['✨','💫','♥','★','🐾'];
  const count = window.innerWidth < 600 ? 8 : 14;
  for(let i=0;i<count;i++){
    const span = document.createElement('span');
    span.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    span.style.left = Math.random()*100 + 'vw';
    span.style.top = (100 + Math.random()*20) + 'vh';
    const duration = 14 + Math.random()*14;
    span.style.animationDuration = duration + 's';
    span.style.animationDelay = (-Math.random()*duration) + 's';
    span.style.fontSize = (1 + Math.random()*1.4) + 'rem';
    floatersEl.appendChild(span);
  }
}

// ===== 3. Scroll-triggered reveal =====
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in-view');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el=>io.observe(el));

document.querySelectorAll('.card-row').forEach((row, i)=>{
  row.style.transitionDelay = (i * 0.05) + 's';
});

// ===== 4. Cat companion: follows scroll, blinks, speaks per-section =====
const catBuddy = document.getElementById('cat-buddy');
const catBubble = document.getElementById('cat-bubble');
const catEyes = document.querySelectorAll('.cat-eye');

const sectionMessages = [
  { id: 'hero', msg: 'hii 🐾' },
  { id: 'reasons', msg: 'all true btw' },
  { id: 'envelope-section', msg: 'open it!' },
  { id: 'poke', msg: 'pet me!' },
  { id: 'finale', msg: 'purrr' }
];

let lastShownSection = null;
function updateCatPosition(){
  catBuddy.classList.add('visible');
  // gently float the cat vertically based on scroll position within viewport band
  const wobble = Math.sin(window.scrollY / 260) * 18;
  catBuddy.style.top = `calc(50% + ${wobble}px)`;

  // figure out which section is most in view, update speech bubble
  const mid = window.scrollY + window.innerHeight * 0.5;
  let current = sectionMessages[0];
  for(const s of sectionMessages){
    const el = document.getElementById(s.id);
    if(!el) continue;
    const top = el.offsetTop;
    if(mid >= top) current = s;
  }
  if(current.id !== lastShownSection){
    lastShownSection = current.id;
    catBubble.textContent = current.msg;
    catBubble.classList.remove('show');
    void catBubble.offsetWidth;
    catBubble.classList.add('show');
    setTimeout(()=> catBubble.classList.remove('show'), 2200);
  }
}
updateCatPosition();

// blink loop
if(!prefersReduced){
  function blinkCat(){
    catEyes.forEach(e=>e.classList.add('blink'));
    setTimeout(()=>{ catEyes.forEach(e=>e.classList.remove('blink')); }, 140);
    setTimeout(blinkCat, 2800 + Math.random()*2600);
  }
  setTimeout(blinkCat, 1800);
}

// ===== 5. Envelope -> letter modal =====
const envelope = document.getElementById('envelope');
const letterModal = document.getElementById('letter-modal');
const letterBackdrop = document.getElementById('letter-backdrop');
const letterClose = document.getElementById('letter-close');

function openLetter(){
  letterModal.classList.add('open');
  document.body.classList.add('modal-locked');
  letterClose.focus();
}
function closeLetter(){
  letterModal.classList.remove('open');
  document.body.classList.remove('modal-locked');
  envelope.focus();
}

envelope.addEventListener('click', openLetter);
letterClose.addEventListener('click', closeLetter);
letterBackdrop.addEventListener('click', closeLetter);
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape' && letterModal.classList.contains('open')){
    closeLetter();
  }
});

// ===== 6. Interactive cat-pet blob =====
const blob = document.getElementById('blob');
const blobFace = document.getElementById('blob-face');
const pokeCounter = document.getElementById('poke-counter');
const faces = ['=^･ω･^=','=^-ω-^=','(=^･^=)','=^ω^=','(=ↀωↀ=)','=^･ｪ･^='];
const reactions = [
  "purrrr", "she likes that", "again? okay twist my paw",
  "getting sleepy...", "best pets all week", "you're her favorite now",
  "she's not moving, ever", "achievement: professional cat petter"
];
let pokeCount = 0;

blob.addEventListener('click', ()=>{
  pokeCount++;
  blob.classList.remove('squish');
  void blob.offsetWidth;
  blob.classList.add('squish');
  blobFace.textContent = faces[pokeCount % faces.length];
  pokeCounter.textContent = `pets: ${pokeCount} — ${reactions[Math.min(pokeCount-1, reactions.length-1)]}`;
});

// ===== 7. Confetti finale =====
const confettiCanvas = document.getElementById('confetti-canvas');
const cctx = confettiCanvas.getContext('2d');
const confettiBtn = document.getElementById('confetti-btn');
let confettiPieces = [];
let confettiRunning = false;

function sizeConfettiCanvas(){
  const rect = confettiCanvas.parentElement.getBoundingClientRect();
  confettiCanvas.width = rect.width * devicePixelRatio;
  confettiCanvas.height = rect.height * devicePixelRatio;
  confettiCanvas.style.width = rect.width + 'px';
  confettiCanvas.style.height = rect.height + 'px';
  cctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  return rect;
}

const confettiColors = ['#FF5D8F','#FFB84C','#7B61FF','#FFF6E9'];

function launchConfetti(){
  const rect = sizeConfettiCanvas();
  const count = prefersReduced ? 0 : 140;
  confettiPieces = [];
  for(let i=0;i<count;i++){
    confettiPieces.push({
      x: rect.width/2 + (Math.random()-0.5)*80,
      y: rect.height*0.35,
      vx: (Math.random()-0.5)*10,
      vy: -(Math.random()*9 + 4),
      size: 5 + Math.random()*6,
      color: confettiColors[Math.floor(Math.random()*confettiColors.length)],
      rot: Math.random()*360,
      vrot: (Math.random()-0.5)*14,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    });
  }
  if(!confettiRunning){
    confettiRunning = true;
    requestAnimationFrame(animateConfetti);
  }
}

function animateConfetti(){
  const rect = confettiCanvas.getBoundingClientRect();
  cctx.clearRect(0,0,rect.width,rect.height);
  let alive = false;
  confettiPieces.forEach(p=>{
    p.vy += 0.28;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
    if(p.y < rect.height + 40) alive = true;

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot * Math.PI/180);
    cctx.fillStyle = p.color;
    if(p.shape === 'rect'){
      cctx.fillRect(-p.size/2, -p.size/3, p.size, p.size*0.66);
    } else {
      cctx.beginPath();
      cctx.arc(0,0,p.size/2,0,Math.PI*2);
      cctx.fill();
    }
    cctx.restore();
  });

  if(alive){
    requestAnimationFrame(animateConfetti);
  } else {
    confettiRunning = false;
    cctx.clearRect(0,0,rect.width,rect.height);
  }
}

confettiBtn.addEventListener('click', launchConfetti);
window.addEventListener('resize', ()=>{ if(confettiRunning) sizeConfettiCanvas(); });

const finaleEl = document.getElementById('finale');
const finaleIo = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      setTimeout(launchConfetti, 400);
      finaleIo.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
finaleIo.observe(finaleEl);

window.addEventListener('load', ()=>{ resizeRibbon(); drawRibbon(); updateCatPosition(); });

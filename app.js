/* app.js - extracted from index.html
   Handles typing effect, heart spawn, and response animations
*/
'use strict';

/* ---------- ข้อความหลักที่จะแสดงแบบพิมพ์ทีละตัว ---------- */
// มีหลายเวอร์ชันของข้อความเพื่อให้รู้สึกตั้งใจและหลากหลาย (เลือกสุ่ม)
const introVariants = [
  ['เค้าอาจไม่เก่งเรื่องหวาน ๆ','แต่เค้ารักเธอมากจริง ๆนะ 🤍'],
  ['บางทีเค้าพูดไม่เก่ง แต่ทุกครั้งที่คิดถึงเธอใจจะพอง','เค้ารักเธอเสมอ 🥰'],
  ['ขอเป็นคนที่อยู่ข้างเธอเสมอ','รักเธอนะ... มากกว่าที่คำพูดจะบอกได้ ✨'],
  ['ไม่มีวันไหนที่เค้าไม่คิดถึงเธอ','ขอให้เธอมีความสุขกับความรักของเรา 🤍']
];

const messageEl = document.getElementById('message');

// Typewriter-like effect (soft & slow)
async function typeLines(lines, opts = {}){
  const {charDelay = 40, lineDelay = 600} = opts;
  messageEl.textContent = '';

  for (let i = 0; i < lines.length; i++){
    const line = lines[i];
    for (let j = 0; j < line.length; j++){
      messageEl.textContent += line[j];
      await new Promise(r => setTimeout(r, charDelay));
    }
    if (i < lines.length - 1) {
      messageEl.textContent += '\n';
      await new Promise(r => setTimeout(r, lineDelay));
    }
  }
  // small breathing effect after typing
  messageEl.style.opacity = 1;
}

// Start typing after small pause so page feels intentional (เลือกข้อความสุ่ม)
const chosenIntro = introVariants[Math.floor(Math.random() * introVariants.length)];
setTimeout(()=> typeLines(chosenIntro, {charDelay:42, lineDelay:550}), 650);

/* ---------- Heart float effect when pressing a button ---------- */
const heartsContainer = document.getElementById('hearts');

function spawnHeart(xPercent){
  const heart = document.createElement('div');
  heart.className = 'heart show-heart';
  // create heart SVG inside the div
  heart.innerHTML = `
    <svg viewBox="0 0 24 24" width="28" height="28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#ff3b55" d="M12 21s-7.3-4.8-9.2-7.1C-0.4 9.8 3.6 4 8 6.4 10 7.6 12 10 12 10s2-2.4 4-3.6c4.4-2.4 8.4 3.4 5.2 7.5C19.3 16.2 12 21 12 21z"/>
    </svg>`;

  // Place horizontally by percent of container width
  const pct = xPercent || (20 + Math.random() * 60); // 20% to 80%
  heart.style.left = pct + '%';
  heart.style.bottom = (10 + Math.random() * 6) + '%';
  heartsContainer.appendChild(heart);

  // remove after animation finishes
  setTimeout(()=> heart.remove(), 1900);
}

/* ---------- Response message and small animation ---------- */
const responseEl = document.getElementById('response');

function showResponse(text){
  // show the bubble with typed effect
  responseEl.style.display = 'block';
  responseEl.textContent = '';

  // simple typed reveal for response
  let i = 0;
  const speed = 36;
  const id = setInterval(()=>{
    responseEl.textContent += text[i++] || '';
    if (i >= text.length){ clearInterval(id); }
  }, speed);

  // subtle pulse
  responseEl.animate([
    { transform: 'scale(.98)', opacity: 0.92 },
    { transform: 'scale(1)', opacity: 1 }
  ],{ duration: 360, easing: 'cubic-bezier(.2,.9,.2,1)' });
}

// Buttons
const btnLove = document.getElementById('btn-love');
const btnShy = document.getElementById('btn-shy');

function handleClick(kind){
  // spawn a few hearts staggered
  for (let i=0;i<6;i++){
    setTimeout(()=> spawnHeart(20 + Math.random()*60), i*110);
  }

// response text depending on button (เลือกข้อความสุ่มจากหลายตัว)
      if (kind === 'love'){
        const text = loveResponses[Math.floor(Math.random()*loveResponses.length)];
        showResponse(text);
      } else {
        const text = shyResponses[Math.floor(Math.random()*shyResponses.length)];
        showResponse(text);
  }

  // small bear wiggle (select the SVG) for delight
  const bear = document.querySelector('.bear-sticker');
  if (bear){
    bear.animate([
      { transform: 'translateY(0) rotate(0deg)' },
      { transform: 'translateY(-8px) rotate(-4deg)' },
      { transform: 'translateY(0) rotate(0deg)' }
    ],{ duration: 640, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }

  // gentle haptic-style press by scaling the main card
  document.querySelector('.card').animate([{ transform: 'scale(1)' },{ transform: 'scale(.998)' },{ transform: 'scale(1)' }], { duration: 220 });
}

btnLove.addEventListener('click', ()=> handleClick('love'));
btnShy.addEventListener('click', ()=> handleClick('shy'));

// Accessibility: allow keyboard activation
btnLove.addEventListener('keyup', (e)=> { if (e.key === 'Enter' || e.key === ' ') handleClick('love'); });
btnShy.addEventListener('keyup', (e)=> { if (e.key === 'Enter' || e.key === ' ') handleClick('shy'); });

/* ---------- Small friendly tip: clicking multiple times still feels nice ---------- */
// Limit rapid spamming visual overload by small debounce
let lastClick = 0;
document.querySelectorAll('.btn').forEach(b=>{
  b.addEventListener('click', (ev)=>{
    const t = Date.now();
    if (t - lastClick < 200) ev.preventDefault();
    lastClick = t;
  });
});

/* End of script - มี comment อธิบายแต่ละส่วนเพื่อให้อ่านง่าย */

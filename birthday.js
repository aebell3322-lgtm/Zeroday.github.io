/* birthday.js
   Mobile-first birthday page interactions
   - Try to load images from /photo and audio from /song (common filenames)
   - Fallback to inline cake SVG and allow user to pick files
   - Play music on user action (browsers generally require gesture)
   - Cute confetti + heart spawn on button press
*/
'use strict';

const photoWrap = document.getElementById('photoWrap');
const photoInput = document.getElementById('photoInput');
const audioInput = document.getElementById('audioInput');
const playBtn = document.getElementById('btn-music');
const sendBtn = document.getElementById('btn-send');
const bdayMsg = document.getElementById('bdayMessage');
const audioEl = document.getElementById('bgAudio');
const confettiWrap = document.getElementById('confetti-wrap');
const hearts = document.getElementById('floating');

// Generate a broader list of likely filenames in photo/ and song/ folders (1..12 with common extensions)
function generateCandidates(prefix, names){
  const exts = ['png','jpg','jpeg','webp','gif'];
  const nums = Array.from({length:12}, (_,i)=>String(i+1));
  const out = [];
  // explicit friendly names
  names.forEach(n => out.push(`${prefix}/${n}`));
  // numbered files
  nums.forEach(n=> exts.forEach(e=> out.push(`${prefix}/${n}.${e}`)));
  // plain names like 1.png -> 12.png etc
  return out;
}
const photoCandidates = generateCandidates('photo',['bear.png','cake.png','balloons.png','sticker.png','bear.jpg','cake.jpg','sweet.png','IMG_1452.gif']);
const audioCandidates = ['song/Zeroday01.mp3','song/love.mp3','song/happy.mp3','song/hbd.mp3','song/song.mp3','song/happy-birthday.mp3','song/1.mp3','song/01.mp3'];
// Also try a few mp3 alternatives (include 'love')
['1','2','3','happy','melody','love'].forEach(n=> audioCandidates.push(...['mp3','m4a'].map(ext=> `song/${n}.${ext}`)));


function tryLoadImageList(list){
  return new Promise((resolve)=>{
    let done = false;
    list.forEach(path=>{
      const img = new Image();
      img.src = path;
      img.onload = ()=>{ if (!done){ done = true; resolve({type:'img', src:path, el:img}); }};
      img.onerror = ()=>{};
    });
    // if none load after short timeout, resolve null
    setTimeout(()=>{ if (!done) resolve(null); }, 700);
  });
}

function tryLoadAudioList(list){
  return new Promise((resolve)=>{
    let done = false;
    list.forEach(path=>{
      const a = document.createElement('audio');
      a.src = path;
      // try to load metadata; success means file exists
      a.addEventListener('canplaythrough', ()=>{ if (!done){ done = true; resolve({type:'audio', src:path, el:a}); }} , { once:true });
      a.addEventListener('error', ()=>{});
    });
    setTimeout(()=>{ if (!done) resolve(null); }, 900);
  });
}

// If external photo exists, use it; otherwise keep inline SVG or let user upload
async function initPhoto(){
  const found = await tryLoadImageList(photoCandidates);
  if (found){
    photoWrap.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'heart-mask';
    const img = document.createElement('img');
    img.src = found.src;
    img.alt = 'รูปน่ารัก';
    img.className = 'birthday-img';
    wrapper.appendChild(img);
    photoWrap.appendChild(wrapper);

    // add a small toggle to switch between heart/shaped and rounded
    const toggle = document.createElement('button');
    toggle.textContent = 'จัสมินสุดสวย';
    toggle.className = 'btn secondary';
    toggle.style.marginTop = '8px';
    toggle.addEventListener('click', ()=>{
      wrapper.classList.toggle('rounded');
      toggle.textContent = wrapper.classList.contains('rounded') ? 'จัสมินน่ารัก' : 'จัสมินสุดสวย';
    });
    photoWrap.appendChild(toggle);
  } else {
    // attach click to allow user to choose their own photo; created wrapped image on selection
    photoWrap.style.cursor = 'pointer';
    photoWrap.addEventListener('click', ()=> photoInput.click());
  }
}  

photoInput.addEventListener('change', (e)=>{
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  photoWrap.innerHTML = '';
  const wrapper = document.createElement('div'); wrapper.className='heart-mask';
  const img = document.createElement('img');
  img.src = url; img.alt='รูปที่เลือก'; img.className='birthday-img';
  wrapper.appendChild(img);
  photoWrap.appendChild(wrapper);
  // add toggle
  const toggle = document.createElement('button');
  toggle.textContent = 'จัสมินสุดสวย';
  toggle.className = 'btn secondary';
  toggle.style.marginTop = '8px';
  toggle.addEventListener('click', ()=>{
    wrapper.classList.toggle('rounded');
    toggle.textContent = wrapper.classList.contains('rounded') ? 'จัสมินน่ารัก' : 'จัสมินสุดสวย';
  });
  photoWrap.appendChild(toggle);
});



// Audio init: try Zeroday01.mp3 first, then fall back to candidate files; show file picker via overlay if needed
async function initAudio(){
  // prefer the exact file the user requested
  let found = await tryLoadAudioList(['song/Zeroday01.mp3']);
  if (!found){
    found = await tryLoadAudioList(audioCandidates);
  }

  if (found){
    audioEl.src = found.src;
    audioEl.loop = true;
    audioEl.volume = 0.9;
    // try immediate play; if blocked, overlay will prompt user
    try { await audioEl.play(); } catch (e) { /* autoplay blocked; overlay will appear below */ }
  } else {
    // no candidate -> let user pick a file via the overlay/file input
    audioInput.addEventListener('change', (e)=>{
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      audioEl.src = URL.createObjectURL(f);
      audioEl.loop = true; audioEl.volume = 0.9;
      audioEl.play().catch(()=>{});
    });
  }

  // Attempt autoplay (many mobiles block audible autoplay). If blocked or no source, show overlay prompting user.
  setTimeout(async ()=>{
    const overlay = document.getElementById('musicOverlay');
    const overlayBtn = document.getElementById('overlayPlay');

    // If no song found yet, prompt user to select one
    if (!audioEl.src){
      if (overlay && overlayBtn){
        overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden','false');
        overlayBtn.addEventListener('click', ()=> audioInput.click(), { once:true });
      }
      return;
    }

    try{
      await audioEl.play();
      // played successfully
    }catch(err){
      // autoplay blocked -> show overlay with a play button
      if (overlay && overlayBtn){
        overlay.style.display = 'flex'; overlay.setAttribute('aria-hidden','false');
        overlayBtn.addEventListener('click', ()=>{
          audioEl.play().then(()=>{
            overlay.style.display='none'; overlay.setAttribute('aria-hidden','true');
          }).catch(()=>{});
        },{ once:true });
      }
    }
  }, 300);
} 

// If the optional play button exists, preserve its behavior (it's removed from the UI by default)
if (playBtn){
  playBtn.addEventListener('click', ()=>{
    if (!audioEl.src){
      // handled by initAudio to open file dialog if needed
      // but if no src and no file picked, give a hint
      if (!audioEl.src){ audioInput.click(); }
      return;
    }
    if (audioEl.paused){
      audioEl.play().then(()=>{ if (playBtn) playBtn.textContent = 'หยุดเพลง ⏸️'; }).catch(()=>{ /* autoplay blocked */ if (playBtn) playBtn.textContent='เล่นเพลง 🎵'; });
    } else { audioEl.pause(); if (playBtn) playBtn.textContent = 'เล่นเพลง 🎵'; }
  });
} 

// message for birthday love note (fixed per request)
const bmessages = [
  'Happy Birthday 🎂🎉\nอยู่กับเค้าไปนาน ๆ นะบี้ ขอให้สุขภาพแข็งแรง เค้ารักบี้นะ 😝🤍'
];

// typing effect for birthday message
async function showBirthdayMessage(){
  const lines = bmessages[Math.floor(Math.random()*bmessages.length)].split('\n');
  bdayMsg.textContent = '';
  for (let i=0;i<lines.length;i++){
    const line = lines[i];
    for (let j=0;j<line.length;j++){
      bdayMsg.textContent += line[j];
      await new Promise(r=> setTimeout(r, 36));
    }
    if (i < lines.length-1){ bdayMsg.textContent += '\n'; await new Promise(r=> setTimeout(r, 460)); }
  }
}

// small confetti burst
function spawnConfetti(x,y){
  const count = 22;
  for (let i=0;i<count;i++){
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background = ['#ff9aa2','#ffd6e0','#ffd1b3','#cdeef6','#fbe8ff'][Math.floor(Math.random()*5)];
    const size = 6 + Math.random()*10;
    el.style.width = size + 'px'; el.style.height = (size*1.2)+'px';
    el.style.left = (x + (Math.random()*40-20)) + 'px';
    el.style.top = (y) + 'px';
    el.style.opacity = 0.95;
    confettiWrap.appendChild(el);

    const dur = 1000 + Math.random()*900;
    el.animate([
      { transform: `translateY(0) rotate(${Math.random()*360}deg)`, opacity:1 },
      { transform: `translateY(${200 + Math.random()*120}px) rotate(${Math.random()*720}deg)`, opacity:0 }
    ],{ duration: dur, easing: 'cubic-bezier(.2,.7,.2,1)' });

    setTimeout(()=> el.remove(), dur+80);
  }
}

// spawn hearts; if x,y are provided (pixels relative to the floating container) spawn from there, otherwise random
// now supports a duration (ms) so hearts can linger longer (e.g., 60000 ms)
function spawnHearts(x, y, count = 8, duration = 2200){
  for (let i = 0; i < count; i++){
    setTimeout(()=>{
      const heart = document.createElement('div');
      heart.className = 'heart';
      heart.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="#ff3b55" d="M12 21s-7.3-4.8-9.2-7.1C-0.4 9.8 3.6 4 8 6.4 10 7.6 12 10 12 10s2-2.4 4-3.6c4.4-2.4 8.4 3.4 5.2 7.5C19.3 16.2 12 21 12 21z"/></svg>';

      // position either at given coords (px) or randomized percent
      if (typeof x === 'number' && typeof y === 'number'){
        heart.style.left = (x + (Math.random()*28 - 14)) + 'px';
        heart.style.top = (y + (Math.random()*20 - 8)) + 'px';
      } else {
        heart.style.left = (20 + Math.random()*60) + '%';
        heart.style.bottom = (10 + Math.random()*6) + '%';
      }

      hearts.appendChild(heart);

      // quick pop animation, then let the CSS float animation take over
      heart.animate([
        { transform: 'translate(-50%,0) scale(.7)', opacity: 0 },
        { transform: 'translate(-50%,0) scale(1.08)', opacity: 1 }
      ], { duration: 160, easing: 'cubic-bezier(.2,.9,.2,1)' });

      // start float after the pop for smoother effect
      setTimeout(()=> heart.classList.add('show-heart'), 160);

      // if duration is long, also add a helper class to lengthen the float animation
      if (duration > 10000){ heart.classList.add('long'); }

      // remove after the specified duration (so hearts can linger up to 60s)
      setTimeout(()=> heart.remove(), duration);
    }, i * 60);
  }
} 

// main send action: confetti, hearts, show message, and play audio
sendBtn.addEventListener('click', async (ev)=>{
  // show newly typed message
  await showBirthdayMessage();
  // spawn confetti near center
  const rect = sendBtn.getBoundingClientRect();
  const x = rect.left + rect.width/2;
  const y = rect.top - 20;
  spawnConfetti(x,y);
  // burst hearts from the button location (linger 10 minutes)
  const containerRect = hearts.getBoundingClientRect();
  const hx = rect.left + rect.width/2 - containerRect.left;
  const hy = rect.top + rect.height/2 - containerRect.top;
  spawnHearts(hx, hy, 80, 600000);
  // try to play audio if loaded
  if (audioEl.src && audioEl.paused){
    audioEl.play().catch(()=>{});
    if (playBtn) playBtn.textContent = 'หยุดเพลง ⏸️';
  }
  // create downloadable images (PNG + GIF)
  createAssets();
});

// Create PNG + GIF of the card and provide downloads (client-side)
// Uses html2canvas and gif.js (loaded from CDN). Creates a PNG and a small GIF made of two frames.
async function createAssets(){
  const dl = document.getElementById('downloadLinks');
  if (!dl) return;
  dl.style.display = 'block';
  dl.textContent = 'กำลังสร้างรูป... โปรดรอสักครู่';

  if (typeof html2canvas === 'undefined' || typeof GIF === 'undefined'){
    dl.textContent = 'ไม่พบไลบรารีที่จำเป็น (html2canvas / gif.js)';
    return;
  }

  const card = document.querySelector('.card');
  try{
    // capture first frame
    const canvas1 = await html2canvas(card, {useCORS:true, backgroundColor:null, scale:1});
    let pngBlob = null, gifBlob = null;
    // create PNG blob and keep it for saving; do not expose direct download links here per preference
    canvas1.toBlob((blob)=>{
      pngBlob = blob;
      dl.innerHTML = '';
      const status = document.createElement('div');
      status.textContent = 'รูปพร้อมสำหรับบันทึก';
      status.style.color = '#6b5560';
      status.style.margin = '8px';
      dl.appendChild(status);
    }, 'image/png');

    // prepare GIF with two frames (normal + pulse)
    const gif = new GIF({workers:2, quality:10, workerScript:'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'});
    gif.addFrame(canvas1, {delay:200});

    card.classList.add('gif-pulse');
    await new Promise(r=> setTimeout(r, 120));
    const canvas2 = await html2canvas(card, {useCORS:true, backgroundColor:null, scale:1});
    card.classList.remove('gif-pulse');

    gif.addFrame(canvas2, {delay:300});

    gif.on('finished', async (blob)=>{
      gifBlob = blob;
      // hide direct download links; show a concise status and the Save-to-folder button only
      dl.innerHTML = '';
      const status = document.createElement('div');
      status.textContent = 'ไฟล์พร้อมสำหรับบันทึก';
      status.style.color = '#6b5560';
      status.style.margin = '6px';
      dl.appendChild(status);

      // Add a save to folder button that writes both files into a chosen folder (uses Directory Picker when available)
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn';
      saveBtn.style.margin = '8px';
      saveBtn.textContent = 'บันทึกลงโฟลเดอร์ (photo)';
      saveBtn.addEventListener('click', async ()=>{
        // ensure blobs are ready
        if (!pngBlob || !gifBlob){ alert('กำลังประมวลผลไฟล์ โปรดลองอีกครั้ง'); return; }
        const ok = await saveBlobsToDirectory([
          { blob: pngBlob, name: 'loveset.png' },
          { blob: gifBlob, name: 'loveset.gif' }
        ]);
        if (ok){ alert('บันทึกไฟล์เรียบร้อย'); }
      });
      dl.appendChild(saveBtn);
    });

    gif.render();
  }catch(err){
    console.error(err);
    // clear status quietly (no visible error text per preference)
    if (dl) dl.innerHTML = '';
  }
}

// Attempt to save blobs into a user-selected directory (uses showDirectoryPicker when available)
async function saveBlobsToDirectory(files){
  if (window.showDirectoryPicker){
    try{
      const dir = await window.showDirectoryPicker();
      for (const f of files){
        const fh = await dir.getFileHandle(f.name, { create: true });
        const writable = await fh.createWritable();
        await writable.write(f.blob);
        await writable.close();
      }
      return true;
    }catch(e){ console.error(e); return false; }
  }
  // fallback: save each file via showSaveFilePicker or download
  for (const f of files){ await saveBlobToFile(f.blob, f.name); }
  return true;
}

async function saveBlobToFile(blob, filename){
  if (window.showSaveFilePicker){
    try{
      const handle = await window.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'Image', accept: { 'image/*': ['.'+filename.split('.').pop()] } }] });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    }catch(e){ console.error(e); return false; }
  }
  // fallback to a standard download
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  return true;
} 

// init on load
window.addEventListener('load', ()=>{
  initPhoto();
  initAudio();
});

// small accessibility: allow tapping the card to play/pause audio
document.querySelector('.card').addEventListener('dblclick', ()=>{
  if (audioEl.src){ if (audioEl.paused) audioEl.play().catch(()=>{}); else audioEl.pause(); }
});
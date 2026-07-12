// ---------- background scaffolding, injected on every page ----------
function mountBackgroundLayers(){
  const layers = document.createElement('div');
  layers.innerHTML = `
    <div class="bg"></div>
    <div class="blob b1"></div>
    <div class="blob b2"></div>
    <div class="blob b3"></div>
    <div class="grain"></div>
    <div class="spotlight" id="spotlight"></div>
    <div class="sparkles" id="sparkles"></div>
  `;
  document.body.prepend(...layers.childNodes);
}

// ---------- cursor spotlight ----------
function initSpotlight(){
  const spotlight = document.getElementById('spotlight');
  if(!spotlight) return;
  window.addEventListener('mousemove', (e)=>{
    spotlight.style.setProperty('--x', e.clientX + 'px');
    spotlight.style.setProperty('--y', e.clientY + 'px');
  });
}

// ---------- hero 3D tilt ----------
function initHeroTilt(){
  const hero = document.querySelector('.hero');
  if(!hero) return;
  hero.addEventListener('mousemove', (e)=>{
    const r = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    hero.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateZ(0)`;
  });
  hero.addEventListener('mouseleave', ()=>{
    hero.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
  });
}

// ---------- floating sparkles ----------
function initSparkles(count = 24){
  const layer = document.getElementById('sparkles');
  if(!layer) return;
  for(let i=0;i<count;i++){
    const s = document.createElement('div');
    s.className = 'sparkle';
    const size = Math.random()*2.5 + 1;
    s.style.width = size+'px';
    s.style.height = size+'px';
    s.style.left = Math.random()*100 + 'vw';
    s.style.bottom = (Math.random()*20 - 20) + 'px';
    s.style.animationDuration = (Math.random()*10 + 10) + 's';
    s.style.animationDelay = (Math.random()*10) + 's';
    layer.appendChild(s);
  }
}

// ---------- ripple on interactive elements ----------
function initRipples(){
  document.querySelectorAll('.site-nav a, .crypto-btn, .contact-row a.action').forEach(el=>{
    el.addEventListener('click', function(e){
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple-el';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      this.appendChild(ripple);
      setTimeout(()=>ripple.remove(), 650);
    });
  });
}

// ---------- donate crypto wallets: click to copy address (only present on donate.html) ----------
function initDonateSelector(){
  const cryptoBtns = document.querySelectorAll('.crypto-btn');
  const hint = document.getElementById('copyHint');
  if(!cryptoBtns.length) return;

  cryptoBtns.forEach(btn=>{
    const labelEl = btn.querySelector('.crypto-label');
    const originalLabel = labelEl ? labelEl.textContent : '';

    btn.addEventListener('click', async ()=>{
      const address = btn.dataset.address;
      try{
        await navigator.clipboard.writeText(address);
      }catch(err){
        // fallback for browsers without clipboard API access
        const ta = document.createElement('textarea');
        ta.value = address;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      btn.classList.add('copied');
      if(labelEl) labelEl.textContent = 'Скопировано!';
      if(hint){
        hint.textContent = `адрес ${originalLabel} скопирован в буфер`;
        hint.classList.add('active');
      }

      setTimeout(()=>{
        btn.classList.remove('copied');
        if(labelEl) labelEl.textContent = originalLabel;
        if(hint){
          hint.textContent = 'нажми на кошелёк — адрес скопируется';
          hint.classList.remove('active');
        }
      }, 1600);
    });
  });
}

// ---------- highlight active nav link based on current page ----------
function markActiveNav(){
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a').forEach(a=>{
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === current);
  });
}

// ---------- soft navigation: swap page content without a full reload ----------
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function navigateTo(absoluteUrl, push){
  const current = document.querySelector('.panel');
  if(!current) { window.location.href = absoluteUrl; return; }

  try{
    const res = await fetch(absoluteUrl);
    if(!res.ok) throw new Error('bad response');
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const incoming = doc.querySelector('.panel');
    if(!incoming) throw new Error('no panel found');

    // fade the current panel out
    current.classList.add('panel-fade-out');
    await sleep(150);

    const imported = document.importNode(incoming, true);
    current.parentNode.replaceChild(imported, current);

    document.title = doc.title || document.title;

    if(push){
      history.pushState({ url: absoluteUrl }, '', absoluteUrl);
    }

    markActiveNav();
    initRipples();
    initDonateSelector();
    window.scrollTo({ top: 0, behavior:'smooth' });

  }catch(err){
    // any failure (e.g. opened via file:// where fetch of local files is blocked) -> normal navigation
    window.location.href = absoluteUrl;
  }
}

function initSoftNavigation(){
  document.querySelectorAll('.site-nav a, .logo').forEach(link=>{
    link.addEventListener('click', (e)=>{
      const href = link.getAttribute('href');
      if(!href || href.startsWith('#') || href.startsWith('http') || link.target === '_blank') return;

      const target = new URL(href, window.location.href).href;
      if(target === window.location.href) { e.preventDefault(); return; }

      e.preventDefault();
      navigateTo(target, true);
    });
  });

  // keep the initial history entry navigable via back/forward
  history.replaceState({ url: window.location.href }, '', window.location.href);

  window.addEventListener('popstate', (e)=>{
    const url = (e.state && e.state.url) || window.location.href;
    navigateTo(url, false);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  mountBackgroundLayers();
  markActiveNav();
  initSpotlight();
  initHeroTilt();
  initSparkles();
  initRipples();
  initDonateSelector();
  initSoftNavigation();
});

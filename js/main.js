/**
 * HNBC Software Solutions Pvt Ltd
 * Main JavaScript — handles all shared page functionality
 */
(function () {
  'use strict';

  /* ─── Dark Mode ──────────────────────────────────── */
  function initDarkMode() {
    const toggles = document.querySelectorAll('#darkToggle, #dark-toggle');
    const html = document.documentElement;
    const stored = localStorage.getItem('hnbc-theme');
    if (stored === 'dark') {
      html.setAttribute('data-theme', 'dark');
      toggles.forEach(t => { if (t) t.textContent = '☀️'; });
    }
    toggles.forEach(toggle => {
      if (!toggle) return;
      toggle.addEventListener('click', () => {
        const isDark = html.getAttribute('data-theme') === 'dark';
        html.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('hnbc-theme', isDark ? 'light' : 'dark');
        toggles.forEach(t => { t.textContent = isDark ? '🌙' : '☀️'; });
      });
    });
  }

  /* ─── Navbar ─────────────────────────────────────── */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    function onScroll() { navbar.classList.toggle('scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── Mobile Menu ────────────────────────────────── */
  function initMobileMenu() {
    const openBtn  = document.getElementById('menuToggle')  || document.getElementById('hamburger');
    const closeBtn = document.getElementById('menuClose');
    const menu     = document.getElementById('mobileMenu')  || document.getElementById('mobile-menu');
    if (!openBtn || !menu) return;
    openBtn.addEventListener('click', () => { menu.classList.add('open'); openBtn.setAttribute('aria-expanded','true'); });
    if (closeBtn) closeBtn.addEventListener('click', () => { menu.classList.remove('open'); openBtn.setAttribute('aria-expanded','false'); });
    document.addEventListener('click', e => {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !openBtn.contains(e.target)) {
        menu.classList.remove('open'); openBtn.setAttribute('aria-expanded','false');
      }
    });
  }

  /* ─── Back-to-top ────────────────────────────────── */
  function initBackToTop() {
    const btn = document.getElementById('backToTop') || document.getElementById('back-top');
    if (!btn) return;
    window.addEventListener('scroll', () => { btn.classList.toggle('show', window.scrollY > 400); }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─── Scroll Animations ──────────────────────────── */
  function initScrollAnimations() {
    const els = document.querySelectorAll('.animate-on-scroll, .fade-up');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible','in-view'); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ─── Counters ───────────────────────────────────── */
  function animateCounter(el, target, suffix) {
    let start = null; const dur = 1800;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor((1 - Math.pow(1-p,3)) * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function initCounters() {
    const els = document.querySelectorAll('[data-count],[data-counter]');
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          animateCounter(el, +(el.dataset.count || el.dataset.counter || 0), el.dataset.suffix || '');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    els.forEach(el => io.observe(el));
  }

  /* ─── Hero Particles ─────────────────────────────── */
  function initParticles() {
    const canvas = document.getElementById('heroCanvas') || document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];
    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
    window.addEventListener('resize', resize); resize();
    function Particle() { this.reset(); }
    Particle.prototype.reset = function() { this.x=Math.random()*W; this.y=Math.random()*H; this.r=Math.random()*1.5+.5; this.vx=(Math.random()-.5)*.4; this.vy=(Math.random()-.5)*.4; this.alpha=Math.random()*.5+.1; };
    Particle.prototype.update = function() { this.x+=this.vx; this.y+=this.vy; if(this.x<0||this.x>W||this.y<0||this.y>H) this.reset(); };
    Particle.prototype.draw = function() { ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fillStyle=`rgba(0,194,255,${this.alpha})`; ctx.fill(); };
    for (let i=0;i<120;i++) particles.push(new Particle());
    function loop() {
      ctx.clearRect(0,0,W,H);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i=0;i<particles.length;i++) for (let j=i+1;j<particles.length;j++) {
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y, d=Math.sqrt(dx*dx+dy*dy);
        if(d<100){ctx.beginPath();ctx.strokeStyle=`rgba(0,194,255,${(1-d/100)*.12})`;ctx.lineWidth=.5;ctx.moveTo(particles[i].x,particles[i].y);ctx.lineTo(particles[j].x,particles[j].y);ctx.stroke();}
      }
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ─── Mega Menu ──────────────────────────────────── */
  function initMegaMenu() {
    document.querySelectorAll('.mega-menu-trigger').forEach(trigger => {
      const menu = trigger.querySelector('.mega-menu'); if (!menu) return;
      let t;
      trigger.addEventListener('mouseenter', () => { clearTimeout(t); menu.classList.add('open'); });
      trigger.addEventListener('mouseleave', () => { t = setTimeout(() => menu.classList.remove('open'), 150); });
    });
  }

  /* ─── Toast ──────────────────────────────────────── */
  function showToast(msg, type) {
    const c = { success:'#00c853', error:'#d32f2f', info:'#0B3D91', warning:'#f57c00' };
    const d = document.createElement('div');
    d.textContent = msg; d.setAttribute('role','alert');
    d.style.cssText = `position:fixed;top:90px;right:24px;z-index:9999;padding:14px 24px;border-radius:10px;font-weight:500;font-size:.9rem;max-width:360px;box-shadow:0 10px 40px rgba(0,0,0,.2);background:${c[type]||c.info};color:#fff;opacity:0;transform:translateY(-8px);transition:opacity .3s,transform .3s;font-family:'Inter',sans-serif;`;
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity='1'; d.style.transform='translateY(0)'; });
    setTimeout(() => { d.style.opacity='0'; setTimeout(()=>d.remove(),300); }, 4000);
  }
  window.showToast = showToast;

  /* ─── Form helpers ────────────────────────────────── */
  function showFieldError(field, msg) {
    field.classList.add('input-error');
    const p = document.createElement('p');
    p.className = 'field-error'; p.textContent = msg;
    p.style.cssText = 'color:#ef4444;font-size:.8rem;margin-top:4px;';
    field.parentNode.appendChild(p);
  }
  function clearErrors() {
    document.querySelectorAll('.field-error').forEach(e=>e.remove());
    document.querySelectorAll('.input-error').forEach(e=>e.classList.remove('input-error'));
  }

  /* ─── Contact Form ───────────────────────────────── */
  function initContactForm() {
    const form = document.getElementById('contactForm') || document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault(); clearErrors();
      const name    = form.querySelector('[name="name"],[id="name"]');
      const email   = form.querySelector('[name="email"],[id="email"]');
      const message = form.querySelector('[name="message"],[id="message"]');
      let valid = true;
      if (name && name.value.trim().length < 2) { showFieldError(name,'Please enter your full name.'); valid=false; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { showFieldError(email,'Please enter a valid email.'); valid=false; }
      if (message && message.value.trim().length < 10) { showFieldError(message,'Message must be at least 10 characters.'); valid=false; }
      if (!valid) return;
      const btn = form.querySelector('[type="submit"]');
      const orig = btn.innerHTML; btn.innerHTML='<span>Sending…</span>'; btn.disabled=true;
      try {
        let recaptchaToken = '';
        if (window.grecaptcha) {
          try { recaptchaToken = await grecaptcha.execute(form.dataset.sitekey||'YOUR_RECAPTCHA_SITE_KEY_HERE',{action:'contact'}); } catch(_) {}
        }
        const data = {}; new FormData(form).forEach((v,k)=>{data[k]=String(v).replace(/<[^>]*>/g,'').trim();});
        data.recaptchaToken = recaptchaToken;
        const res = await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
        if (res.ok) {
          const success = document.getElementById('formSuccess');
          if (success) { form.style.display='none'; success.style.display='block'; }
          else { showToast('✅ Message sent! We\'ll respond within 1–2 business hours.','success'); form.reset(); }
        } else {
          const err = await res.json().catch(()=>({}));
          showToast(err.error||'❌ Something went wrong. Please try again.','error');
        }
      } catch(_) { showToast('📧 Network error. Email us at hello@hnbcsoftware.com','info'); }
      btn.innerHTML=orig; btn.disabled=false;
    });
  }

  /* ─── Career Apply Form ──────────────────────────── */
  function initCareerForm() {
    const form = document.getElementById('applyForm') || document.getElementById('apply-form');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]'); const orig = btn.innerHTML;
      btn.innerHTML='Submitting…'; btn.disabled=true;
      await new Promise(r=>setTimeout(r,1500));
      showToast('✅ Application submitted! Our HR team will contact you soon.','success');
      form.reset(); btn.innerHTML=orig; btn.disabled=false;
    });
  }

  /* ─── Newsletter ──────────────────────────────────── */
  function initNewsletter() {
    document.querySelectorAll('#newsletterForm,#newsletter-form,.newsletter-form').forEach(form => {
      if (form.dataset.nlInit) return; form.dataset.nlInit='1';
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const inp = form.querySelector('input[type="email"]');
        if (!inp || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value)) { showToast('Please enter a valid email address.','error'); return; }
        const btn = form.querySelector('button'); const orig = btn ? btn.textContent : '';
        if (btn) { btn.textContent='Subscribing…'; btn.disabled=true; }
        try { await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:inp.value})}); } catch(_) {}
        showToast('✅ Subscribed! Welcome to the HNBC community.','success');
        form.reset(); if (btn) { btn.textContent=orig; btn.disabled=false; }
      });
    });
  }

  /* ─── Job filter ─────────────────────────────────── */
  function initJobFilter() {
    const btns = document.querySelectorAll('.filter-btn,[data-filter]');
    if (!btns.length) return;
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b=>b.classList.remove('active')); btn.classList.add('active');
        const cat = btn.dataset.filter || btn.dataset.category || 'all';
        document.querySelectorAll('.job-card,[data-category]').forEach(card => {
          card.style.display = (cat==='all' || (card.dataset.category||'')=== cat) ? '' : 'none';
        });
      });
    });
  }

  /* ─── Smooth scroll ──────────────────────────────── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior:'smooth' });
        }
      });
    });
  }

  /* ─── Phone obfuscation ──────────────────────────── */
  function initPhoneObfuscation() {
    document.querySelectorAll('#footerPhone,#contactPhone,[data-phone]').forEach(el => {
      if (!el.getAttribute('href') || el.getAttribute('href') === '#') el.setAttribute('href','tel:+914411110000');
    });
  }

  /* ─── Stagger animations ─────────────────────────── */
  function initStagger() {
    document.querySelectorAll('.service-card,.solution-feature-card,.blog-card,.industry-card').forEach((card,i) => {
      card.style.transitionDelay = `${(i % 3) * 80}ms`;
    });
  }

  /* ─── Init ───────────────────────────────────────── */
  function init() {
    initDarkMode(); initNavbar(); initMobileMenu(); initBackToTop();
    initScrollAnimations(); initCounters(); initParticles(); initMegaMenu();
    initContactForm(); initCareerForm(); initNewsletter(); initJobFilter();
    initSmoothScroll(); initPhoneObfuscation(); initStagger();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();

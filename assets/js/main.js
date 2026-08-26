/**
 * main.js — Portfolio renderer
 * Fetches data/profile.json and renders every section.
 * NO external dependencies.
 */

/* ══════════════════════════════════════════════
   SECURITY HELPERS
   ══════════════════════════════════════════════ */
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(url) {
  if (!url) return '#';
  try {
    if (url.startsWith('/') || url.startsWith('#') || url.startsWith('./')) return url;
    const u = new URL(url);
    return ALLOWED_SCHEMES.has(u.protocol) ? url : '#';
  } catch { return '#'; }
}

function chip(text, extraClass = '') {
  return `<span class="tech-chip ${extraClass}">${esc(text)}</span>`;
}

function socialIcon(type) {
  const icons = {
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`,
    github:   `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>`,
    mail:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    twitter:  `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>`,
  };
  return icons[type] || '';
}

function iconSVG(name) {
  const icons = {
    location: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    mail:     `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    phone:    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.63 3.45 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>`,
    server:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
    monitor:  `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    cloud:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`,
    users:    `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    star:     `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    fork:     `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`,
    external: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  };
  return icons[name] || '';
}

/* ══════════════════════════════════════════════
   THEME ENGINE
   ══════════════════════════════════════════════ */
const THEMES = ['dark', 'light', 'offwhite'];
let currentThemeIdx = 0;

function initTheme() {
  const stored = localStorage.getItem('theme');
  const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const theme = stored || system;
  const idx = THEMES.indexOf(theme);
  currentThemeIdx = idx >= 0 ? idx : 0;
  applyTheme(THEMES[currentThemeIdx]);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  // Redraw radar on theme change
  if (window.__radarData) drawRadar(window.__radarData);
}

function cycleTheme() {
  currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
  applyTheme(THEMES[currentThemeIdx]);
}

document.getElementById('theme-toggle')?.addEventListener('click', cycleTheme);

/* ══════════════════════════════════════════════
   SCROLL PROGRESS
   ══════════════════════════════════════════════ */
const progressBar = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
  const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  if (progressBar) progressBar.style.width = pct + '%';
}, { passive: true });

/* ══════════════════════════════════════════════
   NAVBAR: scroll glass + spy
   ══════════════════════════════════════════════ */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 60);

  // Back to top
  const btt = document.getElementById('back-to-top');
  if (btt) btt.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

// Scroll spy
const sections = document.querySelectorAll('section[id]');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => observer.observe(s));

/* ══════════════════════════════════════════════
   MOBILE MENU
   ══════════════════════════════════════════════ */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

function closeMobileMenu() {
  hamburger?.setAttribute('aria-expanded', 'false');
  mobileMenu?.classList.remove('open');
  mobileMenu?.setAttribute('aria-hidden', 'true');
}

hamburger?.addEventListener('click', () => {
  const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
  hamburger.setAttribute('aria-expanded', String(!isOpen));
  mobileMenu?.classList.toggle('open', !isOpen);
  mobileMenu?.setAttribute('aria-hidden', String(isOpen));
});

document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', closeMobileMenu));

/* ══════════════════════════════════════════════
   SCROLL REVEAL
   ══════════════════════════════════════════════ */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });

function activateReveal() {
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
}

/* ══════════════════════════════════════════════
   COUNT-UP ANIMATION
   ══════════════════════════════════════════════ */
function countUp(el, target, suffix = '', duration = 1800) {
  if (!el) return;
  const start = performance.now();
  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ══════════════════════════════════════════════
   TYPING EFFECT
   ══════════════════════════════════════════════ */
function startTyping(el, roles) {
  if (!el || !roles?.length) return;
  let ri = 0, ci = 0, deleting = false;
  const type = () => {
    const role = roles[ri];
    if (!deleting) {
      el.textContent = role.slice(0, ++ci);
      if (ci >= role.length) { setTimeout(() => { deleting = true; type(); }, 2200); return; }
    } else {
      el.textContent = role.slice(0, --ci);
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; }
    }
    setTimeout(type, deleting ? 50 : 85);
  };
  type();
}

/* ══════════════════════════════════════════════
   PORTRAIT 3D TILT
   ══════════════════════════════════════════════ */
function initTilt(card) {
  if (!card || !window.matchMedia('(pointer: fine)').matches) return;
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    card.style.transform = `perspective(600px) rotateX(${y}deg) rotateY(${x}deg) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
}

/* ══════════════════════════════════════════════
   SKILL BARS — animated when scrolled in
   ══════════════════════════════════════════════ */
function initSkillBars() {
  const bars = document.querySelectorAll('.skill-bar-fill[data-level]');
  const barObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.level + '%';
        barObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });
  bars.forEach(b => barObs.observe(b));
}

/* ══════════════════════════════════════════════
   RADAR CHART (canvas — no library)
   ══════════════════════════════════════════════ */
function drawRadar(groups) {
  window.__radarData = groups;
  const canvas = document.getElementById('radar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const isDark = theme === 'dark';
  const isOff = theme === 'offwhite';

  const accent  = isDark ? '#8b5cf6' : isOff ? '#b45309' : '#7c3aed';
  const accent2 = isDark ? '#06b6d4' : isOff ? '#0f766e' : '#0891b2';
  const gridCol = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const labelCol = isDark ? 'rgba(240,234,255,0.8)' : 'rgba(26,16,48,0.8)';

  // One data point per skill group — use average level
  const points = groups.map(g => ({
    label: g.name,
    value: g.skills.reduce((s, sk) => s + sk.level, 0) / g.skills.length / 100
  }));

  const N = points.length;
  const PAD = 72;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2 - PAD;
  const LEVELS = 5;

  const angle = (i) => (Math.PI * 2 * i) / N - Math.PI / 2;

  // Grid rings
  for (let l = 1; l <= LEVELS; l++) {
    const r = (R * l) / LEVELS;
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = angle(i);
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Spokes
  for (let i = 0; i < N; i++) {
    const a = angle(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
    ctx.strokeStyle = gridCol;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Data polygon
  ctx.beginPath();
  points.forEach((p, i) => {
    const a = angle(i);
    const r = R * p.value;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();

  // Fill gradient
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  grad.addColorStop(0, accent + '55');
  grad.addColorStop(1, accent2 + '22');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Dots
  points.forEach((p, i) => {
    const a = angle(i);
    const r = R * p.value;
    const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Labels — clamped inside canvas with 70px padding
  ctx.font = `600 11px Inter, system-ui, sans-serif`;
  ctx.fillStyle = labelCol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const MAX_LABEL = 14;
  points.forEach((p, i) => {
    const a = angle(i);
    const labelR = R + 46;
    let x = cx + labelR * Math.cos(a);
    let y = cy + labelR * Math.sin(a);

    // Clamp
    x = Math.max(PAD - 16, Math.min(W - PAD + 16, x));
    y = Math.max(PAD - 20, Math.min(H - PAD + 20, y));

    const label = p.label.length > MAX_LABEL ? p.label.slice(0, MAX_LABEL - 1) + '…' : p.label;

    // Percentage below label
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillStyle = labelCol;
    ctx.fillText(label, x, y);
    ctx.font = '500 9px JetBrains Mono, monospace';
    ctx.fillStyle = accent;
    ctx.fillText(Math.round(p.value * 100) + '%', x, y + 14);
  });
}

/* ══════════════════════════════════════════════
   CONTACT FORM
   ══════════════════════════════════════════════ */
function initContactForm(contactData, email) {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = document.getElementById('cf-submit');
  if (!form) return;

  const endpoint = contactData?.formspreeEndpoint;
  const useMailto = !endpoint;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    // Validate fields
    form.querySelectorAll('input[required], textarea[required]').forEach(field => {
      const errEl = field.nextElementSibling;
      field.classList.remove('invalid');
      if (errEl) errEl.textContent = '';

      if (!field.value.trim()) {
        field.classList.add('invalid');
        if (errEl) errEl.textContent = 'This field is required.';
        valid = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        field.classList.add('invalid');
        if (errEl) errEl.textContent = 'Please enter a valid email address.';
        valid = false;
      } else if (field.minLength > 0 && field.value.trim().length < field.minLength) {
        field.classList.add('invalid');
        if (errEl) errEl.textContent = `Must be at least ${field.minLength} characters.`;
        valid = false;
      }
    });

    if (!valid) return;

    // Check honeypot
    const honey = form.querySelector('[name="_honey"]');
    if (honey?.value) return;

    if (useMailto) {
      const name = form.querySelector('#cf-name')?.value || '';
      const subj = form.querySelector('#cf-subject')?.value || '';
      const msg = form.querySelector('#cf-message')?.value || '';
      const mailtoUrl = `mailto:${esc(email)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(`Hi Narendra,\n\n${msg}\n\n— ${name}`)}`;
      window.location.href = mailtoUrl;

      if (statusEl) {
        statusEl.className = 'form-status success';
        statusEl.textContent = '✓ Your email client is opening. Send when ready.';
      }
      return;
    }

    // Formspree submit
    submitBtn?.classList.add('loading');
    submitBtn && (submitBtn.disabled = true);

    try {
      const data = new FormData(form);
      const res = await fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (res.ok) {
        if (statusEl) { statusEl.className = 'form-status success'; statusEl.textContent = '✓ Message sent! I\'ll be in touch soon.'; }
        form.reset();
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      if (statusEl) { statusEl.className = 'form-status error'; statusEl.textContent = '✗ Something went wrong. Please email me directly.'; }
    } finally {
      submitBtn?.classList.remove('loading');
      submitBtn && (submitBtn.disabled = false);
    }
  });
}

/* ══════════════════════════════════════════════
   STATS COUNT-UP OBSERVER
   ══════════════════════════════════════════════ */
function initStats(stats) {
  const grid = document.getElementById('stats-grid');
  if (!grid || !stats?.length) return;

  grid.innerHTML = stats.map((s, i) =>
    `<div class="stat-item reveal${i > 0 ? ' reveal-delay-' + i : ''}">
       <span class="stat-value" data-target="${esc(String(s.value))}" data-suffix="${esc(s.suffix || '')}">0${esc(s.suffix || '')}</span>
       <span class="stat-label">${esc(s.label)}</span>
     </div>`
  ).join('');

  const statObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.stat-value[data-target]').forEach(el => {
          countUp(el, parseInt(el.dataset.target), el.dataset.suffix);
        });
        statObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  grid.querySelectorAll('.stat-item').forEach(el => statObs.observe(el));
  activateReveal();
}

/* ══════════════════════════════════════════════
   RENDER FUNCTIONS
   ══════════════════════════════════════════════ */
function renderMeta(meta, profile) {
  const setMeta = (id, attr, val) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, val); };
  const setContent = (id, val) => setMeta(id, 'content', val);

  document.title = esc(meta.title);
  setContent('meta-description', meta.description);
  setContent('meta-keywords', (meta.keywords || []).join(', '));
  document.getElementById('meta-canonical')?.setAttribute('href', meta.siteUrl || '');
  setContent('og-title', meta.title); setContent('og-desc', meta.description);
  setContent('og-image', meta.siteUrl + '/' + meta.ogImage);
  setContent('og-url', meta.siteUrl);
  setContent('tw-title', meta.title); setContent('tw-desc', meta.description);
  setContent('tw-image', meta.siteUrl + '/' + meta.ogImage);

  // JSON-LD
  const ld = {
    '@context': 'https://schema.org', '@type': 'Person',
    'name': profile.name, 'email': profile.email,
    'telephone': profile.phone, 'jobTitle': profile.role,
    'url': meta.siteUrl, 'image': meta.siteUrl + '/' + profile.avatar,
    'sameAs': (profile.socials || []).map(s => s.url)
  };
  const ldEl = document.getElementById('jsonld-person');
  if (ldEl) ldEl.textContent = JSON.stringify(ld);
}

function renderHero(p) {
  const set = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  set('hero-availability', esc(p.availability || ''));
  set('hero-name', esc(p.name));
  set('hero-tagline', esc(p.tagline));
  set('nav-initials', esc(p.initials || 'NM'));
  set('portrait-caption-name', esc(p.name));
  set('portrait-caption-role', esc(p.role));
  set('portrait-monogram', esc(p.initials || 'NM'));

  // Avatar fallback
  const avatarEl = document.getElementById('hero-avatar');
  const monogram = document.getElementById('portrait-monogram');
  if (avatarEl) {
    const showMonogram = () => {
      avatarEl.style.display = 'none';
      if (monogram) monogram.style.display = 'flex';
    };
    avatarEl.onerror = showMonogram;
    if (p.avatar) avatarEl.src = p.avatar;
    // Image may have already failed before this handler was attached
    if (avatarEl.complete && avatarEl.naturalWidth === 0) showMonogram();
  }

  // Floating chips
  const chips = ['Java', 'Python', 'Spring Boot', 'AWS', 'Kafka'];
  const chipsEl = document.getElementById('portrait-chips');
  if (chipsEl) chipsEl.innerHTML = chips.map(c => `<span class="portrait-chip">${esc(c)}</span>`).join('');

  // Socials
  const socialsEl = document.getElementById('hero-socials');
  if (socialsEl && p.socials) {
    socialsEl.innerHTML = p.socials.map(s =>
      `<a href="${safeHref(s.url)}" class="social-icon" aria-label="${esc(s.label)}" target="_blank" rel="noopener noreferrer">
         ${socialIcon(s.icon)}
       </a>`
    ).join('');
  }

  // Resume links
  const resumeHref = safeHref(p.resumeFile);
  document.getElementById('nav-resume-btn')?.setAttribute('href', resumeHref);
  document.getElementById('hero-resume-link')?.setAttribute('href', 'resume.html');

  // Typing
  startTyping(document.getElementById('typing-text'), p.roles || [p.role]);

  // Tilt
  initTilt(document.getElementById('portrait-card'));
}

function renderAbout(profile, personal) {
  // Summary bullets
  const summaryEl = document.getElementById('about-summary');
  if (summaryEl && profile.summary) {
    summaryEl.innerHTML = profile.summary.map(b => `<li>${esc(b)}</li>`).join('');
  }

  // Other skills
  const osGrid = document.getElementById('other-skills-grid');
  if (osGrid && profile.otherSkills) {
    osGrid.innerHTML = (profile.otherSkills || []).map(s =>
      `<div class="other-skill-card">
         <div class="other-skill-name">${esc(s.name)}</div>
         <div class="other-skill-detail">${esc(s.detail)}</div>
       </div>`
    ).join('');
  }

  // Details sidebar
  const dl = document.getElementById('about-details');
  if (dl && personal) {
    const items = [
      { label: 'Location', value: esc(profile.location || personal.location) },
      { label: 'Email', value: `<a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>` },
      { label: 'Phone', value: profile.phone ? `<a href="tel:${esc(profile.phone)}">${esc(profile.phone)}</a>` : null },
      { label: 'Nationality', value: esc(personal.nationality) },
      { label: 'Languages', value: esc((personal.languages || []).join(', ')) },
    ].filter(i => i.value);

    dl.innerHTML = items.map(i =>
      `<div><dt>${esc(i.label)}</dt><dd>${i.value}</dd></div>`
    ).join('');
  }

  // Interests
  const interestsEl = document.getElementById('about-interests');
  if (interestsEl && personal?.interests) {
    interestsEl.innerHTML = personal.interests.map(i => `<span class="tag-mini">${esc(i)}</span>`).join('');
  }
}

function renderExperience(experience) {
  const timeline = document.getElementById('timeline');
  if (!timeline || !experience) return;

  timeline.innerHTML = experience.map(exp => `
    <div class="timeline-item reveal">
      <div class="timeline-dot${exp.current ? ' current' : ''}"></div>
      <div class="timeline-card">
        <div class="timeline-meta">
          <span class="timeline-period">${esc(exp.period)}</span>
          <span class="timeline-duration">${esc(exp.duration)}</span>
          <span class="timeline-location">${esc(exp.location)}</span>
        </div>
        <h3 class="timeline-company">${esc(exp.company)}</h3>
        <div class="timeline-role">${esc(exp.role)}</div>
        <p class="timeline-summary">${esc(exp.summary)}</p>

        <ul class="highlights-list">
          ${(exp.highlights || []).map(h => `<li>${esc(h)}</li>`).join('')}
        </ul>

        ${exp.achievements?.length ? `
        <div class="achievements-panel">
          <h4>Key Achievements</h4>
          <ul class="achievements-list">
            ${exp.achievements.map(a => `<li>${esc(a)}</li>`).join('')}
          </ul>
        </div>` : ''}

        <div class="tech-chips">
          ${(exp.tech || []).map(t => chip(t)).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function renderProjects(projects) {
  const grid = document.getElementById('projects-grid');
  if (!grid || !projects) return;

  grid.innerHTML = projects.map(p => `
    <div class="glass-card project-card reveal">
      <div class="project-header">
        <div class="project-org-period">${esc(p.org)} · ${esc(p.period)}</div>
        <div class="project-name">${esc(p.name)}</div>
        ${p.featured ? `<span class="project-featured">★ Featured</span>` : ''}
      </div>

      <p class="project-overview">${esc(p.overview)}</p>

      ${(p.useCases || []).length > 0 ? `
      <details class="project-responsibilities">
        <summary>Use Cases Delivered (${(p.useCases || []).length})</summary>
        <ul>${(p.useCases || []).map(u => `<li>${esc(u)}</li>`).join('')}</ul>
      </details>` : ''}

      ${(p.practices || []).length > 0 ? `
      <details class="project-responsibilities">
        <summary>Engineering Practices (${(p.practices || []).length})</summary>
        <ul>${(p.practices || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      </details>` : ''}

      ${(p.responsibilities || []).length > 0 ? `
      <details class="project-responsibilities">
        <summary>Responsibilities (${(p.responsibilities || []).length})</summary>
        <ul>${(p.responsibilities || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul>
      </details>` : ''}

      ${p.impact ? `
      <div class="project-impact">
        <strong>Impact</strong>${esc(p.impact)}
      </div>` : ''}

      <div class="project-footer">
        <div class="tech-chips">
          ${(p.tech || []).map(t => chip(t)).join('')}
        </div>
        ${(p.links || []).length ? `
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          ${p.links.map(l => `<a href="${safeHref(l.url)}" class="btn btn-sm btn-outline" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>`).join('')}
        </div>` : ''}
      </div>
    </div>
  `).join('');
}

function renderSkills(skillGroups, skillTags) {
  const wrap = document.getElementById('skill-bars-wrap');
  if (wrap && skillGroups) {
    wrap.innerHTML = skillGroups.map(g => `
      <div class="skill-group reveal">
        <div class="skill-group-header">
          <div class="skill-group-icon">${iconSVG(g.icon || 'server')}</div>
          <span class="skill-group-name">${esc(g.name)}</span>
        </div>
        <div class="skill-bar-wrap">
          ${(g.skills || []).map(s => `
            <div class="skill-item">
              <div class="skill-item-header">
                <span class="skill-name">${esc(s.name)}</span>
                <span class="skill-pct">${esc(String(s.level))}%</span>
              </div>
              <div class="skill-bar-bg">
                <div class="skill-bar-fill" data-level="${esc(String(s.level))}" style="width:0%"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
    initSkillBars();
    drawRadar(skillGroups);
  }

  // Tag cloud
  const tagsEl = document.getElementById('skill-tags');
  if (tagsEl && skillTags) {
    tagsEl.innerHTML = skillTags.map(t => `<span class="skill-tag">${esc(t)}</span>`).join('');
  }
}

function renderEducation(education, awards) {
  const eduEl = document.getElementById('education-list');
  if (eduEl && education) {
    eduEl.innerHTML = education.map(e => `
      <div class="edu-item reveal">
        <div class="edu-degree">${esc(e.degree)}</div>
        ${e.field ? `<div class="edu-field">${esc(e.field)}</div>` : ''}
        <div class="edu-institution">${esc(e.institution)}</div>
        <div class="edu-meta">${esc(e.board)} · ${esc(e.year)} · ${esc(e.performance)}</div>
      </div>
    `).join('');
  }

  const awardsEl = document.getElementById('awards-list');
  if (awardsEl && awards) {
    awardsEl.innerHTML = awards.map((a, i) => `
      <div class="award-item reveal${i > 0 ? ' reveal-delay-' + Math.min(i, 5) : ''}">
        <div class="award-title">${esc(a.title)}</div>
        <div class="award-meta">${esc(a.org)} · ${esc(a.year)}</div>
        ${a.note ? `<div class="award-note">${esc(a.note)}</div>` : ''}
      </div>
    `).join('');
  }
}

function renderContact(contact, profile) {
  const hEl = document.getElementById('contact-heading');
  if (hEl) hEl.textContent = contact?.heading || 'Get In Touch';
  const bEl = document.getElementById('contact-blurb');
  if (bEl) bEl.textContent = contact?.blurb || '';

  const listEl = document.getElementById('contact-list');
  if (listEl) {
    const items = [
      { icon: 'location', label: 'Location', value: esc(profile.location) },
      { icon: 'mail', label: 'Email', value: `<a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a>` },
    ];
    if (contact?.showPhone && profile.phone) {
      items.push({ icon: 'phone', label: 'Phone', value: `<a href="tel:${esc(profile.phone)}">${esc(profile.phone)}</a>` });
    }
    listEl.innerHTML = items.map(i => `
      <li class="contact-item">
        <div class="contact-item-icon">${iconSVG(i.icon)}</div>
        <div class="contact-item-text">
          <div class="contact-item-label">${esc(i.label)}</div>
          <div class="contact-item-value">${i.value}</div>
        </div>
      </li>
    `).join('');
  }

  initContactForm(contact, profile.email);
}

function renderFooter(profile) {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  const nameEl = document.getElementById('footer-name');
  if (nameEl) nameEl.textContent = profile.name;

  const socialsEl = document.getElementById('footer-socials');
  if (socialsEl && profile.socials) {
    socialsEl.innerHTML = profile.socials.map(s =>
      `<a href="${safeHref(s.url)}" class="social-icon" aria-label="${esc(s.label)}" target="_blank" rel="noopener noreferrer">
         ${socialIcon(s.icon)}
       </a>`
    ).join('');
  }
}

/* ══════════════════════════════════════════════
   BACK TO TOP
   ══════════════════════════════════════════════ */
document.getElementById('back-to-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ══════════════════════════════════════════════
   BOOTSTRAP
   ══════════════════════════════════════════════ */
async function init() {
  // Detect file:// protocol
  if (location.protocol === 'file:') {
    document.body.innerHTML = `
      <div class="file-error-banner">
        <div>
          <h1>⚠ Open via the dev server</h1>
          <p>This site uses <code>fetch()</code> to load content, which is blocked on <code>file://</code>.</p>
          <p style="margin-top:1rem">Run: <code>npm start</code> then open <strong>http://127.0.0.1:5173</strong></p>
        </div>
      </div>`;
    return;
  }

  try {
    const res = await fetch('data/profile.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const { meta, profile, stats, experience, projects, skillGroups, skillTags,
            education, awards, personal, contact } = data;

    renderMeta(meta, profile);
    renderHero(profile);
    renderAbout(profile, personal);
    initStats(stats);
    renderExperience(experience);
    renderProjects(projects);
    renderSkills(skillGroups, skillTags);
    renderEducation(education, awards);
    renderContact(contact, profile);
    renderFooter(profile);

    // Activate scroll reveal
    activateReveal();

  } catch (err) {
    console.error('Failed to load profile.json:', err);
    const main = document.getElementById('main-content');
    if (main) {
      main.insertAdjacentHTML('afterbegin', `
        <div style="padding:4rem 2rem;text-align:center;color:var(--text-secondary)">
          <h2 style="color:var(--accent-3);margin-bottom:1rem">Could not load profile data</h2>
          <p>${esc(err.message)}</p>
          <p style="margin-top:.5rem;font-family:var(--font-mono);font-size:.85rem">Make sure you ran <strong>npm start</strong> and <strong>data/profile.json</strong> exists.</p>
        </div>`);
    }
  }
}

initTheme();
init();

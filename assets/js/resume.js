/**
 * resume.js — ATS-friendly resume renderer
 * Fetches data/profile.json and renders the A4 resume sheet.
 */

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
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? url : '#';
  } catch { return '#'; }
}

async function renderResume() {
  if (location.protocol === 'file:') {
    document.body.innerHTML = `<div style="padding:4rem;font-family:sans-serif;text-align:center">
      <h2>Open via dev server</h2>
      <p>Run <code>npm start</code> then visit <strong>http://127.0.0.1:5173/resume.html</strong></p>
    </div>`;
    return;
  }

  const res = await fetch('data/profile.json');
  const d = await res.json();
  const { profile: p, experience, projects, skillGroups,
          education, awards, personal, resume: r = {}, resumeOptions: opts } = d;
  const joinParts = (...parts) => parts.filter(Boolean).map(esc).join(' · ');
  const displayUrl = url => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  // Update download link
  const dlLink = document.getElementById('toolbar-download');
  if (dlLink && p.resumeFile) dlLink.setAttribute('href', safeHref(p.resumeFile));

  /* ── HEADER ── */
  const header = document.getElementById('res-header');
  if (header) {
    const linkedin = (p.socials || []).find(s => s.icon === 'linkedin');
    const github   = (p.socials || []).find(s => s.icon === 'github');

    header.innerHTML = `
      <div class="res-header-left">
        <h1 class="res-name">${esc(p.name)}</h1>
        <div class="res-role">${esc(r.headline || p.role)}</div>
        <div class="res-contact-line">
          <span>${esc(p.location)}</span>
          <span class="res-contact-sep">|</span>
          <a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>
          <span class="res-contact-sep">|</span>
          <a href="mailto:${esc(p.email)}">${esc(p.email)}</a>
        </div>
        <div class="res-contact-line">
          ${[linkedin, github].filter(Boolean).map(s =>
            `<a href="${safeHref(s.url)}">${esc(displayUrl(s.url))}</a>`
          ).join('<span class="res-contact-sep">|</span>')}
        </div>
      </div>
    `;
  }

  /* ── BODY ── */
  const body = document.getElementById('res-body');
  if (!body) return;

  let html = '';

  /* Profile Summary */
  html += `
    <section class="res-section">
      <h2 class="res-section-title">Summary</h2>
      ${r.summary
        ? `<p class="res-summary-text">${esc(r.summary)}</p>`
        : `<ul class="res-summary-list">${(p.summary || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>`}
    </section>`;

  /* Technical Skills — single column so plain-text/ATS extraction keeps each label with its list */
  const skillRows = r.skills || (skillGroups || []).map(g => ({ label: g.name, items: (g.skills || []).map(s => s.name) }));
  html += `
    <section class="res-section">
      <h2 class="res-section-title">Skills</h2>
      ${skillRows.map(row => `
        <p class="res-skill-row"><strong>${esc(row.label)}:</strong> ${row.items.map(esc).join(' · ')}</p>
      `).join('')}
    </section>`;

  /* Professional Experience */
  html += `
    <section class="res-section">
      <h2 class="res-section-title">Professional Experience</h2>
      ${(experience || []).map(exp => {
        const bullets = exp.resumeBullets ?? [...(exp.highlights || []), ...(exp.achievements || [])];
        const tech = exp.resumeTech ?? exp.tech ?? [];
        return `
        <div class="res-exp-item">
          <div class="res-exp-header">
            <div class="res-exp-company">${esc(exp.company)}</div>
            <div class="res-exp-period">${esc(exp.period)}</div>
          </div>
          <div class="res-exp-role">${joinParts(exp.role, exp.location)}</div>
          ${bullets.length ? `<ul class="res-exp-list">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
          ${tech.length ? `<div class="res-exp-tech">Tech: <span>${tech.map(esc).join(' · ')}</span></div>` : ''}
        </div>`;
      }).join('')}
    </section>`;

  /* Project Experience */
  if (opts?.includeProjects !== false && projects?.length) html += `
    <section class="res-section">
      <h2 class="res-section-title">Project Experience</h2>
      ${(projects || []).map(proj => `
        <div class="res-project-item">
          <div class="res-project-header">
            <div class="res-project-name">${esc(proj.name)}</div>
            <div class="res-project-period">${esc(proj.period)}</div>
          </div>
          <div class="res-project-org">${esc(proj.org)}</div>
          <div class="res-project-overview">${esc(proj.overview)}</div>
          ${proj.impact ? `<div class="res-project-overview" style="font-style:italic">Impact: ${esc(proj.impact)}</div>` : ''}
          <div class="res-project-tech">Tech: ${(proj.tech || []).join(' · ')}</div>
        </div>
      `).join('')}
    </section>`;

  /* Education & Certifications */
  const showEdu   = opts?.includeEducation !== false && education?.length;
  const showCerts = opts?.includeAwards !== false && awards?.length;
  if (showEdu || showCerts) {
    html += `
      <section class="res-section">
        <h2 class="res-section-title">${[showEdu && 'Education', showCerts && 'Certifications'].filter(Boolean).join(' &amp; ')}</h2>
        ${showEdu ? education.map(e => `
          <p class="res-edu-line"><strong>${joinParts(e.degree, e.field)}</strong> — ${joinParts(e.institution, e.board, e.year, e.performance)}</p>
        `).join('') : ''}
        ${showCerts ? awards.map(a => `
          <p class="res-edu-line"><strong>${esc(a.title)}</strong> · ${joinParts(a.org, a.year)}</p>
        `).join('') : ''}
      </section>`;
  }

  /* Personal Details */
  if (opts?.includePersonalDetails !== false && personal) {
    html += `
      <section class="res-section">
        <h2 class="res-section-title">Personal Details</h2>
        <div class="res-personal-grid">
          <dl class="res-personal-item"><dt>Date of Birth</dt><dd>${esc(personal.dateOfBirth)}</dd></dl>
          <dl class="res-personal-item"><dt>Nationality</dt><dd>${esc(personal.nationality)}</dd></dl>
          <dl class="res-personal-item"><dt>Location</dt><dd>${esc(personal.location)}</dd></dl>
          <dl class="res-personal-item"><dt>Languages</dt><dd>${esc((personal.languages || []).join(', '))}</dd></dl>
          <dl class="res-personal-item"><dt>Interests</dt><dd>${esc((personal.interests || []).join(', '))}</dd></dl>
        </div>
      </section>`;
  }

  /* Footer note */
  if (opts?.footerNote) {
    html += `<p class="res-footer-note">${esc(opts.footerNote)}</p>`;
  }

  body.innerHTML = html;

  // Signal ready to generator
  window.__RESUME_READY__ = true;

  // Auto-print
  if (window.__resumePrintPending) {
    setTimeout(() => window.print(), 800);
  }
}

renderResume().catch(err => {
  console.error(err);
  document.getElementById('res-body').innerHTML = `<p style="color:red;padding:2rem">Error loading resume: ${err.message}</p>`;
});

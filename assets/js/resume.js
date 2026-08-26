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
          education, awards, personal, resumeOptions: opts } = d;

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
        <div class="res-role">${esc(p.role)}</div>
        <div class="res-contact-line">
          <span>${esc(p.location)}</span>
          <span class="res-contact-sep">|</span>
          <a href="tel:${esc(p.phone)}">${esc(p.phone)}</a>
          <span class="res-contact-sep">|</span>
          <a href="mailto:${esc(p.email)}">${esc(p.email)}</a>
        </div>
      </div>
      <div class="res-socials-block">
        ${linkedin ? `<a class="res-social-link" href="${safeHref(linkedin.url)}">LinkedIn ↗</a>` : ''}
        ${github   ? `<a class="res-social-link" href="${safeHref(github.url)}">GitHub ↗</a>`   : ''}
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
      <h2 class="res-section-title">Profile Summary</h2>
      <ul class="res-summary-list">
        ${(p.summary || []).map(b => `<li>${esc(b)}</li>`).join('')}
      </ul>
    </section>`;

  /* Technical Skills */
  html += `
    <section class="res-section">
      <h2 class="res-section-title">Technical Skills</h2>
      <div class="res-skills-grid">
        ${(skillGroups || []).map(g => `
          <div>
            <div class="res-skill-group-name">${esc(g.name)}</div>
            <div class="res-skill-tags">${(g.skills || []).map(s => esc(s.name)).join(' · ')}</div>
          </div>
        `).join('')}
      </div>
    </section>`;

  /* Professional Experience */
  html += `
    <section class="res-section">
      <h2 class="res-section-title">Professional Experience</h2>
      ${(experience || []).map(exp => `
        <div class="res-exp-item">
          <div class="res-exp-header">
            <div class="res-exp-company">${esc(exp.company)}</div>
            <div class="res-exp-period">${esc(exp.period)}</div>
          </div>
          <div class="res-exp-role">${esc(exp.role)} · ${esc(exp.location)}</div>
          <ul class="res-exp-list">
            ${[...(exp.highlights || []), ...(exp.achievements || [])].map(b => `<li>${esc(b)}</li>`).join('')}
          </ul>
          <div class="res-exp-tech">Tech: <span>${(exp.tech || []).join(' · ')}</span></div>
        </div>
      `).join('')}
    </section>`;

  /* Project Experience */
  html += `
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

  /* Education */
  if (opts?.includeEducation !== false && education?.length) {
    html += `
      <section class="res-section">
        <h2 class="res-section-title">Education</h2>
        <div class="res-edu-grid">
          ${education.map(e => `
            <div class="res-edu-item">
              <div class="res-edu-degree">${esc(e.degree)}</div>
              ${e.field ? `<div class="res-edu-field">${esc(e.field)}</div>` : ''}
              <div class="res-edu-meta">${esc(e.institution)} · ${esc(e.board)} · ${esc(e.year)} · ${esc(e.performance)}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  /* Awards */
  if (opts?.includeAwards !== false && awards?.length) {
    html += `
      <section class="res-section">
        <h2 class="res-section-title">Awards &amp; Recognition</h2>
        <div class="res-awards-list">
          ${awards.map(a => `
            <div class="res-award-item">
              <div class="res-award-title">${esc(a.title)}</div>
              <div class="res-award-meta">${esc(a.org)} · ${esc(a.year)}</div>
              ${a.note ? `<div class="res-award-note">${esc(a.note)}</div>` : ''}
            </div>
          `).join('')}
        </div>
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

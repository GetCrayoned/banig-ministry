/* =====================================================
   Banig Ministry App — JavaScript
   ===================================================== */

// ===================== DATA STORE =====================
const DB = {
  get: (key, def = []) => {
    try { return JSON.parse(localStorage.getItem('banig_' + key)) ?? def; }
    catch { return def; }
  },
  set: (key, val) => localStorage.setItem('banig_' + key, JSON.stringify(val)),
  all: () => ({
    events: DB.get('events'),
    attendance: DB.get('attendance'),
    devotionals: DB.get('devotionals'),
    songs: DB.get('songs'),
    qrCodes: DB.get('qrCodes'),
    settings: DB.get('settings', {})
  })
};

// ===================== UTILS =====================
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtShort = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const escHtml = (s) =>
  String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const categoryColors = {
  worship: '#4f7c3f',
  fellowship: '#2980b9',
  prayer: '#8e44ad',
  outreach: '#d35400',
  training: '#16a085',
  other: '#7f8c8d'
};

const categoryLabels = {
  worship: 'Worship Service',
  fellowship: 'Fellowship',
  prayer: 'Prayer Meeting',
  outreach: 'Outreach',
  training: 'Training / Seminar',
  other: 'Other'
};

// ===================== TOAST =====================
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3000);
}

// ===================== NAVIGATION =====================
function goToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent =
    page.charAt(0).toUpperCase() + page.slice(1).replace('devotionals','Devotionals')
      .replace('songs','Songs').replace('giving','Tithes & Offering')
      .replace('attendance','Attendance').replace('settings','Settings')
      .replace('events','Events').replace('dashboard','Dashboard');
  closeSidebar();
  renderPage(page);
}

function renderPage(page) {
  if (page === 'dashboard') renderDashboard();
  if (page === 'events') renderEvents();
  if (page === 'attendance') renderAttendance();
  if (page === 'devotionals') renderDevotionals();
  if (page === 'songs') renderSongs();
  if (page === 'giving') renderQrCodes();
  if (page === 'settings') loadSettings();
  updateStats();
}

// ===================== SIDEBAR =====================
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ===================== MODALS =====================
function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ===================== DASHBOARD =====================
function renderDashboard() {
  renderDashboardEvents();
  renderDashboardDevotional();
}

function renderDashboardEvents() {
  const events = DB.get('events');
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const el = document.getElementById('dashboardEvents');
  if (!upcoming.length) {
    el.innerHTML = '<p class="empty-msg">No upcoming events.</p>';
    return;
  }
  el.innerHTML = upcoming.map(e => `
    <div class="preview-item">
      <strong>${escHtml(e.title)}</strong>
      <span>📅 ${fmtShort(e.date)}${e.time ? ' · ' + e.time : ''}${e.location ? ' · 📍 ' + escHtml(e.location) : ''}</span>
    </div>
  `).join('');
}

function renderDashboardDevotional() {
  const devs = DB.get('devotionals').sort((a, b) => b.date.localeCompare(a.date));
  const el = document.getElementById('dashboardDevotional');
  if (!devs.length) {
    el.innerHTML = '<p class="empty-msg">No devotionals added yet.</p>';
    return;
  }
  const d = devs[0];
  el.innerHTML = `
    <div class="preview-item">
      <strong>${escHtml(d.title)}</strong>
      <span>${fmtShort(d.date)}${d.speaker ? ' · ' + escHtml(d.speaker) : ''}</span>
      ${d.verse ? `<span style="color:var(--primary);font-style:italic;">${escHtml(d.verse)}</span>` : ''}
    </div>
  `;
}

function updateStats() {
  const events = DB.get('events');
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('statEvents').textContent = events.filter(e => e.date >= today).length;

  const attendance = DB.get('attendance');
  const allMembers = new Set();
  attendance.forEach(a => a.members.forEach(m => allMembers.add(m.trim().toLowerCase())));
  document.getElementById('statAttendance').textContent = allMembers.size;

  document.getElementById('statDevotionals').textContent = DB.get('devotionals').length;
  document.getElementById('statSongs').textContent = DB.get('songs').length;
}

// ===================== EVENTS =====================
function saveEvent() {
  const id = document.getElementById('editEventId').value;
  const title = document.getElementById('eventTitle').value.trim();
  const date = document.getElementById('eventDate').value;

  if (!title || !date) { showToast('Title and date are required.', 'error'); return; }

  const events = DB.get('events');
  const event = {
    id: id || uid(),
    title,
    date,
    time: document.getElementById('eventTime').value,
    location: document.getElementById('eventLocation').value.trim(),
    category: document.getElementById('eventCategory').value,
    description: document.getElementById('eventDescription').value.trim(),
    createdAt: id ? (events.find(e => e.id === id)?.createdAt || Date.now()) : Date.now()
  };

  if (id) {
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) events[idx] = event;
  } else {
    events.push(event);
  }

  DB.set('events', events);
  closeModal('eventModal');
  resetEventForm();
  renderEvents();
  renderDashboardEvents();
  updateStats();
  showToast(id ? 'Event updated!' : 'Event added!');
}

function resetEventForm() {
  document.getElementById('editEventId').value = '';
  document.getElementById('eventTitle').value = '';
  document.getElementById('eventDate').value = '';
  document.getElementById('eventTime').value = '';
  document.getElementById('eventLocation').value = '';
  document.getElementById('eventCategory').value = 'worship';
  document.getElementById('eventDescription').value = '';
  document.getElementById('eventModalTitle').textContent = 'Add Event';
}

function editEvent(id) {
  const events = DB.get('events');
  const e = events.find(ev => ev.id === id);
  if (!e) return;
  document.getElementById('editEventId').value = e.id;
  document.getElementById('eventTitle').value = e.title;
  document.getElementById('eventDate').value = e.date;
  document.getElementById('eventTime').value = e.time || '';
  document.getElementById('eventLocation').value = e.location || '';
  document.getElementById('eventCategory').value = e.category || 'other';
  document.getElementById('eventDescription').value = e.description || '';
  document.getElementById('eventModalTitle').textContent = 'Edit Event';
  openModal('eventModal');
}

function deleteEvent(id) {
  if (!confirm('Delete this event?')) return;
  DB.set('events', DB.get('events').filter(e => e.id !== id));
  renderEvents();
  renderDashboardEvents();
  updateStats();
  showToast('Event deleted.', 'error');
}

function renderEvents() {
  const q = (document.getElementById('eventSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('eventFilter')?.value || 'all';
  const today = new Date().toISOString().slice(0, 10);
  let events = DB.get('events');

  if (filter === 'upcoming') events = events.filter(e => e.date >= today);
  if (filter === 'past') events = events.filter(e => e.date < today);
  if (q) events = events.filter(e =>
    e.title.toLowerCase().includes(q) ||
    (e.location || '').toLowerCase().includes(q) ||
    (e.description || '').toLowerCase().includes(q)
  );
  events.sort((a, b) => a.date.localeCompare(b.date));

  const el = document.getElementById('eventsList');
  if (!events.length) {
    el.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;padding:2rem 0;">No events found.</p>';
    return;
  }

  el.innerHTML = events.map(e => {
    const isPast = e.date < today;
    const color = categoryColors[e.category] || '#7f8c8d';
    return `
      <div class="event-card" style="--cat-color:${color}">
        <div class="event-card-header" style="background:${isPast ? '#6b7c6b' : color}">
          <div class="event-category-badge">${categoryLabels[e.category] || e.category}</div>
          ${isPast ? '<div class="event-category-badge" style="background:rgba(0,0,0,0.25)">Past</div>' : ''}
          <div class="event-card-title">${escHtml(e.title)}</div>
        </div>
        <div class="event-card-body">
          <div class="event-meta">
            <span>📅 ${fmt(e.date)}${e.time ? ' at ' + e.time : ''}</span>
            ${e.location ? `<span>📍 ${escHtml(e.location)}</span>` : ''}
          </div>
          ${e.description ? `<div class="event-desc">${escHtml(e.description)}</div>` : ''}
        </div>
        <div class="event-card-footer">
          <button class="btn-icon" onclick="editEvent('${e.id}')">✏️ Edit</button>
          <button class="btn-icon danger" onclick="deleteEvent('${e.id}')">🗑 Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// ===================== ATTENDANCE =====================
function saveAttendance() {
  const id = document.getElementById('editAttendanceId').value;
  const eventName = document.getElementById('attendanceEvent').value.trim();
  const date = document.getElementById('attendanceDate').value;
  const membersRaw = document.getElementById('attendanceMembers').value.trim();

  if (!eventName || !date || !membersRaw) {
    showToast('Event name, date, and attendees are required.', 'error'); return;
  }

  const members = membersRaw.split('\n').map(m => m.trim()).filter(Boolean);
  const attendance = DB.get('attendance');
  const record = {
    id: id || uid(),
    event: eventName,
    date,
    members,
    notes: document.getElementById('attendanceNotes').value.trim(),
    createdAt: id ? (attendance.find(a => a.id === id)?.createdAt || Date.now()) : Date.now()
  };

  if (id) {
    const idx = attendance.findIndex(a => a.id === id);
    if (idx !== -1) attendance[idx] = record;
  } else {
    attendance.push(record);
  }

  DB.set('attendance', attendance);
  closeModal('attendanceModal');
  resetAttendanceForm();
  renderAttendance();
  updateStats();
  showToast(id ? 'Attendance updated!' : 'Attendance logged!');
}

function resetAttendanceForm() {
  document.getElementById('editAttendanceId').value = '';
  document.getElementById('attendanceEvent').value = '';
  document.getElementById('attendanceDate').value = '';
  document.getElementById('attendanceMembers').value = '';
  document.getElementById('attendanceNotes').value = '';
}

function editAttendance(id) {
  const rec = DB.get('attendance').find(a => a.id === id);
  if (!rec) return;
  document.getElementById('editAttendanceId').value = rec.id;
  document.getElementById('attendanceEvent').value = rec.event;
  document.getElementById('attendanceDate').value = rec.date;
  document.getElementById('attendanceMembers').value = rec.members.join('\n');
  document.getElementById('attendanceNotes').value = rec.notes || '';
  openModal('attendanceModal');
}

function deleteAttendance(id) {
  if (!confirm('Delete this attendance record?')) return;
  DB.set('attendance', DB.get('attendance').filter(a => a.id !== id));
  renderAttendance();
  updateStats();
  showToast('Record deleted.', 'error');
}

function renderAttendance() {
  const q = (document.getElementById('attendanceSearch')?.value || '').toLowerCase();
  let records = DB.get('attendance');
  if (q) records = records.filter(a =>
    a.event.toLowerCase().includes(q) ||
    a.members.some(m => m.toLowerCase().includes(q))
  );
  records.sort((a, b) => b.date.localeCompare(a.date));

  const tbody = document.getElementById('attendanceBody');
  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-msg">No attendance records found.</td></tr>';
    return;
  }
  tbody.innerHTML = records.map(r => `
    <tr>
      <td><strong>${fmtShort(r.date)}</strong></td>
      <td>${escHtml(r.event)}</td>
      <td>
        <div class="attendee-list">
          ${r.members.map(m => `<span class="attendee-chip">${escHtml(m)}</span>`).join('')}
        </div>
        <small style="color:var(--text-muted)">${r.members.length} attendee${r.members.length !== 1 ? 's' : ''}</small>
      </td>
      <td>${r.notes ? escHtml(r.notes) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>
        <div style="display:flex;gap:0.4rem;">
          <button class="btn-icon" onclick="editAttendance('${r.id}')">✏️</button>
          <button class="btn-icon danger" onclick="deleteAttendance('${r.id}')">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ===================== DEVOTIONALS =====================
function saveDevotional() {
  const id = document.getElementById('editDevId').value;
  const title = document.getElementById('devTitle').value.trim();
  const date = document.getElementById('devDate').value;
  const content = document.getElementById('devContent').value.trim();

  if (!title || !date || !content) {
    showToast('Title, date, and content are required.', 'error'); return;
  }

  const devs = DB.get('devotionals');
  const dev = {
    id: id || uid(),
    title,
    date,
    speaker: document.getElementById('devSpeaker').value.trim(),
    verse: document.getElementById('devVerse').value.trim(),
    content,
    reflection: document.getElementById('devReflection').value.trim(),
    prayer: document.getElementById('devPrayer').value.trim(),
    createdAt: id ? (devs.find(d => d.id === id)?.createdAt || Date.now()) : Date.now()
  };

  if (id) {
    const idx = devs.findIndex(d => d.id === id);
    if (idx !== -1) devs[idx] = dev;
  } else {
    devs.push(dev);
  }

  DB.set('devotionals', devs);
  closeModal('devotionalModal');
  resetDevForm();
  renderDevotionals();
  renderDashboardDevotional();
  updateStats();
  showToast(id ? 'Devotional updated!' : 'Devotional saved!');
}

function resetDevForm() {
  ['editDevId','devTitle','devDate','devSpeaker','devVerse','devContent','devReflection','devPrayer'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('devModalTitle').textContent = 'Add Devotional';
}

function editDevotional(id) {
  const d = DB.get('devotionals').find(x => x.id === id);
  if (!d) return;
  document.getElementById('editDevId').value = d.id;
  document.getElementById('devTitle').value = d.title;
  document.getElementById('devDate').value = d.date;
  document.getElementById('devSpeaker').value = d.speaker || '';
  document.getElementById('devVerse').value = d.verse || '';
  document.getElementById('devContent').value = d.content;
  document.getElementById('devReflection').value = d.reflection || '';
  document.getElementById('devPrayer').value = d.prayer || '';
  document.getElementById('devModalTitle').textContent = 'Edit Devotional';
  openModal('devotionalModal');
}

function viewDevotional(id) {
  const d = DB.get('devotionals').find(x => x.id === id);
  if (!d) return;
  document.getElementById('devViewTitle').textContent = d.title;
  document.getElementById('devViewBody').innerHTML = `
    <div style="margin-bottom:0.75rem;color:var(--text-muted);font-size:0.85rem;">
      📅 ${fmt(d.date)}${d.speaker ? ' &nbsp;·&nbsp; ✍️ ' + escHtml(d.speaker) : ''}
    </div>
    ${d.verse ? `<div style="background:var(--accent-light);padding:0.75rem 1rem;border-radius:8px;margin-bottom:1rem;border-left:4px solid var(--accent);font-style:italic;color:var(--primary-dark);">
      📖 ${escHtml(d.verse)}
    </div>` : ''}
    <div style="white-space:pre-wrap;line-height:1.8;margin-bottom:1.25rem;">${escHtml(d.content)}</div>
    ${d.reflection ? `
      <div style="background:var(--surface2);padding:1rem;border-radius:8px;margin-bottom:1rem;">
        <strong style="color:var(--primary-dark);">💡 Reflection / Application</strong>
        <div style="white-space:pre-wrap;line-height:1.7;margin-top:0.5rem;font-size:0.9rem;">${escHtml(d.reflection)}</div>
      </div>
    ` : ''}
    ${d.prayer ? `
      <div style="background:#f0f8ef;padding:1rem;border-radius:8px;border-left:4px solid var(--primary);">
        <strong style="color:var(--primary-dark);">🙏 Prayer</strong>
        <div style="white-space:pre-wrap;line-height:1.7;margin-top:0.5rem;font-size:0.9rem;font-style:italic;">${escHtml(d.prayer)}</div>
      </div>
    ` : ''}
  `;
  openModal('devViewModal');
}

function deleteDevotional(id) {
  if (!confirm('Delete this devotional?')) return;
  DB.set('devotionals', DB.get('devotionals').filter(d => d.id !== id));
  renderDevotionals();
  renderDashboardDevotional();
  updateStats();
  showToast('Devotional deleted.', 'error');
}

function renderDevotionals() {
  const q = (document.getElementById('devSearch')?.value || '').toLowerCase();
  let devs = DB.get('devotionals');
  if (q) devs = devs.filter(d =>
    d.title.toLowerCase().includes(q) ||
    (d.speaker || '').toLowerCase().includes(q) ||
    (d.verse || '').toLowerCase().includes(q)
  );
  devs.sort((a, b) => b.date.localeCompare(a.date));

  const el = document.getElementById('devotionalsList');
  if (!devs.length) {
    el.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;padding:2rem 0;">No devotionals found.</p>';
    return;
  }
  el.innerHTML = devs.map(d => `
    <div class="dev-card">
      <div class="dev-card-header">
        <div class="dev-date">📅 ${fmtShort(d.date)}</div>
        <div class="dev-title">${escHtml(d.title)}</div>
        ${d.speaker ? `<div class="dev-speaker">✍️ ${escHtml(d.speaker)}</div>` : ''}
      </div>
      <div class="dev-card-body">
        ${d.verse ? `<div class="dev-verse">📖 ${escHtml(d.verse)}</div>` : ''}
        <div class="dev-excerpt">${escHtml(d.content)}</div>
      </div>
      <div class="dev-card-footer">
        <button class="btn-icon" onclick="viewDevotional('${d.id}')">👁 Read</button>
        <button class="btn-icon" onclick="editDevotional('${d.id}')">✏️ Edit</button>
        <button class="btn-icon danger" onclick="deleteDevotional('${d.id}')">🗑</button>
      </div>
    </div>
  `).join('');
}

// ===================== SONGS =====================
function saveSong() {
  const id = document.getElementById('editSongId').value;
  const title = document.getElementById('songTitle').value.trim();
  const lyrics = document.getElementById('songLyrics').value.trim();

  if (!title || !lyrics) { showToast('Title and lyrics are required.', 'error'); return; }

  const songs = DB.get('songs');
  const song = {
    id: id || uid(),
    title,
    artist: document.getElementById('songArtist').value.trim(),
    language: document.getElementById('songLanguage').value,
    key: document.getElementById('songKey').value.trim(),
    tags: document.getElementById('songTags').value.trim(),
    lyrics,
    link: document.getElementById('songLink').value.trim(),
    createdAt: id ? (songs.find(s => s.id === id)?.createdAt || Date.now()) : Date.now()
  };

  if (id) {
    const idx = songs.findIndex(s => s.id === id);
    if (idx !== -1) songs[idx] = song;
  } else {
    songs.push(song);
  }

  DB.set('songs', songs);
  closeModal('songModal');
  resetSongForm();
  renderSongs();
  updateStats();
  showToast(id ? 'Song updated!' : 'Song added!');
}

function resetSongForm() {
  ['editSongId','songTitle','songArtist','songKey','songTags','songLyrics','songLink'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('songLanguage').value = 'english';
  document.getElementById('songModalTitle').textContent = 'Add Song';
}

function editSong(id) {
  const s = DB.get('songs').find(x => x.id === id);
  if (!s) return;
  document.getElementById('editSongId').value = s.id;
  document.getElementById('songTitle').value = s.title;
  document.getElementById('songArtist').value = s.artist || '';
  document.getElementById('songLanguage').value = s.language || 'english';
  document.getElementById('songKey').value = s.key || '';
  document.getElementById('songTags').value = s.tags || '';
  document.getElementById('songLyrics').value = s.lyrics;
  document.getElementById('songLink').value = s.link || '';
  document.getElementById('songModalTitle').textContent = 'Edit Song';
  openModal('songModal');
}

function viewLyrics(id) {
  const s = DB.get('songs').find(x => x.id === id);
  if (!s) return;
  document.getElementById('lyricsModalTitle').textContent = s.title;
  document.getElementById('lyricsModalBody').innerHTML = `
    <div style="margin-bottom:1rem;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;">
      ${s.artist ? `<span style="color:var(--text-muted);font-size:0.9rem;">🎤 ${escHtml(s.artist)}</span>` : ''}
      ${s.key ? `<span class="badge">🎸 Key: ${escHtml(s.key)}</span>` : ''}
      ${s.language ? `<span class="badge badge-green">${s.language.charAt(0).toUpperCase() + s.language.slice(1)}</span>` : ''}
      ${s.tags ? s.tags.split(',').map(t => `<span class="badge">${escHtml(t.trim())}</span>`).join('') : ''}
    </div>
    <div class="lyrics-view">${escHtml(s.lyrics)}</div>
    ${s.link ? `<div style="margin-top:1rem;"><a href="${escHtml(s.link)}" target="_blank" rel="noopener" class="song-link-btn">🔗 Listen / Watch</a></div>` : ''}
  `;
  openModal('lyricsModal');
}

function deleteSong(id) {
  if (!confirm('Delete this song?')) return;
  DB.set('songs', DB.get('songs').filter(s => s.id !== id));
  renderSongs();
  updateStats();
  showToast('Song deleted.', 'error');
}

function renderSongs() {
  const q = (document.getElementById('songSearch')?.value || '').toLowerCase();
  const lang = document.getElementById('songFilter')?.value || 'all';
  let songs = DB.get('songs');
  if (lang !== 'all') songs = songs.filter(s => s.language === lang);
  if (q) songs = songs.filter(s =>
    s.title.toLowerCase().includes(q) ||
    (s.artist || '').toLowerCase().includes(q) ||
    (s.tags || '').toLowerCase().includes(q) ||
    (s.lyrics || '').toLowerCase().includes(q)
  );
  songs.sort((a, b) => a.title.localeCompare(b.title));

  const el = document.getElementById('songsList');
  if (!songs.length) {
    el.innerHTML = '<p class="empty-msg" style="grid-column:1/-1;padding:2rem 0;">No songs found.</p>';
    return;
  }
  el.innerHTML = songs.map(s => `
    <div class="song-card">
      <div class="song-card-header">
        <div class="song-title">${escHtml(s.title)}</div>
        ${s.artist ? `<div class="song-artist">🎤 ${escHtml(s.artist)}</div>` : ''}
      </div>
      <div class="song-card-body">
        <div class="song-meta">
          ${s.language ? `<span class="badge badge-green">${s.language}</span>` : ''}
          ${s.key ? `<span class="badge">Key: ${escHtml(s.key)}</span>` : ''}
          ${s.tags ? s.tags.split(',').slice(0,2).map(t => `<span class="badge">${escHtml(t.trim())}</span>`).join('') : ''}
        </div>
        <div class="song-lyrics-preview">${escHtml(s.lyrics)}</div>
      </div>
      <div class="song-card-footer">
        <button class="btn-icon" onclick="viewLyrics('${s.id}')">🎵 Lyrics</button>
        <button class="btn-icon" onclick="editSong('${s.id}')">✏️</button>
        <button class="btn-icon danger" onclick="deleteSong('${s.id}')">🗑</button>
        ${s.link ? `<a href="${escHtml(s.link)}" target="_blank" rel="noopener" class="btn-icon" title="Listen">🔗</a>` : ''}
      </div>
    </div>
  `).join('');
}

// ===================== QR CODES =====================
function toggleQrFields() {
  const type = document.getElementById('qrType').value;
  document.getElementById('qrUrlGroup').style.display = type === 'url' ? '' : 'none';
  document.getElementById('qrUploadGroup').style.display = type === 'upload' ? '' : 'none';
}

function previewQrImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById('qrImagePreview').innerHTML =
      `<img src="${ev.target.result}" style="max-width:160px;border-radius:8px;border:2px solid var(--border);" />`;
  };
  reader.readAsDataURL(file);
}

function saveQrCode() {
  const id = document.getElementById('editQrId').value;
  const label = document.getElementById('qrLabel').value.trim();
  const type = document.getElementById('qrType').value;

  if (!label) { showToast('Label is required.', 'error'); return; }

  const proceed = (imageData) => {
    const qrCodes = DB.get('qrCodes');
    const qr = {
      id: id || uid(),
      label,
      desc: document.getElementById('qrDesc').value.trim(),
      type,
      url: type === 'url' ? document.getElementById('qrUrl').value.trim() : '',
      imageData: type === 'upload' ? imageData : '',
      createdAt: id ? (qrCodes.find(q => q.id === id)?.createdAt || Date.now()) : Date.now()
    };

    if (type === 'url' && !qr.url) { showToast('Payment URL is required.', 'error'); return; }

    if (id) {
      const idx = qrCodes.findIndex(q => q.id === id);
      if (idx !== -1) qrCodes[idx] = qr;
    } else {
      qrCodes.push(qr);
    }

    DB.set('qrCodes', qrCodes);
    closeModal('qrModal');
    resetQrForm();
    renderQrCodes();
    showToast(id ? 'QR Code updated!' : 'QR Code added!');
  };

  if (type === 'upload') {
    const file = document.getElementById('qrImageUpload').files[0];
    if (!file && !id) { showToast('Please upload an image.', 'error'); return; }
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => proceed(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      const existing = DB.get('qrCodes').find(q => q.id === id);
      proceed(existing?.imageData || '');
    }
  } else {
    proceed('');
  }
}

function resetQrForm() {
  ['editQrId','qrLabel','qrDesc','qrUrl'].forEach(id => { document.getElementById(id).value = ''; });
  document.getElementById('qrType').value = 'url';
  document.getElementById('qrImageUpload').value = '';
  document.getElementById('qrImagePreview').innerHTML = '';
  toggleQrFields();
}

function deleteQrCode(id) {
  if (!confirm('Delete this QR code?')) return;
  DB.set('qrCodes', DB.get('qrCodes').filter(q => q.id !== id));
  renderQrCodes();
  showToast('QR code deleted.', 'error');
}

function renderQrCodes() {
  const qrCodes = DB.get('qrCodes');
  const el = document.getElementById('qrCodesList');

  if (!qrCodes.length) {
    el.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem 0;color:var(--text-muted);">
        <div style="font-size:3rem;margin-bottom:0.75rem;">💝</div>
        <p>No QR codes added yet.</p>
        <p style="font-size:0.85rem;margin-top:0.25rem;">Add a GCash, PayMaya, or bank QR code to get started.</p>
      </div>
    `;
    return;
  }

  el.innerHTML = qrCodes.map(qr => `
    <div class="qr-card" id="qr-card-${qr.id}">
      <div class="qr-label">${escHtml(qr.label)}</div>
      ${qr.desc ? `<div class="qr-desc">${escHtml(qr.desc)}</div>` : ''}
      <div class="qr-code-box" id="qr-box-${qr.id}">
        ${qr.type === 'upload' && qr.imageData
          ? `<img src="${qr.imageData}" alt="QR Code" style="width:100%;height:100%;object-fit:contain;" />`
          : `<div id="qr-gen-${qr.id}"></div>`}
      </div>
      <div class="qr-actions">
        <button class="btn-icon danger" onclick="deleteQrCode('${qr.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');

  // Generate QR codes for URL type
  qrCodes.forEach(qr => {
    if (qr.type === 'url' && qr.url) {
      const container = document.getElementById('qr-gen-' + qr.id);
      if (container && typeof QRCode !== 'undefined') {
        new QRCode(container, {
          text: qr.url,
          width: 160,
          height: 160,
          colorDark: '#1e2a1e',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.M
        });
      } else if (container) {
        container.innerHTML = `<small style="color:var(--text-muted);font-size:0.75rem;padding:0.5rem;text-align:center;">QR for:<br>${escHtml(qr.url)}</small>`;
      }
    }
  });
}

// ===================== SETTINGS =====================
function loadSettings() {
  const s = DB.get('settings', {});
  document.getElementById('settingName').value = s.name || '';
  document.getElementById('settingTagline').value = s.tagline || '';
  document.getElementById('settingEmail').value = s.email || '';
  document.getElementById('settingLocation').value = s.location || '';
}

function saveSettings() {
  DB.set('settings', {
    name: document.getElementById('settingName').value.trim(),
    tagline: document.getElementById('settingTagline').value.trim(),
    email: document.getElementById('settingEmail').value.trim(),
    location: document.getElementById('settingLocation').value.trim()
  });
  showToast('Settings saved!');
}

function exportData() {
  const data = DB.all();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'banig-ministry-backup-' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  showToast('Data exported!');
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!confirm('This will overwrite all current data. Continue?')) return;
      ['events','attendance','devotionals','songs','qrCodes','settings'].forEach(key => {
        if (data[key] !== undefined) DB.set(key, data[key]);
      });
      renderPage('dashboard');
      showToast('Data imported successfully!');
    } catch {
      showToast('Invalid file format.', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('⚠️ This will permanently delete ALL data. This cannot be undone. Continue?')) return;
  ['events','attendance','devotionals','songs','qrCodes','settings'].forEach(key => {
    localStorage.removeItem('banig_' + key);
  });
  renderPage('dashboard');
  showToast('All data cleared.', 'error');
}

// ===================== CURRENT DATE =====================
function setCurrentDate() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent =
    now.toLocaleDateString('en-PH', opts);
}

// ===================== KEYBOARD SHORTCUT =====================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    closeSidebar();
  }
});

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
  // Nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      goToPage(link.dataset.page);
    });
  });

  // Hamburger / sidebar
  document.getElementById('hamburger').addEventListener('click', openSidebar);
  document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
  document.getElementById('overlay').addEventListener('click', closeSidebar);

  setCurrentDate();
  renderPage('dashboard');
});

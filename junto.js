/* junto.js — skupna navigacijska knjižnica v1.0 */

const JUNTO = {
  // ── Navigacija ──────────────────────────────────────────────
  go(screen) {
    const base = window.location.pathname.replace(/\/[^/]*$/, '/');
    window.location.href = base + screen;
  },

  goHome()     { JUNTO.go('screen_home.html'); },
  goMap()      { JUNTO.go('screen_map.html'); },
  goCreate()   { JUNTO.go('screen_create.html'); },
  goMessages() { JUNTO.go('screen_messages.html'); },
  goProfil()   { JUNTO.go('screen_profil.html'); },
  goActivity() { JUNTO.go('screen_activity.html'); },
  goStory()    { JUNTO.go('screen_story.html'); },
  goBack()     { window.history.back(); },

  // ── LocalStorage aktivnosti ──────────────────────────────────
  STORAGE_KEY: 'junto_activities',

  getActivities() {
    try {
      return JSON.parse(localStorage.getItem(JUNTO.STORAGE_KEY) || '[]');
    } catch { return []; }
  },

  saveActivity(act) {
    const list = JUNTO.getActivities();
    act.id = Date.now();
    act.createdAt = new Date().toISOString();
    list.unshift(act);
    localStorage.setItem(JUNTO.STORAGE_KEY, JSON.stringify(list));
    return act;
  },

  clearActivities() {
    localStorage.removeItem(JUNTO.STORAGE_KEY);
  },

  // ── Auth (mock) ──────────────────────────────────────────────
  AUTH_KEY: 'junto_user',

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(JUNTO.AUTH_KEY));
    } catch { return null; }
  },

  setUser(user) {
    localStorage.setItem(JUNTO.AUTH_KEY, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(JUNTO.AUTH_KEY);
    JUNTO.goHome();
  },

  // ── Nominatim lokacija ───────────────────────────────────────
  async searchLocation(query) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=sl`;
    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'sl' } });
      return await res.json();
    } catch { return []; }
  },

  async reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=sl`;
    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'sl' } });
      return await res.json();
    } catch { return null; }
  },

  // ── Bottom nav injector ──────────────────────────────────────
  // activeTab: 'home' | 'map' | 'create' | 'messages' | 'profil'
  // theme: 'light' | 'dark'
  injectNav(activeTab = 'home', theme = 'light') {
    const isDark = theme === 'dark';
    const bg     = isDark ? 'rgba(11,16,26,0.97)' : '#fff';
    const border = isDark ? 'rgba(255,255,255,0.07)' : '#f0f0f0';
    const lbl    = isDark ? 'rgba(255,255,255,0.28)' : '#111';
    const lblA   = isDark ? '#FF385C' : '#111';

    const tabs = [
      { id: 'home',     icon: '🏠', label: 'Domov',    fn: 'JUNTO.goHome()' },
      { id: 'map',      icon: '🗺️', label: 'Mapa',     fn: 'JUNTO.goMap()' },
      { id: 'create',   icon: null,  label: null,       fn: 'JUNTO.goCreate()' },
      { id: 'messages', icon: '💬', label: 'Sporočila', fn: 'JUNTO.goMessages()' },
      { id: 'profil',   icon: '👤', label: 'Profil',    fn: 'JUNTO.goProfil()' },
    ];

    const html = `
<div id="junto-nav" style="
  position:fixed; bottom:0; left:50%; transform:translateX(-50%);
  width:390px; height:82px;
  background:${bg}; border-top:1px solid ${border};
  display:flex; align-items:center; justify-content:space-around;
  padding:0 10px 18px; z-index:9999;
  backdrop-filter:blur(20px);
">
  ${tabs.map(t => {
    if (t.id === 'create') {
      return `<div onclick="${t.fn}" style="
        width:54px;height:54px;background:${isDark ? '#FF385C' : '#111'};
        border-radius:18px;display:flex;align-items:center;justify-content:center;
        font-size:28px;color:#fff;cursor:pointer;
        box-shadow:0 4px 16px rgba(0,0,0,0.22);margin-bottom:10px;flex-shrink:0;
      ">＋</div>`;
    }
    const isActive = t.id === activeTab;
    return `<div onclick="${t.fn}" style="
      display:flex;flex-direction:column;align-items:center;gap:3px;
      cursor:pointer;opacity:${isActive ? 1 : (isDark ? 0.4 : 0.35)};
    ">
      <div style="font-size:22px">${t.icon}</div>
      <div style="font-size:10px;font-weight:600;color:${isActive ? lblA : lbl}">${t.label}</div>
    </div>`;
  }).join('')}
</div>`;

    const el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el.firstElementChild);

    // Odstrani obstoječi bottom-nav če obstaja
    document.querySelectorAll('.bottom-nav, .tab-bar').forEach(n => {
      if (n.id !== 'junto-nav') n.style.display = 'none';
    });
  }
};

// Auto-expose globally
window.JUNTO = JUNTO;

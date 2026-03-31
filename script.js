/**
 * ============================================================
 *  ENFIELD ROYAL AI PATIENT CONCIERGE — ML SCORING ENGINE
 *  Google Sheets Webhook: Live Integration Active ✅
 * ============================================================
 * All scoring runs fully client-side in the browser.
 * No server required. Results are computed in real-time.
 * ============================================================
 */

// ═══════════════════════════════════════════════════════════════
//  PATIENT PORTAL — Auth & Dashboard (localStorage-based)
// ═══════════════════════════════════════════════════════════════

let portalUser = null; // currently logged-in user object

// ── Init: restore session on page load ──────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('ercp_session');
  if (saved) {
    portalUser = JSON.parse(saved);
    updateAuthHeader();

    // auto-fill name in the form if they have an account
    const input = document.getElementById('fullName');
    if (input && !input.value) input.value = portalUser.name;
  }
});

// ── Helpers ─────────────────────────────────────────────────────
function hashPass(str) { return btoa(unescape(encodeURIComponent(str))); }

function getPatients()  { return JSON.parse(localStorage.getItem('ercp_patients')  || '{}'); }
function getBookings()  { return JSON.parse(localStorage.getItem('ercp_bookings')  || '{}'); }
function savePatients(p){ localStorage.setItem('ercp_patients', JSON.stringify(p)); }
function saveBookings(b){ localStorage.setItem('ercp_bookings', JSON.stringify(b)); }

function showAuthMsg(msg, isError = true) {
  const el = document.getElementById('authMessage');
  el.textContent = msg;
  el.className = `mb-4 px-4 py-2.5 rounded-xl text-sm font-display font-medium ${
    isError ? 'bg-red-900/40 text-red-300 border border-red-800/50'
             : 'bg-green-900/40 text-green-300 border border-green-800/50'
  }`;
  el.classList.remove('hidden');
}

function updateAuthHeader() {
  const btn   = document.getElementById('authBtn');
  const label = document.getElementById('authBtnLabel');
  const input = document.getElementById('fullName');
  
  if (!btn || !label) return;
  if (portalUser) {
    const firstName = portalUser.name.split(' ')[0];
    label.textContent = firstName;
    btn.innerHTML = `<i class="fa-solid fa-circle-user text-metallic-gold"></i> <span>${firstName}</span>`;
    btn.onclick = openDashboard;
    btn.classList.add('bg-royal-navy', 'text-white');
    btn.classList.remove('text-royal-navy');
    
    // auto-prefill form name if empty
    if (input && !input.value) input.value = portalUser.name;
  } else {
    btn.innerHTML = `<i class="fa-solid fa-circle-user"></i> <span id="authBtnLabel">My Account</span>`;
    btn.onclick = openAuthModal;
    btn.classList.remove('bg-royal-navy', 'text-white');
    btn.classList.add('text-royal-navy');
    if (input) input.value = '';
  }
}

// ── Auth Modal ──────────────────────────────────────────────────
function openAuthModal() {
  if (portalUser) { openDashboard(); return; }
  const m = document.getElementById('authModal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  document.getElementById('authMessage').classList.add('hidden');
}
function closeAuthModal() {
  const m = document.getElementById('authModal');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm').classList.toggle('hidden', isLogin);
  document.getElementById('tabLogin').className    = `flex-1 py-2 text-sm font-semibold font-display rounded-lg transition-all ${isLogin    ? 'text-white bg-royal-navy'    : 'text-gray-400'}`;
  document.getElementById('tabRegister').className = `flex-1 py-2 text-sm font-semibold font-display rounded-lg transition-all ${!isLogin   ? 'text-white bg-royal-navy'    : 'text-gray-400'}`;
  document.getElementById('authMessage').classList.add('hidden');
}

function handleRegister() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('regPassword').value;

  if (!name || !email || !pass) return showAuthMsg('Please fill in all fields.');
  if (pass.length < 6)          return showAuthMsg('Password must be at least 6 characters.');
  if (!/\S+@\S+\.\S+/.test(email)) return showAuthMsg('Please enter a valid email address.');

  const patients = getPatients();
  if (patients[email])          return showAuthMsg('An account with this email already exists.');

  patients[email] = { name, email, password: hashPass(pass), joinedAt: new Date().toISOString() };
  savePatients(patients);

  portalUser = { name, email };
  localStorage.setItem('ercp_session', JSON.stringify(portalUser));
  updateAuthHeader();
  showAuthMsg(`Welcome, ${name.split(' ')[0]}! Your VIP account is ready.`, false);
  setTimeout(() => { closeAuthModal(); openDashboard(); }, 1200);
}

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPassword').value;

  if (!email || !pass) return showAuthMsg('Please enter your email and password.');

  const patients = getPatients();
  const patient  = patients[email];
  if (!patient || patient.password !== hashPass(pass))
    return showAuthMsg('Incorrect email or password. Please try again.');

  portalUser = { name: patient.name, email };
  localStorage.setItem('ercp_session', JSON.stringify(portalUser));
  updateAuthHeader();
  showAuthMsg(`Welcome back, ${patient.name.split(' ')[0]}! 👑`, false);
  setTimeout(() => { closeAuthModal(); openDashboard(); }, 1000);
}

function handleLogout() {
  portalUser = null;
  localStorage.removeItem('ercp_session');
  updateAuthHeader();
  closeDashboard();
  showToast('Signed out successfully.', '#6b7280');
}

// ── Dashboard ───────────────────────────────────────────────────
function openDashboard() {
  if (!portalUser) { openAuthModal(); return; }
  const m = document.getElementById('dashboardModal');
  m.classList.remove('hidden');
  m.classList.add('flex');
  loadDashboard();
}
function closeDashboard() {
  const m = document.getElementById('dashboardModal');
  m.classList.add('hidden');
  m.classList.remove('flex');
}

function loadDashboard() {
  const allBookings = getBookings();
  const myBookings  = (allBookings[portalUser.email] || []).slice().reverse(); // newest first

  document.getElementById('dashboardWelcome').textContent =
    `Welcome back, ${portalUser.name} · ${portalUser.email}`;

  // Stats
  document.getElementById('statTotal').textContent = myBookings.length;
  if (myBookings.length > 0) {
    const avg = (myBookings.reduce((s, b) => s + parseFloat(b.score || 0), 0) / myBookings.length).toFixed(1);
    const tiers = myBookings.map(b => b.tier);
    const bestTier = tiers.includes('PLATINUM') ? '👑' :
                     tiers.includes('GOLD')     ? '🥇' :
                     tiers.includes('SILVER')   ? '🥈' : '🥉';
    document.getElementById('statAvgScore').textContent = avg;
    document.getElementById('statTier').textContent     = bestTier;
  } else {
    document.getElementById('statAvgScore').textContent = '—';
    document.getElementById('statTier').textContent     = '—';
  }

  // Booking cards
  const list  = document.getElementById('bookingHistoryList');
  const empty = document.getElementById('emptyHistory');
  list.innerHTML = '';

  if (myBookings.length === 0) {
    list.classList.add('hidden');
    empty.classList.remove('hidden');
  } else {
    list.classList.remove('hidden');
    empty.classList.add('hidden');
    myBookings.forEach((b, i) => {
      const tierColor = b.tier === 'PLATINUM' ? '#D4AF37' :
                        b.tier === 'GOLD'     ? '#f59e0b' :
                        b.tier === 'SILVER'   ? '#9ca3af' : '#cd7f32';
      const date = new Date(b.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
      const card = document.createElement('div');
      card.className = 'bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4';
      card.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:${tierColor}20;border:1px solid ${tierColor}40">
            <i class="fa-solid fa-crown text-sm" style="color:${tierColor}"></i>
          </div>
          <div>
            <p class="text-white font-display font-semibold text-sm">${b.procedure}</p>
            <p class="text-gray-500 font-display text-xs mt-0.5">${date} &nbsp;·&nbsp; ${b.urgency}</p>
          </div>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="font-serif text-xl font-bold" style="color:${tierColor}">${b.score}/10</p>
          <p class="text-xs font-display font-semibold mt-0.5" style="color:${tierColor}">${b.tier}</p>
        </div>
      `;
      list.appendChild(card);
    });
  }
}

// ── Save booking to portal (called from submitForm) ──────────────
function saveBookingToPortal(payload) {
  if (!portalUser) return; // only save if logged in
  const all = getBookings();
  if (!all[portalUser.email]) all[portalUser.email] = [];
  all[portalUser.email].push({
    procedure:  payload.procedure,
    urgency:    payload.urgency,
    score:      payload.score,
    tier:       payload.tier,
    timestamp:  new Date().toISOString(),
    whatsapp:   `${payload.countryCode}${payload.whatsappNumber}`,
  });
  saveBookings(all);
}

// ─── ANIMATED COUNTER (triggers when scrolled into view) ─────
function startCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = 2000; // ms
  const step     = 16;   // ~60fps
  const increment = target / (duration / step);
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      el.textContent = target.toLocaleString() + suffix;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString() + suffix;
    }
  }, step);
}

// Use IntersectionObserver so counters only fire when visible
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = 'true';
      startCounter(entry.target);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ─── TREATMENT CATEGORY FILTER ────────────────────────────────
function filterTreatments(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const isActive = btn.dataset.filter === category;
    btn.classList.toggle('active-filter',       isActive);
    btn.classList.toggle('border-royal-gold',   isActive);
    btn.classList.toggle('text-royal-gold',     isActive);
    btn.classList.toggle('bg-royal-gold/10',    isActive);
    btn.classList.toggle('border-white/20',     !isActive);
    btn.classList.toggle('text-gray-400',       !isActive);
  });

  document.querySelectorAll('.treatment-card').forEach(card => {
    const match = category === 'all' || card.dataset.category === category;
    if (match) {
      card.style.display = '';
      requestAnimationFrame(() => {
        card.style.opacity    = '1';
        card.style.transform  = 'translateY(0)';
        card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      });
    } else {
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(8px)';
      card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      setTimeout(() => { card.style.display = 'none'; }, 220);
    }
  });
}

// ─── TREATMENT CARD → BOOKING FLOW ───────────────────────────

// Expand procedure dropdown with all 18 treatments (grouped)
window.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('procedure');
  if (!sel) return;
  sel.innerHTML = `
    <option value="" disabled selected>Select a Procedure</option>
    <optgroup label="── Hair ───────────────">
      <option value="Hair Transplant">Hair Transplant (FUE / DHI)</option>
      <option value="PRP for Hair">PRP for Hair</option>
      <option value="Eyebrow Transplant">Eyebrow Transplant</option>
    </optgroup>
    <optgroup label="── Facial ──────────────">
      <option value="Rhinoplasty">Rhinoplasty</option>
      <option value="Facelift">Facelift</option>
      <option value="Eyelid Surgery">Eyelid Surgery</option>
      <option value="Lip Surgery">Lip Surgery</option>
      <option value="Chin Augmentation">Chin Augmentation</option>
    </optgroup>
    <optgroup label="── Body ────────────────">
      <option value="Liposuction">Liposuction</option>
      <option value="Tummy Tuck">Tummy Tuck</option>
      <option value="Brazilian Butt Lift">Brazilian Butt Lift (BBL)</option>
      <option value="Breast Augmentation">Breast Augmentation</option>
      <option value="Body Contouring">Body Contouring</option>
    </optgroup>
    <optgroup label="── Skin ────────────────">
      <option value="Laser Resurfacing">Laser Resurfacing</option>
      <option value="Chemical Peels">Chemical Peels</option>
      <option value="Botox & Fillers">Botox & Fillers</option>
      <option value="Microneedling">Microneedling</option>
      <option value="PRP Therapy">PRP Therapy</option>
    </optgroup>
    <option value="Other">Other Procedure</option>
  `;
});

// Event delegation — one listener for all treatment cards
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('treatmentGrid');
  if (!grid) return;
  grid.addEventListener('click', e => {
    const card = e.target.closest('.treatment-card');
    if (!card) return;
    const name = card.querySelector('h4')?.textContent?.trim();
    if (name) bookTreatment(name);
  });
});

function bookTreatment(procedureName) {
  const sel = document.getElementById('procedure');
  if (sel) {
    const search = procedureName.toLowerCase().trim();
    for (const opt of sel.options) {
      if (opt.value.toLowerCase().includes(search) || search.includes(opt.value.toLowerCase())) {
        opt.selected = true;
        break;
      }
    }
    sel.dispatchEvent(new Event('change'));
  }

  // 2. Show the gold pre-selection banner
  const banner = document.getElementById('procedureBanner');
  const bannerName = document.getElementById('bannerProcedureName');
  if (banner && bannerName) {
    bannerName.textContent = procedureName;
    banner.classList.remove('hidden');
    banner.classList.add('flex');
  }

  // 3. Reset form
  if (currentStep !== 1) {
    const s1 = document.getElementById('step1');
    const s2 = document.getElementById('step2');
    const s3 = document.getElementById('step3');
    [s1, s2, s3].forEach(s => {
      s?.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
      s?.classList.remove('translate-x-0', '-translate-x-full', 'opacity-100');
    });
    if (s1) {
      s1.classList.remove('translate-x-full', 'opacity-0', 'pointer-events-none');
      s1.classList.add('translate-x-0', 'opacity-100');
    }
    currentStep = 1;
    updateProgress(1);
  }

  // 4. Scroll
  const formBox = document.getElementById('leadForm')?.closest('.bg-white');
  if (formBox) {
    formBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    formBox.classList.add('ring-4', 'ring-royal-gold/10');
    setTimeout(() => formBox.classList.remove('ring-4', 'ring-royal-gold/10'), 2000);
  }
}

function clearProcedurePreselect() {
  const sel = document.getElementById('procedure');
  if (sel) sel.selectedIndex = 0;
  const banner = document.getElementById('procedureBanner');
  if (banner) {
    banner.classList.add('hidden');
    banner.classList.remove('flex');
  }
}

// ─── ML MODEL DATA TABLES ────────────────────────────────────

const PROCEDURE_WEIGHTS = {
  'Hair Transplant':  8.5,
  'Rhinoplasty':      7.8,
  'Liposuction':      7.2,
  'Fillers & Botox':  6.5,
  'Other':            5.0,
};

const URGENCY_MULTIPLIERS = {
  'Immediate':      1.15,
  'Within 1 Month': 1.00,
  'Researching':    0.72,
};

const URGENCY_LABELS = {
  'Immediate':      '×1.15  🔴 Critical',
  'Within 1 Month': '×1.00  🟡 Moderate',
  'Researching':    '×0.72  🟢 Exploratory',
};

const TIER_CONFIG = [
  { min: 9.5,  label: 'PLATINUM',  color: '#C5A059', response: '< 3 minutes',  subtext: 'A VIP Senior Coordinator will contact you on WhatsApp within 3 minutes.' },
  { min: 8.0,  label: 'GOLD',      color: '#e8c87b', response: '< 5 minutes',  subtext: 'A Senior Coordinator will reach you on WhatsApp within 5 minutes.' },
  { min: 6.0,  label: 'SILVER',    color: '#9ca3af', response: '< 15 minutes', subtext: 'Our team will contact you on WhatsApp within 15 minutes.' },
  { min: 0,    label: 'STANDARD',  color: '#6b7280', response: '< 30 minutes', subtext: 'Our team will follow up on WhatsApp within 30 minutes.' },
];

// ─── CORE ML SCORING FUNCTION ────────────────────────────────

function computeMLScore(procedure, urgency) {
  const baseWeight  = PROCEDURE_WEIGHTS[procedure]  ?? 5.0;
  const multiplier  = URGENCY_MULTIPLIERS[urgency]  ?? 1.0;

  // Special rule (as per spec): Hair Transplant + Immediate = 9.8
  // ML Logic: If procedure == 'Hair Transplant' AND Urgency == 'Immediate', set priority_score = 9.8/10.
  if (procedure === 'Hair Transplant' && urgency === 'Immediate') {
    return { score: 9.8, baseWeight, multiplier };
  }

  const raw = baseWeight * multiplier;
  const score = Math.min(parseFloat(raw.toFixed(1)), 10.0);
  return { score, baseWeight, multiplier };
}

function getTier(score) {
  return TIER_CONFIG.find(t => score >= t.min) || TIER_CONFIG[TIER_CONFIG.length - 1];
}

// ─── LIVE PREVIEW (Step 3) ────────────────────────────────────

function updateLivePreview() {
  const procedure = document.getElementById('procedure').value;
  const urgency   = document.getElementById('urgencyValue').value;
  const preview   = document.getElementById('liveScorePreview');

  if (!procedure || !urgency) return;

  const { score } = computeMLScore(procedure, urgency);
  const tier       = getTier(score);
  const pct        = (score / 10) * 100;

  preview.classList.remove('hidden');
  document.getElementById('liveScoreValue').textContent = `${score}/10 — ${tier.label}`;
  document.getElementById('liveScoreValue').style.color = tier.color;

  const bar = document.getElementById('liveScoreBar');
  requestAnimationFrame(() => {
    bar.style.width = pct + '%';
    bar.style.background = `linear-gradient(to right, ${tier.color}, #fde68a)`;
  });
}

// Trigger preview whenever the procedure dropdown changes
document.getElementById('procedure').addEventListener('change', updateLivePreview);

// ─── REVEAL ML RESULTS IN SUCCESS OVERLAY ────────────────────

function revealMLResults(procedure, urgency) {
  const { score, baseWeight, multiplier } = computeMLScore(procedure, urgency);
  const tier = getTier(score);
  const pct  = (score / 10) * 100;

  // Update sub-text message from tier config
  document.getElementById('successSubtext').textContent = tier.subtext;

  // Badge
  const badge = document.getElementById('mlScoreBadge');
  badge.textContent = `${score} / 10`;
  badge.style.background = `${tier.color}25`;
  badge.style.color       = tier.color;
  badge.style.borderColor = `${tier.color}60`;

  // Animated score bar (staggered for premium feel)
  setTimeout(() => {
    const bar = document.getElementById('mlScoreBar');
    bar.style.width      = pct + '%';
    bar.style.background = `linear-gradient(to right, ${tier.color}, #fde68a)`;
  }, 200);

  // Breakdown rows
  document.getElementById('procedureWeight').textContent   = `${baseWeight.toFixed(1)} pts`;
  document.getElementById('urgencyMultiplier').textContent = URGENCY_LABELS[urgency] ?? `×${multiplier}`;

  const tierEl = document.getElementById('priorityTier');
  tierEl.textContent = tier.label;
  tierEl.style.color = tier.color;

  document.getElementById('responseTime').textContent = tier.response;

  // Console log for demo / Sheets payload visibility
  console.table({
    'Patient':        document.getElementById('fullName').value,
    'WhatsApp':       `${document.getElementById('countryCode').value} ${document.getElementById('whatsappNumber').value}`,
    'Procedure':      procedure,
    'Urgency':        urgency,
    'Base Weight':    baseWeight,
    'Multiplier':     multiplier,
    'AI Score':       `${score}/10`,
    'Priority Tier':  tier.label,
    'Response ETA':   tier.response,
  });
}

// ─── MULTI-STEP STITCH FORM LOGIC ────────────────────────────

let currentStep = 1;

const step1       = document.getElementById('step1');
const step2       = document.getElementById('step2');
const step3       = document.getElementById('step3');
const formProgress = document.getElementById('formProgress');
const stepIndicator = document.getElementById('stepIndicator');

const loadingOverlay = document.getElementById('loadingOverlay');
const successOverlay = document.getElementById('successOverlay');
const submitBtn      = document.getElementById('submitBtn');

function updateProgress(step) {
  const labels = [
    'Step 1 of 3: Identity',
    'Step 2 of 3: Contact',
    'Step 3 of 3: AI Prioritization',
  ];
  formProgress.style.width = `${(step / 3) * 100}%`;
  stepIndicator.textContent = labels[step - 1];
}

function slideOut(el, direction) {
  el.classList.remove('translate-x-0', 'opacity-100');
  el.classList.add(direction === 'left' ? '-translate-x-full' : 'translate-x-full', 'opacity-0', 'pointer-events-none');
}

function slideIn(el) {
  el.classList.remove('translate-x-full', '-translate-x-full', 'opacity-0', 'pointer-events-none');
  el.classList.add('translate-x-0', 'opacity-100');
}

function nextStep(current) {
  if (current === 1) {
    const val = document.getElementById('fullName').value.trim();
    if (!val) { shakeInput('fullName'); return; }
    slideOut(step1, 'left');
    slideIn(step2);
    currentStep = 2;
  } else if (current === 2) {
    const val = document.getElementById('whatsappNumber').value.trim();
    if (!val) { shakeInput('whatsappNumber'); return; }
    slideOut(step2, 'left');
    slideIn(step3);
    currentStep = 3;
  }
  updateProgress(currentStep);
}

function prevStep(current) {
  if (current === 2) {
    slideOut(step2, 'right');
    slideIn(step1);
    currentStep = 1;
  } else if (current === 3) {
    slideOut(step3, 'right');
    slideIn(step2);
    currentStep = 2;
  }
  updateProgress(currentStep);
}

// ─── URGENCY SELECTOR ────────────────────────────────────────

function selectUrgency(value) {
  document.getElementById('urgencyValue').value = value;
  document.querySelectorAll('.urgency-btn').forEach(btn => btn.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
  updateLivePreview();
}

// ─── SHAKE ANIMATION FOR EMPTY FIELDS ────────────────────────

function shakeInput(id) {
  const el = document.getElementById(id);
  el.classList.add('ring-2', 'ring-red-400', 'border-red-400');
  el.animate([
    { transform: 'translateX(0)' },
    { transform: 'translateX(-6px)' },
    { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' },
    { transform: 'translateX(4px)' },
    { transform: 'translateX(0)' },
  ], { duration: 400, easing: 'ease-in-out' });
  setTimeout(() => el.classList.remove('ring-2', 'ring-red-400', 'border-red-400'), 1500);
}

// ─── FORM SUBMISSION ─────────────────────────────────────────

async function submitForm() {
  const procedure = document.getElementById('procedure').value;
  const urgency   = document.getElementById('urgencyValue').value;

  if (!procedure) { alert('Please select a service interest.'); return; }
  if (!urgency)   { alert('Please select your urgency timeframe.'); return; }

  submitBtn.disabled = true;

  // Show loading overlay
  loadingOverlay.style.display = 'flex';
  requestAnimationFrame(() => {
    loadingOverlay.classList.remove('opacity-0');
    loadingOverlay.classList.add('opacity-100');
  });

  // Build payload
  const payload = {
    fullName:      document.getElementById('fullName').value,
    countryCode:   document.getElementById('countryCode').value,
    whatsappNumber: document.getElementById('whatsappNumber').value,
    procedure,
    urgency,
    ...computeMLScore(procedure, urgency),
  };
  payload.priorityTier = getTier(payload.score).label;
  
  // Save to Patient Portal history if user is logged in
  saveBookingToPortal(payload);

  // ── GOOGLE SHEETS LIVE INTEGRATION ──────────────────────────
  const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxx_zLJq_QO1HbHiAGzeuiBhbPhVxEX15qWmd-79_cqcQ7aQiFgaOeLSg3wUC_bHSyv/exec';

  const sheetsPayload = {
    Name:         payload.fullName,
    WhatsApp:     `(${payload.countryCode}) ${payload.whatsappNumber}`,
    Procedure:    payload.procedure,
    Urgency:      payload.urgency,
    BaseWeight:   payload.baseWeight,
    Multiplier:   payload.multiplier,
    AIScore:      `${payload.score}/10`,
    PriorityTier: payload.priorityTier,
    ResponseETA:  getTier(payload.score).response,
    Timestamp:    new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' }),
  };

  // Build query string — GAS doGet(e) reads e.parameter.*
  const queryString = Object.entries(sheetsPayload)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const fullURL = `${GOOGLE_SHEETS_URL}?${queryString}`;

  console.log('📤 Sending to Google Sheets via GET...', sheetsPayload);

  fetch(fullURL, { method: 'GET', mode: 'no-cors' })
    .then(() => {
      console.log('✅ Lead dispatched to Google Sheets.');
      // ── Trigger WhatsApp confirmation immediately after Sheets ──
      sendWhatsApp({
        customerName:  payload.fullName,
        customerPhone: `${payload.countryCode}${payload.whatsappNumber}`,
        procedure:     payload.procedure,
        aiScore:       payload.score,
      });
    })
    .catch(err => console.error('❌ Sheets fetch error:', err));

  // 2.5s AI analysis simulation
  setTimeout(() => {
    // Fade out loading
    loadingOverlay.classList.remove('opacity-100');
    loadingOverlay.classList.add('opacity-0');

    setTimeout(() => {
      loadingOverlay.style.display = 'none';

      // Populate ML results BEFORE showing overlay
      revealMLResults(procedure, urgency);

      // Show success
      successOverlay.style.display = 'flex';
      requestAnimationFrame(() => {
        successOverlay.classList.remove('opacity-0');
        successOverlay.classList.add('opacity-100');
      });
    }, 350);
  }, 2500);
}

// ─── WHATSAPP AUTOMATION (UltraMsg Live) ─────────────────────
//  Instance : instance167972
//  Sender   : your connected WhatsApp number
// ─────────────────────────────────────────────────────────────

async function sendWhatsApp({ customerName, customerPhone, procedure, aiScore }) {

  const INSTANCE_ID = 'instance167972';
  const TOKEN       = 'cz9eq7jm599hqk3v';
  const API_URL     = `https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`;

  const message =
    `👑 *Enfield Royal Clinic — VIP Concierge*\n\n` +
    `Dear ${customerName},\n\n` +
    `We are honoured to confirm that your consultation request has been received and processed by our AI Priority System.\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🏆 *Priority Score:* ${aiScore}/10\n` +
    `💎 *Requested Procedure:* ${procedure}\n` +
    `⚡ *Status:* HIGH PRIORITY — CONFIRMED\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `A dedicated Senior Coordinator from our VIP team will reach out to you shortly to arrange your exclusive consultation and confirm your preferred time slot.\n\n` +
    `We look forward to welcoming you to Enfield Royal — where excellence meets elegance. ✨\n\n` +
    `_Enfield Royal Clinic Dubai_\n` +
    `_📍 Dubai, United Arab Emirates_`;


  // UltraMsg requires number WITHOUT leading + (e.g. 971501234567 not +971501234567)
  // Strip all spaces and the leading + if present
  const cleanPhone = customerPhone.replace(/\s+/g, '').replace(/^\+/, '');

  console.log('%c📨 Sending WhatsApp via UltraMsg...', 'color:#C5A059;font-weight:bold;font-size:13px');
  console.log(`%c📞 To (cleaned): ${cleanPhone}`, 'color:#6b7280');
  console.log(`%c💬 Message: "${message}"`, 'color:#374151');

  const params = new URLSearchParams({
    token:    TOKEN,
    to:       cleanPhone,
    body:     message,
    priority: '10',
  });

  try {
    const response = await fetch(API_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    // Log raw response first for debugging
    const rawText = await response.text();
    console.log('%c📬 UltraMsg raw response:', 'color:#6b7280', rawText);

    let data;
    try { data = JSON.parse(rawText); } catch { data = { raw: rawText }; }

    if (data.sent === 'true' || data.sent === true || rawText.includes('"sent"')) {
      console.log('%c✅ WhatsApp sent successfully!', 'color:green;font-weight:bold;font-size:13px');
      showToast('✅ WhatsApp confirmation sent!', '#22c55e');
    } else {
      console.warn('%c⚠️ UltraMsg response (not confirmed sent):', 'color:orange', data);
      // Surface the exact error for diagnosing
      const errMsg = data.error || data.message || rawText || 'Unknown error';
      showToast(`⚠️ WhatsApp: ${errMsg}`, '#f59e0b');
    }

  } catch (err) {
    console.error('❌ UltraMsg fetch failed (possible CORS block from file://):', err.message);
    showToast('❌ WhatsApp fetch failed — see console', '#ef4444');
  }
}

// ─── On-page Toast Notification ──────────────────────────────
function showToast(msg, color = '#C5A059') {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.cssText = `
    position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
    background:${color}; color:#fff; padding:12px 24px; border-radius:50px;
    font-size:14px; font-weight:600; z-index:9999; box-shadow:0 4px 20px rgba(0,0,0,0.25);
    font-family:Inter,sans-serif; letter-spacing:0.3px;
    animation: fadeInUp 0.4s ease forwards;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 4000);
}


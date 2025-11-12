// Shared helper functions
function getLoggedEmail() {
  return localStorage.getItem('loggedInUser') || null;
}

function requireLogin(redirectTo = 'index.html') {
  const e = getLoggedEmail();
  if (!e) {
    // if not logged in — go to login
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

function tripsKey(email) { return `trips_${email}`; }
function loadTripsFor(email) {
  try {
    return JSON.parse(localStorage.getItem(tripsKey(email))) || [];
  } catch (err) { return []; }
}
function saveTripsFor(email, trips) {
  localStorage.setItem(tripsKey(email), JSON.stringify(trips));
}

/* ------------------- INDEX (Login) ------------------- */
if (document.getElementById('loginForm')) {
  const form = document.getElementById('loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!email.endsWith('@gmail.com') || password.length < 6) {
      alert('Please use a valid Gmail and password (min 6 chars).');
      return;
    }
    // login success (simple)
    localStorage.setItem('loggedInUser', email);
    // ensure user has trips array (optional)
    if (!localStorage.getItem(tripsKey(email))) localStorage.setItem(tripsKey(email), JSON.stringify([]));
    window.location.href = 'home.html';
  });
}

/* ------------------- HOME (Add Trip) ------------------- */
if (document.getElementById('tripForm')) {
  if (!requireLogin()) {} // will redirect if not logged
  const email = getLoggedEmail();
  // show bottom email + action
  const bottomEmail = document.getElementById('bottomEmail');
  const bottomAction = document.getElementById('bottomAction');
  if (bottomEmail) bottomEmail.textContent = email;
  if (bottomAction) {
    bottomAction.textContent = 'Logout';
    bottomAction.onclick = () => {
      localStorage.removeItem('loggedInUser');
      window.location.href = 'index.html';
    };
  }

  // navigation buttons
  document.getElementById('goDashboard').addEventListener('click', ()=> window.location.href = 'dashboard.html');
  document.getElementById('goSaved').addEventListener('click', ()=> window.location.href = 'saved.html');

  // handle add trip
  const form = document.getElementById('tripForm');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const destination = document.getElementById('destination').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const budget = document.getElementById('budget').value;
    const notes = document.getElementById('notes').value.trim();

    if (!destination || !startDate || !endDate || budget === '') {
      alert('Please fill all required fields.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      alert('End Date cannot be before of Start Date. Enetr valid dates!');
      return;
    }

    const trips = loadTripsFor(email);
    trips.push({ id: Date.now(), destination, startDate, endDate, budget: Number(budget), notes });
    saveTripsFor(email, trips);

    // success behavior
    alert('Trip added successfully!');
    form.reset();
    // update Dashboard automatically if user is viewing (not required here, but nice)
  });
}

/* ------------------- SAVED (Saved Trips) ------------------- */
if (document.getElementById('tripList')) {
  if (!requireLogin()) {}
  const email = getLoggedEmail();

  // bottom action = Home
  const bottomEmail = document.getElementById('bottomEmail');
  const bottomAction = document.getElementById('bottomAction');
  if (bottomEmail) bottomEmail.textContent = email;
  if (bottomAction) {
    bottomAction.textContent = 'Home';
    bottomAction.onclick = () => window.location.href = 'home.html';
  }

  // nav Home button at top
  const navHome = document.getElementById('navHome');
  if (navHome) navHome.addEventListener('click', ()=> window.location.href = 'home.html');

  // render trips grid
  const list = document.getElementById('tripList');
  list.innerHTML = '';
  const trips = loadTripsFor(email);
  if (!trips || trips.length === 0) {
    list.innerHTML = '<p style="color:#666;">No trips saved yet.</p>';
  } else {
    trips.forEach((t) => {
      const d = document.createElement('div');
      d.className = 'trip-card';
      d.innerHTML = `
        <h4>${escapeHtml(t.destination)}</h4>
        <p><strong>From:</strong> ${t.startDate}</p>
        <p><strong>To:</strong> ${t.endDate}</p>
        <p><strong>Budget:</strong> ₹${t.budget}</p>
        <p><strong>Notes:</strong> ${escapeHtml(t.notes || '—')}</p>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button class="btn small-btn" data-id="${t.id}" data-action="edit">Edit</button>
          <button class="btn red small-btn" data-id="${t.id}" data-action="delete">Delete</button>
        </div>
      `;
      list.appendChild(d);
    });

    // attach click handlers (event delegation)
    list.addEventListener('click', function(e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (!id || !action) return;
      if (action === 'delete') {
        if (!confirm('Delete this trip?')) return;
        let arr = loadTripsFor(email).filter(x => String(x.id) !== String(id));
        saveTripsFor(email, arr);
        // refresh page
        window.location.reload();
      } else if (action === 'edit') {
        // simple inline edit prompts (keeps UI small)
        const trips = loadTripsFor(email);
        const trip = trips.find(x => String(x.id) === String(id));
        if (!trip) return alert('Trip not found');
        const dest = prompt('Destination', trip.destination);
        if (dest === null) return;
        const s = prompt('Start Date (YYYY-MM-DD)', trip.startDate);
        if (s === null) return;
        const eDate = prompt('End Date (YYYY-MM-DD)', trip.endDate);
        if (eDate === null) return;
        const bud = prompt('Budget (number)', trip.budget);
        if (bud === null) return;
        if (new Date(eDate) < new Date(s)) return alert('End must be >= Start');
        trip.destination = dest;
        trip.startDate = s;
        trip.endDate = eDate;
        trip.budget = Number(bud);
        saveTripsFor(email, trips);
        window.location.reload();
      }
    });
  }
}

/* ------------------- DASHBOARD ------------------- */
if (document.getElementById('totalTrips')) {
  if (!requireLogin()) {}
  const email = getLoggedEmail();

  const bottomEmail = document.getElementById('bottomEmail');
  const bottomAction = document.getElementById('bottomAction');

  if (bottomEmail) bottomEmail.textContent = email;
  if (bottomAction) {
    bottomAction.textContent = 'Home';
    bottomAction.onclick = () => window.location.href = 'home.html';
  }

    // nav Home button at top
  const nav1Home = document.getElementById('nav1Home'); 
  if (nav1Home) nav1Home.addEventListener('click', ()=> window.location.href = 'dashboard.html');

  // compute and render summary
  const trips = loadTripsFor(email);
  document.getElementById('totalTrips').textContent = trips.length;
  document.getElementById('totalBudget').textContent = trips.reduce((s,t)=> s + Number(t.budget||0), 0);

  const upcoming = trips.filter(t => new Date(t.startDate) >= new Date()).sort((a,b)=> new Date(a.startDate)-new Date(b.startDate))[0];
  document.getElementById('upcomingTrip').textContent = upcoming ? upcoming.destination : 'None';
}

/* ------------------- Utility ------------------- */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; });
}

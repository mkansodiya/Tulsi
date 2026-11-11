/* Tulsi Dental Clinic — site behaviour. No dependencies. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Mobile menu ---------- */
  var drawer = $('#drawer');
  var menuBtn = $('#menu-btn');
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
  }
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      drawer.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      menuBtn.setAttribute('aria-expanded', 'true');
      var first = $('a, button', drawer.querySelector('.drawer__panel'));
      if (first) first.focus();
    });
    $$('[data-close-drawer]', drawer).forEach(function (el) { el.addEventListener('click', closeDrawer); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
      if (e.key === 'Tab') {
        var f = $$('a, button', drawer.querySelector('.drawer__panel'));
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ---------- Opening hours: live "open now" status in India time ---------- */
  var HOURS = {
    ramganj: { 0: [[600, 780]], 1: [[570, 1140]], 2: [[570, 1140]], 3: [[570, 1140]], 4: [[570, 1140]], 5: [[570, 1140]], 6: [[570, 1140]] },
    cvn: { 0: [], 1: [[1020, 1200]], 2: [[1020, 1200]], 3: [[1020, 1200]], 4: [[1020, 1200]], 5: [[1020, 1200]], 6: [[1020, 1200]] }
  };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  function istNow() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
    var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
    return { day: day, min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
  }
  function fmt(m) {
    var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return h + (mm ? ':' + (mm < 10 ? '0' : '') + mm : '') + ' ' + ap;
  }
  function statusFor(key) {
    var h = HOURS[key]; if (!h) return null;
    var now = istNow();
    var today = h[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) return { open: true, text: 'Open now, closes ' + fmt(today[i][1]) };
      if (now.min < today[i][0]) return { open: false, text: 'Closed, opens ' + fmt(today[i][0]) + ' today' };
    }
    for (var d = 1; d <= 7; d++) {
      var dd = (now.day + d) % 7, slots = h[dd] || [];
      if (slots.length) return { open: false, text: 'Closed, opens ' + fmt(slots[0][0]) + ' ' + (d === 1 ? 'tomorrow' : DAYS[dd]) };
    }
    return { open: false, text: 'Closed' };
  }
  $$('[data-status]').forEach(function (el) {
    var s = statusFor(el.getAttribute('data-status'));
    if (!s) return;
    var label = el.getAttribute('data-label');
    el.textContent = (label ? label + ': ' : '') + s.text;
    el.classList.add(s.open ? 'is-open' : 'is-closed');
  });
  var todayIdx = istNow().day;
  $$('.hours tr[data-day]').forEach(function (tr) {
    var days = tr.getAttribute('data-day').split(',').map(Number);
    if (days.indexOf(todayIdx) > -1) tr.classList.add('is-today');
  });

  /* ---------- Gallery filters and lightbox ---------- */
  var filters = $('[data-filters]');
  if (filters) {
    var items = $$('[data-cat]');
    $$('button', filters).forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-filter');
        $$('button', filters).forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        items.forEach(function (it) { it.hidden = !(cat === 'all' || it.getAttribute('data-cat') === cat); });
      });
    });
  }
  var lb = $('#lightbox');
  if (lb && typeof lb.showModal === 'function') {
    var lbImg = $('img', lb), lbCap = $('p', lb);
    $$('[data-full]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        lbImg.src = btn.getAttribute('data-full');
        lbImg.alt = btn.getAttribute('data-caption') || '';
        lbCap.textContent = btn.getAttribute('data-caption') || '';
        lb.showModal();
      });
    });
    $('.lightbox__close', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---------- Tabs ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', on ? 'true' : 'false');
        x.tabIndex = on ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); select(n); n.focus(); }
      });
    });
  });

  /* ---------- Maps load only when asked (saves data on mobile) ---------- */
  $$('[data-map]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(btn.getAttribute('data-map')) + '&output=embed';
      f.title = btn.getAttribute('data-title') || 'Map';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      btn.parentNode.replaceChild(f, btn);
    });
  });

  /* ---------- Booking form ---------- */
  var form = $('#book-form');
  if (form) {
    var params = new URLSearchParams(location.search);
    var pre = { treatment: params.get('treatment'), clinic: params.get('clinic'), dentist: params.get('dentist') };
    if (pre.treatment && form.concern) { form.concern.value = pre.treatment; }
    if (pre.clinic) { var c = form.querySelector('input[name="clinic"][value="' + pre.clinic + '"]'); if (c) c.checked = true; }
    if (pre.dentist && form.dentist) { form.dentist.value = pre.dentist; }

    var dateWrap = $('#date-wrap'), dateInput = $('#bk-date');
    if (dateInput) {
      var t = new Date(); t.setDate(t.getDate() + 2);
      dateInput.min = t.toISOString().slice(0, 10);
    }
    $$('input[name="day"]', form).forEach(function (r) {
      r.addEventListener('change', function () { if (dateWrap) dateWrap.hidden = form.day.value !== 'pick'; });
    });
    form.phone.addEventListener('input', function () { form.phone.value = form.phone.value.replace(/\D/g, '').slice(0, 10); });

    function setErr(field, bad) { field.closest('.field').classList.toggle('has-error', bad); field.setAttribute('aria-invalid', bad ? 'true' : 'false'); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameOk = form.name.value.trim().length > 1;
      var phoneOk = /^[6-9]\d{9}$/.test(form.phone.value);
      var dateOk = form.day.value !== 'pick' || !!(dateInput && dateInput.value);
      setErr(form.name, !nameOk); setErr(form.phone, !phoneOk);
      if (dateInput) setErr(dateInput, !dateOk);
      if (!nameOk) { form.name.focus(); return; }
      if (!phoneOk) { form.phone.focus(); return; }
      if (!dateOk) { dateInput.focus(); return; }

      var clinicLabel = form.querySelector('input[name="clinic"]:checked').getAttribute('data-label');
      var dayLabel = form.day.value === 'pick' ? new Date(dateInput.value + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : form.querySelector('input[name="day"]:checked').getAttribute('data-label');
      var timeLabel = form.querySelector('input[name="time"]:checked').getAttribute('data-label');
      var concern = form.concern.options[form.concern.selectedIndex].text;
      var dentist = form.dentist ? form.dentist.options[form.dentist.selectedIndex].text : 'Any dentist';
      var scheme = form.scheme.checked;

      var box = $('#book-success');
      $('[data-out="name"]', box).textContent = form.name.value.trim().split(' ')[0];
      $('[data-out="phone"]', box).textContent = '+91 ' + form.phone.value.replace(/(\d{5})(\d{5})/, '$1 $2');
      $('[data-out="clinic"]', box).textContent = clinicLabel;
      $('[data-out="when"]', box).textContent = dayLabel + ', ' + timeLabel.toLowerCase();
      $('[data-out="concern"]', box).textContent = concern;
      $('[data-out="dentist"]', box).textContent = dentist;
      $('[data-out="scheme-row"]', box).hidden = !scheme;

      var wa = $('#wa-send');
      if (wa) {
        var msg = 'Appointment request\nName: ' + form.name.value.trim() + '\nMobile: +91 ' + form.phone.value + '\nClinic: ' + clinicLabel + '\nWhen: ' + dayLabel + ', ' + timeLabel + '\nFor: ' + concern + '\nDentist: ' + dentist + (scheme ? '\nScheme member: yes' : '');
        wa.href = 'https://wa.me/917733007007?text=' + encodeURIComponent(msg);
      }
      form.hidden = true;
      box.hidden = false;
      box.querySelector('h2').focus();
    });
    var again = $('#book-again');
    if (again) again.addEventListener('click', function () {
      form.reset(); if (dateWrap) dateWrap.hidden = true;
      $$('.has-error', form).forEach(function (f) { f.classList.remove('has-error'); });
      $('#book-success').hidden = true; form.hidden = false; form.name.focus();
    });
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

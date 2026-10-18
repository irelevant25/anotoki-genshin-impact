(() => {
  const data = JSON.parse(document.getElementById('data').textContent);
  const floor = data.floor;
  const all = data.endpoints;
  const ordinary = all.filter((e) => !e.h);

  const ms = (n) => (n >= 1000 ? (n / 1000).toFixed(2) + ' s' : Math.round(n) + ' ms');
  // Paths and file names reach the page through innerHTML. They come from the
  // spec rather than from a stranger, but a route pattern is free to hold a
  // `<` and the page should not care.
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const size = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : b >= 1024 ? Math.round(b / 1024) + ' KB' : b + ' B');

  // ── Masthead figures ────────────────────────────────────────────────
  const medians = ordinary.map((e) => e.m).sort((a, b) => a - b);
  const median = medians[Math.floor(medians.length / 2)];
  const nearFloor = ordinary.filter((e) => e.m < floor * 2).length;

  document.getElementById('fig-floor').textContent = Math.round(floor);
  document.getElementById('fig-median').textContent = Math.round(median);
  document.getElementById('fig-share').textContent = Math.round((100 * nearFloor) / ordinary.length);
  document.getElementById('fig-slow').textContent = ordinary.filter((e) => e.m >= floor * 2).length;
  document.getElementById('fig-n').textContent = ordinary.length;

  document.getElementById('run-when').textContent = 'measured ' + new Date(data.generated).toLocaleString();
  document.getElementById('run-count').textContent = data.totals.measured + ' of ' + data.totals.get_routes + ' GET routes';
  document.getElementById('run-samples').textContent = data.samples + ' samples each';
  document.getElementById('method-skipped').textContent = data.skipped.length + ' routes could not be called at all, because nothing exists to put in their path or their query.';

  // ── The run before this one ─────────────────────────────────────────
  // Everything below that says "since" comes from here. When there is no
  // previous run - the first report ever generated - `before` is empty, every
  // delta is null, and the comparison section removes itself.
  const before = new Map((data.previous?.endpoints ?? []).map((e) => [e.p, e]));
  const hasPrevious = before.size > 0;

  const deltaOf = (e) => {
    const was = before.get(e.p);
    return was ? { was, ms: e.m - was.m, bytes: e.b - was.b, status: was.s !== e.s } : null;
  };

  // Noise, not change. Two runs on a workstation differ by a few milliseconds
  // for reasons that have nothing to do with the code, and a report that
  // reports those is a report nobody trusts.
  const MOVED = (d) => d && Math.abs(d.ms) > Math.max(8, d.was.m * 0.12);

  if (!hasPrevious) {
    document.getElementById('since')?.remove();
  } else {
    const dates = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    document.getElementById('since-when').textContent = dates(data.previous.generated);

    const paired = all.map((e) => ({ e, d: deltaOf(e) })).filter((x) => x.d);
    const faster = paired.filter((x) => MOVED(x.d) && x.d.ms < 0);
    const slower = paired.filter((x) => MOVED(x.d) && x.d.ms > 0);
    const gone = data.previous.endpoints.filter((e) => !all.some((n) => n.p === e.p));
    const added = all.filter((e) => !before.has(e.p));
    const fixed = paired.filter((x) => x.d.was.s >= 400 && x.e.s < 400);
    const broke = paired.filter((x) => x.d.was.s < 400 && x.e.s >= 400);

    const bytesNow = all.reduce((sum, e) => sum + e.b, 0);
    const bytesWas = data.previous.endpoints.reduce((sum, e) => sum + e.b, 0);

    const signed = (n, unit) => (n > 0 ? '+' : n < 0 ? '−' : '') + unit(Math.abs(n));
    const tone = (n) => (n < 0 ? 'is-good' : n > 0 ? 'is-crit' : 'is-flat');

    const figure = (id, value, note, klass) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.querySelector('.figure-value').innerHTML = value;
      el.querySelector('.figure-label').innerHTML = note;
      el.className = 'figure ' + (klass ?? '');
    };

    const floorDelta = floor - data.previous.floor;
    figure(
      'since-floor',
      `<span class="${tone(floorDelta)}">${signed(floorDelta, (n) => Math.round(n) + '')}</span><span class="unit"> ms</span>`,
      `The floor: ${Math.round(data.previous.floor)} ms → <strong>${Math.round(floor)} ms</strong>`,
    );

    const medOf = (list) => {
      const xs = list.map((e) => e.m).sort((a, b) => a - b);
      return xs.length ? xs[Math.floor(xs.length / 2)] : 0;
    };
    const medNow = medOf(ordinary);
    const medWas = medOf(data.previous.endpoints.filter((e) => !e.h));
    const medDelta = medNow - medWas;
    figure(
      'since-median',
      `<span class="${tone(medDelta)}">${signed(medDelta, (n) => Math.round(n) + '')}</span><span class="unit"> ms</span>`,
      `The median endpoint: ${Math.round(medWas)} ms → <strong>${Math.round(medNow)} ms</strong>`,
    );

    const byteDelta = bytesNow - bytesWas;
    figure('since-bytes', `<span class="${tone(byteDelta)}">${signed(byteDelta, size)}</span>`, `Everything the API answers with: ${size(bytesWas)} → <strong>${size(bytesNow)}</strong>`);

    figure(
      'since-count',
      `<span class="is-good">${faster.length}</span> <span class="figure-sep">/</span> <span class="${slower.length ? 'is-crit' : 'is-flat'}">${slower.length}</span>`,
      `Endpoints measurably faster / slower, out of ${paired.length} in both runs`,
    );

    // ── Movers ────────────────────────────────────────────────────────
    const movers = [...faster, ...slower].sort((a, b) => Math.abs(b.d.ms) - Math.abs(a.d.ms)).slice(0, 12);
    const widest = Math.max(1, ...movers.map((x) => Math.max(x.e.m, x.d.was.m)));

    document.getElementById('movers').innerHTML = movers.length
      ? movers
          .map(({ e, d }) => {
            const better = d.ms < 0;
            return `
          <div class="mover">
            <div class="mover-path">${esc(e.p)}${e.h ? ' <span class="pill pill-warn">fs</span>' : ''}</div>
            <div class="mover-bars">
              <div class="mover-row"><span class="mover-tag">was</span><div class="mover-track"><div class="mover-fill is-was" style="width:${(100 * d.was.m) / widest}%"></div></div><span class="mover-num">${ms(d.was.m)}</span></div>
              <div class="mover-row"><span class="mover-tag">now</span><div class="mover-track"><div class="mover-fill ${better ? 'is-good' : 'is-crit'}" style="width:${(100 * e.m) / widest}%"></div></div><span class="mover-num">${ms(e.m)}</span></div>
            </div>
            <div class="mover-delta ${better ? 'is-good' : 'is-crit'}">${signed(d.ms, ms)}<span class="mover-pct">${Math.round((100 * Math.abs(d.ms)) / d.was.m)}%</span></div>
          </div>`;
          })
          .join('')
      : '<p class="empty">Nothing moved by more than measurement noise.</p>';

    // ── The ledger ────────────────────────────────────────────────────
    const ledger = [
      ['Fixed', fixed.map((x) => `${esc(x.e.p)} — ${x.d.was.s} → ${x.e.s}`), 'is-good'],
      ['Started failing', broke.map((x) => `${esc(x.e.p)} — ${x.d.was.s} → ${x.e.s}`), 'is-crit'],
      ['Gone', gone.map((e) => `${esc(e.p)}${e.s >= 400 ? ` — was answering ${e.s}` : ''}`), 'is-good'],
      ['New', added.map((e) => `${esc(e.p)} — ${ms(e.m)}`), 'is-flat'],
    ].filter(([, items]) => items.length);

    document.getElementById('ledger').innerHTML = ledger.length
      ? ledger
          .map(
            ([title, items, klass]) => `
        <div class="ledger-group">
          <h3 class="ledger-title ${klass}">${title} <span class="ledger-count">${items.length}</span></h3>
          <ul class="ledger-list">${items.map((t) => `<li>${t}</li>`).join('')}</ul>
        </div>`,
          )
          .join('')
      : '<p class="empty">The same routes, answering the same way.</p>';
  }

  // ── Histogram ───────────────────────────────────────────────────────
  // Cut at multiples of the floor rather than at fixed milliseconds. The
  // fixed cuts were drawn when the floor was 126 ms; once it fell to 52 ms
  // nineteen endpoints in twenty landed in "under 100 ms" and the shape this
  // chart exists to show was one bar. Twice the floor is a cut on purpose -
  // it is the line the figures at the top draw between ordinary and slow.
  const cuts = [1.25, 1.5, 2, 4, 10].map((times) => Math.round(floor * times));
  const edges = [0, ...cuts, Infinity];
  const buckets = edges.slice(0, -1).map((lo, i) => {
    const hi = edges[i + 1];
    const label = lo === 0 ? 'under ' + ms(hi) : hi === Infinity ? 'over ' + ms(lo) : ms(lo) + ' – ' + ms(hi);
    return [lo, hi, label, lo >= cuts[4] ? 'is-crit' : lo >= cuts[2] ? 'is-warn' : ''];
  });
  const counts = buckets.map(([lo, hi]) => ordinary.filter((e) => e.m >= lo && e.m < hi).length);
  const peak = Math.max(1, ...counts);
  document.getElementById('hist').innerHTML = buckets
    .map(
      ([, , label, cls], i) => `
        <div class="hist-label">${label}</div>
        <div class="hist-track"><div class="hist-fill ${cls}" style="width:${(100 * counts[i]) / peak}%"></div></div>
        <div class="hist-count">${counts[i]}</div>`,
    )
    .join('');

  // ── Ranked bars ─────────────────────────────────────────────────────
  const top = [...ordinary].sort((a, b) => b.m - a.m).slice(0, 10);
  const worst = top[0]?.m || 1;
  document.getElementById('ranked').innerHTML = top
    .map((e) => {
      const own = Math.max(0, e.m - floor);
      return `
        <div class="rank">
          <div class="rank-path">${esc(e.p)}</div>
          <div class="rank-ms">${ms(e.m)}</div>
          <div class="rank-track">
            <div style="display:flex;height:100%">
              <div class="rank-fill is-floor" style="width:${(100 * Math.min(floor, e.m)) / worst}%"></div>
              <div class="rank-fill" style="width:${(100 * own) / worst}%"></div>
            </div>
          </div>
          <div class="rank-note">${ms(own)} of its own${e.b > 65536 ? ' · ' + size(e.b) + ' returned' : ''}</div>
        </div>`;
    })
    .join('');

  // ── Scatter ─────────────────────────────────────────────────────────
  const canvas = document.getElementById('scatter');
  const points = ordinary.filter((e) => e.b > 0);

  function draw() {
    const styles = getComputedStyle(document.documentElement);
    const ink = styles.getPropertyValue('--ink-soft').trim();
    const muted = styles.getPropertyValue('--muted').trim();
    const line = styles.getPropertyValue('--line').trim();
    const accent = styles.getPropertyValue('--accent').trim();
    const crit = styles.getPropertyValue('--crit').trim();

    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * ratio;
    canvas.height = h * ratio;
    const c = canvas.getContext('2d');
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    c.clearRect(0, 0, w, h);

    const pad = { l: 54, r: 14, t: 14, b: 38 };
    const plotW = w - pad.l - pad.r;
    const plotH = h - pad.t - pad.b;

    // Log scales, with the ends taken from the run. They were fixed at 60 ms
    // and 2.5 s, which suited a floor of 126 ms; at 52 ms three points in four
    // sat below the axis and were drawn clamped onto it, floor line included.
    const times = points.map((e) => e.m);
    const sizes = points.map((e) => e.b);
    const loT = Math.max(1, Math.min(floor, ...times) * 0.8);
    const hiT = Math.max(loT * 10, ...times) * 1.3;
    const loB = Math.max(64, Math.min(...sizes, 1024) * 0.8);
    const hiB = Math.max(loB * 10, ...sizes) * 1.6;
    const xMin = Math.log10(loB);
    const xMax = Math.log10(hiB);
    const yMin = Math.log10(loT);
    const yMax = Math.log10(hiT);
    const X = (bytes) => pad.l + (plotW * (Math.log10(Math.max(loB, bytes)) - xMin)) / (xMax - xMin);
    const Y = (t) => pad.t + plotH - (plotH * (Math.log10(Math.max(loT, t)) - yMin)) / (yMax - yMin);
    const within = (lo, hi) => (n) => n > lo && n < hi;

    c.font = '11px "IBM Plex Mono", monospace';
    c.strokeStyle = line;
    c.fillStyle = muted;
    c.lineWidth = 1;

    for (const bytes of [1024, 32768, 1048576, 33554432, 1073741824].filter(within(loB, hiB))) {
      const x = X(bytes);
      c.globalAlpha = 0.5;
      c.beginPath();
      c.moveTo(x, pad.t);
      c.lineTo(x, pad.t + plotH);
      c.stroke();
      c.globalAlpha = 1;
      c.textAlign = 'center';
      c.fillText(size(bytes), x, h - 14);
    }
    for (const t of [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000].filter(within(loT * 1.15, hiT))) {
      const y = Y(t);
      c.globalAlpha = 0.5;
      c.beginPath();
      c.moveTo(pad.l, y);
      c.lineTo(pad.l + plotW, y);
      c.stroke();
      c.globalAlpha = 1;
      c.textAlign = 'right';
      c.fillText(ms(t), pad.l - 8, y + 4);
    }

    // The floor, which most points sit on.
    c.strokeStyle = muted;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(pad.l, Y(floor));
    c.lineTo(pad.l + plotW, Y(floor));
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = muted;
    c.textAlign = 'left';
    c.fillText('the floor', pad.l + 6, Y(floor) - 6);

    for (const e of points) {
      const slow = e.m > floor * 1.5;
      c.beginPath();
      c.arc(X(e.b), Y(e.m), slow ? 5 : 3.2, 0, Math.PI * 2);
      c.fillStyle = slow ? crit : accent;
      c.globalAlpha = slow ? 0.9 : 0.42;
      c.fill();
    }
    c.globalAlpha = 1;

    // Name the two that make the point: the slowest, and the biggest answer
    // that is not slow - one costs time without bytes, the other bytes
    // without time. Found in the run rather than named here, so the labels
    // follow the data when a fix moves either of them.
    c.fillStyle = ink;
    c.font = '11px "IBM Plex Sans", sans-serif';
    const label = (e, dy) => {
      if (!e) return;
      // Whichever side of the point has the room.
      const left = X(e.b) > pad.l + plotW / 2;
      c.textAlign = left ? 'right' : 'left';
      c.fillText(e.p, X(e.b) + (left ? -10 : 10), Y(e.m) + dy);
    };
    const slowest = [...points].sort((a, b) => b.m - a.m)[0];
    const biggest = [...points].filter((e) => e !== slowest && e.m <= floor * 2).sort((a, b) => b.b - a.b)[0];
    label(slowest, -10);
    label(biggest, 14);
  }

  draw();
  window.addEventListener('resize', draw);
  if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', draw);
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ── Table ───────────────────────────────────────────────────────────
  const body = document.getElementById('rows');
  const rowcount = document.getElementById('rowcount');
  const filter = document.getElementById('filter');
  const chips = {
    slow: document.getElementById('chip-slow'),
    fail: document.getElementById('chip-fail'),
    heavy: document.getElementById('chip-heavy'),
  };
  let sortKey = 'm';
  let sortDir = -1;

  const statusPill = (s) => (s === 200 ? '' : `<span class="pill ${s >= 500 ? 'pill-crit' : 'pill-warn'}">${s}</span>`);

  // Blank rather than zero when there is nothing to compare against: a dash
  // in every row of a first report would read as "no change", not "no data".
  const deltaCell = (e) => {
    if (!hasPrevious) return '';
    const d = deltaOf(e);
    if (!d) return '<span class="delta is-new">new</span>';
    if (!MOVED(d)) return '<span class="delta is-flat">—</span>';
    const better = d.ms < 0;
    return `<span class="delta ${better ? 'is-good' : 'is-crit'}">${better ? '−' : '+'}${ms(Math.abs(d.ms))}</span>`;
  };

  function render() {
    const needle = filter.value.trim().toLowerCase();
    let rows = all.filter((e) => {
      if (needle && !(e.p + ' ' + e.f).toLowerCase().includes(needle)) return false;
      if (chips.slow.getAttribute('aria-pressed') === 'true' && e.m <= floor * 1.5) return false;
      if (chips.fail.getAttribute('aria-pressed') === 'true' && e.s === 200) return false;
      if (chips.heavy.getAttribute('aria-pressed') === 'true' && !e.h) return false;
      return true;
    });

    rows.sort((a, b) => {
      const get = (e) => {
        if (sortKey === 'own') return e.m - floor;
        if (sortKey === 'delta') return deltaOf(e)?.ms ?? 0;
        return e[sortKey];
      };
      const x = get(a);
      const y = get(b);
      if (typeof x === 'string') return sortDir * x.localeCompare(y);
      return sortDir * (x - y);
    });

    body.innerHTML =
      rows
        .map((e) => {
          const own = Math.max(0, e.m - floor);
          const cls = e.m > floor * 3 ? 'pill-crit' : e.m > floor * 1.5 ? 'pill-warn' : 'pill-good';
          return `<tr>
            <td class="path">${esc(e.p)}${e.h ? ' <span class="pill pill-warn">fs</span>' : ''}</td>
            <td class="num">${ms(e.m)}</td>
            <td class="num"><span class="pill ${cls}">${own < 1 ? '—' : '+' + ms(own)}</span></td>
            <td class="num">${deltaCell(e)}</td>
            <td class="num">${ms(e.hi)}</td>
            <td class="num">${e.b ? size(e.b) : '—'}</td>
            <td>${statusPill(e.s) || '200'}</td>
            <td>${esc(e.f)}</td>
          </tr>`;
        })
        .join('') || '<tr><td colspan="8" class="empty">Nothing matches that.</td></tr>';

    rowcount.textContent = `${rows.length} of ${all.length} measured endpoints shown · ${data.skipped.length} could not be called`;
  }

  filter.addEventListener('input', render);
  for (const chip of Object.values(chips)) {
    chip.addEventListener('click', () => {
      chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      render();
    });
  }
  document.querySelectorAll('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      sortDir = sortKey === key ? -sortDir : key === 'p' || key === 'f' ? 1 : -1;
      sortKey = key;
      render();
    });
  });

  render();
})();

  (() => {
    const data = JSON.parse(document.getElementById('data').textContent);
    const floor = data.floor;
    const all = data.endpoints;
    const ordinary = all.filter((e) => !e.h);

    const ms = (n) => (n >= 1000 ? (n / 1000).toFixed(2) + ' s' : Math.round(n) + ' ms');
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
    document.getElementById('method-skipped').textContent =
      data.skipped.length + ' routes could not be called at all, because nothing exists to put in their path.';

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
        `The floor: ${Math.round(data.previous.floor)} ms → <strong>${Math.round(floor)} ms</strong>`
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
        `The median endpoint: ${Math.round(medWas)} ms → <strong>${Math.round(medNow)} ms</strong>`
      );

      const byteDelta = bytesNow - bytesWas;
      figure(
        'since-bytes',
        `<span class="${tone(byteDelta)}">${signed(byteDelta, size)}</span>`,
        `Everything the API answers with: ${size(bytesWas)} → <strong>${size(bytesNow)}</strong>`
      );

      figure(
        'since-count',
        `<span class="is-good">${faster.length}</span> <span class="figure-sep">/</span> <span class="${slower.length ? 'is-crit' : 'is-flat'}">${slower.length}</span>`,
        `Endpoints measurably faster / slower, out of ${paired.length} in both runs`
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
            <div class="mover-path">${e.p}${e.h ? ' <span class="pill pill-warn">fs</span>' : ''}</div>
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
        ['Fixed', fixed.map((x) => `${x.e.p} — ${x.d.was.s} → ${x.e.s}`), 'is-good'],
        ['Started failing', broke.map((x) => `${x.e.p} — ${x.d.was.s} → ${x.e.s}`), 'is-crit'],
        ['Gone', gone.map((e) => `${e.p}${e.s >= 400 ? ` — was answering ${e.s}` : ''}`), 'is-good'],
        ['New', added.map((e) => `${e.p} — ${ms(e.m)}`), 'is-flat'],
      ].filter(([, items]) => items.length);

      document.getElementById('ledger').innerHTML = ledger.length
        ? ledger
            .map(
              ([title, items, klass]) => `
        <div class="ledger-group">
          <h3 class="ledger-title ${klass}">${title} <span class="ledger-count">${items.length}</span></h3>
          <ul class="ledger-list">${items.map((t) => `<li>${t}</li>`).join('')}</ul>
        </div>`
            )
            .join('')
        : '<p class="empty">The same routes, answering the same way.</p>';
    }

    // ── Histogram ───────────────────────────────────────────────────────
    const buckets = [
      [0, 100, 'under 100 ms', ''],
      [100, 125, '100 – 125 ms', ''],
      [125, 150, '125 – 150 ms', ''],
      [150, 200, '150 – 200 ms', ''],
      [200, 400, '200 – 400 ms', 'is-warn'],
      [400, 1000, '400 ms – 1 s', 'is-warn'],
      [1000, Infinity, 'over 1 s', 'is-crit'],
    ];
    const counts = buckets.map(([lo, hi]) => ordinary.filter((e) => e.m >= lo && e.m < hi).length);
    const peak = Math.max(...counts);
    document.getElementById('hist').innerHTML = buckets
      .map(
        ([, , label, cls], i) => `
        <div class="hist-label">${label}</div>
        <div class="hist-track"><div class="hist-fill ${cls}" style="width:${(100 * counts[i]) / peak}%"></div></div>
        <div class="hist-count">${counts[i]}</div>`
      )
      .join('');

    // ── Ranked bars ─────────────────────────────────────────────────────
    const top = [...ordinary].sort((a, b) => b.m - a.m).slice(0, 10);
    const worst = top[0].m;
    document.getElementById('ranked').innerHTML = top
      .map((e) => {
        const own = Math.max(0, e.m - floor);
        return `
        <div class="rank">
          <div class="rank-path">${e.p}</div>
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

      // Log scales: both axes span four orders of magnitude.
      const xMin = Math.log10(256);
      const xMax = Math.log10(64 * 1048576);
      const yMin = Math.log10(60);
      const yMax = Math.log10(2500);
      const X = (bytes) => pad.l + (plotW * (Math.log10(Math.max(256, bytes)) - xMin)) / (xMax - xMin);
      const Y = (t) => pad.t + plotH - (plotH * (Math.log10(Math.max(60, t)) - yMin)) / (yMax - yMin);

      c.font = '11px "IBM Plex Mono", monospace';
      c.strokeStyle = line;
      c.fillStyle = muted;
      c.lineWidth = 1;

      for (const bytes of [1024, 32768, 1048576, 33554432]) {
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
      for (const t of [100, 250, 1000, 2000]) {
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

      // Name the two that make the point.
      c.fillStyle = ink;
      c.font = '11px "IBM Plex Sans", sans-serif';
      const label = (path, dx, dy, align) => {
        const e = points.find((p) => p.p === path);
        if (!e) return;
        c.textAlign = align;
        c.fillText(path, X(e.b) + dx, Y(e.m) + dy);
      };
      label('/api/enemies/full', -10, -10, 'right');
      label('/api/characters-voice-overs', -10, 14, 'right');
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

    const statusPill = (s) =>
      s === 200 ? '' : `<span class="pill ${s >= 500 ? 'pill-crit' : 'pill-warn'}">${s}</span>`;

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
            <td class="path">${e.p}${e.h ? ' <span class="pill pill-warn">fs</span>' : ''}</td>
            <td class="num">${ms(e.m)}</td>
            <td class="num"><span class="pill ${cls}">${own < 1 ? '—' : '+' + ms(own)}</span></td>
            <td class="num">${deltaCell(e)}</td>
            <td class="num">${ms(e.hi)}</td>
            <td class="num">${e.b ? size(e.b) : '—'}</td>
            <td>${statusPill(e.s) || '200'}</td>
            <td>${e.f}</td>
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

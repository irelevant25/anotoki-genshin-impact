(() => {
  const tabs = [...document.querySelectorAll('.tab')];
  const views = new Map([...document.querySelectorAll('.view')].map((v) => [v.id.replace('view-', ''), v]));
  const filter = document.getElementById('filter');
  let current = 'frontend';

  // What each tab filters over. Frontend filters whole page cards by a
  // data-name; the other two filter their items by data-search.
  const selectors = {
    frontend: '.fe-page',
    backend: '.endpoint',
    database: '.table-doc',
  };

  const show = (name) => {
    current = name;
    for (const t of tabs) t.classList.toggle('is-active', t.dataset.tab === name);
    for (const [key, view] of views) view.classList.toggle('is-active', key === name);
    applyFilter();
  };

  const applyFilter = () => {
    const q = filter.value.trim().toLowerCase();
    const view = views.get(current);
    const items = view.querySelectorAll(selectors[current]);
    let shown = 0;
    for (const el of items) {
      const hay = (el.dataset.search || el.dataset.name || el.textContent).toLowerCase();
      const hit = !q || hay.includes(q);
      el.classList.toggle('is-filtered-out', !hit);
      if (hit) shown++;
    }
    // Hide a section/group whose children are all filtered away, so the page
    // does not leave empty headings behind.
    const containers =
      current === 'frontend'
        ? view.querySelectorAll('.fe-section, .fe-site')
        : current === 'backend'
          ? view.querySelectorAll('.be-group')
          : [];
    for (const c of containers) {
      const any = [...c.querySelectorAll(selectors[current])].some((el) => !el.classList.contains('is-filtered-out'));
      c.classList.toggle('is-filtered-out', !any);
    }

    let empty = view.querySelector('.no-results');
    if (!shown) {
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'no-results';
        empty.textContent = 'Nothing matches that.';
        view.appendChild(empty);
      }
      empty.classList.remove('is-filtered-out');
    } else if (empty) {
      empty.classList.add('is-filtered-out');
    }
  };

  for (const t of tabs) t.addEventListener('click', () => show(t.dataset.tab));
  filter.addEventListener('input', applyFilter);

  // A cross-link into another tab switches to it before jumping, so the target
  // is actually visible. The anchor prefix says which tab it lives in.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    const tab = id.startsWith('be') ? 'backend' : id.startsWith('db-') ? 'database' : id.startsWith('fe-') ? 'frontend' : null;
    if (tab && tab !== current) {
      // Clear the filter so the target is not hidden by it, then switch.
      filter.value = '';
      show(tab);
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      e.preventDefault();
    }
  });

  // Deep link on load (#be-... etc.) selects the right tab.
  if (location.hash) {
    const id = location.hash.slice(1);
    const tab = id.startsWith('be') ? 'backend' : id.startsWith('db-') ? 'database' : 'frontend';
    show(tab);
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }));
  }
})();

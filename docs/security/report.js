(() => {
  // Filter the list by severity. Clicking a count toggles it; clicking it again,
  // or clicking another, changes the filter; the pressed one can be turned off
  // to show everything. Pure view state — nothing here changes the findings.
  const figures = [...document.querySelectorAll('.sev-fig')];
  const cards = [...document.querySelectorAll('.finding')];
  let active = null;

  const apply = () => {
    for (const card of cards) {
      card.classList.toggle('is-hidden', active !== null && card.dataset.sev !== active);
    }
    for (const fig of figures) {
      fig.setAttribute('aria-pressed', String(fig.dataset.filter === active));
    }
  };

  for (const fig of figures) {
    fig.addEventListener('click', () => {
      // A zero-count severity has nothing to show, so its button does nothing.
      if (fig.classList.contains('is-zero')) {
        return;
      }
      active = active === fig.dataset.filter ? null : fig.dataset.filter;
      apply();
    });
  }
})();

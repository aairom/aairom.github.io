/* ================================================================
   GITHUB PAGES — PERSONAL WEBSITE (aairom)
   main.js  |  Vanilla JS — no dependencies required
================================================================ */

'use strict';

/* ----------------------------------------------------------------
   CONFIG
---------------------------------------------------------------- */
const GITHUB_USER = 'aairom';
const API_BASE    = 'https://api.github.com';

/* ----------------------------------------------------------------
   1. FOOTER YEAR
---------------------------------------------------------------- */
(function setYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

/* ----------------------------------------------------------------
   2. MOBILE NAVIGATION TOGGLE
---------------------------------------------------------------- */
(function mobileNav() {
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('is-open');
    links.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('is-open');
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ----------------------------------------------------------------
   3. ACTIVE NAV LINK on scroll
---------------------------------------------------------------- */
(function activeNavOnScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'is-active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  sections.forEach(sec => observer.observe(sec));
})();

/* ----------------------------------------------------------------
   4. HEADER SCROLL SHADOW
---------------------------------------------------------------- */
(function headerShadow() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 10
      ? '0 1px 12px rgba(0,0,0,0.3)'
      : 'none';
  }, { passive: true });
})();

/* ----------------------------------------------------------------
   5. GITHUB REPOSITORIES — fetch, render, search, filter
---------------------------------------------------------------- */
(function githubRepos() {
  const grid           = document.getElementById('reposGrid');
  const countEl        = document.getElementById('repoCount');
  const socialCountEl  = document.getElementById('socialRepoCount');
  const aboutRepoCount = document.getElementById('aboutRepoCount');
  const emptyEl        = document.getElementById('reposEmpty');
  const errorEl        = document.getElementById('reposError');
  const searchEl       = document.getElementById('repoSearch');
  const filterBtns     = document.querySelectorAll('.filter-btn');
  const paginationEl   = document.getElementById('reposPagination');
  const prevBtn        = document.getElementById('reposPrev');
  const nextBtn        = document.getElementById('reposNext');
  const pageInfoEl     = document.getElementById('reposPageInfo');

  const PAGE_SIZE = 5;

  if (!grid) return;

  /* Language → dot colour mapping (GitHub palette) */
  const LANG_COLORS = {
    'Python':           '#3572A5',
    'JavaScript':       '#f1e05a',
    'TypeScript':       '#2b7489',
    'Shell':            '#89e051',
    'Jupyter Notebook': '#DA5B0B',
    'HTML':             '#e34c26',
    'CSS':              '#563d7c',
    'Dockerfile':       '#384d54',
    'Go':               '#00ADD8',
    'Java':             '#b07219',
    'Ruby':             '#701516',
    'Rust':             '#dea584',
    'C':                '#555555',
    'C++':              '#f34b7d',
  };

  /** Format a date as "Updated Dec 2024" */
  function formatDate(iso) {
    const d = new Date(iso);
    return `Updated ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }

  /** Build a single repo card element */
  function buildCard(repo) {
    const card = document.createElement('a');
    card.href   = repo.html_url;
    card.target = '_blank';
    card.rel    = 'noopener noreferrer';
    card.className = 'repo-card';
    card.setAttribute('aria-label', `${repo.name} repository`);

    const langColor = LANG_COLORS[repo.language] || '#8b949e';
    const langDot   = repo.language
      ? `<span class="repo-meta-item">
           <span class="lang-dot" style="background:${langColor}"></span>
           ${repo.language}
         </span>`
      : '';

    const stars = repo.stargazers_count
      ? `<span class="repo-meta-item">
           <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
             <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
           </svg>
           ${repo.stargazers_count}
         </span>`
      : '';

    const forks = repo.forks_count
      ? `<span class="repo-meta-item">
           <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" aria-hidden="true">
             <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
           </svg>
           ${repo.forks_count}
         </span>`
      : '';

    const forkBadge = repo.fork
      ? '<span class="repo-card__fork-badge">fork</span>'
      : '';

    card.innerHTML = `
      <div class="repo-card__name">
        ${repo.name}${forkBadge}
      </div>
      <p class="repo-card__desc${repo.description ? '' : ' repo-card__desc--empty'}">${repo.description || 'No description — add one on GitHub.'}</p>
      <div class="repo-card__meta">
        ${langDot}${stars}${forks}
      </div>
      <div class="repo-card__updated">${formatDate(repo.updated_at)}</div>
    `;

    return card;
  }

  /* State */
  let allRepos     = [];
  let activeFilter = 'all';
  let searchQuery  = '';
  let currentPage  = 1;

  /** Filter + render visible repos with pagination */
  function render() {
    const query = searchQuery.toLowerCase();

    const visible = allRepos.filter(repo => {
      const matchSearch = !query
        || repo.name.toLowerCase().includes(query)
        || (repo.description || '').toLowerCase().includes(query);

      const matchLang = activeFilter === 'all'
        || (activeFilter === 'other'
            ? !['Python','JavaScript','Shell','Jupyter Notebook'].includes(repo.language)
            : repo.language === activeFilter);

      return matchSearch && matchLang;
    });

    grid.innerHTML = '';

    if (visible.length === 0) {
      emptyEl.hidden = false;
      if (paginationEl) paginationEl.hidden = true;
    } else {
      emptyEl.hidden = true;

      const totalPages = Math.ceil(visible.length / PAGE_SIZE);
      // Clamp currentPage in case filter/search reduced the total
      if (currentPage > totalPages) currentPage = totalPages;

      const start = (currentPage - 1) * PAGE_SIZE;
      const pageRepos = visible.slice(start, start + PAGE_SIZE);

      pageRepos.forEach(repo => grid.appendChild(buildCard(repo)));

      // Update pagination controls
      if (paginationEl) {
        const showPagination = totalPages > 1;
        paginationEl.hidden = !showPagination;

        if (showPagination) {
          if (pageInfoEl) pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
          if (prevBtn) prevBtn.disabled = currentPage === 1;
          if (nextBtn) nextBtn.disabled = currentPage === totalPages;
        }
      }
    }
  }

  /** Fetch all repos (handles pagination) */
  /**
   * Primary: load pre-fetched repos.json written by GitHub Actions workflow.
   * Fallback: hit the live GitHub API unauthenticated (60 req/hr shared limit).
   * The token never appears in source — it lives only in GitHub Actions secrets.
   */
  async function fetchAllRepos() {
    // ── Try repos.json first (generated by workflow, no rate-limit risk) ──
    try {
      const res = await fetch('repos.json', { cache: 'no-cache' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Check if repos.json is stale (older than 6 hours)
          const latestUpdate = getLatestUpdate(data);
          const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
          if (latestUpdate > sixHoursAgo) {
            return data;
          }
          console.log('repos.json is stale (last update:', new Date(latestUpdate).toISOString(), '), falling back to live API');
        }
      }
    } catch (_) {
      // repos.json absent or malformed — fall through to live API
    }

    // ── Fallback: unauthenticated GitHub API ──────────────────────────────
    let page    = 1;
    let repos   = [];
    let hasMore = true;

    while (hasMore) {
      const url = `${API_BASE}/users/${GITHUB_USER}/repos?sort=updated&per_page=100&page=${page}`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

      const batch = await res.json();
      repos = repos.concat(batch);
      hasMore = batch.length === 100;
      page++;
    }

    return repos;
  }

  /** Get the most recent updated_at timestamp from repo data */
  function getLatestUpdate(repos) {
    let latest = 0;
    for (const repo of repos) {
      if (repo.updated_at) {
        const ts = new Date(repo.updated_at).getTime();
        if (ts > latest) latest = ts;
      }
    }
    return latest;
  }

  /** Init — fetch repos and wire up controls */
  async function init() {
    try {
      allRepos = await fetchAllRepos();

      // Update all repo count displays (subtitle, contact panel, about panel)
      if (countEl)        countEl.textContent        = allRepos.length;
      if (socialCountEl)  socialCountEl.textContent  = `${allRepos.length} Repos`;
      if (aboutRepoCount) aboutRepoCount.textContent = allRepos.length;

      // Render
      render();

    } catch (err) {
      console.error('Failed to load repos:', err);
      grid.innerHTML = '';
      if (errorEl) errorEl.hidden = false;
    }
  }

  /* Search input — debounced */
  let searchTimer;
  if (searchEl) {
    searchEl.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchEl.value.trim();
        currentPage = 1;
        render();
      }, 220);
    });
  }

  /* Language filter buttons */
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      activeFilter = btn.dataset.lang;
      currentPage = 1;
      render();
    });
  });

  /* Pagination buttons */
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        render();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentPage++;
      render();
    });
  }

  /* Kick off */
  init();
})();

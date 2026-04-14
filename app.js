/* ================================================================
   Accordion behaviour
================================================================ */
document.querySelectorAll('.accordion-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    const panel = document.getElementById(btn.dataset.target);
    if (panel) {
      panel.style.display = expanded ? 'none' : '';
    }
  });
});

/* ================================================================
   Helpers
================================================================ */
const $ = id => document.getElementById(id);

function buildHeaders(token) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function spinner(msg = 'Loading…') {
  return `
    <div class="flex items-center gap-3 text-gray-400 text-sm py-4">
      <svg class="spinner w-5 h-5 text-pink-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
      ${msg}
    </div>`;
}

function errorHTML(msg) {
  return `<p class="text-pink-400 text-sm py-4">⚠ ${msg}</p>`;
}

function langDot(color) {
  return `<span class="inline-block w-3 h-3 rounded-full mr-1" style="background:${color || '#6e7681'}"></span>`;
}

/* ================================================================
   Fetch: User Profile (REST)
================================================================ */
async function fetchProfile(username, headers) {
  const res = await fetch(`https://api.github.com/users/${username}`, { headers });
  if (!res.ok) throw new Error(`User not found (${res.status})`);
  return res.json();
}

/* ================================================================
   Fetch: Pinned Repos (GraphQL)
   Falls back to top-starred REST repos when no token is available.
================================================================ */
async function fetchPinnedRepos(username, headers) {
  if (!headers.Authorization) {
    // GraphQL requires authentication — skip and use REST fallback
    throw new Error('No token — using REST fallback');
  }
  const query = `
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: [REPOSITORY]) {
          nodes {
            ... on Repository {
              name description url stargazerCount forkCount
              primaryLanguage { name color }
              isPrivate
            }
          }
        }
      }
    }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (!res.ok) throw new Error('GraphQL request failed');
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  const nodes = json.data?.user?.pinnedItems?.nodes ?? [];
  return nodes;
}

/* ================================================================
   Fetch: Top repos fallback (REST) — used when GraphQL unavailable
================================================================ */
async function fetchTopRepos(username, headers) {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=stars&per_page=6&type=public`,
    { headers }
  );
  if (!res.ok) throw new Error(`Could not fetch repos (${res.status})`);
  return res.json();
}

/* ================================================================
   Fetch: Starred Repos (REST)
================================================================ */
async function fetchStarredRepos(username, headers) {
  const res = await fetch(
    `https://api.github.com/users/${username}/starred?per_page=6&sort=created`,
    { headers }
  );
  if (!res.ok) throw new Error(`Could not fetch starred repos (${res.status})`);
  return res.json();
}

/* ================================================================
   Fetch: Profile README (REST)
================================================================ */
async function fetchReadme(username, headers) {
  // The special profile repo has the same name as the username
  const res = await fetch(
    `https://api.github.com/repos/${username}/${username}/readme`,
    { headers: { ...headers, Accept: 'application/vnd.github.raw+json' } }
  );
  if (!res.ok) return null; // README not available
  return res.text();
}

/* ================================================================
   Fetch: Contribution Calendar (GraphQL)
================================================================ */
async function fetchContributions(username, headers) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            months { name firstDay totalWeeks }
            weeks {
              contributionDays {
                color contributionCount date weekday
              }
            }
          }
        }
      }
    }`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (!res.ok) throw new Error('Contributions request failed');
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data?.user?.contributionsCollection?.contributionCalendar ?? null;
}

/* ================================================================
   Fetch: Achievements / Badges (GraphQL)
================================================================ */
async function fetchAchievements(username, headers) {
  if (!headers.Authorization) return [];
  const query = `
    query($login: String!) {
      user(login: $login) {
        badges {
          nodes {
            displayName
            badgeUrl
          }
        }
      }
    }`;
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { login: username } }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (json.errors) return [];
    return json.data?.user?.badges?.nodes ?? [];
  } catch {
    return [];
  }
}

/* ================================================================
   Render: Profile
================================================================ */
function renderProfile(user) {
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const stats = [
    { label: 'Repositories', value: user.public_repos },
    { label: 'Followers',    value: user.followers },
    { label: 'Following',    value: user.following },
    { label: 'Gists',        value: user.public_gists },
  ];

  const statCards = stats.map(s => `
    <div class="stat-card rounded-xl px-4 py-3 text-center min-w-[80px]">
      <p class="text-pink-400 text-xl font-bold">${s.value}</p>
      <p class="text-gray-400 text-xs mt-0.5">${s.label}</p>
    </div>`).join('');

  const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`;
  const svgBuilding = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>`;
  const svgLink = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`;
  const svgTwitter = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`;

  const location  = user.location  ? `<span class="flex items-center gap-1">${svgPin} ${user.location}</span>`  : '';
  const company   = user.company   ? `<span class="flex items-center gap-1">${svgBuilding} ${user.company}</span>`   : '';
  const blog      = user.blog      ? `<a href="${user.blog}" target="_blank" rel="noopener"
                                        class="flex items-center gap-1 text-pink-400 hover:underline">${svgLink} ${user.blog}</a>` : '';
  const twitterUn = user.twitter_username
                      ? `<a href="https://twitter.com/${user.twitter_username}" target="_blank"
                            rel="noopener" class="flex items-center gap-1 text-pink-400 hover:underline">
                           ${svgTwitter} @${user.twitter_username}</a>` : '';

  const metaItems = [location, company, blog, twitterUn].filter(Boolean);
  const metaHTML  = metaItems.length
    ? `<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-2">${metaItems.join('')}</div>` : '';

  return `
    <img src="${user.avatar_url}" alt="${user.login}'s avatar"
         class="w-28 h-28 rounded-full shrink-0 object-cover shadow-lg" />
    <div class="flex-1 space-y-3">
      <div>
        <h2 class="text-2xl font-bold text-white">${user.name || user.login}</h2>
        <a href="https://github.com/${user.login}" target="_blank" rel="noopener"
           class="text-pink-400 text-sm hover:underline">@${user.login}</a>
      </div>
      ${user.bio ? `<p class="text-gray-300 text-sm leading-relaxed">${user.bio}</p>` : ''}
      ${metaHTML}
      <p class="text-gray-500 text-xs">Joined ${joinDate}</p>
      <div class="flex flex-wrap gap-3 pt-1">${statCards}</div>
    </div>`;
}

/* ================================================================
   Render: Achievements
================================================================ */
function renderAchievements(badges) {
  if (!badges || badges.length === 0) return '';
  const badgeCards = badges.map(b => `
    <div class="flex flex-col items-center gap-1 text-center" title="${b.displayName}">
      <img src="${b.badgeUrl}" alt="${b.displayName}"
           class="w-10 h-10 object-contain rounded-full" />
      <span class="text-xs text-gray-400 leading-tight max-w-[72px] truncate">${b.displayName}</span>
    </div>`).join('');
  return `
    <div class="achievements-divider mt-4 pt-4">
      <p class="text-xs text-gray-500 uppercase tracking-widest mb-3">Achievements</p>
      <div class="flex flex-wrap gap-5">${badgeCards}</div>
    </div>`;
}

/* ================================================================
   Render: Repo Card
================================================================ */
function renderRepoCard(repo, isPinned = true) {
  const name  = repo.name;
  const desc  = repo.description || '<span class="italic text-gray-500">No description</span>';
  const stars = isPinned ? repo.stargazerCount : repo.stargazers_count;
  const forks = isPinned ? repo.forkCount      : repo.forks_count;
  const lang  = isPinned ? repo.primaryLanguage : (repo.language ? { name: repo.language, color: null } : null);
  const url   = isPinned ? repo.url : repo.html_url;

  return `
    <a href="${url}" target="_blank" rel="noopener"
       class="repo-card block rounded-xl p-4 transition group space-y-2">
      <div class="flex items-start justify-between gap-2">
        <p class="font-semibold text-white group-hover:text-pink-400 transition text-sm truncate">${name}</p>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-pink-600 shrink-0 mt-0.5" fill="none"
             viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M5 5h14M5 5v14M5 5l14 14"/>
        </svg>
      </div>
      <p class="text-gray-400 text-xs leading-relaxed line-clamp-2">${desc}</p>
      <div class="flex items-center gap-4 text-gray-500 text-xs pt-1">
        ${lang ? `<span>${langDot(lang.color)}${lang.name}</span>` : ''}
        <span class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${stars}</span>
        <span class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9v1a2 2 0 002 2h8a2 2 0 002-2V9"/><line x1="12" y1="12" x2="12" y2="15"/></svg> ${forks}</span>
      </div>
    </a>`;
}

/* ================================================================
   Render: Contribution Calendar
================================================================ */
function renderContributions(calendar) {
  if (!calendar) return errorHTML('Contribution data not available.');

  const { totalContributions, weeks, months } = calendar;

  // Build month labels row
  const monthLabels = months.map(m =>
    `<span style="grid-column: span ${m.totalWeeks}"
           class="text-gray-500 text-xs truncate">${m.name}</span>`
  ).join('');

  // Build cells
  const cells = weeks.map(week => {
    const dayCells = week.contributionDays.map(day => {
      // Map GitHub's default green scale to our blue-to-pink theme
      const baseColor = day.color === '#ebedf0' ? '#040e1e'
                      : day.color === '#9be9a8' ? '#1e3a6c'
                      : day.color === '#40c463' ? '#2563eb'
                      : day.color === '#30a14e' ? '#9333ea'
                      : day.color === '#216e39' ? '#db2777'
                      : day.color; // keep GitHub default if unexpected

      return `<div class="contrib-cell" title="${day.date}: ${day.contributionCount} contribution(s)"
                   style="background:${baseColor}"></div>`;
    }).join('');
    return `<div class="flex flex-col gap-[1px]">${dayCells}</div>`;
  }).join('');

  return `
    <div class="mb-3 text-sm text-gray-400">
      <span class="text-white font-semibold text-base">${totalContributions.toLocaleString()}</span>
      contributions in the last year
    </div>
    <div class="overflow-x-auto pb-2">
      <div class="inline-grid gap-[1px] mb-1" style="grid-template-columns: repeat(${weeks.length}, 7px)">
        ${monthLabels}
      </div>
      <div class="flex gap-[1px]">${cells}</div>
    </div>
    <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
      <span>Less</span>
      <div class="contrib-legend-0 w-3 h-3 rounded-sm"></div>
      <div class="contrib-legend-1 w-3 h-3 rounded-sm"></div>
      <div class="contrib-legend-2 w-3 h-3 rounded-sm"></div>
      <div class="contrib-legend-3 w-3 h-3 rounded-sm"></div>
      <div class="contrib-legend-4 w-3 h-3 rounded-sm"></div>
      <span>More</span>
    </div>`;
}

/* ================================================================
   Main: load all sections
================================================================ */
async function loadProfile() {
  const username = $('usernameInput').value.trim();
  const token    = $('tokenInput').value.trim();
  const errMsg   = $('errorMsg');

  errMsg.textContent = '';
  errMsg.classList.add('hidden');

  if (!username) {
    errMsg.textContent = 'Please enter a GitHub username.';
    errMsg.classList.remove('hidden');
    return;
  }

  const btn = $('searchBtn');
  btn.disabled = true;

  const headers = buildHeaders(token);

  // Show results container with spinners
  $('results').style.removeProperty('display');
  $('profileContent').innerHTML  = spinner('Loading profile…');
  $('reposContent').innerHTML    = spinner('Loading repositories…');
  $('readmeContent').innerHTML   = spinner('Loading README…');
  $('contribContent').innerHTML  = spinner('Loading contributions…');
  $('starsContent').innerHTML    = spinner('Loading starred repos…');
  $('readmeSection').classList.remove('hidden');
  $('achievementsContent').classList.add('hidden');
  $('achievementsContent').innerHTML = '';

  // Ensure all accordion panels are visible
  document.querySelectorAll('.accordion-btn').forEach(b => {
    b.setAttribute('aria-expanded', 'true');
    const panel = document.getElementById(b.dataset.target);
    if (panel) panel.style.display = '';
  });

  // ── Profile ──────────────────────────────────────────────────
  let user;
  try {
    user = await fetchProfile(username, headers);
    $('profileContent').innerHTML = renderProfile(user);
    // User found — hide header and search form
    $('pageHeader').classList.add('hidden');
    $('searchSection').classList.add('hidden');
    $('searchedUsername').textContent = username;
  } catch (err) {
    $('profileContent').innerHTML = errorHTML(err.message);
    $('results').style.display = 'none';
    btn.disabled = false;
    return; // abort if user not found
  }

  // ── Achievements (GraphQL — requires token) ───────────────────
  (async () => {
    if (!token) return;
    const badges = await fetchAchievements(username, headers);
    if (badges.length > 0) {
      $('achievementsContent').innerHTML = renderAchievements(badges);
      $('achievementsContent').classList.remove('hidden');
    }
  })();

  // ── Pinned Repos (GraphQL) → fallback REST ────────────────────
  (async () => {
    try {
      const pinned = await fetchPinnedRepos(username, headers);
      if (pinned.length > 0) {
        $('reposContent').innerHTML = pinned.map(r => renderRepoCard(r, true)).join('');
      } else {
        // No pinned repos — fall back to top-starred
        throw new Error('no pinned');
      }
    } catch {
      try {
        const repos = await fetchTopRepos(username, headers);
        if (repos.length === 0) {
          $('reposContent').innerHTML = '<p class="text-gray-500 text-sm py-4">No public repositories found.</p>';
        } else {
          $('reposContent').innerHTML =
            `<p class="col-span-2 text-gray-500 text-xs mb-2 italic">No pinned repos — showing top starred.</p>` +
            repos.map(r => renderRepoCard(r, false)).join('');
        }
      } catch (err2) {
        $('reposContent').innerHTML = errorHTML(err2.message);
      }
    }
  })();

  // ── README ────────────────────────────────────────────────────
  (async () => {
    try {
      const md = await fetchReadme(username, headers);
      if (!md) {
        $('readmeSection').classList.add('hidden');
      } else {
        $('readmeContent').innerHTML = marked.parse(md);
      }
    } catch {
      $('readmeSection').classList.add('hidden');
    }
  })();

  // ── Contributions (GraphQL — requires token) ──────────────────
  (async () => {
    if (!token) {
      $('contribContent').innerHTML = `
        <div class="info-box rounded-xl p-4 text-sm text-gray-400 flex gap-3 items-start">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-pink-400 shrink-0 mt-0.5" fill="none"
               viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
          </svg>
          <div>
            <p class="font-semibold text-white mb-1">Personal Access Token required</p>
            <p>The GitHub GraphQL API (used to retrieve the contribution calendar) requires authentication.
               Please add your
               <a href="https://github.com/settings/tokens" target="_blank" rel="noopener"
                  class="text-pink-400 hover:underline">Personal Access Token</a>
               in the field above and search again.</p>
          </div>
        </div>`;
      return;
    }
    try {
      const calendar = await fetchContributions(username, headers);
      $('contribContent').innerHTML = renderContributions(calendar);
    } catch (err) {
      $('contribContent').innerHTML = errorHTML(err.message);
    }
  })();

  // ── Starred Repos (REST) ──────────────────────────────────────
  (async () => {
    try {
      const starred = await fetchStarredRepos(username, headers);
      if (starred.length === 0) {
        $('starsContent').innerHTML = '<p class="text-gray-500 text-sm py-4">No starred repositories found.</p>';
      } else {
        $('starsContent').innerHTML = starred.map(r => renderRepoCard(r, false)).join('');
      }
    } catch (err) {
      $('starsContent').innerHTML = errorHTML(err.message);
    }
  })();

  btn.disabled = false;
}

/* ================================================================
   Event listeners
================================================================ */
$('searchBtn').addEventListener('click', loadProfile);
$('usernameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') loadProfile();
});

// New Search: restore header + search form, hide results
$('newSearchBtn').addEventListener('click', () => {
  $('pageHeader').classList.remove('hidden');
  $('searchSection').classList.remove('hidden');
  $('results').style.display = 'none';
  $('achievementsContent').classList.add('hidden');
  $('achievementsContent').innerHTML = '';
});

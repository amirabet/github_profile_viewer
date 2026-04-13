# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-04-13

### Added
- User achievements section inside the Profile panel — fetched via GitHub GraphQL API (requires token); hidden when no badges are returned
- "New Search" button in the results bar to return to the search form without a page refresh
- "Viewing: `<username>`" label in the results header bar

### Changed
- Page background updated to `#040e1e` (deep navy)
- All panels now use a **frozen black glass effect**: semi-transparent dark background with `backdrop-filter: blur(14px)` and a gradient border using `-webkit-linear-gradient(-70deg, #db469f 0%, #2188ff 100%)`
- Search button updated to use the pink-to-blue gradient instead of a solid pink background
- Results panels render in a **2-column grid** on screens wider than 800 px (README and Contributions span full width); single column on smaller screens
- After a successful profile search the **page header and search form are hidden**, keeping the focus on the results
- Removed border on the user's profile picture
- Removed pink focus ring on accordion panel header buttons; hover now uses a subtle glass overlay
- Pinned repos fetch now skips GraphQL immediately when no Personal Access Token is provided, avoiding an unnecessary 401 round-trip before falling back to the REST top-starred repos endpoint
- Fixed `pinnedItems` GraphQL query to use proper list syntax `types: [REPOSITORY]`
- Inner card elements (stat cards, repo cards, contribution info box) updated to use transparent/glass-compatible backgrounds

## [1.0.0] - 2026-04-13

### Added
- Single-page `index.html` GitHub Profile Viewer
- Dark theme with pink (`rose`/`pink`) accent colours powered by Tailwind CSS (CDN)
- Username and optional Personal Access Token input form
- Accordion sections (collapsible panels) for:
  - **Profile & Info** — avatar, name, bio, stats (repos, followers, following, gists), location, company, blog, Twitter
  - **Pinned Repositories** — fetched via GitHub GraphQL API; falls back to top-starred repos via REST API when no pinned repos exist
  - **README** — renders the special profile README (`<username>/<username>`) as formatted HTML using `marked.js`; section hidden when not available
  - **Contributions** — contribution calendar grid fetched via GitHub GraphQL API with colour-coded cells
- Informational prompt when a Personal Access Token is required (GraphQL / contributions)
- Accessible keyboard navigation (Enter key triggers search)
- Responsive layout (mobile-friendly grid)
- Loading spinners for each data section
- Graceful error handling per section (one failure does not block others)

[Unreleased]: https://github.com/amirabet/github_profile_viewer/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/amirabet/github_profile_viewer/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/amirabet/github_profile_viewer/releases/tag/v1.0.0

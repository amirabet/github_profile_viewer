# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/amirabet/github_profile_viewer/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/amirabet/github_profile_viewer/releases/tag/v1.0.0

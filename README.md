# GitHub Profile Viewer

A single-page HTML application that displays a GitHub user's profile information in an elegant dark/pink-themed UI powered by **Tailwind CSS**.

## Features

- 🌑 **Dark theme** with pink accent colours
- 🔽 **Accordion sections** — collapse/expand each panel independently
  - **Profile & Info** — avatar, name, bio, stats, location, company, blog, Twitter
  - **Pinned Repositories** — via GitHub GraphQL API (falls back to top-starred repos)
  - **README** — renders the user's special profile README as formatted HTML
  - **Contributions** — full-year contribution calendar grid
- 🔑 **Token-ready** — all fetch actions are pre-built; just supply your GitHub Personal Access Token to unlock GraphQL features (contributions, pinned repos)
- 📱 **Responsive** — works on mobile and desktop

## Usage

1. Open `index.html` in any modern web browser — no build step required.
2. Enter a **GitHub username** in the search field.
3. *(Optional)* Paste a **GitHub Personal Access Token** to enable:
   - Pinned repository data
   - Contribution calendar
   - Higher API rate limits (60 → 5,000 requests/hour)
4. Click **View Profile** or press **Enter**.

### Getting a Personal Access Token

1. Go to [https://github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Select the `read:user` and `repo` scopes
4. Copy the token and paste it into the token field

> **Note:** Your token is never stored or sent anywhere other than the GitHub API.

## Technologies

| Tool | Purpose |
|------|---------|
| [Tailwind CSS](https://tailwindcss.com/) (CDN) | Styling |
| [marked.js](https://marked.js.org/) (CDN) | Markdown rendering for README |
| [GitHub REST API](https://docs.github.com/en/rest) | Profile & repositories |
| [GitHub GraphQL API](https://docs.github.com/en/graphql) | Pinned repos & contributions |

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

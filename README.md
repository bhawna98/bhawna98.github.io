# Bhawna Sharma: terminal edition

A second version of the portfolio, styled as a Bloomberg terminal. Same content and
confidentiality rules as `../website`. Plain HTML/CSS/JS, no build step, hosted on GitHub Pages.

## How it works

- The page loads "BSHARMA SP Equity" as if it were a security. Each section is a terminal function:
  DES profile, GP career graph, DEAL selected work, HP history, CN coverage, ANR recommendations,
  HELP questions, MSG contact, CF download.
- Visitors type a function (or an alias such as `work`, `cv`, `news`, `pdf`, `hire`) into the command
  line and press Enter, press 1 to 9, or click the menu. Esc returns to DES. `/` focuses the command line.
- Deep links work: `#DEAL`, `#deal-rfp`, `#deal-jp`, `#deal-ic`, `#CN`, and so on.
- Without JavaScript every function is shown as one long page, so nothing is lost.

## Files

| File | Purpose |
|---|---|
| `index.html` | All content. |
| `assets/css/terminal.css` | Styles. Colours are defined once at the top. |
| `assets/js/terminal.js` | Command line, shortcuts, clock, ticker, coverage filters, contact form, career-graph crosshair. |
| `assets/js/analytics.js` | Google Analytics. The measurement ID is set once at the top; each function is reported as its own page (`/GP`, `/DEAL`...). Off on localhost. |
| `assets/fonts/` | Martian Mono and IBM Plex Sans Condensed, self-hosted (SIL Open Font License, included). |
| `Bhawna-Sharma-Resume.pdf` | Copied from `../applications/website/Bhawna_Sharma_Resume.pdf` (edit the .tex there, rebuild with `tectonic`, then copy here). |
| `scripts/test.py` | 220+ Playwright checks: every function, command line, aliases, autocomplete, deep links, filters, no-JS and reduced-motion fallbacks, three screen sizes. |
| `scripts/og.py` | Regenerates the link-preview image. |
| `scripts/publish.sh` | Runs the tests, commits and pushes. GitHub Pages redeploys automatically. |

## Publishing

Live at **https://bhawna98.github.io/**, served by GitHub Pages from the `main` branch of
`github.com/bhawna98/bhawna98.github.io`. This folder is its own git repo, separate from `../`.

### Updating the site

1. Edit `index.html` (content) or `assets/css/terminal.css` (look).
2. Preview: `python3 -m http.server 8000`, then open http://localhost:8000
3. Publish: `scripts/publish.sh "Describe the change"`

The script runs the tests and refuses to publish if any fail. To refresh the résumé after rebuilding it
in `../applications/website`, run `scripts/publish.sh --copy-pdf`. If you change the headshot or headline, also run
`python3 scripts/og.py` so link previews match.

### One-time setup (already done locally; only needed on a new machine)

```sh
git clone https://github.com/bhawna98/bhawna98.github.io.git website-terminal
```

After editing: `python3 scripts/test.py` should print `FAIL 0`.

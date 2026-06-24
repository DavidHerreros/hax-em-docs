# Hax documentation

User-oriented documentation for [Hax (`hax-em`)](https://github.com/DavidHerreros/hax-em) —
a suite of tools for studying conformational heterogeneity in Cryo-EM data. Built with
[MkDocs](https://www.mkdocs.org/) and [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/).

## Preview locally

```bash
# (recommended) create and activate a fresh environment first
pip install -r requirements.txt
mkdocs serve
```

Then open <http://127.0.0.1:8000>. Pages live-reload as you edit the Markdown in `docs/`.

## Build the static site

```bash
mkdocs build --strict
```

The output is written to `site/` (git-ignored).

## Project layout

```
docs/
├── index.md                  # Landing page
├── getting-started/          # Installation, CLI, core concepts
├── programs/                 # One page per CLI program
├── workflows/                # Pipelines + real-case examples
├── support/                  # Contact & references
├── assets/                   # Logo and images
└── stylesheets/extra.css     # Custom theme styling
mkdocs.yml                    # Site configuration & navigation
requirements.txt              # Documentation build dependencies
```

## Deployment

The GitHub Actions workflow in [`.github/workflows/docs.yml`](.github/workflows/docs.yml)
builds the site and publishes it to the `gh-pages` branch on every push to `main`. Enable
GitHub Pages for the repository with the **`gh-pages` branch** as the source.

Adding a new program page? Create `docs/programs/<name>.md` and add it to the `nav:` section
of `mkdocs.yml`.

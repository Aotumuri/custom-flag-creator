# Custom Flag Creator

Static GitHub Pages site for building layered flags from the SVG parts in `custom/`.

## Local preview

Serve the repository root with any static file server. One simple option is:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

## GitHub Pages

1. Push the repository to GitHub.
2. In the repository settings, set Pages to deploy from GitHub Actions.
3. Push to `main` or run the `Deploy Pages` workflow manually.

## Share links

The current flag state is encoded into the URL hash as a compressed payload when the browser supports
`CompressionStream`. Browsers without that API fall back to a plain URL-safe JSON payload.

# Strangford Regattas (Vite + React)

Local dev instructions

Install dependencies:

```bash
npm install
```

Start dev server (opens at http://localhost:5173):

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Where to add content

- Homepage text: edit `src/pages/Home.jsx` and paste the text inside the `<section className="home-content">` element.
- Regatta PDFs: place PDFs in `public/pdfs/` and set the `pdfUrl` for each item in `src/pages/NOR.jsx` (e.g. `/pdfs/regatta1.pdf`).

Notes

- The Results page embeds an external site via an iframe; some sites block embedding and may not display. A fallback link is provided.
- The site uses the favicon from the original site by default; replace the link in `index.html` if you prefer a local icon.


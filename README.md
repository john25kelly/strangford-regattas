# Strangford Lough Regattas (Vite + React)

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

Deploy to GitHub pages:

```bash
npm run deploy
```

To update the local events.json from the live site, run:

```bash
python3 scripts/import_calendar.py --url "https://docs.google.com/spreadsheets/d/1aJbtVHiTU1XrvAq1aW7ZJ2kxeRPzdDFi29Xq55htjg4/export?format=csv&gid=0"
```

Where to add content

- Homepage text: edit `src/pages/Home.jsx` and paste the text inside the `<section className="home-content">` element.
- WhatsApp QR image: place the QR image file at `public/whatsapp-qr.jpg` (the homepage will display it automatically).
- Regatta PDFs: place PDFs in `public/pdfs/` and set the `pdfUrl` for each item in `src/pages/NOR.jsx` (e.g. `/pdfs/regatta1.pdf`).

Notes

- The Results page embeds an external site via an iframe; some sites block embedding and may not display. A fallback link is provided.
- The site uses the favicon from the original site by default; replace the link in `index.html` if you prefer a local icon.

import React from 'react'

const images = [
  { id: 1, src: 'gallery/img1.jpg', alt: 'Sailing race 1' },
  { id: 2, src: 'gallery/img2.jpg', alt: 'Sailing race 2' },
  { id: 3, src: 'gallery/img3.jpg', alt: 'Sailing race 3' },
  { id: 4, src: 'gallery/img4.jpg', alt: 'Sailing race 4' },
  { id: 5, src: 'gallery/img5.jpg', alt: 'Sailing race 5' },
  { id: 6, src: 'gallery/img6.jpg', alt: 'Sailing race 6' }
]

// small SVG placeholder data URL (lightweight)
const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="100%" height="100%" fill="#e9eef5"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, Helvetica, sans-serif" font-size="16">Image not available</text></svg>')}`

// Helper: return the correct src for an image entry. If the src is already absolute (http/https)
// return it as-is. If it's a local/relative path, prefix it with import.meta.env.BASE_URL so the
// path works when the app is deployed under a subpath (e.g. GitHub Pages).
function resolveSrc(src) {
  if (!src) return src
  const s = String(src)
  if (/^https?:\/\//i.test(s)) return s
  // remove leading slash to avoid double-slashes when base ends with '/'
  const trimmed = s.replace(/^\//, '')
  return `${import.meta.env.BASE_URL || '/'}${trimmed}`
}

export default function Gallery() {
  return (
    <div className="page gallery">
      <h1>Gallery</h1>
      <p className="muted">A small selection of sailing images — replace these with your own photos when ready.</p>

      <section className="gallery-grid">
        {images.map(img => (
          <figure key={img.id} className="gallery-item">
            <a href={resolveSrc(img.src)} target="_blank" rel="noreferrer">
              <img
                src={resolveSrc(img.src)}
                alt={img.alt}
                loading="lazy"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder }}
              />
            </a>
            <figcaption className="muted">{img.alt}</figcaption>
          </figure>
        ))}
      </section>
    </div>
  )
}

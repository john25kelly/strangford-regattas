import React from 'react'

export default function Results() {
  const resultsUrl = 'https://halsail.com/Result/Club/3815'

  return (
    <div className="page results">
      <h1>Results</h1>
       <div className="iframe-wrap">
        <iframe
          title="Results"
          src={resultsUrl}
          frameBorder="0"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>

      <p className="note">If the embedded viewer doesn't load, open the results in a new tab: <a href={resultsUrl} target="_blank" rel="noreferrer">Open results</a>.</p>
    </div>
  )
}

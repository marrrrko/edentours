import React from 'react'
import Gallery from 'react-grid-gallery'

export default function FlickrSection({ pageSection }) {
  return (
    <div className="w-full overflow-hidden relative my-5 px-10">
      <Gallery images={pageSection.gridConfig} enableImageSelection={false} />
    </div>
  )
}

import React from 'react'
import Gallery from 'react-grid-gallery'

export default function FlickrGallery({ gridConfig }) {
  console.log('Got grid config ' + gridConfig)
  return <div>{gridConfig && <Gallery images={gridConfig} />}</div>
}

import React from 'react'
import FeatureImage from './feature-image'
import FlickrSection from './flickr-section'
import HtmlSection from './html-section'
import MapHubSection from './maphub-section'
import TourDatesSection from './tour-dates-section'

export default function Post({ title, pageContent, feature_image }) {
  const pageSections = pageContent.map((pageSection, index) => {
    switch (pageSection.type) {
      case 'html':
        return <HtmlSection key={index} pageSection={pageSection} />
      case 'flickr':
        return <FlickrSection key={index} pageSection={pageSection} />
      case 'maphub':
        return <MapHubSection key={index} pageSection={pageSection} />
      case 'tourdates':
        return <TourDatesSection key={index} />
      default:
        return <span></span>
    }
  })

  return (
    <>
      {feature_image && (
        <FeatureImage title={title} featureImage={feature_image} />
      )}
      <div className="pt-8 pb-24">{pageSections}</div>
    </>
  )
}

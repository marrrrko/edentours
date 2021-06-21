import React from 'react'
import FeatureImage from './feature-image'
import FlickrSection from './flickr-section'
import HtmlSection from './html-section'
import MapHubSection from './maphub-section'
import TourDatesSection from './tour-dates-section'
import TagIndex from './tag-index'

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
        return <TourDatesSection key={index} pageSection={pageSection} />
      case 'tagindex':
        return (
          <div
            key={index}
            className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4"
          >
            {pageSection.content && (
              <h2
                title={JSON.stringify(pageSection.otherParams, null, ' ')}
                className="text-lg font-bold mb-2"
              >
                {pageSection.content}
              </h2>
            )}
            <TagIndex postGroups={pageSection.postGroups} />
          </div>
        )
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

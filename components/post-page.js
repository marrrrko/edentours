import React from 'react'
import Gallery from 'react-grid-gallery'

export default function Post({
  title,
  slug,
  html,
  pageContent,
  feature_image
}) {
  let titleImageTextClasses = 'image-text-overlay text-3xl'
  if (title && title.startsWith('*')) {
    titleImageTextClasses = titleImageTextClasses + ' text-black'
    title = title.slice(1)
  }

  return (
    <>
      {feature_image && (
        <div className="relative text-center text-white font-bold">
          <img className="mx-auto" src={feature_image} />
          {title && !title.startsWith('_') && (
            <div className={titleImageTextClasses}>
              <div>{title}</div>
            </div>
          )}
        </div>
      )}
      <div className="pt-8 pb-24">
        {pageContent.map((pageSection, index) => {
          if (pageSection.type === 'html') {
            return (
              <div
                key={index}
                className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4"
                dangerouslySetInnerHTML={createMarkup(pageSection)}
              ></div>
            )
          } else if (pageSection.type === 'flickr') {
            return (
              <div
                key={index}
                className="w-full overflow-hidden relative my-5 px-10"
              >
                <Gallery
                  images={pageSection.gridConfig}
                  enableImageSelection={false}
                />
              </div>
            )
          } else if (pageSection.type === 'maphub') {
            return (
              <div
                key={index}
                className="w-full mx-auto my-5 px-10 md:px-20"
                dangerouslySetInnerHTML={createMarkup(pageSection)}
              ></div>
            )
          }
        })}
      </div>
    </>
  )
}

function createMarkup(section) {
  return {
    __html: section.html
  }
}

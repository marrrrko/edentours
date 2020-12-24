import React from 'react'

export default function FeatureImage({ title, featureImage }) {
  let titleImageTextClasses = 'image-text-overlay text-3xl'
  if (title && title.startsWith('*')) {
    titleImageTextClasses = titleImageTextClasses + ' text-black'
    title = title.slice(1)
  }

  return (
    <div className="relative text-center text-white font-bold">
      <img className="mx-auto" src={featureImage} />
      {title && !title.startsWith('_') && (
        <div className={titleImageTextClasses}>
          <div>{title}</div>
        </div>
      )}
    </div>
  )
}

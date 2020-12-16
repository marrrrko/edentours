export default function Post({ title, slug, html, feature_image }) {
  let titleImageTextClasses = 'image-text-overlay text-3xl'
  if (title && title.startsWith('*')) {
    titleImageTextClasses = titleImageTextClasses + ' text-black'
    title = title.slice(1)
  }

  return (
    <>
      {feature_image && (
        <div className="relative text-center text-white font-bold">
          <img src={feature_image} />
          {title && !title.startsWith('_') && (
            <div className={titleImageTextClasses}>{title}</div>
          )}
        </div>
      )}
      <div
        className="w-full md:w-3/5 lg:2/5 mx-auto pt-8 my-5 px-4"
        dangerouslySetInnerHTML={createMarkup(html)}
      ></div>
    </>
  )
}

function createMarkup(html) {
  return {
    __html: html
  }
}

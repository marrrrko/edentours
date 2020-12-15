export default function Post({ title, slug, html, feature_image }) {
  return (
    <>
      {feature_image && (
        <div className="relative text-center text-white">
          <img src={feature_image} />
          {title && !title.startsWith('_') && (
            <div className="image-text-overlay text-3xl">{title}</div>
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

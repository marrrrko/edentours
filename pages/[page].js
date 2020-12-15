import { fetchPostBySlug } from '../utils/content-api'
import DefaultErrorPage from 'next/error'

const Page = ({ slug, html }) => {
  if (!slug) {
    return <DefaultErrorPage statusCode={404} />
  }

  return (
    <div
      className="w-full md:w-3/5 lg:2/5 mx-auto pt-8 my-5 px-4"
      dangerouslySetInnerHTML={createMarkup(html)}
    ></div>
  )
}

function createMarkup(html) {
  return {
    __html: html
  }
}

export async function getServerSideProps(context) {
  const { page } = context.query

  if (page === 'robots.txt' || page === 'favicon.ico') return { props: {} }

  console.log(`Ctx: ${JSON.stringify(context.query)}`)
  const pagePostData = await fetchPostBySlug(page)

  if (!pagePostData || !pagePostData.slug) return { props: {} }

  //console.log(`Fetched place: ${JSON.stringify(pagePostData)}`)
  return { props: { ...pagePostData } }
}

export default Page

/*
Plan is simple:
  * All posts served as pages
  * Post images are big and contain post title unless it starts with underscore
  * Galleries are nice
  * If gallery item caption is markdown link: render text in image and image is link
  * Fix all links to use new url (and cached)
  * Main page is special post  
*/

import { fetchPostBySlug } from '../utils/content-api'
import DefaultErrorPage from 'next/error'

const Index = ({ slug, html }) => {
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

export async function getServerSideProps() {
  const pagePostData = await fetchPostBySlug('index')

  if (!pagePostData || !pagePostData.slug) return { props: {} }

  return { props: { ...pagePostData } }
}

export default Index

import { fetchPostBySlug } from '../utils/ghost'
import { buildPageContent } from '../utils/page-content'
import DefaultErrorPage from 'next/error'
import Post from '../components/post'
import Router from 'next/router'

const Page = (props) => {
  if (!props.slug) {
    return <DefaultErrorPage statusCode={404} />
  }

  return <Post {...props} />
}

export async function getServerSideProps(context) {
  const { page } = context.query

  if (page === 'robots.txt' || page === 'favicon.ico') return { props: {} }

  const post = await fetchPostBySlug(page)
  const pagePostData = await buildPageContent(post)

  if (!pagePostData || !pagePostData.slug) {
    console.log(`Could not retrieve post "${page}"`)
    return { props: {} }
  }

  return { props: { ...pagePostData } }
}

export default Page

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}

/*
Plan is simple:
  * All posts served as pages
  * Post images are big and contain post title unless it starts with underscore
  * Galleries are nice
  * If gallery item caption is markdown link: render text in image and image is link
  * Fix all links to use new url (and cached)
  * Scheduling module embedded as iframe our using some special tag
*/

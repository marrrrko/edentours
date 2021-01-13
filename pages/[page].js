import { fetchPostBySlug } from '../utils/ghost'
import { buildPageContent } from '../utils/page-content'
import Error from './_error'
import Post from '../components/post-page'
import Router from 'next/router'

const Page = (props) => {
  if (!props.slug) {
    return <Error statusCode={404} title="Hiç bir şey!" />
  }

  return <Post {...props} />
}

export async function getServerSideProps(context) {
  const { page } = context.query

  if (page === 'robots.txt' || page === 'favicon.ico') return { props: {} }

  const post = await fetchPostBySlug(page)
  if (!post || !post.slug) {
    return { props: {} }
  }

  const pagePostData = await buildPageContent(post)

  return { props: { ...pagePostData } }
}

export default Page

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}

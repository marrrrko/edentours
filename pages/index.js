import { fetchPostBySlug } from '../utils/ghost'
import { buildPageContent } from '../utils/page-content'
import DefaultErrorPage from 'next/error'
import Post from '../components/post'
import Router from 'next/router'

const Index = (props) => {
  if (!props.slug) {
    return <DefaultErrorPage statusCode={404} />
  }

  return <Post {...props} />
}

export async function getServerSideProps(context) {
  const post = await fetchPostBySlug('index')
  const pagePostData = await buildPageContent(post)

  if (!pagePostData || !pagePostData.slug) {
    console.log(`Could not retrieve post "${page}"`)
    return { props: {} }
  }

  return { props: { ...pagePostData } }
}

Router.onRouteChangeComplete = () => {
  document.querySelector('.page-content').scrollTo(0, 0)
}

export default Index

import { fetchPostBySlug } from '../utils/ghost'
import DefaultErrorPage from 'next/error'
import Post from '../components/post'

const Index = (props) => {
  if (!props.slug) {
    return <DefaultErrorPage statusCode={404} />
  }

  return <Post {...props} />
}

export async function getServerSideProps() {
  const pagePostData = await fetchPostBySlug('index')

  if (!pagePostData || !pagePostData.slug) return { props: {} }

  return { props: { ...pagePostData } }
}

export default Index

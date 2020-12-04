import { fetchPublishedPostsWithTag } from '../utils/content-api'
import TopBar from '../components/top-bar'
import PostList from '../components/post-list'

export default function More({posts}) {
  return (
    <div>
      <TopBar />
      <PostList posts={posts} />
    </div>
  )
}

export async function getServerSideProps() {
  const posts = await fetchPublishedPostsWithTag('page:more')
  return {
    props: {
      posts
    }
  }
}
import { fetchPublishedPostsWithTag } from '../utils/content-api'
import PostList from '../components/post-list'

export default function More({ posts }) {
  return (
    <div>
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

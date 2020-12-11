import { fetchPublishedPostsWithTag } from '../utils/content-api'
import PostList from '../components/post-list'

export default function TheLand({ posts }) {
  return (
    <div>
      <PostList posts={posts} />
    </div>
  )
}

export async function getServerSideProps() {
  const posts = await fetchPublishedPostsWithTag('page:land')
  return {
    props: {
      posts
    }
  }
}

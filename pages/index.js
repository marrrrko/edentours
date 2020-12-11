import {
  fetchPublishedPostsWithTag,
  fetchPublishedPostById
} from '../utils/content-api'
import TopBar from '../components/top-bar'
import PostList from '../components/post-list'

export default function Home({ posts, front }) {
  return (
    <div>
      {front && (
        <div>
          <div className="relative text-center text-white">
            <div className="absolute inset-0 text-4xl align-middle pt-40 font-bold font-serif">
              Eden•Tours
            </div>
            <img src={front.feature_image} />
          </div>
          <div
            className="space-y-4 w-full md:w-3/5 lg:2/5 mx-auto pt-8 font-sans px-4"
            dangerouslySetInnerHTML={createMarkup(front)}
          ></div>
        </div>
      )}
      <div className="w-full md:w-3/5 lg:2/5 mx-auto pt-8 font-sans my-5  px-4">
        <h3 className="mb-4 text-lg font-serif font-bold">Upcomming Tours:</h3>
      </div>
      <div className="w-full md:w-3/5 lg:2/5 mx-auto font-sans my-5 px-8">
        <div className="pl-3 py-6 w-full bg-yellow-300 font-lg font-bold">
          <span className="">
            January 5th @ 21:00 GMT - In the footsteps of the apostle Paul
          </span>
          <button className="right-0 float-right mr-4 bg-gray-200 p-2 -mt-2 rounded">
            Book
          </button>
        </div>
        <div className="pl-3 py-6 w-full bg-yellow-50 font-lg font-bold">
          <span className="">
            January 17th @ 21:00 GMT - History of the empires
          </span>
          <button className="right-0 float-right mr-4 bg-gray-200 p-2 -mt-2 rounded">
            Book
          </button>
        </div>

        <div className="pl-3 py-6 w-full bg-yellow-300 font-lg font-bold">
          <span className="">
            February 8th @ 21:00 GMT - In the footsteps of the apostle Paul
          </span>
          <button className="right-0 float-right mr-4 bg-gray-200 p-2 -mt-2 rounded">
            Book
          </button>
        </div>
      </div>
      <PostList posts={posts} />
    </div>
  )
}

function createMarkup(post) {
  return {
    __html: post.html
  }
}

export async function getServerSideProps() {
  const posts = await fetchPublishedPostsWithTag('page:tours')
  const front = await fetchPublishedPostById('5fd3865ea0d85400010954c0')
  //const frontPost = posts.filter((p) => p.id === '5fd3865ea0d85400010954c0')[0]
  return {
    props: {
      posts,
      front
    }
  }
}

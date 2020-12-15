export default function PostList({ posts }) {
  return (
    <div className="w-full md:w-3/5 lg:2/5 mx-auto pt-8 font-serif">
      {posts.map((post) => {
        return (
          <div key={post.id} className="w-full mx-auto mb-8 px-4">
            <h2 className="text-lg font-bold font-serif">{post.title}</h2>
            <div
              className="space-y-4 font-serif"
              dangerouslySetInnerHTML={createMarkup(post)}
            ></div>
          </div>
        )
      })}
    </div>
  )
}

function createMarkup(post) {
  return {
    __html: post.html
  }
}

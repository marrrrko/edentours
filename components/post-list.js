export default function PostList({ posts }) {
  return (
    <div className="w-full md:w-3/5 lg:2/5 mx-auto pt-8">
      {posts.map((post) => {
        return (
          <div key={post.id} className="px-5 w-full mx-auto mb-8">
            <h2 className="text-lg font-bold ">{post.title}</h2>
            <div dangerouslySetInnerHTML={createMarkup(post)}></div>
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
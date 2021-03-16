import Link from 'next/link'

const capitalize = (word) =>
  word && word.length ? `${word[0].toUpperCase()}${word.slice(1)}` : ''

export default function TagIndex({ postGroups }) {
  return postGroups.map((postGroup) => {
    return (
      <div key={postGroup.name}>
        {postGroup.name != 'all' && postGroups.length > 1 && (
          <h3 className="mt-8 mb-4 text-lg">{capitalize(postGroup.name)}</h3>
        )}
        <ul className="list-none">
          {postGroup.posts.map((post, index) => {
            return (
              <li key={index}>
                <Link href={`/${post.slug}`}>
                  <a className="hover:bg-gray-200 p-1 pb-2 md:px-3 rounded text-base">
                    {post.title}
                  </a>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    )
  })
}

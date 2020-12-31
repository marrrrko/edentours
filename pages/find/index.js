import Link from 'next/link'
import { getPostListWithTags } from '../../utils/ghost'

export default function Index({ tags }) {
  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4 mt-10">
      <h2 className="my-5">Available indices</h2>
      <ul className="list-none">
        {tags.map((tag, index) => {
          return (
            <li key={index}>
              <Link href={`/find/${encodeURIComponent(tag)}`}>
                <a className="hover:bg-gray-200 p-1 pb-2 md:px-3 rounded">
                  {tag}
                </a>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export async function getServerSideProps(context) {
  const postList = await getPostListWithTags()

  if (!postList) return { props: {} }

  let tagIndex = {}
  postList.forEach((post) => {
    post.tags.forEach((tag) => {
      if (
        tag.name.indexOf(':') == -1 &&
        tag.name[0] != '#' &&
        !tagIndex[tag.name]
      ) {
        tagIndex[tag.name] = 1
      }
    })
  })

  const tags = Object.keys(tagIndex)

  return { props: { tags } }
}

import { getPostListWithTags } from '../../utils/ghost'
import Link from 'next/link'

const collator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base'
})

export default function Index({
  tag,
  grouping,
  postGroups,
  availableGoupings
}) {
  const capitalize = (word) =>
    word && word.length ? `${word[0].toUpperCase()}${word.slice(1)}` : ''

  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4 mt-10">
      <h2 className="my-5">
        {capitalize(tag)}
        {grouping ? ` by ${grouping}` : ''} index
      </h2>
      {postGroups.map((postGroup) => {
        return (
          <div key={postGroup.name}>
            {postGroup.name != 'all' && (
              <h3 className="mt-8 mb-4 text-lg">
                {capitalize(postGroup.name)}
              </h3>
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
      })}

      {!grouping && availableGoupings != null && availableGoupings.length != 0 && (
        <div className="bg-gray-200 p-4 pt-2 mt-16 rounded">
          <h3 className="mb-4 text-sm">View grouped by:</h3>
          <ul className="list-none">
            {availableGoupings.map((group, index) => {
              return (
                <li key={index}>
                  <Link
                    href={`/find/${tag}?groupBy=${encodeURIComponent(group)}`}
                  >
                    <a className="hover:bg-gray-200 p-1 pb-2 md:px-3 rounded text-xs">
                      {group}
                    </a>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export async function getServerSideProps(context) {
  const { tag, groupBy } = context.query

  if (!tag) return { props: {} }

  const postList = await getPostListWithTags()

  if (!postList) return { props: {} }
  const matchedPosts = postList.filter((post) => {
    const tags = post.tags
    const tagMatches = tags.filter(
      (t) => t.name.trim().toLowerCase() === tag.trim().toLowerCase()
    )
    return tagMatches.length > 0
  })

  let filterIndex = {}
  matchedPosts.forEach((p) => {
    p.tags.forEach((t) => {
      let firstColon = t.name.indexOf(':')
      if (firstColon != -1) {
        const filter = t.name.slice(0, firstColon)
        if (filter && !filterIndex[filter]) {
          filterIndex[filter] = 1
        }
      }
    })
  })

  const filters = Object.keys(filterIndex) || []

  let postGroups = [{ name: 'all', posts: matchedPosts }]
  if (groupBy) {
    let postGroupsIndex = matchedPosts.reduce((acc, post) => {
      let matchedGroupTags = post.tags.filter((tag) =>
        tag.name.startsWith(`${groupBy}:`)
      )
      if (matchedGroupTags.length == 0) {
        matchedGroupTags = [{ name: `${groupBy}:Other` }]
      }
      matchedGroupTags.forEach((matchedTag) => {
        let groupValue = matchedTag.name.replace(`${groupBy}:`, '')
        if (!acc[groupValue]) {
          acc[groupValue] = {
            name: groupValue,
            posts: []
          }
        }
        acc[groupValue].posts.push(post)
      })
      return acc
    }, {})
    postGroups = Object.values(postGroupsIndex)
  }

  //Final Sorting
  postGroups = postGroups.map((postGroup) => {
    return {
      name: postGroup.name,
      posts: postGroup.posts
        .slice()
        .sort((a, b) => collator.compare(a.title, b.title))
    }
  })

  postGroups = postGroups.slice().sort((a, b) => {
    if (b.name == 'Other') return -1
    if (a.name == 'Other') return 1
    return collator.compare(a.name, b.name)
  })

  return {
    props: {
      tag,
      grouping: groupBy || '',
      postGroups,
      availableGoupings: filters
    }
  }
}

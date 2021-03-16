import { getPostListWithTags } from '../../utils/ghost'
import Link from 'next/link'
import {
  findAllPostsWithTag,
  findAllPossibleFilters,
  groupPostByTagPrefix
} from '../../aggregates/posts'
import TagIndex from '../../components/tag-index'

export default function Index({
  tag,
  grouping,
  postGroups,
  availableGroupings,
  filterType,
  filterValue
}) {
  const capitalize = (word) =>
    word && word.length ? `${word[0].toUpperCase()}${word.slice(1)}` : ''

  return (
    <div className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4 mt-10">
      <h2 className="my-5">
        {capitalize(tag)}s{grouping ? ` by ${grouping}` : ''}
        {filterType && filterValue && ` where ${filterType} is ${filterValue}`}
      </h2>
      <TagIndex postGroups={postGroups} />

      {!grouping &&
        !filterType &&
        !filterValue &&
        availableGroupings != null &&
        availableGroupings.length != 0 && (
          <div className="bg-gray-200 p-4 pt-2 mt-16 rounded">
            <h3 className="mb-4 text-sm">View grouped by:</h3>
            <ul className="list-none">
              {availableGroupings.map((group, index) => {
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
  const { tag, groupBy, filterType, filterValue } = context.query

  if (!tag) return { props: {} }

  const postList = await getPostListWithTags()

  if (!postList) return { props: {} }

  const postsWithTag = findAllPostsWithTag(
    postList,
    tag,
    filterType,
    filterValue
  )
  const filters = findAllPossibleFilters(postsWithTag)
  const postGroups = groupPostByTagPrefix(postsWithTag, groupBy)

  return {
    props: {
      tag,
      grouping: groupBy || '',
      postGroups,
      availableGroupings: filters,
      filterType: filterType || null,
      filterValue: filterValue || null
    }
  }
}

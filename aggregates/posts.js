const collator = new Intl.Collator('en', {
  numeric: true,
  sensitivity: 'base'
})

function isFilterMatch(filterType, filterValue, tag) {
  const firstColonPos = tag.name.indexOf(':')
  if (firstColonPos == -1) return false
  const fixedTag = `${tag.name.slice(0, firstColonPos).trim()}:${tag.name
    .slice(firstColonPos + 1)
    .trim()}`.toLowerCase()
  const filter = `${filterType}:${filterValue}`.trim().toLowerCase()
  const matched = fixedTag === filter

  return matched
}

export function findAllPostsWithTag(
  postList,
  tag,
  filterType = null,
  filterValue = null
) {
  return postList
    .filter((post) => {
      const tags = post.tags
      const targetTagMatches = tags.filter(
        (t) => t.name.trim().toLowerCase() === tag.trim().toLowerCase()
      )
      return targetTagMatches.length > 0
    })
    .filter((post) => {
      if (!filterType || !filterValue) return true
      const filterTagMatches = post.tags.filter((t) =>
        isFilterMatch(filterType, filterValue, t)
      )
      return filterTagMatches.length > 0
    })
    .slice()
    .sort((a, b) => collator.compare(a.title, b.title))
}

export function findAllPossibleFilters(postList) {
  let filterIndex = {}
  postList.forEach((p) => {
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

  return (Object.keys(filterIndex) || []).sort((a, b) => collator.compare(a, b))
}

export function groupPostByTagPrefix(postList, groupByPrefix) {
  if (!groupPostByTagPrefix) return [{ name: 'all', posts: postList }]

  const postGroupsIndex = postList.reduce((acc, post) => {
    let matchedGroupTags = post.tags.filter((tag) =>
      tag.name.startsWith(`${groupByPrefix}:`)
    )
    if (matchedGroupTags.length == 0) {
      matchedGroupTags = [{ name: `${groupByPrefix}:Other` }]
    }
    matchedGroupTags.forEach((matchedTag) => {
      let groupValue = matchedTag.name.replace(`${groupByPrefix}:`, '')
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

  let postGroups = Object.values(postGroupsIndex)
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

  return postGroups
}

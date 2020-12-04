export async function fetchPublishedPostsWithTag(tag) {
  const postData = await fetchIndexPageContentFromCMS()
  const posts = postData.posts.filter((post) => {
    return (
      post.visibility === 'public' &&
      post.tags.map((tag) => tag.name).indexOf(tag) !== -1
    )
  })

  return posts
}

export async function fetchIndexPageContentFromCMS() {
  const apiResponse = await fetch(
    'http://content.eden.tours/ghost/api/v3/content/posts/?&include=tags&key=ae68cacece30c42daf6b9aeb4b'
  )
  const postData = apiResponse.json()

  return postData
}

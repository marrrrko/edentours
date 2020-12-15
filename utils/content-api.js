import axios from 'axios'

const key = 'ae68cacece30c42daf6b9aeb4b'

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

export async function fetchPublishedPostById(postId) {
  const postData = await fetchIndexPageContentFromCMS()
  const posts = postData.posts.filter((post) => post.id === postId)

  if (!posts || !posts.length) return null

  return posts[0]
}

export async function fetchIndexPageContentFromCMS() {
  const apiResponse = await fetch(
    `https://content.eden.tours/ghost/api/v3/content/posts/?include=tags&key=${key}`
  )
  const postData = apiResponse.json()

  return postData
}

export async function fetchPostBySlug(slug) {
  if (!slug) return null

  try {
    const url = `https://content.eden.tours/ghost/api/v3/content/posts/slug/${slug}/?include=tags&key=${key}`
    const apiResponse = await axios.get(url)

    if (apiResponse.status !== 200) {
      console.log(`Could not retrieve post with slug ${slug}`)
      console.log(`${apiResponse.status}: ${apiResponse.statusText}`)
    } else {
      console.log('ok!')
    }

    const postData = apiResponse.data
    //console.log(`Called ${url} and got ${JSON.stringify(postData)}`)

    if (!postData || !postData.posts || !postData.posts.length) return null

    return postData.posts[0]
  } catch (err) {
    console.log(`Could not retrieve post with slug ${slug}: ${err.toString()}`)
    return null
  }
}

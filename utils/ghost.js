import axios from 'axios'

const ghostKey = process.env.GHOST_KEY
const ghostLocation = process.env.GHOST_LOCATION

export async function fetchPostBySlug(slug) {
  if (!slug) return null

  try {
    const url = `${ghostLocation}/ghost/api/v3/content/posts/slug/${slug}/?include=tags&key=${ghostKey}`
    const apiResponse = await axios.get(url)

    if (apiResponse.status !== 200) {
      global.log.warn(`Could not retrieve post with slug ${slug}`)
    }

    const postData = apiResponse.data

    if (!postData || !postData.posts || !postData.posts.length) return null

    const post = postData.posts[0]

    return post
  } catch (err) {
    global.log.error(
      `Could not retrieve post with slug ${slug}: ${err.toString()}`
    )
    return null
  }
}

export async function getPostListWithTags() {
  try {
    const url = `${ghostLocation}/ghost/api/v3/content/posts/?key=${ghostKey}&include=tags&fields=slug,title&&limit=all`
    const apiResponse = await axios.get(url)

    if (apiResponse.status !== 200) {
      global.log.warn(`Could not retrieve post list with tags`)
    }

    const postListData = apiResponse.data

    if (!postListData || !postListData.posts) return null

    const postList = postListData.posts

    return postList
  } catch (err) {
    global.log.warn(`Could not retrieve post list: ${err.toString()}`)
    return null
  }
}

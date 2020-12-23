import axios from 'axios'

const ghostKey = process.env.GHOST_KEY

export async function fetchPostBySlug(slug) {
  if (!slug) return null

  try {
    const url = `https://content.eden.tours/ghost/api/v3/content/posts/slug/${slug}/?include=tags&key=${ghostKey}`
    const apiResponse = await axios.get(url)

    if (apiResponse.status !== 200) {
      console.log(`Could not retrieve post with slug ${slug}`)
      console.log(`${apiResponse.status}: ${apiResponse.statusText}`)
    }

    const postData = apiResponse.data
    //console.log(`Called ${url} and got ${JSON.stringify(postData)}`)

    if (!postData || !postData.posts || !postData.posts.length) return null

    const post = postData.posts[0]

    return post
  } catch (err) {
    console.log(`Could not retrieve post with slug ${slug}: ${err.toString()}`)
    return null
  }
}

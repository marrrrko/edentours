
export async function fetchIndexPageContentFromCMS() {
  const apiResponse = await fetch('http://content.eden.tours/ghost/api/v3/content/posts/5fc563ae39111300012f8a7a/?key=ae68cacece30c42daf6b9aeb4b')
  const postData = apiResponse.json()

  return postData
}
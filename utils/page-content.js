import { fetchFlickrSet } from './flickr'

export async function buildPageContent(post) {
  post.pageContent = await Promise.all(
    post.htmlSections.map(async (section) => {
      if (section.type === 'flickr') {
        const flickrData = await fetchFlickrSet(section.setId, section.user)
        let gridConfig = flickrData.body.photoset.photo.map(flickrToReactGrid)
        return {
          ...section,
          gridConfig
        }
      } else {
        return section
      }
    })
  )

  return post
}

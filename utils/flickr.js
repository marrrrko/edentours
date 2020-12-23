import Flickr from 'flickr-sdk'

const flickrKey = process.env.FLICKR_KEY
const flickr = new Flickr(flickrKey)

export async function fetchFlickrSet(setId, user) {
  //console.log(`Fetching from flickr ${setId}@${user}`)
  let flickrData = await flickr.photosets.getPhotos({
    photoset_id: setId,
    user_id: user,
    extras: 'url_sq, url_t, url_s, url_m, url_o'
  })

  return flickrData
}

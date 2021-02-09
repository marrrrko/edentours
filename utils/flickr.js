import Flickr from 'flickr-sdk'

const flickrKey = process.env.FLICKR_KEY || 'abc'
const flickr = new Flickr(flickrKey)

export async function fetchFlickrSet(setId, user) {
  let flickrData = await flickr.photosets.getPhotos({
    photoset_id: setId,
    user_id: user,
    extras: 'url_sq, url_t, url_s, url_m, url_o'
  })

  return flickrData
}

import { fetchFlickrSet } from './flickr'
import * as htmlparser2 from 'htmlparser2'

export async function buildPageContent(post) {
  const sections = await parsePostHtml(post.html)
  post.pageContent = await Promise.all(
    sections.map(async (section) => {
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

function createHtmlSection() {
  let section = {
    type: 'html',
    html: ''
  }

  return section
}

function createSpecialSection(type) {
  let section = {
    type: type
  }

  return section
}

async function parsePostHtml(postHtml) {
  return new Promise((resolve, reject) => {
    try {
      let sections = []
      let currentSection = createHtmlSection()
      let appendHtml = (html) => {
        currentSection.html = currentSection.html + html
      }
      let currentDepth = 0

      const isRelativeLink = (name, key, attributes) => {
        return (
          name === 'a' &&
          key === 'href' &&
          attributes[key].startsWith('https://content.eden.tours')
        )
      }

      const isFlickrAlbum = (name, key, attributes) => {
        return (
          name === 'a' &&
          key === 'href' &&
          attributes[key].startsWith('https://www.flickr.com/photos/') &&
          attributes[key].indexOf('/sets/') !== -1
        )
      }

      const handleRelativeLink = (key, attributes) => {
        appendHtml(
          ` ${key}="${attributes[key].replace(
            'https://content.eden.tours',
            'https://eden.tours'
          )}"`
        )
      }

      const handleFlickrAlbumLink = (linkUrl) => {
        currentSection = createSpecialSection('flickr')
        currentSection.user = linkUrl
          .replace('https://www.flickr.com/photos/', '')
          .split('/')[0]
        currentSection.setId = linkUrl.split('/sets/')[1].replace('/', '')
        appendHtml = (html) => {
          return
        }
      }

      const isMapHubIframe = (name, key, attributes) => {
        return (
          name === 'iframe' &&
          key === 'src' &&
          attributes[key].startsWith('https://maphub.net/embed/')
        )
      }

      const handleMapHubIframe = (key, attributes) => {
        currentSection.type = 'maphub'
        appendHtml(` ${key}="${attributes[key]}"`)
      }

      const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
          currentDepth++
          appendHtml(`<${name}`)
          Object.keys(attributes).forEach((key) => {
            if (isRelativeLink(name, key, attributes)) {
              handleRelativeLink(key, attributes)
            } else if (isFlickrAlbum(name, key, attributes)) {
              handleFlickrAlbumLink(attributes[key])
            } else if (isMapHubIframe(name, key, attributes)) {
              handleMapHubIframe(key, attributes)
            } else {
              appendHtml(` ${key}="${attributes[key]}"`)
            }
          })
          appendHtml(' />')
        },
        ontext(text) {
          appendHtml(`${text}`)
        },
        onclosetag(tagname) {
          currentDepth--
          appendHtml(`</${tagname}>`)
          if (currentDepth == 0) {
            sections.push(currentSection)
            currentSection = createHtmlSection()
            appendHtml = (html) => {
              currentSection.html = currentSection.html + html
            }
          }
        },
        onend() {
          sections.push(currentSection)
          resolve(sections)
        }
      })

      parser.write(postHtml)
      parser.end()
    } catch (err) {
      reject(err)
    }
  })
}

function flickrToReactGrid(flickrPhoto) {
  return {
    src: flickrPhoto.url_o,
    thumbnail: flickrPhoto.url_s,
    thumbnailWidth: flickrPhoto.width_s,
    thumbnailHeight: flickrPhoto.height_s,
    caption: flickrPhoto.title
  }
}

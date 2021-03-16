import { fetchFlickrSet } from './flickr'
import { getPostListWithTags } from '../utils/ghost'
import {
  findAllPostsWithTag,
  findAllPossibleFilters,
  groupPostByTagPrefix
} from '../aggregates/posts'
import * as htmlparser2 from 'htmlparser2'

export async function buildPageContent(post) {
  const sections = await parsePostHtml(post.html)
  let allPostMetaWithTags
  post.pageContent = await Promise.all(
    sections.map(async (section) => {
      if (section.type === 'flickr') {
        const flickrData = await fetchFlickrSet(section.setId, section.user)
        let gridConfig = flickrData.body.photoset.photo.map(flickrToReactGrid)
        return {
          ...section,
          gridConfig
        }
      } else if (section.type === 'tagindex') {
        if (!allPostMetaWithTags) {
          allPostMetaWithTags = await getPostListWithTags()
        }
        const postsWithSelectedTag = findAllPostsWithTag(
          allPostMetaWithTags,
          section.tag,
          section.filterType,
          section.filterValue
        )
        const filters = findAllPossibleFilters(postsWithSelectedTag)
        const postGroups = groupPostByTagPrefix(
          postsWithSelectedTag,
          section.groupBy
        )
        return {
          ...section,
          postsWithSelectedTag,
          filters,
          postGroups
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

      const handleRelativeLink = (key, attributes) => {
        appendHtml(
          ` ${key}="${attributes[key].replace(
            'https://content.eden.tours',
            'https://eden.tours'
          )}"`
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

      const isTagIndex = (name, key, attributes) => {
        return (
          name === 'a' &&
          key === 'href' &&
          attributes[key].toLowerCase().indexOf('eden.tours/find/') !== -1 &&
          attributes[key].toLowerCase().indexOf('embed=true') !== -1
        )
      }

      const handleTagIndex = (linkUrl) => {
        currentSection = createSpecialSection('tagindex')
        const suffix = linkUrl.toLowerCase().split('/find/')[1]
        const tag = suffix.split('?')[0]
        const otherParams =
          suffix.indexOf('?') == -1
            ? {}
            : suffix
                .split('?')[1]
                .split('&')
                .reduce((acc, next) => {
                  const [name, value] = next.split('=')
                  acc[name] = decodeURIComponent(value)
                  return acc
                }, {})

        currentSection.tag = tag
        currentSection.groupBy = otherParams.groupby || null
        currentSection.filterType = otherParams.filtertype || null
        currentSection.filterValue = otherParams.filtervalue || null
        currentSection.otherParams = otherParams
        appendHtml = (html, htmlType) => {
          if (htmlType == 'textcontent') currentSection.content = html
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

      const isTourDatesList = (name, key, attributes) => {
        return (
          name === 'a' &&
          key === 'href' &&
          attributes[key].startsWith('https://dates.eden.tours')
        )
      }

      const handleTourDatesList = () => {
        currentSection.type = 'tourdates'
        appendHtml = (html) => {
          return
        }
      }

      const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
          currentDepth++
          appendHtml(`<${name}`, 'tagstart')
          Object.keys(attributes).forEach((key) => {
            if (isRelativeLink(name, key, attributes)) {
              handleRelativeLink(key, attributes)
            } else if (isFlickrAlbum(name, key, attributes)) {
              handleFlickrAlbumLink(attributes[key])
            } else if (isTagIndex(name, key, attributes)) {
              handleTagIndex(attributes[key])
            } else if (isMapHubIframe(name, key, attributes)) {
              handleMapHubIframe(key, attributes)
            } else if (isTourDatesList(name, key, attributes)) {
              handleTourDatesList(key, attributes)
            } else {
              appendHtml(` ${key}="${attributes[key]}"`, 'tagattribute')
            }
          })
          appendHtml(' />')
        },
        ontext(text) {
          appendHtml(text, 'textcontent')
        },
        onclosetag(tagname) {
          currentDepth--
          appendHtml(`</${tagname}>`, 'tagend')
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

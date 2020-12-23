import axios from 'axios'
import * as htmlparser2 from 'htmlparser2'

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
    post.htmlSections = await parsePostHtml(post.html)

    return post
  } catch (err) {
    console.log(`Could not retrieve post with slug ${slug}: ${err.toString()}`)
    return null
  }
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

function flickrToReactGrid(flickrPhoto) {
  return {
    src: flickrPhoto.url_o,
    thumbnail: flickrPhoto.url_s,
    thumbnailWidth: flickrPhoto.width_s,
    thumbnailHeight: flickrPhoto.height_s,
    caption: flickrPhoto.title
  }
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
      const parser = new htmlparser2.Parser({
        onopentag(name, attributes) {
          currentDepth++
          appendHtml(`<${name}`)
          Object.keys(attributes).forEach((key) => {
            if (
              name === 'a' &&
              key === 'href' &&
              attributes[key].startsWith('https://content.eden.tours')
            ) {
              appendHtml(
                ` ${key}="${attributes[key].replace(
                  'https://content.eden.tours',
                  'https://eden.tours'
                )}"`
              )
            } else if (
              name === 'a' &&
              key === 'href' &&
              attributes[key].startsWith('https://www.flickr.com/photos/') &&
              attributes[key].indexOf('/sets/') !== -1
            ) {
              currentSection = createSpecialSection('flickr')
              currentSection.user = attributes[key]
                .replace('https://www.flickr.com/photos/', '')
                .split('/')[0]
              currentSection.setId = attributes[key]
                .split('/sets/')[1]
                .replace('/', '')
              appendHtml = (html) => {
                return
              }
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

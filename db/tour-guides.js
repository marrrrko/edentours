import nano from 'nano'

const COUCH_URL = process.env.COUCH_URL
const COUCH_DB_PREFIX = process.env.COUCH_DB_PREFIX
const couch = nano(COUCH_URL || "https://admin:password@couch.server/")
const tourGuidesStore = couch.use(`${COUCH_DB_PREFIX}guides`)

export async function getAllGuides() {
  const allTourGuides = await tourGuidesStore.list({include_docs: true})

  //console.log(`DOCS: ${JSON.stringify(allTourPrograms.rows,null, ' ')}`)

  return allTourGuides.rows.map(row => row.doc)
}
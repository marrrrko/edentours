import nano from 'nano'

const COUCH_URL = process.env.COUCH_URL
const COUCH_DB_PREFIX = process.env.COUCH_DB_PREFIX
const couch = nano(COUCH_URL)
const tourProgramsStore = couch.use(`${COUCH_DB_PREFIX}tour-programs`)

export async function getAllTourPrograms() {
  const allTourPrograms = await tourProgramsStore.list({include_docs: true})

  //console.log(`DOCS: ${JSON.stringify(allTourPrograms.rows,null, ' ')}`)

  return allTourPrograms.rows.map(row => row.doc)
}
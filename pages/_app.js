import 'tailwindcss/tailwind.css'
import '../page-styles.css'
import Head from 'next/head'
import TopBar from '../components/top-bar'
import 'isomorphic-fetch'

const EdenApp = ({ Component, pageProps, programs }) => {
  return (
    <>
      <Head>
        <title>Eden Tours</title>
      </Head>
      <div className="flex flex-col h-screen">
        <div>
          <TopBar programs={programs} />
        </div>
        <div className="page-content flex-1 overflow-y-auto">
          <Component {...pageProps} />
        </div>
      </div>
    </>
  )
}

EdenApp.getInitialProps = async (ctx) => {
  const COUCH_URL = process.env.COUCH_URL
  const COUCH_DB_PREFIX = process.env.COUCH_DB_PREFIX
  const url = `${COUCH_URL}/${COUCH_DB_PREFIX}tour-programs/_all_docs?include_docs=true`
  const response = await fetch(url)
  const programData = await response.json()
  const programs = programData.rows.map((row) => {
    const englishLabel = row.doc.labels.find((l) => l.language == 'en')
    const firstLabel = row.doc.labels[0]
    return {
      id: row.id,
      label: englishLabel ? englishLabel.label : firstLabel.label,
    }
  })
  return {
    programs,
  }
}

export default EdenApp

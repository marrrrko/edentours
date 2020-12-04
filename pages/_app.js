import 'tailwindcss/tailwind.css'
import '../extra-styles.css'
import Head from "next/head"

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Eden Tours</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp

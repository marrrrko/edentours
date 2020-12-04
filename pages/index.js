
import { fetchIndexPageContentFromCMS } from '../utils/content-api'

export default function Home(props) {
  return (
    <div>
      <h1>Eden Tours</h1>
      <div dangerouslySetInnerHTML={createMarkup(props.postData)}></div>
    </div>
  )
}

function createMarkup(postData) {
  return {
    __html: postData.posts[0].html
  }
}

export async function getServerSideProps() {
  const postData = await fetchIndexPageContentFromCMS()
  return {
    props: {
      postData,
      something: "else"
    }
  }
}


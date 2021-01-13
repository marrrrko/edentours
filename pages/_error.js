export default function Error({ statusCode = 500, title = 'Unknown error' }) {
  return (
    <div className="w-full h-full pb-32 grid content-center text-center md:w-3/5 2xl:w-2/5 mx-auto">
      <div className="text-5xl">{statusCode}</div>
      <div className="text-xl mt-4 font-bold">{title}</div>
      <br />
      <br />
      <br />
    </div>
  )
}

export function getInitialProps({ res, err }) {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

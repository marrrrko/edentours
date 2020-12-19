import Link from 'next/link'

export default function TopBar(props) {
  return (
    <div className="topbar w-full border-b flex flex-row flex-wrap items-center p-1 font-serif">
      <div className="flex-grow p-3 md:pl-20 pl-2 text-lg md:text-2xl font-extrabold ">
        <a href="/" className="hover:bg-gray-200 p-2 px-4 rounded no-underline">
          <span>eden•tours</span>
        </a>
      </div>
      <div className="font-serif">
        <ul className="flex flex-row flex-wrap list-none">
          <li className="mr-1 md:mr-3">
            <Link href="/tours" passHref>
              <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded">
                Tours
              </a>
            </Link>
          </li>
          <li className="mr-1 md:mr-3">
            <Link href="/research">
              <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded">
                Research
              </a>
            </Link>
          </li>
          <li className="mr-4 md:mr-7">
            <Link href="/faq">
              <a className="hover:bg-gray-200 p-2 pb-3 md:px-3 rounded">FAQ</a>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  )
}

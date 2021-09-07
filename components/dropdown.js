import { Fragment } from "react"
import { Menu, Transition } from "@headlessui/react"
import { ChevronDownIcon } from "@heroicons/react/solid"
import Link from "next/link"

function NextLink(props) {
  const { href, children, ...rest } = props
  return (
    <Link href={href}>
      <a
        className="hover:bg-gray-100 text-gray-700 block px-4 py-2 text-sm"
        {...rest}
      >
        {children}
      </a>
    </Link>
  )
}

export default function Dropdown({ name, items, centerAlign = false }) {
  return (
    <Menu as="div" className="relative inline-block text-left z-20 -mt-2">
      {({ open }) => (
        <>
          <div>
            <Menu.Button className="inline-flex justify-center rounded w-full px-2 mr-1 pt-1 pb-2 bg-white hover:bg-gray-200 text-sm font-medium text-gray-700 focus:outline-none">
              {name}
              <ChevronDownIcon
                className="-mr-1 h-5 w-5"
                style={{ marginTop: "5px" }}
                aria-hidden="true"
              />
            </Menu.Button>
          </div>

          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items
              static
              className={`${
                centerAlign
                  ? "fixed inset-x-1/2 -ml-28"
                  : "origin-top-right absolute right-0"
              } mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none`}
            >
              <div className="py-1">
                {items.map((i) => {
                  return (
                    <Menu.Item key={i.url} href={i.url} as={NextLink}>
                      <div className="flex flex-row items-center">
                        {i.icon && <div className="mr-3">{i.icon}</div>}
                        <div>{i.label}</div>
                      </div>
                    </Menu.Item>
                  )
                })}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  )
}

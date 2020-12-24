import React from 'react'
import { createMarkupFromSection } from '../utils/section-tool'

export default function HtmlSection({ pageSection }) {
  return (
    <div
      className="w-full md:w-3/5 2xl:w-2/5 mx-auto my-5 px-4"
      dangerouslySetInnerHTML={createMarkupFromSection(pageSection)}
    ></div>
  )
}

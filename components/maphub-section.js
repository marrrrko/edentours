import React from 'react'
import { createMarkupFromSection } from '../utils/section-tool'

export default function MapHubSection({ pageSection }) {
  return (
    <div
      className="w-full mx-auto my-5 px-10 md:px-20"
      dangerouslySetInnerHTML={createMarkupFromSection(pageSection)}
    ></div>
  )
}

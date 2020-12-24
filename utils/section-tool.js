export function createMarkupFromSection(section) {
  return {
    __html: section.html
  }
}

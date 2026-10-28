// A library file a canvas imports through `@assets`; the build turns it into the file's URL.
declare module '@assets/*' {
  const url: string
  export default url
}

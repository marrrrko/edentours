import { wrapper } from '../store/store'

const WrappedApp = ({ Component, pageProps }) => <Component {...pageProps} />

export default wrapper.withRedux(WrappedApp)

import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html className="text-white leading-tight">
        <Head>          
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans&display=swap" rel="stylesheet" />
        </Head>
        <body className="bg-green-700 min-h-screen">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
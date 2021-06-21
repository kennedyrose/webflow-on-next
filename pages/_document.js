import Document, { Html, Head, Main, NextScript } from 'next/document'
import axios from 'axios'
import cheerio from 'cheerio'

let htmlAttribs

export default class DocumentComponent extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)

    // Gets HTML attributes
    if(!htmlAttribs){
      let res = await axios.get(process.env.WEBFLOW_URL)
        .catch(err => {
          console.error(err)
        })
      if(!res) res = {}
      const html = res.data || ``
      const $ = cheerio.load(html)
      const $html = $(`html`)
      const { ...attribs } = $html[0].attribs
      delete attribs[`data-wf-page`]
      htmlAttribs = attribs
      console.log(`htmlAttribs`, htmlAttribs)
    }

    return {
      ...initialProps,
      htmlAttribs,
    }
  }

  render() {
    return (
      <Html {...this.props.htmlAttribs}>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
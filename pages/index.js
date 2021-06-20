import Head from 'next/head'
import Link from 'next/link'
import parseHtml, { domToReact } from 'html-react-parser'
import get from 'lodash/get'

function isUrlInternal(link){
  if(
    !link ||
    link.indexOf(`https:`) === 0 ||
    link.indexOf(`#`) === 0 ||
    link.indexOf(`http`) === 0 ||
    link.indexOf(`://`) === 0
  ){
    return false
  }
  return true
}

function replace(node){
  const attribs = node.attribs || {}

  // Replace links with Next links
  if(node.name === `a` && isUrlInternal(attribs.href)){
    const { href, ...props } = attribs
    if(props.class){
      props.className = props.class
      delete props.class
    }
    return (
      <Link href={href}>
        <a {...props}>
          {!!node.children && !!node.children.length &&
            domToReact(node.children, parseOptions)
          }
        </a>
      </Link>
    )
  }


}
const parseOptions = { replace }

export default function Home(props) {
  return (
    <>
      <Head>
        {parseHtml(props.headContent)}
      </Head>
      {parseHtml(props.bodyContent, parseOptions)}
    </>
  )
}

export async function getStaticProps(ctx) {
  // Import modules in here that aren't needed in the component
  const cheerio = await import(`cheerio`)
  const axios = (await import(`axios`)).default


  // Use path to determine Webflow path
  let url = get(ctx, `params.path`, [])
  url = url.join(`/`)
  if(url.charAt(0) !== `/`){
    url = `/${url}`
  }
  const fetchUrl = process.env.WEBFLOW_URL + url

  // Fetch HTML
  let res = await axios(fetchUrl)
    .catch(err => {
      console.error(err)
    })
  const html = res.data

  // Parse HTML with Cheerio
  const $ = cheerio.load(html)
  const bodyContent = $(`body`).html()
  const headContent = $(`head`).html()

  // Send HTML to component via props
  return {
    props: {
      bodyContent,
      headContent
    },
  }
}
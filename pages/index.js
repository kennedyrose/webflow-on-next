import Head from 'next/head'
import Link from 'next/link'
import parseHtml, { domToReact } from 'html-react-parser'
import get from 'lodash/get'
import React, { useEffect } from 'react'

// Determines if URL is internal or external
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

function Script(props){
  const {src, ...scriptProps} = props
  useEffect(() => {
    const script = document.createElement('script')
    for(let key in scriptProps){
      script[key] = scriptProps[key]
    }
    script.async = true
    console.log(`loading src`, src)
    script.src = src
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [props])
  return null
}

// Replaces DOM nodes with React components
function replace(node){
  const attribs = node.attribs || {}

  // Replace links with Next links
  if(node.name === `a` && isUrlInternal(attribs.href)){
    const { href, style, ...props } = attribs
    if(props.class){
      props.className = props.class
      delete props.class
    }
    if(!style){
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
    return (
      <Link href={href}>
        <a {...props} href={href} css={style}>
          {!!node.children && !!node.children.length &&
            domToReact(node.children, parseOptions)
          }
        </a>
      </Link>
    )
  }


  // Make Google Fonts scripts work
  if(node.name === `script`){
    let content = get(node, `children.0.data`, ``)
    if(attribs.crossorigin){
      attribs.crossOrigin = attribs.crossorigin
      delete attribs.crossorigin
    }
    if(content){
      if(content.trim().indexOf(`WebFont.load(`) === 0){
        content = `setTimeout(function(){${content}}, 1)`
        return (
          <script {...attribs} dangerouslySetInnerHTML={{__html: content}}></script>
        )
      }
    }
    else{
      console.log(`src`, attribs.src)
      return (
        <Script {...attribs} />
      )
    }
  }

}
const parseOptions = { replace }




// Splits HTML and scripts
// Duplicated from content above, refactor later
function splitParse(content){
  const scripts = []

  function replace(node){
    const attribs = node.attribs || {}

    // Replace links with Next links
    if(node.name === `a` && isUrlInternal(attribs.href)){
      const { href, style, ...props } = attribs
      if(props.class){
        props.className = props.class
        delete props.class
      }
      if(!style){
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
      return (
        <Link href={href}>
          <a {...props} href={href} css={style}>
            {!!node.children && !!node.children.length &&
              domToReact(node.children, parseOptions)
            }
          </a>
        </Link>
      )
    }


    // Make Google Fonts scripts work
    if(node.name === `script`){
      let content = get(node, `children.0.data`, ``)
      if(attribs.crossorigin){
        attribs.crossOrigin = attribs.crossorigin
        delete attribs.crossorigin
      }
      if(content){
        if(content.trim().indexOf(`WebFont.load(`) === 0){
          content = `setTimeout(function(){${content}}, 1)`
          return (
            <script {...attribs} dangerouslySetInnerHTML={{__html: content}}></script>
          )
        }
      }
      else{
        console.log(`src`, attribs.src)
        scripts.push(
          <Script {...attribs} key={scripts.length} />
        )
        return null
      }
    }

  }
  const parseOptions = { replace }
  const html = parseHtml(content, parseOptions)
  return { scripts, html }
}

export default function Home(props) {
  const { scripts, html } = splitParse(props.headContent)
  return (
    <>
      <Head>
        {html}
      </Head>
      {parseHtml(props.bodyContent, parseOptions)}
      {scripts}
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

  // Convert back to HTML strings
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
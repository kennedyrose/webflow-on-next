
export default function Home(props) {
  return (
    <div dangerouslySetInnerHTML={{__html: props.bodyContent}} />
  )
}

export async function getStaticProps(ctx) {
  // Import modules in here that aren't needed in the component
  const cheerio = await import(`cheerio`)
  const axios = (await import(`axios`)).default

  // Fetch HTML
  let res = await axios(`https://business-starter-template.webflow.io`)
    .catch(err => {
      console.error(err)
    })
  const html = res.data

  // Parse HTML with Cheerio
  const $ = cheerio.load(html)
  const bodyContent = $(`body`).html()

  // Send HTML to component via props
  return {
    props: {
      bodyContent,
    },
  }
}
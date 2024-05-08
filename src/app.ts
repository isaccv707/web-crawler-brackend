// backend/server.ts
import express from 'express'
import puppeteer from 'puppeteer'
import fs from 'fs/promises'
import cors from 'cors'
import { envs } from './config/env'
import chromium from '@sparticuz/chromium'

const app = express()
const PORT = envs.PORT

interface PageInfo {
  title: string
  description: string
  keywords: string[]
  links: string[]
  images: string[]
  text: string
}

app.use(cors())

async function getPageInfo (url: string): Promise<PageInfo> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    ignoreHTTPSErrors: true
  })
  const page = await browser.newPage()
  await page.goto(url)

  const pageInfo: PageInfo = await page.evaluate(() => {
    const title = document.title
    const description =
      (document.querySelector('meta[name="description"]') as HTMLMetaElement)
        ?.content || ''
    const keywords = (
      (document.querySelector('meta[name="keywords"]') as HTMLMetaElement)
        ?.content || ''
    ).split(',')
    const links = Array.from(document.querySelectorAll('a')).map(
      link => link.href
    )
    const images = Array.from(document.querySelectorAll('img')).map(
      img => img.src
    )
    const text = document.body.innerText

    return { title, description, keywords, links, images, text }
  })

  await browser.close()
  return pageInfo
}

app.get('/api/data', async (req, res) => {
  try {
    const url: string = req.query.url as string
    if (!url) {
      throw new Error('No se proporcionó ninguna URL')
    }
    const pageInfo = await getPageInfo(url)
    await Promise.all([
      fs.writeFile('page_info.json', JSON.stringify(pageInfo, null, 2)),
      fs.writeFile('links.txt', pageInfo.links.join('\n')),
      fs.writeFile('images.txt', pageInfo.images.join('\n'))
    ])
    const { title, description, keywords, links, images, text } = pageInfo
    res.json({ title, description, keywords, links, images, text })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener datos' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`)
})
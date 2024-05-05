// backend/server.ts
import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

interface Data {
    links: string[];
    images: string[];
}

app.use(cors());


async function getLinksAndImages(url: string): Promise<Data> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const result = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a')).map(link => link.href);
        const images = Array.from(document.querySelectorAll('img')).map(img => img.src);
        return { links, images };
    });
    await browser.close();
    return result;
}

app.get('/api/data', async (req, res) => {
    try {
        const url: string = req.query.url as string;
        if (!url) {
            throw new Error('No se proporcionó ninguna URL');
        }
        const { links, images } = await getLinksAndImages(url);
        await Promise.all([
            fs.writeFile('links.txt', links.join('\n')),
            fs.writeFile('images.txt', images.join('\n'))
        ]);
        res.json({ links, images});
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor en ejecución en el puerto ${PORT}`);
});

const https = require('https');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const fsPromises = require('fs').promises;
const { exec } = require('child_process');
const axios = require('axios');
const puppeteer = require('puppeteer');

function loadUrl(url, callback, printResponse = false) {
    if (!url) {
        console.log('No URL provided');
        return;
    }
    if (callback && typeof callback !== 'function') {
        console.log('Callback is not a function');
        return;
    }

    return new Promise((resolve, reject) => {
        const options = {
            hostname: new URL(url).hostname,
            path: new URL(url).pathname + new URL(url).search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'identity', // avoids dealing with gzip/br decompression
                Connection: 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Cache-Control': 'max-age=0',
            },
        };

        https
            .get(options, (res) => {
                // handle redirects
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return loadUrl(res.headers.location, callback, printResponse).then(resolve).catch(reject);
                }

                let data = [];
                console.log('Status Code:', res.statusCode);
                res.on('data', (chunk) => data.push(chunk));
                res.on('end', async () => {
                    const htmlString = Buffer.concat(data).toString();
                    if (printResponse) console.log(htmlString);
                    const document = new JSDOM(htmlString).window.document;
                    const result = callback?.constructor.name === 'AsyncFunction' ? await callback(document) : callback(document);
                    resolve(result);
                });
            })
            .on('error', (err) => {
                console.log('Error:', err.message);
                reject(err);
            });
    });
}

async function loadUrlV2(url, callback, printResponse = false) {
    const { data: htmlString } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        },
        responseType: 'text',
        decompress: true, // axios handles gzip automatically
    });

    if (printResponse) console.log(htmlString);
    const document = new JSDOM(htmlString).window.document;
    return callback ? await callback(document) : document;
}

let sharedBrowser = null;

async function getBrowser() {
    if (!sharedBrowser || !sharedBrowser.connected) {
        sharedBrowser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
        });
    }
    return sharedBrowser;
}

async function loadUrlV3(url, callback, retries = 3) {
    const browser = await getBrowser();
    const page = await browser.newPage();
    let pageClosed = false;

    const safeClosePage = async () => {
        if (pageClosed) return;
        pageClosed = true;
        try {
            await page.close();
        } catch (_) {
            // Page already dead — ignore
        }
    };

    try {
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        const passed = await waitForCloudflare(page);
        if (!passed) {
            throw new Error('Cloudflare challenge failed');
        }

        const html = await page.content();
        const document = new JSDOM(html).window.document;
        const result = callback?.constructor.name === 'AsyncFunction' ? await callback(document) : callback?.(document);

        return result;
    } catch (err) {
        console.error(`Error on ${url}: ${err.message}`);

        await safeClosePage();

        // If the browser itself died, kill it so getBrowser() spawns a fresh one
        if (!browser.connected) {
            sharedBrowser = null;
            try {
                await browser.close();
            } catch (_) {}
        }

        if (retries > 0) {
            console.log(`Retrying... (${retries} left)`);
            await delay(2000 + Math.random() * 3000);
            return loadUrlV3(url, callback, retries - 1); // fresh page + possibly fresh browser
        }

        return null;
    } finally {
        await safeClosePage(); // no-op if catch already closed it
    }
}

async function waitForCloudflare(page, timeout = 20000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const title = await page.title();
        const url = page.url();

        const isChallenge = title.includes('Just a moment') || title.includes('Checking your browser') || url.includes('cdn-cgi/challenge-platform');

        if (!isChallenge) return true;

        await new Promise((r) => setTimeout(r, 500));
    }

    return false;
}

async function downloadImage(url, filepath) {
    if (!url) return;
    if (fs.existsSync(filepath)) return;
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https
            .get(url, (response) => {
                // Check for successful response
                if (response.statusCode !== 200) {
                    console.error(`Failed to get '${url}' (${response.statusCode})`);
                    reject();
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded ${url} to ${filepath}`);
                    resolve();
                });
            })
            .on('error', (err) => {
                // Delete the file if there's an error
                fs.unlink(filepath, () => {});
                console.error(`Error downloading ${url}: ${err.message}`);
                reject();
            });
    });
}

async function ensureDirectoryExists(filePath) {
    // Extract the directory path from the full file path
    const directoryPath = path.dirname(filePath);

    try {
        // Create all directories in the path, recursively if they don't exist
        await fsPromises.mkdir(directoryPath, { recursive: true });
        //   console.log(`Directory created: ${directoryPath}`);
    } catch (error) {
        console.error(`Error creating directory: ${error}`);
    }
}

function getAllFiles(dirPath, files = []) {
    // Read all items in the directory
    const items = fs.readdirSync(dirPath);

    // Process each item
    for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            // If it's a directory, recursively get files from it
            getAllFiles(itemPath, files);
        } else {
            // If it's a file, add it to the array
            files.push(itemPath);
        }
    }

    return files;
}

async function downloadAudio(url, fullFilename) {
    if (!url) return;
    if (fs.existsSync(fullFilename)) return;
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        // save file to the specified path and create folder if not exist
        await ensureDirectoryExists(fullFilename);
        fs.writeFileSync(fullFilename, buffer);
        console.log(`Downloaded ${url} to ${fullFilename}`);
    } catch (error) {
        console.error('Error downloading audio:', error);
    }
}

async function downloadYoutube(urlOrId, fullFilename) {
    if (!urlOrId || !fullFilename) return;
    if (fs.existsSync(fullFilename)) return;

    const videoUrl = urlOrId.startsWith('http') ? urlOrId : `https://www.youtube.com/watch?v=${urlOrId}`;
    const BASE_DIR = path.resolve(__dirname, '.');
    const FFMPEG_PATH = path.join(BASE_DIR, 'lib/ffmpeg.exe');
    const YTDLP_PATH = path.join(BASE_DIR, 'lib/yt-dlp.exe');
    const LOGS_DIRECTORY = path.join(BASE_DIR, 'lib/logs');

    // Build basic options
    const options = {
        ffmpegLocation: FFMPEG_PATH,
        format: 'bestaudio/best',
        output: `"${fullFilename}"`,
        httpChunkSize: '10M',
        forceIpv4: true,
        audioQuality: '0',
        audioFormat: 'mp3',
        // exec: '--audio-quality 0 --audio-format mp3',
    };

    // Generate command line arguments
    const args = [videoUrl];
    Object.entries(options).forEach(([key, value]) => {
        const option = `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;

        if (value === true) {
            args.push(option);
        } else if (value !== false) {
            args.push(option, value.toString());
        }
    });

    // Create log file path
    const videoId = videoUrl.split('=').pop();
    const logFilePath = path.join(LOGS_DIRECTORY, `${videoId}.log`);

    // Build the command
    const ytDlpPath = path.resolve(YTDLP_PATH);
    const command = `"${ytDlpPath}" ${args.join(' ')} --verbose >> "${logFilePath}" 2>&1`;

    console.log(`Executing download command: ${command}`);

    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(false);
            } else {
                resolve(true);
            }
        });
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function capitalize(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function extractProperties(objects, properties) {
    const result = [];
    objects.forEach((obj) => {
        const newObj = {};
        for (const property of properties) {
            newObj[property] = obj[property];
        }
        result.push(newObj);
    });
    return result;
}

function removeInvisibleCharacters(string) {
    // Invisible characters:
    // - Zero-width spaces
    // - Zero-width non-joiners
    // - Zero-width joiners
    // - Other invisible Unicode characters
    return string.replaceAll(/[\u200B-\u200D\u2060\uFEFF\u00AD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180E\u2000-\u200F\u202A-\u202F\u2061-\u2064\u2066-\u206F\u3164\uFFA0]/g, '');
}

function normalize(s) {
    return s
        ?.replaceAll(/[^a-zA-Z ]/g, '')
        .replaceAll(' ', '_')
        .toUpperCase();
}

module.exports = { loadUrl, loadUrlV2, loadUrlV3, removeInvisibleCharacters, getAllFiles, capitalize, extractProperties, downloadImage, downloadAudio, downloadYoutube, delay, normalize };

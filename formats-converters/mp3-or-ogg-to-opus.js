// only for local purposes
// server has no nodejs

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const glob = require('glob');
const ffmpegPath = require('ffmpeg-static'); // Add this line

// obrazkov: 4358 (.png)
// audio: 27 593 (.mp3)

// Configuration
const ASSETS_FOLDER = '../../assets'; // Change to your folder path
// const ASSETS_FOLDER = '.';
const OPUS_BITRATE = '48k'; // Adjust quality (64k, 96k, 128k, 192k)
const DELETE_ORIGINAL = true; // Set to true to delete MP3 after conversion

console.log('Searching for MP3 files...');
const mp3Files = glob.sync(`${ASSETS_FOLDER}/**/*.mp3`, { nocase: true });
const oggFiles = glob.sync(`${ASSETS_FOLDER}/**/*.ogg`, { nocase: true });
const files = [...mp3Files, ...oggFiles];

console.log(`Found ${mp3Files.length} MP3 files and ${oggFiles.length} OGG files. Total: ${files.length}\n`);

let successCount = 0;
let errorCount = 0;

files.forEach((filePath, index) => {
    const opusPath = filePath.replace(/\.mp3$/i, '.opus');

    console.log(`[${index + 1}/${mp3Files.length}] Converting: ${path.basename(filePath)}`);

    try {
        // Use ffmpegPath instead of "ffmpeg"
        execSync(`"${ffmpegPath}" -i "${filePath}" -c:a libopus -b:a ${OPUS_BITRATE} "${opusPath}" -y`, { stdio: 'pipe' });

        successCount++;
        console.log(`✓ Created: ${path.basename(opusPath)}`);

        if (DELETE_ORIGINAL) {
            fs.unlinkSync(filePath);
            console.log(`✓ Deleted original file: ${path.basename(filePath)}`);
        }
    } catch (error) {
        errorCount++;
        console.error(`✗ Error converting: ${error.message}`);
    }

    console.log('');
});

console.log('='.repeat(50));
console.log(`Conversion complete!`);
console.log(`✓ Successful: ${successCount}`);
console.log(`✗ Failed: ${errorCount}`);
console.log('='.repeat(50));

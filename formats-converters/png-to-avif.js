const helper = require('./0helper.js');
const sharp = require('sharp');

// compress all images in assets folder
const rootDir = 'assets';
try {
    const allFiles = helper.getAllFiles(rootDir);
    console.log(`Found ${allFiles.length} files in '${rootDir}'`);
    allFiles.forEach((file) => {
        // console.log(file);
        const file_extension = path.extname(file);
        const file_without_extension = file.replace(file_extension, '');
        const file_avif = `${file_without_extension}.avif`;
        if (file_extension !== '.png') return; // skip if not png
        if (allFiles.includes(file_avif)) return; // skip if avif format already exists
        sharp(file)
            .avif({
                quality: 60,
                lossless: false,
                effort: 4,
                chromaSubsampling: '4:2:0',
                bitdepth: 8,
            })
            .toFile(file_avif, (err, info) => {
                console.log('converted', file, 'to', file_avif);
            });
    });
} catch (error) {
    console.error('Error:', error.message);
}

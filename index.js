const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');
const archiver = require('archiver');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// simple storage for multer
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

// Hardcoded credentials
const VALID_USER = 'Ash Ofc';
const VALID_PASS = 'Ash Ofc';

// Simple login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === VALID_USER && password === VALID_PASS) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, message: 'Invalid credentials' });
});

// Catalogue upload -> slices into 6 vertical parts and zips
app.post('/api/upload-catalogue', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const infile = req.file.path;
    const outDir = path.join(__dirname, 'tmp', path.parse(req.file.filename).name);
    fs.mkdirSync(outDir, { recursive: true });

    const image = sharp(infile);
    const metadata = await image.metadata();
    const width = metadata.width;
    const height = metadata.height;

    const sliceWidth = Math.floor(width / 6);
    const slicePromises = [];

    for (let i = 0; i < 6; i++) {
      const left = i * sliceWidth;
      // last slice takes remainder
      const w = (i === 5) ? (width - left) : sliceWidth;
      const outPath = path.join(outDir, `slice_${i + 1}.png`);
      slicePromises.push(
        image.extract({ left, top: 0, width: w, height })
          .toFile(outPath)
      );
    }

    await Promise.all(slicePromises);

    // create a simple catalogue html
    const catalogueHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Catalogue</title>
  <style>
    body{margin:0;background:#0b0b0d;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh}
    .wrap{display:flex;gap:6px}
    .wrap img{height:80vh;display:block}
  </style>
</head>
<body>
  <div class="wrap">
    ${[1,2,3,4,5,6].map(i => `<img src="slice_${i}.png" alt="slice${i}">`).join('\n')}
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(outDir, 'index.html'), catalogueHtml);

    // zip the folder
    const zipName = `catalogue_${Date.now()}.zip`;
    const zipPath = path.join(__dirname, 'tmp', zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      // cleanup uploaded file & slice folder
      fs.unlinkSync(infile);
      // send download url
      res.json({ ok: true, url: `/download/${zipName}` });
    });

    archive.on('error', (err) => { throw err; });

    archive.pipe(output);
    archive.directory(outDir, false);
    archive.finalize();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// serve zip downloads
app.get('/download/:zip', (req, res) => {
  const zipPath = path.join(__dirname, 'tmp', req.params.zip);
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, (err) => {
      if (!err) {
        // optional: delete zip after download
        setTimeout(() => {
          try{ fs.unlinkSync(zipPath); } catch(e){}
        }, 60*1000);
      }
    });
  } else {
    res.status(404).send('Not found');
  }
});

// Generate WhatsApp link
app.post('/api/generate-wplink', (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  // sanitize number (remove spaces, plus signs, dashes)
  const digits = number.replace(/[^0-9]/g, '');
  const link = `https://wa.me/${digits}`;
  res.json({ ok: true, link });
});

// Generate WhatsApp QR
app.post('/api/generate-wpqr', async (req, res) => {
  const { number } = req.body;
  if (!number) return res.status(400).json({ error: 'Number required' });
  const digits = number.replace(/[^0-9]/g, '');
  const link = `https://wa.me/${digits}`;
  try{
    const dataUrl = await QRCode.toDataURL(link);
    res.json({ ok: true, dataUrl });
  }catch(err){
    res.status(500).json({ error: 'QR creation failed' });
  }
});

// ensure tmp exists
fs.mkdirSync(path.join(__dirname, 'tmp'), { recursive: true });
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
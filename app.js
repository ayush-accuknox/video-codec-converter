const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('video'), (req, res) => {
  const { file, body: { fps }  } = req;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  if (!fps || isNaN(fps) || fps <= 0) {
    return res.status(400).send('Invalid FPS value.');
  }

  const outputFileName = 'output.mp4';
//   const fps = 30;
  const resolution = '640x480';

  const filePath = path.join(__dirname, 'uploads', file.originalname);
  fs.writeFileSync(filePath, file.buffer);

  const ffmpegPath = 'FFmpeg Converter/bin/ffmpeg.exe'; // Provide the correct path to FFmpeg executable
  const command = ffmpeg()
    .setFfmpegPath(ffmpegPath)
    .input(filePath)
    .output(outputFileName)
    .videoCodec('libx264')
    .outputOption(`-r ${fps}`)
    .outputOption(`-s ${resolution}`)
    .on('end', () => {
      console.log('Conversion finished.');
      res.download(outputFileName, () => {
        fs.unlinkSync(outputFileName);
        fs.unlinkSync(filePath);
      });
    })
    .on('error', (err, stdout, stderr) => {
      console.error('Error:', err.message);
      console.error('FFmpeg stdout:', stdout);
      console.error('FFmpeg stderr:', stderr);
      res.status(500).send('Error during conversion.');
    });

  console.log('FFmpeg command:', command.toString());
  command.run();
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

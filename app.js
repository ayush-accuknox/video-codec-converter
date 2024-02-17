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
  const { file, body: { fps, Height, Width, format}  } = req;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }
  if (!fps || isNaN(fps) || fps <= 0 || !Width || !Height) {
    return res.status(400).send('Invalid FPS value.');
  }

  const outputFormat = format || 'mp4'; // Default to MP4 format
  const outputFileName = `output.${outputFormat}`;
  // const fps = 30;
  // const resolution = '640x480';

  const filePath = path.join(__dirname, 'uploads', file.originalname);
  fs.writeFileSync(filePath, file.buffer);

  const ffmpegPath = "FFmpegConverter/bin/ffmpeg.exe"; // Provide the correct path to FFmpeg executable
  const command = ffmpeg()
    .setFfmpegPath(ffmpegPath)
    .input(filePath)
    .output(outputFileName)
    .videoCodec('libx264')
    .outputOption(`-r ${fps}`)
    .outputOption(`-s ${Width}x${Height}`)
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

    let commandString = `${ffmpegPath} -i ${filePath} -r ${fps} -s ${Width}x${Height} -c:v libx264 ${outputFileName}`;
console.log('FFmpeg command:', commandString);

  //   console.log('FFmpeg path:', ffmpegPath);
  //   console.log('Command:', command);
  // console.log('FFmpeg command:', command.toString());
  command.run();
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

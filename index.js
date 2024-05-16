const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const app = express();


const uploadUrl = 'https://harold10.ncservers.xyz/dashboard/h.php';

const downloadInstance = axios.create({
    baseURL: 'https://ytdlbyjonell-0c2a4d00cfcc.herokuapp.com/',
    responseType: 'arraybuffer',
});


const uploadInstance = axios.create({
    baseURL: uploadUrl,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});


async function downloadVideo(ytLink) {
    try {

        const response = await downloadInstance.get(`/yt?url=${ytLink}&type=mp4`);
        return response.data;
    } catch (error) {
        console.error('Error downloading video:', error);
        throw error;
    }
}

async function uploadFile(filePath) {
    try {
    
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath), 'audio.mp3');

        
        const uploadResponse = await uploadInstance.post('', formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        return uploadResponse.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

async function processAndUpload(ytLink) {
    try {
        
        const videoBuffer = await downloadVideo(ytLink);

        const videoInfo = await ytdl.getInfo(ytLink);
        const videoTitle = videoInfo.videoDetails.title.replace(/[^\w\s]/gi, '');
        const m4aFilePath = path.join(__dirname, `${videoTitle}.mp3`);

        fs.writeFileSync(m4aFilePath, videoBuffer);

        
        const uploadResponse = await uploadFile(m4aFilePath);

        fs.unlinkSync(m4aFilePath);

        
        const jsonRegex = /<a href='([^']*)' target='_blank'>Click here to play<\/a>/;
        const match = uploadResponse.match(jsonRegex);
        const downloadLink = match ? match[1] : null;
        return { downloadLink };
    } catch (error) {
        console.error('Error processing and uploading video:', error);
        throw error;
    }
}

app.get('/api/jonell', async (req, res) => {
    const ytLink = req.query.url;

    if (!ytLink) {
        return res.status(400).json({ error: 'YouTube URL parameter is required.' });
    }

    try {
        const result = await processAndUpload(ytLink);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

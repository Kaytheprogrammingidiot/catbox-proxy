const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/upload', async (req, res) => {
    const { url, userhash } = req.body;

    if (!url || !userhash) {
        return res.status(400).send('Missing url or userhash');
    }

    const form = new FormData();
    form.append('reqtype', 'urlupload');
    form.append('userhash', userhash);
    form.append('url', url);

    try {
        const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form
        });

        const result = await response.text();
        res.send(result);
    } catch (err) {
        res.status(500).send('Upload failed: ' + err.message);
    }
});

app.listen(3000, () => {
    console.log('Catbox proxy running on port 3000');
});
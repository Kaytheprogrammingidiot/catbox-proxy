import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api', async (req, res) => {
	// CORS headers for browser access
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	const { userhash, url } = req.body;

	// Validate input
	if (!userhash || !url) {
		return res.status(400).json({ error: 'Missing userhash or url' });
	}

	// Prepare form data for Catbox
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

		if (result.startsWith('https://')) {
			res.status(200).send(result);
		} else {
			res.status(400).json({ error: `Catbox error: ${result}` });
		}
	} catch (err) {
		console.error('Proxy error:', err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.listen(3000, () => {
	console.log('Catbox proxy running on port 3000');
});

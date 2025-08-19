const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (req, res) => {
	// CORS headers
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	// Handle OPTIONS
	if (req.method === 'OPTIONS') {
		return res.status(200).end();
	}

	// Health check
	if (req.method === 'GET') {
		return res.status(200).json({
			message: 'Catbox proxy is alive. Use POST with HASH + URL or FILE to upload.'
		});
	}

	if (req.method !== 'POST') {
		return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
	}

	try {
		// Detect if request is JSON (url upload) or multipart (file upload)
		if (req.headers['content-type']?.includes('application/json')) {
			// Handle JSON body (URL upload)
			let rawBody = '';
			for await (const chunk of req) rawBody += chunk;
			const { HASH, URL } = JSON.parse(rawBody);

			if (!HASH || !URL) {
				return res.status(400).json({ error: 'Missing HASH or URL' });
			}

			const form = new FormData();
			form.append('reqtype', 'urlupload');
			form.append('userhash', HASH);
			form.append('url', URL);

			const response = await fetch('https://catbox.moe/user/api.php', {
				method: 'POST',
				body: form
			});
			const result = await response.text();

			if (result.startsWith('https://')) {
				return res.status(200).json({ url: result });
			} else {
				return res.status(400).json({ error: `Catbox error: ${result}` });
			}
		} else {
			// Handle multipart body (file upload)
			const chunks = [];
			for await (const chunk of req) chunks.push(chunk);
			const buffer = Buffer.concat(chunks);

			// Forward raw multipart request to Catbox
			const response = await fetch('https://catbox.moe/user/api.php', {
				method: 'POST',
				headers: { 'Content-Type': req.headers['content-type'] },
				body: buffer
			});
			const result = await response.text();

			if (result.startsWith('https://')) {
				return res.status(200).json({ url: result });
			} else {
				return res.status(400).json({ error: `Catbox error: ${result}` });
			}
		}
	} catch (err) {
		console.error('Upload error:', err);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};

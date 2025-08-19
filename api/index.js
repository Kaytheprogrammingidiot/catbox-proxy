app.post('/upload', async (req, res) => {
	const { HASH, URL } = req.body;

	if (!HASH || !URL) {
		return res.status(400).json({ error: 'Missing HASH or URL' });
	}

	const form = new FormData();
	form.append('reqtype', 'urlupload');
	form.append('userhash', HASH);
	form.append('url', URL);

	try {
		const response = await fetch('https://catbox.moe/user/api.php', {
			method: 'POST',
			body: form
		});

		const result = await response.text();

		if (result.startsWith('https://')) {
			res.status(200).json({ url: result });
		} else {
			res.status(400).json({ error: `Catbox error: ${result}` });
		}
	} catch (err) {
		console.error('Upload route error:', err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

export default async function handler(req, res) {
	try {
		const { url } = req.query;

		if (!url) {
			return res.status(400).json({ error: 'Missing URL parameter' });
		}

		const response = await fetch(url);

		if (!response.ok) {
			return res.status(response.status).json({ error: `Upstream error: ${response.statusText}` });
		}

		const data = await response.text(); // or .json() if expecting JSON

		res.status(200).send(data);
	} catch (err) {
		console.error('Proxy error:', err);
		res.status(500).json({ error: 'Internal Server Error' });
	}
}

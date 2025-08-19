const Busboy = require('busboy');

module.exports = async (req, res) => {
  // CORS headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Health check
  if (req.method === 'GET') return res.status(200).json({ message: 'Proxy alive' });

  // Method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const busboy = new Busboy({ headers: req.headers });
    const fields = {};
    const files = [];

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, file, filename, encoding, mimetype) => {
      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => {
        files.push({
          fieldname: name,
          filename,
          encoding,
          mimetype,
          size: Buffer.concat(chunks).length
        });
      });
    });

    busboy.on('finish', () => {
      return res.status(200).json({
        message: 'Upload received',
        fields,
        files
      });
    });

    req.pipe(busboy);
  } catch (err) {
    console.error('Busboy error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

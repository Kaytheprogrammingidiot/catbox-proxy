module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ message: "Proxy alive" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    let rawBody = "";
    for await (const chunk of req) rawBody += chunk;

    return res.status(200).json({
      message: "Received POST",
      headers: req.headers,
      body: rawBody.slice(0, 200) // echo first 200 chars
    });
  } catch (err) {
    console.error("Debug error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

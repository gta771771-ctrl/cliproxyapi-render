const express = require("express");

const app = express();
app.use(express.json({ limit: "10mb" }));

const V0_API_KEY = process.env.V0_API_KEY;
const PORT = process.env.PORT || 3000;

app.get("/v1/models", (req, res) => {
  res.json({
    object: "list",
    data: [
      {
        id: "v0-1.5-md",
        object: "model",
        owned_by: "v0"
      }
    ]
  });
});

app.post("/v1/chat/completions", async (req, res) => {
  try {
    const body = req.body;

    const response = await fetch("https://api.v0.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${V0_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: body.model || "v0-1.5-md",
        messages: body.messages || [],
        stream: false
      })
    });

    const text = await response.text();

    res.status(response.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (err) {
    res.status(500).json({
      error: {
        message: err.message,
        type: "proxy_error"
      }
    });
  }
});

app.listen(PORT, () => {
  console.log(`v0 proxy running on port ${PORT}`);
});

const express = require("express");

const app = express();
const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.json({ message: "Hello from the downstream service, via FlowGate!" });
});

app.get("/orders", (req, res) => {
  res.json({
    orders: [
      { id: 1, item: "Keyboard", status: "shipped" },
      { id: 2, item: "Monitor", status: "processing" },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Mock downstream service listening on port ${PORT}`);
});

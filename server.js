const express = require('express');
const app = express();

app.use(express.json());

let offsetMinutes = 180;
let message = "لقد نجحت يا زياد";

app.get('/time', (req, res) => {
  res.json({ offsetMinutes, message });
});

app.post('/time', (req, res) => {
  if (typeof req.body.offsetMinutes === 'number') {
    offsetMinutes = req.body.offsetMinutes;
  }
  if (typeof req.body.message === 'string') {
    message = req.body.message;
  }
  res.json({ status: "ok" });
});

app.listen(3000, () => {
  console.log("⏳ Temporal Server running on port 3000");
});

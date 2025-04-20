const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cron = require("node-cron");
const twilio = require("twilio");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const eventsFile = "events.json";

// Twilio credentials
const accountSid = "YOUR_TWILIO_SID";
const authToken = "YOUR_TWILIO_AUTH_TOKEN";
const client = twilio(accountSid, authToken);
const fromWhatsAppNumber = "whatsapp:+YOUR_TWILIO_NUMBER";

// Add event API
app.post("/add-event", (req, res) => {
  const newEvent = req.body;
  const events = JSON.parse(fs.readFileSync(eventsFile));
  events.push(newEvent);
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2));
  res.send({ success: true });
});

// Daily job at 9 AM
cron.schedule("0 9 * * *", () => {
  const today = new Date().toISOString().split("T")[0];
  const events = JSON.parse(fs.readFileSync(eventsFile));
  events.forEach(event => {
    if (event.date === today) {
      client.messages
        .create({
          from: fromWhatsAppNumber,
          to: `whatsapp:${event.phone}`,
          body: event.message
        })
        .then(message => {
          console.log(`Message sent to ${event.name}: ${message.sid}`);
        })
        .catch(console.error);
    }
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

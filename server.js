const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const CALENDAR_ID = process.env.CALENDAR_ID;

// Google authentication
const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

// Health route
app.get('/', (req, res) => {
  res.send('Release bot running 🚀');
});

app.post('/slack/release', (req, res) => {
  const text = req.body.text;
  const user = req.body.user_name;

  // Respond immediately to Slack
  res.status(200).send(`🚀 Creating release event: ${text}`);

  // Run calendar creation asynchronously
  createCalendarEvent(text, user);
});

async function createCalendarEvent(text, user) {
  try {
    const authClient = await auth.getClient();

    const calendar = google.calendar({
      version: 'v3',
      auth: authClient,
    });

    const today = new Date().toISOString().split('T')[0];

    const event = {
      summary: `🚀 Release: ${text}`,
      description: `Created from Slack by ${user}`,
      start: { date: today },
      end: { date: today },
    };

    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Release event created:', text);
  } catch (err) {
    console.error('Calendar error:', err);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

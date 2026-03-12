const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const CALENDAR_ID = process.env.CALENDAR_ID;

console.log('Calendar ID:', CALENDAR_ID);

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

app.get('/', (req, res) => {
  res.send('Bot running');
});

app.post('/slack/release', (req, res) => {
  const text = req.body.text;
  const user = req.body.user_name;

  console.log('Slack command received:', text);

  res.send(`🚀 Creating release event: ${text}`);

  createEvent(text, user);
});

async function createEvent(text, user) {
  try {
    console.log('Starting Google auth...');

    const authClient = await auth.getClient();

    const calendar = google.calendar({
      version: 'v3',
      auth: authClient,
    });

    const today = new Date().toISOString().split('T')[0];

    const event = {
      summary: `🚀 Release: ${text}`,
      description: `Created by ${user}`,
      start: { date: today },
      end: { date: today },
    };

    console.log('Creating calendar event...');

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Event created:', response.data.htmlLink);
  } catch (error) {
    console.error('Calendar error:', error);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

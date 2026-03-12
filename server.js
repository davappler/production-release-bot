const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const CALENDAR_ID = process.env.CALENDAR_ID;

console.log('Server starting...');
console.log('Calendar ID:', CALENDAR_ID);

// Google auth
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

  // Respond immediately to Slack (prevents timeout)
  res.status(200).send(`🚀 Creating release event: ${text}`);

  // Run event creation asynchronously
  setImmediate(() => {
    createCalendarEvent(text, user);
  });
});

async function createCalendarEvent(text, user) {
  try {
    console.log('Authenticating with Google...');

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

    console.log('Creating calendar event...');

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Event created:', response.data.htmlLink);
  } catch (err) {
    console.error('Calendar error:', err);
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

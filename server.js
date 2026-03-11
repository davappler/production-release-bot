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

// Health check route
app.get('/', (req, res) => {
  res.send('Release bot is running 🚀');
});

// Slack slash command endpoint
app.post('/slack/release', async (req, res) => {
  const text = req.body.text;

  // Respond immediately to Slack
  res.json({
    response_type: 'ephemeral',
    text: `🚀 Creating release event: *${text}*`,
  });

  try {
    const authClient = await auth.getClient();

    const calendar = google.calendar({
      version: 'v3',
      auth: authClient,
    });

    const today = new Date().toISOString().split('T')[0];

    const event = {
      summary: `🚀 Release: ${text}`,
      description: `Created from Slack by ${req.body.user_name}`,
      start: { date: today },
      end: { date: today },
    };

    await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('Release event created:', text);
  } catch (error) {
    console.error('Error creating calendar event:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

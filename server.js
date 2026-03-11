const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const calendarId = process.env.CALENDAR_ID;

const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

app.post('/slack/release', async (req, res) => {
  const text = req.body.text;

  const authClient = await auth.getClient();
  const calendar = google.calendar({ version: 'v3', auth: authClient });

  const today = new Date().toISOString().split('T')[0];

  const event = {
    summary: '🚀 Release: ' + text,
    start: { date: today },
    end: { date: today },
  };

  await calendar.events.insert({
    calendarId: calendarId,
    resource: event,
  });

  res.send('✅ Release added to calendar!');
});

app.listen(3000, () => {
  console.log('Server running');
});

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();

// Slack sends commands as application/x-www-form-urlencoded
// Must be parsed BEFORE any route handlers
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

app.post('/slack/release', async (req, res) => {
  // --- FIX 1: Respond to Slack IMMEDIATELY (within 3 seconds) ---
  // Slack requires a 200 OK fast — do this before any async work.
  const text = req.body.text || '(no text provided)';
  const user = req.body.user_name || 'unknown';

  console.log('Slack command received from:', user, '| text:', text);

  // --- FIX 2: Use correct Slack response format ---
  // Slack expects JSON with response_type and text fields,
  // not a plain string, to show the message in channel.
  res.status(200).json({
    response_type: 'in_channel', // use 'ephemeral' to show only to the user
    text: `🚀 Creating release event: *${text}*`,
  });

  // --- FIX 3: Fire-and-forget async work AFTER responding ---
  await createCalendarEvent(text, user);
});

async function createCalendarEvent(text, user) {
  try {
    console.log('Authenticating with Google...');

    const authClient = await auth.getClient();

    const calendar = google.calendar({
      version: 'v3',
      auth: authClient,
    });

    const now = new Date();
    const tenMinsLater = new Date(now.getTime() + 10 * 60 * 1000);

    const event = {
      summary: `🚀 Release: ${text}`,
      description: `Created from Slack by @${user}`,
      start: { dateTime: now.toISOString(), timeZone: 'Europe/London' },
      end: { dateTime: tenMinsLater.toISOString(), timeZone: 'Europe/London' },
    };

    console.log('Creating calendar event at:', now.toISOString());

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    console.log('✅ Event created:', response.data.htmlLink);
  } catch (err) {
    console.error('❌ Calendar error:', err.message || err);
  }
}

// --- FIX 4: Global error handler to prevent silent crashes ---
// If any middleware throws, this catches it and still returns 200
// so Slack doesn't retry and timeout.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(200).json({
      response_type: 'ephemeral',
      text: '⚠️ Something went wrong on the server.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

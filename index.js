import express from 'express';
import { google } from 'googleapis';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,   //client_id
    process.env.GOOGLE_CLIENT_SECRET,   //client_secret
    'http://localhost:3000/google/redirect'   //redirect url
);

const calendar = google.calendar({ 
    version: 'v3',
    auth: oauth2Client
});

const scopes = [
    'https://www.googleapis.com/auth/calendar',
];

app.get('/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    res.redirect(url);
});

app.get('/google/redirect', async (req, res) => {
    const code = req.query.code;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        res.redirect('/meetlink');
    } catch (error) {
        console.error('Error retrieving access token', error);
        res.send('Error during authentication');
    }
});

app.get('/meetlink', async (req, res) => {
    try {
        const event = await calendar.events.insert({
            calendarId: 'primary',
            auth: oauth2Client,
            conferenceDataVersion: 1,
            requestBody: {
                summary: 'Meeting',
                description: 'Meeting',
                start: {
                    dateTime: dayjs(new Date()).add(1, 'day').toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
                end: {
                    dateTime: dayjs(new Date()).add(1, 'day').add(1, 'hour').toISOString(),
                    timeZone: 'Asia/Kolkata',
                },
                conferenceData: {
                    createRequest: {
                        requestId: uuidv4(),
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet',
                        },
                    },
                },
                attendees: [
                    { email: 'hetratanpara.dev@gmail.com' },
                ],
            },
        });

        console.log('Event created: ', event.data);
        console.log('Meeting link: ', event.data.hangoutLink);
        res.send('Meeting scheduled');
    } catch (error) {
        console.error('Error creating event: ', error);
        res.send('Error scheduling meeting');
    }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

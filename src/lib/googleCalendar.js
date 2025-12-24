// src/lib/googleCalendar.js

// 1. YOUR TEACHER EMAIL (This is where invites get sent)
const TEACHER_EMAIL = "alejandropotter16@gmail.com"; 

// --- FUNCTION 1: FETCH EVENTS ---
export const fetchGoogleCalendarEvents = async (token) => {
  try {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(now.getDate() + 30);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: nextMonth.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    return [];
  }
};

// --- FUNCTION 2: CREATE EVENT (AND SEND INVITE) ---
export const createGoogleCalendarEvent = async (token, eventDetails) => {
  const { title, date, time, duration = 60 } = eventDetails;

  const startDateTime = new Date(`${date}T${time}:00`);
  // Create End Time (Start + 60 mins)
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  const eventPayload = {
    summary: `Olé Learning: ${title}`,
    description: `Language lesson booking via Olé Learning.`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    // The "Link": Add Teacher as Attendee
    attendees: [
      { email: TEACHER_EMAIL } 
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  try {
    // FIX: ADDED '?sendUpdates=all' TO FORCE EMAIL INVITE
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );

    const data = await res.json();
    
    if (data.error) {
      console.error("Google API Error:", data.error);
      throw new Error(data.error.message);
    }

    return data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};
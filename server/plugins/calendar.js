import { google } from "googleapis";

// Get upcoming events
export async function getEvents(auth, maxResults = 5) {
  try {
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    return events.map((event) => ({
      id: event.id,
      title: event.summary || "No title",
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || null,
      description: event.description || null,
    }));
  } catch (error) {
    console.error("Calendar error:", error.message);
    return [];
  }
}

// Create a new event
export async function createEvent(auth, { title, start, end, description, location }) {
  try {
    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: title,
      location,
      description,
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(end || start).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return {
      success: true,
      id: response.data.id,
      title: response.data.summary,
      start: response.data.start.dateTime,
    };
  } catch (error) {
    console.error("Create event error:", error.message);
    return { success: false, error: error.message };
  }
}

// Delete an event
export async function deleteEvent(auth, eventId) {
  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
    return { success: true };
  } catch (error) {
    console.error("Delete event error:", error.message);
    return { success: false, error: error.message };
  }
}

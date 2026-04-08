import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    const { type, subject, message, recipients } = payload;

    if (!type || !message || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Invalid notification payload" }, { status: 400 });
    }

    // Placeholder: integrate SMS / Email provider here.
    // For now we simply echo the successful request.
    return NextResponse.json({
      status: "queued",
      type,
      subject,
      recipients: recipients.length,
      messagePreview: message.slice(0, 120),
    });
  } catch (error) {
    console.error("Notification API error", error);
    return NextResponse.json({ error: "Failed to queue notifications" }, { status: 500 });
  }
}

import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Initialize Resend inside the function to avoid build-time errors
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { cadetEmail, cadetName, eventName, eventDate, status, denialReason } = await request.json();

    // Validate required fields
    if (!cadetEmail || !cadetName || !eventName || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare email content based on status
    const subject = status === 'approved'
      ? `Excusal Approved for ${eventName}`
      : `Excusal Denied for ${eventName}`;

    // Format event info with optional date
    const eventInfo = eventDate
      ? `<strong>${eventName}</strong> on <strong>${eventDate}</strong>`
      : `<strong>${eventName}</strong>`;

    const html = status === 'approved'
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Excusal Approved</h2>
          <p>Hi ${cadetName},</p>
          <p>Your excusal request for ${eventInfo} has been <strong style="color: #059669;">approved</strong>.</p>
          <p>You are excused from this event.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Excusal Portal.</p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Excusal Denied</h2>
          <p>Hi ${cadetName},</p>
          <p>Your excusal request for ${eventInfo} has been <strong style="color: #dc2626;">denied</strong>.</p>
          ${denialReason ? `<p><strong>Reason:</strong> ${denialReason}</p>` : ''}
          <p>You are expected to attend this event.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />
          <p style="color: #6b7280; font-size: 14px;">This is an automated message from the Excusal Portal.</p>
        </div>
      `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Excusal Portal <noreply@prbexcusals.com>',
      to: [cadetEmail],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

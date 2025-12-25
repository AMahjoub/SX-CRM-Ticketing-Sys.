
import { SystemManifest } from "../types";

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export const sendNotificationEmail = async (manifest: SystemManifest, payload: EmailPayload): Promise<boolean> => {
  const { email } = manifest;

  if (!email.notificationsEnabled) {
    console.warn("Notifications are globally disabled in manifest.");
    return false;
  }

  // Log the connection details (Simulating an SMTP/API call)
  console.group(`[Nexus Comm Hub] Sending via ${email.provider}`);
  console.log(`Endpoint: ${email.host}:${email.port}`);
  console.log(`Auth User: ${email.auth.user}`);
  console.log(`From: ${email.fromName} <${email.fromEmail}>`);
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Body: ${payload.body}`);
  console.groupEnd();

  await new Promise(resolve => setTimeout(resolve, 500));
  
  return true;
};

export const triggerTicketCreatedNotification = async (manifest: SystemManifest, clientEmail: string, ticketId: string) => {
  await sendNotificationEmail(manifest, {
    to: clientEmail,
    subject: `[${ticketId}] Request Received`,
    body: `Your support request has been registered in our system. An agent will be assigned shortly. Reference: ${ticketId}`
  });
};

export const triggerTicketReplyNotification = async (manifest: SystemManifest, recipientEmail: string, ticketId: string, senderName: string) => {
  await sendNotificationEmail(manifest, {
    to: recipientEmail,
    subject: `Re: [${ticketId}] New Response`,
    body: `${senderName} has updated the support thread for your request ${ticketId}. Please login to your portal to view.`
  });
};

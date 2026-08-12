/**
 * EmailJS configuration for sending report emails.
 *
 * The SENDER is fixed to it22299802@my.sliit.lk — set this by connecting that
 * email account as the EmailJS "Email Service" in the EmailJS dashboard
 * (https://dashboard.emailjs.com). The browser never sees the account
 * password; only the three public IDs below are needed here.
 *
 * Fill these in (EmailJS → Account = Public Key, Email Services = Service ID,
 * Email Templates = Template ID) or set the matching VITE_ env vars.
 */
export const SENDER_EMAIL = 'it22299802@my.sliit.lk';

export const EMAILJS = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_3hfz0w3',
  // From EmailJS → Email Templates (after saving the template built from
  // email_template.html):
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_5n7ax9n',
  // From EmailJS → Account → General → Public Key:
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'MGimv-h7hdlE4fvLl',
};

export function isEmailConfigured() {
  return (
    EMAILJS.serviceId &&
    !EMAILJS.serviceId.startsWith('YOUR_') &&
    EMAILJS.templateId &&
    !EMAILJS.templateId.startsWith('YOUR_') &&
    EMAILJS.publicKey &&
    !EMAILJS.publicKey.startsWith('YOUR_')
  );
}

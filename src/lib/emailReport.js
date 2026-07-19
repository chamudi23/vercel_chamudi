import emailjs from '@emailjs/browser';
import { EMAILJS, SENDER_EMAIL, isEmailConfigured } from './emailConfig';

/**
 * Send a skeletal analysis report by email via EmailJS.
 * Sender is fixed (SENDER_EMAIL, configured on the EmailJS service).
 *
 * @param {string} toEmail  recipient address
 * @param {object} report   { caseId, investigator, location, boneType,
 *                            gender, ageRange, height, confidence, message,
 *                            pdfBase64?, pdfFileName? }
 * @returns {Promise<{ error: Error|null }>}
 */
export async function sendReportEmail(toEmail, report) {
  if (!isEmailConfigured()) {
    return {
      error: new Error(
        'Email service is not configured yet. Add your EmailJS Service ID, Template ID and Public Key in src/lib/emailConfig.js (or the VITE_EMAILJS_* env vars).'
      ),
    };
  }

  const params = {
    to_email: toEmail,
    from_name: 'OAHRIS — Automated Skeletal Analysis',
    sender_email: SENDER_EMAIL,
    reply_to: SENDER_EMAIL,
    // Keep a copy at the sender's mailbox. Bind the template's Bcc field to
    // {{cc_email}} in the EmailJS dashboard.
    cc_email: SENDER_EMAIL,
    subject: `Skeletal Analysis Report — ${report.caseId}`,
    case_id: report.caseId,
    investigator: report.investigator,
    location: report.location,
    bone_type: report.boneType,
    gender: report.gender,
    age_range: report.ageRange,
    height: report.height,
    confidence: report.confidence,
    message: report.message,
    // PDF attachment (base64). Add a Variable Attachment in the EmailJS
    // template with parameter name `report_pdf` (needs a paid EmailJS plan).
    report_pdf: report.pdfBase64 || '',
    report_pdf_name: report.pdfFileName || 'Report.pdf',
  };

  try {
    await emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params, { publicKey: EMAILJS.publicKey });
    return { error: null };
  } catch (e) {
    return { error: new Error(e?.text || e?.message || 'Failed to send email') };
  }
}

/**
 * Match outreach replies and build a short Korean alert.
 * Grok rewrite lives in app/lib/outreach-reply-notify.ts — fallback stays here.
 */

/**
 * @param {string} from
 */
export function extractEmail(from) {
  const angle = from.match(/<([^>]+)>/);
  return (angle?.[1] ?? from).trim().toLowerCase();
}

/**
 * @param {string} from
 * @param {readonly { id: string, company: string, email: string }[]} contacts
 */
export function matchWatchedReply(from, contacts) {
  const email = extractEmail(from);
  return contacts.find((contact) => contact.email.toLowerCase() === email) ?? null;
}

/**
 * @param {{ company: string, email: string }} contact
 * @param {string} [subject]
 */
export function fallbackKoreanAlert(contact, subject) {
  const sub = subject?.trim() ? subject.trim() : "(제목 없음)";
  return [
    `회신 옴: ${contact.company}`,
    `보낸 사람: ${contact.email}`,
    `제목: ${sub}`,
    "다음: Gmail 열고 DEMO-30-READY 보고 30분 잡을지 정하면 됨",
  ].join("\n");
}

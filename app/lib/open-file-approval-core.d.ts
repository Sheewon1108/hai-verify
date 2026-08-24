import type { OpenFileApproval, OpenFileApprovalCatalog } from "./open-file-approvals";

export function listUnapprovedImportant(openFiles: OpenFileApproval[]): OpenFileApproval[];

export function resolveReminderRecipient(
  catalog: Pick<OpenFileApprovalCatalog, "recipientEmail">,
  envEmail?: string,
): string;

export function buildUnapprovedFileReminderEmail(
  pending: OpenFileApproval[],
  siteOrigin?: string,
): { subject: string; text: string; html: string };

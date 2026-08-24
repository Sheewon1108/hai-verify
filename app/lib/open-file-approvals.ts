// Copyright 2026 KARAM & XGOMA Core Team. All Rights Reserved. Private & Confidential.

import catalogJson from "../../hai-ic/open-file-approvals.json";
import {
  listUnapprovedImportant as listUnapprovedImportantCore,
  resolveReminderRecipient as resolveReminderRecipientCore,
} from "./open-file-approval-core.mjs";

export interface OpenFileApproval {
  id: string;
  path: string;
  title: string;
  important: boolean;
  approved: boolean;
}

export interface OpenFileApprovalCatalog {
  recipientEmail: string;
  note?: string;
  openFiles: OpenFileApproval[];
}

const catalog = catalogJson as OpenFileApprovalCatalog;

export function getOpenFileApprovalCatalog(): OpenFileApprovalCatalog {
  return catalog;
}

export function listOpenFiles(
  source: OpenFileApprovalCatalog = catalog,
): OpenFileApproval[] {
  return source.openFiles;
}

/** Important + still waiting on Owner approval. */
export function listUnapprovedImportant(
  source: OpenFileApprovalCatalog = catalog,
): OpenFileApproval[] {
  return listUnapprovedImportantCore(source.openFiles) as OpenFileApproval[];
}

export function resolveReminderRecipient(
  source: OpenFileApprovalCatalog = catalog,
): string {
  return resolveReminderRecipientCore(source, process.env.HAI_REMINDER_EMAIL);
}

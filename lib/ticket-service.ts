/**
 * Public ticket service: generate ticket number, create ticket, trigger n8n webhook.
 * Used by the public /support page (no auth).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const TICKET_PREFIX = "TCK";
const RATE_LIMIT_MINUTES = 5;
const RATE_LIMIT_MAX_SAME_EMAIL = 2;

export interface PublicTicketInput {
  requester_name: string;
  employee_id: string;
  email: string;
  department?: string | null;
  issue_type?: string | null;
  priority: "low" | "medium" | "high";
  description: string;
  attachment_url?: string | null;
  branch_id: string | null;
}

export interface CreatePublicTicketResult {
  success: true;
  ticket_id: string;
  ticket_number: string;
}

export interface CreatePublicTicketError {
  success: false;
  error: string;
}

/**
 * Generate next ticket number for the current year: TCK-2026-0001, TCK-2026-0002, ...
 */
export async function getNextTicketNumber(
  supabase: SupabaseClient
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${TICKET_PREFIX}-${year}-`;
  const { data, error } = await supabase
    .from("tickets")
    .select("ticket_number")
    .like("ticket_number", `${prefix}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextSeq = 1;
  if (data && data.length > 0) {
    const last = data[0].ticket_number as string;
    const match = last.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) nextSeq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, "0")}`;
}

/**
 * Basic rate limit: reject if same email has created too many tickets recently.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  email: string
): Promise<{ allowed: boolean; error?: string }> {
  const since = new Date();
  since.setMinutes(since.getMinutes() - RATE_LIMIT_MINUTES);
  const { data, error } = await supabase
    .from("tickets")
    .select("id")
    .eq("email", email)
    .gte("created_at", since.toISOString());

  if (error) return { allowed: true };
  const count = data?.length ?? 0;
  if (count >= RATE_LIMIT_MAX_SAME_EMAIL) {
    return {
      allowed: false,
      error: `Too many requests. Please try again after ${RATE_LIMIT_MINUTES} minutes.`,
    };
  }
  return { allowed: true };
}

/**
 * Create a ticket from public form (no auth). Optionally trigger n8n webhook.
 */
export async function createPublicTicket(
  supabase: SupabaseClient,
  input: PublicTicketInput
): Promise<CreatePublicTicketResult | CreatePublicTicketError> {
  const rate = await checkRateLimit(supabase, input.email);
  if (!rate.allowed) {
    return { success: false, error: rate.error! };
  }

  const ticket_number = await getNextTicketNumber(supabase);

  const row = {
    ticket_number,
    requester_name: input.requester_name,
    employee_id: input.employee_id,
    email: input.email,
    department: input.department ?? null,
    issue_type: input.issue_type ?? null,
    description: input.description,
    priority: input.priority,
    status: "open",
    assigned_to_id: null,
    resolved_at: null,
    attachment_url: input.attachment_url ?? null,
    branch_id: input.branch_id,
  };

  const { data, error } = await supabase
    .from("tickets")
    .insert(row)
    .select("id, ticket_number")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  const ticketId = data.id as string;
  const ticketNumber = data.ticket_number as string;

  await notifyNewTicketWebhook({
    ticket_id: ticketId,
    ticket_number: ticketNumber,
    requester_name: input.requester_name,
    issue_type: input.issue_type ?? "",
    priority: input.priority,
  }).catch(() => {
    // Webhook is best-effort; don't fail the request
  });

  return {
    success: true,
    ticket_id: ticketId,
    ticket_number: ticketNumber,
  };
}

/**
 * Call n8n webhook for new ticket (optional). Set N8N_NEW_TICKET_WEBHOOK_URL in env.
 */
async function notifyNewTicketWebhook(payload: {
  ticket_id: string;
  ticket_number: string;
  requester_name: string;
  issue_type: string;
  priority: string;
}): Promise<void> {
  const url = process.env.N8N_NEW_TICKET_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

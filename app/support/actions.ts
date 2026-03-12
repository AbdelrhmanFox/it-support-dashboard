"use server";

/**
 * Server action: create a ticket from the public support form.
 * Accepts FormData (fields + optional attachment). Uploads attachment to
 * Supabase Storage bucket "ticket-attachments" if present.
 */

import { createClient } from "@/lib/supabase/server";
import {
  createPublicTicket,
  type PublicTicketInput,
} from "@/lib/ticket-service";

const BUCKET = "ticket-attachments";
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function getString(formData: FormData, key: string): string {
  return (formData.get(key) as string)?.trim() ?? "";
}

export async function createPublicTicketAction(
  formData: FormData
): Promise<
  | { success: true; ticket_id: string; ticket_number: string }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const requester_name = getString(formData, "requester_name");
  const employee_id = getString(formData, "employee_id");
  const email = getString(formData, "email");
  const department = getString(formData, "department") || null;
  const issue_type = getString(formData, "issue_type") || null;
  const priority = (getString(formData, "priority") || "medium") as "low" | "medium" | "high";
  const description = getString(formData, "description");

  if (!requester_name || !employee_id || !email || !description) {
    return { success: false, error: "Required fields: Full name, Employee ID, Email, Description." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Please enter a valid email address." };
  }

  let attachment_url: string | null = null;
  const file = formData.get("attachment") as File | null;
  if (file && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return { success: false, error: "Attachment must be 5 MB or less." };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: "Attachment must be an image (JPEG, PNG, GIF, WebP)." };
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `public/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      attachment_url = urlData.publicUrl;
    }
    // If upload fails (e.g. bucket missing), continue without attachment
  }

  const input: PublicTicketInput = {
    requester_name,
    employee_id,
    email,
    department,
    issue_type,
    priority,
    description,
    attachment_url,
  };
  return createPublicTicket(supabase, input);
}

"use client";

/**
 * Public IT Support Request page at /support.
 * No auth required. Submits via server action and shows success message.
 */

import { useState, useEffect } from "react";
import { TicketForm, type PublicTicketFormValues } from "@/components/ticket-form";
import { createPublicTicketAction } from "@/app/support/actions";
import { getBranches } from "@/services/branches";
import { getLookupOptions } from "@/services/lookup-options";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SupportPage() {
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<string[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>([]);
  const [success, setSuccess] = useState<{ ticketNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    Promise.all([
      getLookupOptions("support_department").catch(() => []),
      getLookupOptions("support_issue_type").catch(() => []),
      getLookupOptions("support_priority").catch(() => []),
    ]).then(([dept, issue, pri]) => {
      setDepartmentOptions(dept);
      setIssueTypeOptions(issue);
      setPriorityOptions(pri);
    });
  }, []);

  async function handleSubmit(
    values: PublicTicketFormValues,
    attachment?: File | null
  ) {
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("requester_name", values.requester_name);
      formData.set("employee_id", values.employee_id);
      formData.set("email", values.email);
      formData.set("department", values.department ?? "");
      formData.set("issue_type", values.issue_type ?? "");
      formData.set("priority", values.priority);
      formData.set("description", values.description);
      formData.set("branch_id", values.branch_id);
      if (attachment) formData.set("attachment", attachment);

      const result = await createPublicTicketAction(formData);
      if (result.success) {
        setSuccess({ ticketNumber: result.ticket_number });
      } else {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">IT Support Request</CardTitle>
            <CardDescription>
              Please fill out the form below to request IT support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-6 text-center text-green-800 dark:text-green-200">
                <p className="font-medium">Your support request has been submitted successfully.</p>
                <p className="mt-2 text-sm">
                  Our IT team will contact you soon.
                </p>
                <p className="mt-3 text-sm font-mono text-muted-foreground">
                  Ticket number: {success.ticketNumber}
                </p>
              </div>
            ) : (
              <TicketForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
                branches={branches}
                departmentOptions={departmentOptions}
                issueTypeOptions={issueTypeOptions}
                priorityOptions={priorityOptions}
              />
            )}
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          For urgent issues, please contact IT directly.
        </p>
      </div>
    </div>
  );
}

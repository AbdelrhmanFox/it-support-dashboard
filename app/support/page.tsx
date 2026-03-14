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
import { Button } from "@/components/ui/button";

export default function SupportPage() {
  const [branches, setBranches] = useState<{ id: string; name: string; code: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [issueTypeOptions, setIssueTypeOptions] = useState<string[]>([]);
  const [priorityOptions, setPriorityOptions] = useState<string[]>([]);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
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
        setSuccessTicket(result.ticket_number);
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
            {successTicket && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">Request submitted successfully!</p>
                  <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
                    Ticket number: <span className="font-mono font-bold">{successTicket}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/50"
                  onClick={() => { setSuccessTicket(null); setFormKey((k) => k + 1); }}
                >
                  Submit another
                </Button>
              </div>
            )}
            <TicketForm
              key={formKey}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
              branches={branches}
              departmentOptions={departmentOptions}
              issueTypeOptions={issueTypeOptions}
              priorityOptions={priorityOptions}
            />
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          For urgent issues, please contact IT directly.
        </p>
      </div>
    </div>
  );
}

"use client";

/**
 * Public ticket request form for /support page.
 * Uses React Hook Form + Zod, shadcn/ui. No auth required.
 */

import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const publicTicketSchema = z.object({
  requester_name: z.string().min(1, "Full name is required"),
  employee_id: z.string().min(1, "Employee ID is required"),
  email: z.string().email("Please enter a valid email"),
  department: z.string().optional(),
  issue_type: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  description: z.string().min(1, "Problem description is required"),
  branch_id: z.string().min(1, "Please select your branch"),
});

export type PublicTicketFormValues = z.infer<typeof publicTicketSchema>;

const MAX_FILE_MB = 5;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const ISSUE_TYPES = [
  "Hardware",
  "Software",
  "Network",
  "Email",
  "Access / Permissions",
  "Printer",
  "Other",
];

interface TicketFormProps {
  onSubmit: (values: PublicTicketFormValues, attachment?: File | null) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  branches: { id: string; name: string; code: string }[];
}

export function TicketForm({ onSubmit, isSubmitting, error, branches }: TicketFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const form = useForm<PublicTicketFormValues>({
    resolver: zodResolver(publicTicketSchema),
    defaultValues: {
      requester_name: "",
      employee_id: "",
      email: "",
      department: "",
      issue_type: "",
      priority: "medium",
      description: "",
      branch_id: "",
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        const file = fileInputRef.current?.files?.[0] ?? null;
        onSubmit(values, file);
      })}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="requester_name">Full Name *</Label>
        <Input
          id="requester_name"
          placeholder="Your full name"
          {...form.register("requester_name")}
        />
        {form.formState.errors.requester_name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.requester_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="employee_id">Employee ID *</Label>
        <Input
          id="employee_id"
          placeholder="e.g. EMP001"
          {...form.register("employee_id")}
        />
        {form.formState.errors.employee_id && (
          <p className="text-sm text-destructive">
            {form.formState.errors.employee_id.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          placeholder="e.g. IT, HR, Sales"
          {...form.register("department")}
        />
      </div>

      <div className="space-y-2">
        <Label>Branch *</Label>
        <Select
          value={form.watch("branch_id") || "__none__"}
          onValueChange={(v) =>
            form.setValue("branch_id", v === "__none__" ? "" : v)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select branch...</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.branch_id && (
          <p className="text-sm text-destructive">
            {form.formState.errors.branch_id.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Issue Type</Label>
        <Select
          value={form.watch("issue_type") || "__none__"}
          onValueChange={(v) =>
            form.setValue("issue_type", v === "__none__" ? "" : v)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select issue type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select...</SelectItem>
            {ISSUE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={form.watch("priority")}
          onValueChange={(v) =>
            form.setValue("priority", v as PublicTicketFormValues["priority"])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Problem Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your issue in detail..."
          rows={5}
          className="resize-none"
          {...form.register("description")}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="attachment">Screenshot (optional)</Label>
        <Input
          id="attachment"
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="cursor-pointer file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground file:text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Max {MAX_FILE_MB} MB. JPEG, PNG, GIF, or WebP.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}

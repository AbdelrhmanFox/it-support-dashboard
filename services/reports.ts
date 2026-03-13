/**
 * Report data and Excel export helpers using SheetJS (xlsx).
 */
import * as XLSX from "xlsx";
import { getTickets } from "@/services/tickets";
import { getSpareParts } from "@/services/spare-parts";
import { getPurchaseRequests } from "@/services/purchase-requests";
import { getSuppliers } from "@/services/suppliers";
import { getAssets } from "@/services/assets";

export type ReportType = "tickets" | "inventory" | "suppliers" | "purchase_requests" | "assets";

export async function getReportData(type: ReportType, branchId?: string | null): Promise<Record<string, unknown>[]> {
  switch (type) {
    case "tickets": {
      const data = await getTickets({ branchId: branchId ?? undefined });
      return data.map((t) => ({
        "Ticket #": t.ticket_number,
        "Requester": t.requester_name,
        "Employee ID": t.employee_id,
        "Email": t.email,
        "Department": t.department,
        "Issue type": t.issue_type,
        "Description": t.description,
        "Priority": t.priority,
        "Status": t.status,
        "Created": t.created_at,
      }));
    }
    case "inventory": {
      const data = await getSpareParts({ branchId: branchId ?? undefined });
      return data.map((p) => ({
        "Part name": p.part_name,
        "SKU": p.sku,
        "Category": p.category,
        "Brand": p.brand,
        "Current stock": p.current_stock,
        "Minimum stock": p.minimum_stock,
        "Reorder level": p.reorder_level,
        "Unit price": p.unit_price,
        "Supplier": (p.suppliers as { name?: string } | null)?.name,
      }));
    }
    case "suppliers": {
      const data = await getSuppliers({ branchId: branchId ?? undefined });
      return data.map((s) => ({
        "Name": s.name,
        "Contact person": s.contact_person,
        "Phone": s.phone,
        "Email": s.email,
        "SLA (days)": s.sla_days,
        "Notes": s.notes,
      }));
    }
    case "purchase_requests": {
      const data = await getPurchaseRequests({ branchId: branchId ?? undefined });
      return data.map((r) => ({
        "Request #": r.request_number,
        "Part": (r.spare_parts as { part_name?: string })?.part_name,
        "Supplier": (r.suppliers as { name?: string })?.name,
        "Quantity": r.quantity,
        "Status": r.status,
        "Request date": r.request_date,
        "Expected delivery": r.expected_delivery_date,
        "Actual delivery": r.actual_delivery_date,
      }));
    }
    case "assets": {
      const data = await getAssets({ branchId: branchId ?? undefined });
      return data.map((a) => ({
        "Asset tag": a.asset_tag,
        "Serial": a.serial_number,
        "Device type": a.device_type,
        "Brand": a.brand,
        "Model": a.model,
        "Status": a.status,
        "Assigned to": a.assigned_user_name,
        "Department": a.department,
        "Location": a.location,
      }));
    }
    default:
      return [];
  }
}

/**
 * Export an array of objects to an Excel file and trigger download.
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  sheetName: string,
  filename: string
): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // sheet name max 31 chars
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

# IT Support Operations Dashboard

## Overview

This project is a **Professional IT Support Operations Dashboard** designed to manage daily IT support tasks, spare parts, inventory, IT assets, supplier follow-ups, and ticket requests.

The goal of the system is to centralize all IT operational activities into a single dashboard that provides:

- Spare parts management
- Inventory tracking
- Purchase request automation
- Supplier follow-up alerts
- IT assets tracking
- Asset maintenance history
- Internal ticket system
- Notifications and automation
- Reports and analytics

The system is built to help IT support teams track devices, spare parts, suppliers, and user requests efficiently while automating repetitive follow-ups and notifications.

---

# System Architecture

## Frontend
- Framework: **Next.js**
- UI Library: **shadcn/ui**
- Styling: **Tailwind CSS**
- Charts: **Recharts**
- Tables: **TanStack Table**
- Forms: **React Hook Form + Zod**
- Excel Import/Export: **SheetJS**

Deployment:
- **Netlify**

Version Control:
- **GitHub**

---

## Backend Services

### Database
**Supabase (PostgreSQL)**

Supabase will handle:
- Database
- Authentication
- Row Level Security
- APIs
- Realtime updates
- Storage (optional)

---

### Automation Server
**n8n (External Server)**

n8n will handle:
- Workflow automation
- Telegram notifications
- Email generation
- Scheduled checks
- Supplier follow-up alerts
- Monthly reports
- Low stock alerts

---

### Notifications
- Telegram Bot
- Dashboard notifications
- Optional Email notifications

---

# Main Modules

## 1. Dashboard Overview

The main dashboard shows real-time operational information.

### KPI Cards
- Open Tickets
- Delayed Supplier Orders
- Low Stock Items
- Pending Purchase Requests
- Devices Requiring Maintenance
- Parts Installed Today

### Charts
- Tickets per month
- Most common issues
- Parts consumption
- Supplier delays
- Device maintenance statistics

### Activity Feed
Recent activity including:
- New tickets
- Installed spare parts
- Created purchase requests
- Supplier updates

---

# 2. Spare Parts Management

Manage all spare parts used by IT support.

### Fields
- Part ID
- Part Name
- Category
- Brand
- Model
- Compatible Devices
- SKU
- Unit Price
- Supplier
- Current Stock
- Minimum Stock
- Reorder Level
- Notes
- Image (optional)

### Features
- Search parts
- Filter by category
- Filter by supplier
- Low stock alerts
- Stock movement history
- Assign parts to devices

---

# 3. Inventory / Stock Management

Tracks stock quantities and movements.

### Stock Fields
- Spare Part ID
- Quantity Available
- Quantity Reserved
- Quantity Consumed
- Last Updated

### Stock Transactions
- Transaction ID
- Part ID
- Transaction Type
  - IN
  - OUT
- Quantity
- Date
- Related Asset
- Performed By
- Notes

### Features
- Inventory dashboard
- Low stock warnings
- Stock history
- Export inventory

---

# 4. Purchase Requests

Used to request new spare parts from suppliers.

### Fields
- Request ID
- Request Number
- Spare Part
- Quantity
- Supplier
- Requested By
- Request Date
- Expected Delivery Date
- Actual Delivery Date
- Status

### Status Types
- Draft
- Submitted
- Ordered
- Waiting Supplier
- Delivered
- Cancelled

### Features
- Generate PR Email
- Copy email template
- Attach supplier quotation
- Track delivery

---

# 5. Supplier Management

Track suppliers and follow-up activities.

### Supplier Fields
- Supplier ID
- Supplier Name
- Contact Person
- Phone
- Email
- SLA Days
- Notes

### Supplier Follow-up

Tracks communication with suppliers.

Fields:
- Follow-up ID
- Supplier
- Purchase Request
- Last Contact Date
- Next Follow-up Date
- Status
- Remarks

---

# 6. IT Assets Management

Track all IT devices used by employees.

### Asset Fields

- Asset ID
- Asset Tag
- Serial Number
- Device Type
- Brand
- Model
- Purchase Date
- Warranty Start
- Warranty End
- Status
- Assigned User
- Department
- Location
- Notes

### Device Status

- Active
- In Maintenance
- Retired
- Lost
- Spare

---

# 7. Asset Maintenance History

Each device has a full maintenance history.

### Fields

- History ID
- Asset ID
- Action Type
- Description
- Installed Part
- Old Value
- New Value
- Performed By
- Date

### Examples

- Battery replaced
- Printhead installed
- User reassigned
- Device repaired

---

# 8. Asset Profile Page

Each device has a full profile with multiple sections.

Tabs:

- Overview
- Assigned User
- Maintenance History
- Installed Parts
- Tickets
- Notes
- Attachments

---

# 9. Ticket System

A simple internal help desk system.

Users can open tickets via a public form.

### Ticket Form Fields

- Name
- Employee ID
- Email
- Department
- Issue Type
- Description
- Priority

### Ticket Status

- Open
- In Progress
- Waiting User
- Resolved
- Closed

### Ticket Dashboard

- Tickets per month
- Tickets by department
- Tickets by issue type
- Average resolution time

---

# 10. Notifications Center

Centralized notification system.

### Notification Types

- Low stock alert
- Supplier delay alert
- New ticket
- Device maintenance required

### Fields

- Notification ID
- Title
- Message
- Module
- Related Record
- Priority
- Read Status
- Created Date

---

# 11. Reports

Reports module provides analytics.

### Reports

- Monthly ticket reports
- Yearly ticket statistics
- Spare parts consumption
- Inventory status
- Supplier performance
- Device maintenance statistics

### Export Options

- Excel
- CSV

---

# Database Schema

## Tables

Users  
Assets  
Asset_History  
Spare_Parts  
Stock_Transactions  
Purchase_Requests  
Suppliers  
Supplier_Followups  
Tickets  
Notifications

---

# Automation Workflows (n8n)

## Low Stock Alert

Trigger:
Daily scheduled job.

Logic:
If stock ≤ reorder level

Actions:
- Create dashboard notification
- Send Telegram alert
- Suggest purchase request

---

## Supplier Delay Reminder

Trigger:
Daily scheduled job.

Logic:
If supplier not responded within SLA days

Actions:
- Create notification
- Send Telegram reminder

---

## Purchase Request Email Generator

Trigger:
When new purchase request created.

Action:
Generate professional email template.

Example:

Subject: Spare Parts Request

Body:

Dear Supplier,

We would like to request the following item:

Item: Zebra Printhead  
Quantity: 10

Please confirm availability and expected delivery date.

Best regards  
IT Support Team

---

## Ticket Notification

Trigger:
New ticket created.

Actions:
- Send Telegram alert
- Add dashboard notification

---

## Monthly Report Automation

Trigger:
First day of every month.

Actions:
- Generate monthly summary
- Export Excel report
- Send notification

---

# Dashboard Pages

- Overview
- Spare Parts
- Inventory
- Purchase Requests
- Suppliers
- Assets
- Asset History
- Tickets
- Notifications
- Reports
- Settings

---

# UI/UX Design Guidelines

Design Style:
Modern Admin Dashboard

Requirements:

- Responsive design
- Clean layout
- RTL support for Arabic
- Dark mode
- Status badges
- Filters
- Advanced tables
- Search functionality
- Charts and KPIs
- Notification bell
- Command search bar

---

# Security

Authentication handled by Supabase.

Roles:

Admin  
IT Support  
Viewer  
Requester

Access control via Row Level Security.

---

# Future Enhancements

- Mobile version
- QR code asset scanning
- Barcode scanning
- AI ticket categorization
- Supplier performance scoring
- Predictive stock consumption
- Device warranty alerts

---

# Deployment

Frontend:
Netlify

Repository:
GitHub

Database:
Supabase

Automation:
n8n server

Notifications:
Telegram Bot

---

# Project Goals

The system aims to:

- Simplify IT support daily operations
- Track spare parts usage
- Maintain device maintenance history
- Reduce supplier delays
- Automate routine follow-ups
- Provide operational insights through reports
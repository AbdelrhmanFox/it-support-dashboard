-- Seed lookup options for the public support form (/support). Admin can edit these from Settings > Dropdown lists.
INSERT INTO public.lookup_options (category, label, sort_order, branch_id)
SELECT v.category, v.label, v.sort_order, NULL
FROM (VALUES
  ('support_department', 'IT', 10),
  ('support_department', 'HR', 20),
  ('support_department', 'Finance', 30),
  ('support_department', 'Operations', 40),
  ('support_department', 'Sales', 50),
  ('support_department', 'Production', 60),
  ('support_department', 'Other', 100),
  ('support_issue_type', 'Hardware', 10),
  ('support_issue_type', 'Software', 20),
  ('support_issue_type', 'Network', 30),
  ('support_issue_type', 'Email', 40),
  ('support_issue_type', 'Access / Permissions', 50),
  ('support_issue_type', 'Printer', 60),
  ('support_issue_type', 'Other', 100),
  ('support_priority', 'Low', 10),
  ('support_priority', 'Medium', 20),
  ('support_priority', 'High', 30),
  ('support_priority', 'Urgent', 40)
) AS v(category, label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.lookup_options lo
  WHERE lo.category = v.category AND lo.label = v.label AND lo.branch_id IS NULL
);

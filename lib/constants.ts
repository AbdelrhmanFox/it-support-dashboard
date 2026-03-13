/** Fixed list of device types for spare part "compatible with" selection. */
export const DEVICE_TYPE_OPTIONS = [
  "Keyboard",
  "Screen",
  "Laptop",
  "Printer",
  "Monitor",
  "Mouse",
  "Cable",
  "Other",
] as const;

export type DeviceTypeOption = (typeof DEVICE_TYPE_OPTIONS)[number];

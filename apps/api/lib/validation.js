export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => {
  throw new HttpError(status, message);
};
export function text(value, label, { optional = false, max = 120 } = {}) {
  if (optional && (value === undefined || value === null || value === ""))
    return "";
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `${label} is required and must be at most ${max} characters`);
  return value.trim();
}
export function choice(value, options, label) {
  if (!options.includes(value))
    fail(400, `${label} must be one of: ${options.join(", ")}`);
  return value;
}
export function integer(value, label, min = 0, max = 10000000) {
  if (
    value === "" ||
    value === null ||
    value === undefined ||
    typeof value === "boolean" ||
    !Number.isInteger(Number(value)) ||
    Number(value) < min ||
    Number(value) > max
  )
    fail(400, `${label} must be a whole number between ${min} and ${max}`);
  return Number(value);
}
export function cents(value, label = "Daily rate") {
  const input = String(value ?? "");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(input))
    fail(
      400,
      `${label} must be a positive amount with at most two decimal places`,
    );
  const [whole, fraction = ""] = input.split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (result <= 0 || result > 100000000)
    fail(400, `${label} is outside the allowed range`);
  return result;
}
export function duration(start, end) {
  const valid = (value) =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(start) || !valid(end))
    fail(400, "Use valid pickup and return dates");
  const days = (Date.parse(end) - Date.parse(start)) / 86400000;
  if (days < 1 || days > 365)
    fail(400, "Return must be 1 to 365 days after pickup");
  return days;
}
export function password(value) {
  if (
    typeof value !== "string" ||
    value.length < 10 ||
    Buffer.byteLength(value) > 72
  )
    fail(
      400,
      "Password must be at least 10 characters and at most 72 UTF-8 bytes",
    );
  return value;
}
export function boolean(value, label) {
  if (typeof value !== "boolean") fail(400, `${label} must be true or false`);
  return value ? 1 : 0;
}
export function customerInput(body) {
  const email = text(body.email, "Email", { optional: true, max: 254 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail(400, "Enter a valid email");
  return {
    name: text(body.name, "Name"),
    email,
    phone: text(body.phone, "Phone", { max: 40 }),
    license: text(body.licenseNumber, "Driver license", {
      max: 60,
    }).toUpperCase(),
  };
}
export function vehicleInput(body) {
  return {
    plate: text(body.plate, "License plate", { max: 20 }).toUpperCase(),
    make: text(body.make, "Make", { max: 60 }),
    model: text(body.model, "Model", { max: 60 }),
    year: integer(body.year, "Year", 1980, new Date().getUTCFullYear() + 1),
    category: text(body.category, "Category", { max: 40 }),
    rate: cents(body.dailyRate),
    status: choice(
      body.status,
      ["available", "maintenance", "retired"],
      "Vehicle status",
    ),
    odometer: integer(body.odometer, "Odometer"),
  };
}

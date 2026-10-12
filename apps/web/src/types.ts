export type User = {
  id: string;
  username: string;
  name: string;
  role: "Manager" | "Employee";
  active: boolean;
};
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  active: boolean;
};
export type Vehicle = {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  category: string;
  dailyRateCents: number;
  currency: string;
  status: "available" | "maintenance" | "retired";
  odometer: number;
};
export type Payment = {
  id: string;
  provider: "cash" | "stripe" | "paypal";
  mode: string;
  status:
    "creating" | "pending" | "processing" | "paid" | "failed" | "cancelled";
  amountCents: number;
  currency: string;
  checkoutUrl: string | null;
  reference: string | null;
  createdAt: string;
};
export type Rental = {
  id: string;
  number: number;
  customerId: string;
  vehicleId: string;
  customerName: string;
  vehicleLabel: string;
  plate: string;
  startDate: string;
  endDate: string;
  days: number;
  dailyRateCents: number;
  totalCents: number;
  currency: string;
  paymentMethod: "cash" | "stripe" | "paypal";
  status: "reserved" | "active" | "completed" | "cancelled";
  notes: string;
  pickupOdometer: number | null;
  returnOdometer: number | null;
  pickedUpAt: string | null;
  returnedAt: string | null;
  payments: Payment[];
};
export type List<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
export type Config = {
  currency: string;
  paymentMode: "demo" | "sandbox" | "live";
  demoLogin: boolean;
  providers: { cash: boolean; stripe: boolean; paypal: boolean };
};
export type DashboardData = {
  customers: number;
  vehicles: number;
  activeRentals: number;
  reservations: number;
  overdue: number;
  revenue: { currency: string; mode: string; amountCents: number }[];
  recent: Rental[];
};
export type CheckoutData = {
  number: number;
  vehicleLabel: string;
  startDate: string;
  endDate: string;
  rentalStatus: string;
  payment: Payment;
  demo: boolean;
};

import { prisma } from "@/lib/db";
import Link from "next/link";
import { Users, ClipboardList, FileText, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const [customerCount, openWorkOrders, draftInvoices] = await Promise.all([
    prisma.customer.count(),
    prisma.workOrder.count({
      where: { status: { in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] } },
    }),
    prisma.invoice.count({ where: { status: { in: ["DRAFT", "SENT", "OVERDUE"] } } }),
  ]);

  const stats = [
    { label: "Total Customers", value: customerCount, icon: Users, href: "/customers", color: "text-blue-600 bg-blue-50" },
    { label: "Open Work Orders", value: openWorkOrders, icon: ClipboardList, href: "/work-orders", color: "text-yellow-600 bg-yellow-50" },
    { label: "Unpaid Invoices", value: draftInvoices, icon: FileText, href: "/invoices", color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-4 rounded-lg border border-gray-200 p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={`rounded-lg p-3 ${color}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-gray-200 p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/customers/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Customer
          </Link>
          <Link
            href="/work-orders/new"
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            + New Work Order
          </Link>
        </div>
      </div>
    </div>
  );
}

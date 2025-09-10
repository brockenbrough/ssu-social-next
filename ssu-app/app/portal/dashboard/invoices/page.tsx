"use client";
import { useMemo, useState } from "react";


const SAMPLE_INVOICES = [
  { id: "INV-1001", customer: "Acme Corp",    date: "2025-08-30", amount: 1200, status: "Unpaid"  },
  { id: "INV-1002", customer: "Beta LLC",     date: "2025-08-28", amount:  480, status: "Paid"    },
  { id: "INV-1003", customer: "City Health",  date: "2025-08-27", amount:  250, status: "Overdue" },
  { id: "INV-1004", customer: "Delta Foods",  date: "2025-08-26", amount:  999, status: "Unpaid"  },
  { id: "INV-1005", customer: "Epsilon Inc.", date: "2025-08-20", amount:  320, status: "Paid"    },
];

const statusColor = (s: string) =>
  s === "Paid" ? "bg-green-100 text-green-700"
  : s === "Unpaid" ? "bg-amber-100 text-amber-700"
  : "bg-red-100 text-red-700"; // Overdue

export default function InvoicesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return SAMPLE_INVOICES.filter(inv => {
      const matchText =
        inv.id.toLowerCase().includes(ql) ||
        inv.customer.toLowerCase().includes(ql);
      const matchStatus = status === "All" ? true : inv.status === status;
      return matchText && matchStatus;
    });
  }, [q, status]);

  const totalUnpaid = useMemo(() => {
    return filtered
      .filter(i => i.status !== "Paid")
      .reduce((sum, i) => sum + i.amount, 0);
  }, [filtered]);

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Hard coded Invoices</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} ·
            &nbsp;Unpaid total:{" "}
            <span className="font-medium">${totalUnpaid.toLocaleString()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID or customer…"
            className="h-9 w-60 rounded-lg border border-gray-300 px-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-3 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>All</option>
            <option>Unpaid</option>
            <option>Paid</option>
            <option>Overdue</option>
          </select>

          <a
            href="/invoices/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 transition"
          >
            {/* remove the icon if you don't have lucide-react */}
        
            New Invoice
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="px-4 py-3 font-medium">{inv.id}</td>
                <td className="px-4 py-3">{inv.customer}</td>
                <td className="px-4 py-3">
                  {new Date(inv.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  ${inv.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusColor(inv.status)}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={`/invoices/${inv.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                  No invoices match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

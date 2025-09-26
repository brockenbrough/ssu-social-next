// Yannie modified: load customers and display in a table
import { fetchCustomers } from "@/app/lib/data";
import { CustomerField } from "@/app/lib/definitions";

export default async function Page() {

  const customers: CustomerField[] = await fetchCustomers();

    return (
      <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customers Information</h1>

      <table className="table-auto min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border border-gray-300 text-left">Name</th>
            <th className="px-4 py-2 border border-gray-300 text-left">Customer ID</th>
            <th className="px-4 py-2 border border-gray-300 text-left">Email</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer, index) => (
            <tr
              key={customer.id}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100"}
            >
              <td className="px-4 py-2 border border-gray-300">{customer.name}</td>
              {/* Kutman: Change displaying Customer id, replacing letters with numbers for display purpose. */}
              <td className="px-4 py-2 border border-gray-300">{customer.id.replace(/\D/g, '')}</td>
              <td className="px-4 py-2 border border-gray-300">{customer.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    );
  }
  //Yannie modified ends here
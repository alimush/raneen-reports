"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

let cachedSessionId = null;

export default function InvoicesPage() {
  const [sessionId, setSessionId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    docEntry: "",
    docNum: "",
    cardName: "",
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50); // Adjust as needed

  const getSessionId = async () => {
    if (cachedSessionId) {
      return cachedSessionId;
    }
    cachedSessionId = await loginToSAP();
    return cachedSessionId;
  };

  const loginToSAP = async () => {
    try {
      const response = await axios.post("/api/login");
      return response.data.sessionId;
    } catch (error) {
      setError("Login to SAP failed");
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const sessionId = await getSessionId();
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
  
      const data = await response.json();
      // Remove duplicates by keeping only the first occurrence of each DocEntry
      const uniqueInvoices = data.reduce((acc, current) => {
        const exists = acc.find(item => item.DocEntry === current.DocEntry);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
  
      setInvoices(uniqueInvoices);
      setFilteredInvoices(uniqueInvoices);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const applyFilters = () => {
    const filtered = invoices.filter((invoice) => {
      return (
        (!filters.docEntry || invoice.DocEntry.toString().includes(filters.docEntry)) &&
        (!filters.docNum || invoice.DocNum.toString().includes(filters.docNum)) &&
        (!filters.cardName || invoice.CardName.toLowerCase().includes(filters.cardName.toLowerCase()))
      );
    });
    setFilteredInvoices(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  const handleClearFilters = () => {
    setFilters({ docEntry: "", docNum: "", cardName: "" });
    setFilteredInvoices(invoices);
    setCurrentPage(1); // Reset to first page after clearing filters
  };

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredInvoices.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredInvoices.length / recordsPerPage);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">SAP B1 sale orders</h1> {/* Updated title */}

      <div className="mb-4 grid grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Filter by DocEntry"
          value={filters.docEntry}
          onChange={(e) => handleFilterChange("docEntry", e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Filter by DocNum"
          value={filters.docNum}
          onChange={(e) => handleFilterChange("docNum", e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Filter by CardName"
          value={filters.cardName}
          onChange={(e) => handleFilterChange("cardName", e.target.value)}
          className="p-2 border rounded"
        />
        <div className="flex space-x-2">
          <button
            onClick={applyFilters}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <table className="min-w-full bg-white border rounded-lg">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 border">DocEntry</th>
            <th className="py-2 px-4 border">DocNum</th>
            <th className="py-2 px-4 border">CardName</th>
            <th className="py-2 px-4 border">DocDate</th>
            <th className="py-2 px-4 border">DocTotal</th>
            <th className="py-2 px-4 border">DocCurrency</th>
            <th className="py-2 px-4 border">Status</th> {/* Optional: Add Status */}
          </tr>
        </thead>
        <tbody>
          {currentRecords.length > 0 ? (
            currentRecords.map((invoice, index) => (
              <tr key={`${invoice.DocEntry}-${index}`} className="hover:bg-gray-100">
                <td className="py-2 px-4 border">
                  <Link href={`/invoicedetails/${invoice.DocEntry}`} className="text-blue-600 hover:underline">
                    {invoice.DocEntry}
                  </Link>
                </td>
                <td className="py-2 px-4 border">{invoice.DocNum}</td>
                <td className="py-2 px-4 border">{invoice.CardName}</td>
                <td className="py-2 px-4 border">{new Date(invoice.DocDate).toLocaleDateString()}</td>
                <td className="py-2 px-4 border">{invoice.DocTotal}</td>
                <td className="py-2 px-4 border">{invoice.DocCur}</td>
                <td className="py-2 px-4 border">{invoice.DocStatus}</td> {/* Optional: Display Status */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="py-2 px-4 text-center">
                No sale orders found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 bg-gray-300 rounded ${
            currentPage === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"
          }`}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 bg-gray-300 rounded ${
            currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-400"
          }`}
        >
          Next
        </button>
      </div>


    </div>
  );
}

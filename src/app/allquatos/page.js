"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

let cachedSessionId = null;

export default function QuotationsPage() {
  const [sessionId, setSessionId] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    docEntry: "",
    docNum: "",
    cardName: "",
  });

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
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const sessionId = await getSessionId();
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
  
      const data = await response.json();
      // Remove duplicates based on DocEntry
      const uniqueQuotations = data.reduce((acc, current) => {
        const duplicate = acc.find(item => item.DocEntry === current.DocEntry);
        if (!duplicate) {
          acc.push(current);
        }
        return acc;
      }, []);
  
      setQuotations(uniqueQuotations);
      setFilteredQuotations(uniqueQuotations);
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
    const filtered = quotations.filter((quote) => {
      return (
        (!filters.docEntry || quote.DocEntry.toString().includes(filters.docEntry)) &&
        (!filters.docNum || quote.DocNum.toString().includes(filters.docNum)) &&
        (!filters.cardName || quote.CardName.toLowerCase().includes(filters.cardName.toLowerCase()))
      );
    });
    setFilteredQuotations(filtered);
  };

  const handleClearFilters = () => {
    setFilters({ docEntry: "", docNum: "", cardName: "" });
    setFilteredQuotations(quotations);
  };

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
      <h1 className="text-3xl font-bold mb-6">SAP B1 Quotations</h1>

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

      <table className="min-w-full bg-white border rounded-lg">
        <thead>
          <tr className="bg-gray-200">
            <th className="py-2 px-4 border">DocEntry</th>
            <th className="py-2 px-4 border">DocNum</th>
            <th className="py-2 px-4 border">CardName</th>
            <th className="py-2 px-4 border">DocDate</th>
            <th className="py-2 px-4 border">DocTotal</th>
            <th className="py-2 px-4 border">DocCurrency</th>
          </tr>
        </thead>
        <tbody>
          {filteredQuotations.length > 0 ? (
            filteredQuotations.map((quote, index) => (
              <tr key={`${quote.DocEntry}-${index}`} className="hover:bg-gray-100">
                <td className="py-2 px-4 border">
                  <Link href={`/quotations/${quote.DocEntry}`} className="text-blue-600 hover:underline">
                    {quote.DocEntry}
                  </Link>
                </td>
                <td className="py-2 px-4 border">{quote.DocNum}</td>
                <td className="py-2 px-4 border">{quote.CardName}</td>
                <td className="py-2 px-4 border">{new Date(quote.DocDate).toLocaleDateString()}</td>
                <td className="py-2 px-4 border">{quote.DocTotal}</td>
                <td className="py-2 px-4 border">{quote.DocCur}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-2 px-4 text-center">
                No quotations found
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );
}

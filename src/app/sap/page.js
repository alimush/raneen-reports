'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from your API
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sap'); // Update this if your route is different
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-black w-screen min-h-screen p-10">
      <div className="text-white text-4xl text-center mb-6">Payment Data</div>

      {loading ? (
        <div className="text-white text-center">Loading...</div>
      ) : (
        <div className="text-white">
          {data.length === 0 ? (
            <div>No data found.</div>
          ) : (
            <table className="w-full table-auto border-collapse border border-white">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-white p-2">DocNum</th>
                  <th className="border border-white p-2">CardName</th>
                  <th className="border border-white p-2">DocTotal</th>
                  <th className="border border-white p-2">JrnlMemo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-700">
                    <td className="border border-white p-2">{item.DocNum}</td>
                    <td className="border border-white p-2">{item.CardName}</td>
                    <td className="border border-white p-2">{item.DocTotal}</td>
                    <td className="border border-white p-2">{item.JrnlMemo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSpinner, FaChartLine, FaCalendarAlt, FaFilter, FaDownload, FaChevronDown, FaChevronUp, FaFilePdf, FaFileExcel, FaSearch, FaSync } from 'react-icons/fa';
import { FaWarehouse } from "react-icons/fa6";
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useInView } from 'react-intersection-observer';
import CustomAwesomeButton from "../components/CustomAwesomeButton";


const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => (
  <div className="flex flex-col sm:flex-row sm:space-x-4 mb-4">
    <div className="flex flex-col mb-2 sm:mb-0">
      <label htmlFor="startDate" className="mb-1 text-sm font-medium text-gray-700">Start Date</label>
      <input
        type="date"
        id="startDate"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <div className="flex flex-col">
      <label htmlFor="endDate" className="mb-1 text-sm font-medium text-gray-700">End Date</label>
      <input
        type="date"
        id="endDate"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  </div>
);

const GroupBySelector = ({ groupBy, onGroupByChange }) => (
  <div className="mb-4">
    <label htmlFor="groupBy" className="block mb-1 text-sm font-medium text-gray-700">Group By</label>
    <select
      id="groupBy"
      value={groupBy}
      onChange={(e) => onGroupByChange(e.target.value)}
      className="p-2 border rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
    </select>
  </div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const SalesChart = ({ data }) => {
  const [chartType, setChartType] = useState('line');

  const aggregatedData = useMemo(() => {
    if (chartType !== 'pie') return data;

    const subcategoryData = data.reduce((acc, item) => {
      if (!acc[item.subcategory]) {
        acc[item.subcategory] = { subcategory: item.subcategory, totalSales: 0, grossProfit: 0 };
      }
      acc[item.subcategory].totalSales += item.totalSales;
      acc[item.subcategory].grossProfit += item.grossProfit;
      return acc;
    }, {});

    return Object.values(subcategoryData).sort((a, b) => b.totalSales - a.totalSales);
  }, [data, chartType]);

  const totalSales = useMemo(() => {
    return aggregatedData.reduce((sum, item) => sum + item.totalSales, 0);
  }, [aggregatedData]);

  const ChartComponent = useMemo(() => {
    switch (chartType) {
      case 'bar':
        return BarChart;
      case 'pie':
        return PieChart;
      default:
        return LineChart;
    }
  }, [chartType]);

  const DataComponent = useMemo(() => {
    switch (chartType) {
      case 'bar':
        return Bar;
      case 'pie':
        return Pie;
      default:
        return Line;
    }
  }, [chartType]);

  const renderTooltip = useCallback(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-bold">{data.subcategory}</p>
          <p>Total Sales: ${data.totalSales.toFixed(2)}</p>
          <p>Gross Profit: ${data.grossProfit.toFixed(2)}</p>
          <p>Percentage: {((data.totalSales / totalSales) * 100).toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  }, [totalSales]);

  const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.1; // Increased radius for outer positioning
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const item = aggregatedData[index];
    const percentage = (percent * 100).toFixed(0);

    return (
      <text 
        x={x} 
        y={y} 
        fill="black" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
      >
        {`${item.subcategory} ($${item.totalSales.toFixed(0)})`}
      </text>
    );
  }, [aggregatedData]);

  const renderChart = useCallback(() => {
    if (chartType === 'pie') {
      return (
        <>
          <Pie
            data={aggregatedData}
            dataKey="totalSales"
            nameKey="subcategory"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={renderCustomizedLabel}
            labelLine={true}
          >
            {aggregatedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <text x="50%" y={20} textAnchor="middle" dominantBaseline="hanging" className="font-bold" fill="black">
            Total Sales: ${totalSales.toFixed(2)}
          </text>
        </>
      );
    }

    return (
      <>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={chartType === 'bar' ? 'subcategory' : 'date'} />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip content={renderTooltip} />
        <Legend />
        <DataComponent yAxisId="left" type="monotone" dataKey="totalSales" fill="#8884d8" stroke="#8884d8" name="Total Sales" />
        <DataComponent yAxisId="right" type="monotone" dataKey="grossProfit" fill="#82ca9d" stroke="#82ca9d" name="Gross Profit" />
      </>
    );
  }, [chartType, aggregatedData, renderCustomizedLabel, renderTooltip, totalSales]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Sales Overview by Subcategory</h2>
        <div className="space-x-2">
          {['line', 'bar', 'pie'].map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1 rounded ${chartType === type ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={aggregatedData}>
          {renderChart()}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

const SalesSummary = ({ data }) => {
  const summaryData = useMemo(() => {
    const totalSales = data.reduce((sum, item) => sum + item.totalSales, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orderCount, 0);
    const totalItemsSold = data.reduce((sum, item) => sum + item.itemsSold, 0);
    const totalGrossProfit = data.reduce((sum, item) => sum + item.grossProfit, 0);
    return [
      { title: "Total Sales", value: `$${totalSales.toFixed(2)}`, icon: FaChartLine, color: "bg-blue-500" },
      { title: "Total Orders", value: totalOrders, icon: FaCalendarAlt, color: "bg-green-500" },
      { title: "Items Sold", value: totalItemsSold, icon: FaWarehouse, color: "bg-yellow-500" },
      { title: "Gross Profit", value: `$${totalGrossProfit.toFixed(2)}`, icon: FaFilter, color: "bg-purple-500" },
    ];
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {summaryData.map((item, index) => (
        <motion.div
          key={index}
          className={`${item.color} text-white p-4 rounded-lg shadow-md`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 10 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-75">{item.title}</p>
              <p className="text-2xl font-semibold">{item.value}</p>
            </div>
            <item.icon className="text-3xl opacity-75" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const SalesTable = ({ data }) => {
  const [sortColumn, setSortColumn] = useState('date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedAndFilteredData = useMemo(() => {
    return [...data]
      .filter(item => 
        Object.values(item).some(
          value => value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
      .sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [data, sortColumn, sortDirection, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAndFilteredData, currentPage]);

  const handleSort = (column) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const totalPages = Math.ceil(sortedAndFilteredData.length / itemsPerPage);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">Detailed Sales Data</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded-md w-full"
        />
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Date', 'Category', 'Subcategory', 'Total Sales', 'Order Count', 'Items Sold', 'Gross Profit'].map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort(header.toLowerCase().replace(' ', ''))}
              >
                {header}
                {sortColumn === header.toLowerCase().replace(' ', '') && (
                  <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <AnimatePresence>
            {paginatedData.map((item, index) => (
              <motion.tr
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.subcategory}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.totalSales.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orderCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemsSold}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.grossProfit.toFixed(2)}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
      <div className="mt-4 flex justify-between items-center">
        <span>
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedAndFilteredData.length)} of {sortedAndFilteredData.length} entries
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

export default function Sales_Report() {
  const { hasPermission: canViewSalesReport, loading: loadingPermission } = usePermission('Sales_Report');
  const router = useRouter();
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupBy, setGroupBy] = useState('day');
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const cachedDataRef = useRef({});

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    const cacheKey = `${startDate}-${endDate}-${groupBy}`;
    
    if (cachedDataRef.current[cacheKey] && Date.now() - lastFetchTime < 60000) {
      setSalesData(cachedDataRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${apiUrl}Reports/api/reports/sales`, {
        params: { startDate, endDate, groupBy },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setSalesData(response.data);
        cachedDataRef.current[cacheKey] = response.data;
        setLastFetchTime(Date.now());
      } else {
        toast.error('Received unexpected data format from the server.');
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
      toast.error(`Failed to fetch sales data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, groupBy, token]);

  useEffect(() => {
    if (canViewSalesReport) {
      fetchSalesData();
    }
  }, [canViewSalesReport, fetchSalesData]);

  const handleReturn = () => {
    router.back();
  };

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.text('Sales Report', 14, 15);
    doc.autoTable({
      head: [['Date', 'Category', 'Subcategory', 'Total Sales', 'Order Count', 'Items Sold', 'Gross Profit']],
      body: salesData.map(item => [
        item.date,
        item.category,
        item.subcategory,
        `$${item.totalSales.toFixed(2)}`,
        item.orderCount,
        item.itemsSold,
        `$${item.grossProfit.toFixed(2)}`
      ]),
    });
    doc.save('sales_report.pdf');
  }, [salesData]);

  const exportToExcel = useCallback(() => {
    const ws = XLSX.utils.json_to_sheet(salesData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, "sales_report.xlsx");
  }, [salesData]);

  const { ref, inView } = useInView({
    threshold: 0,
  });

  if (loadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FaSpinner className="text-4xl text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!canViewSalesReport) {
    return <NotAuth />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto p-4 bg-gray-100 text-gray-900 min-h-screen"
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Sales Report</h1>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 text-white bg-red-500 rounded-full hover:bg-red-600 transition shadow-md"
            >
              <FaFilePdf className="mr-2" />
              PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600 transition shadow-md"
            >
              <FaFileExcel className="mr-2" />
              Excel
            </motion.button>
            <CustomAwesomeButton
 buttonType="electric"
 onPress={handleReturn}
 isRTL={true}
>
<div className="flex flex-row">
<FaArrowLeft className="mr-2 mt-1" />
          رجوع
</div>
</CustomAwesomeButton>
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-6 rounded-lg shadow-md mb-8"
        >
          <div 
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <h2 className="text-xl font-semibold">Filter Options</h2>
            {isFilterOpen ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />
                <GroupBySelector groupBy={groupBy} onGroupByChange={setGroupBy} />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchSalesData}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 shadow-md flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <FaSpinner className="animate-spin mr-2" />
                  ) : (
                    <FaSync className="mr-2" />
                  )}
                  {loading ? 'Loading...' : 'Apply Filters'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && salesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SalesSummary data={salesData} />
            <SalesChart data={salesData} />
            <div ref={ref}>
              {inView && <SalesTable data={salesData} />}
            </div>
          </motion.div>
        )}

        {!loading && salesData.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8 rounded-md shadow-md"
            role="alert"
          >
            <p className="font-bold">No Data</p>
            <p>There is no sales data available for the selected date range and grouping.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
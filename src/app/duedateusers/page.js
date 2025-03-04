"use client";
import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../components/CustomAwesomeButton';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FixedSizeList as List } from 'react-window';

// Custom wrapper for virtualization inside <tbody>
const OuterElementType = React.forwardRef((props, ref) => (
  <tbody ref={ref} {...props} />
));
OuterElementType.displayName = "OuterElementType"; // ✅ Fix the issue


export default function Inventory_Report() {
  const { hasPermission: canCreateStorage, loading: loadingPermission } = usePermission('Inventory_Report');
  const router = useRouter();

  // State for filter inputs (Removed dueDateFrom)
  const [filters, setFilters] = useState({
    dueDateTo: '',
    groupName: 'all',
    u_paytype: '',
  });

  // State for unique filter options
  const [uniqueFilters, setUniqueFilters] = useState({ groups: [], paytypes: [] });
  // State for the data results
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Helper function to format date (YYYY-MM-DD)
  const formatDate = (dateString) => (dateString ? dateString.substring(0, 10) : '');

  // Fetch unique filter options on mount
  useEffect(() => {
    axios.get('/api/list')
      .then(response => {
        setUniqueFilters(response.data);
      })
      .catch(error => {
        toast.error('Error fetching filter options');
        console.error(error);
      });
  }, []);

  const handleReturn = () => {
    router.back();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    // Ensure a valid due date is selected
    if (!filters.dueDateTo) {
      toast.error('Please select a due date.');
      return;
    }

    setLoadingData(true);
    try {
      // Build query params to pass to the filtered data API
      const params = {
        dueDate: filters.dueDateTo, // Send as 'dueDate' to match backend
        groupName: filters.groupName !== 'all' ? filters.groupName : '',
        u_paytype: filters.u_paytype,
      };

      const response = await axios.get('/api/duedateusers', { params });
      setData(response.data);
    } catch (error) {
      toast.error('Error fetching data');
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  // Export data to Excel using xlsx and file-saver
  const exportToExcel = () => {
    if (!data.length) {
      toast.error('No data to export');
      return;
    }

    const exportData = data.map((item) => ({
      Type: item.Type,
      "Group Name": item["الوزارة"],
      "Customer Code": item["رمز الساب"],
      "Customer Name": item["اسم الزبون"],
      "Payment Type": item["طريقة الدفع"],
      "Due Date": formatDate(item["تاريخ الاستحقاق"]),
      "Invoice Total": item["مبلغ الفاتورة"],
      "Remaining": item["المتبقي"],
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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

  if (!canCreateStorage) {
    return <NotAuth />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 bg-gray-50 text-gray-900 min-h-screen"
    >
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <CustomAwesomeButton buttonType="electric" onPress={handleReturn} isRTL={true}>
          <div className="flex flex-row items-center">
            <FaArrowLeft className="mr-2" />
            رجوع
          </div>
        </CustomAwesomeButton>
        <h1 className="mt-4 sm:mt-0 text-2xl font-semibold">Inventory Report</h1>
      </div>

      {/* Filter Section */}
      <motion.div
        className="bg-white p-6 rounded-lg shadow-md"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold mb-4">Search Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Due Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date (Until)</label>
            <input
              type="date"
              name="dueDateTo"
              value={filters.dueDateTo}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <CustomAwesomeButton buttonType="electric" onPress={handleSearch}>
            {loadingData && <FaSpinner className="animate-spin mr-2" />}
            Search
          </CustomAwesomeButton>
          <CustomAwesomeButton buttonType="electric" onPress={exportToExcel}>
            Export to Excel
          </CustomAwesomeButton>
        </div>
      </motion.div>

      {/* Data Table with Virtualization */}
      <div className="mt-8 overflow-x-auto shadow rounded-lg bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {["Type", "Group Name", "Customer Code", "Customer Name", "Payment Type", "Due Date", "Invoice Total", "Remaining"].map((header) => (
                <th key={header} className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <List
            height={500}
            itemCount={data.length}
            itemSize={50}
            width="100%"
            outerElementType={OuterElementType}
            itemData={data}
          >
            {({ index, style, data }) => {
              const item = data[index];
              return (
                <tr key={index} style={style} className="hover:bg-gray-50">
                  {Object.values(item).map((value, i) => (
                    <td key={i} className="px-4 py-3 whitespace-nowrap">{value}</td>
                  ))}
                </tr>
              );
            }}
          </List>
        </table>
      </div>
    </motion.div>
  );
}

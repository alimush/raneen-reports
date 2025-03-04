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

  // State for filter inputs
  // Remove the dueDateFrom filter and keep the others
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
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return dateString.substring(0, 10);
  };

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
    // Ensure a valid due date is selected (Due Date To)
    if (!filters.dueDateTo) {
      toast.error('Please select a due date.');
      return;
    }
    setLoadingData(true);
    try {
      // Build query params – note that we send "dueDate" from dueDateTo
      const params = {
        dueDate: filters.dueDateTo,
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
    if (!data || data.length === 0) {
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Due Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Due Date To</label>
            <input
              type="date"
              name="dueDateTo"
              value={filters.dueDateTo}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Group Name</label>
            <select
              name="groupName"
              value={filters.groupName}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Groups</option>
              {uniqueFilters.groups.map((item, index) => (
                <option key={index} value={item.GroupName}>
                  {item.GroupName}
                </option>
              ))}
            </select>
          </div>
          {/* Payment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Type</label>
            <select
              name="u_paytype"
              value={filters.u_paytype}
              onChange={handleInputChange}
              className="mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Payment Types</option>
              {uniqueFilters.paytypes.map((item, index) => (
                <option key={index} value={item.U_Paytype}>
                  {item.U_Paytype}
                </option>
              ))}
            </select>
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

      {/* Data Results Section */}
      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {loadingData ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <Fragment>
            {data.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">
                No data found. Please adjust your filters.
              </p>
            ) : (
              <div className="overflow-x-auto shadow rounded-lg bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Group Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Customer Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Payment Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Due Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Invoice Total</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Remaining</th>
                    </tr>
                  </thead>
                  {/* Use react-window for virtualization */}
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
                          <td className="px-4 py-3 whitespace-nowrap">{item.Type}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{item["الوزارة"]}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{item["رمز الساب"]}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{item["اسم الزبون"]}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{item["طريقة الدفع"]}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{formatDate(item["تاريخ الاستحقاق"])}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{item["مبلغ الفاتورة"]}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{item["المتبقي"]}</td>
                        </tr>
                      );
                    }}
                  </List>
                </table>
              </div>
            )}
          </Fragment>
        )}
      </motion.div>
    </motion.div>
  );
}

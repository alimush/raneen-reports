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
import AutoSizer from 'react-virtualized-auto-sizer';
import Select from 'react-select';

// A helper hook to detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

// Updated columns definition with all fields from the API
const columns = [
  { label: "Group Name", key: "الوزارة", width: "150px" },
  { label: "Department", key: "الدائرة", width: "150px" },
  { label: "Customer Code", key: "رمز الساب", width: "150px" },
  { label: "Customer Name", key: "اسم الزبون", width: "180px" },
  { label: "Customer Number", key: "رقم الساب", width: "120px" },
  { label: "Invoice Number", key: "رقم الفاتورة", width: "140px" },
  { label: "Installment Number", key: "رقم القسط", width: "130px" },
  { label: "Payment Type", key: "طريقة الدفع", width: "120px" },
  { label: "Invoice Date", key: "تاريخ الفاتورة", width: "120px" },
  { label: "Installment Amount", key: "مبلغ القسط", width: "130px" },
  { label: "Paid Amount", key: "المبلغ المدفوع", width: "130px" },
  { label: "Remaining", key: "المتبقي", width: "130px" },
  { label: "Due Date", key: "تاريخ الاستحقاق", width: "120px" }, // Currently using installment date
  { label: "Invoice Total", key: "مبلغ الفاتورة", width: "130px" }, // assumed same as installment amount
];

// Shared date formatter (formats both invoice date and due date)
const formatDate = (dateString) => dateString ? dateString.substring(0, 10) : '';

// Mobile row renderer: each field is rendered in its own block
function MobileRowRenderer({ index, style, data }) {
  const item = data[index];
  return (
    <div style={style} className="p-4 border rounded-md shadow-sm bg-white mb-4">
      {columns.map((col) => (
        <div key={col.key} className="flex flex-col mb-2">
          <span className="text-xs text-gray-500 font-bold">{col.label}</span>
          <span className="text-sm text-gray-800">
            {(col.key === "تاريخ الاستحقاق" || col.key === "تاريخ الفاتورة")
              ? formatDate(item[col.key])
              : item[col.key]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Desktop row renderer: table row format
function DesktopRowRenderer({ index, style, data }) {
  const item = data[index];
  return (
    <tr style={{ ...style, display: 'table-row' }} className="hover:bg-gray-50">
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3 whitespace-nowrap">
          {(col.key === "تاريخ الاستحقاق" || col.key === "تاريخ الفاتورة")
            ? formatDate(item[col.key])
            : item[col.key]}
        </td>
      ))}
    </tr>
  );
}

// Custom wrapper for react-window inner element in table (for desktop)
const OuterElementType = React.forwardRef((props, ref) => (
  <tbody ref={ref} {...props} />
));
OuterElementType.displayName = "OuterElementType";

export default function Inventory_Report() {
  const { hasPermission: canCreateStorage, loading: loadingPermission } = usePermission('Inventory_Report');
  const router = useRouter();
  const isMobile = useIsMobile();

  // State for filter inputs; dueDateFrom is removed.
  const [filters, setFilters] = useState({
    dueDateTo: '',
    groupName: 'all',
    u_paytype: '',
  });

  // State for unique filter options
  const [uniqueFilters, setUniqueFilters] = useState({ groups: [], paytypes: [] });
  // State for data results
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Compute total width for desktop table by summing fixed column widths
  const totalWidth = columns.reduce((acc, col) => acc + parseInt(col.width, 10), 0);

  // Fetch unique filter options on mount
  useEffect(() => {
    axios.get('/api/list')
      .then((response) => setUniqueFilters(response.data))
      .catch((error) => {
        toast.error('Error fetching filter options');
        console.error(error);
      });
  }, []);

  useEffect(() => {
    axios.get('/api/customersearch')  // assumes your first API is at this path
      .then((res) => setCustomers(res.data))
      .catch((err) => {
        toast.error('Error fetching customers');
        console.error(err);
      });
  }, []);

  const handleReturn = () => router.back();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer.');
      return;
    }
    setLoadingData(true);
    try {
      const response = await axios.get('/api/invoicesDewania', {
        params: { cardCode: selectedCustomer.CardCode }
      });

      // Updated data mapping without splitting "رقم الفاتورة"
      const cleanedData = response.data.map(item => ({
        "الوزارة": item["الوزارة"] || "",
        "الدائرة": item["الدائرة"] || "",
        "رمز الساب": item["رمز الزبون"] || "",
        "اسم الزبون": item["اسم الزبون"] || "",
        "رقم الساب": item["رقم الساب"] || "",
        "رقم الفاتورة": item["رقم الفاتورة"] || "",
        "رقم القسط": item["القسط"] || "",
        "طريقة الدفع": item["الدفع"] || "",
        "تاريخ الفاتورة": item["تاريخ الفاتورة"] || "",
        "مبلغ القسط": item["مبلغ القسط"] || 0,
        "المبلغ المدفوع": item["مبلغ الدفع"] || 0,
        "المتبقي": item["المتبقي"] || 0,
        // Using "تاريخ القسط" for Due Date so the table shows a value
        "تاريخ الاستحقاق": item["تاريخ القسط"] || "",
        // Assuming Invoice Total is same as Installment Amount
        "مبلغ الفاتورة": item["مبلغ القسط"] || 0,
      }));

      setData(cleanedData);
    } catch (err) {
      toast.error('Error fetching invoice data');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  function DesktopGridHeader({ columns }) {
    return (
      <div
        className="bg-gray-100 font-medium text-gray-600"
        style={{
          display: 'grid',
          gridTemplateColumns: columns.map(c => c.width).join(' '),
        }}
      >
        {columns.map((col) => (
          <div key={col.key} className="px-4 py-3">
            {col.label}
          </div>
        ))}
      </div>
    );
  }

  function DesktopGridRow({ index, style, data }) {
    const item = data[index];
    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: columns.map(c => c.width).join(' '),
        }}
        className="hover:bg-gray-50"
      >
        {columns.map((col) => (
          <div key={col.key} className="px-4 py-3 whitespace-nowrap">
            {(col.key === "تاريخ الاستحقاق" || col.key === "تاريخ الفاتورة")
              ? formatDate(item[col.key])
              : item[col.key]}
          </div>
        ))}
      </div>
    );
  }

  const customerOptions = customers.map((cust) => ({
    value: cust.CardCode,
    label: `${cust.CardName} (${cust.CardCode})`,
  }));

  const exportToExcel = () => {
    if (!data.length) {
      toast.error('No data to export');
      return;
    }
    const exportData = data.map((item) => ({
      "Type": item.Type,
      "Group Name": item["الوزارة"],
      "Department": item["الدائرة"],
      "Customer Code": item["رمز الساب"],
      "Customer Name": item["اسم الزبون"],
      "Phone Number": item["رقم التلفون"],
      "Customer Number": item["رقم الساب"],
      "Invoice Number": item["رقم الفاتورة"],
      "Payment Type": item["طريقة الدفع"],
      "Invoice Date": formatDate(item["تاريخ الفاتورة"]),
      "Due Date": formatDate(item["تاريخ الاستحقاق"]),
      "Installment Number": item["رقم القسط"],
      "Invoice Total": item["مبلغ الفاتورة"],
      "Installment Amount": item["مبلغ القسط"],
      "Paid Amount": item["المبلغ المدفوع"],
      "Remaining": item["المتبقي"],
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const customerSummary = data.length > 0 ? {
    name: data[0]["اسم الزبون"] || "",
    code: data[0]["رمز الساب"] || "",
    group: data[0]["الوزارة"] || "",
    department: data[0]["الدائرة"] || "",
    payType: data[0]["طريقة الدفع"] || "",
  } : null;

  if (loadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
          <FaSpinner className="text-4xl text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!canCreateStorage) return <NotAuth />;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="container mx-auto p-4 bg-gray-50 text-gray-900 min-h-screen"
    >
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <CustomAwesomeButton buttonType="electric" onPress={handleReturn} isRTL={true}>
          <div className="flex flex-row items-center">
            <FaArrowLeft className="mr-2" /> رجوع
          </div>
        </CustomAwesomeButton>
        <h1 className="mt-4 sm:mt-0 text-2xl font-semibold">الزبائن المتلكأين ديوانية</h1>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Search Customer</label>
        <Select
          options={customerOptions}
          value={selectedCustomer ? { value: selectedCustomer.CardCode, label: `${selectedCustomer.CardName} (${selectedCustomer.CardCode})` } : null}
          onChange={(option) => {
            if (!option) {
              // Clear selection
              setSelectedCustomer(null);
              setData([]); // Clear table
            } else {
              const found = customers.find((c) => c.CardCode === option.value);
              setSelectedCustomer(found);
            }
          }}    
          placeholder="Type customer name or code..."
          isClearable
        />
      </div>

      {/* Filter Section */}
      <motion.div className="bg-white p-6 rounded-lg shadow-md"
        initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
      >
        <div className="flex justify-end space-x-4">
          <CustomAwesomeButton buttonType="electric" onPress={handleSearch}>
            {loadingData && <FaSpinner className="animate-spin mr-2" />} Search
          </CustomAwesomeButton>
          <CustomAwesomeButton buttonType="electric" onPress={exportToExcel}>
            Export to Excel
          </CustomAwesomeButton>
        </div>
      </motion.div>

      {data.length > 0 && (
        <motion.div 
          initial={{ y: -10, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.3 }} 
          className="bg-white border rounded-md shadow p-4 mb-6"
          dir="rtl"
        >
          <h2 className="text-xl font-semibold mb-4 text-right">بيانات الزبون</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-right">
            <div><span className="font-bold">اسم الزبون:</span> {data[0]["اسم الزبون"]}</div>
            <div><span className="font-bold">رمز الزبون:</span> {data[0]["رمز الساب"]}</div>
            <div><span className="font-bold">الوزارة:</span> {data[0]["الوزارة"]}</div>
            <div><span className="font-bold">الدائرة:</span> {data[0]["الدائرة"]}</div>
            <div><span className="font-bold">طريقة الدفع:</span> {data[0]["طريقة الدفع"]}</div>
          </div>
        </motion.div>
      )}

      {/* Data Results Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mt-8">
        {loadingData ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <Fragment>
            {data.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">No data found. Please adjust your filters.</p>
            ) : (
              isMobile ? (
                <div className="space-y-4">
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        itemCount={data.length}
                        itemSize={150}
                        width={width}
                        itemData={data}
                      >
                        {MobileRowRenderer}
                      </List>
                    )}
                  </AutoSizer>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="shadow rounded-lg bg-white" style={{ minWidth: `${totalWidth}px` }}>
                    <DesktopGridHeader columns={columns} />
                    <div style={{ height: '60vh' }}>
                      <AutoSizer disableWidth>
                        {({ height }) => (
                          <List
                            height={height}
                            itemCount={data.length}
                            itemSize={50}
                            width={totalWidth}
                            itemData={data}
                          >
                            {DesktopGridRow}
                          </List>
                        )}
                      </AutoSizer>
                    </div>
                  </div>
                </div>
              )
            )}
          </Fragment>
        )}
      </motion.div>
    </motion.div>
  );
}

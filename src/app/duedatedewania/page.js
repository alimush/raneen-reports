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

const columns = [
  { label: "Type", key: "Type", width: "80px" },
  { label: "Group Name", key: "الوزارة", width: "150px" },
  { label: "Department", key: "الدائرة", width: "150px" },
  { label: "Customer Code", key: "رمز الساب", width: "150px" },
  { label: "Customer Name", key: "اسم الزبون", width: "180px" },
  { label: "Phone Number", key: "رقم التلفون", width: "140px" },
  { label: "Customer Number", key: "رقم الساب", width: "120px" },
  { label: "Invoice Number", key: "رقم الفاتورة", width: "140px" },
  { label: "Payment Type", key: "طريقة الدفع", width: "120px" },
  { label: "Invoice Date", key: "تاريخ الفاتورة", width: "110px" },
  { label: "Due Date", key: "تاريخ الاستحقاق", width: "110px" },
  { label: "Installment Number", key: "رقم القسط", width: "100px" },
  { label: "Invoice Total", key: "مبلغ الفاتورة", width: "130px" },
  { label: "Installment Amount", key: "مبلغ القسط", width: "120px" },
  { label: "Paid Amount", key: "المبلغ المدفوع", width: "120px" },
  { label: "Remaining", key: "المتبقي", width: "130px" },
];

const formatDate = (dateString) => dateString ? dateString.substring(0, 10) : '';

function DesktopGridHeader({ columns }) {
  return (
    <div className="bg-gray-100 font-medium text-gray-600"
      style={{ display: 'grid', gridTemplateColumns: columns.map(c => c.width).join(' ') }}>
      {columns.map((col) => (
        <div key={col.key} className="px-4 py-3">{col.label}</div>
      ))}
    </div>
  );
}

function DesktopGridRow({ index, style, data }) {
  const item = data[index];
  return (
    <div
      style={{ ...style, display: 'grid', gridTemplateColumns: columns.map(c => c.width).join(' ') }}
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

export default function Inventory_Report() {
  const { hasPermission: canCreateStorage, loading: loadingPermission } = usePermission('Inventory_Report');
  const router = useRouter();
  const isMobile = useIsMobile();

  const [searchType, setSearchType] = useState('customer');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const totalWidth = columns.reduce((acc, col) => acc + parseInt(col.width, 10), 0);

  useEffect(() => {
    axios.get('/api/customersearch')
      .then((res) => setCustomers(res.data))
      .catch((err) => {
        toast.error('Error fetching customers');
        console.error(err);
      });
  }, []);

  const customerOptions = customers.map((cust) => ({
    value: cust.CardCode,
    label: `${cust.CardName} (${cust.CardCode})`,
  }));

  const handleReturn = () => router.back();

  const handleSearch = async () => {
    setLoadingData(true);
    try {
      if (searchType === 'customer') {
        if (!selectedCustomer) {
          toast.error('Please select a customer.');
          return;
        }
        const response = await axios.get('/api/duedateDewania', {
          params: { cardCode: selectedCustomer.CardCode }
        });

        const cleanedData = response.data.map(item => {
          const [docNum, comment] = item["رقم الفاتورة"]?.split("==") || ["", ""];
          return {
            Type: "",
            "رقم التلفون": "",
            "رمز الساب": item["رمز الزبون"] || "",
            "رقم الساب": item["رمز الزبون"] || "",
            "اسم الزبون": item["اسم الزبون"] || "",
            "الوزارة": item["الوزارة"] || "",
            "الدائرة": item["الدائرة"] || "",
            "رقم الفاتورة": docNum,
            "رقم القسط": comment,
            "طريقة الدفع": item["الدفع"] || "",
            "تاريخ الفاتورة": item["تاريخ الفاتورة"] || "",
            "تاريخ الاستحقاق": "",
            "مبلغ الفاتورة": "",
            "مبلغ القسط": item["مبلغ القسط"] || 0,
            "المبلغ المدفوع": item["مبلغ الدفع"] || 0,
            "المتبقي": item["المتبقي"] || 0,
          };
        });

        setData(cleanedData);
      } else {
        if (!invoiceNumber.trim()) {
          toast.error('Please enter an invoice number.');
          return;
        }

        const response = await axios.get('/api/invoicebyid', {
          params: { docNum: invoiceNumber.trim() }
        });

        setData(response.data);
      }
    } catch (err) {
      toast.error('Error fetching data');
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

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

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <CustomAwesomeButton buttonType="electric" onPress={handleReturn} isRTL={true}>
          <div className="flex flex-row items-center">
            <FaArrowLeft className="mr-2" /> رجوع
          </div>
        </CustomAwesomeButton>
        <h1 className="mt-4 sm:mt-0 text-2xl font-semibold">الزبائن المتلكأين بغداد</h1>
      </div>

      {/* البحث */}
      <div className="mb-4 space-y-4">
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input type="radio" value="customer" checked={searchType === 'customer'} onChange={() => setSearchType('customer')} />
            <span>بحث حسب الزبون</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" value="invoice" checked={searchType === 'invoice'} onChange={() => setSearchType('invoice')} />
            <span>بحث حسب الفاتورة</span>
          </label>
        </div>

        {searchType === 'customer' ? (
          <Select
            options={customerOptions}
            value={selectedCustomer ? { value: selectedCustomer.CardCode, label: `${selectedCustomer.CardName} (${selectedCustomer.CardCode})` } : null}
            onChange={(option) => {
              if (!option) {
                setSelectedCustomer(null);
                setData([]);
              } else {
                const found = customers.find((c) => c.CardCode === option.value);
                setSelectedCustomer(found);
              }
            }}
            placeholder="اكتب اسم أو رمز الزبون..."
            isClearable
          />
        ) : (
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full px-4 py-2 border rounded shadow-sm"
            placeholder="ادخل رقم الفاتورة..."
          />
        )}
      </div>

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

      {/* النتائج */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mt-8">
        {loadingData ? (
          <div className="flex justify-center items-center py-12">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <Fragment>
            {data.length === 0 ? (
              <p className="text-center text-gray-500 mt-6">لا توجد بيانات</p>
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
                        {({ index, style }) => (
                          <div style={style} className="p-4 border rounded-md shadow-sm bg-white mb-4">
                            {columns.map((col) => (
                              <div key={col.key} className="flex flex-col mb-2">
                                <span className="text-xs text-gray-500 font-bold">{col.label}</span>
                                <span className="text-sm text-gray-800">
                                  {(col.key === "تاريخ الاستحقاق" || col.key === "تاريخ الفاتورة")
                                    ? formatDate(data[index][col.key])
                                    : data[index][col.key]}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
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

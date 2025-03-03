"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaFileExcel, FaFilePdf, FaSpinner, FaSearch } from 'react-icons/fa';
import { useTable, useSortBy } from 'react-table';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { usePermission } from '../../../../context/PermissionContext';
import NotAuth from "../../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CustomAwesomeButton from "../../components/CustomAwesomeButton";

export default function SupplierItems() {
  const { hasPermission: canViewSuppliersByQty, loading: loadingPermission4 } = usePermission('View_suppliers_by_quantity');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id;

  const [items, setItems] = useState([]);
  const [storages, setStorages] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStorages, setSelectedStorages] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
console.log(items)
  useEffect(() => {
    fetchStorages();
  }, [token]);

  useEffect(() => {
    fetchItems();
  }, [supplierId, search, selectedStorages]);

  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  const fetchStorages = async () => {
    try {
      const response = await axios.get(`${apiUrl}Storage/list-storages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStorages(response.data);
    } catch (error) {
      console.error("Error fetching storages:", error);
      toast.error("Failed to fetch storages");
    }
  };

  const fetchItems = async () => {
    try {
      const query = {
        supplierId,
        search,
        storageIds: selectedStorages.join(',')
      };
      const response = await axios.get(`${apiUrl}Item/items`, {
        params: query,
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
      toast.success("Items fetched successfully");
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to fetch items");
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleStorageChange = (e) => {
    const { value, checked } = e.target;
    setSelectedStorages(prev =>
      checked ? [...prev, value] : prev.filter(id => id !== value)
    );
  };

  const handleSearch = () => {
    fetchItems();
  };

  const handleReturn = () => {
    router.back();
  };

  const handleViewInventory = (itemId) => {
    router.push(`/show-Inv/${itemId}`);
  };

  const columns = useMemo(() => [
    { Header: 'Name', accessor: 'name' },
    { Header: 'Product ID', accessor: 'productId' },
    { Header: 'Main Image', accessor: 'mainImageUrl', Cell: ({ value }) => (
      <motion.img
        src={value}
        alt="main"
        width={50}
        whileHover={{ scale: 1.2 }}
        transition={{ type: "spring", stiffness: 300 }}
      />
    )},
    { Header: 'Price', accessor: 'price' },
    { Header: 'Cost', accessor: 'cost' },
    { Header: 'Total Quantity', accessor: 'totalQuantity' },
    { Header: 'Reserved Quantity', accessor: 'reservedQuantity' },
    { Header: 'Profit Percentage', accessor: 'profitPercentage' },
    { Header: 'Category', accessor: 'category' },
    { Header: 'Subcategory', accessor: 'subcategory' },
    {
      Header: 'Storages',
      accessor: 'storageQuantities',
      Cell: ({ value }) => (
        <ul className="space-y-1">
          {value.map(sq => (
            <li key={sq.storage} className="text-sm">
              <span className="font-medium">{sq.storage}:</span> {sq.quantity}
            </li>
          ))}
        </ul>
      )
    },
    {
      Header: 'Action',
      accessor: 'id',
      Cell: ({ row }) => (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleViewInventory(row.original.id)}
          className="px-4 py-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-md"
        >
          View Inventory
        </motion.button>
      )
    }
  ], []);

  const data = useMemo(() => items, [items]);

  const tableInstance = useTable(
    { columns, data },
    useSortBy
  );

  const exportData = async (format) => {
    setLoadingExport(true); // Show spinner during export
    try {
      if (format === 'excel') {
        const transformedData = items.map(item => ({
          ...item,
          storageQuantities: item.storageQuantities.map(sq => `${sq.storage}: ${sq.quantity}`).join(', ')
        }));
        const ws = XLSX.utils.json_to_sheet(transformedData);
        ws['!dir'] = 'LTR'; // Set worksheet direction to Left-to-Right
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Items');
        XLSX.writeFile(wb, 'items.xlsx');
        toast.success("Exported to Excel successfully");
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        const tableColumn = columns.map(col => col.Header);
        const tableRows = items.map(row => {
          return columns.map(col => {
            const value = row[col.accessor];
            return Array.isArray(value) ? value.join(', ') : value;
          });
        });
  
        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
        });
        doc.save("items.pdf");
        toast.success("Exported to PDF successfully");
      }
      setIsExportModalOpen(false);
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    } finally {
      setLoadingExport(false); // Hide spinner after export
    }
  };
  

  const exportExcel = () => exportData('excel');
  const exportPDF = () => exportData('pdf');

  if (loadingPermission4) {
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

  if (!canViewSuppliersByQty) {
    return <NotAuth />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100 text-gray-900 p-8"
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto">
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

        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <h1 className="text-3xl font-bold mb-6">Supplier Items</h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-grow">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              className="px-6 py-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-md"
            >
              Search
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExportModalOpen(true)}
              className="px-6 py-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 transition shadow-md"
            >
              Export Data
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table id="itemsTable" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
  {tableInstance.headerGroups.map((headerGroup, index) => (
    <tr key={index} {...headerGroup.getHeaderGroupProps()}>
      {headerGroup.headers.map(column => (
        <th
          key={column.id}
          {...column.getHeaderProps(column.getSortByToggleProps())}
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition"
        >
          {column.render('Header')}
          <span>
            {column.isSorted
              ? column.isSortedDesc
                ? ' 🔽'
                : ' 🔼'
              : ''}
          </span>
        </th>
      ))}
    </tr>
  ))}
</thead>

              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                {tableInstance.rows.map(row => {
  tableInstance.prepareRow(row);
  return (
    <motion.tr
      key={row.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      {...row.getRowProps()}
      className="hover:bg-gray-50 transition"
    >
      {row.cells.map(cell => (
        <td
          key={cell.column.id}
          {...cell.getCellProps()}
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
        >
          {cell.render('Cell')}
        </td>
      ))}
    </motion.tr>
  );
})}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <Transition appear show={isExportModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsExportModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Export Data
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Choose the format you want to export the data in:
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {loadingExport ? (
                      <div className="flex justify-center items-center">
                        <FaSpinner className="animate-spin text-blue-600 text-3xl" />
                      </div>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={exportExcel}
                          className="w-full inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                        >
                          <FaFileExcel className="mr-2" />
                          Export to Excel
                        </motion.button>
                        {/* <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={exportPDF}
                          className="w-full inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        >
                          <FaFilePdf className="mr-2" />
                          Export to PDF
                        </motion.button> */}
                      </>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </motion.div>
  );
}

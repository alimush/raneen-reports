"use client";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { useTable, usePagination } from 'react-table';
import { FaArrowLeft, FaArrowRight, FaFileExcel, FaFilePdf, FaSpinner, FaSearch } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CustomAwesomeButton from "../../components/CustomAwesomeButton";

const columns = [
  { Header: 'Product ID', accessor: 'productId' },
  { Header: 'Item Name', accessor: 'itemName' },
  { Header: 'Storage', accessor: 'storage' },
  { Header: 'Quantity', accessor: 'quantity' },
  { Header: 'Original Price', accessor: 'originalPrice' },
  { Header: 'Original Cost', accessor: 'originalCost' },
  { Header: 'Buy Invoice ID', accessor: 'buyInvoiceId' },
  {
    Header: 'Date Added',
    accessor: 'dateAdded',
    Cell: ({ value }) => new Date(value).toLocaleDateString(),
  },
  { Header: 'Note', accessor: 'note' },
];

export default function SupplierItems() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id;
  const [data, setData] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false); // State for export loading spinner
  const [search, setSearch] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [exportData, setExportData] = useState([]); // Separate state for export
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  const fetchData = useCallback(async (page, pageSize, searchTerm = '', exportAll = false) => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}Item/items/${supplierId}/inventory`, {
        params: {
          page: exportAll ? 1 : page,
          limit: exportAll ? 0 : pageSize,
          search: searchTerm,
          exportAll: exportAll,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (exportAll) {
        setExportData(response.data.inventory); // Store export data separately
      } else {
        setData(response.data.inventory);
        setPageCount(response.data.totalPages);
      }
      toast.success("Data fetched successfully");
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [supplierId, token]);

  useEffect(() => {
    if (token) {
      fetchData(currentPage, pageSize, search);
    }
  }, [currentPage, pageSize, token, fetchData, search]);

  const exportData2 = async (format) => {
    setLoadingExport(true); // Show spinner during export
    try {
      const response = await axios.get(`${apiUrl}Item/items/${supplierId}/inventory`, {
        params: {
          page: 1,
          limit: 0, // Fetch all data
          search: search,
          exportAll: true,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const exportData = response.data.inventory;
  
      if (format === 'excel') {
        const reversedData = exportData.map(row => {
          const flippedRow = {};
          const keys = Object.keys(row).reverse();
          keys.forEach(key => {
            flippedRow[key] = row[key];
          });
          return flippedRow;
        });
      
        const worksheet = XLSX.utils.json_to_sheet(reversedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        XLSX.writeFile(workbook, "inventory.xlsx");
        toast.success("Exported to Excel successfully");
      }      
             else if (format === 'pdf') {
        const doc = new jsPDF();
        autoTable(doc, {
          head: [columns.map(col => col.Header)],
          body: exportData.map(row => columns.map(col => row[col.accessor])),
        });
        doc.save("inventory.pdf");
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
  
  const exportExcel = () => exportData2('excel');
  const exportPDF = () => exportData2('pdf');
  

  const handleReturn = () => {
    router.back();
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page: tablePage,
    prepareRow,
    canPreviousPage, // Add this
    canNextPage,     // Add this
    nextPage,
    previousPage,
    state: { pageIndex },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize },
      manualPagination: true,
      pageCount,
    },
    usePagination
  );
  

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto p-4 bg-gray-100 text-gray-900 min-h-screen"
    >
      <ToastContainer position="top-right" autoClose={3000} />
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

      <div className="my-4 flex flex-wrap justify-between items-center">
        <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExportModalOpen(true)}
          className="px-4 py-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 transition"
        >
          Export Data
        </motion.button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FaSpinner className="text-4xl text-blue-500" />
          </motion.div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table {...getTableProps()} className="min-w-full">
            <thead className="bg-gray-50">
              {headerGroups.map((headerGroup, index) => (
                <tr {...headerGroup.getHeaderGroupProps()} key={index}>
                  {headerGroup.headers.map((column, colIndex) => (
                    <th
                      {...column.getHeaderProps()}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      key={colIndex}
                    >
                      {column.render('Header')}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {tablePage.map((row, rowIndex) => {
                  prepareRow(row);
                  return (
                    <motion.tr
                      {...row.getRowProps()}
                      key={rowIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {row.cells.map((cell, cellIndex) => (
                        <td
                          {...cell.getCellProps()}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          key={cellIndex}
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
      )}

      <div className="pagination mt-4 flex justify-center items-center space-x-1">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setCurrentPage(prev => Math.max(prev - 1, 1));
          }}
          disabled={!canPreviousPage}
          className="px-3 py-1 mx-1 bg-gray-200 rounded-full disabled:opacity-50"
        >
          <FaArrowLeft />
        </motion.button>
        {[...Array(pageCount).keys()].map((page) => (
          <motion.button
            key={page}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setCurrentPage(page + 1);
            }}
            className={`px-3 py-1 mx-1 rounded-full ${
              currentPage === page + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {page + 1}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setCurrentPage(prev => Math.min(prev + 1, pageCount));
          }}
          disabled={!canNextPage}
          className="px-3 py-1 mx-1 bg-gray-200 rounded-full disabled:opacity-50"
        >
          <FaArrowRight />
        </motion.button>
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
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={exportPDF}
                          className="w-full inline-flex justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        >
                          <FaFilePdf className="mr-2" />
                          Export to PDF
                        </motion.button>
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

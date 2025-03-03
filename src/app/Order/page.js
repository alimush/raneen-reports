"use client";
import React, { useState, useRef, useEffect } from 'react';
import {
  FaSpinner,
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaCalendarAlt,
  FaWarehouse,
  FaBox,
  FaDollarSign,
  FaChevronDown,
  FaPercent
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from '../components/NotAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../components/CustomAwesomeButton';
import axios from 'axios';

let cachedSessionId = null;

const InventoryReport = () => {
  const { hasPermission: canCreateStorage, loading: loadingPermission } =
    usePermission('Inventory_Report');
  const router = useRouter();

  // State Variables
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const [docDate, setDocDate] = useState('');
  const [docDueDate, setDocDueDate] = useState('');
  const [comments, setComments] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    itemCode: '',
    quantity: '',
    warehouseCode: '',
    discountAmount: 0,
    discountPercent: 0,
    itemName: '',
    UnitPrice: 0,
    UOM: '',
    UoMEntry: null,
  });

  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [itemSearchResults, setItemSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('name');
  const [isLoading, setIsLoading] = useState(false);
  const [uomOptions, setUomOptions] = useState([]);
  const [selectedUom, setSelectedUom] = useState('');
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [isItemDropListOpen, setIsItemDropListOpen] = useState(false);
  const itemInputRef = useRef(null);
  const uomDropdownRef = useRef(null);
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
console.log(itemSearchResults)
  const handleUomSelect = (uom) => {
    console.log('Selected UOM:', uom);

    setSelectedUom(uom);

    // Calculate the new unit price based on the selected UOM
    const newUnitPrice = parseFloat(uom.Price) || 0;

    // Calculate the new discount percentage based on the new unit price
    const discountPercent = newUnitPrice
      ? ((currentItem.discountAmount || 0) / newUnitPrice) * 100
      : 0;

    // Update the current item with the new UOM and unit price
    setCurrentItem((prevItem) => ({
      ...prevItem,
      UnitPrice: newUnitPrice,
      UOM: uom.UOM,
      UoMEntry: uom.UoMEntry,
      discountPercent: parseFloat(discountPercent), // Ensure higher precision
    }));

    // Close the UOM dropdown
    setIsUomDropdownOpen(false);

    // Trigger the discount API call with the new UOM and unit price
    if (selectedCustomer && currentItem.itemCode) {
      fetchDiscountForItem(selectedCustomer, currentItem.itemCode, uom.UOM, newUnitPrice);
    }
  };

  // Update your useEffect to set docDueDate to today's date
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setDocDate(today);
    setDocDueDate(today); // Set docDueDate to today's date
  }, []);

  // Fetch Warehouses
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const response = await axios.get('/api/warehouses'); // Adjust API endpoint as needed
        setWarehouses(response.data);
      } catch (error) {
        toast.error('Error fetching warehouses');
      }
    }
    fetchWarehouses();
  }, []);

  // Customer Search Effect
  useEffect(() => {
    if (
      customerSearchTerm.length > 0 &&
      customerSearchTerm !== selectedCustomerName
    ) {
      async function fetchCustomers() {
        try {
          const response = await axios.get(
            `/api/business-partners?type=business-partners&q=${encodeURIComponent(
              customerSearchTerm
            )}`
          );
          setCustomerSearchResults(response.data);
        } catch (error) {
          toast.error('Error fetching customers');
        }
      }
      fetchCustomers();
    } else {
      setCustomerSearchResults([]);
    }
  }, [customerSearchTerm, selectedCustomerName]);

  // Item Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (itemSearchTerm.length > 0 && !currentItem.itemCode) {
        setIsItemLoading(true);
        setIsItemDropListOpen(true);
        async function fetchItems() {
          try {
            const response = await axios.get(
              `/api/business-partners?type=items&searchType=${searchType}&q=${encodeURIComponent(
                itemSearchTerm
              )}`
            );
            setItemSearchResults(response.data);
            setIsItemLoading(false);
            // Handle barcode or code scan case
            if (
              response.data.length === 1 &&
              ((searchType === 'barcode' &&
                response.data[0].BcdCode === itemSearchTerm) ||
                (searchType === 'code' &&
                  response.data[0].ItemCode === itemSearchTerm))
            ) {
              const item = response.data[0];
              handleItemSelect(item);
            }
          } catch (error) {
            setIsItemLoading(false);
            toast.error('Error fetching items');
          }
        }
        fetchItems();
      } else {
        setItemSearchResults([]);
        setIsItemDropListOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [itemSearchTerm, searchType, currentItem.itemCode]);

  // Handle click outside to close the drop list
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        itemInputRef.current &&
        !itemInputRef.current.contains(event.target)
      ) {
        setIsItemDropListOpen(false);
      }
      if (
        uomDropdownRef.current &&
        !uomDropdownRef.current.contains(event.target)
      ) {
        setIsUomDropdownOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [itemInputRef, uomDropdownRef]);

  const handleReturn = () => {
    router.back();
  };


  const fetchUomForItem = async (itemCode, defaultUOM, defaultPrice) => {
    try {
      const response = await axios.get(`/api/items/${itemCode}/uom`);
      setUomOptions(response.data);

      const matchingUom = response.data.find(
        (uom) => uom.UOM === defaultUOM
      );

      if (matchingUom) {
        setSelectedUom(matchingUom);
        setCurrentItem((prevItem) => ({
          ...prevItem,
          UnitPrice: parseFloat(matchingUom.Price) || 0,
          UOM: matchingUom.UOM,
          UoMEntry: matchingUom.UoMEntry,
        }));
      } else {
        setSelectedUom(null);
        setCurrentItem((prevItem) => ({
          ...prevItem,
          UOM: '',
          UoMEntry: null,
        }));
      }
    } catch (error) {
      console.error('Error fetching UOMs:', error);
      toast.error('Error fetching UOMs');
    }
  };

  const fetchDiscountForItem = async (customer, itemCode, uom, unitPrice) => {
    try {
      const response = await axios.post('/api/discount', {
        customer,
        itemCode,
        uom,
      });
      const { discountValue } = response.data; // discountValue is in price
      const discountAmount = parseFloat(discountValue) || 0;

      // Calculate the discount percentage using the passed unit price
      const discountPercent = unitPrice
        ? parseFloat((discountAmount / unitPrice) * 100)
        : 0;

      // Update the current item with the fetched discount details
      setCurrentItem((prevItem) => ({
        ...prevItem,
        discountAmount,
        discountPercent,
      }));
    } catch (error) {
      console.error('Error fetching discount:', error);
      toast.error('Error fetching discount');
    }
  };


  const handleAddItem = () => {
    if (
      !currentItem.quantity ||
      !currentItem.itemCode ||
      !currentItem.UoMEntry ||
      !currentItem.warehouseCode // Ensure warehouse is selected
    ) {
      toast.error('Item, Quantity, UOM, and Warehouse are required.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      return;
    }

    // Check for duplicate items with the same UOM and Warehouse
    const duplicateItem = selectedItems.find(
      (item) =>
        item.itemCode === currentItem.itemCode &&
        item.UOM === currentItem.UOM &&
        item.warehouseCode === currentItem.warehouseCode
    );

    if (duplicateItem) {
      toast.error('This item with the selected UOM and Warehouse already exists.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      return;
    }

    const newItem = {
      ...currentItem,
      // No need to set a default warehouse code
    };
    setSelectedItems([...selectedItems, newItem]);
    // Reset currentItem
    setCurrentItem({
      itemCode: '',
      quantity: '',
      warehouseCode: '', // Reset warehouseCode
      discountAmount: 0,
      discountPercent: 0,
      itemName: '',
      UnitPrice: 0,
      UOM: '',
      UoMEntry: null,
    });
    setSelectedUom(null);
    setItemSearchTerm('');
  };


  const handleRemoveItem = (index) => {
    const updatedItems = selectedItems.filter((_, i) => i !== index);
    setSelectedItems(updatedItems);
    toast.info('Item removed from the quotation.');
  };



  const calculateTotalInvoiceAmount = () => {
    return selectedItems.reduce((total, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.UnitPrice) || 0;
      const discountAmount = parseFloat(item.discountAmount) || 0;
      const priceAfterDiscount = unitPrice - discountAmount;
      const lineTotal = quantity * priceAfterDiscount;
      return total + lineTotal;
    }, 0).toFixed(2);
  };


  const calculatePaidToDate = () => {
    return calculateTotalInvoiceAmount();
  };

  const handleCreateInvoice = async () => {
    if (!selectedCustomer || !docDate) {
      toast.error('Customer and Doc Date are required.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the quotation.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const sessionId = await getSessionId();
      if (sessionId) {
        const invoiceData = {
          CardCode: selectedCustomer,
          DocDate: docDate,
          DocDueDate: docDate, // Set DocDueDate to docDate
          Comments: comments,
          DocCurrency: 'IQD', // Specify the currency as IQD
          DocumentLines: selectedItems.map((item) => ({
            ItemCode: item.itemCode,//ok
            Quantity: parseFloat(item.quantity),//ok
            WarehouseCode: item.warehouseCode,//ok
            DiscountPercent: parseFloat(item.discountPercent),
            UnitPrice: parseFloat(item.UnitPrice) || 0,
            UoMEntry: parseInt(item.UoMEntry, 10), // Ensure it's an integer
          })),
        };
        

        const response = await axios.post('/api/createInvoice', { sessionId, quotationData:invoiceData });
        const createdInvoice = response.data;

        if (createdInvoice && createdInvoice.DocEntry) {
          toast.success('quotation created successfully!', {
            position: 'bottom-right',
            autoClose: 5000,
          });
          // Optional: Redirect to the created quotation page
          // router.push(`/sale-orders/${createdInvoice.DocEntry}`);
        } else {
          throw new Error('quotation creation failed: Missing DocEntry');
        }

        setSelectedItems([]);
        setComments('');
      }
    } catch (error) {
      console.error('Error creating quotation:', error);

      let errorMessage = 'Failed to create quotation: ';
      if (error.response) {
        if (error.response.data && typeof error.response.data === 'object') {
          const sapErrorMessage = error.response.data?.error?.error?.message?.value;
          if (sapErrorMessage) {
            errorMessage += sapErrorMessage;
          } else {
            errorMessage += JSON.stringify(error.response.data, null, 2);
          }
        } else {
          errorMessage += error.response.data || error.response.status;
        }
      } else if (error.request) {
        errorMessage += 'No response received from server';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }

      toast.error(errorMessage, {
        position: 'bottom-right',
        autoClose: false,
        closeOnClick: false,
        closeButton: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };


  const createIncomingPayment = async (invoiceDocEntry, totalAmount) => {
    try {
      const sessionId = await getSessionId();
      const paymentData = {
        CardCode: selectedCustomer,
        CashAccount: "1111000018",
        CashSum: totalAmount.toString(),
        PaymentInvoices: [
          {
            DocEntry: invoiceDocEntry,
            SumApplied: totalAmount,
          },
        ],
      };
      
      await axios.post('/api/incomingpayment', { sessionId, paymentData });
      toast.success('Incoming Payment created successfully!', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    } catch (error) {
      console.error('Error creating Incoming Payment:', error);
      toast.error('Failed to create Incoming Payment.', {
        position: 'bottom-right',
        autoClose: 5000,
      });
    }
  };

  const getSessionId = async () => {
    if (cachedSessionId) {
      return cachedSessionId;
    }
    cachedSessionId = await loginToSAP();
    return cachedSessionId;
  };

  const loginToSAP = async () => {
    try {
      const response = await axios.post('/api/login');
      return response.data.sessionId;
    } catch (error) {
      toast.error('Login to SAP failed');
    }
  };

  if (loadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <FaSpinner className="text-6xl text-black" />
        </motion.div>
      </div>
    );
  }

  if (!canCreateStorage) {
    return <NotAuth />;
  }

  const tableInputClasses =
    'border border-gray-300 rounded-md px-3 py-2 w-32 text-sm focus:ring-indigo-500 focus:border-indigo-500'; // Increased width from w-20 to w-32

  const inputClasses =
    'mt-1 block w-full py-3 px-4 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm';

  // Add a function to format number display
  const formatNumber = (value) => {
    if (value === 0 || value === '0' || value === '') return '';
    return value;
  };

  const handleItemSelect = (item) => {
    setCurrentItem({
      ...currentItem,
      itemCode: item.ItemCode,
      itemName: item.ItemName,
      UnitPrice: item.Price || '',
      UOM: item.UOM,
      warehouseCode: item.WhsCode || '', // Automatically assign warehouseCode
      quantity: '1', // Initialize as empty string instead of 0
      discountAmount: '', // Initialize as empty string instead of 0
      discountPercent: '', // Initialize as empty string instead of 0
    });
    setItemSearchTerm(item.ItemName);
    setItemSearchResults([]);
    setIsItemDropListOpen(false);
    fetchUomForItem(item.ItemCode, item.UOM, item.Price);

    if (selectedCustomer) {
      fetchDiscountForItem(selectedCustomer, item.ItemCode, item.UOM, parseFloat(item.Price));
    }
  };

  // Update the discount input handlers
  const handleDiscountAmountChange = (e) => {
    const discountAmount = e.target.value;
    const discountPercent = currentItem.UnitPrice
      ? parseFloat((discountAmount / currentItem.UnitPrice) * 100) || ''
      : '';
    setCurrentItem({
      ...currentItem,
      discountAmount: discountAmount === '0' ? '' : discountAmount,
      discountPercent,
    });
  };

  const handleDiscountPercentChange = (e) => {
    const discountPercent = e.target.value;
    const discountAmount = currentItem.UnitPrice
      ? parseFloat((discountPercent / 100) * currentItem.UnitPrice) || ''
      : '';
    setCurrentItem({
      ...currentItem,
      discountPercent: discountPercent === '0' ? '' : discountPercent,
      discountAmount,
    });
  };

  // Update the handleQuantityChange function
  const handleQuantityChange = (index, value) => {
    const updatedItems = [...selectedItems];
    // Only update if value is not empty or zero
    updatedItems[index].quantity = value === '0' ? '' : value;
    setSelectedItems(updatedItems);
  };
  
  const calculateItemTotalPrice = (item) => {
      const unitPriceAfterDiscount = item.UnitPrice - item.discountAmount;
      const totalPrice = item.quantity * unitPriceAfterDiscount;
      return totalPrice.toFixed(2);
    };
    
    const handleDiscountChange = (index, discountAmount, discountPercent) => {
      const updatedItems = [...selectedItems];
      updatedItems[index] = {
        ...updatedItems[index],
        discountAmount: discountAmount === 0 ? '' : discountAmount,
        discountPercent: discountPercent === 0 ? '' : discountPercent
      };
      setSelectedItems(updatedItems);
    };

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <CustomAwesomeButton
                buttonType="electric"
                onPress={handleReturn}
                className="text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <FaArrowLeft className="text-2xl" />
              </CustomAwesomeButton>
              <h1 className="text-3xl font-bold text-gray-800">
                Create quotation
              </h1>
            </div>

            <div className="space-y-8">
              {/* Search Type Radio Buttons */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mr-4">
                  Search by:
                </label>
                <label className="mr-4">
                  <input
                    type="radio"
                    name="searchType"
                    value="name"
                    checked={searchType === 'name'}
                    onChange={() => setSearchType('name')}
                    className="mr-2"
                  />
                  Item Name
                </label>
                <label className="mr-4">
                  <input
                    type="radio"
                    name="searchType"
                    value="code"
                    checked={searchType === 'code'}
                    onChange={() => setSearchType('code')}
                    className="mr-2"
                  />
                  Item Code
                </label>
                <label>
                  <input
                    type="radio"
                    name="searchType"
                    value="barcode"
                    checked={searchType === 'barcode'}
                    onChange={() => setSearchType('barcode')}
                    className="mr-2"
                  />
                  Barcode
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Customer Input */}
                <div className="space-y-2 relative">
                  <label
                    htmlFor="customer"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Customer *
                  </label>
                  <input
                    type="text"
                    id="customer"
                    value={customerSearchTerm}
                    onChange={(e) => {
                      setCustomerSearchTerm(e.target.value);
                      setSelectedCustomer('');
                      setSelectedCustomerName(''); // Reset selected customer name
                    }}
                    className={`${inputClasses} ${
                      !selectedCustomer && 'border-red-500'
                    }`}
                    placeholder="Search Customer"
                    required
                  />
                  {customerSearchResults.length > 0 && (
                    <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full">
                      {customerSearchResults.map((customer) => (
                        <li
                          key={customer.CardCode}
                          onClick={() => {
                            setSelectedCustomer(customer.CardCode);
                            setSelectedCustomerName(customer.CardName); // Set selected customer name
                            setCustomerSearchTerm(customer.CardName);
                            setCustomerSearchResults([]);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {customer.CardName}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Doc Date */}
                <div className="space-y-2">
                  <label
                    htmlFor="docDate"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Doc Date *
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaCalendarAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="docDate"
                      value={docDate}
                      onChange={(e) => setDocDate(e.target.value)}
                      className={`${inputClasses} pl-10`}
                      disabled // Disable if you don't want the user to change
                    />
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <label
                    htmlFor="comments"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Comments
                  </label>
                  <input
                    type="text"
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className={inputClasses}
                    placeholder="Add comments here"
                  />
                </div>
              </div>

              {/* Item Search and Add */}
              <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                  Add Item
                </h2>

                {/* Item Search Input */}
                <div className="relative mb-6" ref={itemInputRef}>
                  <label
                    htmlFor="item"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Item
                  </label>
                  <input
                    type="text"
                    id="item"
                    value={itemSearchTerm}
                    onChange={(e) => {
                      setItemSearchTerm(e.target.value);
                      setCurrentItem({ ...currentItem, itemCode: '' });
                    }}
                    className={`${inputClasses} w-full`}
                    placeholder="Search Item or Scan Barcode"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (itemSearchResults.length === 1) {
                          handleItemSelect(itemSearchResults[0]);
                        }
                      }
                    }}
                  />
                  {isItemDropListOpen && (
                    <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full shadow-lg">
                      {isItemLoading && (
                        <li className="flex justify-center items-center py-4">
                          <FaSpinner className="animate-spin text-gray-500" />
                        </li>
                      )}
                      {!isItemLoading && itemSearchResults.length === 0 && (
                        <li className="px-4 py-3 text-gray-500">
                          No items found
                        </li>
                      )}
                      {!isItemLoading &&
                        itemSearchResults.map((item) => (
                          <li
                            key={`${item.ItemCode}-${item.UOM}`}
                            onClick={() => handleItemSelect(item)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                          >
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                              <div>
                                <span className="font-semibold text-gray-800">
                                  {item.ItemName}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  ({item.ItemCode})
                                </span>
                              </div>
                              <div className="text-sm flex items-center flex-wrap mt-2 sm:mt-0">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                                  <FaBox className="w-4 h-4 mr-1" />
                                  <span className="font-medium">
                                    {item.OnHand}
                                  </span>
                                </span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                                  <FaWarehouse className="w-4 h-4 mr-1" />
                                  <span className="font-medium">
                                    {item.UOM}
                                  </span>
                                </span>
                                {/* Display the Warehouse Code */}
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                                  <FaWarehouse className="w-4 h-4 mr-1" />
                                  <span className="font-medium">
                                    {item.WhsCode}
                                  </span>
                                </span>
                                {/* Display the QTY if available */}
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                                  <FaWarehouse className="w-4 h-4 mr-1" />
                                  <span className="font-medium">
                                    {item.QTY}
                                  </span>
                                </span>
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                                  <FaDollarSign className="w-4 h-4 mr-1" />
                                  <span className="font-medium">
                                    {item.Price}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                {/* Warehouse Display (Read-Only) */}
                <div className="space-y-2">
                  <label
                    htmlFor="warehouse"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Warehouse
                  </label>
                  <div className="mt-1 block w-full py-3 px-4 rounded-md border border-gray-300 bg-gray-50">
                    {currentItem.warehouseCode || 'N/A'}
                  </div>
                </div>

                {/* Render Quantity Input after item selection */}
                {currentItem.itemCode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Quantity Input */}
                    <div>
                      <label
                        htmlFor="quantity"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Quantity
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        value={currentItem.quantity}
                        onChange={(e) =>
                          setCurrentItem({
                            ...currentItem,
                            quantity: e.target.value,
                          })
                        }
                        className={inputClasses}
                        placeholder="Quantity"
                      />
                    </div>

                    {/* UOM Dropdown */}
                    <div className="relative" ref={uomDropdownRef}>
                      <label
                        htmlFor="uom"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Unit of Measure
                      </label>
                      <button
                        type="button"
                        className={`${inputClasses} flex justify-between items-center`}
                        onClick={() => setIsUomDropdownOpen(!isUomDropdownOpen)}
                      >
                        {currentItem.UOM || 'Select UOM'}
                        <FaChevronDown className="ml-2" />
                      </button>
                      {isUomDropdownOpen && (
                        <ul className="absolute z-20 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full shadow-lg">
                          {uomOptions.map((uom, index) => (
                            <li
                              key={`${uom.UOM}-${uom.Price}-${index}`}
                              onClick={() => {
                                console.log('UOM selected from dropdown:', uom); // Log uom
                                handleUomSelect(uom);
                              }}
                              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 flex justify-between items-center"
                            >
                              <span className="font-medium">{uom.UOM}</span>
                              <span className="text-sm text-gray-500">
                                {uom.Price ? `${uom.Price} IQD` : 'Price Not Available'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700"
                      >
                        Unit Price
                      </label>
                      <div className={inputClasses}>
                        {currentItem.UnitPrice} IQD
                      </div>
                    </div>

                    {/* Discount Section */}
                    <div>
                      <label htmlFor="discountAmount" className="block text-sm font-medium text-gray-700 mb-4">
                        Discount
                      </label>
                      <div className="space-y-1">
                        {/* Discount Amount Input */}
                        <div className="relative w-full">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaDollarSign className="h-6 w-6 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="discountAmount"
                            value={currentItem.discountAmount}
                            onChange={(e) => {
                              const discountAmount = parseFloat(e.target.value) || 0;
                              const discountPercent = currentItem.UnitPrice
                                ? parseFloat((discountAmount / currentItem.UnitPrice) * 100)
                                : 0;
                              setCurrentItem({
                                ...currentItem,
                                discountAmount,
                                discountPercent,
                              });
                            }}
                            style={{ paddingRight: '4rem' }}
                            className="block w-full h-14 text-lg pl-12 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Discount Amount"
                            min="0"
                          />
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <span className="text-lg text-gray-500">IQD</span>
                          </div>
                        </div>

                        {/* Discount Percent Input */}
                        <div className="relative w-full">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                            <FaPercent className="h-6 w-6 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            id="discountPercent"
                            value={currentItem.discountPercent}
                            onChange={(e) => {
                              const discountPercent = parseFloat(e.target.value) || 0;
                              const discountAmount = currentItem.UnitPrice
                                ? parseFloat((discountPercent / 100) * currentItem.UnitPrice)
                                : 0;
                              setCurrentItem({
                                ...currentItem,
                                discountPercent,
                                discountAmount,
                              });
                            }}
                            style={{ paddingRight: '3rem' }}
                            className="block w-full h-14 text-lg pl-12 rounded-lg border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Discount Percent"
                            min="0"
                            max="100"
                          />
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <span className="text-lg text-gray-500">%</span>
                          </div>
                        </div>
                      </div>
                    </div>


                    {/* Add Item Button */}
                    <div className="flex items-end">
                      <CustomAwesomeButton
                        buttonType="info2"
                        onPress={handleAddItem}
                        className="w-full py-3 px-4 rounded-md"
                      >
                        <div className="flex flex-row">
                          <FaPlus className="mr-2 mt-1" />
                          <div>Add Item</div>
                        </div>
                      </CustomAwesomeButton>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Items Table */}
              <AnimatePresence>
                {selectedItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="mt-8"
                  >
{/* Order Items Table */}
<div className="mt-8">
  <h2 className="text-2xl font-bold mb-4">Order Items</h2>
  <div className="overflow-x-auto">
    <table className="w-full text-sm bg-white border rounded-lg">
      <thead>
        <tr className="bg-gray-200 text-gray-700">
          <th className="p-2 border">Code</th>
          <th className="p-2 border">Desc</th>
          <th className="p-2 border">Qty</th>
          <th className="p-2 border">UOM</th>
          <th className="p-2 border">WH</th>
          <th className="p-2 border">Price</th>
          <th className="p-2 border">Disc(IQD)</th>
          <th className="p-2 border">Disc(%)</th>
          <th className="p-2 border">Total</th>
          <th className="p-2 border"></th>
        </tr>
      </thead>
      <tbody>
        {selectedItems.map((item, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="p-2 border">{item.itemCode}</td>
            <td className="p-2 border truncate max-w-xs">{item.itemName}</td>
            <td className="p-2 border">
              <input
                type="number"
                value={item.quantity === 0 ? '' : item.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                className="w-12 p-1 border rounded"
                min="0"
                required
              />
            </td>
            <td className="p-2 border">{item.UOM || item.MeasureUnit || "N/A"}</td>
            <td className="p-2 border">{item.warehouseCode || "N/A"}</td>
            <td className="p-2 border text-right">{item.UnitPrice.toFixed(2)}</td>
            <td className="p-2 border">
              <input
                type="number"
                value={item.discountAmount === 0 ? '' : item.discountAmount}
                onChange={(e) => {
                  const discountAmount = parseFloat(e.target.value) || 0;
                  const discountPercent = item.UnitPrice
                    ? (discountAmount / item.UnitPrice) * 100
                    : 0;
                  handleDiscountChange(index, discountAmount, discountPercent);
                }}
                className="w-20 p-1 border rounded"
                min="0"
              />
            </td>
            <td className="p-2 border">
              <input
                type="number"
                value={item.discountPercent === 0 ? '' : item.discountPercent}
                onChange={(e) => {
                  const discountPercent = parseFloat(e.target.value) || 0;
                  const discountAmount = item.UnitPrice
                    ? (discountPercent / 100) * item.UnitPrice
                    : 0;
                  handleDiscountChange(index, discountAmount, discountPercent);
                }}
                className="w-16 p-1 border rounded"
                min="0"
                max="100"
              />
            </td>
            <td className="p-2 border text-right">{calculateItemTotalPrice(item)}</td>
            <td className="p-2 border text-center">
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-red-500 hover:text-red-700"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Total Invoice Amount */}
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-700">
                  Total quotation Amount: {calculateTotalInvoiceAmount()} IQD
                </h2>
              </div>

              {/* Create Invoice Button */}
              <div className="flex justify-center mt-8">
                <CustomAwesomeButton
                  buttonType="post"
                  onPress={handleCreateInvoice}
                  isDisabled={selectedItems.length === 0 || isLoading}
                  className={`
                    ${
                      selectedItems.length === 0 || isLoading
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }
                    text-white font-bold py-3 px-6 rounded-md transition duration-200 ease-in-out flex items-center justify-center
                  `}
                >
                  <div className="flex flex-row items-center">
                    {isLoading ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <FaPlus className="mr-2" />
                    )}
                    <div>{isLoading ? 'Creating...' : 'Create quotation'}</div>
                  </div>
                </CustomAwesomeButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReport;

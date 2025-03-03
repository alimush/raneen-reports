"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaSearch, FaPlus, FaTrash, FaArrowLeft, FaTimes } from "react-icons/fa";
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import { Audio, DNA, ColorRing} from 'react-loader-spinner';
import CustomAwesomeButton from '../components/CustomAwesomeButton';

const CreateOrder = () => {
  const { hasPermission: canCreateOrder, loading: loadingPermission } = usePermission('create_order');
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  const [form, setForm] = useState({ phone: '', name: '', items: [] });
  const [currentItem, setCurrentItem] = useState({ item: '', quantity: '', itemName: '', price: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [searchField, setSearchField] = useState(null);
  const [loadingCustomerSearch, setLoadingCustomerSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);


  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchActive(false);
    }
  };




  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchActive) {
      searchInputRef.current?.focus();
    }
  }, [isSearchActive]);

  const handleSearchFocus = () => {
    setIsSearchActive(true);
  };

  const handleSearchClose = () => {
    setSearchQuery('');
    setIsSearchActive(false);
  };

  const handleClickOutside = (e) => {
    if (searchInputRef.current && !searchInputRef.current.contains(e.target)) {
      setIsSearchActive(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'phone' || name === 'name') {
      setSearchField(name);
      handleCustomerSearch(value);
    }
  };

  const handleCurrentItemChange = (name, value) => {
    setCurrentItem({ ...currentItem, [name]: value });
  };
  


  const handleRemoveItem = (index) => {
    const items = [...form.items];
    items.splice(index, 1);
    setForm({ ...form, items });
    toast.info('Item removed from the order.');
  };

  const handleQuantityChange = (index, value) => {
    const items = [...form.items];
    items[index].quantity = value;
    setForm({ ...form, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) {
      toast.error('Please add at least one item to the order.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}Order/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      console.log(data)
      setSubmitting(false);
      if (res.ok) {
        toast.success('Order created successfully');
        router.push(`/OrderDetails/${data.order._id}`);
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      setSubmitting(false);
      console.error('Order creation error:', error);
      toast.error('Failed to create order');
    }
  };
  
    const handleSearch = useCallback(async (query) => {
      setSearchQuery(query);
      if (query) {
        setLoading(true);
        try {
          const res = await fetch(`${apiUrl}Item/items/search?query=${query}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          setLoading(false);
          if (res.ok) {
            setSearchResults(data.items);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error('Search error:', error);
          setLoading(false);
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }
    }, [apiUrl, token]);
  
    const handleSelectItem = useCallback((item) => {
      setCurrentItem({
        item: item._id,
        itemName: `${item.productId} - ${item.name} - ${item.supplier.name}`,
        price: item.price,
        quantity: '1', // Set a default quantity
        imageUrl: item.mainImageUrl
      });
      setSearchQuery('');
      setSearchResults([]);
      setIsSearchActive(false);
    }, []);
  
    const handleAddItem = useCallback(() => {
      if (!currentItem.item || !currentItem.quantity || !currentItem.itemName) {
        toast.error('Please fill in all item fields and quantities.');
        return;
      }
  
      if (parseInt(currentItem.quantity, 10) <= 0) {
        toast.error('Quantity must be greater than zero.');
        return;
      }
  
      setForm(prevForm => {
        const existingItemIndex = prevForm.items.findIndex(item => item.item === currentItem.item);
  
        if (existingItemIndex !== -1) {
          const updatedItems = [...prevForm.items];
          const existingItem = updatedItems[existingItemIndex];
          const newQuantity = parseInt(existingItem.quantity, 10) + parseInt(currentItem.quantity, 10);
          updatedItems[existingItemIndex] = { ...existingItem, quantity: newQuantity.toString() };
          toast.info(`Updated quantity of ${existingItem.itemName}. New quantity: ${newQuantity}`);
          return { ...prevForm, items: updatedItems };
        } else {
          toast.success(`Added ${currentItem.itemName} to the order.`);
          return { ...prevForm, items: [...prevForm.items, currentItem] };
        }
      });
  
      setCurrentItem({ item: '', quantity: '', itemName: '', price: '' });
    }, [currentItem]);
  


  

  const calculateTotalPrice = () => {
    return form.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCustomerSearch = async (query) => {
    setCustomerSearchQuery(query);
    if (query) {
      setLoadingCustomerSearch(true);
      try {
        const res = await fetch(`${apiUrl}CustomerUsersList/search-customers?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLoadingCustomerSearch(false);
        if (res.ok) {
          setCustomerSearchResults(data);
        } else {
          setCustomerSearchResults([]);
        }
      } catch (error) {
        console.error('Customer search error:', error);
        setLoadingCustomerSearch(false);
        setCustomerSearchResults([]);
      }
    } else {
      setCustomerSearchResults([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setForm({ ...form, phone: customer.phone, name: customer.name });
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setSearchField(null);
  };

  if (loadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!canCreateOrder) {
    return <NotAuth />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-100 to-blue-50 p-4 md:p-6 lg:p-8 text-black"
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create Order</h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-800 transition"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </motion.button>
          </div>
  
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Customer Phone</label>
              <div className="relative">
                <input
                  type="text"
                  name="phone"
                  placeholder="Customer Phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <AnimatePresence>
                  {searchField === 'phone' && customerSearchQuery && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 bg-white border rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto"
                    >
                      {loadingCustomerSearch ? (
                        <li className="flex justify-center items-center p-4">
                          <ColorRing
                            visible={true}
                            height="80"
                            width="80"
                            ariaLabel="color-ring-loading"
                            wrapperStyle={{}}
                            wrapperClass="color-ring-wrapper"
                            colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
                          />
                        </li>
                      ) : (
                        customerSearchResults.map((customer) => (
                          <li
                            key={customer._id}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            {customer.phone} - {customer.name}
                          </li>
                        ))
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Customer Name</label>
              <div className="relative">
                <input
                  type="text"
                  name="name"
                  placeholder="Customer Name"
                  value={form.name}
                  onChange={handleChange}
                  className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <AnimatePresence>
                  {searchField === 'name' && customerSearchQuery && (
                    <motion.ul
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-10 bg-white border rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto"
                    >
                      {loadingCustomerSearch ? (
                        <li className="flex justify-center items-center p-4">
                          <ColorRing
                            visible={true}
                            height="80"
                            width="80"
                            ariaLabel="color-ring-loading"
                            wrapperStyle={{}}
                            wrapperClass="color-ring-wrapper"
                            colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
                          />
                        </li>
                      ) : (
                        customerSearchResults.map((customer) => (
                          <li
                            key={customer._id}
                            className="p-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => handleSelectCustomer(customer)}
                          >
                            {customer.phone} - {customer.name}
                          </li>
                        ))
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
  
          {/* Item Search and Add */}
          <div className="space-y-4 mb-6">
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-gray-700">Search Items</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search Items"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchActive(true)}
                  className="block w-full pl-10 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <AnimatePresence>
                {isSearchActive && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed inset-0 z-50 bg-white bg-opacity-95 overflow-y-auto"
                  >
                    <div className="max-w-4xl mx-auto p-4">
                      <div className="mb-4">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search Items"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                          />
                          <button
                            onClick={() => setIsSearchActive(false)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                      </div>
                      {loading ? (
                        <div className="flex justify-center items-center h-64">
                          <ColorRing
                            visible={true}
                            height="80"
                            width="80"
                            ariaLabel="color-ring-loading"
                            wrapperStyle={{}}
                            wrapperClass="color-ring-wrapper"
                            colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
                          />
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="flex justify-center items-center h-64 text-gray-500">
                          {searchQuery ? "No results found" : "Start typing to search for items"}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {searchResults.map((itm) => (
                            <motion.div
                              key={itm._id}
                              className="flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition duration-200"
                              onClick={() => handleSelectItem(itm)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <div className="relative w-full aspect-square mb-2">
                                <Image
                                  src={itm.mainImageUrl || '/placeholder-image.jpg'}
                                  alt={itm.name}
                                  layout="fill"
                                  objectFit="cover"
                                  className="rounded-lg"
                                />
                              </div>
                              <p className="text-sm font-medium text-center line-clamp-2">{itm.productId} - {itm.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-1">{itm.supplier.name}</p>
                              <p className="text-sm font-bold mt-1">${itm.price.toFixed(2)}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                  className="p-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <CustomAwesomeButton
                  buttonType="info2"
                  onPress={handleAddItem}
                  type="button"
                >
                  <FaPlus className="mr-2" />
                  Add Item
                </CustomAwesomeButton>
              </div>
            </div>
          </div>
  
          {/* Order Items Table */}
          <AnimatePresence>
            {form.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mb-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Order Items</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left">Item</th>
                        <th className="py-2 px-4 text-left">Quantity</th>
                        <th className="py-2 px-4 text-left">Price</th>
                        <th className="py-2 px-4 text-left">Total</th>
                        <th className="py-2 px-4 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.items.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td className="py-2 px-4 border-b">{item.itemName}</td>
                          <td className="py-2 px-4 border-b">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2 px-4 border-b">{item.price}</td>
                          <td className="py-2 px-4 border-b">{(item.price * item.quantity).toFixed(2)}</td>
                          <td className="py-2 px-4 border-b">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center"
                            >
                              <FaTrash className="mr-1" />
                              Remove
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="py-2 px-4 border-t font-bold text-right" colSpan="3">Total Order Price:</td>
                        <td className="py-2 px-4 border-t font-bold">{calculateTotalPrice().toFixed(2)}</td>
                        <td className="py-2 px-4 border-t"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
  
          {/* Create Order Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mx-auto w-full items-center justify-center flex">
              <CustomAwesomeButton
                buttonType="post"
                isDisabled={submitting || form.items.length === 0}
                type="submit"
              >
                {submitting ? (
                  <ColorRing
                    visible={true}
                    height="80"
                    width="80"
                    ariaLabel="color-ring-loading"
                  wrapperStyle={{}}
                  wrapperClass="color-ring-wrapper"
                  colors={['#e15b64', '#f47e60', '#f8b26a', '#abbd81', '#849b87']}
                />
              ) : (
                <>
                  <FaPlus className="mr-2" />
                  Create Order
                </>
              )}
            </CustomAwesomeButton>
          </div>
        </form>
      </div>
    </div>
  </motion.div>
);
};

export default CreateOrder;


<style jsx global>{`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`}</style>
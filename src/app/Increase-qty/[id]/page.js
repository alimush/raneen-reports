"use client";
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaSpinner, FaSearch, FaPlus, FaMinus } from 'react-icons/fa';
import { usePermission } from '../../../../context/PermissionContext';
import NotAuth from "../../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import CustomAwesomeButton from '../../components/CustomAwesomeButton';

const Modal = ({ message, onClose, isError }) => (
  <Transition appear show={true} as={Fragment}>
    <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                className={`text-lg font-medium leading-6 ${isError ? 'text-red-600' : 'text-green-600'}`}
              >
                {isError ? 'Error' : 'Success'}
              </Dialog.Title>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </div>
    </Dialog>
  </Transition>
);

export default function SupplierItems() {
  const { hasPermission: canUpdateQty, loading: loadingPermission5 } = usePermission('Update_quantities');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id;

  const [totalPrice, setTotalPrice] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [dateAdded, setDateAdded] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState([]);
  const [storages, setStorages] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [quantity, setQuantity] = useState({});
  const [price, setPrice] = useState({});
  const [cost, setCost] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [buyInvoiceId, setBuyInvoiceId] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedPartition, setSelectedPartition] = useState('');
  const [partitions, setPartitions] = useState([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isError, setIsError] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsResponse, storagesResponse] = await Promise.all([
          axios.get(`${apiUrl}Item/items/increase/supplier/${supplierId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${apiUrl}Storage/list-storages`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        setItems(itemsResponse.data);
        setStorages(storagesResponse.data);
        toast.success("Data loaded successfully");
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supplierId, token]);

  const handleStorageChange = (e) => {
    const storageId = e.target.value;
    setSelectedStorage(storageId);

    const selectedStorageData = storages.find(storage => storage.storageId === storageId);
    if (selectedStorageData && selectedStorageData.partitions.length > 0) {
      setPartitions(selectedStorageData.partitions);
    } else {
      setPartitions([]);
      setSelectedPartition(''); // Clear the partition if storage has no partitions
    }
  };

  const handlePartitionChange = (e) => {
    setSelectedPartition(e.target.value);
  };

  const calculateTotals = (updatedItems, updatedQuantities, updatedPrices) => {
    const newTotalPrice = updatedItems.reduce((sum, item) => {
      const itemPrice = updatedPrices[item.productId] || item.price || 0;
      const itemQuantity = updatedQuantities[item.productId] || 1;
      return sum + (itemPrice * itemQuantity);
    }, 0);
  
    const newItemCount = updatedItems.length;
  
    setTotalPrice(newTotalPrice);
    setItemCount(newItemCount);
  };

  const handleQuantityChange = (productId, value) => {
    const newQuantity = value === '' ? '' : Math.max(1, parseInt(value) || 0);
    
    setQuantity(prevQuantities => {
      const newQuantities = { ...prevQuantities, [productId]: newQuantity };
      calculateTotals(selectedItems, newQuantities, price);
      return newQuantities;
    });
  };

  const handlePriceChange = (productId, value) => {
    const newPrice = value === '' ? '' : Math.max(0, parseFloat(value) || 0);
    
    setPrice(prevPrices => {
      const newPrices = { ...prevPrices, [productId]: newPrice };
      calculateTotals(selectedItems, quantity, newPrices);
      return newPrices;
    });
  };

  const handleAddItem = (item) => {
    if (!item || !item.productId) {
      console.error('Invalid item:', item);
      return;
    }
  
    setSelectedItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(i => i.productId === item.productId);
      
      if (existingItemIndex !== -1) {
        // Item already exists, increase quantity
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // Remove the existing item from its current position
        updatedItems.splice(existingItemIndex, 1);
        
        // Update the quantity
        const newQuantity = (quantity[item.productId] || 1) + 1;
        setQuantity(prev => ({ ...prev, [item.productId]: newQuantity }));
        
        // Add the updated item to the end of the list
        updatedItems.push({
          ...existingItem,
          itemNumber: existingItem.itemNumber // Keep the existing item number
        });
        
        calculateTotals(updatedItems, { ...quantity, [item.productId]: newQuantity }, price);
        
        toast.info(`Increased quantity of ${item.name}. New quantity: ${newQuantity}`);
        
        return updatedItems;
      } else {
        // New item, add to the end of the list
        const newItem = { ...item, itemNumber: prevItems.length + 1 };
        const updatedItems = [...prevItems, newItem];
        
        setQuantity(prev => ({ ...prev, [item.productId]: 1 }));
        calculateTotals(updatedItems, { ...quantity, [item.productId]: 1 }, price);
        
        toast.success(`${item.name} added to the list`);
        
        return updatedItems;
      }
    });
  
    setSearchTerm('');
    setIsDropdownVisible(false);
  };

  const handleRemoveItem = (productId) => {
    if (!productId) {
      console.error('Invalid productId:', productId);
      return;
    }
  
    setSelectedItems((prevItems) => {
      const updatedItems = prevItems.filter(item => item.productId !== productId);
      return updatedItems;
    });
  
    setQuantity((prevQuantities) => {
      const newQuantities = { ...prevQuantities };
      delete newQuantities[productId];
      return newQuantities;
    });
  
    setPrice((prevPrices) => {
      const newPrices = { ...prevPrices };
      delete newPrices[productId];
      return newPrices;
    });
  
    setCost((prevCosts) => {
      const newCosts = { ...prevCosts };
      delete newCosts[productId];
      return newCosts;
    });
  
    setTimeout(() => {
      setSelectedItems((currentItems) => {
        calculateTotals(currentItems, quantity, price);
        return currentItems;
      });
    }, 0);

    toast.info("Item removed from the list");
  };

  const handleCostChange = (productId, value) => {
    setCost((prevCosts) => ({ ...prevCosts, [productId]: value ? parseFloat(value) : '' }));
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item before saving.");
      return;
    }

    if (!buyInvoiceId || !selectedStorage) {
      toast.error("Buy Invoice ID and Storage Location are required");
      return;
    }

    setIsSaving(true);

    const updates = selectedItems.map(item => ({
      productId: item.productId,
      buyInvoiceId,
      quantity: quantity[item.productId] || 1,
      price: price[item.productId] || item.price,
      cost: cost[item.productId] || item.cost,
      storageId: selectedStorage,
      partitionId: selectedPartition || null, // Include partition ID if selected, otherwise null
      dateAdded: dateAdded || new Date().toISOString().split('T')[0],
      note: note || ''
    }));

    try {
      await axios.post(`${apiUrl}Item/update-quantities`, { updates }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setModalMessage("Quantities updated successfully");
      setIsError(false);
      setSelectedItems([]);
      setQuantity({});
      setPrice({});
      setCost({});
      setBuyInvoiceId('');
      setSelectedStorage('');
      setSelectedPartition('');
      setDateAdded('');
      setNote('');
      setTotalPrice(0)
      setItemCount(0)
      toast.success("Quantities updated successfully");
    } catch (error) {
      console.error("Error updating quantities:", error);
      setModalMessage("Error updating quantities");
      setIsError(true);
      toast.error("Error updating quantities");
    } finally {
      setIsSaving(false);
      setIsModalVisible(true);
    }
  };

  const handleReturn = () => {
    router.back();
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBlur = (e) => {
    if (!searchRef.current.contains(e.relatedTarget)) {
      setIsDropdownVisible(false);
    }
  };

  if (loadingPermission5) {
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

  if (!canUpdateQty) {
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
        <h1 className="text-3xl font-bold mb-6">Update Quantities</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative" ref={searchRef}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownVisible(true);
              }}
              onFocus={() => setIsDropdownVisible(true)}
              onBlur={handleBlur}
              placeholder="Search items"
              className="w-full p-2 pl-10 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {isDropdownVisible && (
              <ul className="absolute z-10 w-full mt-2 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                <AnimatePresence>
                  {filteredItems.map(item => (
                    <motion.li
                      key={item.productId || `temp-${item.name}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onMouseDown={() => handleAddItem(item)}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                    >
                      {item.name}
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
          <input
            type="text"
            value={buyInvoiceId}
            onChange={(e) => setBuyInvoiceId(e.target.value)}
            placeholder="Buy Invoice ID"
            className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <select
            value={selectedStorage}
            onChange={handleStorageChange}
            className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Storage</option>
            {storages.map(storage => (
              <option key={storage.storageId} value={storage.storageId}>
                {storage.storageName}
              </option>
            ))}
          </select>
          {partitions.length > 0 && (
            <select
              value={selectedPartition}
              onChange={handlePartitionChange}
              className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Partition (Optional)</option>
              {partitions.map(partition => (
                <option key={partition.partitionId} value={partition.partitionId}>
                  {partition.partitionName}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            value={dateAdded}
            onChange={(e) => setDateAdded(e.target.value)}
            className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Date Added"
          />
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note"
            className="w-full p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <h2 className="text-2xl font-bold p-4 bg-gray-50 border-b">Selected Items</h2>
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
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-4 text-left">Item Number</th>
                  <th className="py-2 px-4 text-left">Item Name</th>
                  <th className="py-2 px-4 text-left">Quantity</th>
                  <th className="py-2 px-4 text-left">Price</th>
                  <th className="py-2 px-4 text-left">Cost</th>
                  <th className="py-2 px-4 text-left">Total</th>
                  <th className="py-2 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {selectedItems.map(item => (
                    <motion.tr
                      key={item.productId}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-2 px-4">{item.itemNumber}</td>
                      <td className="py-2 px-4">{item.name}</td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          min="1"
                          value={quantity[item.productId] !== undefined ? quantity[item.productId] : 1}
                          onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={price[item.productId] !== undefined ? price[item.productId] : item.price || 0}
                          onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cost[item.productId] !== undefined ? cost[item.productId] : item.cost || 0}
                          onChange={(e) => handleCostChange(item.productId, e.target.value)}
                          className="w-full p-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-4">
                        {((quantity[item.productId] || 1) * (price[item.productId] || item.price || 0)).toFixed(2)} IQD
                      </td>
                      <td className="py-2 px-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemoveItem(item.productId)}
                          className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition"
                        >
                          <FaMinus />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-xl font-semibold mb-4">Invoice Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Total Items:</p>
            <p className="text-2xl font-bold">{itemCount}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Price:</p>
            <p className="text-2xl font-bold">{totalPrice.toFixed(2)} IQD</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: isSaving || selectedItems.length === 0 ? 1 : 1.05 }}
          whileTap={{ scale: isSaving || selectedItems.length === 0 ? 1 : 0.95 }}
          onClick={handleSubmit}
          className={`mt-6 w-full px-4 py-2 text-white rounded-full transition shadow-md ${
            isSaving || selectedItems.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isSaving || selectedItems.length === 0}
        >
          {isSaving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block"
            >
              <FaSpinner className="mr-2" />
            </motion.div>
          ) : (
            <FaPlus className="mr-2 inline" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </motion.button>
      </motion.div>

      {isModalVisible && (
        <Modal
          message={modalMessage}
          onClose={() => setIsModalVisible(false)}
          isError={isError}
        />
      )}
    </motion.div>
  );
}

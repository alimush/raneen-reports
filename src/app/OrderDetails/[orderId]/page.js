"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft, FaSpinner, FaSearch, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaUser, FaClock, FaBox, FaMoneyBillWave } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { usePermission } from '../../../../context/PermissionContext';
import NotAuth from "../../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../../components/CustomAwesomeButton';

const OrderDetails = () => {
  const { hasPermission: canViewOrders, loading: loadingPermission5 } = usePermission('Search_order');
  const { hasPermission: canCreateOrders, loading: loadingPermission } = usePermission('create_order');
  const { hasPermission: canCancelOrders, loading: loadingPermission2 } = usePermission('cancel_order_sales');
  const { hasPermission: canEditOrders, loading: loadingPermission3 } = usePermission('edit_order');
  const { hasPermission: canViewWorkflowOrders, loading: loadingPermission4 } = usePermission('view_order_workflow');
  const router = useRouter();
  const { orderId } = useParams();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [currentItem, setCurrentItem] = useState({ item: '', quantity: '', itemName: '', price: '' });
  const [newItems, setNewItems] = useState([]);
  const [itemsToRemove, setItemsToRemove] = useState([]);
  const workflowRef = useRef(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
console.log(activeOrder)


const fetchOrderDetails = async () => {
  try {
    const res = await fetch(`${apiUrl}Order/order/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (res.ok) {
      setActiveOrder(data.order);
    } else {
      console.error(`Error: ${data.message}`);
      setActiveOrder(null);
    }
  } catch (error) {
    console.error('Fetch order details error:', error);
    setActiveOrder(null);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  if (canViewOrders) {
    fetchOrderDetails();
  }
}, [orderId, canViewOrders]);

useEffect(() => {
  if (workflowRef.current && activeTab === "tab3") {
    workflowRef.current.scrollLeft = workflowRef.current.scrollWidth;
  }
}, [activeOrder, activeTab]);

  useEffect(() => {
    if (workflowRef.current && activeTab === "tab3") {
      workflowRef.current.scrollLeft = workflowRef.current.scrollWidth;
    }
  }, [activeOrder, activeTab]);

  const handleReturn = () => {
    router.push('/Order');
  };

  const calculateTotalPrice = () => {
    const totalFromNewItems = newItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const totalFromExistingItems = activeOrder.items.reduce((total, item) => total + item.item.price * item.quantity, 0);
    return (totalFromNewItems + totalFromExistingItems).toFixed(2);
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query) {
      setLoadingSearch(true);
      try {
        const res = await fetch(`${apiUrl}Item/items/search?query=${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setLoadingSearch(false);
        if (res.ok) {
          setSearchResults(data.items);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setLoadingSearch(false);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectItem = (itemId, productId, itemName, supplierName, price) => {
    setCurrentItem({
      item: itemId,
      itemid: productId,
      itemName: `${productId} - ${itemName} - ${supplierName}`,
      price: price,
      quantity: currentItem.quantity || ''
    });
    setSearchQuery(`${productId} - ${itemName} - ${supplierName}`);
    setSearchResults([]);
  };

  const handleAddItem = () => {
    if (!currentItem.item || !currentItem.quantity || !currentItem.itemName || !currentItem.price) {
      alert('Please fill in all item fields and quantities.');
      return;
    }
    setNewItems([...newItems, currentItem]);
    setCurrentItem({ item: '', quantity: '', itemName: '', price: '' });
  };

  const handleRemoveItem = (index, isNew) => {
    if (isNew) {
      setNewItems(newItems.filter((_, i) => i !== index));
    } else {
      const itemToRemove = activeOrder.items[index];
      setItemsToRemove([...itemsToRemove, itemToRemove.item]);
      const updatedOrder = { ...activeOrder, items: activeOrder.items.filter((_, i) => i !== index) };
      setActiveOrder(updatedOrder);
    }
  };

  // In the handleSaveChanges function
  const handleSaveChanges = async () => {
    setIsSaving(true); // Disable the button
    try {
      const res = await fetch(`${apiUrl}Order/edit-order/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addItems: newItems, removeItems: itemsToRemove })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveOrder(data.order);
        setNewItems([]);
        setItemsToRemove([]);
        setIsEditing(false);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Save changes error:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false); // Re-enable the button
    }
  };

  const handleActivateOrder = async () => {
    try {
      const res = await fetch(`${apiUrl}Order/activate-order/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        alert('Order activated successfully');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Activate order error:', error);
      alert('Failed to activate order');
    }
  };
  
  const handleCancelOrder = async () => {
    try {
      const res = await fetch(`${apiUrl}Order/cancel-order-sales/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        alert('Order cancelled successfully');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      alert('Failed to cancel order');
    }
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

  if (!canViewOrders) {
    return <NotAuth />;
  }

  const WorkflowDetailModal = ({ isOpen, onClose, workflow }) => {
    if (!isOpen || !workflow) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{workflow.action}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            
            <div className="flex items-center mx-auto">
              
              <div className=" flex flex-col ">
                <p className="font-semibold text-gray-700">التاريخ والوقت</p>
                <p className="text-gray-600">{new Date(workflow.date).toLocaleString()}</p>
              </div>
              <FaClock className="text-blue-500 ml-2" size={20} />
            </div>
            <div className="flex flex-col items-center">
              
              <div className="flex">
                <p className="text-gray-600"> {workflow.user.name}</p>
                
                <p className="font-semibold text-gray-700 ml-1 mr-1">:المستخدم</p>
                <FaUser className="text-blue-500 mr-2" size={20} />
              </div>
              <div className="flex">
                <p className="text-gray-600">{workflow.user.phone}</p>
                
                <p className="font-semibold text-gray-700 ml-1 mr-1">:رقم المستخدم</p>
                <FaPhone className="text-blue-500 mr-2" size={20} />
              </div>
            </div>
          </div>

          {workflow.details && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-xl text-center font-semibold mb-4 text-gray-800">تفاصيل العملية</h3>
              {workflow.details.items && workflow.details.items.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-2 text-gray-700 text-right">:العناصر</h4>
                  <ul className="space-y-2">
                    {workflow.details.items.map((item, index) => (
                      <li key={index} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                        <div className="flex items-center">
                          <FaBox className="text-blue-500 mr-2" size={16} />
                          <span className="font-medium text-gray-800">{item.item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600 ml-2">الكمية: {item.quantity}</span>
                          <span className="ml-2 text-gray-600">السعر: {item.price.toFixed(2)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {workflow.details.totalAmount && (
                <div className="flex flex-row-reverse items-center justify-between bg-blue-100 p-3 rounded-md">
                  <div className="flex items-center">
                    :
                    <FaMoneyBillWave className="text-green-500 mr-2 ml-2" size={20} />
                    <span className="font-semibold text-gray-800">المبلغ الإجمالي</span>
                    
                  </div>
                  <span className="text-xl font-bold text-green-600">{workflow.details.totalAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "tab1":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">Order Details</h2>
            {activeOrder ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white shadow rounded-lg lg:col-span-1"
                >
                  <h3 className="text-lg font-semibold mb-2">Order Information</h3>
                  <p className="text-gray-700"><strong>Order ID:</strong> {activeOrder.orderId}</p>
                  <p className="text-gray-700"><strong>Date:</strong> {new Date(activeOrder.createdAt).toLocaleString()}</p>
                  <div className="text-gray-700 flex flex-wrap items-start">
                    <strong className="pr-1">Status:</strong>
                    <span className="flex-shrink-0">{activeOrder.status}</span>
                    <div className="w-full mt-1">
                      <strong className="pr-1">level: </strong>
                      <span className="text-green-700 pl-1 pr-1 border-b-2 border-black font-bold">{activeOrder.workflowStatus}</span>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white shadow rounded-lg"
                >
                  <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                  <p className="text-gray-700"><strong>Name:</strong> {activeOrder.customer.name}</p>
                  <p className="text-gray-700"><strong>Phone:</strong> {activeOrder.customer.phone}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white shadow rounded-lg md:col-span-2"
                >
                  <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
                  <p className="text-gray-700"><strong>Total Amount:</strong> {calculateTotalPrice()}</p>
                </motion.div>
              </div>
            ) : (
              <p className="text-gray-700">Order not found</p>
            )}
          </motion.div>
        );
      case "tab2":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">Items</h2>
            {activeOrder ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left">Product ID</th>
                        <th className="py-2 px-4 text-left">Item Name</th>
                        <th className="py-2 px-4 text-left">Quantity</th>
                        <th className="py-2 px-4 text-left">Price</th>
                        <th className="py-2 px-4 text-left">Total Price</th>
                        {isEditing && <th className="py-2 px-4 text-left">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {activeOrder.items.map((item, index) => (
                          <motion.tr
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td className="py-2 px-4 border-b">{item.item.productId}</td>
                            <td className="py-2 px-4 border-b">{item.item.name}</td>
                            <td className="py-2 px-4 border-b">{item.quantity}</td>
                            <td className="py-2 px-4 border-b">{item.item.price.toFixed(2)}</td>
                            <td className="py-2 px-4 border-b">{(item.item.price * item.quantity).toFixed(2)}</td>
                            {isEditing && (
                              <td className="py-2 px-4 border-b">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  type="button"
                                  onClick={() => handleRemoveItem(index, false)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center"
                                >
                                  <FaTrash className="mr-1" />
                                  Remove
                                </motion.button>
                              </td>
                            )}
                          </motion.tr>
                        ))}
                        {newItems.map((item, index) => (
                          <motion.tr
                            key={`new-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td className="py-2 px-4 border-b">{item.itemid}</td>
                            <td className="py-2 px-4 border-b">{item.itemName}</td>
                            <td className="py-2 px-4 border-b">{item.quantity}</td>
                            <td className="py-2 px-4 border-b">{item.price.toFixed(2)}</td>
                            <td className="py-2 px-4 border-b">{(item.price * item.quantity).toFixed(2)}</td>
                            {isEditing && (
                              <td className="py-2 px-4 border-b">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  type="button"
                                  onClick={() => handleRemoveItem(index, true)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center"
                                >
                                  <FaTrash className="mr-1" />
                                  Remove
                                </motion.button>
                              </td>
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="py-2 px-4 border-t font-bold text-right" colSpan={isEditing ? 5 : 4}>Total Price:</td>
                        <td className="py-2 px-4 border-t font-bold">{calculateTotalPrice()}</td>
                        {isEditing && <td className="py-2 px-4 border-t"></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full mt-4 flex items-center justify-center"
                  >
                    <FaPlus className="mr-2" />
                    Add Items
                  </motion.button>
                )}
              </>
            ) : (
              <p className="text-gray-700">No items found</p>
            )}
          </motion.div>
        );
        case "tab3":
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">سير العمل</h2>
              {activeOrder?.actions && activeOrder.actions.length > 0 ? (
                <div className="flex overflow-x-scroll space-x-6 pb-4 whitespace-nowrap" ref={workflowRef}>
                  {activeOrder.actions.map((action, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="inline-flex items-center space-x-2"
                    >
                      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-100 to-blue-300 shadow-lg rounded-lg">
                        <div className="flex items-center mb-2">
                          <span className="bg-blue-600 text-white p-1 rounded-full">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <p className="text-lg font-semibold mr-2 text-blue-800">{action.action}</p>
                        </div>
                        <p className="text-gray-800"><strong>المستخدم:</strong> {action.user.name}</p>
                        <p className="text-gray-800"><strong>التاريخ:</strong> {new Date(action.date).toLocaleString()}</p>
                        <CustomAwesomeButton
 buttonType="info2"
 onPress={() => {
  setSelectedWorkflow(action);
  setShowWorkflowModal(true);
}}
>
عرض التفاصيل
</CustomAwesomeButton>
                      </div>
                      {index < activeOrder.actions.length - 1 && (
                        <div className="flex-shrink-0">
                          <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-700">لم يتم العثور على سير عمل</p>
              )}
            </motion.div>
          );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-100 to-blue-50 flex flex-col text-black"
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white p-4 md:p-6 rounded-b-3xl shadow-2xl min-h-screen">
        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-blue-200 rounded-full"></div>
              <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
        ) : activeOrder ? (
          <>
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
            <ul className="flex justify-center space-x-2 md:space-x-6 border-b-2 border-gray-200 pb-2 mb-6">
              {["Order Details", "Items", "Workflow"].map((tab, index) => (
                <motion.li
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`cursor-pointer py-2 px-4 md:px-6 rounded-t-lg transition ${
                    activeTab === `tab${index + 1}` ? "text-blue-600 bg-blue-100 border-b-4 border-blue-600" : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab(`tab${index + 1}`)}
                >
                  {tab}
                </motion.li>
              ))}
            </ul>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {renderContent()}
            </div>
          </>
        ) : (
          <p className="text-center text-gray-700 mt-4">Order not found</p>
        )}
      </div>

      {/* Bottom action buttons */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center"
      >
        {canCreateOrders && (
 <CustomAwesomeButton
 buttonType="post"
 isDisabled={activeOrder?.workflowStatus !== 'Sales' || activeOrder?.status === 'Cancelled'}
 onPress={handleActivateOrder}
>
{activeOrder?.status === 'Activated' ? 'Activated' : 'Activate'}
</CustomAwesomeButton>
                  //   <motion.button
                  //   whileHover={{ scale: 1.05 }}
                  //   whileTap={{ scale: 0.95 }}
                  //   onClick={handleActivateOrder}
                  //   className={`px-4 py-2 rounded-lg transition ${
                  //     activeOrder?.workflowStatus === 'Sales' && activeOrder?.status !== 'Cancelled'
                  //       ? 'bg-green-600 hover:bg-green-700 text-white'
                  //       : 'bg-gray-400 cursor-not-allowed'
                  //   }`}
                  //   disabled={activeOrder?.workflowStatus !== 'Sales' || activeOrder?.status === 'Cancelled'}
                  // >
                  //   {activeOrder?.status === 'Activated' ? 'Activated' : 'Activate'}
                  // </motion.button>

        )}
        {canCancelOrders && activeTab === "tab1" && (
          <CustomAwesomeButton
          buttonType="cancel"
          isDisabled={activeOrder?.workflowStatus !== 'Sales' || activeOrder?.status === 'Cancelled'}
          onPress={handleCancelOrder}
        >
          Cancel
        </CustomAwesomeButton>
        )}
        {canEditOrders && activeTab === "tab2" && (
          <CustomAwesomeButton
          buttonType="warning"
          isDisabled={activeOrder?.workflowStatus !== 'Sales' || activeOrder?.status === 'Cancelled'}
          onPress={() => {
            if (isEditing) {
              setNewItems([]);
            }
            setIsEditing(!isEditing);
          }}
        >
                      {isEditing ? 'Cancel' : 'Edit'}
                      </CustomAwesomeButton>
          // <motion.button
          //   whileHover={{ scale: 1.05 }}
          //   whileTap={{ scale: 0.95 }}
          //   onClick={() => {
          //     if (isEditing) {
          //       setNewItems([]);
          //     }
          //     setIsEditing(!isEditing);
          //   }}
          //   className={`px-4 py-2 rounded-lg transition ${
          //     activeOrder?.workflowStatus !== 'Sales' || activeOrder?.status === 'Cancelled'
          //       ? 'bg-gray-400 cursor-not-allowed'
          //       : isEditing
          //       ? 'bg-red-600 hover:bg-red-700 text-white'
          //       : 'bg-blue-600 hover:bg-blue-700 text-white'
          //   }`}
          //   disabled={activeOrder?.workflowStatus !== 'Sales' || activeOrder?.status === 'Cancelled'}
          // >
          //   {isEditing ? 'Cancel' : 'Edit'}
          // </motion.button>
        )}
        {isEditing && (
          <CustomAwesomeButton
          buttonType="warning"
          isDisabled={activeOrder?.workflowStatus !== 'Sales' || activeOrder?.status === 'Cancelled'}
          onPress={handleSaveChanges}
        >
            {isSaving ? 'Saving...' : 'Save Changes'}
                      </CustomAwesomeButton>
        )}
      </motion.div>

      {/* Modal for adding items */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold mb-4">Add Items</h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Items"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e);
                  }}
                  className="mt-1 p-3 pl-10 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {loadingSearch ? (
                <div className="flex justify-center items-center p-4">
                  <div className="relative w-10 h-10">
                    <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 right-0 bottom-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                </div>
              ) : (
                <ul className="max-h-48 overflow-y-auto mb-4">
                  {searchResults.map((itm) => (
                    <li
                      key={itm._id}
                      className="p-2 cursor-pointer hover:bg-gray-100 transition rounded"
                      onClick={() => handleSelectItem(itm._id, itm.productId, itm.name, itm.supplier.name, itm.price)}
                    >
                      {itm.productId} - {itm.name} - {itm.supplier.name}
                    </li>
                  ))}
                </ul>
              )}
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
                className="mt-1 p-3 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />
              <div className="flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleAddItem();
                    setShowModal(false);
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
      <WorkflowDetailModal
          isOpen={showWorkflowModal}
          onClose={() => setShowWorkflowModal(false)}
          workflow={selectedWorkflow}
        />
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderDetails;
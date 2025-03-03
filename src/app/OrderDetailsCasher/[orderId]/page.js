"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { FaArrowLeft, FaSpinner, FaSearch, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaUser, FaClock, FaBox, FaMoneyBillWave,  FaCheckCircle, FaTimesCircle  } from "react-icons/fa";
import { FaPhone } from "react-icons/fa6";
import { usePermission } from '../../../../context/PermissionContext';
import NotAuth from "../../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../../components/CustomAwesomeButton';

const OrderDetails = () => {
  const { hasPermission: canViewOrders, loading: loadingPermission5 } = usePermission('Search_order');
  const { hasPermission: canActivateOrders, loading: loadingPermission } = usePermission('activate_order_casher');
  const { hasPermission: canRejectOrders, loading: loadingPermission2 } = usePermission('reject_order_casher');
  const { hasPermission: canViewWorkflowOrders, loading: loadingPermission4 } = usePermission('view_order_workflow');
  const { hasPermission: canApproveRefund, loading: loadingPermission6 } = usePermission('approve_refund');
  const { hasPermission: canRejectRefund, loading: loadingPermission7 } = usePermission('reject_refund');
  const router = useRouter();
  const { orderId } = useParams();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("tab1");
  const [loading, setLoading] = useState(true);
  const workflowRef = useRef(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);

const handleOpenRefundModal = () => {
  setShowRefundModal(true);
};

  

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
        toast.success("Order details fetched successfully");
      } else {
        console.error(`Error: ${data.message}`);
        setActiveOrder(null);
        toast.error("Failed to fetch order details");
      }
    } catch (error) {
      console.error('Fetch order details error:', error);
      setActiveOrder(null);
      toast.error("An error occurred while fetching order details");
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

  const handleReturn = () => {
    router.push('/Ordercasher');
  };

  const calculateTotalPrice = () => {
    return activeOrder.items.reduce((total, item) => total + item.item.price * item.quantity, 0).toFixed(2);
  };

  const handleActivateOrder = async () => {
    try {
      const res = await fetch(`${apiUrl}Order/activate-order-casher/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        toast.success('Order activated successfully');
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Activate order error:', error);
      toast.error('Failed to activate order');
    }
  };
  
  const handleCancelOrder = async () => {
    try {
      const res = await fetch(`${apiUrl}Order/reject-order-casher/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        toast.success('Order rejected successfully');
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Reject order error:', error);
      toast.error('Failed to reject order');
    }
  };

  const handleApproveRefund = async () => {
    try {
      const res = await fetch(`${apiUrl}Order/approve-refund/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approve: true })
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        toast.success('Refund approved successfully');
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Approve refund error:', error);
      toast.error('Failed to approve refund');
    }
  };

  const handleRejectRefund = async () => {
    try {
      const res = await fetch(`${apiUrl}Order/approve-refund/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ approve: false })
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        toast.success('Refund rejected successfully');
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Reject refund error:', error);
      toast.error('Failed to reject refund');
    }
  };

  const RefundModal = ({ isOpen, onClose, order, onApprove, onReject }) => {
    if (!isOpen || !order) return null;
  
    // Find the most recent refund request action
    const refundAction = order.actions
      .filter(action => action.action === 'Refund Requested' || action.action === 'Partial Refund Requested')
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  
    if (!refundAction) {
      return null; // No refund request found
    }
  
    const refundItems = refundAction.details.items;
  
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
          className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes size={24} />
          </button>
  
          <h2 className="text-2xl font-bold mb-4 text-center">Refund Details</h2>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Items to Refund:</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Item Name</th>
                  <th className="border p-2 text-left">Quantity to Refund</th>
                  <th className="border p-2 text-left">Price</th>
                  <th className="border p-2 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {refundItems.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="border p-2">{item.item.name}</td>
                    <td className="border p-2">{item.quantity}</td>
                    <td className="border p-2">${item.price.toFixed(2)}</td>
                    <td className="border p-2">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100">
                  <td colSpan="3" className="border p-2 text-right font-bold">Total Refund Amount:</td>
                  <td className="border p-2 font-bold">
                    ${refundItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition shadow-md flex items-center"
            >
              <FaTimes className="mr-2" />
              Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onReject();
                onClose();
              }}
              className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md flex items-center"
            >
              <FaTimesCircle className="mr-2" />
              Reject Refund
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onApprove();
                onClose();
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition shadow-md flex items-center"
            >
              <FaCheckCircle className="mr-2" />
              Approve Refund
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loadingPermission5 || loadingPermission || loadingPermission2 || loadingPermission4) {
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
                    <span className={`flex-shrink-0 px-2 py-1 rounded-full ${
                      activeOrder.status === 'Activated' ? 'bg-green-100 text-green-800' :
                      activeOrder.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activeOrder.status}
                    </span>
                    <div className="w-full mt-1">
                      <strong className="pr-1">Level: </strong>
                      <span className="text-blue-700 pl-1 pr-1 border-b-2 border-blue-500 font-bold">{activeOrder.workflowStatus}</span>
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
                  <p className="text-gray-700"><strong>Total Amount:</strong> ${calculateTotalPrice()}</p>
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
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 text-left">Product ID</th>
                      <th className="py-2 px-4 text-left">Item Name</th>
                      <th className="py-2 px-4 text-left">Quantity</th>
                      <th className="py-2 px-4 text-left">Price</th>
                      <th className="py-2 px-4 text-left">Total Price</th>
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
                          <td className="py-2 px-4 border-b">${item.item.price.toFixed(2)}</td>
                          <td className="py-2 px-4 border-b">${(item.item.price * item.quantity).toFixed(2)}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="py-2 px-4 border-t font-bold text-right" colSpan={4}>Total Price:</td>
                      <td className="py-2 px-4 border-t font-bold">${calculateTotalPrice()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
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
 buttonType="info"
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <FaSpinner className="text-4xl text-blue-500" />
            </motion.div>
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
              {["Order Details", "Items", ...(canViewWorkflowOrders ? ["Workflow"] : [])].map((tab, index) => (
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
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-gray-700 mt-4"
          >
            Order not found
          </motion.p>
        )}
      </div>

      {/* Bottom action buttons */}
      {activeOrder && (activeOrder.workflowStatus === 'Casher' && activeOrder.status !== 'Cancelled') && (
        <motion.div
    initial={{ y: 100 }}
    animate={{ y: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center"
  >
    {activeOrder.workflowStatus === 'Casher' && activeOrder.status !== 'Cancelled' && (
      <>
        {canActivateOrders && (
           <CustomAwesomeButton
           buttonType="post"
           isDisabled={activeOrder.status === 'Posted'}
           onPress={handleActivateOrder}
          >
<FaCheckCircle className="mr-2" />
            {activeOrder.status === 'Activated' ? 'Posted' : activeOrder.status === 'Pending' ? 'Pending' : 'Post'}
          </CustomAwesomeButton>
          // <motion.button
          //   whileHover={{ scale: 1.05 }}
          //   whileTap={{ scale: 0.95 }}
          //   onClick={handleActivateOrder}
          //   className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition shadow-md flex items-center"
          //   disabled={activeOrder.status === 'Posted'}
          // >
          //   <FaCheckCircle className="mr-2" />
          //   {activeOrder.status === 'Activated' ? 'Posted' : activeOrder.status === 'Pending' ? 'Pending' : 'Post'}
          // </motion.button>
        )}
        {canRejectOrders && (
           <CustomAwesomeButton
           buttonType="cancel"
           onPress={handleCancelOrder}
          >
<FaTimesCircle className="mr-2" />
            Reject
          </CustomAwesomeButton>
          // <motion.button
          //   whileHover={{ scale: 1.05 }}
          //   whileTap={{ scale: 0.95 }}
          //   onClick={handleCancelOrder}
          //   className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md flex items-center"
          // >
          //   <FaTimesCircle className="mr-2" />
          //   Reject
          // </motion.button>
        )}
      </>
    )}
    {(activeOrder.status === 'Refund' || activeOrder.status === 'PartialRefund') && (canApproveRefund || canRejectRefund) && (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpenRefundModal}
        className="px-6 py-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition shadow-md flex items-center"
      >
        <FaMoneyBillWave className="mr-2" />
        Refund Details
      </motion.button>
    )}
  </motion.div>
      )}
            <AnimatePresence>
            <RefundModal
    isOpen={showRefundModal}
    onClose={() => setShowRefundModal(false)}
    order={activeOrder}
    onApprove={handleApproveRefund}
    onReject={handleRejectRefund}
  />
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

{/* Add this to your global styles or in a style tag */}
<style jsx global>{`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`}</style>
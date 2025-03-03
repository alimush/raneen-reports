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
  const { hasPermission: canActivateOrders, loading: loadingPermission } = usePermission('activate_order_mm');
  const { hasPermission: canRejectOrders, loading: loadingPermission2 } = usePermission('cancel_order_mm');
  const { hasPermission: canViewWorkflowOrders, loading: loadingPermission4 } = usePermission('view_order_workflow');
  const { hasPermission: canRequestRefund, loading: loadingPermission6 } = usePermission('request_refund');
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
  const [showModal2, setShowModal2] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [currentItem, setCurrentItem] = useState({ item: '', quantity: '', itemName: '', price: '' });
  const [newItems, setNewItems] = useState([]);
  const [itemsToRemove, setItemsToRemove] = useState([]);
  const [storageData, setStorageData] = useState([]);
  const [selectedStorages, setSelectedStorages] = useState({});
  const [quantityErrors, setQuantityErrors] = useState({});
  const [deliveryType, setDeliveryType] = useState('full');
  const [selectedItems, setSelectedItems] = useState({});
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
const [selectedWorkflow, setSelectedWorkflow] = useState(null);
const [showRefundModal, setShowRefundModal] = useState(false);
const [refundType, setRefundType] = useState('full');


  const workflowRef = useRef(null);

  const handleRefundRequest = async () => {
    try {
      const itemsToRefund = refundType === 'full'
        ? activeOrder.items
            .filter(item => item.deliveredQuantity > 0)
            .map(item => ({
              itemId: item.item._id,
              quantity: item.deliveredQuantity
            }))
        : Object.entries(selectedItems)
            .filter(([_, quantity]) => quantity > 0)
            .map(([itemId, quantity]) => ({
              itemId,
              quantity: Number(quantity)
            }));
  
      if (itemsToRefund.length === 0) {
        toast.error('الرجاء تحديد عنصر واحد على الأقل لطلب استرداد المبلغ.');
        return;
      }
  
      const res = await fetch(`${apiUrl}Order/request-refund/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          items: itemsToRefund,
          type: refundType,
          reason: "طلب استرداد من قبل العميل" // You might want to add a field for the user to input this
        })
      });
  
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        toast.success(`تم تقديم طلب استرداد المبلغ ${refundType === 'full' ? 'الكامل' : 'الجزئي'} بنجاح`);
        setShowRefundModal(false);
        setSelectedItems({});
      } else {
        toast.error(`خطأ: ${data.message}`);
      }
    } catch (error) {
      console.error('Refund request error:', error);
      toast.error('فشل طلب استرداد المبلغ');
    }
  };

  const handleRefundTypeChange = (type) => {
    setRefundType(type);
    if (type === 'full') {
      initializeFullRefundQuantities();
    } else {
      setSelectedItems({});
    }
  };
  
  const initializeFullRefundQuantities = () => {
    const fullQuantities = {};
    activeOrder.items.forEach(item => {
      if (item.deliveredQuantity > 0) {
        fullQuantities[item.item._id] = item.deliveredQuantity;
      }
    });
    setSelectedItems(fullQuantities);
  };
  
  const handleRefundItemSelection = (itemId, quantity) => {
    const item = activeOrder.items.find(i => i.item._id === itemId);
    const numQuantity = Number(quantity);
  
    if (item.deliveredQuantity === 0) {
      return; // Do nothing if there's no delivered quantity
    }
  
    if (numQuantity > item.deliveredQuantity) {
      toast.error(`الكمية المحددة لـ ${item.item.name} تتجاوز الكمية المسلمة. الكمية المسلمة هي ${item.deliveredQuantity}.`);
      return;
    }
  
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: numQuantity
    }));
  };

  const fetchStorageQuantities = async (items) => {
    try {
      const res = await fetch(`${apiUrl}Item/items/storage-quantities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (res.ok) {
        setStorageData(data);
        setShowModal(true);
      } else {
        console.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Fetch storage quantities error:', error);
    }
  };

  const fetchStorageQuantities2 = async (items) => {
    try {
      const res = await fetch(`${apiUrl}Item/items/storage-quantities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items })
      });
      const data = await res.json();
      if (res.ok) {
        setStorageData(data); // Ensure the storageData state is set
        setShowModal2(true);   // Show the correct modal
      } else {
        console.error(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Fetch storage quantities error:', error);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${apiUrl}Order/order/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      console.log(data)
      if (res.ok) {
        const updatedOrder = {
          ...data.order,
          items: data.order.items.map(item => ({
            ...item,
            remainingQuantity: Math.max(0, item.quantity - (item.deliveredQuantity || 0) - (item.cancelledQuantity || 0))
          }))
        };
        setActiveOrder(updatedOrder);
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

  const handleReturn = () => {
    router.push('/OrderMm');
  };

  const handleDeliverClick = () => {
    const items = activeOrder.items.map(item => item.item._id);
    fetchStorageQuantities(items);
    if (deliveryType === 'full') {
      initializeFullDeliveryQuantities();
    }
  };
  
  const handleCancelClick = () => {
    const items = activeOrder.items.map(item => item.item._id);
    fetchStorageQuantities2(items);
    if (deliveryType === 'full') {
      initializeFullDeliveryQuantities();
    }
  };
  
  const initializeFullDeliveryQuantities = () => {
    const fullQuantities = {};
    activeOrder.items.forEach(item => {
      if (item.remainingQuantity > 0) {
        fullQuantities[item.item._id] = item.remainingQuantity;
      }
    });
    setSelectedItems(fullQuantities);
  };
  
  const handleDeliveryTypeChange = (type) => {
    setDeliveryType(type);
    if (type === 'full') {
      initializeFullDeliveryQuantities();
    } else {
      setSelectedItems({});
    }
  };
  

  const handleStorageSelection = (itemId, storageId, partitionId) => {
    const selectedStorage = storageData
      .find(item => item.itemId === itemId)
      .storageQuantities.find(sq => sq.storageId === storageId && (sq.partitionId === partitionId || (!sq.partitionId && !partitionId)));
    
    const orderItem = activeOrder.items.find(oi => oi.item._id === itemId);
    
    if (selectedStorage && orderItem) {
      if (selectedStorage.quantity < orderItem.remainingQuantity) {
        alert(`تحذير: الكمية غير كافية للعنصر ${orderItem.item.name}. المتاح: ${selectedStorage.quantity}, المطلوب: ${orderItem.remainingQuantity}`);
      }
    }
  
    setSelectedStorages(prev => ({
      ...prev,
      [itemId]: { storageId, partitionId: partitionId || null }
    }));
  };
  

  const calculateTotalPrice = () => {
    const totalFromNewItems = newItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const totalFromExistingItems = activeOrder.items.reduce((total, item) => total + item.item.price * item.quantity, 0);
    return (totalFromNewItems + totalFromExistingItems).toFixed(2);
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


  
  const handleItemSelection = (itemId, quantity) => {
    const item = activeOrder.items.find(i => i.item._id === itemId);
    const numQuantity = Number(quantity);
    
    if (item.remainingQuantity === 0) {
      return; // Do nothing if there's no remaining quantity
    }
    
    if (numQuantity > item.remainingQuantity) {
      alert(`الكمية المحددة لـ ${item.item.name} تتجاوز الكمية المتبقية. الكمية المتبقية هي ${item.remainingQuantity}.`);
      return;
    }
  
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: numQuantity
    }));
  };

  const handleActivateOrder = async () => {
    const itemsToProcess = deliveryType === 'full'
      ? activeOrder.items
          .filter(item => item.remainingQuantity > 0)
          .map(item => ({
            itemId: item.item._id,
            quantity: item.remainingQuantity
          }))
      : Object.entries(selectedItems)
          .filter(([_, quantity]) => quantity > 0)
          .map(([itemId, quantity]) => ({
            itemId,
            quantity: Number(quantity)
          }));

    if (itemsToProcess.length === 0) {
      toast.error('الرجاء تحديد عنصر واحد على الأقل للمعالجة.');
      return;
    }

    // Check storage selections only for items being processed
    for (const item of itemsToProcess) {
      if (!selectedStorages[item.itemId]) {
        const orderItem = activeOrder.items.find(oi => oi.item._id === item.itemId);
        toast.error(`الرجاء تحديد المخزن والقسم للعنصر: ${orderItem.item.name}`);
        return;
      }
    }

    // Validate quantities
    for (const item of itemsToProcess) {
      const orderItem = activeOrder.items.find(oi => oi.item._id === item.itemId);
      if (!orderItem) {
        toast.error(`عنصر غير موجود: ${item.itemId}`);
        return;
      }

      if (item.quantity > orderItem.remainingQuantity) {
        toast.error(`الكمية المحددة لـ ${orderItem.item.name} تتجاوز الكمية المتبقية. الكمية المتبقية هي ${orderItem.remainingQuantity}.`);
        return;
      }
    }

    try {
      const res = await fetch(`${apiUrl}Order/activate-order-mm/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          storageSelections: selectedStorages,
          items: itemsToProcess,
          type: deliveryType
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        toast.success(`تمت معالجة الطلب ${deliveryType === 'full' ? 'بالكامل' : 'جزئيًا'} بنجاح`);
        setShowModal(false);
        setSelectedStorages({});
        setSelectedItems({});
      } else {
        toast.error(`خطأ: ${data.message}`);
      }
    } catch (error) {
      console.error('Process order error:', error);
      toast.error('فشلت معالجة الطلب');
    }
  };

  const handleCancelOrder = async () => {
    const itemsToProcess = deliveryType === 'full'
      ? activeOrder.items
          .filter(item => item.remainingQuantity > 0)
          .map(item => ({
            itemId: item.item._id,
            quantity: item.remainingQuantity,
            storageId: selectedStorages[item.item._id]?.storageId,
            partitionId: selectedStorages[item.item._id]?.partitionId
          }))
      : Object.entries(selectedItems)
          .filter(([_, quantity]) => quantity > 0)
          .map(([itemId, quantity]) => ({
            itemId,
            quantity: Number(quantity),
            storageId: selectedStorages[itemId]?.storageId,
            partitionId: selectedStorages[itemId]?.partitionId
          }));

    if (itemsToProcess.length === 0) {
      toast.error('الرجاء تحديد عنصر واحد على الأقل للإلغاء.');
      return;
    }

    // Check storage selections only for items being processed
    for (const item of itemsToProcess) {
      if (!selectedStorages[item.itemId]) {
        const orderItem = activeOrder.items.find(oi => oi.item._id === item.itemId);
        toast.error(`الرجاء تحديد المخزن والقسم للعنصر: ${orderItem.item.name}`);
        return;
      }
    }

    // Validate quantities
    for (const item of itemsToProcess) {
      const orderItem = activeOrder.items.find(oi => oi.item._id === item.itemId);
      if (!orderItem) {
        toast.error(`عنصر غير موجود: ${item.itemId}`);
        return;
      }

      if (item.quantity > orderItem.remainingQuantity) {
        toast.error(`الكمية المحددة لـ ${orderItem.item.name} تتجاوز الكمية المتبقية. الكمية المتبقية هي ${orderItem.remainingQuantity}.`);
        return;
      }
    }

    try {
      const res = await fetch(`${apiUrl}Order/cancel-order-mm/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          items: itemsToProcess,
          type: deliveryType
        })
      });
      const data = await res.json();
      if (res.ok) {
        fetchOrderDetails();
        toast.success(`تم ${deliveryType === 'full' ? 'إلغاء' : 'إلغاء جزء من'} الطلب بنجاح`);
        setShowModal2(false);
        setSelectedStorages({});
        setSelectedItems({});
      } else {
        toast.error(`خطأ: ${data.message}`);
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      toast.error('فشل إلغاء الطلب');
    }
  };
  

  const handleConfirmCancel = async () => {
    await handleCancelOrder();
  };

  if (loadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canViewOrders) {
    return (
      <NotAuth />
    );
  }

  const renderItemsTable = () => (
    <table className="min-w-full bg-white border">
      <thead>
        <tr>
          <th className="py-2 px-4 border-b text-right">رقم المنتج</th>
          <th className="py-2 px-4 border-b text-right">اسم العنصر</th>
          <th className="py-2 px-4 border-b text-right">الكمية الكلية</th>
          <th className="py-2 px-4 border-b text-right">الكمية المسلمة</th>
          <th className="py-2 px-4 border-b text-right">الكمية الملغاة</th>
          <th className="py-2 px-4 border-b text-right">الكمية المتبقية</th>
          <th className="py-2 px-4 border-b text-right">الكمية للمعالجة</th>
        </tr>
      </thead>
      <tbody>
        {activeOrder.items.map((item, index) => (
          <tr key={index}>
            <td className="py-2 px-4 border-b text-right">{item.item.productId}</td>
            <td className="py-2 px-4 border-b text-right">{item.item.name}</td>
            <td className="py-2 px-4 border-b text-right">{item.quantity}</td>
            <td className="py-2 px-4 border-b text-right">{item.deliveredQuantity || 0}</td>
            <td className="py-2 px-4 border-b text-right">{item.cancelledQuantity || 0}</td>
            <td className="py-2 px-4 border-b text-right">{item.remainingQuantity}</td>
            <td className="py-2 px-4 border-b text-right">
              <input
                type="number"
                min="0"
                max={item.remainingQuantity}
                value={selectedItems[item.item._id] || ''}
                onChange={(e) => handleItemSelection(item.item._id, e.target.value)}
                className="w-full p-2 border rounded text-right"
                disabled={deliveryType === 'full' || item.remainingQuantity === 0}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderModal = (isDelivery) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-3/4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isDelivery ? 'تسليم الطلب' : 'إلغاء الطلب'}
        </h2>
        
        <div className="mb-6 flex justify-center">
          <label className="inline-flex items-center mr-6">
            <input
              type="radio"
              value="full"
              checked={deliveryType === 'full'}
              onChange={() => handleDeliveryTypeChange('full')}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <span className="mr-2 text-lg">{isDelivery ? 'تسليم كامل' : 'إلغاء كامل'}</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="partial"
              checked={deliveryType === 'partial'}
              onChange={() => handleDeliveryTypeChange('partial')}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <span className="mr-2 text-lg">{isDelivery ? 'تسليم جزئي' : 'إلغاء جزئي'}</span>
          </label>
        </div>
        
        <div className="mb-6">
          <table className="w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-right">اسم العنصر</th>
                <th className="py-2 px-4 border-b text-right">الكمية المتبقية</th>
                <th className="py-2 px-4 border-b text-right">الكمية للمعالجة</th>
                <th className="py-2 px-4 border-b text-right">المخزن والقسم</th>
              </tr>
            </thead>
            <tbody>
              {activeOrder.items
                .filter(item => item.remainingQuantity > 0) // Exclude fully delivered or fully canceled items
                .filter(item => 
                  (isDelivery && item.remainingQuantity > 0 && item.deliveredQuantity < item.quantity) ||
                  (!isDelivery && item.remainingQuantity > 0 && item.cancelledQuantity < item.quantity)
                )
                .map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4 border-b text-right">{item.item.name}</td>
                    <td className="py-2 px-4 border-b text-right">{item.remainingQuantity}</td>
                    <td className="py-2 px-4 border-b text-right">
                      <input
                        type="number"
                        min="0"
                        max={item.remainingQuantity}
                        value={selectedItems[item.item._id] || ''}
                        onChange={(e) => handleItemSelection(item.item._id, e.target.value)}
                        className="w-full p-2 border rounded text-right"
                        disabled={deliveryType === 'full'}
                      />
                    </td>
                    <td className="py-2 px-4 border-b text-right">
                      <select
                        className="w-full p-2 border rounded"
                        onChange={(e) => {
                          const [storageId, partitionId] = e.target.value.split('|');
                          handleStorageSelection(item.item._id, storageId, partitionId || null);
                        }}
                        value={selectedStorages[item.item._id] ? `${selectedStorages[item.item._id].storageId}|${selectedStorages[item.item._id].partitionId || ""}` : ""}
                      >
                        <option value="" disabled>اختر المخزن والقسم</option>
                        {storageData
                          .find(sd => sd.itemId === item.item._id)?.storageQuantities
                          .filter((storage, index, self) =>
                            storage.partitionId || self.findIndex(s => s.storageId === storage.storageId && !s.partitionId) === index
                          )
                          .map(storage => (
                            <option
                              key={storage.partitionId ? `${storage.storageId}-${storage.partitionId}` : storage.storageId}
                              value={`${storage.storageId}|${storage.partitionId || ''}`}
                            >
                              {storage.storageName} {storage.partitionId ? `- ${storage.partitionName}` : ''} ({storage.quantity})
                            </option>
                          ))
                        }
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => isDelivery ? setShowModal(false) : setShowModal2(false)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={isDelivery ? handleActivateOrder : handleCancelOrder}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );

  const RefundRequestModal = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-3/4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">طلب استرداد المبلغ</h2>
  
        <div className="mb-6 flex justify-center">
          <label className="inline-flex items-center mr-6">
            <input
              type="radio"
              value="full"
              checked={refundType === 'full'}
              onChange={() => handleRefundTypeChange('full')}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <span className="mr-2 text-lg">استرداد كامل</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              value="partial"
              checked={refundType === 'partial'}
              onChange={() => handleRefundTypeChange('partial')}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <span className="mr-2 text-lg">استرداد جزئي</span>
          </label>
        </div>
  
        <div className="mb-6">
          <table className="w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-right">اسم العنصر</th>
                <th className="py-2 px-4 border-b text-right">الكمية المسلمة</th>
                <th className="py-2 px-4 border-b text-right">الكمية للاسترداد</th>
              </tr>
            </thead>
            <tbody>
              {activeOrder.items
                .filter(item => item.deliveredQuantity > 0)
                .map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4 border-b text-right">{item.item.name}</td>
                    <td className="py-2 px-4 border-b text-right">{item.deliveredQuantity}</td>
                    <td className="py-2 px-4 border-b text-right">
                      <input
                        type="number"
                        min="0"
                        max={item.deliveredQuantity}
                        value={selectedItems[item.item._id] || ''}
                        onChange={(e) => handleRefundItemSelection(item.item._id, e.target.value)}
                        className="w-full p-2 border rounded text-right"
                        disabled={refundType === 'full'}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
  
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setShowRefundModal(false)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleRefundRequest}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            تأكيد طلب الاسترداد
          </button>
        </div>
      </div>
    </div>
  );

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
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">تفاصيل الطلب</h2>
            {activeOrder ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white shadow rounded-lg lg:col-span-1"
                >
                  <h3 className="text-lg font-semibold mb-2">معلومات الطلب</h3>
                  <p className="text-gray-700"><strong>رقم الطلب:</strong> {activeOrder.orderId}</p>
                  <p className="text-gray-700"><strong>التاريخ:</strong> {new Date(activeOrder.createdAt).toLocaleString()}</p>
                  <div className="text-gray-700 flex flex-wrap items-start">
                    <strong className="pl-1">الحالة:</strong>
                    <span className="flex-shrink-0">{activeOrder.status}</span>
                    <div className="w-full mt-1">
                      <strong className="pl-1">المستوى: </strong>
                      <span className="text-green-700 pr-1 pl-1 border-b-2 border-black font-bold">{activeOrder.workflowStatus}</span>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white shadow rounded-lg"
                >
                  <h3 className="text-lg font-semibold mb-2">معلومات العميل</h3>
                  <p className="text-gray-700"><strong>الاسم:</strong> {activeOrder.customer.name}</p>
                  <p className="text-gray-700"><strong>الهاتف:</strong> {activeOrder.customer.phone}</p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-4 bg-white shadow rounded-lg md:col-span-2"
                >
                  <h3 className="text-lg font-semibold mb-2">معلومات الدفع</h3>
                  <p className="text-gray-700"><strong>المبلغ الإجمالي:</strong> {calculateTotalPrice()}</p>
                </motion.div>
              </div>
            ) : (
              <p className="text-gray-700">لم يتم العثور على الطلب</p>
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
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">العناصر</h2>
            {activeOrder ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                      <th className="py-2 px-4 border-b text-right">رقم المنتج</th>
                  <th className="py-2 px-4 border-b text-right">اسم العنصر</th>
                  <th className="py-2 px-4 border-b text-right">الكمية الكلية</th>
                  <th className="py-2 px-4 border-b text-right">الكمية المسلمة</th>
                  <th className="py-2 px-4 border-b text-right">الكمية الملغاة</th>
                  <th className="py-2 px-4 border-b text-right">الكمية المتبقية</th>
                  <th className="py-2 px-4 border-b text-right">السعر</th>
                  <th className="py-2 px-4 border-b text-right">السعر الإجمالي</th>
                  {isEditing && <th className="py-2 px-4 border-b text-right">الإجراءات</th>}
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
                             <td className="py-2 px-4 border-b text-right">{item.item.productId}</td>
                    <td className="py-2 px-4 border-b text-right">{item.item.name}</td>
                    <td className="py-2 px-4 border-b text-right">{item.quantity}</td>
                    <td className="py-2 px-4 border-b text-right">{item.deliveredQuantity || 0}</td>
                    <td className="py-2 px-4 border-b text-right">{item.cancelledQuantity || 0}</td>
                    <td className="py-2 px-4 border-b text-right">{item.remainingQuantity}</td>
                    <td className="py-2 px-4 border-b text-right">{item.item.price.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b text-right">{(item.item.price * item.quantity).toFixed(2)}</td>
                            {isEditing && (
                              <td className="py-2 px-4 border-b">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleRemoveItem(index, false)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center"
                                >
                                  <FaTrash className="ml-1" />
                                  إزالة
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
                                  onClick={() => handleRemoveItem(index, true)}
                                  className="px-3 py-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center"
                                >
                                  <FaTrash className="ml-1" />
                                  إزالة
                                </motion.button>
                              </td>
                            )}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td className="py-2 px-4 border-t font-bold text-left" colSpan={isEditing ? 5 : 4}>السعر الإجمالي:</td>
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
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition w-full mt-4 flex items-center justify-center"
                  >
                    <FaPlus className="ml-2" />
                    إضافة عناصر
                  </motion.button>
                )}
              </>
            ) : (
              <p className="text-gray-700">لم يتم العثور على عناصر</p>
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
              {["تفاصيل الطلب", "العناصر", "سير العمل"].map((tab, index) => (
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
          <p className="text-center text-gray-700 mt-4">لم يتم العثور على الطلب</p>
        )}
      </div>

      {/* Bottom action buttons */}
      <motion.div
  initial={{ y: 100 }}
  animate={{ y: 0 }}
  transition={{ duration: 0.5 }}
  className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center"
>
 <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center">
 {canActivateOrders && (
   <CustomAwesomeButton
   buttonType="post"
   isDisabled={activeOrder?.workflowStatus !== 'MaterialManagement' || activeOrder?.status === 'Cancelled'}
   onPress={handleDeliverClick}
  >
{ 
  activeOrder?.status === 'Posted' 
    ? 'تسليم' 
    : activeOrder?.status === 'PartiallyDelivered' 
      ? 'سلم جزئي' 
      : activeOrder?.status === 'PartiallyCancelled'
      ? 'سلم جزئي' 
      : 'سلم بالكامل' 
}
  </CustomAwesomeButton>
              )}

{canRequestRefund && (
     <CustomAwesomeButton
     buttonType="post"
     isDisabled={activeOrder?.status !== 'Completed' && activeOrder?.status !== 'PartiallyDelivered'}
     onPress={() => setShowRefundModal(true)}
    >
      طلب استرداد
    </CustomAwesomeButton>
  )}
               {canRejectOrders && (
                     <CustomAwesomeButton
                     buttonType="cancel"
                     isDisabled={activeOrder?.workflowStatus !== 'MaterialManagement' || activeOrder?.status === 'Cancelled'}
                     onPress={handleCancelClick}
                    >
                      { 
  activeOrder?.status === 'Posted' 
    ? 'الغاء' 
      : activeOrder?.status === 'PartiallyCancelled'
      ? 'ملغي جزئي' 
      : 'الغاء' 
}
                    </CustomAwesomeButton>
   
              )}


            </div>


      </motion.div>

      <AnimatePresence>
      {showModal && renderModal(true)}
      {showModal2 && renderModal(false)}
      {showRefundModal && <RefundRequestModal />}
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

"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaArrowLeft, FaSpinner, FaPlus, FaBox } from "react-icons/fa";
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../components/CustomAwesomeButton';

const boxTypes = [
  { value: 'cash', label: 'صندوق نقدي' },
  { value: 'bank', label: 'حساب بنكي' },
  { value: 'petty_cash', label: 'صندوق المصروفات النثرية' },
  { value: 'revenue', label: 'صندوق الإيرادات' },
  { value: 'expense', label: 'صندوق المصروفات' },
  { value: 'investment', label: 'صندوق الاستثمار' },
  { value: 'savings', label: 'صندوق الادخار' },
  { value: 'payroll', label: 'صندوق الرواتب' },
  { value: 'tax', label: 'صندوق الضرائب' },
  { value: 'zakat', label: 'صندوق الزكاة' },
  { value: 'charity', label: 'صندوق الصدقات' },
  { value: 'project', label: 'صندوق المشاريع' },
  { value: 'reserve', label: 'صندوق الاحتياطي' },
  { value: 'other', label: 'أخرى' }
];

const Create_boxes = () => {
  const { hasPermission: canCreateBox, loading: loadingCreatePermission } = usePermission('Create_Box');
  const { hasPermission: canViewBoxes, loading: loadingViewPermission } = usePermission('View_Boxes');
  
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newBox, setNewBox] = useState({ name: '', description: '', type: '' });

  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  useEffect(() => {
    if (canViewBoxes) {
      fetchBoxes();
    }
  }, [canViewBoxes, token]);

  const fetchBoxes = async () => {
    try {
      const response = await axios.get(`${apiUrl}CashBox/boxes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoxes(response.data);
    } catch (error) {
      console.error('Error fetching boxes:', error);
      toast.error('فشل في جلب الصناديق');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = () => {
    router.push('/Boxes');
  };

  const handleCreateBox = async () => {
    if (!newBox.name || !newBox.type) {
      toast.error("الرجاء إدخال اسم ونوع الصندوق");
      return;
    }

    try {
      const response = await axios.post(`${apiUrl}CashBox/boxes`, newBox, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBoxes([...boxes, response.data.box]);
      setShowModal(false);
      setNewBox({ name: '', description: '', type: '' });
      toast.success('تم إنشاء الصندوق بنجاح');
    } catch (error) {
      console.error('Error creating box:', error);
      toast.error('فشل في إنشاء الصندوق');
    }
  };

  if (loadingViewPermission || loadingCreatePermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canViewBoxes) {
    return <NotAuth />;
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-r from-blue-50 via-indigo-100 to-blue-50 flex flex-col text-black p-6"
      >
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

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">الصناديق</h1>
          {canCreateBox && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600 transition flex items-center"
            >
              <FaPlus className="mr-2" />
              إنشاء صندوق جديد
            </motion.button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {boxes.map((box) => (
                <motion.div
                  key={box._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 bg-white rounded-lg shadow-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{box.name}</h2>
                    <FaBox className="text-blue-500 text-2xl" />
                  </div>
                  <p className="text-gray-600 mb-2">النوع: {boxTypes.find(t => t.value === box.type)?.label || box.type}</p>
                  <p className="text-gray-600 mb-2">الوصف: {box.description || 'غير متوفر'}</p>
                  <p className="text-lg font-semibold">الرصيد: {box.balance}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center text-black"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
            >
              <h2 className="text-2xl font-bold mb-4">إنشاء صندوق جديد</h2>
              <input
                type="text"
                placeholder="اسم الصندوق"
                value={newBox.name}
                onChange={(e) => setNewBox({...newBox, name: e.target.value})}
                className="w-full p-2 mb-4 border rounded"
              />
              <select
                value={newBox.type}
                onChange={(e) => setNewBox({...newBox, type: e.target.value})}
                className="w-full p-2 mb-4 border rounded"
              >
                <option value="">اختر نوع الصندوق</option>
                {boxTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="الوصف (اختياري)"
                value={newBox.description}
                onChange={(e) => setNewBox({...newBox, description: e.target.value})}
                className="w-full p-2 mb-4 border rounded"
              />
              <div className="flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-gray-500 rounded-full hover:bg-gray-600 transition"
                >
                  إلغاء
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateBox}
                  className="px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600 transition"
                >
                  إنشاء الصندوق
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </>
  );
};

export default Create_boxes;
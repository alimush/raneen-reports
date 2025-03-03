"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaArrowLeft, FaSpinner, FaMoneyBillWave, FaExchangeAlt } from "react-icons/fa";
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../components/CustomAwesomeButton';

const BoxClear = () => {
  const { hasPermission: canEditCashBox, loading: loadingEditPermission } = usePermission('Edit_CashBox');
  const { hasPermission: canShowCashBox, loading: loadingShowPermission } = usePermission('Show_CashBox');
  
  const [admins, setAdmins] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decreasing, setDecreasing] = useState(false);
  const [decreaseAmounts, setDecreaseAmounts] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedToBox, setSelectedToBox] = useState('');

  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminsResponse, boxesResponse] = await Promise.all([
          axios.get(`${apiUrl}CashBox/admins/activate_order_casher/balance`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${apiUrl}CashBox/boxes`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setAdmins(adminsResponse.data);
        setBoxes(boxesResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleReturn = () => {
    router.push('/Boxes');
  };

  const handleDecrease = async () => {
    const { userId, amount } = selectedAdmin;
    if (!amount || isNaN(amount) || amount <= 0 || !selectedToBox) {
      toast.error("Please enter a valid amount and select a destination box.");
      return;
    }

    setDecreasing(true);
    try {
      await axios.post(`${apiUrl}CashBox/box/decrease`, {
        adminId: userId,
        amount,
        toBoxId: selectedToBox
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAdmins(prevAdmins => prevAdmins.map(admin => {
        if (admin.userId === userId) {
          return {
            ...admin,
            box: {
              ...admin.box,
              balance: admin.box.balance - Number(amount)
            }
          };
        }
        return admin;
      }));
      setDecreaseAmounts(prev => ({ ...prev, [userId]: '' }));
      toast.success('Amount transferred successfully');
    } catch (error) {
      console.error('Error transferring amount:', error);
      toast.error('Failed to transfer amount');
    } finally {
      setDecreasing(false);
      setShowModal(false);
      setSelectedAdmin(null);
      setSelectedToBox('');
    }
  };

  const openModal = (userId) => {
    const amount = decreaseAmounts[userId];
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setSelectedAdmin({ userId, amount });
    setShowModal(true);
  };

  if (loadingShowPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canShowCashBox) {
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

        <h1 className="text-3xl font-bold mb-6 text-center">Admin Balances</h1>

        {loading || loadingEditPermission || loadingShowPermission ? (
          <div className="flex justify-center items-center">
            <FaSpinner className="animate-spin text-4xl text-blue-500" />
          </div>
        ) : (
          <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {admins.map((admin) => (
                <motion.div
                  key={admin.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-6 bg-white rounded-lg shadow-lg"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{admin.userName}</h2>
                    <FaMoneyBillWave className="text-green-500 text-2xl" />
                  </div>
                  <p className="text-gray-600 mb-2">Phone: {admin.userPhone}</p>
                  <p className="text-lg font-semibold mb-4">
                    Balance: {admin.box ? admin.box.balance : 'N/A'}
                  </p>
                  {canEditCashBox && admin.box && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={decreaseAmounts[admin.userId] || ''}
                        onChange={(e) => setDecreaseAmounts(prev => ({ ...prev, [admin.userId]: e.target.value }))}
                        className="p-2 border rounded flex-grow"
                        placeholder="Amount to transfer"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openModal(admin.userId)}
                        className="px-4 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 transition"
                        disabled={decreasing}
                      >
                        {decreasing ? <FaSpinner className="animate-spin" /> : <FaExchangeAlt />}
                      </motion.button>
                    </div>
                  )}
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
              <h2 className="text-2xl font-bold mb-4">Confirm Transfer</h2>
              <p className="mb-4">Amount to transfer: {selectedAdmin?.amount}</p>
              <div className="mb-4">
                <label htmlFor="toBox" className="block text-sm font-medium text-gray-700">
                  Select destination box:
                </label>
                <select
                  id="toBox"
                  value={selectedToBox}
                  onChange={(e) => setSelectedToBox(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a box</option>
                  {boxes.map((box) => (
                    <option key={box._id} value={box._id}>
                      {box.name} (Balance: {box.balance})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white bg-gray-500 rounded-full hover:bg-gray-600 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDecrease}
                  className="px-4 py-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 transition"
                >
                  Confirm Transfer
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

export default BoxClear;
"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaUserCog } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from "../components/CustomAwesomeButton";

const AdminRolesPage = () => {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}AdminRoleList/roles`, {
        headers: {
          'authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleReturn = () => {
    router.back();
  };

  const handleRoleClick = (role) => {
    router.push(`/ManageRoles/${role._id}`);
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast.warn('Please enter a role name');
      return;
    }
    setAddingRole(true);
    try {
      const response = await fetch(`${apiUrl}AdminRoleList/add-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: 'HARD_CODED_USER', password: 'HARD_CODED_PASS', name: newRoleName.trim() }),
      });
      if (!response.ok) throw new Error('Failed to add role');
      const data = await response.json();
      setRoles(prevRoles => [...prevRoles, data.role]);
      setNewRoleName('');
      toast.success('Role added successfully');
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role. Please try again.');
    } finally {
      setAddingRole(false);
    }
  };

  return (
      <div className="container mx-auto p-6 text-black">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
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
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">الصلاحيات</h2>
          <p className="text-gray-600 mb-8 text-center">ادارة الصلاحيات</p>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <TailSpin color="#4A90E2" height={50} width={50} />
            </div>
          ) : (
            <ul className="space-y-4 mb-8">
              {roles.map((role) => (
                <motion.li
                  key={role._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition shadow-sm flex-row-reverse"
                >
                  <span className="text-lg font-medium text-gray-800">{role.name}</span>
                  <button
                    onClick={() => handleRoleClick(role)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition transform hover:scale-105 flex items-center flex-row-reverse"
                  >
                    <FaUserCog className="ml-2" />
                    ادارة
                  </button>
                </motion.li>
              ))}
            </ul>
          )}

          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">اضافة صلاحية جديدة</h3>
            <div className="flex items-center flex-row-reverse">
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="ادخل اسم الصلاحية"
                className="flex-grow border text-right border-gray-300 p-2 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleAddRole}
                className="px-4 py-2 bg-green-500 text-white rounded-l-md hover:bg-green-600 transition transform hover:scale-105 flex items-center"
                disabled={!newRoleName.trim() || addingRole}
              >
                {addingRole ? (
                  <TailSpin color="#ffffff" height={24} width={24} />
                ) : (
                  <>
                    <FaPlus className="mr-2" />
                    اضافة صلاحية
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

export default AdminRolesPage;
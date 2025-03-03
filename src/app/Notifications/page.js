"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import AsyncSelect from 'react-select/async';
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import CustomAwesomeButton from '../components/CustomAwesomeButton';

const Notifications = () => {
  const { hasPermission: canSendNotification, loading: loadingPermission } = usePermission('Send_Notifications');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('normal');
  const [itemId, setItemId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [categories, setCategories] = useState([]);

  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  
  const api = axios.create({
    baseURL: apiUrl ? `${apiUrl}AdminRoleList/admin/roles` : '/api', // Fallback to a relative path
    headers: {
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${apiUrl}Category/categories-with-subcategories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [token]);

  const loadOptions = async (inputValue) => {
    try {
      const response = await axios.get(`${apiUrl}Item/items/SearchByIdOrName`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { query: inputValue }
      });
      return response.data.map(item => ({
        value: item._id,
        label: item.name
      }));
    } catch (error) {
      console.error('Error fetching items:', error);
      return [];
    }
  };

  const handleSendNotification = async () => {
    setLoading(true);
    try {
      const notificationData = { title, message, type };
      if (type === 'item') {
        notificationData.itemId = itemId;
      } else if (type === 'category') {
        notificationData.categoryId = categoryId;
      } else if (type === 'subcategory') {
        notificationData.subcategoryId = subcategoryId;
      }
      const response = await axios.post('https://iqne4zeprk.execute-api.me-south-1.amazonaws.com/dev/Notifications/send-notification', notificationData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert(`Notification sent: ${response.data.message}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = () => {
    router.push('/Home');
  };

  if (loadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canSendNotification) {
    return (
<NotAuth />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 text-black">
        <div className="w-full max-w-5xl bg-white p-6 rounded-lg shadow-lg">
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
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="col-span-1">
                <label className="block text-gray-700">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-gray-700">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="normal">Normal</option>
                  <option value="item">Item</option>
                  <option value="category">Category</option>
                  <option value="subcategory">Subcategory</option>
                </select>
              </div>
              {type === 'item' && (
                <div className="col-span-1">
                  <label className="block text-gray-700">Item</label>
                  <AsyncSelect
                    cacheOptions
                    loadOptions={loadOptions}
                    onChange={(option) => setItemId(option.value)}
                    defaultOptions
                    className="w-full"
                  />
                </div>
              )}
              {type === 'category' && (
                <div className="col-span-1">
                  <label className="block text-gray-700">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {type === 'subcategory' && (
                <div className="col-span-1">
                  <label className="block text-gray-700">Subcategory</label>
                  <select
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    {categories.map((category) =>
                      category.subcategories.map((subcategory) => (
                        <option key={subcategory._id} value={subcategory._id}>
                          {subcategory.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              )}
              <div className="col-span-1">
                <button
                  onClick={handleSendNotification}
                  className="w-full p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600 transition"
                >
                  Send Notification
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;

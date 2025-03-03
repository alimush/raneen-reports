"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AiOutlineUser, AiOutlineBell, AiOutlineBarChart } from 'react-icons/ai';
import { HiOutlineDocumentReport } from "react-icons/hi";
import { RiLockPasswordLine, RiAdminFill, RiStore2Line } from 'react-icons/ri';
import { FiUsers, FiSettings, FiPackage } from 'react-icons/fi';
import { BiCategory, BiMessageDetail } from 'react-icons/bi';
import { IoMdCash } from 'react-icons/io';
import { MdOutlineCategory, MdOutlineStorage, MdDeleteOutline } from 'react-icons/md';
import { useRoles } from '../../../context/RoleContext';

const boxes = [
  // { id: 2, name: 'بطاقة الزبون', icon: <FiUsers size={32} />, link: '/Admin-users', permission: 'List_Admin_Users', color: 'bg-green-100' },
  // { id: 4, name: 'عروض البيع', icon: <MdOutlineCategory size={32} />, link: '/allquatos', permission: 'Create_supplier', color: 'bg-purple-100' },
  // { id: 4, name: 'اوامر البيع', icon: <MdOutlineCategory size={32} />, link: '/invoices', permission: 'Create_supplier', color: 'bg-purple-100' },
  // { id: 4, name: 'الانتاج', icon: <MdOutlineCategory size={32} />, link: '/Suppliers', permission: 'Create_supplier', color: 'bg-purple-100' },
  // { id: 5, name: 'المخزون', icon: <MdOutlineStorage size={32} />, link: '/Storage', permission: 'Create_Storage', color: 'bg-red-100' },
  // { id: 6, name: 'المبيعات', icon: <FiPackage size={32} />, link: '/Order', permission: 'create_order', color: 'bg-teal-100' },
  // { id: 7, name: 'المشتريات', icon: <IoMdCash size={32} />, link: '/Ordercasher', permission: 'activate_order_casher', color: 'bg-indigo-100' },
  { id: 1, name: 'كول سنتر', icon: <AiOutlineBarChart size={32} />, link: '/duedateusers', permission: 'activate_order_mm', color: 'bg-pink-100' },
];

const Page = () => {
  const [rolePermissions, setRolePermissions] = useState([]);
  const router = useRouter();
  const { roles, loading, error, refetchRoles } = useRoles();

  useEffect(() => {
    // If we've just logged in and don't have roles yet, try to refetch
    if (!loading && (!roles || roles.length === 0)) {
      console.log('No roles found, attempting to refetch...');
      refetchRoles();
    }
    
    // Check if roles exists and has permissions
    if (!loading && roles && roles.length > 0 && roles[0].permissions) {
      console.log('Setting permissions:', roles[0].permissions);
      setRolePermissions(roles[0].permissions || []);
    }
  }, [roles, loading, refetchRoles]);

  // Retry mechanism if permissions are empty
  useEffect(() => {
    if (!loading && rolePermissions.length === 0) {
      const timer = setTimeout(() => {
        console.log('No permissions detected, retrying...');
        refetchRoles();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [rolePermissions, loading, refetchRoles]);

  const handleBoxClick = (link) => {
    router.push(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen flex-col">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          onClick={() => refetchRoles()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // If we have no roles data after loading is complete, show a message with a retry button
  if (!roles || roles.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen flex-col">
        <div className="text-gray-500 mb-4">No roles available. Please try again.</div>
        <button 
          onClick={() => refetchRoles()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  console.log('Rendering boxes with permissions:', rolePermissions);

  return (
    <div className="flex justify-center items-center flex-1 bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {boxes.map((box) => (
            rolePermissions.includes(box.permission) && (
              <div
                key={box.id}
                onClick={() => handleBoxClick(box.link)}
                className={`${box.color} p-4 sm:p-6 rounded-lg shadow-md flex flex-col items-center justify-center cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:shadow-lg`}
              >
                <div className="mb-2 sm:mb-4 text-gray-800">{box.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800">{box.name}</h3>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
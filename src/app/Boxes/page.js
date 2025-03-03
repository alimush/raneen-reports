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
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import CustomAwesomeButton from '../components/CustomAwesomeButton';





const boxes = [
  { id: 1, name: 'صندوق الكاشير', icon: <RiLockPasswordLine size={32} />, link: '/BoxClear', permission: 'Clear_Box', color: 'bg-blue-100' },
  { id: 2, name: 'الصناديق', icon: <FiUsers size={32} />, link: '/Create_boxes', permission: 'View_Boxes', color: 'bg-green-100' },
  { id: 3, name: 'تقرير زبائن', icon: <BiCategory size={32} />, link: '/Customer_Report', permission: 'Customer_Report', color: 'bg-yellow-100' },
  { id: 4, name: 'تقرير اوردر', icon: <MdOutlineCategory size={32} />, link: '/Fulfillment_Report', permission: 'Fulfillment_Report', color: 'bg-purple-100' },
  { id: 5, name: 'تقرير مالي', icon: <MdOutlineStorage size={32} />, link: '/Financial_Report', permission: 'Financial_Report', color: 'bg-red-100' },
  { id: 6, name: 'تقرير استرجاعات', icon: <FiPackage size={32} />, link: '/Refund_Report', permission: 'Refund_Report', color: 'bg-teal-100' },
  { id: 7, name: 'تقرير حركات الصندوق', icon: <IoMdCash size={32} />, link: '/Ordercasher', permission: 'Box_Reports', color: 'bg-indigo-100' },
  // { id: 8, name: 'مدير المخازن', icon: <AiOutlineBarChart size={32} />, link: '/OrderMm', permission: 'activate_order_mm', color: 'bg-pink-100' },
  // { id: 9, name: 'الصندوق', icon: <IoMdCash size={32} />, link: '/BoxClear', permission: 'Show_CashBox', color: 'bg-orange-100' },
  // { id: 10, name: 'سلة المهملات', icon: <MdDeleteOutline size={32} />, link: '/TrashItems', permission: 'Show_Trash', color: 'bg-gray-100' },
  // { id: 11, name: 'الاعلانات', icon: <BiMessageDetail size={32} />, link: '/Banner', permission: 'Add_Banner', color: 'bg-lime-100' },
  // { id: 12, name: 'الاشعارات', icon: <AiOutlineBell size={32} />, link: '/Notifications', permission: 'Send_Notifications', color: 'bg-amber-100' },
  // { id: 13, name: 'التقارير', icon: <HiOutlineDocumentReport size={32} />, link: '/Reports', permission: 'Reports', color: 'bg-sky-100' },
];

const Boxes = () => {
  const [rolePermissions, setRolePermissions] = useState([]);
  const router = useRouter();
  const { roles, loading } = useRoles();

  useEffect(() => {
    if (roles && roles.length > 0) {
      setRolePermissions(roles[0].permissions);
    }
  }, [roles]);

  const handleBoxClick = (link) => {
    router.push(link);
  };

  const handleReturn = () => {
    router.push('/Home');
  };

  return (
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
    <div className="flex justify-center items-center flex-1 bg-gray-100">
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8 h-full md:h-[80vh] flex items-center">
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
      )}
    </div>
    </>
  );
};

export default Boxes;

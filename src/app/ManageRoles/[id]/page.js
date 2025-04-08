"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '../../components/NavBar';
import { FaArrowLeft, FaUserPlus, FaTrash, FaLock, FaSearch } from 'react-icons/fa';
import { TailSpin } from 'react-loader-spinner';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CustomAwesomeButton from '../../components/CustomAwesomeButton';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center text-black">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        {children}
        <button
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          onClick={onClose}
        >
          اغلاق
        </button>
      </div>
    </div>
  );
};

let permissionsDescriptions = {
  'view_roles': 'عرض الأدوار',
  'delete_roles': 'حذف الأدوار',
  'remove_roles': 'إزالة الأدوار',
  'assign_roles': 'تعيين الأدوار',
  'add_role_group': 'إضافة مجموعة دور',
  'add_roles': 'إضافة الأدوار',
  'List_Admin_Users': 'قائمة المستخدمين الإداريين',
  'Create_admin': 'إنشاء مسؤول',
  'Category': 'الفئة',
  'Edit_Category': 'تحرير الفئة',
  'Edit_SubCategory': 'تحرير الفئة الفرعية',
  'Create_supplier': 'إنشاء مورد',
  'Search_supplier': 'البحث عن المورد',
  'View_suppliers_by_quantity': 'عرض الموردين حسب الكمية',
  'Define_items': 'تعريف العناصر',
  'Update_quantities': 'تحديث الكميات',
  'Search_Items': 'البحث عن العناصر',
  'Update_Items': 'تحديث العناصر',
  'Create_Storage': 'إنشاء تخزين',
  'List_Storages': 'قائمة التخزين',
  'Search_Invoice': 'البحث عن الفاتورة',
  'Search_Inv': 'البحث عن الفاتورة',
  'create_order': 'إنشاء طلب',
  'activate_order': 'تفعيل الطلب',
  'cancel_order_sales': 'إلغاء الطلب في المبيعات',
  'Search_order': 'البحث عن الطلب',
  'edit_order': 'تحرير الطلب',
  'view_order_workflow': 'عرض سير العمل للطلب',
  'activate_order_casher': 'تفعيل الطلب بواسطة أمين الصندوق',
  'reject_order_casher': 'رفض الطلب بواسطة أمين الصندوق',
  'handover_cashbox': 'تسليم صندوق النقد',
  'activate_order_mm': 'تفعيل الطلب بواسطة MM',
  'cancel_order_mm': 'إلغاء الطلب بواسطة MM',
  'Show_CashBox': 'عرض صندوق النقد',
  'Clear_Box': 'افراغ صندوق',
  'Edit_CashBox': 'تحرير صندوق النقد',
  'Show_Trash': 'عرض المهملات',
  'Transfer_Trash': 'نقل المهملات',
  'Add_Banner': 'إضافة لافتة',
  'Delete_Banner': 'حذف لافتة',
  'Send_Notifications': 'إرسال الإشعارات',
  'Add_Partition': 'اضافة قسم فرعي للمخزن',
  'Reports': 'التقارير',
  'Sales_Report' : 'تقرير مبيعات',
  'Inventory_Report': 'تقرير مخزن',
  'Customer_Report': 'تقرير زبائن', 
  'Fulfillment_Report': 'تقرير اوردر', 
  'Financial_Report': 'تقرير مالي', 
  'Refund_Report': "تقرير استرجاع",
  'Box_Reports': "تقارير صندوق",
  'View_Boxes': "رؤية الصناديق",
  'Create_Box': "انشاء صندوق",
  'request_refund': "طلب استرجاع",
  'approve_refund': "موافقة استرجاع",
  'reject_refund': "رفض الاسترجاع",
  'due_date_report_baghdad': "تقرير ذمم الزبائن بغداد",
  'due_date_report_dewania': "تقرير ذمم الزبائن ديوانية",
  'invoices_report_dewania': "فواتير الديوانية"
};

const RoleDetailPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [loading, setLoading] = useState(true);
  const [addingPermission, setAddingPermission] = useState(false);
  const [assigningUser, setAssigningUser] = useState(false);
  const [deletingRole, setDeletingRole] = useState(false);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([
    'view_roles', 'delete_roles', 'remove_roles', 'assign_roles', 'add_role_group', 'add_roles', 'List_Admin_Users', 'Create_admin', 'Category', 'Edit_Category', 'Edit_SubCategory', 'Create_supplier', 'Search_supplier', 'View_suppliers_by_quantity', 'Define_items', 'Update_quantities', 'Search_Items', 'Update_Items',
    'Create_Storage', 'List_Storages', 'Search_Invoice', 'Search_Inv', 'create_order', 'activate_order', 'cancel_order_sales', 'Search_order', 'edit_order', 'view_order_workflow', 'activate_order_casher', 'reject_order_casher', 'handover_cashbox', 'activate_order_mm', 'cancel_order_mm',
    'Show_CashBox', 'Edit_CashBox', 'Show_Trash', 'Transfer_Trash', 'Add_Banner', 'Delete_Banner', 'Send_Notifications', 'Add_Partition', 'Reports', 'Sales_Report', 'Inventory_Report', 'Customer_Report', 'Fulfillment_Report', 'Financial_Report', 'Refund_Report', 'Box_Reports', 'Clear_Box', 'View_Boxes', 'Create_Box',
    'request_refund', 'approve_refund', 'reject_refund', 'due_date_report_baghdad', 'due_date_report_dewania', 'invoices_report_dewania'
  ]);
  const [newPermission, setNewPermission] = useState('');
  const [users, setUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]); // To hold users that can be assigned to the role
  const [userToAssign, setUserToAssign] = useState('');
  const [showUsers, setShowUsers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
console.log(apiUrl)
  // New state to store storage names mapped to IDs
  const [storageNames, setStorageNames] = useState({});

  useEffect(() => {
    const fetchRoleDetails = async () => {
      setLoading(true);
      try {
        const permissionsResponse = await fetch(`${apiUrl}AdminRoleList/api/roles/${id}/permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!permissionsResponse.ok) throw new Error('Failed to fetch role details');
        const permissionsData = await permissionsResponse.json();
        setPermissions(permissionsData.permissions);
        setRole(permissionsData.role);
      } catch (error) {
        console.error('Error fetching role details:', error);
        toast.error('Failed to load role details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchStorages = async () => {
      try {
        const storageResponse = await fetch(`${apiUrl}Storage/list-storages`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!storageResponse.ok) throw new Error('Failed to fetch storages');
        const storageData = await storageResponse.json();

        // Create a mapping of storage IDs to names
        const storageNameMapping = {};
        storageData.forEach(storage => {
          storageNameMapping[`View_Storage_${storage.storageId}`] = storage.storageName;
        });
        setStorageNames(storageNameMapping);

        // Merge storages with availablePermissions
        const storagePermissions = storageData.map(storage => ({
          key: `View_Storage_${storage.storageId}`,
          name: storage.storageName,
          description: `View access to storage ${storage.storageName} located at ${storage.storageLocation}`
        }));

        const mergedPermissions = [
          ...availablePermissions,
          ...storagePermissions.map(sp => sp.key)
        ];

        setAvailablePermissions(mergedPermissions);
        permissionsDescriptions = {
          ...permissionsDescriptions,
          ...storagePermissions.reduce((acc, sp) => {
            acc[sp.key] = sp.description;
            return acc;
          }, {})
        };
      } catch (error) {
        console.error('Error fetching storages:', error);
        toast.error('Failed to load storages. Please try again.');
      }
    };

    fetchRoleDetails();
    fetchStorages();
  }, [id, token]);

  useEffect(() => {
    if (showUsers) {
      fetchUsersByRole();
      fetchAllUsers();
    }
  }, [showUsers]);

  const handleAddPermission = async (permissionToAdd, addAll = false) => {
    setAddingPermission(true);
    let permissionsToAdd;
    if (addAll) {
      permissionsToAdd = [...new Set([...permissions, ...availablePermissions])];
    } else if (permissionToAdd) {
      permissionsToAdd = [...new Set([...permissions, permissionToAdd])];
    } else {
      setAddingPermission(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}AdminRoleList/update-role/${id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: permissionsToAdd }),
      });

      if (response.ok) {
        setPermissions(permissionsToAdd);
        toast.success(addAll ? 'All permissions added successfully' : 'Permission added successfully');
      } else {
        throw new Error('Failed to add permission');
      }
    } catch (error) {
      console.error('Error adding permission:', error);
      toast.error('Failed to add permission. Please try again.');
    } finally {
      setAddingPermission(false);
      setShowModal(false);
    }
  };

  const handleDeletePermission = async (permission) => {
    setAddingPermission(true);
    try {
      const updatedPermissions = permissions.filter(p => p !== permission);
      const response = await fetch(`${apiUrl}AdminRoleList/update-role/${id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permissions: updatedPermissions }),
      });

      if (response.ok) {
        setPermissions(updatedPermissions);
        setPermissionToDelete(null);
        toast.success('Permission deleted successfully');
      } else {
        throw new Error('Failed to delete permission');
      }
    } catch (error) {
      console.error('Error deleting permission:', error);
      toast.error('Failed to delete permission. Please try again.');
    } finally {
      setAddingPermission(false);
    }
  };

  const handleDeleteRole = async () => {
    setDeletingRole(true);
    try {
      const response = await fetch(`${apiUrl}AdminRoleList/delete-role/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        toast.success('Role deleted successfully');
        router.push('/roles');
      } else {
        throw new Error('Failed to delete role');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role. Please try again.');
    } finally {
      setDeletingRole(false);
    }
  };

  const fetchUsersByRole = async () => {
    try {
      const response = await fetch(`${apiUrl}AdminRoleList/users-by-role/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch users by role');
      const usersData = await response.json();
      setUsers(usersData.admins);
      fetchAllUsers(usersData.admins);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users. Please try again.');
    }
  };

  const fetchAllUsers = async (currentUsers = []) => {
    try {
      const response = await fetch(`${apiUrl}AdminUsersList/admin-users-list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch all users');
      const usersData = await response.json();
      const filteredUsers = usersData.admins.filter(user => 
        !currentUsers.some(currentUser => currentUser._id === user._id)
      );
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching available users:', error);
      toast.error('Failed to load available users. Please try again.');
    }
  };

  const handleAssignUser = async () => {
    setAssigningUser(true);
    try {
      const response = await fetch(`${apiUrl}AdminRoleList/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminId: userToAssign, roleId: id }),
      });

      if (response.ok) {
        await fetchUsersByRole();
        setUserToAssign('');
        toast.success('User assigned successfully');
      } else {
        throw new Error('Failed to assign user to role');
      }
    } catch (error) {
      console.error('Error assigning user to role:', error);
      toast.error('Failed to assign user. Please try again.');
    } finally {
      setAssigningUser(false);
    }
  };

  const handleRemoveUser = async (adminId) => {
    console.log(apiUrl)
    setAssigningUser(true);
    try {
      const response = await fetch(`${apiUrl}AdminRoleList/remove-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ adminId, roleId: id }),
      });

      if (response.ok) {
        await fetchUsersByRole();
        toast.success('User removed successfully');
      } else {
        throw new Error('Failed to remove user from role');
      }
    } catch (error) {
      console.error('Error removing user from role:', error);
      toast.error('Failed to remove user. Please try again.');
    } finally {
      setAssigningUser(false);
    }
  };

  const handleReturn = () => {
    router.back();
  };

  const filteredAvailablePermissions = availablePermissions.filter(
    (permission) => !permissions.includes(permission) &&
      (permission.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (permissionsDescriptions[permission] && permissionsDescriptions[permission].toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="font-Zain">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-black">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1 }}
          className="bg-white shadow-xl rounded-lg overflow-hidden"
        >
          <div className="p-6 sm:p-10">
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
            
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-2 ${activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-l-lg`}
              >
                المستخدمين
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`flex-1 py-2 ${activeTab === 'permissions' ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-r-lg`}
              >
                الصلاحيات
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <TailSpin color="#4A90E2" height={50} width={50} />
              </div>
            ) : activeTab === 'users' ? (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">المستخدمين في هذة الصلاحية</h3>
                  <ul className="space-y-3">
                    {users.map((user, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.1, delay: index * 0.1 }}
                        className="flex justify-between items-center bg-gray-100 p-4 rounded-lg text-gray-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <span className="font-medium">{user.name} - {user.phone}</span>
                        <button
                          className="ml-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                          onClick={() => handleRemoveUser(user._id)}
                        >
                          <FaTrash />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">اضافة يوزر جديد</h3>
                  <div className="flex items-center">
                    <select
                      value={userToAssign}
                      onChange={(e) => setUserToAssign(e.target.value)}
                      className="flex-grow border border-gray-300 p-2 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>Select a user</option>
                      {availableUsers.map((user, index) => (
                        <option key={index} value={user._id}>{user.name} - {user.phone}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssignUser}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      disabled={!userToAssign || assigningUser}
                    >
                      {assigningUser ? <TailSpin color="#ffffff" height={24} width={24} /> : <FaUserPlus />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-800">هذة الصلاحية</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {permissions.map((permission, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.1, delay: index * 0.05 }}
                        className="flex justify-between items-center bg-gray-100 p-4 rounded-lg text-gray-800 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div>
                          <span className="font-bold">{storageNames[permission] || permission}</span>
                          <span className="block text-sm text-gray-600">{permissionsDescriptions[permission]}</span>
                        </div>
                        <button
                          className="ml-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                          onClick={() => setPermissionToDelete(permission)}
                        >
                          <FaTrash />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                <div className="flex space-x-4 mt-4">
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    اضافة الصلاحية
                  </button>
                  <button
                    onClick={() => handleAddPermission(null, true)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                    disabled={addingPermission}
                  >
                    {addingPermission ? <TailSpin color="#ffffff" height={24} width={24} /> : 'Add All Permissions'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSearchTerm('');
        }}
        title="اضافة صلاحية"
      >
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="البحث عن صلاحية"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filteredAvailablePermissions.length > 0 ? (
            filteredAvailablePermissions.map((permission, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <span className="text-gray-800 font-medium font-Zain">{storageNames[permission] || permission}</span>
                  <span className="block text-sm text-gray-500 font-Zain">{permissionsDescriptions[permission]}</span>
                </div>
                <button
                  className="ml-4 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  onClick={() => handleAddPermission(permission)}
                  disabled={addingPermission}
                >
                  {addingPermission ? <TailSpin color="#ffffff" height={16} width={16} /> : <FaLock />}
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">
              {searchTerm ? "No matching permissions found" : "No additional permissions available"}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!permissionToDelete}
        onClose={() => setPermissionToDelete(null)}
        title="تأكيد الحذف"
      >
        <p className="text-sm text-gray-500 mb-4">
          هل انت متأكد من انك تريد حذف هذة الصلاحية
        </p>
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => setPermissionToDelete(null)}
          >
            الغاء
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            onClick={() => handleDeletePermission(permissionToDelete)}
            disabled={addingPermission}
          >
            {addingPermission ? <TailSpin color="#ffffff" height={24} width={24} /> : 'Delete'}
          </button>
        </div>
      </Modal>
</div>
  );
};

export default RoleDetailPage;

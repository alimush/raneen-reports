"use client";
import React, { useState, useEffect } from "react";
import { ColorRing } from "react-loader-spinner";
import { usePermission } from "../../../context/PermissionContext";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import { useRouter } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";
import { FaUserPlus, FaArrowLeft } from "react-icons/fa";
import CustomAwesomeButton from "../components/CustomAwesomeButton";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
    >
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-black text-center">{title}</h2>
        {children}
      </motion.div>
    </motion.div>
  );
};

const AdminPage = () => {
  const { hasPermission: canCreateAdmin } = usePermission("Create_admin");
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [admins, setAdmins] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const apiUrl = typeof window !== "undefined" ? window.localStorage.getItem("apiUrl") : null;

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}AdminUsersList/admin-users-list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch admins");
      const data = await response.json();
      console.log(data)
      setAdmins(data.admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admins. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const response = await fetch(`${apiUrl}api/entities`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch entities");
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      console.error("Error fetching entities:", error);
      toast.error("Failed to load entities. Please try again.");
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchEntities();
  }, []);

  const handleAssignEntity = async (adminId, entityId) => {
    if (!entityId) return;

    try {
      const response = await fetch(`${apiUrl}api/assign-entity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminId, entityId }),
      });

      if (!response.ok) throw new Error("Failed to assign entity");
      toast.success("Entity assigned successfully");
      fetchAdmins(); // Refresh the list of admins
    } catch (error) {
      console.error("Error assigning entity:", error);
      toast.error("Failed to assign entity. Please try again.");
    }
  };

  const handleUnassignEntity = async () => {
    if (!selectedAdmin || !selectedEntity) {
      toast.error("Please select a valid admin and entity.");
      return;
    }
  
    try {
      const response = await fetch(`${apiUrl}api/unassign-entity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminId: selectedAdmin, entityId: selectedEntity }),
      });
  
      if (!response.ok) throw new Error("Failed to unassign entity");
      toast.success("Entity unassigned successfully");
      setShowUnassignModal(false);
      fetchAdmins(); // Refresh the list of admins
    } catch (error) {
      console.error("Error unassigning entity:", error);
      toast.error("Failed to unassign entity. Please try again.");
    }
  };

  const handleUnassignButtonClick = (adminId, entityId) => {
    setSelectedAdmin(adminId);
    setSelectedEntity(entityId);
    setShowUnassignModal(true);
  };

  const handleCreateAdmin = async () => {
    if (!name.trim() || !phone.trim() || !password.trim() || !email.trim()) {
      toast.warn("Please fill in all fields");
      return;
    }
    setCreatingAdmin(true);
    try {
      const response = await fetch(`${apiUrl}AdminLogin/create-admin/sys`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone, name, password, email }),
      });

      if (response.ok) {
        const newAdmin = await response.json();
        setAdmins([...admins, newAdmin.admin]);
        setName("");
        setPhone("");
        setPassword("");
        setEmail("");
        setShowCreateModal(false);
        toast.success("Admin created successfully");
      } else {
        throw new Error("Failed to create admin");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error("Failed to create admin. Please try again.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleReturn = () => {
    router.back();
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 text-black">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="mb-5">
        <CustomAwesomeButton buttonType="electric" onPress={handleReturn} isRTL={true}>
          <div className="flex flex-row">
            <FaArrowLeft className="mr-2 mt-1" />
            رجوع
          </div>
        </CustomAwesomeButton>
      </div>
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          {canCreateAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700 flex items-center"
              onClick={() => setShowCreateModal(true)}
            >
              انشاء ادمن جديد
              <FaUserPlus className="ml-2" />
            </motion.button>
          )}
          <h1 className="text-3xl font-bold">حسابات الادمن</h1>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <ColorRing visible={true} height="80" width="80" />
          </div>
        ) : (
          <motion.ul className="space-y-4">
            <AnimatePresence>
              {admins.map((admin) => (
                <motion.li key={admin._id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3>{admin.name}</h3>
                  <p>{admin.phone}</p>
                  <ul>
  {Array.isArray(admin.entities) && admin.entities.map((entity) => (
    <li key={entity._id} className="flex justify-between items-center">
      <span>{entity.name}</span>
      <button
        className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={() => handleUnassignButtonClick(admin._id, entity._id)}
      >
        Unassign
      </button>
    </li>
  ))}
</ul>

                
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}

        {/* Create Admin Modal */}
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="انشاء ادمن جديد">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              الاسم
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="الاسم"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
              الهاتف
            </label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="الهاتف"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              البريد الالكتروني
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="البريد الالكتروني"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="كلمة المرور"
            />
          </div>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 mr-2"
              onClick={() => setShowCreateModal(false)}
            >
              إلغاء
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleCreateAdmin}
              disabled={creatingAdmin}
            >
              انشاء
            </button>
          </div>
        </Modal>

        {/* Unassign Entity Modal */}
        <Modal isOpen={showUnassignModal} onClose={() => setShowUnassignModal(false)} title="تأكيد الحذف">
          <p className="mb-4">هل انت متأكد من إزالة الكيان؟</p>
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 mr-2"
              onClick={() => setShowUnassignModal(false)}
            >
              إلغاء
            </button>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={handleUnassignEntity}
            >
              إزالة
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default AdminPage;

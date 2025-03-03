"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import CustomAwesomeButton from "../components/CustomAwesomeButton";

const TrashItems = () => {
  const { hasPermission: canShowTrashBox, loading: loadingEditPermission } = usePermission('Show_Trash');
  const { hasPermission: canTransTrashBox, loading: loadingShowPermission } = usePermission('Transfer_Trash');
  const [trashItems, setTrashItems] = useState([]);
  const [storages, setStorages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;

  const fetchTrashItems = async () => {
    try {
      const response = await axios.get(`${apiUrl}Trash/trash`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrashItems(response.data);
    } catch (error) {
      console.error('Error fetching trash items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    const fetchStorages = async () => {
      try {
        const response = await axios.get(`${apiUrl}Storage/list-storages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStorages(response.data);
      } catch (error) {
        console.error('Error fetching storages:', error);
      }
    };

    fetchTrashItems();
    fetchStorages();
  }, [token]);

  const handleReturn = () => {
    router.push('/Home');
  };

  const handleTransfer = async () => {
    const { trashId, storageId } = selectedItem;
    if (!storageId || !quantity) {
      alert("Please select a storage and enter a quantity.");
      return;
    }

    setTransferring(true);
    try {
      await axios.post(`${apiUrl}Trash/trash/transfer`, {
        trashId,
        storageId,
        adminId: 'YOUR_ADMIN_ID', // Replace with actual admin ID
        quantity
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      fetchTrashItems();
    } catch (error) {
      console.error('Error transferring item:', error);
    } finally {
      setTransferring(false);
      setShowModal(false);
      setSelectedItem(null);
      setQuantity("");
    }
  };

  const openModal = (trashId) => {
    setSelectedItem({ trashId });
    setShowModal(true);
  };

  const handleStorageChange = (e) => {
    setSelectedStorage(e.target.value);
    setSelectedItem(prev => ({ ...prev, storageId: e.target.value }));
  };

  const handleQuantityChange = (e) => {
    setQuantity(e.target.value);
  };

  if (loadingShowPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canShowTrashBox) {
    return (
<NotAuth />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
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
              {trashItems.map(trash => (
                <div key={trash._id} className="bg-white p-4 rounded-lg shadow-md">
                  <img src={trash.item.mainImageUrl} alt={trash.item.name} className="w-full h-48 object-cover rounded-md mb-4" />
                  <h2 className="text-xl font-bold mb-2">{trash.item.name}</h2>
                  <p className="text-gray-600 mb-1"><strong>Product ID:</strong> {trash.item.productId}</p>
                  <p className="text-gray-600 mb-1"><strong>Price:</strong> ${trash.item.price.toFixed(2)}</p>
                  <p className="text-gray-600 mb-1"><strong>Cost:</strong> ${trash.item.cost.toFixed(2)}</p>
                  <p className="text-gray-600 mb-1"><strong>Category:</strong> {trash.item.category.name}</p>
                  <p className="text-gray-600 mb-1"><strong>Subcategory:</strong> {trash.item.subcategory.name}</p>
                  <p className="text-gray-600 mb-1"><strong>Supplier:</strong> {trash.item.supplier.name}</p>
                  <p className="text-gray-600 mb-1"><strong>Supplier Phone:</strong> {trash.item.supplier.phone}</p>
                  <p className="text-gray-600 mb-1"><strong>Supplier Location:</strong> {trash.item.supplier.location}</p>
                  <p className="text-gray-600 mb-1"><strong>Trash Quantity:</strong> {trash.quantity}</p>
                  <p className="text-gray-600 mb-1"><strong>Reason:</strong> {trash.reason}</p>
                 {canTransTrashBox &&
                 
                 <button
                 onClick={() => openModal(trash._id)}
                 className="mt-4 w-full px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600 transition"
               >
                 Transfer
               </button>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center text-black">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Transfer Item</h2>
            <select
              value={selectedStorage}
              onChange={handleStorageChange}
              className="mb-4 p-2 border rounded w-full"
            >
              <option value="">Select Storage</option>
              {storages.map(storage => (
                <option key={storage._id} value={storage._id}>{storage.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={handleQuantityChange}
              className="mb-4 p-2 border rounded w-full"
            />
            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-white bg-gray-500 rounded-full hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                className={`px-4 py-2 text-white bg-green-500 rounded-full hover:bg-green-600 transition ${transferring ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={transferring}
              >
                {transferring ? <FaSpinner className="animate-spin" /> : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TrashItems;

"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaTrash, FaSearch, FaSpinner } from 'react-icons/fa';
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import CustomAwesomeButton from '../components/CustomAwesomeButton';

export default function Banners() {
  const { hasPermission: canAddBanner, loading: loadingAddPermission } = usePermission('Add_Banner');
  const { hasPermission: canDeleteBanner, loading: loadingDeletePermission } = usePermission('Delete_Banner');
  
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  const [banners, setBanners] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBannerImage, setNewBannerImage] = useState(null);
  const [newBannerImageUrl, setNewBannerImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${apiUrl}Banner/banners`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      setBanners(response.data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching banners:', error);
      setLoading(false);
    });
  }, [token]);

  const handleReturn = () => {
    router.back();
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewBannerImage(null);
    setNewBannerImageUrl('');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setNewBannerImage(file);

    if (file) {
      const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
        params: {
          filename: file.name,
          filetype: file.type
        }
      });

      const { signedUrl, url } = response.data;

      await axios.put(signedUrl, file, {
        headers: {
          'Content-Type': file.type
        }
      });

      setNewBannerImageUrl(url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Please select an item for the banner');
      return;
    }
    setCreating(true);

    try {
      let imageUrl = newBannerImageUrl;

      if (!newBannerImageUrl && newBannerImage) {
        const response = await axios.get(`${apiUrl}AwsLink/s3/signed-url`, {
          params: {
            filename: newBannerImage.name,
            filetype: newBannerImage.type
          }
        });

        const { signedUrl, url } = response.data;

        await axios.put(signedUrl, newBannerImage, {
          headers: {
            'Content-Type': newBannerImage.type
          }
        });

        imageUrl = url;
      }

      await axios.post(`${apiUrl}Banner/banners`, 
        { imageUrl, itemId: selectedItem._id }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const response = await axios.get(`${apiUrl}Banner/banners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBanners(response.data);
      setCreating(false);
      handleCloseModal();
    } catch (error) {
      console.error('Error creating banner:', error);
      setCreating(false);
    }
  };

  const handleDelete = (id) => {
    axios.delete(`${apiUrl}Banner/banners/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      setBanners(banners.filter(banner => banner._id !== id));
    })
    .catch(error => {
      console.error('Error deleting banner:', error);
    });
  };

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${apiUrl}Item/items/SearchByIdOrName?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching items:', error);
    }
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setSearchResults([]);
  };

  if (loadingAddPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (!canAddBanner) {
    return (
<NotAuth />
    );
  }

  

  return (
    <div className="mx-auto p-4 bg-gray-100 text-gray-900 h-screen">
       {loadingAddPermission || loadingDeletePermission ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
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
    <div className="my-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Banners</h1>
      {canAddBanner && (
      <button
        onClick={handleOpenModal}
        className="flex items-center px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 focus:ring-4 focus:ring-green-500 transition"
      >
        <FaPlus className="mr-2" />
        Add Banner
      </button>
      )}
    </div>   
      {loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="spinner"></div>
        </div>
      ) : (
        <ul className="space-y-4">
          {banners.map(banner => (
            <li key={banner._id} className="p-4 bg-white rounded shadow-md flex justify-between items-center">
              <img src={banner.imageUrl} alt="Banner" className="w-32 h-32 object-cover rounded" />
              <div>
                <p>Item: {banner.itemId ? banner.itemId.name : 'N/A'}</p>
                <p>Product ID: {banner.itemId ? banner.itemId.productId : 'N/A'}</p>
              </div>
              {canDeleteBanner && (
              <button
                onClick={() => handleDelete(banner._id)}
                className="flex items-center px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 focus:ring-4 focus:ring-red-500 transition"
              >
                <FaTrash className="mr-2" />
                Delete
              </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Banner</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Banner Image</label>
                <input
                  type="file"
                  id="imageUrl"
                  onChange={handleFileChange}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="itemSearch" className="block text-sm font-medium text-gray-700">Search Item</label>
                <div className="flex">
                  <input
                    type="text"
                    id="itemSearch"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search for an item..."
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="mt-1 px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <FaSearch />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <ul className="mt-2 border border-gray-300 rounded-md max-h-40 overflow-y-auto">
                    {searchResults.map((item) => (
                      <li
                        key={item._id}
                        onClick={() => handleSelectItem(item)}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      >
                        {item.name} (ID: {item.productId})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedItem && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <p>Selected Item: {selectedItem.name}</p>
                  <p>Product ID: {selectedItem.productId}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 focus:ring-4 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 focus:ring-4 focus:ring-blue-500"
                >
                  {creating ? <div className="spinner"></div> : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #000;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
      )}
    </div>
  );
}

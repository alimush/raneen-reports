// /pages/quotations/[id].js

"use client";
import { useState, useEffect, useRef } from "react";
import {
  FaSpinner,
  FaChevronDown,
  FaPlus,
  FaTrash,
  FaBox,
  FaWarehouse,
  FaDollarSign,
  FaPercent,
} from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

let cachedSessionId = null;

export default function QuotationDetailsPage({ params }) {
  const { id } = params;
  const router = useRouter();
  const [sessionId, setSessionId] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComments, setNewComments] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState("name");
  const [updatedItems, setUpdatedItems] = useState([]);
  const [uomOptions, setUomOptions] = useState([]);
  const [selectedUom, setSelectedUom] = useState(null);
  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);
  const [isItemDropListOpen, setIsItemDropListOpen] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);

  const itemInputRef = useRef(null);
  const uomDropdownRef = useRef(null);

  const [currentItem, setCurrentItem] = useState({
    itemCode: "",
    quantity: "",
    warehouseCode: "",
    discountAmount: 0,
    discountPercent: 0,
    itemName: "",
    UnitPrice: 0,
    UOM: "",
    UoMEntry: null,
  });

  console.log("Updated Items:", updatedItems);

  // Function to Get Session ID
  const getSessionId = async () => {
    if (cachedSessionId) {
      return cachedSessionId;
    }
    cachedSessionId = await loginToSAP();
    return cachedSessionId;
  };

  // Function to Log into SAP
  const loginToSAP = async () => {
    try {
      const response = await fetch("/api/login", { method: "POST" });
      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      setError("Login to SAP failed");
    }
  };

  // Fetch Quotation Details on Mount
  useEffect(() => {
    fetchQuotationDetails();
  }, []);

  // Handle Clicks Outside Dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        itemInputRef.current &&
        !itemInputRef.current.contains(event.target)
      ) {
        setIsItemDropListOpen(false);
      }
      if (
        uomDropdownRef.current &&
        !uomDropdownRef.current.contains(event.target)
      ) {
        setIsUomDropdownOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [itemInputRef, uomDropdownRef]);

  // Handle Search Query Changes with Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 0 && !currentItem.itemCode) {
        setIsItemLoading(true);
        setIsItemDropListOpen(true);
        handleSearch();
      } else {
        setSearchResults([]);
        setIsItemDropListOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType, currentItem.itemCode]);

  // Fetch Quotation Details Function
  const fetchQuotationDetails = async () => {
    try {
      const sessionId = await getSessionId();
      if (!sessionId) {
        throw new Error('Session ID not available.');
      }
      const response = await fetch(`/api/invoiceDetails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const data = await response.json();
      setQuotation(data);
      setUpdatedItems(data.DocumentLines || []);
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Handle Item Search Function
  const handleSearch = async () => {
    try {
      const response = await fetch(
        `/api/business-partners?type=items&q=${encodeURIComponent(searchQuery)}&searchType=${searchType}`
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data);
      setIsItemLoading(false);

      // If exactly one match found (either by barcode or code), auto select it
      if (
        data.length === 1 &&
        ((searchType === "barcode" && data[0].BcdCode === searchQuery) ||
          (searchType === "code" && data[0].ItemCode === searchQuery))
      ) {
        handleItemSelect(data[0]);
      }
    } catch (error) {
      console.error(error);
      setStatusMessage("Search failed.");
      setIsItemLoading(false);
    }
  };

  // Handle Item Selection Function
  const handleItemSelect = (item) => {
    setCurrentItem({
      ...currentItem,
      itemCode: item.ItemCode,
      itemName: item.ItemName,
      warehouseCode: item.WhsCode, // Set Warehouse Code here
      UnitPrice: item.UnitPrice || item.Price || 0, // Ensure UnitPrice is set
      UOM: item.UOM,
      quantity: "",
      discountAmount: 0, // Initialize as number
      discountPercent: 0, // Initialize as number
    });
    setSearchQuery(item.ItemName);
    setSearchResults([]);
    setIsItemDropListOpen(false);
    fetchUomForItem(item.ItemCode, item.UOM, item.Price || item.UnitPrice);
  };

  // Fetch UOM for Selected Item Function
  const fetchUomForItem = async (itemCode, defaultUOM, defaultPrice) => {
    try {
      const response = await fetch(`/api/items/${itemCode}/uom`);
      if (!response.ok) {
        throw new Error(`Failed to fetch UOMs: ${response.statusText}`);
      }
      const data = await response.json();
      setUomOptions(data);

      const matchingUom = data.find((uom) => uom.UOM === defaultUOM);
      if (matchingUom) {
        setSelectedUom(matchingUom);
        setCurrentItem((prevItem) => ({
          ...prevItem,
          UnitPrice: parseFloat(matchingUom.Price) || 0,
          UOM: matchingUom.UOM,
          UoMEntry: matchingUom.UoMEntry,
        }));
      }
    } catch (error) {
      console.error("Error fetching UOMs:", error);
      setStatusMessage("Error fetching UOMs");
    }
  };

  // Handle UOM Selection Function
  const handleUomSelect = (uom) => {
    setSelectedUom(uom);
    const newUnitPrice = parseFloat(uom.Price) || 0;
    const discountPercent = newUnitPrice
      ? ((currentItem.discountAmount || 0) / newUnitPrice) * 100
      : 0;

    setCurrentItem((prevItem) => ({
      ...prevItem,
      UnitPrice: newUnitPrice,
      UOM: uom.UOM,
      UoMEntry: uom.UoMEntry,
      discountPercent: parseFloat(discountPercent.toFixed(2)),
    }));

    setIsUomDropdownOpen(false);
  };

  // Handle Adding New Item to Quotation Function
  const handleAddItem = () => {
    if (
      !currentItem.quantity ||
      !currentItem.itemCode ||
      !currentItem.UoMEntry ||
      !currentItem.warehouseCode // Ensure warehouse is selected
    ) {
      setStatusMessage("Item, Quantity, UOM, and Warehouse are required.");
      toast.error("Item, Quantity, UOM, and Warehouse are required.");
      return;
    }

    const existingItem = updatedItems.find(
      (line) =>
        line.ItemCode === currentItem.itemCode &&
        line.UOM === currentItem.UOM &&
        line.Operation !== "D" // Exclude marked for deletion
    );
    if (existingItem) {
      setStatusMessage("Item with the same UOM already exists in the order.");
      toast.error("Item with the same UOM already exists in the order.");
      return;
    }

    // Calculate line total considering discount
    const discountedPrice = currentItem.UnitPrice - currentItem.discountAmount;
    const lineTotal = discountedPrice * parseFloat(currentItem.quantity);

    setUpdatedItems((prevItems) => {
      // Find the maximum LineNum in current items
      const maxLineNum = prevItems.reduce(
        (max, item) => Math.max(max, item.LineNum),
        -1
      );

      // Include WarehouseCode here
      const newItem = {
        LineNum: maxLineNum + 1,
        ItemCode: currentItem.itemCode,
        ItemDescription: currentItem.itemName,
        Quantity: parseFloat(currentItem.quantity),
        Price: currentItem.UnitPrice,
        LineTotal: lineTotal,
        UOM: currentItem.UOM,
        UoMEntry: currentItem.UoMEntry,
        discountAmount: currentItem.discountAmount,
        discountPercent: currentItem.discountPercent,
        WarehouseCode: currentItem.warehouseCode, // Add Warehouse Code
        Operation: "A", // Mark as Added
      };

      return [...prevItems, newItem];
    });

    // Reset states
    setCurrentItem({
      itemCode: "",
      quantity: "",
      warehouseCode: "",
      discountAmount: 0,
      discountPercent: 0,
      itemName: "",
      UnitPrice: 0,
      UOM: "",
      UoMEntry: null,
    });
    setSelectedUom(null);
    setSearchQuery("");
    setStatusMessage("Item added successfully.");
    toast.success("Item added successfully.");
  };

  // Handle Quantity Change Function
  const handleQuantityChange = (lineNum, newQuantity) => {
    setUpdatedItems((prevItems) =>
      prevItems.map((item) =>
        item.LineNum === lineNum
          ? {
              ...item,
              Quantity: parseFloat(newQuantity),
              LineTotal:
                (item.Price - (item.discountAmount || 0)) *
                parseFloat(newQuantity),
            }
          : item
      )
    );
  };

  // Handle Discount Change Function
  const handleDiscountChange = (lineNum, discountAmount, discountPercent) => {
    setUpdatedItems((prevItems) =>
      prevItems.map((item) =>
        item.LineNum === lineNum
          ? {
              ...item,
              discountAmount,
              discountPercent,
              LineTotal: item.Quantity * (item.Price - discountAmount),
            }
          : item
      )
    );
  };

  // Handle Deleting an Item Function
  const handleDeleteItem = (lineNum) => {
    setUpdatedItems((prevItems) =>
      prevItems.map((item) =>
        item.LineNum === lineNum
          ? { ...item, Operation: "D" }
          : item
      )
    );
    setStatusMessage("Item marked for deletion.");
    toast.info("Item marked for deletion.");
  };

  // Handle Updating Quotation Function
  const handleUpdateQuotation = async () => {
    setStatusMessage("");
    try {
      const sessionId = await getSessionId();
      if (!sessionId) {
        throw new Error('Session ID not available.');
      }

      // Get the original lines
      const originalLines = quotation.DocumentLines || [];

      // Find deleted lines by comparing original lines with current items
      const deletedLineNums = originalLines
        .map((line) => line.LineNum)
        .filter(
          (lineNum) => !updatedItems.some((item) => item.LineNum === lineNum && item.Operation !== "D")
        );

      if (deletedLineNums.length > 0) {
        // Items have been removed; proceed to cancel and create a new quotation
        setLoading(true);
        setStatusMessage("Cancelling the current order...");
        toast.info("Cancelling the current order...");

        // 1. Cancel the current order
        const cancelResponse = await fetch('/api/cancelInvoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId, id }), // Pass sessionId and id
        });

        if (!cancelResponse.ok) {
          const errorData = await cancelResponse.json();
          throw new Error(errorData.message || 'Failed to cancel the order.');
        }

        setStatusMessage("order cancelled successfully. Creating a new order...");
        toast.success("order cancelled successfully.");

        // 2. Prepare data for the new order
        const newQuotationData = {
          // Map necessary fields from the original quotation
          CardCode: quotation.CardCode,
          Comments: newComments || quotation.Comments,
          DocumentLines: updatedItems
            .filter((item) => item.Operation !== "D")
            .map((item) => ({
              ItemCode: item.ItemCode,
              Quantity: item.Quantity,
              UoMEntry: item.UoMEntry,
              DiscountPercent: item.discountPercent || 0,
              WarehouseCode: item.WarehouseCode, // Ensure it's correctly set
              // Include other necessary fields as required
            })),
          DocDate: formatDate(quotation.DocDate), // Ensure correct date format
          DocDueDate: formatDate(quotation.DocDueDate),
          DocCurrency: quotation.DocCurrency || 'IQD', // Ensure currency is set
        };

        // Validate the newQuotationData before sending
        try {
          validateQuotationData(newQuotationData);
        } catch (validationError) {
          setStatusMessage(`Validation Error: ${validationError.message}`);
          toast.error(`Validation Error: ${validationError.message}`);
          return;
        }

        console.log("Creating new order with data:", JSON.stringify(newQuotationData, null, 2));

        // 3. Create the new quotation using the API endpoint
        const createResponse = await fetch('/api/createInvoice2', { // Ensure this path is correct
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId, quotationData: newQuotationData }), // Changed field name
        });

        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          throw new Error(errorData.message || 'Failed to create the new order.');
        }

        const createdQuotation = await createResponse.json();
        setStatusMessage("New order created successfully.");
        toast.success("New order created successfully.");

        // 4. Navigate to the new quotation's page
        router.push(`/invoicedetails/${createdQuotation.DocEntry}`);
      } else {
        // No items removed; proceed to update as usual
        setLoading(true);
        setStatusMessage("Updating the order...");
        toast.info("Updating the order...");

        // Prepare document lines excluding deleted lines
        const documentLines = updatedItems
          .filter((item) => item.Operation !== "D")
          .map((item) => ({
            LineNum: item.LineNum,
            ItemCode: item.ItemCode,
            Quantity: item.Quantity,
            UoMEntry: item.UoMEntry,
            DiscountPercent: item.discountPercent || 0,
            WarehouseCode: item.WarehouseCode,
            Operation: item.Operation || "",
          }));

        // Validate the updatedQuotation data
        const updatedQuotationData = {
          DocEntry: quotation.DocEntry,
          Comments: newComments || quotation.Comments,
          DocumentLines: documentLines,
          DocDate: formatDate(quotation.DocDate),
          DocDueDate: formatDate(quotation.DocDueDate),
          DocCurrency: quotation.DocCurrency || 'IQD',
        };

        try {
          validateQuotationData(updatedQuotationData);
        } catch (validationError) {
          setStatusMessage(`Validation Error: ${validationError.message}`);
          toast.error(`Validation Error: ${validationError.message}`);
          return;
        }

        console.log("Sending update:", JSON.stringify(updatedQuotationData, null, 2));

        const updateResponse = await fetch("/api/updateQuotation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            id: quotation.DocEntry,
            updatedQuotation: updatedQuotationData,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(errorData.details || updateResponse.statusText);
        }

        await fetchQuotationDetails();
        setStatusMessage("order updated successfully.");
        toast.success("order updated successfully.");
      }
    } catch (error) {
      setStatusMessage(`Failed to update order: ${error.message}`);
      toast.error(`Failed to update order: ${error.message}`);
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Convert to Invoice Function
  const handleConvertToInvoice = async () => {
    setConvertLoading(true);
    setStatusMessage("");
    try {
      const sessionId = await getSessionId();
      if (!sessionId) {
        throw new Error('Session ID not available.');
      }

      // Prepare invoiceData based on the current quotation
      const invoiceData = {
        CardCode: quotation.CardCode,
        Comments: newComments || quotation.Comments,
        DocDate: formatDate(new Date()),
        DocDueDate: formatDate(new Date()),
        DocCurrency: quotation.DocCurrency || 'IQD',
        DocumentLines: updatedItems
          .filter((item) => item.Operation !== "D")
          .map((item) => ({
            ItemCode: item.ItemCode,
            Quantity: item.Quantity,
            UnitPrice: item.Price, // Ensure this matches SAP's expected field
            DiscountPercent: item.discountPercent || 0,
            UoMEntry: item.UoMEntry,
            WarehouseCode: item.WarehouseCode,
            // Add other necessary fields if required
          })),
        // Include other necessary fields as per SAP's API documentation
      };

      // Validate the invoiceData before sending
      try {
        validateQuotationData(invoiceData); // Assuming similar validation applies
      } catch (validationError) {
        setStatusMessage(`Validation Error: ${validationError.message}`);
        toast.error(`Validation Error: ${validationError.message}`);
        return;
      }

      console.log("Invoice Data:", JSON.stringify(invoiceData, null, 2)); // For debugging purposes

      // Send POST request to createQuotation API
      const response = await fetch("/api/createInvoice2", { // Ensure this path is correct
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, quotationData: invoiceData }), // Changed field name
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message?.value || "Failed to create sale order.");
      }

      const invoiceResponse = await response.json();
      setStatusMessage(
        `Sale order created successfully with ID: ${invoiceResponse.DocEntry}`
      );
      toast.success(`Sale order created successfully with ID: ${invoiceResponse.DocEntry}`);

      // Optional: Redirect to the Invoice Page
      // e.g., router.push(`/invoices/${invoiceResponse.DocEntry}`);
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
      toast.error(`Error: ${error.message}`);
      console.error("Convert to sale order Error:", error);
    } finally {
      setConvertLoading(false);
    }
  };

  // Utility Functions

  // Format Date to YYYY-MM-DD
  const formatDate = (date) => {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  };

  // Validate Quotation Data
  const validateQuotationData = (data) => {
    if (!data.CardCode) throw new Error("CardCode is required.");
    if (!data.DocDate) throw new Error("DocDate is required.");
    if (!data.DocCurrency) throw new Error("DocCurrency is required.");
    if (!data.DocumentLines || data.DocumentLines.length === 0) throw new Error("At least one DocumentLine is required.");
    
    data.DocumentLines.forEach((line, index) => {
      if (!line.ItemCode) throw new Error(`ItemCode is required for DocumentLine ${index + 1}.`);
      if (!line.Quantity || line.Quantity <= 0) throw new Error(`Valid Quantity is required for DocumentLine ${index + 1}.`);
      if (!line.UoMEntry) throw new Error(`UoMEntry is required for DocumentLine ${index + 1}.`);
      // Add other necessary validations
    });
  };

  // Conditional Rendering Based on Loading and Error States
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="p-8">
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <h1 className="text-3xl font-bold mb-6">order Details</h1>

      {quotation && (
        <div className="bg-white p-6 rounded shadow mb-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold">General Information</h2>
            <p>
              <strong>DocEntry:</strong> {quotation.DocEntry}
            </p>
            <p>
              <strong>DocNum:</strong> {quotation.DocNum}
            </p>
            <p>
              <strong>Customer Name (CardName):</strong> {quotation.CardName}
            </p>
            <p>
              <strong>Document Date:</strong> {formatDate(quotation.DocDate)}
            </p>
            <p>
              <strong>Comments:</strong>{" "}
              {quotation.Comments || "No Comments"}
            </p>
          </div>

          <div className="mt-4">
            <textarea
              placeholder="Update comments"
              value={newComments}
              onChange={(e) => setNewComments(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      )}

      {/* Item Search Section */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add Item</h2>

        {/* Search Type Radio Buttons */}
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mr-4">
            Search by:
          </label>
          <label className="mr-4">
            <input
              type="radio"
              name="searchType"
              value="name"
              checked={searchType === "name"}
              onChange={(e) => setSearchType(e.target.value)}
              className="mr-2"
            />
            Item Name
          </label>
          <label className="mr-4">
            <input
              type="radio"
              name="searchType"
              value="code"
              checked={searchType === "code"}
              onChange={(e) => setSearchType(e.target.value)}
              className="mr-2"
            />
            Item Code
          </label>
          <label>
            <input
              type="radio"
              name="searchType"
              value="barcode"
              checked={searchType === "barcode"}
              onChange={(e) => setSearchType(e.target.value)}
              className="mr-2"
            />
            Barcode
          </label>
        </div>

        {/* Item Search Input */}
        <div className="relative mb-6" ref={itemInputRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-1 block w-full py-3 px-4 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Search Item or Scan Barcode"
          />

          {isItemDropListOpen && (
            <ul className="absolute z-10 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full shadow-lg">
              {isItemLoading && (
                <li className="flex justify-center items-center py-4">
                  <FaSpinner className="animate-spin text-gray-500" />
                </li>
              )}
              {!isItemLoading && searchResults.length === 0 && (
                <li className="px-4 py-3 text-gray-500">No items found</li>
              )}
              {!isItemLoading &&
                searchResults.map((item) => (
                  <li
                    key={`${item.ItemCode}-${item.UOM}`}
                    onClick={() => handleItemSelect(item)}
                    className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <div>
                        <span className="font-semibold text-gray-800">
                          {item.ItemName}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          ({item.ItemCode})
                        </span>
                      </div>
                      <div className="text-sm flex items-center flex-wrap mt-2 sm:mt-0">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                          <FaBox className="w-4 h-4 mr-1" />
                          <span className="font-medium">{item.OnHand}</span>
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                          <FaWarehouse className="w-4 h-4 mr-1" />
                          <span className="font-medium">{item.UOM}</span>
                        </span>
                        {/* Display the Warehouse Code */}
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                          <FaWarehouse className="w-4 h-4 mr-1" />
                          <span className="font-medium">{item.WhsCode}</span>
                        </span>
                        {/* Display the QTY if available */}
                        {item.QTY && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                            <FaWarehouse className="w-4 h-4 mr-1" />
                            <span className="font-medium">{item.QTY}</span>
                          </span>
                        )}
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full inline-flex items-center mr-2 mt-1">
                          <FaDollarSign className="w-4 h-4 mr-1" />
                          <span className="font-medium">{item.Price || item.UnitPrice}</span>
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Render Additional Inputs After Item Selection */}
        {currentItem.itemCode && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Quantity Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                value={currentItem.quantity}
                onChange={(e) =>
                  setCurrentItem({
                    ...currentItem,
                    quantity: e.target.value,
                  })
                }
                className="mt-1 block w-full py-3 px-4 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Quantity"
                min="0"
              />
            </div>

            {/* UOM Dropdown */}
            <div className="relative" ref={uomDropdownRef}>
              <label className="block text-sm font-medium text-gray-700">
                Unit of Measure
              </label>
              <button
                type="button"
                className="mt-1 block w-full py-3 px-4 rounded-md border border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm flex justify-between items-center"
                onClick={() => setIsUomDropdownOpen(!isUomDropdownOpen)}
              >
                {currentItem.UOM || "Select UOM"}
                <FaChevronDown className="ml-2" />
              </button>
              {isUomDropdownOpen && (
                <ul className="absolute z-20 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto w-full shadow-lg">
                  {uomOptions.map((uom, index) => (
                    <li
                      key={`${uom.UOM}-${uom.Price}-${index}`}
                      onClick={() => handleUomSelect(uom)}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0 flex justify-between items-center"
                    >
                      <span className="font-medium">{uom.UOM}</span>
                      <span className="text-sm text-gray-500">
                        {uom.Price ? `${uom.Price} IQD` : "Price Not Available"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Warehouse Code Display (Read-Only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Warehouse Code
              </label>
              <div className="mt-1 block w-full py-3 px-4 rounded-md border border-gray-300 bg-gray-50">
                {currentItem.warehouseCode || "N/A"}
              </div>
            </div>

            {/* Unit Price Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit Price
              </label>
              <div className="mt-1 block w-full py-3 px-4 rounded-md border border-gray-300 bg-gray-50">
                {currentItem.UnitPrice.toFixed(2)} IQD
              </div>
            </div>

            {/* Discount Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount
              </label>
              <div className="space-y-2">
                {/* Discount Amount */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaDollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={currentItem.discountAmount}
                    onChange={(e) => {
                      const discountAmount = parseFloat(e.target.value) || 0;
                      const discountPercent = currentItem.UnitPrice
                        ? (discountAmount / currentItem.UnitPrice) * 100
                        : 0;
                      setCurrentItem({
                        ...currentItem,
                        discountAmount,
                        discountPercent: parseFloat(discountPercent.toFixed(2)),
                      });
                    }}
                    className="block w-full pl-7 pr-12 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Amount"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-500 text-xs">
                    IQD
                  </div>
                </div>

                {/* Discount Percent */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaPercent className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={currentItem.discountPercent}
                    onChange={(e) => {
                      const discountPercent = parseFloat(e.target.value) || 0;
                      const discountAmount = currentItem.UnitPrice
                        ? (discountPercent / 100) * currentItem.UnitPrice
                        : 0;
                      setCurrentItem({
                        ...currentItem,
                        discountPercent,
                        discountAmount: parseFloat(discountAmount.toFixed(2)),
                      });
                    }}
                    className="block w-full pl-7 pr-8 py-2 rounded-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Percent"
                    min="0"
                    max="100"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-500 text-xs">
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Add Item Button */}
            <div className="flex items-end lg:col-span-5">
              <button
                onClick={handleAddItem}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 flex items-center"
              >
                <FaPlus className="mr-2" />
                Add Item
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Quotation Items Table */}
      <div className="mt-8">
  <h2 className="text-2xl font-bold mb-4">Order Items</h2>
  <div className="overflow-x-auto">
    <table className="w-full text-sm bg-white border rounded-lg">
      <thead>
        <tr className="bg-gray-200 text-gray-700">
          <th className="p-2 border">Code</th>
          <th className="p-2 border">Desc</th>
          <th className="p-2 border">Qty</th>
          <th className="p-2 border">UOM</th>
          <th className="p-2 border">WH</th>
          <th className="p-2 border">Price</th>
          <th className="p-2 border">Disc(IQD)</th>
          <th className="p-2 border">Disc(%)</th>
          <th className="p-2 border">Total</th>
          <th className="p-2 border"></th>
        </tr>
      </thead>
      <tbody>
        {updatedItems
          .filter((item) => item.Operation !== "D")
          .map((item) => (
            <tr key={item.LineNum} className="hover:bg-gray-50">
              <td className="p-2 border">{item.ItemCode}</td>
              <td className="p-2 border truncate max-w-xs">{item.ItemDescription}</td>
              <td className="p-2 border">
                <input
                  type="number"
                  value={item.Quantity}
                  onChange={(e) => handleQuantityChange(item.LineNum, e.target.value)}
                  className="w-12 p-1 border rounded"
                  min="0"
                />
              </td>
              <td className="p-2 border">{item.UOM || item.MeasureUnit || "N/A"}</td>
              <td className="p-2 border">{item.WarehouseCode || "N/A"}</td>
              <td className="p-2 border text-right">{item.Price.toFixed(2)}</td>
              <td className="p-2 border">
                <input
                  type="number"
                  value={item.discountAmount || ""}
                  onChange={(e) => {
                    const discountAmount = parseFloat(e.target.value) || 0;
                    const discountPercent = item.Price
                      ? (discountAmount / item.Price) * 100
                      : 0;
                    handleDiscountChange(
                      item.LineNum,
                      parseFloat(discountAmount.toFixed(2)),
                      parseFloat(discountPercent.toFixed(2))
                    );
                  }}
                  className="w-20 p-1 border rounded"
                  min="0"
                />
              </td>
              <td className="p-2 border">
                <input
                  type="number"
                  value={item.discountPercent || ""}
                  onChange={(e) => {
                    const discountPercent = parseFloat(e.target.value) || 0;
                    const discountAmount = item.Price
                      ? (discountPercent / 100) * item.Price
                      : 0;
                    handleDiscountChange(
                      item.LineNum,
                      parseFloat(discountAmount.toFixed(2)),
                      parseFloat(discountPercent.toFixed(2))
                    );
                  }}
                  className="w-16 p-1 border rounded"
                  min="0"
                  max="100"
                />
              </td>
              <td className="p-2 border text-right">{item.LineTotal.toFixed(2)}</td>
              <td className="p-2 border text-center">
                <button
                  onClick={() => handleDeleteItem(item.LineNum)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
</div>

      {/* Totals and Action Buttons Section */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  {updatedItems
                    .filter(item => item.Operation !== "D")
                    .reduce(
                      (sum, item) => sum + item.Price * item.Quantity,
                      0
                    )
                    .toFixed(2)}{" "}
                  IQD
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Discount:</span>
                <span>
                  {updatedItems
                    .filter(item => item.Operation !== "D")
                    .reduce(
                      (sum, item) =>
                        sum + (item.discountAmount || 0) * item.Quantity,
                      0
                    )
                    .toFixed(2)}{" "}
                  IQD
                </span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Amount:</span>
                <span>
                  {updatedItems
                    .filter(item => item.Operation !== "D")
                    .reduce((sum, item) => sum + item.LineTotal, 0)
                    .toFixed(2)}{" "}
                  IQD
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-4">
            {/* Update order Button */}
            <button
              onClick={handleUpdateQuotation}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center"
              disabled={loading} // Disable button when loading
            >
              <span className="mr-2">Update order</span>
              {loading && <FaSpinner className="animate-spin" />}
            </button>

            {/* Convert to Sale Order Button */}
            {/* <button
              onClick={handleConvertToInvoice}
              className={`bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center ${
                convertLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={convertLoading}
            >
              <span className="mr-2">Convert to Sale Order</span>
              {convertLoading && <FaSpinner className="animate-spin" />}
            </button> */}
          </div>
        </div>
      </div>

      {/* Status Message Display */}
      {statusMessage && (
        <div
          className={`mt-4 text-center ${
            statusMessage.startsWith("Error") ||
            statusMessage.startsWith("Failed") ||
            statusMessage.startsWith("Validation Error")
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}

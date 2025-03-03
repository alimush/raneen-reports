"use client";
import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSpinner, FaCalendar, FaChartBar, FaList, FaClock, FaDollarSign, FaSearch, FaChevronDown } from 'react-icons/fa';
import { usePermission } from '../../../context/PermissionContext';
import NotAuth from "../components/NotAuth";
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dialog, Transition } from '@headlessui/react';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import CustomAwesomeButton from '../components/CustomAwesomeButton';

const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const apiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('apiUrl') : null;
  

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];


const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onSubmit }) => (
  <motion.div 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="flex flex-wrap items-end space-x-4 mb-6 bg-white p-4 rounded-lg shadow-md"
  >
    <div className="flex flex-col">
      <label htmlFor="startDate" className="mb-1 text-sm font-medium text-gray-700">Start Date</label>
      <input
        type="date"
        id="startDate"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <div className="flex flex-col">
      <label htmlFor="endDate" className="mb-1 text-sm font-medium text-gray-700">End Date</label>
      <input
        type="date"
        id="endDate"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSubmit}
      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 flex items-center"
    >
      <FaSearch className="mr-2" />
      Apply Filter
    </motion.button>
  </motion.div>
);

const StatusCard = ({ title, value, icon: Icon }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <Icon className="text-2xl text-blue-500" />
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
  </motion.div>
);

const OrderList = ({ orders, onViewDetails }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="bg-white shadow-md rounded-lg overflow-hidden"
  >
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {['Order ID', 'Customer', 'Created At', 'Status', 'Actions'].map((header) => (
            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.tr 
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  order.workflowStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                  order.workflowStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {order.workflowStatus}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onViewDetails(order)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  View Details
                </motion.button>
              </td>
            </motion.tr>
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  </motion.div>
);

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;

    let timer = setInterval(() => {
      start += 1;
      setDisplayValue(start);
      if (start === end) clearInterval(timer);
    }, 20);

    return () => {
      clearInterval(timer);
    };
  }, [value]);

  return <span>{displayValue}</span>;
};

const AnimatedStatusCard = ({ title, value, icon: Icon, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <Icon className="text-2xl text-blue-500" />
    </div>
    <motion.p 
      className="text-3xl font-bold text-gray-900"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 100, delay: delay + 0.2 }}
    >
      {value}
    </motion.p>
  </motion.div>
);

const ExpandableOrderList = ({ status, orders, onViewDetails }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-md rounded-lg overflow-hidden mt-6"
    >
      <motion.div 
        className="p-4 bg-gray-50 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-xl font-semibold">{status} Orders ({orders.length})</h2>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaChevronDown />
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <OrderList orders={orders} onViewDetails={onViewDetails} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.status}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${value} orders`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const Chart = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const chartData = data.map(item => ({
    status: item.status,
    count: item.count,
    percentage: (item.count / data.reduce((sum, curr) => sum + curr.count, 0) * 100).toFixed(2)
  }));

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white rounded-lg shadow-md p-6"
    >
      <div className="h-80">
        <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Order Count" />
            <Bar yAxisId="right" dataKey="percentage" fill="#82ca9d" name="Percentage (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-80">
        <h3 className="text-lg font-semibold mb-4">Order Status Pie Chart</h3>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              onMouseEnter={onPieEnter}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              content={({ payload }) => (
                <ul className="flex flex-wrap justify-center">
                  {payload.map((entry, index) => (
                    <li key={`item-${index}`} className="flex items-center mx-2">
                      <svg width="10" height="10" className="mr-1">
                        <rect width="10" height="10" fill={entry.color} />
                      </svg>
                      <span className="text-sm">{entry.value}: {chartData[index].count} ({chartData[index].percentage}%)</span>
                    </li>
                  ))}
                </ul>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default function Fulfillment_Report() {
  const { hasPermission: canViewFulfillmentReport, loading: loadingPermission } = usePermission('Fulfillment_Report');
  const router = useRouter();
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fulfillmentData, setFulfillmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleReturn = () => {
    router.back();
  };

  const fetchFulfillmentData = async () => {
    setLoading(true);
    try {
        // Convert dates to start of the day for startDate and end of the day for endDate
        const formattedStartDate = `${startDate}T00:00:00Z`; // Start of the day
        const formattedEndDate = `${endDate}T23:59:59Z`; // End of the day

        const response = await axios.get(`${apiUrl}Reports/api/reports/order-fulfillment?startDate=${formattedStartDate}&endDate=${formattedEndDate}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        setFulfillmentData(response.data);
        console.log(response)
    } catch (error) {
        toast.error('Error fetching fulfillment data');
    } finally {
        setLoading(false);
    }
};

  useEffect(() => {
    if (canViewFulfillmentReport) {
      fetchFulfillmentData();
    }
  }, [canViewFulfillmentReport]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  if (loadingPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <FaSpinner className="text-4xl text-blue-500" />
        </motion.div>
      </div>
    );
  }

  if (!canViewFulfillmentReport) {
    return <NotAuth />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto p-8 bg-gray-100 text-gray-900 min-h-screen"
    >
      <ToastContainer position="top-right" autoClose={3000} />
      <LayoutGroup>
        <div className="max-w-7xl mx-auto">
          <motion.div 
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-between items-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-800">Fulfillment Report</h1>
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
          </motion.div>

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onSubmit={fetchFulfillmentData}
          />

          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center items-center h-64"
            >
              <FaSpinner className="animate-spin text-4xl text-blue-500" />
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <AnimatedStatusCard 
                    title="Total Orders" 
                    value={<AnimatedNumber value={fulfillmentData.reduce((acc, curr) => acc + curr.count, 0)} />} 
                    icon={FaList}
                    delay={0.1}
                  />
                  <AnimatedStatusCard 
                    title="Average Fulfillment Time" 
                    value={`${(fulfillmentData.reduce((acc, curr) => acc + curr.averageFulfillmentTime * curr.count, 0) / fulfillmentData.reduce((acc, curr) => acc + curr.count, 0)).toFixed(2)} hours`} 
                    icon={FaClock}
                    delay={0.2}
                  />
                  <AnimatedStatusCard 
                    title="Total Value" 
                    value={`$${fulfillmentData.reduce((acc, curr) => acc + curr.totalValue, 0).toFixed(2)}`} 
                    icon={FaDollarSign}
                    delay={0.3}
                  />
                  <AnimatedStatusCard 
                    title="Average Order Value" 
                    value={`$${(fulfillmentData.reduce((acc, curr) => acc + curr.totalValue, 0) / fulfillmentData.reduce((acc, curr) => acc + curr.count, 0)).toFixed(2)}`} 
                    icon={FaChartBar}
                    delay={0.4}
                  />
                </div>

                <Chart data={fulfillmentData} />

                {fulfillmentData.map((status, index) => (
                  <ExpandableOrderList 
                    key={status.status}
                    status={status.status}
                    orders={status.orders}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </LayoutGroup>

      <Transition appear show={!!selectedOrder} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setSelectedOrder(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    Order Details
                  </Dialog.Title>
                  <div className="mt-2 space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">Order ID:</span>
                      <span className="text-sm text-gray-900">{selectedOrder?.orderId}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">Customer:</span>
                      <span className="text-sm text-gray-900">{selectedOrder?.customer}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">Created At:</span>
                      <span className="text-sm text-gray-900">{new Date(selectedOrder?.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                        selectedOrder?.workflowStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                        selectedOrder?.workflowStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{selectedOrder?.workflowStatus}</span>
                    </div>
                    <div>
  <h4 className="text-md font-medium mb-2">Order Summary:</h4>
  <ul className="space-y-2">
    {selectedOrder?.items.length > 0 && (
      <li className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
        <span className="text-sm text-gray-900">Total Delivered Quantity:</span>
        <span className="text-sm font-medium text-gray-500">
          {selectedOrder.items.reduce((acc, item) => acc + item.deliveredQuantity, 0)}
        </span>
      </li>
    )}
    {selectedOrder?.items.length > 0 && (
      <li className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
        <span className="text-sm text-gray-900">Total Cancelled Quantity:</span>
        <span className="text-sm font-medium text-gray-500">
          {selectedOrder.items.reduce((acc, item) => acc + item.cancelledQuantity, 0)}
        </span>
      </li>
    )}
  </ul>
</div>

                  </div>

                  <div className="mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Close
                    </motion.button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </motion.div>
  );
}
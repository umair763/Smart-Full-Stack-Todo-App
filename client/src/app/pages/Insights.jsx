'use client';

import { useState, useEffect } from 'react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Use the consistent API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function Insights() {
   const [filter, setFilter] = useState('weekly');
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [stats, setStats] = useState([]);
   const [totalTasks, setTotalTasks] = useState(0);
   const [completedTasks, setCompletedTasks] = useState(0);
   const [pendingTasks, setPendingTasks] = useState(0);

   useEffect(() => {
      fetchTaskStats();
   }, [filter]);

   const fetchTaskStats = async () => {
      setLoading(true);
      setError('');

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${API_BASE_URL}/api/tasks/stats?period=${filter}`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch task statistics');
         }

         const data = await response.json();

         // For demonstration purposes, generate some sample data if the API doesn't return formatted data
         const formattedData = data.stats || generateSampleData(filter);
         setStats(formattedData);

         // Set summary statistics
         setTotalTasks(data.totalTasks || formattedData.reduce((sum, item) => sum + item.total, 0));
         setCompletedTasks(data.completedTasks || formattedData.reduce((sum, item) => sum + item.completed, 0));
         setPendingTasks(
            data.pendingTasks || formattedData.reduce((sum, item) => sum + (item.total - item.completed), 0)
         );
      } catch (err) {
         console.error('Error fetching task stats:', err);
         setError(err.message || 'An error occurred while fetching task statistics');

         // For demonstration, generate sample data even on error
         const sampleData = generateSampleData(filter);
         setStats(sampleData);
         setTotalTasks(sampleData.reduce((sum, item) => sum + item.total, 0));
         setCompletedTasks(sampleData.reduce((sum, item) => sum + item.completed, 0));
         setPendingTasks(sampleData.reduce((sum, item) => sum + (item.total - item.completed), 0));
      } finally {
         setLoading(false);
      }
   };

   // Helper function to generate sample data for demonstration
   const generateSampleData = (period) => {
      let data = [];

      switch (period) {
         case 'weekly':
            data = [
               { name: 'Mon', total: 4, completed: 2 },
               { name: 'Tue', total: 6, completed: 4 },
               { name: 'Wed', total: 5, completed: 3 },
               { name: 'Thu', total: 7, completed: 5 },
               { name: 'Fri', total: 8, completed: 7 },
               { name: 'Sat', total: 3, completed: 2 },
               { name: 'Sun', total: 2, completed: 1 },
            ];
            break;
         case 'monthly':
            data = [
               { name: 'Week 1', total: 12, completed: 8 },
               { name: 'Week 2', total: 16, completed: 10 },
               { name: 'Week 3', total: 14, completed: 9 },
               { name: 'Week 4', total: 18, completed: 13 },
            ];
            break;
         case 'yearly':
            data = [
               { name: 'Jan', total: 28, completed: 20 },
               { name: 'Feb', total: 32, completed: 25 },
               { name: 'Mar', total: 40, completed: 30 },
               { name: 'Apr', total: 35, completed: 28 },
               { name: 'May', total: 42, completed: 32 },
               { name: 'Jun', total: 38, completed: 30 },
               { name: 'Jul', total: 45, completed: 35 },
               { name: 'Aug', total: 50, completed: 40 },
               { name: 'Sep', total: 44, completed: 32 },
               { name: 'Oct', total: 48, completed: 38 },
               { name: 'Nov', total: 52, completed: 42 },
               { name: 'Dec', total: 40, completed: 30 },
            ];
            break;
         default:
            data = [
               { name: 'Mon', total: 4, completed: 2 },
               { name: 'Tue', total: 6, completed: 4 },
               { name: 'Wed', total: 5, completed: 3 },
               { name: 'Thu', total: 7, completed: 5 },
               { name: 'Fri', total: 8, completed: 7 },
               { name: 'Sat', total: 3, completed: 2 },
               { name: 'Sun', total: 2, completed: 1 },
            ];
      }

      return data;
   };

   if (loading) {
      return (
         <div className="w-11/12 p-5 rounded-xl shadow-lg bg-gradient-to-br from-[#9406E6] to-[#00FFFF] grid grid-cols-1 gap-4">
            <div className="flex items-center justify-center h-96">
               <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
         </div>
      );
   }

   return (
      <div className="container mx-auto p-4 max-w-6xl w-full rounded-xl shadow-lg bg-gradient-to-br from-[#9406E6] to-[#00FFFF] flex flex-col gap-6">
         <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Task Insights</h1>
            <p className="text-white/70">View your task completion statistics and track your productivity.</p>
         </div>

         {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500 text-red-100 px-6 py-4 rounded-xl mb-6">
               {error}
            </div>
         )}

         {/* Filter controls */}
         <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
               <div className="bg-[#9406E6]/20 p-3 rounded-full">
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     className="h-6 w-6 text-[#9406E6]"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                     />
                  </svg>
               </div>
               <h2 className="text-xl font-bold text-white">Task Completion</h2>
            </div>

            <div className="relative">
               <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-white/10 backdrop-blur-sm text-white px-4 py-2 pr-10 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#9406E6] cursor-pointer"
               >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
               </select>
               <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                     xmlns="http://www.w3.org/2000/svg"
                     className="h-5 w-5 text-white"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                  >
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
               </div>
            </div>
         </div>

         {/* Stats summary cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
               <div className="flex items-center mb-3">
                  <div className="bg-purple-500/20 p-2 rounded-full mr-3">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-purple-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                     </svg>
                  </div>
                  <h3 className="text-white font-medium">Total Tasks</h3>
               </div>
               <div className="text-3xl font-bold text-white">{totalTasks}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
               <div className="flex items-center mb-3">
                  <div className="bg-green-500/20 p-2 rounded-full mr-3">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                  </div>
                  <h3 className="text-white font-medium">Completed</h3>
               </div>
               <div className="text-3xl font-bold text-white">{completedTasks}</div>
               <div className="text-white/60 text-sm mt-1">
                  {totalTasks > 0
                     ? `${Math.round((completedTasks / totalTasks) * 100)}% completion rate`
                     : '0% completion rate'}
               </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
               <div className="flex items-center mb-3">
                  <div className="bg-yellow-500/20 p-2 rounded-full mr-3">
                     <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-yellow-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                     >
                        <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                     </svg>
                  </div>
                  <h3 className="text-white font-medium">Pending</h3>
               </div>
               <div className="text-3xl font-bold text-white">{pendingTasks}</div>
            </div>
         </div>

         {/* Chart card */}
         <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
            {loading ? (
               <div className="flex items-center justify-center h-80">
                  <div className="flex flex-col items-center">
                     <svg
                        className="animate-spin h-10 w-10 text-[#9406E6] mb-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                     >
                        <circle
                           className="opacity-25"
                           cx="12"
                           cy="12"
                           r="10"
                           stroke="currentColor"
                           strokeWidth="4"
                        ></circle>
                        <path
                           className="opacity-75"
                           fill="currentColor"
                           d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                     </svg>
                     <span className="text-white">Loading statistics...</span>
                  </div>
               </div>
            ) : (
               <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart
                        data={stats}
                        margin={{
                           top: 5,
                           right: 30,
                           left: 20,
                           bottom: 5,
                        }}
                     >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                        <YAxis stroke="rgba(255,255,255,0.5)" />
                        <Tooltip
                           contentStyle={{
                              backgroundColor: 'rgba(23, 27, 43, 0.8)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '0.5rem',
                              color: 'white',
                           }}
                        />
                        <Legend />
                        <Line
                           type="monotone"
                           dataKey="total"
                           stroke="#9406E6"
                           strokeWidth={2}
                           activeDot={{ r: 8 }}
                           name="Total Tasks"
                        />
                        <Line
                           type="monotone"
                           dataKey="completed"
                           stroke="#00FFFF"
                           strokeWidth={2}
                           activeDot={{ r: 6 }}
                           name="Completed Tasks"
                        />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            )}
         </div>
      </div>
   );
}

export default Insights;

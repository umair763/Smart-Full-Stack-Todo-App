'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';
import {
   LineChart,
   Line,
   XAxis,
   YAxis,
   CartesianGrid,
   Tooltip,
   Legend,
   ResponsiveContainer,
   PieChart,
   Pie,
   Cell,
   BarChart,
   Bar,
   Area,
   AreaChart,
} from 'recharts';
import {
   HiChartBar,
   HiChartPie,
   HiTrendingUp,
   HiClock,
   HiCheckCircle,
   HiExclamationCircle,
   HiCalendar,
   HiFilter,
   HiRefresh,
   HiEye,
   HiStar,
   HiLightningBolt,
} from 'react-icons/hi';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

// Color palette for charts
const COLORS = {
   primary: '#9406E6',
   secondary: '#00FFFF',
   success: '#10B981',
   warning: '#F59E0B',
   danger: '#EF4444',
   info: '#3B82F6',
   purple: '#8B5CF6',
   pink: '#EC4899',
   indigo: '#6366F1',
   teal: '#14B8A6',
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.purple];

function Insights() {
   const [filter, setFilter] = useState('week');
   const [viewMode, setViewMode] = useState('overview'); // overview, detailed, trends
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [refreshing, setRefreshing] = useState(false);

   // Real data states - no dummy data
   const [stats, setStats] = useState([]);
   const [totalTasks, setTotalTasks] = useState(0);
   const [completedTasks, setCompletedTasks] = useState(0);
   const [pendingTasks, setPendingTasks] = useState(0);
   const [overdueTasks, setOverdueTasks] = useState(0);
   const [completionRate, setCompletionRate] = useState(0);

   // Enhanced data states from streak system
   const [priorityDistribution, setPriorityDistribution] = useState([]);
   const [weeklyTrends, setWeeklyTrends] = useState([]);
   const [productivityScore, setProductivityScore] = useState(0);
   const [streakData, setStreakData] = useState({ current: 0, longest: 0 });
   const [streakMetrics, setStreakMetrics] = useState({});

   const { token } = useAuth();
   const navigate = useNavigate();

   useEffect(() => {
      if (!token) {
         navigate('/login');
         return;
      }

      fetchAllData();
   }, [token, filter]);

   const fetchAllData = async (isRefresh = false) => {
      if (isRefresh) {
         setRefreshing(true);
      } else {
         setLoading(true);
      }
      setError('');

      try {
         const headers = {
            Authorization: `Bearer ${token}`,
         };

         // Fetch all data in parallel
         const [statsResponse, streakResponse, analyticsResponse] = await Promise.all([
            fetch(`${BACKEND_URL}/api/tasks/stats?period=${filter}`, { headers }),
            fetch(`${BACKEND_URL}/api/streaks`, { headers }),
            fetch(`${BACKEND_URL}/api/streaks/analytics?period=${filter}`, { headers }),
         ]);

         if (!statsResponse.ok || !streakResponse.ok || !analyticsResponse.ok) {
            throw new Error('Failed to fetch data');
         }

         const [statsData, streakDataResponse, analyticsData] = await Promise.all([
            statsResponse.json(),
            streakResponse.json(),
            analyticsResponse.json(),
         ]);

         // Debug logging (only in development)
         if (process.env.NODE_ENV === 'development') {
            console.log('Stats Data for', filter, ':', statsData);
            console.log('Time Stats:', statsData.timeStats);
         }

         // Process basic stats
         setTotalTasks(statsData.totalTasks || 0);
         setCompletedTasks(statsData.completedTasks || 0);
         setPendingTasks(statsData.pendingTasks || 0);
         setOverdueTasks(statsData.overdueTasks || 0);
         setCompletionRate(statsData.completionRate || 0);

         // Process priority distribution
         const priorities = statsData.priorityDistribution || {};
         setPriorityDistribution([
            {
               name: 'High Priority',
               value: priorities.High?.total || 0,
               color: COLORS.danger,
               completed: priorities.High?.completed || 0,
            },
            {
               name: 'Medium Priority',
               value: priorities.Medium?.total || 0,
               color: COLORS.warning,
               completed: priorities.Medium?.completed || 0,
            },
            {
               name: 'Low Priority',
               value: priorities.Low?.total || 0,
               color: COLORS.success,
               completed: priorities.Low?.completed || 0,
            },
         ]);

         // Process time-based stats with fallback data
         let timeStatsData = statsData.timeStats || [];

         // If no data, create empty structure based on period
         if (timeStatsData.length === 0) {
            const currentDate = new Date();

            if (filter === 'weekly') {
               // Create 7 days of empty data
               for (let i = 6; i >= 0; i--) {
                  const date = new Date(currentDate);
                  date.setDate(date.getDate() - i);
                  timeStatsData.push({
                     name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                     fullDate: date.toLocaleDateString('en-GB'),
                     total: 0,
                     completed: 0,
                     pending: 0,
                  });
               }
            } else if (filter === 'monthly') {
               // Create 4 weeks of empty data
               for (let i = 3; i >= 0; i--) {
                  const weekEnd = new Date(currentDate);
                  weekEnd.setDate(weekEnd.getDate() - i * 7);
                  const weekStart = new Date(weekEnd);
                  weekStart.setDate(weekStart.getDate() - 6);

                  timeStatsData.push({
                     name: `Week ${4 - i}`,
                     fullDate: `${weekStart.toLocaleDateString('en-GB')} - ${weekEnd.toLocaleDateString('en-GB')}`,
                     total: 0,
                     completed: 0,
                     pending: 0,
                  });
               }
            } else if (filter === 'yearly') {
               // Create 12 months of empty data
               for (let i = 11; i >= 0; i--) {
                  const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                  timeStatsData.push({
                     name: monthDate.toLocaleDateString('en-US', { month: 'short' }),
                     fullDate: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                     total: 0,
                     completed: 0,
                     pending: 0,
                  });
               }
            }
         }

         // Ensure all data points have required fields
         timeStatsData = timeStatsData.map((item) => ({
            name: item.name || 'Unknown',
            fullDate: item.fullDate || item.name,
            total: item.total || 0,
            completed: item.completed || 0,
            pending: item.pending || item.total - item.completed || 0,
         }));

         if (process.env.NODE_ENV === 'development') {
            console.log('Processed Time Stats:', timeStatsData);
         }
         setStats(timeStatsData);

         // Process streak data
         setStreakData({
            current: streakDataResponse.currentStreak?.count || 0,
            longest: streakDataResponse.longestStreak?.count || 0,
            isActive: streakDataResponse.isStreakActive || false,
            daysSinceLastActivity: streakDataResponse.daysSinceLastActivity,
         });

         setProductivityScore(streakDataResponse.productivityScore || 0);
         setStreakMetrics(analyticsData.metrics || {});

         // Process weekly trends
         setWeeklyTrends(analyticsData.weeklyTrends || []);
      } catch (err) {
         console.error('Error fetching data:', err);
         setError(err.message || 'An error occurred while fetching data');

         // Reset to empty state instead of dummy data
         setTotalTasks(0);
         setCompletedTasks(0);
         setPendingTasks(0);
         setOverdueTasks(0);
         setCompletionRate(0);
         setProductivityScore(0);
         setStreakData({ current: 0, longest: 0 });
         setPriorityDistribution([]);
         setStats([]);
         setWeeklyTrends([]);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   const handleRefresh = () => {
      fetchAllData(true);
   };

   const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
         const data = payload[0].payload;
         return (
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
               <p className="font-semibold text-gray-800 mb-1">{data.fullDate || label}</p>
               {payload.map((entry, index) => (
                  <p key={index} className="text-xs" style={{ color: entry.color }}>
                     {entry.name}: {entry.value}
                  </p>
               ))}
            </div>
         );
      }
      return null;
   };

   const StatCard = ({ icon: Icon, title, value, subtitle, color, trend, formula }) => (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-white/30 transition-all duration-300 hover:transform hover:scale-105 group">
         <div className={`flex items-center justify-between mb-2`}>
            <div
               className={`p-2 rounded-lg bg-gradient-to-br ${color} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
            >
               <Icon className="h-4 w-4 text-white" />
            </div>
            {trend !== undefined && (
               <div
                  className={`flex items-center text-xs ${
                     trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}
               >
                  <HiTrendingUp className={`h-3 w-3 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
                  {Math.abs(trend)}%
               </div>
            )}
         </div>
         <div className="text-2xl font-bold text-white mb-1">{value}</div>
         <div className="text-white/70 text-xs">{title}</div>
         {subtitle && <div className="text-white/50 text-xs mt-1">{subtitle}</div>}
         {formula && <div className="text-white/40 text-xs mt-1 italic">{formula}</div>}
      </div>
   );

   if (loading) {
      return (
         <div className="w-11/12 h-[90vh] p-6 mx-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col overflow-hidden rounded-xl">
            <div className="flex items-center justify-center h-full">
               <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                     <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200"></div>
                     <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-purple-600 absolute top-0 left-0"></div>
                  </div>
                  <div className="text-white text-lg font-medium">Loading insights...</div>
                  <div className="text-white/60 text-sm">Analyzing your productivity data</div>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
         <nav className="bg-white dark:bg-gray-800 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
               <div className="flex justify-between h-16">
                  <div className="flex items-center">
                     <h1 className="text-xl font-bold text-gray-900 dark:text-white">Insights</h1>
                  </div>
                  <div className="flex items-center space-x-4">
                     <ThemeToggle />
                     <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md px-3 py-2"
                     >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                     </select>
                  </div>
               </div>
            </div>
         </nav>

         <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
               <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Task Completion Chart */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                     <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Task Completion</h2>
                     <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={stats}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line
                                 type="monotone"
                                 dataKey="completed"
                                 stroke={COLORS.success}
                                 name="Completed Tasks"
                              />
                              <Line type="monotone" dataKey="total" stroke={COLORS.primary} name="Total Tasks" />
                           </LineChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Streak Chart */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                     <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Streak Progress</h2>
                     <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={streakMetrics}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="streak" fill={COLORS.secondary} name="Current Streak" />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  {/* Stats Overview */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                     <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Task Statistics</h2>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</p>
                           <p className="text-2xl font-semibold text-gray-900 dark:text-white">{completionRate}%</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
                           <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalTasks}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</p>
                           <p className="text-2xl font-semibold text-gray-900 dark:text-white">{completedTasks}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                           <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
                           <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                              {streakData.current} days
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Productivity Score */}
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                     <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Productivity Score</h2>
                     <div className="flex items-center justify-center h-48">
                        <div className="relative">
                           <svg className="w-32 h-32">
                              <circle
                                 className="text-gray-200 dark:text-gray-700"
                                 strokeWidth="8"
                                 stroke="currentColor"
                                 fill="transparent"
                                 r="56"
                                 cx="64"
                                 cy="64"
                              />
                              <circle
                                 className="text-blue-600"
                                 strokeWidth="8"
                                 strokeDasharray={352}
                                 strokeDashoffset={352 - (352 * productivityScore) / 100}
                                 strokeLinecap="round"
                                 stroke="currentColor"
                                 fill="transparent"
                                 r="56"
                                 cx="64"
                                 cy="64"
                              />
                           </svg>
                           <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                 {productivityScore}%
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}

export default Insights;

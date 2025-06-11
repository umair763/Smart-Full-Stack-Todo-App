'use client';

import { useState, useEffect } from 'react';
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
   const [filter, setFilter] = useState('weekly');
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

   useEffect(() => {
      fetchAllData();
   }, [filter]);

   const fetchAllData = async (isRefresh = false) => {
      if (isRefresh) {
         setRefreshing(true);
      } else {
         setLoading(true);
      }
      setError('');

      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
         };

         // Fetch all data in parallel
         const [statsResponse, streakResponse, analyticsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/tasks/stats?period=${filter}`, { headers }),
            fetch(`${API_BASE_URL}/api/streaks`, { headers }),
            fetch(`${API_BASE_URL}/api/streaks/analytics?period=${filter}`, { headers }),
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
      <div
         className="w-11/12 p-6 mx-auto bg-gradient-to-br from-slate-900/80 via-purple-900/80 to-slate-900/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 flex flex-col overflow-hidden rounded-xl">
         <div className="flex flex-col h-full space-y-4 overflow-hidden">
            {/* Compact Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 flex-shrink-0">
               <div className="space-y-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 font-proza">
                     <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                        <HiChartBar className="h-6 w-6 text-white" />
                     </div>
                     Task Insights
                  </h1>
                  <p className="text-white/70 text-sm">Real-time analytics and productivity tracking</p>
               </div>

               <div className="flex flex-col sm:flex-row gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                     {['overview', 'detailed', 'trends'].map((mode) => (
                        <button
                           key={mode}
                           onClick={() => setViewMode(mode)}
                           className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 capitalize ${
                              viewMode === mode
                                 ? 'bg-white text-purple-600 shadow-md'
                                 : 'text-white/70 hover:text-white hover:bg-white/10'
                           }`}
                        >
                           {mode}
                        </button>
                     ))}
                  </div>

                  {/* Time Filter */}
                  <div className="relative">
                     <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="mt-1 appearance-none bg-white/40 backdrop-blur-sm text-gray-950 px-3 py-1.5 pr-8 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer text-xs"
                     >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                     </select>
                     <HiFilter className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none" />
                  </div>

                  {/* Refresh Button */}
                  <button
                     onClick={handleRefresh}
                     disabled={refreshing}
                     className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl text-xs"
                  >
                     <HiRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                     <span className="hidden sm:inline">Refresh</span>
                  </button>
               </div>
            </div>

            {/* Error Message */}
            {error && (
               <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-100 px-4 py-3 rounded-lg flex-shrink-0">
                  <div className="flex items-center gap-2">
                     <HiExclamationCircle className="h-5 w-5 text-red-400" />
                     <div>
                        <div className="font-medium text-sm">Error loading data</div>
                        <div className="text-xs text-red-200">{error}</div>
                     </div>
                  </div>
               </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
               {/* Overview Mode */}
               {viewMode === 'overview' && (
                  <>
                     {/* Key Metrics Grid */}
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <StatCard
                           icon={HiChartBar}
                           title="Total Tasks"
                           value={totalTasks}
                           color="from-purple-500 to-indigo-600"
                           formula="Count of all tasks"
                        />
                        <StatCard
                           icon={HiCheckCircle}
                           title="Completed"
                           value={completedTasks}
                           subtitle={`${Math.round(completionRate)}% completion rate`}
                           color="from-green-500 to-emerald-600"
                           formula="(Completed ÷ Total) × 100"
                        />
                        <StatCard
                           icon={HiClock}
                           title="Pending"
                           value={pendingTasks}
                           color="from-yellow-500 to-orange-600"
                           formula="Total - Completed"
                        />
                        <StatCard
                           icon={HiExclamationCircle}
                           title="Overdue"
                           value={overdueTasks}
                           color="from-red-500 to-pink-600"
                           formula="Past due date & incomplete"
                        />
                     </div>

                     {/* Charts Grid */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Task Completion Trend */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-proza">
                                 <HiTrendingUp className="h-5 w-5 text-purple-400" />
                                 Completion Trends
                              </h3>
                              <div className="text-xs text-white/60 capitalize">{filter} view</div>
                           </div>
                           <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                 <AreaChart key={`${filter}-${stats.length}`} data={stats}>
                                    <defs>
                                       <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.8} />
                                          <stop offset="95%" stopColor={COLORS.success} stopOpacity={0.1} />
                                       </linearGradient>
                                       <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8} />
                                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1} />
                                       </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                       dataKey="name"
                                       stroke="rgba(255,255,255,0.7)"
                                       fontSize={10}
                                       interval={0}
                                       angle={filter === 'weekly' ? 0 : -45}
                                       textAnchor={filter === 'weekly' ? 'middle' : 'end'}
                                       height={filter === 'weekly' ? 30 : 60}
                                    />
                                    <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} domain={[0, 'dataMax + 1']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Area
                                       type="monotone"
                                       dataKey="total"
                                       stroke={COLORS.primary}
                                       fillOpacity={1}
                                       fill="url(#totalGradient)"
                                       name="Total Tasks"
                                       strokeWidth={2}
                                    />
                                    <Area
                                       type="monotone"
                                       dataKey="completed"
                                       stroke={COLORS.success}
                                       fillOpacity={1}
                                       fill="url(#completedGradient)"
                                       name="Completed"
                                       strokeWidth={2}
                                    />
                                 </AreaChart>
                              </ResponsiveContainer>
                           </div>
                        </div>

                        {/* Priority Distribution */}
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-proza">
                                 <HiChartPie className="h-5 w-5 text-indigo-400" />
                                 Priority Distribution
                              </h3>
                           </div>
                           <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie
                                       data={priorityDistribution}
                                       cx="50%"
                                       cy="50%"
                                       innerRadius={40}
                                       outerRadius={80}
                                       paddingAngle={5}
                                       dataKey="value"
                                    >
                                       {priorityDistribution.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.color} />
                                       ))}
                                    </Pie>
                                    <Tooltip
                                       contentStyle={{
                                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                          border: 'none',
                                          borderRadius: '8px',
                                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                          fontSize: '12px',
                                       }}
                                    />
                                    <Legend />
                                 </PieChart>
                              </ResponsiveContainer>
                           </div>
                        </div>
                     </div>

                     {/* Productivity Score & Streaks */}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg">
                                 <HiLightningBolt className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold text-white font-proza">Productivity Score</h3>
                                 <p className="text-white/60 text-xs">Weekly avg × 40% + Monthly avg × 30% + Bonuses</p>
                              </div>
                           </div>
                           <div className="text-3xl font-bold text-white mb-2">{productivityScore}/100</div>
                           <div className="w-full bg-white/20 rounded-full h-2">
                              <div
                                 className="bg-gradient-to-r from-yellow-500 to-orange-600 h-2 rounded-full transition-all duration-1000"
                                 style={{ width: `${productivityScore}%` }}
                              ></div>
                           </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                 <HiStar className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold text-white font-proza">Current Streak</h3>
                                 <p className="text-white/60 text-xs">Consecutive days with ≥50% completion</p>
                              </div>
                           </div>
                           <div className="text-3xl font-bold text-white">{streakData.current}</div>
                           <div className="text-white/60 text-xs">
                              {streakData.isActive
                                 ? 'Active streak'
                                 : `${streakData.daysSinceLastActivity || 0} days ago`}
                           </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                 <HiStar className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                 <h3 className="text-lg font-bold text-white font-proza">Longest Streak</h3>
                                 <p className="text-white/60 text-xs">Personal best record</p>
                              </div>
                           </div>
                           <div className="text-3xl font-bold text-white">{streakData.longest}</div>
                           <div className="text-white/60 text-xs">days</div>
                        </div>
                     </div>
                  </>
               )}

               {/* Detailed Mode */}
               {viewMode === 'detailed' && (
                  <div className="space-y-4">
                     {/* Detailed Bar Chart */}
                     <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-proza">
                           <HiChartBar className="h-5 w-5 text-blue-400" />
                           Detailed Task Analysis
                        </h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart key={`bar-${filter}-${stats.length}`} data={stats}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                 <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.7)"
                                    fontSize={10}
                                    interval={0}
                                    angle={filter === 'weekly' ? 0 : -45}
                                    textAnchor={filter === 'weekly' ? 'middle' : 'end'}
                                    height={filter === 'weekly' ? 30 : 60}
                                 />
                                 <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} domain={[0, 'dataMax + 1']} />
                                 <Tooltip content={<CustomTooltip />} />
                                 <Legend />
                                 <Bar
                                    dataKey="completed"
                                    fill={COLORS.success}
                                    name="Completed"
                                    radius={[4, 4, 0, 0]}
                                 />
                                 <Bar dataKey="pending" fill={COLORS.warning} name="Pending" radius={[4, 4, 0, 0]} />
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Priority Breakdown */}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {priorityDistribution.map((priority, index) => (
                           <div
                              key={index}
                              className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                           >
                              <h4 className="text-white font-semibold mb-2">{priority.name}</h4>
                              <div className="text-2xl font-bold text-white mb-1">{priority.value}</div>
                              <div className="text-sm text-white/70">
                                 {priority.completed} completed (
                                 {priority.value > 0 ? Math.round((priority.completed / priority.value) * 100) : 0}%)
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                                 <div
                                    className="h-2 rounded-full transition-all duration-1000"
                                    style={{
                                       width: `${
                                          priority.value > 0 ? (priority.completed / priority.value) * 100 : 0
                                       }%`,
                                       backgroundColor: priority.color,
                                    }}
                                 ></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* Trends Mode */}
               {viewMode === 'trends' && (
                  <div className="space-y-4">
                     {/* Weekly Productivity Trends */}
                     <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-proza">
                           <HiTrendingUp className="h-5 w-5 text-green-400" />
                           Productivity Trends
                        </h3>
                        <div className="h-64">
                           <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={weeklyTrends}>
                                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                 <XAxis dataKey="day" stroke="rgba(255,255,255,0.7)" fontSize={10} />
                                 <YAxis stroke="rgba(255,255,255,0.7)" fontSize={10} />
                                 <Tooltip content={<CustomTooltip />} />
                                 <Legend />
                                 <Line
                                    type="monotone"
                                    dataKey="productivity"
                                    stroke={COLORS.secondary}
                                    strokeWidth={3}
                                    dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: COLORS.secondary, strokeWidth: 2 }}
                                    name="Productivity %"
                                 />
                              </LineChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     {/* Streak Metrics */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <h4 className="text-white font-semibold mb-3 font-proza">Streak Statistics</h4>
                           <div className="space-y-2">
                              <div className="flex justify-between">
                                 <span className="text-white/70 text-sm">Total Active Days:</span>
                                 <span className="text-white font-medium">{streakMetrics.totalActiveDays || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-white/70 text-sm">Avg Tasks/Day:</span>
                                 <span className="text-white font-medium">{streakMetrics.averageTasksPerDay || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-white/70 text-sm">Weekly Average:</span>
                                 <span className="text-white font-medium">{streakMetrics.weeklyAverage || 0}%</span>
                              </div>
                              <div className="flex justify-between">
                                 <span className="text-white/70 text-sm">Monthly Average:</span>
                                 <span className="text-white font-medium">{streakMetrics.monthlyAverage || 0}%</span>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                           <h4 className="text-white font-semibold mb-3 font-proza">Calculation Formulas</h4>
                           <div className="space-y-2 text-xs text-white/60">
                              <div>
                                 • <strong>Active Day:</strong> ≥1 task + ≥50% completion
                              </div>
                              <div>
                                 • <strong>Productivity Score:</strong> Weekly×40% + Monthly×30% + Bonuses
                              </div>
                              <div>
                                 • <strong>Streak Bonus:</strong> Current streak × 2 (max 20 pts)
                              </div>
                              <div>
                                 • <strong>Consistency Bonus:</strong> Active days × 2 pts
                              </div>
                              <div>
                                 • <strong>Volume Bonus:</strong> Tasks completed ÷ 10 (max 15 pts)
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}

export default Insights;

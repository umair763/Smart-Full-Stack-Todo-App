'use client';

import { useState, useEffect, useRef } from 'react';
import { FiMaximize, FiMinimize } from 'react-icons/fi';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function DependencyGraph({ taskId, fullScreen = false, onToggleFullScreen }) {
   const [dependencies, setDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(null);
   const [allTasks, setAllTasks] = useState([]);
   const canvasRef = useRef(null);
   const [scale, setScale] = useState(1);
   const [offset, setOffset] = useState({ x: 0, y: 0 });
   const [isDragging, setIsDragging] = useState(false);
   const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

   useEffect(() => {
      fetchDependencies();
      fetchAllTasks();
   }, [taskId]);

   useEffect(() => {
      if (!isLoading && canvasRef.current) {
         drawGraph();
      }
   }, [dependencies, allTasks, isLoading, scale, offset, fullScreen]);

   const fetchDependencies = async () => {
      setIsLoading(true);
      setError(null);

      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${BACKEND_URL}/api/dependencies/task/${taskId}`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch dependencies');
         }

         const data = await response.json();
         setDependencies(data);
      } catch (err) {
         console.error('Error fetching dependencies:', err);
         setError('Failed to load dependencies');
      } finally {
         setIsLoading(false);
      }
   };

   const fetchAllTasks = async () => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${BACKEND_URL}/api/tasks`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error('Failed to fetch tasks');
         }

         const data = await response.json();
         setAllTasks(data);
      } catch (err) {
         console.error('Error fetching tasks:', err);
      }
   };

   const drawGraph = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Set background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(0, 0, width, height);

      // If no dependencies, show message
      if (dependencies.prerequisites.length === 0 && dependencies.dependents.length === 0) {
         ctx.font = '16px Arial';
         ctx.fillStyle = 'white';
         ctx.textAlign = 'center';
         ctx.fillText('No dependencies found for this task', width / 2, height / 2);
         return;
      }

      // Find the current task
      const currentTask = allTasks.find((t) => t._id === taskId);
      if (!currentTask) return;

      // Collect all related tasks
      const relatedTasks = new Map();
      relatedTasks.set(currentTask._id, { task: currentTask, level: 0, index: 0 });

      // Add prerequisites (level -1, -2, etc.)
      dependencies.prerequisites.forEach((dep, i) => {
         const task = dep.prerequisiteTaskId;
         relatedTasks.set(task._id, { task, level: -1, index: i });
      });

      // Add dependents (level 1, 2, etc.)
      dependencies.dependents.forEach((dep, i) => {
         const task = dep.dependentTaskId;
         relatedTasks.set(task._id, { task, level: 1, index: i });
      });

      // Calculate positions
      const nodeRadius = 40 * scale;
      const horizontalSpacing = 200 * scale;
      const verticalSpacing = 100 * scale;
      const centerX = width / 2 + offset.x;
      const centerY = height / 2 + offset.y;

      // Draw connections
      ctx.strokeStyle = 'rgba(148, 6, 230, 0.6)';
      ctx.lineWidth = 2 * scale;

      // Draw prerequisites connections
      dependencies.prerequisites.forEach((dep) => {
         const prereq = relatedTasks.get(dep.prerequisiteTaskId._id);
         if (prereq) {
            const startX = centerX + prereq.level * horizontalSpacing;
            const startY =
               centerY +
               prereq.index * verticalSpacing -
               ((dependencies.prerequisites.length - 1) * verticalSpacing) / 2;
            const endX = centerX;
            const endY = centerY;

            // Draw arrow
            ctx.beginPath();
            ctx.moveTo(startX + nodeRadius, startY);
            ctx.lineTo(endX - nodeRadius, endY);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(endY - startY, endX - startX);
            ctx.beginPath();
            ctx.moveTo(endX - nodeRadius, endY);
            ctx.lineTo(
               endX - nodeRadius - 10 * scale * Math.cos(angle - Math.PI / 6),
               endY - 10 * scale * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
               endX - nodeRadius - 10 * scale * Math.cos(angle + Math.PI / 6),
               endY - 10 * scale * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = 'rgba(148, 6, 230, 0.6)';
            ctx.fill();
         }
      });

      // Draw dependents connections
      dependencies.dependents.forEach((dep) => {
         const dependent = relatedTasks.get(dep.dependentTaskId._id);
         if (dependent) {
            const startX = centerX;
            const startY = centerY;
            const endX = centerX + dependent.level * horizontalSpacing;
            const endY =
               centerY +
               dependent.index * verticalSpacing -
               ((dependencies.dependents.length - 1) * verticalSpacing) / 2;

            // Draw arrow
            ctx.beginPath();
            ctx.moveTo(startX + nodeRadius, startY);
            ctx.lineTo(endX - nodeRadius, endY);
            ctx.stroke();

            // Draw arrowhead
            const angle = Math.atan2(endY - startY, endX - startX);
            ctx.beginPath();
            ctx.moveTo(endX - nodeRadius, endY);
            ctx.lineTo(
               endX - nodeRadius - 10 * scale * Math.cos(angle - Math.PI / 6),
               endY - 10 * scale * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
               endX - nodeRadius - 10 * scale * Math.cos(angle + Math.PI / 6),
               endY - 10 * scale * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fillStyle = 'rgba(148, 6, 230, 0.6)';
            ctx.fill();
         }
      });

      // Draw nodes
      relatedTasks.forEach(({ task, level, index }, id) => {
         const x = centerX + level * horizontalSpacing;
         let y = centerY;

         // Adjust y position for prerequisites and dependents
         if (level === -1) {
            y = centerY + index * verticalSpacing - ((dependencies.prerequisites.length - 1) * verticalSpacing) / 2;
         } else if (level === 1) {
            y = centerY + index * verticalSpacing - ((dependencies.dependents.length - 1) * verticalSpacing) / 2;
         }

         // Draw node circle
         ctx.beginPath();
         ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);

         // Current task is highlighted
         if (id === taskId) {
            ctx.fillStyle = 'rgba(148, 6, 230, 0.8)';
         } else {
            // Color based on priority
            if (task.priority === 'High') {
               ctx.fillStyle = 'rgba(220, 38, 38, 0.8)'; // Red
            } else if (task.priority === 'Medium') {
               ctx.fillStyle = 'rgba(234, 179, 8, 0.8)'; // Yellow
            } else {
               ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'; // Green
            }
         }

         ctx.fill();

         // Draw task name
         ctx.font = `${12 * scale}px Arial`;
         ctx.fillStyle = 'white';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';

         // Truncate text if too long
         let taskName = task.task;
         if (taskName.length > 15) {
            taskName = taskName.substring(0, 12) + '...';
         }

         ctx.fillText(taskName, x, y);

         // Draw date below
         ctx.font = `${10 * scale}px Arial`;
         ctx.fillText(task.date, x, y + 15 * scale);
      });
   };

   const handleMouseDown = (e) => {
      setIsDragging(true);
      setDragStart({
         x: e.clientX - offset.x,
         y: e.clientY - offset.y,
      });
   };

   const handleMouseMove = (e) => {
      if (isDragging) {
         setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
         });
      }
   };

   const handleMouseUp = () => {
      setIsDragging(false);
   };

   const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(2, scale + delta));
      setScale(newScale);
   };

   if (isLoading) {
      return (
         <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#9406E6]"></div>
         </div>
      );
   }

   if (error) {
      return <div className="text-red-500 p-4">{error}</div>;
   }

   return (
      <div className={`relative ${fullScreen ? 'fixed inset-0 z-50 bg-black/80' : 'h-[300px] w-full'}`}>
         <canvas
            ref={canvasRef}
            width={fullScreen ? window.innerWidth : 600}
            height={fullScreen ? window.innerHeight : 300}
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
         ></canvas>

         <div className="absolute bottom-4 right-4 flex space-x-2">
            <button
               onClick={() => setScale(Math.min(2, scale + 0.1))}
               className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30"
               title="Zoom in"
            >
               +
            </button>
            <button
               onClick={() => setScale(Math.max(0.5, scale - 0.1))}
               className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30"
               title="Zoom out"
            >
               -
            </button>
            <button
               onClick={() => {
                  setScale(1);
                  setOffset({ x: 0, y: 0 });
               }}
               className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30"
               title="Reset view"
            >
               R
            </button>
            <button
               onClick={onToggleFullScreen}
               className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30"
               title={fullScreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
               {fullScreen ? <FiMinimize /> : <FiMaximize />}
            </button>
         </div>

         {fullScreen && (
            <div className="absolute top-4 left-4">
               <h2 className="text-white text-xl font-bold">Task Dependency Graph</h2>
               <p className="text-white/70 text-sm">Drag to pan, scroll to zoom, click buttons to adjust view</p>
            </div>
         )}
      </div>
   );
}

export default DependencyGraph;

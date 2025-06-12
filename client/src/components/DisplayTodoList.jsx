'use client';

import { useState, useEffect } from 'react';
import { FiTrash2, FiMoreVertical, FiPlus, FiEye, FiDownload, FiLink } from 'react-icons/fi';
import {
   HiCalendar,
   HiClock,
   HiCheck,
   HiChevronUp,
   HiChevronDown as HiChevronDownIcon,
   HiPencilAlt,
} from 'react-icons/hi';
import EditTaskModal from './EditTaskModal';
import Subtask from './Subtask';
import SubtaskModal from './SubtaskModal';
import { useSocket } from '../app/context/SocketContext';
import { toast } from 'react-hot-toast';
import NoteModal from './NoteModal';
import AttachmentModal from './AttachmentModal';
import DependencyModal from './DependencyModal';
import DependencyTree from './DependencyTree';
import ReminderModal from './ReminderModal';
import { useTheme } from 'next-themes';

// Hardcoded backend URL
const BACKEND_URL = 'https://smart-todo-task-management-backend.vercel.app';

function DisplayTodoList({ list, isexceeded, onDelete, onUpdate, onStatusChange, dependencies, onDependencyChange }) {
   const [completed, setCompleted] = useState(list.completed || false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [isUpdating, setIsUpdating] = useState(false);
   const [showSubtasks, setShowSubtasks] = useState(false);
   const [subtasks, setSubtasks] = useState([]);
   const [showSubtaskModal, setShowSubtaskModal] = useState(false);
   const [currentSubtask, setCurrentSubtask] = useState(null);
   const [showMoreOptions, setShowMoreOptions] = useState(false);
   const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);
   const { socket, isConnected } = useSocket();
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
   const [showNoteModal, setShowNoteModal] = useState(false);
   const [showAttachmentModal, setShowAttachmentModal] = useState(false);
   const [showNoteView, setShowNoteView] = useState(false);
   const [noteViewAnimating, setNoteViewAnimating] = useState(false);
   const [notes, setNotes] = useState([]);
   const [attachments, setAttachments] = useState([]);
   const [isLoadingNotes, setIsLoadingNotes] = useState(false);
   const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
   const [showDependencyModal, setShowDependencyModal] = useState(false);
   const [showDependencyTree, setShowDependencyTree] = useState(false);
   const [taskDependencies, setTaskDependencies] = useState({ prerequisites: [], dependents: [] });
   const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);
   const [hasDependencies, setHasDependencies] = useState(false);
   const [hasAttachments, setHasAttachments] = useState(false);
   const [socketUpdateReceived, setSocketUpdateReceived] = useState(false);
   const { isDark } = useTheme();

   // Initialize editedTask with the list props
   const [editedTask, setEditedTask] = useState({
      task: list.task,
      date: list.date,
      time: list.time,
      color: list.color,
      priority: list.priority || 'medium',
   });

   // Sync the component state with the list prop
   useEffect(() => {
      setCompleted(list.completed || false);
   }, [list.completed]);

   // Fetch subtasks when expanding
   useEffect(() => {
      if (showSubtasks && subtasks.length === 0 && !isLoadingSubtasks) {
         fetchSubtasks();
      }
   }, [showSubtasks]);

   // Check if task has dependencies
   useEffect(() => {
      if (dependencies) {
         const hasPrerequisites = dependencies.some(
            (dep) => dep.dependentTaskId === list._id || (dep.dependentTaskId && dep.dependentTaskId._id === list._id)
         );

         const hasDependents = dependencies.some(
            (dep) =>
               dep.prerequisiteTaskId === list._id ||
               (dep.prerequisiteTaskId && dep.prerequisiteTaskId._id === list._id)
         );

         setHasDependencies(hasPrerequisites || hasDependents);
      }
   }, [dependencies, list._id]);

   // Handle socket events for subtask changes (only if socket is connected)
   useEffect(() => {
      if (!socket || !isConnected) {
         console.log('Socket not available, skipping socket listeners');
         return;
      }

      // Handle subtask created event
      const handleSubtaskCreated = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask created event:', data);
            setSocketUpdateReceived(true);

            setSubtasks((prev) => {
               const exists = prev.some((st) => st._id === data.subtask._id);
               if (exists) {
                  console.log('Subtask already exists, skipping duplicate');
                  return prev;
               }

               const newSubtasks = [...prev, data.subtask];
               return sortSubtasksByPriority(newSubtasks);
            });

            onUpdate(list._id, {
               ...list,
               subtaskCount: (list.subtaskCount || 0) + 1,
               completedSubtasks: list.completedSubtasks || 0,
            });

            setShowSubtasks(true);
         }
      };

      // Handle subtask status changed event
      const handleSubtaskStatusChanged = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask status changed event:', data);

            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) =>
                  st._id === data.subtaskId ? { ...st, status: data.status } : st
               );
               return sortSubtasksByPriority(updatedSubtasks);
            });

            onUpdate(list._id, {
               ...list,
               subtaskCount: data.subtaskCount,
               completedSubtasks: data.completedSubtasks,
            });
         }
      };

      // Handle subtask updated event
      const handleSubtaskUpdated = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask updated event:', data);

            setSubtasks((prev) => {
               const updatedSubtasks = prev.map((st) => (st._id === data.subtask._id ? data.subtask : st));
               return sortSubtasksByPriority(updatedSubtasks);
            });
         }
      };

      // Handle subtask deleted event
      const handleSubtaskDeleted = (data) => {
         const currentUserId = localStorage.getItem('userId');
         if (data.parentTaskId === list._id && data.userId === currentUserId) {
            console.log('Handling subtask deleted event:', data);

            setSubtasks((prev) => {
               const filteredSubtasks = prev.filter((st) => st._id !== data.subtaskId);
               return sortSubtasksByPriority(filteredSubtasks);
            });

            onUpdate(list._id, {
               ...list,
               subtaskCount: Math.max((list.subtaskCount || 0) - 1, 0),
               completedSubtasks: Math.max((list.completedSubtasks || 0) - 1, 0),
            });
         }
      };

      // Handle dependency created event
      const handleDependencyCreated = (data) => {
         if (data.dependentTaskId === list._id || data.prerequisiteTaskId === list._id) {
            if (onDependencyChange) {
               onDependencyChange();
            }
         }
      };

      // Handle dependency deleted event
      const handleDependencyDeleted = (data) => {
         if (data.dependentTaskId === list._id || data.prerequisiteTaskId === list._id) {
            if (onDependencyChange) {
               onDependencyChange();
            }
         }
      };

      // Register socket listeners
      socket.on('subtaskCreated', handleSubtaskCreated);
      socket.on('subtaskStatusChanged', handleSubtaskStatusChanged);
      socket.on('subtaskUpdated', handleSubtaskUpdated);
      socket.on('subtaskDeleted', handleSubtaskDeleted);
      socket.on('dependencyCreated', handleDependencyCreated);
      socket.on('dependencyDeleted', handleDependencyDeleted);

      // Clean up listeners on unmount
      return () => {
         socket.off('subtaskCreated', handleSubtaskCreated);
         socket.off('subtaskStatusChanged', handleSubtaskStatusChanged);
         socket.off('subtaskUpdated', handleSubtaskUpdated);
         socket.off('subtaskDeleted', handleSubtaskDeleted);
         socket.off('dependencyCreated', handleDependencyCreated);
         socket.off('dependencyDeleted', handleDependencyDeleted);
      };
   }, [socket, isConnected, list._id, onDependencyChange, onUpdate, list]);

   // Fetch subtasks from the server with retry logic
   const fetchSubtasks = async (retryCount = 0) => {
      setIsLoadingSubtasks(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/subtasks`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         console.log('Subtasks fetch response.ok:', response.ok);

         if (!response.ok) {
            throw new Error(`Failed to fetch subtasks: ${response.status}`);
         }

         const data = await response.json();
         console.log('Subtasks raw data:', data);
         const sortedSubtasks = sortSubtasksByPriority(data);
         console.log('Subtasks sorted data:', sortedSubtasks);
         setSubtasks(sortedSubtasks);
      } catch (error) {
         console.error('Error fetching subtasks:', error);

         // Retry logic
         if (retryCount < 2) {
            console.log(`Retrying subtasks fetch (${retryCount + 1}/3)...`);
            setTimeout(() => fetchSubtasks(retryCount + 1), 1000 * (retryCount + 1));
         } else {
            toast.error('Failed to load subtasks');
         }
      } finally {
         setIsLoadingSubtasks(false);
      }
   };

   // Fetch task dependencies with retry logic
   const fetchTaskDependencies = async (retryCount = 0) => {
      setIsLoadingDependencies(true);
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${BACKEND_URL}/api/dependencies/task/${list._id}`, {
            method: 'GET',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to fetch dependencies: ${response.status}`);
         }

         const data = await response.json();
         setTaskDependencies(data);
         setHasDependencies(data.prerequisites.length > 0 || data.dependents.length > 0);
      } catch (error) {
         console.error('Error fetching dependencies:', error);

         // Retry logic
         if (retryCount < 2) {
            console.log(`Retrying dependencies fetch (${retryCount + 1}/3)...`);
            setTimeout(() => fetchTaskDependencies(retryCount + 1), 1000 * (retryCount + 1));
         } else {
            toast.error('Failed to load dependencies');
         }
      } finally {
         setIsLoadingDependencies(false);
      }
   };

   // Helper function to sort subtasks by priority
   const sortSubtasksByPriority = (subtasks) => {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return [...subtasks].sort((a, b) => {
         return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      });
   };

   // Handle task status toggle with retry logic
   async function handleTaskStatusToggle() {
      if (isUpdating) return;

      setIsUpdating(true);

      try {
         const newStatus = !completed;
         setCompleted(newStatus);

         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/status`, {
            method: 'PATCH',
            headers: {
               Authorization: `Bearer ${token}`,
               'Content-Type': 'application/json',
            },
            body: JSON.stringify({ completed: newStatus }),
         });

         if (!response.ok) {
            throw new Error(`Failed to update task status: ${response.status}`);
         }

         // Success - the UI is already updated optimistically
         console.log('Task status updated successfully');
      } catch (error) {
         console.error('Error updating task status:', error);
         setCompleted(!completed); // Revert on error

         if (onStatusChange) {
            onStatusChange(list._id, completed, error.message);
         }

         toast.error('Failed to update task status');
      } finally {
         setIsUpdating(false);
      }
   }

   function handleEdit() {
      setShowEditModal(true);
   }

   function handleDelete() {
      onDelete(list._id);
   }

   function handleSaveTask(taskId, updatedTaskData) {
      onUpdate(taskId, updatedTaskData);
      setShowEditModal(false);
   }

   // Toggle subtasks visibility
   const toggleSubtasks = (e) => {
      e.stopPropagation();
      if (list.subtaskCount > 0) {
         setShowSubtasks(!showSubtasks);
         if (!showSubtasks && subtasks.length === 0) {
            fetchSubtasks();
         }
      }
   };

   // Toggle the more options menu
   const toggleMoreOptions = (e) => {
      e.stopPropagation();
      setShowMoreOptions(!showMoreOptions);
   };

   // Open subtask modal for adding a new subtask
   const handleAddSubtask = () => {
      setCurrentSubtask(null);
      setShowSubtaskModal(true);
      setShowMoreOptions(false);
   };

   // Open dependency modal for adding a new dependency
   const handleAddDependency = () => {
      setShowDependencyModal(true);
      setIsMenuOpen(false);
   };

   // Open dependency tree view
   const handleViewDependencies = () => {
      fetchTaskDependencies();
      setShowDependencyTree(true);
      setIsMenuOpen(false);
   };

   // Handle adding a new dependency
   const handleDependencyAdded = (newDependency) => {
      if (onDependencyChange) {
         onDependencyChange();
      }
   };

   // Save a new subtask with retry logic
   const handleSaveSubtask = async (subtaskData, subtaskId = null) => {
      try {
         setSocketUpdateReceived(false);
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const formattedData = {
            ...subtaskData,
            taskId: list._id,
            status: false,
         };

         let response;
         if (subtaskId) {
            response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/subtasks/${subtaskId}`, {
               method: 'PUT',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(formattedData),
            });
         } else {
            response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/subtasks`, {
               method: 'POST',
               headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(formattedData),
            });
         }

         if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || (subtaskId ? 'Failed to update subtask' : 'Failed to create subtask'));
         }

         const data = await response.json();

         if (!subtaskId) {
            setShowSubtasks(true);
         }

         setShowSubtaskModal(false);
         toast.success(subtaskId ? 'Subtask updated successfully' : 'Subtask created successfully');

         // Fallback: If socket events don't update the UI within 2 seconds, refetch data
         setTimeout(() => {
            if (!subtaskId && !socketUpdateReceived) {
               console.log('Socket event may have failed, refetching subtasks...');
               fetchSubtasks();
            }
         }, 2000);
      } catch (error) {
         console.error('Error saving subtask:', error);
         toast.error(error.message || 'Failed to save subtask');
      }
   };

   // Handle subtask deletion with retry logic
   const handleDeleteSubtask = async (subtaskId) => {
      try {
         const token = localStorage.getItem('token');
         if (!token) {
            throw new Error('Authentication required');
         }

         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/subtasks/${subtaskId}`, {
            method: 'DELETE',
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to delete subtask: ${response.status}`);
         }

         setSubtasks((prevSubtasks) => prevSubtasks.filter((st) => st._id !== subtaskId));
         toast.success('Subtask deleted successfully');
      } catch (error) {
         console.error('Error deleting subtask:', error);
         toast.error('Failed to delete subtask');
      }
   };

   // Handle subtask edit
   const handleEditSubtask = (subtask) => {
      setCurrentSubtask(subtask);
      setShowSubtaskModal(true);
   };

   // Handle subtask status change
   const handleSubtaskStatusChange = async (subtaskId, currentStatus, errorMessage) => {
      if (!errorMessage) {
         try {
            const updatedSubtasks = subtasks.map((st) => {
               if (st._id === subtaskId) {
                  return { ...st, status: !currentStatus };
               }
               return st;
            });

            setSubtasks(updatedSubtasks);

            const totalSubtasks = updatedSubtasks.length;
            const completedCount = updatedSubtasks.filter((st) => st.status).length;

            const parentTaskUpdate = {
               ...list,
               subtaskCount: totalSubtasks,
               completedSubtasks: completedCount,
            };

            if (onUpdate) {
               onUpdate(list._id, parentTaskUpdate);
            }
         } catch (error) {
            console.error('Error updating subtask status locally:', error);
         }
      } else {
         console.log(`Subtask ${subtaskId} status change failed. Error: ${errorMessage}`);
      }
   };

   const handleSetReminder = async (taskId, reminderTime) => {
      try {
         console.log('DisplayTodoList - Setting reminder for task:', { taskId, reminderTime });

         if (!taskId || !reminderTime) {
            console.error('Missing required data:', { taskId, reminderTime });
            toast.error('Task ID and reminder time are required');
            return;
         }

         const reminderDateTime = new Date(reminderTime);
         if (reminderDateTime <= new Date()) {
            toast.error('Reminder time must be in the future');
            return;
         }

         const response = await fetch(`${BACKEND_URL}/api/reminders`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({
               taskId,
               reminderTime,
               userId: list.userId,
            }),
         });

         const data = await response.json();

         if (!response.ok) {
            console.error('Failed to set reminder:', data);
            throw new Error(data.message || 'Failed to set reminder');
         }

         console.log('Reminder set successfully:', data);
         toast.success('Reminder set successfully!');
         setIsReminderModalOpen(false);
      } catch (error) {
         console.error('Error setting reminder:', error);
         toast.error(error.message || 'Failed to set reminder. Please try again.');
      }
   };

   // Fetch notes when note view is opened
   useEffect(() => {
      if (showNoteView) {
         fetchNotes();
      }
   }, [showNoteView]);

   // Fetch attachments when component mounts
   useEffect(() => {
      fetchAttachments();
   }, []);

   // Fetch notes for the task with retry logic
   const fetchNotes = async (retryCount = 0) => {
      setIsLoadingNotes(true);
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/notes`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to fetch notes: ${response.status}`);
         }

         const data = await response.json();
         setNotes(data);
      } catch (error) {
         console.error('Error fetching notes:', error);

         if (retryCount < 2) {
            setTimeout(() => fetchNotes(retryCount + 1), 1000 * (retryCount + 1));
         } else {
            toast.error('Failed to load notes');
         }
      } finally {
         setIsLoadingNotes(false);
      }
   };

   // Fetch attachments for the task with retry logic
   const fetchAttachments = async (retryCount = 0) => {
      setIsLoadingAttachments(true);
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/attachments`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to fetch attachments: ${response.status}`);
         }

         const data = await response.json();
         setAttachments(data);
         setHasAttachments(data && data.length > 0);
      } catch (error) {
         console.error('Error fetching attachments:', error);

         if (retryCount < 2) {
            setTimeout(() => fetchAttachments(retryCount + 1), 1000 * (retryCount + 1));
         }
         // Don't show error toast on initial load
      } finally {
         setIsLoadingAttachments(false);
      }
   };

   // Handle note creation
   const handleCreateNote = async (content) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/notes`, {
            method: 'POST',
            headers: {
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
         });

         if (!response.ok) {
            throw new Error(`Failed to create note: ${response.status}`);
         }

         const newNote = await response.json();
         setNotes((prev) => [newNote, ...prev]);
         toast.success('Note added successfully');
         setShowNoteModal(false);
      } catch (error) {
         console.error('Error creating note:', error);
         toast.error('Failed to add note');
      }
   };

   // Handle attachment upload
   const handleUploadAttachment = async (file) => {
      try {
         const formData = new FormData();
         formData.append('file', file);

         const token = localStorage.getItem('token');
         const response = await fetch(`${BACKEND_URL}/api/tasks/${list._id}/attachments`, {
            method: 'POST',
            headers: {
               Authorization: `Bearer ${token}`,
            },
            body: formData,
         });

         if (!response.ok) {
            throw new Error(`Failed to upload attachment: ${response.status}`);
         }

         const data = await response.json();
         setAttachments([data]);
         setHasAttachments(true);
         toast.success('File uploaded successfully');
         setShowAttachmentModal(false);
      } catch (error) {
         console.error('Error uploading attachment:', error);
         toast.error('Failed to upload file');
      }
   };

   // Handle attachment download
   const handleDownloadAttachment = async (attachmentId) => {
      try {
         const token = localStorage.getItem('token');
         const response = await fetch(`${BACKEND_URL}/api/attachments/${attachmentId}/download`, {
            headers: {
               Authorization: `Bearer ${token}`,
            },
         });

         if (!response.ok) {
            throw new Error(`Failed to download attachment: ${response.status}`);
         }

         const blob = await response.blob();
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = attachments.find((a) => a._id === attachmentId)?.originalname || 'download';
         document.body.appendChild(a);
         a.click();
         window.URL.revokeObjectURL(url);
         document.body.removeChild(a);
      } catch (error) {
         console.error('Error downloading attachment:', error);
         toast.error('Failed to download file');
      }
   };

   // Get priority color class
   const getPriorityColorClass = () => {
      switch (list.priority?.toLowerCase()) {
         case 'high':
            return 'border-red-500';
         case 'medium':
            return 'border-yellow-500';
         case 'low':
            return 'border-green-500';
         default:
            return '';
      }
   };

   // Handle note view toggle with smooth animation
   const toggleNoteView = () => {
      if (showNoteView) {
         setNoteViewAnimating(true);
         setTimeout(() => {
            setShowNoteView(false);
            setNoteViewAnimating(false);
         }, 200);
      } else {
         setShowNoteView(true);
         setNoteViewAnimating(true);
         setTimeout(() => setNoteViewAnimating(false), 300);
      }
   };

   return (
      <div
         className={`relative group/item transition-all duration-300 ${
            isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'
         }`}
      >
         <div
            className={`flex flex-col p-3 sm:p-4 rounded-lg border ${
               isDark
                  ? 'border-gray-700 bg-gray-800/50 text-gray-100'
                  : 'border-gray-200 bg-white text-gray-900'
            } shadow-sm transition-all duration-300`}
         >
            {/* Task Header */}
            <div className="flex items-start justify-between mb-2">
               <div className="flex-1 min-w-0">
                  <h3
                     className={`text-base sm:text-lg font-medium truncate ${
                        completed
                           ? isDark
                              ? 'line-through text-gray-500'
                              : 'line-through text-gray-400'
                           : isDark
                           ? 'text-gray-100'
                           : 'text-gray-900'
                     }`}
                  >
                     {list.task}
                  </h3>
               </div>

               {/* Task Actions */}
               <div className="flex items-center space-x-2 ml-4">
                  {/* Completion Status */}
                  <button
                     onClick={handleTaskStatusToggle}
                     className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                        completed
                           ? 'bg-[#9406E6] text-white shadow-md'
                           : 'border-2 border-[#9406E6] hover:bg-[#9406E6]/10'
                     }`}
                     disabled={isUpdating}
                     title={completed ? 'Mark as incomplete' : 'Mark as complete'}
                  >
                     {completed && <HiCheck className="h-4 w-4 md:h-5 md:w-5" />}
                  </button>
               </div>
            </div>

            {/* Task Details */}
            <div className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
               {/* Subtask Progress */}
               {list.subtaskCount > 0 && (
                  <div className="mb-3">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Subtasks Progress</span>
                        <span className="text-sm text-gray-500">
                           {list.completedSubtasks}/{list.subtaskCount}
                        </span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                           className="bg-gradient-to-r from-[#9406E6] to-[#C724B1] h-2.5 rounded-full transition-all duration-300"
                           style={{ width: `${(list.completedSubtasks / list.subtaskCount) * 100}%` }}
                        ></div>
                     </div>
                  </div>
               )}

               {/* Date & Time Section */}
               <div className="mb-3">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                           <HiCalendar className="h-4 w-4 text-white" />
                        </div>
                        <div>
                           <p
                              className={`${
                                 completed ? 'line-through text-gray-500' : 'text-gray-900'
                              } font-medium text-sm md:text-base`}
                           >
                              {list.date}
                           </p>
                           <p
                              className={`${
                                 completed ? 'line-through text-gray-500' : 'text-gray-600'
                              } text-sm md:text-base`}
                           >
                              {list.time}
                           </p>
                        </div>
                     </div>

                     {isexceeded && !completed && (
                        <div className="bg-red-100 border border-red-200 text-red-800 px-2 py-1 rounded-lg">
                           <p className="text-xs font-semibold">Overdue</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Subtasks Section */}
            {showSubtasks && (
               <div className={`mt-4 ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'} rounded-lg p-3`}>
                  {/* Mobile Subtasks Layout (< 640px) */}
                  <div className="sm:hidden bg-gradient-to-br  via-indigo-50 from-purple-50 to-blue-50 rounded-xl p-2 ml-4 border-l-4 border-gradient-to-b from-purple-500 to-indigo-600 shadow-sm">
                     <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center">
                           <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 shadow-sm">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-3 w-3 text-white"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                 />
                              </svg>
                           </div>
                           Subtasks Tree
                        </h4>
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                           {list.completedSubtasks}/{list.subtaskCount}
                        </div>
                     </div>

                     {isLoadingSubtasks ? (
                        <div className="flex items-center justify-center py-4">
                           <div className="relative">
                              <div className="animate-spin rounded-full h-6 w-6 border-3 border-purple-200"></div>
                              <div className="animate-spin rounded-full h-6 w-6 border-t-3 border-purple-600 absolute top-0 left-0"></div>
                           </div>
                           <span className="ml-2 text-purple-700 text-xs font-medium">Loading...</span>
                        </div>
                     ) : subtasks.length > 0 ? (
                        <div className="space-y-1.5">
                           {subtasks.map((subtask, index) => (
                              <div
                                 key={subtask._id}
                                 className="relative bg-white/80 backdrop-blur-sm rounded-lg p-1.5 border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/90"
                                 style={{
                                    animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`,
                                 }}
                              >
                                 {/* Modern Tree Node Indicator */}
                                 <div className="absolute left-[-10px] top-1/2 transform -translate-y-1/2">
                                    <div className="w-5 h-5 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                                       <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                 </div>
                                 <Subtask
                                    subtask={subtask}
                                    onDelete={handleDeleteSubtask}
                                    onUpdate={handleEditSubtask}
                                    onStatusChange={handleSubtaskStatusChange}
                                 />
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-4 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50">
                           <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                              <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-6 w-6 text-white"
                                 fill="none"
                                 viewBox="0 0 24 24"
                                 stroke="currentColor"
                              >
                                 <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                 />
                              </svg>
                           </div>
                           <h4 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-1">
                              Empty Tree
                           </h4>
                           <p className="text-purple-600 text-xs font-medium">No subtasks in this branch</p>
                        </div>
                     )}
                  </div>

                  {/* Desktop Subtasks Layout (>= 640px) - Modern Tree Structure */}
                  <div className="hidden sm:block relative pl-10 mb-3 group">
                     {/* Modern Vertical Tree Trunk */}
                     <div className="absolute left-[20px] top-0 bottom-4 w-[2px] bg-gradient-to-b from-purple-400 via-indigo-500 to-purple-600 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:w-[3px]">
                        {/* Animated pulse effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-300 to-indigo-400 rounded-full animate-pulse opacity-50"></div>
                     </div>

                     {/* Tree Header */}
                     <div className="absolute left-[-8px] top-[-20px] flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-lg border border-white/20">
                        <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                              />
                           </svg>
                        </div>
                        <span className="text-xs font-bold">Subtasks Tree</span>
                        <div className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                           {list.completedSubtasks}/{list.subtaskCount}
                        </div>
                     </div>

                     {isLoadingSubtasks ? (
                        <div className="flex items-center justify-center py-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl ml-6 border border-purple-200/50 shadow-inner">
                           <div className="relative">
                              <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-200"></div>
                              <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-purple-600 absolute top-0 left-0"></div>
                              <div className="animate-ping absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                           </div>
                           <span className="ml-3 text-purple-700 text-xs font-medium">Loading tree...</span>
                        </div>
                     ) : (
                        <div className="pt-4">
                           {subtasks.map((subtask, index) => (
                              <div
                                 key={subtask._id}
                                 className="relative mb-2 flex items-start group/item"
                                 style={{
                                    animation: `slideInRight 0.3s ease-out ${index * 0.05}s both`,
                                 }}
                              >
                                 {/* Modern Tree Branch Connection */}
                                 <div className="absolute left-[-28px] top-[16px] flex items-center z-20">
                                    {/* Horizontal branch */}
                                    <div className="w-[20px] h-[2px] bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full shadow-sm group-hover/item:shadow-md transition-all duration-300 group-hover/item:w-[24px]">
                                       <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-indigo-400 rounded-full animate-pulse opacity-50"></div>
                                    </div>

                                    {/* Modern Tree Node */}
                                    <div className="relative ml-1">
                                       <div className="w-3 h-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full border-2 border-white shadow-lg group-hover/item:scale-110 transition-transform duration-300 flex items-center justify-center">
                                          <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                                       </div>
                                       {/* Glowing effect */}
                                       <div className="absolute inset-0 w-3 h-3 bg-purple-400 rounded-full animate-ping opacity-20"></div>
                                    </div>
                                 </div>

                                 {/* Subtask Container */}
                                 <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white/90 group-hover/item:translate-x-1">
                                    <div
                                       className={`absolute left-0 top-0 bottom-0 w-1 rounded-r-full ${
                                          subtask.priority === 'High'
                                             ? 'bg-gradient-to-b from-red-400 to-red-600'
                                             : subtask.priority === 'Medium'
                                             ? 'bg-gradient-to-b from-yellow-400 to-orange-500'
                                             : 'bg-gradient-to-b from-green-400 to-green-600'
                                       }`}
                                    ></div>

                                    <div className="relative z-10">
                                       <Subtask
                                          subtask={subtask}
                                          onDelete={handleDeleteSubtask}
                                          onUpdate={handleEditSubtask}
                                          onStatusChange={handleSubtaskStatusChange}
                                       />
                                    </div>

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-indigo-400/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300"></div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* Notes View */}
            <div
               className={`overflow-hidden transition-all duration-500 ease-out ${
                  showNoteView ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
               }`}
            >
               <div
                  className={`ml-6 sm:ml-8 mb-4 transition-all duration-500 ease-out transform ${
                     showNoteView ? 'translate-y-0 scale-100' : '-translate-y-4 scale-95'
                  }`}
               >
                  <div
                     className={`rounded-xl p-4 border shadow-lg backdrop-blur-sm ${
                        isDark
                           ? 'bg-gray-800/50 border-gray-700'
                           : 'bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-100 border-yellow-200'
                     }`}
                  >
                     {/* Header with icon */}
                     <div
                        className={`flex items-center mb-4 transition-all duration-700 ease-out ${
                           showNoteView ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                        }`}
                     >
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                           <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                           >
                              <path
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 strokeWidth={2}
                                 d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                           </svg>
                        </div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-yellow-700 to-orange-600 bg-clip-text text-transparent">
                           Notes
                        </h3>
                        {notes.length > 0 && (
                           <span className="ml-auto bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                              {notes.length}
                           </span>
                        )}
                     </div>

                     {/* Content */}
                     <div
                        className={`transition-all duration-700 ease-out ${
                           showNoteView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                     >
                        {isLoadingNotes ? (
                           <div className="flex items-center justify-center py-6">
                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-yellow-300 border-t-yellow-600"></div>
                              <span className="ml-3 text-yellow-700 text-sm font-medium">Loading notes...</span>
                           </div>
                        ) : notes.length > 0 ? (
                           <div className="space-y-3">
                              {notes.map((note, index) => (
                                 <div
                                    key={note._id}
                                    className={`group bg-white rounded-lg p-3 shadow-sm border border-yellow-200/50 hover:shadow-md hover:border-yellow-300 transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                                       showNoteView ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
                                    }`}
                                    style={{
                                       transitionDelay: showNoteView ? `${index * 100}ms` : '0ms',
                                    }}
                                 >
                                    <p className="text-gray-800 text-sm leading-relaxed mb-2">{note.content}</p>
                                    <div className="flex items-center text-xs text-gray-500">
                                       <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-3 w-3 mr-1 opacity-70"
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
                                       <span>{new Date(note.createdAt).toLocaleString()}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="text-center py-8">
                              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={1.5}
                                       d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                 </svg>
                              </div>
                              <h4 className="text-lg font-semibold text-yellow-800 mb-2">No notes yet</h4>
                              <p className="text-yellow-600 text-sm mb-4">Start capturing your thoughts and ideas</p>
                              <button
                                 onClick={() => {
                                    setShowNoteModal(true);
                                    setIsMenuOpen(false);
                                 }}
                                 className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                 <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                 >
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M12 4v16m8-8H4"
                                    />
                                 </svg>
                                 Add First Note
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}

export default DisplayTodoList;

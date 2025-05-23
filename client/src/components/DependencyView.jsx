'use client';

import { useState } from 'react';
import { FiList, FiGrid } from 'react-icons/fi';
import TaskDependencyList from './TaskDependencyList';
import DependencyGraph from './DependencyGraph';

function DependencyView({ taskId }) {
   const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph'
   const [isFullScreen, setIsFullScreen] = useState(false);

   const toggleFullScreen = () => {
      setIsFullScreen(!isFullScreen);
   };

   return (
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-4">
         <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Task Dependencies</h2>
            <div className="flex space-x-2">
               <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${
                     viewMode === 'list' ? 'bg-[#9406E6] text-white' : 'bg-white/10 text-white/70'
                  }`}
                  title="List view"
               >
                  <FiList />
               </button>
               <button
                  onClick={() => setViewMode('graph')}
                  className={`p-2 rounded-md ${
                     viewMode === 'graph' ? 'bg-[#9406E6] text-white' : 'bg-white/10 text-white/70'
                  }`}
                  title="Graph view"
               >
                  <FiGrid />
               </button>
            </div>
         </div>

         {viewMode === 'list' ? (
            <TaskDependencyList taskId={taskId} />
         ) : (
            <DependencyGraph taskId={taskId} fullScreen={isFullScreen} onToggleFullScreen={toggleFullScreen} />
         )}
      </div>
   );
}

export default DependencyView;

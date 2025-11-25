import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationProps {
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ title, message, isVisible, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      // Auto dismiss after 6 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Wait for animation
  };

  if (!isVisible && !show) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-blue-100 shadow-2xl rounded-2xl p-4 flex gap-4 transition-all duration-500 transform
        ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="bg-blue-900 text-white p-3 rounded-xl flex items-center justify-center h-fit">
        <Bell size={20} />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-sm text-slate-600 leading-snug">{message}</p>
      </div>
      <button 
        onClick={handleClose}
        className="text-slate-400 hover:text-slate-600 h-fit"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Notification;
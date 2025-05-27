import React from 'react';

export interface NotificationData {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

const Notification: React.FC<NotificationData> = ({ show, message, type }) => {
  if (!show) return null;

  const colorClass =
    type === 'success'
      ? 'bg-green-500'
      : type === 'info'
      ? 'bg-blue-500'
      : 'bg-red-500';

  return (
    <div
      className={`fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white print:hidden transition-opacity duration-300 ${colorClass} ${show ? 'opacity-100' : 'opacity-0'}`}
      role="alert"
    >
      {message}
    </div>
  );
};

export default Notification;

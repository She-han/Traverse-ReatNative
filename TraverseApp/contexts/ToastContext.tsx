import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserFriendlyError } from '../utils/errorHandler';
import Toast from '../components/common/Toast';

interface ToastContextType {
  showToast: (error: UserFriendlyError) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [currentToast, setCurrentToast] = useState<UserFriendlyError | null>(null);

  const showToast = (error: UserFriendlyError) => {
    setCurrentToast(error);
  };

  const hideToast = () => {
    setCurrentToast(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <Toast error={currentToast} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

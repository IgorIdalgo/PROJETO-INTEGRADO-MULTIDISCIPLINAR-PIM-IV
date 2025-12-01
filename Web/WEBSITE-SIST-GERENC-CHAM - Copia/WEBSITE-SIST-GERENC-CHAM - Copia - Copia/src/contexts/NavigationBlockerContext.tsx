import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationBlockerContextType {
  isNavigationBlocked: boolean;
  blockNavigation: () => void;
  unblockNavigation: () => void;
  getPendingDestination: () => string | null;
  setPendingDestination: (destination: string | null) => void;
  getShowConfirmDialog: () => boolean;
  setShowConfirmDialog: (show: boolean) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextType | undefined>(undefined);

export const NavigationBlockerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavigationBlocked, setIsNavigationBlocked] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();

  const blockNavigation = useCallback(() => {
    setIsNavigationBlocked(true);
  }, []);

  const unblockNavigation = useCallback(() => {
    setIsNavigationBlocked(false);
  }, []);

  const getPendingDestination = useCallback(() => {
    return pendingDestination;
  }, [pendingDestination]);

  const getShowConfirmDialog = useCallback(() => {
    return showConfirmDialog;
  }, [showConfirmDialog]);

  const confirmNavigation = useCallback(() => {
    setShowConfirmDialog(false);
    unblockNavigation();
    if (pendingDestination) {
      navigate(pendingDestination);
    } else {
      navigate(-1);
    }
    setPendingDestination(null);
  }, [pendingDestination, navigate, unblockNavigation]);

  const cancelNavigation = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingDestination(null);
  }, []);

  const value: NavigationBlockerContextType = {
    isNavigationBlocked,
    blockNavigation,
    unblockNavigation,
    getPendingDestination,
    setPendingDestination,
    getShowConfirmDialog,
    setShowConfirmDialog,
    confirmNavigation,
    cancelNavigation,
  };

  return (
    <NavigationBlockerContext.Provider value={value}>
      {children}
    </NavigationBlockerContext.Provider>
  );
};

export const useNavigationBlocker = () => {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error('useNavigationBlocker deve ser usado dentro de NavigationBlockerProvider');
  }
  return context;
};

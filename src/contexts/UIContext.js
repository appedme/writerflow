"use client";
import { createContext, useContext, useState } from "react";

const UIContext = createContext();

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

export const UIProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);

  const showToast = (message, type = "info", duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), duration);
  };

  const showModal = (component, props = {}) => {
    setModal({ component, props });
  };

  const hideModal = () => {
    setModal(null);
  };

  const value = {
    isLoading,
    setIsLoading,
    toast,
    showToast,
    modal,
    showModal,
    hideModal,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
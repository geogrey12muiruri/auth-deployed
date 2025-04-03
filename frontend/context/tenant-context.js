"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context
const TenantContext = createContext();

// Create a provider component
export const TenantProvider = ({ children }) => {
  const [tenantDetails, setTenantDetails] = useState(null);

  // Function to set tenant details
  const setTenantData = (data) => {
    setTenantDetails(data);
    localStorage.setItem("tenantDetails", JSON.stringify(data));
  };

  // Rehydrate tenant details from localStorage on initialization
  useEffect(() => {
    try {
      const storedDetails = JSON.parse(localStorage.getItem("tenantDetails"));
      if (storedDetails) {
        setTenantDetails(storedDetails);
      }
    } catch (error) {
      console.error("Error rehydrating tenant details:", error);
    }
  }, []);

  return (
    <TenantContext.Provider value={{ tenantDetails, setTenantData }}>
      {children}
    </TenantContext.Provider>
  );
};

// Custom hook to use the TenantContext
export const useTenantContext = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenantContext must be used within a TenantProvider");
  }
  return context;
};

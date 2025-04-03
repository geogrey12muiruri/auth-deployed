"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context
const AuditContext = createContext();

// Create a provider component
export const AuditProvider = ({ children }) => {
  const [program, setProgram] = useState(null);
  const [audit, setAudit] = useState(null);

  // Rehydrate context from localStorage on initialization
  useEffect(() => {
    try {
      const storedContext = JSON.parse(localStorage.getItem("auditContext"));
      if (storedContext) {
        setProgram(storedContext.program);
        setAudit(storedContext.audit);
      }
    } catch (error) {
      console.error("Error rehydrating audit context:", error);
    }
  }, []);

  // Save context to localStorage whenever it changes
  useEffect(() => {
    if (program && audit) {
      localStorage.setItem("auditContext", JSON.stringify({ program, audit }));
    }
  }, [program, audit]);

  // Function to set program and audit data
  const setAuditData = (programData, auditData) => {
    setProgram(programData);
    setAudit(auditData);
    localStorage.setItem("auditContext", JSON.stringify({ program: programData, audit: auditData }));
  };

  // Function to clear program and audit data
  const clearAuditData = () => {
    setProgram(null);
    setAudit(null);
    localStorage.removeItem("auditContext");
  };

  return (
    <AuditContext.Provider value={{ program, audit, setAuditData, clearAuditData }}>
      {children}
    </AuditContext.Provider>
  );
};

// Custom hook to use the AuditContext
export const useAuditContext = () => {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error("useAuditContext must be used within an AuditProvider");
  }
  return context;
};
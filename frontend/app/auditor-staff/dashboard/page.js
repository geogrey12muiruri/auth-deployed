"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useAuditContext } from "@/context/audit-context"; // Import AuditContext
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

const AuditorTeamLeaderDashboard = () => {
  const { token, user } = useAuth();
  const router = useRouter();
  const { setAuditData } = useAuditContext(); // Destructure setAuditData from context
  const [tab, setTab] = useState("active");
  const [auditPrograms, setAuditPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProgram, setOpenProgram] = useState(null); // Track which program's audits are expanded

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("http://localhost:5004/api/audit-programs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch audit programs");
        const data = await response.json();

        const filteredPrograms = data.map((program) => ({
          ...program,
          isPending: program.audits.some(
            (audit) => audit.team?.leader === user?.email && audit.status === "Pending"
          ),
          isActive: program.status === "Active",
          isCompleted: program.status === "Completed",
        }));
        setAuditPrograms(filteredPrograms);
      } catch (error) {
        console.error("Error fetching audit programs:", error.message);
        setAuditPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.roleName?.toUpperCase() === "AUDITOR") fetchPrograms();
  }, [token, user]);

  const filteredPrograms = auditPrograms
    .sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1))
    .filter((program) =>
      tab === "pending"
        ? program.isPending
        : tab === "active"
        ? program.isActive
        : program.isCompleted
    );

  const handleToggleAudits = (programId) => {
    // Toggle the accordion for the selected program
    setOpenProgram(openProgram === programId ? null : programId);
  };

  const handleSelectAudit = (program, audit) => {
    // Set program and audit data in context and navigate to the audit plan page
    setAuditData(program, audit);
    router.push(`/auditor-staff/audit-plan/${program.id}/${audit.id}`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Team Leader Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <RoleProtectedRoute requiredRole="AUDITOR">
      <DashboardLayout>
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">
            Welcome, {user?.name || "User"}
          </h1>

          <Tabs value={tab} onValueChange={setTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="active">Active Programs</TabsTrigger>
              <TabsTrigger value="pending">Pending Programs</TabsTrigger>
              <TabsTrigger value="completed">Completed Programs</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-6">
            {filteredPrograms.length > 0 ? (
              filteredPrograms.map((program) => (
                <Card key={program.id} className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">{program.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Objective:</strong> {program.auditProgramObjective || "Not specified"}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Duration:</strong> {new Date(program.startDate).toLocaleDateString()} -{" "}
                        {new Date(program.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Status:</strong> {program.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Audits:</strong> {program.audits?.length || 0} audit(s) assigned
                      </p>
                    </div>
                    <Accordion type="single" collapsible value={openProgram === program.id ? program.id : undefined}>
                      <AccordionItem value={program.id}>
                        <AccordionTrigger 
                          className="mt-4 flex justify-end w-full"
                          onClick={() => handleToggleAudits(program.id)}
                        >
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Create Audit Plan
                          </Button>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 mt-2">
                            {program.audits?.map((audit, index) => (
                              <Card key={audit.id} className="shadow-sm">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h4 className="text-md font-semibold">
                                        Audit {index + 1} ({audit.id})
                                      </h4>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleSelectAudit(program, audit)}
                                    >
                                      Select Audit
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">
                No audit programs found for this category.
              </p>
            )}
          </div>
        </div>
      </DashboardLayout>
    </RoleProtectedRoute>
  );
};

export default AuditorTeamLeaderDashboard;
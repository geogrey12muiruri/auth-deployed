"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RoleProtectedRoute from '../../../components/RoleProtectedRoute';
import DashboardLayout from '../../../components/DashboardLayout';

const AuditorTeamLeaderDashboard = () => {
  const { token, user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [auditPrograms, setAuditPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

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
            (audit) =>
              audit.team?.leader === user?.email && audit.status === "Pending"
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

  const filteredPrograms = auditPrograms.filter((program) =>
    tab === "pending"
      ? program.isPending
      : tab === "active"
      ? program.isActive
      : program.isCompleted
  );

  const handleReplaceMember = (auditId, oldMember, newMember) => {
    // API call to replace member would go here
    console.log(`Replacing ${oldMember} with ${newMember} in audit ${auditId}`);
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

          <div className="space-y-12">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Audit Programs</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredPrograms.map((program) => (
                  <div key={program.id} className="mb-8">
                    <div className="mb-4 p-3 bg-gray-100 rounded-lg shadow-inner">
                      <h3 className="text-lg font-semibold">Audit Program: {program.name}</h3>
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
                    </div>

                    <div className="overflow-x-auto">
                      <Table className="min-w-full border rounded-md shadow-sm">
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-bold border-r w-48 sticky left-0 bg-gray-200">
                              Audit Component
                            </TableHead>
                            {program.audits?.map((_, index) => (
                              <TableHead key={index} className="font-bold text-center border-r">
                                Audit {index + 1}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Audit No</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r text-center break-words">
                                {audit.id.split("A-")[1]}-{audit.auditProgramId.split("AP-")[1]}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Scope</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r break-words">
                                {Array.isArray(audit.scope) && audit.scope.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {audit.scope.map((item, i) => (
                                      <li key={i} className="text-sm">{item}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  "Not specified"
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Objectives</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r break-words">
                                {Array.isArray(audit.specificAuditObjective) && audit.specificAuditObjective.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {audit.specificAuditObjective.map((obj, i) => (
                                      <li key={i} className="text-sm">{obj}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  "Not specified"
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Methods</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r break-words">
                                {Array.isArray(audit.methods) && audit.methods.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {audit.methods.map((method, i) => (
                                      <li key={i} className="text-sm">{method}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  "Not specified"
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Criteria</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r break-words">
                                {Array.isArray(audit.criteria) && audit.criteria.length > 0 ? (
                                  <ul className="list-disc list-inside">
                                    {audit.criteria.map((criterion, i) => (
                                      <li key={i} className="text-sm">{criterion}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  "Not specified"
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Teams</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r break-words">
                                {audit.team
                                  ? `${audit.team.leader || "Leader TBD"} (${audit.team.members?.join(", ") || "No members"})`
                                  : "Not Assigned"}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </RoleProtectedRoute>
  );
};

export default AuditorTeamLeaderDashboard;
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuditorAuditProgramsPage() {
  const { token, user } = useAuth();
  const [auditPrograms, setAuditPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({});

  // Fetch audit programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("http://localhost:5004/api/audit-programs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch audit programs");
        const data = await response.json();

        // Filter programs based on the user's role and team membership
        const filteredPrograms = data.filter((program) =>
          program.audits.some((audit) =>
            audit.team &&
            (audit.team.leader === user.email || audit.team.members.includes(user.email))
          )
        );

        setAuditPrograms(filteredPrograms);
      } catch (error) {
        console.error("Error fetching audit programs:", error.message);
        setAuditPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role?.toUpperCase() === "AUDITOR") fetchPrograms();
  }, [token, user]);

  const handleAcceptInvitation = async (auditId) => {
    try {
      const response = await fetch(`http://localhost:5004/api/audits/${auditId}/accept`, {
        method: "POST", // Ensure this is a POST request
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the JWT token
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }
  
      const data = await response.json();
      console.log("Invitation accepted successfully:", data.message);
      // Optionally refresh the audit programs list or update the UI
    } catch (error) {
      console.error("Error accepting invitation:", error.message);
      alert(error.message || "An error occurred while accepting the invitation.");
    }
  };
  // Render loading state
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Audit Programs</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // Render the audit programs
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Audit Programs</h1>
      <div className="space-y-8">
        {auditPrograms.length > 0 ? (
          auditPrograms.map((program) => (
            <Card key={program.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{program.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-pink-100 rounded-lg shadow-inner">
                  <h3 className="text-lg font-semibold">Audit Program: {program.name}</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Audit Program Objective:</strong> {program.auditProgramObjective || "Not specified"}
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
                        <TableHead className="font-bold border-r w-48 sticky left-0 bg-gray-200 whitespace-nowrap">
                          Audit Component
                        </TableHead>
                        {program.audits?.map((_, index) => (
                          <TableHead 
                            key={index} 
                            className="font-bold text-center border-r min-w-[200px] whitespace-nowrap"
                          >
                            Audit {index + 1}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Render rows for Scope, Objectives, Methods, Criteria, Teams */}
                      {["Scope", "Objectives", "Methods", "Criteria", "Teams"].map((component, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50">
                          <TableCell className="font-medium border-r whitespace-nowrap">{component}</TableCell>
                          {program.audits?.map((audit) => (
                            <TableCell 
                              key={audit.id} 
                              className="border-r min-w-[200px] max-w-[300px] whitespace-normal break-words py-2 px-4"
                            >
                              {component === "Teams"
                                ? audit.team
                                  ? `${audit.team.leader || "Leader TBD"} (${audit.team.members?.join(", ") || "No members"})`
                                  : "Not Assigned"
                                : Array.isArray(audit[component.toLowerCase()]) && audit[component.toLowerCase()].length > 0
                                ? audit[component.toLowerCase()].join(", ")
                                : "Not specified"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Action Buttons */}
                {program.status === "Active" && (
                  <div className="mt-6 p-4 bg-pink-50 rounded-lg flex flex-col items-center gap-4">
                    <div className="flex gap-4">
                      <Button
                        variant="default"
                        size="lg"
                        className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                        onClick={() => handleAcceptInvitation(program.id, "accept")}
                        disabled={actionStatus[program.id]?.loading}
                      >
                        {actionStatus[program.id]?.loading ? "Accepting..." : "Accept Invitation"}
                      </Button>
                      <Button
                        variant="default"
                        size="lg"
                        className="bg-red-600 hover:bg-red-700 min-w-[150px]"
                        onClick={() => handleAction(program.id, "decline")}
                        disabled={actionStatus[program.id]?.loading}
                      >
                        {actionStatus[program.id]?.loading ? "Declining..." : "Decline Invitation"}
                      </Button>
                    </div>
                    {actionStatus[program.id]?.success && (
                      <span className="text-green-500 text-sm">{actionStatus[program.id].success}</span>
                    )}
                    {actionStatus[program.id]?.error && (
                      <span className="text-red-500 text-sm">{actionStatus[program.id].error}</span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">No audit programs found.</p>
        )}
      </div>
    </div>
  );
}
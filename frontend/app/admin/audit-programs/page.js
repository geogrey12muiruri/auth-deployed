"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAuditProgramsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [tab, setTab] = useState("pending");
  const [auditPrograms, setAuditPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({});

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await fetch("http://localhost:5004/api/audit-programs/admin", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch audit programs");
        const data = await response.json();
        setAuditPrograms(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching audit programs:", error.message);
        setAuditPrograms([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?.roleName?.toUpperCase() === "ADMIN") fetchPrograms();
  }, [token, user]);

  const handleCreateProgram = () => {
    router.push("/admin/new-program");
  };

  const handleApproveProgram = async (id) => {
    setActionStatus((prev) => ({ ...prev, [id]: { loading: true, error: null, action: "approve" } }));
    try {
      const response = await fetch(`http://localhost:5004/api/audit-programs/${id}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve audit program");
      }
      const updatedProgram = await response.json();

      const refreshedResponse = await fetch("http://localhost:5004/api/audit-programs/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!refreshedResponse.ok) throw new Error("Failed to refresh audit programs");
      const refreshedData = await refreshedResponse.json();
      setAuditPrograms(Array.isArray(refreshedData) ? refreshedData : []);

      setActionStatus((prev) => ({
        ...prev,
        [id]: { loading: false, success: "Program Approved and Published" },
      }));
      setTimeout(() => setActionStatus((prev) => ({ ...prev, [id]: {} })), 3000);
    } catch (error) {
      console.error("Error approving audit program:", error.message);
      setActionStatus((prev) => ({
        ...prev,
        [id]: { loading: false, error: error.message || "Failed to approve. Try again." },
      }));
    }
  };

  const handleRejectProgram = async (id) => {
    setActionStatus((prev) => ({ ...prev, [id]: { loading: true, error: null, action: "reject" } }));
    try {
      const response = await fetch(`http://localhost:5004/api/audit-programs/${id}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject audit program");
      }
      const updatedProgram = await response.json();

      const refreshedResponse = await fetch("http://localhost:5004/api/audit-programs/admin", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!refreshedResponse.ok) throw new Error("Failed to refresh audit programs");
      const refreshedData = await refreshedResponse.json();
      setAuditPrograms(Array.isArray(refreshedData) ? refreshedData : []);

      setActionStatus((prev) => ({
        ...prev,
        [id]: { loading: false, success: "Program Rejected" },
      }));
      setTimeout(() => setActionStatus((prev) => ({ ...prev, [id]: {} })), 3000);
    } catch (error) {
      console.error("Error rejecting audit program:", error.message);
      setActionStatus((prev) => ({
        ...prev,
        [id]: { loading: false, error: error.message || "Failed to reject. Try again." },
      }));
    }
  };

  const filteredPrograms = auditPrograms.filter((program) => {
    const status = program.status || "";
    return tab === "active"
      ? status === "Active"
      : tab === "completed"
      ? status === "Completed"
      : tab === "scheduled"
      ? status === "Scheduled"
      : tab === "draft"
      ? status === "Draft"
      : status === "Pending Approval";
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Audit Programs</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (user?.roleName?.toUpperCase() !== "ADMIN") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Audit Programs</h1>
        <p className="text-red-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Audit Programs</h1>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="active">Active Programs</TabsTrigger>
          <TabsTrigger value="completed">Completed Programs</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Programs</TabsTrigger>
          <TabsTrigger value="draft">Draft Programs</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex justify-end mb-6">
        <Button
          variant="default"
          size="sm"
          className="bg-cyan-600 hover:bg-cyan-700"
          onClick={handleCreateProgram}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Button>
      </div>

      <div className="space-y-8">
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((program) => (
            <Card key={program.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{program.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-gray-100 rounded-lg shadow-inner">
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
                  <Table className="w-full border border-gray-200">
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="w-40 font-semibold border-r py-2 px-4 sticky left-0 bg-gray-100">
                          Audit Component
                        </TableHead>
                        {program.audits?.map((_, index) => (
                          <TableHead key={index} className="font-semibold border-r py-2 px-4">
                            Audit {index + 1}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="w-40 font-medium border-r py-2 px-4 sticky left-0 bg-white">Audit No</TableCell>
                        {program.audits?.map((audit) => (
                          <TableCell key={audit.id} className="border-r py-2 px-4 break-words">
                            {audit.id.split("A-")[1]}-{audit.auditProgramId.split("AP-")[1]}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="hover:bg-gray-50 bg-gray-50">
                        <TableCell className="w-40 font-medium border-r py-2 px-4 sticky left-0 bg-gray-50">Scope</TableCell>
                        {program.audits?.map((audit) => (
                          <TableCell key={audit.id} className="border-r py-2 px-4 break-words">
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
                        <TableCell className="w-40 font-medium border-r py-2 px-4 sticky left-0 bg-white">Objectives</TableCell>
                        {program.audits?.map((audit) => (
                          <TableCell key={audit.id} className="border-r py-2 px-4 break-words">
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
                      <TableRow className="hover:bg-gray-50 bg-gray-50">
                        <TableCell className="w-40 font-medium border-r py-2 px-4 sticky left-0 bg-gray-50">Methods</TableCell>
                        {program.audits?.map((audit) => (
                          <TableCell key={audit.id} className="border-r py-2 px-4 break-words">
                            {Array.isArray(audit.methods) && audit.methods.length > 0
                              ? audit.methods.join(", ")
                              : "Not specified"}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="w-40 font-medium border-r py-2 px-4 sticky left-0 bg-white">Criteria</TableCell>
                        {program.audits?.map((audit) => (
                          <TableCell key={audit.id} className="border-r py-2 px-4 break-words">
                            {Array.isArray(audit.criteria) && audit.criteria.length > 0
                              ? audit.criteria.join(", ")
                              : "Not specified"}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow className="hover:bg-gray-50 bg-gray-50">
                        <TableCell className="w-40 font-medium border-r py-2 px-4 sticky left-0 bg-gray-50">Teams</TableCell>
                        {program.audits?.map((audit) => (
                          <TableCell key={audit.id} className="border-r py-2 px-4 break-words">
                            {audit.team
                              ? `${audit.team.leader || "Leader TBD"} (${audit.team.members?.join(", ") || "No members"})`
                              : "Not Assigned"}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                {(!program.audits || program.audits.length === 0) && (
                  <p className="text-center text-muted-foreground mt-4">No audits available</p>
                )}
                <div className="mt-4 flex justify-end space-x-2">
                  {program.status === "Pending Approval" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveProgram(program.id)}
                        disabled={actionStatus[program.id]?.loading}
                      >
                        {actionStatus[program.id]?.loading && actionStatus[program.id]?.action === "approve"
                          ? "Approving..."
                          : "Approve"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRejectProgram(program.id)}
                        disabled={actionStatus[program.id]?.loading}
                      >
                        {actionStatus[program.id]?.loading && actionStatus[program.id]?.action === "reject"
                          ? "Rejecting..."
                          : "Reject"}
                      </Button>
                    </>
                  )}
                  {actionStatus[program.id]?.success && (
                    <span className="text-green-500 text-sm">{actionStatus[program.id].success}</span>
                  )}
                  {actionStatus[program.id]?.error && (
                    <span className="text-red-500 text-sm">{actionStatus[program.id].error}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">
            No audit programs found for this category.
          </p>
        )}
      </div>

      <footer className="mt-8 text-sm text-muted-foreground">
        <p>Administered by: Admin</p>
      </footer>
    </div>
  );
}

export const dynamic = "force-dynamic";
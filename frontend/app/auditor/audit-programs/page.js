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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AuditProgramsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [tab, setTab] = useState("draft");
  const [auditPrograms, setAuditPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState({});
useEffect(() => {
  const fetchPrograms = async () => {
    try {
      const response = await fetch("http://localhost:5004/api/audit-programs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch audit programs");
      const data = await response.json();
      console.log("Fetched audit programs:", data); // Debugging
      setAuditPrograms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching audit programs:", error);
      setAuditPrograms([]);
    } finally {
      setLoading(false);
    }
  };
  if (user?.roleName?.toUpperCase() === "MR") fetchPrograms();
  else setLoading(false);
}, [token, user]);

  const handleCreateProgram = () => router.push("/auditor/new-program");

  const handleSubmitForApproval = async (id) => {
    setSubmitStatus((prev) => ({ ...prev, [id]: { loading: true, error: null } }));
    try {
      const response = await fetch(`http://localhost:5004/api/audit-programs/${id}/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to submit audit program");
      const updatedProgram = await response.json();
      console.log(`Audit Program ${id} submitted:`, updatedProgram);

      const refreshedResponse = await fetch("http://localhost:5004/api/audit-programs", { headers: { Authorization: `Bearer ${token}` } });
      const refreshedData = await refreshedResponse.json();
      setAuditPrograms(Array.isArray(refreshedData) ? refreshedData : []);

      setSubmitStatus((prev) => ({ ...prev, [id]: { loading: false, success: "Submitted for approval" } }));
      setTimeout(() => setSubmitStatus((prev) => ({ ...prev, [id]: {} })), 3000);
    } catch (error) {
      console.error("Error submitting audit program:", error);
      setSubmitStatus((prev) => ({ ...prev, [id]: { loading: false, error: "Failed to submit. Try again." } }));
    }
  };

  const handleAssignTeams = (auditProgramId) => router.push(`/auditor/assaign-teams/${auditProgramId}`);

   const filteredPrograms = auditPrograms.filter((program) => {
    const status = program.status || "";
    return tab === "active"
      ? status === "Active"
      : tab === "completed"
      ? status === "Completed"
      : tab === "scheduled"
      ? status === "Scheduled"
      : status === "Draft" || status === "Pending Approval";
  });

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><h1 className="text-3xl font-bold mb-6">Audit Programs</h1><p>Loading...</p></div>;
  if (user?.roleName?.toUpperCase() !== "MR") return <div className="p-6 max-w-7xl mx-auto"><h1 className="text-3xl font-bold mb-6">Audit Programs</h1><p className="text-red-500">Access denied. Auditor General privileges required.</p></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Audit Programs</h1>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Programs</TabsTrigger>
          <TabsTrigger value="completed">Completed Programs</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Programs</TabsTrigger>
          <TabsTrigger value="draft">Draft Programs</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex justify-end mb-6">
        <Button variant="default" size="sm" className="bg-cyan-600 hover:bg-cyan-700" onClick={handleCreateProgram}>
          <Plus className="h-4 w-4 mr-2" /> New Program
        </Button>
      </div>

      <div className="space-y-6">
        {filteredPrograms.length > 0 ? (
          filteredPrograms.map((program) => (
            <Card key={program.id} className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{program.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value={program.id}>
                    <AccordionTrigger>View Audits ({program.audits?.length || 0})</AccordionTrigger>
                    <AccordionContent>
                      {/* Metadata as Title */}
                      <div className="mb-4 p-3 bg-gray-100 rounded-lg shadow-inner">
                        <h3 className="text-lg font-semibold">Audit Program: {program.name}</h3>
                        <p className="text-sm text-gray-600"><strong>Objective:</strong> {program.auditProgramObjective || "N/A"}</p>
                        <p className="text-sm text-gray-600"><strong>Duration:</strong> {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-600"><strong>Status:</strong> {program.status}</p>
                      </div>

                      {/* Vertical Audit Table */}
                      <Table className="min-w-full border rounded-md shadow-sm">
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Team</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r max-w-xs break-words">
                                {audit.team
                                  ? `${audit.team.leader || "TBD"} (${audit.team.members?.join(", ") || "None"})`
                                  : "Not Assigned"}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Audit No Row */}
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Audit No</TableCell>
                            {program.audits?.map((audit, index) => (
                              <TableCell key={audit.id} className="border-r text-center max-w-xs break-words">
                                A-{index + 1}-{audit.auditProgramId.split("AP-")[1]}
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Scope Row */}
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Scope</TableCell>
                            {program.audits?.map((audit) => (
                                                           <TableCell key={audit.id} className="border-r max-w-xs break-words">
                                <ul className="list-disc list-inside">
                                  {Array.isArray(audit.scope) && audit.scope.length > 0
                                    ? audit.scope.map((item, idx) => <li key={idx}>{item}</li>)
                                    : <li>N/A</li>}
                                </ul>
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Objectives Row */}
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Objectives</TableCell>
                            {program.audits?.map((audit) => (
                                                          <TableCell key={audit.id} className="border-r max-w-xs break-words">
                                <ul className="list-disc list-inside">
                                  {Array.isArray(audit.specificAuditObjective) && audit.specificAuditObjective.length > 0
                                    ? audit.specificAuditObjective.map((obj, idx) => <li key={idx}>{obj}</li>)
                                    : <li>N/A</li>}
                                </ul>
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Methods Row */}
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Methods</TableCell>
                            {program.audits?.map((audit) => (
                                                            <TableCell key={audit.id} className="border-r max-w-xs break-words">
                                {Array.isArray(audit.methods) && audit.methods.length > 0
                                  ? audit.methods.join(", ")
                                  : "N/A"}
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Criteria Row */}
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Criteria</TableCell>
                            {program.audits?.map((audit) => (
                                                            <TableCell key={audit.id} className="border-r max-w-xs break-words">
                                {Array.isArray(audit.criteria) && audit.criteria.length > 0
                                  ? audit.criteria.join(", ")
                                  : "N/A"}
                              </TableCell>
                            ))}
                          </TableRow>
                          {/* Team Row */}
                          <TableRow className="hover:bg-gray-50">
                            <TableCell className="font-medium border-r">Team</TableCell>
                            {program.audits?.map((audit) => (
                              <TableCell key={audit.id} className="border-r max-w-xs break-words">
                                {audit.team ? `${audit.team.leader || "TBD"} (${audit.team.members?.join(", ") || "None"})` : "Not Assigned"}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableBody>
                      </Table>
                      {(!program.audits || program.audits.length === 0) && (
                        <p className="text-center text-muted-foreground mt-4">No audits available</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <div className="mt-4 flex justify-end space-x-2">
                  {(program.status === "Draft" || program.status === "Pending Approval") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubmitForApproval(program.id)}
                      disabled={submitStatus[program.id]?.loading || !program.audits?.length}
                    >
                      {submitStatus[program.id]?.loading ? "Submitting..." : "Submit for Approval"}
                    </Button>
                  )}
                  {program.status === "Active" && (
                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleAssignTeams(program.id)}>
                      Assign Teams
                    </Button>
                  )}
                  {submitStatus[program.id]?.success && <span className="text-green-500 text-sm">{submitStatus[program.id].success}</span>}
                  {submitStatus[program.id]?.error && <span className="text-red-500 text-sm">{submitStatus[program.id].error}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">No audit programs found. Create a new one to get started!</p>
        )}
      </div>

      <footer className="mt-8 text-sm text-muted-foreground"><p>Prepared by: Auditor General</p></footer>
    </div>
  );
}

export const dynamic = "force-dynamic";
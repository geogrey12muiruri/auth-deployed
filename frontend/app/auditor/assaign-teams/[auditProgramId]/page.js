"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming a Select component exists

export default function AssignTeamsPage() {
  const router = useRouter();
  const params = useParams();
  const auditProgramId = params.auditProgramId;
  const { token, user } = useAuth();
  const [auditProgram, setAuditProgram] = useState(null);
  const [teams, setTeams] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [auditors, setAuditors] = useState([]);

    useEffect(() => {
    console.log("User object:", user); // Debug log to verify user object
  
    const fetchAuditProgram = async () => {
      try {
        const response = await fetch(`http://localhost:5004/api/audit-programs/${auditProgramId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch audit program");
        const data = await response.json();
        console.log("Fetched audit program:", data); // Debug log
        setAuditProgram(data);
  
        // Initialize teams with existing data or defaults
        const initialTeams = {};
        data.audits.forEach((audit) => {
          initialTeams[audit.id] = audit.team || { leader: "", members: [] };
        });
        setTeams(initialTeams);
      } catch (error) {
        console.error("Error fetching audit program:", error);
      } finally {
        setLoading(false);
      }
    };
  
                const fetchAuditors = async () => {
          try {
            console.log("Fetching auditors for tenantId:", user.tenantId); // Debug log
        
            // Replace this with the actual roleId for AUDITOR
            const auditorRoleId = "0776ba53-2e43-41a5-92a5-26dba346d1d0"; // Replace with the correct roleId for AUDITOR
        
            const response = await fetch(
              `http://localhost:5001/api/tenants/${user.tenantId}/users/role/${auditorRoleId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
        
            if (!response.ok) throw new Error("Failed to fetch auditors");
            const auditors = await response.json();
        
            if (auditors.length === 0) {
              console.warn("No auditors found for the specified tenant."); // Debug log
            }
        
            setAuditors(auditors);
          } catch (error) {
            console.error("Error fetching auditors:", error);
          }
        };
        
    // Check if the user is the Auditor General (MR role)
    if (user?.roleName?.toUpperCase() === "MR" || user?.roleName?.toUpperCase() === "AUDITOR GENERAL") {
      fetchAuditProgram();
      fetchAuditors();
    } else {
      setLoading(false);
    }
  }, [token, user, auditProgramId]);
  
  const handleTeamChange = (auditId, field, value) => {
    setTeams((prev) => ({
      ...prev,
      [auditId]: { ...prev[auditId], [field]: value },
    }));
  };
  
  const handleAddMember = (auditId, member) => {
    if (member && !teams[auditId].members.includes(member)) {
      setTeams((prev) => ({
        ...prev,
        [auditId]: { ...prev[auditId], members: [...prev[auditId].members, member] },
      }));
    }
  };
  
  const handleSubmit = async () => {
    setSubmitStatus({ loading: true, error: null });
    try {
      for (const auditId in teams) {
        const teamData = teams[auditId];
        const response = await fetch(`http://localhost:5004/api/audits/${auditId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ team: teamData }),
        });
        if (!response.ok) throw new Error(`Failed to update audit ${auditId}`);
      }
      setSubmitStatus({ loading: false, success: "Teams assigned successfully" });
      setTimeout(() => router.push("/auditor/audit-programs"), 2000);
    } catch (error) {
      console.error("Error assigning teams:", error);
      setSubmitStatus({ loading: false, error: "Failed to assign teams. Try again." });
    }
  };


  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Assign Teams</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    console.log("User object is not loaded yet.");
    return <p>Loading user data...</p>;
  }

  console.log("User object:", user); // Debug log to verify user object
  console.log("User roleName:", user?.roleName?.toUpperCase()); // Debug log for roleName

  if (user?.roleName?.toUpperCase() !== "MR" && user?.roleName?.toUpperCase() !== "AUDITOR GENERAL") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Assign Teams</h1>
        <p className="text-red-500">Access denied. Auditor General privileges required.</p>
      </div>
    );
  }

  if (!auditProgram || auditProgram.status !== "Active") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Assign Teams</h1>
        <p className="text-red-500">Invalid or unauthorized audit program.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Assign Teams - {auditProgram.name}</h1>
      <div className="space-y-6">
        {auditProgram.audits.map((audit) => (
          <Card key={audit.id}>
            <CardHeader>
              <CardTitle>Audit {audit.id.split("A-")[1]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Team Leader Dropdown */}
                <div>
                  <Label>Team Leader</Label>
                  <Select
                    onValueChange={(value) => handleTeamChange(audit.id, "leader", value)} // Update the leader field
                    value={teams[audit.id].leader} // Bind the selected value to the leader field
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a team leader" />
                    </SelectTrigger>
                    <SelectContent>
                      {auditors.map((auditor) => (
                        <SelectItem key={auditor.id} value={auditor.email}>
                          {auditor.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
        
                {/* Team Members Dropdown */}
                <div>
                  <Label>Team Members</Label>
                  <div className="space-y-2">
                    <Select
                      onValueChange={(value) => handleAddMember(audit.id, value)} // Use onValueChange for Select
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a member to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {auditors.map((auditor) => (
                          <SelectItem key={auditor.id} value={auditor.email}>
                            {auditor.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ul className="mt-2 list-disc pl-5">
                      {teams[audit.id].members.map((member, i) => (
                        <li key={i}>{member}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-end space-x-2">
          <Button onClick={handleSubmit} disabled={submitStatus?.loading}>
            {submitStatus?.loading ? "Submitting..." : "Save Teams"}
          </Button>
          {submitStatus?.success && (
            <span className="text-green-500">{submitStatus.success}</span>
          )}
          {submitStatus?.error && <span className="text-red-500">{submitStatus.error}</span>}
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuditContext } from "@/context/audit-context";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { auditCriteria, auditMethods } from "@/constants/audit-options";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTenantContext } from "@/context/tenant-context";

const AuditPlanPage = () => {
  const router = useRouter();
  const { program, audit } = useAuditContext();
  const { token } = useAuth();
  const { setTenantData } = useTenantContext();

  // State for tenant's departments (scope)
  const [departments, setDepartments] = useState([]);
  const [editMode, setEditMode] = useState(true); // Default to edit mode
  const [scope, setScope] = useState(audit?.scope || []); // Use scope from audit context
  const [objectives, setObjectives] = useState(audit?.specificAuditObjective || []);
  const [criteria, setCriteria] = useState(audit?.criteria || []);
  const [methods, setMethods] = useState(audit?.methods || []);
  const [team, setTeam] = useState(audit?.team || { leader: "", members: [] }); // Use team from audit context
  const [notes, setNotes] = useState(audit?.notes || []); // State for notes

  // Temporary input states for adding new items
  const [newScope, setNewScope] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newCriterion, setNewCriterion] = useState([]);
  const [newMethod, setNewMethod] = useState([]);
  const [newMember, setNewMember] = useState("");
  const [newNote, setNewNote] = useState(""); // Temporary input state for adding a new note

  // State for schedule modal and schedule data
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedule, setSchedule] = useState([]);

  const auditActivities = [
    "Opening Meeting",
    "Auditing Departments",
    "Health Break",
    "Auditors Meeting",
    "Closing Meeting",
  ];

  const responsibilities = ["Auditors", "Auditee Management", "All"];

  // Fetch tenant's departments (scope)
  useEffect(() => {
    const fetchTenantDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/tenants/${program.tenantId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch tenant details");
        const data = await response.json();
        setDepartments(data.departments || []);
        setTenantData(data); // Store tenant details in TenantContext
      } catch (error) {
        console.error("Error fetching tenant details:", error);
      }
    };

    if (program?.tenantId && token) {
      fetchTenantDetails();
    }
  }, [program, token, setTenantData]);

  // Load data on page load
  useEffect(() => {
    // Check if there is saved data in local storage
    const savedAuditPlan = localStorage.getItem("auditPlan");

    if (savedAuditPlan) {
      const parsedData = JSON.parse(savedAuditPlan);

      // Load the saved data into the component's state
      setScope(parsedData.scope || []);
      setObjectives(parsedData.objectives || []);
      setCriteria(parsedData.criteria || []);
      setMethods(parsedData.methods || []);
      setTeam(parsedData.team || { leader: "", members: [] });
      setNotes(parsedData.notes || []);

      console.log("Loaded audit plan from local storage:", parsedData);
    }
  }, []);

  // Handle saving changes
  const handleSave = () => {
    // Create an object to store the audit plan data
    const auditPlanData = {
      scope,
      objectives,
      criteria,
      methods,
      team,
      notes, // Include notes in the saved data
    };

    // Save the data to local storage
    localStorage.setItem("auditPlan", JSON.stringify(auditPlanData));

    // Save audit results to local storage
    const auditResults = {
      programName: program.name,
      auditName: audit.name,
      scope,
      objectives,
      criteria,
      methods,
      team,
      notes, // Include notes in the results
    };
    localStorage.setItem("auditResults", JSON.stringify(auditResults));

    // Clear temporary input states
    setNewScope("");
    setNewObjective("");
    setNewCriterion([]);
    setNewMethod([]);
    setNewMember("");
    setNewNote("");

    // Exit edit mode
    setEditMode(false);

    console.log("Audit plan and results saved locally:", auditPlanData, auditResults);
  };

  // Reset function to clear local storage and reset state
  const handleReset = () => {
    localStorage.removeItem("auditPlan");
    setScope([]);
    setObjectives([]);
    setCriteria([]);
    setMethods([]);
    setTeam({ leader: "", members: [] });
    setNotes([]);
    console.log("Audit plan reset.");
  };

  // Add a new row to the schedule
  const handleAddRow = () => {
    setSchedule((prev) => [...prev, { dateTime: "", activity: "", responsibility: "" }]);
  };

  // Update a specific row in the schedule
  const handleUpdateRow = (index, field, value) => {
    setSchedule((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // Remove a row from the schedule
  const handleRemoveRow = (index) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  // Save the schedule and close the modal
  const handleSaveSchedule = () => {
    localStorage.setItem("auditSchedule", JSON.stringify(schedule));
    setIsScheduleModalOpen(false);
    console.log("Schedule saved:", schedule);
  };

  // Pass scope and team data to the scheduling page
  const handleCreateSchedule = () => {
    localStorage.setItem("auditScope", JSON.stringify(scope));
    localStorage.setItem("auditTeam", JSON.stringify(team));
    router.push(`/auditor-staff/schedule`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Audit Plan</h1>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            {program.name} - Program Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scope Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700">Audit Scope</h3>
            {editMode ? (
              <div className="space-y-2">
                <select
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  className="border rounded p-2 w-full"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScope((prev) => [...prev, newScope]);
                    setNewScope("");
                  }}
                >
                  Add Scope
                </Button>
                <div className="flex flex-wrap gap-2">
                  {scope.map((scopeItem, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {departments.find((dept) => dept.id === scopeItem)?.name || scopeItem}
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setScope((prev) => prev.filter((_, i) => i !== index))}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {scope.map((scopeItem, index) => (
                  <Badge key={index} variant="secondary">
                    {departments.find((dept) => dept.id === scopeItem)?.name || scopeItem}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Objectives Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700">Specific Audit Objectives</h3>
            {editMode ? (
              <div className="space-y-2">
                <Input
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="Add a new objective"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setObjectives((prev) => [...prev, newObjective]);
                    setNewObjective("");
                  }}
                >
                  Add Objective
                </Button>
                <ul className="list-disc list-inside">
                  {objectives.map((objective, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {objective}
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setObjectives((prev) => prev.filter((_, i) => i !== index))}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="list-disc list-inside">
                {objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          {/* Criteria Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700">Audit Criteria</h3>
            {editMode ? (
              <div className="space-y-2">
                <select
                  multiple
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(Array.from(e.target.selectedOptions, option => option.value))}
                  className="border rounded p-2 w-full"
                >
                  {auditCriteria.map((criterion, index) => (
                    <option key={index} value={criterion}>
                      {criterion}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCriteria((prev) => [...prev, ...newCriterion]);
                    setNewCriterion([]);
                  }}
                >
                  Add Criteria
                </Button>
                <ul className="list-disc list-inside">
                  {criteria.map((criterion, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {criterion}
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setCriteria((prev) => prev.filter((_, i) => i !== index))}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="list-disc list-inside">
                {criteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          {/* Methods Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700">Audit Methods</h3>
            {editMode ? (
              <div className="space-y-2">
                <select
                  multiple
                  value={newMethod}
                  onChange={(e) => setNewMethod(Array.from(e.target.selectedOptions, option => option.value))}
                  className="border rounded p-2 w-full"
                >
                  {auditMethods.map((method, index) => (
                    <option key={index} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMethods((prev) => [...prev, ...newMethod]);
                    setNewMethod([]);
                  }}
                >
                  Add Methods
                </Button>
                <ul className="list-disc list-inside">
                  {methods.map((method, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {method}
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setMethods((prev) => prev.filter((_, i) => i !== index))}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="list-disc list-inside">
                {methods.map((method, index) => (
                  <li key={index}>{method}</li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          {/* Team Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700">Audit Team</h3>
            {editMode ? (
              <div className="space-y-2">
                <Input
                  value={team.leader}
                  onChange={(e) => setTeam((prev) => ({ ...prev, leader: e.target.value }))}
                  placeholder="Team Leader"
                />
                <div className="space-y-2">
                  <Input
                    value={newMember}
                    onChange={(e) => setNewMember(e.target.value)}
                    placeholder="Add a team member"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTeam((prev) => ({
                        ...prev,
                        members: [...prev.members, newMember],
                      }));
                      setNewMember("");
                    }}
                  >
                    Add Member
                  </Button>
                </div>
                <ul className="list-disc list-inside">
                  {team.members.map((member, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {member}
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={() =>
                          setTeam((prev) => ({
                            ...prev,
                            members: prev.members.filter((_, i) => i !== index),
                          }))
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <p>
                  <strong>Leader:</strong> {team.leader || "Not Assigned"}
                </p>
                <ul className="list-disc list-inside">
                  {team.members.map((member, index) => (
                    <li key={index}>{member}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Separator />

          {/* Schedule Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700">Schedule</h3>
            {/* Render schedule-related content here */}
          </div>

          <Separator />

          {/* Notes Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700">Notes</h3>
            {editMode ? (
              <div className="space-y-2">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a new note"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotes((prev) => [...prev, newNote]);
                    setNewNote("");
                  }}
                >
                  Add Note
                </Button>
                <ul className="list-disc list-inside">
                  {notes.map((note, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {note}
                      <X
                        className="h-4 w-4 cursor-pointer"
                        onClick={() => setNotes((prev) => prev.filter((_, i) => i !== index))}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="list-disc list-inside">
                {notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          {/* Render Save, Reset, and Create Schedule Buttons */}
          <div className="flex justify-end gap-4">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditMode(false);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setEditMode(true)}
                >
                  Edit Program
                </Button>
                <Button
                  variant="default"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleCreateSchedule}
                >
                  Create Schedule
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={() => router.push(`/auditor-staff/dashboard`)}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPlanPage;
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { toast } from "react-toastify";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const auditMethods = ["Interviews", "Document Review", "Checklist Completion", "Sampling", "Observation"];
const auditCriteria = [
  "ISO Standards Compliance",
  "System Documentation Compliance",
  "Departmental Policies and Manuals",
  "Legal Documentations",
];
const allScopes = ["Finance", "HR", "Student Records", "Procurement"];

export default function NewProgramPage() {
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState("metadata");
  const router = useRouter();
  const { token, user } = useAuth();
  const tenantName = user?.tenantName || user?.tenantId || "N/A"; // Use tenantName or fallback to tenantId

  const [newProgram, setNewProgram] = useState({
    name: "",
    auditProgramObjective: "",
    status: "Draft",
    startDate: "",
    endDate: "",
    audits: [],
  });
  const [auditInput, setAuditInput] = useState({
    scope: [],
    specificAuditObjectives: [],
    methods: [],
    criteria: [],
  });
  const [objectiveInput, setObjectiveInput] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fallback UI to prevent blank rendering
  if (!isClient) return <div className="p-6">Loading client...</div>;
  if (!user) return <div className="p-6">Loading user data...</div>;
  if (user.roleName !== "MR") return <div className="p-6">Unauthorized: Auditor General access only</div>;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProgram((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAuditInputChange = (e) => {
    const { name, value } = e.target;
    setAuditInput((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const normalizeValue = (value) => (Array.isArray(value) ? value : [value]); // Ensure value is always an array

  const handleScopeChange = (value) => {
    const normalizedValue = normalizeValue(value);
    setAuditInput((prev) => {
      const updatedScope = normalizedValue.includes("All")
        ? allScopes
        : normalizedValue.filter((v) => v !== "All");
      return { ...prev, scope: updatedScope };
    });
    if (errors.scope) setErrors((prev) => ({ ...prev, scope: "" }));
  };

  const handleMethodsChange = (value) => {
    const normalizedValue = normalizeValue(value);
    setAuditInput((prev) => {
      const updatedMethods = normalizedValue.includes("All")
        ? auditMethods
        : normalizedValue.filter((v) => v !== "All");
      return { ...prev, methods: updatedMethods };
    });
    if (errors.methods) setErrors((prev) => ({ ...prev, methods: "" }));
  };

  const handleCriteriaChange = (value) => {
    const normalizedValue = normalizeValue(value);
    setAuditInput((prev) => {
      const updatedCriteria = normalizedValue.includes("All")
        ? auditCriteria
        : normalizedValue.filter((v) => v !== "All");
      return { ...prev, criteria: updatedCriteria };
    });
    if (errors.criteria) setErrors((prev) => ({ ...prev, criteria: "" }));
  };

  const handleObjectiveInputChange = (e) => setObjectiveInput(e.target.value);

  const addObjective = () => {
    if (objectiveInput.trim()) {
      setAuditInput((prev) => ({
        ...prev,
        specificAuditObjectives: [...prev.specificAuditObjectives, objectiveInput.trim()],
      }));
      setObjectiveInput("");
    }
  };

  const removeObjective = (index) => {
    setAuditInput((prev) => ({
      ...prev,
      specificAuditObjectives: prev.specificAuditObjectives.filter((_, i) => i !== index),
    }));
  };

  const addAudit = () => {
    const auditErrors = {};
    if (!auditInput.scope.length) auditErrors.scope = "Scope is required";
    if (!auditInput.specificAuditObjectives.length) auditErrors.specificAuditObjectives = "At least one objective is required";
    if (!auditInput.methods.length) auditErrors.methods = "Methods are required";
    if (!auditInput.criteria.length) auditErrors.criteria = "Criteria are required";

    if (Object.keys(auditErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...auditErrors }));
      return;
    }

    setNewProgram((prev) => ({
      ...prev,
      audits: [...prev.audits, { ...auditInput, id: `A-${Date.now()}` }],
    }));
    setAuditInput({ scope: [], specificAuditObjectives: [], methods: [], criteria: [] });
  };

  const removeSelectedOption = (type, option) => {
    setAuditInput((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== option),
    }));
  };

  const renderSelectedOptions = (options, type) => {
    if (!Array.isArray(options)) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((option, index) => (
          <span
            key={index}
            className="flex items-center px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-full"
          >
            {option}
            <button
              onClick={() => removeSelectedOption(type, option)}
              className="ml-2 text-white hover:text-gray-300"
            >
              ✕
            </button>
          </span>
        ))}
      </div>
    );
  };

  const handleMultiSelectChange = (type, value) => {
    setAuditInput((prev) => {
      const normalizedValue = Array.isArray(value) ? value : [value];
      const currentSelections = prev[type] || [];
      const updatedSelections = normalizedValue.includes("All")
        ? type === "scope"
          ? allScopes
          : type === "methods"
          ? auditMethods
          : auditCriteria
        : [...new Set([...currentSelections, ...normalizedValue])];
      return { ...prev, [type]: updatedSelections };
    });
    if (errors[type]) setErrors((prev) => ({ ...prev, [type]: "" }));
  };

  const submitProgram = async () => {
    if (!newProgram.name || !newProgram.startDate || !newProgram.endDate) {
      toast.error("Please fill in all required fields (Name, Start Date, End Date).");
      return;
    }

    if (newProgram.audits.length === 0) {
      toast.error("Please add at least one audit.");
      return;
    }
    console.log("Tenant Name:", user.tenantName);
    // Optimized payload: Send arrays directly instead of joining into strings

    console.log("User object:", user);
    const payload = {
      name: newProgram.name,
      auditProgramObjective: newProgram.auditProgramObjective || null,
      startDate: newProgram.startDate,
      endDate: newProgram.endDate,
      tenantId: user.tenantId,
      tenantName: user.tenantName, // This is where tenantName is added
      audits: newProgram.audits.map((audit) => ({
        id: audit.id,
        scope: audit.scope,
        specificAuditObjectives: audit.specificAuditObjectives,
        methods: audit.methods,
        criteria: audit.criteria,
      })),
    };

    
  console.log("Payload being sent:", payload); // Debug the payload

    try {
      const response = await fetch("http://localhost:5004/api/audit-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create audit program.");
      }

      toast.success("Audit Program created successfully!");
      router.push("/auditor/audit-programs");
    } catch (error) {
      console.error("Error submitting program:", error.message);
      toast.error(error.message || "An error occurred while creating the program.");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create New Audit Program</h1>
      <p className="text-muted-foreground mb-6">Institution: {tenantName || "N/A"}</p>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <div className="space-y-4">
            <div>
              <Input
                name="name"
                value={newProgram.name}
                onChange={handleInputChange}
                placeholder="Program Name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            <div>
              <Input
                name="auditProgramObjective"
                value={newProgram.auditProgramObjective}
                onChange={handleInputChange}
                placeholder="Audit Program Objective"
              />
            </div>
            <div>
              <Input
                type="date"
                name="startDate"
                value={newProgram.startDate}
                onChange={handleInputChange}
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && <p className="text-red-500 text-sm">{errors.startDate}</p>}
            </div>
            <div>
              <Input
                type="date"
                name="endDate"
                value={newProgram.endDate}
                onChange={handleInputChange}
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && <p className="text-red-500 text-sm">{errors.endDate}</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audits">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Audit Scope</label>
              <Select
                onValueChange={(value) => handleMultiSelectChange("scope", value)}
                value={auditInput.scope}
                multiple
              >
                <SelectTrigger className={errors.scope ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Audit Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {allScopes.map((scope) => (
                    <SelectItem key={scope} value={scope}>
                      {scope}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderSelectedOptions(auditInput.scope, "scope")}
              {errors.scope && <p className="text-red-500 text-sm">{errors.scope}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Specific Audit Objectives</label>
              <Input
                value={objectiveInput}
                onChange={handleObjectiveInputChange}
                placeholder="Specific Audit Objective"
              />
              <Button onClick={addObjective} className="mt-2">
                Add Objective
              </Button>
              <ul className="mt-2">
                {auditInput.specificAuditObjectives.map((obj, index) => (
                  <li key={index} className="flex justify-between items-center">
                    {obj}
                    <Button variant="destructive" size="sm" onClick={() => removeObjective(index)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
              {errors.specificAuditObjectives && (
                <p className="text-red-500 text-sm">{errors.specificAuditObjectives}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Audit Methods</label>
              <Select
                onValueChange={(value) => handleMultiSelectChange("methods", value)}
                value={auditInput.methods}
                multiple
              >
                <SelectTrigger className={errors.methods ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Audit Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {auditMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderSelectedOptions(auditInput.methods, "methods")}
              {errors.methods && <p className="text-red-500 text-sm">{errors.methods}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Audit Criteria</label>
              <Select
                onValueChange={(value) => handleMultiSelectChange("criteria", value)}
                value={auditInput.criteria}
                multiple
              >
                <SelectTrigger className={errors.criteria ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Audit Criteria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {auditCriteria.map((criterion) => (
                    <SelectItem key={criterion} value={criterion}>
                      {criterion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderSelectedOptions(auditInput.criteria, "criteria")}
              {errors.criteria && <p className="text-red-500 text-sm">{errors.criteria}</p>}
            </div>

            <Button onClick={addAudit} className="mt-4">
              Add Audit
            </Button>

            <Table className="mt-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Audit Scope</TableHead>
                  <TableHead>Objectives</TableHead>
                  <TableHead>Methods</TableHead>
                  <TableHead>Criteria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newProgram.audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>{Array.isArray(audit.scope) ? audit.scope.join(", ") : "N/A"}</TableCell>
                    <TableCell>
                      {Array.isArray(audit.specificAuditObjectives)
                        ? audit.specificAuditObjectives.join("; ")
                        : "N/A"}
                    </TableCell>
                    <TableCell>{Array.isArray(audit.methods) ? audit.methods.join(", ") : "N/A"}</TableCell>
                    <TableCell>{Array.isArray(audit.criteria) ? audit.criteria.join(", ") : "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preview: {newProgram.name || "Unnamed Program"}</h2>
            <p>Objective: {newProgram.auditProgramObjective || "N/A"}</p>
            <p>
              Duration: {newProgram.startDate || "N/A"} - {newProgram.endDate || "N/A"}
            </p>
            <Table className="w-full border">
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r w-1/4">Audit Component</TableHead>
                  {newProgram.audits.map((_, index) => (
                    <TableHead key={index} className="border-r w-1/4">
                      {index === 0 ? "First Audit" : `Audit ${index + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold border-r break-words">Audit No</TableCell>
                  {newProgram.audits.map((_, index) => (
                    <TableCell key={index} className="border-r break-words">
                      A-{index + 1}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold border-r break-words">Audit Scope</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r break-words">
                      {audit.scope.join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold border-r break-words">Specific Audit Objective(s)</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r break-words">
                      {audit.specificAuditObjectives.join("; ")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold border-r break-words">Methods</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r break-words">
                      {audit.methods.join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold border-r break-words">Criteria</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r break-words">
                      {audit.criteria.join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold border-r break-words">Teams</TableCell>
                  {newProgram.audits.map((_, index) => (
                    <TableCell key={index} className="border-r break-words">
                      {/* Teams can be blank for now */}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => router.push("/auditor/audit-programs")}>
          Cancel
        </Button>
        <Button onClick={submitProgram}>Create Program</Button>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
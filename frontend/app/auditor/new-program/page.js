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

export default function NewProgramPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [tab, setTab] = useState("metadata");
  const [departments, setDepartments] = useState([]);
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

  const auditMethods = ["Interviews", "Document Review", "Checklist Completion", "Sampling", "Observation"];
  const auditCriteria = [
    "ISO Standards Compliance",
    "System Documentation Compliance",
    "Departmental Policies and Manuals",
    "Legal Documentations",
  ];

  useEffect(() => {
    setIsClient(true);

    const fetchTenantDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/tenants/${user?.tenantId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch tenant details");
        const data = await response.json();
        setDepartments(data.departments || []);
      } catch (error) {
        console.error("Error fetching tenant details:", error);
      }
    };

    if (user?.tenantId) {
      fetchTenantDetails();
    }
  }, [token, user]);

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

  const handleScopeChange = (departmentId) => {
    setAuditInput((prev) => {
      let updatedScope;
      if (departmentId === "All") {
        updatedScope = prev.scope.length === departments.length ? [] : departments.map((dept) => dept.id);
      } else {
        const isSelected = prev.scope.includes(departmentId);
        updatedScope = isSelected
          ? prev.scope.filter((id) => id !== departmentId)
          : [...prev.scope, departmentId];
      }
      return { ...prev, scope: updatedScope };
    });
    if (errors.scope) setErrors((prev) => ({ ...prev, scope: "" }));
  };

  const handleCriteriaChange = (criterion) => {
    setAuditInput((prev) => {
      let updatedCriteria;
      if (criterion === "All") {
        updatedCriteria = prev.criteria.length === auditCriteria.length ? [] : [...auditCriteria];
      } else {
        const isSelected = prev.criteria.includes(criterion);
        updatedCriteria = isSelected
          ? prev.criteria.filter((c) => c !== criterion)
          : [...prev.criteria, criterion];
      }
      return { ...prev, criteria: updatedCriteria };
    });
    if (errors.criteria) setErrors((prev) => ({ ...prev, criteria: "" }));
  };

  const handleMethodsChange = (method) => {
    setAuditInput((prev) => {
      let updatedMethods;
      if (method === "All") {
        updatedMethods = prev.methods.length === auditMethods.length ? [] : [...auditMethods];
      } else {
        const isSelected = prev.methods.includes(method);
        updatedMethods = isSelected
          ? prev.methods.filter((m) => m !== method)
          : [...prev.methods, method];
      }
      return { ...prev, methods: updatedMethods };
    });
    if (errors.methods) setErrors((prev) => ({ ...prev, methods: "" }));
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
      audits: [
        ...prev.audits,
        {
          ...auditInput,
          id: `A-${Date.now()}`,
          scope: auditInput.scope.map((id) => departments.find((dept) => dept.id === id)?.name || id),
        },
      ],
    }));
    setAuditInput({ scope: [], specificAuditObjectives: [], methods: [], criteria: [] });
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

    const payload = {
      name: newProgram.name,
      auditProgramObjective: newProgram.auditProgramObjective || null,
      startDate: newProgram.startDate,
      endDate: newProgram.endDate,
      tenantId: user.tenantId,
      tenantName: user.tenantName,
      audits: newProgram.audits.map((audit) => ({
        id: audit.id,
        scope: audit.scope,
        specificAuditObjectives: audit.specificAuditObjectives,
        methods: audit.methods,
        criteria: audit.criteria,
      })),
    };

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
      <p className="text-muted-foreground mb-6">Institution: {user?.tenantName || "N/A"}</p>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="metadata">
          <div className="space-y-4">
            <Input
              name="name"
              value={newProgram.name}
              onChange={handleInputChange}
              placeholder="Program Name"
              className={errors.name ? "border-red-500" : ""}
            />
            <Input
              name="auditProgramObjective"
              value={newProgram.auditProgramObjective}
              onChange={handleInputChange}
              placeholder="Audit Program Objective"
            />
            <Input
              type="date"
              name="startDate"
              value={newProgram.startDate}
              onChange={handleInputChange}
              className={errors.startDate ? "border-red-500" : ""}
            />
            <Input
              type="date"
              name="endDate"
              value={newProgram.endDate}
              onChange={handleInputChange}
              className={errors.endDate ? "border-red-500" : ""}
            />
          </div>
        </TabsContent>

        <TabsContent value="audits">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Audit Scope</label>
              <Select
                onValueChange={(value) => handleScopeChange(value)}
                value={auditInput.scope}
                multiple
              >
                <SelectTrigger className={errors.scope ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select Audit Scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="mt-2">
                {auditInput.scope.map((id) => (
                  <span key={id} className="inline-block bg-gray-200 text-sm px-2 py-1 rounded mr-2">
                    {departments.find((dept) => dept.id === id)?.name || id}
                  </span>
                ))}
              </div>
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
                onValueChange={(value) => handleMethodsChange(value)}
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
              <div className="mt-2">
                {auditInput.methods.map((method, index) => (
                  <span key={index} className="inline-block bg-gray-200 text-sm px-2 py-1 rounded mr-2">
                    {method}
                  </span>
                ))}
              </div>
              {errors.methods && <p className="text-red-500 text-sm">{errors.methods}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Audit Criteria</label>
              <Select
                onValueChange={(value) => handleCriteriaChange(value)}
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
              <div className="mt-2">
                {auditInput.criteria.map((criterion, index) => (
                  <span key={index} className="inline-block bg-gray-200 text-sm px-2 py-1 rounded mr-2">
                    {criterion}
                  </span>
                ))}
              </div>
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
          <div className="space-y-6 border p-6 rounded-lg bg-white">
            {/* Header */}
            <div className="text-left">
              <h2 className="text-xl font-bold">Mural Dimension</h2>
              <p className="text-sm">Ruprani House, 2nd Floor, Suite 206</p>
              <p className="text-sm">P.O Box 8983 - 00100, Nairobi</p>
              <p className="text-sm">Tel: 0202341573 / 4, 0775-981084</p>
            </div>

            {/* General Information */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">GENERAL</h3>
              <p><strong>Organization:</strong> {user?.tenantName || "N/A"}</p>
              <div>
                <p>1.2 <strong>Audit Objectives:</strong></p>
                <ol className="list-decimal list-inside ml-4">
                  {newProgram.auditProgramObjective ? (
                    <li>{newProgram.auditProgramObjective}</li>
                  ) : (
                    <li>N/A</li>
                  )}
                </ol>
              </div>
              <p>1.3 <strong>Audit Dates:</strong> {newProgram.startDate && newProgram.endDate ? 
                `${new Date(newProgram.startDate).toLocaleDateString()} - ${new Date(newProgram.endDate).toLocaleDateString()}` : "N/A"}</p>
              <p>1.4 <strong>Audit Program Status:</strong> {newProgram.status}</p>
            </div>

            {/* Audit Table */}
            <Table className="w-full border border-gray-300">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="border-r font-semibold py-2">Audit Component</TableHead>
                  {newProgram.audits.map((_, index) => (
                    <TableHead key={index} className="border-r font-semibold py-2">
                      Audit {index + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border-r font-medium py-2">Audit No</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r py-2 break-words">
                      {audit.id}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell className="border-r font-medium py-2">Scope</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r py-2 break-words">
                      {Array.isArray(audit.scope) && audit.scope.length > 0 ? (
                        <ul className="list-disc list-inside">
                          {audit.scope.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        "Not specified"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="border-r font-medium py-2">Objectives</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r py-2 break-words">
                      {Array.isArray(audit.specificAuditObjectives) && audit.specificAuditObjectives.length > 0 ? (
                        <ol className="list-decimal list-inside">
                          {audit.specificAuditObjectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ol>
                      ) : (
                        "Not specified"
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell className="border-r font-medium py-2">Methods</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r py-2 break-words">
                      {Array.isArray(audit.methods) && audit.methods.length > 0
                        ? audit.methods.join(", ")
                        : "Not specified"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="border-r font-medium py-2">Criteria</TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell key={index} className="border-r py-2 break-words">
                      {Array.isArray(audit.criteria) && audit.criteria.length > 0
                        ? audit.criteria.join(", ")
                        : "Not specified"}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell className="border-r font-medium py-2">Teams</TableCell>
                  {newProgram.audits.map((_, index) => (
                    <TableCell key={index} className="border-r py-2 break-words">
                      {/* Placeholder for team assignment */}
                      Not Assigned
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
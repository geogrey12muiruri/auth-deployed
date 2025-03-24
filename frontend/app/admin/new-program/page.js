"use client";

import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

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
  const [tab, setTab] = useState(0);
  const router = useRouter();
  const { token } = useAuth();
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

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

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

  const handleScopeChange = (e) => {
    const value = e.target.value;
    if (value.includes("All")) {
      setAuditInput((prev) => ({ ...prev, scope: allScopes }));
    } else {
      setAuditInput((prev) => ({ ...prev, scope: value }));
    }
    if (errors.scope) setErrors((prev) => ({ ...prev, scope: "" }));
  };

  const handleMethodsChange = (e) => {
    setAuditInput((prev) => ({ ...prev, methods: e.target.value }));
  };

  const handleCriteriaChange = (e) => {
    setAuditInput((prev) => ({ ...prev, criteria: e.target.value }));
  };

  const handleObjectiveInputChange = (e) => {
    setObjectiveInput(e.target.value);
  };

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
    if (
      auditInput.scope.length > 0 &&
      auditInput.specificAuditObjectives.length > 0 &&
      auditInput.methods.length > 0 &&
      auditInput.criteria.length > 0
    ) {
      setNewProgram((prev) => ({
        ...prev,
        audits: [...prev.audits, { ...auditInput, id: `A-${Date.now()}` }],
      }));
      setAuditInput({ scope: [], specificAuditObjectives: [], methods: [], criteria: [] });
    }
  };

  const removeAudit = (id) => {
    setNewProgram((prev) => ({
      ...prev,
      audits: prev.audits.filter((audit) => audit.id !== id),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newProgram.name) newErrors.name = "Program Name is required";
    if (!newProgram.startDate) newErrors.startDate = "Start Date is required";
    if (!newProgram.endDate) newErrors.endDate = "End Date is required";
    if (newProgram.audits.length === 0) newErrors.audits = "At least one audit is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormComplete = () => {
    return (
      !!newProgram.name &&
      !!newProgram.startDate &&
      !!newProgram.endDate &&
      newProgram.audits.length > 0
    );
  };

  const handleCreateProgram = async () => {
    if (!validateForm()) {
      setTab(0);
      return;
    }

    try {
      // Step 1: Create AuditProgram
      const programData = {
        id: `AP-${Date.now()}`,
        name: newProgram.name,
        auditProgramObjective: newProgram.auditProgramObjective || null,
        status: "Draft",
        startDate: newProgram.startDate,
        endDate: newProgram.endDate,
      };
      const programResponse = await fetch("http://localhost:5004/api/audit-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(programData),
      });
      if (!programResponse.ok) throw new Error("Failed to create audit program");
      const createdProgram = await programResponse.json();

      // Step 2: Create Audits
      for (const audit of newProgram.audits) {
        const auditData = {
          id: audit.id,
          scope: audit.scope.join(", "), // Convert array to string for now
          specificAuditObjective: audit.specificAuditObjectives,
          methods: audit.methods,
          criteria: audit.criteria,
        };
        const auditResponse = await fetch(`http://localhost:5004/api/audit-programs/${createdProgram.id}/audits`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(auditData),
        });
        if (!auditResponse.ok) throw new Error("Failed to create audit");
      }

      console.log("Program and audits created successfully");
      router.push("/auditor/audit-programs");
    } catch (error) {
      console.error("Error creating program:", error);
      setErrors((prev) => ({ ...prev, submit: "Failed to create program. Please try again." }));
    }
  };

  if (!isClient) return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Typography variant="h4" component="h1" className="mb-6 font-bold text-gray-800">
        Create New Audit Program
      </Typography>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant="fullWidth"
        className="mb-6 rounded-lg shadow-sm"
        sx={{ bgcolor: "grey.100" }}
      >
        <Tab
          label="Metadata"
          icon={newProgram.name && newProgram.startDate && newProgram.endDate ? <CheckCircleIcon color="success" /> : null}
          iconPosition="end"
        />
        <Tab
          label="Audits"
          icon={newProgram.audits.length > 0 ? <CheckCircleIcon color="success" /> : null}
          iconPosition="end"
        />
      </Tabs>

      <Box
        sx={{
          bgcolor: "white",
          boxShadow: 3,
          p: 4,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        {/* Tab 1: Metadata */}
        {tab === 0 && (
          <>
            <TextField
              label="Program Name"
              name="name"
              value={newProgram.name}
              onChange={handleInputChange}
              fullWidth
              className="mb-4"
              required
              error={!!errors.name}
              helperText={errors.name}
              variant="outlined"
            />
            <TextField
              label="Audit Program Objective"
              name="auditProgramObjective"
              value={newProgram.auditProgramObjective}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
              className="mb-4"
              variant="outlined"
            />
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={newProgram.startDate}
              onChange={handleInputChange}
              fullWidth
              className="mb-4"
              required
              error={!!errors.startDate}
              helperText={errors.startDate}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
            <TextField
              label="End Date"
              name="endDate"
              type="date"
              value={newProgram.endDate}
              onChange={handleInputChange}
              fullWidth
              className="mb-4"
              required
              error={!!errors.endDate}
              helperText={errors.endDate}
              InputLabelProps={{ shrink: true }}
              variant="outlined"
            />
          </>
        )}

        {/* Tab 2: Audits */}
        {tab === 1 && (
          <>
            <Typography variant="subtitle1" className="mb-2">
              Add Audits
            </Typography>
            <FormControl fullWidth className="mb-4">
              <InputLabel>Scope</InputLabel>
              <Select
                multiple
                name="scope"
                value={auditInput.scope}
                onChange={handleScopeChange}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                  </Box>
                )}
                variant="outlined"
              >
                <MenuItem value="All">All</MenuItem>
                {allScopes.map((scope) => (
                  <MenuItem key={scope} value={scope}>{scope}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box className="mb-4">
              <TextField
                label="Specific Audit Objective"
                value={objectiveInput}
                onChange={handleObjectiveInputChange}
                fullWidth
                className="mb-2"
                variant="outlined"
                helperText="Add multiple objectives as needed"
              />
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={addObjective}
                className="mb-2"
              >
                Add Objective
              </Button>
              <Table size="small">
                <TableBody>
                  {auditInput.specificAuditObjectives.map((obj, index) => (
                    <TableRow key={index}>
                      <TableCell>{obj}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => removeObjective(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <FormControl fullWidth className="mb-4">
              <InputLabel>Audit Methods</InputLabel>
              <Select
                multiple
                value={auditInput.methods}
                onChange={handleMethodsChange}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                  </Box>
                )}
                variant="outlined"
              >
                {auditMethods.map((method) => (
                  <MenuItem key={method} value={method}>{method}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth className="mb-4">
              <InputLabel>Audit Criteria</InputLabel>
              <Select
                multiple
                value={auditInput.criteria}
                onChange={handleCriteriaChange}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => <Chip key={value} label={value} size="small" />)}
                  </Box>
                )}
                variant="outlined"
              >
                {auditCriteria.map((criterion) => (
                  <MenuItem key={criterion} value={criterion}>{criterion}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={addAudit}
              className="mb-4"
            >
              Add Audit
            </Button>
            <Table size="small">
              <TableBody>
                {newProgram.audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>{audit.scope.join(", ")}</TableCell>
                    <TableCell>{audit.specificAuditObjectives.join("; ")}</TableCell>
                    <TableCell>
                      <IconButton size="small" color="error" onClick={() => removeAudit(audit.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errors.audits && (
              <Typography variant="caption" color="error" className="mt-2">
                {errors.audits}
              </Typography>
            )}
          </>
        )}

        {/* Action Buttons */}
        <Box className="flex justify-between mt-6">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => router.push("/auditor/audit-programs")}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateProgram}
            disabled={!isFormComplete()}
            startIcon={isFormComplete() ? <CheckCircleIcon /> : null}
          >
            Create Program
          </Button>
        </Box>
        {errors.submit && (
          <Typography variant="caption" color="error" className="mt-2">
            {errors.submit}
          </Typography>
        )}
      </Box>
    </div>
  );
}

export const dynamic = "force-dynamic";
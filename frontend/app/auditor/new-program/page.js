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
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { toast } from "react-toastify";

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
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token, user } = useAuth();
  const tenantName = user?.tenantName;

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

  const handleTabChange = (event, newValue) => setTab(newValue);

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
    setAuditInput((prev) => ({
      ...prev,
      scope: value.includes("All") ? allScopes : value,
    }));
    if (errors.scope) setErrors((prev) => ({ ...prev, scope: "" }));
  };

  const handleMethodsChange = (e) => setAuditInput((prev) => ({ ...prev, methods: e.target.value }));
  const handleCriteriaChange = (e) => setAuditInput((prev) => ({ ...prev, criteria: e.target.value }));
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
    if (new Date(newProgram.endDate) <= new Date(newProgram.startDate)) {
      newErrors.endDate = "End Date must be after Start Date";
    }
    if (newProgram.audits.length === 0) newErrors.audits = "At least one audit is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateProgram = async () => {
    if (!validateForm()) {
      setTab(0);
      return;
    }

    setLoading(true);
    try {
      const programData = {
        name: newProgram.name,
        auditProgramObjective: newProgram.auditProgramObjective || null,
        startDate: newProgram.startDate,
        endDate: newProgram.endDate,
        audits: newProgram.audits.map((audit) => ({
          scope: audit.scope.join(", "),
          specificAuditObjective: audit.specificAuditObjectives,
          methods: audit.methods,
          criteria: audit.criteria,
        })),
      };

      const response = await fetch("http://localhost:5004/api/audit-programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(programData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create audit program");
      }

      toast.success("Audit program created successfully!");
      router.push("/auditor/audit-programs");
    } catch (error) {
      console.error("Error creating program:", error);
      toast.error(error.message || "Failed to create program");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient || !user || user.role !== "AUDITOR_GENERAL") return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Typography variant="h4" className="mb-4 font-bold text-gray-800">
        Create New Audit Program
      </Typography>
      <Typography variant="subtitle1" className="mb-6 text-gray-600">
        Institution: {tenantName || "N/A"}
      </Typography>

      <Tabs
        value={tab}
        onChange={handleTabChange}
        variant="fullWidth"
        className="mb-6 rounded-lg shadow-sm"
        sx={{ bgcolor: "grey.100" }}
      >
        <Tab label="Metadata" icon={newProgram.name && newProgram.startDate && newProgram.endDate ? <CheckCircleIcon color="success" /> : null} iconPosition="end" />
        <Tab label="Audits" icon={newProgram.audits.length > 0 ? <CheckCircleIcon color="success" /> : null} iconPosition="end" />
        <Tab label="Preview" />
      </Tabs>

      <Box sx={{ bgcolor: "white", boxShadow: 3, p: 4, borderRadius: 2, border: "1px solid", borderColor: "grey.200" }}>
        {tab === 0 && (
          // Metadata Tab (unchanged)
          <>
            <TextField label="Program Name" name="name" value={newProgram.name} onChange={handleInputChange} fullWidth className="mb-4" required error={!!errors.name} helperText={errors.name} variant="outlined" />
            <TextField label="Audit Program Objective" name="auditProgramObjective" value={newProgram.auditProgramObjective} onChange={handleInputChange} fullWidth multiline rows={3} className="mb-4" variant="outlined" />
            <TextField label="Start Date" name="startDate" type="date" value={newProgram.startDate} onChange={handleInputChange} fullWidth className="mb-4" required error={!!errors.startDate} helperText={errors.startDate} InputLabelProps={{ shrink: true }} variant="outlined" />
            <TextField label="End Date" name="endDate" type="date" value={newProgram.endDate} onChange={handleInputChange} fullWidth className="mb-4" required error={!!errors.endDate} helperText={errors.endDate} InputLabelProps={{ shrink: true }} variant="outlined" />
          </>
        )}

        {tab === 1 && (
          // Audits Tab (unchanged)
          <>
            <Typography variant="subtitle1" className="mb-2">Add Audits</Typography>
            <FormControl fullWidth className="mb-4">
              <InputLabel>Scope</InputLabel>
              <Select multiple name="scope" value={auditInput.scope} onChange={handleScopeChange} renderValue={(selected) => <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>{selected.map((value) => <Chip key={value} label={value} size="small" />)}</Box>} variant="outlined" error={!!errors.scope}>
                <MenuItem value="All">All</MenuItem>
                {allScopes.map((scope) => <MenuItem key={scope} value={scope}>{scope}</MenuItem>)}
              </Select>
              {errors.scope && <Typography variant="caption" color="error">{errors.scope}</Typography>}
            </FormControl>
            <Box className="mb-4">
              <TextField label="Specific Audit Objective" value={objectiveInput} onChange={handleObjectiveInputChange} fullWidth className="mb-2" variant="outlined" helperText="Add multiple objectives as needed" />
              <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={addObjective} className="mb-2">Add Objective</Button>
              <Table size="small">
                <TableBody>
                  {auditInput.specificAuditObjectives.map((obj, index) => (
                    <TableRow key={index}>
                      <TableCell>{obj}</TableCell>
                      <TableCell><IconButton size="small" color="error" onClick={() => removeObjective(index)}><DeleteIcon /></IconButton></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {errors.specificAuditObjectives && <Typography variant="caption" color="error">{errors.specificAuditObjectives}</Typography>}
            </Box>
            <FormControl fullWidth className="mb-4">
              <InputLabel>Audit Methods</InputLabel>
              <Select multiple value={auditInput.methods} onChange={handleMethodsChange} renderValue={(selected) => <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>{selected.map((value) => <Chip key={value} label={value} size="small" />)}</Box>} variant="outlined" error={!!errors.methods}>
                {auditMethods.map((method) => <MenuItem key={method} value={method}>{method}</MenuItem>)}
              </Select>
              {errors.methods && <Typography variant="caption" color="error">{errors.methods}</Typography>}
            </FormControl>
            <FormControl fullWidth className="mb-4">
              <InputLabel>Audit Criteria</InputLabel>
              <Select multiple value={auditInput.criteria} onChange={handleCriteriaChange} renderValue={(selected) => <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>{selected.map((value) => <Chip key={value} label={value} size="small" />)}</Box>} variant="outlined" error={!!errors.criteria}>
                {auditCriteria.map((criterion) => <MenuItem key={criterion} value={criterion}>{criterion}</MenuItem>)}
              </Select>
              {errors.criteria && <Typography variant="caption" color="error">{errors.criteria}</Typography>}
            </FormControl>
            <Button variant="outlined" color="primary" startIcon={<AddIcon />} onClick={addAudit} className="mb-4">Add Audit</Button>
            <Table size="small">
              <TableBody>
                {newProgram.audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>{audit.scope.join(", ")}</TableCell>
                    <TableCell>{audit.specificAuditObjectives.join("; ")}</TableCell>
                    <TableCell><IconButton size="small" color="error" onClick={() => removeAudit(audit.id)}><DeleteIcon /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errors.audits && <Typography variant="caption" color="error" className="mt-2">{errors.audits}</Typography>}
          </>
        )}

        {tab === 2 && (
          // Updated Preview Tab
          <Box>
            {/* Metadata as Table Title */}
            <Typography variant="h6" className="mb-2 font-semibold text-gray-800">
              Audit Program Preview: {newProgram.name || "Unnamed Program"}
            </Typography>
            <Box className="mb-4 p-3 bg-gray-50 rounded-lg shadow-inner">
              <Typography variant="body1" className="text-gray-700">
                <strong>Objective:</strong> {newProgram.auditProgramObjective || "N/A"}
              </Typography>
              <Typography variant="body1" className="text-gray-700">
                <strong>Duration:</strong> {newProgram.startDate ? new Date(newProgram.startDate).toLocaleDateString() : "N/A"} - {newProgram.endDate ? new Date(newProgram.endDate).toLocaleDateString() : "N/A"}
              </Typography>
              <Typography variant="body1" className="text-gray-700">
                <strong>Institution:</strong> {tenantName || "N/A"}
              </Typography>
            </Box>

            {/* Vertical Audit Table */}
            <Table
              sx={{
                border: "1px solid",
                borderColor: "grey.200",
                borderRadius: 2,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                overflow: "hidden",
              }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.100" }}>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      borderRight: "1px solid",
                      borderColor: "grey.300",
                      bgcolor: "grey.200",
                      width: "200px",
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                    }}
                  >
                    Audit Component
                  </TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell
                      key={audit.id}
                      sx={{ fontWeight: "bold", textAlign: "center", borderRight: "1px solid", borderColor: "grey.300" }}
                    >
                      Audit {index + 1}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Audit No Row */}
                <TableRow sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                  <TableCell sx={{ fontWeight: "medium", borderRight: "1px solid", borderColor: "grey.300" }}>
                    Audit No
                  </TableCell>
                  {newProgram.audits.map((audit, index) => (
                    <TableCell
                      key={audit.id}
                      sx={{
                        borderRight: "1px solid",
                        borderColor: "grey.300",
                        wordBreak: "break-word",
                        maxWidth: "200px",
                        textAlign: "center",
                      }}
                    >
                      A-{index + 1} {/* Derived from index; replace with audit.id.split('-')[1] if programId is available */}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Scope Row */}
                <TableRow sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                  <TableCell sx={{ fontWeight: "medium", borderRight: "1px solid", borderColor: "grey.300" }}>
                    Scope
                  </TableCell>
                  {newProgram.audits.map((audit) => (
                    <TableCell
                      key={audit.id}
                      sx={{
                        borderRight: "1px solid",
                        borderColor: "grey.300",
                        wordBreak: "break-word",
                        maxWidth: "200px",
                      }}
                    >
                      {audit.scope.join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Objectives Row */}
                <TableRow sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                  <TableCell sx={{ fontWeight: "medium", borderRight: "1px solid", borderColor: "grey.300" }}>
                    Objectives
                  </TableCell>
                  {newProgram.audits.map((audit) => (
                    <TableCell
                      key={audit.id}
                      sx={{
                        borderRight: "1px solid",
                        borderColor: "grey.300",
                        wordBreak: "break-word",
                        maxWidth: "200px",
                      }}
                    >
                      {audit.specificAuditObjectives.join("; ")}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Methods Row */}
                <TableRow sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                  <TableCell sx={{ fontWeight: "medium", borderRight: "1px solid", borderColor: "grey.300" }}>
                    Methods
                  </TableCell>
                  {newProgram.audits.map((audit) => (
                    <TableCell
                      key={audit.id}
                      sx={{
                        borderRight: "1px solid",
                        borderColor: "grey.300",
                        wordBreak: "break-word",
                        maxWidth: "200px",
                      }}
                    >
                      {audit.methods.join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
                {/* Criteria Row */}
                <TableRow sx={{ "&:hover": { bgcolor: "grey.50" } }}>
                  <TableCell sx={{ fontWeight: "medium", borderRight: "1px solid", borderColor: "grey.300" }}>
                    Criteria
                  </TableCell>
                  {newProgram.audits.map((audit) => (
                    <TableCell
                      key={audit.id}
                      sx={{
                        borderRight: "1px solid",
                        borderColor: "grey.300",
                        wordBreak: "break-word",
                        maxWidth: "200px",
                      }}
                    >
                      {audit.criteria.join(", ")}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
            {newProgram.audits.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center" className="mt-4">
                No audits added yet
              </Typography>
            )}
          </Box>
        )}

        <Box className="flex justify-between mt-6">
          <Button variant="outlined" color="secondary" onClick={() => router.push("/auditor/audit-programs")}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateProgram}
            disabled={loading || !newProgram.name || !newProgram.startDate || !newProgram.endDate || newProgram.audits.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
          >
            {loading ? "Creating..." : "Create Program"}
          </Button>
        </Box>
        {errors.submit && <Typography variant="caption" color="error" className="mt-2">{errors.submit}</Typography>}
      </Box>
    </div>
  );
}

export const dynamic = "force-dynamic";
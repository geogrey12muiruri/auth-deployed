"use client";

import { useState } from "react";
import {
  Button,
  IconButton,
  Tabs,
  Tab,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/router";

// Dummy data (replace with API fetch in production)
const dummyAuditPrograms = [
  {
    id: "AP-2025-001",
    name: "Financial Compliance Audit",
    status: "Active",
    priority: "High",
    startDate: "2024-03-01",
    endDate: "2024-06-01",
  },
  {
    id: "AP-2024-002",
    name: "Operational Efficiency Review",
    status: "Completed",
    priority: "Medium",
    startDate: "2023-09-15",
    endDate: "2023-12-20",
  },
  {
    id: "AP-2025-003",
    name: "IT Security Audit",
    status: "Scheduled",
    priority: "High",
    startDate: "2024-05-10",
    endDate: "2024-08-30",
  },
];

export default function AuditProgramsPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleCreateProgram = () => {
    router.push("/auditor/audit-programs/new-program");
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <Typography variant="h4" component="h1" className="mb-4 font-bold">
        Audit Programs
      </Typography>

      {/* Tabs for filtering programs */}
      <Tabs
        value={tab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        className="mb-6"
      >
        <Tab label="Active Programs" />
        <Tab label="Completed Programs" />
        <Tab label="Scheduled Programs" />
      </Tabs>

      {/* Create New Program Icon Button */}
      <div className="flex justify-end mb-4">
        <IconButton color="primary" onClick={handleCreateProgram}>
          <AddIcon />
        </IconButton>
      </div>

      {/* Program Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dummyAuditPrograms
              .filter((program) =>
                tab === 0
                  ? program.status === "Active"
                  : tab === 1
                  ? program.status === "Completed"
                  : program.status === "Scheduled"
              )
              .map((program) => (
                <TableRow key={program.id}>
                  <TableCell>{program.id}</TableCell>
                  <TableCell>{program.name}</TableCell>
                  <TableCell>{program.status}</TableCell>
                  <TableCell>{program.priority}</TableCell>
                  <TableCell>{program.startDate}</TableCell>
                  <TableCell>{program.endDate}</TableCell>
                  <TableCell>
                    <Button variant="outlined" size="small" className="mr-2">
                      View
                    </Button>
                    <Button variant="outlined" size="small" color="secondary" className="mr-2">
                      Edit
                    </Button>
                    <Button variant="outlined" size="small" color="error">
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
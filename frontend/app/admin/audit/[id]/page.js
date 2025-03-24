"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";

export default function AuditProgramPage() {
  const router = useRouter();
  const { id } = useParams(); // Get the dynamic [id] from the URL
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await fetch(`http://localhost:5004/api/audit-programs/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch audit program");
        }
        const data = await response.json();
        setProgram(data);
      } catch (err) {
        console.error("Error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProgram();
    }
  }, [id]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return (
      <Box className="p-4 max-w-4xl mx-auto">
        <Typography variant="h4" component="h1" className="mb-4 font-bold">
          Error
        </Typography>
        <Typography color="error">{error}</Typography>
        <Button
          variant="outlined"
          onClick={() => router.push("/auditor/audit-programs")}
          className="mt-4"
        >
          Back to Programs
        </Button>
      </Box>
    );
  }

  if (!program) {
    return (
      <Box className="p-4 max-w-4xl mx-auto">
        <Typography variant="h4" component="h1" className="mb-4 font-bold">
          Audit Program Not Found
        </Typography>
        <Button
          variant="outlined"
          onClick={() => router.push("/auditor/audit-programs")}
          className="mt-4"
        >
          Back to Programs
        </Button>
      </Box>
    );
  }

  return (
    <Box className="p-4 max-w-4xl mx-auto">
      <Typography variant="h4" component="h1" className="mb-4 font-bold">
        {program.name}
      </Typography>
      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="subtitle1">
          <strong>ID:</strong> {program.id}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Description:</strong> {program.description || "N/A"}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Status:</strong> {program.status}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Priority:</strong> {program.priority}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Start Date:</strong> {new Date(program.startDate).toLocaleDateString()}
        </Typography>
        <Typography variant="subtitle1">
          <strong>End Date:</strong> {new Date(program.endDate).toLocaleDateString()}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Created At:</strong> {new Date(program.createdAt).toLocaleDateString()}
        </Typography>
      </Paper>

      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h6" className="mb-2">
          Targeted Scopes
        </Typography>
        <List dense>
          {program.modules.map((module) => (
            <ListItem key={module}>
              <ListItemText primary={module} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h6" className="mb-2">
          Objectives
        </Typography>
        <Typography>{program.objectives}</Typography>
      </Paper>

      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h6" className="mb-2">
          Methods
        </Typography>
        <List dense>
          {program.methods.map((method) => (
            <ListItem key={method}>
              <ListItemText primary={method} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h6" className="mb-2">
          Criteria
        </Typography>
        <List dense>
          {program.criteria.map((criterion) => (
            <ListItem key={criterion}>
              <ListItemText primary={criterion} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h6" className="mb-2">
          Milestones
        </Typography>
        <List dense>
          {program.milestones.map((milestone, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={milestone.name}
                secondary={new Date(milestone.date).toLocaleDateString()}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper elevation={3} className="p-4 mb-4">
        <Typography variant="h6" className="mb-2">
          Teams
        </Typography>
        <List dense>
          {program.teams.map((team, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={team.name}
                secondary={`Leader: ${team.leader}, Members: ${team.members.join(", ")}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Button
        variant="outlined"
        onClick={() => router.push("/auditor/audit-programs")}
        className="mt-4"
      >
        Back to Programs
      </Button>
    </Box>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NotesPage = () => {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");
  const [requirements, setRequirements] = useState([]);
  const [newRequirement, setNewRequirement] = useState("");

  useEffect(() => {
    // Load existing notes and requirements from localStorage
    const savedNotes = localStorage.getItem("auditNotes");
    const savedRequirements = localStorage.getItem("auditRequirements");
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedRequirements) setRequirements(JSON.parse(savedRequirements));
  }, []);

  const handleAddNote = () => {
    setNotes((prev) => [...prev, newNote]);
    setNewNote("");
  };

  const handleAddRequirement = () => {
    setRequirements((prev) => [...prev, newRequirement]);
    setNewRequirement("");
  };

  const handleSave = () => {
    localStorage.setItem("auditNotes", JSON.stringify(notes));
    localStorage.setItem("auditRequirements", JSON.stringify(requirements));
    console.log("Notes and Requirements saved:", { notes, requirements });

    // Redirect to the audit plan overview
    router.push(`/auditor-staff/audit-plan`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Add Notes and Requirements</h1>

      {/* Notes Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold mb-4">Notes</h2>
        <Input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Enter a new note"
        />
        <Button variant="outline" onClick={handleAddNote}>
          Add Note
        </Button>
        <ul className="list-disc list-inside bg-gray-100 p-4 rounded border">
          {notes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>

      {/* Requirements Section */}
      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-bold mb-4">Requirements</h2>
        <Input
          value={newRequirement}
          onChange={(e) => setNewRequirement(e.target.value)}
          placeholder="Enter a new requirement"
        />
        <Button variant="outline" onClick={handleAddRequirement}>
          Add Requirement
        </Button>
        <ul className="list-disc list-inside bg-gray-100 p-4 rounded border">
          {requirements.map((requirement, index) => (
            <li key={index}>{requirement}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
          Save Notes and Requirements
        </Button>
      </div>
    </div>
  );
};

export default NotesPage;

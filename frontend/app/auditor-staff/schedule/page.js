"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTenantContext } from "@/context/tenant-context";

const SchedulePage = () => {
  const router = useRouter();
  const [schedule, setSchedule] = useState([]);
  const [scope, setScope] = useState([]);
  const [team, setTeam] = useState({ leader: "", members: [] });
  const { tenantDetails } = useTenantContext();

  useEffect(() => {
    const savedScope = localStorage.getItem("auditScope");
    const savedTeam = localStorage.getItem("auditTeam");
    if (savedScope) setScope(JSON.parse(savedScope));
    if (savedTeam) setTeam(JSON.parse(savedTeam));

    const savedSchedule = localStorage.getItem("auditSchedule");
    if (savedSchedule) {
      const parsedSchedule = JSON.parse(savedSchedule);
      // Ensure each row has a responsibility object with arrays
      const normalizedSchedule = parsedSchedule.map(row => ({
        ...row,
        responsibility: {
          auditors: row.responsibility?.auditors || [],
          auditee: row.responsibility?.auditee || []
        }
      }));
      setSchedule(normalizedSchedule);
    }
  }, []);

  const auditeeManagement = tenantDetails?.departments?.map((dept) => ({
    name: `${dept.head.firstName} ${dept.head.lastName}`,
    email: dept.head.email,
  })) || [];

  const allAuditors = [team.leader, ...team.members].filter(Boolean);

  const handleAddRow = () => {
    setSchedule((prev) => [...prev, { 
      date: "", 
      startTime: "", 
      endTime: "", 
      activity: "", 
      responsibility: { auditors: [], auditee: [] }
    }]);
  };

  const handleUpdateRow = (index, field, value) => {
    setSchedule((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleResponsibilityChange = (index, type, selectedItems) => {
    setSchedule((prev) =>
      prev.map((row, i) => 
        i === index 
          ? { ...row, responsibility: { ...row.responsibility, [type]: selectedItems } }
          : row
      )
    );
  };

  const handleRemoveRow = (index) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = () => {
    // Save the schedule to localStorage
    localStorage.setItem("auditSchedule", JSON.stringify(schedule));

    // Save tenant-related data to auditResults
    const tenantData = {
      tenantName: tenantDetails?.name || "Unknown Tenant",
      departments: tenantDetails?.departments || [],
    };

    const auditResults = {
      ...JSON.parse(localStorage.getItem("auditResults") || "{}"),
      tenantName: tenantData.tenantName,
      departments: tenantData.departments,
    };

    localStorage.setItem("auditResults", JSON.stringify(auditResults));

    console.log("Schedule and Tenant Data saved:", { schedule, tenantData });

    // Clear the form
    setSchedule([]);

    // Redirect to the Notes section
    router.push(`/auditor-staff/audit-plan/notes`);
  };

  // Function to generate the timetable grouped by date
  const generateTimetable = () => {
    const groupedByDate = schedule.reduce((acc, row) => {
      if (!acc[row.date]) acc[row.date] = [];
      acc[row.date].push(row);
      return acc;
    }, {});

    let dayCounter = 1;
    const timetable = [];

    for (const [date, rows] of Object.entries(groupedByDate)) {
      // Add a date row
      timetable.push({
        isDateRow: true,
        date: `DAY ${dayCounter} – ${new Date(date).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`,
      });

      // Add activity rows for the date
      rows.forEach((row) => {
        const time = `${row.startTime} - ${row.endTime}`;
        const activity = row.activity;

        // Simplify responsibility display
        const auditors =
          row.responsibility.auditors.length === allAuditors.length
            ? "Auditors"
            : row.responsibility.auditors.join(", ");
        const auditee =
          row.responsibility.auditee.length === auditeeManagement.length
            ? "Auditee Management"
            : row.responsibility.auditee.join(", ");

        const responsibility = [auditors, auditee].filter(Boolean).join(" | ");

        timetable.push({ isDateRow: false, time, activity, responsibility });
      });

      dayCounter++;
    }

    return timetable;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Audit Schedule</h1>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100 sticky top-0">
              <th className="border border-gray-300 p-2">Date and Time</th>
              <th className="border border-gray-300 p-2">Audit Activity</th>
              <th className="border border-gray-300 p-2">Responsibility</th>
              <th className="border border-gray-300 p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((row, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 align-top">
                  <div className="flex flex-col gap-2">
                    <Input
                      type="date"
                      value={row.date}
                      onChange={(e) => handleUpdateRow(index, "date", e.target.value)}
                    />
                    <div className="flex gap-2 items-center">
                      <Input
                        type="time"
                        value={row.startTime}
                        onChange={(e) => handleUpdateRow(index, "startTime", e.target.value)}
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={row.endTime}
                        onChange={(e) => handleUpdateRow(index, "endTime", e.target.value)}
                      />
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 align-top">
                  <Select
                    value={row.activity}
                    onValueChange={(value) => handleUpdateRow(index, "activity", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Activity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Opening Meeting">Opening Meeting</SelectItem>
                      {scope.map((department, i) => (
                        <SelectItem key={i} value={`Audit ${department}`}>
                          Audit {department}
                        </SelectItem>
                      ))}
                      <SelectItem value="Health Break">Health Break</SelectItem>
                      <SelectItem value="Auditors Meeting">Auditors Meeting</SelectItem>
                      <SelectItem value="Closing Meeting">Closing Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="border border-gray-300 p-2 align-top">
                  <div className="space-y-4">
                    {/* Auditors Selection */}
                    <div>
                      <Label className="font-semibold">Auditors</Label>
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id={`select-all-auditors-${index}`}
                          onCheckedChange={(checked) => 
                            handleResponsibilityChange(
                              index, 
                              "auditors", 
                              checked ? allAuditors : []
                            )
                          }
                          checked={row.responsibility?.auditors?.length === allAuditors.length}
                        />
                        <Label htmlFor={`select-all-auditors-${index}`}>Select All</Label>
                      </div>
                      <ScrollArea className="h-24 border rounded p-2">
                        {allAuditors.map((auditor) => (
                          <div key={auditor} className="flex items-center gap-2">
                            <Checkbox
                              id={`${auditor}-${index}`}
                              checked={row.responsibility?.auditors?.includes(auditor) || false}
                              onCheckedChange={(checked) => {
                                const newAuditors = checked
                                  ? [...(row.responsibility?.auditors || []), auditor]
                                  : (row.responsibility?.auditors || []).filter((a) => a !== auditor);
                                handleResponsibilityChange(index, "auditors", newAuditors);
                              }}
                            />
                            <Label htmlFor={`${auditor}-${index}`}>
                              {auditor === team.leader ? `Leader: ${auditor}` : auditor}
                            </Label>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>

                    {/* Auditee Management Selection */}
                    <div>
                      <Label className="font-semibold">Auditee Management (use client)</Label>
                      <div className="flex items-center gap-2 mb-2">
                        <Checkbox
                          id={`select-all-auditee-${index}`}
                          onCheckedChange={(checked) => 
                            handleResponsibilityChange(
                              index, 
                              "auditee", 
                              checked ? auditeeManagement.map(a => a.name) : []
                            )
                          }
                          checked={row.responsibility?.auditee?.length === auditeeManagement.length}
                        />
                        <Label htmlFor={`select-all-auditee-${index}`}>Select All</Label>
                      </div>
                      <ScrollArea className="h-24 border rounded p-2">
                        {auditeeManagement.map((head) => (
                          <div key={head.name} className="flex items-center gap-2">
                            <Checkbox
                              id={`${head.name}-${index}`}
                              checked={row.responsibility?.auditee?.includes(head.name) || false}
                              onCheckedChange={(checked) => {
                                const newAuditee = checked
                                  ? [...(row.responsibility?.auditee || []), head.name]
                                  : (row.responsibility?.auditee || []).filter((a) => a !== head.name);
                                handleResponsibilityChange(index, "auditee", newAuditee);
                              }}
                            />
                            <Label htmlFor={`${head.name}-${index}`}>
                              {head.name} ({head.email})
                            </Label>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                    <Label className="font-semibold">Selected Items</Label>
                    <p className="text-sm text-gray-500">
                        Auditors: {row.responsibility?.auditors?.length || 0},
                        Auditee: {row.responsibility?.auditee?.length || 0}
                    </p>
                        
                        
                    
   
                    {/* Selected Items Display */}
                    <div className="flex flex-wrap gap-2">
                      {[...(row.responsibility?.auditors || []), ...(row.responsibility?.auditee || [])].map((item) => (
                        <span 
                          key={item} 
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 align-top">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRow(index)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>

      {/* Render the timetable */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Generated Timetable</h2>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2">Time</th>
              <th className="border border-gray-300 p-2">Audit Activity</th>
              <th className="border border-gray-300 p-2">Responsibility</th>
            </tr>
          </thead>
          <tbody>
            {generateTimetable().map((entry, index) =>
              entry.isDateRow ? (
                <tr key={index}>
                  <td
                    colSpan={3}
                    className="border border-gray-300 p-2 bg-gray-200 font-semibold text-center"
                  >
                    {entry.date}
                  </td>
                </tr>
              ) : (
                <tr key={index}>
                  <td className="border border-gray-300 p-2">{entry.time}</td>
                  <td className="border border-gray-300 p-2">{entry.activity}</td>
                  <td className="border border-gray-300 p-2">{entry.responsibility}</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between">
        <Button variant="outline" size="sm" onClick={handleAddRow}>
          Add Row
        </Button>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => router.push(`/auditor-staff/audit-plan`)}>
            Cancel
          </Button>
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSaveSchedule}
          >
            Save Schedule
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
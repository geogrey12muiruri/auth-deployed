"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const AuditPlanPage = () => {
  const router = useRouter();
  const [auditResults, setAuditResults] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [timetable, setTimetable] = useState([]);

  useEffect(() => {
    // Fetch audit results
    const savedResults = localStorage.getItem("auditResults");
    const savedNotes = localStorage.getItem("auditNotes");
    const savedRequirements = localStorage.getItem("auditRequirements");

    const results = savedResults ? JSON.parse(savedResults) : {};
    const notes = savedNotes ? JSON.parse(savedNotes) : [];
    const requirements = savedRequirements ? JSON.parse(savedRequirements) : [];

    // Combine audit results with notes and requirements
    setAuditResults({ ...results, notes, requirements });

    // Fetch schedule
    const savedSchedule = localStorage.getItem("auditSchedule");
    if (savedSchedule) {
      const parsedSchedule = JSON.parse(savedSchedule);
      setSchedule(parsedSchedule);

      // Generate timetable
      const groupedByDate = parsedSchedule.reduce((acc, row) => {
        if (!acc[row.date]) acc[row.date] = [];
        acc[row.date].push(row);
        return acc;
      }, {});

      let dayCounter = 1;
      const generatedTimetable = [];

      for (const [date, rows] of Object.entries(groupedByDate)) {
        // Add a date row
        generatedTimetable.push({
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
            row.responsibility.auditors.length === schedule[0]?.responsibility?.auditors?.length
              ? "Auditors"
              : row.responsibility.auditors.join(", ");
          const auditee =
            row.responsibility.auditee.length === schedule[0]?.responsibility?.auditee?.length
              ? "Auditee Management"
              : row.responsibility.auditee.join(", ");

          const responsibility = [auditors, auditee].filter(Boolean).join(" | ");

          generatedTimetable.push({ isDateRow: false, time, activity, responsibility });
        });

        dayCounter++;
      }

      setTimetable(generatedTimetable);
    }
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white border border-gray-300 rounded shadow">
      <h1 className="text-3xl font-bold text-center mb-6">
        {auditResults?.tenantName || "Tenant"} - {auditResults?.programName || "Program"} Audit Plan
      </h1>

      {/* Audit Results */}
      <section className="mb-8">
      
        {auditResults ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Scope</h3>
              <ul className="list-disc list-inside">
                {auditResults.scope.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Objectives</h3>
              <ul className="list-disc list-inside">
                {auditResults.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Criteria</h3>
              <ul className="list-disc list-inside">
                {auditResults.criteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Methods</h3>
              <ul className="list-disc list-inside">
                {auditResults.methods.map((method, index) => (
                  <li key={index}>{method}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Team</h3>
              <p>
                <strong>Leader:</strong> {auditResults.team.leader}
              </p>
              <ul className="list-disc list-inside">
                {auditResults.team.members.map((member, index) => (
                  <li key={index}>{member}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">No audit results available.</p>
        )}
      </section>

      {/* Timetable */}
      <section className="mb-8">
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">Time</th>
                <th className="border border-gray-300 p-2">Audit Activity</th>
                <th className="border border-gray-300 p-2">Responsibility</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((entry, index) =>
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
        </ScrollArea>
      </section>

      {/* Notes */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Notes</h2>
        {auditResults?.notes?.length > 0 ? (
          <ul className="list-disc list-inside bg-gray-100 p-4 rounded border">
            {auditResults.notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No notes available.</p>
        )}
      </section>

      {/* Requirements */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Requirements</h2>
        {auditResults?.requirements?.length > 0 ? (
          <ul className="list-disc list-inside bg-gray-100 p-4 rounded border">
            {auditResults.requirements.map((requirement, index) => (
              <li key={index}>{requirement}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No requirements available.</p>
        )}
      </section>

      {/* Prepared By */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">Prepared By</h2>
        <div className="bg-gray-100 p-4 rounded border">
          <p>
            <strong>Team Leader:</strong> {auditResults?.team?.leader || "Not Assigned"}
          </p>
        </div>
      </section>

      {/* Submit for Approval */}
      <div className="mt-6 flex justify-end">
        <Button
          variant="default"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => console.log("Submit for Approval clicked")}
        >
          Submit for Approval
        </Button>
      </div>
    </div>
  );
};

export default AuditPlanPage;

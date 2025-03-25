"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  "TRAINEE",
  "TRAINER",
  "HOD",
  "ADMIN",
  "REGISTRAR",
  "STAFF",
  "SUPER_ADMIN",
  "MANAGEMENT_REP",
  "AUDITOR"
];

const ALLOWED_TYPES = ["UNIVERSITY", "COLLEGE", "SCHOOL", "INSTITUTE", "OTHER"];

export default function TenantsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false); // State to toggle form visibility
  const [formData, setFormData] = useState({
    name: "", domain: "", address: "", city: "", state: "",
    country: "", phone: "", email: "", type: "",
    accreditationNumber: "", establishedYear: "", timezone: "",
    currency: "", status: "PENDING",
    users: ROLES.map(role => ({
      email: "", role, firstName: "", lastName: "", password: ""
    })),
    departments: [{ name: "", code: "", hodEmail: "" }]
  });
  const [roles, setRoles] = useState([]); // State to store roles dynamically

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch tenants");
        const data = await response.json();
        setTenants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching tenants:", error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.role?.toUpperCase() === "SUPER_ADMIN") fetchTenants();
    else setLoading(false);
  }, [token, user]);

  // Fetch roles dynamically from the backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch roles");
        const roles = await response.json();
        setRoles(roles); // Dynamically set roles
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchRoles();
  }, [token]);

  const handleInputChange = (e, section, index, field) => {
    const { value } = e.target;
    setFormData(prev => {
      if (section === "tenant") return { ...prev, [field]: value };
      if (section === "users") {
        const updatedUsers = [...prev.users];
        updatedUsers[index] = { ...updatedUsers[index], [field]: value };
        return { ...prev, users: updatedUsers };
      }
      if (section === "departments") {
        const updatedDepts = [...prev.departments];
        updatedDepts[index] = { ...updatedDepts[index], [field]: value };
        return { ...prev, departments: updatedDepts };
      }
      return prev;
    });
  };

  const handleSelectChange = (value, section, index, field) => {
    if (!value) return;
    setFormData(prev => {
      if (section === "tenant") return { ...prev, [field]: value };
      if (section === "departments") {
        const updatedDepts = [...prev.departments];
        updatedDepts[index] = { ...updatedDepts[index], [field]: value };
        return { ...prev, departments: updatedDepts };
      }
      return prev;
    });
  };

  const addDepartment = () => {
    setFormData(prev => ({
      ...prev,
      departments: [...prev.departments, { name: "", code: "", hodEmail: "" }]
    }));
  };

  const removeDepartment = (index) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submitting form data:", formData); // Debugging log

    // Validate required fields
    if (!formData.name || !formData.domain || !formData.email || !formData.type) {
      alert("Please fill in all required fields.");
      return;
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(formData.type.toUpperCase())) {
      alert(`Invalid type. Allowed values are: ${ALLOWED_TYPES.join(", ")}`);
      return;
    }

    // Validate users
    const providedRoles = formData.users.map(user => user.role.toUpperCase());
    const missingRoles = ROLES.filter(role => !providedRoles.includes(role));
    if (missingRoles.length > 0) {
      alert(`Missing users for roles: ${missingRoles.join(", ")}`);
      return;
    }

    // Validate departments
    const deptNames = formData.departments.map(dept => dept.name);
    if (new Set(deptNames).size !== deptNames.length) {
      alert("Duplicate department names are not allowed.");
      return;
    }

    const hodEmails = formData.departments.map(dept => dept.hodEmail);
    const hodUsers = formData.users.filter(user => user.role.toUpperCase() === "HOD");
    const invalidHods = hodEmails.filter(email => !hodUsers.some(user => user.email === email));
    if (invalidHods.length > 0) {
      alert(`Invalid HOD emails: ${invalidHods.join(", ")}`);
      return;
    }

    // Submit the form
    try {
      const response = await fetch("http://localhost:5001/api/superadmin/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from server:", errorData); // Log server error
        alert(errorData.error || "Failed to create tenant");
        return;
      }

      const newTenant = await response.json();
      console.log("Tenant created successfully:", newTenant); // Debugging log
      setTenants(prev => [...prev, newTenant.tenant]);
      setShowForm(false);
      setFormData({
        name: "", domain: "", address: "", city: "", state: "",
        country: "", phone: "", email: "", type: "",
        accreditationNumber: "", establishedYear: "", timezone: "",
        currency: "", status: "PENDING",
        users: ROLES.map(role => ({
          email: "", role, firstName: "", lastName: "", password: ""
        })),
        departments: [{ name: "", code: "", hodEmail: "" }]
      });
    } catch (error) {
      console.error("Error creating tenant:", error); // Log client-side error
      alert("An error occurred while creating the institution. Please try again.");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      name: "", domain: "", address: "", city: "", state: "",
      country: "", phone: "", email: "", type: "",
      accreditationNumber: "", establishedYear: "", timezone: "",
      currency: "", status: "PENDING",
      users: ROLES.map(role => ({
        email: "", role, firstName: "", lastName: "", password: ""
      })),
      departments: [{ name: "", code: "", hodEmail: "" }]
    });
  };

  if (loading) return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Institutions</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );

  if (user?.role?.toUpperCase() !== "SUPER_ADMIN") return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Institutions</h1>
        <p className="text-red-600">Access denied. Super Admin privileges required.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Institutions</h1>
          {!showForm && (
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 transition-colors"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              New Institution
            </Button>
          )}
        </div>

        {showForm ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Institution</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Institution Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Institution Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[{ label: "Name", field: "name", required: true },
                    { label: "Domain", field: "domain", required: true },
                    { label: "Email", field: "email", type: "email", required: true },
                    { label: "Type", field: "type", select: true },
                    { label: "Address", field: "address" },
                    { label: "City", field: "city" },
                    { label: "State", field: "state" },
                    { label: "Country", field: "country" },
                    { label: "Phone", field: "phone" },
                    { label: "Accreditation Number", field: "accreditationNumber" },
                    { label: "Established Year", field: "establishedYear", type: "number" },
                    { label: "Timezone", field: "timezone" },
                    { label: "Currency", field: "currency" }].map(({ label, field, type, required, select }) => (
                      <div key={field} className="space-y-2">
                        <Label className="text-gray-700">{label}</Label>
                        {select ? (
                          <Select
                            value={formData[field]}
                            onValueChange={(value) => handleSelectChange(value, "tenant", null, field)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {ALLOWED_TYPES.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={type || "text"}
                            value={formData[field]}
                            onChange={(e) => handleInputChange(e, "tenant", null, field)}
                            required={required}
                            className="w-full"
                          />
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Users Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Users</h3>
                <div className="space-y-4">
                  {formData.users.map((user, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-white rounded-lg shadow-sm">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={user.email}
                          onChange={(e) => handleInputChange(e, "users", index, "email")}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input value={user.role} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={user.firstName}
                          onChange={(e) => handleInputChange(e, "users", index, "firstName")}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={user.lastName}
                          onChange={(e) => handleInputChange(e, "users", index, "lastName")}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          value={user.password}
                          onChange={(e) => handleInputChange(e, "users", index, "password")}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departments Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Departments</h3>
                  <Button type="button" variant="outline" onClick={addDepartment}>
                    Add Department
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.departments.map((dept, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg shadow-sm">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={dept.name}
                          onChange={(e) => handleInputChange(e, "departments", index, "name")}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <Input
                          value={dept.code}
                          onChange={(e) => handleInputChange(e, "departments", index, "code")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HOD Email</Label>
                        <Select
                          value={dept.hodEmail}
                          onValueChange={(value) => handleSelectChange(value, "departments", index, "hodEmail")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select HOD" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.users
                              .filter(u => u.role === "HOD" && u.email?.trim())
                              .map(hod => (
                                <SelectItem key={hod.email} value={hod.email}>
                                  {hod.firstName} {hod.lastName} ({hod.email})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeDepartment(index)}
                          disabled={formData.departments.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  Create Institution
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">All Institutions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Name", "Domain", "Email", "Type", "Status", "Users", "Departments"].map(head => (
                      <TableHead key={head} className="text-gray-700">{head}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.length > 0 ? (
                    tenants.map(tenant => (
                      <TableRow key={tenant.id} className="hover:bg-gray-50">
                        <TableCell>{tenant.name}</TableCell>
                        <TableCell>{tenant.domain}</TableCell>
                        <TableCell>{tenant.email}</TableCell>
                        <TableCell>{tenant.type}</TableCell>
                        <TableCell>{tenant.status}</TableCell>
                        <TableCell>{tenant.users?.length || 0}</TableCell>
                        <TableCell>{tenant.departments?.length || 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No institutions found. Create a new one to get started!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
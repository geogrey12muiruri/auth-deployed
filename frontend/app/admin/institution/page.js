"use client";
import { toast } from "react-toastify";
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
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InstitutionPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [departmentInput, setDepartmentInput] = useState({
    name: "",
    code: "",
    head: { email: "", firstName: "", lastName: "", password: "" },
  });
  const [roleInput, setRoleInput] = useState({ name: "", description: "" });
  const [userInput, setUserInput] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    roleId: "",
    departmentId: "",
  });

  useEffect(() => {
    const fetchInstitution = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/tenants/${user?.tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch institution details");
        const data = await response.json();
        setInstitution(data);
      } catch (error) {
        console.error("Error fetching institution details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTenantDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/tenants/${user?.tenantId}/details`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch tenant details");
        const data = await response.json();
        setDepartments(data.departments || []);
        setRoles(data.roles || []);
      } catch (error) {
        console.error("Error fetching tenant details:", error);
      }
    };

    if (user?.tenantId) {
      fetchInstitution();
      fetchTenantDetails();
    }
  }, [token, user]);

  const handleInputChange = (e, section, field, subField) => {
    const { value } = e.target;
    if (section === "departments") {
      setDepartmentInput((prev) => ({
        ...prev,
        [field]: subField ? { ...prev[field], [subField]: value } : value,
      }));
    } else if (section === "roles") {
      setRoleInput((prev) => ({ ...prev, [field]: value }));
    } else if (section === "users") {
      setUserInput((prev) => ({ ...prev, [field]: value }));
    }
  };

  const addDepartment = async () => {
    if (!departmentInput.name || !departmentInput.code || !departmentInput.head.email) {
      alert("Please fill in all required fields for the department.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/tenants/${user?.tenantId}/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: departmentInput.name,
          code: departmentInput.code,
          head: departmentInput.head,
        }),
      });

      if (!response.ok) throw new Error("Failed to add department");
      const data = await response.json();
      alert("Department added successfully!");
      setDepartments((prev) => [...prev, data.department]);
      setDepartmentInput({
        name: "",
        code: "",
        head: { email: "", firstName: "", lastName: "", password: "" },
      });
    } catch (error) {
      console.error("Error adding department:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const addRole = async () => {
    if (!roleInput.name || !roleInput.description) {
      alert("Please fill in all required fields for the role.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/tenants/${user?.tenantId}/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roleInput.name,
          description: roleInput.description,
        }),
      });

      if (!response.ok) throw new Error("Failed to add role");
      const data = await response.json();
      alert("Role added successfully!");
      setRoles((prev) => [...prev, data.role]);
      setRoleInput({ name: "", description: "" });
    } catch (error) {
      console.error("Error adding role:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const addUser = async () => {
    if (!userInput.email || !userInput.firstName || !userInput.lastName || !userInput.password || !userInput.roleId) {
      alert("Please fill in all required fields for the user.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/api/tenants/${user?.tenantId}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: userInput.email,
          firstName: userInput.firstName,
          lastName: userInput.lastName,
          password: userInput.password,
          roleId: userInput.roleId,
          departmentId: userInput.departmentId || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to add user");
      const data = await response.json();
      alert("User added successfully!");
      setUsers((prev) => [...prev, data.user]);
      setUserInput({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        roleId: "",
        departmentId: "",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const removeItem = (section, index) => {
    if (section === "departments") {
      setDepartments((prev) => prev.filter((_, i) => i !== index));
    } else if (section === "roles") {
      setRoles((prev) => prev.filter((_, i) => i !== index));
    } else if (section === "users") {
      setUsers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success("Profile updated successfully!");
    setShowForm(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Institution</h1>
          {!showForm && (
            <Button
              className="bg-cyan-600 hover:bg-cyan-700 transition-colors"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-5 w-5 mr-2" />
              Complete Profile
            </Button>
          )}
        </div>

        {showForm ? (
          <div className="bg-white p-6 rounded-lg shadow-md animate-in fade-in duration-300">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Complete Institution Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Departments Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Add Department</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={departmentInput.name}
                      onChange={(e) => handleInputChange(e, "departments", "name")}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Input
                      value={departmentInput.code}
                      onChange={(e) => handleInputChange(e, "departments", "code")}
                      placeholder="e.g., CS101"
                    />
                  </div>
                  {["email", "firstName", "lastName", "password"].map((field) => (
                    <div key={field} className="space-y-2">
                      <Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                      <Input
                        type={field === "password" ? "password" : "text"}
                        value={departmentInput.head[field]}
                        onChange={(e) => handleInputChange(e, "departments", "head", field)}
                        placeholder={`Head's ${field}`}
                      />
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={addDepartment} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" /> Add Department
                </Button>

                {departments.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Head Email</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((dept, index) => (
                        <TableRow key={index}>
                          <TableCell>{dept.name}</TableCell>
                          <TableCell>{dept.code}</TableCell>
                          <TableCell>{dept.head?.email || "N/A"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem("departments", index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Roles Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Add Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={roleInput.name}
                      onChange={(e) => handleInputChange(e, "roles", "name")}
                      placeholder="e.g., Staff"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={roleInput.description}
                      onChange={(e) => handleInputChange(e, "roles", "description")}
                      placeholder="e.g., Staff role for the institution"
                    />
                  </div>
                </div>
                <Button type="button" onClick={addRole} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" /> Add Role
                </Button>

                {roles.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role, index) => (
                        <TableRow key={index}>
                          <TableCell>{role.name}</TableCell>
                          <TableCell>{role.description}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem("roles", index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Users Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Add User</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={userInput.email}
                      onChange={(e) => handleInputChange(e, "users", "email")}
                      placeholder="e.g., user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={userInput.firstName}
                      onChange={(e) => handleInputChange(e, "users", "firstName")}
                      placeholder="e.g., John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={userInput.lastName}
                      onChange={(e) => handleInputChange(e, "users", "lastName")}
                      placeholder="e.g., Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={userInput.password}
                      onChange={(e) => handleInputChange(e, "users", "password")}
                      placeholder="Enter a secure password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <select
                      value={userInput.roleId}
                      onChange={(e) => handleInputChange(e, "users", "roleId")}
                      className="w-full border-gray-300 rounded-md"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <select
                      value={userInput.departmentId}
                      onChange={(e) => handleInputChange(e, "users", "departmentId")}
                      className="w-full border-gray-300 rounded-md"
                    >
                      <option value="">Select a department (optional)</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button type="button" onClick={addUser} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" /> Add User
                </Button>

                {users.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.firstName}</TableCell>
                          <TableCell>{user.lastName}</TableCell>
                          <TableCell>{roles.find((role) => role.id === user.roleId)?.name || "N/A"}</TableCell>
                          <TableCell>{departments.find((dept) => dept.id === user.departmentId)?.name || "N/A"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem("users", index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  Complete Profile
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Institution Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {["Name", "Domain", "Email", "Type", "Status"].map((head) => (
                      <TableHead key={head} className="text-gray-700">
                        {head}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institution ? (
                    <TableRow>
                      <TableCell>{institution.name}</TableCell>
                      <TableCell>{institution.domain}</TableCell>
                      <TableCell>{institution.email}</TableCell>
                      <TableCell>{institution.type}</TableCell>
                      <TableCell>{institution.status}</TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No institution details found.
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
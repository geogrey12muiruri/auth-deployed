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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define REQUIRED_ROLES before using it
const REQUIRED_ROLES = [
  "STUDENT",
  "LECTURER",
  "HOD",
  "ADMIN",
  "REGISTRAR",
  "STAFF",
  "SUPER_ADMIN",
  "AUDITOR_GENERAL",
  "AUDITOR",
];

export default function TenantsPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    logoUrl: "",
    address: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    email: "",
    type: "",
    accreditationNumber: "",
    establishedYear: "",
    timezone: "",
    currency: "",
    status: "PENDING",
    users: REQUIRED_ROLES.map((role) => ({
      email: "",
      role,
      firstName: "",
      lastName: "",
      password: "",
    })),
    departments: [{ name: "", code: "", hodEmail: "" }],
  });

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
    if (user?.role?.toUpperCase() === "SUPER_ADMIN") {
      fetchTenants();
    } else {
      setLoading(false);
    }
  }, [token, user]);

  const handleInputChange = (e, section, index, field) => {
    const { value } = e.target;
    setFormData((prev) => {
      if (section === "tenant") {
        return { ...prev, [field]: value };
      } else if (section === "users") {
        const updatedUsers = [...prev.users];
        updatedUsers[index] = { ...updatedUsers[index], [field]: value };
        return { ...prev, users: updatedUsers };
      } else if (section === "departments") {
        const updatedDepts = [...prev.departments];
        updatedDepts[index] = { ...updatedDepts[index], [field]: value };
        return { ...prev, departments: updatedDepts };
      }
      return prev;
    });
  };

  const handleSelectChange = (value, section, index, field) => {
    setFormData((prev) => {
      if (section === "tenant") {
        return { ...prev, [field]: value };
      } else if (section === "departments") {
        const updatedDepts = [...prev.departments];
        updatedDepts[index] = { ...updatedDepts[index], [field]: value };
        return { ...prev, departments: updatedDepts };
      }
      return prev;
    });
  };

  const addDepartment = () => {
    setFormData((prev) => ({
      ...prev,
      departments: [...prev.departments, { name: "", code: "", hodEmail: "" }],
    }));
  };

  const removeDepartment = (index) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5001/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create tenant");
      }
      const newTenant = await response.json();
      setTenants((prev) => [...prev, newTenant.tenant]);
      setOpen(false);
      setFormData({
        name: "",
        domain: "",
        logoUrl: "",
        address: "",
        city: "",
        state: "",
        country: "",
        phone: "",
        email: "",
        type: "",
        accreditationNumber: "",
        establishedYear: "",
        timezone: "",
        currency: "",
        status: "PENDING",
        users: REQUIRED_ROLES.map((role) => ({
          email: "",
          role,
          firstName: "",
          lastName: "",
          password: "",
        })),
        departments: [{ name: "", code: "", hodEmail: "" }],
      });
    } catch (error) {
      console.error("Error creating tenant:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Institutions</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (user?.role?.toUpperCase() !== "SUPER_ADMIN") {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Institutions</h1>
        <p className="text-red-500">Access denied. Super Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Institutions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4 mr-2" />
              New Institution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Institution</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange(e, "tenant", null, "name")}
                    required
                  />
                </div>
                <div>
                  <Label>Domain</Label>
                  <Input
                    value={formData.domain}
                    onChange={(e) => handleInputChange(e, "tenant", null, "domain")}
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange(e, "tenant", null, "email")}
                    required
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange(value, "tenant", null, "type")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SCHOOL">School</SelectItem>
                      <SelectItem value="UNIVERSITY">University</SelectItem>
                      <SelectItem value="COLLEGE">College</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange(e, "tenant", null, "address")}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange(e, "tenant", null, "city")}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange(e, "tenant", null, "state")}
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange(e, "tenant", null, "country")}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange(e, "tenant", null, "phone")}
                  />
                </div>
                <div>
                  <Label>Accreditation Number</Label>
                  <Input
                    value={formData.accreditationNumber}
                    onChange={(e) => handleInputChange(e, "tenant", null, "accreditationNumber")}
                  />
                </div>
                <div>
                  <Label>Established Year</Label>
                  <Input
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => handleInputChange(e, "tenant", null, "establishedYear")}
                  />
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Input
                    value={formData.timezone}
                    onChange={(e) => handleInputChange(e, "tenant", null, "timezone")}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input
                    value={formData.currency}
                    onChange={(e) => handleInputChange(e, "tenant", null, "currency")}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Users</h3>
                {formData.users.map((user, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={user.email}
                        onChange={(e) => handleInputChange(e, "users", index, "email")}
                        required
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input value={user.role} disabled />
                    </div>
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={user.firstName}
                        onChange={(e) => handleInputChange(e, "users", index, "firstName")}
                        required
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={user.lastName}
                        onChange={(e) => handleInputChange(e, "users", index, "lastName")}
                        required
                      />
                    </div>
                    <div>
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

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold">Departments</h3>
                  <Button type="button" variant="outline" onClick={addDepartment}>
                    Add Department
                  </Button>
                </div>
                {formData.departments.map((dept, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={dept.name}
                        onChange={(e) => handleInputChange(e, "departments", index, "name")}
                        required
                      />
                    </div>
                    <div>
                      <Label>Code</Label>
                      <Input
                        value={dept.code}
                        onChange={(e) => handleInputChange(e, "departments", index, "code")}
                      />
                    </div>
                    <div>
                      <Label>HOD Email</Label>
                      <Select
                        value={dept.hodEmail}
                        onValueChange={(value) =>
                          handleSelectChange(value, "departments", index, "hodEmail")
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select HOD" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.users
                            .filter((u) => u.role === "HOD")
                            .map((hod) => (
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

              <div className="flex justify-end">
                <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                  Create Institution
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Institutions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Departments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
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
                  <TableCell colSpan={7} className="text-center">
                    No institutions found. Create a new one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Opt out of static prerendering since this is a client-side page
export const dynamic = "force-dynamic";
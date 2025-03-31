import { useState, useEffect } from "react";
import {
  Bell,
  BookOpen,
  FileText,
  LayoutDashboard,
  Users,
  CheckSquare,
  Clock,
  Settings,
  User,
  ClipboardList,
  File,
  Building,
  List,
  FilePlus,
  FileCheck,
  FileSearch,
  FileText as FileTextIcon,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";

// Updated access levels to match new roles (uppercase from auth-service)
const ACCESS_LEVELS_ALL = [
  "TRAINEE",
  "TRAINER",
  "HOD",
  "ADMIN",
  "REGISTRAR",
  "STAFF",
  "SUPER_ADMIN",
  "MR", // Updated from MANAGEMENT_REP to MR
  "AUDITOR",
];

const SidebarIcon = ({ icon: Icon }) => {
  return <Icon className="size-6 lg:size-5 transition-all duration-200" />;
};

export default function Sidebar() {
  const { user, loading } = useAuth(); 
  
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (user) {
      console.log('User in Sidebar:', user);
      setRole(user.roleName); // Use roleName instead of role
    }
  }, [user]);

  if (loading) {
    return <div className="w-16 lg:w-64 h-screen bg-zinc-200 p-4">Loading...</div>;
  }

  if (!role) {
    return <div className="w-16 lg:w-64 h-screen bg-zinc-200 p-4">Loading...</div>;
  }
  // Dynamic routing for Audit Programs based on role
  const getAuditProgramsHref = (role) => {
    if (role === "AUDITOR") return "/auditor-staff/audit-programs";
    if (role === "MR") return "/auditor/audit-programs"; // Updated from MANAGEMENT_REP to MR
    if (role === "ADMIN") return "/admin/audit-programs";
    return "/audit/programs"; // Default route for other roles
  };

  const SIDEBAR_LINKS = [
    {
      label: "MENU",
      links: [
        {
          name: "Dashboard",
          href: `/dashboard/${role || "STAFF"}`,
          access: ACCESS_LEVELS_ALL,
          icon: LayoutDashboard,
        },
        {
          name: "Profile",
          href: "/profile",
          access: ACCESS_LEVELS_ALL,
          icon: User,
        },
        {
          name: "Documents",
          href: "/documents",
          access: ACCESS_LEVELS_ALL,
          icon: File,
        },
      ],
    },
    {
      label: "MANAGE",
      links: [
        {
          name: "User Management",
          href: "/manage/users",
          access: ["ADMIN", "SUPER_ADMIN"],
          icon: Users,
        },
              {
          name: "Institution",
          href: (role) => (role === "SUPER_ADMIN" ? "/super-admin/institution" : "/admin/institution"),
          access: ["ADMIN", "SUPER_ADMIN"], // Allow both Admin and Super Admin to access
          icon: Building,
        },
        {
          name: "Course Management",
          href: "/manage/courses",
          access: ["ADMIN", "HOD", "STAFF"],
          icon: BookOpen,
        },
        {
          name: "Trainee Requests",
          href: "/manage/requests",
          access: ["HOD", "STAFF"],
          icon: ClipboardList,
        },
        {
          name: "Exams & Grades",
          href: "/manage/exams",
          access: ["STAFF"],
          icon: CheckSquare,
        },
        {
          name: "Class Schedules",
          href: "/schedule",
          access: ["HOD", "STAFF", "TRAINEE"],
          icon: Clock,
        },
        {
          name: "Enrollment Requests",
          href: "/enrollment/requests",
          access: ["HOD"],
          icon: FileText,
        },
      ],
    },
    {
      label: "AUDIT",
      links: [
        {
          name: "Audit Dashboard",
          href: "/audit/dashboard",
          access: ["ADMIN", "MR"], // Updated from MANAGEMENT_REP to MR
          icon: LayoutDashboard,
        },
        {
          name: "Audit Programs",
          href: getAuditProgramsHref(role),
          access: [
            "ADMIN",
            "MR", // Updated from MANAGEMENT_REP to MR
            "STAFF",
            "TRAINER",
            "HOD",
            "REGISTRAR",
            "SUPER_ADMIN",
            "AUDITOR",
          ], // Updated access
          icon: List,
          submenu: [
            {
              name: "Active Programs",
              href: "/audit/programs/active",
              access: [
                "ADMIN",
                "MR", // Updated from MANAGEMENT_REP to MR
                "STAFF",
                "TRAINER",
                "HOD",
                "REGISTRAR",
                "SUPER_ADMIN",
                "AUDITOR",
              ], // Updated access
              icon: FileTextIcon,
            },
            {
              name: "Completed Programs",
              href: "/audit/programs/completed",
              access: [
                "ADMIN",
                "MR", // Updated from MANAGEMENT_REP to MR
                "STAFF",
                "TRAINER",
                "HOD",
                "REGISTRAR",
                "SUPER_ADMIN",
                "AUDITOR",
              ], // Updated access
              icon: FileCheck,
            },
            {
              name: "New Program",
              href: "/audit/programs/new",
              access: ["MR"], // Updated from MANAGEMENT_REP to MR
              icon: FilePlus,
            },
          ],
        },
        {
          name: "Tasks",
          href: "/audit/tasks",
          access: ["ADMIN", "MR", "AUDITOR"], // Updated from MANAGEMENT_REP to MR
          icon: ClipboardList,
          submenu: [
            {
              name: "All Tasks",
              href: "/audit/tasks/all",
              access: ["ADMIN", "MR"], // Updated from MANAGEMENT_REP to MR
              icon: List,
            },
            {
              name: "My Tasks",
              href: "/audit/tasks/mine",
              access: ["ADMIN", "MR", "AUDITOR"], // Updated from MANAGEMENT_REP to MR
              icon: User,
            },
            {
              name: "Assign Tasks",
              href: "/audit/tasks/assign",
              access: ["MR"], // Updated from MANAGEMENT_REP to MR
              icon: Users,
            },
          ],
        },
        {
          name: "Reports",
          href: "/audit/reports",
          access: ["ADMIN", "MR"], // Updated from MANAGEMENT_REP to MR
          icon: FileTextIcon,
          submenu: [
            {
              name: "Draft Reports",
              href: "/audit/reports/drafts",
              access: ["ADMIN", "MR"], // Updated from MANAGEMENT_REP to MR
              icon: FileTextIcon,
            },
            {
              name: "Submitted Reports",
              href: "/audit/reports/submitted",
              access: ["ADMIN", "MR"], // Updated from MANAGEMENT_REP to MR
              icon: FileCheck,
            },
            {
              name: "Generate Report",
              href: "/audit/reports/generate",
              access: ["MR"], // Updated from MANAGEMENT_REP to MR
              icon: FilePlus,
            },
          ],
        },
        {
          name: "Audit Trail",
          href: "/audit/trail",
          access: ["ADMIN", "MR"], // Updated from MANAGEMENT_REP to MR
          icon: FileSearch,
        },
      ],
    },
    {
      label: "SYSTEM",
      links: [
        {
          name: "Notifications",
          href: "/notifications",
          access: ACCESS_LEVELS_ALL,
          icon: Bell,
        },
        {
          name: "Settings",
          href: "/settings",
          access: ["ADMIN", "SUPER_ADMIN", "MR"], // Updated from MANAGEMENT_REP to MR
          icon: Settings,
        },
        {
          name: "Logout",
          href: "/logout",
          access: ACCESS_LEVELS_ALL,
          icon: LogOut,
        },
      ],
    },
  ];

  if (!role) {
    return <div className="w-16 lg:w-64 h-screen bg-zinc-200 p-4">Loading...</div>;
  }

  return (
    <div className="w-16 lg:w-64 h-screen p-4 flex flex-col justify-between gap-6 bg-zinc-200 shadow-lg transition-all duration-300">
      <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-1 rounded-lg bg-white shadow-md transition-transform hover:scale-105">
          <img
    src="/logo.svg" // Path to the SVG in the public folder
    alt="UniERP"
    width={40}
    height={40}
    className="rounded-md"
  />
          </div>
          <span className="hidden lg:block text-xl font-semibold text-gray-800 tracking-tight">
  {user?.tenantName || "DimensionPlus"}
</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {SIDEBAR_LINKS.map((section) => (
          <div key={section.label} className="mb-6">
            <span className="hidden lg:block px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {section.label}
            </span>
            <div className="mt-2 space-y-1">
              {section.links.map((link) => {
                if (link.access.includes(role)) {
                  return (
                    <Link
                      key={link.name}
                      href={typeof link.href === "function" ? link.href(role) : link.href}
                      className="flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 text-gray-600 rounded-lg transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 group"
                    >
                      <SidebarIcon icon={link.icon} />
                      <span className="hidden lg:block text-sm font-medium group-hover:font-semibold">
                        {link.name}
                      </span>
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
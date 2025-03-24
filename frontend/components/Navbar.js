import { useAuth } from "@/context/auth-context";
import { Bell } from "lucide-react";
import React from "react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white backdrop-blur-md shadow-sm border-b border-gray-100 p-5 flex justify-between items-center">
      {/* Left: Page Title */}
      <h1 className="text-2xl font-semibold text-gray-800 capitalize tracking-tight">
        Dashboard
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <div className="relative group">
          <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-sm">
              2
            </span>
          </button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Welcome, {user.username}</span>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
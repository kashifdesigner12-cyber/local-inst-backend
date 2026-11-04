import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function AdminLayout() {
    return (
        <div className="min-h-screen bg-[#e0e5ec]">
            {/* =========================================
                FIXED SIDEBAR
            ========================================= */}

            <Sidebar />

            {/* =========================================
                MAIN CONTENT
                Sidebar width = 64 = 256px
            ========================================= */}

            <main
                className="
                    ml-64
                    min-h-screen
                    bg-[#e0e5ec]
                "
            >
                <Outlet />
            </main>
        </div>
    );
}

export default AdminLayout;
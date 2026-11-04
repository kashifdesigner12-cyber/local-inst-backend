import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    // Attendance item removed from Admin menu
    const menuItems = [
        {
            name: "Dashboard",
            path: "/admin/dashboard",
            icon: "📊",
        },
        {
            name: "Students",
            path: "/admin/students",
            icon: "👨‍🎓",
        },
        {
            name: "Staff Management",
            path: "/admin/staff",
            icon: "👥",
        },
        {
            name: "Classes",
            path: "/admin/classes",
            icon: "🏫",
        },
        {
            name: "Fee Management",
            path: "/admin/fees",
            icon: "💳",
        },
        {
            name: "Office Expenses",
            path: "/admin/expenses",
            icon: "🧾",
        },
    ];

    // ==================================================
    // Logout
    // ==================================================

    const handleLogout = () => {
        console.log("Admin logout started");

        // Admin session remove
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        // Agar purana teacher session ho to wo bhi remove
        localStorage.removeItem("teacherToken");
        localStorage.removeItem("teacherUser");

        console.log("Authentication data cleared");

        // Login page par redirect
        navigate("/login", {
            replace: true,
        });

        // App ko fresh auth state ke saath start karne ke liye
        window.location.reload();
    };

    return (
        <aside
            className="
                fixed
                left-0
                top-0
                z-50
                w-64
                h-screen
                bg-[#e0e5ec]
                shadow-[6px_0px_16px_rgb(163,177,198,0.6)]
                border-r
                border-white/50
                flex
                flex-col
            "
        >
            {/* =========================================
                BRANDING (Transparent Background)
            ========================================= */}

            <div className="flex-shrink-0 p-6 pb-4">
                <div className="flex flex-col gap-2 px-2">
                    {/* LOGO CONTAINER */}
                    <div className="w-full h-16 flex items-center justify-center p-1">
                        <img
                            src="/institute-logo.png"
                            alt="LocalPro1 Institute Logo"
                            className="w-full h-full object-contain mix-blend-multiply"
                            onError={(e) => {
                                e.target.src = "/logo.png";
                            }}
                        />
                    </div>

                    <div className="text-center pt-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                            Admin Portal
                        </p>
                    </div>
                </div>
            </div>
            {/* =========================================
                NAVIGATION
                Only this area can scroll
            ========================================= */}

            <nav className="flex-1 overflow-y-auto px-6 pb-4">
                <div className="space-y-1.5">
                    {menuItems.map((item) => {
                        const isActive =
                            location.pathname === item.path ||
                            location.pathname.startsWith(
                                `${item.path}/`
                            );

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex
                                    items-center
                                    gap-3
                                    px-4
                                    py-3
                                    rounded-xl
                                    text-xs
                                    font-bold
                                    transition-all
                                    ${
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                                            : "text-slate-600 hover:bg-[#d5dbe5] hover:text-slate-900"
                                    }
                                `}
                            >
                                <span className="text-base">
                                    {item.icon}
                                </span>

                                <span>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* =========================================
                LOGOUT
            ========================================= */}

            <div
                className="
                    flex-shrink-0
                    p-6
                    pt-4
                    border-t
                    border-slate-300/60
                    bg-[#e0e5ec]
                "
            >
                <button
                    type="button"
                    onClick={handleLogout}
                    className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        rounded-xl
                        text-xs
                        font-bold
                        text-rose-600
                        hover:bg-rose-50
                        transition-all
                        shadow-sm
                    "
                >
                    <span className="text-base">
                        🚪
                    </span>

                    <span>
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
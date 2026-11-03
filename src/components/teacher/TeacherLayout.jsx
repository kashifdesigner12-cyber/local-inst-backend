import React from "react";
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

function TeacherLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // ======================================================
  // MAIN MENU
  // ======================================================

  const menuItems = [
    {
      name: "Dashboard",
      path: "/teacher/dashboard",
      icon: "📊",
    },
    {
      name: "Students",
      path: "/teacher/students",
      icon: "👨‍🎓",
    },
    {
      name: "Attendance",
      path: "/teacher/attendance",
      icon: "📅",
    },
    {
      name: "Performance Entry",
      path: "/teacher/performance",
      icon: "✏️",
    },
    {
      name: "Performance Graph",
      path: "/teacher/performance-graph",
      icon: "📈",
    },
    {
      name: "Create Exam",
      path: "/teacher/exams",
      icon: "📝",
    },
  ];

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("teacherUser");

    navigate("/login", {
      replace: true,
    });
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <div className="min-h-screen bg-[#e0e5ec]">

      {/* ==================================================
          FIXED SIDEBAR
      ================================================== */}

      <aside
        className="
          fixed
          left-0
          top-0
          bottom-0
          w-64
          bg-[#e0e5ec]
          border-r
          border-slate-300/50
          shadow-[6px_0_16px_rgba(163,177,198,0.35)]
          z-50
          flex
          flex-col
        "
      >

        {/* ==================================================
            BRAND (Transparent Logo)
        ================================================== */}

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
                Teacher Portal
              </p>
            </div>

          </div>
        </div>

        {/* ==================================================
            MENU
        ================================================== */}

        <nav className="flex-1 overflow-y-auto px-6 space-y-2">

          {menuItems.map((item) => {

            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex
                  items-center
                  gap-4
                  px-5
                  py-3.5
                  rounded-2xl
                  text-[15px]
                  font-bold
                  transition-all
                  duration-200
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-[0_8px_18px_rgba(37,99,235,0.28)]"
                      : "text-slate-600 hover:bg-[#d7dce5] hover:text-slate-900"
                  }
                `}
              >

                <span
                  className="
                    w-7
                    text-center
                    text-[22px]
                    leading-none
                    shrink-0
                  "
                >
                  {item.icon}
                </span>

                <span>
                  {item.name}
                </span>

              </Link>
            );
          })}

        </nav>

        {/* ==================================================
            LOGOUT
        ================================================== */}

        <div
          className="
            flex-shrink-0
            border-t
            border-slate-300/50
            px-6
            py-6
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
              gap-4
              px-5
              py-3.5
              rounded-2xl
              text-[15px]
              font-bold
              text-rose-600
              bg-[#e0e5ec]
              border
              border-slate-300/20
              shadow-[0_4px_12px_rgba(163,177,198,0.25)]
              hover:bg-rose-50
              hover:text-rose-700
              active:scale-[0.98]
              transition-all
              duration-200
            "
          >

            <span
              className="
                w-7
                text-center
                text-[22px]
                leading-none
              "
            >
              🚪
            </span>

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main
        className="
          ml-64
          min-h-screen
          overflow-y-auto
          overflow-x-hidden
        "
      >
        <Outlet />
      </main>

    </div>
  );
}

export default TeacherLayout;
import { Outlet } from "react-router-dom";

// components

import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Sidebar from "components/Sidebar/Sidebar";
import HeaderStats from "components/Headers/HeaderStats.js";
import FooterAdmin from "components/Footers/FooterAdmin.js";

export default function Admin() {
  return (
    <>
      <Sidebar />
      <div className="relative md:mr-64 h-full">
        {/* <AdminNavbar /> */}
        {/* Header */}
        <HeaderStats />
        <div className="px-4 md:px-10 mx-auto w-full -m-24">
          <Outlet />
          {/* <div className="absolute bottom-0 w-full"> */}
            <FooterAdmin />
          {/* </div> */}
        </div>
      </div>
    </>
  );
}

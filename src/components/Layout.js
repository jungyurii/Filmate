import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import styles from "./Layout.module.css";

export default function Layout() {
  return (
    <div className={styles.shell}>
      <div className={styles.sidebarCol}>
        <Sidebar />
      </div>

      <div className={styles.mainCol}>
        <div className={styles.topbar}>
          <Topbar />
        </div>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

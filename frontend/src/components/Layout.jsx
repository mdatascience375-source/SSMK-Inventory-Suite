import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ children }) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login";

  if (isAuthPage) {
    return <div className="auth-wrapper">{children}</div>;
  }

  return (
    <div className="app-root">
      <Sidebar />
      <div className="main-area">
        <Topbar />
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

export default Layout;


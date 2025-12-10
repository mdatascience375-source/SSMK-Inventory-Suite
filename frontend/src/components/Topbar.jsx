function Topbar() {
  const userJson = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch {
    user = null;
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">SSMK Management Software</h1>
        <p className="topbar-subtitle">Shree Shyam Mobile and Laptop Repair</p>
      </div>
      <div className="topbar-right">
        {user ? (
          <span className="topbar-user">
            {user.username} ({user.role})
          </span>
        ) : (
          <span className="topbar-user">Not logged in</span>
        )}
      </div>
    </header>
  );
}

export default Topbar;


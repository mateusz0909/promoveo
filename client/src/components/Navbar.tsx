import { useAuth } from "../context/AuthContext";
import { ModeToggle } from "./ModeToggle";
import { UserMenu } from "./UserMenu";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b">
      <Link to="/" className="flex items-center gap-2">
        <img src="/promeveo.svg" alt="Promoveo Logo" className="h-8" />
        <h1 className="text-xl font-bold">Promoveo</h1>
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
        {/* <ModeToggle /> */}
      </div>
    </header>
  );
}

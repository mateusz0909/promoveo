import { Route, Routes } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";

export function AuthRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}

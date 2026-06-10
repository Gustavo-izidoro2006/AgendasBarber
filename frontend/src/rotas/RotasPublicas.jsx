import { Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Cadastro from "../pages/Cadastro";
import Logout from "../pages/Logout";
import BarbeariaPublica from "../pages/BarbeariaPublica";

export default function RotasPublicas() {
  return [
    <Route key="landing"   path="/"              element={<Landing />} />,
    <Route key="login"     path="/login"          element={<Login />} />,
    <Route key="cadastro"  path="/cadastro"       element={<Cadastro />} />,
    <Route key="logout"    path="/logout"         element={<Logout />} />,
    <Route key="slug"      path="/:slug"          element={<BarbeariaPublica />} />,
    <Route key="agendar"   path="/:slug/agendar"  element={<BarbeariaPublica />} />,
  ];
}
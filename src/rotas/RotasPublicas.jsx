import { Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Cadastro from "../pages/Cadastro";
import Logout from "../pages/Logout";
import BarbeariaPublica from "../pages/BarbeariaPublica";

export default function RotasPublicas() {
  return (
    <>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/logout" element={<Logout />} />

      {/* Link único público por slug */}
      <Route path="/:slug" element={<BarbeariaPublica />} />
      <Route path="/:slug/agendar" element={<BarbeariaPublica />} />
    </>
  );
}

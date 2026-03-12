import React from "react";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router";
import { TicketsProvider } from "./ticketsContext";
import { AuthProvider } from "./authContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TicketsProvider>
          <AppRouter />
        </TicketsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
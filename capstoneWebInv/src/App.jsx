import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/Pages/Login/Login";
import Home from "./Components/Auth/Home";
import "./App.css";
import { StyledEngineProvider } from "@mui/material/styles";
import { ToastContainer } from "react-toastify";
import axios from "axios";
import apiUrl from "./Components/Config/config";

function App() {
  const [auth, setAuth] = useState(() => {
    // Retrieve auth status from localStorage or set it to false if not found
    const authStatus = localStorage.getItem("auth");
    return authStatus ? JSON.parse(authStatus) : false;
  });

  useEffect(() => {
    handleAuth();
  }, []);

  const handleAuth = () => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setAuth(true);
          // Store auth status in localStorage
          localStorage.setItem("auth", JSON.stringify(true));
        } else {
          setAuth(false);
          // Remove auth status from localStorage
          localStorage.removeItem("auth");
        }
      })
      .catch((err) => {
        console.log(err);
        setAuth(false);
        // Remove auth status from localStorage on error
        localStorage.removeItem("auth");
      });
  };

  return (
    <StyledEngineProvider injectFirst>
      <div>
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                auth ? (
                  <Navigate to="/Home" replace />
                ) : (
                  <Navigate to="/Login" replace />
                )
              }
            />
            <Route
              path="/Login"
              element={!auth ? <Login /> : <Navigate to="/Home" replace />}
            />
            <Route
              path="/Home"
              element={auth ? <Home /> : <Navigate to="/" />}
            />
            <Route
              path="*"
              element={auth ? <Home /> : <Navigate to="/Home" />}
            />
          </Routes>
        </BrowserRouter>
      </div>
    </StyledEngineProvider>
  );
}

export default App;

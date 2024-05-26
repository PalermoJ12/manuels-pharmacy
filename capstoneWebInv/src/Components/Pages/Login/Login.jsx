import React, { useEffect, useState } from "react";
import axios from "axios";

{
  /*IMPORTED ICONS AND PICS*/
}
import { Navigate, useNavigate, Link } from "react-router-dom";
import Mlogo from "../../assets/M-B.png";
import Mpic from "../../assets/Mpic.png";
import style from "./Login.module.css";
//MATERIAL UI COMPONENTS
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

{
  /*TOAST NOTIFICATION*/
}
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import User from "../User/User";

import apiUrl from "../../Config/config";

function Login() {
  //for auth

  const [auth, setAuth] = useState(false);
  const [Message, setMessage] = useState("");
  const [name, setName] = useState("");
  axios.defaults.withCredentials = true;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${apiUrl}/auth`);
        if (res.data.Status === "Success") {
          setAuth(true);
          setName(res.data.name);
        } else {
          setAuth(false);
          setMessage(res.data.Error);
        }
      } catch (err) {
        console.error(err);
      }
    };
  
    fetchData();
  }, [name]);
  
  // End of auth
  
  const [values, setValues] = useState({
    username: "",
    password: "",
  });
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${apiUrl}/login`, values);
      if (res.data.Status === "Success") {
        window.location.reload();
        navigate("/Home");
      } else {
        toast.error(res.data.Error);
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <>
      <div className={`${style.columns} d-flex`}>
        <div
          className={`${style.column1} d-flex align-items-center justify-content-center`}
        >
          <img src={Mpic} className={style.Mpic} />
        </div>
        <div
          className={`${style.column2} d-flex align-items-center justify-content-center`}
        >
          <div className="d-flex flex-column w-75 align-items-center justify-content-center">
            <div>
              <img src={Mlogo} className={style.Mlogo} />
            </div>

            <div>
              <h2>Sign In</h2>
            </div>

            <form className="w-100" onSubmit={handleSubmit}>
              <div className="p-2 w-100 justify-content-center">
                <TextField
                  required
                  id="outlined-basic"
                  label="Username"
                  style={{
                    marginBottom: "10px",
                    width: "100%",
                  }}
                  color="success"
                  className={style.txtUsername}
                  onChange={(e) =>
                    setValues({ ...values, username: e.target.value })
                  }
                  InputProps={{
                    classes: {
                      input: style.txtUsernameCustom,
                    },
                  }}
                />
              </div>
              <div className="p-2 w-100 justify-content-center">
                <TextField
                  required
                  type="password"
                  id="outlined-basic"
                  label="Password"
                  style={{ marginBottom: "10px", width: "100%" }}
                  color="success"
                  onChange={(e) =>
                    setValues({ ...values, password: e.target.value })
                  }
                  InputProps={{
                    classes: { input: style.txtUsernameCustom },
                  }}
                />
              </div>

              <div className="p-2 w-100 justify-content-center">
                <Button
                  className={style.btnContinue}
                  variant="contained"
                  color="success"
                  type="submit"
                  onClick={handleSubmit}
                >
                  Continue
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;

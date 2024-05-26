import React, { useState,useEffect } from 'react'
import User from "../Pages/User/User";
import Admin from "../Pages/Admin/Admin";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import apiUrl from "../Config/config";



function Home() {
    const [auth , setAuth] = useState(false);
    const [Message, setMessage] = useState("");
    const [Name, setName] = useState("");
    const [role , setRole] = useState("");
    axios.defaults.withCredentials = true;
    const navigate = useNavigate();


  useEffect(() => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setAuth(true);
          setName(res.data.Name);
          setRole(res.data.role);
        } else {
          setAuth(false);
          setMessage(res.data.Error);
          navigate("/");
        }
      })
      .catch((err) => console.log(err));
  }, []);


  return (
    <div>
         <Admin /> 
    </div>
  )
}

export default Home

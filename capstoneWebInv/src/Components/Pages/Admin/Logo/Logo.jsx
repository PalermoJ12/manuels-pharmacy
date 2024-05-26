import React from "react";

import style from "./Logo.module.css";
import logo from "../../../assets/M-G.png";

const Logo = () => {
  return (
    <>
      <div
        className={`${style.container} d-flex flex-column justify-content-center align-items-center container-fluid vh-100`}
      >
        <div className={`${style.logodiv}`}>
          <img src={logo} className={style.logo} />
        </div>

        <div className="d-flex flex-column align-items-center justify-content-center">
          <h1 style={{ fontWeight: "600" }}>Manuel's</h1>
          <h1 style={{ fontWeight: "600" }}>Pharmacy</h1>
        </div>
      </div>
    </>
  );
};

export default Logo;

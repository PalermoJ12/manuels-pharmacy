import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { RxDashboard } from "react-icons/rx";
import { RiQuestionnaireFill } from "react-icons/ri";
import { TbLayersSubtract } from "react-icons/tb";
import { BiSolidDashboard } from "react-icons/bi";

import style from "./User.module.css";

{
  /*IMPORTED ICONS AND PICS*/
}
import logo from "../../assets/M-W.png";
import { CiMenuFries } from "react-icons/ci";
import { BiSolidUserCircle, BiSolidShoppingBags } from "react-icons/bi";
import { FaCalculator } from "react-icons/fa";
import { RiLogoutCircleLine } from "react-icons/ri";
import { RxExit } from "react-icons/rx";
import Login from "../Login/Login";
import apiUrl from "../../Config/config";
import { BsBox2Fill } from "react-icons/bs";

import Dashboard from "./DashboardU/Dashboard";
import POS from "./POSu/POS";
import Product from "./ProductU/ProductU";
import Return from "./RequestU/Request";
import Notification from "./NotificationU/Notification";
import Container from "./ContainerU/ContainerU";

function User() {
  const [notification, setNotification] = useState([]);

  const [isNotifVisible, setNotifVisible] = useState(false);

  const handleMouseEnter = () => {
    setNotifVisible(true);
  };

  const handleMouseLeave = () => {
    setNotifVisible(false);
  };

  const handleClickNotif = () => {
    setNotifVisible(true);
  };

  const handleClickNotifClose = () => {
    setNotifVisible(false);
  };

  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  const [auth, setAuth] = useState(false);
  const [Message, setMessage] = useState("");
  const [Name, setName] = useState("");

  axios.defaults.withCredentials = true;

  const navigate = useNavigate();
  useEffect(() => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setAuth(true);
          setName(res.data.name);
          handleGetNotification(res.data.name);
        } else {
          setAuth(false);
          setMessage(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  }, [Name]);

  const handleLogout = () => {
    axios
      .get(`${apiUrl}/logout`)
      .then(location.reload(true))
      .catch((err) => console.log(err));
  };

  const handleGetNotification = (name) => {
    axios
      .get(`${apiUrl}/getNotificationUser/${name}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setNotification(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log);
  };

  const [activeButton, setActiveButton] = useState("dashboard");

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  const renderContent = () => {
    switch (activeButton) {
      case "dashboard":
        return <Dashboard />;

      case "POS":
        return <POS />;

      case "product":
        return <Product />;

      case "container":
        return <Container />;

      case "request":
        return <Return />;

      case "notif":
        return <Notification />;
    }
  };

  return (
    <div>
      {auth ? (
        <div>
          <input type="checkbox" id={style["nav-toggle"]} />
          <div className={style.sidebar}>
            <div className={style["sidebar-brand"]}>
              <img src={logo} className={style.logo} />
              <h2>Manuel's Pharmacy</h2>
            </div>

            <div className={style["sidebar-menu"]}>
              <li className="nav-item">
                <Link
                  className={activeButton === "dashboard" ? style.active : ""}
                  onClick={() => handleButtonClick("dashboard")}
                >
                  <BiSolidDashboard className={style["sidebar-icon"]} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  className={activeButton === "POS" ? style.active : ""}
                  onClick={() => handleButtonClick("POS")}
                >
                  <FaCalculator className={style["sidebar-icon"]} />
                  <span>Start Sales</span>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={activeButton === "product" ? style.active : ""}
                  onClick={() => handleButtonClick("product")}
                >
                  <BiSolidShoppingBags className={style["sidebar-icon"]} />
                  <span>Product</span>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={activeButton === "container" ? style.active : ""}
                  onClick={() => handleButtonClick("container")}
                >
                  <BsBox2Fill className={style["sidebar-icon"]} />
                  <span>Shelves</span>
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={activeButton === "request" ? style.active : ""}
                  onClick={() => handleButtonClick("request")}
                >
                  <RiQuestionnaireFill className={style["sidebar-icon"]} />
                  <span>Request</span>
                </Link>
              </li>
            </div>
          </div>

          <div className={style["main-content"]}>
            <header>
              <h2>
                <label htmlFor={style["nav-toggle"]}>
                  <CiMenuFries
                    className={`${style.burger} ${style["cursor-pointer"]}`}
                  />
                  {activeButton === "Dashboard" && "Dashboard"}
                  {activeButton === "POS" && "Start Sales"}
                  {activeButton === "product" && "Product"}
                </label>
              </h2>

              <div className="d-flex">
                <div
                  className={`${style.divNotifHeader} d-flex`}
                  onClick={() => {
                    handleGetNotification(Name);
                    handleClickNotif();
                  }}
                >
                  <div className="me-4 d-flex justify-content-center align-items-center">
                    <TbLayersSubtract size={30} />
                  </div>
                </div>

                <div
                  className={style["user-wrapper"]}
                  onClick={toggleDropdown}
                  onBlur={() => setShowDropdown(false)}
                  tabIndex="0"
                >
                  <div>
                    <h5>Hi, {Name}</h5>
                    <small>Pharmacist</small>
                  </div>

                  {showDropdown && (
                    <ul
                      className={`${style["dropdown-menu"]} d-flex align-items-center justify-content-center col-6`}
                    >
                      <li onClick={handleLogout}>
                        {" "}
                        <div className="row">
                          <div className="col-auto">
                            <RxExit />
                          </div>

                          <div className="col-8 ps-1">Sign Out</div>
                        </div>
                      </li>
                    </ul>
                  )}
                </div>
              </div>
            </header>

            <main>
              {renderContent()}

              {isNotifVisible && (
                <div
                  className={`${style["div-notif"]}`}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="m-3 d-flex justify-content-end align-items-center">
                    <h6 style={{ fontWeight: "400" }}>Activity Logs</h6>
                  </div>

                  <div className={`${style["table-container-notif"]} mx-4`}>
                    <table className={`${style.tblNotif} table`}>
                      <tbody>
                        {notification.map((data, index) => {
                          return (
                            <tr key={index}>
                              <div
                                className="d-flex flex-column justify-content-start"
                                style={{
                                  background: "transparent",
                                }}
                              >
                                <div>
                                  <h6 className={`${style.notifAuthor}`}>
                                    {data.username}
                                  </h6>
                                </div>
                                <div>
                                  <h6 className={`${style.notifActivity}`}>
                                    {data.userActivity}
                                  </h6>
                                </div>
                              </div>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-2 d-flex justify-content-center">
                    <label
                      className={style["lblSeeAll"]}
                      onClick={() => {
                        handleButtonClick("notif");

                        handleClickNotifClose();
                      }}
                    >
                      <i>See all activity</i>
                    </label>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      ) : (
        <div>
          <Login />
        </div>
      )}
    </div>
  );
}

export default User;

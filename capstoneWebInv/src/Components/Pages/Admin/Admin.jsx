import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaCalculator } from "react-icons/fa";

{
  /*IMPORTED ICONS AND PICS*/
}
import logo from "../../assets/M-W.png";
import { CiMenuFries } from "react-icons/ci";
import {
  BiSolidDashboard,
  BiSolidUser,
  BiSolidPurchaseTag,
} from "react-icons/bi";
import { BsBagFill, BsBox2Fill, BsFillBarChartFill } from "react-icons/bs";
import { RiQuestionnaireFill } from "react-icons/ri";
import { RxExit } from "react-icons/rx";
import { MdWarehouse } from "react-icons/md";
import { IoMdNotificationsOutline, IoMdRefresh } from "react-icons/io";
import { TbLayersSubtract } from "react-icons/tb";
import { BiSolidShoppingBags } from "react-icons/bi";
import { RiNewspaperFill } from "react-icons/ri";

import style from "./Admin.module.css";
import apiUrl from "../../Config/config";
{
  /* PAGES */
}
import Login from "../Login/Login";
import Logo from "./Logo/Logo";
import Dashboard from "./Dashboard/Dashboard";
import POS from "./POS/POS";
import Account from "../Admin/Account/Account";
import Product from "../Admin/Product/Product";
import Container from "./Container/Container";
import Purchase from "./Purchase/Purchase";
import Supplier from "./Supplier/Supplier";
import Sales from "../Admin/Sales/Sales";
import Request from "../Admin/Request/Request";
import Return from "../Admin/Return/Return";
import Notif from "../Admin/Notification/Notification";

//user
import DashboardU from "./DashboardU/Dashboard";
import POSu from "./POSu/POS";
import ContainerU from "./ContainerU/ContainerU";
import ProductU from "./ProductU/ProductU";
import RequestU from "./RequestU/Request";

import { toast } from "react-toastify";

const Admin = () => {
  const [showDropdown, setShowDropdown] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

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

  const [auth, setAuth] = useState(false);
  const [Name, setName] = useState("");
  const [role, setRole] = useState([]);
  const [notification, setNotification] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      await handleGetNotification();
      await handleAuth();
      await handleArchiveExpiredProducts();
      await handleNotifNearExpiry();
    }
    fetchData();
  }, [notification, role]);

  const handleAuth = async () => {
    try {
      const res = await axios.get(`${apiUrl}/auth`);
      if (res.data.Status === "Success") {
        setAuth(true);
        setName(res.data.name);
        handleGetAuthorization(res.data.name);
      } else {
        setAuth(false);
        setMessage(res.data.Error);
        navigate("/");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleGetAuthorization = (roleName) => {
    axios
      .get(`${apiUrl}/getAuthorization/${roleName}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRole(res.data.Message[0]);
        }
      })
      .catch((err) => console.log(err));
  };
  const handleGetNotification = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getNotification`);
      if (res.data.Status === "Success") {
        setNotification(res.data.Message);
      } else {
        toast.error(res.data.Error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleReadAllNotification = async (name) => {
    try {
      const res = await axios.put(`${apiUrl}/readAllNotification/${name}`);
      if (res.data.Status === "Success") {
        // Handle success
      } else {
        toast.error("There is an error reading the notification.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleArchiveExpiredProducts = async () => {
    try {
      const res = await axios.put(`${apiUrl}/ArchiveAllExpiredProducts`, {
        Name,
      });
      if (res.data.Status !== "Success") {
        console.log(res.data.Error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleNotifNearExpiry = async () => {
    try {
      const res = await axios.put(`${apiUrl}/NotifyNearExpiredProducts`, {
        Name,
      });
      if (res.data.Status !== "Notifications inserted successfully") {
        console.log(res.data.Error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    axios
      .get(`${apiUrl}/logout`)
      .then((res) => {
        localStorage.removeItem("auth");
        location.reload(true);
      })
      .catch((err) => console.log(err));
  };

  const [activeButton, setActiveButton] = useState("logo");

  const roles = {
    logo: 1,
    dashboardAdmin: 1, // Assuming 1 means the role is enabled, and 0 means it's disabled
    adminPos: 1,
    accountManagement: 1,
    productManagement: 1,
    shelvesManagement: 1, // Assuming this role is available
    purchaseManagement: 1,
    supplierManagement: 1,
    reportManagement: 1,
    requestManagement: 1,
    returnManagement: 1,
    dashboardUser: 1,
    userPos: 1,
    productManagementUser: 1,
    shelvesManagementUser: 1,
    requestManagementUser: 1,
  };

  const availableButtons = [
    { name: "logo", role: "logo" },
    { name: "dashboard", role: "dashboardAdmin" },
    { name: "POS", role: "adminPos" },
    { name: "account", role: "accountManagement" },
    { name: "product", role: "productManagement" },
    { name: "container", role: "shelvesManagement" },
    { name: "purchase", role: "purchaseManagement" },
    { name: "supplier", role: "supplierManagement" },
    { name: "report", role: "reportManagement" },
    { name: "request", role: "requestManagement" },
    { name: "return", role: "returnManagement" },
  ];

  const defaultButton =
    availableButtons.find((button) => roles[button.role] === 1)?.name || "";

  const handleButtonClick = (buttonName) => {
    setActiveButton(buttonName);
  };

  useEffect(() => {
    setActiveButton(defaultButton);
  }, [defaultButton]);

  const renderContent = () => {
    if (
      roles[
        availableButtons.find((button) => button.name === activeButton)?.role
      ] === 0
    ) {
      return null; // Hide content if the role is disabled
    }

    switch (activeButton) {
      case "logo":
        return (
          <div>
            <Logo />
          </div>
        );

      case "dashboard":
        return (
          <div>
            <Dashboard />
          </div>
        );

      case "POS":
        return (
          <div>
            <POS />
          </div>
        );

      case "account":
        return (
          <div>
            <Account />
          </div>
        );

      case "product":
        return (
          <div>
            <Product />
          </div>
        );

      case "container":
        return (
          <div>
            <Container />
          </div>
        );

      case "purchase":
        return (
          <div>
            <Purchase />
          </div>
        );

      case "supplier":
        return (
          <div>
            <Supplier />
          </div>
        );

      case "report":
        return (
          <div>
            <Sales />
          </div>
        );

      case "request":
        return (
          <div>
            <Request />
          </div>
        );

      case "return":
        return (
          <div>
            <Return />
          </div>
        );

      case "notif":
        return (
          <div>
            <Notif />
          </div>
        );

      case "dashboardUser":
        return (
          <div>
            <DashboardU />
          </div>
        );

      case "userPos":
        return (
          <div>
            <POSu />
          </div>
        );

      case "productUser":
        return (
          <div>
            <ProductU />
          </div>
        );

      case "shelvesUser":
        return (
          <div>
            <ContainerU />
          </div>
        );

      case "requestUser":
        return (
          <div>
            <RequestU />
          </div>
        );
    }
  };

  {
    /* TIME AND DATE */
  }
  let time = new Date().toLocaleTimeString();
  const [currentTime, setCurrentTime] = useState(time);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setCurrentTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [currentDate, setCurrentDateTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const dateTime = new Date().toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      setCurrentDateTime(dateTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {auth ? (
        <div>
          <input type="" id={style["nav-toggle"]} />
          <div className={style.sidebar}>
            <div className={style["sidebar-brand"]}>
              <img src={logo} className={style.logo} />
              <h2>Manuel's Pharmacy</h2>
            </div>

            <div className={style["sidebar-menu"]}>
              <div className={`${style.sidebtnContainer}`}>
                <li className="nav-item" hidden={role.dashboardAdmin === 0}>
                  <Link
                    className={
                      activeButton === "dashboard"
                        ? `${style.active} ${style["sidebar-link"]}`
                        : style["sidebar-link"]
                    }
                    onClick={() => handleButtonClick("dashboard")}
                  >
                    <BiSolidDashboard className={style["sidebar-icon"]} />
                    <span>Dashboard</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.adminPos === 0}>
                  <Link
                    className={
                      activeButton === "POS"
                        ? `${style.active} ${style["sidebar-link"]}`
                        : style["sidebar-link"]
                    }
                    onClick={() => handleButtonClick("POS")}
                  >
                    <FaCalculator className={style["sidebar-icon"]} />
                    <span>Start Sales</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.accountManagement === 0}>
                  <Link
                    className={activeButton === "account" ? style.active : ""}
                    onClick={() => handleButtonClick("account")}
                  >
                    <BiSolidUser className={style["sidebar-icon"]} />
                    <span>Account</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.productManagement === 0}>
                  <Link
                    className={activeButton === "product" ? style.active : ""}
                    onClick={() => handleButtonClick("product")}
                  >
                    <BsBagFill className={style["sidebar-icon"]} />
                    <span>Product</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.shelvesManagement === 0}>
                  <Link
                    className={activeButton === "container" ? style.active : ""}
                    onClick={() => handleButtonClick("container")}
                  >
                    <BsBox2Fill className={style["sidebar-icon"]} />
                    <span>Shelves</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.purchaseManagement === 0}>
                  <Link
                    className={activeButton === "purchase" ? style.active : ""}
                    onClick={() => handleButtonClick("purchase")}
                  >
                    <BiSolidPurchaseTag className={style["sidebar-icon"]} />
                    <span>Purchase</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.supplierManagement === 0}>
                  <Link
                    className={activeButton === "supplier" ? style.active : ""}
                    onClick={() => handleButtonClick("supplier")}
                  >
                    <MdWarehouse className={style["sidebar-icon"]} />
                    <span>Supplier</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.reportManagement === 0}>
                  <Link
                    className={activeButton === "report" ? style.active : ""}
                    onClick={() => handleButtonClick("report")}
                  >
                    <RiNewspaperFill className={style["sidebar-icon"]} />
                    <span>Report</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.requestManagement === 0}>
                  <Link
                    className={activeButton === "request" ? style.active : ""}
                    onClick={() => handleButtonClick("request")}
                  >
                    <RiQuestionnaireFill className={style["sidebar-icon"]} />
                    <span>Request</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.returnManagement === 0}>
                  <Link
                    className={activeButton === "return" ? style.active : ""}
                    onClick={() => handleButtonClick("return")}
                  >
                    <IoMdRefresh className={style["sidebar-icon"]} />
                    <span>Return Item</span>
                  </Link>
                </li>

                {/*USER*/}
                <li className="nav-item" hidden={role.dashboardUser === 0}>
                  <Link
                    className={
                      activeButton === "dashboardUser" ? style.active : ""
                    }
                    onClick={() => handleButtonClick("dashboardUser")}
                  >
                    <BiSolidDashboard className={style["sidebar-icon"]} />
                    <span>Dashboard (User)</span>
                  </Link>
                </li>

                <li className="nav-item" hidden={role.userPos === 0}>
                  <Link
                    className={activeButton === "userPos" ? style.active : ""}
                    onClick={() => handleButtonClick("userPos")}
                  >
                    <FaCalculator className={style["sidebar-icon"]} />
                    <span>POS</span>
                  </Link>
                </li>

                <li
                  className="nav-item"
                  hidden={role.productManagementUser === 0}
                >
                  <Link
                    className={
                      activeButton === "productUser" ? style.active : ""
                    }
                    onClick={() => handleButtonClick("productUser")}
                  >
                    <BiSolidShoppingBags className={style["sidebar-icon"]} />
                    <span>Product</span>
                  </Link>
                </li>

                <li
                  className="nav-item"
                  hidden={role.shelvesManagementUser === 0}
                >
                  <Link
                    className={
                      activeButton === "shelvesUser" ? style.active : ""
                    }
                    onClick={() => handleButtonClick("shelvesUser")}
                  >
                    <BsBox2Fill className={style["sidebar-icon"]} />
                    <span>Shelves</span>
                  </Link>
                </li>

                <li
                  className="nav-item"
                  hidden={role.requestManagementUser === 0}
                >
                  <Link
                    className={
                      activeButton === "requestUser" ? style.active : ""
                    }
                    onClick={() => handleButtonClick("requestUser")}
                  >
                    <RiQuestionnaireFill className={style["sidebar-icon"]} />
                    <span>Request</span>
                  </Link>
                </li>
              </div>
            </div>
          </div>

          <div className={style["main-content"]}>
            <header className="d-flex">
              <div className={`${style["burger-and-time"]}`}>
                <label htmlFor={style["nav-toggle"]}>
                  
                  {activeButton === "dashboard"}
                  {activeButton === "account"}
                  {activeButton === "product"}
                  {activeButton === "container"}
                  {activeButton === "report"}
                  {activeButton === "request"}

                  {activeButton === "dashboardUser"}
                  {activeButton === "userPos"}
                  {activeButton === "productUser"}
                  {activeButton === "shelvesUser"}
                  {activeButton === "requestUser"}
                </label>
                <div className={`${style["time-wrapper"]}`} >
                  <div>
                    <h5>{currentTime}</h5>
                    <small>{currentDate}</small>
                  </div>
                </div>
              </div>

              <div className="d-flex">
                <div
                  className={`${style.divNotifHeader} d-flex`}
                  onClick={handleClickNotif}
                >
                  <div className="me-4 d-flex justify-content-center align-items-center">
                    <TbLayersSubtract size={30} />
                  </div>
                </div>
                <div
                  className={`${style["user-wrapper"]}`}
                  onClick={toggleDropdown}
                  onBlur={() => setShowDropdown(false)}
                  tabIndex="0"
                >
                  <div>
                    <h5>Hi, {Name}</h5>
                    <small>{role.roleName}</small>
                  </div>

                  {showDropdown && (
                    <ul
                      className={`${style["dropdown-menu"]} d-flex align-items-center justify-content-center col-6`}
                      onClick={handleGetNotification}
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
              <>
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
                          handleReadAllNotification(Name);
                          handleClickNotifClose();
                        }}
                      >
                        <i>See all activity</i>
                      </label>
                    </div>
                  </div>
                )}
              </>
            </main>
          </div>
        </div>
      ) : (
        <>
          <Login />
        </>
      )}
    </div>
  );
};

export default Admin;

export const handleButtonClick = (buttonName) => {
  setActiveButton(buttonName);
};

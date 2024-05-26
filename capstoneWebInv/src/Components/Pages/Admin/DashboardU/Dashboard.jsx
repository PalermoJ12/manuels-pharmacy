import React, { useState, useEffect } from "react";

import style from "./Dashboard.module.css";

import MlogoG from "../../../assets/M-G.png";
import transcpic from "../../../assets/latestTransac.png";
import logo from "../../../assets/M-B.png";

import { BsFillArrowDownLeftCircleFill } from "react-icons/bs";
import { GiReturnArrow } from "react-icons/gi";

import axios from "axios";
import apiUrl from "../../../Config/config";
import { toast } from "react-toastify";
import { TfiExport } from "react-icons/tfi";

import { Modal } from "react-bootstrap";
import ReactToPrint from "react-to-print";
import tr from "date-fns/locale/tr";

const pageStyle = `
@page {
  size: 10mm 10mm;
};

@media all{
  .pageBreak {
    display: none
  }
};

@media print {
  .pageBreak{
    page-break-before: always;
  }
}
`;

const Dashboard = () => {
  const ref = React.useRef();
  {
    /* TIME AND DATE */
  }

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const [month, day, year] = new Date(dateStr)
      .toLocaleDateString(undefined, options)
      .split("/");
    return `${year}-${month}-${day}`;
  };

  const [recentSales, setRecentSales] = useState([]);
  const [returnToday, setReturnToday] = useState("");
  const [slowMovingList, setSlowMovingList] = useState([]);
  const [nearExpiryProducts, setNearExpiryProducts] = useState([]);
  const [Name, setName] = useState("");
  const [todaySales, setTodaySales] = useState(0);
  const [todaySalesData, setTodaySalesData] = useState([]);

  useEffect(() => {
    fetchData();
    handleAuth();
  }, [Name, todaySales]);

  const fetchData = async () => {
    await getRecentSales();
    await getReturnToday();
    await handleAuth();
    await getTodaySales();
    await getSlowMovingProducts();
    await getNearExpiryProducts();
  };

  const handleAuth = async () => {
    try {
      const res = await axios.get(`${apiUrl}/auth`);
      if (res.data.Status === "Success") {
        setName(res.data.name);
      }
    } catch (err) {
      console.log(err);
    }
  };
  /* TIME AND DATE */

  let time = new Date().toLocaleTimeString();
  const [currentTime, setCurrentTime] = useState(time);

  useEffect(() => {
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
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

  /* TIME AND DATE */

  const getTodaySales = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getSalesToday`);
      if (res.data.Status === "Success") {
        const totalSalesToday = res.data.Message[0].totalSalesToday;
        const formattedSales = totalSalesToday.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 10,
        });
        setTodaySales(formattedSales);
        setTodaySalesData(res.data.Message);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const getReturnToday = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getReturnTodayCount`);
      if (res.data.Status === "Success") {
        setReturnToday(res.data.Message[0].returnCount);
      } else {
        toast.error(res.data.Error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getRecentSales = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getRecentSales`);
      if (res.data.Status === "Success") {
        setRecentSales(res.data.Message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getSlowMovingProducts = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getSlowMovingProducts`);
      // Process response data as needed
      if (res.data.Status === "Success") {
        setSlowMovingList(res.data.Message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const getNearExpiryProducts = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getNearExpiryProducts`);
      // Process response data as needed
      if (res.data.Status === "Success") {
        setNearExpiryProducts(res.data.Message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const dateTime = new Date().toLocaleString([], {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setCurrentDateTime(dateTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [showModalDaily, setModalDaily] = useState(false);
  const handleModalDailyOpen = () => {
    setModalDaily(true);
  };
  const handleModalDailyClose = () => {
    setModalDaily(false);
  };

  return (
    <>
      <div className={`${style.container}`}>
        <div
          className={`${style["cardTandD"]} w-100 d-flex justify-content-center align-items-center flex-column`}
        >
          <div className="d-flex justify-content-center ">
            <img src={MlogoG} className={style.MlogoG} />
          </div>
          <div className="d-flex justify-content-center my-2">
            <h1 className="mb-0">{currentTime}</h1>
          </div>
          <div className={`d-flex justify-content-center align-items-center`}>
            <div
              className={`${style.lblDate} d-flex justify-content-center align-items-center`}
            >
              <h2 className={`${style.txtDate} mb-0`}>{currentDate}</h2>
            </div>
          </div>
        </div>

        <div className="d-flex w-100">
          <div
            className={`${style["cardSales"]} my-3 d-flex justify-content-center align-items-center col`}
          >
            <div className="d-flex">
              <div className="p-2">
                <div className={`${style.iconSale} `}>
                  <BsFillArrowDownLeftCircleFill
                    size={40}
                    style={{ color: "#008000" }}
                  />
                </div>
              </div>
              <div className="p-2 d-flex flex-column">
                <h5 className={`${style.lblCards} mt-1`}>Today Sales</h5>
                <h3>₱ {todaySales} </h3>
              </div>

              <div className="p-2 d-flex justify-content-center align-items-center">
                <button
                  className="btn btn-success d-flex align-items-center justify-content-center"
                  style={{ width: "50px", height: "30px" }}
                  onClick={handleModalDailyOpen}
                >
                  <TfiExport size={18} />
                </button>
              </div>
            </div>
          </div>

          <div
            className={`${style["cardReturn"]} my-3 d-flex justify-content-center align-items-center col`}
          >
            <div className="d-flex">
              <div className="p-2">
                <div className={`${style.iconReturn} `}>
                  <GiReturnArrow size={40} style={{ color: "#800F2F" }} />
                </div>
              </div>
              <div className="p-2 d-flex flex-column">
                <h5 className={`${style.lblCards} mt-1`}>
                  Returned Items (Today)
                </h5>
                <h3>{returnToday || 0}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Expiry Chart */}

        <div className="d-flex w-100">
          <div className={`${style.cardSalesLog} w-100`}>
            <h4 className="m-2">Latest Transaction (this day)</h4>
            <div className={`${style["table-container-1"]}`}>
              {recentSales.length > 0 ? (
                <table
                  className={`${style.tblLatest} table caption-top table-borderless table-striped`}
                >
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Total Price</th>
                      <th>Cash</th>
                      <th>
                        <div className="d-flex flex-column">
                          <label>Date</label>
                          <label className={style.lblmmddyyyy}>
                            (yyyy/mm/dd)
                          </label>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((data, index) => {
                      return (
                        <tr key={index}>
                          <td>{data.saleId}</td>
                          <td>{data.totalSale}</td>
                          <td>{data.cash}</td>
                          <td>{formatDate(data.dateSale)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="h-100 d-flex flex-column justify-content-center align-items-center">
                  <div className="d-flex justify-content-center">
                    <img src={transcpic} className={`${style.transcpic}`} />
                  </div>

                  <div className="mb-4">
                    <h5 style={{ color: "#A4A6A8" }}>
                      Sorry, No Transaction Found.
                    </h5>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`${style.cardExpiry} w-100`}>
            <h4 style={{ fontWeight: "600", color: "#717171" }}>
              Near Expiry Products
              <h6>
                <i>(From now to 6 months)</i>
              </h6>
            </h4>

            <div className={`${style["table-container-2"]} m-2`}>
              <table
                className={`${style.tblSlowMoving} table caption-top table-borderless table-striped`}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>
                      <div className="d-flex flex-column">
                        <label>Date Expiry</label>
                        <label style={{ fontSize: "12px" }}>(yyyy/mm/dd)</label>
                      </div>
                    </th>

                    <th>Remaining Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {nearExpiryProducts.map((nearExpiry, index) => {
                    return (
                      <tr key={index}>
                        <td>
                          <div className="d-flex flex-column">
                            <h6 style={{ fontWeight: "700", fontSize: "15px" }}>
                              {nearExpiry.prodName}
                            </h6>
                            <h6 style={{ fontWeight: "400", fontSize: "15px" }}>
                              {nearExpiry.prodDetails}
                            </h6>
                          </div>
                        </td>

                        <td>{nearExpiry.earliestExpiryDate}</td>

                        <td>{nearExpiry.totalRemainingQty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showModalDaily}
        onHide={handleModalDailyClose}
        dialogClassName={style["custom-modal"]}
        scrollable
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className={`d-flex align-items-center`}>
              <h3 className={`mr-2`} style={{ fontWeight: "600" }}>
                Preview
              </h3>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div ref={ref}>
            <div className="d-flex flex-column justify-content-start align-items-center w-100">
              <div
                className="d-flex justify-content-between align-items-center w-100 p-2"
                style={{ backgroundColor: "#eee" }}
              >
                <div className="d-flex align-items-center">
                  <img src={logo} className={style.logo} />

                  <div className="d-flex flex-column ms-2">
                    <h6>Manuel's</h6>
                    <h6>Pharmacy</h6>
                  </div>
                </div>

                <div className="d-flex me-2">
                  <h4 style={{ fontWeight: "600" }}>This Day Report</h4>
                </div>
              </div>
            </div>

            <table
              className={`${style.tblSales} table caption-top table-borderless table-striped`}
            >
              <caption>Date Range: {formatDate(currentDate)}</caption>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>

              <tbody>
                {todaySalesData.map((data, index) => {
                  return (
                    <tr key={index}>
                      <td>
                        {data.prodName} - {data.prodDetails}{" "}
                      </td>
                      <td>{data.qty}</td>
                      <td>{data.sellingPrice}</td>
                      <td>{data.itemTotal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div
              className="d-flex justify-content-end align-items-center  p-2"
              style={{ backgroundColor: "#eee" }}
            >
              <div className="d-flex flex-column">
                <div className="d-flex justify-content-end">
                  <h5>Total Sales:</h5>
                </div>

                <h3 style={{ fontWeight: "600" }}>{todaySales}</h3>
              </div>
            </div>

            <div
              className={`${style.prepared} d-flex flex-column justify-content-start mx-4 flex-column`}
            >
              <h6>Prepared By:</h6>
              <h5 style={{ fontWeight: "600" }}>{Name}</h5>
              <h6
                className="mt-1"
                style={{ fontWeight: "600", fontSize: "15px" }}
              >
                <i>Pharmacist</i>
              </h6>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <div className="d-flex justify-content-end align-items-center w-100">
            <ReactToPrint
              trigger={() => (
                <button className="btn btn-success">Confirm</button>
              )}
              content={() => ref.current}
              pageStyle={pageStyle}
            />
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Dashboard;

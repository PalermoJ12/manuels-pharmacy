import React, { useEffect, useState, useMemo } from "react";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers";

import axios from "axios";
import style from "./Dashboard.module.css";
import { MdCalendarToday, MdKeyboardDoubleArrowDown } from "react-icons/md";
import { TbBrandDaysCounter } from "react-icons/tb";
import { IoMdRefresh } from "react-icons/io";
import ReactApexChart from "react-apexcharts";
import apiUrl from "../../../Config/config";

import transcpic from "../../../assets/latestTransac.png";
import noLowStock from "../../../assets/noLowStock.png";

import { RxComponentNone } from "react-icons/rx";

import { startOfWeek } from "date-fns";
import { Button, Modal } from "react-bootstrap";

const Dashboard = () => {
  const [showSlowMoving, setShowSlow] = useState(false);

  const handleSlowMovingOpen = () => {
    setShowSlow(true);
  };

  const handleSlowMovingClose = () => {
    setShowSlow(false);
  };

  const [todaySales, setTodaySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [salesDate, setSalesDate] = useState([]);
  const [salesMonth, setSalesMonth] = useState([]);
  const [returnList, setReturnList] = useState([]);
  const [slowMovingList, setSlowMovingList] = useState([]);
  const [nearExpiryProducts, setNearExpiryProducts] = useState([]);
  const fetchData = async () => {
    try {
      const [
        todaySalesResponse,
        monthlySalesResponse,
        lowStockResponse,
        recentSalesResponse,
        salesDateResponse,
        salesMonthResponse,
        returnListResponse,
        slowMovingResponse,
        nearExpiryProductsResponse,
      ] = await Promise.all([
        axios.get(`${apiUrl}/getSalesToday`),
        axios.get(`${apiUrl}/getSalesMonth`),
        axios.get(`${apiUrl}/getStockouts`),
        axios.get(`${apiUrl}/getRecentSales`),
        axios.get(`${apiUrl}/getSalesByDate`),
        axios.get(`${apiUrl}/getSalesByMonth`),
        axios.get(`${apiUrl}/getAllReturns`),
        axios.get(`${apiUrl}/getSlowMovingProducts`),
        axios.get(`${apiUrl}/getNearExpiryProducts`),
      ]);

      if (todaySalesResponse.data.Status === "Success") {
        const formattedTodaySales =
          todaySalesResponse.data.Message[0].totalSalesToday.toLocaleString(
            undefined,
            { minimumFractionDigits: 0, maximumFractionDigits: 10 }
          );
        setTodaySales(formattedTodaySales);
      }

      if (monthlySalesResponse.data.Status === "Success") {
        const totalSalesThisMonth =
          monthlySalesResponse.data.Message[0].totalSalesThisMonth;
        setMonthlySales(totalSalesThisMonth.toLocaleString());
      }

      if (lowStockResponse.data.Status === "Success") {
        setLowStock(lowStockResponse.data.Message);
      }

      if (recentSalesResponse.data.Status === "Success") {
        setRecentSales(recentSalesResponse.data.Message);
      }

      if (salesDateResponse.data.Status === "Success") {
        setSalesDate(salesDateResponse.data.Message);
      }

      if (salesMonthResponse.data.Status === "Success") {
        setSalesMonth(salesMonthResponse.data.Message);
      }

      if (returnListResponse.data.Status === "Success") {
        setReturnList(returnListResponse.data.Message);
      }
      if (slowMovingResponse.data.Status === "Success") {
        setSlowMovingList(slowMovingResponse.data.Message);
      }
      if (nearExpiryProductsResponse.data.Status === "Success") {
        setNearExpiryProducts(nearExpiryProductsResponse.data.Message);
      } else {
        toast.error(nearExpiryProductsResponse.data.Error);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Memoize chartDataMonth to prevent unnecessary re-renders
  const memoizedChartDataMonth = useMemo(() => {
    const uniqueMonths = Array.from(
      new Set(salesMonth.map((item) => item.saleMonth))
    );

    const years = uniqueMonths.map((month) => new Date(month).getFullYear());
    const maxYear = Math.max(...years);

    const allMonthsData = Array.from({ length: 12 }, (_, index) => {
      const month = (index + 1).toString().padStart(2, "0");
      const year = maxYear;
      const monthString = `${year}-${month}`;
      const existingData = salesMonth.find(
        (item) => item.saleMonth === monthString
      );
      return {
        x: new Date(monthString + "-01").getTime(),
        y: existingData ? existingData.totalSales : 0,
      };
    });

    return allMonthsData.sort((a, b) => a.x - b.x);
  }, [salesMonth]);

  const options = {
    chart: {
      height: 350,
      type: "line",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        barWidth: "20%",
      },
    },
    colors: ["#6EDE8A"],
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false,
        format: "MMMM yyyy", // Format the labels to display only the month and year
      },
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(2);
        },
      },
    },
    tooltip: {
      x: {
        format: "MMMM yyyy", // Adjust the tooltip format as needed
      },
    },

    markers: {
      size: [4, 7],
      colors: undefined,
      strokeColors: "#fff",
      strokeWidth: 2,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      shape: "circle",
      radius: 2,
      offsetX: 0,
      offsetY: 0,
      onClick: undefined,
      onDblClick: undefined,
      showNullDataPoints: true,
      hover: {
        size: undefined,
        sizeOffset: 3,
      },
    },
  };

  const today = new Date();

  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // 1 corresponds to Monday

  const startDate = useMemo(() => startOfCurrentWeek, [startOfCurrentWeek]);

  const endDate = useMemo(() => {
    const end = new Date(startOfCurrentWeek);
    end.setDate(end.getDate() + 7); // Add 6 days to get to the end of the week (Sunday)
    return end;
  }, [startOfCurrentWeek]);

  const memoizedSalesDate = useMemo(() => {
    return salesDate.map((item) => ({
      x: new Date(item.dateSale).getTime(),
      y: item.totalSales,
    }));
  }, [salesDate]);

  const option = useMemo(() => {
    return {
      chart: {
        height: 400,
        type: "bar",
      },
      plotOptions: {
        bar: {
          horizontal: false,
          barWidth: "20%",
        },
      },
      colors: ["#25A244"],
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          format: "dd MMM",
        },
        min: startDate.getTime(),
        max: endDate.getTime(),
      },
      yaxis: {
        labels: {
          formatter: function (val) {
            return val.toFixed(2);
          },
        },
      },
      tooltip: {
        x: {
          format: "MMMM dd, yyyy",
        },
      },
      toolbar: {
        show: false, // Set show to false to hide the toolbar
      },
    };
  }, [startDate, endDate]);

  const [value, setValue] = React.useState(new Date());
  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const [month, day, year] = new Date(dateStr)
      .toLocaleDateString(undefined, options)
      .split("/");
    return `${year}-${month}-${day}`;
  };

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className={style.container}>
          <div className={`${style.fiveCards} d-flex justify-content-between`}>
            <div className="d-flex flex-column">
              <div className="col-md-12">
                <div
                  className={`${style.card1} m-2 d-flex justify-content-center align-items-center flex-column`}
                >
                  <div className={`${style.iconToday} m-2`}>
                    <TbBrandDaysCounter
                      size={32}
                      style={{ color: "#008000" }}
                    />
                  </div>

                  <div className="m-2">
                    <h5 className={style.cardHeader1}>Today Sales</h5>
                  </div>

                  <div>
                    {todaySales === 0 ? (
                      <span className={style.todaySale}>
                        <RxComponentNone />
                      </span>
                    ) : (
                      <span className={style.todaySale}>₱ {todaySales}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div
                  className={`${style.card2} col m-2  d-flex justify-content-center align-items-center flex-column`}
                >
                  <div className={`${style.iconMonth} m-2`}>
                    <MdCalendarToday size={32} style={{ color: "#012a4a" }} />
                  </div>

                  <div className="m-2">
                    <h5 className={style.cardHeader2}>This Month Sales</h5>
                  </div>

                  <div className="m-2">
                    <span className={style.monthlySale}>₱ {monthlySales}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${style.last3} d-flex col`}>
              <div className={`${style.card3} col m-2`}>
                <div className={style.cardContent3}>
                  <div className="d-flex flex-row mb-3">
                    <div className="p-2">
                      <div
                        className={`${style.iconLow} d-flex justify-content-center align-items-center`}
                      >
                        <MdKeyboardDoubleArrowDown
                          size={32}
                          style={{ color: "#77030B" }}
                        />
                      </div>
                    </div>
                    <div className="p-2 d-flex justify-content-center align-items-center">
                      <h3 className={style.cardHeader3}>Low Stock</h3>
                    </div>
                  </div>

                  <div className={`${style["table-container"]} mt-4`}>
                    {lowStock.length > 0 ? (
                      <table
                        className={`${style.tblLowStock} table table-borderless`}
                      >
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStock.map((items, index) => {
                            return (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex flex-column">
                                    <div className="d-flex">
                                      <h6 className="me-1">{items.prodName}</h6>
                                      <h6
                                        className="d-flex align-items-center"
                                        style={{
                                          fontSize: "14px",
                                          color: "#737373",
                                        }}
                                      >
                                        - {items.prodUnitName}
                                      </h6>
                                    </div>
                                    <h6 style={{ fontSize: "10px" }}>
                                      {items.prodDetails}
                                    </h6>
                                  </div>
                                </td>
                                <td>{items.prodQty}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="h-100 d-flex flex-column justify-content-center align-items-center">
                        <div className="mb-4">
                          <h6 style={{ color: "#A4A6A8" }}>
                            Inventory is currently in a healthy state ✓
                          </h6>
                        </div>

                        <div className="d-flex justify-content-center">
                          <img
                            src={noLowStock}
                            className={`${style.noLowStock}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`${style.card4} col m-2`}>
                <div className={`${style.cardContent4} d-flex flex-column`}>
                  <div className="d-flex mb-3">
                    <div className="p-2">
                      <div
                        className={`${style.iconReturn} d-flex justify-content-center align-items-center`}
                      >
                        <IoMdRefresh size={32} style={{ color: "#3B3B21" }} />
                      </div>
                    </div>
                    <div className="p-2 d-flex justify-content-center align-items-center">
                      <h3 className={style.cardHeader3}>Return Item</h3>
                    </div>
                  </div>

                  <div className={`${style["table-container"]}`}>
                    <table
                      className={`${style.tblReturnItem} table table-borderless`}
                    >
                      <thead>
                        <tr>
                          <th>Transaction No</th>
                          <th>Product</th>
                          <th>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnList.map((item, index) => {
                          return (
                            <tr key={index}>
                              <td>{item.saleId}</td>
                              <td>
                                <div className="d-flex flex-column">
                                  <div className="d-flex">
                                    <h6 className="me-1">{item.prodName}</h6>
                                    <h6
                                      className="d-flex align-items-center"
                                      style={{
                                        fontSize: "14px",
                                        color: "#737373",
                                      }}
                                    ></h6>
                                  </div>

                                  <h6 style={{ fontSize: "10px" }}>
                                    {item.prodDetails}
                                  </h6>
                                </div>
                              </td>
                              <td>{item.prodQty}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className={`${style.card5} col m-2`}>
                <div className={style.cardContent5}>
                  <div className="mt-4 d-flex justify-content-center">
                    <div
                      className={`${style.iconCal} d-flex justify-content-center align-items-center`}
                    >
                      <MdCalendarToday size={32} style={{ color: "#d8f3dc" }} />
                    </div>
                  </div>
                  <StaticDatePicker
                    orientation="portrait"
                    openTo="day"
                    value={value}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Latest Transac Chart */}
          <div className="d-flex justify-content-center px-2">
            <div className={`${style.chartLtransc} col-md-6 me-1`}>
              <h4 className={style.chartTitle}>
                Latest Transaction (this day)
              </h4>
              <div className={`${style["table-container-1"]}`}>
                {recentSales.length > 0 ? (
                  <table
                    className={`${style.tblLatest} table caption-top table-borderless table-striped`}
                  >
                    <thead>
                      <tr>
                        <th>Transaction No</th>
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
                            <td>₱{data.totalSale}</td>
                            <td>₱{data.cash}</td>
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

            <div className={`${style.chartLtransc} col-md-6`}>
              <div className="d-flex justify-content-between">
                <div>
                  <h4 style={{ fontWeight: "600", color: "#717171" }}>
                    Near Expiry Products
                    <h6>
                      <i>(From now to 6 months)</i>
                    </h6>
                  </h4>
                </div>

                <div>
                  <button
                    className="btn btn-success"
                    onClick={handleSlowMovingOpen}
                  >
                    See slow moving products
                  </button>
                </div>
              </div>

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
                          <label style={{ fontSize: "12px" }}>
                            (yyyy/mm/dd)
                          </label>
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
                              <h6
                                style={{ fontWeight: "700", fontSize: "15px" }}
                              >
                                {nearExpiry.prodName}
                              </h6>
                              <h6
                                style={{ fontWeight: "400", fontSize: "15px" }}
                              >
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

          <div className={`${style.charts} d-flex justify-content-center px-2`}>
            {/* Monthly Sales Chart */}
            <div className={`${style.chartMonth} col-md-6 my-2`}>
              <h2 className={style.chartTitle}>Sales Graph</h2>
              <ReactApexChart
                options={options}
                series={[
                  { name: "Monthly Sales", data: memoizedChartDataMonth },
                ]}
                type="line"
                height={350}
              />
            </div>

            {/* This week Sales Chart */}
            <div className={`${style.chartDaily} col-md-6 my-2`}>
              <h2 className={style.chartTitle}>This Week Graph</h2>
              <ReactApexChart
                options={option}
                series={[{ name: "Daily Sales", data: memoizedSalesDate }]}
                type="bar"
                height={350}
              />
            </div>
          </div>
        </div>
      </LocalizationProvider>

      <Modal
        show={showSlowMoving}
        onHide={handleSlowMovingClose}
        dialogClassName={style["custom-modal"]}
        centered
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <h4 style={{ fontWeight: "700" }}>Slow moving products</h4>
            <h6>
              <i>(In the past 6 months)</i>
            </h6>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={`${style["table-container-2"]}`}>
            {slowMovingList.length > 0 ? (
              <table
                className={`${style.tblSlowMoving} table caption-top table-borderless table-striped`}
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Sold</th>
                    <th>Remaining Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {slowMovingList.map((data, index) => {
                    return (
                      <tr key={index}>
                        <td>
                          <div className="d-flex flex-column">
                            <h5>{data.prodName}</h5>
                            <h6>{data.prodDetails}</h6>
                          </div>
                        </td>
                        <td>{data.totalSoldInLastSixMonths}</td>
                        <td>{data.totalRemainingQty}</td>
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
                    Sorry, No slow moving product detected.
                  </h5>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Dashboard;

import React, { useState, useEffect } from "react";
import axios from "axios";

import { Modal, Button } from "react-bootstrap";
import { BiSolidEditAlt } from "react-icons/bi";
import { FaArrowRight } from "react-icons/fa";
import { RiMoreFill } from "react-icons/ri";
import { VscEye } from "react-icons/vsc";
import { LuFolderArchive } from "react-icons/lu";
import { FaSort } from "react-icons/fa";

import { toast } from "react-toastify";
import ReactApexChart from "react-apexcharts";

import style from "./Product.module.css";
import apiUrl from "../../../Config/config";

import ArchivedProduct from "./ArchivedProduct.jsx";
import ProductUnit from "./ProductUnit.jsx";
import OffProduct from "./OffProduct.jsx";

import { Pagination } from "react-bootstrap";

const pageSize = 8;

const Product = () => {
  const [presentPage, setShowPresentPage] = useState("product");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  //Add Product
  const handleAddModalOpen = () => {
    setShowAddModal(true);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
  };

  //Update Product
  const handleUpdateModalOpen = () => {
    setShowUpdateModal(true);
  };

  const handleUpdateModalClose = () => {
    setShowUpdateModal(false);
  };

  //Archive Product
  const handleArchiveModalOpen = () => {
    setShowArchiveModal(true);
  };

  const handleArchiveModalClose = () => {
    setShowArchiveModal(false);
  };

  const [showViewModal, setShowViewModal] = useState(false);
  //View Product info
  const handleViewModalOpen = () => {
    setShowViewModal(true);
  };

  const handleViewModalClose = () => {
    setShowViewModal(false);
  };

  //For buttons etc.
  const [etcBtnVisible, setEtcBtnVisible] = useState(false);

  const handleMouseEnter = () => {
    setEtcBtnVisible(true);
  };

  const handleMouseLeave = () => {
    setEtcBtnVisible(false);
  };

  const handleClickEtcBtn = () => {
    setEtcBtnVisible(true);
  };

  const handleClickEtcBtnNV = () => {
    setEtcBtnVisible(false);
  };

  /*Requesting all product from the database*/
  const [monthlyMostSold, setMontlyMostSold] = useState([]);
  const [mostSoldThisMonth, setMostSoldThisMonth] = useState([]);

  const [data, setData] = useState([]);
  useEffect(() => {
    fetchData();
  }, [data]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchProduct(),
        fetchUnitList(),
        fetchUser(),
        handleManageOption(),
        handleNotifNearExpiry(),
        handleArchiveExpiredProducts(),
        handleGetMostSoldPerMonth(),
        handleGetMostThisPerMonth(),
      ]);
      // All requests have been completed
      // Now you can perform any necessary operations that depend on this data.
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleGetMostSoldPerMonth = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getMostSoldPerMonth`);
      if (res.data.Status === "Success") {
        setMontlyMostSold(res.data.Message);
      }
    } catch (err) {
      console.error("Error fetching most sold per month:", err);
      throw err;
    }
  };

  const handleGetMostThisPerMonth = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getMostSoldThisMonth`);
      if (res.data.Status === "Success") {
        setMostSoldThisMonth(res.data.Message);
      }
    } catch (err) {
      console.error("Error fetching most sold this month:", err);
      throw err;
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
      console.error("Error archiving expired products:", err);
      throw err;
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
      console.error("Error handling notifications:", err);
      throw err;
    }
  };
  const [Name, setName] = useState("");
  axios.defaults.withCredentials = true;

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${apiUrl}/auth`);
      if (res.data.Status === "Success") {
        setName(res.data.name);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      throw err;
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${apiUrl}/manageProduct`);
      if (res.data.Status === "Success") {
        const allData = res.data.Message;

        setData(allData);
      } else {
        toast.error("There is an error in fetching product.");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      throw err;
    }
  };
  const [currentDateForNotif, setCurrentDateTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1.
      const day = now.getDate().toString().padStart(2, "0");

      const formattedDate = `${month}-${day}-${year}`;
      setCurrentDateTime(formattedDate);
    }, 1000);

    return () => clearInterval(interval);
  });

  /* This is to populate the options in container*/
  const [options, setOptions] = useState([]);
  const handleManageOption = async () => {
    try {
      const res = await axios.get(`${apiUrl}/manageProduct/option`);
      setOptions(res.data.Message);
    } catch (err) {
      console.error("Error handling manage options:", err);
      throw err;
    }
  };
  //For product unit
  const [unitList, setUnitList] = useState([]);
  const [selectedProductUnit, setSelectedProductUnit] = useState("");
  const fetchUnitList = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getUnitList`);
      if (res.data.Status === "Success") {
        setUnitList(res.data.Message);
      } else {
        toast.warning(res.data.Error);
      }
    } catch (err) {
      console.error("Error fetching unit list:", err);
      throw err;
    }
  };

  /*This is for adding a new product*/

  const [values, setValue] = useState({
    prodName: "",
    prodDetails: "",
    prodContainer: 0,
    buyingPrice: 0,
    sellingPrice: 0,
    userName: "",
  });

  const handleAddProduct = (event) => {
    event.preventDefault();

    if (values.prodContainer === "0") {
      toast.error("Please select a container before adding the product.");
      return;
    }

    const updatedProductData = {
      ...values,
      userName: Name,
      dateNotif: currentDateForNotif,
    };

    axios
      .post(`${apiUrl}/addNewProduct`, updatedProductData)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleAddModalClose();
          toast.success(`Product added successfully`, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });

          setSelectedProductUnit("Select Product Unit");
          fetchProduct();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  /*For updating  specific product*/

  //productDetails
  const [productDetails, setProductDetails] = useState([]);
  //this is for getting the data of selected product
  const [selectedProductData, setSelectedData] = useState([]);

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    const container = document.getElementById("newprodContainer").value;
    if (!container || container === "") {
      toast.error("Please select a container first");
      return;
    }
    // Set the userName in a variable
    const updatedProductData = {
      ...selectedProductData,
      userName: Name,
      dateNotif: currentDateForNotif,
    };

    axios
      .put(
        `${apiUrl}/manageProduct/` + selectedProductData.prodId,
        updatedProductData
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          setShowUpdateModal(false);
          toast.success(`Product has been updated!`, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });

          fetchProduct();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  /* This is for archiving specific product */
  const [archiveValue, setArchive] = useState({
    prodId: 0,
    batch_number: 0,
    isArchive: 0,
    isConfirm: false,
    prodName: "",
  });

  const handleArchive = (e) => {
    e.preventDefault();

    const id = archiveValue.prodId;
    const batch_number = archiveValue.batch_number;

    const updatedProductData = {
      ...archiveValue,
      isArchive: 1,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .put(
        `${apiUrl}/manageProduct/${id}/${batch_number}/archive`,
        updatedProductData
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          handleArchiveModalClose();

          setArchive({ ...archiveValue, isArchive: 0 });
          toast.success(`Product archive successfully.`, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });

          fetchProduct();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  //For searching & sorting product
  const [searchData, setItemSearch] = useState("");
  const filteredProd = data.filter((product) => {
    const caseLower = searchData.toLowerCase();

    const name = product.prodName.toLowerCase();
    const prodDetails = product.prodDetails.toLowerCase();

    // Check if prodContainer is a string before calling toLowerCase()
    const prodContainer =
      typeof product.containerName === "string"
        ? product.containerName.toLowerCase()
        : "";

    const prodStock =
      typeof product.totalRemainingQty === "string"
        ? product.totalRemainingQty.toLowerCase()
        : "";

    const prodSupplier =
      typeof product.supplierName === "string"
        ? product.supplierName.toLowerCase()
        : "";

    return (
      name.includes(caseLower) ||
      prodDetails.includes(caseLower) ||
      prodContainer.includes(caseLower) ||
      prodStock.includes(caseLower) ||
      prodSupplier.includes(caseLower)
    );
  });

  const handleSort = (column) => {
    setSorting((prevSorting) => ({
      column,
      order:
        prevSorting.column === column && prevSorting.order === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const [sorting, setSorting] = useState({
    column: "prodName",
    order: "asc",
  });

  const sortedData = filteredProd.sort((a, b) => {
    const column = sorting.column;

    if (column) {
      const aValue =
        column === "totalRemainingQty"
          ? parseFloat(a[column])
          : a[column].toLowerCase();
      const bValue =
        column === "totalRemainingQty"
          ? parseFloat(b[column])
          : b[column].toLowerCase();

      if (aValue < bValue) return sorting.order === "asc" ? -1 : 1;
      if (aValue > bValue) return sorting.order === "asc" ? 1 : -1;
    }

    return 0;
  });

  // Use the following state to keep track of the current page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate the total number of pages based on the filtered and sorted data
  const totalPages = Math.ceil(filteredProd.length / pageSize);

  // Ensure that the current page is within the valid range
  const validCurrentPage = Math.min(currentPage, totalPages);

  // Calculate the range of items to display for the current page
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Slice the filteredProd array to display only the items for the current page
  const currentPageData = sortedData.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pagesToShow = 5;
    const pages = [];
    let startPage = Math.max(1, validCurrentPage - Math.floor(pagesToShow / 2));

    for (let i = 0; i < pagesToShow && startPage + i <= totalPages; i++) {
      pages.push(startPage + i);
    }

    return pages;
  };

  const allMonths = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthsWithData = monthlyMostSold.map((item) => item.saleMonth);

  const dataValues = allMonths.map((month) => {
    const foundMonth = monthlyMostSold.find((item) => item.saleMonth === month);
    return foundMonth ? foundMonth.maxSoldPerMonth : 0;
  });

  const dataProdNames = allMonths.map((month) => {
    const foundMonth = monthlyMostSold.find((item) => item.saleMonth === month);
    return foundMonth ? foundMonth.prodName : "";
  });

  const optionsss = {
    series: [
      {
        data: dataValues,
      },
    ],
    chart: {
      type: "bar",
      height: 350,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      },
    },
    colors: ["#5F8368"],
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: allMonths,
      labels: {
        rotate: -45,
        style: {
          fontSize: "12px",
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " units";
        },
      },
      custom: function ({ series, seriesIndex, dataPointIndex }) {
        return (
          '<div class="arrow_box">' +
          "<span>" +
          dataProdNames[dataPointIndex] +
          ": " +
          series[seriesIndex][dataPointIndex] +
          " sold</span>" +
          "</div>"
        );
      },
    },
  };

  const sample = optionsss.series;

  const optio = {
    series: mostSoldThisMonth.map((item) => item.totalSold),
    chart: {
      type: "donut",
      height: 350,
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        offsetY: 10,
      },
    },
    grid: {
      padding: {
        bottom: -80,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
    labels: mostSoldThisMonth.map((item) => item.prodName),
    // ... other configurations specific to your needs ...
  };
  const series = optio.series;

  function product() {
    return (
      <>
        <div className={`${style.container} container-fluid vh-100`}>
          <div className={`${style.charts} d-flex justify-content-center`}>
            <div className={`${style.chartMonth} col-md-6 mt-2`}>
              <h3 style={{ fontWeight: "600" }}>Monthly Product Trend</h3>
              <ReactApexChart
                options={optionsss}
                series={sample}
                type="bar"
                height={350}
              />
            </div>

            <div className={`${style.chartDaily} col-md-6 mt-2`}>
              <h3 style={{ fontWeight: "600" }}>
                Most product trend in this month
              </h3>

              <div className="mt-4">
                <ReactApexChart
                  options={optio}
                  series={series}
                  type="donut"
                  height={300}
                />
              </div>
            </div>
          </div>
          <div className={`${style.cardProduct} my-2`}>
            <div className="mt-3 mb-3 mx-2 d-flex justify-content-between">
              <div className="col-auto">
                <button
                  className={`${style.btnMore} btn`}
                  onClick={handleClickEtcBtn}
                >
                  <RiMoreFill size={20} />
                </button>
              </div>
              <div className="col-auto">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchData}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className={`${style.txtbox} form-control`}
                />
              </div>
            </div>

            <div
              className={`${style.LegendContainer} mt-2 mx-2 d-flex justify-content-end align-items-center`}
            >
              <div className="me-2 d-flex justify-content-center align-items-center">
                <label className={`${style.lblLegend}`}>LEGEND:</label>
              </div>

              <div
                className={`${style.LView} me-1 d-flex justify-content-center align-items-center`}
              >
                <label className={`${style.lblNlegend}`}>View Products</label>
              </div>

              <div
                className={`${style.LUpdate} me-1  d-flex justify-content-center align-items-center`}
              >
                <label className={`${style.lblNlegend}`}>
                  Update Product Info
                </label>
              </div>
              <div
                className={`${style.LDelete} d-flex justify-content-center align-items-center `}
              >
                <label className={`${style.lblNlegend}`}>Archive Product</label>
              </div>
            </div>

            {/* PRODUCT TABLE */}

            <div className={`${style["table-container-prod"]} m-4`}>
              <table
                className={`${style.tblProduct} table caption-top table-borderless table-hover`}
              >
                <caption>
                  List of Product: {data[0]?.rowCountPerProduct} Products
                </caption>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("prodName")}
                      style={{ cursor: "pointer" }}
                    >
                      <div>
                        Name{" "}
                        {sorting.column === "prodName" && (
                          <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                    <th
                    >
                      <div>
                        Details
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("containerName")}
                      style={{ cursor: "pointer" }}
                    >
                      Shelves
                      {sorting.column === "containerName" && (
                        <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort("totalRemainingQty")}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="d-flex">
                        <div className="d-flex align-items-center">
                          <label>Stock</label>
                          <label className={style.txtStock}>
                            (Qty - Piece)
                            {sorting.column === "totalRemainingQty" && (
                              <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                            )}
                          </label>
                        </div>
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort("supplierName")}
                      style={{ cursor: "pointer" }}
                    >
                      Supplier
                      {sorting.column === "supplierName" && (
                        <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                      )}
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {currentPageData.map((product, index) => {
                    return (
                      <tr key={index}>
                        <td
                          style={{
                            backgroundColor:
                              product.totalRemainingQty <= 10
                                ? "#FFE3E0"
                                : "white",
                          }}
                        >
                          {product.prodName}
                        </td>
                        <td
                          style={{
                            backgroundColor:
                              product.totalRemainingQty <= 10
                                ? "#FFE3E0"
                                : "white",
                          }}
                        >
                          {product.prodDetails}
                        </td>
                        <td
                          style={{
                            backgroundColor:
                              product.totalRemainingQty <= 10
                                ? "#FFE3E0"
                                : "white",
                          }}
                        >
                          {product.containerName}
                        </td>
                        <td
                          style={{
                            backgroundColor:
                              product.totalRemainingQty <= 10
                                ? "#FFE3E0"
                                : "white",
                          }}
                        >
                          {product.totalRemainingQty}
                        </td>
                        <td
                          style={{
                            backgroundColor:
                              product.totalRemainingQty <= 10
                                ? "#FFE3E0"
                                : "white",
                          }}
                        >
                          {product.supplierName}
                        </td>
                        <td
                          style={{
                            backgroundColor:
                              product.totalRemainingQty <= 10
                                ? "#FFE3E0"
                                : "white",
                          }}
                        >
                          <button
                            className="btn btn-dark me-2 my-2"
                            onClick={(e) => {
                              setProductDetails(product);
                              handleViewModalOpen();
                            }}
                          >
                            <VscEye />
                          </button>
                          <button
                            className="btn btn-primary me-2 my-2"
                            onClick={(e) => {
                              setSelectedData(product);

                              handleUpdateModalOpen();
                            }}
                          >
                            <BiSolidEditAlt />
                          </button>
                          <button
                            className="btn btn-danger my-2"
                            onClick={(e) => {
                              setArchive({
                                ...archiveValue,
                                prodId: product.prodId,
                                batch_number: product.batchNumber,
                                prodName: product.prodName,
                              });

                              handleArchiveModalOpen();
                            }}
                          >
                            <LuFolderArchive />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="d-flex justify-content-start align-items-center w-100">
                <div>
                  {/* Pagination component */}
                  <Pagination>
                    <Pagination.First
                      onClick={() => setCurrentPage(1)}
                      disabled={validCurrentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => setCurrentPage(validCurrentPage - 1)}
                      disabled={validCurrentPage === 1}
                    />
                    {getPageNumbers().map((pageNumber) => (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === validCurrentPage}
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() => setCurrentPage(validCurrentPage + 1)}
                      disabled={validCurrentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={validCurrentPage === totalPages}
                    />
                  </Pagination>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOR UPDATE PRODUCT */}
        <Modal show={showUpdateModal} onHide={handleUpdateModalClose} centered>
          <form onSubmit={handleUpdateProduct}>
            <Modal.Header closeButton>
              <Modal.Title>Update Product</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div className="form-group p-1">
                <h6>Product Name</h6>
                <input
                  className={`${style.txtbox} form-control`}
                  type="text"
                  id="newprodName"
                  name="newprodName"
                  defaultValue={selectedProductData.prodName}
                  onChange={(e) =>
                    setSelectedData({
                      ...selectedProductData,
                      prodName: e.target.value,
                    })
                  }
                  placeholder="Name"
                  required
                />
              </div>
              <div className="form-group p-1">
                <h6>Product Details</h6>
                <input
                  className={`${style.txtbox} form-control`}
                  type="text"
                  defaultValue={selectedProductData.prodDetails}
                  id="newprodDetails"
                  name="newprodDetails"
                  onChange={(e) =>
                    setSelectedData({
                      ...selectedProductData,
                      prodDetails: e.target.value,
                    })
                  }
                  placeholder="Details"
                  required
                />
              </div>

              <div className="form-group p-1">
                <h6>Buying Price</h6>
                <input
                  className={`${style.txtbox} form-control`}
                  type="text"
                  id="newbuyingPrice"
                  name="newbuyingPrice"
                  defaultValue={selectedProductData.buyingPrice}
                  onChange={(e) =>
                    setSelectedData({
                      ...selectedProductData,
                      buyingPrice: e.target.value,
                    })
                  }
                  placeholder="Buying Price"
                  required
                />
              </div>

              <div className="form-group p-1">
                <h6>Selling Price</h6>
                <input
                  className={`${style.txtbox} form-control`}
                  type="text"
                  id="newsellingPrice"
                  name="newsellingPrice"
                  placeholder="Selling Price"
                  defaultValue={selectedProductData.sellingPrice}
                  onChange={(e) =>
                    setSelectedData({
                      ...selectedProductData,
                      sellingPrice: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group p-1">
                <h6>Product Unit</h6>
                <select
                  className={`${style.txtbox} form-select`}
                  id="newProdUnit"
                  name="newProdUnit"
                  defaultValue={selectedProductData.prodUnitId}
                  onChange={(e) =>
                    setSelectedData({
                      ...selectedProductData,
                      prodUnitId: e.target.value,
                    })
                  }
                >
                  <option value="default">Select Product Unit</option>{" "}
                  {/* Add a default option */}
                  {unitList.map((unit) => (
                    <option key={unit.prodUnitId} value={unit.prodUnitId}>
                      {unit.prodUnitName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group p-1">
                <h6>Container</h6>
                <select
                  className={`${style.txtbox} form-select`}
                  id="newprodContainer"
                  name="newprodContainer"
                  defaultValue={selectedProductData.prodContainer}
                  onChange={(e) =>
                    setSelectedData({
                      ...selectedProductData,
                      prodContainer: e.target.value,
                    })
                  }
                >
                  <option value="" disabled selected>
                    Select a container
                  </option>
                  {options.map((option) => {
                    return (
                      <option
                        key={option.containerId}
                        value={option.containerId}
                      >
                        {option.containerName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="p-2 d-flex justify-content-end">
                <Button type="submit" variant="primary">
                  Update
                </Button>
              </div>
            </Modal.Body>
          </form>
        </Modal>

        {/*MODAL FOR Archive product*/}
        <Modal
          show={showArchiveModal}
          onHide={handleArchiveModalClose}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Archive Product</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            Are you sure you want to archive this product?
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="primary"
              onClick={(e) => {
                setArchive({ ...archiveValue, isConfirm: true });
                handleArchive(e);
              }}
            >
              Yes
            </Button>

            <Button variant="danger" onClick={handleArchiveModalClose}>
              No
            </Button>
          </Modal.Footer>
        </Modal>

        {/*Modal for viewing information of specific product */}
        <Modal show={showViewModal} onHide={handleViewModalClose} centered>
          <Modal.Header closeButton>
            <div className="d-flex flex-column">
              <h3>{productDetails.prodName}</h3>
              <div className="d-flex flex column">
                <h6 className={style.txtlbl}>
                  <i>{productDetails.batchNumber}</i>
                </h6>
              </div>

              <div className="d-flex flex-column mt-2">
                <h6>Next batch: </h6>
                <h6 className={style.txtlbl}>
                  {productDetails.nextBatchNumber === null ||
                  productDetails.nextBatchNumber === ""
                    ? "No next batch"
                    : `${productDetails.nextBatchNumber}`}{" "}
                  (Qty:{" "}
                  {productDetails.nextBatchNumber === null ||
                  productDetails.nextBatchNumber === ""
                    ? "-"
                    : `${productDetails.nextRemainingQty}`}
                  )
                </h6>
              </div>
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Details</h6>
              <h5>{productDetails.prodDetails}</h5>
            </div>

            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Container</h6>
              <h5>{productDetails.containerName}</h5>
            </div>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Stock</h6>
              <h5>{productDetails.totalRemainingQty}</h5>
            </div>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Buying Price(Whole)</h6>
              <h5>₱{productDetails.buyingPrice}</h5>
            </div>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Selling Price(Piece)</h6>
              <h5>₱{productDetails.sellingPrice}</h5>
            </div>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Supplier</h6>
              <h5>{productDetails.supplierName}</h5>
            </div>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Date Expiry (yyyy-mm-dd)</h6>
              <h5>{productDetails.earliestExpiryDate}</h5>
            </div>
          </Modal.Body>
        </Modal>
      </>
    );
  }

  function prodUnit() {
    return (
      <>
        <ProductUnit />
      </>
    );
  }

  function offProduct() {
    return (
      <>
        <OffProduct />
      </>
    );
  }

  function archivedProduct() {
    return (
      <>
        <ArchivedProduct />
      </>
    );
  }

  const renderPage = () => {
    if (presentPage === "product") {
      return product();
    } else if (presentPage === "prodUnit") {
      return prodUnit();
    } else if (presentPage === "offProduct") {
      return offProduct();
    } else if (presentPage === "archivedProduct") {
      return archivedProduct();
    }
  };

  return (
    <>
      <div>
        {renderPage()}

        {etcBtnVisible && (
          <div
            className={`${style.divEtcButtons} d-flex flex-column justify-content-center align-items-center`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="w-100 d-flex flex-column justify-content-center">
              <button
                type="button"
                className="btn btn-success m-2"
                style={{ backgroundColor: "#10451D" }}
                onClick={() => {
                  setShowPresentPage("offProduct");
                  handleAddModalOpen();
                  handleClickEtcBtnNV();
                }}
              >
                Product (Off-Inventory) <FaArrowRight size={13} />
              </button>

              <button
                type="button btn-success"
                className="btn btn-success m-2"
                style={{ backgroundColor: "#10451D" }}
                onClick={() => {
                  setShowPresentPage("prodUnit");
                  handleClickEtcBtnNV();
                }}
              >
                Product Unit <FaArrowRight size={13} />
              </button>

              <button
                type="button"
                className="btn btn-danger m-2"
                style={{ backgroundColor: "#7C1E27" }}
                onClick={() => {
                  setShowPresentPage("archivedProduct");
                  handleClickEtcBtnNV();
                }}
              >
                Archived Products
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Product;

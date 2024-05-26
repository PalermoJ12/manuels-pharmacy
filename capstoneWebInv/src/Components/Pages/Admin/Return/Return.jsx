import React, { useEffect, useState } from "react";

import style from "./Return.module.css";

import { Button, Modal } from "react-bootstrap";

import { VscEye } from "react-icons/vsc";
import axios from "axios";
import apiUrl from "../../../Config/config";
import { toast } from "react-toastify";

const Return = () => {
  const [showSeeModal, setShowSeeModal] = useState(false);

  const handleSeeModalOpen = () => {
    setShowSeeModal(true);
  };

  const handleSeeModalClose = () => {
    setShowSeeModal(false);
  };

  const [returnList, setReturnList] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [returnBySales, setReturnByList] = useState([]);
  useEffect(() => {
    getReturnListById();
  }, [returnList]);

  const getReturnList = (id) => {
    axios
      .get(`${apiUrl}/getAllReturnsInAdmin/${id}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setReturnList(res.data.Message);
          setPresentPage("returnListProduct");
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const [month, day, year] = new Date(dateStr)
      .toLocaleDateString(undefined, options)
      .split("/");
    return `${year}-${month}-${day}`;
  };

  const [searchSalesId, setSearchId] = useState("");
  const filteredSalesId = returnBySales.filter((data) => {
    const salesId = data.saleId.toString();
    const searchValue = searchSalesId.toLowerCase();
    return salesId.includes(searchValue);
  });

  const [searchName, setSearchName] = useState("");
  const filteredSalesName = returnList.filter((data) => {
    const name = data.prodName.toLowerCase();
    const searchValue = searchName.toLowerCase();
    return name.includes(searchValue);
  });

  const getReturnListById = () => {
    axios
      .get(`${apiUrl}/getAllReturns`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setReturnByList(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [presentPage, setPresentPage] = useState("returnListSales");

  function returnListSales() {
    return (
      <>
        <div className={`${style.container} container-fluid vh-100`}>
          <div className=" mt-4 d-flex justify-content-end">
            <div>
              <input
                type="text"
                placeholder="Search"
                value={searchSalesId}
                onChange={(e) => setSearchId(e.target.value)}
                className={`${style.txtbox} form-control`}
              />
            </div>
          </div>

          <div className={`${style["table-container"]} mt-4`}>
            <table
              className={`${style.tblReturn} table caption-top table-borderless table-hover`}
            >
              <caption> List of Sales Id</caption>
              <thead>
                <tr>
                  <th>Sales Id</th>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Return Item</label>
                      <label className={style.lblmmddyyyy}>(yyyy/mm/dd)</label>
                    </div>
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesId.map((data, index) => {
                  return (
                    <tr key={index}>
                      <td>{data.saleId}</td>
                      <td>{formatDate(data.dateReturn)}</td>
                      <td>
                        <button
                          className="btn btn-dark my-2 d-flex align-items-center"
                          onClick={() => {
                            getReturnList(data.saleId);
                          }}
                        >
                          See Products
                          <div className="ms-1">
                            <VscEye />
                          </div>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  function returnListProduct() {
    return (
      <>
        <div className={`${style.container} container-fluid vh-100`}>
          <div className=" mt-4 d-flex justify-content-between">
            <div>
              <button
                className="btn btn-success"
                onClick={() => {
                  setPresentPage("returnListSales");
                }}
              >
                Back to Return List
              </button>
            </div>
            <div>
              <input
                type="text"
                placeholder="Search"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className={`${style.txtbox} form-control`}
              />
            </div>
          </div>

          <div className={`${style["table-container"]} mt-4`}>
            <table
              className={`${style.tblReturn} table caption-top table-borderless table-striped`}
            >
              <caption>
                {" "}
                List of All Return Items (by specific Sales Id)
              </caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesName.map((data, index) => {
                  return (
                    <tr key={index}>
                      <td>{data.prodName}</td>

                      <td>
                        <button
                          className="btn btn-dark my-2 d-flex align-items-center"
                          onClick={(e) => {
                            setSelectedProduct(data);
                            handleSeeModalOpen();
                          }}
                        >
                          See Details
                          <div className="ms-1">
                            <VscEye />
                          </div>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/*Modal for See More Info*/}
        <Modal show={showSeeModal} onHide={handleSeeModalClose} centered>
          <Modal.Header closeButton>
            <div className="d-flex flex-column">
              <h3>{selectedProduct.prodName}</h3>
              <h6>{selectedProduct.batchNumber}</h6>
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Sales ID</h6>
              <h5>{selectedProduct.saleId}</h5>
            </div>
            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Details</h6>
              <h5>{selectedProduct.prodDetails}</h5>
            </div>

            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Quantity</h6>
              <h5>{selectedProduct.prodQty}</h5>
            </div>

            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Price</h6>
              <h5>{selectedProduct.price}</h5>
            </div>

            <div className="mb-2 d-flex flex-column">
              <h6 className={style.txtlbl}>Remarks</h6>
              <h5>{selectedProduct.returnRemarks}</h5>
            </div>

            <div className="mb-2 d-flex flex-column">
              <div className="d-flex">
                <h6 className={`${style.txtlbl} me-1`}>Date Return</h6>
                <label className={style.lblmmddyyyy}>(yyyy/mm/dd)</label>
              </div>

              <h5>{formatDate(selectedProduct.dateReturn)}</h5>
            </div>
          </Modal.Body>
        </Modal>
      </>
    );
  }

  const renderPage = () => {
    if (presentPage === "returnListSales") {
      return returnListSales();
    } else if (presentPage === "returnListProduct") {
      return returnListProduct();
    }
  };

  return <>{renderPage()}</>;
};

export default Return;

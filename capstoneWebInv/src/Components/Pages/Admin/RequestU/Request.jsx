import React, { useState, useEffect } from "react";
import style from "./Request.module.css";
import { toast } from "react-toastify";
import apiUrl from "../../../Config/config";
import axios from "axios";

import { Button, Modal } from "react-bootstrap";
import { FiArrowRight } from "react-icons/fi";
import { VscEye } from "react-icons/vsc";
import { tr } from "date-fns/locale";

const Request = () => {
  //See Activity Modal for PURCHASE
  const [showSeePurchaseModal, setShowPurchaseSeeModal] = useState(false);

  const handleSeePurchaseModalOpen = () => {
    setShowPurchaseSeeModal(true);
  };

  const handleSeePurchaseModalClose = () => {
    setShowPurchaseSeeModal(false);
  };

  //See Activity Modal for UPDATE
  const [showSeeUpdateModal, setShowPurchaseUpdate] = useState(false);

  const handleSeeUpdateModalOpen = () => {
    setShowPurchaseUpdate(true);
  };

  const handleSeeUpdateModalClose = () => {
    setShowPurchaseUpdate(false);
  };

  //See Activity Modal for RETURN
  const [showReturnModal, setShowReturnUpdate] = useState(false);

  const handleReturnModalOpen = () => {
    setShowReturnUpdate(true);
  };

  const handleReturnModalClose = () => {
    setShowReturnUpdate(false);
  };

  const [approvedRequest, setApprovedRequest] = useState([]);
  const [requestReturn, setRequestReturn] = useState([]);
  const [updateShower, setUpdateShower] = useState([]);
  const [purchaseShower, setPurchaseShower] = useState([]);
  const [Name, setName] = useState("");

  useEffect(() => {
    handleAuth();
  }, [Name]);

  const handleAuth = () => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setName(res.data.name);
          handleGetRequest(res.data.name);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleGetRequest = (name) => {
    axios
      .get(`${apiUrl}/getRequestUser/${name}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setApprovedRequest(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleGetStatus = (data) => {
    if (data.status === 0) {
      return "Pending";
    } else if (data.status === 1) {
      return "Approved";
    } else {
      return "Declined";
    }
  };
  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const [month, day, year] = new Date(dateStr)
      .toLocaleDateString(undefined, options)
      .split("/");
    return `${year}-${month}-${day}`;
  };
  return (
    <>
      <div className={`${style.container} container-fluid vh-100`}>
        <div className={`${style["table-container"]} m-4`}>
          <table
            className={`${style.tblRequest} table table-hover table-borderless`}
          >
            <thead>
              <tr>
                <th>Activity</th>
                <th>See Activity</th>
                <th>Status</th>
                <th>
                  <div className="d-flex flex-column">
                    <label>Date</label>
                    <label className={style.lblmmddyyyy}>(yyyy/mm/dd)</label>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {approvedRequest.map((data, index) => {
                if (data.reqType !== 2) {
                  return (
                    <tr key={index}>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                              ? "#CCE6F4"
                              : data.status === 0
                              ? "white"
                              : "#FFE3E0", 
                        }}
                      >
                        {data.requestDetails}
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                              ? "#CCE6F4"
                              : data.status === 0
                              ? "white"
                              : "#FFE3E0",
                        }}
                      >
                        <button
                          className="btn btn-dark"
                          onClick={() => {
                            if (data.reqType === 0) {
                              setUpdateShower(data);
                              handleSeeUpdateModalOpen();
                            } else {
                              setPurchaseShower([data]);
                              handleSeePurchaseModalOpen();
                            }
                          }}
                        >
                          <VscEye />
                        </button>
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                            ? "#CCE6F4"
                            : data.status === 0
                            ? "white"
                            : "#FFE3E0",
                        }}
                      >
                        {handleGetStatus(data)}
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                            ? "#CCE6F4"
                            : data.status === 0
                            ? "white"
                            : "#FFE3E0",
                        }}
                      >
                        {formatDate(data.reqDate)}
                      </td>
                    </tr>
                  );
                }
                return null; // If reqType === 2, don't render it here
              })}

              {Object.values(
                approvedRequest.reduce((acc, data) => {
                  if (data.reqType === 2) {
                    const key = `${data.saleId}_${data.reqType}`;
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(data);
                  }
                  return acc;
                }, {})
              ).map((groupedData, index) => {
                if (groupedData.length > 0) {
                  const data = groupedData[0]; // Take the first element
                  return (
                    <tr key={index}>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                            ? "#CCE6F4"
                            : data.status === 0
                            ? "white"
                            : "#FFE3E0",
                        }}
                      >
                        Returned a product.
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                            ? "#CCE6F4"
                            : data.status === 0
                            ? "white"
                            : "#FFE3E0",
                        }}
                      >
                        <button
                          className="btn btn-dark"
                          onClick={() => {
                            setRequestReturn(groupedData);
                            handleReturnModalOpen();
                          }}
                        >
                          <VscEye />
                        </button>
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                            ? "#CCE6F4"
                            : data.status === 0
                            ? "white"
                            : "#FFE3E0",
                        }}
                      >
                        {handleGetStatus(data)}
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            data.status === 1
                            ? "#CCE6F4"
                            : data.status === 0
                            ? "white"
                            : "#FFE3E0",
                        }}
                      >
                        {formatDate(data.reqDate)}
                      </td>
                    </tr>
                  );
                }
                return null;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/*Modal for See Activity for Purchase*/}
      <Modal
        show={showSeePurchaseModal}
        onHide={handleSeePurchaseModalClose}
        dialogClassName={style["custom-modal-see"]}
        scrollable
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <h3 style={{ fontWeight: "600" }} className="text-success">
              Purchase Stock
            </h3>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={`${style["table-container-purHistory"]}`}>
            <table
              className={`${style.tblPurchasedProduct} table caption-top table-borderless table-striped`}
            >
              <thead>
                <tr>
                  <th>Purchase Date</th>
                  <th>Delivery Date</th>
                  <th>Product Name</th>
                  <th>Product Unit</th>
                  <th>Quantity</th>
                  <th>Buying Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>

              <tbody>
                {purchaseShower.map((data, index) => {
                  return (
                    <tr key={index}>
                      <td>{formatDate(data.reqDate)}</td>
                      <td>{formatDate(data.purchaseDeliveryDate)}</td>
                      <td>{data.prodName}</td>
                      <td>{data.prodUnitName}</td>
                      <td>{data.prodQtyWhole}</td>
                      <td>{data.buyingPrice.toFixed(2)}</td>
                      <td>{data.prodPrice.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer></Modal.Footer>
      </Modal>

      {/*Modal for See Activity for Update*/}
      <Modal
        show={showSeeUpdateModal}
        onHide={handleSeeUpdateModalClose}
        dialogClassName={style["custom-modal-see"]}
        centered
      >
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h4 className={`${style.lblAD} me-1 bg-dark text-white`}>See</h4>
              <h4>Activity For:</h4>
            </div>
            <div></div>
          </div>

          <div className="w-100 flex-column">
            <div className="w-100 d-flex flex-column">
              <div>
                <h6 className={style.lblfield}>Name</h6>
                <h4>{updateShower.prodName}</h4>
              </div>

              <div>
                <h6 className={style.lblfield}>Details</h6>
                <h4>{updateShower.prodDetails}</h4>
              </div>

              <div>
                <h6 className={style.lblfield}>Container</h6>
                <h4>{updateShower.containerName}</h4>
              </div>
            </div>
          </div>

          <div>
            <hr />
          </div>

          <div className="d-flex flex-column">
            <h6 className={style.lblfield}>Request Field Update</h6>
            <div className="d-flex">
              <h5 className="me-2">{updateShower.requestFrom}</h5>
              <h5 className="me-2">
                <FiArrowRight />
              </h5>
              <h5>{updateShower.requestTo}</h5>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/*Modal for See Request For Return*/}
      <Modal
        show={showReturnModal}
        onHide={handleReturnModalClose}
        dialogClassName={style["custom-modal-see"]}
        scrollable
        centered
      >
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h4 className={`${style.lblAD} me-1 bg-dark text-white`}>
                Return Details
              </h4>
            </div>
            <div></div>
          </div>
          {requestReturn.map((data, index) => (
            <React.Fragment key={index}>
              <div className="w-100 flex-column">
                <div className="w-100 d-flex flex-column">
                  <div>
                    <h6 className={style.lblfield}>Name</h6>
                    <h4>{`${data.prodName} - ${data.batchNumber}`}</h4>
                  </div>
                  <div>
                    <h6 className={style.lblfield}>Quantity</h6>
                    <h4>{data.prodQty}</h4>
                  </div>
                  <div>
                    <h6 className={style.lblfield}>Total</h6>
                    <h4>{data.itemTotal}</h4>
                  </div>
                </div>
              </div>
              <div>
                <hr />
                <div>
                  <h6 className={style.lblfield}>Remarks</h6>
                  <h4>{data.requestFrom}</h4>
                </div>
                <hr />
              </div>
            </React.Fragment>
          ))}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Request;

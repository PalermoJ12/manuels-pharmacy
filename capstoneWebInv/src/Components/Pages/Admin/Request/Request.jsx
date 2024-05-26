import React, { useState, useEffect } from "react";
import style from "./Request.module.css";
import { toast } from "react-toastify";
import apiUrl from "../../../Config/config";
import axios from "axios";
import { PiNewspaperClippingThin } from "react-icons/pi";

import { FiArrowRight } from "react-icons/fi";

import { Button, Modal } from "react-bootstrap";

import { VscEye } from "react-icons/vsc";
import { tr } from "date-fns/locale";

const Request = () => {
  //See Activity Modal for Purchase
  const [showSeePurchaseModal, setShowPurchaseSeeModal] = useState(false);

  const handleSeePurchaseModalOpen = () => {
    setShowPurchaseSeeModal(true);
  };

  const handleSeePurchaseModalClose = () => {
    setShowPurchaseSeeModal(false);
  };
  //See Activity Modal for Purchase Approved And Declined
  const [showSeePurchaseModalForDecApp, setShowSeePurchaseModalForDecApp] =
    useState(false);

  const handleSeePurchaseModalOpenForDecApp = () => {
    setShowSeePurchaseModalForDecApp(true);
  };

  const handleSeePurchaseModalCloseForDecApp = () => {
    setShowSeePurchaseModalForDecApp(false);
  };

  //See Activity Modal for Update
  const [showSeeModal, setShowSeeModal] = useState(false);

  const handleSeeModalOpen = () => {
    setShowSeeModal(true);
  };

  const handleSeeModalClose = () => {
    setShowSeeModal(false);
  };

  //See Activity Modal for Return
  const [showSeeModalOfReturnRequest, setShowSeeModalOfReturnRequest] =
    useState(false);

  const handleSeeModalOpenOfReturnRequest = () => {
    setShowSeeModalOfReturnRequest(true);
  };

  const handleSeeModalCloseOfReturnRequest = () => {
    setShowSeeModalOfReturnRequest(false);
  };

  //See Activity Modal for Return
  const [showSeeModalOfReturnApproved, setShowSeeModalOfReturnApproved] =
    useState(false);

  const handleSeeModalOpenOfReturnApproved = () => {
    setShowSeeModalOfReturnApproved(true);
  };

  const handleSeeModalCloseOfReturnApproved = () => {
    setShowSeeModalOfReturnApproved(false);
  };

  //See Activity Modal for Return
  const [showSeeModalOfReturnDeclined, setShowSeeModalOfReturnDeclined] =
    useState(false);

  const handleSeeModalOpenOfReturnDeclined = () => {
    setShowSeeModalOfReturnDeclined(true);
  };

  const handleSeeModalCloseOfReturnDeclined = () => {
    setShowSeeModalOfReturnDeclined(false);
  };

  //See Activity Modal
  const [showSeeADModal, setShowSeeADModal] = useState(false);

  const handleSeeADModalOpen = () => {
    setShowSeeADModal(true);
  };

  const handleSeeADModalClose = () => {
    setShowSeeADModal(false);
  };

  //Approved Modal
  const [showApprovedModal, setShowApprovedModal] = useState(false);

  const handleApprovedModalOpen = () => {
    setShowApprovedModal(true);
  };

  const handleApprovedModalClose = () => {
    setShowApprovedModal(false);
  };

  //Declined Modal
  const [showDeclinedModal, setShowDeclinedModal] = useState(false);

  const handleDeclinedModalOpen = () => {
    setShowDeclinedModal(true);
  };

  const handleDeclinedModalClose = () => {
    setShowDeclinedModal(false);
  };

  const [requestList, setRequestList] = useState([]);
  const [product, setProduct] = useState([]);
  const [requestReturn, setRequestReturn] = useState([]);
  const [remarks,setRemarks] = useState("");
  const fetchRequestList = () => {
    axios
      .get(`${apiUrl}/getRequestPending`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRequestList(res.data.Message);
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    // Fetch requestList and product data on initial load
    fetchRequestList();
    fetchProduct();
  }, [requestList]);

  const fetchProduct = () => {
    axios
      .get(`${apiUrl}/manageProduct`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setProduct(res.data.Message);
        }
      })
      .catch((err) => console.log(err));
  };

  const [updateRequest, setUpdateRequest] = useState([]);
  const [purchaseDataRequest, setPurchaseDataRequest] = useState([]);
  const fetchPurchaseData = (supplierId, purchase_id) => {
    axios
      .get(`${apiUrl}/purchaseDataRequest/${supplierId}/${purchase_id}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setPurchaseDataRequest(res.data.Message);
        } else {
          toast.error("Cannot fetch data. Please Try Again Later.");
        }
      })
      .catch((error) => {
        console.error("Error fetching purchase data:", error);
      });
  };

  const [updateShower, setUpdateShower] = useState([]);
  const handleActionApproved = (newData) => {
    const matchedProduct = product.find((p) => p.prodId === newData.prodId);

    if (!matchedProduct) {
      toast.error("Product not found for this request.");
      return;
    }

    if (newData.requestDetails === "Update a product.") {
      axios
        .post(`${apiUrl}/updateApprovedFromRequest`, {
          ...newData,
          status: 1,
          prodQty: matchedProduct.prodQty,
          batchNumber: matchedProduct.batchNumber,
        })
        .then((res) => {
          if (res.data.Status === "Success") {
            handleSeeModalClose();
            toast.success("Success.");
            fetchRequestList();
          } else {
            toast.error("There is an error in performing this action");
          }
        });
    }
  };

  const handleApproveReturn = () => {
    axios
      .put(`${apiUrl}/approvedReturnItem`, requestReturn)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleSeeModalCloseOfReturnRequest();
          fetchRequestList();
          toast.success("Approved return.");
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleDeclineReturn = () => {
    axios
      .put(`${apiUrl}/declinedReturnItem`, requestReturn)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleSeeModalCloseOfReturnRequest();
          fetchRequestList();
          toast.success("Declined return.");
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const approvedPurchase = (requestId, purchase_id) => {
    axios
      .put(`${apiUrl}/approvedPurchase/${requestId}/${purchase_id}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleSeePurchaseModalClose();
          toast.success("Approved purchased.");
        }
      })
      .catch((err) => console.log(err));
  };

  const [approvedRequest, setApprovedRequest] = useState([]);
  const handleGetApproved = () => {
    axios
      .get(`${apiUrl}/getRequestApproved`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setApprovedRequest(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [declinedRequest, setDeclinedRequest] = useState([]);
  const handleGetDecline = () => {
    axios
      .get(`${apiUrl}/getDeclinedRequest`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setDeclinedRequest(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleActionDeclineUpdate = (newData) => {
    axios
      .put(`${apiUrl}/updateDeclineRequest`, { ...newData, status: 2 })
      .then((res) => {
        if (res.data.Status === "Success") {
          handleSeeModalClose();
          toast.success("Declined succesfully.");
          fetchRequestList();
        } else {
          toast.warning("There is an error in performing this action");
        }
      })
      .catch((err) => console.log(err));
  };

  const handleDeclinePurchase = (requestId, purchase_id) => {
    axios
      .put(`${apiUrl}/declinePurchaseRequest/${requestId}/${purchase_id}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleSeePurchaseModalClose();
          toast.success("Declined succesfully.");
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

  return (
    <>
      <div className={`${style.container} container-fluid vh-100`}>
        <div className="mt-4 me-4 d-flex justify-content-end">
          <button
            className="btn btn-primary me-2"
            onClick={() => {
              handleGetApproved();
              handleApprovedModalOpen();
            }}
          >
            <div className="d-flex flex-column">
              <label
                className={`${style.lblmmddyyyy} d-flex justify-content-start`}
                style={{ cursor: "pointer" }}
              >
                See
              </label>
              <label style={{ cursor: "pointer" }}>Approved</label>
            </div>
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              handleGetDecline();
              handleDeclinedModalOpen();
            }}
          >
            <div className="d-flex flex-column">
              <label
                className={`${style.lblmmddyyyy} d-flex justify-content-start`}
                style={{ cursor: "pointer" }}
              >
                See
              </label>
              <label style={{ cursor: "pointer" }}>Declined</label>
            </div>
          </button>
        </div>
        {requestList.length > 0 ? (
          <div className={`${style["table-container"]} m-4`}>
            <table
              className={`${style.tblRequest} table table-hover table-borderless`}
            >
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>by</th>
                  <th>See Activity</th>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Date</label>
                      <label className={style.lblmmddyyyy}>(yyyy/mm/dd)</label>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {requestList.map((request, index) => {
                  if (request.reqType !== 2) {
                    return (
                      <tr key={index}>
                        <td>{request.requestDetails}</td>
                        <td>{request.requestName}</td>
                        <td>
                          <button
                            className={`${style.tblButtonCustom} btn btn-dark`}
                            onClick={() => {
                              if (request.reqType === 1) {
                                setUpdateRequest(request);
                                fetchPurchaseData(
                                  request.suppId,
                                  request.purchase_id
                                );
                                handleSeePurchaseModalOpen();
                              } else {
                                setUpdateRequest(request);
                                handleSeeModalOpen();
                              }
                            }}
                          >
                            <VscEye />
                          </button>
                        </td>
                        <td>{formatDate(request.reqDate)}</td>
                      </tr>
                    );
                  }
                  return null; // If reqType === 2, handle grouping separately
                })}

                {Object.values(
                  requestList.reduce((acc, request) => {
                    if (request.reqType === 2) {
                      const key = `${request.saleId}_${request.reqType}`;
                      if (!acc[key]) {
                        acc[key] = [];
                      }
                      acc[key].push(request);
                    }
                    return acc;
                  }, {})
                ).map((groupedRequests, index) => {
                  if (groupedRequests.length > 0) {
                    const data = groupedRequests[0]; // Take the first element as reference
                    return (
                      <tr key={`return_${index}`}>
                        <td>Return a product.</td>
                        <td>{data.requestName}</td>
                        <td>
                          <button
                            className={`${style.tblButtonCustom} btn btn-dark`}
                            onClick={() => {
                             setRemarks(groupedRequests[0].requestDetails);
                              setRequestReturn(groupedRequests);
                              handleSeeModalOpenOfReturnRequest();
                            }}
                          >
                            <VscEye />
                          </button>
                        </td>
                        <td>{formatDate(data.reqDate)}</td>
                      </tr>
                    );
                  }
                  return null;
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="d-flex flex-column justify-content-center align-items-center">
            <PiNewspaperClippingThin size={200} color="#AAAAAA" />
            <h6 style={{ color: "#AAAAAA" }}>As of now, no request found.</h6>
          </div>
        )}
      </div>

      {/*Modal for See Activity for Purchase*/}
      <Modal
        show={showSeePurchaseModal}
        onHide={handleSeePurchaseModalClose}
        dialogClassName={style["custom-modal-see"]}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <h4 className={`${style.lblAD} me-1 bg-dark text-white`}>
                See Purchase
              </h4>
              <h4> Activity</h4>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={`${style["table-container"]}`}>
            <table
              className={`${style.tblreqpurchase} table table-striped table-borderless`}
            >
              <thead>
                <tr>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Purchase Date</label>
                      <label className={style.lblmmddyyyy}>(mm/dd/yyyy)</label>
                    </div>
                  </th>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Expect Delivery Date</label>
                      <label className={style.lblmmddyyyy}>(mm/dd/yyyy)</label>
                    </div>
                  </th>
                  <th>Product Name </th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {purchaseDataRequest.map((data, index) => {
                  return (
                    <tr key={index}>
                      <td>{data.formattedDateReq}</td>
                      <td>{data.formattedPurchaseDeliveryDate}</td>
                      <td>{data.prodName}</td>
                      <td>{data.prodQtyWhole}</td>
                      <td>{data.prodUnitName}</td>
                      <td>{data.buyingPrice}</td>
                      <td>{data.totalPrice}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-primary me-2"
              onClick={() => {
                approvedPurchase(
                  updateRequest.requestId,
                  updateRequest.purchase_id
                );
              }}
            >
              Accept
            </button>
            <button
              className="btn btn-danger"
              onClick={() =>
                handleDeclinePurchase(
                  updateRequest.requestId,
                  updateRequest.purchase_id
                )
              }
            >
              Decline
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/*Modal for See Activity for Purchase Approved and Declined*/}
      <Modal
        show={showSeePurchaseModalForDecApp}
        onHide={handleSeePurchaseModalCloseForDecApp}
        dialogClassName={style["custom-modal-see"]}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <h4 className={`${style.lblAD} me-1 bg-dark text-white`}>
                See Purchase
              </h4>
              <h4> Activity</h4>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={`${style["table-container"]}`}>
            <table
              className={`${style.tblreqpurchase} table table-striped table-borderless`}
            >
              <thead>
                <tr>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Purchase Date</label>
                      <label className={style.lblmmddyyyy}>(mm/dd/yyyy)</label>
                    </div>
                  </th>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Expect Delivery Date</label>
                      <label className={style.lblmmddyyyy}>(mm/dd/yyyy)</label>
                    </div>
                  </th>
                  <th>Product Name </th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Total Price</th>
                </tr>
              </thead>
              <tbody>
                {purchaseDataRequest.map((data, index) => {
                  return (
                    <tr key={index}>
                      <td>{data.formattedDateReq}</td>
                      <td>{data.formattedPurchaseDeliveryDate}</td>
                      <td>{data.prodName}</td>
                      <td>{data.prodQtyWhole}</td>
                      <td>{data.prodUnitName}</td>
                      <td>{data.buyingPrice}</td>
                      <td>{data.totalPrice}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>

      {/*Modal for See Activity for Update*/}
      <Modal
        show={showSeeModal}
        onHide={handleSeeModalClose}
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
                <h4>{updateRequest.prodName}</h4>
              </div>

              <div>
                <h6 className={style.lblfield}>Details</h6>
                <h4>{updateRequest.prodDetails}</h4>
              </div>

              <div>
                <h6 className={style.lblfield}>Container</h6>
                <h4>{updateRequest.containerName}</h4>
              </div>
            </div>
          </div>

          <div>
            <hr />
          </div>

          <div className="d-flex flex-column">
            <h6 className={style.lblfield}>Request Field Update</h6>
            <div className="d-flex">
              <h5 className="me-2">{updateRequest.requestFrom}</h5>
              <h5 className="me-2">
                <FiArrowRight />
              </h5>
              <h5>{updateRequest.requestTo}</h5>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-start">
            <button
              className="btn btn-primary me-2"
              onClick={() => {
                handleActionApproved(updateRequest);
              }}
            >
              Accept
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleActionDeclineUpdate(updateRequest)}
            >
              Decline
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/*Modal for See Request For Return*/}
      <Modal
        show={showSeeModalOfReturnRequest}
        onHide={handleSeeModalCloseOfReturnRequest}
        dialogClassName={style["custom-modal-see"]}
        scrollable
        centered
      >
        <Modal.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <h4 className={`${style.lblAD} me-1 bg-dark text-white`}>See</h4>
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
                    <h4>{remarks}</h4>
                  </div>
              </div>
            </React.Fragment>
          ))}
        </Modal.Body>

        <Modal.Footer>
          <div className="d-flex justify-content-start">
            <button
              className="btn btn-primary me-2"
              onClick={() => {
                handleApproveReturn();
              }}
            >
              Accept
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                handleDeclineReturn();
              }}
            >
              Decline
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      {/*Modal for See Request For Return*/}
      <Modal
        show={showSeeModalOfReturnApproved}
        onHide={handleSeeModalCloseOfReturnApproved}
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
                    <h4>{data.requestDetails}</h4>
                  </div>
              </div>
            </React.Fragment>
          ))}
        </Modal.Body>
      </Modal>

      {/*Modal for See Request For Return*/}
      <Modal
        show={showSeeModalOfReturnDeclined}
        onHide={handleSeeModalCloseOfReturnDeclined}
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
                    <h6 className={style.lblfield}>Total</h6>
                    <h4>{data.returnRemarks}</h4>
                  </div>
              </div>
            </React.Fragment>
          ))}
        </Modal.Body>
      </Modal>

      {/*Modal for See Activity (Approved/Decline page) U*/}
      <Modal
        show={showSeeADModal}
        onHide={handleSeeADModalClose}
        dialogClassName={style["custom-modal-see"]}
        style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
        centered
      >
        <Modal.Header>
          <Modal.Title>
            <div className="d-flex align-items-center mb-2">
              <h4 className={`${style.lblAD} me-1 bg-dark text-white`}>See</h4>
              <h4>Activity For:</h4>
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
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column">
            <h6 className={style.lblfield}>Update Request Field</h6>
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

      {/*Modal for Approved*/}
      <Modal
        show={showApprovedModal}
        onHide={handleApprovedModalClose}
        dialogClassName={style["custom-modal"]}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <h4 className={`${style.lblAD} me-1 bg-primary text-white`}>
                Approved
              </h4>
              <h4>Activities</h4>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={`${style["table-container"]} `}>
            <table
              className={`${style.tblApproved} table table-striped table-borderless`}
            >
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>by</th>
                  <th>See Activity</th>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Date</label>
                      <label className={style.lblmmddyyyy}>(mm/dd/yyyy)</label>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {approvedRequest.map((data, index) => {
                  if (data.reqType !== 2) {
                    return (
                      <tr key={index}>
                        <td>{data.requestDetails}</td>
                        <td>{data.requestName}</td>
                        <td>
                          <button
                            className={`${style.tblButtonCustom} btn btn-dark`}
                            onClick={() => {
                              if (data.reqType === 0) {
                                setUpdateShower(data);
                                handleSeeADModalOpen();
                              } else {
                                fetchPurchaseData(
                                  data.suppId,
                                  data.purchase_id
                                );
                                handleSeePurchaseModalOpenForDecApp();
                                setUpdateShower(data);
                              }
                            }}
                          >
                            <VscEye />
                          </button>
                        </td>
                        <td>{formatDate(data.reqDate)}</td>
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
                ).map((groupedData, index) => (
                  <tr key={index}>
                    {groupedData.map((data, innerIndex) => (
                      <React.Fragment key={innerIndex}>
                        {innerIndex === 0 && (
                          <>
                            <td>Returned a product.</td>
                            <td>{data.requestName}</td>
                            <td>
                              <button
                                className={`${style.tblButtonCustom} btn btn-dark`}
                                onClick={() => {
                                  setRemarks(groupedData[0].requestDetails)
                                  setRequestReturn(groupedData);
                                  handleSeeModalOpenOfReturnApproved();
                                }}
                              >
                                <VscEye />
                              </button>
                            </td>
                            <td>{data.reqDate}</td>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>

      {/*Modal for Declined*/}
      <Modal
        show={showDeclinedModal}
        onHide={handleDeclinedModalClose}
        dialogClassName={style["custom-modal"]}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <h4 className={`${style.lblAD} me-1 bg-danger text-white`}>
                Declined
              </h4>
              <h4>Activities</h4>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className={`${style["table-container"]}`}>
            <table
              className={`${style.tblApproved} table table-striped table-borderless`}
            >
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>by</th>
                  <th>See Activity</th>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Date</label>
                      <label className={style.lblmmddyyyy}>(mm/dd/yyyy)</label>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {declinedRequest.map((data, index) => {
                  if (data.reqType !== 2) {
                    return (
                      <tr key={index}>
                        <td>{data.requestDetails}</td>
                        <td>{data.requestName}</td>
                        <td>
                          <button
                            className={`${style.tblButtonCustom} btn btn-dark`}
                            onClick={() => {
                              if (data.reqType === 0) {
                                setUpdateShower(data);
                                handleSeeADModalOpen();
                              } else {
                                fetchPurchaseData(
                                  data.suppId,
                                  data.purchase_id
                                );
                                handleSeePurchaseModalOpenForDecApp();
                              }
                            }}
                          >
                            <VscEye />
                          </button>
                        </td>
                        <td>{data.reqDate}</td>
                      </tr>
                    );
                  }
                  return null; // If reqType === 2, don't render it here
                })}

                {Object.values(
                  declinedRequest.reduce((acc, data) => {
                    if (data.reqType === 2) {
                      const key = `${data.saleId}_${data.reqType}`;
                      if (!acc[key]) {
                        acc[key] = [];
                      }
                      acc[key].push(data);
                    }
                    return acc;
                  }, {})
                ).map((groupedData, index) => (
                  <tr key={index}>
                    {groupedData.map((data, innerIndex) => (
                      <React.Fragment key={innerIndex}>
                        {innerIndex === 0 && (
                          <>
                            <td>Returned a product.</td>
                            <td>{data.requestName}</td>
                            <td>
                              <button
                                className={`${style.tblButtonCustom} btn btn-dark`}
                                onClick={() => {
                                  setRequestReturn(groupedData); // Pass all items with reqType === 2
                                  handleSeeModalOpenOfReturnDeclined();
                                }}
                              >
                                <VscEye />
                              </button>
                            </td>
                            <td>{formatDate(data.reqDate)}</td>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Request;

import React, { useState, useEffect } from "react";
import style from "../ProductU/ProductU.module.css";
import { Modal, Button } from "react-bootstrap";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdAdd } from "react-icons/md";
import axios from "axios";
import { toast } from "react-toastify";

import { FaSort } from "react-icons/fa";

//Pagination
import { Pagination } from "react-bootstrap";

// Config
import apiUrl from "../../../Config/config";

const ProductU = () => {
  /* MODALS ACTION */

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const handleAddModalOpen = () => {
    setShowAddModal(true);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
  };

  const handleUpdateModalOpen = () => {
    setShowUpdateModal(true);
  };

  const handleUpdateModalClose = () => {
    setShowUpdateModal(false);
  };

  const handleConfirmModalOpen = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
  };

  const [name, setName] = useState("");

  useEffect(() => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setName(res.data.name);
        } else {
          toast.warning("There is an error in fetching data");
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const [productSelected, setProductSelected] = useState([]);
  const [defaultProduct, setDefaultProduct] = useState([]);
  const [currentDate, setCurrentDateTime] = useState("");
  useEffect(() => {
    requestProduct();
    const interval = setInterval(() => {
      setCurrentDateTime(getFormattedCurrentDate());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const requestProduct = () => {
    axios
      .get(`${apiUrl}/requestProduct`)
      .then((res) => {
        if (res.data.Status === "Success") {
          const allProductsData = res.data.Message;
          setData(allProductsData);

          requestContainer();
        } else {
          toast.warning("There is an error in fetching data");
        }
      })
      .catch((err) => console.log(err));
  };

  const [container, setContainer] = useState([]);
  const requestContainer = () => {
    axios
      .get(`${apiUrl}/manageProduct/option`)
      .then((res) => {
        if (res.data.Status === "Success") {
          const allProductsData = res.data.Message;
          setContainer(allProductsData);
        } else {
          toast.warning("There is an error in fetching data");
        }
      })
      .catch((err) => console.log(err));
  };

  {
    /* FOR REQUESTING PRODUCT */
  }

  const [purchaseId, setPurchaseId] = useState(generatePurchaseId());
  const [totalCost, setTotalCost] = useState(0);
  //For auto generated purchaseId
  function generatePurchaseId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000); // Adjust the range as needed
    return `${timestamp}-${random}`;
  }

  //Function for crud //
  const handlePostRequest = () => {
    const purchaseDate = document.getElementById("purchaseDateForm");
    const deliveryDateForm = document.getElementById("deliveryDateForm");

    const updateProductSelected = {
      ...productSelected,
      purchaseId: purchaseId,
      totalPrice: totalCost,
      purchaseDate: purchaseDate.value,
      deliveryDate: deliveryDateForm.value,
      userName: name,
    };
    axios
      .post(`${apiUrl}/addToPurchaseRequest`, updateProductSelected)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleRequestProduct();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [data, setData] = useState([]);

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

  const pageSize = 8;

  const [sortedField, setSortedField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (field === sortedField) {
      // If the same field is clicked again, toggle the sort direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // If a new field is clicked, set the sorted field and default to ascending order
      setSortedField(field);
      setSortDirection("asc");
    }
  };

  const sortedData = [...filteredProd].sort((a, b) => {
    const comparison = a[sortedField] > b[sortedField] ? 1 : -1;
    return sortDirection === "desc" ? comparison : -comparison;
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

  function getFormattedCurrentDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const [request, setRequest] = useState({
    requestName: "",
    requestDetails: "",
    requestFrom: "",
    requestTo: "",
    prodId: "",
    prodName: "",
    prodDetails: "",
    prodQty: 0,
    prodPrice: 0,
    prodContainer: "",
    purchaseId: purchaseId,
    reqDate: "",
    status: 0,
    reqType: 0,
  });

  const handleRequestProduct = () => {
    event.preventDefault();
    const updateRequest = { ...request, suppId: productSelected.suppId };
    axios
      .post(`${apiUrl}/requestToAdmin`, updateRequest)
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Successfully requested.");
          // Close the modal
          handleConfirmModalClose();
          handleAddModalClose();
          const newPurchaseId = generatePurchaseId();
          setPurchaseId(newPurchaseId);
          setTotalCost(0);
        } else {
          handleAddModalClose();
          toast.warning(
            "This product has a pending request. Please Try Again Later."
          );
        }
      })
      .catch((err) => console.log(err));
  };

  const handleRequestUpdateProduct = () => {
    const existContainer = document.getElementById("newprodContainer");
    if (!existContainer || existContainer === "") {
      toast.error("Please select a container.");
      return;
    }

    event.preventDefault();

    // Construct requestFrom and requestTo based on user changes
    let requestFrom = "";
    let requestTo = "";

    if (request.prodName !== updatedProduct.prodName) {
      requestFrom += `${request.prodName},`;
      requestTo += `${updatedProduct.prodName}, `;
    }

    if (request.prodDetails !== updatedProduct.prodDetails) {
      requestFrom += `${request.prodDetails},`;
      requestTo += `${updatedProduct.prodDetails}, `;
    }

    if (request.prodContainer !== updatedProduct.prodContainer) {
      requestFrom += `${request.containerName}, `;
      requestTo += `${updatedProduct.containerName}, `;
    }

    requestFrom = requestFrom.replace(/, $/, "");
    requestTo = requestTo.replace(/, $/, "");

    setRequest({
      ...request,
      requestFrom: requestFrom,
      requestTo: requestTo,
      prodName: updatedProduct.prodName,
      prodDetails: updatedProduct.prodDetails,
      prodContainer: updatedProduct.prodContainer,
    });

    axios
      .post(`${apiUrl}/requestToUpdate`, {
        ...request,
        requestFrom: requestFrom,
        requestTo: requestTo,
        prodName: updatedProduct.prodName,
        prodDetails: updatedProduct.prodDetails,
        prodContainer: updatedProduct.prodContainer,
        userName: name,
      })
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Update Request sent successfully.");
          handleUpdateModalClose();
        } else {
          toast.warning(
            "This product has a pending request. Please Try Again Later."
          );
          handleUpdateModalClose();
        }
      })
      .catch((err) => console.log(err));
  };

  //for default data
  const [updatedProduct, setUpdatedProduct] = useState({});
  const handleDefault = () => {
    const existName = document.getElementById("newprodName");
    const existDetails = document.getElementById("newprodDetails");
    const existContainer = document.getElementById("newprodContainer");

    existName.value = updatedProduct.prodName;
    existDetails.value = updatedProduct.prodDetails;
    existContainer.value = updatedProduct.prodContainer;
  };

  return (
    <>
      <div className={`${style.container} container-fluid vh-100`}>
        <div className="d-flex justify-content-between">
          <div className="col mt-4 d-flex justify-content-end">
            <input
              type="text"
              placeholder="Search"
              value={searchData}
              onChange={(e) => setItemSearch(e.target.value)}
              className={`${style["search-input"]}  form-control`}
            />
          </div>
        </div>

        <div className={`${style["table-container"]}`}>
          <table
            className={`${style.tblProduct} table caption-top table-borderless table-hover`}
          >
            <caption>List of Product</caption>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("prodName")}
                  style={{ cursor: "pointer" }}
                >
                  Name <FaSort />
                </th>
                <th>Details</th>

                <th
                  onClick={() => handleSort("containerName")}
                  style={{ cursor: "pointer" }}
                >
                  Container <FaSort />
                </th>
                <th
                  onClick={() => handleSort("totalRemainingQty")}
                  style={{ cursor: "pointer" }}
                >
                  Stock <FaSort />
                </th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentPageData.map((item, index) => {
                return (
                  <tr key={index}>
                    <td
                      style={{
                        backgroundColor:
                          item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                      }}
                    >
                      {item.prodName}
                    </td>
                    <td
                      style={{
                        backgroundColor:
                          item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                      }}
                    >
                      <div className="d-flex flex-column">
                        <label>{item.prodDetails}</label>
                        <h6 style={{ fontSize: "13px", color: "#737373" }}>
                          ({item.prodUnitName})
                        </h6>
                      </div>
                    </td>

                    <td
                      style={{
                        backgroundColor:
                          item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                      }}
                    >
                      {item.containerName}
                    </td>
                    <td
                      style={{
                        backgroundColor:
                          item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                      }}
                    >
                      {item.totalRemainingQty}
                    </td>
                    <td
                      style={{
                        backgroundColor:
                          item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                      }}
                    >
                      <button
                        className="btn btn-success me-2 my-2"
                        onClick={(e) => {
                          setProductSelected(item);
                          handleAddModalOpen();
                          setRequest({
                            ...request,
                            requestName: name,
                            requestDetails: "Purchase Request.",
                            requestFrom: `From Quantity Present: ${productSelected.prodQty}`,
                            requestTo: "To Quantity: Pending",
                            prodId: item.prodId,
                            prodName: item.prodName,
                            prodDetails: item.prodDetails,
                            prodQty: item.prodQty,
                            prodPrice: item.sellingPrice,
                            containerName: item.containerName,
                            prodContainer: item.prodContainer,
                            reqDate: currentDate,
                            status: 0,
                          });
                        }}
                      >
                        <MdAdd />
                      </button>
                      <button
                        className="btn btn-primary me-2 my-2"
                        onClick={(e) => {
                          setDefaultProduct(item);
                          handleUpdateModalOpen();
                          setRequest({
                            ...request,
                            requestName: name,
                            requestDetails: "Update a product.",
                            requestFrom: "",
                            requestTo: "",
                            prodId: item.prodId,
                            prodName: item.prodName,
                            prodDetails: item.prodDetails,
                            prodQty: item.prodQty,
                            prodPrice: item.sellingPrice,
                            prodContainer: item.prodContainer,
                            containerName: item.containerName,
                            reqDate: currentDate,
                            status: 0,
                          });
                          setUpdatedProduct(item);
                        }}
                      >
                        <BiSolidEditAlt />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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

      {/* MODAL FOR REQUEST STOCK */}
      <Modal
        show={showAddModal}
        onHide={handleAddModalClose}
        dialogClassName={style["custom-modal"]}
        scrollable
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Stock (Request Purchase)</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={`${style.cardPurchaseForm}`}>
            <div className={`${style.supplierName}`}>
              {" "}
              <h3 className="mt-4">{productSelected.supplierName}</h3>
            </div>

            <div className="d-flex flex-column">
              <div className="p-2 mb-2">
                <div className="d-flex">
                  <div className="me-2">
                    <h6>Purchase Date</h6>
                  </div>
                  <div className="">
                    <h6 className={`${style.dateCustom}`}>(dd/mm/yyyy)</h6>
                  </div>
                </div>
                <input
                  className={`${style["search-input-modal"]} form-control`}
                  type="date"
                  id="purchaseDateForm"
                  defaultValue={currentDate}
                  placeholder="Purchase Date"
                  required
                  /*disabled={purchaseItems.length !== 0}*/
                />
              </div>

              <div className="p-2 mb-2">
                <div className="row">
                  <div className="col">
                    <div className="d-flex">
                      <div className="me-2">
                        <h6>Delivery Date</h6>
                      </div>
                      <div className="">
                        <h6 className={`${style.dateCustom}`}>(dd/mm/yyyy)</h6>
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  className={`${style["search-input-modal"]} form-control`}
                  type="date"
                  id="deliveryDateForm"
                  defaultValue={currentDate}
                  placeholder="Delivery Date"
                  required
                  /*disabled={purchaseItems.length !== 0}*/
                />
              </div>

              <div className="p-2 mb-2">
                <label>Select a Product</label>
                <input
                  className={`${style["search-input-modal"]} form-control`}
                  id="prodProductForm"
                  name="prodProduct"
                  value={productSelected.prodName}
                  disabled
                />
              </div>

              <div className="p-2 mb-2">
                <label>Product Unit</label>
                <input
                  className={`${style["search-input-modal"]} form-control`}
                  type="text"
                  id="prodUnit"
                  value={productSelected.prodUnitName}
                  placeholder="Product Unit"
                  disabled
                />
                <label
                  className="m-1 text-primary"
                  hidden={productSelected.isAvailableForPiece === 0}
                >
                  Can be sold per piece.
                </label>
              </div>

              <div className="p-2">
                <div>
                  <h6>Quantity</h6>
                </div>
                <input
                  className={`${style["search-input-modal"]} form-control`}
                  type="number"
                  id="quantityForm"
                  onChange={(e) => {
                    setProductSelected({
                      ...productSelected,
                      prodQty: e.target.value,
                    });
                    setTotalCost(e.target.value * productSelected.buyingPrice);
                  }}
                  placeholder="Quantity"
                  required
                />
              </div>

              <div className="p-2 mb-2">
                <div>
                  <h6>Price</h6>
                </div>
                <input
                  className={`${style["search-input-modal"]} form-control`}
                  type="text"
                  id="buyingPriceForm"
                  value={productSelected.buyingPrice}
                  placeholder="Product Price"
                  disabled
                  required
                />
                <h6 className="mt-2 ms-1">
                  Note: The buying price is based on the last purchase.
                </h6>
              </div>
              <div className="p-2">
                <div
                  className={`${style.totalCost} justify-content-center w-100`}
                >
                  <div className="m-2">
                    <h6>Total</h6>
                    <h2>₱ {totalCost.toFixed(2)}</h2>
                  </div>
                </div>
              </div>

              <div className="p-3 mb-2 d-flex justify-content-end">
                <button
                  className="btn btn-success"
                  onClick={handleConfirmModalOpen}
                >
                  Add to Purchase
                </button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* MODAL FOR UPDATE PRODUCT */}
      <Modal show={showUpdateModal} onHide={handleUpdateModalClose} centered>
        <form onSubmit={handleRequestUpdateProduct}>
          <Modal.Header closeButton>
            <Modal.Title>Update Product</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-1">
              <h6>Name</h6>
              <input
                className="form-control"
                type="text"
                id="newprodName"
                name="newprodName"
                defaultValue={defaultProduct.prodName}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setUpdatedProduct((prevProduct) => ({
                    ...prevProduct,
                    prodName: newValue,
                  }));
                }}
                placeholder="Enter Updated Name"
                required
              />
            </div>
            <div className="form-group p-1">
              <h6>Details</h6>
              <input
                className="form-control"
                type="text"
                id="newprodDetails"
                name="newprodDetails"
                defaultValue={defaultProduct.prodDetails}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setUpdatedProduct((prevProduct) => ({
                    ...prevProduct,
                    prodDetails: newValue,
                  }));
                }}
                placeholder="Enter Updated Details"
                required
              />
            </div>
            <select
              className="form-select"
              id="newprodContainer"
              name="newprodContainer"
              defaultValue={updatedProduct.prodContainer}
              onChange={(e) => {
                const selectedIndex = e.target.value;
                const selectedContainer = container[selectedIndex];
                setUpdatedProduct({
                  ...updatedProduct,
                  prodContainer: selectedContainer.containerId,
                  containerName: selectedContainer.containerName,
                });
              }}
              required
            >
              <option value="" disabled>
                Select a container
              </option>
              {container.map((option, index) => (
                <option key={option.containerId} value={index}>
                  {option.containerName}
                </option>
              ))}
            </select>
          </Modal.Body>

          <Modal.Footer>
            <Button type="submit" variant="primary">
              Request Update
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/*MODAL FOR CONFIRM MODAL*/}
      <Modal
        show={showConfirmModal}
        onHide={handleConfirmModalClose}
        centered
        style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
      >
        <Modal.Header>
          <Modal.Title>Confirming</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <label>Confirm purchase this product?</label>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleConfirmModalClose}>
            Cancel
          </Button>
          <Button variant="success" onClick={handlePostRequest}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProductU;

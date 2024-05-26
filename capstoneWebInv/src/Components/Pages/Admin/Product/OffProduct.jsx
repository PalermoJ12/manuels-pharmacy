import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import apiUrl from "../../../Config/config";
import style from "./Product.module.css";

import { Modal, Button } from "react-bootstrap";
import { Pagination } from "react-bootstrap";

const pageSize = 8;

//icons
import { AiOutlineArrowLeft } from "react-icons/ai";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineDelete } from "react-icons/md";
import { FaSort } from "react-icons/fa";

import Product from "./Product";
import { toast } from "react-toastify";

const OffProduct = () => {
  const [presentPage, setShowPresentPage] = useState("offProduct");

  //Add Product
  const [showAddModal, setShowAddModal] = useState(false);
  const handleAddModalOpen = () => {
    setShowAddModal(true);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
  };

  //Update Product
  const [showUpdateProduct, setShowUpdateModal] = useState(false);
  const handleUpdateModalOpen = () => {
    setShowUpdateModal(true);
  };

  const handleUpdateModalClose = () => {
    setShowUpdateModal(false);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDeleteModalOpen = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
  };

  const [loading, setLoading] = useState(false);

  /*Requesting all product from the database*/

  const [data, setData] = useState([]);
  const [newData, setNewData] = useState([]);
  useEffect(() => {
    getAllProduct();
    fetchUnitList();
    fetchUser();
  }, [data]);
  const [Name, setName] = useState("");
  axios.defaults.withCredentials = true;
  const fetchUser = () => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setName(res.data.name);
        }
      })
      .catch((err) => console.log(err));
  };

  //Get all product

  const getAllProduct = () => {
    axios.get(`${apiUrl}/getProductOffInventory`).then((res) => {
      if (res.data.Status === "Success") {
        setData(res.data.Message);
        setLoading(true);
      } else {
        toast.error(res.data.Error);
      }
    });
  };

  const handleAddNewProduct = () => {
    const newProductData = { ...newData, userName: Name };
    axios
      .post(`${apiUrl}/addNewProduct`, newProductData)
      .then((res) => {
        if (res.data.Status === "Success") {
          getAllProduct();
          toast.success("Successfully added.  ");
          setNewData([]);
          handleAddModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [selectedProduct, setSelectedProduct] = useState([]);

  const handleUpdate = () => {
    const newUpdate = { ...selectedProduct, userName: Name };
    axios
      .put(`${apiUrl}/updateOffInventory/${selectedProduct.prodId}`, newUpdate)
      .then((res) => {
        if (res.data.Status === "Success") {
          getAllProduct();
          toast.success("Updated successfully.");
          handleUpdateModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleDelete = () => {
    const newDelete = { ...selectedProduct, userName: Name };
    axios
      .delete(`${apiUrl}/deleteProduct/${selectedProduct.prodId}`, newDelete)
      .then((res) => {
        if (res.data.Status === "Success") {
          getAllProduct();
          toast.success("Deleted successfully.");
          handleDeleteModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };
  //For product unit
  const [unitList, setUnitList] = useState([]);
  const [selectedProductUnit, setSelectedProductUnit] = useState("");
  const fetchUnitList = () => {
    axios
      .get(`${apiUrl}/getUnitList`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setUnitList(res.data.Message);
        } else {
          toast.warning(res.data.Error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const [searchName, setSearchName] = useState("");
  const [sorting, setSorting] = useState({
    column: "prodName",
    order: "asc",
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

  const filteredData = data.filter((item) => {
    const name = item.prodName.toLowerCase();
    const prodDetails = item.prodDetails.toLowerCase();
    const prodUnit = item.prodUnitName.toLowerCase();
    const searchValue = searchName.toLowerCase();
    return (
      name.includes(searchValue) ||
      prodDetails.includes(searchValue) ||
      prodUnit.includes(searchValue)
    );
  });

  const column = sorting.column;

  const sortedData = [...filteredData].sort((a, b) => {
    const compareValues = (aValue, bValue) => {
      return sorting.order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    };

    const compareNumeric = (aValue, bValue) => {
      return sorting.order === "asc" ? aValue - bValue : bValue - aValue;
    };

    const getColumnValue = (item, col) => {
      const value = item[col];
      if (
        col === "prodName" ||
        col === "prodUnitName" ||
        col === "prodDetails"
      ) {
        return String(value).toLowerCase();
      } else if (col === "buyingPrice") {
        return typeof value === "string"
          ? parseFloat(value.replace(/[^0-9.]/g, "")) || 0
          : value || 0;
      }
      return value;
    };

    // Define column order for sorting
    const columnOrder = [
      "prodName",
      "prodUnitName",
      "prodDetails",
      "buyingPrice",
    ];

    for (const col of columnOrder) {
      const aValue = getColumnValue(a, col);
      const bValue = getColumnValue(b, col);

      console.log(`aValue(${col}): ${aValue}, bValue(${col}): ${bValue}`);

      const result =
        typeof aValue === "string" && typeof bValue === "string"
          ? compareValues(aValue, bValue)
          : compareNumeric(aValue, bValue);

      if (result !== 0) {
        // Break the sorting if values are different
        return result;
      }
    }

    return 0; // Default return if no differences are found
  });

  function offProduct() {
    return (
      <>
        <div className={`${style["unitContainer"]} container-fluid vh-100`}>
          <div className="d-flex justify-content-between mt-3">
            <div className="ms-3">
              <h2 className={style.titlePage}>Off-Inventory</h2>
            </div>
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-success"
                style={{ backgroundColor: "#275733" }}
                onClick={() => {
                  setShowPresentPage("product");
                }}
              >
                <AiOutlineArrowLeft size={15} /> Back to Product
              </button>
            </div>
          </div>
          <hr />
          <div className="d-flex justify-content-between ">
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-success"
                style={{ backgroundColor: "#10451D" }}
                onClick={() => {
                  handleAddModalOpen();
                }}
              >
                Add Product (Off-Inventory)
              </button>
            </div>

            <div className="col-auto">
              <input
                type="text"
                placeholder="Search"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className={`${style.txtbox} form-control`}
              />
            </div>
          </div>

          <div
            className={`${style.LegendContainer} mt-4 d-flex justify-content-end align-items-center`}
          >
            <div className="me-2 d-flex justify-content-center align-items-center">
              <label className={`${style.lblLegend}`}>LEGEND:</label>
            </div>

            <div
              className={`${style.LUpdate} me-1  d-flex justify-content-center align-items-center`}
            >
              <label className={`${style.lblNlegend}`}>Update Product</label>
            </div>
            <div
              className={`${style.LDelete} d-flex justify-content-center align-items-center `}
            >
              <label className={`${style.lblNlegend}`}>Delete Product</label>
            </div>
          </div>

          {loading ? (
            <div className={`${style["table-container"]} mt-4`}>
              {sortedData.length > 0 ? (
                <table
                  className={`${style.tblProduct} table caption-top table-borderless table-hover`}
                >
                  <caption>
                    List of Product: {data[0].rowCountPerProduct} Products
                  </caption>
                  <thead>
                    <tr>
                      <th
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSort("prodName")}
                      >
                        Name
                        {sorting.column === "prodName" && (
                          <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                        )}
                      </th>
                      <th style={{ cursor: "pointer" }}>Details</th>
                      <th>Buying Price</th>
                      <th>Unit </th>
                      <th>Action </th>
                    </tr>
                  </thead>

                  <tbody>
                    {sortedData.map((item, index) => {
                      return (
                        <tr key={index}>
                          <td>{item.prodName}</td>
                          <td>{item.prodDetails}</td>
                          <td>{item.buyingPrice}</td>
                          <td>{item.prodUnitName}</td>
                          <td>
                            <button
                              className="btn btn-primary me-2 my-2"
                              onClick={() => {
                                setSelectedProduct(item);
                                handleUpdateModalOpen();
                              }}
                            >
                              <BiSolidEditAlt />
                            </button>
                            <button
                              className="btn btn-danger me-2 my-2"
                              onClick={() => {
                                setSelectedProduct(item);
                                handleDeleteModalOpen();
                              }}
                            >
                              <MdOutlineDelete />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div> Can't find the product. </div>
              )}
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </div>

        {/* MODAL FOR ADD PRODUCT */}
        <Modal show={showAddModal} onHide={handleAddModalClose} centered>
          {/*<form onSubmit={handleAddProduct}>*/}
          <Modal.Header closeButton>
            <Modal.Title>Add Product</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-1">
              <h6>Name</h6>
              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="prodName"
                name="prodName"
                onChange={(e) =>
                  setNewData({ ...newData, prodName: e.target.value })
                }
                placeholder="Enter Name"
                required
              />
            </div>
            <div className="form-group p-1">
              <h6>Details</h6>
              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="prodDetails"
                name="prodDetails"
                onChange={(e) =>
                  setNewData({ ...newData, prodDetails: e.target.value })
                }
                placeholder="Enter Details"
                required
              />
            </div>

            <div className="form-group p-1">
              <h6>Buying Price</h6>
              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="buyingPrice"
                name="buyingPrice"
                onChange={(e) =>
                  setNewData({ ...newData, buyingPrice: e.target.value })
                }
                placeholder="Enter Buying Price"
                required
              />
            </div>

            <div className="form-group p-1">
              <h6>Select Product Unit</h6>
              <select
                className={`${style.txtbox} form-select`}
                id="unitForm"
                name="unit"
                onChange={(e) =>
                  setNewData({ ...newData, prodUnitId: e.target.value })
                }
                required
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

            <div className="p-2 d-flex justify-content-end">
              <Button
                type="submit"
                onClick={handleAddNewProduct}
                variant="success"
              >
                Save
              </Button>
            </div>
          </Modal.Body>
          {/*</form>*/}
        </Modal>

        {/* MODAL FOR UPDATE PRODUCT UNIT */}

        <Modal
          show={showUpdateProduct}
          onHide={handleUpdateModalClose}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Update Product</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-1">
              <h6>Name</h6>
              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="prodName"
                name="prodName"
                defaultValue={selectedProduct.prodName}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    prodName: e.target.value,
                  })
                }
                placeholder="Enter Name"
                required
              />
            </div>
            <div className="form-group p-1">
              <h6>Details</h6>
              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="prodDetails"
                name="prodDetails"
                defaultValue={selectedProduct.prodDetails}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    prodDetails: e.target.value,
                  })
                }
                placeholder="Enter Details"
                required
              />
            </div>

            <div className="form-group p-1">
              <h6>Buying Price</h6>
              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="buyingPrice"
                name="buyingPrice"
                defaultValue={selectedProduct.buyingPrice}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    buyingPrice: e.target.value,
                  })
                }
                placeholder="Enter Buying Price"
                required
              />
            </div>

            <div className="form-group p-1">
              <h6>Select Product Unit</h6>
              <select
                className={`${style.txtbox} form-select`}
                id="unitForm"
                name="unit"
                defaultValue={selectedProduct.prodUnitId}
                onChange={(e) =>
                  setSelectedProduct({
                    ...selectedProduct,
                    prodUnitId: e.target.value,
                  })
                }
                required
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

            <div className="p-2 d-flex justify-content-end">
              <Button type="submit" onClick={handleUpdate} variant="primary">
                Update
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        {/* MODAL FOR DELETE PRODUCT UNIT */}

        <Modal show={showDeleteModal} onHide={handleDeleteModalClose} centered>
          <Modal.Header>
            <Modal.Title>Delete Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="form-group p-1">
              <label>Are you sure want to delete this product?</label>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="d-flex justify-content-end">
              <div className="me-1">
                <Button type="submit" onClick={handleDelete} variant="primary">
                  Yes
                </Button>
              </div>

              <div className="">
                <Button
                  type="submit"
                  variant="danger"
                  onClick={() => {
                    handleDeleteModalClose();
                  }}
                >
                  No
                </Button>
              </div>
            </div>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
  function product() {
    return (
      <>
        <Product />
      </>
    );
  }

  const renderPage = () => {
    if (presentPage === "offProduct") {
      return offProduct();
    } else if (presentPage === "product") {
      return product();
    }
  };
  return <>{renderPage()}</>;
};

export default OffProduct;

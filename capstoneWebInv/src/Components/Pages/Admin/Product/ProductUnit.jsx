import React, { useState, useEffect } from "react";
import style from "./Product.module.css";

import { Button, Modal } from "react-bootstrap";

import Product from "./Product.jsx";

import { AiOutlineArrowLeft } from "react-icons/ai";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineDelete } from "react-icons/md";

import axios from "axios";
import apiUrl from "../../../Config/config";
import { toast } from "react-toastify";

const ProductUnit = () => {
  const [presentPage, setShowPresentPage] = useState("prodUnit");

  const [showAddUnitModal, setShowUnitModal] = useState(false);
  const [showUpdateUnitModal, setShowUpdateUnitModal] = useState(false);
  const [showDeleteUnitModal, setShowDeleteUnitModal] = useState(false);

  //Add Product Unit
  const handleUnitModalOpen = () => {
    setShowUnitModal(true);
  };

  const handleUnitModalClose = () => {
    setShowUnitModal(false);
  };

  //Update Product Unit
  const handleUpdateUnitModalOpen = () => {
    setShowUpdateUnitModal(true);
  };

  const handleUpdateUnitModalClose = () => {
    setShowUpdateUnitModal(false);
  };

  //Delete Product Unit
  const handleDeleteUnitModalOpen = () => {
    setShowDeleteUnitModal(true);
  };

  const handleDeleteUnitModalClose = () => {
    setShowDeleteUnitModal(false);
  };

  const [unitList, setUnitList] = useState([]);
  useEffect(() => {
    getUnitList();
  }, [unitList]);

  const getUnitList = () => {
    axios
      .get(`${apiUrl}/api/getProductUnit`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setUnitList(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [searchUnit, setSearchUnit] = useState("");
  const filteredSearchUnit = unitList.filter((item) => {
    const name = item.prodUnitName.toLowerCase();
    const searchValue = searchUnit.toLowerCase();
    return name.includes(searchValue);
  });

  const [unitData, setUnitData] = useState([]);

  const handleAddUnit = () => {
    event.preventDefault();
    axios
      .post(`${apiUrl}/api/addNewUnit`, unitData)
      .then((res) => {
        if (res.data.Status === "Success") {
          getUnitList();
          toast.success("Successfully Added.");
          handleUnitModalClose();
        } else {
          handleUnitModalClose();
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleUpdate = () => {
    event.preventDefault();
    axios
      .put(`${apiUrl}/api/updateProductUnit`, unitData)
      .then((res) => {
        if (res.data.Status === "Success") {
          getUnitList();
          toast.success("Successfully updated.");
          handleUpdateUnitModalClose();
        } else {
          handleUpdateUnitModalClose();
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleDelete = () => {
    event.preventDefault();
    axios
      .delete(`${apiUrl}/api/deleteProductUnit/${unitData.prodUnitId}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          getUnitList();
          handleDeleteUnitModalClose();
          toast.success("Successfully delete.");
        } else {
          handleDeleteUnitModalClose();
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  function prodUnit() {
    return (
      <>
        <div className={`${style["unitContainer"]} container-fluid vh-100`}>
          <div className="d-flex justify-content-between mt-3">
            <div className="ms-3">
              <h2 className={style.titlePage}>Product Unit</h2>
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
          <div className="d-flex justify-content-between">
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-success"
                style={{ backgroundColor: "#10451D" }}
                onClick={() => {
                  handleUnitModalOpen();
                }}
              >
                Add Product Unit
              </button>
            </div>

            <div className="col-auto">
              <input
                type="text"
                value={searchUnit}
                onChange={(e) => setSearchUnit(e.target.value)}
                placeholder="Search"
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
              <label className={`${style.lblNlegend}`}>
                Update Supplier Info
              </label>
            </div>
            <div
              className={`${style.LDelete} d-flex justify-content-center align-items-center `}
            >
              <label className={`${style.lblNlegend}`}>Archive Supplier</label>
            </div>
          </div>

          <div className={`${style["table-container"]}`}>
            <table
              className={`${style.tblProdUnit} table caption-top table-borderless table-striped`}
            >
              <caption>List of Product Unit</caption>
              <thead>
                <tr>
                  <th>Product Unit Name</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredSearchUnit.map((unit, index) => {
                  return (
                    <tr key={index}>
                      <td>{unit.prodUnitName}</td>
                      <td>
                        <button
                          className="btn btn-primary me-2 my-2"
                          onClick={() => {
                            setUnitData(unit);
                            handleUpdateUnitModalOpen();
                          }}
                        >
                          <BiSolidEditAlt />
                        </button>
                        <button
                          className="btn btn-danger me-2 my-2"
                          onClick={() => {
                            setUnitData(unit);
                            handleDeleteUnitModalOpen();
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
          </div>

          {/* MODAL FOR ADDING PRODUCT UNIT */}

          <Modal show={showAddUnitModal} onHide={handleUnitModalClose} centered>
            <form action="">
              <Modal.Header closeButton>
                <Modal.Title>Add Product Unit</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="form-group p-1">
                  <h6>Product Unit Name</h6>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="text"
                    id="prodUnitName"
                    onChange={(e) => {
                      setUnitData({
                        ...unitData,
                        prodUnitName: e.target.value,
                      });
                    }}
                    placeholder="Enter Product Unit Name"
                    required
                  />
                </div>

                <div className="p-2 d-flex justify-content-end">
                  <Button
                    type="submit"
                    variant="success"
                    onClick={handleAddUnit}
                  >
                    Save
                  </Button>
                </div>
              </Modal.Body>
            </form>
          </Modal>

          {/* MODAL FOR UPDATE PRODUCT UNIT */}

          <Modal
            show={showUpdateUnitModal}
            onHide={handleUpdateUnitModalClose}
            centered
          >
            <form action="">
              <Modal.Header closeButton>
                <Modal.Title>Update Product Unit Name</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="form-group p-1">
                  <h6>Product Unit Name</h6>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="text"
                    id="prodUnitName"
                    defaultValue={unitData.prodUnitName}
                    onChange={(e) => {
                      setUnitData({
                        ...unitData,
                        prodUnitName: e.target.value,
                      });
                    }}
                    placeholder="Enter Update Product Unit Name"
                    required
                  />
                </div>

                <div className="p-2 d-flex justify-content-end">
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={handleUpdate}
                  >
                    Update
                  </Button>
                </div>
              </Modal.Body>
            </form>
          </Modal>

          {/* MODAL FOR DELETE PRODUCT UNIT */}

          <Modal
            show={showDeleteUnitModal}
            onHide={handleDeleteUnitModalClose}
            centered
          >
            <Modal.Header>
              <Modal.Title>Delete Product Unit</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="form-group p-1">
                <label>Are you sure want to delete this product unit?</label>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <div className="d-flex justify-content-end">
                <div className="me-1">
                  <Button
                    type="submit"
                    variant="primary"
                    onClick={handleDelete}
                  >
                    Yes
                  </Button>
                </div>

                <div className="">
                  <Button
                    type="submit"
                    variant="danger"
                    onClick={() => {
                      handleDeleteUnitModalClose();
                    }}
                  >
                    No
                  </Button>
                </div>
              </div>
            </Modal.Footer>
          </Modal>
        </div>
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
    if (presentPage === "prodUnit") {
      return prodUnit();
    } else if (presentPage === "product") {
      return product();
    }
  };

  return (
    <>
      <div>{renderPage()}</div>
    </>
  );
};

export default ProductUnit;

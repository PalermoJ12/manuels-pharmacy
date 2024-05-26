import React, { useState, useEffect } from "react";

import { Button, Modal } from "react-bootstrap";
import { Pagination } from "react-bootstrap";

import { toast } from "react-toastify";

//Action icons
import { VscEye } from "react-icons/vsc";
import { BiSolidEditAlt } from "react-icons/bi";
import {
  MdOutlineSettingsBackupRestore,
  MdNavigateNext,
  MdNavigateBefore,
} from "react-icons/md";
import { LuFolderArchive } from "react-icons/lu";
import { FaSort } from "react-icons/fa";

//Action icon for modal table
import { IoMdAdd } from "react-icons/io";
import style from "./Supplier.module.css";
import apiUrl from "../../../Config/config";
import axios from "axios";

const Supplier = () => {
  //ADD PRODUCT IN OFF INVENTORY AND ALSO IN SUPPLIER
  const [showAddProdModal, setShowAddProdModal] = useState(false);

  //ADD MODAL OPEN AND CLOSE
  const handleAddProdModalOpen = () => {
    setShowAddProdModal(true);
  };

  const handleAddProdModalClose = () => {
    setShowAddProdModal(false);
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAddSupplierProductModal, setShowAddSupplierProductModal] =
    useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showConfirmRemoveProduct, setShowConfirmRemoveProduct] =
    useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddProductModal, setAddProductModal] = useState(false);

  //ADD MODAL OPEN AND CLOSE
  const handleAddModalOpen = () => {
    setShowAddModal(true);
  };

  const handleAddModalClose = () => {
    setShowAddModal(false);
  };

  //ADD PRODUCT TO SUPPLIER MODAL OPEN AND CLOSE
  const handleAddSupplierProductModalOpen = () => {
    fetchProduct();
    setShowAddSupplierProductModal(true);
  };

  const handleAddSupplierProductModalClose = () => {
    setShowAddSupplierProductModal(false);
  };
  //ADD PRODUCT TO SUPPLIER MODAL OPEN AND CLOSE
  const handleConfirmModalOpen = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
  };

  //UPDATE MODAL OPEN AND CLOSE
  const handleUpdateModalOpen = () => {
    setShowUpdateModal(true);
  };

  const handleUpdateModalClose = () => {
    setShowUpdateModal(false);
  };

  //DELETE MODAL OPEN AND CLOSE
  const handleArchiveModalOpen = () => {
    setShowArchiveModal(true);
  };

  const handleArchiveModalClose = () => {
    setShowArchiveModal(false);
  };

  //REMOVE PRODUCT MODAL OPEN AND CLOSE
  const handleConfirmRemoveProductOpen = (index) => {
    setSelectedProductForDelete(index);
    setShowConfirmRemoveProduct(true);
  };

  const handleConfirmRemoveProductClose = () => {
    setShowConfirmRemoveProduct(false);
  };

  //VIEW MODAL OPEN AND CLOSE
  const handleViewModalOpen = (index) => {
    handleViewProductPerSupplier(index);
    setShowViewModal(true);
  };

  const handleViewModalClose = () => {
    setShowViewModal(false);
  };

  //ADD PRODUCT MODAL OPEN AND CLOSE
  const handleAddProductOpen = () => {
    setAddProductModal(true);
  };

  const handleAddProductClose = () => {
    setAddProductModal(false);
  };

  //Archived Account Modal
  const [showArchived, setShowArchivedModal] = useState(false);

  const handleArchivedModalOpen = () => {
    setShowArchivedModal(true);
  };
  const handleArchivedModalClose = () => {
    setShowArchivedModal(false);
  };

  //Restore Account Modal
  const [showRestore, setShowRestoreModal] = useState(false);

  const handleRestoreModalOpen = () => {
    setShowRestoreModal(true);
  };
  const handleRestoreModalClose = () => {
    setShowRestoreModal(false);
  };

  //Search Supplier
  const [searchData, setItemSearch] = useState("");

  //Populating the table with data from database
  const [data, setData] = useState([]);
  useEffect(() => {
    fetchUser();
    fetchSupplier();
    fetchUnitList();
  }, []);

  //For product unit
  const [unitList, setUnitList] = useState([]);
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

  const [newSupplier, setNewSupplier] = useState([]);
  const [productList, setProductList] = useState([]);
  const [addProductToSupplier, setaddProductToSupplier] = useState([
    {
      supplierId: 0,
      productId: 0,
    },
  ]);
  const [productPerSupplier, setproductPerSupplier] = useState([]);
  const [selectedSupplierForProduct, setselectedSupplierForProduct] = useState(
    []
  );
  const [supplierInfo, setSupplierInfo] = useState([]);
  const [selectedProductForDelete, setSelectedProductForDelete] = useState(0);
  useEffect(() => {
    getCurrentDate();
    fetchSupplier();
    if (selectedSupplierForProduct !== 0) {
      fetchProduct(); // Fetch products only if a supplier is selected
    }
  }, [selectedProductForDelete, selectedSupplierForProduct]);

  const [currentDateForNotif, setCurrentDateTime] = useState("");

  const getCurrentDate = () => {
    const interval = setInterval(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1.
      const day = now.getDate().toString().padStart(2, "0");

      const formattedDate = `${month}-${day}-${year}`;
      setCurrentDateTime(formattedDate);
    }, 1000);

    return () => clearInterval(interval);
  };
  const fetchSupplier = () => {
    axios
      .get(`${apiUrl}/getSupplierList`)
      .then((res) => {
        const allSupplierDatga = res.data.Message;
        setData(allSupplierDatga);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchProduct = () => {
    axios
      .get(
        `${apiUrl}/getProductListToSupplier/${selectedSupplierForProduct.suppId}`
      )
      .then((res) => {
        const allProductData = res.data.Message;
        setProductList(allProductData);
      })
      .catch((err) => {
        console.log(err);
      });
  };

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

  const handleAddNewSupplier = (e) => {
    event.preventDefault();

    const SuppData = {
      ...newSupplier,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .post(`${apiUrl}/addNewSupplier`, SuppData)
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Added Succesfully");
          fetchSupplier();
          handleAddModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleUpdateSupplier = (e) => {
    event.preventDefault();

    const updatedSuppData = {
      ...supplierInfo,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .put(
        `${apiUrl}/updateSupplier/${selectedSupplierForProduct.suppId}`,
        updatedSuppData
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Info Update Succesfully");
          fetchSupplier();
          handleUpdateModalClose();
        } else {
          toast.warning(res.data.Error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleAddProductToSupplier = () => {
    axios
      .post(`${apiUrl}/addProductToSupplier`, addProductToSupplier)
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Added Succesfully");
          fetchProduct();
          handleConfirmModalClose();
        } else {
          toast.warning(res.data.Error);
          handleConfirmModalClose();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const [productToSupplier, setProductToSupplier] = useState([]);
  const handleManualAddToSupplier = () => {
    const addSupplier = {
      ...productToSupplier,
      supplierId: addProductToSupplier.supplierId,
    };
    axios.post(`${apiUrl}/addNewProductSupplier`, addSupplier).then((res) => {
      if (res.data.Status === "Success") {
        toast.success("Successfully added");
        handleAddProdModalClose();
      }else{
        toast.error(res.data.Error);
      }
    });
  };

  const handleDeleteProduct = () => {
    const deleteProduct = {
      ...selectedSupplierForProduct,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .put(
        `${apiUrl}/archiveSupplier/${selectedSupplierForProduct.suppId}`,
        deleteProduct
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Supplier Archived Successfully");
          fetchSupplier();
          handleArchiveModalClose();
        } else {
          toast.warning(res.data.Error);
          handleArchiveModalClose();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleRemoveProductFromSupplier = () => {
    axios
      .delete(
        `${apiUrl}/removeProductFromSupplier/${selectedSupplierForProduct.suppId}/${selectedProductForDelete}`
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Product removed from supplier successfully");
          handleViewProductPerSupplier(selectedSupplierForProduct.suppId);
          handleConfirmRemoveProductClose();
        } else {
          console.log(res.data);
          toast.warning(res.data.Error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleViewProductPerSupplier = (supplierId) => {
    axios
      .get(`${apiUrl}/productsBySupplier/${supplierId}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setproductPerSupplier(res.data.Message);
        } else {
          toast.warning(res.data.Error);
          handleConfirmModalClose();
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const [supplierArchive, setSupplierArchive] = useState([]);
  const handleViewArchives = () => {
    axios
      .get(`${apiUrl}/getSupplierArchived`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setSupplierArchive(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [restoreSupplier, setRestoreSupplier] = useState([]);
  const [searchArchive, setSearchArchive] = useState("");
  const filteredSupplier = supplierArchive.filter((data) => {
    const supplierName = data.suppName.toLowerCase();
    const supplierContact = data.suppContactPerson.toLowerCase();
    const searchValue = searchArchive.toLowerCase();
    return (
      supplierName.includes(searchValue) ||
      supplierContact.includes(searchValue)
    );
  });
  const handleRestore = () => {
    const updateRestore = {
      ...restoreSupplier,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .put(`${apiUrl}/restoreSupplier/${restoreSupplier.suppId}`, updateRestore)
      .then((res) => {
        if (res.data.Status === "Success") {
          fetchSupplier();
          toast.success("Successfully restored.");
          handleArchivedModalClose();
          handleRestoreModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [searchProduct, setFilterProduct] = useState("");
  const filterProducts = productList.filter((data) => {
    const prodName = data.prodName.toLowerCase();
    const prodDetails = data.prodDetails.toLowerCase();
    const searchValue = searchProduct.toLowerCase();
    return prodName.includes(searchValue) || prodDetails.includes(searchValue);
  });

  const [searchProductSupplier, setSearchProductSupplier] = useState("");
  const filterProductSupplier = productPerSupplier.filter((data) => {
    const prodName = data.prodName.toLowerCase();
    const prodDetails = data.prodDetails.toLowerCase();
    const searchValue = searchProductSupplier.toLowerCase();
    return prodName.includes(searchValue) || prodDetails.includes(searchValue);
  });

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

  const [currentPage, setCurrentPage] = useState(1);
  const [searchSupplier, setSearchSupplier] = useState("");

  // Initialize filterSupplier outside the if block
  let filterSupplier = [];
  filterSupplier = data.filter((item) => {
    const supplierName = item.suppName.toLowerCase();
    const contactPerson = item.suppContactPerson.toLowerCase();
    const searchValue = searchSupplier.toLowerCase();
    return (
      supplierName.includes(searchValue) || contactPerson.includes(searchValue)
    );
  });

  // Declare sortedData here
  const sortedData = [...filterSupplier].sort((a, b) => {
    const comparison = a[sortedField] > b[sortedField] ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const pageSize = 8;

  // Calculate the total number of pages based on the filtered and sorted data
  const totalPages = Math.ceil(filterSupplier.length / pageSize);

  // Ensure that the current page is within the valid range
  const validCurrentPage = Math.min(currentPage, totalPages);

  // Calculate the range of items to display for the current page
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Slice the filterSupplier array to display only the items for the current page
  const currentPageData = filterSupplier.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pagesToShow = 5;
    const pages = [];
    let startPage = Math.max(1, validCurrentPage - Math.floor(pagesToShow / 2));

    for (let i = 0; i < pagesToShow && startPage + i <= totalPages; i++) {
      pages.push(startPage + i);
    }

    return pages;
  };

  return (
    <>
      {/*MODAL FOR ADD SUPPLIER*/}
      <Modal show={showAddModal} onHide={handleAddModalClose} centered>
        <form>
          <Modal.Header closeButton>
            <Modal.Title>Add a Supplier</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-1">
              <h6>Supplier Name</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="text"
                id="suppName"
                placeholder="Enter Supplier Name"
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, suppName: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group p-1">
              <h6>Contact Person</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="text"
                id="suppContactPerson"
                placeholder="Enter Contact Person"
                onChange={(e) =>
                  setNewSupplier({
                    ...newSupplier,
                    suppContactPerson: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group p-1">
              <h6>Address</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="text"
                id="suppAddr"
                placeholder="Enter Supplier Address"
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, suppAddr: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group p-1">
              <h6>Contact No</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="number"
                id="suppContact"
                placeholder="Enter Contact No"
                onChange={(e) =>
                  setNewSupplier({
                    ...newSupplier,
                    suppContactNumber: e.target.value,
                  })
                }
                required
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="submit"
              variant="success"
              onClick={handleAddNewSupplier}
            >
              Save
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
      {/*MODAL FOR UPDATE SUPPLIER*/}
      <Modal show={showUpdateModal} onHide={handleUpdateModalClose} centered>
        <form>
          <Modal.Header closeButton>
            <Modal.Title>Update Supplier Info</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-2">
              <h6>Supplier Name</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="text"
                id="suppNameUpdate"
                placeholder="Update Supplier Name"
                defaultValue={supplierInfo.suppName}
                onChange={(e) =>
                  setSupplierInfo({ ...supplierInfo, suppName: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group p-2">
              <h6>Contact Person</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="text"
                id="suppContactPersonUpdate"
                placeholder="Update Contact Person"
                defaultValue={supplierInfo.suppContactPerson}
                onChange={(e) =>
                  setSupplierInfo({
                    ...supplierInfo,
                    suppContactPerson: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group p-2">
              <h6>Address</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="text"
                id="suppAddrUpdate"
                placeholder="Update Supplier Address"
                defaultValue={supplierInfo.suppAddr}
                onChange={(e) =>
                  setSupplierInfo({ ...supplierInfo, suppAddr: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group p-2">
              <h6>Contact</h6>
              <input
                className={`${style["search-input"]} form-control`}
                type="number"
                id="suppContactUpdate"
                placeholder="Update Contact No"
                defaultValue={supplierInfo.suppContactNumber}
                onChange={(e) =>
                  setSupplierInfo({
                    ...supplierInfo,
                    suppContactNumber: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="p-2 d-flex justify-content-end">
              <Button
                type="submit"
                variant="primary"
                onClick={handleUpdateSupplier}
              >
                Update
              </Button>
            </div>
          </Modal.Body>
        </form>
      </Modal>
      {/*MODAL FOR ARCHIVING SUPPLIER*/}
      <Modal show={showArchiveModal} onHide={handleArchiveModalClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Archive Supplier</Modal.Title>
        </Modal.Header>

        <Modal.Body>Are you sure you want to archive this supplier?</Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleDeleteProduct}>
            Yes
          </Button>

          <Button variant="danger" onClick={handleArchiveModalClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
      {/*MODAL FOR VIEW PRODUCT*/}
      <Modal
        show={showViewModal}
        onHide={handleViewModalClose}
        dialogClassName={style["custom-modal"]}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Supplier Products</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {" "}
          <div className="d-flex">
            <div className="col">
              <input
                type="text"
                placeholder="Search Product"
                value={searchProductSupplier}
                onChange={(e) => setSearchProductSupplier(e.target.value)}
                className={`${style["search-input"]} form-control`}
              />
            </div>
          </div>
          <div className={`${style["table-container-modal"]} mt-4`}>
            <table
              className={`${style.tblProduct} table caption-top table-borderless table-striped`}
            >
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Details</th>
                  <th>Unit</th>
                  <th>Buying Price</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filterProductSupplier.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td>{item.prodName}</td>
                      <td>{item.prodDetails}</td>
                      <td>{item.prodUnitName}</td>
                      <td>{item.buyingPrice}</td>
                      <td>
                        <button
                          className="btn btn-danger me-2 my-2"
                          onClick={() => {
                            console.log(item);
                            handleConfirmRemoveProductOpen(item.prodId);
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
          </div>
        </Modal.Body>
      </Modal>
      {/*MODAL FOR REMOVING PRODUCT FROM SUPPLIER*/}
      <Modal
        show={showConfirmRemoveProduct}
        centered
        style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Remove Product</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          Are you sure you want to remove this product here?
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleRemoveProductFromSupplier}>
            Yes
          </Button>

          <Button variant="danger" onClick={handleConfirmRemoveProductClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
      {/*MODAL FOR ADDING A PRODUCT TO SUPPLIER*/}
      <Modal
        show={showAddSupplierProductModal}
        onHide={handleAddSupplierProductModalClose}
        dialogClassName={style["custom-modal"]}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add Product in Supplier</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {" "}
          <div className="d-flex justify-content-between">
            <div className="w-100 d-flex justify-content-between">
              <div>
                <button
                  className="btn btn-success"
                  onClick={handleAddProdModalOpen}
                >
                  Add Product
                </button>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  className={`${style["search-input"]} form-control`}
                />
              </div>
            </div>
          </div>
          <div className={`${style["table-container-modal"]} mt-4`}>
            <table
              className={`${style.tblProduct} table caption-top table-borderless table-striped`}
            >
              <caption>List of Product</caption>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Details</th>
                  <th>Buying Price</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filterProducts.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td>{item.prodName}</td>
                      <td>{item.prodDetails}</td>
                      <td>{item.buyingPrice}</td>
                      <td>
                        {" "}
                        <button
                          className="btn btn-success my-2"
                          onClick={() => {
                            setaddProductToSupplier({
                              ...addProductToSupplier,
                              productId: item.prodId,
                            });
                            handleConfirmModalOpen();
                          }}
                        >
                          <IoMdAdd />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={showAddProdModal}
        onHide={handleAddProdModalClose}
        style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
        centered
      >
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
                setProductToSupplier({
                  ...productToSupplier,
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
              onChange={(e) =>
                setProductToSupplier({
                  ...productToSupplier,
                  prodDetails: e.target.value,
                })
              }
              id="prodDetails"
              name="prodDetails"
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
                setProductToSupplier({
                  ...productToSupplier,
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
              onChange={(e) =>
                setProductToSupplier({
                  ...productToSupplier,
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
              ````````
            </select>
          </div>

          <div className="p-2 d-flex justify-content-end">
            <Button
              type="submit"
              variant="success"
              onClick={handleManualAddToSupplier}
            >
              Save
            </Button>
          </div>
        </Modal.Body>
      </Modal>
      {/*MODAL FOR CONFIRIMING ADDING A PRODUCT TO SUPPLIER*/}
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
          Do you want to add this product in this Supplier?
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleAddProductToSupplier}>
            Yes
          </Button>

          <Button variant="danger" onClick={handleConfirmModalClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
      {/*MODAL FOR ADD PRODUCT*/}
      <Modal show={showAddProductModal} onHide={handleAddProductClose} centered>
        <form>
          <Modal.Header closeButton>
            <Modal.Title>Add Product</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-1">
              <input
                className="form-control"
                type="text"
                id="sprodName"
                placeholder="Product Name"
                required
              />
            </div>

            <div className="form-group p-1">
              <input
                className="form-control"
                type="text"
                id="sprodDetails"
                placeholder="Product Details"
                required
              />
            </div>

            <div className="form-group p-1">
              <input
                className="form-control"
                type="text"
                id="sprodBuyPrice"
                placeholder="Buy Price"
                required
              />
            </div>

            <div className="form-group p-1">
              <input
                className="form-control"
                type="text"
                id="sprodSellPrice"
                placeholder="Selling Price"
                required
              />
            </div>

            <div className="form-group p-1">
              <input
                className="form-control"
                type="text"
                id="sprodContainer"
                placeholder="Container"
                required
              />
            </div>

            <div className="form-group p-1">
              <input
                className="form-control"
                type="text"
                id="sprodDateAdded"
                placeholder="Date Added"
                required
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button type="submit" variant="success">
              Add Product in Supplier
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <div className={`${style.cardSupplier} container-fluid vh-100`}>
        <div className="d-flex justify-content-between">
          <div className="mt-3 ms-2 col-auto">
            <button
              type="button"
              className="btn btn-success me-2"
              style={{ backgroundColor: "#10451D" }}
              onClick={() => {
                handleAddModalOpen();
              }}
            >
              Add a Supplier
            </button>

            <button
              type="button"
              className="btn btn-danger"
              style={{ backgroundColor: "#7C1E27" }}
              onClick={() => {
                handleViewArchives();
                handleArchivedModalOpen();
              }}
            >
              Archived Suppliers
            </button>
          </div>
          <div className="m-4 col-auto">
            <input
              type="text"
              placeholder="Search"
              value={searchSupplier}
              onChange={(e) => setSearchSupplier(e.target.value)}
              className={`${style["search-input"]} form-control`}
            />
          </div>
        </div>

        <div
          className={`${style.LegendContainer} me-3 d-flex justify-content-end align-items-center`}
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
              Update Supplier Info
            </label>
          </div>
          <div
            className={`${style.LDelete} me-1  d-flex justify-content-center align-items-center `}
          >
            <label className={`${style.lblNlegend}`}>Archive Supplier</label>
          </div>
          <div
            className={`${style.LAdd} me-1  d-flex justify-content-center align-items-center `}
          >
            {" "}
            <label className={`${style.lblNlegend}`}>
              Add Product in Supplier
            </label>
          </div>
        </div>

        <div className={`${style["table-container"]} m-4`}>
          <table
            className={`${style.tblSupplier} table caption-top table-borderless table-hover`}
          >
            <caption> List of Supplier</caption>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("suppName")}
                  style={{ cursor: "pointer" }}
                >
                  Supplier Name <FaSort />
                </th>
                <th
                  onClick={() => handleSort("suppContactPerson")}
                  style={{ cursor: "pointer" }}
                >
                  Contact Person <FaSort />
                </th>
                <th
                  onClick={() => handleSort("suppAddr")}
                  style={{ cursor: "pointer" }}
                >
                  Supplier Address <FaSort />
                </th>
                <th
                  onClick={() => handleSort("suppContactNumber")}
                  style={{ cursor: "pointer" }}
                >
                  Contact <FaSort />
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => {
                return (
                  <tr key={index}>
                    <td>{item.suppName}</td>
                    <td>{item.suppContactPerson}</td>
                    <td>{item.suppAddr}</td>
                    <td>{item.suppContactNumber} </td>

                    <td>
                      <button
                        className="btn btn-dark me-2 my-2"
                        onClick={() => {
                          setselectedSupplierForProduct({
                            ...selectedSupplierForProduct,
                            suppId: item.suppId,
                          });
                          handleViewModalOpen(item.suppId);
                        }}
                      >
                        <VscEye />
                      </button>
                      <button
                        className="btn btn-primary me-2 my-2"
                        onClick={() => {
                          setSupplierInfo({
                            ...supplierInfo,
                            suppName: item.suppName,
                            suppContactPerson: item.suppContactPerson,
                            suppAddr: item.suppAddr,
                            suppContactNumber: item.suppContactNumber,
                          });

                          setselectedSupplierForProduct({
                            ...selectedSupplierForProduct,
                            suppId: item.suppId,
                          });
                          handleUpdateModalOpen();
                        }}
                      >
                        <BiSolidEditAlt />
                      </button>
                      <button
                        className="btn btn-danger me-2 my-2"
                        onClick={() => {
                          setselectedSupplierForProduct({
                            ...selectedSupplierForProduct,
                            suppId: item.suppId,
                            suppName: item.suppName,
                          });
                          handleArchiveModalOpen();
                        }}
                      >
                        <LuFolderArchive />
                      </button>

                      <button
                        className="btn btn-success my-2"
                        onClick={() => {
                          setselectedSupplierForProduct({
                            ...selectedSupplierForProduct,
                            suppId: item.suppId,
                          });
                          setaddProductToSupplier({
                            ...handleAddProductToSupplier,
                            supplierId: item.suppId,
                          });
                          handleAddSupplierProductModalOpen(item.suppId);
                        }}
                      >
                        <IoMdAdd />
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

      {/*Modal List of Archived Suppliers */}

      <Modal
        dialogClassName={style["custom-modal"]}
        show={showArchived}
        onHide={handleArchivedModalClose}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Archived Suppliers</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column justify-content-center align-items-center">
            <div className="w-100">
              <input
                type="text"
                placeholder="Search"
                value={searchArchive}
                onChange={(e) => setSearchArchive(e.target.value)}
                className={`${style["search-input"]} form-control`}
              />
            </div>

            <div className={`${style["table-archive"]} w-100 mt-4`}>
              <table
                className={`${style.tblArchive} table caption-top table-borderless table-striped`}
              >
                <caption> List of Archived Suppliers</caption>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Contact Person</th>
                    <th>Address</th>
                    <th>Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupplier.map((data, index) => {
                    return (
                      <tr key={index}>
                        <td>{data.suppName}</td>
                        <td>{data.suppContactPerson}</td>
                        <td>{data.suppAddr}</td>
                        <td>{data.suppContactNumber}</td>
                        <td>
                          <button
                            className="btn my-2"
                            style={{
                              color: "#fff",
                              backgroundColor: "#6C5F5B",
                            }}
                            onClick={() => {
                              setRestoreSupplier({
                                ...restoreSupplier,
                                suppId: data.suppId,
                                suppName: data.suppName,
                              });
                              handleRestoreModalOpen();
                            }}
                          >
                            <MdOutlineSettingsBackupRestore
                              size={22}
                              className="me-1"
                            />
                            Restore
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/*RESTORE YES/NO */}
      <Modal
        show={showRestore}
        style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
        centered
      >
        <Modal.Header>
          <Modal.Title>Restoring Supplier</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>Do you want to restore this supplier?</div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary me-1" onClick={handleRestore}>
            Yes
          </button>
          <button className="btn btn-danger" onClick={handleRestoreModalClose}>
            No
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Supplier;

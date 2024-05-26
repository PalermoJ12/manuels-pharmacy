import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import apiUrl from "../../../Config/config";
import style from "./Product.module.css";

import { Modal, Button } from "react-bootstrap";

import { AiOutlineArrowLeft } from "react-icons/ai";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";

//toast
import { toast } from "react-toastify";

import Product from "./Product";

const ArchivedProducts = () => {
  const [presentPage, setShowPresentPage] = useState("archivedProduct");

  //Restore Account Modal
  const [showRestore, setShowRestoreModal] = useState(false);

  const handleRestoreModalOpen = () => {
    setShowRestoreModal(true);
  };
  const handleRestoreModalClose = () => {
    setShowRestoreModal(false);
  };

  const [currentDateForNotif, setCurrentDateTime] = useState("");

  const [data, setData] = useState([]);
  useEffect(() => {
    handleGetArchived();
    fetchUser();
    const interval = setInterval(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Months are 0-indexed, so add 1.
      const day = now.getDate().toString().padStart(2, "0");

      const formattedDate = `${month}-${day}-${year}`;
      setCurrentDateTime(formattedDate);
    }, 1000);

    return () => clearInterval(interval);
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

  const [archiveRestore, setArchiveRestore] = useState([]);
  const handleRestoreProduct = () => {
    const updatedProductData = {
      ...archiveRestore,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .put(
        `${apiUrl}/restoreProductNotExpire/${archiveRestore.batchNumber}`,
        updatedProductData
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          handleGetArchived();
          toast.success("Successfully Restored.");
          handleRestoreModalClose();
        } else {
          handleRestoreModalClose();
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [archiveProducts, setArchiveProducts] = useState([]);
  const [searchArchive, setSearchArchive] = useState("");
  const filteredAccounts = archiveProducts.filter((data) => {
    const productName = data.prodName.toLowerCase();
    const productDetails = data.prodDetails.toLowerCase();

    const productContainer = data.containerName.toLowerCase();
    const searchValue = searchArchive.toLowerCase();
    return (
      productName.includes(searchValue) ||
      productDetails.includes(searchValue) ||
      productContainer.includes(searchValue)
    );
  });
  const handleGetArchived = () => {
    axios
      .get(`${apiUrl}/getArchivedProductsData`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setArchiveProducts(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleArchiveExpiredProducts = () => {
    axios.put(`${apiUrl}/ArchiveAllExpiredProducts/${Name}`).then((res) => {
      if (res.data.Status !== "Success") {
        console.log(res.data.Error);
      }
    });
  };

  function archivedProduct() {
    return (
      <div className={`${style["unitContainer"]} container-fluid vh-100`}>
        <div className="d-flex justify-content-between mt-3">
          <div className="ms-3">
            <h2 className={style.titlePage}>Archived Products</h2>
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
        <div className="d-flex justify-content-end ">
          <div className="col-auto">
            <input
              type="text"
              placeholder="Search"
              value={searchArchive}
              onChange={(e) => setSearchArchive(e.target.value)}
              className={`${style.txtbox} form-control`}
            />
          </div>
        </div>

        <div className={`${style["table-container"]}`}>
          <table
            className={`${style.tblArchive} table caption-top table-borderless table-striped`}
          >
            <caption>List of Archived Products</caption>
            <thead>
              <tr>
                <th>Name</th>
                <th>Details</th>
                <th>Container</th>
                <th>Supplier</th>
                <th>Stock(Qty)</th>
                <th>Date Expired</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((data, index) => {
                const currentDate = new Date();
                const expiryDate = data.earliestExpiryDate;

                const formattedExpiryDate = currentDate.toLocaleDateString(
                  "en-CA",
                  {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }
                );

                // Compare the expiry date with the current date
                const isExpired = expiryDate <= formattedExpiryDate;

                return (
                  <tr key={index}>
                    <td>{data.prodName}</td>
                    <td>{data.prodDetails}</td>
                    <td>{data.containerName}</td>
                    <td>{data.supplierName}</td>
                    <td>{data.prodQty}</td>
                    <td>{data.earliestExpiryDate}</td>
                    <td>{isExpired ? "Expired" : "Inactive"}</td>
                    <td>
                      <button
                        className="btn btn-info my-2"
                        style={{ color: "#fff" }}
                        onClick={() => {
                          setArchiveRestore({
                            ...archiveRestore,
                            batchNumber: data.batchNumber,
                            prodName: data.prodName,
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

        {/*RESTORE YES/NO */}
        <Modal
          show={showRestore}
          style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
          centered
        >
          <Modal.Header>
            <Modal.Title>Restoring Product</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>Do you want to restore this product?</div>
          </Modal.Body>
          <Modal.Footer>
            <button
              className="btn btn-primary me-1"
              onClick={handleRestoreProduct}
            >
              Yes
            </button>
            <button
              className="btn btn-danger"
              onClick={handleRestoreModalClose}
            >
              No
            </button>
          </Modal.Footer>
        </Modal>
      </div>
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
    if (presentPage === "archivedProduct") {
      return archivedProduct();
    } else if (presentPage === "product") {
      return product();
    }
  };

  return <>{renderPage()}</>;
};

export default ArchivedProducts;

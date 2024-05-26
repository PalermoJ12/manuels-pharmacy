import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { Button, Modal } from "react-bootstrap";
import { Pagination } from "react-bootstrap";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";

import { FaSort } from "react-icons/fa";

import { VscEye } from "react-icons/vsc";
import { LuFolderArchive } from "react-icons/lu";
import { toast } from "react-toastify";
import QRCode from "qrcode";
import style from "./ContainerU.module.css";
import apiUrl from "../../../Config/config";
const Container = () => {
  // QR CODE

  const [qrcode, setQrcode] = useState("");
  const [conId, setContainerId] = useState();
  const GenerateQRCode = () => {
    QRCode.toDataURL(
      conId,
      { width: 100, margin: 2, color: { dark: "#10451D" } },
      (err, conId) => {
        if (err) return console.error(err);
        setQrcode(conId);
      }
    );
  };

  const generateContainerId = () => {
    const randomNum = Math.floor(Math.random() * 10000); // Generate a random number between 0 and 999
    const newContainerId = "1001" + randomNum; // Combine the static text "SALES" with the timestamp and random number
    setContainerId(newContainerId);
  };

  useEffect(() => {
    fetchUser();
    if (conId) {
      GenerateQRCode();
    }
  }, [conId]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showViewModal, setShowViewrModal] = useState(false);

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

  const handleArchiveModalOpen = () => {
    setShowArchiveModal(true);
  };

  const handleArchiveModalClose = () => {
    setShowArchiveModal(false);
  };

  const handleViewModalOpen = () => {
    setSearchQuery("");
    setProductSearch([""]);
    setShowViewrModal(true);
  };

  const handleViewModalClose = () => {
    setSearchQuery("");
    setProductSearch([""]);
    setShowViewrModal(false);
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

  //Search product
  const [searchProduct, setProductSearch] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [containerData, setContainerData] = useState([]);

  //Populating the table with data from database
  const [data, setData] = useState([]);
  useEffect(() => {
    handleGetDate();
    fetchData();
  }, []);
  const [currentDateForNotif, setCurrentDateTime] = useState("");

  const handleGetDate = () => {
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

  const fetchData = () => {
    axios
      .get(`${apiUrl}/manageContainer`)
      .then((res) => {
        const allData = res.data[0].Message;
        setData(allData);
        updateCurrentPage(currentPageNumber, allData);
      })
      .catch((err) => console.log(err));
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

  //This is for adding new container
  const [values, setValue] = useState({
    containerName: "",
    containerDetails: "",
  });

  const handleAddContainer = (e) => {
    e.preventDefault();

    axios
      .post(`${apiUrl}/manageContainer`, {
        ...values,
        containerId: conId,
        containerImg: qrcode,
        userName: Name,
        dateNotif: currentDateForNotif,
      })
      .then((res) => {
        if (res.data.Message === "Success") {
          handleAddModalClose();
          toast.success(`Container added successfully`, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });
          fetchData();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  //this is for getting the data of selected container
  const [selectedContainerData, setSelectedData] = useState([]);
  const [containerCount, setContainerCount] = useState(0);
  //For updating the container data
  const handleUpdate = (e) => {
    e.preventDefault();
    const newContainerData = {
      ...selectedContainerData,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .put(
        `${apiUrl}/manageContainer/` + selectedContainerData.containerId,
        newContainerData
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          handleUpdateModalClose();
          toast.success(`Container has been updated!`, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });
          fetchData();
        } else {
          toast.error(res.data.Error, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });
        }
      })
      .catch((err) => console.log(err));
  };

  //For Archiving container
  const [archiveValue, setArchive] = useState({
    containerId: 0,
    isArchive: 0,
    isConfirm: false,
  });

  const [notifForArchive, setNotifForArchive] = useState([]);
  const handleArchive = () => {
    event.preventDefault();

    const containerId = archiveValue.containerId;
    const newNotif = {
      ...notifForArchive,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .get(`${apiUrl}/manageContainer/getProduct/${containerId}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleArchiveModalClose();
          toast.error(`Can't Archive: Product exist in this container`, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });
        } else {
          axios
            .put(`${apiUrl}/manageContainer/Archiving/${containerId}`, {
              ...archiveValue,
              newNotif,
            })
            .then((res) => {
              if (res.data.Status === "Success") {
                handleArchiveModalClose();
                toast.success(`Container archive successfully.`, {
                  position: "bottom-left",
                  autoClose: 5000,
                  hideProgressBar: true,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: 0,
                  theme: "light",
                });
                fetchData();
              }
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => console.log(err));
  };

  //For getting the archived containers
  const [archiveContainers, setArchiveContainers] = useState([]);
  const [searchArchive, setSearchArchive] = useState("");
  const filteredAccounts = archiveContainers.filter((data) => {
    const containerName = data.containerName.toLowerCase();
    const containerDetails = data.containerDetails.toLowerCase();
    const searchValue = searchArchive.toLowerCase();
    return (
      containerName.includes(searchValue) ||
      containerDetails.includes(searchValue)
    );
  });
  const getArchiveContainers = () => {
    axios
      .get(`${apiUrl}/getArchivedContainers`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setArchiveContainers(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };
  const [containerRestore, setContainerRestore] = useState([]);

  const handleRestoreContainer = () => {
    const newContainerRestore = {
      ...containerRestore,
      userName: Name,
      dateNotif: currentDateForNotif,
    };
    axios
      .put(
        `${apiUrl}/manageContainer/Restoring/${containerRestore.containerId}`,
        newContainerRestore
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          fetchData();
          toast.success("Successfully restored.");
          handleArchivedModalClose();
          handleRestoreModalClose();
        }
      });
  };
  //For getting the product under container

  const [product, setProduct] = useState([]);
  const getProduct = (id) => {
    const containerId = id;
    axios
      .get(`${apiUrl}/manageContainer/getProduct/${containerId}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setProduct(res.data.Message);
          setContainerCount(res.data.Message.length);
        } else {
          handleViewModalClose();
          toast.error("No Product Detected");
        }
      })
      .catch((err) => console.log(err));
  };

  //For searching & sorting product
  const [searchData, setItemSearch] = useState("");
  const filteredContainer = data.filter((container) => {
    const caseLower = searchData.toLowerCase();

    const containerName = container.containerName.toLowerCase();
    const containerDetails = container.containerDetails.toLowerCase();

    return (
      containerName.includes(caseLower) || containerDetails.includes(caseLower)
    );
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

  const sortedData = [...filteredContainer].sort((a, b) => {
    const comparison = a[sortedField] > b[sortedField] ? 1 : -1;
    return sortDirection === "desc" ? comparison : -comparison;
  });

  const pageSize = 8;

  // Use the following state to keep track of the current page
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate the total number of pages based on the filtered and sorted data
  const totalPages = Math.ceil(filteredContainer.length / pageSize);

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

  function renderContainer() {
    return (
      <>
        <div className="mt-3 mx-2 d-flex justify-content-between">
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

        

        {/* CONTAINER TABLE */}
        <div className={`${style["table-container"]} mt-4`} >
          <table
            className={`${style.tblContainer} table caption-top table-borderless table-striped`}
           >
            <caption> List of Shelves</caption>
            <thead>
              <tr>
                <th
                  onClick={() => handleSort("containerName")}
                  style={{ cursor: "pointer" }}
                >
                  Shelve Name <FaSort />
                </th>
                <th
                  onClick={() => handleSort("containerDetails")}
                  style={{ cursor: "pointer" }}
                >
                  Shelve Details <FaSort />
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPageData.map((container, index) => {
                return (
                  <tr key={index}>
                    <td>{container.containerName}</td>
                    <td>{container.containerDetails}</td>

                    <td>
                      <button
                        className="btn btn-dark me-2 my-2"
                        onClick={(e) => {
                          getProduct(container.containerId);
                          setContainerData(container);
                          handleViewModalOpen();
                        }}
                      >
                        <VscEye /> See Products
                      </button>
                    </td>

                    
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="d-flex justify-content-start align-items-center w-100">
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

        {/* CONTAINER TABLE ENDS HERE */}
      </>
    );
  }

  return (
    <>
      <div className={`${style.container} container-fluid vh-100`}>
        {renderContainer()}
      </div>

      {/*MODAL FOR VIEW CONTAINER*/}
      <Modal
        show={showViewModal}
        onHide={handleViewModalClose}
        dialogClassName={style["custom-modal"]}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Shelve Items</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="w-100 d-flex flex-column justify-content-center align-items-center">
            <img src={containerData.containerImg} style={{ height: "200px" }} />

            <div className="mb-2 d-flex flex-column justify-content-center">
              {containerData.containerImg && (
                <>
                  <a
                    href={containerData.containerImg}
                    className="btn btn-dark"
                    download={
                      containerData.containerName + containerData.containerName
                    }
                  >
                    Download QR
                  </a>
                </>
              )}
            </div>
          </div>
          <div className="d-flex justify-content-center">
            <div className="col">
              <input
                type="text"
                placeholder="Search Product"
                onChange={(e) => {
                  const searchQuery = e.target.value.toLowerCase();
                  setSearchQuery(searchQuery);
                  const filtered = product.filter((item) =>
                    Object.values(item).some((value) =>
                      value.toString().toLowerCase().includes(searchQuery)
                    )
                  );
                  setProductSearch(filtered); // Corrected this line
                }}
                className={`${style["search-input-modal"]} form-control`}
              />
            </div>
          </div>
          <div className="w-100 mt-2 d-flex justify-content-end">
            <h6 className={style.txt}>No. Of Product : {containerCount}</h6>
          </div>
          <div className={`${style["table-container-modal"]} mt-2`}>
            <table
              className={`${style.tblProduct} table caption-top table-borderless table-striped`}
            >
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Details</th>
                  <th>
                    <div className="d-flex flex-column">
                      <label>Qty</label>
                      <label className={style.lblmmddyyyy}>(Piece)</label>
                    </div>
                  </th>
                  <th>Unit</th>
                </tr>
              </thead>

              <tbody>
                {(searchQuery ? searchProduct : product).map((item, index) => (
                  <tr key={index}>
                    <td>{item.prodName}</td>
                    <td>{item.prodDetails}</td>
                    <td>{item.totalRemainingQty}</td>
                    <td>{item.prodUnitName}</td>
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

export default Container;

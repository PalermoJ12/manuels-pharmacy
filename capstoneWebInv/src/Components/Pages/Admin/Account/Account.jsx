import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Modal } from "react-bootstrap";
import { BiSolidEditAlt } from "react-icons/bi";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { IoMdTrash } from "react-icons/io";

import { LuFolderArchive } from "react-icons/lu";
import { toast } from "react-toastify";

import apiUrl from "../../../Config/config";

import style from "./Account.module.css";

const Account = () => {
  const [presentPage, setPresentPage] = useState("renderAccount");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  const handleDeleteModalOpen = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
  };

  const [showAddRole, setShowAddRole] = useState(false);

  const handleAddRoleOpen = () => {
    setShowAddRole(true);
  };

  const handleAddRoleClose = () => {
    setShowAddRole(false);

    setRoleValues({
      roleName: "",
      dashboardAdmin: 0,
      posAdmin: 0,
      accountManagement: 0,
      productManagement: 0,
      shelvesManagement: 0,
      purchaseManagement: 0,
      supplierManagement: 0,
      reportManagement: 0,
      requestManagement: 0,
      returnManagement: 0,
      dashboardUser: 0,
      posUser: 0,
      productManagementUser: 0,
      shelvesManagementUser: 0,
      requestManagementUser: 0,
    });

    // Optionally, you can also reset the selectAll state if needed
    setSelectAll(false);
  };

  const [showUpdateRole, setShowUpdateRole] = useState(false);

  const handleUpdateRoleOpen = () => {
    setShowUpdateRole(true);
  };

  const handleUpdateRoleClose = () => {
    setShowUpdateRole(false);

    setRoleValues({
      roleName: "",
      dashboardAdmin: 0,
      posAdmin: 0,
      accountManagement: 0,
      productManagement: 0,
      shelvesManagement: 0,
      purchaseManagement: 0,
      supplierManagement: 0,
      reportManagement: 0,
      requestManagement: 0,
      returnManagement: 0,
      dashboardUser: 0,
      posUser: 0,
      productManagementUser: 0,
      shelvesManagementUser: 0,
      requestManagementUser: 0,
    });

    // Optionally, you can also reset the selectAll state if needed
    setSelectAllUp(false);
  };

  const [showDelRole, setShowDelRole] = useState(false);

  const handleDelRoleOpen = () => {
    setShowDelRole(true);
  };

  const handleDelRoleClose = () => {
    setShowDelRole(false);
  };

  //Archived Account Modal
  const [showArchived, setShowArchivedModal] = useState(false);

  const handleArchivedModalOpen = () => {
    setShowArchivedModal(true);
  };
  const handleArchivedModalClose = () => {
    setShowArchivedModal(false);
  };

  //get current date
  const [currentDate, setCurrentDateTime] = useState("");

  useEffect(() => {
    getCurrentDate();
  }, []);

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

  //Restore Account Modal
  const [showRestore, setShowRestoreModal] = useState(false);

  const handleRestoreModalOpen = () => {
    setShowRestoreModal(true);
  };
  const handleRestoreModalClose = () => {
    setShowRestoreModal(false);
  };

  const [confirmPass, setConfirmPass] = useState(false);

  const [data, setData] = useState([]);
  useEffect(() => {
    fetchUser();
    fetchAccount();
    fetchRoles();
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

  const fetchAccount = () => {
    axios
      .get(`${apiUrl}/accountManage`)
      .then((res) => {
        const allData = res.data.Message;
        setData(allData);
      })
      .catch((err) => console.log(err));
  };

  const handleAccType = (index) => {
    if (index === 0) {
      return "Pharmacist";
    } else if (index === 1) {
      return "Admin";
    }
    return "Undefined";
  };

  const [values, setValues] = useState({
    username: "",
    password: "",
    accountType: 0,
  });

  const handleAddUser = (e) => {
    e.preventDefault();
    const newValues = { ...values, userName: Name, dateNotif: currentDate };
    if (confirmPass) {
      axios
        .post(`${apiUrl}/accountManage`, newValues)
        .then((res) => {
          if (res.data.Status === "Success") {
            handleAddModalClose();
            f;
            toast.success(`New account added successfully`, {
              position: "bottom-left",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: 0,
              theme: "light",
            });
            fetchAccount();
            setConfirmPass(false);
          } else {
            toast.error(res.data.Error);
          }
        })
        .catch((err) => toast.error(err));
    } else {
      toast.error(`Password does not match`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
        theme: "light",
      });
    }
  };

  const [selectedUserData, setSelectedUserData] = useState([]);

  const handleUpdate = (e) => {
    e.preventDefault();
    if (confirmPass) {
      const newSelectedUserData = {
        ...selectedUserData,
        userName: Name,
        dateNotif: currentDate,
      };
      axios
        .put(`${apiUrl}/accountManage/`, newSelectedUserData)
        .then((res) => {
          if (res.data.Status === "Success") {
            setShowUpdateModal(false);
            setConfirmPass(false);
            toast.success(`Account has been updated!`, {
              position: "bottom-left",
              autoClose: 5000,
              hideProgressBar: true,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: 0,
              theme: "light",
            });
            fetchAccount();
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
    } else {
      toast.error("Password does not match");
    }
  };

  const [deleteValue, setDeleteValue] = useState({
    accountId: 0,
  });

  const handleDelete = (e) => {
    e.preventDefault();
    const id = deleteValue.accountId;
    const newDelete = { ...deleteValue, userName: Name };
    axios
      .put(`${apiUrl}/accountManage/${id}`, newDelete)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleDeleteModalClose();
          toast.success(`Account archived successfully.`, {
            position: "bottom-left",
            autoClose: 5000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: 0,
            theme: "light",
          });
          fetchAccount();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const [archiveAccounts, setArchiveAccounts] = useState([]);
  const [searchArchive, setSearchArchive] = useState("");
  const filteredAccounts = archiveAccounts.filter((data) => {
    const username = data.username.toLowerCase();
    const searchValue = searchArchive.toLowerCase();
    return username.includes(searchValue);
  });
  const handleGetArchives = () => {
    axios
      .get(`${apiUrl}/getArchivedAccounts`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setArchiveAccounts(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };
  const [restore, setRestore] = useState([]);
  const handleRestoreArchived = () => {
    const newRestore = { ...restore, userName: Name, dateNotif: currentDate };
    axios
      .post(`${apiUrl}/restoreArchived`, newRestore)
      .then((res) => {
        console.log(res.data.Status);
        if (res.data.Status === "Success") {
          fetchAccount();
          handleRestoreModalClose();
          handleArchivedModalClose();
          toast.success("Successfully Restored.");
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [searchData, setSearchData] = useState("");

  const filteredAcc = data.filter((users) => {
    const searchValue = searchData.toLowerCase();
    const name = users.username.toLowerCase();
    const accountType = handleAccType(users.accountType).toLocaleLowerCase();

    return name.includes(searchValue) || accountType.includes(searchValue);
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
    column: "username",
    order: "asc",
  });

  const sortedData = filteredAcc.sort((a, b) => {
    const column = sorting.column;

    if (column) {
      const aValue =
        column === "username"
          ? a[column].toLowerCase() // No need for parseFloat for strings
          : typeof a[column] === "string"
          ? a[column].toLowerCase()
          : a[column];

      const bValue =
        column === "username"
          ? b[column].toLowerCase() // No need for parseFloat for strings
          : typeof b[column] === "string"
          ? b[column].toLowerCase()
          : b[column];

      if (aValue < bValue) return sorting.order === "asc" ? -1 : 1;
      if (aValue > bValue) return sorting.order === "asc" ? 1 : -1;
    }

    return 0;
  });

  const [rolesList, setRolesList] = useState([]);
  const fetchRoles = () => {
    axios
      .get(`${apiUrl}/getRoles`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setRolesList(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleAddRole = () => {
    axios
      .post(`${apiUrl}/addNewRole`, rolesValues)
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Added new role");
          setRoleValues({
            ...rolesValues,
            roleName: "",
            dashboardAdmin: 0,
            posAdmin: 0,
            accountManagement: 0,
            productManagement: 0,
            shelvesManagement: 0,
            purchaseManagement: 0,
            supplierManagement: 0,
            reportManagement: 0,
            requestManagement: 0,
            returnManagement: 0,
            dashboardUser: 0,
            posUser: 0,
            productManagementUser: 0,
            shelvesManagementUser: 0,
            requestManagementUser: 0,
          });
          handleAddRoleClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const updateRoleData = () => {
    axios
      .put(`${apiUrl}/updateRole`, roleData)
      .then((res) => {
        if (res.data.Status === "Success") {
          fetchRoles();
          toast.success("Updated a role");
          handleUpdateRoleClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const deleteRole = (roleId) => {
    axios
      .delete(`${apiUrl}/removeRoles/${roleId}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          fetchRoles();
          toast.success("Role removed");
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [selectAll, setSelectAll] = useState(false);

  const [rolesValues, setRoleValues] = useState({
    roleName: "",
    dashboardAdmin: 0,
    posAdmin: 0,
    accountManagement: 0,
    productManagement: 0,
    shelvesManagement: 0,
    purchaseManagement: 0,
    supplierManagement: 0,
    reportManagement: 0,
    requestManagement: 0,
    returnManagement: 0,
    dashboardUser: 0,
    posUser: 0,
    productManagementUser: 0,
    shelvesManagementUser: 0,
    requestManagementUser: 0,
  });

  

  const handleSelectAllChange = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);

    const updatedRolesValues = {
      roleName: "",
      dashboardAdmin: newSelectAll ? 1 : 0,
      posAdmin: newSelectAll ? 1 : 0,
      accountManagement: newSelectAll ? 1 : 0,
      productManagement: newSelectAll ? 1 : 0,
      shelvesManagement: newSelectAll ? 1 : 0,
      purchaseManagement: newSelectAll ? 1 : 0,
      supplierManagement: newSelectAll ? 1 : 0,
      reportManagement: newSelectAll ? 1 : 0,
      requestManagement: newSelectAll ? 1 : 0,
      returnManagement: newSelectAll ? 1 : 0,
      dashboardUser: newSelectAll ? 1 : 0,
      posUser: newSelectAll ? 1 : 0,
      productManagementUser: newSelectAll ? 1 : 0,
      shelvesManagementUser: newSelectAll ? 1 : 0,
      requestManagementUser: newSelectAll ? 1 : 0,
    };

    // If unselecting all, set all checkboxes to unchecked
    if (!newSelectAll) {
      setRoleValues({
        roleName: "",
        dashboardAdmin: 0,
        posAdmin: 0,
        accountManagement: 0,
        productManagement: 0,
        shelvesManagement: 0,
        purchaseManagement: 0,
        supplierManagement: 0,
        reportManagement: 0,
        requestManagement: 0,
        returnManagement: 0,
        dashboardUser: 0,
        posUser: 0,
        productManagementUser: 0,
        shelvesManagementUser: 0,
        requestManagementUser: 0,
      });
    } else {
      setRoleValues(updatedRolesValues);
    }
  };

  const handleCheckboxChange = (role, isChecked) => {
    setRoleValues((prevValues) => ({
      ...prevValues,
      [role]: isChecked ? 1 : 0,
    }));

    // Check if any checkbox is unchecked
    const anyUnchecked = Object.values({
      ...rolesValues,
      [role]: isChecked ? 1 : 0,
    }).some((value) => value === 0);

    setSelectAll(!anyUnchecked);
  };

  const [selectAllUp, setSelectAllUp] = useState(false);

  const [roleData, setRoleData] = useState({});
  const [isAllCheck, setIsAllChecked] = useState(false);
  
  const checkIfAllCheck = () => {
    const { roleName, ...rest } = roleData;
    const allValues = Object.values(rest).slice(1); // Exclude the first value
  
    let isAllChecked = true;
  
    for (const value of allValues) {
      if (value !== 1) {
        isAllChecked = false;
        setSelectAllUp(false);
       
        break;
      }
    }
   
    
    setIsAllChecked(isAllChecked);
    setSelectAllUp(isAllChecked);
  };
  
  useEffect(() => {
    checkIfAllCheck();
  }, [roleData]);
  
  
  const handleSelectAllChangeUp = () => {
    const newSelectAll = !selectAllUp;
    setSelectAllUp(newSelectAll);

    const updatedRolesValues = {
      roleId: roleData.roleId,
      roleName: roleData.roleName,
      dashboardAdmin: newSelectAll ? 1 : 0,
      adminPos: newSelectAll ? 1 : 0,
      accountManagement: newSelectAll ? 1 : 0,
      productManagement: newSelectAll ? 1 : 0,
      shelvesManagement: newSelectAll ? 1 : 0,
      purchaseManagement: newSelectAll ? 1 : 0,
      supplierManagement: newSelectAll ? 1 : 0,
      reportManagement: newSelectAll ? 1 : 0,
      requestManagement: newSelectAll ? 1 : 0,
      returnManagement: newSelectAll ? 1 : 0,
      dashboardUser: newSelectAll ? 1 : 0,
      userPos: newSelectAll ? 1 : 0,
      productManagementUser: newSelectAll ? 1 : 0,
      shelvesManagementUser: newSelectAll ? 1 : 0,
      requestManagementUser: newSelectAll ? 1 : 0,
    };

    // If unselecting all, set all checkboxes to unchecked
    if (!newSelectAll) {
      setRoleData({
        roleId: roleData.roleId,
        roleName: roleData.roleName,
        dashboardAdmin: 0,
        adminPos: 0,
        accountManagement: 0,
        productManagement: 0,
        shelvesManagement: 0,
        purchaseManagement: 0,
        supplierManagement: 0,
        reportManagement: 0,
        requestManagement: 0,
        returnManagement: 0,
        dashboardUser: 0,
        userPos: 0,
        productManagementUser: 0,
        shelvesManagementUser: 0,
        requestManagementUser: 0,
      });
    } else {
      setRoleData(updatedRolesValues);
    }
  };

  const handleCheckboxChangeUp = (role, isChecked) => {
    setRoleData((prevValues) => ({
      ...prevValues,
      [role]: isChecked ? 1 : 0,
    }));

    // Check if any checkbox is unchecked
    const anyUnchecked = Object.values({
      ...roleData,
      [role]: isChecked ? 1 : 0,
    }).some((value) => value === 0);

    setSelectAllUp(!anyUnchecked);
  };

  function renderAccount() {
    return (
      <>
        <div className={`${style.container} container-fluid vh-100`}>
          <div className="mt-3 mx-2 d-flex justify-content-between">
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-success me-2"
                style={{ backgroundColor: "#10451D" }}
                onClick={() => {
                  setConfirmPass(false);
                  handleAddModalOpen();
                }}
              >
                Add an Account
              </button>

              <button
                type="button"
                className="btn btn-danger me-2"
                style={{ backgroundColor: "#7C1E27" }}
                onClick={() => {
                  setConfirmPass(false);
                  handleGetArchives();
                  handleArchivedModalOpen();
                }}
              >
                Archived Accounts
              </button>

              <button
                type="button"
                style={{ color: "white" }}
                className="btn btn-dark"
                onClick={() => {
                  setPresentPage("renderRole");
                }}
              >
                Manage Role
              </button>
            </div>

            <div className="col-auto">
              <input
                type="text"
                placeholder="Search"
                value={searchData}
                onChange={(e) => setSearchData(e.target.value)}
                className={`${style.txtbox} form-control`}
              />
            </div>
          </div>

          <div
            className={`${style.LegendContainer} mt-4 mx-2 d-flex justify-content-end align-items-center`}
          >
            <div className="me-2 d-flex justify-content-center align-items-center">
              <label className={`${style.lblLegend}`}>LEGEND:</label>
            </div>

            <div
              className={`${style.LUpdate} me-1 d-flex justify-content-center align-items-center`}
            >
              <label className={`${style.lblNlegend}`}>Update Account</label>
            </div>
            <div
              className={`${style.LDelete} d-flex justify-content-center align-items-center `}
            >
              <label className={`${style.lblNlegend}`}>Archive Account</label>
            </div>
          </div>

          {/* ACCOUNT TABLE */}
          <div className={`${style["table-container"]} mt-4 `}>
            <table
              className={`${style.tblAccount} table caption-top table-borderless table-hover`}
            >
              <caption> List of Account</caption>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("username")}
                    style={{ cursor: "pointer" }}
                  >
                    Name
                    {sorting.column === "username" && (
                      <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("accountType")}
                    style={{ cursor: "pointer" }}
                  >
                    Account Role
                    {sorting.column === "accountType" && (
                      <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((users, index) => {
                  return (
                    <tr key={index}>
                      <td>{users.username}</td>
                      <td>{users.roleName}</td>
                      <td>
                        <button
                          className="btn btn-primary me-2 my-2 "
                          onClick={() => {
                            setSelectedUserData(users);

                            setConfirmPass(false);
                            handleUpdateModalOpen();
                          }}
                        >
                          <BiSolidEditAlt />
                        </button>
                        <button
                          className="btn btn-danger my-2"
                          onClick={() => {
                            setDeleteValue({
                              ...deleteValue,
                              accountId: users.acc_Id,
                              username: users.username,
                            });

                            handleDeleteModalOpen();
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

          {/* ACCOUNT TABLE ENDS HERE */}

          {/*MODAL FOR ADD ACCOUNT*/}
          <Modal show={showAddModal} onHide={handleAddModalClose} centered>
            <form onSubmit={handleAddUser}>
              <Modal.Header closeButton>
                <Modal.Title>Add an Account</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="form-group p-1">
                  <div>
                    <h6>Username</h6>
                  </div>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="text"
                    id="newUser"
                    name="newUser"
                    placeholder="Enter Username"
                    onChange={(e) =>
                      setValues({ ...values, username: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group p-1">
                  <div>
                    <h6>Password</h6>
                  </div>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    placeholder="Enter Password"
                    onChange={(e) =>
                      setValues({ ...values, password: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group p-1">
                  <div>
                    <h6>Confirm Password</h6>
                  </div>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="password"
                    id="checkPass"
                    name="checkPass"
                    placeholder="Re-type Password"
                    onChange={(e) => {
                      if (e.target.value !== "") {
                        if (e.target.value === values.password) {
                          setConfirmPass(true);
                        } else {
                          setConfirmPass(false);
                        }
                      }
                    }}
                    required
                  />
                </div>

                <div className="form-group p-1">
                  <div>
                    <h6>Account Role</h6>
                  </div>
                  <select
                    className={`${style.txtbox} form-select`}
                    name="userType"
                    id="userType"
                    onChange={(e) =>
                      setValues({ ...values, roleId: e.target.value })
                    }
                  >
                    {/* Map rolesList data to populate options */}
                    {rolesList.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-2 d-flex justify-content-end">
                  <Button type="submit" variant="success">
                    Save
                  </Button>
                </div>
              </Modal.Body>
            </form>
          </Modal>

          {/*MODAL FOR UPDATE ACCOUNT*/}
          <Modal
            show={showUpdateModal}
            onHide={handleUpdateModalClose}
            centered
          >
            <form onSubmit={handleUpdate}>
              <Modal.Header closeButton>
                <Modal.Title>Update an Account</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="form-group p-1">
                  <div>
                    <h6>Update Username</h6>
                  </div>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="text"
                    id="existingusername"
                    name="existingusername"
                    defaultValue={selectedUserData.username}
                    onChange={(e) =>
                      setSelectedUserData({
                        ...selectedUserData,
                        username: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group p-1">
                  <div>
                    <h6>Update Password</h6>
                  </div>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="password"
                    id="updatedpassword"
                    name="password"
                    onChange={(e) =>
                      setSelectedUserData({
                        ...selectedUserData,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter Update Password"
                    required
                  />
                </div>

                <div className="form-group p-1">
                  <div>
                    <h6>Confirm Update Password</h6>
                  </div>
                  <input
                    className={`${style.txtbox} form-control`}
                    type="password"
                    id="conpassword"
                    name="conpassword"
                    onChange={(e) => {
                      if (e.target.value === selectedUserData.password) {
                        setConfirmPass(true);
                      } else {
                        setConfirmPass(false);
                      }
                    }}
                    placeholder="Re-type Password"
                    required
                  />
                </div>
                {/* Inside your JSX */}
                <div className="form-group p-1">
                  <div>
                    <h6>Update Role</h6>
                  </div>
                  <select
                    className={`${style.txtbox} form-select`}
                    name="userType"
                    id="updatedUserType"
                    value={selectedUserData.roleId}
                    onChange={(e) =>
                      setSelectedUserData({
                        ...selectedUserData,
                        roleId: e.target.value,
                      })
                    }
                    required
                  >
                    {/* Map rolesList data to populate options */}
                    {rolesList.map((role) => (
                      <option key={role.roleId} value={role.roleId}>
                        {role.roleName}
                      </option>
                    ))}
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
          {/*MODAL FOR DELETE ACCOUNT*/}
          <Modal
            show={showDeleteModal}
            onHide={handleDeleteModalClose}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Archive Account</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              Are you sure you want to archive this account?
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="primary"
                onClick={(e) => {
                  handleDelete(e);
                }}
              >
                Yes
              </Button>

              <Button variant="danger" onClick={handleDeleteModalClose}>
                No
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal
            dialogClassName={style["modalArchive"]}
            show={showArchived}
            onHide={handleArchivedModalClose}
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Archived Accounts</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="d-flex flex-column justify-content-center align-items-center">
                <div className="w-100">
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchArchive}
                    onChange={(e) => setSearchArchive(e.target.value)}
                    className={`${style.txtbox} form-control`}
                  />
                </div>

                <div className={`${style["table-container"]} w-100 mt-4`}>
                  <table
                    className={`${style.tblAccount} table caption-top table-borderless table-striped`}
                  >
                    <caption> List of Archived Accounts</caption>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Account Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((data, index) => {
                        return (
                          <tr key={index}>
                            <td>{data.username}</td>
                            <td>{data.roleName}</td>
                            <td>
                              <button
                                className="btn btn-info my-2"
                                style={{ color: "#fff" }}
                                onClick={() => {
                                  handleRestoreModalOpen();
                                  setRestore({
                                    ...restore,
                                    acc_Id: data.acc_Id,
                                    username: data.username,
                                  });
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
              <Modal.Title>Restoring an Account</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div>Do you want to restore this account?</div>
            </Modal.Body>
            <Modal.Footer>
              <button
                className="btn btn-primary me-1"
                onClick={() => {
                  handleRestoreArchived();
                }}
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
      </>
    );
  }

  function renderRole() {
    return (
      <>
        <div className={`${style.container} container-fluid vh-100`}>
          <div className="d-flex justify-content-between">
            <div className="ms-4 mt-4">
              <h2 style={{ fontWeight: "700" }}>Manage Role</h2>
            </div>
            <div className="col-auto">
              <div className="mt-4 me-4 p-0">
                <button
                  className="btn btn-success"
                  style={{ backgroundColor: "#10451D" }}
                  onClick={() => {
                    setPresentPage("renderAccount");
                  }}
                >
                  <AiOutlineArrowLeft size={15} /> Back to Account
                </button>
              </div>
            </div>
          </div>

          <hr />

          <div className="mt-3 mx-2 d-flex justify-content-between">
            <div className="col-auto">
              <button
                type="button"
                className="btn btn-success me-2"
                style={{ backgroundColor: "#10451D" }}
                onClick={() => {
                  handleAddRoleOpen();
                }}
              >
                Add New Role
              </button>
            </div>

            <div className="col-auto">
              <input
                type="text"
                placeholder="Search"
                value={searchData}
                onChange={(e) => setSearchData(e.target.value)}
                className={`${style.txtbox} form-control`}
              />
            </div>
          </div>

          <div className={`${style["table-container"]} mt-4 `}>
            <table className={`${style.tblRole} table caption-top table-hover`}>
              <caption> List of Role</caption>
              <thead>
                <tr>
                  <th
                    onClick={() => handleSort("username")}
                    style={{ cursor: "pointer" }}
                  >
                    Name
                    {sorting.column === "username" && (
                      <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("accountType")}
                    style={{ cursor: "pointer" }}
                  >
                    Access
                    {sorting.column === "accountType" && (
                      <span>{sorting.order === "asc" ? "↑" : "↓"}</span>
                    )}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rolesList.map((data, index) => {
                  return (
                    <tr key={index}>
                      <td>{data.roleName}</td>
                      <td>
                        {data.dashboardAdmin === 1 ? (
                          <div>Dashboard (Admin)</div>
                        ) : (
                          <div hidden>Dashboard (Admin)</div>
                        )}
                        {data.adminPos === 1 ? (
                          <div>POS (Admin)</div>
                        ) : (
                          <div hidden>POS (Admin)</div>
                        )}
                        {data.accountManagement === 1 ? (
                          <div>Account Management</div>
                        ) : (
                          <div hidden>Account Management</div>
                        )}
                        {data.productManagement === 1 ? (
                          <div>Product Management</div>
                        ) : (
                          <div hidden>Product Management</div>
                        )}
                        {data.shelvesManagement === 1 ? (
                          <div>Shelves Management (Admin) </div>
                        ) : (
                          <div hidden>Shelves Management (Admin)</div>
                        )}
                        {data.purchaseManagement === 1 ? (
                          <div>Purchase Management </div>
                        ) : (
                          <div hidden>Purchase Management </div>
                        )}
                        {data.supplierManagement === 1 ? (
                          <div>Supplier Management </div>
                        ) : (
                          <div hidden>Supplier Management </div>
                        )}
                        {data.reportManagement === 1 ? (
                          <div>Report Management </div>
                        ) : (
                          <div hidden>Report Management </div>
                        )}
                        {data.requestManagement === 1 ? (
                          <div>Request Management </div>
                        ) : (
                          <div hidden>Request Management </div>
                        )}
                        {data.returnManagement === 1 ? (
                          <div>Return Management </div>
                        ) : (
                          <div hidden>Return Management </div>
                        )}
                        {data.dashboardUser === 1 ? (
                          <div>Dashboard (User) </div>
                        ) : (
                          <div hidden>Dashboard(User) </div>
                        )}
                        {data.userPos === 1 ? (
                          <div>POS (User) </div>
                        ) : (
                          <div hidden>POS (User) </div>
                        )}
                        {data.productManagementUser === 1 ? (
                          <div>Product Management (User) </div>
                        ) : (
                          <div hidden>Product Management (User) </div>
                        )}
                        {data.shelvesManagementUser === 1 ? (
                          <div>Shelves Management (User) </div>
                        ) : (
                          <div hidden>Shelves Management (User) </div>
                        )}
                        {data.requestManagementUser === 1 ? (
                          <div>Request Management (User) </div>
                        ) : (
                          <div hidden>Request Management (User) </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-primary me-2 my-2 "
                          onClick={() => {
                            handleUpdateRoleOpen();
                            setRoleData(data);
                            checkIfAllCheck();
                          }}
                        >
                          <BiSolidEditAlt />
                        </button>
                        <button
                          className="btn btn-danger my-2"
                          onClick={() => {
                            handleDelRoleOpen();
                            setRoleData(data);
                          }}
                        >
                          <IoMdTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FOR ROLE (ADD/UPDATE/DELETE) */}

        {/*MODAL FOR ADD ROLE*/}
        <Modal show={showAddRole} onHide={handleAddRoleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Assign Role</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-1">
              <div>
                <h6>Role Name</h6>
              </div>
              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="newUser"
                name="newUser"
                placeholder="Enter Role Name"
                onChange={(e) =>
                  setRoleValues({ ...rolesValues, roleName: e.target.value })
                }
                required
              />
            </div>

            <div className="mt-4 d-flex flex-column justify-content-start">
              <h2>Access</h2>

              <div className="d-flex">
                <button
                  className={`btn ${selectAll ? "btn-danger" : "btn-primary"}`}
                  onClick={handleSelectAllChange}
                >
                  {selectAll ? "Unselect All" : "Select All"}
                </button>
              </div>

              <div className="d-flex w-100 mt-4">
                <div className="d-flex flex-column w-100">
                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange("dashboardAdmin", e.target.checked)
                      }
                      checked={rolesValues.dashboardAdmin === 1}
                    />
                    Dashboard (Admin)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      id="allCheckBox"
                      className="me-1"
                      onChange={(e) =>
                        handleCheckboxChange("posAdmin", e.target.checked)
                      }
                      checked={rolesValues.posAdmin === 1}
                    />
                    Point of Sales (Admin)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "accountManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.accountManagement === 1}
                    />
                    Account Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "productManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.productManagement === 1}
                    />
                    Product Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "shelvesManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.shelvesManagement === 1}
                    />
                    Shelves Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "purchaseManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.purchaseManagement === 1}
                    />
                    Purchase Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "supplierManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.supplierManagement === 1}
                    />
                    Supplier Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "reportManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.reportManagement === 1}
                    />
                    Report
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "requestManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.requestManagement === 1}
                    />
                    Request Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      id="allCheckBox"
                      className="me-1"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "returnManagement",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.returnManagement === 1}
                    />
                    Return Item
                  </label>
                </div>

                <div className="d-flex flex-column w-100">
                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange("dashboardUser", e.target.checked)
                      }
                      checked={rolesValues.dashboardUser === 1}
                    />
                    Dashboard (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange("posUser", e.target.checked)
                      }
                      checked={rolesValues.posUser === 1}
                    />
                    Point Of Sales (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "productManagementUser",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.productManagementUser === 1}
                    />
                    Product Management (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "shelvesManagementUser",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.shelvesManagementUser === 1}
                    />
                    Shelves Management (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChange(
                          "requestManagementUser",
                          e.target.checked
                        )
                      }
                      checked={rolesValues.requestManagementUser === 1}
                    />
                    Request Management (User)
                  </label>
                </div>
              </div>
            </div>

            <div className="p-2 d-flex justify-content-end">
              <Button type="submit" variant="success" onClick={handleAddRole}>
                Save
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        {/*MODAL FOR UPDATE ROLE*/}
        <Modal show={showUpdateRole} onHide={handleUpdateRoleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Update A Role</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="form-group p-1">
              <div>
                <h6>Updated Role Name</h6>
              </div>

              <input
                className={`${style.txtbox} form-control`}
                type="text"
                id="newUser"
                name="newUser"
                defaultValue={roleData.roleName}
                placeholder="Enter Role Name"
                required
              />
            </div>

            <div className="mt-4 d-flex flex-column justify-content-start">
              <h2>Access</h2>

              <div className="d-flex">
                <button
                  className={`btn ${
                    selectAllUp ? "btn-danger" : "btn-primary"
                  }`}
                  onClick={handleSelectAllChangeUp}
                >
                  {selectAllUp ? "Unselect All" : "Select All"}
                </button>
              </div>

              <div className="d-flex w-100 mt-4">
                <div className="d-flex flex-column w-100">
                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "dashboardAdmin",
                          e.target.checked
                        )
                      }
                      checked={roleData.dashboardAdmin === 1}
                    />
                    Dashboard (Admin)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp("adminPos", e.target.checked)
                      }
                      checked={roleData.adminPos === 1}
                    />
                    Point of Sales (Admin)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "accountManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.accountManagement === 1}
                    />
                    Account Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "productManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.productManagement === 1}
                    />
                    Product Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "shelvesManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.shelvesManagement === 1}
                    />
                    Shelves Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "purchaseManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.purchaseManagement === 1}
                    />
                    Purchase Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "supplierManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.supplierManagement === 1}
                    />
                    Supplier Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      id="allCheckBoxUp"
                      className="me-1"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "reportManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.reportManagement === 1}
                    />
                    Report
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "requestManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.requestManagement === 1}
                    />
                    Request Management
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "returnManagement",
                          e.target.checked
                        )
                      }
                      checked={roleData.returnManagement === 1}
                    />
                    Return Item
                  </label>
                </div>

                <div className="d-flex flex-column w-100">
                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "dashboardUser",
                          e.target.checked
                        )
                      }
                      checked={roleData.dashboardUser === 1}
                    />
                    Dashboard (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp("userPos", e.target.checked)
                      }
                      checked={roleData.userPos === 1}
                    />
                    Point Of Sale (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBox"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "productManagementUser",
                          e.target.checked
                        )
                      }
                      checked={roleData.productManagementUser === 1}
                    />
                    Product Management (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "shelvesManagementUser",
                          e.target.checked
                        )
                      }
                      checked={roleData.shelvesManagementUser === 1}
                    />
                    Shelves Management (User)
                  </label>

                  <label className="m-1">
                    <input
                      type="checkbox"
                      className="me-1"
                      id="allCheckBoxUp"
                      onChange={(e) =>
                        handleCheckboxChangeUp(
                          "requestManagementUser",
                          e.target.checked
                        )
                      }
                      checked={roleData.requestManagementUser === 1}
                    />
                    Request Management (User)
                  </label>
                </div>
              </div>
            </div>

            <div className="p-2 d-flex justify-content-end">
              <Button type="submit" variant="primary" onClick={updateRoleData}>
                Update
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        {/*MODAL FOR DELETE ACCOUNT*/}
        <Modal show={showDelRole} onHide={handleDelRoleClose} centered>
          <Modal.Header closeButton>
            <Modal.Title>Delete Role</Modal.Title>
          </Modal.Header>

          <Modal.Body>Are you sure you want to delete this role?</Modal.Body>

          <Modal.Footer>
            <Button
              variant="primary"
              onClick={(e) => {
                deleteRole(roleData.roleId);
                handleDelRoleClose();
              }}
            >
              Yes
            </Button>

            <Button variant="danger" onClick={handleDelRoleClose}>
              No
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  const renderPage = () => {
    if (presentPage === "renderAccount") {
      return renderAccount();
    } else if (presentPage === "renderRole") {
      return renderRole();
    }
  };

  return (
    <>
      <div>{renderPage()}</div>
    </>
  );
};

export default Account;

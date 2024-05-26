import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import ReactPaginate from "react-paginate";
import { toast } from "react-toastify";
//Action icons
import { FiArrowRight } from "react-icons/fi";
import { MdHistory } from "react-icons/md";

//Action icon for modal table
import { MdCheckBox, MdOutlineDelete } from "react-icons/md";
import style from "./Purchase.module.css";
import { AiOutlineArrowLeft } from "react-icons/ai";
//Action icon for purchase list
import { IoMdAdd } from "react-icons/io";
import { IoListSharp } from "react-icons/io5";

//Action icon for purchase history
import { VscEye } from "react-icons/vsc";

import noPHis from "../../../assets/noPHis.png";

//Import developing tools
import apiUrl from "../../../Config/config";
import axios from "axios";
import tr from "date-fns/locale/tr";
import { FaSort } from "react-icons/fa";

const Purchase = () => {
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEncodeModal, setShowEncodeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmReceivedModal, setShowConfirmReceivedModal] =
    useState(false);

  //Modal for purchase history
  const [showPurHistoryModal, setShowPurHistory] = useState(false);

  const handleConfirmModalOpen = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmModalClose = () => {
    setShowConfirmModal(false);
  };

  const handleConfirmReceivedModalOpen = () => {
    setShowConfirmReceivedModal(true);
  };

  const handleConfirmReceivedModalClose = () => {
    setShowConfirmReceivedModal(false);
  };

  //VIEW MODAL OPEN AND CLOSE
  const handleViewModalOpen = () => {
    setShowViewModal(true);
  };

  const handleViewModalClose = () => {
    setPurchaseItems([]);
    setTotalCost(0);
    setSelectedProduct([]);
    // Reset the product selection to default
    const prodProductForm = document.getElementById("prodProductForm");
    if (prodProductForm) {
      prodProductForm.value = "default";
    }

    setShowViewModal(false);
  };

  //RECEIVE MODAL
  const handleEncodeModalOpen = () => {
    setShowEncodeModal(true);
  };

  const handleEncodeModalClose = () => {
    setSelectedProductToReceived([]);
    // Reset the container selection
    const prodContainer = document.getElementById("Container");
    if (prodContainer) {
      prodContainer.value = ""; // Set it back to the default value
    }
    setShowEncodeModal(false);
  };

  //Modal for purchase history view products per supplier
  const handlePurchaseHistoryProdOpen = () => {
    setShowPurHistory(true);
  };
  const handlePurchaseHistoryProdClose = () => {
    setShowPurHistory(false);
  };

  //This is for purchaseform
  const [presentPage, setPresentPage] = useState("purOrder");
  const [supplierWithProducts, setSupplierWithProducts] = useState([]);
  const [purchaseId, setPurchaseId] = useState(generatePurchaseId());
  const [unitList, setUnitList] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState([]);
  const [productPerSupplier, setProductPerSupplier] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [quantity, setQuantity] = useState(0);

  //This is for purchaseform

  //This is for purchase list receive form
  const [supplierPurchase, setSupplierPurchase] = useState([]);
  const [selectedSupplierForPurchaseList, setSelectedSupplierForPurchaseList] =
    useState([]);
  const [purchaseData, setPurchaseData] = useState([]);
  const [selectedProductToReceived, setSelectedProductToReceived] = useState(
    []
  );
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
  };

  //show delete confirmation for purchase list
  const [showDelModal, setShowDelModal] = useState(false);

  const handleDelModalOpen = () => {
    setShowDelModal(true);
  };

  const handleDelModalClose = () => {
    setShowDelModal(false);
  };

  const [defaultProdUnit, setDefaultProdUnit] = useState("Product Unit");

  const handleReceivePurchaseForm = async () => {
    // Get form input elements
    const dateExpiry = document.getElementById("dateExpiry");
    const dateReceived = document.getElementById("dateReceived");
    const receivingPrice = document.getElementById("receivingPrice");
    const sellingPrice = document.getElementById("sellingPrice");
    const dateOrdered = document.getElementById("dateOrdered");
    const purchaseQty = document.getElementById("purchaseQty");
    const receivedQty = document.getElementById("receivedQty");
    const prodName = document.getElementById("prodName");
    const pcsPerUnit = document.getElementById("pcsPerUnit");
    const prodContainer = document.getElementById("Container");

    if (
      !dateExpiry.value ||
      !dateReceived.value ||
      !dateOrdered.value ||
      !purchaseQty.value ||
      !receivedQty.value ||
      !prodContainer.value ||
      !prodName.value
    ) {
      toast.error("Please fill up all required fields");
      handleConfirmReceivedModalClose();
      return;
    }

    if (/[^0-9/.]/.test(receivedQty.value)) {
      toast.error("Quantity should be a whole number.");
      return;
    }

    // Validate receivingPrice and sellingPrice
    const newReceivingPrice = parseFloat(receivingPrice.value);
    const newSellingPrice = parseFloat(sellingPrice.value);

    if (isNaN(newReceivingPrice) || isNaN(newSellingPrice)) {
      toast.error("Receiving price and selling price must be numeric values");
      return;
    }

    // Calculate new totalPrice
    const newReceivedQty = parseFloat(receivedQty.value);
    const newTotalPrice = newReceivedQty * newReceivingPrice;

    // Update selectedProductToReceived with the new total price
    const updatedProductToReceived = {
      ...selectedProductToReceived,
      formattedDateReceive:
        dateReceived === null ? getCurrentDate() : dateReceived.value,
      totalPrice: newTotalPrice,
      userName: Name,
    };

    try {
      const res = await axios.put(
        `${apiUrl}/receivedProductFromPurchase/`,
        updatedProductToReceived
      );

      const suppId = selectedProductToReceived.suppId;
      const purchase_id = selectedProductToReceived.purchase_id;

      if (res.data.Status === "Success") {
        toast.success("Received Successfully");
        fetchPurchaseData(suppId, purchase_id);
        const prodContainer = document.getElementById("Container");
        if (prodContainer) {
          prodContainer.value = "";
        }
        dateExpiry.value = "";
        pcsPerUnit.value = "";
        receivedQty.value = "";
        sellingPrice.value = "";
        setSelectedProductToReceived([]);
        fetchSupplierPurchase();
        handleConfirmReceivedModalClose();
      } else {
        toast.error(res.data.Error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  //This is for purchase list receive form
  const formatDate = (dateStr) => {
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    const [month, day, year] = new Date(dateStr)
      .toLocaleDateString(undefined, options)
      .split("/");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchData();
  }, [supplierPurchase]);

  const [Name, setName] = useState("");
  axios.defaults.withCredentials = true;

  const fetchData = async () => {
    await fetchUser();
    await fetchSupplierWithProducts();
    await fetchSupplierPurchase();
    handleManageOption();
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${apiUrl}/auth`);
      if (res.data.Status === "Success") {
        setName(res.data.name);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSupplierWithProducts = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getSuppliersWithProducts`);
      if (res.data.Status === "Success") {
        setSupplierWithProducts(res.data.Message);
      } else {
        toast.warning(res.data.Error);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSupplierPurchase = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getSupplierPurchase`);
      if (res.data.Status === "Success") {
        setSupplierPurchase(res.data.Message);
      } else {
        toast.error("Cannot fetch purchase. Please Try Again Later.");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const [options, setOptions] = useState([]);
  const handleManageOption = () => {
    axios
      .get(`${apiUrl}/manageProduct/option`)
      .then((res) => {
        setOptions(res.data.Message);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleProductPerSupplier = async (supplierId) => {
    fetchUnitList();
    try {
      const res = await axios.get(`${apiUrl}/productsBySupplier/${supplierId}`);
      if (res.data.Status === "Success") {
        setProductPerSupplier(res.data.Message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const fetchUnitList = async () => {
    try {
      const res = await axios.get(`${apiUrl}/getUnitList`);
      if (res.data.Status === "Success") {
        setUnitList(res.data.Message);
      } else {
        toast.warning(res.data.Error);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const [totalPurchaseData, setTotalPurchaseData] = useState(0);
  const fetchPurchaseData = async (supplierId, purchase_id) => {
    try {
      const res = await axios.get(
        `${apiUrl}/purchaseData/${supplierId}/${purchase_id}`
      );
      if (res.data.Status === "Success") {
        setPurchaseData(res.data.Message);
        const sum = res.data.Message.reduce(
          (total, item) => total + item.totalPrice,
          0
        );
        setTotalPurchaseData(sum);
      } else {
        toast.error("Cannot fetch data. Please Try Again Later.");
      }
    } catch (error) {
      console.error("Error fetching purchase data:", error);
    }
  };
  //For auto generated purchaseId
  function generatePurchaseId() {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000); // Adjust the range as needed
    return `${timestamp}-${random}`;
  }
  //Function for crud //
  const handlePostRequest = () => {
    if (purchaseItems.length === 0) {
      toast.error("The purchase is empty.");
      return;
    }

    const updatedPurchase = { ...purchaseItems, userName: Name };

    axios
      .post(`${apiUrl}/addToPurchase`, updatedPurchase)
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Successfully Purchased.");
          const newPurchaseId = generatePurchaseId();
          setPurchaseId(newPurchaseId);
          // Clear the purchase items and total cost
          setPurchaseItems([]);
          setTotalCost(0);
          // Close the modal
          handleConfirmModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  //Function for crud //

  function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // Adding 1 to month because it is zero-indexed
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const handleAddToPurchase = () => {
    const prodProduct = document.getElementById("prodProductForm");
    if (prodProduct.value === "default") {
      toast.error("Please select a product first.");
    } else {
      if (selectedProduct && quantity > 0) {
        const purchaseDate = document.getElementById("purchaseDateForm").value;
        const deliveryDate = document.getElementById("deliveryDateForm").value;
        const unit = selectedProduct.prodUnitId;
        const price = parseFloat(
          document.getElementById("buyingPriceForm").value.replace(" ₱ ", "")
        );
        const totalPrice = price * quantity;
        let enableCount = isChecked ? 1 : 0;

        const newPurchaseItem = {
          purchaseId: purchaseId,
          purchaseDate,
          deliveryDate: deliveryDate,
          supplierId: selectedSupplier.suppId,
          productId: selectedProduct.prodId,
          productName: selectedProduct.prodName,
          prodDetails: selectedProduct.prodDetails,
          prodUnitName: selectedProduct.prodUnitName,
          quantity,
          unit,
          price,
          totalPrice,
          enableCount,
        };

        // Update the state using the updater function
        setPurchaseItems((prevPurchaseItems) => [
          ...prevPurchaseItems,
          newPurchaseItem,
        ]);

        // Calculate the new total cost
        setTotalCost((prevTotalCost) => prevTotalCost + totalPrice);

        document.getElementById("quantityForm").value = "";

        setQuantity(0);
        setIsChecked(false);
      } else {
        toast.error("Enter quantity of the product");
      }
    }
  };

  const handleRemoveItem = (indexToRemove) => {
    // Create a new array without the item to remove
    const updatedPurchaseItems = purchaseItems.filter(
      (_, index) => index !== indexToRemove
    );

    setPurchaseItems(updatedPurchaseItems);

    // Recalculate the total cost after removing the item
    const newTotalCost = calculateTotalCost(updatedPurchaseItems);
    setTotalCost(newTotalCost);
  };

  function calculateTotalCost(purchaseItems) {
    if (purchaseItems.length === 0) {
      return 0;
    }

    return purchaseItems.reduce((total, item) => {
      return total + item.totalPrice;
    }, 0);
  }

  //This is for purchase history

  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseHistoryData, setPurchaseHistoryData] = useState([]);
  const [totalPriceSum, setTotalPriceSum] = useState([]);
  const getPurchaseHistory = () => {
    axios
      .get(`${apiUrl}/api/getPurchaseHistory`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setPurchaseHistory(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const getPurchaseHistoryData = (id, purId) => {
    axios
      .get(`${apiUrl}/api/getPurchaseHistoryData/${id}/${purId}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setPurchaseHistoryData(res.data.Message);
          // Calculate the sum of totalPrice values
          const sumTotalPrice = res.data.Message.reduce((sum, purchase) => {
            return sum + purchase.totalPrice;
          }, 0);

          // Format the sumTotalPrice with commas for every 3 digits
          const formattedTotalPrice = Number(sumTotalPrice.toFixed(2));

          setTotalPriceSum(formattedTotalPrice.toLocaleString("en-US"));
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  const [searchSupplier, setSearchSupplier] = useState("");
  const filteredSupplierName = supplierPurchase.filter((item) => {
    const name = item.suppName.toLowerCase();

    const searchValue = searchSupplier.toLowerCase();
    return name.includes(searchValue);
  });

  const [searchSupplierWithProducts, setSearchSupplierWithProducts] =
    useState("");
  const filteredSupplierWithProducts = supplierWithProducts.filter((item) => {
    const name = item.suppName.toLowerCase();

    const searchValue = searchSupplierWithProducts.toLowerCase();
    return name.includes(searchValue);
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

  const sortedData = [...filteredSupplierWithProducts].sort((a, b) => {
    const comparison = a[sortedField] > b[sortedField] ? 1 : -1;
    return sortDirection === "desc" ? comparison : -comparison;
  });

  const [searchPurHistory, setSearchPurHistory] = useState("");
  const filteredPurHistory = purchaseHistory.filter((item) => {
    const name = item.suppName.toLowerCase();
    const dateReq = item.dateReq;
    const searchValue = searchPurHistory.toLowerCase();
    return name.includes(searchValue) || dateReq.includes(searchValue);
  });

  const [searchPurchaseProducts, setSearchPurchaseProduct] = useState("");
  const filteredPurchasedProducts = purchaseHistoryData.filter((item) => {
    const name = item.prodName.toLowerCase();
    const prodUnitName = item.prodUnitName.toLowerCase();
    const dateReq = item.dateReq;
    const dateReceive = item.dateReceive;

    const searchValue = searchPurchaseProducts.toLowerCase();
    return (
      name.includes(searchValue) ||
      dateReq.includes(searchValue) ||
      prodUnitName.includes(searchValue) ||
      dateReceive.includes(searchValue)
    );
  });
  const [selectProductToCancel, setSelectedProductToCancel] = useState([]);
  const handleCancelItem = () => {
    axios
      .put(`${apiUrl}/cancelPurchaseItem`, selectProductToCancel)
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Cancel item successfully");
          fetchPurchaseData(
            selectProductToCancel.suppId,
            selectProductToCancel.purchase_id
          );
          const prodContainer = document.getElementById("Container");
          if (prodContainer) {
            prodContainer.value = "";
          }
          dateExpiry.value = "";
          pcsPerUnit.value = "";
          receivedQty.value = "";
          sellingPrice.value = "";
          setSelectedProductToReceived([]);
          setSelectedProductToCancel([]);
          fetchSupplierPurchase();
          handleDelModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  };

  // Filter out the products that are not yet added to the table
  const productsNotAdded = productPerSupplier.filter(
    (item) =>
      !purchaseItems.some(
        (purchaseItem) => purchaseItem.productId === item.prodId
      )
  );

  function purOrder() {
    return (
      <>
        {/*MODAL FOR CONFIRM MODAL*/}
        <Modal
          show={showConfirmModal}
          onHide={handleConfirmModalClose}
          style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Confirm Purchase</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to confirm this purchase?</p>
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

        <Modal
          show={showViewModal}
          onHide={handleViewModalClose}
          dialogClassName={style["custom-modal"]}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Purchase Order Form</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="row">
              <div className={`${style.column1}`}>
                <div className={`${style.cardPurchaseForm}`}>
                  <div className={`${style.supplierName}`}>
                    <h3 className="mt-4">{selectedSupplier.suppName}</h3>
                  </div>
                  <div className="d-flex flex-column">
                    <div className="p-2 mb-2">
                      <div className="d-flex">
                        <div className="me-2">
                          <h6>Order Date</h6>
                        </div>
                        <div className="">
                          <h6 className={`${style.dateCustom}`}>
                            (dd/mm/yyyy)
                          </h6>
                        </div>
                      </div>
                      <input
                        className={`${style["search-input-modal"]} form-control`}
                        type="date"
                        id="purchaseDateForm"
                        defaultValue={getCurrentDate()}
                        placeholder="Purchase Date"
                        required
                        min={getCurrentDate()}
                        disabled={purchaseItems.length !== 0}
                      />
                    </div>

                    <div className="p-2 mb-2">
                      <div className="row">
                        <div className="col">
                          <div className="d-flex">
                            <div className="me-2">
                              <h6>Expected Date</h6>
                            </div>
                            <div className="">
                              <h6 className={`${style.dateCustom}`}>
                                (dd/mm/yyyy)
                              </h6>
                            </div>
                          </div>
                        </div>
                      </div>
                      <input
                        className={`${style["search-input-modal"]} form-control`}
                        type="date"
                        id="deliveryDateForm"
                        defaultValue={getCurrentDate()}
                        placeholder="Delivery Date"
                        required
                        min={getCurrentDate()}
                        disabled={purchaseItems.length !== 0}
                      />
                    </div>

                    <div className="p-2 mb-2">
                      <label>Select a Product</label>
                      <select
                        className="form-select"
                        id="prodProductForm"
                        name="prodProductForm"
                        onClick={(e) => {
                          const selectedOption =
                            e.target.options[e.target.selectedIndex];
                          const selectedItem = JSON.parse(
                            selectedOption.getAttribute("data-item")
                          );
                          setSelectedProduct(selectedItem);
                        }}
                        onChange={(e) => {
                          const selectedOption =
                            e.target.options[e.target.selectedIndex];
                          const selectedItem = JSON.parse(
                            selectedOption.getAttribute("data-item")
                          );
                          setSelectedProduct(selectedItem);
                        }}
                        value={
                          !selectedProduct ? "default" : selectedProduct.prodId
                        }
                      >
                        <option value="default">Select a Product</option>
                        {productsNotAdded.map((item) => (
                          <option
                            key={item.prodId}
                            value={item.prodId}
                            data-item={JSON.stringify(item)}
                          >
                            {item.productDetails}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-2 mb-2">
                      <label>Product Unit</label>
                      <input
                        className={`${style["search-input-modal"]} form-control`}
                        type="text"
                        id="prodUnit"
                        value={
                          selectedProduct && selectedProduct.prodUnitName
                            ? selectedProduct.prodUnitName
                            : defaultProdUnit
                        }
                        placeholder="Product Unit"
                        disabled
                      />
                      <label
                        className="m-1"
                        hidden={selectedProduct?.prodUnitName === "Piece" || ""}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={handleCheckboxChange}
                          hidden={
                            selectedProduct?.prodUnitName === "Piece" || ""
                          }
                          className="me-1"
                        />
                        Sell Per Piece
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
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => {
                          setQuantity(e.target.value);

                          if (quantity < 0) {
                            e.target.value = 0;
                          }
                        }}
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
                        value={` ₱ ${
                          selectedProduct
                            ? selectedProduct.buyingPrice || "0"
                            : "0.00"
                        }`}
                        placeholder="Product Price"
                        disabled
                        required
                      />
                      <h6 className="mt-2 ms-1">
                        Note: The buying price is based on the last purchase.
                      </h6>
                    </div>

                    <div className="p-3 mb-2 d-flex justify-content-end">
                      <button
                        className="btn btn-success"
                        onClick={handleAddToPurchase}
                        disabled={
                          selectedProduct?.length === 0 || !selectedProduct
                        }
                      >
                        Add to Purchase
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`${style.column2} p-2`}>
                <div className={`${style["table-container-modal"]}`}>
                  <table
                    className={`${style.tblProduct} table caption-top table-borderless table-hover`}
                  >
                    <thead>
                      <tr>
                        <th>
                          <div className="d-flex flex-column">
                            <label>Date</label>
                            <label className={style.lblmmddyyyy}>
                              (yyyy/mm/dd)
                            </label>
                          </div>
                        </th>
                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total Price</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {purchaseItems.map((item, index) => {
                        return (
                          <tr key={index}>
                            <td className="d-flex justify-content-start">
                              <div className="d-flex flex-column justify-content-start">
                                <div
                                  className="d-flex justify-content-center"
                                  style={{
                                    backgroundColor: "#10451D",
                                    color: "white",
                                  }}
                                >
                                  <h6 className="d-flex align-items-center my-1">
                                    Order:
                                  </h6>
                                  <h6 className="d-flex align-items-center ms-1 my-1">
                                    {item.purchaseDate}
                                  </h6>
                                </div>

                                <div
                                  className="d-flex align-items-center "
                                  style={{
                                    backgroundColor: "#5F8368",
                                    color: "white",
                                  }}
                                >
                                  <h6 className="d-flex align-items-center my-1">
                                    Expected:
                                  </h6>
                                  <h6 className=" my-1 ms-1" style={{}}>
                                    {item.deliveryDate}
                                  </h6>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex flex-column justify-content-start">
                                <div className="d-flex">
                                  <h6
                                    className="my-1"
                                    style={{ fontWeight: "600" }}
                                  >
                                    {item.productName}
                                  </h6>
                                  <h6
                                    className="my-1"
                                    style={{ fontWeight: "400" }}
                                  >
                                    <i>({item.prodUnitName})</i>
                                  </h6>
                                </div>

                                <div className="d-flex">
                                  <h6>{item.prodDetails}</h6>
                                </div>
                              </div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>₱{item.price}</td>
                            <td>₱{item.totalPrice.toFixed(2)}</td>
                            <td>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleRemoveItem(index)}
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

                <div className="d-flex justify-content-between mt-3 me-4">
                  <div className={`${style.totalCost}`}>
                    <div className="">
                      <div className="">
                        <h5>Total Cost: </h5>
                      </div>
                      <div className="">
                        <h2>₱{totalCost.toFixed(2)}</h2>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button
                      className="btn btn-success"
                      disabled={purchaseItems.length === 0}
                      onClick={handleConfirmModalOpen}
                    >
                      Confirm Purchase
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>

        <div className={`${style.container} `}>
          <div className={`${style.cardPurchase} container-fluid vh-100`}>
            <div className="mb-4 d-flex justify-content-between">
              <div className="mt-3 mx-2 col-auto">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchSupplierWithProducts}
                  onChange={(e) =>
                    setSearchSupplierWithProducts(e.target.value)
                  }
                  className={`${style["search-input-modal"]} form-control`}
                />
              </div>

              <div className="mt-3 mx-2 d-flex justify-content-center">
                <div className="col-auto me-2">
                  <button
                    className="btn btn-success"
                    style={{ backgroundColor: "#10451D" }}
                    onClick={() => {
                      getPurchaseHistory();
                      setPresentPage("purHistory");
                    }}
                  >
                    <MdHistory size={25} /> Purchase History
                  </button>
                </div>

                <div className="col-auto">
                  <button
                    className="btn btn-success"
                    style={{ backgroundColor: "#10451D" }}
                    onClick={() => {
                      fetchSupplierPurchase();
                      setPresentPage("purList");
                    }}
                  >
                    <IoListSharp size={25} /> Purchase List
                  </button>
                </div>
              </div>
            </div>

            <div className={`${style["table-container"]} m-4`}>
              <table
                className={`${style.tblSupplierList} table caption-top table-borderless table-hover`}
              >
                <caption>Choose supplier to purchase:</caption>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("suppName")}
                      style={{ cursor: "pointer" }}
                    >
                      Supplier Name <FaSort />
                    </th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((item, index) => {
                    return (
                      <tr key={index}>
                        <td>{item.suppName}</td>
                        <td>
                          <button
                            className="btn btn-success me-2 my-2"
                            onClick={() => {
                              setSelectedSupplier({
                                ...selectedSupplier,
                                suppId: item.suppId,
                                suppName: item.suppName,
                                suppContactPerson: item.suppContactPerson,
                                suppAddr: item.suppAddr,
                                suppContactNumber: item.suppContactNumber,
                              });
                              handleProductPerSupplier(
                                item.suppId,
                                item.purchase_id
                              );

                              handleViewModalOpen();
                            }}
                          >
                            <FiArrowRight />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  function purList() {
    return (
      <>
        {/*MODAL FOR CONFIRM MODAL*/}
        <Modal
          show={showConfirmReceivedModal}
          onHide={handleConfirmReceivedModalClose}
          centered
          style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
        >
          <Modal.Header>
            <Modal.Title>Confirming</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <label>Confirm received this product?</label>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleConfirmReceivedModalClose}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleReceivePurchaseForm}>
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>

        {/*MODAL FOR ENCODING PRODUCT*/}
        <Modal
          show={showEncodeModal}
          onHide={handleEncodeModalClose}
          dialogClassName={style["custom-modal"]}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Receive Purchase Order</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div className="row">
              <div className={`${style.column1} p-2`}>
                <div className={`${style.cardPurchaseForm}`}>
                  <div className={`${style.supplierName}`}>
                    {" "}
                    <h3>{selectedSupplierForPurchaseList.supplierName}</h3>
                  </div>
                  <div className="d-flex flex-column">
                    <div className="p-2">
                      <div className="d-flex">
                        <div className="me-2">
                          <h6>Date Ordered</h6>
                        </div>
                        <div className="">
                          <h6 className={`${style.dateCustom}`}>
                            (dd/mm/yyyy)
                          </h6>
                        </div>
                      </div>

                      <input
                        className={`${style["search-input-modal"]} form-control`}
                        type="text"
                        id="dateOrdered"
                        value={
                          (selectedProductToReceived.formattedDateReq &&
                            formatDate(
                              selectedProductToReceived.formattedDateReq
                            )) ||
                          ""
                        }
                        placeholder="Date Ordered"
                        disabled
                        required
                      />
                    </div>

                    <div className="p-2">
                      <div className="d-flex">
                        <div className="me-2">
                          <h6>Date Received</h6>
                        </div>
                        <div className="">
                          <h6 className={`${style.dateCustom}`}>
                            (dd/mm/yyyy)
                          </h6>
                        </div>
                      </div>
                      <input
                        className={`${style["search-input-modal"]} form-control`}
                        type="input"
                        id="dateReceived"
                        name="dateReceived"
                        disabled
                        defaultValue={getCurrentDate()}
                        onChange={(e) =>
                          setSelectedProductToReceived({
                            ...selectedProductToReceived,
                            formattedDateReceive: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <hr />

                    <div
                      className={`${style.prodDetails} p-2`}
                      style={{ border: "2px solid red" }}
                    >
                      <div className="p-2">
                        <h6>Product Name</h6>
                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="text"
                          id="prodName"
                          placeholder="Name"
                          value={
                            (selectedProductToReceived?.prodName || "") +
                            (selectedProductToReceived?.prodDetails
                              ? ` ${selectedProductToReceived?.prodDetails}`
                              : "")
                          }
                          required
                          disabled
                        />
                      </div>

                      <div className="p-2">
                        <h6>Product Unit</h6>
                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="text"
                          value={selectedProductToReceived.prodUnitName || ""}
                          id="prodUnit"
                          placeholder="Unit"
                          disabled
                          required
                        />
                      </div>

                      <div className="p-2">
                        <h6>Container</h6>
                        <select
                          className={`${style.txtbox} form-select`}
                          id="Container"
                          name="Container"
                          onChange={(e) =>
                            setSelectedProductToReceived({
                              ...selectedProductToReceived,
                              prodContainer: e.target.value,
                            })
                          }
                        >
                          <option value="" disabled selected>
                            Select a container
                          </option>
                          {options.map((option) => (
                            <option
                              key={option.containerId}
                              value={option.containerId}
                            >
                              {option.containerName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="p-2">
                        <h6
                          hidden={
                            selectedProductToReceived.enableCount === 0 ||
                            selectedProductToReceived.prodUnitName === "Piece"
                          }
                        >
                          Pcs. Per Unit
                        </h6>
                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="number"
                          id="pcsPerUnit"
                          placeholder="Pieces Unit"
                          required
                          hidden={
                            selectedProductToReceived.enableCount === 0 ||
                            selectedProductToReceived.prodUnitName === "Piece"
                          }
                          onChange={(e) =>
                            setSelectedProductToReceived({
                              ...selectedProductToReceived,
                              pcsPerUnit: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="p-2">
                        <h6>Ordered Quantity</h6>
                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="number"
                          id="purchaseQty"
                          value={selectedProductToReceived.prodQtyWhole || ""}
                          placeholder="Qty"
                          required
                          disabled
                        />
                      </div>

                      <div className="p-2">
                        <h6>Received Quantity</h6>
                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="text"
                          step="1"
                          id="receivedQty"
                          onChange={(e) => {
                            const inputValue = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            );
                            setSelectedProductToReceived({
                              ...selectedProductToReceived,
                              receivedQty: inputValue,
                            });
                          }}
                          placeholder="Qty"
                          required
                        />
                      </div>

                      <div className="p-2">
                        <h6>Receiving Price</h6>
                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="text"
                          id="receivingPrice"
                          placeholder="Price"
                          defaultValue={
                            selectedProductToReceived.buyingPrice || ""
                          }
                          onChange={(e) =>
                            setSelectedProductToReceived({
                              ...selectedProductToReceived,
                              buyingPrice: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="p-2">
                        <div className="d-flex">
                          <h6>Selling Price</h6>
                          <h6
                            className={`${style.lblmmddyyyy} ms-1 d-flex align-items-center`}
                          >
                            {selectedProductToReceived.enableCount === 1
                              ? "(by Piece)"
                              : `(by ${selectedProductToReceived.prodUnitName})`}
                          </h6>
                        </div>

                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="number"
                          id="sellingPrice"
                          placeholder="Price"
                          onChange={(e) =>
                            setSelectedProductToReceived({
                              ...selectedProductToReceived,
                              sellingPrice: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="p-2">
                        <div className="d-flex">
                          <div className="me-2">
                            <h6>Date Expiry</h6>
                          </div>
                          <div className="">
                            <h6 className={`${style.dateCustom}`}>
                              (dd/mm/yyyy)
                            </h6>
                          </div>
                        </div>
                        <input
                          className={`${style["search-input-modal"]} form-control`}
                          type="date"
                          id="dateExpiry"
                          placeholder="Date Expiry"
                          onChange={(e) =>
                            setSelectedProductToReceived({
                              ...selectedProductToReceived,
                              formattedDateExpiry: e.target.value,
                            })
                          }
                          min={getCurrentDate()}
                          required
                        />
                      </div>
                    </div>

                    <div className="p-3 mb-2 d-flex justify-content-end">
                      <button
                        className="btn btn-success"
                        onClick={handleConfirmReceivedModalOpen}
                      >
                        Confirm Received
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${style.column2} p-2`}>
                <div className={`${style["table-container-modal"]}`}>
                  <table
                    className={`${style.tblReceive} table caption-top table-borderless table-hover`}
                  >
                    <thead>
                      <tr>
                        <th>
                          <div className="d-flex flex-column">
                            <label>Date</label>
                            <label className={style.lblmmddyyyy}>
                              (yyyy/mm/dd)
                            </label>
                          </div>
                        </th>

                        <th>Product Name</th>
                        <th>Quantity</th>
                        <th>Initial Price</th>
                        <th>Total Price</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {purchaseData.map((data, index) => {
                        const handleClick = () => {
                          if (data.purchaseStatus === 0) {
                            const dateExpiry =
                              document.getElementById("dateExpiry");
                            const dateReceived =
                              document.getElementById("dateReceived");
                            const receivingPrice =
                              document.getElementById("receivingPrice");
                            const sellingPrice =
                              document.getElementById("sellingPrice");
                            const dateOrdered =
                              document.getElementById("dateOrdered");
                            const purchaseQty =
                              document.getElementById("purchaseQty");
                            const receivedQty =
                              document.getElementById("receivedQty");
                            const prodName =
                              document.getElementById("prodName");
                            const pcsPerUnit =
                              document.getElementById("pcsPerUnit");
                            setSelectedProductToReceived(data);
                          }
                        };

                        return (
                          <tr
                            key={index}
                            onClick={handleClick}
                            className={style.rowHover}
                          >
                            <td
                              className="d-flex justify-content-start"
                              style={{
                                backgroundColor:
                                  data.purchaseStatus === 0
                                    ? "white"
                                    : "#CBE2FF",
                              }}
                            >
                              <div className="d-flex flex-column">
                                <div
                                  className="d-flex justify-content-center"
                                  style={{
                                    backgroundColor: "#10451D",
                                    color: "white",
                                  }}
                                >
                                  <h6 className="d-flex align-items-center my-1">
                                    Order:
                                  </h6>
                                  <h6 className="d-flex align-items-center ms-1 my-1">
                                    {formatDate(data.formattedDateReq)}
                                  </h6>
                                </div>

                                <div
                                  className="d-flex align-items-center "
                                  style={{
                                    backgroundColor: "#5F8368",
                                    color: "white",
                                  }}
                                >
                                  <h6 className="d-flex align-items-center my-1">
                                    Expected:
                                  </h6>
                                  <h6 className=" my-1 ms-1" style={{}}>
                                    {formatDate(
                                      data.formattedPurchaseDeliveryDate
                                    )}
                                  </h6>
                                </div>
                              </div>
                            </td>

                            <td
                              style={{
                                backgroundColor:
                                  data.purchaseStatus === 0
                                    ? "white"
                                    : "#CBE2FF",
                              }}
                            >
                              <div className="d-flex flex-column justify-content-start">
                                <div className="d-flex">
                                  <h6
                                    className="my-1"
                                    style={{ fontWeight: "600" }}
                                  >
                                    {data.prodName}
                                  </h6>
                                  <h6
                                    className="ms-1 my-1"
                                    style={{
                                      fontWeight: "400",
                                      backgroundColor: "yellow",
                                    }}
                                  >
                                    <i> - {data.prodUnitName}</i>
                                  </h6>
                                </div>

                                <div className="d-flex">
                                  <h6 style={{ fontWeight: "400" }}>
                                    {data.prodDetails}
                                  </h6>
                                </div>
                              </div>
                            </td>

                            <td
                              style={{
                                backgroundColor:
                                  data.purchaseStatus === 0
                                    ? "white"
                                    : "#CBE2FF",
                              }}
                            >
                              {data.prodQtyWhole}
                            </td>
                            <td
                              style={{
                                backgroundColor:
                                  data.purchaseStatus === 0
                                    ? "white"
                                    : "#CBE2FF",
                              }}
                            >
                              ₱{data.buyingPrice}
                            </td>
                            <td
                              style={{
                                backgroundColor:
                                  data.purchaseStatus === 0
                                    ? "white"
                                    : "#CBE2FF",
                              }}
                            >
                              ₱{data.totalPrice}
                            </td>
                            <td
                              style={{
                                backgroundColor:
                                  data.purchaseStatus === 0
                                    ? "white"
                                    : "#CBE2FF",
                              }}
                            >
                              {data.purchaseStatus === 0
                                ? "Pending"
                                : data.purchaseStatus === 1
                                ? "Received"
                                : "Canceled"}
                            </td>
                            <td
                              style={{
                                backgroundColor:
                                  data.purchaseStatus === 0
                                    ? "white"
                                    : "#CBE2FF",
                              }}
                            >
                              <button
                                disabled={data.purchaseStatus === 1 || data.purchaseStatus === 2}
                                className="btn btn-success me-2"
                                onClick={handleClick}
                              >
                                <IoMdAdd />
                              </button>

                              <button
                                  disabled={data.purchaseStatus === 1 || data.purchaseStatus === 2}
                                className="btn btn-danger"
                                onClick={(e) => {
                                  setSelectedProductToCancel(data);
                                  handleDelModalOpen();
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

                <div className="d-flex justify-content-between mt-3 me-4">
                  <div className={`${style.totalCost}`}>
                    <div className="">
                      <div className="">
                        <h5>Total Cost: </h5>
                      </div>
                      <div className="">
                        <h2>₱ {totalPurchaseData.toFixed(2)}</h2>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>

        <div className={`${style.cardPurchase} container-fluid vh-100 p-0`}>
          <div className="d-flex justify-content-between">
            <div className="ms-4 mt-4">
              <h2 style={{ fontWeight: "700" }}>Purchase List</h2>
            </div>
            <div className="col-auto">
              <div className="mt-4 me-4 p-0">
                <button
                  className="btn btn-success"
                  style={{ backgroundColor: "#10451D" }}
                  onClick={() => {
                    setPresentPage("purOrder");
                  }}
                >
                  <AiOutlineArrowLeft size={15} /> Purchase Order
                </button>
              </div>
            </div>
          </div>

          <hr />

          {supplierPurchase.length > 0 ? (
            <div className="d-flex justify-content-end">
              <div className="mt-2 me-4">
                <input
                  type="text"
                  value={searchSupplier}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                  placeholder="Search"
                  className={`${style["search-input-modal"]} form-control`}
                />
              </div>
            </div>
          ) : (
            <div></div>
          )}

          <div className={`${style["table-container-purlist"]} m-4`}>
            {supplierPurchase.length > 0 ? (
              <table
                className={`${style.tblPurchaseList} table caption-top table-borderless table-hover`}
              >
                <thead>
                  <tr>
                    <th className={style.tableColumnWidth}>Supplier Name</th>
                    <th className={style.tableColumnWidth}>
                      <div className="d-flex flex-column">
                        <label>Date Order</label>
                        <label className={style.lblmmddyyyy}>
                          (yyyy/mm/dd)
                        </label>
                      </div>
                    </th>
                    <th className={style.tableColumnWidth}>
                      <div className="d-flex flex-column">
                        <label>Expected Date Del</label>
                        <label className={style.lblmmddyyyy}>
                          (yyyy/mm/dd)
                        </label>
                      </div>
                    </th>
                    <th className={style.tableColumnWidth}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSupplierName.map((data, index) => {
                    return (
                      <tr key={index}>
                        <td>{data.suppName}</td>
                        <td>{formatDate(data.formattedDateReq)}</td>
                        <td>
                          {formatDate(data.formattedPurchaseDeliveryDate)}
                        </td>
                        <td className={style.tableColumnWidth}>
                          <button
                            className="btn btn-success me-2 my-2"
                            onClick={() => {
                              setSelectedSupplierForPurchaseList({
                                ...selectedSupplierForPurchaseList,
                                suppId: data.purchase_id,
                                supplierName: data.suppName,
                              });
                              fetchPurchaseData(data.suppId, data.purchase_id);
                              handleEncodeModalOpen();
                            }}
                          >
                            <FiArrowRight />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-100 d-flex flex-column justify-content-center align-items-center">
                <div className="d-flex justify-content-center">
                  <img src={noPHis} className={`${style.noPHis}`} />
                </div>

                <div className="mb-4">
                  <h5 style={{ color: "#A4A6A8" }}>
                    Try to order; the purchase list is empty.
                  </h5>
                </div>
              </div>
            )}
          </div>
        </div>

        <Modal
          show={showDelModal}
          onHide={handleDelModalClose}
          style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Cancel Item</Modal.Title>
          </Modal.Header>

          <Modal.Body>Are you sure you want to cancel this item?</Modal.Body>

          <Modal.Footer>
            <Button variant="primary" onClick={handleCancelItem}>
              Yes
            </Button>

            <Button variant="danger" onClick={handleDelModalClose}>
              No
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  {
    /*PURCHASE HISTORY*/
  }
  function purHistory() {
    return (
      <>
        <div className={`${style.cardPurchase} container-fluid m-0 p-0 vh-100`}>
          <div className="d-flex justify-content-between">
            <div className="ms-4 mt-4">
              <h2 style={{ fontWeight: "700" }}>Purchase History</h2>
            </div>
            <div className="col-auto">
              <div className="mt-4 me-4 p-0">
                <button
                  className="btn btn-success"
                  style={{ backgroundColor: "#10451D" }}
                  onClick={() => {
                    setPresentPage("purOrder");
                  }}
                >
                  <AiOutlineArrowLeft size={15} /> Purchase Order
                </button>
              </div>
            </div>
          </div>

          <hr />

          {purchaseHistory.length > 0 ? (
            <div className="mt-2 me-4 d-flex justify-content-end">
              <div>
                <input
                  className={`${style["search-input-modal"]} form-control`}
                  type="text"
                  value={searchPurHistory}
                  onChange={(e) => setSearchPurHistory(e.target.value)}
                  placeholder="Search"
                  required
                />
              </div>
            </div>
          ) : (
            <div></div>
          )}

          <div className="mt-4">
            <div className={`${style["table-container-purHistory"]} m-4`}>
              {purchaseHistory.length > 0 ? (
                <table
                  className={`${style.tblpurHistory} table caption-top table-borderless table-hover`}
                >
                  <thead>
                    <tr>
                      <th>Supplier Name</th>
                      <th>
                        <div className="d-flex flex-column">
                          <label>Date Purchase</label>
                          <label className={style.lblmmddyyyy}>
                            (yyyy/mm/dd)
                          </label>
                        </div>
                      </th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredPurHistory.map((data, index) => {
                      return (
                        <tr key={index}>
                          <td>{data.suppName}</td>
                          <td>{data.dateReq}</td>

                          <td>
                            <button
                              className="btn btn-dark"
                              onClick={(e) => {
                                getPurchaseHistoryData(
                                  data.suppId,
                                  data.purchase_id
                                );
                                handlePurchaseHistoryProdOpen();
                              }}
                            >
                              <VscEye />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="h-100 d-flex flex-column justify-content-center align-items-center">
                  <div className="d-flex justify-content-center">
                    <img src={noPHis} className={`${style.noPHis}`} />
                  </div>

                  <div className="mb-4">
                    <h5 style={{ color: "#A4A6A8" }}>
                      No Purchase History Found.
                    </h5>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/*Modal for viewing purchased products in supplier*/}
        <Modal
          show={showPurHistoryModal}
          onHide={handlePurchaseHistoryProdClose}
          dialogClassName={style["custom-modal"]}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Purchased Products</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div>
              <input
                className={`${style["search-input-modal"]} form-control`}
                type="text"
                value={searchPurchaseProducts}
                onChange={(e) => setSearchPurchaseProduct(e.target.value)}
                placeholder="Search"
                required
              />
            </div>

            <div className={`${style["table-container-purHistory"]}`}>
              <table
                className={`${style.tblPurchasedProduct} table caption-top table-borderless table-striped`}
              >
                <thead>
                  <tr>
                    <th>
                      <div className="d-flex flex-column">
                        <label>Date</label>
                        <label className={style.lblmmddyyyy}>
                          (yyyy/mm/dd)
                        </label>
                      </div>
                    </th>
                    <th>Product Name</th>
                    <th>Batch</th>
                    <th>Quantity</th>
                    <th>Buying Price</th>
                    <th>Total Price</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPurchasedProducts.map((data, index) => {
                    return (
                      <tr key={index}>
                        <td>
                          <div className="d-flex flex-column">
                            <div className="d-flex align-items-center">
                              <h6
                                className="me-1"
                                style={{ fontWeight: "400" }}
                              >
                                Order:
                              </h6>
                              <h6
                                style={{
                                  backgroundColor: "#5F8368",
                                  color: "white",
                                }}
                              >
                                {data.dateReq}
                              </h6>
                            </div>
                            <div className="d-flex align-items-center">
                              <h6
                                className="me-1"
                                style={{ fontWeight: "400" }}
                              >
                                Received:
                              </h6>
                              <h6
                                style={{
                                  backgroundColor: "#10451D",
                                  color: "white",
                                }}
                              >
                                {data.dateReceive}
                              </h6>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column justify-content-start">
                            <div className="d-flex">
                              <h6 style={{ fontWeight: "700" }}>
                                {data.prodName}
                              </h6>

                              <h6
                                className="ms-1"
                                style={{
                                  fontWeight: "400",
                                  backgroundColor: "yellow",
                                }}
                              >
                                - {data.prodUnitName}
                              </h6>
                            </div>

                            <h6 style={{ fontWeight: "400" }}>
                              {" "}
                              {data.prodDetails}
                            </h6>
                          </div>
                        </td>
                        <td >{data.purchaseStatus === 1 ? data.batchNumber : "Canceled"}</td>
                        <td>{data.purchaseStatus === 1? data.receivedQty : "Canceled"}</td>
                        <td>₱{data.buyingPrice}</td>
                        <td>₱{data.totalPrice}</td>
                        <td>{data.purchaseStatus === 0? "Pending" : data.purchaseStatus === 1? "Received" : "Canceled"}</td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-2 d-flex justify-content-end">
              <div
                className={`${style.totalCostProd} d-flex flex-column justify-content-end p-0`}
              >
                <div className="mt-2 me-2 d-flex justify-content-end align-items-center">
                  <h6>Total:</h6>
                </div>

                <div className="me-2 d-flex justify-content-end align-items-center">
                  <h1 className="ms-4">₱{totalPriceSum || "0.00"}</h1>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      </>
    );
  }

  const renderPage = () => {
    if (presentPage === "purOrder") {
      return purOrder();
    } else if (presentPage === "purList") {
      return purList();
    } else if (presentPage === "purHistory") {
      return purHistory();
    }
  };

  return (
    <>
      <div>{renderPage()}</div>
    </>
  );
};

export default Purchase;

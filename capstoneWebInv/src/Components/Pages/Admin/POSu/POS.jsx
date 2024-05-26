import axios from "axios";
import React, { useState, useEffect, useRef, useCallback } from "react";

import { Button, Modal } from "react-bootstrap";

import { FaArrowRight } from "react-icons/fa";
import { MdOutlineDelete, MdPayments } from "react-icons/md";
import { BiSolidShoppingBags } from "react-icons/bi";
import { IoMdAdd } from "react-icons/io";
import logo from "../../../assets/M-B.png";
import { MdOutlineRemoveShoppingCart } from "react-icons/md";

import style from "./POS.module.css";
import apiUrl from "../../../Config/config";
import { toast } from "react-toastify";

import { useReactToPrint } from "react-to-print";

import { VscDebugRestart } from "react-icons/vsc";

const pageStyle = `
@page {
  size: 10mm 10mm;
};

@media all{
  .pageBreak {
    display: none
  }
};

@media print {
  .pageBreak{
    page-break-before: always;
  }
}
`;

const POS = () => {
  const ref = useRef();

  //Modal for CheckOut
  const [showCheckOutModal, setCheckOutModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const handleCancelConfirmModalOpen = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirmClose = () => {
    setShowCancelConfirm(false);
  };

  const handleCheckOutModalOpen = () => {
    setCheckOutModal(true);
  };

  const handleCheckOutModalClose = () => {
    setCheckOutModal(false);
  };

  const handleReceiptModalClose = () => {
    setShowReceiptModal(false);
  };

  const [showReturnModal, setShowReturnModal] = useState(false);

  const handleReturnModalOpen = () => {
    setShowReturnModal(true);
  };

  const handleReturnModalClose = () => {
    setShowReturnModal(false);
  };

  const [showSettleModal, setShowSettleModal] = useState(false);

  const handleSettleModalOpen = () => {
    setCash(0);
    setChange(0);
    setShowSettleModal(true);
  };

  const handleSettleModalClose = () => {
    setShowSettleModal(false);
  };

  const [showProductModal, setShowProductModal] = useState(false);

  const handleProductModalOpen = () => {
    setItemSearch("");
    setShowProductModal(true);
  };

  const handleProductModalClose = () => {
    setShowProductModal(false);
  };

  const [showSegmentModal, setShowSegmentModa] = useState(false);

  const handleSegmentModalOpen = () => {
    setShowSegmentModa(true);
  };

  const handleSegmentModalClose = () => {
    setShowSegmentModa(false);
  };

  const [items, setItems] = useState([]);
  useEffect(() => {
    handleGetProductList();
    handleAuth();
  }, [items]);

  const handleGetProductList = () => {
    axios
      .get(`${apiUrl}/user/productlist`)
      .then((res) => {
        setItems(res.data.Message);
      })
      .catch((err) => console.log(err));
  };

  //For product unit
  const unitList = [
    { id: 0, type: "Piece" },
    { id: 1, type: "Bulk" },
  ];

  const [selectedUnit, setSelectedUnit] = useState(1);

  //Settle Payment
  const [cash, setCash] = useState(0);
  const [change, setChange] = useState(0);

  const [cartCount, setCartCount] = useState(0);
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    const existingItemIndex = cart.findIndex(
      (cartItem) => cartItem.prodId === item.prodId
    );

    if (existingItemIndex !== -1) {
      const existingItem = cart[existingItemIndex];
      const quantityToAdd = selectedUnit === "1" ? item.pcsPerUnit : 1;
      const totalAvailableQty = item.totalRemainingQty;

      if (existingItem.totalRemainingQty + quantityToAdd <= totalAvailableQty) {
        setCart((prevCart) =>
          prevCart.map((cartItem, index) =>
            index === existingItemIndex
              ? {
                  ...cartItem,
                  totalRemainingQty: cartItem.totalRemainingQty + quantityToAdd,
                  totalPrice: parseFloat(
                    (
                      (cartItem.totalRemainingQty + quantityToAdd) *
                      cartItem.sellingPrice
                    ).toFixed(2)
                  ),
                }
              : cartItem
          )
        );
        setCartCount((prevCount) => prevCount + quantityToAdd);
      } else {
        // Show an error message or handle the case where the requested quantity exceeds available stock
        toast.error("Requested quantity exceeds available stock.");
      }
    } else {
      const quantityToAdd = selectedUnit === "1" ? item.pcsPerUnit : 1;
      const totalAvailableQty = item.totalRemainingQty;

      if (quantityToAdd <= totalAvailableQty) {
        setCart((prevCart) => [
          ...prevCart,
          {
            ...item,
            totalRemainingQty: quantityToAdd,
            totalPrice: parseFloat(
              (quantityToAdd * item.sellingPrice).toFixed(2)
            ),
          },
        ]);
        setCartCount((prevCount) => prevCount + quantityToAdd);
      } else {
        // Show an error message or handle the case where the requested quantity exceeds available stock
        toast.error("Requested quantity exceeds available stock.");
      }
    }

    setSelectedUnit(1);
  };

  // Increment quantity
  const incrementQuantity = (index) => {
    setCart((prevCart) =>
      prevCart.map((cartItem, i) => {
        if (i === index) {
          const incrementedQty = cartItem.totalRemainingQty + 1;
          const totalAvailableQty = cartItem.initialRemainingQty;

          if (incrementedQty <= totalAvailableQty) {
            setCartCount((prevCount) => prevCount + 1);
            return {
              ...cartItem,
              totalRemainingQty: incrementedQty,
              totalPrice: parseFloat(
                (incrementedQty * cartItem.sellingPrice).toFixed(2)
              ),
            };
          }
        }
        return cartItem;
      })
    );
  };

  // Decrement quantity
  const decrementQuantity = (index) => {
    setCart((prevCart) =>
      prevCart.map((cartItem, i) => {
        if (i === index && cartItem.totalRemainingQty > 1) {
          setCartCount((prevCount) => prevCount - 1);
          return {
            ...cartItem,
            totalRemainingQty: cartItem.totalRemainingQty - 1,
            totalPrice: parseFloat(
              (
                (cartItem.totalRemainingQty - 1) *
                cartItem.sellingPrice
              ).toFixed(2)
            ),
          };
        }
        return cartItem;
      })
    );
  };
  //remove item from cart
  const removeFromCart = (index) => {
    setCart((prevCart) => {
      const updatedCart = [...prevCart];
      updatedCart.splice(index, 1);
      return updatedCart;
    });
  };

  // Calculate the total price
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    // Calculate the total price using reduce method
    const totalPriceSum = cart.reduce((sum, cartItem) => {
      return sum + cartItem.totalPrice;
    }, 0);

    setTotalPrice(parseFloat(totalPriceSum.toFixed(2))); // Format the total price to 2 decimal places
  }, [cart]);

  const [searchData, setItemSearch] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  useEffect(() => {
    const filtered = items.filter((product) => {
      return (
        (product.prodId && product.prodId.toString().includes(searchData)) ||
        (product.prodName &&
          product.prodName.toLowerCase().includes(searchData.toLowerCase())) ||
        (product.prodDetails &&
          product.prodDetails
            .toLowerCase()
            .includes(searchData.toLowerCase())) ||
        (product.buyingPrice &&
          product.buyingPrice.toString().includes(searchData)) ||
        (product.sellingPrice &&
          product.sellingPrice.toString().includes(searchData)) ||
        (product.prodContainer &&
          product.prodContainer.toString().includes(searchData))
      );
    });
    setFilteredData(filtered);
  }, [searchData, items]);

  //Sending the data to the backend
  const [currentDate, setCurrentDateTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const dateTime = new Date().toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      setCurrentDateTime(dateTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const [isPrintReceipt, setPrintReceipt] = useState(false);

  const [saleIdShow, setSaleId] = useState(0);
  const [data, setData] = useState([]);
  const [sales, setSales] = useState([]);

  const handlePrint = useCallback((saleId) => {
    setSaleId(saleId);
  }, []);

  useEffect(() => {
    if (saleIdShow !== 0) {
      print();
    }
  }, [saleIdShow]);

  const print = useReactToPrint({
    content: () => ref.current,
    onBeforeGetContent: () => {
      return true;
    },
  });

  const [saleIdToShow, setSaleIdToShow] = useState(0);
  const handleSettle = () => {
    event.preventDefault();
    if (!saleIdToShow) {
      toast.error("There is no sales id found");
    } else {
      const newData = cart.map((cartItem) => ({
        prodId: cartItem.prodId,
        batchNumber: cartItem.batchNumber,
        qty: cartItem.totalRemainingQty,
        itemTotal: cartItem.totalPrice,
        totalSale: totalPrice,
        cash: cash,
        dateSale: currentDate,
      }));

      setData(newData);
    }
  };

  const handleGetSaleId = () => {
    axios
      .post(`${apiUrl}/getTransactionId`, data)
      .then((res) => {
        if (res.data.Status === "Success") {
          setSaleIdToShow(res.data.Message);
          handleCheckOutModalOpen();
        }
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    if (data.length === 0 || saleIdToShow === null) {
      return;
    }

    const dataWithSaleId = { saleId: saleIdToShow, salesData: data };

    axios
      .post(`${apiUrl}/user/pos`, dataWithSaleId)
      .then((res) => {
        if (res.data.Status === "Success") {
          handleSales(res.data.Message);
          handleCheckOutModalClose();
          handleSettleModalClose();
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log(err));
  }, [data]);
  const handleSales = (saleId) => {
    const currentDate = new Date();
    if (isPrintReceipt) {
      handlePrint(saleId);
    }

    // Extract year, month, and day from the current date
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed, so we add 1 to get the correct month
    const day = String(currentDate.getDate()).padStart(2, "0");

    // Create the "yyyy/mm/dd" date format
    const formattedDate = `${year}/${month}/${day}`;

    const newSales = {
      ...sales,
      saleId: saleId,
      AllTotalSale: totalPrice,
      Date: formattedDate,
    };

    axios
      .post(`${apiUrl}/user/inventory`, newSales)
      .then((res) => {
        if (res.data.Status === "Success") {
          toast.success("Successfully created new sales");
          setSaleId(0);
          handleGetProductList();
          setCart([]);
          setData([]);
          setPrintReceipt(false);
        }
      })
      .catch((err) => {});
  };

  const handleCancel = () => {
    handleCancelConfirmClose();
    toast.success("Cart cleared.");
    setCart([]);
    setData([]);
  };

  //handle bulk or piece
  const [addProductToCart, setAddProductToCart] = useState([]);
  const handleBulkPiece = (item) => {
    if (item.isAvailableForPiece === 1) {
      handleSegmentModalOpen();
    } else if (item.isAvailableForPiece === 0) {
      handleProductModalClose();
      addToCart(item);
    } else {
      toast.error("Please select unit first");
    }
  };

  const [saleIdToSearch, setSaleIdToSearch] = useState(0);
  const [totalPriceOfSales, setTotalPriceOfSales] = useState(0.0);
  const [salesToReturn, setSalesToReturn] = useState([]);
  const getSalesById = () => {
    axios.get(`${apiUrl}/getSalesById/${saleIdToSearch}`).then((res) => {
      if (res.data.Status === "Success") {
        setSalesToReturn(res.data.Message);
        setTotalPriceOfSales(res.data.Message[0].totalSale);
      } else if (res.data.Status === "No data.") {
        toast.error(res.data.Message);
        setSalesToReturn([]);
        setTotalPriceOfSales(0.0);
      } else {
        toast.error(res.data.Error);
      }
    });
  };

  const incrementReturnQuantity = (index) => {
    const updatedSales = [...salesToReturn];
    if (index >= 0 && index < updatedSales.length) {
      updatedSales[index].qty += 1;
      updatedSales[index].itemTotal =
        updatedSales[index].qty * updatedSales[index].sellingPrice;
      setSalesToReturn(updatedSales);
      calculateNewTotalPrice(updatedSales);
    }
  };

  const decrementReturnQuantity = (index) => {
    const updatedSales = [...salesToReturn];
    if (
      index >= 0 &&
      index < updatedSales.length &&
      updatedSales[index].qty > 1
    ) {
      updatedSales[index].qty -= 1;
      updatedSales[index].itemTotal =
        updatedSales[index].qty * updatedSales[index].sellingPrice;
      setSalesToReturn(updatedSales);
      calculateNewTotalPrice(updatedSales);
    }
  };

  const calculateNewTotalPrice = (sales) => {
    const newTotal = sales.reduce((total, sale) => total + sale.itemTotal, 0);
    setTotalPriceOfSales(newTotal.toFixed(2));
  };

  const handleDeleteItem = (itemIndex) => {
    const updatedSales = [...salesToReturn];

    updatedSales.splice(itemIndex, 1);
    if (updatedSales.length > 0) {
      const newTotal = updatedSales.reduce(
        (total, sale) => total + sale.itemTotal,
        0
      );
      setSalesToReturn(updatedSales);
      setTotalPriceOfSales(newTotal.toFixed(2));
    } else {
      setSalesToReturn([]);
      setTotalPriceOfSales(0.0);
    }
  };

  const [Name, setName] = useState("");
  const handleAuth = () => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setName(res.data.name);
        } else {
          setAuth(false);
          setMessage(res.data.Error);
          navigate("/");
        }
      })
      .catch((err) => console.log(err));
  };

  const [returnRemark, setReturnRemarks] = useState("");
  const handleReturnItem = () => {
    if (returnRemark === "") {
      toast.error("Fill the remarks.");
    } else {
      const newAddSale = salesToReturn[0].additionalSale - totalPriceOfSales;

      axios
        .put(`${apiUrl}/returnTransactionUser`, {
          salesToReturn,
          additionalSale: newAddSale.toFixed(2),
          newTotalSale: totalPriceOfSales,
          returnRemarks: returnRemark,
          userName: Name,
        })
        .then((res) => {
          if (res.data.Status === "Success") {
            handleReturnModalClose();
            setSalesToReturn([]);
            setTotalPriceOfSales(0.0);
            toast.success("Successfully returned.");
          } else {
            toast.error(res.data.Message);
          }
        })
        .catch((err) => console.log(err));
    }
  };

  const handleQuantityChange = (e, index) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue) || newValue <= 0) {
      newValue = 1;
    }
    const newQuantity = Math.min(newValue, cart[index].initialRemainingQty);

    setCart((prevCart) =>
      prevCart.map((cartItem, i) => {
        if (i === index) {
          const prevQty = cartItem.totalRemainingQty;
          const updatedQty = newQuantity;
          const qtyDifference = updatedQty - prevQty;
          setCartCount((prevCount) => prevCount + qtyDifference);
          return {
            ...cartItem,
            totalRemainingQty: updatedQty,
            totalPrice: parseFloat(
              (updatedQty * cartItem.sellingPrice).toFixed(2)
            ),
          };
        }
        return cartItem;
      })
    );
  };

  const handleReturnQuantityChange = (e, index) => {
    let newValue = parseInt(e.target.value);
    if (isNaN(newValue) || newValue <= 0) {
      newValue = 1;
    }
    const updatedSales = [...salesToReturn];
    const newQuantity = Math.min(newValue, updatedSales[index].additionalQty);

    updatedSales[index].qty = newQuantity;
    updatedSales[index].itemTotal =
      newQuantity * updatedSales[index].sellingPrice;
    setSalesToReturn(updatedSales);
    calculateNewTotalPrice(updatedSales);
  };

  //End of Sending the data to the backend

  return (
    <>
      {/*Cart table*/}
      <div className="container-fluid vh-100">
        <div className={style.box}>
          <div className={`${style.containerRow} d-flex`}>
            <div className={`col-sm-9`}>
              {cart.length > 0 ? (
                <div className={`${style["table-container"]} m-4`}>
                  <table
                    className={`${style.tblCart} table table-borderless table-striped`}
                  >
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total Price</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((cartItem, id) => {
                        return (
                          <tr key={id}>
                            <td>
                              <div className="d-flex flex-column">
                                <h6>{cartItem.prodName}</h6>
                                <h6 style={{ fontSize: "12px" }}>
                                  {cartItem.prodDetails}
                                </h6>
                              </div>
                            </td>

                            <td>
                              <div className="d-flex justify-content-center">
                                <button
                                  className="btn btn-sm btn-danger me-1"
                                  onClick={() => decrementQuantity(id)}
                                >
                                  -
                                </button>
                                <input
                                  type="text"
                                  pattern="[0-9]*"
                                  inputMode="numeric"
                                  value={cartItem.totalRemainingQty}
                                  onChange={(e) => handleQuantityChange(e, id)}
                                  min="1"
                                  max={cartItem.initialRemainingQty}
                                  disabled={
                                    cartItem.totalRemainingQty >=
                                    cartItem.initialRemainingQty
                                  }
                                  style={{ width: "60px" }}
                                  className="text-center me-1"
                                />

                                <button
                                  className="btn btn-sm btn-success"
                                  onClick={() => incrementQuantity(id)}
                                  disabled={
                                    cartItem.totalRemainingQty >=
                                    cartItem.initialRemainingQty
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td>₱ {cartItem.sellingPrice}</td>
                            <td>₱ {cartItem.totalPrice}</td>
                            <td>
                              <button
                                className="btn btn-danger"
                                onClick={() => removeFromCart(id)}
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
              ) : (
                <div className="d-flex flex-column justify-content-center align-items-center my-4">
                  <MdOutlineRemoveShoppingCart size={100} />
                  <h2 className="mt-4" style={{ fontWeight: "700" }}>
                    Cart is empty.
                  </h2>
                  <h6 style={{ fontWeight: "400" }}>
                    Looks like you have no product in your cart.
                  </h6>
                  <h6 style={{ fontWeight: "400" }}>
                    Click{" "}
                    <a
                      onClick={() => {
                        handleProductModalOpen();
                      }}
                      style={{ color: "#4AB516", cursor: "pointer" }}
                    >
                      here
                    </a>{" "}
                    to browse products.
                  </h6>
                </div>
              )}
            </div>

            <div className={`p-4 w-100 d-flex flex-column`}>
              <button
                className={`${style["custom-button"]} ${style["btnSettle"]} btn btn-success mt-2`}
                onClick={() => {
                  {
                    cart.length > 0
                      ? handleSettleModalOpen()
                      : toast.error("Please purchase an item.");
                  }
                }}
              >
                <h6>Settle</h6>
              </button>

              <button
                className={`${style["custom-button"]} ${style["btnProduct"]} btn btn-success mt-2`}
                onClick={() => {
                  handleProductModalOpen();
                }}
              >
                <h6>Product List </h6>
              </button>

              <button
                className={`${style["custom-button"]} ${style["btnReturn"]} btn btn-success mt-2`}
                onClick={handleReturnModalOpen}
              >
                <h6>Return Item</h6>
              </button>

              <button
                hidden={cart.length === 0}
                className={`${style["custom-button"]} ${style["btnCancel"]} btn btn-success mt-2`}
                onClick={handleCancelConfirmModalOpen}
              >
                <h6 hidden={cart.length === 0}>Clear</h6>
              </button>

              {/* Floating Total Sales */}
              <div className={`${style.floatingCard}`}>
                <h5 className="my-2 ms-2" style={{ fontWeight: "600" }}>
                  Total Price
                </h5>
                <h1 className="ms-2">₱{totalPrice.toFixed(2)}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*MODALS*/}

      {/*MODAL FOR ARCHIVE CONTAINER*/}
      <Modal
        show={showCancelConfirm}
        onHide={handleCancelConfirmClose}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Clear</Modal.Title>
        </Modal.Header>

        <Modal.Body>Are you sure you want to clear the cart?</Modal.Body>

        <Modal.Footer>
          <Button variant="primary" onClick={handleCancel}>
            Yes
          </Button>

          <Button variant="danger" onClick={handleCancelConfirmClose}>
            No
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL FOR SETTLE */}

      <Modal show={showSettleModal} onHide={handleSettleModalClose} centered>
        <form action="">
          <Modal.Header closeButton>
            <Modal.Title>
              <div
                className={`${style["icon-row"]} d-flex align-items-spacebetween`}
              >
                <h3 className={`${style["no-wrap-text"]} mr-2`}>
                  Settle Payment
                </h3>
                <MdPayments className={`${style["custom-icon"]}`} />
              </div>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <>
              <div className="row">
                <div className="col mt-3 d-flex align-items-between">
                  <h4>Due</h4>
                </div>

                <div className="col mt-3">
                  <h4>₱{totalPrice.toFixed(2)}</h4>
                </div>
              </div>

              <div className="row">
                <div className="col mt-3 d-flex align-items-center">
                  <h4>Cash</h4>
                </div>

                <div className="col mt-3">
                  <input
                    className={`${style["custom-text-field"]} form-control`}
                    type="number"
                    defaultValue={cash}
                    onChange={(e) => {
                      const inputValue = parseFloat(e.target.value);
                      if (!isNaN(inputValue)) {
                        setCash(inputValue);
                        const change = inputValue - totalPrice;
                        setChange(change.toFixed(2));
                      } else {
                        setCash(0); // Set a default value of 0 if parsing fails
                        setChange(0);
                      }
                    }}
                    required
                    placeholder="Enter Amount"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col mt-3 d-flex align-items-center">
                  <h4>Change</h4>
                </div>

                <div className="col mt-3">
                  <p className="text-warning" id="change"></p>
                  <h4>₱{change}</h4>
                </div>
              </div>
            </>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="success"
              disabled={cash === 0 || cash === "" || cash < totalPrice}
              onClick={() => {
                handleGetSaleId();
                handleSettleModalClose();
              }}
              id="settle"
            >
              <FaArrowRight />
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* MODAL FOR PRODUCT W/ TABLE */}

      <Modal
        show={showProductModal}
        onHide={handleProductModalClose}
        dialogClassName={style["custom-modal"]}
        defaultValue
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className={`${style["icon-row"]} d-flex align-items-center`}>
              <h3 className={`${style["no-wrap-text"]} mr-2`}>Product List</h3>
              <BiSolidShoppingBags className={`${style["custom-icon"]}`} />
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="d-flex">
            <div className="col">
              <input
                type="text"
                placeholder="Search Product"
                onChange={(e) => setItemSearch(e.target.value)}
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
                  <th>Unit</th>
                  <th>Stock</th>
                  <th>Selling Price</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => {
                  return (
                    <tr key={index}>
                      <td
                        style={{
                          backgroundColor:
                            item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                        }}
                      >
                        <div className="d-flex flex-column">
                          <h6>{item.prodName}</h6>
                          <h6 style={{ fontSize: "10px" }}>
                            {item.prodDetails}
                          </h6>
                        </div>
                      </td>

                      <td
                        style={{
                          backgroundColor:
                            item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                        }}
                      >
                        {item.prodUnitName}
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
                        {item.sellingPrice}
                      </td>
                      <td
                        style={{
                          backgroundColor:
                            item.totalRemainingQty <= 10 ? "#FFE3E0" : "white",
                        }}
                      >
                        <button
                          className="btn btn-primary"
                          onClick={(e) => {
                            handleBulkPiece(item);
                            setAddProductToCart(item);
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

      {/*Modal for Segment of bulk/pcs */}
      <Modal
        show={showSegmentModal}
        onHide={handleSegmentModalClose}
        centered
        style={{ backgroundColor: "rgba(248, 249, 250, 0.8)" }}
      >
        <Modal.Header>
          <Modal.Title>Choose Unit</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="form-group p-2">
            <select
              className={`${style.txtbox} form-select`}
              id="unit"
              name="unit"
              onChange={(e) => setSelectedUnit(e.target.value)}
              required
            >
              {/* Add a default option */}
              {unitList.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.type}
                </option>
              ))}
            </select>
          </div>

          <div className="p-2 d-flex justify-content-end">
            <Button
              type="submit"
              variant="success"
              onClick={(e) => {
                const newItem = {
                  ...addProductToCart,
                  unitChosen:
                    selectedUnit === 1 ? "(Selling Bulk)" : "(Selling Piece)",
                };
                addToCart(newItem);
                handleSegmentModalClose(), handleProductModalClose();
              }}
            >
              Continue
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/*Modal for Return Item */}
      <Modal
        show={showReturnModal}
        onHide={handleReturnModalClose}
        top-centered
        dialogClassName={style["custom-modal"]}
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <h4 className={`${style.areturnlogo} me-1`}>
                <VscDebugRestart />
              </h4>
              <h4 className="">Return Item</h4>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={`${style["modal-return"]} m-2`}>
            <div className="d-flex flex-column justify-content-between">
              <div className="d-flex flex-column justify-content-start">
                <h5 className="">Sales Id:</h5>
              </div>

              <div className="d-flex justify-content-start">
                <div className="me-2">
                  {" "}
                  <input
                    className={`${style.txtbox} form-control`}
                    type="number"
                    id="salesSearch"
                    name="salesSearch"
                    onChange={(e) => setSaleIdToSearch(e.target.value)}
                    placeholder="Enter Sales Id"
                    required
                  />
                </div>

                <button className="btn btn-success" onClick={getSalesById}>
                  Search Sales
                </button>
              </div>
            </div>

            {salesToReturn.length > 0 ? (
              <div>
                <div className={`${style["table-container-modal"]} mt-3`}>
                  <table
                    className={`${style.tblProductReturn} table caption-top table-borderless table-striped`}
                  >
                    <caption>List of Product</caption>
                    <thead>
                      <th>Name</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total Price</th>
                      <th>Action</th>
                    </thead>

                    <tbody>
                      {salesToReturn.map((data, index) => {
                        return (
                          <tr key={index}>
                            <td>{`${data.prodName} (${data.prodDetails})`}</td>
                            <td>
                              <div className="d-flex">
                                <button
                                  className="btn btn-sm btn-danger me-2"
                                  disabled={data.qty === 1}
                                  onClick={() => decrementReturnQuantity(index)}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={data.qty}
                                  onChange={(e) =>
                                    handleReturnQuantityChange(e, index)
                                  }
                                  min="1"
                                  max={data.additionalQty}
                                />

                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => incrementReturnQuantity(index)}
                                  disabled={data.qty >= data.additionalQty}
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            <td>{data.itemTotal.toFixed(2)}</td>
                            <td>{data.totalSale}</td>
                            <td>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleDeleteItem(index)}
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

                <div className="mt-4">
                  <h6 className="" style={{ fontWeight: 700 }}>
                    Remarks
                  </h6>

                  <textarea
                    className={style.txtarea}
                    type="text"
                    name="txtremarks"
                    placeholder="Enter Remarks..."
                    id="txtremarks"
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    cols="30"
                    rows="3"
                  ></textarea>
                </div>
                <div className="d-flex justify-content-between">
                  <div className={`${style.totalCost}`}>
                    <div className="ms-2 mt-2 me-2">
                      <h6>Total:</h6>
                      <h2>{totalPriceOfSales || "0.00"}</h2>
                    </div>
                  </div>

                  <div className={`d-flex align-items-center`}>
                    <button
                      className="btn btn-success"
                      disabled={
                        salesToReturn.length === 0 || returnRemark === ""
                      }
                      onClick={handleReturnItem}
                    >
                      Confirm Return Item
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={showCheckOutModal}
        onHide={handleCheckOutModalClose}
        dialogClassName={style.modalCheckOut}
        backdrop="static"
        keyboard={false}
        scrollable
        centered
      >
        <Modal.Header>
          <Modal.Title>
            <div className="d-flex justify-content-between">
              <div>
                <h3 className={`${style["no-wrap-text"]} mr-2`}>Check Out</h3>
              </div>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="d-flex justify-content-center align-items-center">
            <div ref={ref} style={{ margin: "100px" }}>
              <div className="d-flex flex-column justify-content-center align-items-center">
                <div>
                  <img src={logo} className={style.logo} />
                </div>
                <h6>MANUEL'S PHARMACY</h6>
                <h6 style={{ fontSize: "10px" }}>
                  THIS SERVE AS YOUR SALES INVOICE.
                </h6>
              </div>
              <table
                className={`${style.tblCheckOut} table table-borderless caption-top`}
              >
                <caption hidden={saleIdToShow === 0}>
                  {" "}
                  Transaction No: {saleIdToShow.toString()}
                </caption>
                <caption>Item/s Purchased: {cartCount}</caption>
                <tbody>
                  {cart.map((data, index) => {
                    return (
                      <tr key={index}>
                        <td>
                          <div className="d-flex flex-column">
                            <h6>{data.prodName}</h6>

                            <h6 style={{ fontSize: "12px" }}>
                              {data.prodDetails}
                            </h6>
                          </div>
                        </td>
                        <td>{data.totalRemainingQty}</td>
                        <td>{data.sellingPrice}</td>
                        <td>{data.totalPrice}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <hr />
              <div className="d-flex flex-column w-100">
                <div className="d-flex justify-content-between">
                  <div>
                    <h6 style={{ fontSize: "20px" }}>Total</h6>
                  </div>

                  <h3>{totalPrice.toFixed(2)}</h3>
                </div>

                <div className="d-flex justify-content-between">
                  <div>
                    <h6 style={{ fontSize: "20px" }}>Cash</h6>
                  </div>

                  <h3>{cash.toFixed(2)}</h3>
                </div>

                <div className="d-flex justify-content-between">
                  <div>
                    <h6 style={{ fontSize: "20px" }}>Change</h6>
                  </div>

                  <h3>{change}</h3>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-end align-items-center w-100">
            <div>
              <button
                type="button"
                className="btn btn-danger me-1"
                onClick={handleCheckOutModalClose}
              >
                Clear
              </button>

              <button
                type="button"
                className="btn btn-primary me-1"
                onClick={() => {
                  handleSettle();
                  setPrintReceipt(true);
                }}
              >
                Print
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleSettle}
              >
                Save
              </button>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default POS;

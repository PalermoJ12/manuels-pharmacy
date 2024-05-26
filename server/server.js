import dotenv from "dotenv";
dotenv.config();
import express, { json } from "express";
import mysql from "mysql";
import util from "util";
import cors from "cors";
import jwt, { verify } from "jsonwebtoken";
import bcrypt, { compare } from "bcrypt";
import cookieParser from "cookie-parser";
import moment from "moment";
const salt = 10;

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ww6m62vx-5173.asse.devtunnels.ms",
      "https://vcbz12gz-5173.asse.devtunnels.ms",
      "https://5h74sr6x-5173.asse.devtunnels.ms",
    ],
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(cookieParser());

const port = 5000;

const dbCon = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

const queryPromise = util.promisify(dbCon.query).bind(dbCon);

dbCon.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);

    return;
  }
  console.log("Connected to database successfully");
});

const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ Error: "You are not authorized" });
  } else {
    jwt.verify(token, "jwt-secret-key", (err, decoded) => {
      if (err) {
        return res.json({ Error: "Token error" });
      } else {
        req.name = decoded.name;
        req.role = decoded.role;
        next();
      }
    });
  }
};

app.get("/auth", verifyUser, (req, res) => {
  return res.json({ Status: "Success", name: req.name, role: req.role });
});

function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}-${day}-${year}`;
}

// For backend request login
app.post("/login", (req, res) => {
  const sql = "SELECT * FROM tbl_account WHERE username = ?";
  dbCon.query(sql, [req.body.username], (err, data) => {
    if (err) {
      return res.json({ Error: "Error in query" });
    } else {
      if (data.length > 0) {
        // Check if the user is archived
        if (data[0].isArchived === 1) {
          return res.json({
            Error: "User is archived and not allowed to log in",
          });
        }

        bcrypt.compare(
          req.body.password.toString(),
          data[0].password,
          (err, bcryptResult) => {
            if (err) {
              return res.json({ Error: "Error in matching password" });
            } else if (bcryptResult) {
              if (data[0].accountType.toString() === "1") {
                const name = data[0].username;
                const role = data[0].accountType;

                const token = jwt.sign({ name, role }, "jwt-secret-key", {
                  expiresIn: "1day",
                });

                res.cookie("token", token);

                return res.json({
                  Status: "Success",
                  Message: "Admin",
                  Username: name,
                  Token: token,
                });
              } else if (data[0].accountType.toString() === "0") {
                const name = data[0].username;
                const role = data[0].accountType;

                const token = jwt.sign({ name, role }, "jwt-secret-key", {
                  expiresIn: "1day",
                });

                res.cookie("token", token);
                return res.json({
                  Status: "Success",
                  Message: "User",
                  Username: name,
                  Token: token,
                });
              } else {
                return res.json({ Error: data[0] });
              }
            } else {
              return res.json({ Error: "Password not match" });
            }
          }
        );
      } else {
        return res.json({ Error: "Username not found" });
      }
    }
  });
});

/* Dashboard Starts Here */
//For request of account manage and response
app.get("/getSalesToday", (req, res) => {
  const sql = `
  SELECT 
  s.*, 
  p.*, 
  b.*, 
  DATE_FORMAT(STR_TO_DATE(s.dateSale, '%M %d, %Y'), '%Y-%m-%d') AS saleDate,
  (SELECT ROUND(SUM(itemTotal), 2) 
   FROM tbl_sale 
   WHERE DATE(STR_TO_DATE(dateSale, '%M %d, %Y')) = CURDATE()) AS totalSalesToday
FROM tbl_sale s
LEFT JOIN tbl_product p ON s.prodId = p.prodId
LEFT JOIN tbl_batch b ON s.prodId = b.prodId AND s.batchNumber = b.batchNumber
WHERE DATE(STR_TO_DATE(s.dateSale, '%M %d, %Y')) = CURDATE()
ORDER BY p.prodName;

  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      if (result.length > 0) {
        return res.json({ Status: "Success", Message: result });
      } else {
        return res.json({ Status: "No Sales Today Recorded" });
      }
    }
  });
});

app.get("/getReturnTodayCount", (req, res) => {
  const sql = `SELECT COUNT(*) AS returnCount
  FROM tbl_return
  WHERE dateReturn = DATE_FORMAT(NOW(), '%m-%d-%Y')
  AND isAdmin = 0;
  `;
  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the return today." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getSalesMonth", (req, res) => {
  const sql = `
    SELECT ROUND(SUM(itemTotal), 2) AS totalSalesThisMonth
    FROM tbl_sale
    WHERE YEAR(STR_TO_DATE(dateSale, '%M %d, %Y')) = YEAR(CURDATE())
    AND MONTH(STR_TO_DATE(dateSale, '%M %d, %Y')) = MONTH(CURDATE())
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });

  app.get("/getStockouts", (req, res) => {
    const sql = `
    SELECT 
    p.prodId, 
    p.prodName, 
    p.prodDetails, 
    p.buyingPrice, 
    p.sellingPrice, 
    MIN(b.remainingQty) AS prodQty, 
    u.prodUnitId,
    u.prodUnitName, 
    c.containerName, 
    pu.suppId AS supplierId, 
    s.suppName AS supplierName, 
    MIN(b.batch_id) AS batch_id, 
    MIN(b.batchNumber) AS batchNumber, 
    MIN(b.expiryDate) AS earliestExpiryDate 
FROM tbl_product p 
LEFT JOIN tbl_batch b ON p.prodId = b.prodId 
LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId 
LEFT JOIN tbl_unitlist u ON up.prodUnitId = u.prodUnitId 
LEFT JOIN tbl_container c ON b.prodContainer = c.containerId 
LEFT JOIN tbl_purchase pu ON b.purchase_id = pu.purchase_id 
LEFT JOIN tbl_supplier s ON pu.suppId = s.suppId 
WHERE b.remainingQty < 10 
AND NOT EXISTS (
    SELECT 1
    FROM tbl_batch nb
    WHERE nb.prodId = p.prodId
    AND nb.isArchive <> 1
    AND nb.expiryDate > b.expiryDate
)
GROUP BY 
    p.prodId, 
    p.prodName, 
    p.prodDetails, 
    p.buyingPrice, 
    p.sellingPrice, 
    u.prodUnitId, 
    u.prodUnitName, 
    c.containerName, 
    supplierId, 
    supplierName
    ORDER BY p.prodName;
    `;

    dbCon.query(sql, (err, result) => {
      if (err) {
        return res.json({ Error: err });
      } else {
        return res.json({ Status: "Success", Message: result });
      }
    });
  });
});

app.get("/getSalesByDate", (req, res) => {
  const sql =
    "SELECT dateSale, SUM(itemTotal) AS totalSales FROM tbl_sale GROUP BY dateSale";

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.get("/getSalesByMonth", (req, res) => {
  const sql = `
    SELECT DATE_FORMAT(STR_TO_DATE(dateSale, '%M %d, %Y'), '%Y-%m') AS saleMonth,
    ROUND(SUM(itemTotal), 2) AS totalSales
  FROM tbl_sale
  GROUP BY saleMonth
  ORDER BY saleMonth

  
    `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.get("/getRecentSales", (req, res) => {
  const sql = `
  SELECT *
FROM tbl_sale
WHERE DATE(STR_TO_DATE(dateSale, '%b %d, %Y')) = CURDATE()
GROUP BY saleId
ORDER BY saleId DESC
LIMIT 10;

  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the recent sales" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getSlowMovingProducts", (req, res) => {
  const sql = `
  SELECT 
  p.prodId,
  p.prodName,
  p.prodDetails,
  p.sellingPrice,
  MIN(b.batch_id) AS batch_id,
  MIN(b.prodId) AS batch_prodId,
  MIN(b.purchase_id) AS purchase_id,
  MIN(b.batchNumber) AS batchNumber,
  MIN(b.manufacturingDate) AS manufacturingDate,
  MIN(b.expiryDate) AS minExpiryDate,
  IFNULL((b.remainingQty), 0) AS totalRemainingQty,
  IFNULL((b.remainingQty), 0) AS initialRemainingQty,
  IFNULL((b.batchQty), 0) AS totalBatchQty,  
  u.prodUnitName AS prodUnitName,
  SUM(s.qty) AS totalSoldInLastSixMonths
FROM tbl_product p
JOIN tbl_batch b ON p.prodId = b.prodId
LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId
LEFT JOIN tbl_unitlist u ON up.prodUnitId = u.prodUnitId
LEFT JOIN tbl_sale s ON p.prodId = s.prodId
WHERE b.isArchive <> 1
AND b.remainingQty > 0
AND (b.expiryDate >= NOW() OR b.expiryDate IS NULL)
AND STR_TO_DATE(s.dateSale, '%b %e, %Y') >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
GROUP BY p.prodId, p.prodName, p.prodDetails, p.sellingPrice, u.prodUnitName
HAVING totalSoldInLastSixMonths < 30
ORDER BY totalSoldInLastSixMonths ASC;



  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the slow moving." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getRecentSales", (req, res) => {
  const sql = `
  SELECT *
FROM tbl_sale
WHERE DATE(STR_TO_DATE(dateSale, '%b %d, %Y')) = CURDATE()
GROUP BY saleId
ORDER BY saleId DESC
LIMIT 10;

  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the recent sales" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getNearExpiryProducts", (req, res) => {
  const sql = `
  SELECT
  p.prodId,
  p.prodName,
  p.buyingPrice,
  p.prodDetails,
  p.sellingPrice,
  s.suppName AS supplierName,
  b.batchNumber,
  b.prodContainer,
  b.purchase_id,
  (b.remainingQty) AS totalRemainingQty,
  b.earliestExpiryDate,
  b.firstManufacturingDate,
  c.containerName,
  pur.prodUnitId,
  nb.batchNumber AS nextBatchNumber,
  nb.prodContainer AS nextProdContainer,
  nb.purchase_id AS nextPurchaseId,
  nb.remainingQty AS nextRemainingQty,
  nb.expiryDate AS nextExpiryDate,
  nb.manufacturingDate AS nextManufacturingDate,
  COUNT(*) OVER () AS rowCountPerProduct
FROM tbl_product p
JOIN (
  SELECT
      p2.suppId,
      b1.prodId,
      b1.batchNumber,
      b1.prodContainer,
      b1.purchase_id,
      b1.remainingQty,
      MIN(b1.expiryDate) AS earliestExpiryDate,
      b1.manufacturingDate AS firstManufacturingDate
  FROM tbl_batch b1
  LEFT JOIN tbl_purchase p2 ON b1.purchase_id = p2.purchase_id
  JOIN tbl_product p ON p.prodId = b1.prodId
  WHERE b1.isArchive <> 1
  AND b1.remainingQty > 0
  AND b1.expiryDate >= NOW() AND b1.expiryDate <= DATE_ADD(NOW(), INTERVAL 6 MONTH) -- Expires in the next 6 months
  AND b1.expiryDate = (
      SELECT MIN(expiryDate)
      FROM tbl_batch
      WHERE tbl_batch.prodId = b1.prodId
      AND remainingQty > 0
      AND expiryDate >= NOW() AND expiryDate <= DATE_ADD(NOW(), INTERVAL 6 MONTH) -- Expires in the next 6 months
  )
  GROUP BY p2.suppId, b1.prodId, b1.batchNumber, b1.purchase_id, b1.manufacturingDate
) b ON p.prodId = b.prodId
LEFT JOIN tbl_supplier s ON b.suppId = s.suppId
LEFT JOIN tbl_container c ON b.prodContainer = c.containerId
LEFT JOIN tbl_purchase pur ON b.purchase_id = pur.purchase_id AND p.prodId = pur.prodId
LEFT JOIN tbl_batch nb ON b.prodId = nb.prodId
  AND nb.expiryDate > b.earliestExpiryDate
  AND nb.isArchive <> 1
GROUP BY p.prodId, b.earliestExpiryDate
ORDER BY p.prodName, b.earliestExpiryDate;




  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the slow moving." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

/* Dashboard Ends Here */
/* Sales Starts Here */
//By Range
// API for fetching sales data by day grouped by dateSale
app.get("/api/getSalesByDay", (req, res) => {
  const selectedDate = req.query.selectedDate;

  const sql = `
  SELECT s.*, p.*, b.*, DATE_FORMAT(STR_TO_DATE(s.dateSale, '%M %e, %Y'), '%Y-%m-%d') AS 
  saleDate FROM tbl_sale s LEFT JOIN tbl_product p ON s.prodId = p.prodId LEFT JOIN tbl_batch b ON
   s.prodId = b.prodId AND s.batchNumber = b.batchNumber WHERE STR_TO_DATE(s.dateSale, '%M %e, %Y') = STR_TO_DATE(?, '%M %e, %Y')  ORDER BY s.saleId;
  `;

  dbCon.query(sql, [selectedDate], (err, results) => {
    if (err) {
      console.error("Error fetching sales data by day:", err);
      res.status(500).json({ Message: "Error fetching sales data by day" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

// API for fetching sales data by range grouped by dateSale
app.get("/api/getSalesByRange", (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const sql = `
    SELECT 
      s.*, p.*, b.*, DATE_FORMAT(STR_TO_DATE(s.dateSale, '%M %d, %Y'), '%Y-%m-%d') AS saleDate
    FROM tbl_sale s
    LEFT JOIN tbl_product p ON s.prodId = p.prodId
    LEFT JOIN tbl_batch b ON s.prodId = b.prodId AND s.batchNumber = b.batchNumber
    WHERE STR_TO_DATE(s.dateSale, '%M %d, %Y') BETWEEN STR_TO_DATE(?, '%M %d, %Y') AND STR_TO_DATE(?, '%M %d, %Y')
    ORDER BY s.saleId;
  `;

  dbCon.query(sql, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching sales data by range:", err);
      res.status(500).json({ Message: "Error fetching sales data by range" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

// API for fetching sales data by year grouped by dateSale
app.get("/api/getSalesByYear", (req, res) => {
  const selectedYear = req.query.year;

  const sql = `
    SELECT 
      s.*, p.*, b.*, DATE_FORMAT(STR_TO_DATE(s.dateSale, '%M %d, %Y'), '%Y-%m-%d') AS saleDate
    FROM tbl_sale s
    LEFT JOIN tbl_product p ON s.prodId = p.prodId
    LEFT JOIN tbl_batch b ON s.prodId = b.prodId AND s.batchNumber = b.batchNumber
    WHERE YEAR(STR_TO_DATE(s.dateSale, '%M %d, %Y')) = ?
    ORDER BY s.saleId;
  `;

  dbCon.query(sql, [selectedYear], (err, results) => {
    if (err) {
      console.error("Error fetching sales data by year:", err);
      res.status(500).json({ Message: "Error fetching sales data by year" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

// API for fetching sales data by year and month grouped by dateSale
app.get("/api/getSalesByYearAndMonth", (req, res) => {
  const selectedYearMonth = req.query.monthYear;

  const sql = `
    SELECT 
      s.*, p.*, b.*, DATE_FORMAT(STR_TO_DATE(s.dateSale, '%M %d, %Y'), '%Y-%m-%d') AS saleDate
    FROM tbl_sale s
    LEFT JOIN tbl_product p ON s.prodId = p.prodId
    LEFT JOIN tbl_batch b ON s.prodId = b.prodId AND s.batchNumber = b.batchNumber
    WHERE YEAR(STR_TO_DATE(s.dateSale, '%M %d, %Y')) = YEAR(STR_TO_DATE(?, '%M %d, %Y'))
      AND MONTH(STR_TO_DATE(s.dateSale, '%M %d, %Y')) = MONTH(STR_TO_DATE(?, '%M %d, %Y'))
    ORDER BY s.saleId;
  `;

  dbCon.query(sql, [selectedYearMonth, selectedYearMonth], (err, results) => {
    if (err) {
      console.error("Error fetching sales data by year and month:", err);
      res
        .status(500)
        .json({ Message: "Error fetching sales data by year and month" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

// API for fetching sales data by week grouped by dateSale
app.get("/api/getSalesByWeek", (req, res) => {
  const selectedWeek = req.query.week;

  const [selectedYear, selectedWeekNumber] = selectedWeek.split("-");

  const startDate = moment()
    .year(selectedYear)
    .week(selectedWeekNumber.slice(0, -2))
    .day("Sunday")
    .format("MMMM DD,YYYY");
  const endDate = moment()
    .year(selectedYear)
    .week(selectedWeekNumber.slice(0, -2))
    .day("Saturday")
    .format("MMMM DD,YYYY");
  console.log(startDate);
  console.log(endDate);
  const sql = `
    SELECT 
      s.*, p.*, b.*, DATE_FORMAT(STR_TO_DATE(s.dateSale, '%M %d, %Y'), '%Y-%m-%d') AS saleDate
    FROM tbl_sale s
    LEFT JOIN tbl_product p ON s.prodId = p.prodId
    LEFT JOIN tbl_batch b ON s.prodId = b.prodId AND s.batchNumber = b.batchNumber
    WHERE STR_TO_DATE(s.dateSale, '%M %d, %Y') BETWEEN STR_TO_DATE('${startDate}', '%M %d, %Y') AND STR_TO_DATE('${endDate}', '%M %d, %Y')
    ORDER BY s.saleId;
  `;

  dbCon.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching sales data by week:", err);
      res.status(500).json({ Message: "Error fetching sales data by week" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

app.get("/getTodaySalesReport", (req, res) => {
  const sql = `SELECT 
  s.*, p.*, b.*, DATE_FORMAT(STR_TO_DATE(s.dateSale, '%M %d, %Y'), '%Y-%m-%d') AS saleDate
FROM tbl_sale s
LEFT JOIN tbl_product p ON s.prodId = p.prodId
LEFT JOIN tbl_batch b ON s.prodId = b.prodId AND s.batchNumber = b.batchNumber
WHERE DATE(STR_TO_DATE(s.dateSale, '%M %d, %Y')) = CURDATE()
ORDER BY s.saleId;
`;
  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the sales today." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

//for purchase
// API for fetching purchase data by year

function formatDates(initialDate) {
  // Parse the initial date string
  const parsedDate = new Date(initialDate);

  // Format the date as 'YYYY-MM-DD'
  const year = parsedDate.getFullYear();
  const month = (parsedDate.getMonth() + 1).toString().padStart(2, "0");
  const day = parsedDate.getDate().toString().padStart(2, "0");

  // Return the formatted date string
  return `${year}-${month}-${day}`;
}
app.get("/api/purchaseByDay", (req, res) => {
  const selectedDate = formatDates(req.query.selectedDate);

  const sql = `
    SELECT 
      tp.prodId,
      tp.prodName,
      tp.prodDetails,
      tpr.purchase_id,
      tpr.buyingPrice,
      tpr.receivedQty,
      tpr.dateReq,
      tu.prodUnitName,
      tb.batchQty,
      tb.remainingQty,
      tb.batchNumber,
      tb.expiryDate,
      tb.manufacturingDate,
      tpr.buyingPrice * tpr.receivedQty AS itemTotal
    FROM tbl_batch tb
    JOIN tbl_purchase tpr ON tb.purchase_id = tpr.purchase_id
    JOIN tbl_product tp ON tp.prodId = tb.prodId
    JOIN tbl_unitlist tu ON tu.prodUnitId = tpr.prodUnitId
    WHERE DATE_FORMAT(STR_TO_DATE(tb.manufacturingDate, '%Y-%m-%d'), '%Y-%m-%d') = ?
    GROUP BY tp.prodId, tpr.purchase_id, tb.batchNumber
    ORDER BY STR_TO_DATE(tb.manufacturingDate, '%Y-%m-%d') DESC
  `;

  dbCon.query(sql, [selectedDate], (err, results) => {
    if (err) {
      console.error("Error fetching purchase data by day:", err);
      res.status(500).json({ Message: "Error fetching purchase data by day" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

// API for fetching purchase data by date range
app.get("/api/purchaseByDateRange", (req, res) => {
  const startDate = formatDates(req.query.startDate);
  const endDate = formatDates(req.query.endDate);
  const sql = `
    SELECT 
      tp.prodId,
      tp.prodName,
      tp.prodDetails,
      tpr.purchase_id,
      tpr.buyingPrice,
      tpr.receivedQty,
      tpr.dateReq,
      tu.prodUnitName,
      tb.batchQty,
      tb.remainingQty,
      tb.batchNumber,
      tb.expiryDate,
      tb.manufacturingDate,
      tpr.buyingPrice * tpr.receivedQty AS itemTotal
    FROM tbl_batch tb 
    JOIN tbl_purchase tpr ON tb.purchase_id = tpr.purchase_id 
    JOIN tbl_product tp ON tp.prodId = tb.prodId 
    JOIN tbl_unitlist tu ON tu.prodUnitId = tpr.prodUnitId 
    WHERE DATE(tb.manufacturingDate) BETWEEN ? AND ?
    GROUP BY tp.prodId, tpr.purchase_id, tb.batchNumber
    ORDER BY STR_TO_DATE(tb.manufacturingDate, '%Y-%m-%d') DESC
  `;

  dbCon.query(sql, [startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching purchase data by date range:", err);
      res
        .status(500)
        .json({ Message: "Error fetching purchase data by date range" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

app.get("/api/purchaseByYear", (req, res) => {
  const selectedYear = req.query.year;

  const sql = `
    SELECT 
      tp.prodId,
      tp.prodName,
      tp.prodDetails,
      tpr.purchase_id,
      tpr.buyingPrice,
      tpr.receivedQty,
      tpr.dateReq,
      tu.prodUnitName,
      tb.batchQty,
      tb.batchNumber,
      tb.remainingQty,
      tb.expiryDate,
      tb.manufacturingDate,
      tpr.buyingPrice * tpr.receivedQty AS itemTotal
    FROM tbl_batch tb 
    JOIN tbl_purchase tpr ON tb.purchase_id = tpr.purchase_id 
    JOIN tbl_product tp ON tp.prodId = tb.prodId 
    JOIN tbl_unitlist tu ON tu.prodUnitId = tpr.prodUnitId  
    WHERE YEAR(tb.manufacturingDate) = ?
    GROUP BY tp.prodId, tpr.purchase_id, tb.batchNumber
    ORDER BY STR_TO_DATE(tb.manufacturingDate, '%Y-%m-%d') DESC
  `;

  dbCon.query(sql, [selectedYear], (err, results) => {
    if (err) {
      console.error("Error fetching purchase data by year:", err);
      res.status(500).json({ Message: "Error fetching purchase data by year" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

// API for fetching purchase data by year and month
app.get("/api/purchaseByYearAndMonth", (req, res) => {
  const selectedYearMonth = formatDates(req.query.monthYear);
  const sql = `
  SELECT 
  tp.prodId,
  tp.prodName,
  tp.prodDetails,
  tpr.purchase_id,
  tpr.buyingPrice,
  tpr.receivedQty,
  tpr.dateReq,
  tu.prodUnitName,
  tb.batchQty,
  tb.batchNumber,
  tb.remainingQty,
  tb.expiryDate,
  tb.manufacturingDate,
  tpr.buyingPrice * tpr.receivedQty AS itemTotal
FROM tbl_batch tb
JOIN tbl_purchase tpr ON tb.purchase_id = tpr.purchase_id
JOIN tbl_product tp ON tp.prodId = tb.prodId
JOIN tbl_unitlist tu ON tu.prodUnitId = tpr.prodUnitId
WHERE YEAR(tpr.dateReq) = YEAR(?)
  AND MONTH(tb.manufacturingDate) = MONTH(?)
GROUP BY tp.prodId, tpr.purchase_id, tb.batchNumber
  ORDER BY STR_TO_DATE(tb.manufacturingDate, '%Y-%m-%d') DESC








  `;

  dbCon.query(sql, [selectedYearMonth, selectedYearMonth], (err, results) => {
    if (err) {
      console.error("Error fetching purchase data by year and month:", err);
      res
        .status(500)
        .json({ Message: "Error fetching purchase data by year and month" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

app.get("/api/purchaseByWeek", (req, res) => {
  const selectedWeek = req.query.week;
  const [selectedYear, selectedWeekNumber] = selectedWeek.split("-");

  const startDate = moment()
    .year(selectedYear)
    .week(selectedWeekNumber.slice(0, -2))
    .day("Sunday")
    .format("YYYY-MM-DD");
  const endDate = moment()
    .year(selectedYear)
    .week(selectedWeekNumber.slice(0, -2))
    .day("Saturday")
    .format("YYYY-MM-DD");

  const sql = `
    SELECT 
      tp.prodId,
      tp.prodName,
      tp.prodDetails,
      tpr.purchase_id,
      tpr.buyingPrice,
      tpr.receivedQty,
      tpr.dateReq,
      tu.prodUnitName,
      tb.batchQty,
      tb.batchNumber,
      tb.remainingQty,
      tb.expiryDate,
      tb.manufacturingDate,
      tpr.buyingPrice * tpr.receivedQty AS itemTotal
    FROM tbl_batch tb
    JOIN tbl_purchase tpr ON tb.purchase_id = tpr.purchase_id
    JOIN tbl_product tp ON tp.prodId = tb.prodId
    JOIN tbl_unitlist tu ON tu.prodUnitId = tpr.prodUnitId
    WHERE DATE(tpr.dateReq) BETWEEN '${startDate}' AND '${endDate}'
    GROUP BY tp.prodId, tpr.purchase_id, tb.batchNumber
    ORDER BY STR_TO_DATE(tpr.dateReq, '%Y-%m-%d') DESC
  `;

  dbCon.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching purchase data by week:", err);
      res.status(500).json({ Message: "Error fetching purchase data by week" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

app.get("/api/getDefaultSales", (req, res) => {
  const sql = `
    SELECT DATE_FORMAT(STR_TO_DATE(dateSale, '%M %d, %Y'), '%Y-%m-%d') AS saleDate,
    ROUND(SUM(itemTotal), 2) AS totalSales,
    cash,
    saleId
    FROM tbl_sale
    GROUP BY saleDate
    ORDER BY saleDate DESC;
  `;

  dbCon.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching sales data:", err);
      res.status(500).json({ Message: "Error fetching sales data" });
    } else {
      res.json({ Status: "Success", Message: results });
    }
  });
});

app.get("/getProductReport", (req, res) => {
  const sql = `
  SELECT 
    tb.*,
    tp.*,
    tpr.*,
    tp.prodName
FROM 
    tbl_batch tb
JOIN 
    tbl_purchase tpr ON tb.purchase_id = tpr.purchase_id
JOIN 
    tbl_product tp ON tp.prodId = tpr.prodId;

  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the data." });
    }
    return res.json({ Status: "Success", Message: result });
  });
});
/* Sales Ends Here */

/* Request Starts Here */

//For getting all the product
app.get("/requestProduct", (req, res) => {
  const sql = `
  SELECT
  p.prodId,
  p.prodName,
  p.buyingPrice,
  p.prodDetails,
  p.sellingPrice,
  s.suppName AS supplierName,
  b.batchNumber,
  b.prodContainer,
  b.purchase_id,
  (b.remainingQty) AS totalRemainingQty, 
  b.earliestExpiryDate,
  b.firstManufacturingDate,
  c.containerName,
  pur.prodUnitId,
  u.prodUnitName, -- Adding prodUnitName from tbl_unitlist
  nb.batchNumber AS nextBatchNumber,
  nb.prodContainer AS nextProdContainer,
  nb.purchase_id AS nextPurchaseId,
  nb.remainingQty AS nextRemainingQty,
  nb.expiryDate AS nextExpiryDate,
  nb.manufacturingDate AS nextManufacturingDate
FROM tbl_product p
JOIN (
  -- Your existing subquery to get the current batch-product information
  SELECT
      p2.suppId,
      b1.prodId,
      b1.batchNumber,
      b1.prodContainer,
      b1.purchase_id,
      b1.remainingQty,
      MIN(b1.expiryDate) AS earliestExpiryDate,
      b1.manufacturingDate AS firstManufacturingDate
  FROM tbl_batch b1
  LEFT JOIN tbl_purchase p2 ON b1.purchase_id = p2.purchase_id
  JOIN tbl_product p ON p.prodId = b1.prodId
  WHERE b1.isArchive <> 1
  AND b1.remainingQty > 0
  AND b1.expiryDate = (
      SELECT MIN(expiryDate)
      FROM tbl_batch
      WHERE tbl_batch.prodId = b1.prodId
      AND remainingQty > 0
  )
  GROUP BY p2.suppId, b1.prodId, b1.batchNumber, b1.purchase_id, b1.manufacturingDate
) b ON p.prodId = b.prodId
LEFT JOIN tbl_supplier s ON b.suppId = s.suppId
LEFT JOIN tbl_container c ON b.prodContainer = c.containerId 
LEFT JOIN tbl_purchase pur ON b.purchase_id = pur.purchase_id AND p.prodId = pur.prodId 
LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId 
LEFT JOIN tbl_unitlist u ON up.prodUnitId = u.prodUnitId -- Joining tbl_unitlist
-- Left join to get the next batch-product
LEFT JOIN tbl_batch nb ON b.prodId = nb.prodId
  AND nb.expiryDate > b.earliestExpiryDate
  AND nb.isArchive <> 1
GROUP BY p.prodId, b.earliestExpiryDate
ORDER BY p.prodName, b.earliestExpiryDate;


  
  `;
  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json([{ Error: err }]);
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.post("/requestToAdmin", (req, res) => {
  const data = {
    requestName: req.body.requestName,
    requestDetails: req.body.requestDetails,
    requestFrom: req.body.requestFrom,
    requestTo: req.body.requestTo,
    prodId: req.body.prodId,
    prodName: req.body.prodName,
    prodDetails: req.body.prodDetails,
    prodPrice: req.body.prodPrice,
    prodContainer: req.body.prodContainer,
    purchase_id: parseInt(req.body.purchaseId),
    suppId: req.body.suppId,
    reqDate: req.body.reqDate,
    status: req.body.status,
  };

  const checkPendingRequestQuery = `
  SELECT * FROM tbl_request 
  WHERE prodId = "${data.prodId}" 
    AND requestName = "${data.requestName}" 
    AND requestDetails = "${data.requestDetails}" 
    AND status = 0`;

  dbCon.query(checkPendingRequestQuery, (err, result) => {
    if (err) {
      return res.json([{ Error: err, Message: result }]);
    }

    if (result.length > 0) {
      return res.json({ Error: "There is a pending request of this product." });
    }

    const sql = `
        INSERT INTO tbl_request (
          requestName,
          requestDetails,
          requestFrom,
          requestTo,
          prodId,
          prodName,
          prodDetails,
          prodPrice,
          prodContainer,
          purchase_id,
          suppId,
          reqDate, 
          status,
          reqType) VALUES ("${data.requestName}","${data.requestDetails}", "${data.requestFrom}","${data.requestTo}",${data.prodId},"${data.prodName}", "${data.prodDetails}",${data.prodPrice}, ${data.prodContainer}, "${data.purchase_id}", "${data.suppId}","${data.reqDate}",${data.status} , 1)`;

    dbCon.query(sql, (err, result) => {
      if (err) {
        return res.json([{ Error: err }]);
      }

      return res.json({ Status: "Success", Message: result });
    });
  });
});

app.post("/requestToUpdate", (req, res) => {
  const data = {
    requestName: req.body.requestName,
    requestDetails: req.body.requestDetails,
    requestFrom: req.body.requestFrom,
    requestTo: req.body.requestTo,
    prodId: req.body.prodId,
    prodName: req.body.prodName,
    prodDetails: req.body.prodDetails,
    prodPrice: req.body.prodPrice,
    prodContainer: req.body.prodContainer,
    purchase_id: parseInt(req.body.purchaseId),
    suppId: req.body.suppId,
    reqDate: req.body.reqDate,
    status: req.body.status,
    userName: req.body.userName,
  };
  const dateNotif = formatDate(new Date());

  const checkPendingRequestQuery = `
    SELECT * FROM tbl_request WHERE requestName = "${data.requestName}" AND requestDetails = "${data.requestDetails}" AND prodId = "${data.prodId}" AND status = 0`;

  dbCon.query(checkPendingRequestQuery, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error sending the request." });
    }

    if (result && result.length > 0) {
      return res.json({ Error: "There is a pending request of this product." });
    }

    const sql = `
      INSERT INTO tbl_request (
        requestName,
        requestDetails,
        requestFrom,
        requestTo,
        prodId,
        prodName,
        prodDetails,
        prodPrice,
        prodContainer,
        purchase_id,
        suppId,
        reqDate, 
        status,
        reqType
      ) VALUES ("${data.requestName}", "${data.requestDetails}", "${data.requestFrom}", "${data.requestTo}", ${data.prodId}, "${data.prodName}", "${data.prodDetails}", ${data.prodPrice}, ${data.prodContainer}, "${data.purchase_id}", "${data.suppId}", "${data.reqDate}", ${data.status}, 0)`;

    dbCon.query(sql, (err, result) => {
      if (err) {
        return res.json({ Error: err });
      }

      const insertNotif = `
        INSERT INTO tbl_notification (username, userActivity, dateNotif) VALUES ('${data.userName}','Request to update ${data.prodName}' , '${dateNotif}')
      `;

      dbCon.query(insertNotif, (error, resultOfAdded) => {
        if (error) {
          return res.json({
            Error: "There is an error inserting in the table",
          });
        }

        // All operations completed successfully
        return res.json({ Status: "Success" }); // Send response after successful insertion
      });
    });
  });
});

app.post("/addToPurchaseRequest", (req, res) => {
  const sql = `INSERT INTO tbl_purchase (purchase_id,prodId,suppId,prodUnitId,prodQtyWhole,buyingPrice,totalPrice,dateReq,purchaseDeliveryDate,enableCount,purchaseStatus,purchaseType) VALUES (?)`;
  const values = [
    parseInt(req.body.purchaseId),
    req.body.prodId,
    req.body.suppId,
    req.body.prodUnitId,
    parseInt(req.body.prodQty),
    req.body.buyingPrice,
    req.body.totalPrice,
    req.body.purchaseDate,
    req.body.deliveryDate,
    req.body.enableCount,
    0,
    1,
  ];
  const prodName = req.body.prodName;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());

  dbCon.query(sql, [values], (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ Error: "There is an error adding this purchase" });
    }
    const insertNotif = `
      INSERT INTO tbl_notification (username, userActivity, dateNotif) 
      VALUES ('${userName}','Request to purchase ${prodName}.' , '${dateNotif}')
    `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        return res.json({ Error: "There is an error inserting in the table" });
      }

      // Both queries succeeded
      return res.json({ Status: "Success" });
    });
  });
});

app.get("/purchaseDataRequest/:supplierId/:purchase_id", (req, res) => {
  const supplierId = req.params.supplierId;
  const purchase_id = req.params.purchase_id;
  const query = `
  SELECT DISTINCT
  p.purchase_id,
  p.prodId,
  p.suppId,
  p.prodUnitId,
  pr.prodName,
  pr.prodDetails, 
  pu.prodUnitName, 
  p.prodQtyWhole,
  p.pcsPerUnit,
  p.receivedQty,
  p.buyingPrice,
  p.totalPrice,
  p.sellingPrice,
  p.enableCount,
  p.purchaseType,
  DATE_FORMAT(p.purchaseDeliveryDate, '%b %d, %Y') AS formattedPurchaseDeliveryDate,
  DATE_FORMAT(p.dateReq, '%b %d, %Y') AS formattedDateReq,
  DATE_FORMAT(p.dateReceive, '%b %d, %Y') AS formattedDateReceive,
  DATE_FORMAT(p.dateExpiry, '%b %d, %Y') AS formattedDateExpiry,
  p.purchaseStatus
FROM tbl_purchase p
JOIN tbl_product pr ON p.prodId = pr.prodId
JOIN tbl_unitlist pu ON p.prodUnitId = pu.prodUnitId 
WHERE p.suppId = ${supplierId} AND p.purchase_id = ${purchase_id}  
ORDER BY p.purchase_id;

  `;

  dbCon.query(query, (err, results) => {
    if (err) {
      return res.json({ Error: "Error fetching purchase data" });
    } else {
      return res.json({ Status: "Success", Message: results });
    }
  });
});

app.put("/approvedReturnItem", async (req, res) => {
  const returnData = req.body;
  const dateNotif = formatDate(new Date());
  const dateReturn = formatDate(new Date());

  // Check if salesToReturn is an array
  if (!Array.isArray(returnData)) {
    return res.status(400).json({
      Status: "Error",
      Message: "Invalid data format",
      Error: "Invalid data format",
    });
  }

  // Create a database transaction to ensure data consistency
  dbCon.beginTransaction(async (err) => {
    if (err) {
      return dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }

    try {
      // Update tbl_all_sales with the new AllTotalSale
      const updateAllSalesQuery = `
        UPDATE tbl_all_sales
        SET AllTotalSale = ?
        WHERE saleId = ?;
      `;
      await queryPromise(updateAllSalesQuery, [
        returnData[0].totalSale,
        returnData[0].saleId,
      ]);

      const updateSaleQuery = `
        UPDATE tbl_sale
        SET isReturn = 1,
            qty = CASE 
                    WHEN qty <> ? THEN (qty - ?)
                    ELSE qty
                  END,
            itemTotal = (itemTotal - ?),
            totalSale = ?
        WHERE saleId = ? AND prodId = ? AND batchNumber = ?;
      `;

      for (const item of returnData) {
        await queryPromise(updateSaleQuery, [
          item.prodQty,
          item.prodQty,
          item.itemTotal,
          item.totalSale,
          item.saleId,
          item.prodId,
          item.batchNumber,
        ]);
      }

      // Insert new return data into tbl_return
      const insertReturnQuery = `
        INSERT INTO tbl_return (saleId, prodId, batchNumber, prodQty, price, totalPrice, returnRemarks, dateReturn,isAdmin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);
      `;
      for (const item of returnData) {
        await queryPromise(insertReturnQuery, [
          item.saleId,
          item.prodId,
          item.batchNumber,
          item.prodQty,
          item.itemTotal,
          item.totalSale,
          item.requestFrom,
          dateReturn,
        ]);
      }

      // Update request status to approved
      const updateRequestQuery = `
        UPDATE tbl_request
        SET status = 1
        WHERE requestId = ?
      `;
      for (const item of returnData) {
        await queryPromise(updateRequestQuery, [item.requestId]);
      }

      // Commit the transaction
      dbCon.commit((commitErr) => {
        if (commitErr) {
          console.log(commitErr);
          return dbCon.rollback(() => {
            res.status(500).json({
              Status: "Error",
              Message: "Transaction Error",
              Error: "There is an error in approving this.",
            });
          });
        }

        // Insert notifications for each product that has been approved for return
        returnData.forEach(async (item) => {
          const insertNotif = `
            INSERT INTO tbl_notification (username, userActivity, dateNotif,isInclude) 
            VALUES ('${item.requestName}', 'The return of the product ${item.prodName} is approved.', '${dateNotif}',1)
          `;

          try {
            await queryPromise(insertNotif);
          } catch (error) {
            console.error("Error inserting notification:", error);
            // Handle error if needed
          }
        });

        res.json({ Status: "Success" });
      });
    } catch (error) {
      console.log(error);

      dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }
  });
});

app.put("/declinedReturnItem", async (req, res) => {
  const returnData = req.body;
  const dateNotif = formatDate(new Date());
  const dateReturn = formatDate(new Date());

  // Check if salesToReturn is an array
  if (!Array.isArray(returnData)) {
    return res.status(400).json({
      Status: "Error",
      Message: "Invalid data format",
      Error: "Invalid data format",
    });
  }

  // Create a database transaction to ensure data consistency
  dbCon.beginTransaction(async (err) => {
    if (err) {
      return dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }

    try {
      const updateRequest = `
        UPDATE tbl_request SET status = 2 WHERE requestId = ?
      `;
      for (const item of returnData) {
        await queryPromise(updateRequest, [item.requestId]);
      }

      // Commit the transaction
      dbCon.commit((commitErr) => {
        if (commitErr) {
          console.log(commitErr);
          return dbCon.rollback(() => {
            res.status(500).json({
              Status: "Error",
              Message: "Transaction Error",
              Error: "There is an error in declining this.",
            });
          });
        }

        // Insert notifications for each product that has been declined for return
        returnData.forEach(async (item) => {
          const insertNotif = `
            INSERT INTO tbl_notification (username, userActivity, dateNotif,isInclude) 
            VALUES ('${item.requestName}', 'The return of the product ${item.prodName} is declined', '${dateNotif}',1)
          `;

          try {
            await queryPromise(insertNotif);
          } catch (error) {
            console.error("Error inserting notification:", error);
            // Handle error if needed
          }
        });

        res.json({ Status: "Success" });
      });
    } catch (error) {
      console.log(error);

      dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }
  });
});

app.get("/getRequestPending", (req, res) => {
  const sql = `
    SELECT tr.*, tc.containerName
    FROM tbl_request tr
    LEFT JOIN tbl_container tc ON tr.prodContainer = tc.containerId 
    WHERE tr.status = 0
    ORDER BY STR_TO_DATE(tr.reqDate, '%Y-%m-%d') DESC;
     `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.put("/approvedPurchase/:requestId/:purchase_id", (req, res) => {
  const purchase_id = req.params.purchase_id;
  const requestId = req.params.requestId;
  const requestName = req.body.requestName;
  const dateNotif = formatDate(new Date());
  const prodName = req.body.prodName;

  const sql = `UPDATE tbl_purchase SET purchaseType = 0 WHERE purchase_id = ${purchase_id}`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({
        Error: "There is an error in approving this. Try again later.",
      });
    }

    const sqlUpdateRequest = `UPDATE tbl_request SET status = 1 WHERE requestId = ${requestId}`;
    dbCon.query(sqlUpdateRequest, (errors, results) => {
      if (errors) {
        return res
          .status(500)
          .json({ Error: "There is an error in this request." });
      }
      const insertNotif = `
      INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to purchase - ${prodName} has been approved.' , '${dateNotif}' , 1)
    `;

      dbCon.query(insertNotif, (error, resultOfAdded) => {
        if (error) {
          return res.json({
            Error: "There is an error inserting in the table",
          });
        }
      });
      return res.status(200).json({ Status: "Success" });
    });
  });
});

app.get("/getRequestApproved", (req, res) => {
  const sql =
    "SELECT * FROM tbl_request WHERE status = 1 ORDER BY STR_TO_DATE(reqDate, '%Y-%m-%d') ASC  ";

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.get("/getDeclinedRequest", (req, res) => {
  const sql =
    "SELECT * FROM tbl_request WHERE status = 2 ORDER BY STR_TO_DATE(reqDate, '%Y-%m-%d') ASC  ";

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.get("/getRequestUser/:userName", (req, res) => {
  const userName = req.params.userName;

  const sql = `
  SELECT 
  tr.*,
  tb.batchQty,
  tp.prodUnitId,
  tp.purchaseDeliveryDate,
  tp.prodQtyWhole,
  tp.buyingPrice,
  tu.prodUnitName,
  tc.containerName
FROM tbl_request tr
LEFT JOIN tbl_batch tb ON tr.purchase_id = tb.purchase_id
LEFT JOIN tbl_purchase tp ON tr.purchase_id = tp.purchase_id
LEFT JOIN tbl_unitlist tu ON tp.prodUnitId = tu.prodUnitId
LEFT JOIN tbl_container tc ON tr.prodContainer = tc.containerId 
WHERE tr.requestName = '${userName}'
ORDER BY STR_TO_DATE(dateReq, '%Y-%m-%m') ASC;


  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      console.log(result);
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.post("/updateApprovedFromRequest", (req, res) => {
  const requestName = req.body.requestName;
  const dateNotif = formatDate(new Date());
  const reqId = req.body.requestId;
  const status = req.body.status;
  const request = req.body.requestDetails;
  const productName = req.body.prodName;
  const productDetails = req.body.prodDetails;
  const productContainer = req.body.prodContainer;
  const prodId = req.body.prodId;
  const batchNumber = req.body.batchNumber;
  const requestTo = req.body.requestTo;

  if (status === 1) {
    if (request === "Stock Request.") {
      const sqlRequestStockForApprovedToRequestChange = `UPDATE tbl_request SET status = ${status} WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestStockForApprovedToRequestChange, (err, result) => {
        if (err) {
          res.status(500).json({ Error: err });
        } else {
          const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to add stock has been approved.' , '${dateNotif}' , 1)
        `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in the table",
              });
            }
          });
          return res.json({
            Status: "Success",
            Message: "This is a stock request",
          });
        }
      });
    } else if (request === "Update a product.") {
      const sqlRequestForApprovedToRequestChange = `UPDATE tbl_request SET status = ${status} WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestForApprovedToRequestChange, (err, result) => {
        if (err) {
          res.status(500).json({ Error: err });
        } else {
          const sqlRequestForApproveToProductChange = `
            UPDATE tbl_product
            SET prodName = '${productName}', prodDetails = '${productDetails}'
            WHERE prodId = ${prodId} 
          `;
          dbCon.query(sqlRequestForApproveToProductChange, (err, result) => {
            if (err) {
              return res.json({ Error: err });
            } else {
              // Update prodContainer in tbl_batch
              const sqlUpdateBatch = `
                UPDATE tbl_batch
                SET prodContainer = '${productContainer}'
                WHERE prodId = ${prodId} AND batchNumber = '${batchNumber}';
              `;
              dbCon.query(sqlUpdateBatch, (err) => {
                if (err) {
                  return res.json({
                    Error:
                      "There is an error updating prodContainer in tbl_batch.",
                  });
                } else {
                  const insertNotif = `
                  INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to update ${productName} has been approved.' , '${dateNotif}' , 1)
                `;

                  dbCon.query(insertNotif, (error, resultOfAdded) => {
                    if (error) {
                      return res.json({
                        Error: "There is an error inserting in the table",
                      });
                    }
                  });
                  return res.json({ Status: "Success" });
                }
              });
            }
          });
        }
      });
    }
  } else if (status === 2) {
    if (request === "Stock Request.") {
      const sqlRequestStockForDecline = `UPDATE tbl_request SET status = ${status}, requestTo = 'To Quantity: Declined' WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestStockForDecline, (err, result) => {
        if (err) {
          return res.json({ Error: err });
        } else {
          const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to restock product - ${productName} has been declined.' , '${dateNotif}' , 1)
        `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in the table",
              });
            }
          });

          return res.json({ Status: "Success" });
        }
      });
    } else {
      const sqlRequestStockForDecline = `UPDATE tbl_request SET status = ${status} WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestStockForDecline, (err, result) => {
        if (err) {
          return res.json({ Error: err });
        } else {
          const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to restock product - ${productName} has been declined.' , '${dateNotif}' , 1)
        `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in the table",
              });
            }
          });
          return res.json({ Status: "Success" });
        }
      });
    }
  }
});

app.put("/updateDeclineRequest", (req, res) => {
  const reqId = req.body.requestId;
  const requestName = req.body.requestName;
  const dateNotif = formatDate(new Date());
  const status = req.body.status;
  const request = req.body.requestDetails;
  const productName = req.body.prodName;
  const productDetails = req.body.prodDetails;
  const productContainer = req.body.prodContainer;
  const prodId = req.body.prodId;
  const requestTo = req.body.requestTo;

  if (status === 1) {
    if (request === "Stock Request.") {
      const sqlRequestStockForApprovedToRequestChange = `UPDATE tbl_request SET status = ${status} WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestStockForApprovedToRequestChange, (err, result) => {
        if (err) {
          res.status(500).json({ Error: err });
        } else {
          const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to restock product - ${productName} has been declined.' , '${dateNotif}' , 1)
        `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in the table",
              });
            }
          });

          res.json({ Status: "Success", Message: "This is stock request" });
        }
      });
    } else if (request === "Update a product.") {
      const sqlRequestForApprovedToRequestChange = `UPDATE tbl_request SET status = ${status} WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestForApprovedToRequestChange, (err, result) => {
        if (err) {
          res.status(500).json({ Error: err });
        } else {
          const sqlRequestForApproveToProductChange = `UPDATE tbl_product SET prodName = '${productName}', prodDetails = '${productDetails}', prodContainer = '${productContainer}' WHERE prodId = ${prodId} `;
          dbCon.query(sqlRequestForApproveToProductChange, (err, result) => {
            if (err) {
              return res.json({ Error: err });
            } else {
              const insertNotif = `
              INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to update product - ${productName} has been declined.' , '${dateNotif}' , 1)
            `;

              dbCon.query(insertNotif, (error, resultOfAdded) => {
                if (error) {
                  return res.json({
                    Error: "There is an error inserting in the table",
                  });
                }
              });
              return res.json({ Status: "Success" });
            }
          });
        }
      });
    }
  } else if (status === 2) {
    if (request === "Stock Request.") {
      const sqlRequestStockForDecline = `UPDATE tbl_request SET status = ${status}, requestTo = 'To Quantity: Declined' WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestStockForDecline, (err, result) => {
        if (err) {
          return res.json({ Error: err });
        } else {
          const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to restock product - ${productName} has been declined.' , '${dateNotif}' , 1)
        `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in the table",
              });
            }
          });
          return res.json({ Status: "Success" });
        }
      });
    } else {
      const sqlRequestStockForDecline = `UPDATE tbl_request SET status = ${status} WHERE requestId = ${reqId} `;
      dbCon.query(sqlRequestStockForDecline, (err, result) => {
        if (err) {
          return res.json({ Error: err });
        } else {
          const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to update product - ${productName} has been declined.' , '${dateNotif}' , 1)
        `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in the table",
              });
            }
          });
          return res.json({ Status: "Success" });
        }
      });
    }
  }
});

app.put("/declinePurchaseRequest/:requestId/:purchase_id", (req, res) => {
  const requestId = req.params.requestId;
  const requestName = req.body.requestName;
  const dateNotif = formatDate(new Date());
  const prodName = req.body.prodName;
  const sql = `UPDATE tbl_request SET status = 2 WHERE requestId = ${requestId}`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "There is an error performing this action. Try again later.",
      });
    }
    const insertNotif = `
    INSERT INTO tbl_notification (username, userActivity, dateNotif ,isInclude) VALUES ('${requestName}','Your request to purchase product - ${prodName} has been declined.' , '${dateNotif}' , 1)
  `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        return res.json({
          Error: "There is an error inserting in the table",
        });
      }
    });

    return res.json({ Status: "Success" });
  });
});

/* Request Ends Here */
/* Manage Account Starts Here */
//For request of account manage and response

app.get("/accountManage", (req, res) => {
  const sql = `SELECT tbl_account.*, tbl_account_roles.*
    FROM tbl_account
    LEFT JOIN tbl_account_roles ON tbl_account.roleId = tbl_account_roles.roleId
    WHERE isArchived <> 1 AND username <> "officialadmin1"
    ORDER BY tbl_account.username ASC;
    
    `;

  dbCon.query(sql, (err, result) => {
    if (err) res.json([{ Error: "There is an error fetching accounts." }]);
    return res.json({ Status: "Success", Message: result });
  });
});

app.post("/accountManage", (req, res) => {
  const { username, password, roleId } = req.body;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());

  // Validate password length
  if (username.length < 8) {
    return res.json({ Error: "Username must be at least 8 characters long" });
  }

  // Validate password length
  if (password.length < 8) {
    return res.json({ Error: "Password must be at least 8 characters long" });
  }

  // Check if the username already exists in the database
  const checkUsernameQuery = "SELECT * FROM tbl_account WHERE username = ?";
  dbCon.query(checkUsernameQuery, [username], (error, results) => {
    if (error) {
      return res
        .status(500)
        .json({ Error: "Error checking username in the database" });
    }

    if (results.length > 0) {
      return res.json({ Error: "Sorry, account already exists." });
    }

    // If the username is unique, hash the password and insert the account
    bcrypt.hash(password.toString(), salt, (err, hash) => {
      if (err) {
        return res.status(500).json({ Error: "Error hashing the password" });
      }

      const insertAccountQuery =
        "INSERT INTO tbl_account (username, password, roleId) VALUES (?, ?, ?)";
      const values = [username, hash, roleId];

      dbCon.query(insertAccountQuery, values, (err, result) => {
        if (err) {
          return res.status(500).json({ Error: err });
        } else {
          const insertNotif = `
            INSERT INTO tbl_notification (username, userActivity, dateNotif) VALUES ('${userName}','Added ${username} in account.' , '${dateNotif}')
          `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in the table",
              });
            } else {
              return res.json({
                Status: "Success",
              });
            }
          });
        }
      });
    });
  });
});

app.get("/accountManage/:id", (req, res) => {
  const sql = "SELECT * from tbl_account WHERE username = ?";
  const id = req.params.id;
  dbCon.query(sql, [id], (err, result) => {
    if (err) return res.json({ Message: `Error: ${err}` });
    return res.json({ Message: result });
  });
});

app.put("/accountManage/", (req, res) => {
  const id = req.body.acc_Id;
  const username = req.body.username;
  const roleId = req.body.roleId;
  const password = req.body.password;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());
  // Validate password length
  if (username.length < 8) {
    return res.json({ Error: "Username must be at least 8 characters long" });
  }

  // Validate password length
  if (password.length < 8) {
    return res.json({ Error: "Password must be at least 8 characters long" });
  }

  const sql = `UPDATE tbl_account SET username = '${username}', password = ?, roleId = ${roleId} WHERE acc_Id = ${id};`;

  bcrypt.hash(password.toString(), salt, (err, hash) => {
    if (err) return res.json({ Error: "Error hashing the password" });
    const values = [hash];

    dbCon.query(sql, [values], (err, result) => {
      if (err) {
        return res.json({ Error: err });
      } else {
        const insertNotif = `
        INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Updated ${username} in account.' , '${dateNotif}')
        `;

        dbCon.query(insertNotif, (error, resultOfAdded) => {
          if (error) {
            return res.json({ Error: "There is an error inserting in table" });
          } else {
            return { Status: "Success" };
          }
        });

        return res.json({
          Status: "Success",
        });
      }
    });
  });
});

app.put("/accountManage/:id", (req, res) => {
  const accId = req.params.id;
  const username = req.body.username;
  const userName = req.body.userName;

  // Fetch the username associated with the acc_Id
  const getUsernameQuery = "SELECT username FROM tbl_account WHERE acc_Id = ?";
  dbCon.query(getUsernameQuery, accId, (err, result) => {
    if (err || !result || result.length === 0) {
      return res.json({ Error: "Error fetching account details" });
    }

    const accUsername = result[0].username;

    if (userName === accUsername) {
      return res.json({
        Error: "Unauthorized action: Not allowed to archive current user",
      });
    }

    const dateNotif = formatDate(new Date());

    // Update the account's isArchived status
    const updateQuery =
      "UPDATE tbl_account SET isArchived = 1 WHERE acc_Id = ?";
    dbCon.query(updateQuery, accId, (updateErr, updateResult) => {
      if (updateErr) {
        return res.json({ Error: "Error updating account" });
      }

      const insertNotif = `
        INSERT INTO tbl_notification (username, userActivity, dateNotif)
        VALUES ('${userName}', 'Archived ${username} in account.', '${dateNotif}')
      `;

      dbCon.query(insertNotif, (insertErr, insertResult) => {
        if (insertErr) {
          return res.json({ Error: "There is an error inserting in table" });
        }

        return res.json({ Status: "Success" });
      });
    });
  });
});

app.get("/getArchivedAccounts", (req, res) => {
  const sql = `SELECT tbl_account.*, tbl_account_roles.roleName
    FROM tbl_account
    LEFT JOIN tbl_account_roles ON tbl_account.roleId = tbl_account_roles.roleId
    WHERE tbl_account.isArchived = 1
    ORDER BY tbl_account.username ASC;
    `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error fetching the archives" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.post("/restoreArchived", (req, res) => {
  const acc_Id = req.body.acc_Id;
  const username = req.body.username;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());
  const sql = `
  UPDATE tbl_account SET isArchived = 0 WHERE acc_Id = ${acc_Id}
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error restoring this account." });
    }

    const insertNotif = `
        INSERT INTO tbl_notification (username, userActivity, dateNotif) VALUES ('${userName}','Restored ${username} in account.' , '${dateNotif}')
        `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        console.log(error);
        return res.json({ Error: "There is an error inserting in table" });
      } else {
        return { Status: "Success" };
      }
    });

    return res.json({ Status: "Success" });
  });
});

app.post("/addNewRole", (req, res) => {
  const values = req.body;
  const roleName = values.roleName;
  const dashboardAdmin = values.dashboardAdmin;
  const posAdmin = values.posAdmin;
  const accountManagement = values.accountManagement;
  const productManagement = values.productManagement;
  const shelvesManagement = values.shelvesManagement;
  const purchaseManagement = values.purchaseManagement;
  const supplierManagement = values.supplierManagement;
  const reportManagement = values.reportManagement;
  const requestManagement = values.requestManagement;
  const returnManagement = values.returnManagement;
  const dashboardUser = values.dashboardUser;
  const posUser = values.posUser;
  const productManagementUser = values.productManagementUser;
  const shelvesManagementUser = values.shelvesManagementUser;
  const requestManagementUser = values.requestManagementUser;

  if (roleName === "" || roleName === null) {
    return res.json({ Error: "Role name cannot be empty" });
  }

  const sql = `
  INSERT INTO tbl_account_roles ( 
    roleName, 
    dashboardAdmin, 
    adminPos, 
    accountManagement, 
    productManagement, 
    shelvesManagement, 
    purchaseManagement, 
    supplierManagement, 
    reportManagement, 
    requestManagement, 
    returnManagement, 
    dashboardUser, 
    userPos,
    productManagementUser, 
    shelvesManagementUser, 
    requestManagementUser
  ) VALUES ('${roleName}', ${dashboardAdmin} , ${posAdmin}, ${accountManagement} , ${productManagement}, ${shelvesManagement} , ${purchaseManagement}, ${supplierManagement} ,  ${reportManagement}, ${requestManagement} , ${returnManagement}, ${dashboardUser} , ${posUser}, ${productManagementUser} , ${shelvesManagementUser}, ${requestManagementUser} );
  
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error adding this role" });
    }

    return res.json({ Status: "Success" });
  });
});

app.put("/updateRole", (req, res) => {
  const values = req.body;
  const roleId = req.body.roleId;
  const roleName = values.roleName;
  const dashboardAdmin = values.dashboardAdmin;
  const posAdmin = values.adminPos;
  const accountManagement = values.accountManagement;
  const productManagement = values.productManagement;
  const shelvesManagement = values.shelvesManagement;
  const purchaseManagement = values.purchaseManagement;
  const supplierManagement = values.supplierManagement;
  const reportManagement = values.reportManagement;
  const requestManagement = values.requestManagement;
  const returnManagement = values.returnManagement;
  const dashboardUser = values.dashboardUser;
  const posUser = values.userPos;
  const productManagementUser = values.productManagementUser;
  const shelvesManagementUser = values.shelvesManagementUser;
  const requestManagementUser = values.requestManagementUser;

  if (roleName === "" || roleName === null) {
    return res.json({ Error: "Role name cannot be empty" });
  }

  const sql = `
      UPDATE tbl_account_roles
    SET 
      roleName = '${roleName}',
      dashboardAdmin = ${dashboardAdmin},
      adminPos = ${posAdmin},
      accountManagement = ${accountManagement},
      productManagement = ${productManagement},
      shelvesManagement = ${shelvesManagement},
      purchaseManagement = ${purchaseManagement},
      supplierManagement = ${supplierManagement},
      reportManagement = ${reportManagement},
      requestManagement = ${requestManagement},
      returnManagement = ${returnManagement},
      dashboardUser = ${dashboardUser},
      userPos = ${posUser},
      productManagementUser = ${productManagementUser},
      shelvesManagementUser = ${shelvesManagementUser},
      requestManagementUser = ${requestManagementUser}
    WHERE roleId = ${roleId};
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ Error: "There is an error updating this role" });
    }

    return res.json({ Status: "Success" });
  });
});

app.delete("/removeRoles/:roleId", (req, res) => {
  const roleId = req.params.roleId;
  console.log(roleId)
  // Check if the roleId is associated with any account in tbl_account_roles
  const checkAccountAssociationQuery = `SELECT * FROM tbl_account WHERE roleId = ${roleId}`;
  dbCon.query(checkAccountAssociationQuery, (err, results) => {
    if (err) {
      return res.json({
        Error: "There is an error checking the association of this role",
      });
    }

    // If there are associated accounts, prevent deletion
    if (results.length > 0) {
      return res.json({
        Error:
          "Cannot delete. This role is associated with one or more accounts.",
      });
    }

    // If there are no associated accounts, proceed with deletion
    const deleteRoleQuery = `DELETE FROM tbl_account_roles WHERE roleId = ${roleId}`;
    dbCon.query(deleteRoleQuery, (error, result) => {
      if (error) {
        return res.json({ Error: "There is an error removing this role" });
      }

      return res.json({ Status: "Success" });
    });
  });
});

app.get("/getRoles", (req, res) => {
  const sql = `SELECT * FROM tbl_account_roles`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the roles" });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getAuthorization/:roleName", (req, res) => {
  const name = req.params.roleName;

  const sql = `SELECT tbl_account.*, tbl_account_roles.*
  FROM tbl_account
  LEFT JOIN tbl_account_roles ON tbl_account.roleId = tbl_account_roles.roleId
  WHERE username = '${name}'
  ORDER BY tbl_account.username ASC;`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the authorization" });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

/* Manage Account ends here */

/* Manage Notification Starts here */
app.get("/getNotification", (req, res) => {
  const sql = `
  SELECT *
  FROM tbl_notification
  WHERE DATE_FORMAT(STR_TO_DATE(dateNotif, '%m-%d-%Y'), '%m-%d-%Y') = DATE_FORMAT(NOW(), '%m-%d-%Y')
    AND status = 0 AND isInclude = 0
  ORDER BY notification_id DESC
  LIMIT 20;
  

  
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the notification" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.post("/getNotificationByMobileAdmin", (req, res) => {
  const sqlSelect = `
    SELECT *
    FROM tbl_notification
    WHERE DATE_FORMAT(STR_TO_DATE(dateNotif, '%m-%d-%Y'), '%m-%d-%Y') = DATE_FORMAT(NOW(), '%m-%d-%Y')
      AND status = 0 AND isInclude = 0 AND isSent = 0
    ORDER BY notification_id DESC
    LIMIT 20;
  `;

  dbCon.query(sqlSelect, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the notification" });
    }

    // Process the retrieved notifications...
    const notifications = result;

    // If notifications are fetched successfully, update isSent to 1 for these notifications
    if (notifications && notifications.length > 0) {
      const notificationIds = notifications.map(
        (notification) => notification.notification_id
      );

      const sqlUpdate = `
        UPDATE tbl_notification
        SET isSent = 1
        WHERE notification_id IN (${notificationIds.join(", ")});
      `;

      dbCon.query(sqlUpdate, (updateErr, updateResult) => {
        if (updateErr) {
          return res.json({ Error: "Failed to mark notifications as sent" });
        }

        return res.json({ Status: "Success", Message: notifications });
      });
    } else {
      return res.json({ Status: "Success", Message: notifications });
    }
  });
});

app.post("/getNotificationByMobileUser/:name", (req, res) => {
  const name = req.params.name;
  const sqlSelect = `
  SELECT *
  FROM tbl_notification
  WHERE DATE_FORMAT(STR_TO_DATE(dateNotif, '%m-%d-%Y'), '%m-%d-%Y') = DATE_FORMAT(NOW(), '%m-%d-%Y')
    AND status = 0 AND username = '${name}' AND isSent = 0
  ORDER BY notification_id DESC
  LIMIT 20; 
  `;

  dbCon.query(sqlSelect, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the notification" });
    }

    // Process the retrieved notifications...
    const notifications = result;

    // If notifications are fetched successfully, update isSent to 1 for these notifications
    if (notifications && notifications.length > 0) {
      const notificationIds = notifications.map(
        (notification) => notification.notification_id
      );

      const sqlUpdate = `
        UPDATE tbl_notification
        SET isSent = 1
        WHERE notification_id IN (${notificationIds.join(", ")});
      `;

      dbCon.query(sqlUpdate, (updateErr, updateResult) => {
        if (updateErr) {
          return res.json({ Error: "Failed to mark notifications as sent" });
        }

        return res.json({ Status: "Success", Message: notifications });
      });
    } else {
      return res.json({ Status: "Success", Message: notifications });
    }
  });
});

app.get("/getNotificationAll", (req, res) => {
  const sql = `
  SELECT * FROM tbl_notification WHERE isInclude = 0
  ORDER BY notification_id DESC LIMIT 100
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the notification" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getNotificationUser/:name", (req, res) => {
  const name = req.params.name;
  const sql = `
  SELECT *
  FROM tbl_notification
  WHERE DATE_FORMAT(STR_TO_DATE(dateNotif, '%m-%d-%Y'), '%m-%d-%Y') = DATE_FORMAT(NOW(), '%m-%d-%Y')
    AND status = 0 AND username = '${name}'
  ORDER BY notification_id DESC
  LIMIT 20; 
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the notification" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getNotificationAllUser/:name", (req, res) => {
  const name = req.params.name;
  console.log(name);
  const sql = `
  SELECT * FROM tbl_notification WHERE username = '${name}'
  ORDER BY notification_id DESC
  
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the notification" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.put("/readAllNotificationUser/:name", (req, res) => {
  const name = req.params.name;
  const sql = `
  UPDATE tbl_notification SET status=1 WHERE username = '${name}' AND status = 0;

  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error reading all notification" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.put("/readAllNotification", (req, res) => {
  const sql = `
  UPDATE tbl_notification SET status=1 WHERE isInclude = 0 AND status = 0;

  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error reading all notification" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

/* Manage Product Ends  Here */

/* Manage Product Starts Here */
//To send the options in container
app.get("/manageProduct/option", (req, res) => {
  const sql =
    "SELECT *  FROM tbl_container WHERE isArchive <> 1 ORDER BY containerName";
  dbCon.query(sql, (err, result) => {
    if (err) res.json([{ Error: err }]);

    return res.json({ Status: "Success", Message: result });
  });
});

//Off inventory Management
app.get("/getProductOffInventory", (req, res) => {
  const sql = `
  SELECT p.*, ul.prodUnitId, ul.prodUnitName,   COUNT(*) OVER () AS rowCountPerProduct
  FROM tbl_product p
  LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId
  LEFT JOIN tbl_unitlist ul ON up.prodUnitId = ul.prodUnitId
  LEFT JOIN tbl_batch b ON p.prodId = b.prodId
  WHERE b.remainingQty IS NULL
  ORDER BY p.prodName;
  
  
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error fetching the products." });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

//End of Off inventory Management
//For getting all the product (Inventory)

/**  SELECT
    p.prodId,
    p.prodName,
    p.buyingPrice,
    p.prodDetails,
    p.sellingPrice,
    s.suppName AS supplierName,
    b.batchNumber,
    b.prodContainer,
    b.purchase_id,
    SUM(b.remainingQty) AS totalRemainingQty, 
    b.earliestExpiryDate,
    b.firstManufacturingDate,
    c.containerName,
    pur.prodUnitId
  FROM tbl_product p
  JOIN (
    SELECT
      p2.suppId,
      b1.prodId,
      b1.batchNumber,
      b1.prodContainer,
      b1.purchase_id,
      b1.remainingQty,
      MIN(b1.expiryDate) AS earliestExpiryDate,
      b1.manufacturingDate AS firstManufacturingDate
    FROM tbl_batch b1
    LEFT JOIN tbl_purchase p2 ON b1.purchase_id = p2.purchase_id
    WHERE b1.isArchive <> 1
    AND b1.remainingQty > 0
    AND b1.expiryDate = (
      SELECT MIN(expiryDate)
      FROM tbl_batch
      WHERE tbl_batch.prodId = b1.prodId
    )
    GROUP BY p2.suppId, b1.prodId, b1.batchNumber, b1.purchase_id, b1.manufacturingDate
  ) b ON p.prodId = b.prodId
  LEFT JOIN tbl_supplier s ON b.suppId = s.suppId
  LEFT JOIN tbl_container c ON b.prodContainer = c.containerId 
  LEFT JOIN tbl_purchase pur ON b.purchase_id = pur.purchase_id AND p.prodId = pur.prodId 
  GROUP BY p.prodId, b.earliestExpiryDate -- Group by prodId and earliestExpiryDate
  ORDER BY p.prodName, b.earliestExpiryDate; */

app.get("/manageProduct", (req, res) => {
  const sql = `
  SELECT
  p.prodId,
  p.prodName,
  p.buyingPrice,
  p.prodDetails,
  p.sellingPrice,
  s.suppName AS supplierName,
  b.batchNumber,
  b.prodContainer,
  b.purchase_id,
  (b.remainingQty) AS totalRemainingQty, 
  b.earliestExpiryDate,
  b.firstManufacturingDate,
  c.containerName,
  pur.prodUnitId,
  nb.batchNumber AS nextBatchNumber,
  nb.prodContainer AS nextProdContainer,
  nb.purchase_id AS nextPurchaseId,
  nb.remainingQty AS nextRemainingQty,
  nb.expiryDate AS nextExpiryDate,
  nb.manufacturingDate AS nextManufacturingDate,
  COUNT(*) OVER () AS rowCountPerProduct
FROM tbl_product p
JOIN (
  -- Your existing subquery to get the current batch-product information
  SELECT
      p2.suppId,
      b1.prodId,
      b1.batchNumber,
      b1.prodContainer,
      b1.purchase_id,
      b1.remainingQty,
      MIN(b1.expiryDate) AS earliestExpiryDate,
      b1.manufacturingDate AS firstManufacturingDate
  FROM tbl_batch b1
  LEFT JOIN tbl_purchase p2 ON b1.purchase_id = p2.purchase_id
  JOIN tbl_product p ON p.prodId = b1.prodId
  WHERE b1.isArchive <> 1
  AND b1.remainingQty > 0
  AND b1.expiryDate = (
      SELECT MIN(expiryDate)
      FROM tbl_batch
      WHERE tbl_batch.prodId = b1.prodId
      AND remainingQty > 0
  )
  GROUP BY p2.suppId, b1.prodId, b1.batchNumber, b1.purchase_id, b1.manufacturingDate
) b ON p.prodId = b.prodId
LEFT JOIN tbl_supplier s ON b.suppId = s.suppId
LEFT JOIN tbl_container c ON b.prodContainer = c.containerId 
LEFT JOIN tbl_purchase pur ON b.purchase_id = pur.purchase_id AND p.prodId = pur.prodId 
LEFT JOIN tbl_batch nb ON b.prodId = nb.prodId
  AND nb.expiryDate > b.earliestExpiryDate
  AND nb.isArchive <> 1
GROUP BY p.prodId, b.earliestExpiryDate
ORDER BY p.prodName, b.earliestExpiryDate;




  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error fecthing the data." });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

app.get("/getMostSoldPerMonth", (req, res) => {
  const sql = `SELECT 
  saleMonth,
  saleYear,
  prodId,
  prodName,
  maxSoldPerMonth
FROM (
  SELECT 
      MONTHNAME(STR_TO_DATE(s.dateSale, '%M %e, %Y')) AS saleMonth,
      YEAR(STR_TO_DATE(s.dateSale, '%M %e, %Y')) AS saleYear,
      s.prodId,
      p.prodName,
      SUM(s.qty) AS maxSoldPerMonth,
      ROW_NUMBER() OVER (PARTITION BY YEAR(STR_TO_DATE(s.dateSale, '%M %e, %Y')), MONTH(STR_TO_DATE(s.dateSale, '%M %e, %Y')) ORDER BY SUM(s.qty) DESC) AS rn
  FROM tbl_sale s
  INNER JOIN tbl_product p ON s.prodId = p.prodId
  WHERE YEAR(STR_TO_DATE(s.dateSale, '%M %e, %Y')) = YEAR(CURDATE())
  GROUP BY saleYear, saleMonth, s.prodId, p.prodName
) ranked
WHERE rn = 1
ORDER BY saleYear ASC, MONTH(STR_TO_DATE(saleMonth, '%M')) ASC;;
    `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "There is an error getting the montly sold product.",
      });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getMostSoldThisMonth", (req, res) => {
  const sql = `SELECT 
      s.prodId,
      p.prodName,
      SUM(s.qty) AS totalSold
  FROM tbl_sale s
  JOIN tbl_product p ON s.prodId = p.prodId
  WHERE MONTH(STR_TO_DATE(s.dateSale, '%M %e, %Y')) = MONTH(CURDATE())
      AND YEAR(STR_TO_DATE(s.dateSale, '%M %e, %Y')) = YEAR(CURDATE())
  GROUP BY s.prodId
  ORDER BY totalSold DESC
  LIMIT 5;
  
    `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "There is an error getting the most sold product this mont.",
      });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.post("/addNewProduct", (req, res) => {
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());
  // Extract values from the request body
  const { prodName, prodDetails, buyingPrice, prodUnitId } = req.body;

  // Check if prodName and prodDetails are not null or empty
  if (!prodName || !prodDetails) {
    return res.json({ Error: "Product name and details are required" });
  }

  if (!prodUnitId) {
    return res.json({ Error: "Please select a product unit" });
  }

  // Validate that buyingPrice is numeric and greater than 0
  if (isNaN(buyingPrice) || buyingPrice <= 0) {
    return res.json({ Error: "Invalid or non-positive value for buyingPrice" });
  }

  // Convert buyingPrice to a number (float or integer)
  const buyingPriceValue = parseFloat(buyingPrice);

  // Check if the conversion resulted in a valid number
  if (isNaN(buyingPriceValue)) {
    return res.json({ Error: "Invalid value for buyingPrice" });
  }

  // Check if a product with the same prodName and prodDetails already exists
  const checkProductQuery =
    "SELECT * FROM tbl_product WHERE prodName = ? AND prodDetails = ?";
  dbCon.query(checkProductQuery, [prodName, prodDetails], (error, results) => {
    if (error) {
      return res.json({
        Error: "Error checking product name and details in the database",
      });
    }

    if (results.length > 0) {
      return res.json({
        Error: "Product with the same name and details already exists",
      });
    }

    // If the combination of prodName and prodDetails is unique, insert the product into the database
    const sql =
      "INSERT INTO tbl_product (prodName, prodDetails, buyingPrice) VALUES ( ?, ?, ?)";
    const values = [prodName, prodDetails, buyingPriceValue];

    dbCon.query(sql, values, (err, result) => {
      if (err) {
        return res.status(500).json({
          Error: "There is an error in inserting the product.",
        });
      } else {
        const productId = result.insertId;

        const sqlAddUnitToProduct =
          "INSERT INTO tbl_unitofproduct (prodUnitId, prodId) VALUES (?, ?)";
        const unitValues = [prodUnitId, productId];

        dbCon.query(sqlAddUnitToProduct, unitValues, (err) => {
          if (err) {
            return res
              .status(500)
              .json({ Error: "There is an error inserting product." });
          }

          const insertNotif = `
            INSERT INTO tbl_notification (username, userActivity, dateNotif) VALUES ('${userName}','Added ${prodName} in product.' , '${dateNotif}')
          `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.status(500).json({
                Error: "There is an error inserting in the table",
              });
            } else {
              return res.json({
                Status: "Success",
              });
            }
          });
        });
      }
    });
  });
});

app.post("/addNewProductSupplier", (req, res) => {
  const { prodName, prodDetails, buyingPrice, prodUnitId, supplierId } =
    req.body;

  // Check if prodName, prodDetails, and prodUnitId are not null or empty
  if (!prodName || !prodDetails || !prodUnitId) {
    return res.json({ Error: "Product name, details, and unit are required" });
  }

  // Validate that buyingPrice is numeric and greater than 0
  if (isNaN(buyingPrice) || buyingPrice <= 0) {
    return res.json({ Error: "Invalid or non-positive value for buyingPrice" });
  }

  // Convert buyingPrice to a number (float or integer)
  const buyingPriceValue = parseFloat(buyingPrice);

  // Check if the conversion resulted in a valid number
  if (isNaN(buyingPriceValue)) {
    return res.json({ Error: "Invalid value for buyingPrice" });
  }

  // Check if a product with the same prodName and prodDetails already exists
  const checkProductQuery =
    "SELECT * FROM tbl_product WHERE prodName = ? AND prodDetails = ?";

  dbCon.query(checkProductQuery, [prodName, prodDetails], (error, results) => {
    if (error) {
      console.log(error);
      return res.json({
        Error: "Error checking product name and details in the database",
      });
    }

    if (results.length > 0) {
      return res.json({
        Error: "Product with the same name and details already exists",
      });
    }

    // If the combination of prodName and prodDetails is unique, insert the product into the database
    const sql =
      "INSERT INTO tbl_product (prodName, prodDetails, buyingPrice) VALUES (?, ?, ?)";
    const values = [prodName, prodDetails, buyingPriceValue];

    dbCon.query(sql, values, (err, result) => {
      if (err) {
        console.log(error);
        return res.json({
          Error: "There is an error in inserting the product.",
        });
      }

      const productId = result.insertId;

      // Now, insert the product unit
      const sqlAddUnitToProduct =
        "INSERT INTO tbl_unitofproduct (prodUnitId, prodId) VALUES (?, ?)";
      const unitValues = [prodUnitId, productId];

      dbCon.query(sqlAddUnitToProduct, unitValues, (err) => {
        if (err) {
          console.log(error);
          return res.json({
            Error: "There is an error adding the unit for the product.",
          });
        }

        // Now, insert the product into the supplier
        const insertSupplierProductSQL =
          "INSERT INTO tbl_supplierproduct (product_Id, supplierId) VALUES (?, ?)";
        dbCon.query(
          insertSupplierProductSQL,
          [productId, supplierId],
          (err) => {
            if (err) {
              console.log(error);
              return res.json({
                Error: "There is an error adding the product to the supplier.",
              });
            }
            // Return the productId in the response
            return res.json({
              Status: "Success",
              productId: productId,
            });
          }
        );
      });
    });
  });
});

// For updating a specific product and prodContainer in tbl_batch
app.put("/manageProduct/:id", (req, res) => {
  const id = req.params.id;
  const prodName = req.body.prodName;
  const prodDetails = req.body.prodDetails;
  const prodContainer = req.body.prodContainer;
  const batchNumber = req.body.batchNumber;
  const buyingPrice = req.body.buyingPrice;
  const sellingPrice = req.body.sellingPrice;
  const prodUnitId = req.body.prodUnitId;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());

  // Check if prodName, prodDetails, and prodContainer are not null or empty
  if (!prodName || !prodDetails || !prodContainer) {
    return res.json({
      Error: "Product name, details, and container are required",
    });
  }

  // Validate that buyingPrice and sellingPrice are numeric and greater than 0
  if (
    isNaN(buyingPrice) ||
    isNaN(sellingPrice) ||
    buyingPrice <= 0 ||
    sellingPrice <= 0
  ) {
    return res.json({
      Error: "Invalid or non-positive values for buyingPrice or sellingPrice",
    });
  }

  // Convert buyingPrice and sellingPrice to numbers (float or integer)
  const buyingPriceValue = parseFloat(buyingPrice);
  const sellingPriceValue = parseFloat(sellingPrice);

  // Check if the conversion resulted in valid numbers
  if (isNaN(buyingPriceValue) || isNaN(sellingPriceValue)) {
    return res.json({
      Error: "Invalid values for buyingPrice or sellingPrice",
    });
  }

  // Update prodContainer in tbl_batch
  const updateBatchSql = `
    UPDATE tbl_batch
    SET prodContainer = '${prodContainer}'
    WHERE prodId = ${id} AND batchNumber = '${batchNumber}';
  `;

  dbCon.query(updateBatchSql, (err) => {
    if (err) {
      return res.json({
        Error: "There is an error updating prodContainer in tbl_batch.",
      });
    } else {
      const checkExistingSql = `
        SELECT COUNT(*) AS rowCount FROM tbl_unitofproduct WHERE prodId = ?;
      `;

      dbCon.query(checkExistingSql, [id], (err, result) => {
        if (err) {
          return res.json({ Error: "Error checking for existing records." });
        } else {
          const rowCount = result[0].rowCount;

          if (rowCount === 0) {
            // If no row exists, insert a new record
            const insertSql = `
              INSERT INTO tbl_unitofproduct (prodId, prodUnitId)
              VALUES (?, ?);
            `;

            dbCon.query(insertSql, [id, prodUnitId], (err) => {
              if (err) {
                return res.json({
                  Error: "There is an error inserting product units.",
                });
              } else {
                const updateSql = `
                  UPDATE tbl_product
                  SET prodName = '${prodName}',
                      prodDetails = '${prodDetails}',
                      buyingPrice = ${buyingPriceValue}, 
                      sellingPrice = ${sellingPriceValue}
                  WHERE prodId = ${id};
                `;

                dbCon.query(updateSql, (err) => {
                  if (err) {
                    return res.json({
                      Error: "There is an error updating the product.",
                    });
                  } else {
                    const insertNotif = `
                      INSERT INTO tbl_notification (username, userActivity, dateNotif)
                      VALUES ('${userName}', 'Updated ${prodName} in product.', '${dateNotif}');
                    `;

                    dbCon.query(insertNotif, (error, resultOfAdded) => {
                      if (error) {
                        return res.json({
                          Error: "There is an error inserting in table",
                        });
                      } else {
                        return res.json({
                          Status: "Success",
                        });
                      }
                    });
                  }
                });
              }
            });
          } else {
            const updateSql = `
              UPDATE tbl_unitofproduct
              SET prodUnitId = ?
              WHERE prodId = ?;
            `;

            dbCon.query(updateSql, [prodUnitId, id], (err) => {
              if (err) {
                return res.json({
                  Error: "There is an error updating product units.",
                });
              } else {
                const updateProductSql = `
                  UPDATE tbl_product
                  SET prodName = '${prodName}',
                      prodDetails = '${prodDetails}',
                      buyingPrice = ${buyingPriceValue}, 
                      sellingPrice = ${sellingPriceValue}
                  WHERE prodId = ${id};
                `;

                dbCon.query(updateProductSql, (err) => {
                  if (err) {
                    return res.json({
                      Error: "There is an error updating the product.",
                    });
                  } else {
                    const insertNotif = `
                      INSERT INTO tbl_notification (username, userActivity, dateNotif)
                      VALUES ('${userName}', 'Updated ${prodName} in product.', '${dateNotif}');
                    `;

                    dbCon.query(insertNotif, (error, resultOfAdded) => {
                      if (error) {
                        return res.json({
                          Error: "There is an error inserting in table",
                        });
                      } else {
                        return res.json({
                          Status: "Success",
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        }
      });
    }
  });
});

// For updating a specific product
// For updating a specific product
app.put("/updateOffInventory/:id", (req, res) => {
  const id = req.params.id;
  const prodName = req.body.prodName;
  const prodDetails = req.body.prodDetails;
  const prodContainer = req.body.prodContainer;
  const buyingPrice = req.body.buyingPrice;
  const sellingPrice = req.body.sellingPrice;
  const prodUnitId = req.body.prodUnitId;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());

  // Check if prodName and prodDetails are not null or empty
  if (!prodName || !prodDetails) {
    return res.json({ Error: "Product name and details are required" });
  }

  // Validate that buyingPrice and sellingPrice are numeric and greater than 0
  if (isNaN(buyingPrice) || buyingPrice <= 0) {
    return res.json({
      Error: "Invalid or non-positive values for buyingPrice ",
    });
  }

  // Convert buyingPrice and sellingPrice to numbers (float or integer)
  const buyingPriceValue = parseFloat(buyingPrice);

  // Check if the conversion resulted in valid numbers
  if (isNaN(buyingPriceValue)) {
    return res.json({
      Error: "Invalid values for buyingPrice",
    });
  }

  const checkExistingSql = `
    SELECT COUNT(*) AS rowCount FROM tbl_unitofproduct WHERE prodId = ?;
  `;

  dbCon.query(checkExistingSql, [id], (err, result) => {
    if (err) {
      return res.json({ Error: "Error checking for existing records." });
    } else {
      const rowCount = result[0].rowCount;

      if (rowCount === 0) {
        // If no row exists, insert a new record
        const insertSql = `
          INSERT INTO tbl_unitofproduct (prodId, prodUnitId)
          VALUES (?, ?);
        `;

        dbCon.query(insertSql, [id, prodUnitId], (err) => {
          if (err) {
            return res.json({
              Error: "There is an error inserting product units.",
            });
          } else {
            const updateSql = `
              UPDATE tbl_product
              SET prodName = '${prodName}',
                  prodDetails = '${prodDetails}',
                  buyingPrice = ${buyingPriceValue}

              WHERE prodId = ${id};
            `;

            dbCon.query(updateSql, (err) => {
              if (err) {
                return res.json({
                  Error: "There is an error updating the product.",
                });
              } else {
                return res.json({
                  Status: "Success",
                });
              }
            });
          }
        });
      } else {
        const updateSql = `
          UPDATE tbl_unitofproduct
          SET prodUnitId = ?
          WHERE prodId = ?;
        `;

        dbCon.query(updateSql, [prodUnitId, id], (err) => {
          if (err) {
            return res.json({
              Error: "There is an error updating product units.",
            });
          } else {
            const updateProductSql = `
              UPDATE tbl_product
              SET prodName = '${prodName}',
                  prodDetails = '${prodDetails}',
                  buyingPrice = ${buyingPriceValue}
              WHERE prodId = ${id};
            `;

            dbCon.query(updateProductSql, (err) => {
              if (err) {
                return res.json({
                  Error: "There is an error updating the product.",
                });
              } else {
                return res.json({
                  Status: "Success",
                });
              }
            });
          }
          const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Updated ${prodName} in product (Off Inventory).' , '${dateNotif}')
          `;

          dbCon.query(insertNotif, (error, resultOfAdded) => {
            if (error) {
              return res.json({
                Error: "There is an error inserting in table",
              });
            } else {
              return { Status: "Success" };
            }
          });
        });
      }
    }
  });
});

//For archiving specific product
app.put("/manageProduct/:id/:batch_number/archive", (req, res) => {
  const id = req.params.id;
  const batch_number = req.params.batch_number;
  const username = req.body.userName;
  const prodName = req.body.prodName;
  const dateNotif = formatDate(new Date());
  const sql = `
    UPDATE tbl_batch
    SET isArchive = 1
    WHERE prodId = ${id} AND batchNumber = '${batch_number}'
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error archiving this product." });
    } else {
      const insertNotif = `
      INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${username}','Archived ${prodName} in product.', '${dateNotif}')
      `;

      dbCon.query(insertNotif, (error, resultOfAdded) => {
        if (error) {
          return res.json({
            Error: "There is an error inserting the notification in table",
          });
        } else {
          return { Status: "Success" };
        }
      });

      return res.json({ Status: "Success" });
    }
  });
});

//For archiving specific product
app.delete("/deleteProduct/:id", (req, res) => {
  const id = req.params.id;
  const batch_number = req.params.batch_number;
  const username = req.body.userName;
  const prodName = req.body.prodName;
  const dateNotif = formatDate(new Date());
  const sql = `
   DELETE FROM tbl_product WHERE prodId = ${id}
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error deleting this product." });
    }
    return res.json({ Status: "Success" });
  });
});

//For getting the archived products

app.get("/getArchivedProductsData", (req, res) => {
  const sql = `
  SELECT
    p.prodId,
    p.prodName,
    p.prodDetails,
    p.buyingPrice,
    p.sellingPrice,
    SUM(b.remainingQty) AS prodQty,
    u.prodUnitId,
    u.prodUnitName,
    c.containerName,
    s.suppName AS supplierName,
    b.batchNumber,
    b.prodContainer,
    b.expiryDate AS earliestExpiryDate,
    b.isArchive
FROM tbl_product p
LEFT JOIN tbl_batch b ON p.prodId = b.prodId
LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId
LEFT JOIN tbl_unitlist u ON up.prodUnitId = u.prodUnitId
LEFT JOIN tbl_container c ON b.prodContainer = c.containerId
LEFT JOIN tbl_supplierproduct sp ON p.prodId = sp.product_Id
LEFT JOIN tbl_supplier s ON sp.supplierId = s.suppId
WHERE b.isArchive = 1
GROUP BY p.prodId, b.batchNumber;




  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error fetching this archived." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

//For restoring specific product
app.put("/restoreProductNotExpire/:batchNumber", (req, res) => {
  const batch_number = req.params.batchNumber;
  const dateNotif = formatDate(new Date());
  const currentTimestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", " "); // Get the current timestamp in the same format as your expiryDate column
  const userName = req.body.userName;
  const prodName = req.body.prodName;
  const sql = `
    UPDATE tbl_batch
    SET isArchive = 0
    WHERE batchNumber = '${batch_number}' AND expiryDate > '${currentTimestamp}'
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error archiving this product." });
    } else if (result.affectedRows === 0) {
      // No rows were updated, which means the batch has already expired
      return res.json({
        Error: "This product has already expired and cannot be restored.",
      });
    } else {
      const insertNotif = `
      INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Restored ${prodName} in product.', '${dateNotif}')
      `;

      dbCon.query(insertNotif, (error, resultOfAdded) => {
        if (error) {
          return res.json({ Error: "There is an error inserting in table" });
        } else {
          return { Status: "Success" };
        }
      });
      return res.json({ Status: "Success" });
    }
  });
});

app.put("/ArchiveAllExpiredProducts", (req, res) => {
  const userName = req.body.Name;
  const currentDate = new Date();

  const sql = `
    UPDATE tbl_batch
    SET isArchive = 1
    WHERE expiryDate <= NOW() AND isArchive = 0;  
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error:
          "There is an error in archiving expired products. Contact your developer.",
      });
    }

    const selectExpiredProductsSQL = `
      SELECT DISTINCT p.prodName, b.prodId, b.batchNumber
      FROM tbl_batch b
      INNER JOIN tbl_product p ON b.prodId = p.prodId
      WHERE DATE(b.expiryDate) = ? AND b.isArchive = 1;
    `;

    dbCon.query(
      selectExpiredProductsSQL,
      [currentDate.toISOString().slice(0, 10)],
      (error, products) => {
        if (error) {
          return res.json({
            Error: "There is an error fetching products that expired today.",
          });
        }

        if (products.length > 0) {
          const expiredProductNames = products
            .map((product) => product.prodName)
            .join(", ");
          const dateNotif = formatDate(new Date());

          const insertNotif = `
            INSERT INTO tbl_notification (username, userActivity, prodId, batchNumber, dateNotif)
            SELECT '${userName}', 'Archived products that expired today: ${expiredProductNames}', b.prodId, b.batchNumber, '${dateNotif}'
            FROM tbl_batch b
            INNER JOIN tbl_product p ON b.prodId = p.prodId
            WHERE DATE(b.expiryDate) = ? AND b.isArchive = 1
              AND NOT EXISTS (
                SELECT 1 FROM tbl_notification n
                WHERE n.prodId = b.prodId AND n.batchNumber = b.batchNumber
              )
          `;

          dbCon.query(
            insertNotif,
            [currentDate.toISOString().slice(0, 10)],
            (insertError, resultOfAdded) => {
              if (insertError) {
                return res.json({
                  Error: "There is an error inserting in the table.",
                });
              } else {
                return res.json({ Status: "Success" });
              }
            }
          );
        } else {
          return res.json({ Status: "Success" });
        }
      }
    );
  });
});

app.put("/NotifyNearExpiredProducts", (req, res) => {
  const userName = req.body.Name;
  const insertNotificationsForExpiry = (userName) => {
    const currentDate = new Date();

    const sixMonthsAhead = new Date();
    sixMonthsAhead.setMonth(sixMonthsAhead.getMonth() + 6);

    const sqlInsertNotifications = `
    INSERT INTO tbl_notification (username, userActivity, prodId, batchNumber, dateNotif)
    SELECT 
        '${userName}' AS username,
        CASE 
            WHEN DATEDIFF(b.expiryDate, NOW()) < 30 THEN
                CONCAT('Product expiring in ', DATEDIFF(b.expiryDate, NOW()), ' day/s for batch: ', p.prodName, ' - ', SUBSTRING(b.batchNumber, LENGTH(b.batchNumber) - 4, 5))
            ELSE
                CONCAT('Product expiring in ', CEIL(DATEDIFF(b.expiryDate, NOW()) / 30.44), ' month/s for batch: ', p.prodName, ' - ', SUBSTRING(b.batchNumber, LENGTH(b.batchNumber) - 4, 5))
        END AS userActivity,
        b.prodId,
        b.batchNumber,
        '${formatDate(currentDate)}' AS dateNotif
    FROM 
        tbl_batch b
    INNER JOIN 
        tbl_product p ON b.prodId = p.prodId
    WHERE 
        b.expiryDate > NOW() AND                   -- Expiry date is ahead of the current date
        b.expiryDate <= DATE_ADD(NOW(), INTERVAL 6 MONTH) AND   -- Expiry within the next 6 months
        b.isArchive = 0 AND
        NOT EXISTS (
            SELECT 1 FROM tbl_notification n
            WHERE n.prodId = b.prodId AND n.batchNumber = b.batchNumber
        )
`;

    dbCon.query(
      sqlInsertNotifications,
      [
        sixMonthsAhead.toISOString().slice(0, 10),
        sixMonthsAhead.toISOString().slice(0, 10),
      ],
      (insertError, resultOfAdded) => {
        if (insertError) {
          return res.json({ Error: "Failed to insert notifications" });
        } else {
          return res.json({ Status: "Notifications inserted successfully" });
        }
      }
    );
  };

  insertNotificationsForExpiry(userName);
});

/* Manage Product Ends  Here */

/* Manage Product Unit Starts  Here */

app.get("/api/getProductUnit", (req, res) => {
  const sql = "SELECT * FROM tbl_unitlist";

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error in fetching the units" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.post("/api/addNewUnit", (req, res) => {
  const unitName = req.body.prodUnitName;

  // Check if the new unit name already exists
  const checkUnit = `
    SELECT * FROM tbl_unitlist WHERE prodUnitName = '${unitName}'
  `;

  dbCon.query(checkUnit, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error checking the unit name." });
    } else {
      const rowCount = result.length;

      if (rowCount === 0) {
        // Update the unit name if it doesn't exist
        const updateSql = `
          INSERT INTO tbl_unitlist (prodUnitName) VALUES (?)
        `;

        dbCon.query(updateSql, [unitName], (err) => {
          if (err) {
            return res.json({ Error: "There is an error adding the unit." });
          }
          return res.json({ Status: "Success" });
        });
      } else {
        return res.json({ Error: "Unit name already exists." });
      }
    }
  });
});

app.put("/api/updateProductUnit", (req, res) => {
  const unitId = req.body.prodUnitId;
  const unitName = req.body.prodUnitName;

  // Check if the new unit name already exists
  const checkUnit = `
    SELECT * FROM tbl_unitlist WHERE prodUnitName = '${unitName}'
  `;

  dbCon.query(checkUnit, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error checking the unit name." });
    } else {
      const rowCount = result.length;

      if (rowCount === 0) {
        // Update the unit name if it doesn't exist
        const updateSql = `
          UPDATE tbl_unitlist
          SET prodUnitName = ?
          WHERE prodUnitId = ?;
        `;

        dbCon.query(updateSql, [unitName, unitId], (err) => {
          if (err) {
            return res.json({
              Error: "There is an error updating the unit name.",
            });
          }
          return res.json({ Status: "Success" });
        });
      } else {
        return res.json({ Error: "Unit name already exists." });
      }
    }
  });
});

app.delete("/api/deleteProductUnit/:unitId", (req, res) => {
  const unitId = req.params.unitId;

  // Check if the unit is associated with any product in tbl_unitofproduct
  const checkAssociationQuery = `
    SELECT prodId FROM tbl_unitofproduct WHERE prodUnitId = ? LIMIT 1;
  `;

  dbCon.query(checkAssociationQuery, [unitId], (err, result) => {
    if (err) {
      return res.json({ Error: "Error deleting the unit." });
    }

    if (result.length > 0) {
      return res.json({
        Error: "Unit is associated with a product and cannot be deleted.",
      });
    }

    // If there's no association, proceed to delete the unit from tbl_unitlist
    const deleteUnitQuery = `
      DELETE FROM tbl_unitlist WHERE prodUnitId = ?;
    `;

    dbCon.query(deleteUnitQuery, [unitId], (err) => {
      if (err) {
        return res.status.json({ Error: "Error deleting the unit." });
      }

      return res.json({
        Status: "Success",
        Message: "Unit deleted successfully.",
      });
    });
  });
});

/* Manage Product Unit Ends Here */
/* Manage Product Ends Here */

/* Manage Container Starts Here */

app.get("/manageContainer", (req, res) => {
  const sql =
    "SELECT * FROM tbl_container WHERE isArchive <> 1  ORDER BY containerName";

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json([{ Status: "Success", Message: result }]);
    }
  });
});

app.get("/getArchivedContainers", (req, res) => {
  const sql = `
  SELECT * FROM tbl_container WHERE isArchive = 1  ORDER BY containerName
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting the archived." });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.post("/manageContainer", (req, res) => {
  const checkDuplicateSql =
    "SELECT * FROM tbl_container WHERE containerName = ? AND   containerDetails = ?";
  const checkDuplicateValues = [
    req.body.containerName,
    req.body.containerDetails,
  ];

  dbCon.query(
    checkDuplicateSql,
    checkDuplicateValues,
    (checkErr, checkResult) => {
      if (checkErr) {
        return res.json({ Error: checkErr });
      }

      // If the containerName or containerDetails already exist, return an error
      if (checkResult.length > 0) {
        return res.json({ Error: "Container name or details already exist." });
      }

      // If not, proceed with the insertion
      const insertSql =
        "INSERT INTO tbl_container (containerId, containerName, containerDetails, containerImg) VALUES (?)";
      const insertValues = [
        req.body.containerId,
        req.body.containerName,
        req.body.containerDetails,
        req.body.containerImg,
      ];

      const userName = req.body.userName;
      const dateNotif = formatDate(new Date());

      if (
        !insertValues[1] ||
        insertValues[1].length < 2 ||
        !insertValues[2] ||
        insertValues[2].length < 2
      ) {
        return res.json({ Error: "Character should be at least 2" });
      }

      dbCon.query(insertSql, [insertValues], (insertErr, insertResult) => {
        if (insertErr) {
          return res.json({ Error: insertErr });
        }

        const insertNotif = `
        INSERT INTO tbl_notification (username, userActivity, dateNotif) VALUES (?, ?, ?)
      `;
        const notifValues = [
          userName,
          `Added ${req.body.containerName} in container.`,
          dateNotif,
        ];

        dbCon.query(insertNotif, notifValues, (notifErr, notifResult) => {
          if (notifErr) {
            return res.json({
              Error: "There is an error inserting in the notification table",
            });
          } else {
            return res.json({ Status: "Success" });
          }
        });
      });
    }
  );
});

app.put("/updateRemainingQuantity", (req, res) => {
  const prodId = req.body.prodId;
  const userName = req.body.userName;
  const batchNumber = req.body.batchNumber;
  const totalRemainingQty = req.body.totalRemainingQty;
  const newRemainingQty = req.body.newRemainingQty;
  const prodName = req.body.prodName;
  const dateNotif = formatDate(new Date());
  console.log(userName);
  const sql = `UPDATE tbl_batch SET remainingQty = ${newRemainingQty} WHERE prodId = ${prodId} AND batchNumber = '${batchNumber}'`;
  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "There is an error updating the remaining quantity.",
      });
    }

    const insertNotif = `
    INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Updated the cycle count of ${prodName} from ${totalRemainingQty} to ${newRemainingQty}.' , '${dateNotif}')
    `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        return res.json({ Error: "There is an error inserting in table" });
      } else {
        return { Status: "Success" };
      }
    });

    return res.json({ Status: "Success" });
  });
});

//for archiving container
app.put("/manageContainer/Archiving/:id", (req, res) => {
  const id = req.params.id;
  const containerName = req.body.newNotif.containerName;
  const userName = req.body.newNotif.userName;
  const dateNotif = formatDate(new Date());
  const sql = `UPDATE tbl_container SET isArchive = 1  WHERE containerId =  ${id}`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "Cannot archive this container" });
    }
    const insertNotif = `
    INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Archived ${containerName} in container.' , '${dateNotif}')
    `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        return res.json({ Error: "There is an error inserting in table" });
      } else {
        return { Status: "Success" };
      }
    });

    return res.json({ Status: "Success", Message: result });
  });
});

//for restoring archived container
app.put("/manageContainer/Restoring/:id", (req, res) => {
  const id = req.params.id;
  const userName = req.body.userName;
  const containerName = req.body.containerName;
  const dateNotif = formatDate(new Date());
  const sql = `UPDATE tbl_container SET isArchive = 0  WHERE containerId =  ${id}`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    }

    const insertNotif = `
        INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Restored ${containerName} in container.' , '${dateNotif}')
        `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        return res.json({ Error: "There is an error inserting in table" });
      } else {
        return { Status: "Success" };
      }
    });

    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/manageContainer/:id", (req, res) => {
  const id = req.params.id;
  const sql = `SELECT * FROM tbl_container where containerId = ${id}`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      return res.json(result);
    }
  });
});

/* For viewing the product under specific container */

app.get("/manageContainer/getProduct/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
  SELECT
  p.*,
  b.batchNumber,
  SUM(b.remainingQty) AS totalRemainingQty,
  b.earliestExpiryDate,
  b.firstManufacturingDate,
  u.prodUnitName
FROM tbl_product p
JOIN (
  SELECT
    p2.suppId,
    b1.prodId,
    b1.batchNumber,
    b1.prodContainer,
    b1.purchase_id,
    b1.remainingQty,
    MIN(b1.expiryDate) AS earliestExpiryDate,
    b1.manufacturingDate AS firstManufacturingDate
  FROM tbl_batch b1
  LEFT JOIN tbl_purchase p2 ON b1.purchase_id = p2.purchase_id
  WHERE b1.isArchive <> 1
    AND b1.remainingQty > 0
    AND b1.expiryDate = (
      SELECT MIN(expiryDate)
      FROM tbl_batch
      WHERE tbl_batch.prodId = b1.prodId
    )
  GROUP BY p2.suppId, b1.prodId, b1.batchNumber, b1.purchase_id, b1.manufacturingDate
) b ON p.prodId = b.prodId
LEFT JOIN tbl_purchase pur ON b.purchase_id = pur.purchase_id AND p.prodId = pur.prodId
LEFT JOIN tbl_unitlist u ON pur.prodUnitId = u.prodUnitId -- Join to get prodUnitName
WHERE b.prodContainer = ${id}
GROUP BY p.prodId, b.earliestExpiryDate
ORDER BY p.prodName, b.earliestExpiryDate `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    } else {
      if (result.length === 0) {
        return res.json({ Status: "No Products", Message: [] });
      } else {
        return res.json({ Status: "Success", Message: result });
      }
    }
  });
});

/* For updating specific container */
app.put("/manageContainer/:id", (req, res) => {
  const id = req.body.containerId;
  const containerName = req.body.containerName;
  const containerDetails = req.body.containerDetails;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());
  if (containerName.length < 4 || containerDetails.length < 4) {
    return res.json({ Error: "Character should not be less than 4" });
  }

  const sql = `UPDATE tbl_container SET containerName = '${containerName}', containerDetails = '${containerDetails}' WHERE containerId = ${id};`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: err });
    }

    const insertNotif = `
    INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Updated ${containerName} in container.', '${dateNotif}')
    `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        return res.json({ Error: "There is an error inserting in table" });
      } else {
        return { Status: "Success" };
      }
    });

    return res.json({ Status: "Success", Message: req.body });
  });
});
/* Manage Container Ends Here */

app.post("/addNewSupplier", (req, res) => {
  const suppName = req.body.suppName;
  const suppContactPerson = req.body.suppContactPerson;
  const suppAddr = req.body.suppAddr;
  const suppContactNumber = req.body.suppContactNumber;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());
  if (!suppName || suppName.length < 2 || !/^[A-Za-z\s]+$/.test(suppName)) {
    return res.json({ Error: "Invalid supplier name" });
  }

  if (
    !suppContactPerson ||
    suppContactPerson.length < 2 ||
    !/^[A-Za-z\s]+$/.test(suppContactPerson)
  ) {
    return res.json({ Error: "Invalid contact person name" });
  }

  if (!suppAddr || suppAddr.length < 2) {
    return res.json({ Error: "Supplier address should be valid" });
  }

  if (!suppContactNumber || !/^[0-9]{11}$/.test(suppContactNumber)) {
    return res.json({
      Error: "Invalid contact number format (must be 11 digits)",
    });
  }

  // Insert a new supplier into the tbl_supplier table using a parameterized query
  const addSupplierSQL = `
    INSERT INTO tbl_supplier (suppName, suppContactPerson, suppAddr, suppContactNumber)
    VALUES (?, ?, ?, ?)
  `;

  dbCon.query(
    addSupplierSQL,
    [suppName, suppContactPerson, suppAddr, suppContactNumber],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          Error: "An error occurred while adding the supplier.",
        });
      }

      const insertNotif = `
      INSERT INTO tbl_notification (username, userActivity , dateNotif) VALUES ('${userName}','Added ${req.body.suppName} in supplier.', '${dateNotif}')
      `;

      dbCon.query(insertNotif, (error, resultOfAdded) => {
        if (error) {
          return res.json({ Error: "There is an error inserting in table" });
        } else {
          return { Status: "Success" };
        }
      });

      return res.json({
        Status: "Success",
        Message: "Supplier added successfully.",
      });
    }
  );
});

app.put("/updateSupplier/:supplierId", (req, res) => {
  const supplierId = req.params.supplierId;

  const suppName = req.body.suppName;
  const suppContactPerson = req.body.suppContactPerson;
  const suppAddr = req.body.suppAddr;
  const suppContactNumber = req.body.suppContactNumber;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());

  if (!suppName || suppName.length < 2 || !/^[A-Za-z\s]+$/.test(suppName)) {
    return res.json({ Error: "Invalid supplier name" });
  }

  if (
    !suppContactPerson ||
    suppContactPerson.length < 2 ||
    !/^[A-Za-z\s]+$/.test(suppContactPerson)
  ) {
    return res.json({ Error: "Invalid contact person name" });
  }

  if (!suppAddr || suppAddr.length < 2) {
    return res.json({ Error: "Supplier address should be valid" });
  }

  if (!suppContactNumber || !/^[0-9]{11}$/.test(suppContactNumber)) {
    return res.json({
      Error: "Invalid contact number format (must be 11 digits)",
    });
  }

  // Check if the supplier exists
  const checkSupplierSQL = "SELECT * FROM tbl_supplier WHERE suppId = ?";
  dbCon.query(checkSupplierSQL, [supplierId], (err, supplierResult) => {
    if (err) {
      console.error(err);
      return res.json({
        Error: "An error occurred while checking the supplier.",
      });
    }

    if (supplierResult.length === 0) {
      return res.json({ Error: "Supplier not found." });
    }

    // Update the supplier's information
    const updateSupplierSQL = `
      UPDATE tbl_supplier
      SET suppName = ?, suppContactPerson = ?, suppAddr = ?, suppContactNumber = ?
      WHERE suppId = ?
    `;

    dbCon.query(
      updateSupplierSQL,
      [suppName, suppContactPerson, suppAddr, suppContactNumber, supplierId],
      (err, updateResult) => {
        if (err) {
          console.error(err);
          return res.json({
            Error: "An error occurred while updating the supplier.",
          });
        }

        const insertNotif = `
        INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Updated ${suppName} in supplier.','${dateNotif}')
        `;

        dbCon.query(insertNotif, (error, resultOfAdded) => {
          if (error) {
            return res.json({ Error: "There is an error inserting in table" });
          } else {
            return { Status: "Success" };
          }
        });

        return res.json({
          Status: "Success",
          Message: "Supplier updated successfully.",
        });
      }
    );
  });
});

app.get("/getSupplierList", (req, res) => {
  const sql =
    "SELECT * FROM tbl_supplier where isArchived <> 1 ORDER BY suppName ASC";

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "Ooops! Sorry. There is error in supplier request.",
      });
    } else {
      return res.json({ Message: result });
    }
  });
});

app.get("/getProductListToSupplier/:supplierId", (req, res) => {
  const supplierId = req.params.supplierId;

  // Query to retrieve products not added to the specified supplier
  const getProductListToSupplierSQL = `
  SELECT DISTINCT p.*
  FROM tbl_product p
  LEFT JOIN tbl_supplierproduct sp ON p.prodId = sp.product_Id AND sp.supplierId = ?
  WHERE sp.supplierProductId IS NULL
  ORDER BY p.prodName;
  

  
      
  `;

  dbCon.query(getProductListToSupplierSQL, [supplierId], (err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ Error: "An error occurred while fetching products." });
    }

    return res.json({ Message: result });
  });
});

app.put("/archiveSupplier/:supplierId", (req, res) => {
  const supplierId = req.params.supplierId;
  const userName = req.body.userName;
  const suppName = req.body.suppName;
  const dateNotif = formatDate(new Date());
  // Check if there are associated products with the supplier
  const checkAssociatedProductsSQL =
    "SELECT COUNT(*) AS productCount FROM tbl_supplierproduct WHERE supplierId = ?";
  dbCon.query(checkAssociatedProductsSQL, [supplierId], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({
        Error: "An error occurred while checking associated products.",
      });
    }

    const productCount = result[0].productCount;

    if (productCount > 0) {
      return res.json({
        Error:
          "Cannot archive the supplier because there are associated products.",
      });
    }

    // No associated products found, proceed to delete the supplier
    const deleteSupplierSQL =
      "UPDATE tbl_supplier SET isArchived = 1 WHERE suppId = ?";
    dbCon.query(deleteSupplierSQL, [supplierId], (err, deleteResult) => {
      if (err) {
        console.error(err);
        return res.json({
          Error: "An error occurred while archiving the supplier.",
        });
      }

      const insertNotif = `
      INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Archived ${suppName} in supplier.', '${dateNotif}')
      `;

      dbCon.query(insertNotif, (error, resultOfAdded) => {
        if (error) {
          return res.json({ Error: "There is an error inserting in table" });
        } else {
          return { Status: "Success" };
        }
      });

      return res.json({
        Status: "Success",
        Message: "Supplier deleted successfully.",
      });
    });
  });
});

app.get("/getSupplierArchived", (req, res) => {
  const sql = `SELECT * FROM tbl_supplier WHERE isArchived = 1`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error retrieving the archives." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.put("/restoreSupplier/:suppId", (req, res) => {
  const suppId = req.params.suppId;
  const suppName = req.body.suppName;
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());
  const sql = `UPDATE tbl_supplier SET isArchived = 0 WHERE suppId = ${suppId}`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "There is an error in restoring the supplier.",
      });
    }

    const insertNotif = `
    INSERT INTO tbl_notification (username, userActivity,dateNotif) VALUES ('${userName}','Restored ${suppName} in supplier.', '${dateNotif}')
    `;

    dbCon.query(insertNotif, (error, resultOfAdded) => {
      if (error) {
        return res.json({ Error: "There is an error inserting in table" });
      } else {
        return { Status: "Success" };
      }
    });

    return res.json({ Status: "Success" });
  });
});

app.delete("/removeProductFromSupplier/:supplierId/:productId", (req, res) => {
  const supplierId = req.params.supplierId;
  const productId = req.params.productId;

  // Check if the supplier and product combination exists
  const checkCombinationQuery = `
    SELECT * FROM tbl_supplierproduct
    WHERE supplierId = ? AND product_Id = ?
  `;

  dbCon.query(
    checkCombinationQuery,
    [supplierId, productId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.json({
          Error: "An error occurred while checking the combination.",
        });
      }

      if (results.length === 0) {
        // The combination does not exist, return an error
        return res.json({
          Error: "There is an error right now.Please try again later",
        });
      }

      // The combination exists, proceed with deletion
      const deleteProductQuery = `
      DELETE FROM tbl_supplierproduct
      WHERE supplierId = ? AND product_Id = ?
    `;

      dbCon.query(
        deleteProductQuery,
        [supplierId, productId],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.json({
              Error:
                "An error occurred while removing the product from the supplier.",
            });
          }

          return res.json({ Status: "Success" });
        }
      );
    }
  );
});

app.post("/addProductToSupplier", (req, res) => {
  const productId = req.body.productId;
  const supplierId = req.body.supplierId;
  const checkSupplierSQL = "SELECT * FROM tbl_supplier WHERE suppId = ?";
  const checkProductSQL = "SELECT * FROM tbl_product WHERE prodId = ?";

  dbCon.beginTransaction((err) => {
    if (err) {
      return res.json({ Error: "Transaction start failed." });
    }

    dbCon.query(checkSupplierSQL, [supplierId], (err, supplierResult) => {
      if (err) {
        dbCon.rollback(() => {
          res.json({
            Error: "An error occurred while checking the supplier.",
          });
        });
      }

      if (supplierResult.length === 0) {
        dbCon.rollback(() => {
          res.json({ Error: "Supplier not found." });
        });
      }

      dbCon.query(checkProductSQL, [productId], (err, productResult) => {
        if (err) {
          dbCon.rollback(() => {
            res.json({
              Error: "An error occurred while checking the product.",
            });
          });
        }

        if (productResult.length === 0) {
          dbCon.rollback(() => {
            res.json({ Error: "Product not found." });
          });
        }

        const insertSupplierProductSQL =
          "INSERT INTO tbl_supplierproduct (product_Id, supplierId) VALUES (?, ?)";
        dbCon.query(
          insertSupplierProductSQL,
          [productId, supplierId],
          (err, result) => {
            if (err) {
              dbCon.rollback(() => {
                res.json({
                  Error:
                    "An error occurred while adding the product to the supplier.",
                });
              });
            } else {
              dbCon.commit((err) => {
                if (err) {
                  dbCon.rollback(() => {
                    res.json({
                      Error: "Transaction commit failed.",
                    });
                  });
                } else {
                  res.json({ Status: "Success" });
                }
              });
            }
          }
        );
      });
    });
  });
});

app.get("/productsBySupplier/:supplierId", (req, res) => {
  const supplierId = req.params.supplierId;

  const getProductsBySupplierSQL = `
    SELECT
    p.*,
    CONCAT(p.prodName, ' -  ', p.prodDetails, '') AS productDetails,
    u.prodUnitName,
    u.prodUnitId
  FROM tbl_product p
  INNER JOIN tbl_supplierproduct sp ON p.prodId = sp.product_Id
  LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId
  LEFT JOIN tbl_unitlist u ON up.prodUnitId = u.prodUnitId
  WHERE sp.supplierId = ?
  ORDER BY p.prodName
  ;


  `;

  dbCon.query(getProductsBySupplierSQL, [supplierId], (err, result) => {
    if (err) {
      console.error(err);
      return res
        .status(500)
        .json({ Error: "An error occurred while fetching products." });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

/* Supplier Management  Ends Here */
/* Purchase Management  Starts Here */

app.get("/getSuppliersWithProducts", (req, res) => {
  const selectSuppliersWithProductsQuery = `
    SELECT DISTINCT s.*
    FROM tbl_supplier s
    JOIN tbl_supplierproduct sp ON s.suppId = sp.supplierId
    ORDER BY s.suppName ASC
  `;

  dbCon.query(selectSuppliersWithProductsQuery, (err, results) => {
    if (err) {
      return res.json({
        Error: "An error occurred while fetching suppliers with products.",
      });
    }

    return res.json({ Status: "Success", Message: results });
  });
});

app.post("/addToPurchase", (req, res) => {
  if (typeof req.body !== "object") {
    return res.json({ Error: "Invalid data format. Expected an object." });
  }

  const purchaseItems = [];
  for (const key in req.body) {
    if (!isNaN(key)) {
      purchaseItems.push(req.body[key]);
    }
  }

  const sql = `INSERT INTO tbl_purchase (purchase_id, prodId, suppId, prodUnitId, prodQtyWhole, buyingPrice, totalPrice, dateReq, purchaseDeliveryDate, enableCount, purchaseStatus, purchaseType) VALUES ?`;

  const values = purchaseItems.map((item) => [
    item.purchaseId,
    item.productId,
    item.supplierId,
    item.unit,
    item.quantity,
    item.price,
    item.totalPrice,
    item.purchaseDate,
    item.deliveryDate,
    item.enableCount,
    0,
    0,
  ]);

  // Ensure that prodName is an array before attempting to access it
  const prodNames = purchaseItems.map((item) => item.productName);
  const prodName = prodNames.join(", ");
  const userName = req.body.userName;
  const dateNotif = formatDate(new Date());

  dbCon.query(sql, [values], (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error adding this purchase" });
    }

    const insertNotif = `
    INSERT INTO tbl_notification (username, userActivity, dateNotif)
    VALUES (?, ?, ?)
    `;
    const valuesNotif = [
      userName,
      `Added a new purchase of ${prodName}.`,
      dateNotif,
    ];
    dbCon.query(insertNotif, valuesNotif, (error, resultOfAdded) => {
      if (error) {
        console.log(error);
        return res.json({ Error: "There is an error inserting in table" });
      } else {
        return res.json({ Status: "Success" });
      }
    });
  });
});

app.get("/getUnitList", (req, res) => {
  const sql = "SELECT * FROM tbl_unitList";

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error fetching the unit" });
    } else {
      return res.json({ Status: "Success", Message: result });
    }
  });
});

/* Purchase List Here */

app.get("/getSupplierPurchase", (req, res) => {
  const sql = `
  SELECT
    s.suppId,
    s.suppName,
    p.purchase_id,
    DATE_FORMAT(STR_TO_DATE(p.purchaseDeliveryDate, '%Y-%m-%d'), '%b %d, %Y') AS formattedPurchaseDeliveryDate,
    DATE_FORMAT(STR_TO_DATE(p.dateReq, '%Y-%m-%d'), '%b %d, %Y') AS formattedDateReq
  FROM
    tbl_supplier s
  JOIN
    tbl_purchase p
  ON
    s.suppId = p.suppId
  WHERE
    p.purchaseStatus = 0 AND purchaseType = 0
  GROUP BY
    s.suppName, p.purchase_id, formattedPurchaseDeliveryDate, formattedDateReq
  ORDER BY STR_TO_DATE(p.dateReq, '%Y-%m-%d') DESC;`;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error in fetching purchase list" });
    }
    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/purchaseData/:supplierId/:purchase_id", (req, res) => {
  const supplierId = req.params.supplierId;
  const purchase_id = req.params.purchase_id;
  console.log(supplierId);
  console.log(purchase_id);
  const query = `
    SELECT
    p.purchase_id,
    p.prodId,
    p.suppId,
    p.prodUnitId,
    pr.prodName,
    pr.prodDetails, 
    pu.prodUnitName, 
    p.prodQtyWhole,
    p.pcsPerUnit,
    p.receivedQty,
    p.buyingPrice,
    p.totalPrice,
    p.sellingPrice,
    p.enableCount,
    DATE_FORMAT(p.purchaseDeliveryDate, '%b %d, %Y') AS formattedPurchaseDeliveryDate,
    DATE_FORMAT(p.dateReq, '%b %d, %Y') AS formattedDateReq,
    DATE_FORMAT(p.dateReceive, '%b %d, %Y') AS formattedDateReceive,
    DATE_FORMAT(p.dateExpiry, '%b %d, %Y') AS formattedDateExpiry,
    p.purchaseStatus
    FROM tbl_purchase p
    JOIN tbl_product pr ON p.prodId = pr.prodId
    JOIN tbl_unitlist pu ON p.prodUnitId = pu.prodUnitId 
    WHERE p.suppId = ${supplierId} AND p.purchase_id = ${purchase_id} 
    GROUP BY pr.prodId
    ORDER BY pr.prodName;
  `;

  dbCon.query(query, (err, results) => {
    if (err) {
      return res.json({ Error: "Error fetching purchase data" });
    } else {
      return res.json({ Status: "Success", Message: results });
    }
  });
});

app.put("/cancelPurchaseItem", (req, res) => {
  const purchase_id = req.body.purchase_id;
  const prodId = req.body.prodId;
  const suppId = req.body.suppId;

  const sql = `
   UPDATE tbl_purchase SET purchaseStatus = 2 WHERE purchase_id = ${purchase_id} AND prodId = ${prodId} AND suppId = ${suppId};
  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error cancel this item" });
    }
    return res.json({ Status: "Success" });
  });
});
app.put("/receivedProductFromPurchase/", (req, res) => {
  const purchase_id = req.body.purchase_id;
  const suppId = req.body.suppId;
  const prodId = req.body.prodId;
  const pcsPerUnit = req.body.pcsPerUnit;
  const prodQtyWhole = req.body.prodQtyWhole;
  const receivedQty = parseInt(req.body.receivedQty, 10);
  const receivedRealQty = req.body.receivedQty;
  const buyingPrice = parseFloat(req.body.buyingPrice);
  const totalPrice = req.body.totalPrice;
  const sellingPrice = parseFloat(req.body.sellingPrice);
  const dateReceive = req.body.formattedDateReceive;
  const dateExpiry = req.body.formattedDateExpiry;
  const isEnabledCount = req.body.enableCount;
  const userName = req.body.userName;
  const prodName = req.body.prodName;
  const prodContainer = req.body.prodContainer;
  const dateNotif = formatDate(new Date());
  console.log(req.body);
  if (isNaN(receivedQty) || isNaN(buyingPrice) || isNaN(sellingPrice)) {
    return res.json({
      Error: "Must be valid numbers.",
    });
  }

  if (receivedRealQty.toString().includes(".")) {
    return res.json({ Error: "Invalid received qty" });
  }

  if (isEnabledCount === 1) {
    if (!pcsPerUnit || pcsPerUnit <= 0) {
      return res.json({ Error: "Invalid pcs per unit" });
    }
  }

  if (!receivedQty || receivedQty <= 0) {
    return res.json({ Error: "Invalid received quantity" });
  }

  if (!prodContainer || prodContainer === "" || prodContainer === null) {
    return res.json({ Error: "Select a container" });
  }

  if (!dateExpiry) {
    return res.json({ Error: "Please select a expiry date." });
  }

  // Calculate the quantity based on pcsPerUnit if available, otherwise use prodQtyWhole
  const calculatedQty = pcsPerUnit ? receivedQty * pcsPerUnit : receivedQty;

  // Generate a batch number (you can replace this with your own logic)
  const batchNumber = generateBatchNumber();

  // Update the purchase with the received product details
  const updatePurchaseSQL = `
    UPDATE tbl_purchase
    SET
    pcsPerUnit = ?,
    prodQtyWhole = ?,
    receivedQty = ?,
    buyingPrice = ?,
    totalPrice = ?,
    sellingPrice = ?,
    dateReceive = ?,
    dateExpiry = ?,
    purchaseStatus = 1
    WHERE purchase_id = ? AND prodId = ? AND suppId = ?;
  `;

  dbCon.query(
    updatePurchaseSQL,
    [
      pcsPerUnit,
      prodQtyWhole,
      receivedQty,
      buyingPrice,
      totalPrice,
      sellingPrice,
      dateReceive,
      dateExpiry,
      purchase_id,
      prodId,
      suppId,
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          Error: "There is an error in receiving the product.",
        });
      }

      // Update the product quantity in tbl_product based on the calculatedQty
      const updateProductSQL = `
        UPDATE tbl_product
        SET sellingPrice = ?, buyingPrice = ?
        WHERE prodId = ?;
      `;

      dbCon.query(
        updateProductSQL,
        [sellingPrice, buyingPrice, prodId],
        (err) => {
          if (err) {
            return res.status(500).json({
              Error: "There is an error in updating product information.",
            });
          }

          // Insert data into tbl_batch
          const insertBatchSQL = `
            INSERT INTO tbl_batch
            (prodId, prodContainer, purchase_id, batchNumber, manufacturingDate, expiryDate, pcsPerUnit, batchQty, remainingQty, isAvailableForPiece)
            VALUES (?, ?,?, ?, ?, ?, ?, ?, ?, ?);
          `;

          const remainingQty = calculatedQty; // Initially, the remainingQty is the same as batchQty

          dbCon.query(
            insertBatchSQL,
            [
              prodId,
              prodContainer,
              purchase_id,
              batchNumber,
              dateReceive,
              dateExpiry,
              pcsPerUnit,
              calculatedQty,
              remainingQty,
              isEnabledCount,
            ],
            (err) => {
              if (err) {
                return res.status(500).json({
                  Error: "There is an error in inserting batch data.",
                });
              }

              const insertNotif = `
                INSERT INTO tbl_notification (username, userActivity, dateNotif)
                VALUES (?, ?, ?)
              `;

              const valuesNotif = [
                userName,
                `${prodName} has been received.`,
                dateNotif,
              ];

              dbCon.query(insertNotif, valuesNotif, (error, resultOfAdded) => {
                if (error) {
                  return res.status(500).json({
                    Error: "There is an error inserting in table",
                  });
                } else {
                  return res.json({ Status: "Success" });
                }
              });
            }
          );
        }
      );
    }
  );
});

//batch number
function generateBatchNumber() {
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).substring(7);
  return `BATCH-${timestamp}-${uniqueId}`;
}

//Purchase History//

app.get("/api/getPurchaseHistory", (req, res) => {
  const sql = `
  SELECT
  P.purchase_id,
  P.suppId,
  P.dateReq,
  S.suppName,
  P.purchaseStatus,
  SUM(P.totalPrice) AS totalPurchaseAmount
FROM tbl_purchase P
JOIN tbl_supplier S ON P.suppId = S.suppId
WHERE P.purchaseStatus != 0
AND NOT EXISTS (
  SELECT 1
  FROM tbl_purchase AS SubPurchase
  WHERE SubPurchase.purchase_id = P.purchase_id
  AND SubPurchase.suppId = P.suppId
  AND SubPurchase.purchaseStatus = 0
)
GROUP BY P.purchase_id, P.suppId, P.dateReq, S.suppName, P.purchaseStatus
ORDER BY STR_TO_DATE(P.dateReq, '%Y-%m-%d') DESC;


      `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "There is an error fetching purchase history.",
      });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/api/getPurchaseHistoryData/:suppId/:purchase_id", (req, res) => {
  const purchase_id = req.params.purchase_id;
  const supp_id = req.params.suppId;

  const sql = `
  SELECT
  P.purchase_id,
  P.suppId,
  S.suppName,
  P.prodId,
  Pr.prodName, 
  Pr.prodDetails,
  U.prodUnitName,
  P.pcsPerUnit,
  P.prodQtyWhole,
  P.receivedQty,
  P.buyingPrice,
  P.totalPrice,
  P.sellingPrice,
  P.purchaseDeliveryDate,
  P.dateReq,
  P.dateReceive,
  P.dateExpiry,
  P.enableCount,
  P.purchaseStatus,
  B.batchNumber AS batchNumber,
  SUM(P.totalPrice) AS totalPurchasePrice
FROM tbl_purchase P
JOIN tbl_supplier S ON P.suppId = S.suppId
JOIN tbl_product Pr ON P.prodId = Pr.prodId
JOIN tbl_unitlist U ON P.prodUnitId = U.prodUnitId
LEFT JOIN tbl_batch B ON P.purchase_id = B.purchase_id AND P.prodId = B.prodId
WHERE P.purchaseStatus != 0
  AND P.suppId = ${supp_id}
  AND P.purchase_id = ${purchase_id}
GROUP BY P.purchase_id, P.suppId, S.suppName, P.prodId, Pr.prodName, Pr.prodDetails, U.prodUnitName, P.pcsPerUnit, P.prodQtyWhole, P.receivedQty, P.buyingPrice, P.totalPrice, P.sellingPrice, P.purchaseDeliveryDate, P.dateReq, P.dateReceive, P.dateExpiry, P.enableCount, P.purchaseStatus, B.batchNumber


      `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({
        Error: "There is an error fetching purchase history of the supplier.",
      });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

/* Purchase Management Ends Here */

/* POS/User Starts Here */

/* 

previous query

SELECT
  p.prodId,
  p.prodName,
  p.prodDetails,
  p.sellingPrice,
  MIN(b.batch_id) AS batch_id,
  b.prodId,
  b.purchase_id,
  MIN(b.batchNumber) AS batchNumber,
  MIN(b.manufacturingDate) AS manufacturingDate,
  b.expiryDate AS minExpiryDate,
  SUM(b.remainingQty) AS totalRemainingQty,
  u.prodUnitName AS prodUnitName
FROM tbl_product p
JOIN tbl_batch b ON p.prodId = b.prodId
LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId
LEFT JOIN tbl_unitlist u ON up.prodUnitId = u.prodUnitId
WHERE b.isArchive <> 1
AND b.remainingQty > 0
AND b.expiryDate = (
  SELECT MIN(expiryDate)
  FROM tbl_batch
  WHERE prodId = p.prodId
)
GROUP BY p.prodId, b.expiryDate
ORDER BY minExpiryDate;
 */

app.get("/user/productlist", (req, res) => {
  const sql = `
  SELECT
  p.prodId,
  p.prodName,
  p.prodDetails,
  p.sellingPrice,
  MIN(b.batch_id) AS batch_id,
  b.prodId,
  b.purchase_id,
  b.isAvailableForPiece,
  MIN(b.batchNumber) AS batchNumber,
  MIN(b.manufacturingDate) AS manufacturingDate,
  b.expiryDate AS minExpiryDate,
  SUM(b.remainingQty) AS totalRemainingQty,
  SUM(b.remainingQty) AS initialRemainingQty, 
  u.prodUnitName AS prodUnitName
FROM tbl_product p
JOIN tbl_batch b ON p.prodId = b.prodId
LEFT JOIN tbl_unitofproduct up ON p.prodId = up.prodId
LEFT JOIN tbl_unitlist u ON up.prodUnitId = u.prodUnitId
WHERE b.isArchive <> 1
AND b.remainingQty > 0
AND b.expiryDate = (
  SELECT MIN(expiryDate)
  FROM tbl_batch
  WHERE prodId = p.prodId
  AND remainingQty > 0
)
GROUP BY p.prodId, b.expiryDate
ORDER BY p.prodName ASC;



  `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ Error: err });
    } else {
      return res.json({ Message: result });
    }
  });
});

app.post("/getTransactionId", async (req, res) => {
  try {
    const getNextAutoIncrementIdQuery = `
        SELECT AUTO_INCREMENT
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = 'db_manuel'
        AND TABLE_NAME = 'tbl_sale';  
      `;

    const [result] = await queryPromise(getNextAutoIncrementIdQuery);
    if (!result || !result.AUTO_INCREMENT) {
      return res.status(500).json({ status: "Error" });
    }

    const autoIncrementId = result.AUTO_INCREMENT;

    // Construct the unique saleId
    const saleId = `${autoIncrementId}`;

    return res.json({ Status: "Success", Message: saleId });
  } catch (error) {
    // If any error occurs, send an error response
    console.error(error);
    return res.status(500).json({ Status: "Error" });
  }
});

app.post("/user/pos", async (req, res) => {
  const salesData = req.body.salesData;
  try {
    const autoIncrementId = req.body.saleId;

    // Construct the unique saleId
    const saleId = `${autoIncrementId}`;
    // Process each sale item sequentially
    for (const item of salesData) {
      const { prodId, qty, itemTotal, totalSale, cash, dateSale } = item;

      // Rest of your batch selection logic here...
      // Query the batches sorted by expiry date ascending
      const batchQuery = `
        SELECT batchNumber, remainingQty
        FROM tbl_batch
        WHERE prodId = ?
        AND remainingQty > 0
        ORDER BY expiryDate ASC;
      `;

      const [batch] = await queryPromise(batchQuery, [prodId]);
      if (!batch) {
        // Notify that the sale has failed
        return res.status(500).json({ status: "Error" });
      }

      const batches = [batch]; // Wrap the single result in an array for consistency

      let remainingQtyToSubtract = qty;

      // Iterate through batches and calculate how much to subtract from each
      for (const batch of batches) {
        const { batchNumber, remainingQty } = batch;
        const qtyToSubtract = Math.min(remainingQtyToSubtract, remainingQty);

        const updateQuery = `
          UPDATE tbl_batch
          SET remainingQty = remainingQty - ?
          WHERE batchNumber = ?;
  `;
        await queryPromise(updateQuery, [qtyToSubtract, batchNumber]);

        remainingQtyToSubtract -= qtyToSubtract;

        if (remainingQtyToSubtract <= 0) {
          // If we've subtracted the required quantity, no need to check more batches
          break;
        }
      }

      if (remainingQtyToSubtract > 0) {
        // Notify that the sale has failed
        return res.status(500).json({ status: "Error" });
      }
      // Now, you can insert the sale data into the tbl_sale table
      const insertSaleQuery = `
        INSERT INTO tbl_sale (saleId, prodId, batchNumber, qty, itemTotal, totalSale, cash, dateSale)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;
      const saleValues = [
        saleId,
        prodId,
        batch.batchNumber,
        qty,
        itemTotal,
        totalSale,
        cash,
        dateSale,
      ];

      await queryPromise(insertSaleQuery, saleValues);
    }

    // All sale items have been processed successfully
    return res.json({ Status: "Success", Message: saleId });
  } catch (error) {
    console.log(error);
    // If any error occurs, send an error response
    return res
      .status(500)
      .json({ Error: "There is an error in proccessing the sales" });
  }
});

app.post("/user/inventory", async (req, res) => {
  const sql =
    "INSERT INTO tbl_all_sales (saleId, AllTotalSale, Date) VALUES (?)";
  const values = [req.body.saleId, req.body.AllTotalSale, req.body.Date];

  try {
    // Insert sales data into tbl_all_sales
    dbCon.query(sql, [values]);

    // Send a success response
    return res.json({ Status: "Success" });
  } catch (err) {
    // Send an error response
    return res.status(500).json({ Error: err });
  }
});
/* POS/User Ends Here */

/* Return Sales Starts Here */

app.get("/getSalesById/:saleId", (req, res) => {
  const saleId = req.params.saleId;

  // SQL query to retrieve sale data and product details
  const sql = `
  SELECT s.saleId, s.prodId, s.batchNumber, s.qty, s.qty as additionalQty, s.totalSale as additionalSale, s.itemTotal, s.totalSale, s.cash, s.dateSale,
  p.prodName, p.prodDetails, p.buyingPrice, p.sellingPrice
FROM tbl_sale s
LEFT JOIN tbl_product p ON s.prodId = p.prodId
WHERE s.saleId = ? AND isReturn = 0


  `;

  dbCon.query(sql, [saleId], (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting this sales data." });
    }
    if (result.length > 0) {
      return res.json({ Status: "Success", Message: result });
    } else {
      return res.json({
        Status: "No data.",
        Message: "No sales found in this id.",
      });
    }
  });
});

app.get("/getSalesReturnBySales/:saleId", (req, res) => {
  const saleId = req.params.saleId;

  // SQL query to retrieve sale data and product details
  const sql = `
    SELECT s.saleId, s.prodId, s.batchNumber, s.qty, s.itemTotal, s.totalSale, s.cash, s.dateSale,
           p.prodName, p.buyingPrice, p.sellingPrice
    FROM tbl_sale s
    LEFT JOIN tbl_product p ON s.prodId = p.prodId
    WHERE s.saleId = ? AND isReturn = 1
  `;

  dbCon.query(sql, [saleId], (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error getting this sales data." });
    }
    if (result.length > 0) {
      return res.json({ Status: "Success", Message: result });
    } else {
      return res.json({
        Status: "No data.",
        Message: "No sales found in this id.",
      });
    }
  });
});

app.put("/returnTransaction", async (req, res) => {
  const returnData = req.body;
  const dateReturn = formatDate(new Date());

  // Check if salesToReturn is an array
  if (!Array.isArray(returnData.salesToReturn)) {
    return res
      .status(400)
      .json({ Status: "Error", Message: "Invalid data format" });
  }

  // Create a database transaction to ensure data consistency
  dbCon.beginTransaction(async (err) => {
    if (err) {
      return dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }

    try {
      // Update tbl_all_sales with the new AllTotalSale
      const updateAllSalesQuery = `
        UPDATE tbl_all_sales
        SET AllTotalSale = ?
        WHERE saleId = ?;
      `;
      await queryPromise(updateAllSalesQuery, [
        returnData.newTotalSale,
        returnData.salesToReturn[0].saleId,
      ]);

      const updateSaleQuery = `
      UPDATE tbl_sale
      SET isReturn = 1,
          qty = CASE 
                  WHEN qty <> ? THEN (qty - ?)
                  ELSE qty
                END,
          itemTotal = (itemTotal - ?),
          totalSale = ?
      WHERE saleId = ? AND prodId = ? AND batchNumber = ?;
    `;

      for (const item of returnData.salesToReturn) {
        await queryPromise(updateSaleQuery, [
          item.qty,
          item.qty,
          item.itemTotal,
          returnData.additionalSale,
          item.saleId,
          item.prodId,
          item.batchNumber,
        ]);
      }

      // Insert new return data into tbl_return
      const insertReturnQuery = `
        INSERT INTO tbl_return (saleId, prodId, batchNumber, prodQty, price, totalPrice, returnRemarks, dateReturn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `;
      for (const item of returnData.salesToReturn) {
        await queryPromise(insertReturnQuery, [
          item.saleId,
          item.prodId,
          item.batchNumber,
          item.qty,
          item.itemTotal,
          returnData.newTotalSale,
          returnData.returnRemarks,
          dateReturn,
        ]);
      }

      // Commit the transaction
      dbCon.commit((commitErr) => {
        if (commitErr) {
          console.log(commitErr);
          return dbCon.rollback(() => {
            res
              .status(500)
              .json({ Status: "Error", Message: "Transaction Error" });
          });
        }
        res.json({ Status: "Success" });
      });
    } catch (error) {
      console.log(error);
      // If any error occurs, rollback the transaction
      dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }
  });
});

function formatDateReturn(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

app.put("/returnTransactionUser", async (req, res) => {
  const returnData = req.body;
  const dateReturn = formatDateReturn(new Date());

  // Create a database transaction to ensure data consistency
  dbCon.beginTransaction(async (err) => {
    if (err) {
      return dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }

    try {
      const insertReturnQuery = `
        INSERT INTO tbl_return (saleId, prodId, batchNumber, prodQty, price, totalPrice, returnRemarks, dateReturn, isAdmin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);
      `;
      for (const item of returnData.salesToReturn) {
        await queryPromise(insertReturnQuery, [
          item.saleId,
          item.prodId,
          item.batchNumber,
          item.qty,
          item.itemTotal,
          returnData.newTotalSale,
          returnData.returnRemarks,
          dateReturn,
        ]);
      }

      const insertRequestQuery = `
        INSERT INTO tbl_request (requestName, requestDetails, requestFrom, saleId, prodId, batchNumber, prodQty, itemTotal, totalSale, cash, reqType, reqDate, prodName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `;
      for (const item of returnData.salesToReturn) {
        await queryPromise(insertRequestQuery, [
          returnData.userName,
          `Return a product. - ${item.prodName}`,
          returnData.returnRemarks,
          item.saleId,
          item.prodId,
          item.batchNumber,
          item.qty,
          item.itemTotal,
          returnData.newTotalSale,
          item.cash,
          2,
          dateReturn,
          item.prodName,
        ]);
      }

      // Commit the transaction
      dbCon.commit((commitErr) => {
        if (commitErr) {
          console.log(commitErr);
          return dbCon.rollback(() => {
            res
              .status(500)
              .json({ Status: "Error", Message: "Transaction Error" });
          });
        }

        const insertNotif = `
          INSERT INTO tbl_notification (username, userActivity, dateNotif)
          VALUES ('${returnData.userName}', 'Request to return a product.', '${dateReturn}')
        `;

        dbCon.query(insertNotif, (error, resultOfAdded) => {
          if (error) {
            return res.status(500).json({
              Error: "There is an error inserting in the table",
            });
          } else {
            res.json({ Status: "Success" });
          }
        });
      });
    } catch (error) {
      console.log(error);
      // If any error occurs, rollback the transaction
      dbCon.rollback(() => {
        res.status(500).json({ Status: "Error", Message: "Transaction Error" });
      });
    }
  });
});

app.get("/getAllReturns", (req, res) => {
  const sql = `SELECT tr.*, tp.prodName, tp.prodDetails, tu.prodUnitName
  FROM tbl_return tr
  JOIN tbl_product tp ON tr.prodId = tp.prodId
  JOIN tbl_unitofproduct tupo ON tp.prodId = tupo.prodId
  JOIN tbl_unitlist tu ON tupo.prodUnitId = tu.prodUnitId
  WHERE isAdmin = 0
  GROUP BY tr.saleId
  ORDER BY STR_TO_DATE(tr.dateReturn, '%m-%d-%Y') DESC;

  
   `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error fetching the account." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

app.get("/getAllReturnsInAdmin/:id", (req, res) => {
  const id = req.params.id;

  const sql = ` 
  SELECT tr.*, tp.prodName, tp.prodDetails, tb.*
  FROM tbl_return tr
  JOIN tbl_product tp ON tr.prodId = tp.prodId
  JOIN tbl_batch tb ON tr.prodId = tb.prodId AND tr.batchNumber = tb.batchNumber
  WHERE tr.saleId = ${id} ;

   `;

  dbCon.query(sql, (err, result) => {
    if (err) {
      return res.json({ Error: "There is an error fetching the return." });
    }

    return res.json({ Status: "Success", Message: result });
  });
});

/* Return Sales Ends Here */

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  return res.json({ Message: "Successs" });
});

app.listen(port, () => {
  console.log("App is listening to port:" + port);
});

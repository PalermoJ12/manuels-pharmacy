import React, { useEffect, useState } from "react";
import style from "./Notification.module.css";

import axios from "axios";
import { IoMdNotificationsOutline } from "react-icons/io";
import apiUrl from "../../../Config/config";
import { Toast } from "react-bootstrap";
import { toast } from "react-toastify";

const formatDate = (dateStr) => {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" };
  const [month, day, year] = new Date(dateStr)
    .toLocaleDateString(undefined, options)
    .split("/");
  return `${year}-${month}-${day}`;
};

const Notification = () => {
  const [notification, setNotification] = useState([]);
  const [Name, setName] = useState("");
  useEffect(() => {
    getNotification();
    handleAuth();
  }, [Name]);

  const handleAuth = () => {
    axios
      .get(`${apiUrl}/auth`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setName(res.data.name);
          getNotification(res.data.name);
          handleReadAllNotification(res.data.name);
        }
      })
      .catch((err) => console.log(err));
  };

  const handleReadAllNotification = (name) => {
    axios
      .put(`${apiUrl}/readAllNotificationUser/${name}`)
      .then((res) => {
        if (res.data.Status === "Success") {
        } else {
          toast.error("There is an error reading the notification.");
        }
      })
      .catch((err) => console.log(err));
  };

  const getNotification = (name) => {
    axios
      .get(`${apiUrl}/getNotificationAllUser/${name}`)
      .then((res) => {
        if (res.data.Status === "Success") {
          setNotification(res.data.Message);
        } else {
          toast.error(res.data.Error);
        }
      })
      .catch((err) => console.log);
  };

  return (
    <div className={`${style.container} container-fluid vh-100`}>
      <div className="m-4 d-flex justify-content-start">
        <h2 className={`${style.lblNotif} d-flex align-items-center`}>
          Activity Logs
        </h2>
      </div>

      <div className={`${style["table-container"]} m-4`}>
        <table className={`${style.tblNotif} table  table-borderless`}>
          <tbody>
            {notification.map((data, index) => {
              return (
                <tr
                  key={index}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div className="d-flex flex-column">
                    <div>
                      <h6 className={style.notifAuthor}>{data.username}</h6>
                    </div>
                    <div>
                      <h6 className={style.notifActivity}>
                        {data.userActivity}
                      </h6>
                    </div>
                  </div>
                  <div className="d-flex flex-column">
                    <div>
                      <h6 className={style.notifAuthor}>
                        <div className="d-flex align-items-center">
                          <label className="me-1">Date</label>
                          <label className={style.lblmmddyyyy}>
                            (yyyy/mm/dd)
                          </label>
                        </div>
                      </h6>
                    </div>
                    <div>
                      <h6 className={style.notifActivity}>
                        {formatDate(data.dateNotif)}
                      </h6>
                    </div>
                  </div>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Notification;

import React, { useState } from "react";
import type { Notification } from "./studentTypes";

interface StudentNotificationsViewProps {
  notifications: Notification[];
}

const StudentNotificationsView: React.FC<StudentNotificationsViewProps> = ({
  notifications,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const totalItems = notifications.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const paginatedNotifs = notifications.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  return (
    <div className="section notificationsPage" style={{ display: "block" }}>
      <div className="card shadow-sm">
        <div className="card-body">
          {notifications.length === 0 ? (
            <p className="text-muted text-center py-4">
              You have no notifications.
            </p>
          ) : (
            <>
              <div className="notification-list">
                {paginatedNotifs.map((notif) => (
                  <div
                    key={notif._id}
                    className={`notification-item ${
                      !notif.isRead ? "unread" : ""
                    }`}
                  >
                    <div className="notification-icon">
                      {notif.recordType === "physicalExam" ? (
                        <i className="bi bi-person-vcard text-success"></i>
                      ) : notif.recordType === "monitoring" ? (
                        <i className="bi bi-heart-pulse text-success"></i>
                      ) : (
                        <i className="bi bi-file-earmark-medical text-success"></i>
                      )}
                    </div>
                    <div className="notification-content">
                      <p className="mb-0">{notif.message}</p>
                      <small className="text-muted">
                        {new Date(notif.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <nav aria-label="Notification pagination" className="mt-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <label
                        htmlFor="notifRowsPerPage"
                        className="text-muted small mb-0"
                      >
                        Rows per page:
                      </label>
                      <select
                        id="notifRowsPerPage"
                        className="form-select form-select-sm"
                        style={{ width: "auto" }}
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(parseInt(e.target.value, 10));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                      </select>
                    </div>

                    <ul className="pagination justify-content-end mb-0">
                      <li
                        className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      <li
                        className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNotificationsView;

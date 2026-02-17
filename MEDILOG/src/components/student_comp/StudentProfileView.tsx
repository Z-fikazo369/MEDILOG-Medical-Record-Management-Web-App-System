import React from "react";

interface StudentProfileViewProps {
  user: any;
  getAvatarSrc: () => string;
  onUploadClick: () => void;
}

const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  user,
  getAvatarSrc,
  onUploadClick,
}) => {
  return (
    <div className="section profilePage" style={{ display: "block" }}>
      <div className="profile-header">
        <div
          className="profile-avatar-container"
          onClick={onUploadClick}
          title="Change profile picture"
        >
          <img src={getAvatarSrc()} alt="Profile" className="profile-avatar" />
          <div className="profile-avatar-edit-icon">
            <i className="bi bi-pencil-fill"></i>
          </div>
        </div>
        <h4>{user?.username}</h4>
        <p>{user?.role}</p>
      </div>

      <div className="profile-list-group">
        <ProfileItem label="Email" value={user?.email} />
        <ProfileItem label="Student ID" value={user?.studentId} />
        <ProfileItem label="LRN" value={user?.lrn} />
        <ProfileItem label="Department" value={user?.department || "N/A"} />
        <ProfileItem label="Program" value={user?.program || "N/A"} />
        <ProfileItem label="Year Level" value={user?.yearLevel || "N/A"} />
      </div>
    </div>
  );
};

const ProfileItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div
    className="profile-list-item"
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}
  >
    <span
      className="profile-list-item-label"
      style={{ flexShrink: 0, marginRight: "20px" }}
    >
      {label}
    </span>
    <span className="profile-list-item-value" style={{ textAlign: "right" }}>
      {value}
    </span>
  </div>
);

export default StudentProfileView;

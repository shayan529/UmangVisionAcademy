import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, SectionHeader, Btn } from "./InstructorUi";
import { fetchProfile, updateProfile } from "../../redux/slices/settingsSlice";
import { logoutUser } from "../../redux/slices/authSlice";
import api from "../../config/api";

const InstructorSettings = ({ showToast }) => {
  const dispatch = useDispatch();
  
  const { profile: userProfile } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    specialization: "",
    phoneNumber: "",
    city: "",
    state: "",
    avatarUrl: "",
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    liveSessionAlerts: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        bio: userProfile.bio || "",
        specialization: userProfile.specialization || "",
        phoneNumber: userProfile.phoneNumber || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        avatarUrl: userProfile.avatarUrl || "",
      });

      if (userProfile.notificationSettings) {
        setNotifications({
          emailNotifications: userProfile.notificationSettings.emailNotifications ?? true,
          liveSessionAlerts: userProfile.notificationSettings.liveSessionAlerts ?? true,
        });
      }
    }
  }, [userProfile]);

  const saveProfile = async () => {
    if (profile.phoneNumber) {
      const phoneRegex = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;
      if (!phoneRegex.test(profile.phoneNumber)) {
        showToast("Enter a valid 10-digit phone number ✕");
        return;
      }
    }

    try {
      await dispatch(
        updateProfile({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          specialization: profile.specialization,
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state,
          avatarUrl: profile.avatarUrl,
          notificationSettings: notifications,
        })
      ).unwrap();

      setSaved(true);
      showToast("Profile saved ✓");
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
      showToast("Failed to save profile");
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        bio: userProfile.bio || "",
        specialization: userProfile.specialization || "",
        phoneNumber: userProfile.phoneNumber || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        avatarUrl: userProfile.avatarUrl || "",
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "instructor-avatars");

    setUploading(true);
    try {
      const { data } = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const newAvatarUrl = data.url;
      setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      
      // Auto-save changes with new avatarUrl
      await dispatch(
        updateProfile({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          specialization: profile.specialization,
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state,
          avatarUrl: newAvatarUrl,
          notificationSettings: notifications,
        })
      ).unwrap();
      showToast("Avatar updated ✓");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      showToast("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setProfile((prev) => ({ ...prev, avatarUrl: "" }));
    try {
      await dispatch(
        updateProfile({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          specialization: profile.specialization,
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state,
          avatarUrl: "",
          notificationSettings: notifications,
        })
      ).unwrap();
      showToast("Avatar removed ✓");
    } catch (err) {
      console.error("Failed to remove avatar:", err);
      showToast("Failed to remove avatar");
    }
  };

  const changePassword = async () => {
    if (!pwForm.current) return setPwMsg("Enter your current password");
    if (pwForm.next.length < 6) return setPwMsg("New password must be at least 6 characters");
    if (pwForm.next !== pwForm.confirm) return setPwMsg("Passwords do not match");

    try {
      await api.put("/settings/change-password", {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });

      setPwMsg("Password changed successfully ✓");
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwMsg(""), 4000);
    } catch (error) {
      setPwMsg(error.response?.data?.message || "Failed to change password");
    }
  };

  const deleteAccount = async () => {
    if (
      window.confirm(
        "WARNING: Are you sure you want to delete your account? This will permanently delete all your data, courses, and records. This action cannot be undone."
      )
    ) {
      try {
        await api.delete(`/users/${user?._id ?? user?.id}`);
        await dispatch(logoutUser()).unwrap();
        window.location.href = "/";
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete account");
      }
    }
  };

  const toggleNotif = async (key) => {
    const updatedNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(updatedNotifications);
    try {
      await dispatch(
        updateProfile({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          specialization: profile.specialization,
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state,
          avatarUrl: profile.avatarUrl,
          notificationSettings: updatedNotifications,
        })
      ).unwrap();
      showToast("Preferences updated ✓");
    } catch (err) {
      console.error("Failed to update notification settings:", err);
    }
  };

  const labelStyle = {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
    marginBottom: 5,
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 13,
    outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile Card */}
      <Card>
        <SectionHeader title="Profile Settings" />
        
        {/* Avatar Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 20,
          }}
        >
          <img
            src={
              profile.avatarUrl ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                profile.name || "Instructor",
              )}&background=7c3aed&color=fff&size=128`
            }
            alt={profile.name}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #334155",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isEditing && (
              <>
                <label
                  style={{
                    padding: "6px 14px",
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: 8,
                    color: "#f1f5f9",
                    fontSize: 12,
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  {uploading ? "Uploading..." : "Upload photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: "none" }}
                    disabled={uploading}
                  />
                </label>
                {profile.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    style={{
                      padding: "6px 14px",
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={labelStyle}>Display name</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={inputStyle}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              value={profile.email}
              style={inputStyle}
              disabled
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <label style={labelStyle}>Specialization</label>
            <input
              value={profile.specialization}
              onChange={(e) =>
                setProfile({ ...profile, specialization: e.target.value })
              }
              style={inputStyle}
              placeholder="e.g. AI, Web Development"
              disabled={!isEditing}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              value={profile.phoneNumber}
              onChange={(e) =>
                setProfile({ ...profile, phoneNumber: e.target.value })
              }
              style={inputStyle}
              placeholder="e.g. +1 555-0100"
              disabled={!isEditing}
            />
          </div>
          <div>
            <label style={labelStyle}>City</label>
            <input
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              style={inputStyle}
              placeholder="e.g. San Francisco"
              disabled={!isEditing}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>State / Province</label>
          <input
            value={profile.state}
            onChange={(e) => setProfile({ ...profile, state: e.target.value })}
            style={{ ...inputStyle, width: "32%" }}
            placeholder="e.g. CA"
            disabled={!isEditing}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Tell us about yourself..."
            disabled={!isEditing}
          />
        </div>

        {!isEditing ? (
          <Btn variant="ghost" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Btn>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="primary" onClick={saveProfile}>
              {saved ? "✓ Saved!" : "Save Changes"}
            </Btn>
            <Btn variant="ghost" onClick={handleCancelEdit}>
              Cancel
            </Btn>
          </div>
        )}
      </Card>

      {/* Notification Preferences */}
      <Card>
        <SectionHeader title="Notification Preferences" />
        {[
          {
            key: "emailNotifications",
            label: "Email notifications",
            desc: "Get notified of enrollments, student queries and course reviews",
          },
          {
            key: "liveSessionAlerts",
            label: "Live session alerts",
            desc: "Reminder 1 hour before each scheduled live session",
          },
        ].map((s) => (
          <div
            key={s.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: "1px solid #1e293b",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
                {s.label}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {s.desc}
              </div>
            </div>
            {/* Toggle */}
            <button
              onClick={() => toggleNotif(s.key)}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                background: notifications[s.key] ? "#7c3aed" : "#334155",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: notifications[s.key] ? "calc(100% - 19px)" : 3,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        ))}
      </Card>

      {/* Change Password Card */}
      <Card>
        <SectionHeader title="Change Password" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <label style={labelStyle}>Current password</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) =>
                setPwForm({ ...pwForm, current: e.target.value })
              }
              style={inputStyle}
              placeholder="••••••"
            />
          </div>
          <div>
            <label style={labelStyle}>New password</label>
            <input
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
              style={inputStyle}
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm new password</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) =>
                setPwForm({ ...pwForm, confirm: e.target.value })
              }
              style={inputStyle}
              placeholder="Repeat password"
            />
          </div>
        </div>
        {pwMsg && (
          <div
            style={{
              fontSize: 12,
              color: pwMsg.includes("✓") ? "#4ade80" : "#f87171",
              marginBottom: 10,
            }}
          >
            {pwMsg}
          </div>
        )}
        <button
          onClick={changePassword}
          style={{
            padding: "9px 20px",
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: 10,
            color: "#f1f5f9",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Update Password
        </button>
      </Card>

      {/* Danger Zone Card */}
      <Card>
        <SectionHeader title="Danger Zone" />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171" }}>
              Delete account
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              This will permanently delete all your data and published courses. This cannot be undone.
            </div>
          </div>
          <button
            onClick={deleteAccount}
            style={{
              padding: "8px 16px",
              background: "#450a0a",
              border: "1px solid #7f1d1d",
              borderRadius: 10,
              color: "#f87171",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Delete Account
          </button>
        </div>
      </Card>
    </div>
  );
};

export default InstructorSettings;

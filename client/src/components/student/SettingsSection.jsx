import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchProfile, updateProfile } from "../../redux/slices/settingsSlice";
import { fetchSubscription, cancelSubscription } from "../../redux/slices/billingSlice";
import { logoutUser } from "../../redux/slices/authSlice";
import api from "../../config/api";

export default function Settings() {
  const dispatch = useDispatch();

  const { profile: userProfile } = useSelector((state) => state.settings);
  const { user } = useSelector((state) => state.auth);
  const { subscription } = useSelector((state) => state.billing);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    bio: "",
    phoneNumber: "",
    city: "",
    state: "",
    avatarUrl: "",
  });

  const [notifications, setNotifications] = useState({
    liveClass: true,
    newCourse: true,
    community: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSubscription());
  }, [dispatch]);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        bio: userProfile.bio || "",
        phoneNumber: userProfile.phoneNumber || "",
        city: userProfile.city || "",
        state: userProfile.state || "",
        avatarUrl: userProfile.avatarUrl || "",
      });

      if (userProfile.notificationSettings) {
        setNotifications({
          liveClass: userProfile.notificationSettings.liveClass ?? true,
          newCourse: userProfile.notificationSettings.newCourse ?? true,
          community: userProfile.notificationSettings.community ?? true,
        });
      }
    }
  }, [userProfile]);

  const saveProfile = async () => {
    if (profile.phoneNumber) {
      const phoneRegex = /^(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}$/;
      if (!phoneRegex.test(profile.phoneNumber)) {
        alert("Please enter a valid 10-digit phone number (e.g., 123-456-7890 or +91 1234567890)");
        return;
      }
    }

    try {
      await dispatch(
        updateProfile({
          name: profile.name,
          email: profile.email,
          bio: profile.bio,
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state,
          avatarUrl: profile.avatarUrl,
          notificationSettings: notifications,
        }),
      ).unwrap();

      setSaved(true);
      setIsEditing(false);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCancelEdit = () => {
    if (userProfile) {
      setProfile({
        name: userProfile.name || "",
        email: userProfile.email || "",
        bio: userProfile.bio || "",
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
    formData.append("folder", "user-avatars");

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
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state,
          avatarUrl: newAvatarUrl,
          notificationSettings: notifications,
        })
      ).unwrap();
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar");
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
          phoneNumber: profile.phoneNumber,
          city: profile.city,
          state: profile.state,
          avatarUrl: "",
          notificationSettings: notifications,
        })
      ).unwrap();
    } catch (err) {
      console.error("Failed to remove avatar:", err);
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
        "WARNING: Are you sure you want to delete your account? This will permanently delete all your data and enrollment records. This action cannot be undone."
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

  const toggleNotif = (key) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

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

  const labelStyle = {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
    marginBottom: 5,
    display: "block",
  };

  const SectionCard = ({ title, children }) => (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
        borderRadius: 18,
        padding: "22px 24px",
        marginBottom: 16,
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#f1f5f9",
          marginBottom: 18,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange }) => (
    <button
      type="button"
      onClick={onChange}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background: checked ? "#7c3aed" : "#334155",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: checked ? "calc(100% - 19px)" : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
        }}
      />
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
          Settings
        </h2>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <SectionCard title="Profile">
        {/* Avatar */}
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
                profile.name || "User",
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
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              style={inputStyle}
              disabled={!isEditing}
            />
          </div>
          <div>
            <label style={labelStyle}>Email address</label>
            <input
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              style={inputStyle}
              disabled
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
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
              placeholder="e.g. New York"
              disabled={!isEditing}
            />
          </div>
          <div>
            <label style={labelStyle}>State / Province</label>
            <input
              value={profile.state}
              onChange={(e) => setProfile({ ...profile, state: e.target.value })}
              style={inputStyle}
              placeholder="e.g. NY"
              disabled={!isEditing}
            />
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
            disabled={!isEditing}
          />
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: "9px 20px",
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 10,
              color: "#f1f5f9",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Edit Profile
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={saveProfile}
              style={{
                padding: "9px 20px",
                background: saved
                  ? "#052e16"
                  : "linear-gradient(135deg,#7c3aed,#06b6d4)",
                border: "none",
                borderRadius: 10,
                color: saved ? "#4ade80" : "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {saved ? "✓ Saved!" : "Save Changes"}
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                padding: "9px 20px",
                background: "transparent",
                border: "1px solid #334155",
                borderRadius: 10,
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </SectionCard>

      {/* Subscription Card */}
      <SectionCard title="Subscription & Billing">
        {subscription && subscription.status === "active" ? (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(6, 182, 212, 0.1))",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "#fff",
                  marginBottom: 8,
                }}
              >
                {subscription.label || subscription.plan} Plan
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>
                Status: <span style={{ color: "#10b981" }}>Active</span>
              </h4>
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>
                Active since {new Date(subscription.startDate).toLocaleDateString()}
              </p>
              <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                Renews/Expires on {new Date(subscription.endDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <button
                onClick={async () => {
                  if (window.confirm("Are you sure you want to cancel your subscription?")) {
                    try {
                      await dispatch(cancelSubscription()).unwrap();
                      alert("Subscription cancelled successfully.");
                      dispatch(fetchSubscription());
                    } catch (err) {
                      alert(err || "Failed to cancel subscription");
                    }
                  }
                }}
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
                Cancel Subscription
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                Free Tier / No Subscription
              </h4>
              <p style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                Upgrade to a premium plan to unlock full access to AI tools, live coaching, and certification.
              </p>
            </div>
            <Link
              to="/billing"
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Upgrade Plan
            </Link>
          </div>
        )}
      </SectionCard>

      {/* Password */}
      <SectionCard title="Change Password">
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
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notification Preferences">
        {[
          {
            key: "liveClass",
            label: "Live class reminders",
            desc: "Get reminded 1 hour before a live session starts",
          },
          {
            key: "newCourse",
            label: "New course alerts",
            desc: "When an instructor you follow publishes a new course",
          },
          {
            key: "community",
            label: "Community replies",
            desc: "When someone replies to your post",
          },
        ].map((item) => (
          <div
            key={item.key}
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
                {item.label}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {item.desc}
              </div>
            </div>
            <Toggle
              checked={notifications[item.key]}
              onChange={() => toggleNotif(item.key)}
            />
          </div>
        ))}
      </SectionCard>

      {/* Danger zone */}
      <SectionCard title="Danger Zone">
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
              This will permanently delete all your data. This cannot be undone.
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
      </SectionCard>
    </div>
  );
}

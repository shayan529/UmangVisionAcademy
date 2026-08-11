import React, { useState, useEffect } from "react";
import { Card, SectionHeader, Btn } from "./InstructorUi";
import { useTranslation } from "react-i18next";
import { Volume2, VolumeX } from "lucide-react";
import {
  isNotificationSoundEnabled,
  toggleNotificationSound,
  testNotificationSound,
} from "../../utils/notificationSound";

const InstructorNotifications = ({ notifs, setNotifs }) => {
  const { t } = useTranslation();
  const [soundEnabled, setSoundEnabled] = useState(isNotificationSoundEnabled());
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const handleSoundChange = (e) => {
      if (e.detail?.enabled !== undefined) {
        setSoundEnabled(e.detail.enabled);
      }
    };
    window.addEventListener("notification-sound-change", handleSoundChange);
    return () =>
      window.removeEventListener("notification-sound-change", handleSoundChange);
  }, []);

  const handleToggleSound = () => {
    const next = toggleNotificationSound();
    setSoundEnabled(next);
    if (next) {
      testNotificationSound();
    }
  };

  const markAll = () => setNotifs(notifs.map((n) => ({ ...n, read: true })));
  const markOne = (i) =>
    setNotifs(notifs.map((n, idx) => (idx === i ? { ...n, read: true } : n)));

  return (
    <Card>
      <SectionHeader
        title={
          unread > 0
            ? t("instructorNotifications.titleWithUnread", { unread })
            : t("instructorNotifications.title")
        }
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={handleToggleSound}
              style={{
                background: soundEnabled ? "rgba(16,185,129,0.12)" : "#1e293b",
                border: soundEnabled
                  ? "1px solid rgba(16,185,129,0.35)"
                  : "1px solid #334155",
                color: soundEnabled ? "#34d399" : "#94a3b8",
                borderRadius: 8,
                padding: "5px 9px",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title={
                soundEnabled
                  ? "Notification Sound Active (Click to mute)"
                  : "Notification Sound Muted (Click to enable)"
              }
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{soundEnabled ? "Sound On" : "Muted"}</span>
            </button>

            {unread > 0 && (
              <Btn variant="ghost" style={{ fontSize: 12 }} onClick={markAll}>
                {t("instructorNotifications.markAllRead")}
              </Btn>
            )}
          </div>
        }
      />
      {notifs.map((n, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "12px 0",
            borderBottom: "1px solid #1e293b",
            opacity: n.read ? 0.6 : 1,
          }}
        >
          {/* Icon bubble */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: n.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {n.icon}
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#f1f5f9" }}>{n.text}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
              {n.time}
            </div>
          </div>

          {/* Unread dot */}
          {!n.read && (
            <button
              onClick={() => markOne(i)}
              title={t("instructorNotifications.markRead")}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#7c3aed",
                border: "none",
                cursor: "pointer",
                marginTop: 6,
                flexShrink: 0,
                padding: 0,
              }}
            />
          )}
        </div>
      ))}
    </Card>
  );
};

export default InstructorNotifications;

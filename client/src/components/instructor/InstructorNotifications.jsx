import React from "react";
import { Card, SectionHeader, Btn } from "./InstructorUi";
import { useTranslation } from "react-i18next";

const InstructorNotifications = ({ notifs, setNotifs }) => {
  const { t } = useTranslation();
  const unread = notifs.filter((n) => !n.read).length;

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
          unread > 0 ? (
            <Btn variant="ghost" style={{ fontSize: 12 }} onClick={markAll}>
              {t("instructorNotifications.markAllRead")}
            </Btn>
          ) : null
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

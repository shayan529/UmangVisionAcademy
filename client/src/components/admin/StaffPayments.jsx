import React from "react";
import { CreditCard, Download, RotateCcw, ShieldCheck } from "lucide-react";

const PAYMENT_ACTION_LABELS = {
  view: "View Payments",
  refund: "Process Refunds",
  export: "Export Reports",
};

const StaffPayments = ({ user }) => {
  const grantedActions = [
    ...new Set(
      (user?.assignedRoles || []).flatMap((role) =>
        (role.permissions || [])
          .filter((permission) => permission.module === "payments")
          .flatMap((permission) => permission.actions || []),
      ),
    ),
  ];

  const hasAction = (action) => grantedActions.includes(action);

  const cards = [
    {
      action: "view",
      icon: CreditCard,
      title: "Payment Records",
      desc: "Review payment, subscription, and wallet activity when reporting endpoints are connected.",
    },
    {
      action: "refund",
      icon: RotateCcw,
      title: "Refund Queue",
      desc: "Handle eligible refund requests according to the access granted to this role.",
    },
    {
      action: "export",
      icon: Download,
      title: "Exports",
      desc: "Download finance reports for reconciliation and payroll review.",
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl animate-fadeIn">
      <div className="rounded-2xl border border-indigo-900/30 bg-slate-900/60 p-6 md:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
          Payments Workspace
        </p>
        <h2 className="text-2xl md:text-3xl font-extrabold text-white">
          Finance Access
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Your assigned role grants access to the payment tools below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ action, icon: Icon, title, desc }) => {
          const enabled = hasAction(action);
          return (
            <div
              key={action}
              className={`rounded-2xl border p-5 ${
                enabled
                  ? "border-indigo-700/50 bg-indigo-950/20"
                  : "border-slate-800 bg-slate-900/40 opacity-60"
              }`}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-[#0b1120] text-indigo-300">
                <Icon size={18} />
              </div>
              <h3 className="text-sm font-extrabold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {desc}
              </p>
              <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide">
                <ShieldCheck
                  size={14}
                  className={enabled ? "text-emerald-400" : "text-slate-600"}
                />
                <span className={enabled ? "text-emerald-400" : "text-slate-600"}>
                  {enabled ? PAYMENT_ACTION_LABELS[action] : "Not Granted"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffPayments;

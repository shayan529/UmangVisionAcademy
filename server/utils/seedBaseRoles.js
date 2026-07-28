import Role, { DASHBOARD_MODULES } from "../models/role.model.js";

// Idempotent. Safe to call on every cold start (Vercel) or once at boot
// (local/Render) — duplicate-key errors from a concurrent invocation
// creating the same doc are swallowed.
export const ensureBaseRoleDocs = async () => {
    const names = Object.keys(DASHBOARD_MODULES);
    const existing = await Role.find({ name: { $in: names } })
        .select("name")
        .lean();
    const existingNames = new Set(existing.map((r) => r.name));
    const missing = names.filter((n) => !existingNames.has(n));
    if (missing.length === 0) return;

    await Promise.all(
        missing.map((name) =>
            Role.create({
                name,
                description: `System ${name} role`,
                isSystem: true,
                permissions: [],
                dashboardModules: DASHBOARD_MODULES[name],
            }).catch((err) => {
                if (err.code !== 11000) {
                    console.error(`[seedBaseRoles] failed to seed "${name}":`, err.message);
                }
            }),
        ),
    );
};
import Role, { DASHBOARD_MODULES } from "../models/role.model.js";
import { deleteKey } from "./redisClient.js";

/**
 * Idempotent. Safe to call on every cold start.
 *
 * Upserts the "student" and "instructor" system Role documents so that
 * newly-added DASHBOARD_MODULES keys (e.g. "ask_instructor", "student_queries")
 * are always propagated to the DB without requiring a manual migration.
 *
 * Also purges the role cache keys so hydrateUserRoles picks up the fresh
 * dashboardModules immediately rather than serving the old cached version.
 */
export const ensureBaseRoleDocs = async () => {
  // Remove any legacy system staff role so it doesn't pollute lookups
  await Role.deleteMany({ name: /^staff$/i, isSystem: true }).catch(() => {});

  const names = ["student", "instructor"];

  await Promise.all(
    names.map(async (name) => {
      try {
        const doc = await Role.findOneAndUpdate(
          { name: new RegExp(`^${name}$`, "i"), isSystem: true },
          {
            $set: {
              name,
              description: `System ${name} role`,
              isSystem: true,
            },
            $setOnInsert: {
              permissions: [],
              dashboardModules: DASHBOARD_MODULES[name],
            },
          },
          { upsert: true, new: true },
        );

        // Bust the role cache so hydrateUserRoles re-reads the updated doc
        if (doc?._id) {
          await deleteKey(`role:base:${name}`).catch(() => {});
          await deleteKey(`role:${doc._id.toString()}`).catch(() => {});
        }
      } catch (err) {
        if (err.code !== 11000) {
          console.error(`[seedBaseRoles] failed to upsert "${name}":`, err.message);
        }
      }
    }),
  );
};

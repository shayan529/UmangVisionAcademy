import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReels } from "../../redux/slices/reelsSlice";
import InstructorUploadReel from "../instructor/InstructorUploadReel";

const ReelsFeed = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(
    (s) => s.reels || { items: [], loading: false },
  );
  const { user } = useSelector((s) => s.auth);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchReels());
  }, [dispatch]);


  return (
    <div className="min-h-screen p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Reels</h1>
        {user?.roles?.includes("instructor") && (
          <button
            onClick={() => setUploadOpen(true)}
            className="px-3 py-2 rounded-xl bg-purple-600 text-white"
          >
            Upload Reel
          </button>
        )}
      </div>

      {uploadOpen && (
        <InstructorUploadReel onClose={() => setUploadOpen(false)} />
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((r) => (
            <div key={r._id} className="bg-slate-900 p-3 rounded-xl">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.instructorName}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-slate-400">{r.status}</div>
              </div>

              <div className="mb-2">
                <video
                  src={r.videoUrl}
                  controls
                  className="w-full rounded-md"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">{r.title}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReelsFeed;

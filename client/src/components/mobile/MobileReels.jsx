import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Heart, Eye, Music, Flame, Star, Loader2 } from "lucide-react";
import { fetchReels } from "../../redux/slices/reelsSlice";
import api from "../../config/api";

export default function MobileReels() {
  const dispatch = useDispatch();
  const { items: reels, loading } = useSelector(
    (state) => state.reels || { items: [], loading: false },
  );
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const { user } = useSelector((state) => state.auth);

  // Keep track of viewed reels in this session to avoid spamming view increments
  const viewedReels = useRef(new Set());

  useEffect(() => {
    dispatch(fetchReels());
  }, [dispatch]);

  // Set up IntersectionObserver to auto-play active video in viewport
  useEffect(() => {
    if (reels.length === 0) return;

    const observerOptions = {
      root: containerRef.current,
      rootMargin: "0px",
      threshold: 0.6, // Trigger when 60% of the video is visible
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        const reelId = video.dataset.reelId;

        if (entry.isIntersecting) {
          video.play().catch((err) => console.log("Auto-play blocked", err));

          // Increment view count on backend if not already done in this session
          if (reelId && !viewedReels.current.has(reelId)) {
            viewedReels.current.add(reelId);
            api.get(`/reels/${reelId}`).catch((err) => console.error(err));
          }
        } else {
          video.pause();
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    // Observe all video elements
    const videos = Object.values(videoRefs.current);
    videos.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => {
      videos.forEach((video) => {
        if (video) observer.unobserve(video);
      });
    };
  }, [reels]);


  const formatCount = (n) => {
    if (!n) return 0;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n;
  };

  if (loading && reels.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-140px)] bg-slate-950">
        <Loader2 className="text-indigo-500 animate-spin" size={32} />
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] bg-slate-950 text-slate-400 gap-3">
        <span className="text-4xl">🎬</span>
        <p className="text-sm font-semibold">No reels available right now</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-140px)] bg-black border border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Scrollable Container (Instagram Style CSS Snapping) */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {reels.map((reel) => {

          return (
            <div
              key={reel._id}
              className="w-full h-full snap-start snap-always relative flex items-center justify-center bg-black"
            >
              {/* Immersive Video Player */}
              <video
                ref={(el) => {
                  if (el) videoRefs.current[reel._id] = el;
                }}
                data-reel-id={reel._id}
                src={reel.videoUrl}
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Overlay dark gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Top Header Indicators */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                  <Flame size={14} className="text-amber-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    Academy Shorts
                  </span>
                </div>
              </div>



              {/* Bottom Overlay details */}
              <div className="absolute left-4 bottom-4 right-16 z-10 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-indigo-500 to-indigo-700 border border-indigo-400 flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {(reel.instructorName || "Instructor")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-white flex items-center gap-1 drop-shadow-md">
                      {reel.instructorName || "Instructor"}
                      <Star
                        size={11}
                        className="text-amber-500 fill-amber-500"
                      />
                    </p>
                    <p className="text-[9px] text-slate-300/80 drop-shadow-md">
                      Verified Instructor
                    </p>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-100 leading-snug drop-shadow-md">
                  {reel.title}
                </h4>

                {reel.description && (
                  <p className="text-[11px] text-slate-300/90 line-clamp-2 drop-shadow-md">
                    {reel.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <Music
                    size={12}
                    className="text-indigo-400 animate-spin"
                    style={{ animationDuration: "6s" }}
                  />
                  <span className="text-[9px] text-slate-400 font-medium truncate max-w-[180px] drop-shadow-md">
                    Original Audio &middot;{" "}
                    {reel.instructorName || "Instructor"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

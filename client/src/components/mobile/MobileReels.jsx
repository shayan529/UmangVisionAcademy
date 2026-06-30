import { useState } from "react";
import { Heart, MessageCircle, Share2, Music, Flame, Star } from "lucide-react";

export default function MobileReels() {
  const [reels, setReels] = useState([
    {
      id: 1,
      instructor: "Aditya Sharma",
      title: "How Web Development works in 60s",
      likes: 1245,
      comments: 89,
      music: "Original Audio - Aditya Sharma",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hand-holding-a-smartphone-showing-a-video-41703-large.mp4",
      liked: false,
    },
    {
      id: 2,
      instructor: "Umang Academy",
      title: "Quick Math Tricks for Boards Exam",
      likes: 3102,
      comments: 245,
      music: "Study Lofi Beats - Umang Academy",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-writing-notes-on-a-notebook-41617-large.mp4",
      liked: true,
    },
  ]);

  const [activeReelIndex, setActiveReelIndex] = useState(0);

  const toggleLike = (id) => {
    setReels(
      reels.map((reel) => {
        if (reel.id === id) {
          return {
            ...reel,
            liked: !reel.liked,
            likes: reel.liked ? reel.likes - 1 : reel.likes + 1,
          };
        }
        return reel;
      })
    );
  };

  return (
    <div className="max-w-md mx-auto h-[calc(100vh-140px)] flex flex-col bg-slate-950/30 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Feed Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {/* Mock Immersive Video Player background (Using stock/template video) */}
        <video
          key={reels[activeReelIndex].id}
          src={reels[activeReelIndex].videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* Overlay dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />

        {/* Top Header Indicators */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Flame size={14} className="text-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Trending Shorts</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveReelIndex((idx) => (idx > 0 ? idx - 1 : reels.length - 1))}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition"
            >
              &uarr;
            </button>
            <button
              onClick={() => setActiveReelIndex((idx) => (idx < reels.length - 1 ? idx + 1 : 0))}
              className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 hover:bg-black/60 transition"
            >
              &darr;
            </button>
          </div>
        </div>

        {/* Sidebar Interactions */}
        <div className="absolute right-4 bottom-24 flex flex-col gap-5 items-center z-10">
          {/* Like Button */}
          <button
            onClick={() => toggleLike(reels[activeReelIndex].id)}
            className="flex flex-col items-center gap-1 group"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
              reels[activeReelIndex].liked
                ? "bg-rose-500/20 border-rose-500/30 text-rose-500 scale-110"
                : "bg-black/40 border-white/10 text-white hover:bg-black/60"
            }`}>
              <Heart size={20} className={reels[activeReelIndex].liked ? "fill-rose-500" : ""} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">{reels[activeReelIndex].likes}</span>
          </button>

          {/* Comment Button */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition">
              <MessageCircle size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">{reels[activeReelIndex].comments}</span>
          </button>

          {/* Share Button */}
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition">
              <Share2 size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-300">Share</span>
          </button>
        </div>

        {/* Bottom Overlay details */}
        <div className="absolute left-4 bottom-4 right-16 z-10 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-400 flex items-center justify-center text-xs font-bold text-white shadow-lg">
              {reels[activeReelIndex].instructor.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-extrabold text-white flex items-center gap-1">
                {reels[activeReelIndex].instructor}
                <Star size={11} className="text-amber-500 fill-amber-500" />
              </p>
              <p className="text-[9px] text-slate-400">Verified Instructor</p>
            </div>
          </div>

          <h4 className="text-xs font-bold text-slate-100 leading-snug">{reels[activeReelIndex].title}</h4>

          <div className="flex items-center gap-2 mt-1">
            <Music size={12} className="text-indigo-400 animate-spin" style={{ animationDuration: "6s" }} />
            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[180px]">
              {reels[activeReelIndex].music}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

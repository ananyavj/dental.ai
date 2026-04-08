import { useState } from "react";
import AppLayout from "../components/AppLayout";
import { MOCK_VIDEOS } from "../lib/data";
import { Search, Play, Eye, Clock, Tv } from "lucide-react";

const SPECIALTIES_TV = [
  "All",
  "Endodontics",
  "Periodontics",
  "Oral Surgery",
  "Implantology",
  "Orthodontics",
  "Prosthodontics",
  "Paediatric Dentistry",
  "Oral Medicine",
];

const THUMB_COLORS = {
  Endodontics: "from-blue-400 to-blue-600",
  Periodontics: "from-green-400 to-green-600",
  "Oral Surgery": "from-red-400 to-red-600",
  Implantology: "from-purple-400 to-purple-600",
  Orthodontics: "from-indigo-400 to-indigo-600",
  Prosthodontics: "from-orange-400 to-orange-600",
  "Paediatric Dentistry": "from-yellow-400 to-yellow-500",
  "Oral Medicine": "from-teal-400 to-teal-600",
};

export default function DentalTV() {
  const [specialty, setSpecialty] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);

  const filtered = MOCK_VIDEOS.filter(
    (v) =>
      (specialty === "All" || v.specialty === specialty) &&
      (v.title.toLowerCase().includes(search.toLowerCase()) ||
        v.channel.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white border-b border-dental-border px-5 py-3">
          <h1 className="text-sm font-bold text-dental-text flex items-center gap-2">
            <Tv size={15} className="text-dental-blue" /> Dental TV
          </h1>
          <p className="text-xs text-dental-text-secondary">
            Curated dental education from trusted channels
          </p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Search + Filter */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-dental-text-secondary"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search videos, channels..."
                  className="input-field pl-9 text-xs"
                />
              </div>
            </div>

            {/* Specialty Filters */}
            <div className="flex gap-2 flex-wrap">
              {SPECIALTIES_TV.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecialty(s)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    specialty === s
                      ? "bg-dental-blue text-white border-dental-blue"
                      : "bg-white text-dental-text-secondary border-dental-border hover:border-dental-blue hover:text-dental-blue"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-3 gap-4">
              {filtered.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="card overflow-hidden cursor-pointer hover:shadow-panel transition-shadow group"
                >
                  {/* Thumbnail */}
                  <div
                    className={`relative h-36 bg-gradient-to-br ${THUMB_COLORS[video.specialty] || "from-gray-400 to-gray-600"} flex items-center justify-center`}
                  >
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Play
                        size={20}
                        className="text-white ml-1"
                        fill="white"
                      />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock size={9} /> {video.duration}
                    </div>
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white`}
                      >
                        {video.specialty}
                      </span>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="text-xs font-semibold text-dental-text leading-snug line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-[10px] text-dental-text-secondary mt-1">
                      {video.channel}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-dental-text-secondary flex items-center gap-1">
                        <Eye size={9} /> {video.views}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-10 text-dental-text-secondary">
                <Tv size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No videos found</p>
              </div>
            )}
          </div>

          {/* Video Player Panel */}
          {selectedVideo && (
            <div className="w-80 border-l border-dental-border bg-white overflow-y-auto">
              {/* Embedded Player (YouTube) */}
              <div
                className={`h-48 bg-gradient-to-br ${THUMB_COLORS[selectedVideo.specialty] || "from-gray-400 to-gray-600"} flex items-center justify-center`}
              >
                <div className="text-center text-white">
                  <Play
                    size={40}
                    className="mx-auto mb-2 opacity-80"
                    fill="white"
                  />
                  <p className="text-xs opacity-80">Click to open on YouTube</p>
                  <a
                    href={`https://youtube.com/watch?v=${selectedVideo.youtubeId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs border border-white/50 px-3 py-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    Watch on YouTube ↗
                  </a>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <h3 className="text-xs font-bold text-dental-text leading-snug">
                  {selectedVideo.title}
                </h3>
                <p className="text-[10px] text-dental-text-secondary">
                  {selectedVideo.channel}
                </p>
                <div className="flex gap-3 text-[10px] text-dental-text-secondary">
                  <span className="flex items-center gap-1">
                    <Eye size={10} /> {selectedVideo.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {selectedVideo.duration}
                  </span>
                </div>
                <span className="tag-pill text-[10px]">
                  {selectedVideo.specialty}
                </span>
                <div className="border-t border-dental-border pt-3">
                  <p className="text-[10px] font-semibold text-dental-text mb-2">
                    More like this
                  </p>
                  <div className="space-y-2">
                    {MOCK_VIDEOS.filter(
                      (v) =>
                        v.id !== selectedVideo.id &&
                        v.specialty === selectedVideo.specialty,
                    )
                      .slice(0, 3)
                      .map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVideo(v)}
                          className="w-full flex items-start gap-2 text-left hover:bg-dental-surface p-1.5 rounded-lg transition-colors"
                        >
                          <div
                            className={`w-12 h-8 rounded bg-gradient-to-br shrink-0 ${THUMB_COLORS[v.specialty] || "from-gray-400 to-gray-600"} flex items-center justify-center`}
                          >
                            <Play
                              size={10}
                              className="text-white"
                              fill="white"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-dental-text line-clamp-2 leading-snug">
                              {v.title}
                            </p>
                            <p className="text-[9px] text-dental-text-secondary">
                              {v.channel}
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

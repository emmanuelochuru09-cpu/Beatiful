import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Video,
  Music,
  Upload,
  Play,
  Pause,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface DrawerCreativeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

type StudioTab = 'image' | 'video' | 'music';

export const DrawerCreativeStudio: React.FC<DrawerCreativeStudioProps> = ({
  isOpen,
  onClose,
  apiKey,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('image');

  // Image tab states
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video tab states
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoDuration, setVideoDuration] = useState<'5s' | '10s'>('10s');
  const [uploadedVideoImage, setUploadedVideoImage] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Music tab states
  const [musicPrompt, setMusicPrompt] = useState('');
  const [musicResult, setMusicResult] = useState<string | null>(null);
  const [musicLyrics, setMusicLyrics] = useState<string | null>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState<string | null>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoImageInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Handle uploaded image for image editing
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setUploadedImage(base64);
      setImageError(null);
    };
    reader.readAsDataURL(file);
  };

  // Handle uploaded image for video animation
  const handleVideoImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setUploadedVideoImage(base64);
      setVideoError(null);
    };
    reader.readAsDataURL(file);
  };

  // Generate or edit image
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() && !uploadedImage) return;
    setIsGeneratingImage(true);
    setImageError(null);
    setImageResult(null);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          base64Image: uploadedImage || undefined,
          mimeType: 'image/png',
          model: uploadedImage ? 'gemini-3.1-flash-lite-image' : 'gemini-nano-banana-2.1',
          aspectRatio: imageAspectRatio,
          apiKey: apiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      setImageResult(data.imageUrl);
      setImageCaption(data.caption);
    } catch (err: any) {
      setImageError(err.message || 'Image generation failed');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Generate video or animate image
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() && !uploadedVideoImage) return;
    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoResult(null);
    try {
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt.trim(),
          base64Image: uploadedVideoImage || undefined,
          mimeType: 'image/png',
          aspectRatio: videoAspectRatio,
          duration: videoDuration,
          apiKey: apiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Video generation failed');
      setVideoResult(data.videoUrl);
    } catch (err: any) {
      setVideoError(err.message || 'Video generation failed');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Generate music
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim()) return;
    setIsGeneratingMusic(true);
    setMusicError(null);
    setMusicResult(null);
    setMusicLyrics(null);
    setIsPlayingMusic(false);
    try {
      const res = await fetch('/api/gemini/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: musicPrompt.trim(),
          apiKey: apiKey || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Music generation failed');
      setMusicResult(data.audioDataUrl);
      setMusicLyrics(data.lyrics);
    } catch (err: any) {
      setMusicError(err.message || 'Music generation failed');
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  const toggleMusicPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play();
      setIsPlayingMusic(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg h-full bg-[#0A0D16] border-l border-white/10 p-6 flex flex-col gap-5 overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Gemini Creative AI Studio</h3>
              <p className="text-[11px] text-slate-400">Generate images, video animations & Lyria music</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'image'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Images</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'video'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video & Motion</span>
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'music'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Lyria Music</span>
          </button>
        </div>

        {/* TAB 1: IMAGES */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Create or Edit Image</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">gemini-nano-banana-2.1</span>
              </div>

              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe what to generate, e.g. 'A futuristic neon cyberpunk Richard companion with glowing circuit lines'..."
                rows={3}
                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
              />

              {/* Upload photo for editing */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>{uploadedImage ? 'Change Image' : 'Upload Image to Edit'}</span>
                  </button>
                  {uploadedImage && (
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <label className="text-[10px] font-mono text-slate-400">Ratio:</label>
                  <select
                    value={imageAspectRatio}
                    onChange={(e: any) => setImageAspectRatio(e.target.value)}
                    className="bg-black/40 text-xs text-white border border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="1:1">1:1</option>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                  </select>
                </div>
              </div>

              {uploadedImage && (
                <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2">
                  <img
                    src={`data:image/png;base64,${uploadedImage}`}
                    alt="Uploaded thumbnail"
                    className="w-12 h-12 object-cover rounded-lg border border-white/10"
                  />
                  <span className="text-[11px] text-slate-400">
                    Image attached. Prompt Richard on how to edit or stylize it.
                  </span>
                </div>
              )}

              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || (!imagePrompt.trim() && !uploadedImage)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isGeneratingImage ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Canvas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{uploadedImage ? 'Edit Image' : 'Generate Image'}</span>
                  </>
                )}
              </button>

              {imageError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}
            </div>

            {imageResult && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Generated Output</span>
                  <a
                    href={imageResult}
                    download="richard-gemini-art.png"
                    className="p-1 text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </a>
                </div>
                <img
                  src={imageResult}
                  alt="Generated artwork"
                  className="w-full rounded-xl border border-white/10 object-contain max-h-72"
                />
                {imageCaption && <p className="text-[11px] text-slate-400">{imageCaption}</p>}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VIDEO */}
        {activeTab === 'video' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <span>Text-to-Video & Image Animation</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">gemini-omni-1.2-flash</span>
              </div>

              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="Describe video scene or motion, e.g. 'A neon wireframe face blinking with cinematic motion blur'..."
                rows={3}
                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={videoImageInputRef}
                    accept="image/*"
                    onChange={handleVideoImageFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => videoImageInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-400" />
                    <span>{uploadedVideoImage ? 'Change Image' : 'Upload Image to Animate'}</span>
                  </button>
                  {uploadedVideoImage && (
                    <button
                      onClick={() => setUploadedVideoImage(null)}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={videoAspectRatio}
                    onChange={(e: any) => setVideoAspectRatio(e.target.value)}
                    className="bg-black/40 text-xs text-white border border-white/10 rounded-lg px-2 py-1 outline-none cursor-pointer"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                  </select>
                </div>
              </div>

              {uploadedVideoImage && (
                <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex items-center gap-2">
                  <img
                    src={`data:image/png;base64,${uploadedVideoImage}`}
                    alt="Starting frame thumbnail"
                    className="w-12 h-12 object-cover rounded-lg border border-white/10"
                  />
                  <span className="text-[11px] text-slate-400">
                    Starting frame uploaded. Omni Flash will animate it into motion.
                  </span>
                </div>
              )}

              <button
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo || (!videoPrompt.trim() && !uploadedVideoImage)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isGeneratingVideo ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering Omni Video (Interactions API)...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>{uploadedVideoImage ? 'Animate Image to Video' : 'Generate Video'}</span>
                  </>
                )}
              </button>

              {videoError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{videoError}</span>
                </div>
              )}
            </div>

            {videoResult && (
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Generated Video</span>
                  <a
                    href={videoResult}
                    download="richard-video.mp4"
                    className="p-1 text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </a>
                </div>
                <video
                  src={videoResult}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-xl border border-white/10 bg-black max-h-72"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MUSIC */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Generate Music Tracks</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">lyria-3-clip-preview</span>
              </div>

              <textarea
                value={musicPrompt}
                onChange={(e) => setMusicPrompt(e.target.value)}
                placeholder="Describe music style or mood, e.g. 'Chill lo-fi study beat with warm electric piano chords and soft vinyl crackle'..."
                rows={3}
                className="w-full text-xs bg-black/40 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 resize-none"
              />

              <button
                onClick={handleGenerateMusic}
                disabled={isGeneratingMusic || !musicPrompt.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isGeneratingMusic ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Composing with Lyria...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-4 h-4" />
                    <span>Generate Music Track</span>
                  </>
                )}
              </button>

              {musicError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{musicError}</span>
                </div>
              )}
            </div>

            {musicResult && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Composed Track</span>
                  <a
                    href={musicResult}
                    download="richard-lyria-track.mp3"
                    className="p-1 text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download MP3</span>
                  </a>
                </div>

                <audio
                  ref={audioRef}
                  src={musicResult}
                  onEnded={() => setIsPlayingMusic(false)}
                  className="hidden"
                />

                <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/10">
                  <button
                    onClick={toggleMusicPlay}
                    className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md cursor-pointer"
                  >
                    {isPlayingMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">Lyria AI Generated Beat</p>
                    <p className="text-[11px] text-slate-400 truncate">30-second audio track</p>
                  </div>
                </div>

                {musicLyrics && (
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-[11px] text-slate-300 font-mono">
                    <p className="text-slate-500 text-[10px] uppercase font-semibold mb-1">Generated Notes / Lyrics</p>
                    <p className="whitespace-pre-wrap">{musicLyrics}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

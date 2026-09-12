import { VideoLoop } from "./VideoLoop";

export function ArtTraka({
  src,
  video,
  label,
}: {
  src: string;
  video?: string;
  label?: string;
}) {
  return (
    <div className="relative mb-3 h-28 overflow-hidden rounded-2xl border border-line">
      <img src={src} alt="" className="size-full object-cover object-center" draggable={false} />
      {video ? (
        <VideoLoop className="absolute inset-0 opacity-70 mix-blend-screen" src={video} />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-void/70 to-transparent" />
      {label ? (
        <p className="absolute bottom-2 left-3 text-[11px] font-bold tracking-[0.28em] text-gold uppercase">
          {label}
        </p>
      ) : null}
    </div>
  );
}

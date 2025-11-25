import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-16 w-16 overflow-hidden", className)}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        key="logo-video"
      >
        <source
          src="https://res.cloudinary.com/dhjwimevi/video/upload/v1764096899/grok-video-ac00e8b7-74a3-4043-bcf7-9673f81dcf59_1_dqu1ec.mp4"
          type="video/mp4"
        />
        Votre navigateur ne supporte pas la vidéo.
      </video>
    </div>
  );
}

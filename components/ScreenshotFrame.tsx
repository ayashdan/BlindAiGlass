// Same phone chrome as PhoneMockup, factored out so the /features gallery
// can put several different mini-screens inside an identical frame (a real
// screenshot gallery would just have images of different sizes; ours is
// hand-built, so the frame has to be the thing that stays constant).
export default function ScreenshotFrame({
  children,
  width = 240,
}: {
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div className="relative flex-shrink-0 snap-center" style={{ width }}>
      <div className="absolute -left-[3px] top-16 h-7 w-[3px] rounded-r bg-neutral-700" />
      <div className="absolute -right-[3px] top-24 h-10 w-[3px] rounded-l bg-neutral-700" />

      <div className="relative rounded-[2.2rem] border-[6px] border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl shadow-black/40">
        <div className="absolute left-1/2 top-1.5 z-10 h-3.5 w-16 -translate-x-1/2 rounded-full bg-neutral-950" />
        <div
          className="overflow-hidden rounded-[1.7rem] bg-gradient-to-b from-neutral-900 to-black"
          style={{ aspectRatio: "9 / 19.5" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

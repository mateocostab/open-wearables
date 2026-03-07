export function AvatarFallback() {
  return (
    <div className="flex items-center justify-center w-full max-w-[300px] aspect-square mx-auto">
      <svg
        viewBox="0 0 200 400"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Head */}
        <circle
          cx="100"
          cy="50"
          r="30"
          stroke="#00E5FF"
          strokeWidth={1}
          fill="none"
          opacity={0.4}
        />

        {/* Neck */}
        <line
          x1="100"
          y1="80"
          x2="100"
          y2="100"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />

        {/* Torso */}
        <polygon
          points="70,100 130,100 120,200 80,200"
          stroke="#00E5FF"
          strokeWidth={1}
          fill="none"
          opacity={0.4}
        />

        {/* Left arm */}
        <line
          x1="70"
          y1="110"
          x2="40"
          y2="160"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1="40"
          y1="160"
          x2="30"
          y2="220"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />

        {/* Right arm */}
        <line
          x1="130"
          y1="110"
          x2="160"
          y2="160"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1="160"
          y1="160"
          x2="170"
          y2="220"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />

        {/* Left leg */}
        <line
          x1="85"
          y1="200"
          x2="70"
          y2="290"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1="70"
          y1="290"
          x2="60"
          y2="380"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />

        {/* Right leg */}
        <line
          x1="115"
          y1="200"
          x2="130"
          y2="290"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />
        <line
          x1="130"
          y1="290"
          x2="140"
          y2="380"
          stroke="#00E5FF"
          strokeWidth={1}
          opacity={0.4}
        />
      </svg>
    </div>
  );
}

"use client";

import React, { useId } from "react";
import { MascotState } from "@/types/nutrino";

export interface NutrinoMascotProps {
  state?: MascotState;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  className?: string;
  showBadge?: boolean;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: 44,
  sm: 64,
  md: 92,
  lg: 128,
  xl: 164,
};

export const MASCOT_STATE_META: Record<
  MascotState,
  { label: string; description: string; defaultQuote: string }
> = {
  welcome: {
    label: "Welcome",
    description: "Big smile, waving",
    defaultQuote: "Hey! I'm Nutrino. Ready to make today a little healthier?",
  },
  happy: {
    label: "Happy",
    description: "Excited smile",
    defaultQuote: "Yay! Meal logged. You're off to a wonderful start!",
  },
  thinking: {
    label: "Thinking",
    description: "Hand on chin",
    defaultQuote: "Hmm, let me crunch the nutrition numbers for that meal...",
  },
  explaining: {
    label: "Explaining",
    description: "One hand raised",
    defaultQuote: "Looks like we could add a little more protein to your meals today. Want some ideas?",
  },
  planning: {
    label: "Planning",
    description: "Holding a meal plan clipboard",
    defaultQuote: "Let's figure out what delicious meals fit your day!",
  },
  eating: {
    label: "Eating",
    description: "Holding a warm food bowl",
    defaultQuote: "Ooh, dosa and sambar! Delicious and comforting.",
  },
  encouraging: {
    label: "Encouraging",
    description: "Thumbs up",
    defaultQuote: "That's okay! One meal or one day doesn't define your progress. Let's focus on what comes next.",
  },
  concerned: {
    label: "Concerned",
    description: "Gentle, thoughtful expression",
    defaultQuote: "Notice you've had a busy day with lighter meals—don't forget to hydrate and nourish yourself!",
  },
  sleeping: {
    label: "Sleeping",
    description: "Closed eyes, resting",
    defaultQuote: "All done for today! Rest up well—we'll make tomorrow great too.",
  },
  celebration: {
    label: "Celebration",
    description: "Jumping and cheering",
    defaultQuote: "You've been showing up consistently this week. That's something to celebrate!",
  },
  error: {
    label: "Error",
    description: "Confused but friendly",
    defaultQuote: "Oops! My avocado brain got a tiny bit tangled. Let's try that once more!",
  },
};

export function NutrinoMascot({
  state = "welcome",
  size = "md",
  animated = true,
  className = "",
  showBadge = false,
  onClick,
}: NutrinoMascotProps) {
  const uid = useId().replace(/:/g, "");
  const pixelSize = SIZE_MAP[size];

  const animationClass = !animated
    ? ""
    : state === "celebration" || state === "happy"
    ? "animate-mascot-bounce"
    : state === "thinking" || state === "sleeping"
    ? "animate-mascot-pulse"
    : "animate-mascot-float";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={`Nutrino (${MASCOT_STATE_META[state].label})`}
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
      style={{ width: pixelSize, height: pixelSize * 1.08 }}
    >
      <svg
        viewBox="0 0 200 216"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-300 ${animationClass} ${
          onClick ? "group-hover:scale-105" : ""
        }`}
      >
        <defs>
          {/* Soft 3D Outer Skin Gradient */}
          <radialGradient id={`skin-${uid}`} cx="34%" cy="25%" r="72%">
            <stop offset="0%" stopColor="#52BF7E" />
            <stop offset="52%" stopColor="#2E8B57" />
            <stop offset="100%" stopColor="#174B35" />
          </radialGradient>

          {/* Rim Specular Gradient */}
          <linearGradient id={`rim-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7C9A9" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#174B35" stopOpacity="0.2" />
          </linearGradient>

          {/* Soft 3D Creamy Inner Flesh */}
          <radialGradient id={`flesh-${uid}`} cx="36%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="62%" stopColor="#E7F4E9" />
            <stop offset="100%" stopColor="#C1E2C7" />
          </radialGradient>

          {/* Inner Flesh Bevel Ring */}
          <linearGradient id={`bevel-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#A7C9A9" />
            <stop offset="100%" stopColor="#48B273" />
          </linearGradient>

          {/* Soft 3D Avocado Pit / Seed */}
          <radialGradient id={`seed-${uid}`} cx="35%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#B67B43" />
            <stop offset="50%" stopColor="#7E4D22" />
            <stop offset="100%" stopColor="#4A2A0E" />
          </radialGradient>

          {/* Soft Floor Shadow */}
          <radialGradient id={`shadow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#174B35" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#174B35" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Floor Shadow */}
        <ellipse cx="100" cy="202" rx="50" ry="9" fill={`url(#shadow-${uid})`} />

        {/* Celebration Sparkles / Stars */}
        {state === "celebration" && (
          <g>
            <path
              d="M32 42 L36 32 L40 42 L50 46 L40 50 L36 60 L32 50 L22 46 Z"
              fill="#F4D875"
            />
            <path
              d="M164 36 L167 28 L170 36 L178 39 L170 42 L167 50 L164 42 L156 39 Z"
              fill="#F4D875"
            />
            <circle cx="42" cy="78" r="4" fill="#F4D875" />
            <circle cx="162" cy="74" r="3.5" fill="#48B273" />
          </g>
        )}

        {/* Thinking Bubbles */}
        {state === "thinking" && (
          <g>
            <circle cx="152" cy="54" r="4" fill="#A7C9A9" />
            <circle cx="164" cy="40" r="6.5" fill="#E7F4E9" stroke="#2E8B57" strokeWidth="2" />
            <circle cx="176" cy="24" r="9" fill="#FFFDF7" stroke="#2E8B57" strokeWidth="2" />
          </g>
        )}

        {/* Sleeping Zzz */}
        {state === "sleeping" && (
          <g fill="#2E8B57" fontWeight="800" fontFamily="sans-serif">
            <text x="144" y="56" fontSize="14" opacity="0.65">
              z
            </text>
            <text x="156" y="42" fontSize="18" opacity="0.85">
              Z
            </text>
            <text x="170" y="26" fontSize="22">
              Z
            </text>
          </g>
        )}

        {/* Error Question Mark */}
        {state === "error" && (
          <g>
            <circle cx="158" cy="42" r="15" fill="#FFF5F3" stroke="#D97870" strokeWidth="2.5" />
            <text
              x="153"
              y="49"
              fill="#D97870"
              fontSize="20"
              fontWeight="800"
              fontFamily="sans-serif"
            >
              ?
            </text>
          </g>
        )}

        {/* Explaining Insight Lightbulb Spark */}
        {state === "explaining" && (
          <g>
            <circle cx="162" cy="46" r="12" fill="#F4D875" opacity="0.35" />
            <circle cx="162" cy="46" r="7" fill="#F4D875" stroke="#174B35" strokeWidth="2" />
            <line x1="162" y1="30" x2="162" y2="25" stroke="#F2B84B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="175" y1="36" x2="179" y2="33" stroke="#F2B84B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="149" y1="36" x2="145" y2="33" stroke="#F2B84B" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Cute Legs */}
        {state === "celebration" ? (
          <g>
            <path
              d="M78 172 C72 182, 64 188, 58 186"
              stroke="#174B35"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M122 172 C128 182, 136 188, 142 186"
              stroke="#174B35"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <g>
            <path
              d="M80 174 C80 186, 76 194, 71 196 C66 198, 63 194, 65 189 C67 183, 72 176, 72 172 Z"
              fill="#174B35"
            />
            <path
              d="M120 174 C120 186, 124 194, 129 196 C134 198, 137 194, 135 189 C133 183, 128 176, 128 172 Z"
              fill="#174B35"
            />
          </g>
        )}

        {/* Top Leaf Sprout */}
        <g
          transform={
            state === "error"
              ? "rotate(-12 100 22)"
              : state === "celebration"
              ? "translate(0, -3)"
              : undefined
          }
        >
          <path
            d="M99 24 C99 14, 96 10, 94 8"
            stroke="#174B35"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M100 21 C103 8, 119 5, 125 14 C118 23, 107 24, 100 21 Z"
            fill="#52BF7E"
            stroke="#174B35"
            strokeWidth="2.2"
          />
          <path d="M104 18 Q113 14 120 14" stroke="#174B35" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* Outer 3D Avocado Body */}
        <path
          d="M100 22 C71 22, 55 54, 49 93 C42 137, 57 182, 100 182 C143 182, 158 137, 151 93 C145 54, 129 22, 100 22 Z"
          fill={`url(#skin-${uid})`}
          stroke={`url(#rim-${uid})`}
          strokeWidth="1.5"
        />

        {/* Creamy Inner Flesh Belly */}
        <path
          d="M100 34 C78 34, 65 60, 60 94 C54 131, 67 169, 100 169 C133 169, 146 131, 140 94 C135 60, 122 34, 100 34 Z"
          fill={`url(#flesh-${uid})`}
          stroke={`url(#bevel-${uid})`}
          strokeWidth="1.5"
        />

        {/* Soft 3D Top-Left Specular Sheen on Belly */}
        <path
          d="M77 48 C69 63, 65 82, 64 102"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* Facial Expressions by State */}
        {state === "sleeping" ? (
          <g>
            {/* Closed Peaceful Eyes */}
            <path d="M74 79 Q82 85 90 79" stroke="#20352A" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M110 79 Q118 85 126 79" stroke="#20352A" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Soft Sleeping Smile */}
            <path d="M95 90 Q100 93 105 90" stroke="#20352A" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          </g>
        ) : state === "happy" || state === "celebration" ? (
          <g>
            {/* Happy Joyful Arc Eyes */}
            <path d="M74 80 Q82 70 90 80" stroke="#20352A" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <path d="M110 80 Q118 70 126 80" stroke="#20352A" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            {/* Open Cheerful Laughing Smile */}
            <path
              d="M88 85 Q100 100 112 85 Z"
              fill="#20352A"
            />
            <path d="M93 91 Q100 96 107 91" fill="#F29B8E" />
          </g>
        ) : state === "concerned" ? (
          <g>
            {/* Gentle Empathetic Brows */}
            <path d="M74 68 L88 71" stroke="#20352A" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M126 68 L112 71" stroke="#20352A" strokeWidth="2.4" strokeLinecap="round" />
            {/* Large Caring Eyes */}
            <circle cx="82" cy="79" r="7.5" fill="#20352A" />
            <circle cx="79.5" cy="76.5" r="2.6" fill="#FFFFFF" />
            <circle cx="118" cy="79" r="7.5" fill="#20352A" />
            <circle cx="115.5" cy="76.5" r="2.6" fill="#FFFFFF" />
            {/* Gentle Soft Mouth */}
            <path d="M93 90 Q100 88 107 90" stroke="#20352A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </g>
        ) : state === "thinking" ? (
          <g>
            {/* Curious Raised Brow */}
            <path d="M74 69 Q82 67 89 70" stroke="#20352A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M111 66 Q118 62 126 66" stroke="#20352A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Eyes Looking Up-Right */}
            <circle cx="82" cy="78" r="7.2" fill="#20352A" />
            <circle cx="84" cy="75" r="2.6" fill="#FFFFFF" />
            <circle cx="118" cy="78" r="7.2" fill="#20352A" />
            <circle cx="120" cy="75" r="2.6" fill="#FFFFFF" />
            {/* Thoughtful Little Smile */}
            <path d="M94 89 Q101 91 106 87" stroke="#20352A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </g>
        ) : state === "error" ? (
          <g>
            {/* Friendly Puzzled Brows */}
            <path d="M74 70 Q82 65 89 69" stroke="#20352A" strokeWidth="2.3" strokeLinecap="round" fill="none" />
            <path d="M111 71 Q118 74 126 69" stroke="#20352A" strokeWidth="2.3" strokeLinecap="round" fill="none" />
            <circle cx="82" cy="79" r="7.2" fill="#20352A" />
            <circle cx="80" cy="76.5" r="2.5" fill="#FFFFFF" />
            <circle cx="118" cy="79" r="7.2" fill="#20352A" />
            <circle cx="116" cy="76.5" r="2.5" fill="#FFFFFF" />
            {/* Cute Wavy Mouth */}
            <path d="M91 90 Q96 87 100 90 T109 90" stroke="#20352A" strokeWidth="2.8" strokeLinecap="round" fill="none" />
          </g>
        ) : (
          /* Default Expressive Eyes & Warm Smile (welcome, explaining, planning, eating, encouraging) */
          <g>
            <circle cx="82" cy="78" r="7.6" fill="#20352A" />
            <circle cx="79.5" cy="75.3" r="2.7" fill="#FFFFFF" />
            <circle cx="84.5" cy="80.5" r="1.2" fill="#FFFFFF" />

            <circle cx="118" cy="78" r="7.6" fill="#20352A" />
            <circle cx="115.5" cy="75.3" r="2.7" fill="#FFFFFF" />
            <circle cx="120.5" cy="80.5" r="1.2" fill="#FFFFFF" />

            <path
              d="M90 86 Q100 96 110 86"
              stroke="#20352A"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* Rosy Cheeks */}
        <ellipse cx="69" cy="86" rx="6.2" ry="3.5" fill="#F29B8E" opacity="0.55" />
        <ellipse cx="131" cy="86" rx="6.2" ry="3.5" fill="#F29B8E" opacity="0.55" />

        {/* Soft 3D Avocado Pit / Seed in Lower Belly */}
        <g>
          <ellipse cx="100" cy="131" rx="23" ry="25" fill={`url(#seed-${uid})`} />
          {/* 3D Seed Specular Highlight */}
          <ellipse
            cx="91"
            cy="120"
            rx="7.5"
            ry="4.2"
            transform="rotate(-28 91 120)"
            fill="#DDA572"
            opacity="0.6"
          />
          <circle cx="86" cy="126" r="2" fill="#DDA572" opacity="0.45" />
        </g>

        {/* Arms & Props by State */}
        {state === "welcome" && (
          <g>
            {/* Left arm relaxed */}
            <path
              d="M50 104 C38 112, 34 124, 42 131"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right arm waving */}
            <g className={animated ? "origin-[148px_98px] animate-mascot-wave" : ""}>
              <path
                d="M148 98 C164 84, 172 68, 164 55"
                stroke="#174B35"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="164" cy="55" r="5" fill="#2E8B57" stroke="#174B35" strokeWidth="2" />
            </g>
          </g>
        )}

        {state === "thinking" && (
          <g>
            {/* Left arm relaxed */}
            <path
              d="M50 106 C38 114, 36 126, 44 132"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right hand resting on chin */}
            <path
              d="M148 106 C158 100, 134 94, 112 94"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="111" cy="94" r="5" fill="#2E8B57" stroke="#174B35" strokeWidth="2" />
          </g>
        )}

        {state === "explaining" && (
          <g>
            <path
              d="M50 106 C38 114, 36 126, 44 132"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Raised pointer hand */}
            <path
              d="M148 100 C165 92, 170 76, 162 64"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {state === "planning" && (
          <g>
            {/* Left arm holding clipboard */}
            <path
              d="M50 102 C34 106, 34 120, 50 124"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cute Meal Plan Clipboard */}
            <rect
              x="22"
              y="88"
              width="34"
              height="44"
              rx="6"
              fill="#FFFFFF"
              stroke="#174B35"
              strokeWidth="2.5"
            />
            <rect x="31" y="84" width="16" height="7" rx="3" fill="#F4D875" stroke="#174B35" strokeWidth="2" />
            <line x1="29" y1="101" x2="49" y2="101" stroke="#2E8B57" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="29" y1="110" x2="46" y2="110" stroke="#A7C9A9" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="29" y1="119" x2="43" y2="119" stroke="#A7C9A9" strokeWidth="2.5" strokeLinecap="round" />
            {/* Right arm pointing */}
            <path
              d="M148 102 C160 96, 164 84, 158 74"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {state === "eating" && (
          <g>
            {/* Arms holding a cute green katori bowl */}
            <path
              d="M50 106 C38 114, 52 126, 68 126"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M148 106 C160 114, 148 126, 132 126"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Warm Sambar / Food Katori Bowl */}
            <path
              d="M134 114 C134 130, 168 130, 168 114 Z"
              fill="#F4D875"
              stroke="#174B35"
              strokeWidth="2.4"
            />
            <path d="M144 108 Q146 102 144 98" stroke="#A7C9A9" strokeWidth="2" strokeLinecap="round" />
            <path d="M156 108 Q158 102 156 98" stroke="#A7C9A9" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {state === "encouraging" && (
          <g>
            <path
              d="M50 106 C38 114, 36 126, 44 132"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Thumbs-up right arm */}
            <path
              d="M148 104 C164 100, 170 88, 164 80"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="164" cy="80" r="6" fill="#52BF7E" stroke="#174B35" strokeWidth="2.2" />
            <path d="M164 74 L164 67" stroke="#174B35" strokeWidth="4.5" strokeLinecap="round" />
          </g>
        )}

        {(state === "happy" || state === "celebration") && (
          <g>
            {/* Both arms cheering upward */}
            <path
              d="M50 98 C34 84, 28 66, 36 54"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M148 98 C166 84, 172 66, 164 54"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {(state === "concerned" || state === "sleeping" || state === "error") && (
          <g>
            <path
              d="M50 106 C38 114, 38 126, 46 132"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M150 106 C162 114, 162 126, 154 132"
              stroke="#174B35"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}
      </svg>

      {showBadge && (
        <span className="mt-1 inline-flex items-center rounded-full bg-nutrino-light px-2.5 py-0.5 text-[11px] font-semibold text-nutrino-deep border border-nutrino-border">
          {MASCOT_STATE_META[state].label}
        </span>
      )}
    </div>
  );
}


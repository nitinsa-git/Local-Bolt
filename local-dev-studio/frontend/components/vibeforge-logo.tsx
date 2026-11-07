"use client";

import React from "react";

export function VibeForgeLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-label="VibeForge Logo"
    >
      <defs>
        <linearGradient
          id="vf-nextgen-bg"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#060B19" />
          <stop offset="52%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>
        <linearGradient
          id="vf-nextgen-rim"
          x1="4"
          y1="2"
          x2="60"
          y2="62"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#A855F7" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient
          id="vf-nextgen-left"
          x1="12"
          y1="24"
          x2="32"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient
          id="vf-nextgen-right"
          x1="52"
          y1="24"
          x2="32"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient
          id="vf-nextgen-bolt"
          x1="20"
          y1="10"
          x2="44"
          y2="42"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>

      {/* Spatial Obsidian Squircle Base */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#vf-nextgen-bg)" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="15.25"
        stroke="url(#vf-nextgen-rim)"
        strokeWidth="1.5"
      />

      {/* Top Specular Tubelight Accent */}
      <path
        d="M20 3.2H44"
        stroke="#22D3EE"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity="0.9"
      />

      {/* Isometric 3D VibeForge Anvil Cube */}
      <path
        d="M32 23L50 33L32 43L14 33L32 23Z"
        fill="#22D3EE"
        fillOpacity="0.18"
      />
      <path
        d="M14 33L32 43V55L14 45V33Z"
        fill="url(#vf-nextgen-left)"
        fillOpacity="0.88"
      />
      <path
        d="M50 33L32 43V55L50 45V33Z"
        fill="url(#vf-nextgen-right)"
        fillOpacity="0.9"
      />
      <path
        d="M32 23L50 33V45L32 55L14 45V33L32 23Z"
        stroke="#E2E8F0"
        strokeOpacity="0.55"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />

      {/* Glowing "V" Forge Crest + Spark Core */}
      <path
        d="M19 15L32 39L45 15H38.2L32 27.2L25.8 15H19Z"
        fill="url(#vf-nextgen-bolt)"
      />
      <path
        d="M19 15L32 39L45 15H38.2L32 27.2L25.8 15H19Z"
        stroke="#FFFFFF"
        strokeOpacity="0.7"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="12" r="2.4" fill="#67E8F9" />
    </svg>
  );
}

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
          id="vf-logo-bg"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient
          id="vf-logo-cube-left"
          x1="14"
          y1="26"
          x2="32"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient
          id="vf-logo-cube-right"
          x1="50"
          y1="26"
          x2="32"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F472B6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient
          id="vf-logo-flame"
          x1="32"
          y1="8"
          x2="32"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="45%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
      </defs>

      {/* Holographic Squircle Container */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#vf-logo-bg)" />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="15.25"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="1.5"
      />

      {/* Isometric 3D Forge Cube */}
      <path
        d="M32 22L50 32L32 42L14 32L32 22Z"
        fill="#E0E7FF"
        fillOpacity="0.22"
      />
      <path
        d="M14 32L32 42V55L14 45V32Z"
        fill="url(#vf-logo-cube-left)"
      />
      <path
        d="M50 32L32 42V55L50 45V32Z"
        fill="url(#vf-logo-cube-right)"
      />
      <path
        d="M32 22L50 32V45L32 55L14 45V32L32 22Z"
        stroke="white"
        strokeOpacity="0.58"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      {/* Electric Flame Core */}
      <path
        d="M32 9C32 9 43 17.5 41 28C39.6 35.2 35.5 38.5 32 39.5C28.5 38.5 24.4 35.2 23 28C21 17.5 32 9 32 9Z"
        fill="url(#vf-logo-flame)"
      />
      <path
        d="M32 17C32 17 37 22 36 28.5C35.2 33 33.5 35 32 35.8C30.5 35 28.8 33 28 28.5C27 22 32 17 32 17Z"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
    </svg>
  );
}

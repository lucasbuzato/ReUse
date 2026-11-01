type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export const PinIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const ArrowRightIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const SearchIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const CheckIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const HeartIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);

export const PlusIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const BoxIcon = ({ className = "h-6 w-6" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" />
    <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
  </svg>
);

export const ChatIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 18.5V6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5Z" />
  </svg>
);

export const ShieldIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3.5 19 6v5.5c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6l7-2.5Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const LeafIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z" />
    <path d="M5 19 13 11" />
  </svg>
);

export const UserIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);

export const ImageIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m20.5 16-4.8-4.6L7 19.5" />
  </svg>
);

export const PanelIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M9.5 4.5v15M13 9h4.5M13 13h4.5" />
  </svg>
);

export const RefreshIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
    <path d="M19.5 4.5v4h-4" />
  </svg>
);

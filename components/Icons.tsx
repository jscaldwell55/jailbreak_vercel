interface IconProps {
  className?: string;
  size?: number;
}

export function ShieldIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L4 6V12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12V6L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2" fill="currentColor" />
      <path
        d="M12 12V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TerminalIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 9L10 12L7 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 15H17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CircuitIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2V6M12 18V22M2 12H6M18 12H22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TargetIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function UnlockIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 11V7C8 4.79086 9.79086 3 12 3C13.8638 3 15.4299 4.27477 15.874 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function LockIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function KeyIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 12L21 21M18 21H21V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 15L17 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AlertIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3L2 21H22L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10V14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function UserIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 20C5 17.5 7.5 15.5 12 15.5C16.5 15.5 19 17.5 19 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function BotIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="4"
        y="8"
        width="16"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 4V8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="3" r="1.5" fill="currentColor" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" />
      <circle cx="15" cy="13" r="1.5" fill="currentColor" />
      <path
        d="M9 17H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M1 13H4M20 13H23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TrophyIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4H18V8C18 11.3137 15.3137 14 12 14C8.68629 14 6 11.3137 6 8V4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6 6H4C3.44772 6 3 6.44772 3 7V8C3 9.65685 4.34315 11 6 11"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18 6H20C20.5523 6 21 6.44772 21 7V8C21 9.65685 19.6569 11 18 11"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 14V17"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 21H16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 21V17H14V21"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export function SparklesIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M19 16L19.75 18.25L22 19L19.75 19.75L19 22L18.25 19.75L16 19L18.25 18.25L19 16Z"
        fill="currentColor"
      />
      <path
        d="M5 2L5.5 3.5L7 4L5.5 4.5L5 6L4.5 4.5L3 4L4.5 3.5L5 2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ChevronIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SendIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 2L11 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 2L15 22L11 13L2 9L22 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RefreshIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 12C4 7.58172 7.58172 4 12 4C15.0736 4 17.7549 5.80151 19 8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 12C20 16.4183 16.4183 20 12 20C8.92638 20 6.24513 18.1985 5 15.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M15 8.5H19.5V4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 15.5H4.5V20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowLeftIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19 12H5M5 12L12 19M5 12L12 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowRightIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CheckIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 13L9 17L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LightbulbIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 21H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 3C8.13401 3 5 6.13401 5 10C5 12.3869 6.23053 14.4832 8.10714 15.6964C8.66171 16.0545 9 16.6173 9 17.2305V18H15V17.2305C15 16.6173 15.3383 16.0545 15.8929 15.6964C17.7695 14.4832 19 12.3869 19 10C19 6.13401 15.866 3 12 3Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9 18V19C9 19.5523 9.44772 20 10 20H14C14.5523 20 15 19.5523 15 19V18"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

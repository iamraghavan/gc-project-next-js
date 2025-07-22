import type { SVGProps } from "react";

export function GitDriveLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2l6 4.5v9l-6 4.5-6-4.5v-9L12 2z"></path>
      <path d="M12 22v-8"></path>
      <path d="M18 6.5l-6 4.5-6-4.5"></path>
      <path d="M6 6.5v9"></path>
      <path d="M18 6.5v9"></path>
      <path d="M12 14l6-4.5"></path>
      <path d="M12 14l-6-4.5"></path>
    </svg>
  );
}

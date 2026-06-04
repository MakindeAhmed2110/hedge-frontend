import type { ReactNode, SVGProps } from "react";

import { HedgeColors } from "~/constants/brand";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 20, children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 19" fill="none" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export function QrCodeIcon({ size = 20, color = HedgeColors.primary, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden {...props}>
      <path
        d="M5.25 0H3C1.3455 0 0 1.3455 0 3V5.25C0 6.9045 1.3455 8.25 3 8.25H5.25C6.9045 8.25 8.25 6.9045 8.25 5.25V3C8.25 1.3455 6.9045 0 5.25 0ZM5.25 4.5C5.25 4.914 4.914 5.25 4.5 5.25H3.75C3.336 5.25 3 4.914 3 4.5V3.75C3 3.336 3.336 3 3.75 3H4.5C4.914 3 5.25 3.336 5.25 3.75V4.5ZM15 0H12.75C11.0955 0 9.75 1.3455 9.75 3V5.25C9.75 6.9045 11.0955 8.25 12.75 8.25H15C16.6545 8.25 18 6.9045 18 5.25V3C18 1.3455 16.6545 0 15 0ZM15 4.5C15 4.914 14.664 5.25 14.25 5.25H13.5C13.086 5.25 12.75 4.914 12.75 4.5V3.75C12.75 3.336 13.086 3 13.5 3H14.25C14.664 3 15 3.336 15 3.75V4.5ZM5.25 9.75H3C1.3455 9.75 0 11.0955 0 12.75V15C0 16.6545 1.3455 18 3 18H5.25C6.9045 18 8.25 16.6545 8.25 15V12.75C8.25 11.0955 6.9045 9.75 5.25 9.75ZM5.25 14.25C5.25 14.664 4.914 15 4.5 15H3.75C3.336 15 3 14.664 3 14.25V13.5C3 13.086 3.336 12.75 3.75 12.75H4.5C4.914 12.75 5.25 13.086 5.25 13.5V14.25ZM11.625 12.75H10.875C10.254 12.75 9.75 12.246 9.75 11.625V10.875C9.75 10.254 10.254 9.75 10.875 9.75H11.625C12.246 9.75 12.75 10.254 12.75 10.875V11.625C12.75 12.246 12.246 12.75 11.625 12.75ZM13.875 15C13.254 15 12.75 14.496 12.75 13.875C12.75 13.254 13.254 12.75 13.875 12.75C14.496 12.75 15 13.254 15 13.875C15 14.496 14.496 15 13.875 15ZM11.625 18H10.875C10.254 18 9.75 17.496 9.75 16.875V16.125C9.75 15.504 10.254 15 10.875 15H11.625C12.246 15 12.75 15.504 12.75 16.125V16.875C12.75 17.496 12.246 18 11.625 18ZM16.875 12.75H16.125C15.504 12.75 15 12.246 15 11.625V10.875C15 10.254 15.504 9.75 16.125 9.75H16.875C17.496 9.75 18 10.254 18 10.875V11.625C18 12.246 17.496 12.75 16.875 12.75Z"
        fill={color}
      />
    </svg>
  );
}

export function SendIcon({ size = 19, color = HedgeColors.primary, ...props }: IconProps) {
  return (
    <IconBase size={size} {...props}>
      <path
        d="M17.3703 1.99603C17.7987 0.810959 16.6504 -0.337424 15.4653 0.09198L0.981583 5.33011C-0.207459 5.76051 -0.351255 7.38292 0.742585 8.01661L5.36587 10.6932L9.49429 6.56477C9.68133 6.38413 9.93183 6.28417 10.1918 6.28643C10.4519 6.28869 10.7006 6.39298 10.8845 6.57685C11.0683 6.76072 11.1726 7.00945 11.1749 7.26947C11.1771 7.52949 11.0772 7.77999 10.8965 7.96703L6.76812 12.0955L9.4457 16.7187C10.0784 17.8126 11.7008 17.6678 12.1312 16.4797L17.3703 1.99603Z"
        fill={color}
      />
    </IconBase>
  );
}

export function SwapIcon({ size = 22, color = "#9CA3AF", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M7 10h10l-3.5-3.5M17 14H7l3.5 3.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BuyIcon({ size = 21, color = HedgeColors.primary, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

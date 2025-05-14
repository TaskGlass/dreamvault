import { CreditCard } from "lucide-react"

type CardIconProps = {
  brand?: string
  className?: string
}

export function CardIcon({ brand, className }: CardIconProps) {
  // Default to generic credit card icon
  if (!brand || brand.toLowerCase() === "card") {
    return <CreditCard className={className || "h-6 w-6"} />
  }

  // Return appropriate card brand icon
  switch (brand.toLowerCase()) {
    case "visa":
      return (
        <svg className={className || "h-6 w-6"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 10.5V13.5C22 16.5 20 18.5 17 18.5H7C4 18.5 2 16.5 2 13.5V10.5C2 7.5 4 5.5 7 5.5H17C20 5.5 22 7.5 22 10.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 9.5H10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 12.5H9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 15.5H12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.25 9.5V15.5"
            stroke="#1434CB"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.6992 9.5L13.5992 15.5"
            stroke="#1434CB"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13.5992 9.5L17.6992 15.5"
            stroke="#1434CB"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "mastercard":
      return (
        <svg className={className || "h-6 w-6"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 10.5V13.5C22 16.5 20 18.5 17 18.5H7C4 18.5 2 16.5 2 13.5V10.5C2 7.5 4 5.5 7 5.5H17C20 5.5 22 7.5 22 10.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 15C10.22 15 8.77002 13.88 8.77002 12.5C8.77002 11.12 10.22 10 12 10C13.78 10 15.23 11.12 15.23 12.5"
            stroke="#EB001B"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.23 12.5C15.23 13.88 13.78 15 12 15C10.22 15 8.77002 13.88 8.77002 12.5C8.77002 11.12 10.22 10 12 10C13.78 10 15.23 11.12 15.23 12.5Z"
            stroke="#F79E1B"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "amex":
      return (
        <svg className={className || "h-6 w-6"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 10.5V13.5C22 16.5 20 18.5 17 18.5H7C4 18.5 2 16.5 2 13.5V10.5C2 7.5 4 5.5 7 5.5H17C20 5.5 22 7.5 22 10.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 11.5L10.5 9.5H14.5L16.5 11.5L14.5 13.5H10.5L8.5 11.5Z"
            stroke="#006FCF"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case "discover":
      return (
        <svg className={className || "h-6 w-6"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22 10.5V13.5C22 16.5 20 18.5 17 18.5H7C4 18.5 2 16.5 2 13.5V10.5C2 7.5 4 5.5 7 5.5H17C20 5.5 22 7.5 22 10.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 12.5C17 14.16 15.66 15.5 14 15.5C12.34 15.5 11 14.16 11 12.5C11 10.84 12.34 9.5 14 9.5C15.66 9.5 17 10.84 17 12.5Z"
            stroke="#FF6600"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    default:
      return <CreditCard className={className || "h-6 w-6"} />
  }
}

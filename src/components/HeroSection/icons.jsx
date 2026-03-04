import { memo } from 'react';

export const IconMenu = memo(function IconMenu({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <line x1="1.6665" y1="14.25" x2="18.3332" y2="14.25" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1.6665" y1="9.25"  x2="18.3332" y2="9.25"  stroke="currentColor" strokeWidth="1.5"/>
      <line x1="1.6665" y1="4.25"  x2="18.3332" y2="4.25"  stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
});

export const IconPlus = memo(function IconPlus({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
});

export const IconCall = memo(function IconCall({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M17.9995 15.064C17.9995 15.352 17.9354 15.648 17.7992 15.936C17.663 16.224 17.4867 16.496 17.2544 16.752C16.8618 17.184 16.4292 17.496 15.9404 17.696C15.4597 17.896 14.9389 18 14.3781 18C13.5609 18 12.6875 17.808 11.7662 17.416C10.8448 17.024 9.9234 16.496 9.01003 15.832C8.08865 15.16 7.21534 14.416 6.38209 13.592C5.55685 12.76 4.81173 11.888 4.14673 10.976C3.48975 10.064 2.96095 9.15204 2.57638 8.24804C2.1918 7.33604 1.99951 6.46404 1.99951 5.63204C1.99951 5.08804 2.09566 4.56804 2.28794 4.08804C2.48023 3.60004 2.78469 3.15204 3.20933 2.75204C3.7221 2.24804 4.28294 2.00004 4.87583 2.00004C5.10016 2.00004 5.3245 2.04804 5.5248 2.14404C5.73311 2.24004 5.91739 2.38404 6.06161 2.59204L7.92039 5.20804C8.06461 5.40804 8.16877 5.59204 8.24087 5.76804C8.31298 5.93604 8.35304 6.10404 8.35304 6.25604C8.35304 6.44804 8.29696 6.64004 8.18479 6.82404C8.08063 7.00804 7.92841 7.20004 7.73612 7.39204L7.1272 8.02404C7.03907 8.11204 6.99901 8.21604 6.99901 8.34404C6.99901 8.40804 7.00702 8.46404 7.02305 8.52804C7.04708 8.59204 7.07112 8.64004 7.08714 8.68804C7.23136 8.95204 7.47973 9.29604 7.83226 9.71204C8.1928 10.128 8.57738 10.552 8.994 10.976C9.42665 11.4 9.84328 11.792 10.2679 12.152C10.6845 12.504 11.0291 12.744 11.3015 12.888C11.3415 12.904 11.3896 12.928 11.4457 12.952C11.5098 12.976 11.5739 12.984 11.646 12.984C11.7822 12.984 11.8863 12.936 11.9745 12.848L12.5834 12.248C12.7837 12.048 12.976 11.896 13.1603 11.8C13.3445 11.688 13.5288 11.632 13.7291 11.632C13.8813 11.632 14.0416 11.664 14.2178 11.736C14.3941 11.808 14.5784 11.912 14.7787 12.048L17.4307 13.928C17.639 14.072 17.7832 14.24 17.8713 14.44C17.9514 14.64 17.9995 14.84 17.9995 15.064Z" stroke="currentColor" strokeMiterlimit="10"/>
    </svg>
  );
});

export const IconDownArrow = memo(function IconDownArrow({ className }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path d="M15.8926 9.89258L10 15.7851L4.10747 9.89258" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 6V15.7852" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
});

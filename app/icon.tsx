import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Google Search requires multiples of 48px (192x192 px is the optimal standard)
export const size = {
  width: 192,
  height: 192,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070A12',
          borderRadius: '40px',
          border: '5px solid #FACC15',
          boxShadow: '0 0 35px rgba(250, 204, 21, 0.45)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="118"
          height="118"
          fill="none"
        >
          {/* Background Neon Pulse Wave */}
          <path
            d="M2 13H5.5L8 7L11.5 17L14 11L16 13H22"
            stroke="#10B981"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
          {/* Foreground Electric Snap Lightning Bolt */}
          <path
            d="M13 2L4.5 13.5H11.5L10.5 22L19.5 10.5H12.5L13 2Z"
            fill="#FACC15"
            stroke="#FEF08A"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
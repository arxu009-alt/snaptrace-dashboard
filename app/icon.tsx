import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: '#090D16',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1.5px solid #FACC15',
          boxShadow: '0 0 10px rgba(250, 204, 21, 0.5)',
        }}
      >
        ⚡
      </div>
    ),
    {
      ...size,
    }
  );
}
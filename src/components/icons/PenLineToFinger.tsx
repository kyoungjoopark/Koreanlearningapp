import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const PenLineToFinger: React.FC<IconProps> = ({ size = 24, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* 수정된 SVG 경로: 펜촉과 손가락을 형상화 */}
      {/* 펜촉 부분 */}
      <path d="M14 4l4.95 4.95a1 1 0 0 1 0 1.41l-9.9 9.9a1 1 0 0 1-.71.29H4a1 1 0 0 1-1-1v-4.24a1 1 0 0 1 .29-.71l9.9-9.9a1 1 0 0 1 1.41 0L14 4z" />
      <path d="M12 6l6 6" />
      
      {/* 손가락으로 가리키는 부분 (기존 SVG와 다르게 표현) */}
      {/* 아래는 손가락을 나타내는 매우 단순화된 예시이며, 필요에 따라 더 정교하게 수정 가능합니다. */}
      {/* 검지 손가락 */}
      <path d="M17 11l4-1 -1 4-4.35 1.2a2 2 0 0 0-1.3.9l-1.4 2.45" />
      {/* 나머지 접힌 손가락들 (단순화) */}
      <path d="M15.5 18.5c-1 0-1.5-.5-1.5-1.5s.5-1.5 1.5-1.5" />
      <path d="M13.5 20.5c-1 0-1.5-.5-1.5-1.5s.5-1.5 1.5-1.5" />
    </svg>
  );
};

export default PenLineToFinger; 
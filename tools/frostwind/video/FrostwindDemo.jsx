import React from 'react';
import '@fontsource/inter/700.css';
import { Video } from '@remotion/media';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';

const SHOT_FRAMES = 195;
export const DEMO_FRAMES = SHOT_FRAMES * 3;
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const ICONS = {
  frostwood: [
    [7, 12, 2, 3, '#7a90a8'],
    [5, 9, 6, 3, '#9ec0e0'],
    [6, 6, 4, 3, '#b7d2ea'],
    [7, 3, 2, 3, '#d6e8f6'],
    [7, 2, 2, 1, '#ffffff'],
  ],
  meadow: [
    [7, 4, 2, 2, '#e0c05a'],
    [4, 5, 1, 1, '#e8d48a'],
    [11, 5, 1, 1, '#e8d48a'],
    [5, 3, 1, 1, '#e8d48a'],
    [10, 3, 1, 1, '#e8d48a'],
    [7, 1, 2, 1, '#e8d48a'],
    [3, 11, 10, 2, '#6a8f4e'],
    [5, 10, 2, 1, '#7ea35c'],
    [9, 10, 2, 1, '#7ea35c'],
    [7, 8, 2, 3, '#8a6a3a'],
  ],
  swamp: [
    [2, 12, 12, 2, '#4a7a6a'],
    [3, 11, 10, 1, '#6fa87a'],
    [5, 5, 1, 6, '#3d5c48'],
    [10, 6, 1, 5, '#3d5c48'],
    [4, 4, 3, 2, '#7fbf88'],
    [9, 5, 3, 2, '#7fbf88'],
    [7, 9, 2, 1, '#c9b45a'],
  ],
};

const SHOTS = [
  {
    key: 'frostwood',
    title: 'Frostwood',
    accent: '#9ec0e0',
    from: 0,
    sourceFrom: 135,
  },
  {
    key: 'meadow',
    title: 'Sun Meadow',
    accent: '#e0c05a',
    from: SHOT_FRAMES,
    sourceFrom: 375,
  },
  {
    key: 'swamp',
    title: 'Green Swamp',
    accent: '#6fa87a',
    from: SHOT_FRAMES * 2,
    sourceFrom: 615,
  },
];

const WorldIcon = ({ name }) => (
  <svg
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    style={{ width: 64, height: 64, imageRendering: 'pixelated' }}
  >
    {ICONS[name].map(([x, y, width, height, fill], index) => (
      <rect key={index} x={x} y={y} width={width} height={height} fill={fill} />
    ))}
  </svg>
);

const WorldLabel = ({ shot }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [4, 10], [0, 1], CLAMP);
  const exit = interpolate(frame, [SHOT_FRAMES - 12, SHOT_FRAMES - 6], [1, 0], CLAMP);

  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        top: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        minWidth: 520,
        padding: '16px 26px 16px 16px',
        color: shot.accent,
        background: 'rgba(5,8,12,0.84)',
        border: '1px solid rgba(238,243,246,0.14)',
        borderLeft: `5px solid ${shot.accent}`,
        boxShadow: '0 14px 32px rgba(0,0,0,0.34)',
        fontFamily: "'Inter', Arial, sans-serif",
        opacity: enter * exit,
        transform: `translateX(${interpolate(enter, [0, 1], [-18, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 82,
          height: 82,
          display: 'grid',
          placeItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.045)',
          border: `1px solid ${shot.accent}55`,
        }}
      >
        <WorldIcon name={shot.key} />
      </div>
      <div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {shot.title}
        </div>
        <div
          style={{
            marginTop: 10,
            color: '#89949d',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          SEED 20260727&nbsp;&nbsp;/&nbsp;&nbsp;T 12.50&nbsp;&nbsp;/&nbsp;&nbsp;VIEW 960×540
        </div>
      </div>
    </div>
  );
};

const WorldCut = ({ shot }) => (
  <AbsoluteFill>
    <Video
      src={staticFile('frostwind-preview-source.mp4')}
      trimBefore={shot.sourceFrom}
      trimAfter={shot.sourceFrom + SHOT_FRAMES}
      volume={(frame) => interpolate(
        frame,
        [0, 6, SHOT_FRAMES - 10, SHOT_FRAMES - 1],
        [0, 1, 1, 0],
        CLAMP,
      )}
      objectFit="cover"
      style={{ width: '100%', height: '100%' }}
    />
    <WorldLabel shot={shot} />
  </AbsoluteFill>
);

export const FrostwindDemo = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    {SHOTS.map((shot) => (
      <Sequence key={shot.key} from={shot.from} durationInFrames={SHOT_FRAMES}>
        <WorldCut shot={shot} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

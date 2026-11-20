import React from 'react';
import { Composition } from 'remotion';
import { DEMO_FRAMES, FrostwindDemo } from './FrostwindDemo.jsx';

export const RemotionRoot = () => (
  <Composition
    id="FrostwindDemo"
    component={FrostwindDemo}
    durationInFrames={DEMO_FRAMES}
    fps={30}
    width={1920}
    height={1080}
  />
);

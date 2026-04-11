"use client";

import styled from "styled-components";

const Title = styled.h1`
  font-size: clamp(1.75rem, 5vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(
    120deg,
    #1976d2 0%,
    #00bcd4 45%,
    #7b2cbf 85%,
    #ff006e 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: glowShift 10s ease infinite;
  text-shadow: 0 0 40px rgba(0, 188, 212, 0.15);

  @keyframes glowShift {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
`;

export function GlowingTitle({ children }: { children: React.ReactNode }) {
  return <Title>{children}</Title>;
}

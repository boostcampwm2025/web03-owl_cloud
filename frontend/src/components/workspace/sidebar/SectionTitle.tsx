'use client';

import React from 'react';

interface SectionTitleProps {
  title: string;
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return (
    <h3 className="mb-3 text-sm font-semibold text-neutral-500">{title}</h3>
  );
}

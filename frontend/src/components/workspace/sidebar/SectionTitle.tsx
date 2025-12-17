'use client';

import React from 'react';

interface SectionTitleProps {
  title: string;
}

export default function SectionTitle({ title }: SectionTitleProps) {
  return <h3 className="text-md mb-3 font-bold text-gray-500">{title}</h3>;
}

"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

interface AspectRatioProps {
  [key: string]: any;
}

function AspectRatio({
  ...props
}: AspectRatioProps) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };

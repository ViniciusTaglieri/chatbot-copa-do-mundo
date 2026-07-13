"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import { useState } from "react"

interface Props {
  images: string[]
  alt?: string
  className?: string
}

export function ImageBentoGrid({ images, alt, className }: Props) {
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set())

  const visibleImages = images.filter((_, i) => !failedIndices.has(i))

  if (visibleImages.length === 0) return null

  function handleError(index: number) {
    setFailedIndices((prev) => new Set(prev).add(index))
  }

  if (visibleImages.length === 1) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-t-lg", className)}>
        <Image
          src={visibleImages[0]}
          alt={alt ?? ""}
          width={800}
          height={450}
          unoptimized
          className="h-auto w-full object-cover"
          onError={() => handleError(images.indexOf(visibleImages[0]))}
        />
      </div>
    )
  }

  const mainImage = visibleImages[0]
  const thumbs = visibleImages.slice(1, 3)
  const mainIndex = images.indexOf(mainImage)

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-t-lg", className)}>
      <div className="relative w-full">
        <Image
          src={mainImage}
          alt={alt ?? ""}
          width={800}
          height={450}
          unoptimized
          className="h-auto w-full object-cover"
          style={{ aspectRatio: "16/9" }}
          onError={() => handleError(mainIndex)}
        />
      </div>
      {thumbs.length > 0 && (
        <div className="flex w-full">
          {thumbs.map((thumb) => {
            const thumbIndex = images.indexOf(thumb)
            return (
              <div key={thumbIndex} className="relative w-1/2">
                <Image
                  src={thumb}
                  alt={alt ?? ""}
                  width={400}
                  height={400}
                  unoptimized
                  className="h-auto w-full object-cover"
                  style={{ aspectRatio: "1/1" }}
                  onError={() => handleError(thumbIndex)}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

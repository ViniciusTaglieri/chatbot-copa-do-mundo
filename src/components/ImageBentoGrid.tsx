"use client"

import { cn } from "@/lib/utils"
import { useState } from "react"

interface Props {
  images: string[]
  alt?: string
  className?: string
}

const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' fill='%23e5e7eb'%3E%3Crect width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-size='14'%3EImagem indispon%C3%ADvel%3C/text%3E%3C/svg%3E"

function SkeletonBlock({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        className,
      )}
      style={style}
    />
  )
}

function ImageWithFallback({
  src,
  alt,
  className,
  style,
  onError,
}: {
  src: string
  alt: string
  className?: string
  style?: React.CSSProperties
  onError: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  return (
    <>
      {!loaded && !errored && (
        <SkeletonBlock className={cn("absolute inset-0", className)} style={style} />
      )}
      <img
        src={errored ? FALLBACK_SVG : src}
        alt={alt}
        loading="lazy"
        className={cn(
          "h-auto w-full object-cover transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
        style={style}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true)
          setLoaded(true)
          onError()
        }}
      />
    </>
  )
}

export function ImageBentoGrid({ images, alt, className }: Props) {
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set())

  const visibleImages = images.filter((_, i) => !failedIndices.has(i))

  if (images.length === 0) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-t-lg", className)}>
        <SkeletonBlock className="w-full" style={{ aspectRatio: "16/9" }} />
      </div>
    )
  }

  if (visibleImages.length === 0) return null

  function handleError(index: number) {
    setFailedIndices((prev) => new Set(prev).add(index))
  }

  if (visibleImages.length === 1) {
    return (
      <div className={cn("relative w-full overflow-hidden rounded-t-lg", className)}>
        <ImageWithFallback
          src={visibleImages[0]}
          alt={alt ?? ""}
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
        <ImageWithFallback
          src={mainImage}
          alt={alt ?? ""}
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
                <ImageWithFallback
                  src={thumb}
                  alt={alt ?? ""}
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

/**
 * Full-viewport CesiumJS globe. Children (Entities/Layers) render on top.
 *
 * We configure a minimal viewer: no timeline/animation/geocoder chrome for
 * now. We'll introduce a design-system shell in a later pass.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { Viewer, type CesiumComponentRef } from 'resium'
import {
  Ion,
  OpenStreetMapImageryProvider,
  ImageryLayer,
  Cartesian3,
  type Viewer as CesiumViewer,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

// Apply Cesium ion token if the user has one. Without it, OSM imagery below
// still gives a zero-setup first-run experience.
const IONTOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined
if (IONTOKEN) {
  Ion.defaultAccessToken = IONTOKEN
}

// Built once; Cesium will reuse the layer across viewer re-mounts.
const osmImagery = new ImageryLayer(
  new OpenStreetMapImageryProvider({
    url: 'https://tile.openstreetmap.org/',
  }),
  {},
)

interface GlobeProps {
  children?: ReactNode
}

export function Globe({ children }: GlobeProps) {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null)

  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return
    // Start zoomed out enough to see an orbiting satellite against Earth.
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(0, 0, 30_000_000),
    })
  }, [])

  return (
    <Viewer
      ref={viewerRef}
      full
      baseLayer={osmImagery}
      timeline={false}
      animation={false}
      geocoder={false}
      homeButton={false}
      sceneModePicker={false}
      baseLayerPicker={false}
      navigationHelpButton={false}
      fullscreenButton={false}
      infoBox={false}
      selectionIndicator={false}
    >
      {children}
    </Viewer>
  )
}

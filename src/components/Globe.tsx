/**
 * Full-viewport CesiumJS globe. Children (Entities/Layers) render on top.
 *
 * Configures:
 *   - Tycho-2 starfield SkyBox (Cesium ships the textures).
 *   - Three Earth-appearance modes, driven by the UI store:
 *       * "minimal" — no imagery, dark-blue globe. Opinionated default.
 *       * "full"    — OpenStreetMap tiles (or Bing via ion, if configured).
 *       * "night"   — NASA Black Marble via Cesium ion (asset 3845) if an
 *                     ion token is present; otherwise a very dark globe.
 *   - No timeline/animation/geocoder chrome.
 *
 * TODO(minimal-coastlines): Render a simplified Natural Earth coastlines
 *   GeoJSON when earthMode === 'minimal' so the globe isn't featureless.
 *   Needs a bundled ~100 KB GeoJSON asset — separate decision.
 * TODO(starfield-shader): Swap the skybox for a procedural shader with
 *   brightness falloff away from the camera axis for a more cinematic look.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { Viewer, type CesiumComponentRef } from 'resium'
import {
  buildModuleUrl,
  Cartesian3,
  Color,
  IonImageryProvider,
  ImageryLayer,
  Ion,
  OpenStreetMapImageryProvider,
  SkyBox,
  type Viewer as CesiumViewer,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { useUIStore, type EarthMode } from '../stores/ui'

const IONTOKEN = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined
if (IONTOKEN) {
  Ion.defaultAccessToken = IONTOKEN
}

const MINIMAL_GLOBE_COLOR = Color.fromCssColorString('#0a1428')
const NIGHT_FALLBACK_COLOR = Color.fromCssColorString('#050914')

// NASA Black Marble 2017 (night lights) — public Cesium ion asset.
const ION_ASSET_BLACK_MARBLE = 3845

function buildStarSkyBox(): SkyBox {
  return new SkyBox({
    sources: {
      positiveX: buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_px.jpg'),
      negativeX: buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_mx.jpg'),
      positiveY: buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_py.jpg'),
      negativeY: buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_my.jpg'),
      positiveZ: buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_pz.jpg'),
      negativeZ: buildModuleUrl('Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'),
    },
  })
}

function buildOsmLayer(): ImageryLayer {
  return new ImageryLayer(
    new OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
    {},
  )
}

/** Reconfigure the globe's imagery/base color for the given mode. */
async function applyEarthMode(viewer: CesiumViewer, mode: EarthMode): Promise<void> {
  const { imageryLayers, globe } = viewer.scene
  imageryLayers.removeAll()

  if (mode === 'full') {
    globe.baseColor = Color.BLACK
    imageryLayers.add(buildOsmLayer())
    return
  }

  if (mode === 'minimal') {
    // No imagery — the globe renders as a solid dark-blue sphere with
    // Cesium's default diurnal lighting (subtle terminator shading).
    globe.baseColor = MINIMAL_GLOBE_COLOR
    return
  }

  // mode === 'night'
  if (IONTOKEN) {
    try {
      const provider = await IonImageryProvider.fromAssetId(ION_ASSET_BLACK_MARBLE)
      // Race guard — if the user flipped modes again while we were loading,
      // don't stomp the new config.
      if (useUIStore.getState().earthMode === 'night') {
        globe.baseColor = NIGHT_FALLBACK_COLOR
        imageryLayers.add(new ImageryLayer(provider, {}))
      }
    } catch (err) {
      console.warn('[globe] Failed to load Black Marble imagery:', err)
      globe.baseColor = NIGHT_FALLBACK_COLOR
    }
  } else {
    // No ion token → we can't load Black Marble. Show a very dark globe
    // so the mode still looks distinct and the satellites still stand out.
    globe.baseColor = NIGHT_FALLBACK_COLOR
  }
}

interface GlobeProps {
  children?: ReactNode
}

export function Globe({ children }: GlobeProps) {
  const viewerRef = useRef<CesiumComponentRef<CesiumViewer> | null>(null)
  const earthMode = useUIStore((s) => s.earthMode)

  // One-time: camera frame + starfield skybox.
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(0, 0, 30_000_000),
    })
    viewer.scene.skyBox = buildStarSkyBox()
    viewer.scene.backgroundColor = Color.BLACK
    viewer.scene.requestRender()
  }, [])

  // Reconfigure Earth appearance whenever the store changes.
  useEffect(() => {
    const viewer = viewerRef.current?.cesiumElement
    if (!viewer) return
    void applyEarthMode(viewer, earthMode).then(() => {
      if (!viewer.isDestroyed()) viewer.scene.requestRender()
    })
  }, [earthMode])

  return (
    <Viewer
      ref={viewerRef}
      full
      // Initialize with no imagery — the effect above installs the right
      // one for the active mode as soon as the viewer mounts. Skipping the
      // default Bing/Ion imagery avoids a visible flash on load.
      baseLayer={false}
      requestRenderMode
      maximumRenderTimeChange={Infinity}
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

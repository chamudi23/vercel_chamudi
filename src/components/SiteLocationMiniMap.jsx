/* eslint-disable react/prop-types */
import 'leaflet/dist/leaflet.css'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'

export default function SiteLocationMiniMap({ latitude, longitude, siteName }) {
  const lat = Number(latitude)
  const lng = Number(longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return (
    <div className="h-[230px] w-full overflow-hidden rounded-md border border-white/10 bg-slate-900" aria-label={`Map showing ${siteName || 'archaeological site'}`}>
      <MapContainer
        key={`${lat}-${lng}`}
        center={[lat, lng]}
        zoom={10}
        minZoom={6}
        maxZoom={16}
        zoomControl={true}
        dragging={true}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <CircleMarker
          key={`${lat}-${lng}`}
          center={[lat, lng]}
          radius={9}
          pane="markerPane"
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillColor: '#22d3ee',
            fillOpacity: 1,
          }}
        >
          <Popup>{siteName || 'Archaeological site'}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  )
}

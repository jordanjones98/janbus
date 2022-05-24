import { useEffect, useState } from "react";
import "./App.css";
import api from "./api";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { LatLngExpression, LatLngTuple } from "leaflet";
import * as L from "leaflet";
import { Vehicle, Line } from "./types";
import LinePicker from "./LinePicker";
import { ApiError } from "./api";
type VehiclePopupProps = {
  vehicle: Vehicle;
};

/**
 * Main map render function. This renders a map with all busses on it
 * marked with a bus marker icon. It also allows for filtering of busses
 * based on their line.
 */
export default function RenderMap() {
  const [vehicles, setVehicles] = useState<Array<Vehicle>>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Array<Vehicle>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lineId, setLineId] = useState<string>("");
  const [lines] = useState<Array<Line>>([]);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date>();
  const [apiError, setApiError] = useState<ApiError>();
  const center: LatLngTuple = [37.81018163225775, -122.26181599563523];
  // 61 seconds because API only allows 60 requests an hour (one every 60 seconds) and want to mitigate race conditions
  const MINUTE_MS = 61000;

  /**
   * Layer that uses the useMap hook to pan to the average coordinate of the filtered vehicles
   */
  function PanLayer() {
    const map = useMap();
    if (filteredVehicles.length > 0) {
      const { lat, long } = filteredVehicles.reduce(
        (acc, vehicle) => {
          acc.lat += vehicle.location.lat;
          acc.long += vehicle.location.long;
          return acc;
        },
        { lat: 0, long: 0 }
      );
      let length = filteredVehicles.length;

      const avLat = lat / length;
      const avLong = long / length;
      map.flyTo([avLat, avLong]);
    }

    return <></>;
  }

  /**
   * Reload bus data
   */
  function reloadData() {
    setIsLoading(true);
  }

  /**
   * Interval to reload data. Return cleans up the interval when component is unmounted
   */
  useEffect(() => {
    const interval = setInterval(() => {
      reloadData();
    }, MINUTE_MS);

    return () => clearInterval(interval);
  }, []);

  /**
   * Get vhicles and set those vehicles in state
   */
  useEffect(() => {
    if (isLoading) {
      api
        .getVehicles()
        .then((vehicles) => {
          setVehicles(vehicles);
          setLastUpdatedTime(new Date());
        })
        .catch((e: ApiError) => setApiError(e))
        .finally(() => setIsLoading(false));
    }
  }, [isLoading]);

  /**
   * Set fitlered vehilces based on the lineId
   * Trying to limit API queries as much as possible due to 60 per minute limit
   */
  useEffect(() => {
    const filter = lineId === "" ? false : true;
    setFilteredVehicles(
      vehicles.filter((vehicle) => (filter ? vehicle.lineRef === lineId : true))
    );
  }, [lineId, vehicles]);

  /**
   * Get marker icon
   */
  function getIcon(iconUrl: string) {
    return L.icon({
      iconUrl: process.env.PUBLIC_URL + iconUrl,
      iconSize: [32, 32],
      iconAnchor: [16, 5],
    });
  }

  /**
   * Handle line being changed with the select
   */
  function handleLineChange(lineId: string) {
    setLineId(lineId);
  }

  /**
   * Given a vehicle add it's line to the line array if it does not already exist
   */
  function addLine(vehicle: Vehicle) {
    const line = {
      id: vehicle.lineRef,
      name: vehicle.lineName,
    };

    if (line.name && !lines.find((l) => l.id === line.id)) {
      lines.push(line);
    }
  }

  return (
    <>
      {apiError ? (
        <>
          <h1>An API Error has Occured:</h1>
          <h3>{apiError.message}</h3>
        </>
      ) : (
        <>
          <MapContainer
            className="map"
            center={center}
            zoom={12}
            scrollWheelZoom={true}
          >
            <>
              <PanLayer />
              <TileLayer
                attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Last updated at ${lastUpdatedTime?.toLocaleTimeString()}`}
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredVehicles &&
                filteredVehicles.map((vehicle, key) => {
                  addLine(vehicle);
                  const position = [
                    vehicle.location.lat,
                    vehicle.location.long,
                  ] as LatLngExpression;
                  return (
                    <Marker
                      icon={getIcon(vehicle.markerIcon)}
                      position={position}
                      key={key}
                    >
                      <VehiclePopup vehicle={vehicle} />
                    </Marker>
                  );
                })}
            </>
          </MapContainer>
          <LinePicker lines={lines} onLineChange={handleLineChange} />
        </>
      )}
    </>
  );
}

/**
 * Popup for general vehicle information when a vehicle is clicked
 */
function VehiclePopup(props: VehiclePopupProps) {
  const vehicle = props.vehicle;
  return (
    <Popup>
      <dl>
        <dt>Vehicle information:</dt>
        <dd>Line Name: {vehicle.lineName}</dd>
        <dd>Direction: {vehicle.prettyDirection}</dd>
        <dd>Origin: {vehicle.origin}</dd>
        <dd>Destination: {vehicle.destination}</dd>
        <dd>Occupancy: {vehicle.occupancy}</dd>
        <dt>Next Stop:</dt>
        {vehicle.nextStop.name ? (
          <>
            <dd>Name: {vehicle.nextStop.name}</dd>
            <dd>
              Expected Arival Time:
              {vehicle.nextStop.expectedArivalTime
                ? vehicle.nextStop.expectedArivalTime.toLocaleTimeString()
                : "Unknown"}
            </dd>
          </>
        ) : (
          <>Not Available</>
        )}
      </dl>
    </Popup>
  );
}

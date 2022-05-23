import { useRef, useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import api from "./api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import * as L from "leaflet";
import { Vehicle, Line } from "./types";
import LinePicker from "./LinePicker";
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
  const long = -122.42965439805562;
  const lat = 37.753237220890355;
  const MINUTE_MS = 61000;

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
      <MapContainer
        className="map"
        center={[lat, long]}
        zoom={13}
        scrollWheelZoom={true}
      >
        <>
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
  );
}

/**
 * Popup for general vehicle information when a vehicle is clicked
 */
function VehiclePopup(props: VehiclePopupProps) {
  const vehicle = props.vehicle;
  return (
    <Popup>
      <>
        <b>Vehicle information:</b>
        <hr />
        <b>Line Name:</b> {vehicle.lineName}
        <br />
        <b>Direction:</b> {vehicle.prettyDirection}
        <br />
        <b>Origin:</b> {vehicle.origin}
        <br />
        <b>Destination:</b> {vehicle.destination}
        <br />
        <b>Occupancy:</b> {vehicle.occupancy}
        <br />
        <br />
        <b>Next Stop:</b>
        <hr />
        {vehicle.nextStop.name ? (
          <>
            <b>Name:</b> {vehicle.nextStop.name}
            <br />
            <b>Expected Arival Time:</b>{" "}
            {vehicle.nextStop.expectedArivalTime
              ? vehicle.nextStop.expectedArivalTime.toLocaleTimeString()
              : "Unknown"}
          </>
        ) : (
          <>Not Available</>
        )}
      </>
    </Popup>
  );
}

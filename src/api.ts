import {
  Vehicle,
  VehicleJson,
  VehicleData,
  VehicleWrapper,
  VehicleCallJson,
} from "./types";
const key = "96ba60cb-017c-4110-8701-c284c612d5ca";

/**
 * Call an API based on the endpoint and the request init params
 */
async function call(
  resource: string,
  init?: RequestInit | undefined
): Promise<Response> {
  const response = await fetch(resource, init);
  return response;
}

/**
 * Get all vehicles for the AC agency and return them as an array of Vehicle
 */
async function getVehicles(): Promise<Array<Vehicle>> {
  const url = `http://api.511.org/transit/VehicleMonitoring?api_key=${key}&agency=AC&format=json`;
  const response = await call(url);
  const json = ((await response.json()) as VehicleData).Siri.ServiceDelivery
    .VehicleMonitoringDelivery.VehicleActivity;
  return json.map<Vehicle>((value: VehicleWrapper) => {
    return unmarshallVehicle(value.MonitoredVehicleJourney);
  });
}

/**
 * Get a prettier verison of the direction string
 */
function getDirection(direction: string) {
  switch (direction) {
    case "N":
      return "North";
    case "S":
      return "South";
    case "E":
      return "East";
    case "W":
      return "West";
    default:
      return "Direction Not Found";
  }
}

/**
 * Get a prettier verison of the occupancy string
 */
function getOccupancy(occupancy: string) {
  switch (occupancy) {
    case "seatsAvailable":
      return "Seats Available";
    case "full":
      return "Full";
    default:
      return "Unknown";
  }
}

/**
 * Get icon for marker based on the direction of the bus
 */
function getIcon(direction: string) {
  switch (direction) {
    case "N":
      return "busIcons/busNorth.png";
    case "S":
      return "busIcons/busSouth.png";
    case "E":
      return "busIcons/busEast.png";
    case "W":
      return "busIcons/busWest.png";
    default:
      return "busIcons/busEast.png";
  }
}

/**
 * return a javascript date as the expected arrival time for formatting
 */
function getExpectedArivalTime(json: VehicleCallJson) {
  if (json && json.ExpectedArrivalTime) {
    return new Date(json.ExpectedArrivalTime);
  }
  return undefined;
}

function unmarshallVehicle(json: VehicleJson): Vehicle {
  return {
    lineRef: json.LineRef,
    lineName: json.PublishedLineName,
    prettyDirection: getDirection(json.DirectionRef),
    direction: json.DirectionRef,
    origin: json.OriginName,
    destination: json.DestinationName,
    markerIcon: getIcon(json.DirectionRef),
    location: {
      long: parseFloat(json.VehicleLocation.Longitude),
      lat: parseFloat(json.VehicleLocation.Latitude),
    },
    occupancy: getOccupancy(json.Occupancy),
    nextStop: {
      name: json.MonitoredCall?.StopPointName || undefined,
      expectedArivalTime: getExpectedArivalTime(json.MonitoredCall),
    },
  };
}

export const api = { getVehicles: getVehicles };

export default api;

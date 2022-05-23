export interface VehicleData {
  Siri: {
    ServiceDelivery: {
      VehicleMonitoringDelivery: {
        VehicleActivity: VehicleWrapper[];
      };
    };
  };
}

export interface VehicleWrapper {
  MonitoredVehicleJourney: VehicleJson;
}

export interface Vehicle {
  lineRef: string;
  lineName: string;
  direction: string;
  prettyDirection: string;
  markerIcon: any;
  origin: string;
  destination: string;
  location: VehicleLocation;
  nextStop: VehicleCall;
  occupancy: string;
}

export interface VehicleCall {
  name: string | undefined;
  expectedArivalTime: Date | undefined;
}

export interface VehicleCallJson {
  StopPointName: string;
  ExpectedArrivalTime: string | null;
}

export interface VehicleLocation {
  lat: number;
  long: number;
}

export interface VehicleLocationJson {
  Longitude: string;
  Latitude: string;
}

export interface VehicleJson {
  LineRef: string;
  PublishedLineName: string;
  DirectionRef: string;
  OriginName: string;
  DestinationName: string;
  Occupancy: string;
  VehicleLocation: VehicleLocationJson;
  MonitoredCall: VehicleCallJson;
}

export interface Line {
  id: string;
  name: string;
}

export interface LineJson {
  Id: string;
  Name: string;
}

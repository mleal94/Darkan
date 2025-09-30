export interface OperatingRoomEquipment {
  name: string;
  type: string;
  isRequired: boolean;
}

export interface OperatingRoomCapacity {
  maxPatients: number;
  maxStaff: number;
}

export interface OperatingRoomLocation {
  floor: number;
  wing: string;
  roomNumber: string;
}

enum EEcgKey {
  signal = "SIGNAL",
}

export interface EcgResposne {
  DeviceId: string;
  Key: EEcgKey;
  Timestamp: number;
  Value: number;
}

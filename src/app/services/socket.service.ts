import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import { AppSettings } from "../constants/app-settings.constant";

@Injectable({
  providedIn: "root",
})
export class SocketService {
  socket: any;
  ecgData = [];

  constructor() {}

  connectSocket() {
    this.socket = new WebSocket(environment.SOCKET_ENDPOINT, AppSettings.token);
  }

  disconnectSocket() {
    this.socket.close();
  }

  ecgSubscription() {
    this.socket.onopen = () => {
      this.socket.send(
        JSON.stringify({
          Command: "Filter",
          Params: {
            Filter: "",
            DeviceIds: [AppSettings.deviceId],
          },
        })
      );
    };
    return new Observable((observer) => {
      this.socket.onmessage = (event: any) => {
        const ecgData = this.ecgData.concat(JSON.parse(event.data));

        let tempArray = [];
        ecgData.map((ecg, i) => {
          const data = {
            x: ecg["Timestamp"],
            y: this.calcRealMv(ecg["Value"]),
          };
          observer.next(data);
        });
      };
    });
  }

  private calcRealMv(point: number) {
    return (((point * 3.6) / 4096.0) * 1000) / 1100;
  }
}
